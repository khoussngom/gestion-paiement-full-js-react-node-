# Documentation Technique - Système de Pointage avec QR Codes

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture du système](#architecture-du-système)
3. [Base de données](#base-de-données)
4. [API REST](#api-rest)
5. [Frontend](#frontend)
6. [Sécurité](#sécurité)
7. [Installation et configuration](#installation-et-configuration)
8. [Guide d'utilisation](#guide-dutilisation)
9. [Maintenance et monitoring](#maintenance-et-monitoring)
10. [Extensions futures](#extensions-futures)

## Vue d'ensemble

Le système de pointage avec QR Codes permet la gestion automatisée de la présence des employés dans une entreprise. Chaque employé dispose d'un QR Code unique qu'il peut scanner pour justifier sa présence.

### Fonctionnalités principales

- **Génération de QR Codes uniques** pour chaque employé
- **Scan automatique** avec validation en temps réel
- **Gestion des horaires** : Présent (≤8h30), Retard (>8h30), Absent (aucun scan avant 16h)
- **Interface vigile dédiée** pour scanner les QR codes
- **Rapports et statistiques** détaillés
- **Export CSV** des données
- **Système de rôles** : ADMIN_ENTREPRISE, CAISSIER, VIGILE

## Architecture du système

### Stack technique

**Backend:**
- Node.js + Express.js
- TypeScript
- Prisma ORM
- MySQL
- JWT pour l'authentification
- QRCode library pour la génération

**Frontend:**
- React.js
- Chakra UI
- Camera API pour le scan
- Services API intégrés

### Diagramme d'architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Interface     │    │   API REST      │    │   Base de       │
│   Vigile        │◄──►│   Backend       │◄──►│   données       │
│   (Scan QR)     │    │   (Express)     │    │   (MySQL)       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
┌─────────────────┐           │
│   Interface     │           │
│   Admin/Rapports│◄──────────┘
│   (React)       │
└─────────────────┘
```

## Base de données

### Nouveau schéma Prisma

Deux nouvelles tables ont été ajoutées :

#### Table `QRCodeEmploye`

```prisma
model QRCodeEmploye {
  id                String    @id @default(cuid())
  employeId         String    @unique
  codeQR            String    @unique
  codeSecret        String
  dateGeneration    DateTime  @default(now())
  dateExpiration    DateTime?
  actif             Boolean   @default(true)
  nombreUtilisations Int      @default(0)
  derniereUtilisation DateTime?
  employe           Employe   @relation(fields: [employeId], references: [id], onDelete: Cascade)

  @@index([codeQR])
  @@index([employeId])
  @@map("qr_codes_employes")
}
```

#### Table `Pointage`

```prisma
model Pointage {
  id                String         @id @default(cuid())
  employeId         String
  entrepriseId      String
  date              DateTime       @db.Date
  heureArrivee      DateTime?
  heureSortie       DateTime?
  typePointage      TypePointage
  statutPresence    StatutPresence @default(PRESENT)
  tempsTraite       DateTime       @default(now())
  adresseIP         String?
  userAgent         String?
  notes             String?
  valideParVigile   Boolean        @default(false)
  vigileId          String?
  employe           Employe        @relation(fields: [employeId], references: [id])
  entreprise        Entreprise     @relation(fields: [entrepriseId], references: [id])
  vigile            Utilisateur?   @relation("PointagesValides", fields: [vigileId], references: [id])

  @@unique([employeId, date, typePointage])
  @@index([date])
  @@index([employeId])
  @@index([entrepriseId])
  @@index([statutPresence])
  @@map("pointages")
}
```

### Nouveaux énums

```prisma
enum StatutPresence {
  PRESENT
  RETARD
  ABSENT
  CONGE
  MALADIE
}

enum TypePointage {
  ENTREE
  SORTIE
}

enum RoleUtilisateur {
  SUPER_ADMIN
  ADMIN_ENTREPRISE
  CAISSIER
  VIGILE  // Nouveau rôle
}
```

## API REST

### Endpoints de pointage

#### QR Code Management

| Méthode | Endpoint | Description | Rôles autorisés |
|---------|----------|-------------|-----------------|
| POST | `/api/pointages/qr-code/generer` | Générer un QR Code | ADMIN_ENTREPRISE |
| GET | `/api/pointages/qr-code/:employeId` | Obtenir le QR Code d'un employé | ADMIN_ENTREPRISE, VIGILE |
| POST | `/api/pointages/qr-code/renouveler` | Renouveler un QR Code | ADMIN_ENTREPRISE |
| POST | `/api/pointages/qr-code/generer-tous` | Générer QR Codes pour tous | ADMIN_ENTREPRISE |

#### Pointage Operations

| Méthode | Endpoint | Description | Rôles autorisés |
|---------|----------|-------------|-----------------|
| POST | `/api/pointages/scanner` | Scanner un QR Code | VIGILE |
| GET | `/api/pointages` | Liste des pointages | ADMIN_ENTREPRISE |
| POST | `/api/pointages/manuel` | Pointage manuel | ADMIN_ENTREPRISE, VIGILE |
| PUT | `/api/pointages/:id/corriger` | Corriger un pointage | ADMIN_ENTREPRISE, VIGILE |

#### Reports & Statistics

| Méthode | Endpoint | Description | Rôles autorisés |
|---------|----------|-------------|-----------------|
| GET | `/api/pointages/statistiques` | Statistiques générales | ADMIN_ENTREPRISE |
| GET | `/api/pointages/rapport-employes` | Rapport par employé | ADMIN_ENTREPRISE |
| GET | `/api/pointages/presents` | Présents en temps réel | ADMIN_ENTREPRISE, VIGILE |
| GET | `/api/pointages/historique/:employeId` | Historique employé | ADMIN_ENTREPRISE |

#### Utilities

| Méthode | Endpoint | Description | Rôles autorisés |
|---------|----------|-------------|-----------------|
| POST | `/api/pointages/marquer-absents` | Marquer absents auto | ADMIN_ENTREPRISE |
| GET | `/api/pointages/export/csv` | Export CSV | ADMIN_ENTREPRISE |

### Exemples d'utilisation

#### Générer un QR Code

```bash
curl -X POST "http://localhost:3001/api/pointages/qr-code/generer" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "employeId": "employe_id_123",
    "dureeValidite": 365
  }'
```

Réponse :
```json
{
  "succes": true,
  "message": "QR Code généré avec succès",
  "donnees": {
    "qrCode": {
      "id": "qr_id_123",
      "employeId": "employe_id_123",
      "codeQR": "QR-EMPLOYE_ID_123-1696234567890-ABC123",
      "actif": true,
      "dateGeneration": "2024-10-02T10:30:00.000Z"
    },
    "qrCodeImage": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
  }
}
```

#### Scanner un QR Code

```bash
curl -X POST "http://localhost:3001/api/pointages/scanner" \
  -H "Authorization: Bearer VIGILE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "donneesQR": "{\"code\":\"QR-EMPLOYE_ID_123-1696234567890-ABC123\",\"secret\":\"SECRET123\",\"employeId\":\"employe_id_123\",\"timestamp\":1696234567890}",
    "notes": "Scan via interface vigile"
  }'
```

Réponse :
```json
{
  "succes": true,
  "message": "Entrée enregistrée - Présent",
  "donnees": {
    "pointage": {
      "id": "pointage_id_123",
      "employeId": "employe_id_123",
      "heureArrivee": "2024-10-02T08:15:00.000Z",
      "statutPresence": "PRESENT",
      "typePointage": "ENTREE"
    },
    "employe": {
      "id": "employe_id_123",
      "nomComplet": "Jean Dupont",
      "poste": "Développeur"
    }
  }
}
```

## Frontend

### Structure des composants

```
src/
├── views/
│   ├── vigile/
│   │   └── Scanner.js              # Interface vigile
│   └── admin/
│       └── pointage/
│           ├── Reports.js          # Rapports et statistiques
│           └── QRCodeManagement.js # Gestion des QR codes
├── services/
│   └── pointageService.js          # Service API pointage
└── components/
    └── modals/
        └── PointageModal.js        # Modal pointage manuel
```

### Service Frontend

Le service `pointageService.js` expose toutes les fonctions nécessaires :

```javascript
// Génération QR Code
await pointageService.genererQRCode(employeId, dureeValidite);

// Scan QR Code (vigile)
await pointageService.scanQRCode(donneesQR, notes);

// Rapports
await pointageService.obtenirStatistiques(periode);
await pointageService.obtenirRapportEmployes(periode);

// Export
await pointageService.exporterCSV(periode);
```

### Interface Vigile

L'interface vigile (`/src/views/vigile/Scanner.js`) utilise la **Camera API** pour scanner les QR codes en temps réel :

- **Accès caméra** avec gestion des permissions
- **Scan continu** toutes les 500ms
- **Validation instantanée** des QR codes
- **Affichage des résultats** en temps réel
- **Support mobile** avec caméra arrière

### Interface Administrateur

Plusieurs interfaces pour la gestion :

1. **QRCodeManagement.js** : Génération et gestion des QR codes
2. **Reports.js** : Statistiques et rapports détaillés
3. **Intégration** dans les vues employés pour afficher les QR codes

## Sécurité

### Authentification et autorisation

- **JWT tokens** avec expiration
- **Rôles spécifiques** pour chaque endpoint
- **Validation des entreprises** (utilisateur ne peut voir que ses données)

### Sécurité des QR Codes

- **Code secret** intégré dans chaque QR code
- **Limitation d'usage** (max 50 utilisations/jour)
- **Expiration optionnelle** des codes
- **Validation d'intégrité** à chaque scan
- **Audit trail** complet (IP, User-Agent, vigile)

### Validation des données

- **Schémas de validation** Prisma
- **Contrôles métier** dans les services
- **Sanitisation** des entrées utilisateur

## Installation et configuration

### Prérequis

```bash
# Backend dependencies
npm install qrcode @types/qrcode

# Frontend dependencies (si nécessaire)
npm install react-qr-reader jsqr
```

### Migration base de données

```bash
# Générer et appliquer la migration
cd backend
npx prisma migrate dev --name add_pointage_system
npx prisma generate
```

### Configuration

Aucune configuration supplémentaire requise. Le système utilise les mêmes variables d'environnement existantes.

### Déploiement

1. **Backend** : Déployer avec les nouveaux endpoints
2. **Frontend** : Build avec les nouveaux composants
3. **Base de données** : Appliquer les migrations

## Guide d'utilisation

### 1. Configuration initiale

1. **Créer un utilisateur vigile** :
```bash
curl -X POST "http://localhost:3001/api/utilisateurs" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "nom": "Vigile",
    "prenom": "Sécurité",
    "email": "vigile@entreprise.com",
    "motDePasse": "motdepasse123",
    "role": "VIGILE"
  }'
```

2. **Générer les QR codes** pour tous les employés via l'interface admin

### 2. Utilisation quotidienne

#### Pour le vigile :
1. Se connecter avec le compte vigile
2. Aller sur l'interface scanner (`/vigile/scanner`)
3. Démarrer la caméra
4. Scanner les QR codes des employés

#### Pour l'administrateur :
1. Consulter les rapports (`/admin/pointage/reports`)
2. Gérer les QR codes (`/admin/pointage/qr-management`)
3. Exporter les données si nécessaire

### 3. Processus automatiques

#### Marquage des absents
Processus automatique à 16h00 pour marquer les employés sans pointage comme absents :

```bash
# Via API (peut être automatisé avec un cron job)
curl -X POST "http://localhost:3001/api/pointages/marquer-absents" \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Maintenance et monitoring

### Surveillance

1. **Logs d'accès** : Tous les scans sont tracés avec IP, User-Agent, vigile
2. **Métriques** : Nombre de scans par jour, taux d'erreur
3. **Alertes** : QR codes compromis, utilisation excessive

### Maintenance préventive

1. **Nettoyage des QR codes expirés** (automatique)
2. **Renouvellement périodique** des codes (recommandé tous les 6 mois)
3. **Sauvegarde** des données de pointage

### Dépannage courant

#### QR Code invalide
- Vérifier l'expiration du code
- Régénérer si nécessaire
- Vérifier les permissions de l'employé

#### Problème caméra
- Vérifier les permissions navigateur
- Tester avec différents navigateurs
- Utiliser HTTPS en production

## Extensions futures

### Améliorations prévues

1. **Notifications push** en cas de retard
2. **Géolocalisation** pour valider le lieu de pointage
3. **Reconnaissance faciale** en complément du QR code
4. **API mobile** pour application dédiée
5. **Intégration calendrier** pour gérer les congés
6. **Rapports avancés** avec graphiques
7. **Système d'alertes** configurables

### Intégration avec la paie

Le système calcule déjà les heures travaillées. Extension possible :
- Calcul automatique des heures supplémentaires
- Intégration avec les bulletins de paie
- Gestion des primes de présence

### APIs additionnelles

```javascript
// Future: API mobile
GET /api/pointages/mobile/qr/:employeId
POST /api/pointages/mobile/scan

// Future: API notifications
POST /api/pointages/notifications/setup
GET /api/pointages/notifications/history
```

## Support et ressources

### Documentation API complète
- Swagger/OpenAPI disponible à `/api/docs`
- Exemples Postman inclus

### Tests
```bash
# Tests unitaires
npm run test

# Tests d'intégration
npm run test:integration
```

### Contacts
- **Équipe technique** : tech@entreprise.com
- **Support utilisateur** : support@entreprise.com

---

*Documentation mise à jour le 2 octobre 2025*
*Version du système : 2.0.0 - Pointage QR Codes*