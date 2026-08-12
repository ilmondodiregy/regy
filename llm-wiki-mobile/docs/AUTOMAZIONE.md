# Ingest e lint automatici a PC spento

Il ciclo funziona anche se non lo lanci tu. Una **Routine** e' una
configurazione salvata di Claude Code — un prompt, un repository, una
pianificazione — che gira su infrastruttura Anthropic: dalla documentazione,
_"continuano a funzionare a portatile chiuso"_. E' esattamente il vincolo di
questo progetto.

Il risultato pratico: prendi una nota dal telefono alle 23, vai a dormire, e
la mattina dopo la trovi assorbita nel wiki, con i link a posto e l'indice
aggiornato. Il PC non si e' mai acceso.

## Requisiti

- Piano Pro, Max, Team o Enterprise con Claude Code on the web attivo.
- GitHub collegato all'account (App GitHub oppure `/web-setup` da terminale).
- Il repo del wiki accessibile a quell'account.

## Le due routine da creare

Si creano da [claude.ai/code/routines](https://claude.ai/code/routines) oppure
con `/schedule` dal terminale.

### 1. Ingest della inbox — ogni sera

**Nome:** `wiki: ingest inbox`
**Pianificazione:** ogni giorno alle 03:00
**Repository:** il repo del wiki

**Prompt:**

```
Sei il manutentore di questo LLM wiki. Segui le regole in CLAUDE.md.

1. Esegui `python3 bin/wiki-lint.py --json` e trova le voci con codice I001:
   sono le catture in raw/inbox non ancora assorbite nel wiki.
2. Se non ce n'e' nessuna, fermati qui senza fare commit e dillo. Un run a
   vuoto non deve produrre rumore nella storia del repo.
3. Altrimenti ingerisci ogni cattura seguendo la procedura di `/ingest`:
   leggi la fonte per intero, orientati su wiki/index.md, aggiorna le pagine
   esistenti prima di crearne di nuove, aggiungi i link entranti, crea la
   pagina in wiki/sources/ con derived_from, registra in wiki/log.md.
4. Esegui `python3 bin/wiki-lint.py --fix` e risolvi a mano gli errori
   rimasti.
5. Committa sul branch di default con messaggio "ingest: <fonti>" e pusha.

Se una cattura e' troppo ambigua per essere assorbita senza una decisione
umana, lasciala in inbox, scrivilo nel log e spiegalo alla fine del run.
Non inventare contesto pur di chiudere il lavoro.
```

Perche' di notte: la inbox della giornata e' completa, e la mattina trovi il
wiki gia' allineato. Perche' presto: se sbaglia qualcosa, hai tutto il giorno
per accorgertene.

### 2. Lint semantico — una volta a settimana

**Nome:** `wiki: lint settimanale`
**Pianificazione:** domenica alle 04:00

**Prompt:**

```
Sei il manutentore di questo LLM wiki. Segui le regole in CLAUDE.md ed esegui
il controllo di salute descritto in .claude/commands/lint.md.

Parti da `python3 bin/wiki-lint.py --fix` per la parte strutturale, poi fai il
lavoro che richiede giudizio: contraddizioni fra pagine, duplicazioni
semantiche, affermazioni superate da fonti piu' recenti, concetti citati
ovunque ma senza pagina propria, pagine orfane da collegare.

Applica le correzioni sicure. Le fusioni di pagine e le riscritture che
perdono informazione NON le applicare: elencale in fondo a wiki/log.md sotto
una voce "## [data] lint | proposte in attesa" e lasciale decidere all'umano.

Committa e pusha. Chiudi con un riassunto di tre righe: cosa hai corretto,
cosa hai lasciato in sospeso e perche'.
```

Settimanale e non giornaliero: il lint semantico ha senso su un corpo di
conoscenza che nel frattempo si e' mosso. Farlo tutti i giorni consuma budget
per trovare quasi sempre niente.

## La condizione da verificare sul push

Una routine pusha senza chiedere su branch che iniziano per `claude/`. Per
scrivere direttamente sul branch di default — che e' quello che vuoi, un wiki
personale non ha bisogno di una PR per ogni nota — Claude Code controlla prima
tre cose e rifiuta il push se:

- il branch e' protetto su GitHub;
- esiste una pull request aperta da quel branch;
- il branch contiene commit di **qualcun altro**.

Per un wiki personale nessuna delle tre si verifica: i commit del PC, del
telefono e delle routine portano tutti la tua identita' GitHub. Ma se un
giorno metti una branch protection su `main`, le routine smettono di scrivere
e aprono branch `claude/...` che dovrai unire a mano. E' il tipo di cosa che
si scopre tre settimane dopo chiedendosi perche' il wiki non si aggiorna piu'.

## Cosa NON automatizzare

**La cattura.** Deve restare un gesto tuo: e' l'unico momento in cui decidi
che qualcosa merita di entrare. Un sistema che ingerisce da solo feed e
newsletter riempie il wiki di roba che non hai mai letto, e la qualita' di un
wiki dipende molto piu' da cosa lasci fuori che da quanto ci metti dentro.

**Le fusioni di pagine.** Un agente che fonde pagine senza chiedere, per
settimane, senza che nessuno controlli, produce una lenta erosione: ogni
fusione perde una sfumatura, e nessuna singola perdita e' abbastanza grande da
farsi notare.

## Verificare che stia funzionando

Il segnale piu' onesto e' il contatore delle catture in attesa. La CI di lint
lo scrive nel riepilogo di ogni run, e il preflight lo mostra fra gli avvisi:

```bash
python3 bin/wiki-lint.py | grep I001 | wc -l
```

Se cresce per giorni, il ciclo si e' interrotto da qualche parte — e nota che
tutto il resto continuerebbe a sembrare a posto: nessun errore, nessun
allarme, solo note che si accumulano senza mai diventare conoscenza.

Nota dalla documentazione: nella lista dei run, il verde significa che la
sessione e' partita e uscita senza errori di infrastruttura, **non** che il
compito sia riuscito. Per sapere cosa e' successo davvero bisogna aprire il
run — oppure, piu' semplicemente, guardare i commit sul repo.
