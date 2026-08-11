---
description: Controllo di salute del wiki - contraddizioni, duplicati, pagine orfane
argument-hint: [opzionale: area o tag su cui concentrarsi]
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(python3 bin/wiki-lint.py:*), Bash(git status:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(git pull:*)
---

Controllo di salute del wiki. Ambito: ${1:-tutto il wiki}

## Prima: il lint strutturale

```
git pull --rebase --autostash
python3 bin/wiki-lint.py --fix
```

Copre tutto cio' che e' decidibile meccanicamente — link rotti, frontmatter,
slug ambigui, collisioni di maiuscole, indice non aggiornato, duplicati nel
log. **Non rifare a mano questi controlli.** Se restano errori dopo il `--fix`,
richiedono una decisione: risolvili tu.

Gli slug ambigui (E005) e le collisioni case-insensitive (E006) non sono
cavilli. Uno slug duplicato rende ambiguo `[[nome]]` sia per te sia per
Obsidian; due file che differiscono solo per maiuscole si sovrascrivono a
vicenda quando il repo viene clonato su macOS o Windows, cioe' il PC perde
dati in silenzio al primo pull.

## Poi: il lint che richiede giudizio

E' questa la parte che vale i token. Cerca:

1. **Contraddizioni.** Due pagine che affermano cose incompatibili. Non
   sceglierne una d'ufficio: riporta entrambe con date e fonti, e segnala il
   conflitto.

2. **Duplicazioni semantiche.** Due pagine che parlano della stessa cosa con
   nomi diversi. Proponi la fusione indicando quale slug sopravvive e quali
   link vanno riscritti. Non fondere in silenzio: se hai sbagliato, e' una
   perdita netta di informazione.

3. **Affermazioni invecchiate.** Cose scritte mesi fa che una fonte piu'
   recente in `raw/` ha superato. Aggiorna citando la fonte nuova.

4. **Concetti fantasma.** Termini che compaiono in molte pagine senza avere una
   pagina propria. Sono i candidati migliori per pagine nuove, perche' nascono
   gia' con dei link entranti.

5. **Pagine orfane.** Il lint strutturale le segnala come W003. Per ognuna
   decidi: collegarla da una pagina pertinente, oppure lasciarla se e' davvero
   isolata. Una pagina appena creata da un ingest e' legittimamente orfana; una
   pagina orfana da settimane e' conoscenza che hai gia' perso.

6. **Catture ferme.** Voci `I001`: note prese dal telefono e mai assorbite. Se
   ce ne sono, dillo e proponi di lanciare `/ingest`.

## Chiusura

Scrivi in fondo a `wiki/log.md`:

```
## [YYYY-MM-DD] lint | <sintesi in una riga>
```

con l'elenco di cosa hai cambiato e cosa hai lasciato aperto in attesa di una
decisione umana.

Poi committa e pusha: `git add -A && git commit -m "lint: ..." && git push`.
Un lint non pushato e' un lint da rifare.
