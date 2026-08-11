#!/usr/bin/env bash
# Sincronizza il wiki del PC con il repo remoto.
#
# Esiste per una ragione sola: sul PC non deve mai restare stato non pushato.
# E' la condizione piu' importante di tutta l'architettura e la piu' facile da
# violare — si chiude il portatile con tre pagine non committate e dal telefono
# si legge un wiki vecchio senza nessun segnale che manchi qualcosa. La
# disciplina personale non risolve questo problema; un timer si'.
#
# Pensato per girare ogni pochi minuti da systemd/launchd/Task Scheduler.
# Idempotente e silenzioso quando non c'e' niente da fare.
#
#   wiki-sync.sh [--once] [--verbose]
#
# Variabili:
#   WIKI_DIR         percorso del repo wiki (default: cartella dello script/..)
#   WIKI_QUIET_SECS  secondi di quiete richiesti prima di committare (default 45)
#   WIKI_SYNC_LINT   1 = rigenera l'indice prima di committare (default 1)
#   WIKI_BRANCH      branch da sincronizzare (default: quello corrente)

set -euo pipefail

WIKI_DIR="${WIKI_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
WIKI_QUIET_SECS="${WIKI_QUIET_SECS:-45}"
WIKI_SYNC_LINT="${WIKI_SYNC_LINT:-1}"
VERBOSE=0
PUSH_RETRIES=4

for arg in "$@"; do
  case "$arg" in
    --verbose|-v) VERBOSE=1 ;;
    --once) : ;;
    *) echo "argomento sconosciuto: $arg" >&2; exit 2 ;;
  esac
done

log() {
  local level="$1"; shift
  local line
  line="$(date '+%Y-%m-%d %H:%M:%S') [$level] $*"
  if [ "$level" != "debug" ] || [ "$VERBOSE" = 1 ]; then
    echo "$line"
  fi
  mkdir -p "$WIKI_DIR/.git" 2>/dev/null || true
  echo "$line" >> "$WIKI_DIR/.git/wiki-sync.log" 2>/dev/null || true
}

notify() {
  # Un errore di sync che nessuno vede e' un errore che resta li' per giorni,
  # e nel frattempo il telefono continua a mostrare un wiki fermo.
  local msg="$1"
  if command -v notify-send >/dev/null 2>&1; then
    notify-send -u critical "Wiki sync" "$msg" || true
  elif command -v osascript >/dev/null 2>&1; then
    osascript -e "display notification \"${msg//\"/}\" with title \"Wiki sync\"" || true
  fi
}

cd "$WIKI_DIR" || { echo "WIKI_DIR non valido: $WIKI_DIR" >&2; exit 2; }

if [ ! -d .git ]; then
  log error "$WIKI_DIR non e' un repo git"
  exit 2
fi

# --- lock: due sync simultanei si rovinano il rebase a vicenda -------------
LOCK_DIR="$WIKI_DIR/.git/wiki-sync.lock"
if ! mkdir "$LOCK_DIR" 2>/dev/null; then
  # Un lock piu' vecchio di 30 minuti e' quasi certamente il residuo di un
  # processo ucciso, non un sync ancora in corso.
  if [ -n "$(find "$LOCK_DIR" -maxdepth 0 -mmin +30 2>/dev/null)" ]; then
    log warn "lock scaduto, lo rimuovo"
    rmdir "$LOCK_DIR" 2>/dev/null || true
    mkdir "$LOCK_DIR" 2>/dev/null || { log warn "lock non acquisibile"; exit 0; }
  else
    log debug "un altro sync e' in corso"
    exit 0
  fi
fi
trap 'rmdir "$LOCK_DIR" 2>/dev/null || true' EXIT

BRANCH="${WIKI_BRANCH:-$(git rev-parse --abbrev-ref HEAD)}"

