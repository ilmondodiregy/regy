# Architettura: LLM wiki usabile da smartphone a PC spento

## Il vincolo che decide tutto

"A PC spento" non e' un dettaglio del requisito: e' il requisito. Ed elimina
in blocco la famiglia di soluzioni piu' ovvia.

| soluzione | perche' non funziona |
|---|---|
| Tailscale / WireGuard verso casa | il PC deve essere acceso e raggiungibile |
| Syncthing fra PC e telefono | sincronizzazione peer-to-peer: se un peer e' spento, non sincronizza |
| Server locale con tunnel (ngrok, Cloudflare Tunnel) | il server e' sul PC |
| Obsidian Sync | funziona benissimo fra i tuoi dispositivi, ma **Claude non puo' leggerlo**: a PC spento ingest e lint diventano impossibili |
| Progetto Claude con i file caricati | e' una copia, non gli stessi dati: si sfasa dal primo ingest |

Tutte falliscono per la stessa ragione di fondo: **il dato sta sul PC**.

L'unica risposta strutturale e' invertire quel presupposto.

> Il disco del PC smette di essere il wiki.
> **Il wiki e' il repository git remoto.** Il PC diventa uno dei client.

Da questa singola inversione discende tutto il resto — incluso il fatto che il
sistema sopravvive non solo allo spegnimento del PC, ma alla sua rottura.

## La forma del sistema

```
                    ┌───────────────────────────┐
                    │   GitHub  (repo privato)  │
                    │                           │
                    │   CLAUDE.md   ← schema    │
                    │   raw/        ← immutabile│
                    │     inbox/    ← catture   │
                    │   wiki/       ← compilata │
                    │   .claude/commands/       │
                    │   bin/wiki-lint.py        │
                    │                           │
                    │        FONTE DI VERITA'   │
                    └───────────────────────────┘
                       ▲          ▲          ▲
            git push/pull    HTTPS+PAT      clone
                       │          │          │
      ┌────────────────┴──┐  ┌────┴─────┐  ┌─┴──────────────────┐
      │  PC               │  │ Obsidian │  │ Claude Code cloud  │
      │  Claude Code CLI  │  │ mobile   │  │ (app Claude o web) │
      │  Obsidian desktop │  │          │  │                    │
      │  wiki-sync.sh     │  │ legge    │  │ /query  /ingest    │
      │  (timer)          │  │ cattura  │  │ /lint   /cattura   │
      └───────────────────┘  └──────────┘  └────────────────────┘
       puo' essere spento     lettura e     gira su VM Anthropic:
                              scrittura     il PC non serve
```

Tre client, un solo substrato. Nessuno dei tre e' privilegiato: se ne perdi
uno, gli altri due continuano.

## Perche' Claude Code in cloud e non la chat

Distinzione importante, perche' e' il punto in cui quasi tutte le soluzioni
proposte in giro si rompono: **l'app Claude in modalita' chat non ha un
connettore GitHub** che le permetta di leggere un repository. Chiederle "cosa
dice il mio wiki su X" non funziona: non ha accesso ai file.

Quello che funziona e' **Claude Code**, disponibile dentro l'app Claude su iOS
e Android e su claude.ai/code. Gira in un container in cloud che:

- clona il repository da GitHub;
- legge il `CLAUDE.md` del repo — quindi conosce lo schema del wiki;
- carica i comandi da `.claude/commands/` — quindi `/ingest` e `/lint` si
  comportano **identici** a come si comportano sul PC;
- puo' committare e pushare.

E' il motivo per cui i comandi sono versionati nel repository invece che
configurati sul PC: cio' che sta nel repo esiste ovunque, cio' che sta nella
tua home esiste solo li'.

## I tre percorsi mobile

Separati di proposito, perche' hanno requisiti di scrittura diversi. Mescolarli
e' il modo in cui si perdono dati.

### Leggere — Obsidian mobile

Il vault Obsidian **e'** il repository. Grafo, ricerca, backlink, tutto
funziona perche' `[[wikilink]]` e' gia' la sintassi nativa di Obsidian.

Il plugin Git sincronizza in HTTPS con un token. E' la parte piu' fragile
dell'architettura, e i suoi limiti sono documentati in
[obsidian/SETUP.md](obsidian/SETUP.md).

### Catturare — Obsidian o `/cattura`

Due strade per la stessa cosa, entrambe **append-only**:

- in Obsidian, una nota nuova (la cartella di default e' gia' `raw/inbox/`);
- da Claude, anche a voce: `/cattura mi e' venuto in mente che...`.

Lo smartphone **non modifica mai** file di `wiki/`. Il vincolo e' strutturale,
non una convenzione da ricordare: due file con nomi diversi non possono
generare un conflitto git. Il percorso di scrittura da mobile e' conflict-free
per costruzione.

