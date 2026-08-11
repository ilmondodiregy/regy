# Obsidian sullo stesso repo

Il vault Obsidian **e'** il repository git. Non una copia, non un export: la
stessa cartella che Claude clona e modifica. E' quello che rende "gli stessi
dati" letterale invece che approssimativo.

## Perche' non Obsidian Sync

E' la domanda giusta da farsi, e la risposta e' netta: **Obsidian Sync non
soddisfa il requisito.** Sincronizza benissimo fra i tuoi dispositivi, ma
Claude non puo' leggerlo. A PC spento le note vivrebbero in un servizio a cui
l'agente non ha accesso, e ingest e lint dal telefono diventerebbero
impossibili.

Git e' l'unico substrato che entrambi i client sanno raggiungere: Obsidian
tramite un plugin, Claude tramite GitHub. Da qui tutto il resto.

Non usarli insieme sullo stesso vault. Due motori di sincronizzazione sulla
stessa cartella si sovrascrivono a vicenda i file, e i conflitti che ne
escono non sono risolvibili guardando la storia di git.

## Impostazioni del vault

Sono in `.obsidian/app.json` e sono versionate di proposito: cosi' il telefono
si comporta come il PC senza doverle riconfigurare. Le tre che contano:

| impostazione | valore | perche' |
|---|---|---|
| `newFileFolderPath` | `raw/inbox` | ogni nota nuova nasce come cattura grezza, non come pagina wiki. E' questo a rendere la scrittura da telefono append-only. |
| `newLinkFormat` | `shortest` | i link diventano `[[slug]]` senza percorso. Funziona perche' il lint garantisce che ogni slug sia unico (E005). |
| `useMarkdownLinks` | `false` | mantiene la sintassi `[[wikilink]]` che il pattern usa e che `wiki-lint.py` sa leggere. |

I file esclusi (`bin/`, `.github/`, `.claude/`) restano nel repo ma spariscono
da ricerca e grafo: sono infrastruttura, non conoscenza.

## Sul telefono: il plugin Git

Va detto subito, perche' te ne accorgeresti comunque: **su mobile il plugin
Git e' la parte fragile di tutta l'architettura.** Non usa git nativo — su
iOS e Android non e' possibile per un plugin — ma `isomorphic-git`, una
reimplementazione in JavaScript che gira dentro il processo dell'app. Ne
derivano tre limiti concreti, non opinabili:

- **solo HTTPS con token**, niente SSH;
- **niente merge driver**: la `merge=union` su `log.md` funziona sul PC e
  nelle sessioni cloud, **non sul telefono**;
- **limiti di memoria**: su repo grandi l'operazione fallisce o si pianta.

Il suo stesso autore ne sconsiglia l'uso su mobile. Funziona bene entro dei
limiti, e questa architettura e' costruita per stare dentro quei limiti.

### Installazione

1. Su GitHub crea un **fine-grained personal access token**, ristretto al solo
   repository del wiki, con permesso `Contents: Read and write`. Nient'altro.
   Se il telefono viene perso, e' l'unica cosa da revocare.
2. In Obsidian mobile: Impostazioni → Plugin della comunita' → cerca **Git** →
   installa e abilita.
3. Nelle impostazioni del plugin: URL del repo in HTTPS, username GitHub,
   token come password.
4. Clona nel vault.

### Impostazioni consigliate sul telefono

| impostazione | valore | perche' |
|---|---|---|
| Commit-and-sync all'avvio | **on** | e' il momento in cui recuperi cio' che il PC e le sessioni cloud hanno scritto |
| Commit automatico a intervalli | **off** | un commit automatico mentre stai scrivendo cattura file a meta' |
| Pull all'avvio | **on** | |
| Push su commit | **on** | una cattura non pushata non esiste per nessun altro |
| Profondita' del clone (depth) | **1** | scarica solo l'ultimo commit invece di tutta la storia. Su un wiki di mesi e' la differenza fra sincronizzare e fallire |
| Disabilita notifiche | a piacere | |

### La regola che tiene in piedi tutto

> **Dal telefono, in Obsidian, scrivi file nuovi. Non modificare pagine di
> `wiki/` che potrebbero essere cambiate altrove.**

Non e' pignoleria. Aggiungere un file non genera mai un conflitto: due nomi
diversi non si scontrano. Modificare una pagina che nel frattempo e' cambiata
sul PC genera un conflitto vero, e risolvere un conflitto git dentro Obsidian
su uno schermo da sei pollici e' un'esperienza che vuoi evitare.

Se devi assolutamente correggere una pagina dal telefono: fai sync **prima** e
sync **subito dopo**. La finestra di rischio e' quella fra le due.

Per tutto il resto — riorganizzare, fondere, riscrivere — usa `/ingest` o
`/lint` da Claude: girano in cloud, partono sempre da uno stato allineato, e
committano da soli.

## Se il plugin Git non regge

Su vault grandi o su iOS puo' diventare inaffidabile. In quel caso la strada
solida e' un client git nativo che sincronizza la cartella del vault:

- **iOS**: [Working Copy](https://workingcopy.app/) — git nativo vero, si
  integra con l'app File e Obsidian apre il vault direttamente da li'. A
  pagamento una tantum per lo sblocco del push.
- **Android**: **GitSync**, oppure `git` dentro Termux con uno script.

Cambia solo il meccanismo di trasporto. Il repository, le regole e il ciclo
con Claude restano identici.

## Verifica

Sul PC, dopo aver configurato tutto:

```bash
./bin/wiki-preflight.sh
```

La sezione 5 controlla proprio le condizioni che il telefono richiede: numero
di file, peso della storia, file troppo grandi, esclusione dei file di
sessione di Obsidian, vault fuori da iCloud.
