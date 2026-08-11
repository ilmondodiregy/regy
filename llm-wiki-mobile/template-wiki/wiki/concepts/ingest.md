---
title: Ingest
type: concept
tags: [metodo, operazioni]
derived_from: [raw/letture/2026-04-02-gist-llm-wiki.md]
updated: 2026-04-02
---

L'operazione con cui una fonte entra nell'[[llm-wiki]].

La formulazione di [[andrej-karpathy]] e' che l'ingest **non archivia:
riscrive**. Il documento nuovo viene digerito, le sue implicazioni vengono
seguite attraverso la struttura esistente, e la struttura viene modificata
per assorbirlo.

## Perche' la differenza conta

Archiviare significa aggiungere un file e un link. Assorbire significa che
dopo l'ingest alcune pagine che esistevano gia' dicono qualcosa di diverso.

Un wiki che archivia cresce linearmente e diventa un cimitero di appunti. Un
wiki che assorbe cresce in densita' di collegamenti, ed e' quella densita' a
rendere utile la ricerca sei mesi dopo.

## Il passaggio che si salta sempre

Il link **entrante**. Creare una pagina nuova e collegarla a quelle esistenti
e' facile e viene naturale. Aggiungere il collegamento nella direzione
opposta — modificare una pagina vecchia perche' punti a quella nuova — e' il
lavoro che nessuno fa a mano e che l'agente deve fare sistematicamente.

Senza link entranti la pagina e' orfana: esiste, ma non la si raggiunge se
non cercandola per nome, cioe' solo se si sa gia' che c'e'. [[lint]] le
segnala come W003.
