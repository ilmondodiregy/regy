# 🔥 FIREBASE FIRESTORE - SCHEMA DESIGN

## Architettura Database

### Collections Structure

```
firestore/
├── orders/                     # Collection principale ordini
│   └── {orderId}               # Document ID: auto-generated
│       ├── id: string
│       ├── date: timestamp
│       ├── customer: string    # Riferimento a CLT001
│       ├── customerName: string
│       ├── article: string     # Riferimento a ART001
│       ├── articleName: string
│       ├── status: string      # enum: Da Iniziare, In Svolgimento, Terminato
│       ├── quantity: number
│       ├── salePrice: number
│       ├── cloudLink: string
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── expenses/                   # Spese
│   └── {expenseId}
│       ├── id: string
│       ├── date: timestamp
│       ├── description: string
│       ├── quantity: number
│       ├── price: number
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── stockMovements/             # Movimenti magazzino
│   └── {movementId}
│       ├── id: string
│       ├── date: timestamp
│       ├── code: string        # Codice prodotto
│       ├── description: string
│       ├── type: string        # enum: Entrata, Uscita
│       ├── quantity: number
│       ├── price: number
│       ├── notes: string
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── articlesArchive/            # Archivio articoli
│   └── {articleCode}           # Document ID: ART001, ART002, ...
│       ├── code: string
│       ├── name: string
│       ├── description: string
│       ├── category: string
│       ├── costPrice: number
│       ├── salePrice: number
│       ├── notes: string
│       ├── isActive: boolean
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── customersArchive/           # Archivio clienti
│   └── {customerCode}          # Document ID: CLT001, CLT002, ...
│       ├── code: string
│       ├── name: string
│       ├── phone: string
│       ├── email: string
│       ├── address: string
│       ├── fiscalCode: string
│       ├── vatNumber: string
│       ├── notes: string
│       ├── isActive: boolean
│       ├── createdAt: timestamp
│       └── updatedAt: timestamp
│
├── settings/                   # Configurazioni app
│   ├── stockThresholds         # Document per soglie
│   │   └── thresholds: map     # { "3077": 2, "8001": 3, ... }
│   └── appConfig              # Config globali
│       ├── darkMode: boolean
│       ├── autoSaveEnabled: boolean
│       └── lastBackup: timestamp
│
└── trash/                      # Cestino (soft delete)
    └── {trashId}
        ├── type: string        # 'order', 'customer', 'article'
        ├── data: object        # Dati originali
        ├── deletedAt: timestamp
        └── deletedBy: string   # userId (per future multi-user)
```

---

## Indici Firestore (Performance Optimization)

### Composite Indexes (da creare in Firebase Console)

```javascript
// orders collection
{
  collectionId: 'orders',
  fields: [
    { fieldPath: 'customer', mode: 'ASCENDING' },
    { fieldPath: 'date', mode: 'DESCENDING' }
  ]
}

{
  collectionId: 'orders',
  fields: [
    { fieldPath: 'status', mode: 'ASCENDING' },
    { fieldPath: 'date', mode: 'DESCENDING' }
  ]
}

{
  collectionId: 'orders',
  fields: [
    { fieldPath: 'article', mode: 'ASCENDING' },
    { fieldPath: 'date', mode: 'DESCENDING' }
  ]
}

// stockMovements collection
{
  collectionId: 'stockMovements',
  fields: [
    { fieldPath: 'code', mode: 'ASCENDING' },
    { fieldPath: 'date', mode: 'DESCENDING' }
  ]
}

{
  collectionId: 'stockMovements',
  fields: [
    { fieldPath: 'type', mode: 'ASCENDING' },
    { fieldPath: 'date', mode: 'DESCENDING' }
  ]
}
```

---

## Security Rules (CRITICAL!)

