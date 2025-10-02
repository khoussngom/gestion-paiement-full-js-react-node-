# 🏗️ Architecture du Système de Pointage

## Vue d'Ensemble du Système

```
┌─────────────────────────────────────────────────────────────────────┐
│                      SYSTÈME DE POINTAGE                             │
│                    (Attendance Tracking System)                      │
└─────────────────────────────────────────────────────────────────────┘

┌────────────────────┐         ┌────────────────────┐         ┌────────────────────┐
│   FRONTEND         │◄───────►│   BACKEND          │◄───────►│   DATABASE         │
│   (React + Chakra) │  HTTP   │   (Node + Express) │  Prisma │   (MySQL)          │
│                    │  JWT    │   (TypeScript)     │         │                    │
└────────────────────┘         └────────────────────┘         └────────────────────┘
```

---

## Architecture Détaillée par Couche

### 1️⃣ COUCHE PRÉSENTATION (Frontend)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND REACT                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐  │
│  │  QRScanner.jsx    │  │ AttendanceReport  │  │ EmployeeQRCode    │  │
│  │  ═════════════    │  │  ═══════════════  │  │  ════════════     │  │
│  │  [Rôle: VIGILE]   │  │  [Rôle: ADMIN]    │  │  [Rôle: ADMIN]    │  │
│  │                   │  │                   │  │                   │  │
│  │  • Camera scan    │  │  • Liste pointages│  │  • Afficher QR    │  │
│  │  • Html5-qrcode   │  │  • Filtres dates  │  │  • Générer QR     │  │
│  │  • Geolocation    │  │  • Statistiques   │  │  • Télécharger    │  │
│  │  • Toast feedback │  │  • Export CSV     │  │  • Régénérer      │  │
│  └───────────────────┘  └───────────────────┘  └───────────────────┘  │
│           │                      │                       │              │
│           └──────────────────────┴───────────────────────┘              │
│                                  │                                      │
│                    ┌─────────────▼──────────────┐                      │
│                    │  attendanceService.js       │                      │
│                    │  ═════════════════════      │                      │
│                    │  • scanQRCode()             │                      │
│                    │  • getAttendanceRecords()   │                      │
│                    │  • getStatistics()          │                      │
│                    │  • generateQRCode()         │                      │
│                    │  • 4 autres méthodes        │                      │
│                    └─────────────────────────────┘                      │
│                                  │                                      │
└──────────────────────────────────┼──────────────────────────────────────┘
                                   │
                            HTTP REST API
                          (JWT Authentication)
                                   │
