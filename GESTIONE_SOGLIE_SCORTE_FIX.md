# 🔧 GESTIONE SOGLIE SCORTE - ANALISI E CHIARIMENTI

## ❌ **PROBLEMA ORIGINALE**

La gestione delle soglie scorte non funzionava correttamente perché:

1. **Non venivano proposti nuovi articoli** - Solo articoli con movimenti visibili
2. **Non era chiaro come dovrebbe funzionare** - Confusione tra articoli ordini e scorte magazzino
3. **Le soglie non erano gestite per tutte le scorte** - Mancava visibilità completa

---

## ✅ **CHIARIMENTO IMPORTANTE**

### **Due Sistemi Separati:**

| Sistema | Cosa Gestisce | Dove |
|---------|---------------|------|
| **Articoli (articlesArchive)** | Catalogo prodotti per gli ordini | Tab "Articoli" |
| **Scorte (stockMovements)** | Movimenti di magazzino (entrate/uscite) | Tab "Scorte" |

**Le soglie scorte monitorano SOLO i movimenti di magazzino**, NON l'archivio articoli degli ordini.

---

## 🎯 **COME FUNZIONA CORRETTAMENTE**

### **Flusso Operativo:**

1. **Tab "Scorte"** → Aggiungi movimenti di magazzino
   - Movimento di tipo: **Entrata** (carico merce)
   - Movimento di tipo: **Uscita** (scarico merce)
   - Ogni movimento ha: `code`, `description`, `quantity`, `price`

2. **Dashboard → "Configura Soglie"** → Vedi tutti gli articoli con movimenti
   - La giacenza è calcolata: `Entrate - Uscite`
   - Imposti una soglia per ogni codice articolo

3. **Alert automatici**
   - ⚠️ **Scorte Basse**: giacenza > 0 ma ≤ soglia
   - ❌ **Articoli Esauriti**: giacenza ≤ 0

---

## 📊 **ESEMPIO PRATICO**

### **Scenario: Gestione magazzino ferramenta**

#### **1. Aggiungi movimenti in "Scorte":**

| Codice | Descrizione | Tipo | Quantità |
|--------|-------------|------|----------|
| VITE-M8 | Vite metrica 8mm | Entrata | 100 |
| VITE-M8 | Vite metrica 8mm | Uscita | 30 |
| DADO-M8 | Dado metrico 8mm | Entrata | 200 |
| DADO-M8 | Dado metrico 8mm | Uscita | 180 |

**Giacenze calcolate:**
- VITE-M8: 100 - 30 = **70 pezzi**
- DADO-M8: 200 - 180 = **20 pezzi**

#### **2. Configura soglie in Dashboard:**

| Codice | Giacenza | Soglia Impostata | Stato |
|--------|----------|------------------|-------|
| VITE-M8 | 70 | 50 | ✅ OK (sopra soglia) |
| DADO-M8 | 20 | 50 | ⚠️ SCORTE BASSE (sotto soglia) |

#### **3. Alert visualizzati:**

**Dashboard mostra:**
- ⚠️ **Scorte Basse (1)**: DADO-M8 - giacenza 20, soglia 50

---

## 🔍 **COSA MOSTRA LA MODAL "CONFIGURA SOGLIE"**

### **Articoli Visibili:**
- ✅ Tutti i codici che hanno **almeno 1 movimento** (entrata o uscita)
- ✅ Anche articoli con giacenza 0 (se hanno avuto movimenti)
- ❌ NON mostra articoli dell'archivio ordini senza movimenti magazzino

