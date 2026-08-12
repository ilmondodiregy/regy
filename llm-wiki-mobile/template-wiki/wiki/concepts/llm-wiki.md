---
title: LLM wiki
type: concept
tags: [conoscenza, metodo]
derived_from: [raw/letture/2026-04-02-gist-llm-wiki.md]
updated: 2026-04-02
---

Un LLM wiki e' una base di conoscenza in markdown che un agente costruisce e
mantiene a partire da fonti grezze. Non e' un prodotto: e' un pattern,
descritto da [[andrej-karpathy]] in un gist di prosa da incollare a un agente.

## L'idea centrale

La conoscenza viene **compilata al momento dell'ingest**, non recuperata al
momento della domanda. E' la differenza rispetto alla RAG: invece di
spezzettare i documenti e ritrovarne i pezzi per similarita', si paga una
volta il costo di leggere la fonte per intero e di riscriverla dentro una
struttura che gia' esiste.

Il risultato e' un artefatto che si arricchisce a ogni aggiunta, perche' ogni
fonte nuova non si limita ad accumularsi: attraversa le pagine esistenti e le
modifica.

## I tre strati

| strato | contenuto | chi scrive |
|---|---|---|
| `raw/` | fonti immutabili | l'umano |
| `wiki/` | pagine sintetizzate e collegate | l'agente |
| `CLAUDE.md` | lo schema e le regole | l'umano, una volta |

L'immutabilita' di `raw/` non e' pedanteria: e' cio' che rende il wiki
ricostruibile. Se le fonti cambiano sotto, nessun risultato e' riproducibile.

## Le tre operazioni

[[ingest]] fa entrare la conoscenza, la query la interroga, [[lint]] la tiene
sana. Sono poche di proposito: un sistema con dieci operazioni non viene
usato tutti i giorni, e un wiki che non viene alimentato tutti i giorni non
raggiunge mai la massa critica in cui i collegamenti iniziano a valere piu'
delle pagine.

## Il punto debole

Vive su un disco. Il valore si accumula per mesi ma resta raggiungibile solo
davanti a quella macchina accesa: vedi [[accesso-mobile]].

## Fonti

- [[2026-04-02-gist-llm-wiki]]