┌──────────────────────────────────▼──────────────────────────────────────┐
│                          BACKEND NODE.JS                                 │
└──────────────────────────────────────────────────────────────────────────┘
```

### 2️⃣ COUCHE API (Backend Routes)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     API LAYER - Express Routes                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  POST   /api/pointages/scanner                                          │
│         ↓                                                                │
│         • Authentification JWT ✓                                        │
│         • Validation schéma Zod ✓                                       │
│         • Appel ServicePointage.enregistrerPointage()                   │
│         • Retour: { statut, employé, heure }                           │
│                                                                          │
│  GET    /api/pointages?dateDebut&dateFin&statut                        │
│         ↓                                                                │
│         • Authentification JWT ✓                                        │
│         • Filtres optionnels                                            │
│         • Appel ServicePointage.obtenirPointages()                     │
│         • Retour: [{ pointage, employé }]                              │
│                                                                          │
│  GET    /api/pointages/statistiques?dateDebut&dateFin                  │
│         ↓                                                                │
│         • Authentification JWT ✓                                        │
│         • Appel ServicePointage.obtenirStatistiques()                  │
│         • Retour: { total, présents, retards, absents, taux% }        │
│                                                                          │
│  POST   /api/pointages/generer-qr/:employeId                           │
│         ↓                                                                │
│         • Authentification JWT ✓                                        │
│         • Vérification propriété entreprise                             │
│         • Appel ServiceQRCode.genererCodeQR()                          │
│         • Mise à jour employé avec codeQR                               │
│         • Retour: { codeQR, imageQR }                                  │
│                                                                          │
│  [+ 4 autres endpoints...]                                              │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

### 3️⃣ COUCHE MÉTIER (Business Logic)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER - Services                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────┐    ┌──────────────────────────────┐  │
│  │  ServiceQRCode               │    │  ServicePointage             │  │
│  │  ═════════════               │    │  ═══════════════             │  │
│  │                              │    │                              │  │
│  │  genererCodeQR()             │    │  enregistrerPointage()       │  │
│  │  ────────────────            │    │  ─────────────────────       │  │
│  │  1. Créer token unique       │    │  1. Décoder QR (via Service) │  │
│  │  2. Format: entreprise:      │    │  2. Valider QR entreprise   │  │
│  │     employe:timestamp:token  │    │  3. Vérifier employé actif  │  │
│  │  3. Encoder en Base64        │    │  4. Check scan déjà fait    │  │
│  │  4. Return code              │    │  5. Calculer statut horaire │  │
│  │                              │    │     • ≤8:30 → PRESENT       │  │
│  │  genererImageQR()            │    │     • >8:30 → RETARD        │  │
│  │  ─────────────────           │    │  6. Créer pointage DB       │  │
│  │  1. Use qrcode library       │    │  7. Return résultat         │  │
│  │  2. Generate PNG data URL    │    │                              │  │
│  │  3. Return image             │    │  marquerAbsents()            │  │
│  │                              │    │  ────────────────            │  │
│  │  decoderCodeQR()             │    │  1. Liste employés actifs   │  │
│  │  ────────────────            │    │  2. Liste pointages du jour │  │
│  │  1. Decode Base64            │    │  3. Diff = absents          │  │
│  │  2. Split par ':'            │    │  4. Créer pointages ABSENT  │  │
│  │  3. Extract IDs              │    │                              │  │
│  │  4. Return object            │    │  obtenirStatistiques()       │  │
│  │                              │    │  ─────────────────────       │  │
│  │  validerCodeQR()             │    │  1. Count par statut        │  │
│  │  ────────────────            │    │  2. Calculer taux %         │  │
│  │  1. Decode QR                │    │  3. Return aggregation      │  │
│  │  2. Check entrepriseId       │    │                              │  │
│  │  3. Return boolean           │    │  [+ 2 autres méthodes]       │  │
│  │                              │    │                              │  │
│  └──────────────────────────────┘    └──────────────────────────────┘  │
│                │                                    │                    │
│                └────────────────┬───────────────────┘                    │
│                                 │                                        │
└─────────────────────────────────┼────────────────────────────────────────┘
                                  │
                          Uses Repository
                                  │
┌─────────────────────────────────▼────────────────────────────────────────┐
│                    DATA ACCESS LAYER - Repository                         │
└───────────────────────────────────────────────────────────────────────────┘
```

### 4️⃣ COUCHE ACCÈS DONNÉES (Data Access)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                 DATA ACCESS LAYER - PointageRepository                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  create(données)                                                         │
│  ───────────────                                                         │
│  → prisma.pointage.create({ data: données })                            │
│  ← Return: Pointage entity                                              │
│                                                                          │
│  getById(id)                                                             │
│  ────────────                                                            │
│  → prisma.pointage.findUnique({ where: { id }, include: { employe }})  │
│  ← Return: Pointage with employee                                       │
│                                                                          │
│  getByEmploye(employeId, dateDebut?, dateFin?)                         │
│  ───────────────────────────────────────────                            │
│  → prisma.pointage.findMany({ where: { employeId, date: {...} }})      │
│  ← Return: Array of Pointages                                           │
│                                                                          │
│  getByEntreprise(entrepriseId, dateDebut?, dateFin?)                   │
│  ─────────────────────────────────────────────────                      │
│  → prisma.pointage.findMany({                                           │
│      where: { entrepriseId, date: {...} },                             │
│      include: { employe }                                               │
│    })                                                                    │
│  ← Return: Array of Pointages with employees                            │
│                                                                          │
│  existePointageJour(employeId, date)                                    │
│  ────────────────────────────────────                                   │
│  → prisma.pointage.findFirst({ where: { employeId, date: today }})     │
│  ← Return: boolean                                                       │
│                                                                          │
│  compterParStatut(entrepriseId, dateDebut?, dateFin?)                  │
│  ──────────────────────────────────────────────────                     │
│  → prisma.pointage.count({ where: { entrepriseId, statut: ... }})      │
│  ← Return: { presents, retards, absents, total }                       │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
                                  │
                              Prisma ORM
                                  │
