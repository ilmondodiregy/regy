---
description: Interroga il wiki e rispondi citando le pagine
argument-hint: <domanda>
allowed-tools: Read, Glob, Grep, Write, Edit, Bash(python3 bin/wiki-lint.py:*), Bash(git pull:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*)
---

Rispondi a questa domanda usando il wiki: **$ARGUMENTS**

## Come rispondere

1. `git pull --rebase --autostash` — parti dallo stato aggiornato, non da
   quello che il container aveva al clone.

2. Parti da `wiki/index.md` per orientarti, poi apri le pagine pertinenti.
   Usa `Grep` sul contenuto quando l'indice non basta: i titoli non coprono
   tutto quello che c'e' dentro le pagine.

3. Rispondi in modo diretto, citando le pagine con `[[slug]]`. Distingui
   sempre due cose:
   - **cosa dice il wiki** — con il riferimento alla pagina;
   - **cosa aggiungi tu** — conoscenza tua, non presente nel wiki.

   Confonderle e' il modo in cui un wiki si riempie di cose che nessuno ha mai
   verificato.

4. Se il wiki non contiene la risposta, dillo esplicitamente. Non colmare il
   vuoto con conoscenza generica facendola sembrare parte del wiki: la
   distinzione fra "il mio wiki lo sa" e "il modello lo sa" e' l'unica cosa
   che rende il wiki utile.

5. Se durante la risposta emerge un buco evidente — un concetto centrale senza
   pagina, una fonte mai ingerita — segnalalo alla fine in una riga.

## Se la risposta produce conoscenza nuova

Una query che genera una sintesi utile e non la deposita e' conoscenza persa:
la prossima volta ricomincerai da capo. Se la risposta contiene qualcosa che
merita di restare, proponi di scriverla nel wiki, e se l'utente conferma
scrivila, aggiungi i link entranti, lancia `python3 bin/wiki-lint.py --fix`,
committa e pusha.

Da telefono, questo e' il caso piu' frequente: la domanda nasce in mobilita' e
la risposta e' spesso migliore di quello che c'era scritto.
