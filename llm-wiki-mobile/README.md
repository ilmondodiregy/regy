# LLM wiki dallo smartphone, con il PC spento

Un LLM wiki in stile Karpathy vive su un disco. Il valore si accumula per
mesi, e resta raggiungibile solo davanti a quella macchina accesa.

Questo pacchetto lo rende utilizzabile dal telefono — **gli stessi dati, non
una copia** — usando i due client che gia' usi: **Claude** per interrogare,
ingerire e ripulire, **Obsidian** per leggere e catturare.

L'idea sta in una riga:

> Il disco del PC smette di essere il wiki. Il wiki e' il repository git.
> Il PC diventa uno dei client, e puo' essere spento.

Il ragionamento completo, con i modi di fallire, e' in
[ARCHITETTURA.md](ARCHITETTURA.md).

## Come si usa, una volta acceso

**Dal telefono, in mobilita':**

```
/cattura mi e' venuto in mente che il lint strutturale e quello
         semantico hanno costi diversissimi e vanno separati
```

Finisce in `raw/inbox/`, pushata. Funziona anche a voce.

**Dal telefono, quando serve sapere qualcosa:**

```
/query cosa ho gia' scritto sulla differenza fra ingest e archiviazione?
```

Claude apre il repo, legge le pagine, risponde citando `[[slug]]`, e
distingue cio' che dice il tuo wiki da cio' che aggiunge lui.

**Dal telefono, la sera:**

```
/ingest
```

Svuota la inbox: assorbe le catture nelle pagine esistenti, aggiunge i link
entranti, aggiorna l'indice, committa e pusha. Oppure lo fa da solo una
[routine notturna](docs/AUTOMAZIONE.md) e tu la mattina trovi il lavoro fatto.

**Per leggere:** Obsidian mobile, sul vault che e' il repository. Grafo,
backlink e ricerca funzionano perche' `[[wikilink]]` e' la sintassi nativa di
Obsidian.

**Sul PC:** esattamente come prima. Claude Code, Obsidian desktop, gli stessi
comandi. In piu' un timer che sincronizza da solo, cosi' non ti capita di
spegnere il PC lasciando fuori qualcosa.

## Installazione

### 1. Il repository

Crea un repository GitHub **privato** per il wiki. Se ne hai gia' uno, usa
quello. Poi porta dentro lo scheletro:

```bash
git clone https://github.com/TUO-UTENTE/wiki.git && cd wiki

# scheletro del wiki (CLAUDE.md, raw/, wiki/, .gitattributes, .gitignore,
# impostazioni Obsidian). Se hai gia' un wiki, copia solo cio' che ti manca.
cp -r /percorso/llm-wiki-mobile/template-wiki/. .

# gli script e i comandi condivisi
mkdir -p bin .claude/commands .github/workflows
cp /percorso/llm-wiki-mobile/bin/*            bin/
cp /percorso/llm-wiki-mobile/claude/commands/* .claude/commands/
cp /percorso/llm-wiki-mobile/workflows/*      .github/workflows/
chmod +x bin/*.sh bin/*.py

python3 bin/wiki-lint.py --fix
git add -A && git commit -m "wiki: struttura per accesso mobile" && git push
```

Perche' dentro il repo e non nella tua home: cio' che sta nel repository
esiste su tutti i client, cio' che sta nella tua home esiste solo sul PC. E'
la ragione per cui `/ingest` si comporta identico dal telefono.

### 2. Il sync sul PC

Serve a garantire che sul PC non resti mai nulla di non pushato — la
condizione da cui dipende tutto il resto.

**Linux:**
```bash
mkdir -p ~/.config/systemd/user
cp install/linux/wiki-sync.* ~/.config/systemd/user/
# correggi WIKI_DIR dentro wiki-sync.service
systemctl --user daemon-reload
systemctl --user enable --now wiki-sync.timer
```

**macOS:** modifica `install/macos/com.wiki.sync.plist` (utente e percorso),
copialo in `~/Library/LaunchAgents/`, poi `launchctl load`.

**Windows:**
```powershell
powershell -ExecutionPolicy Bypass -File install\windows\install-wiki-sync.ps1 -WikiDir C:\Users\tu\wiki
```

Prova subito: modifica una pagina, aspetta un minuto, e controlla che il
commit compaia su GitHub.

### 3. Claude sul telefono

Serve un piano Pro, Max o Team con Claude Code sul web attivo, e GitHub
collegato all'account.

Apri l'app Claude → Claude Code → nuova sessione sul repo del wiki. I comandi
`/ingest`, `/lint`, `/query`, `/cattura` ci sono gia': li ha letti dal repo.

Facoltativo ma consigliato: le due [routine automatiche](docs/AUTOMAZIONE.md)
per l'ingest notturno e il lint settimanale.

### 4. Obsidian

Sul PC: apri la cartella del repo come vault. Le impostazioni sono gia' nel
repo.

Sul telefono: plugin Git, token GitHub fine-grained, clone shallow. I dettagli
e i limiti reali — perche' su mobile e' la parte fragile — sono in
[obsidian/SETUP.md](obsidian/SETUP.md).

### 5. Verifica

```bash
./bin/wiki-preflight.sh
```

Controlla una per una le condizioni perche' il sistema regga: repo privato,
niente segreti, niente commit in sospeso, sync attivo, `merge=union` sul log,
peso del repo entro i limiti del telefono, file di sessione di Obsidian
esclusi, vault fuori da iCloud, lint pulito.

Esce con codice 1 se qualcosa e' davvero rotto. Vale la pena rilanciarlo ogni
tanto, non solo il primo giorno: le condizioni si degradano da sole man mano
che il wiki cresce.

## Cosa c'e' dentro

```
bin/
  wiki-lint.py        lint strutturale deterministico (link, frontmatter,
                      slug, collisioni, indice) — usato da te, dalla CI e
                      dai comandi Claude
  wiki_common.py      parsing condiviso, zero dipendenze
  wiki-sync.sh        sync del PC: pull --rebase, commit, push con backoff
  wiki-preflight.sh   verifica di tutte le condizioni operative

claude/commands/      /ingest /lint /query /cattura — da copiare in
                      .claude/commands/ del repo wiki

template-wiki/        scheletro: CLAUDE.md, raw/, wiki/ con pagine di
                      esempio, .gitattributes, .gitignore, .obsidian/

workflows/            CI di lint su ogni push (Python puro, nessuna chiave)
install/              unit systemd, LaunchAgent, script Task Scheduler
obsidian/SETUP.md     configurazione del vault e limiti reali su mobile
docs/AUTOMAZIONE.md   routine per ingest notturno e lint settimanale
ARCHITETTURA.md       il progetto, le condizioni verificate, i modi di fallire
```

## Le tre regole da ricordare

1. **Dal telefono si aggiungono file, non se ne modificano.** Le catture
   nascono in `raw/inbox/` con un nome che contiene il timestamp: due nomi
   diversi non possono entrare in conflitto. Per riorganizzare, usa Claude.

2. **`raw/` non si tocca mai, e contiene solo testo.** E' la ground truth: se
   cambia sotto, il wiki non e' piu' ricostruibile. E i binari sfondano i
   limiti di memoria del git JavaScript che gira dentro Obsidian sul telefono.

3. **Cio' che non e' pushato non esiste.** Vale per il PC (per questo c'e' il
   timer) e ancora di piu' per le sessioni cloud, il cui container viene
   distrutto alla fine.