┌─────────────────────────────────▼────────────────────────────────────────┐
│                          DATABASE LAYER - MySQL                           │
└───────────────────────────────────────────────────────────────────────────┘
```

### 5️⃣ COUCHE BASE DE DONNÉES

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATABASE - MySQL                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  TABLE: pointages                                                        │
│  ════════════════                                                        │
│  ┌───────────────┬─────────────┬──────────────────────────────┐        │
│  │ Column        │ Type        │ Description                   │        │
│  ├───────────────┼─────────────┼──────────────────────────────┤        │
│  │ id            │ VARCHAR(25) │ Primary Key (CUID)           │        │
│  │ employeId     │ VARCHAR(25) │ FK → employes.id             │        │
│  │ entrepriseId  │ VARCHAR(25) │ FK → entreprises.id          │        │
│  │ datePointage  │ DATETIME    │ Date du pointage (00:00)     │        │
│  │ heurePointage │ DATETIME    │ Heure précise du scan        │        │
│  │ statut        │ ENUM        │ PRESENT/RETARD/ABSENT        │        │
│  │ latitude      │ VARCHAR     │ Position GPS (optionnel)     │        │
│  │ longitude     │ VARCHAR     │ Position GPS (optionnel)     │        │
│  │ notes         │ TEXT        │ Notes additionnelles         │        │
│  │ dateCreation  │ DATETIME    │ Timestamp de création        │        │
│  └───────────────┴─────────────┴──────────────────────────────┘        │
│                                                                          │
│  INDEXES:                                                                │
│  • PRIMARY: id                                                           │
│  • INDEX: (employeId, datePointage) ← Performance optimization         │
│  • FOREIGN KEY: employeId → employes(id)                               │
│  • FOREIGN KEY: entrepriseId → entreprises(id)                         │
│                                                                          │
│  ────────────────────────────────────────────────────────────          │
│                                                                          │
│  TABLE: employes (UPDATED)                                              │
│  ══════════════════════════                                             │
│  ┌───────────────┬─────────────┬──────────────────────────────┐        │
│  │ codeQR        │ VARCHAR(500)│ Code QR unique (Base64)      │        │
│  │               │ UNIQUE      │ Nullable                     │        │
│  └───────────────┴─────────────┴──────────────────────────────┘        │
│                                                                          │
│  RELATIONS:                                                              │
│  • employes.pointages ← pointages[]                                     │
│  • entreprises.pointages ← pointages[]                                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Flux de Données - Scan QR Code

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    WORKFLOW: Scanner un Code QR                          │
└──────────────────────────────────────────────────────────────────────────┘

   VIGILE                FRONTEND              BACKEND               DATABASE
     │                      │                      │                     │
     │  1. Ouvrir Scanner   │                      │                     │
     ├─────────────────────>│                      │                     │
     │                      │                      │                     │
     │  2. Clic "Scan"      │                      │                     │
     ├─────────────────────>│                      │                     │
     │                      │  3. Activer Camera   │                     │
     │                      │  (Html5-qrcode)      │                     │
     │                      │                      │                     │
     │  4. Scanner QR       │                      │                     │
     ├─────────────────────>│                      │                     │
     │                      │  5. Decoder QR       │                     │
     │                      │  (Frontend)          │                     │
     │                      │                      │                     │
     │                      │  6. Get Geolocation  │                     │
     │                      │  (Navigator API)     │                     │
     │                      │                      │                     │
     │                      │  7. POST /scanner    │                     │
     │                      │  {codeQR, lat, lon}  │                     │
     │                      ├─────────────────────>│                     │
     │                      │                      │  8. Verify JWT      │
     │                      │                      │  ✓ Valid            │
     │                      │                      │                     │
     │                      │                      │  9. Decode QR       │
     │                      │                      │  ServiceQRCode      │
     │                      │                      │  → Extract IDs      │
     │                      │                      │                     │
     │                      │                      │  10. Validate       │
     │                      │                      │  • QR entreprise ✓  │
     │                      │                      │  • Employé actif ✓  │
     │                      │                      │                     │
     │                      │                      │  11. Check Duplicate│
     │                      │                      ├────────────────────>│
     │                      │                      │  SELECT * WHERE     │
     │                      │                      │  employeId & today  │
     │                      │                      │<────────────────────┤
     │                      │                      │  No duplicate ✓     │
     │                      │                      │                     │
     │                      │                      │  12. Calculate Status│
     │                      │                      │  Time: 08:25        │
     │                      │                      │  → PRESENT ✓        │
     │                      │                      │                     │
     │                      │                      │  13. Create Record  │
     │                      │                      ├────────────────────>│
     │                      │                      │  INSERT pointage    │
     │                      │                      │<────────────────────┤
     │                      │                      │  Record created ✓   │
     │                      │                      │                     │
     │                      │  14. Response        │                     │
     │                      │  {statut: PRESENT,   │                     │
     │                      │   employe: {...}}    │                     │
     │                      │<─────────────────────┤                     │
     │                      │                      │                     │
     │  15. Show Success    │                      │                     │
     │  ✅ Fallou - Présent │                      │                     │
     │<─────────────────────┤                      │                     │
     │                      │                      │                     │

     Temps total: < 2 secondes
```