```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Helper function per autenticazione
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper function per timestamp
    function hasValidTimestamps() {
      return request.resource.data.createdAt is timestamp &&
             request.resource.data.updatedAt is timestamp;
    }

    // Orders - Read/Write solo per utenti autenticati
    match /orders/{orderId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && hasValidTimestamps();
      allow update: if isAuthenticated() && hasValidTimestamps();
      allow delete: if isAuthenticated();
    }

    // Expenses
    match /expenses/{expenseId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && hasValidTimestamps();
      allow update: if isAuthenticated() && hasValidTimestamps();
      allow delete: if isAuthenticated();
    }

    // Stock Movements
    match /stockMovements/{movementId} {
      allow read: if isAuthenticated();
      allow create: if isAuthenticated() && hasValidTimestamps();
      allow update: if isAuthenticated() && hasValidTimestamps();
      allow delete: if isAuthenticated();
    }

    // Articles Archive
    match /articlesArchive/{articleCode} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }

    // Customers Archive
    match /customersArchive/{customerCode} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }

    // Settings (solo read per tutti, write per admin)
    match /settings/{document=**} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }

    // Trash (soft delete)
    match /trash/{trashId} {
      allow read: if isAuthenticated();
      allow write: if isAuthenticated();
    }
  }
}
```

---

## Query Patterns Ottimizzate

### 1. Get Orders by Customer
```javascript
const q = query(
  collection(db, 'orders'),
  where('customer', '==', 'CLT001'),
  orderBy('date', 'desc'),
  limit(50)
);
```

### 2. Get Orders by Status
```javascript
const q = query(
  collection(db, 'orders'),
  where('status', 'in', ['Da Iniziare', 'In Svolgimento']),
  orderBy('date', 'desc')
);
```

### 3. Get Orders by Date Range
```javascript
const q = query(
  collection(db, 'orders'),
  where('date', '>=', startDate),
  where('date', '<=', endDate),
  orderBy('date', 'desc')
);
```

### 4. Get Stock Movements by Product
```javascript
const q = query(
  collection(db, 'stockMovements'),
  where('code', '==', '3077'),
  orderBy('date', 'desc')
);
```

### 5. Real-time Subscription (Live Updates)
```javascript
const unsubscribe = onSnapshot(
  collection(db, 'orders'),
  (snapshot) => {
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setOrders(orders);
  }
);
```

---

## Migrazi one Dati - Strategia

### Fase 1: Migrazione Iniziale (One-time)
```javascript
// Migrare localStorage → Firestore
// Mantenere localStorage come fallback
// Dual-write per sicurezza
```

### Fase 2: Periodo Transizione (1 settimana)
```javascript
// App funziona con Firestore
// localStorage = cache locale
// Backup giornaliero automatico
```

### Fase 3: Dismissione localStorage (dopo testing)
```javascript
// localStorage solo per cache temporanea
// Firestore = source of truth
// Cleanup vecchi dati
```

---

## Performance Best Practices

### ✅ DO
- Usa indici compositi per query complesse
- Limita results con `.limit()`
- Usa `.where()` prima di `.orderBy()`
- Batch writes (max 500 ops/batch)
- Offline persistence attiva

### ❌ DON'T
- Non fare query senza indici
- Non caricare collezioni intere
- Non usare `.orderBy()` su campi non indicizzati
- Non fare più di 10 write/sec da singolo client
- Non salvare file binari in Firestore (usa Storage)

---

## Costi Stimati

### Firebase Spark Plan (FREE)
- ✅ 1GB storage
- ✅ 10GB/month transfer
- ✅ 50K reads/day
- ✅ 20K writes/day
- ✅ 20K deletes/day

**Con dati attuali:**
- Storage: ~20KB = **0.002% del limite**
- Reads: ~100/day = **0.2% del limite**
- Writes: ~50/day = **0.25% del limite**

**Projection 1 anno:**
- Storage: ~2MB = **0.2% del limite**
- Reads: ~500/day = **1% del limite**
- **RIMANE GRATIS per anni**

### Upgrade a Blaze (Pay-as-you-go)
Solo se superi limiti FREE:
- $0.18/GB storage
- $0.12/GB transfer
- $0.06/100K reads
- $0.18/100K writes

**Costo stimato anno 1:** €0-5/mese

---

## Next Steps

1. ✅ Setup Firebase Project
2. ✅ Implementa configurazione
3. ✅ Crea collezioni vuote
4. ✅ Migra dati esistenti
5. ✅ Testa query performance
6. ✅ Deploy Security Rules
7. ✅ Monitora utilizzo
