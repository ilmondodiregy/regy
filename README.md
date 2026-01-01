# 📊 Gestione Attività Pro v4.0

Applicazione web professionale per la gestione completa di ordini, spese, scorte, preventivi e archivi clienti/articoli con sistema di autenticazione, backup crittografato e interfaccia responsive ottimizzata per desktop, tablet e smartphone.

## 🚀 Demo Live

Visita l'applicazione: [https://USERNAME.github.io/app](https://USERNAME.github.io/app)

*(Sostituisci USERNAME con il tuo username GitHub)*

## ⚡ Caratteristiche Principali v4.0

### 🔐 Sistema di Autenticazione
- Login obbligatorio con username e password
- Password hashata con SHA-256
- Cambio username e password via interfaccia
- Sessione persistente fino al logout
- Credenziali default: `admin` / `admin`

### 📇 Archivi Relazionali
- **Archivio Clienti** (CLT001, CLT002...) con anagrafica completa
- **Archivio Articoli** (ART001, ART002...) con prezzi e margini
- Previene duplicati e garantisce statistiche accurate
- Select dropdown con codici univoci

### 💾 Backup Avanzato
- Export/Import JSON standard
- **Backup crittografato con password** (AES-256)
- Auto-backup ogni 24 ore
- Compatibilità Google Drive / iCloud

### 📱 Design Responsive
- Layout compatto ottimizzato per tutti i dispositivi
- 9 tab con icone sempre visibili senza scroll
- Touch-friendly su tablet e smartphone
- PWA installabile come app nativa

## ✨ Caratteristiche

### 📊 Gestione Completa
- **Ordini**: Tracciamento ordini con stati (Da Iniziare, In Svolgimento, Terminato)
- **Spese**: Gestione completa delle spese con categorie
- **Scorte**: Monitoraggio giacenze con soglie di allarme
- **Preventivi**: Creazione preventivi con sconti e conversione in ordini
- **Clienti**: Archivio clienti completo con anagrafica
- **Articoli**: Catalogo prodotti con calcolo margini

### 🔒 Sicurezza
- **Login obbligatorio** con username e password
- **Password hashata** con SHA-256
- **Backup crittografati** con AES-256
- **Gestione account** integrata (cambio username/password)
- **Sessione persistente** fino al logout

### 💾 Backup e Sincronizzazione
- **Backup automatico** ogni 24 ore
- **Export crittografato** con password
- **Import/Export** manuale
- **Compatibilità** con Google Drive e iCloud

### 📱 Responsive Design
- Ottimizzato per **desktop, tablet e smartphone**
- Layout touch-friendly
- PWA (Progressive Web App) installabile
- Funziona offline dopo il primo caricamento

### 🎨 Personalizzazione
- **Dark Mode** integrato
- **Tab ottimizzati** senza scroll orizzontale
- **Input maiuscoli** automatici per i dati
- Statistiche e grafici interattivi

## 🔑 Credenziali di Default

**Username**: `admin`
**Password**: `admin`

⚠️ **IMPORTANTE**: Cambia subito le credenziali dopo il primo accesso!

## 📖 Come Usare

### 1. Primo Accesso
1. Apri l'applicazione
2. Accedi con `admin` / `admin`
3. Clicca sull'icona ⚙️ (Gestione Account) in alto a destra
4. Cambia username e password

### 2. Gestione Dati
- **Dashboard**: Panoramica generale con statistiche
- **Ordini**: Aggiungi/modifica/elimina ordini
- **Spese**: Traccia tutte le uscite
- **Scorte**: Monitora le giacenze
- **Archivio Clienti**: Gestisci l'anagrafica completa
- **Archivio Articoli**: Catalogo prodotti con prezzi
- **Preventivi**: Crea preventivi e convertili in ordini
- **Statistiche**: Visualizza grafici e report

### 3. Backup dei Dati
1. Clicca sull'icona 💾 (Backup)
2. Scegli tra:
   - **Download Locale**: backup non crittografato
   - **Download con Password**: backup protetto
   - **Google Drive / iCloud**: salvataggio cloud
3. Per ripristinare: carica il file JSON

## 🌐 Deploy su GitHub Pages

### Metodo 1: Via Web Interface