---

## Flux de Données - Rapport de Pointage

```
┌──────────────────────────────────────────────────────────────────────────┐
│                WORKFLOW: Consulter Rapport de Pointage                   │
└──────────────────────────────────────────────────────────────────────────┘

   ADMIN                 FRONTEND              BACKEND               DATABASE
     │                      │                      │                     │
     │  1. Ouvrir Rapport   │                      │                     │
     ├─────────────────────>│                      │                     │
     │                      │  2. Load Component   │                     │
     │                      │  useEffect()         │                     │
     │                      │                      │                     │
     │                      │  3. GET /pointages   │                     │
     │                      │  ?dateDebut&dateFin  │                     │
     │                      ├─────────────────────>│                     │
     │                      │                      │  4. Verify JWT ✓    │
     │                      │                      │                     │
     │                      │                      │  5. Query DB        │
     │                      │                      ├────────────────────>│
     │                      │                      │  SELECT * FROM      │
     │                      │                      │  pointages WHERE    │
     │                      │                      │  date BETWEEN       │
     │                      │                      │  JOIN employes      │
     │                      │                      │<────────────────────┤
     │                      │                      │  [pointages...]     │
     │                      │                      │                     │
     │                      │  6. GET /statistiques│                     │
     │                      ├─────────────────────>│                     │
     │                      │                      │  7. Query DB        │
     │                      │                      ├────────────────────>│
     │                      │                      │  SELECT COUNT(*)    │
     │                      │                      │  GROUP BY statut    │
     │                      │                      │<────────────────────┤
     │                      │                      │  {total, counts}    │
     │                      │                      │                     │
     │                      │  8. Calculate %      │                     │
     │                      │  ServicePointage     │                     │
     │                      │                      │                     │
     │                      │  9. Response         │                     │
     │                      │  [{pointages},       │                     │
     │                      │   {statistics}]      │                     │
     │                      │<─────────────────────┤                     │
     │                      │                      │                     │
     │  10. Display Report  │                      │                     │
     │  📊 Table + Stats    │                      │                     │
     │<─────────────────────┤                      │                     │
     │                      │                      │                     │
     │  11. Change Filters  │                      │                     │
     ├─────────────────────>│                      │                     │
     │                      │  12. Re-fetch        │                     │
     │                      │  (Repeat 3-9)        │                     │
     │                      │                      │                     │
     │  13. Click Export CSV│                      │                     │
     ├─────────────────────>│                      │                     │
     │                      │  14. Generate CSV    │                     │
     │                      │  (Frontend)          │                     │
     │                      │                      │                     │
     │  15. Download File   │                      │                     │
     │  💾 pointages.csv    │                      │                     │
     │<─────────────────────┤                      │                     │
     │                      │                      │                     │

     Temps de chargement: < 1 seconde
```

---

## Sécurité - Flux d'Authentification