### **Box "Soglie Configurate":**
Per ogni soglia impostata mostra:
- Codice articolo
- Descrizione (dall'ultimo movimento)
- Giacenza attuale (con colore)
- Soglia impostata
- Pulsante rimozione

---

## 🛠️ **COMPORTAMENTO ATTUALE (CORRETTO)**

### **Logica Giacenze:**

```javascript
const giacenzeMap = {};

// Scandisce SOLO i movimenti di magazzino
(stockMovements || []).forEach(movement => {
    if (!giacenzeMap[movement.code]) {
        giacenzeMap[movement.code] = {
            code: movement.code,
            description: movement.description,
            entrate: 0,
            uscite: 0
        };
    }
    if (movement.type === MovementType.Entrata) {
        giacenzeMap[movement.code].entrate += movement.quantity;
    } else {
        giacenzeMap[movement.code].uscite += movement.quantity;
    }
});

// Calcola giacenza finale
const giacenzeArray = Object.values(giacenzeMap).map(g => ({
    ...g,
    giacenza: g.entrate - g.uscite
}));
```

### **Filtro Alert:**

```javascript
// Solo articoli con soglia configurata E giacenza bassa
const lowStockItems = giacenzeArray.filter(g => {
    const threshold = stockThresholds[g.code];
    return threshold !== undefined &&
           g.giacenza > 0 &&
           g.giacenza <= threshold;
});

// Solo articoli con soglia configurata E esauriti
const outOfStockItems = giacenzeArray.filter(g => {
    const threshold = stockThresholds[g.code];
    return threshold !== undefined && g.giacenza <= 0;
});
```

---

## ❓ **FAQ - Domande Frequenti**

### **Q: Perché non vedo un articolo nella configurazione soglie?**
**A:** L'articolo non ha movimenti di magazzino. Vai su "Scorte" e aggiungi almeno un'entrata.

### **Q: Ho aggiunto un articolo in "Articoli" ma non appare nelle soglie**
**A:** Normale. "Articoli" è il catalogo per gli ordini. Le soglie monitorano solo le "Scorte" (movimenti magazzino).

### **Q: Posso impostare soglie prima di fare movimenti?**
**A:** No. Devi prima creare almeno un movimento (entrata) nella sezione "Scorte".

### **Q: Come aggiungo un nuovo articolo da monitorare?**
**A:**
1. Vai su "Scorte"
2. Aggiungi un movimento di tipo "Entrata"
3. Inserisci codice, descrizione, quantità
4. L'articolo apparirà automaticamente in "Configura Soglie"

### **Q: Un articolo ha giacenza 0, ricevo alert?**
**A:** Solo se hai configurato una soglia per quell'articolo. Gli alert funzionano solo per articoli monitorati.

---

## ✨ **MIGLIORAMENTI IMPLEMENTATI**

### **1. Messaggi Chiari**
- ✅ Spiega che vengono mostrati articoli con movimenti magazzino
- ✅ Indica dove aggiungere nuovi articoli (sezione "Scorte")
- ✅ Guida passo-passo

### **2. Box Soglie Configurate Migliorato**
- ✅ Mostra descrizione articolo
- ✅ Mostra giacenza con colore (rosso/giallo/verde)
- ✅ Mostra soglia impostata
- ✅ Rimozione rapida

### **3. Gestione Semplificata**
- ✅ Svuota campo input = rimuove soglia
- ✅ Pulsante 🗑️ = rimuove soglia
- ✅ Ricerca per codice/descrizione

---

## 🎯 **RIEPILOGO MODIFICHE**

| File | Righe | Cosa Modificato |
|------|-------|-----------------|
| [index.html](index.html) | 2918-2945 | Rimosso riferimento a `articlesArchive`, usa solo `stockMovements` |
| [index.html](index.html) | 2781-2789 | Messaggi informativi chiariti (movimenti magazzino) |
| [index.html](index.html) | 3000-3030 | Testi dashboard aggiornati (scorte vs articoli) |
| [index.html](index.html) | 2800-2831 | Box soglie configurate con giacenza colorata |
| [index.html](index.html) | 2752-2764 | Gestione rimozione soglia migliorata |

---

## 🧪 **TEST CONSIGLIATO**

### **Test Completo:**

1. **Vai su "Scorte"**
   - Aggiungi entrata: PROD001, 100 pezzi
   - Aggiungi uscita: PROD001, 70 pezzi
   - **Giacenza risultante: 30**

2. **Vai su Dashboard → "Configura Soglie"**
   - Cerca "PROD001"
   - **Verifica:** Appare con giacenza 30
   - Imposta soglia: 50

3. **Verifica Alert**
   - **Dovrebbe apparire:** ⚠️ Scorte Basse (1)
   - **Articolo:** PROD001, giacenza 30, soglia 50

4. **Aggiungi altra entrata**
   - Vai su "Scorte"
   - Aggiungi entrata: PROD001, 30 pezzi
   - **Giacenza ora: 60**

5. **Torna alla Dashboard**
   - **Alert dovrebbe scomparire** (giacenza sopra soglia)
   - **Messaggio:** ✅ Tutto OK!

---

## 🚀 **PROSSIMI PASSI**

Per utilizzare il sistema:

1. **Popola movimenti magazzino**
   - Vai alla sezione "Scorte"
   - Aggiungi entrate/uscite per i tuoi articoli
   - Usa codici univoci e descrittivi

2. **Configura soglie**
   - Dashboard → "Configura Soglie per Articolo"
   - Imposta soglie personalizzate per ogni codice
   - Considera lead time fornitori e rotazione

3. **Monitora alert**
   - Controlla la dashboard regolarmente
   - Agisci quando vedi scorte basse
   - Aggiorna soglie se necessario

---

## 🛑 **IMPORTANTE: Avvio Server HTTP**

L'applicazione **DEVE** essere avviata tramite server HTTP locale:

```bash
python -m http.server 8000
```

Poi apri: **http://localhost:8000/index.html**

**NON** aprire il file direttamente (doppio click) perché:
- ❌ Service Worker non funziona
- ❌ Firebase non si connette
- ❌ CORS bloccato

---

*Ultima modifica: 2025-11-16*
*Chiarimento: Le soglie monitorano movimenti magazzino (stockMovements), NON l'archivio articoli (articlesArchive)*
