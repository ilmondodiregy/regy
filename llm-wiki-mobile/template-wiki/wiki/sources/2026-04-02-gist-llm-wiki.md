---
title: Gist llm-wiki.md (Karpathy)
type: source
tags: [fonte, metodo]
derived_from: [raw/letture/2026-04-02-gist-llm-wiki.md]
updated: 2026-04-02
---

Gist di [[andrej-karpathy]] che descrive il pattern dell'[[llm-wiki]].

## Cosa contiene

- L'architettura a tre strati: `raw/` immutabile, `wiki/` generata,
  `CLAUDE.md` come schema.
- Le tre operazioni: [[ingest]], query, [[lint]].
- Le convenzioni: `index.md` come catalogo, `log.md` append-only con prefissi
  parsabili, frontmatter con `derived_from`.

## Cosa non affronta

L'accesso da dispositivi diversi da quello su cui gira l'agente. Il pattern
assume implicitamente una singola macchina con un singolo scrittore, ed e'
un'assunzione ragionevole per la forma in cui e' scritto — ma e' esattamente
quella che va rimossa per [[accesso-mobile]].