```
┌──────────────────────────────────────────────────────────────────────────┐
│                    SECURITY: JWT Authentication                          │
└──────────────────────────────────────────────────────────────────────────┘

  CLIENT                    JWT MIDDLEWARE              DATABASE
    │                              │                        │
    │  1. Login                    │                        │
    │  POST /auth/login            │                        │
    │  {email, password}           │                        │
    ├─────────────────────────────>│                        │
    │                              │  2. Verify Credentials │
    │                              ├───────────────────────>│
    │                              │  SELECT user           │
    │                              │<───────────────────────┤
    │                              │  User found ✓          │
    │                              │                        │
    │                              │  3. Check Password     │
    │                              │  bcrypt.compare() ✓    │
    │                              │                        │
    │                              │  4. Generate JWT       │
    │                              │  jwt.sign({            │
    │                              │    userId,             │
    │                              │    entrepriseId,       │
    │                              │    role                │
    │                              │  })                    │
    │                              │                        │
    │  5. Return Token             │                        │
    │  {token: "eyJhbGci..."}      │                        │
    │<─────────────────────────────┤                        │
    │                              │                        │
    │  6. Store Token              │                        │
    │  localStorage.setItem()      │                        │
    │                              │                        │
    │  ──────────────────────────────────────────────────  │
    │                                                        │
    │  7. API Request              │                        │
    │  GET /pointages              │                        │
    │  Authorization: Bearer {...} │                        │
    ├─────────────────────────────>│                        │
    │                              │  8. Verify Token       │
    │                              │  jwt.verify(token) ✓   │
    │                              │                        │
    │                              │  9. Extract User       │
    │                              │  {userId,              │
    │                              │   entrepriseId,        │
    │                              │   role}                │
    │                              │                        │
    │                              │  10. Check Role        │
    │                              │  VIGILE/ADMIN ✓        │
    │                              │                        │
    │                              │  11. Process Request   │
    │                              │  [Business Logic]      │
    │                              │                        │
    │  12. Response                │                        │
    │  {data: [...]}               │                        │
    │<─────────────────────────────┤                        │
    │                              │                        │

  Token Expiration: 24 hours
  Token Algorithm: HS256
  Payload: {userId, entrepriseId, role, iat, exp}
```

---

## Diagramme de Déploiement

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT ARCHITECTURE                          │
└─────────────────────────────────────────────────────────────────────────┘

                    PRODUCTION ENVIRONMENT

    ┌───────────────────────────────────────────────────────┐
    │                   CLIENT DEVICES                       │
    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
    │  │  Browser    │  │  Mobile     │  │  Tablet     │  │
    │  │  (Chrome)   │  │  (Safari)   │  │  (Firefox)  │  │
    │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │
    └─────────┼─────────────────┼─────────────────┼─────────┘
              │                 │                 │
              └─────────────────┴─────────────────┘
                                │
                          HTTPS/443
                                │
    ┌───────────────────────────▼───────────────────────────┐
    │              NGINX REVERSE PROXY                       │
    │              (SSL Termination)                         │
    └───────────────────────────┬───────────────────────────┘
                                │
              ┌─────────────────┴─────────────────┐
              │                                   │
    ┌─────────▼──────────┐              ┌────────▼──────────┐
    │  FRONTEND SERVER   │              │  BACKEND SERVER   │
    │  Node.js + React   │              │  Node.js + Express│
    │  Port: 3000        │              │  Port: 3001       │
    │                    │              │                   │
    │  • Static Assets   │              │  • API REST       │
    │  • React App       │              │  • JWT Auth       │
    │  • QR Scanner UI   │              │  • QR Generation  │
    │  • Reports UI      │              │  • Business Logic │
    └────────────────────┘              └───────────┬───────┘
                                                    │
                                              Prisma ORM
                                                    │
                                        ┌───────────▼───────────┐
                                        │  DATABASE SERVER      │
                                        │  MySQL 8.0            │
                                        │  Port: 3306           │
                                        │                       │
                                        │  • Tables:            │
                                        │    - pointages        │
                                        │    - employes         │
                                        │    - entreprises      │
                                        │  • Indexes            │
                                        │  • Foreign Keys       │
                                        └───────────────────────┘

    ┌────────────────────────────────────────────────────────┐
    │              MONITORING & LOGGING                       │
    │  • Application Logs (Winston/Pino)                     │
    │  • Database Logs                                       │
    │  • Performance Metrics                                 │
    │  • Error Tracking (Sentry)                            │
    └────────────────────────────────────────────────────────┘
