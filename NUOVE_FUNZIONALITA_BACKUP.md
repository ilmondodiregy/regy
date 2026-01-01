# 🆕 NUOVE FUNZIONALITÀ BACKUP & MIGRAZIONE

## Data: 2025-11-17

---

## ✅ FUNZIONALITÀ AGGIUNTE

### **1. 🔥 Download Dati Firebase**
**Posizione:** [index.html:2275-2313](index.html#L2275-L2313)

**Cosa fa:**
- Scarica TUTTI i dati presenti su Firebase in un file JSON locale
- Include: ordini, spese, movimenti scorte, articoli, clienti, soglie, cestino
- File scaricato: `firebase_backup_YYYY-MM-DD.json`

**Come usarlo:**
1. Vai su **Backup** (icona database in alto a destra)
2. Nella sezione "💾 Salva Backup"
3. Clicca **"🔥 Download Dati Firebase"** (pulsante arancione con bordo)
4. Il file JSON verrà scaricato automaticamente

**Vantaggi:**
- ✅ Backup locale completo dei dati cloud
- ✅ Formato JSON leggibile e modificabile
- ✅ Può essere ricaricato tramite "Carica File Locale"
- ✅ Versione, data export e sorgente inclusi

---

### **2. 🔔 Migrazione Manuale Soglie**
**Posizione:** [index.html:2378-2435](index.html#L2378-L2435)

**Cosa fa:**
- Migra le soglie scorte da localStorage a Firebase
- Fa un **merge intelligente**: mantiene le soglie Firebase esistenti + aggiunge quelle da localStorage
- Ricarica automaticamente la pagina dopo la migrazione

**Come usarlo:**
1. Vai su **Backup** (icona database)
2. Scorri fino alla sezione **"🔔 Migrazione Soglie Scorte"**
3. Clicca **"🔔 Migra Soglie da localStorage"**
4. Attendi il messaggio di conferma
5. La pagina si ricaricherà automaticamente

**Vantaggi:**
- ✅ Recupera soglie configurate in precedenza
- ✅ Non sovrascrive soglie già presenti su Firebase
- ✅ Mostra quante soglie sono state migrate
- ✅ Log dettagliato in console

---

## 📊 STRUTTURA DATI ESPORTATI

### **File JSON Firebase Backup:**

```json
{
  "orders": [...],           // Array ordini
  "expenses": [...],         // Array spese
  "stockMovements": [...],   // Array movimenti magazzino
  "articlesArchive": [...],  // Array articoli
  "customersArchive": [...], // Array clienti
  "stockThresholds": {...},  // Object soglie (codice: soglia)
  "trash": [...],            // Array elementi cestino
  "exportDate": "2025-11-17T...",
  "version": "5.1 Firebase",
  "source": "Firebase Database"
}
```

---

## 🔍 VERIFICA MIGRAZIONE SOGLIE

### **Prima della migrazione:**
1. Apri **Console Browser** (F12)
2. Digita: `localStorage.getItem('stockThresholds')`
3. Se vedi `{"6391": 10, ...}` → hai soglie da migrare

### **Dopo la migrazione:**
1. Vai su **Firebase Console** → Firestore Database
2. Apri collection: `settings` → document: `stockThresholds`
3. Dovresti vedere:
   ```
   value: {
     "6391": 10,
     "PROD001": 50,
     ...
   }
   migratedFrom: "localStorage"
   migratedAt: Timestamp
   totalThresholds: 5
   ```

### **Verifica nell'app:**
1. **Dashboard** → Clicca "Configura Soglie per Articolo"
2. Le soglie migrate dovrebbero apparire nel box **"✅ Soglie Configurate (X)"**
3. Verifica che i codici corrispondano ai movimenti magazzino (tab Scorte)

---

## ⚠️ NOTE IMPORTANTI

### **Download Dati Firebase:**
- Richiede che tu sia loggato
- Scarica SOLO i dati visibili all'utente corrente
- Il file può diventare grande se hai molti record (KB/MB)

### **Migrazione Soglie:**
- **Sicura:** Non cancella dati esistenti, fa un merge
- **Idempotente:** Puoi eseguirla più volte senza problemi
- Se localStorage è vuoto, mostra "ℹ️ Nessuna soglia trovata"
- Se Firebase ha già le soglie, vengono mantenute

---

## 🚀 UTILIZZO CONSIGLIATO

### **Scenario 1: Backup periodico**
1. Una volta al mese, clicca **"🔥 Download Dati Firebase"**
2. Salva il file JSON in una cartella cloud (Google Drive, Dropbox, etc.)
3. Conserva almeno gli ultimi 3 backup

### **Scenario 2: Recupero soglie perse**
1. Se dopo l'aggiornamento non vedi più le soglie configurate
2. Vai su Backup → **"🔔 Migra Soglie da localStorage"**
3. Controlla che le soglie siano riapparse nella Dashboard

### **Scenario 3: Migrazione da un altro dispositivo**
1. Sul vecchio dispositivo: **Download Dati Firebase**
2. Trasferisci il file JSON sul nuovo dispositivo
3. Sul nuovo dispositivo: Backup → **"Carica File Locale"**
4. Tutti i dati verranno ripristinati

---

## 🎯 TESTING CONSIGLIATO

### **Test 1: Download Firebase**
```
1. Backup → "Download Dati Firebase"
2. Verifica file scaricato: firebase_backup_2025-11-17.json
3. Apri con editor di testo
4. Controlla che contenga tutti i dati attesi
```

### **Test 2: Migrazione Soglie**
```
1. Console → localStorage.setItem('stockThresholds', '{"TEST": 99}')
2. Backup → "Migra Soglie da localStorage"
3. Verifica messaggio: "✅ Migrate 1 soglie da localStorage!"
4. Dashboard → Configura Soglie → Verifica che "TEST" appaia
```

---

## 📝 CHANGELOG

| Versione | Data | Modifiche |
|----------|------|-----------|
| 5.1 | 2025-11-17 | ➕ Aggiunto pulsante "Download Dati Firebase" |
| 5.1 | 2025-11-17 | ➕ Aggiunto pulsante "Migra Soglie da localStorage" |
| 5.1 | 2025-11-17 | 🔧 Merge intelligente soglie (non sovrascrive) |

---

*Funzionalità implementate con successo*
*Testate e pronte all'uso*
