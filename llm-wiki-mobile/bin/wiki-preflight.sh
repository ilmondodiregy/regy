#!/usr/bin/env bash
# Verifica le condizioni perche' il wiki funzioni da smartphone a PC spento.
#
# Ogni controllo qui dentro corrisponde a un modo concreto in cui questo
# sistema si rompe. Nessuno e' teorico: sono i punti in cui o si perdono dati,
# o il telefono smette di sincronizzare, o si scopre di aver pubblicato roba
# privata.
#
#   ./bin/wiki-preflight.sh            controlla e basta
#   ./bin/wiki-preflight.sh --quiet    solo i problemi
#
# Uscita: 0 tutto a posto, 1 ci sono errori bloccanti.

set -uo pipefail

WIKI_DIR="${WIKI_DIR:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
QUIET=0
[ "${1:-}" = "--quiet" ] && QUIET=1

PASS=0; WARN=0; FAIL=0

ok()   { PASS=$((PASS+1)); [ "$QUIET" = 1 ] || printf '  \033[32m✓\033[0m %s\n' "$1"; }
warn() { WARN=$((WARN+1)); printf '  \033[33m!\033[0m %s\n' "$1"; [ -n "${2:-}" ] && printf '      → %s\n' "$2"; }
bad()  { FAIL=$((FAIL+1)); printf '  \033[31m✗\033[0m %s\n' "$1"; [ -n "${2:-}" ] && printf '      → %s\n' "$2"; }
head_() { [ "$QUIET" = 1 ] || printf '\n\033[1m%s\033[0m\n' "$1"; }

cd "$WIKI_DIR" 2>/dev/null || { echo "WIKI_DIR non valido: $WIKI_DIR"; exit 2; }

echo "Preflight wiki — $WIKI_DIR"

# ---------------------------------------------------------------------------
head_ "1. Fondamenta: il repo e' la fonte di verita'"
# ---------------------------------------------------------------------------

if [ -d .git ]; then
  ok "e' un repository git"
else
  bad "non e' un repository git" "l'intera architettura poggia su git: git init"
  echo; echo "Interrompo: senza repo non ha senso proseguire."; exit 1
fi

REMOTE_URL="$(git remote get-url origin 2>/dev/null || true)"
if [ -n "$REMOTE_URL" ]; then
  ok "remote origin configurato"
else
  bad "nessun remote 'origin'" "senza remoto il telefono non ha da dove leggere"
fi

BRANCH="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo '')"
if git rev-parse --abbrev-ref '@{u}' >/dev/null 2>&1; then
  ok "il branch '$BRANCH' traccia un branch remoto"
else
  bad "il branch '$BRANCH' non traccia nulla" "git push -u origin $BRANCH"
fi

if [ -n "$(git config user.email 2>/dev/null)" ]; then
  ok "identita' git configurata"
else
  warn "user.email non configurato" "i commit automatici del sync falliranno: git config user.email ..."
fi

# ---------------------------------------------------------------------------
head_ "2. Riservatezza: il wiki personale ora vive su un server altrui"
# ---------------------------------------------------------------------------

# Il suffisso .git va tolto in un passaggio separato: la ERE di sed non ha
# quantificatori pigri, quindi provare a farlo in un'unica sostituzione lascia
# ".git" attaccato al nome. L'URL sbagliato riceverebbe un 404 e il controllo
# dichiarerebbe "privato" un repository pubblico — cioe' il falso negativo
# peggiore possibile proprio sul controllo di riservatezza.
SLUG="$(printf '%s' "$REMOTE_URL" | sed -E 's#^.*github\.com[:/]##; s#\.git$##; s#/$##')"
if printf '%s' "$REMOTE_URL" | grep -q 'github\.com' && [ -n "$SLUG" ]; then
  # Controllo senza autenticazione: l'API risponde 200 solo per i repo
  # pubblici. Un 404 significa privato (o inesistente), che e' cio' che
  # vogliamo. E' l'unico modo di verificarlo senza chiedere un token.
  CODE="$(curl -s -o /dev/null -w '%{http_code}' --max-time 8 \
          "https://api.github.com/repos/$SLUG" 2>/dev/null || echo 000)"
  case "$CODE" in
    200) bad "il repository $SLUG e' PUBBLICO" "il tuo wiki personale e' leggibile da chiunque: rendilo privato subito" ;;
    404) ok "il repository non e' pubblicamente leggibile" ;;
    000) warn "visibilita' non verificata: nessuna risposta da GitHub" "ricontrolla quando sei online" ;;
    401|403) warn "visibilita' non verificata (HTTP $CODE)" \
             "limite di richieste anonime a GitHub, o un proxy in mezzo: riprova fra un'ora" ;;
    *)   warn "verifica visibilita' inconclusiva (HTTP $CODE)" "controlla a mano su GitHub" ;;
  esac
else
  warn "remote non su GitHub: salto il controllo di visibilita'" "verifica a mano che il repo non sia pubblico"
fi

