# Schema del wiki

Questo repository e' un LLM wiki secondo il pattern di Karpathy. Tu, agente,
sei il manutentore. L'umano cura le fonti e fa domande; tu tieni coerente la
struttura.

Questo file e' l'unica fonte delle regole. Vale identico ovunque tu stia
girando: sul PC via Claude Code, in una sessione Claude Code sul web da
smartphone, o dentro GitHub Actions. Non esistono comportamenti "solo locali".

## Struttura

```
raw/          FONTE IMMUTABILE. Non modificare mai un file qui dentro.
  inbox/      catture rapide dallo smartphone, in attesa di ingest
  <topic>/    fonti curate: YYYY-MM-DD-slug.md
wiki/         CONOSCENZA COMPILATA. Qui scrivi solo tu.
  index.md    GENERATO. Non modificarlo a mano: lo rigenera wiki-lint.py --fix
  log.md      APPEND-ONLY. Aggiungi in fondo, non riscrivere mai le voci passate.
  concepts/   sintesi tematiche          (type: concept)
  entities/   persone, aziende, prodotti (type: entity)
  sources/    una pagina per fonte raw   (type: source)
```

Solo queste tre sottocartelle dentro `wiki/`. Il lint rifiuta il resto: una
gerarchia libera renderebbe impossibile sia il controllo dei link sia la
build della PWA per lo smartphone.

## Formato di una pagina

```markdown
---
title: Titolo leggibile
type: concept
tags: [tag-uno, tag-due]
derived_from: [raw/letture/2026-04-03-articolo.md]
updated: 2026-04-03
---

Corpo in markdown, con [[collegamenti]] ad altre pagine.
```

- Nome file: `kebab-case.md`, minuscolo, senza spazi ne' accenti nel nome.
  Lo slug (nome senza `.md`) e' **globalmente unico** in tutto `wiki/`.
- Collegamenti: `[[slug]]` oppure `[[slug|testo visibile]]`.
- `derived_from` elenca i percorsi dentro `raw/` da cui la pagina deriva.
  E' anche il meccanismo con cui il sistema sa quali catture sono gia' state
  ingerite: una cattura in `raw/inbox/` risulta "in attesa" finche' nessuna
  pagina la dichiara.

## Le tre operazioni

### ingest

1. Leggi la fonte in `raw/` (o `raw/inbox/`).
2. Cerca in `wiki/index.md` le pagine gia' esistenti sull'argomento.
3. **Assorbi, non archiviare.** Aggiorna le pagine esistenti; creane di nuove
   solo per concetti o entita' che non hanno ancora una pagina.
4. Crea sempre una pagina in `wiki/sources/` per la fonte, con
   `derived_from` che la punta.
5. Collega: ogni pagina nuova deve essere raggiungibile da almeno una pagina
   esistente. Aggiungi il link entrante, non solo quello uscente.
6. Se la fonte contraddice qualcosa di gia' scritto, non sovrascrivere in
   silenzio: riporta entrambe le versioni con le date e segnala la
   contraddizione nella pagina.
7. Aggiungi una voce a `wiki/log.md`:
   `## [YYYY-MM-DD] ingest | <titolo fonte>` seguita da 1-3 righe su cosa e'
   cambiato e quali pagine hai toccato.
8. Esegui `bin/wiki-lint.py --fix` e correggi gli errori residui.

### query

Parti da `wiki/index.md`, apri le pagine pertinenti, rispondi citando le
pagine con `[[slug]]`. Se durante la risposta emerge conoscenza nuova che
merita di restare, scrivila nel wiki: una query che produce una scoperta e
non la deposita e' conoscenza persa.

### lint

Il controllo strutturale e' automatico (`bin/wiki-lint.py`): link rotti,
frontmatter, collisioni, indice. **Non rifarlo a mano.** Il tuo lint e'
quello che richiede giudizio:

- contraddizioni fra pagine
- pagine che dicono la stessa cosa e andrebbero fuse
- affermazioni invecchiate rispetto a fonti piu' recenti
- concetti citati ovunque ma senza una pagina propria
- pagine orfane che meritano un collegamento (le segnala il lint come W003)

Chiudi con una voce in `log.md`: `## [YYYY-MM-DD] lint | <sintesi>`.

## Regole non negoziabili

1. **Non modificare `raw/`.** Mai. E' la ground truth: se cambia, ogni
   ri-ingest produce un risultato diverso e il wiki non e' piu' ricostruibile.
2. **Non modificare `wiki/index.md` a mano.** E' generato.
3. **`wiki/log.md` e' append-only.** E' configurato con `merge=union` in
   `.gitattributes`: riscrivere le voci passate crea conflitti veri, mentre
   aggiungere in fondo non ne crea mai.
4. **Un solo slug per concetto.** Prima di creare una pagina, controlla
   l'indice. Due pagine sullo stesso concetto sono il modo principale in cui
   questo tipo di wiki si degrada.
5. **Commit piccoli e frequenti** con messaggi `ingest: ...` / `lint: ...`.
   Il PC puo' spegnersi in qualunque momento: cio' che non e' committato e
   pushato non esiste per lo smartphone.
