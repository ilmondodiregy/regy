---
description: Salva una nota al volo in raw/inbox senza toccare il wiki
argument-hint: <testo della nota>
allowed-tools: Read, Write, Glob, Bash(date:*), Bash(git status:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git pull:*)
---

Salva questa nota come cattura grezza: **$ARGUMENTS**

Pensato per l'uso da telefono, anche a voce: parli, e la nota finisce nel repo
senza che tu debba aprire Obsidian.

## Regole

1. **Non toccare `wiki/`.** Nemmeno l'indice, nemmeno il log. Questa e' una
   cattura, non un ingest: il lavoro di assorbirla nel wiki lo fara' `/ingest`,
   con calma e con tutto il contesto davanti.

2. **Scrivi un file nuovo**, mai modificarne uno esistente:
   `raw/inbox/YYYY-MM-DD-HHMM-slug-breve.md`

   Ricava data e ora con `date +%Y-%m-%d-%H%M`. Se il file esiste gia',
   aggiungi un suffisso numerico. Il fatto che ogni cattura sia un file nuovo
   e' cio' che rende questa operazione incapace di generare conflitti git,
   anche se il PC sta scrivendo nello stesso momento.

3. **Frontmatter minimo:**
   ```
   ---
   captured_at: <ISO 8601 con fuso>
   source: claude-mobile
   ---
   ```

4. **Trascrivi, non interpretare.** Riporta quello che l'utente ha detto,
   sistemando solo la punteggiatura e gli errori evidenti di dettatura. Non
   riassumere, non riorganizzare, non aggiungere contesto tuo: questo file
   finisce in `raw/`, che e' la ground truth immutabile del wiki. Se ci metti
   una tua interpretazione, quella interpretazione diventa per sempre un fatto
   di partenza.

   Se qualcosa e' ambiguo, riportalo ambiguo. Se ti viene in mente un
   collegamento con il wiki, dillo nella risposta in chat, non nel file.

5. **Committa e pusha subito:**
   ```
   git pull --rebase --autostash
   git add raw/inbox && git commit -m "cattura: <slug>" && git push
   ```
   Una cattura non pushata sparisce insieme al container.

6. Rispondi con una riga sola: il nome del file e la conferma del push.
