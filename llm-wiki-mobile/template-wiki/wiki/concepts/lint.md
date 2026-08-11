---
title: Lint
type: concept
tags: [metodo, operazioni, manutenzione]
derived_from: [raw/letture/2026-04-02-gist-llm-wiki.md]
updated: 2026-08-11
---

Il controllo periodico di salute dell'[[llm-wiki]]: contraddizioni, pagine
orfane, affermazioni invecchiate, concetti citati ma senza pagina.

## Due lint, non uno

La distinzione e' operativa e ha conseguenze sui costi.

**Lint strutturale** (`bin/wiki-lint.py`): decidibile, deterministico,
gratuito. Link rotti, frontmatter mancante, slug ambigui, collisioni
case-insensitive, indice non aggiornato. Gira in CI a ogni push e non
consuma token. Dando sempre lo stesso risultato sullo stesso input, puo'
anche *riparare*: rigenera `index.md`, dedupa `log.md`, normalizza i nomi.

**Lint semantico** (l'agente): richiede giudizio, costa token, gira una
volta al giorno. Due pagine che dicono la stessa cosa, un'affermazione
smentita da una fonte piu' recente, un concetto nominato in otto pagine che
merita la sua.

Tenerli separati e' cio' che permette di far girare il primo su ogni commit
senza pensarci.

## Perche' il lint strutturale deve essere deterministico

Quando lo stesso wiki viene scritto da piu' parti — il PC, una sessione da
smartphone, un workflow notturno — `index.md` e' il file che tutti toccano,
quindi e' il candidato naturale al conflitto git.

Se l'indice e' *generato* da una funzione pura del contenuto delle pagine,
un conflitto su quel file si risolve buttando via entrambe le versioni e
rigenerando. Non serve capire chi aveva ragione. E' il trucco che rende
possibile [[accesso-mobile]] senza un lucchetto distribuito.