### Interrogare, ingerire, ripulire — Claude Code

`/query`, `/ingest`, `/lint` da una sessione cloud. Il PC resta spento. Piu' le
[routine automatiche](docs/AUTOMAZIONE.md) che fanno ingest notturno e lint
settimanale da sole.

## Le condizioni di correttezza

Non basta che l'architettura sia sensata: servono delle proprieta' che reggano
sotto uso reale. Ognuna corrisponde a un modo concreto di perdere dati o di
ritrovarsi il sistema fermo. Quelle marcate ✓ sono verificate automaticamente
da `bin/wiki-preflight.sh`.

### C1 — Il PC non deve mai trattenere stato non pushato ✓

**La condizione piu' importante e la piu' facile da violare.** Chiudi il
portatile con tre pagine non committate, e dal telefono leggi un wiki vecchio
senza nessun segnale che manchi qualcosa. Non e' un errore rumoroso: e' un
silenzio.

La disciplina personale non risolve questo problema. Un timer si':
`bin/wiki-sync.sh` gira ogni 5 minuti, committa e pusha. Il preflight verifica
che il timer esista e che non ci siano commit locali in sospeso.

Dettaglio non ovvio: il sync aspetta che i file siano fermi da almeno 45
secondi prima di committare. Committare mentre un editor sta ancora scrivendo
produce commit di file a meta'.

### C2 — La scrittura da mobile deve essere append-only ✓

File nuovi in `raw/inbox/`, mai modifiche a file esistenti. Nomi con
timestamp, quindi unici. Cosi' il telefono non puo' generare conflitti nemmeno
scrivendo nello stesso istante in cui scrive il PC.

*Verificato:* due scritture simultanee da client diversi finiscono entrambe sul
remoto, con storia lineare.

### C3 — I file contesi devono risolversi da soli ✓

Ci sono esattamente due file che ogni scrittore tocca:

- **`wiki/log.md`** — `merge=union` in `.gitattributes`: git tiene entrambi i
  lati invece di fermarsi. Corretto **solo perche' il file e' append-only**; su
  un file che si riscrive, union produrrebbe spazzatura. Gli eventuali
  duplicati li ripulisce `wiki-lint.py --fix`.
- **`wiki/index.md`** — non e' scritto a mano: e' **generato** da una funzione
  deterministica del contenuto delle pagine. Un conflitto si risolve buttando
  via entrambe le versioni e rigenerando. Non serve capire chi aveva ragione.

*Verificato:* PC e telefono aggiungono una voce di log ciascuno nello stesso
momento; entrambe sopravvivono, nessun conflitto.

⚠️ **Limite reale:** `isomorphic-git`, che e' quello che gira dentro Obsidian
sul telefono, **non implementa i merge driver**. La `merge=union` vale sul PC
e nelle sessioni cloud, non sul telefono. E' un'altra ragione per cui dal
telefono si scrive solo in `raw/inbox/`.

### C4 — Un conflitto vero non deve lasciare il repo rotto ✓

Se due lati modificano davvero la stessa pagina, il rebase fallisce. Il sync
**annulla** (`rebase --abort`), ripristina lo stato precedente, notifica e
esce con codice 3. Non lascia il repo a meta' rebase — che bloccherebbe tutti
i sync successivi mentre tutto sembra a posto.

*Verificato:* dopo un conflitto indotto, nessun rebase pendente, nessuna
perdita del lavoro locale.

### C5 — Il repo deve restare leggero per il telefono ✓

Il vincolo piu' stretto di tutti e quello che uccide questa architettura col
tempo. Su iOS e Android un plugin non puo' usare git nativo: Obsidian usa
`isomorphic-git`, JavaScript dentro il processo dell'app, con i limiti di heap
del caso.

Soglie applicate dal preflight: sotto 2000 file, sotto 100 MB di contenuto,
nessun file oltre 1 MB, storia sotto 500 MB (oltre, clone shallow).

Conseguenza pratica: **in `raw/` va solo testo.** I PDF e gli allegati pesanti
stanno fuori dal repo. Non e' una limitazione dolorosa: il pattern richiede
comunque che l'agente legga il testo, non il PDF.

### C6 — Gli slug devono essere unici e stabili ✓

Tre controlli che sembrano lo stesso ma non lo sono:

- **slug duplicato** in cartelle diverse → `[[nome]]` diventa ambiguo, sia per
  Claude sia per Obsidian (che usa `newLinkFormat: shortest`);
- **collisione case-insensitive** → due file che convivono su Linux si
  **sovrascrivono a vicenda** al clone su macOS o Windows: il PC perde dati in
  silenzio al primo pull;
- **nome non NFC** → macOS scrive gli accenti in forma decomposta, Linux in
  forma composta: lo stesso file diventa due file diversi e i link si rompono.

