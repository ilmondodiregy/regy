# 🔥 FIREBASE BILLING - GUIDA ABILITAZIONE

## ⚠️ IMPORTANTE - Leggi Prima

**Google richiede carta registrata ma NON addebiterà nulla se resti nel piano FREE.**

### Limiti Piano Spark (GRATUITO):
```
✅ 1GB storage Firestore
✅ 50K letture/giorno
✅ 20K scritture/giorno
✅ 10GB bandwidth/mese

Con i tuoi dati attuali (20KB):
- Storage: 0.002% del limite
- Operazioni: <1% del limite

→ RIMARRÀ GRATIS per ANNI
```

### Come Proteggerti da Addebiti Imprevisti

1. **Imposta Budget Alert** (ti avviso se spendi)
2. **Rimani su Spark Plan** (no upgrade automatico)
3. **Monitor utilizzo** settimanale

---

## STEP 1: Abilita Billing

### 1.1 Vai alla pagina Billing
Clicca su questo link (sostituisci il project ID con il tuo):

https://console.developers.google.com/billing/enable?project=business-manager-pro-8a727

### 1.2 Crea Account Fatturazione
1. Click "Create billing account"
2. Seleziona paese: **Italy**
3. Inserisci dati:
   ```
   Nome account: Business Manager Billing
   Indirizzo: <Tuo indirizzo>
   ```

### 1.3 Aggiungi Metodo Pagamento
1. Inserisci carta (anche prepagata funziona)
2. Google verificherà con addebito €0-2 (rimborsato subito)
3. Conferma

### 1.4 Collega al Progetto
1. Torna su Firebase Console
2. Dovrebbe già essere collegato automaticamente
3. Verifica: Project Settings → Usage and billing → Details

---

## STEP 2: Imposta Budget Alert (PROTEZIONE)

### 2.1 Vai a Billing
1. Firebase Console → Project Settings
2. Tab "Usage and billing"
3. Click "Details and settings"

### 2.2 Crea Alert
1. "Set budget alerts"
2. Imposta:
   ```
   Budget: €1/mese
   Alert a: 50%, 90%, 100%
   Email: <tua email>
   ```
3. Salva

**Risultato:** Se spendi anche solo €0.50, ricevi email di avviso!

---

## STEP 3: Rimani su Piano Spark (FREE)

⚠️ **IMPORTANTE:** NON fare upgrade a Blaze!

### Verifica Piano Attuale
1. Firebase Console → Project Settings
2. Tab "Usage and billing"
3. Controlla che dica:
   ```
   Current plan: Spark (FREE)
   ```

Se dice "Blaze" (pay-as-you-go):
1. Click "Modify plan"
2. Seleziona "Spark plan"
3. Conferma downgrade

---

## PROTEZIONI ATTIVE

Con setup corretto:
- ✅ Piano Spark = €0/mese GARANTITO
- ✅ Budget alert a €0.50 = avviso immediato
- ✅ Limiti hard-coded (Firebase blocca richieste oltre limite FREE)

**Non può spendere NULLA senza che tu lo sappia.**

---

## Alternative Carta di Credito

### Carta Virtuale / Prepagata
Se non vuoi usare carta principale:

1. **Revolut** (carta virtuale gratuita)
2. **N26** (carta prepagata)
3. **Hype** (carta ricaricabile)
4. **PostePay Evolution**

Ricarica €10, usa per Firebase, tieni sotto controllo.

---

## VERIFICA FINALE

Dopo aver abilitato billing:

1. Torna su Firebase Console
2. Firestore Database → Create database
3. Dovrebbe funzionare senza errori

Se ancora errore:
- Aspetta 2-5 minuti (propagazione)
- Riprova
- Hard refresh (Ctrl+F5)

---

## FAQ

**Q: "Google mi addebiterà automaticamente?"**
A: **NO**. Piano Spark ha limiti hard. Anche se superi (impossibile con tuoi dati), Firebase BLOCCA richieste invece di addebitare.

**Q: "Posso rimuovere carta dopo?"**
A: **NO**. Firebase richiede carta sempre collegata, ma non addebita se resti su Spark.

**Q: "E se cambio idea?"**
A: Puoi eliminare progetto Firebase in qualsiasi momento. Carta sarà disconnessa automaticamente.

---

## PROSSIMO STEP

Dopo aver abilitato billing:
1. Torna su Firebase Console
2. Riprova creare Firestore Database
3. Quando funziona, inviami messaggio: **"Billing abilitato, Firestore attivo"**
4. Procederemo con implementazione codice