# --- non toccare un repo in stato intermedio -------------------------------
# Se c'e' un rebase o un merge a meta', il repo appartiene a un umano che sta
# risolvendo qualcosa: intervenire ora peggiora la situazione.
if [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ] || [ -f .git/MERGE_HEAD ]; then
  log warn "repo in stato intermedio (rebase/merge in corso): non intervengo"
  exit 0
fi

# --- attesa di quiete ------------------------------------------------------
# Committare mentre un editor sta ancora scrivendo produce commit di file a
# meta'. Se qualcosa e' cambiato negli ultimi secondi, si riprova al giro dopo.
if [ -n "$(git status --porcelain)" ]; then
  NEWEST=$(find . -path ./.git -prune -o -type f -newermt "-${WIKI_QUIET_SECS} seconds" -print 2>/dev/null | head -1)
  if [ -n "$NEWEST" ]; then
    log debug "modifiche troppo recenti ($NEWEST), rimando"
    exit 0
  fi
fi

# --- allineamento con il remoto -------------------------------------------
if ! git fetch --quiet origin "$BRANCH" 2>/dev/null; then
  log warn "fetch fallito (rete assente?), riprovo al prossimo giro"
  exit 0
fi

if ! git pull --rebase --autostash --quiet origin "$BRANCH"; then
  # Un conflitto qui va deciso da un umano. Lasciare il repo a meta' rebase
  # bloccherebbe tutti i sync successivi, quindi si torna indietro e si avvisa.
  log error "conflitto durante il rebase: annullo e avviso"
  git rebase --abort 2>/dev/null || true
  git stash pop 2>/dev/null || true
  notify "Conflitto nel wiki: risolvilo a mano in $WIKI_DIR"
  exit 3
fi

# --- indice rigenerato prima del commit ------------------------------------
# Cosi' l'indice pushato corrisponde sempre alle pagine pushate, e chi legge
# da telefono non vede un sommario che promette pagine inesistenti.
if [ "$WIKI_SYNC_LINT" = "1" ] && [ -f bin/wiki-lint.py ] && command -v python3 >/dev/null 2>&1; then
  python3 bin/wiki-lint.py --fix >/dev/null 2>&1 || log debug "lint --fix ha segnalato errori residui"
fi

# --- commit ----------------------------------------------------------------
if [ -n "$(git status --porcelain)" ]; then
  CHANGED=$(git status --porcelain | wc -l | tr -d ' ')
  SUMMARY=$(git status --porcelain | awk '{print $NF}' | head -3 | tr '\n' ' ')
  git add -A
  git commit --quiet -m "sync: ${CHANGED} file da $(hostname -s 2>/dev/null || hostname)" \
                     -m "$SUMMARY" || true
  log info "committati $CHANGED file"
fi

# --- push con backoff ------------------------------------------------------
if [ -z "$(git log --oneline "origin/$BRANCH..$BRANCH" 2>/dev/null)" ]; then
  log debug "niente da pushare"
  exit 0
fi

DELAY=2
for attempt in $(seq 1 "$PUSH_RETRIES"); do
  if git push --quiet -u origin "$BRANCH" 2>/dev/null; then
    log info "push riuscito"
    exit 0
  fi
  # Push rifiutato: quasi sempre significa che il telefono o una sessione
  # cloud hanno pushato nel frattempo. Ci si riallinea e si riprova.
  log debug "push fallito (tentativo $attempt/$PUSH_RETRIES), riallineo"
  git pull --rebase --autostash --quiet origin "$BRANCH" 2>/dev/null || {
    git rebase --abort 2>/dev/null || true
    log error "riallineamento fallito dopo push rifiutato"
    notify "Wiki: push bloccato, serve intervento manuale"
    exit 3
  }
  sleep "$DELAY"
  DELAY=$((DELAY * 2))
done

log error "push fallito dopo $PUSH_RETRIES tentativi"
notify "Wiki: $(git log --oneline "origin/$BRANCH..$BRANCH" | wc -l) commit non pushati"
exit 4
