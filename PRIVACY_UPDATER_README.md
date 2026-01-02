# 🔧 Privacy Policy Auto-Updater

Script automatico per compilare i placeholder della Privacy Policy nell'applicazione.

---

## 📋 COME USARE

### **Step 1: Compila i tuoi dati**

Apri il file `privacy-config.json` e compila con i tuoi dati reali:

```json
{
  "company": {
    "name": "La Tua Azienda",
    "legalName": "La Tua Azienda S.r.l.",
    "address": "Via Roma 123",
    "city": "Milano",
    "postalCode": "20100",
    "country": "Italia",
    "vatNumber": "IT12345678901",
    "email": "info@tuaazienda.it",
    "phone": "+39 02 1234567",
    "pec": "tuaazienda@pec.it"
  },
  "privacy": {
    "dpoName": "",
    "dpoEmail": "",
    "privacyEmail": "privacy@tuaazienda.it",
    "privacyPhone": "+39 02 1234567"
  }
}
```

### **Step 2: Esegui lo script**

Apri il terminale nella cartella dell'app ed esegui:

```bash
node update-privacy.js
```

### **Step 3: Verifica il risultato**

Lo script ti dirà cosa ha fatto:

```
🔧 PRIVACY POLICY AUTO-UPDATER
================================

📖 Caricamento configurazione...
🔍 Validazione configurazione...
✅ Configurazione valida
📄 Lettura index.html...
💾 Creazione backup...
✅ Backup creato: backups/privacy-update-2026-01-02T17-30-00/index.html.backup
✏️  Aggiornamento Privacy Policy...
✅ Sostituito: Titolare del Trattamento
✅ Sostituito: Contatti Privacy
✅ File index.html aggiornato con successo!

📝 Aggiornamento PRIVACY_POLICY.md...
✅ File PRIVACY_POLICY.md aggiornato

================================
✅ COMPLETATO!
```

---

## ⚠️ CAMPI OBBLIGATORI

Lo script richiede che questi campi siano compilati:

- ✅ `company.name` - Nome azienda/titolare
- ✅ `company.address` - Indirizzo
- ✅ `company.email` - Email
- ✅ `company.phone` - Telefono
- ✅ `privacy.privacyEmail` - Email contatti privacy

Se manca un campo obbligatorio, vedrai questo errore:

```
❌ ERRORE: Campi obbligatori mancanti in privacy-config.json:
- Nome azienda/titolare (company.name)
- Email (company.email)

💡 Compila tutti i campi obbligatori e riprova.
```

---

## 📁 CAMPI OPZIONALI

Questi campi sono opzionali (lascia vuoti se non applicabili):

- `company.legalName` - Ragione sociale (usa `company.name` se vuoto)
- `company.city` - Città
- `company.postalCode` - CAP
- `company.vatNumber` - Partita IVA
- `company.pec` - PEC
- `privacy.dpoName` - Nome Data Protection Officer
- `privacy.dpoEmail` - Email DPO
- `privacy.privacyPhone` - Telefono privacy (usa `company.phone` se vuoto)

---

## 🔄 BACKUP AUTOMATICO

Lo script crea **sempre** un backup prima di modificare i file:

```
backups/
└── privacy-update-2026-01-02T17-30-00/
    ├── index.html.backup
    └── PRIVACY_POLICY.md.backup
```

### **Ripristinare un Backup:**

Se qualcosa va storto:

```bash
# Windows (PowerShell)
copy backups\privacy-update-XXXXXXX\index.html.backup index.html

# Windows (CMD)
copy backups\privacy-update-XXXXXXX\index.html.backup index.html

# Mac/Linux
cp backups/privacy-update-XXXXXXX/index.html.backup index.html
```

---

## 📝 COSA VIENE AGGIORNATO

Lo script sostituisce i placeholder in **2 posizioni**:

### **1. Titolare del Trattamento** (index.html ~linea 9854)

**Prima:**
```
[DA COMPILARE CON I DATI REALI]
Nome/Ragione Sociale: __________________
Indirizzo: __________________
Email: __________________
Telefono: __________________
```

**Dopo:**
```
Nome/Ragione Sociale: La Tua Azienda S.r.l.
Indirizzo: Via Roma 123, Milano 20100
Paese: Italia
P.IVA: IT12345678901
Email: info@tuaazienda.it
Telefono: +39 02 1234567
PEC: tuaazienda@pec.it
```

### **2. Contatti Privacy** (index.html ~linea 9954)

**Prima:**
```
[DA COMPILARE CON DATI REALI]
Email: __________________
Telefono: __________________
```

**Dopo:**
```
Email: privacy@tuaazienda.it
Telefono: +39 02 1234567
PEC: tuaazienda@pec.it
```

---

## 🧪 TESTING

