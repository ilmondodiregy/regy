# llm-wiki.md — gist di Andrej Karpathy (appunti dalla lettura)

> File di esempio in `raw/`. In un uso reale qui va il testo integrale della
> fonte, copiato senza rielaborarlo. Questo file non va mai modificato: e' la
> ground truth da cui le pagine di `wiki/` sono derivabili.

Pattern per una base di conoscenza personale mantenuta da un agente.

Tre strati: `raw/` con le fonti immutabili, `wiki/` con le pagine generate e
interconnesse, un file di schema che descrive convenzioni e workflow.

Tre operazioni: ingest (la fonte entra e viene assorbita nella struttura
esistente, non semplicemente archiviata), query (si parte dall'indice, si
risponde citando le pagine), lint (controllo periodico di contraddizioni,
pagine orfane, concetti mancanti).

Convenzioni: `index.md` come catalogo con una riga di sintesi per pagina,
`log.md` append-only con voci dal prefisso parsabile, frontmatter con i campi
di provenienza.

L'umano cura le fonti e fa domande. L'agente fa la manutenzione.
