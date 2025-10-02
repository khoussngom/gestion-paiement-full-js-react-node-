# 📋 Documentation: Système de Gestion des Pointages

## 🎯 Vue d'ensemble

Ce système permet de gérer les pointages des employés via des codes QR uniques. Il enregistre automatiquement la présence, les retards et les absences selon des règles horaires précises.

## 📊 Règles de Pointage

### Horaires et Statuts

| Heure de scan | Statut | Description |
|---------------|--------|-------------|
| ≤ 08:30 | **PRESENT** | Employé à l'heure |
| > 08:30 | **RETARD** | Employé en retard |
| Pas de scan avant 16:00 | **ABSENT** | Marqué automatiquement comme absent |

### Logique Automatique

1. **Scan avant ou à 8h30** → L'employé est marqué comme **Présent**
2. **Scan après 8h30** → L'employé est marqué comme **En Retard**
3. **Aucun scan avant 16h00** → L'employé est automatiquement marqué comme **Absent**

## 🔐 Sécurité et Validation

### Génération des Codes QR

Chaque code QR est unique et contient:
- **ID de l'entreprise**: Garantit que le code est valide uniquement pour l'entreprise concernée
- **ID de l'employé**: Identifie l'employé de manière unique
- **Timestamp**: Date/heure de génération pour traçabilité
- **Token aléatoire**: 16 bytes pour empêcher la duplication

**Format du code QR**:
```
Base64(entrepriseId:employeId:timestamp:randomToken)
```

### Validation des Scans

- ✅ Vérification que le code QR appartient à l'entreprise
- ✅ Vérification que l'employé existe et est actif
- ✅ Empêche les scans multiples le même jour
- ✅ Enregistrement de la géolocalisation (optionnel)
- ✅ Validation du format du code QR

### Sécurité des Données

- 🔒 Authentification JWT requise pour toutes les API
- 🔒 Codes QR uniques et non réutilisables
- 🔒 Validation côté serveur de tous les scans
- 🔒 Géolocalisation pour prévenir la fraude
- 🔒 Isolation des données par entreprise

## 👥 Rôles et Permissions

### VIGILE (Garde)
**Permissions**:
- ✅ Scanner les codes QR des employés
- ✅ Voir le résultat immédiat du scan (Présent/Retard)
- ❌ Accès aux rapports et statistiques
- ❌ Modification des données

**Interface dédiée**: Scanner de codes QR uniquement

### ADMIN_ENTREPRISE
**Permissions**:
- ✅ Consulter tous les rapports de pointage
- ✅ Voir les statistiques de présence
- ✅ Générer les codes QR pour les employés
- ✅ Marquer les absents manuellement
- ✅ Exporter les données

### SUPER_ADMIN
**Permissions**:
- ✅ Toutes les permissions ADMIN_ENTREPRISE
- ✅ Gestion multi-entreprises
- ✅ Configuration système

## 🔧 Architecture Technique

### Backend (Node.js + TypeScript)

#### Services

**ServiceQRCode**
```typescript
// Génération de code QR unique
genererCodeQR(employeId: string, entrepriseId: string): Promise<string>

// Génération de l'image QR (Data URL)
genererImageQR(codeQR: string): Promise<string>

// Décodage du code QR
decoderCodeQR(codeQR: string): { employeId, entrepriseId, timestamp }

// Validation du code QR
validerCodeQR(codeQR: string, entrepriseId: string): boolean
```

**ServicePointage**
```typescript
// Enregistrer un pointage
enregistrerPointage(codeQR: string, entrepriseId: string, latitude?: string, longitude?: string)

// Marquer les absents après 16h
marquerAbsents(entrepriseId: string)

// Obtenir les pointages avec filtres
obtenirPointages(entrepriseId: string, filtres?: {...})

// Statistiques de pointage
obtenirStatistiques(entrepriseId: string, dateDebut?: Date, dateFin?: Date)

// Rapport par employé
obtenirRapportParEmploye(entrepriseId: string, dateDebut?: Date, dateFin?: Date)
```