# Scansione segreti. Volutamente stretta: un preflight che urla a ogni giro
# viene ignorato, e allora tanto vale non averlo.
SECRETS="$(git ls-files -z 2>/dev/null | xargs -0 -r grep -lE \
  '(ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{50,}|sk-ant-[A-Za-z0-9-]{20,}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA |OPENSSH |EC )?PRIVATE KEY-----)' \
  2>/dev/null | head -5)"
if [ -z "$SECRETS" ]; then
  ok "nessuna credenziale evidente nei file versionati"
else
  bad "possibili credenziali nel repo:" "$(echo "$SECRETS" | tr '\n' ' ')"
  echo "      → rimuovile e ruotale: sono gia' nella storia di git"
fi

# ---------------------------------------------------------------------------
head_ "3. Il PC non deve trattenere stato non pushato"
# ---------------------------------------------------------------------------
# E' la condizione che rompe piu' spesso il caso d'uso "PC spento": si chiude
# il portatile con del lavoro non pushato e dal telefono si legge un wiki
# vecchio, senza nessun segnale che manchi qualcosa.

DIRTY="$(git status --porcelain 2>/dev/null | wc -l | tr -d ' ')"
if [ "$DIRTY" = "0" ]; then
  ok "nessuna modifica non committata"
else
  warn "$DIRTY file modificati e non committati" "se spegni il PC ora, dal telefono non li vedrai"
fi

if git rev-parse --abbrev-ref '@{u}' >/dev/null 2>&1; then
  AHEAD="$(git rev-list --count '@{u}..HEAD' 2>/dev/null || echo 0)"
  if [ "$AHEAD" = "0" ]; then
    ok "nessun commit locale non pushato"
  else
    bad "$AHEAD commit non pushati" "invisibili dal telefono finche' non fai git push"
  fi
fi

SYNC_ACTIVE=0
if command -v systemctl >/dev/null 2>&1 && systemctl --user is-active --quiet wiki-sync.timer 2>/dev/null; then
  ok "timer di sync attivo (systemd)"; SYNC_ACTIVE=1
elif command -v launchctl >/dev/null 2>&1 && launchctl list 2>/dev/null | grep -q 'com\.wiki\.sync'; then
  ok "sync attivo (launchd)"; SYNC_ACTIVE=1
elif command -v schtasks >/dev/null 2>&1 && schtasks /query /tn WikiSync >/dev/null 2>&1; then
  ok "sync attivo (Task Scheduler)"; SYNC_ACTIVE=1
fi
[ "$SYNC_ACTIVE" = 0 ] && warn "nessun sync automatico rilevato" \
  "senza timer, la condizione 'niente stato non pushato' dipende dalla tua memoria: vedi install/"

if [ -x bin/wiki-sync.sh ]; then
  ok "wiki-sync.sh presente ed eseguibile"
else
  warn "bin/wiki-sync.sh mancante o non eseguibile" "chmod +x bin/wiki-sync.sh"
fi

# ---------------------------------------------------------------------------
head_ "4. Scritture concorrenti: i file contesi devono auto-risolversi"
# ---------------------------------------------------------------------------

if [ -f .gitattributes ] && grep -q 'log\.md.*merge=union' .gitattributes; then
  ok "log.md configurato in merge=union"
else
  bad "manca 'wiki/log.md merge=union' in .gitattributes" \
      "il log e' l'unico file che tutti gli scrittori toccano: senza union, conflitti garantiti"
fi

if [ -f wiki/index.md ] && grep -q 'GENERATO' wiki/index.md; then
  ok "index.md e' marcato come generato (quindi rigenerabile in caso di conflitto)"
else
  warn "index.md non sembra generato da wiki-lint.py" "python3 bin/wiki-lint.py --fix"
fi

# ---------------------------------------------------------------------------
head_ "5. Obsidian mobile: il vincolo piu' stretto di tutti"
# ---------------------------------------------------------------------------
# Sul telefono Obsidian non usa git nativo ma isomorphic-git, in JavaScript,
# dentro il processo dell'app. Tiene molto piu' in memoria e va molto piu'
# piano. Un repo che cresce senza controllo semplicemente smette di
# sincronizzarsi dal telefono, ed e' il modo piu' probabile in cui questa
# architettura muore col tempo.

TRACKED="$(git ls-files 2>/dev/null | wc -l | tr -d ' ')"
SIZE_KB="$(du -sk --exclude=.git . 2>/dev/null | cut -f1 || echo 0)"
GIT_KB="$(du -sk .git 2>/dev/null | cut -f1 || echo 0)"

if [ "$TRACKED" -lt 2000 ]; then
  ok "$TRACKED file versionati (entro il ragionevole per il sync mobile)"
elif [ "$TRACKED" -lt 5000 ]; then
  warn "$TRACKED file versionati" "sopra i ~2000 il sync da telefono diventa lento"
else
  bad "$TRACKED file versionati" "a questi numeri isomorphic-git sul telefono fallisce: separa raw/ in un secondo repo"
fi

if [ "$SIZE_KB" -lt 102400 ]; then
  ok "contenuto di lavoro: $((SIZE_KB / 1024)) MB"