```

---

## Diagramme des États - Pointage

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    STATE DIAGRAM: Pointage Lifecycle                     │
└─────────────────────────────────────────────────────────────────────────┘

                          ┌──────────────┐
                          │   EMPLOYÉ    │
                          │  (pas de QR) │
                          └──────┬───────┘
                                 │
                       [Admin génère QR]
                                 │
                          ┌──────▼───────┐
                          │   EMPLOYÉ    │
                          │  (avec QR)   │
                          └──────┬───────┘
                                 │
                         [Nouveau jour]
                                 │
                    ┌────────────┼────────────┐
                    │                         │
              [Scan avant 8:30]        [Scan après 8:30]
                    │                         │
            ┌───────▼────────┐       ┌────────▼───────┐
            │   PRESENT 🟢   │       │   RETARD 🟠    │
            │   (08:25)      │       │   (09:15)      │
            └────────────────┘       └────────────────┘
                    │                         │
                    └────────────┬────────────┘
                                 │
                         [Fin de journée]
                                 │
                          ┌──────▼───────┐
                          │  Enregistré  │
                          │  en DB       │
                          └──────────────┘


                Alternative Path:

                          ┌──────────────┐
                          │   EMPLOYÉ    │
                          │  (avec QR)   │
                          └──────┬───────┘
                                 │
                         [Nouveau jour]
                                 │
                          [Pas de scan]
                                 │
                        [Automatique 16:05]
                                 │
                          ┌──────▼───────┐
                          │   ABSENT 🔴  │
                          │   (auto)     │
                          └──────┬───────┘
                                 │
                          [Enregistré DB]
                                 │
                          ┌──────▼───────┐
                          │  Archivé     │
                          └──────────────┘
```

---

## Diagramme de Performance

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    PERFORMANCE CHARACTERISTICS                           │
└─────────────────────────────────────────────────────────────────────────┘

    OPÉRATION                     TEMPS       OPTIMISATION
    ═════════════════════════════════════════════════════════

    Scan QR Code                  < 500ms     • Index DB (employeId)
    │                                         • JWT cache
    ├─ Decode QR                  ~10ms       • In-memory decode
    ├─ Validate                   ~50ms       • DB query optimized
    ├─ Check Duplicate            ~100ms      • Index (employeId, date)
    ├─ Create Record              ~200ms      • Single INSERT
    └─ Response                   ~100ms      • JSON serialization

    Générer QR Code               < 200ms     • QRCode library
    │                                         • Image cache possible
    ├─ Create Token               ~5ms        • Crypto random
    ├─ Generate Image             ~150ms      • PNG generation
    └─ Save to DB                 ~40ms       • UPDATE employe

    Load Statistics               < 1s        • Aggregation queries
    │                                         • Result caching
    ├─ Count PRESENT              ~100ms      • Index on statut
    ├─ Count RETARD               ~100ms      • Parallel queries
    ├─ Count ABSENT               ~100ms      • WHERE optimization
    ├─ Calculate %                ~10ms       • Math operations
    └─ Response                   ~50ms       • JSON format

    Load Report (100 records)     < 800ms     • Pagination
    │                                         • LIMIT/OFFSET
    ├─ Query pointages            ~300ms      • Index (entrepriseId)
    ├─ JOIN employes              ~200ms      • Foreign key index
    ├─ Filter & Sort              ~100ms      • DB-side operations
    └─ Response                   ~200ms      • Data transfer

    Export CSV (1000 records)     < 2s        • Stream processing
    │                                         • Memory efficient
    ├─ Query all records          ~500ms      • Batch query
    ├─ Format to CSV              ~800ms      • String operations
    └─ Download                   ~700ms      • File transfer

    DATABASE INDEXES:
    ═════════════════
    • PRIMARY KEY: id
    • INDEX: (employeId, datePointage)  ← Most important
    • INDEX: (entrepriseId, datePointage)
    • INDEX: (statut)
    • FOREIGN KEY: employeId
    • FOREIGN KEY: entrepriseId
```

---

**Architecture Version**: 1.0.0  
**Last Updated**: 2025-01-15  
**Status**: Production Ready ✅