Tutti e tre bloccanti nel lint. Il terzo e' riparabile automaticamente.

### C7 — Il comportamento dell'agente dev'essere identico ovunque ✓

`CLAUDE.md` e `.claude/commands/` stanno **nel repository**, non nella home
del PC. Cosi' `/ingest` fa la stessa cosa lanciato dal terminale, dall'app
Claude sul telefono, o da una routine notturna.

Corollario che vincola il codice: gli script in `bin/` usano **solo la
standard library di Python**. Una dipendenza pip significherebbe che una delle
tre esecuzioni puo' divergere dalle altre — ed e' esattamente il fallimento
che questo sistema deve evitare.

### C8 — Il repository dev'essere privato e pulito ✓

Il tuo wiki personale ora vive su un server di qualcun altro. Il preflight
interroga l'API pubblica di GitHub: una risposta 200 significa che il repo e'
leggibile da chiunque, ed e' un errore bloccante. Piu' una scansione per
credenziali (token GitHub, chiavi API, chiavi private).

Nota sul token del telefono: dev'essere **fine-grained**, ristretto al solo
repo del wiki, con `Contents: Read and write` e nient'altro. Se perdi il
telefono, e' l'unica cosa da revocare.

### C9 — Le scritture automatiche devono essere serializzate ✓

`wiki-sync.sh` prende un lock su disco (con scadenza a 30 minuti, per non
restare bloccato dal residuo di un processo ucciso). Non interviene mai se
trova un rebase o un merge a meta': quel repo appartiene a un umano che sta
risolvendo qualcosa.

Sul push rifiutato — che succede ogni volta che il telefono o una sessione
cloud hanno pushato nel frattempo — riallinea e riprova, con backoff 2/4/8/16
secondi.

### C10 — Il degrado dev'essere visibile

L'unico modo silenzioso in cui questo sistema muore e' che le catture smettano
di essere assorbite. Tutto continua a funzionare, nessun errore, nessun
allarme — solo note che si accumulano in `raw/inbox/` senza mai diventare
conoscenza.

Per questo il conteggio delle catture in attesa e' esposto in tre punti: nel
lint (`I001`), nel riepilogo della CI, e come avviso nel preflight.

### C11 — Il costo dev'essere prevedibile

- GitHub privato: gratis.
- GitHub Actions su repo privato: gratis entro il monte minuti del piano; il
  lint dura secondi ed e' Python puro, senza chiavi API.
- Claude Code cloud e routine: consumano l'abbonamento che gia' hai, con un
  tetto giornaliero di run per le routine. Nessun costo di VM.
- Obsidian: gratis. (Working Copy su iOS, se serve, e' una tantum.)

Nessun server da amministrare, nessun abbonamento nuovo.

## Cosa cambia nel modello di fiducia

Va detto esplicitamente, perche' e' il vero prezzo di questa architettura.

**Prima:** i dati su un disco in casa tua.
**Dopo:** i dati su GitHub, elaborati da container Anthropic quando lanci un
ingest o una routine.

Non e' un difetto del progetto: e' il suo costo, ed e' in buona parte lo
stesso che paghi gia' usando un agente sul PC. Ma va deciso consapevolmente, e
un wiki che contiene materiale che non deve uscire di casa non e' un buon
candidato per questa architettura — indipendentemente da quanto sia comodo
leggerlo in metropolitana.

## Modi di fallire, e cosa succede

| se... | conseguenza | mitigazione |
|---|---|---|
| il PC si spegne con lavoro non pushato | il telefono vede dati vecchi | sync a timer (C1); preflight lo segnala |
| il telefono e' offline mentre catturi | la nota resta nel vault locale | Obsidian committa e pusha al primo sync utile |
| il telefono modifica una pagina cambiata anche sul PC | conflitto vero | disciplina append-only (C2); il sync annulla senza rompere (C4) |
| GitHub e' irraggiungibile | niente sync | tutto continua in locale; il sync riprova da solo |
| il plugin Git non regge sul vault | niente lettura da telefono | client git nativo (Working Copy / GitSync) |
| perdi il telefono | il token e' su un dispositivo altrui | token fine-grained su un solo repo, revocabile |
| una routine sbaglia un ingest | pagine imprecise | tutto e' in git: `git revert` |
| perdi il PC | nessuna conseguenza | il PC non e' piu' la fonte di verita' |

## Riferimenti

- Karpathy, gist `llm-wiki.md` — il pattern originale
- [Claude Code sul web](https://code.claude.com/docs/en/claude-code-on-the-web)
- [Routine](https://code.claude.com/docs/en/routines)
- [obsidian-git, implementazione mobile](https://github.com/Vinzent03/obsidian-git)