1. **Crea un repository**
   - Vai su [github.com](https://github.com) e crea nuovo repository
   - Nome: `app` (o qualsiasi nome)
   - Public o Private

2. **Carica i file**
   - Clicca "Add file" → "Upload files"
   - Trascina `index.html`
   - Commit changes

3. **Attiva GitHub Pages**
   - Vai in Settings → Pages
   - Source: Deploy from a branch
   - Branch: `main` → `/root`
   - Save

4. **Accedi all'app**
   - URL: `https://USERNAME.github.io/app`
   - Disponibile in 1-2 minuti

### Metodo 2: Via Git (command line)

```bash
# 1. Inizializza repository
cd /path/to/app
git init
git add index.html
git commit -m "Initial commit - Gestione Attività Pro v4.0"

# 2. Collega a GitHub
git remote add origin https://github.com/USERNAME/app.git
git branch -M main
git push -u origin main

# 3. Attiva Pages via web interface (vedi sopra)
```

## 🔧 Tecnologie Utilizzate

- **React 18** (standalone)
- **Tailwind CSS** (styling)
- **CryptoJS** (crittografia)
- **jsPDF** (export PDF)
- **XLSX** (export Excel)
- **Chart.js** (grafici)
- **LocalStorage** (persistenza dati)

## 📱 Installazione come PWA

### Su iOS (iPhone/iPad)
1. Apri Safari
2. Vai su l'URL dell'app
3. Tocca il pulsante Condividi
4. Seleziona "Aggiungi a Home"

### Su Android
1. Apri Chrome
2. Vai su l'URL dell'app
3. Tocca il menu (⋮)
4. Seleziona "Installa app"

## 🔐 Gestione Account

### Cambiare Username
1. Clicca sull'icona ⚙️ (Impostazioni)
2. Tab "Cambia Username"
3. Inserisci nuovo username (min. 3 caratteri)
4. Conferma
5. Verrai disconnesso automaticamente

### Cambiare Password
1. Clicca sull'icona ⚙️ (Impostazioni)
2. Tab "Cambia Password"
3. Inserisci password attuale
4. Inserisci nuova password (min. 4 caratteri)
5. Conferma nuova password
6. Verrai disconnesso automaticamente

## 💾 Backup Crittografato

### Creare Backup Protetto
1. Clicca su 💾 (Backup)
2. Seleziona "Download con Password"
3. Inserisci password per il backup
4. Conferma password
5. Il file viene scaricato: `backup_protetto_YYYY-MM-DD.json`

### Ripristinare Backup Protetto
1. Clicca su 💾 (Backup)
2. Seleziona "Carica da Google Drive / iCloud" o usa il file picker
3. Seleziona il file `backup_protetto_*.json`
4. Inserisci la password quando richiesto
5. Conferma ripristino

## 🐛 Troubleshooting

### Non riesco ad accedere
- Verifica di usare le credenziali corrette
- Prova con maiuscolo/minuscolo: `admin` o `ADMIN`
- Cancella cache del browser
- In caso estremo, apri Console (F12) e digita:
  ```javascript
  localStorage.removeItem('auth_credentials')
  ```

### Ho perso la password
- Apri Console browser (F12)
- Digita:
  ```javascript
  localStorage.removeItem('auth_credentials')
  sessionStorage.removeItem('auth_session')
  location.reload()
  ```
- Potrai accedere con `admin` / `admin`
- ⚠️ I dati rimarranno intatti

### I dati non si salvano
- Controlla che il browser abbia LocalStorage abilitato
- Verifica lo spazio disponibile
- Prova in modalità incognito per testare

### L'app non funziona su mobile
- Usa un browser moderno (Chrome, Safari)
- Abilita JavaScript
- Verifica connessione internet (primo caricamento)

## 📄 Licenza

Questo progetto è fornito "as is" senza garanzie.

## 🤝 Supporto

Per problemi o domande:
- Apri un Issue su GitHub
- Consulta la Console browser (F12) per errori

## 🎯 Roadmap Futura

- [ ] Multi-utente completo
- [ ] Ruoli e permessi
- [ ] Sincronizzazione cloud automatica
- [ ] API REST per integrazioni
- [ ] App mobile nativa
- [ ] Export avanzati (Word, CSV)
- [ ] Notifiche push
- [ ] Fatturazione elettronica

---

**Versione**: 4.0
**Data**: 2025
**Autore**: Generated with Claude Code