#### API REST Endpoints

| Méthode | Endpoint | Description | Rôle requis |
|---------|----------|-------------|-------------|
| POST | `/api/pointages/scanner` | Scanner un code QR | VIGILE, ADMIN |
| GET | `/api/pointages` | Liste des pointages | ADMIN |
| GET | `/api/pointages/statistiques` | Statistiques globales | ADMIN |
| GET | `/api/pointages/rapport-employes` | Rapport par employé | ADMIN |
| POST | `/api/pointages/marquer-absents` | Marquer les absents | ADMIN |
| POST | `/api/pointages/generer-qr/:employeId` | Générer code QR | ADMIN |
| GET | `/api/pointages/qr/:employeId` | Obtenir code QR | ADMIN |
| GET | `/api/pointages/employe/:employeId` | Historique employé | ADMIN |

### Frontend (React + Chakra UI)

#### Components

**QRScanner.jsx** (Pour le rôle VIGILE)
- Scanner de codes QR en temps réel
- Affichage immédiat du résultat (Présent/Retard)
- Feedback visuel avec couleurs et icônes
- Support de la géolocalisation

**AttendanceReport.jsx** (Pour les rôles ADMIN)
- Liste complète des pointages
- Filtres: date, employé, statut
- Statistiques visuelles
- Export de données

**AttendanceStatistics.jsx**
- Graphiques de présence
- Taux de présence/retard/absence
- Tendances sur période

**EmployeeQRCode.jsx**
- Affichage du code QR de l'employé
- Génération/régénération de code
- Téléchargement de l'image QR

### Base de Données (Prisma + MySQL)

#### Modèle Pointage

```prisma
model Pointage {
  id                String         @id @default(cuid())
  employeId         String
  entrepriseId      String
  datePointage      DateTime       @default(now())
  heurePointage     DateTime       @default(now())
  statut            StatutPointage
  latitude          String?
  longitude         String?
  notes             String?
  dateCreation      DateTime       @default(now())
  employe           Employe        @relation(fields: [employeId], references: [id])
  entreprise        Entreprise     @relation(fields: [entrepriseId], references: [id])

  @@index([employeId, datePointage])
  @@map("pointages")
}
```

#### Ajout au modèle Employe

```prisma
model Employe {
  // ... autres champs
  codeQR            String?        @unique
  pointages         Pointage[]
}
```

## 📱 Intégration

### Installation des Dépendances

**Backend**:
```bash
npm install qrcode @types/qrcode
```

**Frontend**:
```bash
npm install html5-qrcode qrcode.react
```

### Configuration

1. **Ajouter le rôle VIGILE** dans les enums
2. **Exécuter les migrations Prisma**:
   ```bash
   npx prisma migrate dev --name add_attendance_tracking
   ```
3. **Générer le client Prisma**:
   ```bash
   npx prisma generate
   ```

### Génération des Codes QR pour les Employés Existants

```javascript
// Script de génération
const employeService = new EmployeService();
const qrService = new ServiceQRCode();

const employes = await prisma.employe.findMany();

for (const employe of employes) {
  const codeQR = await qrService.genererCodeQR(employe.id, employe.entrepriseId);
  await prisma.employe.update({
    where: { id: employe.id },
    data: { codeQR }
  });
}
```

## 🎯 Workflow Type

### Pour le Vigile

1. Ouvrir l'interface Scanner
2. Cliquer sur "Démarrer le scan"
3. Scanner le code QR de l'employé
4. Voir le résultat immédiatement (Présent/Retard)
5. Répéter pour chaque employé

### Pour l'Administrateur

1. **Générer les codes QR** pour tous les employés
2. **Distribuer les codes** aux employés (impression, email, etc.)
3. **Consulter les rapports** en temps réel
4. **Exécuter le marquage des absents** après 16h00

