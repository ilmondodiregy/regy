# 🚀 Guida Deploy GitHub Pages

## ✅ Checklist Pre-Deploy

- [x] File `index.html` standalone (nessuna dipendenza esterna critica)
- [x] Tutti i CDN usano HTTPS
- [x] App funziona in locale
- [x] Sistema di autenticazione funzionante
- [x] Backup/Restore testato
- [x] Responsive design verificato

## 📦 Metodo 1: Deploy Rapido (via Web Interface)

### Passo 1: Crea Repository
1. Vai su [github.com](https://github.com)
2. Clicca su **"New repository"**
3. Nome: `gestione-pro` (o qualsiasi nome)
4. Scegli: **Public** (per GitHub Pages gratuito)
5. NON aggiungere README, .gitignore o license
6. Clicca **"Create repository"**

### Passo 2: Carica File
1. Nel repository vuoto, clicca **"uploading an existing file"**
2. Trascina questi file:
   - `index.html`
   - `README.md` (opzionale)
3. Scrivi commit message: "Initial commit - Gestione Pro v4.0"
4. Clicca **"Commit changes"**

### Passo 3: Attiva GitHub Pages
1. Vai su **Settings** del repository
2. Nella sidebar, clicca **Pages**
3. Sotto "Source":
   - Branch: `main` (o `master`)
   - Folder: `/ (root)`
4. Clicca **Save**
5. Aspetta 1-2 minuti

### Passo 4: Visita la Tua App
URL: `https://USERNAME.github.io/gestione-pro/`

## 💻 Metodo 2: Deploy via Git (Command Line)

### Prerequisiti
- Git installato
- Account GitHub

### Comandi

```bash
# 1. Naviga nella cartella dell'app
cd /path/to/app

# 2. Inizializza Git
git init

# 3. Aggiungi file
git add index.html README.md

# 4. Primo commit
git commit -m "Initial commit - Gestione Pro v4.0"

# 5. Collega a GitHub (sostituisci USERNAME e REPO)
git remote add origin https://github.com/USERNAME/gestione-pro.git

# 6. Rinomina branch in main (se necessario)
git branch -M main

# 7. Pusha su GitHub
git push -u origin main
```

### Attiva GitHub Pages
Segui il **Passo 3** del Metodo 1.

## 🔧 Configurazione Avanzata

### Custom Domain (Opzionale)
Se hai un dominio personale:

1. Vai su Settings → Pages
2. Sotto "Custom domain", inserisci: `tuodominio.com`
3. Aggiungi record DNS:
   ```
   Type: A
   Host: @
   Value: 185.199.108.153
   Value: 185.199.109.153
   Value: 185.199.110.153
   Value: 185.199.111.153
   ```
4. O per subdomain:
   ```
   Type: CNAME
   Host: app
   Value: USERNAME.github.io
   ```

### HTTPS (Automatico)
GitHub Pages abilita HTTPS automaticamente per:
- Siti `username.github.io`
- Custom domain (dopo verifica DNS)

## 📱 Test Post-Deploy

### Verifica Desktop
1. Apri: `https://USERNAME.github.io/gestione-pro/`
2. Login con `admin` / `admin`
3. Cambia password
4. Crea cliente di test
5. Crea articolo di test
6. Crea ordine
7. Esporta backup
8. Logout

### Verifica Mobile
1. Apri su smartphone/tablet
2. Verifica tab visibili senza scroll
3. Testa touch sui pulsanti
4. Verifica form funzionanti
5. Opzionale: Installa come PWA
   - Safari iOS: Share → "Aggiungi a Home"
   - Chrome Android: Menu → "Installa app"

### Verifica iPad
1. Apri in Safari su iPad
2. Modalità Portrait e Landscape
3. Verifica tutti i tab
4. Test funzionalità complete

## 🐛 Troubleshooting

### L'app non si carica
- Controlla che `index.html` sia nella root del repository
- Verifica URL corretto: `https://USERNAME.github.io/REPO-NAME/`
- Aspetta 1-2 minuti per la build

### Errori JavaScript
- Apri Console browser (F12)
- Verifica errori di rete (CDN bloccati?)
- Controlla Mixed Content (HTTP su HTTPS)

### LocalStorage non funziona
- GitHub Pages supporta localStorage
- Verifica browser aggiornato
- Controlla modalità incognito (localStorage limitato)

### Login non funziona
- Cancella cache browser
- Verifica console errori
- Reset credenziali:
  ```javascript
  localStorage.removeItem('auth_credentials')
  location.reload()
  ```

## 🔄 Aggiornamenti

### Aggiornare l'App

**Via Web:**
1. Vai sul repository
2. Clicca su `index.html`
3. Clicca icona matita (Edit)
4. Incolla nuovo codice
5. Commit changes

**Via Git:**
```bash
git add index.html
git commit -m "Update to v4.1"
git push
```

Aggiornamento automatico in 1-2 minuti.

## 📊 Monitoraggio

### GitHub Pages Stats
- Vai su: Insights → Traffic
- Vedi visite e pageviews
- Disponibile solo per repository pubblici

### Analytics (Opzionale)
Aggiungi Google Analytics inserendo il tracking code nell'`index.html` prima di `</head>`:

```html
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

## 🎉 Completato!

La tua app è ora online e accessibile 24/7 da qualsiasi dispositivo!

**URL Finale:** `https://USERNAME.github.io/gestione-pro/`

### Prossimi Passi
1. ✅ Cambia credenziali default
2. ✅ Popola archivi clienti/articoli
3. ✅ Configura backup automatico
4. ✅ Condividi URL con il team
5. ✅ Installa come PWA su dispositivi mobili

## 📞 Supporto

- Issues: Apri issue su GitHub repository
- Documentazione: Consulta `README.md`
- Console errori: F12 nel browser

---

**Made with ❤️ using Claude Code**
