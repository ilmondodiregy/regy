---
description: Assorbe una fonte da raw/ dentro il wiki, aggiornando le pagine esistenti
argument-hint: [percorso della fonte, oppure vuoto per svuotare la inbox]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(python3 bin/wiki-lint.py:*), Bash(git status:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git pull:*)
---

Assorbi una fonte dentro il wiki, seguendo le regole di `CLAUDE.md`.

**Fonte da ingerire:** $1

Se l'argomento e' vuoto, lavora su tutte le catture in `raw/inbox/` che non
sono ancora state ingerite. Una cattura risulta ingerita quando una pagina di
`wiki/` la dichiara in `derived_from`. Per trovare quelle in attesa:

```
python3 bin/wiki-lint.py --json
```

e cerca le voci con codice `I001`.

## Procedura

1. **Allineati prima di scrivere.** `git pull --rebase --autostash`. Un'altra
   sessione, il PC o la routine notturna possono aver gia' modificato il wiki:
   partire da uno stato vecchio e' il modo piu' facile per creare pagine
   duplicate.

2. **Leggi la fonte per intero.** Non riassumerla dal titolo.

3. **Orientati nell'esistente.** Leggi `wiki/index.md` e apri le pagine che
   toccano l'argomento. Serve sapere cosa il wiki gia' sa, non solo cosa dice
   la fonte.

4. **Assorbi, non archiviare.** Aggiorna le pagine esistenti con quello che la
   fonte aggiunge. Crea pagine nuove solo per concetti o entita' che non ne
   hanno ancora una. Se stai per creare una pagina, prima cerca nell'indice un
   sinonimo: due pagine sullo stesso concetto sono il modo principale in cui
   questo wiki si degrada.

5. **Crea la pagina fonte** in `wiki/sources/`, con `derived_from` che punta al
   file in `raw/`. E' questo campo a marcare la cattura come lavorata.

6. **Aggiungi i link entranti.** Ogni pagina nuova dev'essere raggiungibile da
   almeno una pagina che esisteva gia'. Modificare la pagina vecchia perche'
   punti a quella nuova e' il passaggio che si salta sempre, ed e' quello che
   fa la differenza fra un wiki e una cartella di appunti.

7. **Le contraddizioni si dichiarano, non si risolvono in silenzio.** Se la
   fonte smentisce qualcosa di gia' scritto, riporta entrambe le versioni con
   le rispettive date e fonti, e segnala esplicitamente il conflitto nella
   pagina.

8. **Registra in `wiki/log.md`**, in fondo, senza mai riscrivere voci passate:
   ```
   ## [YYYY-MM-DD] ingest | <titolo della fonte>
   ```
   piu' una o tre righe su cosa e' cambiato e quali pagine hai toccato.

9. **Chiudi il ciclo:**
   ```
   python3 bin/wiki-lint.py --fix
   ```
   Rigenera l'indice e corregge il correggibile. Poi rileggi l'output e sistema
   a mano gli errori rimasti: i link rotti e gli slug ambigui richiedono una
   decisione, non una riparazione automatica.

10. **Committa e pusha.** `git add -A && git commit -m "ingest: <fonte>" && git push`.
    Non e' un passaggio opzionale ne' rimandabile: finche' non e' pushato,
    quello che hai scritto non esiste ne' per lo smartphone ne' per il PC. Se
    il push viene rifiutato, `git pull --rebase` e riprova.

## Se stai girando in una sessione cloud

Il container viene distrutto a fine sessione. Tutto cio' che non e' stato
pushato e' perso — quindi pusha prima di considerare finito il lavoro, anche
se hai ingerito una sola nota.