Dopo aver eseguito lo script:

1. **Apri l'app in un browser:**
   ```bash
   python -m http.server 8000
   ```
   Vai su http://localhost:8000

2. **Verifica Cookie Banner:**
   - Clicca su "Leggi Privacy Policy"
   - Scorri fino a "Titolare del Trattamento"
   - Verifica che i tuoi dati siano corretti

3. **Verifica sezione Contatti:**
   - Scorri fino a "Contatti"
   - Verifica email e telefono

---

## ❓ FAQ

### **Q: Lo script funziona anche su Windows?**
A: Sì! Node.js funziona su Windows, Mac e Linux.

### **Q: Devo avere Node.js installato?**
A: Sì, lo script richiede Node.js. Puoi scaricarlo da https://nodejs.org

### **Q: Posso eseguire lo script più volte?**
A: Sì! Ogni esecuzione crea un nuovo backup. Se hai già compilato i dati, lo script li sovrascriverà con i nuovi valori da `privacy-config.json`.

### **Q: Cosa succede se lascio campi vuoti?**
A: I campi obbligatori causeranno un errore. I campi opzionali verranno semplicemente omessi dal testo finale.

### **Q: Lo script modifica anche PRIVACY_POLICY.md?**
A: Sì, se il file esiste. Questo mantiene sincronizzati index.html e il file markdown di riferimento.

### **Q: Posso editare manualmente dopo aver eseguito lo script?**
A: Sì! Lo script è solo un helper. Puoi sempre editare manualmente index.html se serve.

---

## 🛡️ SICUREZZA

Lo script:
- ✅ **Non invia dati online** - Tutto locale
- ✅ **Crea backup automatici** - Zero rischio perdita dati
- ✅ **Valida input** - Controlla campi obbligatori
- ✅ **Open source** - Puoi leggere tutto il codice

---

## 🐛 TROUBLESHOOTING

### **Errore: "Cannot find module"**

```
Error: Cannot find module 'fs'
```

**Soluzione:** Assicurati di usare Node.js (non browser). Esegui da terminale con `node update-privacy.js`

---

### **Errore: "File privacy-config.json non trovato"**

```
❌ ERRORE: File privacy-config.json non trovato!
```

**Soluzione:** Esegui lo script dalla stessa cartella dove si trova `privacy-config.json`:

```bash
cd c:\Users\rober\Desktop\appRegina
node update-privacy.js
```

---

### **Nessun placeholder trovato**

```
⚠️  ATTENZIONE: Nessun placeholder trovato da sostituire!
```

**Possibili cause:**
1. I placeholder sono già stati sostituiti in precedenza
2. Il formato del testo in index.html è cambiato

**Soluzione:** Controlla manualmente index.html alle linee ~9854 e ~9954

---

### **Placeholder parzialmente sostituiti**

```
⚠️  ATTENZIONE: 1 placeholder [DA COMPILARE] non sostituiti
```

**Causa:** Potrebbero esserci placeholder opzionali (es. DPO) che non hai compilato.

**Soluzione:** Se è intenzionale, ignora l'avviso. Altrimenti compila tutti i campi opzionali in `privacy-config.json`.

---

## 📞 SUPPORTO

Se hai problemi:

1. **Controlla i log dello script** - Ti dice esattamente cosa ha fatto
2. **Verifica privacy-config.json** - JSON valido? Campi obbligatori compilati?
3. **Controlla backup** - Puoi sempre ripristinare
4. **Apri issue su GitHub** - Se pensi sia un bug nello script

---

## 🚀 ESEMPIO COMPLETO

**privacy-config.json:**
```json
{
  "company": {
    "name": "Pasticceria Regina",
    "legalName": "Pasticceria Regina di Roberto Chila",
    "address": "Via Garibaldi 45",
    "city": "Torino",
    "postalCode": "10100",
    "country": "Italia",
    "vatNumber": "IT01234567890",
    "email": "info@pasticceriaregina.it",
    "phone": "+39 011 1234567",
    "pec": "pasticceriaregina@pec.it"
  },
  "privacy": {
    "privacyEmail": "privacy@pasticceriaregina.it",
    "privacyPhone": "+39 011 1234567"
  }
}
```

**Eseguire:**
```bash
node update-privacy.js
```

**Risultato in index.html:**
```
Titolare del Trattamento

Nome/Ragione Sociale: Pasticceria Regina di Roberto Chila
Indirizzo: Via Garibaldi 45, Torino 10100
Paese: Italia
P.IVA: IT01234567890
Email: info@pasticceriaregina.it
Telefono: +39 011 1234567
PEC: pasticceriaregina@pec.it
```

---

**Versione:** 1.0
**Data:** 2 Gennaio 2026
**Compatibilità:** Node.js 14+