else
  warn "contenuto di lavoro: $((SIZE_KB / 1024)) MB" "oltre ~100 MB il clone da telefono e' a rischio"
fi

if [ "$GIT_KB" -gt 512000 ]; then
  warn "la storia git pesa $((GIT_KB / 1024)) MB" "sul telefono usa un clone shallow (depth 1)"
else
  ok "storia git: $((GIT_KB / 1024)) MB"
fi

BIG="$(git ls-files -z 2>/dev/null | xargs -0 -r du -k 2>/dev/null | awk '$1 > 1024 {print $2}' | head -5)"
if [ -z "$BIG" ]; then
  ok "nessun file oltre 1 MB"
else
  warn "file grandi nel repo:" "$(echo "$BIG" | tr '\n' ' ')"
  echo "      → i binari appesantiscono ogni clone: tieni in raw/ solo testo"
fi

# Le config di Obsidian cambiano a ogni apertura dell'app, su ogni
# dispositivo. Versionarle significa un conflitto ogni volta che apri il vault
# sul telefono e poi sul PC — cioe' tutti i giorni.
if [ -f .gitignore ] && grep -q 'workspace' .gitignore; then
  ok "i file di sessione di Obsidian sono ignorati"
else
  bad "manca l'esclusione di .obsidian/workspace*.json in .gitignore" \
      "senza, avrai un conflitto ogni volta che apri il vault su due dispositivi"
fi

case "$WIKI_DIR" in
  *iCloud*|*"Mobile Documents"*|*Dropbox*|*OneDrive*|*"Google Drive"*)
    bad "il vault e' dentro una cartella di sync cloud" \
        "due motori di sync sullo stesso vault si sovrascrivono a vicenda: spostalo su disco locale" ;;
  *) ok "il vault non e' dentro iCloud/Dropbox/OneDrive" ;;
esac

# ---------------------------------------------------------------------------
head_ "6. Portabilita' fra i tre sistemi che toccano questo repo"
# ---------------------------------------------------------------------------

TESTF=".wiki-case-test"; rm -f "$TESTF" "${TESTF^^}" 2>/dev/null
touch "$TESTF" 2>/dev/null
if [ -e "$(printf '%s' "$TESTF" | tr 'a-z' 'A-Z')" ]; then
  warn "filesystem non case-sensitive (macOS/Windows)" \
       "due pagine che differiscono solo per maiuscole si sovrascrivono: il lint le blocca (E006)"
else
  ok "filesystem case-sensitive"
fi
rm -f "$TESTF" 2>/dev/null

AUTOCRLF="$(git config core.autocrlf 2>/dev/null || echo unset)"
if [ "$AUTOCRLF" = "true" ]; then
  warn "core.autocrlf=true" "riscrive i fine riga e sporca i diff fra PC e telefono: git config core.autocrlf input"
else
  ok "core.autocrlf non forza CRLF ($AUTOCRLF)"
fi

if command -v python3 >/dev/null 2>&1; then
  ok "python3 disponibile ($(python3 --version 2>&1 | cut -d' ' -f2))"
else
  bad "python3 assente" "serve al lint, che gira anche dentro le sessioni Claude"
fi

# ---------------------------------------------------------------------------
head_ "7. Struttura e comportamento identico su PC, telefono e cloud"
# ---------------------------------------------------------------------------

for f in CLAUDE.md bin/wiki-lint.py raw wiki; do
  [ -e "$f" ] && ok "$f presente" || bad "$f mancante" "il pattern richiede questa struttura"
done

for c in ingest lint query cattura; do
  if [ -f ".claude/commands/$c.md" ]; then
    ok "/$c disponibile"
  else
    warn "/$c non versionato in .claude/commands/" \
         "se non e' nel repo, dal telefono in sessione cloud non esiste"
  fi
done

if [ -f .github/workflows/wiki-lint.yml ]; then
  ok "CI di lint attiva sul repo"
else
  warn "nessuna CI di lint" "e' l'unico controllo che vede anche cio' che scrivi dal telefono"
fi

if command -v python3 >/dev/null 2>&1 && [ -f bin/wiki-lint.py ]; then
  if python3 bin/wiki-lint.py >/dev/null 2>&1; then
    ok "il wiki passa il lint strutturale"
  else
    ERRS="$(python3 bin/wiki-lint.py 2>/dev/null | grep -c '^✗' || echo '?')"
    bad "il lint strutturale fallisce ($ERRS errori)" "python3 bin/wiki-lint.py"
  fi
fi

# ---------------------------------------------------------------------------
printf '\n\033[1mEsito\033[0m: %d ok, %d avvisi, %d bloccanti\n' "$PASS" "$WARN" "$FAIL"

if [ "$FAIL" -gt 0 ]; then
  echo "Ci sono condizioni non soddisfatte: da smartphone il sistema non e' affidabile."
  exit 1
fi
if [ "$WARN" -gt 0 ]; then
  echo "Nessun blocco. Gli avvisi sono cose che ti si ritorceranno contro fra qualche mese."
fi
echo "Condizioni soddisfatte: il wiki e' utilizzabile da smartphone a PC spento."
