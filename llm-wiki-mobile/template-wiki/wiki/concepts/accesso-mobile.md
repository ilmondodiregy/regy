---
title: Accesso mobile a PC spento
type: concept
tags: [architettura, mobile, sincronizzazione]
derived_from: [raw/letture/2026-08-11-requisito-mobile.md]
updated: 2026-08-11
---

Come usare un [[llm-wiki]] dallo smartphone sugli stessi dati che stanno sul
PC, **anche quando il PC e' spento**, con i due client che si usano gia':
Claude per interrogare e mantenere, Obsidian per leggere e catturare.

## Il vincolo che elimina quasi tutto

"PC spento" non e' un dettaglio: e' il requisito. Scarta in blocco la famiglia
di soluzioni piu' ovvia — VPN verso casa, Syncthing fra i due dispositivi,
server locale con tunnel. Funzionano tutte benissimo *finche' la macchina di
origine e' accesa*. Nessuna sopravvive allo spegnimento, perche' in tutte il
PC resta la fonte del dato.

Scarta anche Obsidian Sync, che pure sincronizzerebbe benissimo fra i
dispositivi: Claude non puo' leggerlo, quindi a PC spento [[ingest]] e [[lint]]
diventerebbero impossibili.

L'unica risposta strutturale e' spostare la fonte di verita'.

> **Il disco del PC smette di essere il wiki. Il wiki e' il repository git
> remoto. Il PC diventa uno dei client.**

Da questa singola inversione discende tutto il resto, incluso il fatto che il
sistema continua a funzionare se il PC non solo e' spento ma si rompe.

## I tre percorsi mobile

Separati di proposito, perche' hanno requisiti di scrittura diversi.

**Leggere.** Obsidian mobile, con il vault che *e'* il repository. Grafo,
backlink e ricerca funzionano gia', perche' `[[wikilink]]` e' la sintassi
nativa di Obsidian. Il plugin Git sincronizza con GitHub.

**Catturare.** Una nota nuova in Obsidian, o un comando a voce a Claude. In
entrambi i casi finisce in `raw/inbox/` con un nome che contiene il timestamp.
Lo smartphone **non modifica mai** file di `wiki/`: il vincolo e' strutturale,
non una convenzione da ricordare, perche' due file con nomi diversi non
possono generare un conflitto git.

**Interrogare e mantenere.** Una sessione Claude Code in cloud sullo stesso
repository, che carica i comandi da `.claude/commands/` versionati nel repo e
si comporta quindi esattamente come sul PC. Gira su infrastruttura remota: il
PC puo' restare spento.

Il dettaglio che rende possibile l'ultimo punto: **la chat di Claude non
sarebbe bastata**, perche' non ha accesso ai file di un repository. Serve
Claude Code, che il repository lo clona davvero.

## Le condizioni di correttezza

Cinque proprieta', ognuna corrispondente a un modo reale di perdere dati.

1. **Il PC non deve mai trattenere stato non pushato.** E' la piu' importante
   e la piu' facile da violare: si chiude il portatile con modifiche non
   committate e dal telefono si vede un wiki vecchio senza alcun segnale che
   manchi qualcosa. Si risolve con un sync a timer, non con la disciplina.
2. **La scrittura da mobile e' append-only.** File nuovi, mai modifiche.
3. **I file contesi devono auto-risolversi.** `index.md` e' rigenerabile (vedi
   [[lint]]), `log.md` e' in `merge=union`. Sono gli unici due che tutti gli
   scrittori toccano.
4. **Il repo deve restare leggero.** Su mobile Obsidian non usa git nativo ma
   una reimplementazione in JavaScript, con i suoi limiti di memoria: in
   `raw/` va solo testo, i binari stanno fuori.
5. **Il repository e' privato e senza segreti.** Il wiki personale ora vive su
   un server di qualcun altro.

## Cosa cambia nel modello di fiducia

Prima i dati stavano su un disco in casa. Dopo stanno su GitHub e transitano
dai container di Anthropic quando l'agente li elabora. Non e' un difetto
dell'architettura, e' il suo prezzo — in buona parte lo stesso che si paga
gia' usando un agente sul PC. Va solo saputo, e un wiki che contiene materiale
che non deve uscire di casa non e' un buon candidato, per quanto sia comodo
leggerlo in metropolitana.