### Tâches Automatiques

**Cron Job recommandé** (après 16h00):
```javascript
// Marquer automatiquement les absents chaque jour à 16h05
const cron = require('node-cron');

cron.schedule('5 16 * * *', async () => {
  const entreprises = await prisma.entreprise.findMany({ where: { actif: true } });
  
  for (const entreprise of entreprises) {
    await servicePointage.marquerAbsents(entreprise.id);
  }
});
```

## 📊 Exemples d'API

### Scanner un Code QR

```javascript
POST /api/pointages/scanner
Headers: { Authorization: Bearer <token> }
Body: {
  "codeQR": "Y21nNHdoNmd2MDAwMHJ5cnBwa3VmMWlqdzo...",
  "latitude": "14.6928",
  "longitude": "-17.4467"
}

Response: {
  "succes": true,
  "message": "Pointage enregistré avec succès",
  "donnees": {
    "id": "clxxx...",
    "employeId": "clyyy...",
    "statut": "PRESENT",
    "heurePointage": "2024-01-15T08:25:00Z",
    "employe": {
      "nomComplet": "Fallou Senghor",
      "poste": "Coach"
    }
  }
}
```

### Obtenir les Statistiques

```javascript
GET /api/pointages/statistiques?dateDebut=2024-01-01&dateFin=2024-01-31

Response: {
  "succes": true,
  "donnees": {
    "total": 450,
    "presents": 380,
    "retards": 45,
    "absents": 25,
    "tauxPresence": 84.44,
    "tauxRetard": 10.00,
    "tauxAbsence": 5.56
  }
}
```

## 🔮 Extensions Futures

### Alertes et Notifications

```javascript
// À intégrer plus tard
if (statut === 'RETARD') {
  await notificationService.envoyerAlerte({
    type: 'RETARD',
    employeId,
    destinataires: ['admin@entreprise.com'],
    message: `${employe.nomComplet} est en retard`
  });
}
```

### Intégration Mobile

- Application mobile pour les employés
- Push notifications
- Scan QR depuis l'application mobile

### Analytics Avancés

- Prédiction des absences
- Patterns de retards
- Recommandations d'optimisation

### Intégration Paie

```javascript
// Calcul automatique des jours travaillés
const joursTravailles = await pointageRepo.compterPresences(
  employeId,
  dateDebut,
  dateFin
);

// Utiliser dans le calcul de paie
const salaire = calculerSalaire(employe, joursTravailles);
```

## 🐛 Gestion des Erreurs

### Erreurs Communes

| Code | Message | Solution |
|------|---------|----------|
| 400 | Code QR invalide | Régénérer le code QR |
| 400 | Pointage déjà effectué | Un seul pointage par jour |
| 404 | Employé non trouvé | Vérifier l'ID employé |
| 403 | Entreprise non autorisée | Vérifier les permissions |

## 📝 Bonnes Pratiques

1. **Générer les codes QR** lors de la création d'un employé
2. **Sauvegarder les codes** de manière sécurisée
3. **Exécuter le marquage des absents** automatiquement chaque jour
4. **Vérifier les permissions** avant chaque opération
5. **Logger toutes les actions** pour l'audit
6. **Tester la géolocalisation** dans l'environnement de production

## 🔍 Tests

### Tests Unitaires

```javascript
describe('ServicePointage', () => {
  it('should mark employee as present before 8:30', async () => {
    // Test présence
  });
  
  it('should mark employee as late after 8:30', async () => {
    // Test retard
  });
  
  it('should prevent multiple scans same day', async () => {
    // Test scan unique
  });
});
```

## 📞 Support

Pour toute question ou problème:
- Documentation: `/ATTENDANCE_DOCUMENTATION.md`
- Code: Voir les commentaires dans les fichiers source
- API: Tester avec Postman ou curl

---

**Version**: 1.0.0  
**Date**: 2025-01-15  
**Auteur**: Système de Gestion des Salaires
