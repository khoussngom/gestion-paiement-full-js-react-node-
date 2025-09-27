# 🏢 Application de Gestion des Salaires Multi-Entreprises

Une application web complète pour la gestion des salaires, cycles de paie, employés et paiements avec support multi-entreprises.

## 🎯 Fonctionnalités Principales

- **Gestion Multi-Entreprises** : Support de plusieurs entreprises avec rôles utilisateurs (Super-Admin, Admin, Caissier)
- **Gestion des Employés** : CRUD complet avec différents types de contrats (journalier, salaire fixe, honoraire)
- **Cycles de Paie** : Création et gestion des cycles avec statuts (brouillon, approuvé, clôturé)
- **Bulletins de Paie** : Génération automatique et gestion des bulletins
- **Paiements** : Enregistrement des paiements partiels/totaux avec génération de reçus
- **Dashboard KPI** : Indicateurs clés avec graphiques d'évolution
- **Filtrage Avancé** : Recherche et filtrage des employés par statut, poste, contrat
- **Activation/Désactivation** : Gestion des employés vacataires

## 🛠 Technologies Utilisées

### Backend
- **Node.js** avec TypeScript
- **Express.js** pour l'API REST
- **Prisma ORM** avec MySQL
- **Zod** pour la validation des données
- **JWT** pour l'authentification
- **bcrypt** pour le hashage des mots de passe

### Frontend (À développer)
- **React** avec Tailwind CSS
- **Chakra UI** (structure existante)

## 📋 Prérequis

- Node.js >= 18.0.0
- MySQL >= 8.0
- npm ou yarn

## 🚀 Installation et Configuration

### 1. Cloner le projet
```bash
git clone <repo-url>
cd "full js gestion salarier"
```

### 2. Configuration Backend

```bash
cd backend
npm install
```

### 3. Configuration de la Base de Données

1. Créer la base de données MySQL :
```sql
CREATE DATABASE gesSalarier CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Copier le fichier d'environnement :
```bash
cp .env.example .env
```

3. Modifier le fichier `.env` :
```env
DATABASE_URL="mysql://marakhib:Marakhib@127.0.0.1:3306/gesSalarier"
JWT_SECRET="votre-secret-jwt-super-securise-ici"
PORT=3001
NODE_ENV=development
FRONTEND_URL="http://localhost:3000"
```

### 4. Initialiser Prisma

```bash
# Générer le client Prisma
npm run prisma:generate

# Créer et appliquer les migrations
npm run prisma:migrate

# Initialiser avec des données de démonstration
npm run prisma:seed
```

### 5. Démarrer le serveur de développement

```bash
npm run dev
```

Le serveur sera accessible sur `http://localhost:3001`

## 📚 Structure du Projet

```
backend/
├── src/
│   ├── entities/           # Entités métier (Employe, Entreprise, etc.)
│   ├── enums/             # Énumérations et messages centralisés
│   ├── interfaces/        # Interfaces TypeScript
│   ├── middleware/        # Middlewares (auth, validation, etc.)
│   ├── repositories/      # Pattern Repository avec Prisma
│   ├── routes/           # Routes Express organisées par domaine
│   ├── services/         # Services métier (Dashboard, etc.)
│   ├── validators/       # Schémas de validation Zod
│   ├── prisma/          # Scripts Prisma (seed, etc.)
│   └── app.ts           # Point d'entrée de l'application
├── prisma/
│   └── schema.prisma    # Schéma de base de données
└── dist/               # Fichiers compilés
```

## 🔑 Comptes de Démonstration

Après le seed, vous aurez accès aux comptes suivants :

| Rôle | Email | Mot de passe | Description |
|------|-------|--------------|-------------|
| Super Admin | superadmin@gestionsalaires.sn | admin123 | Accès à toutes les entreprises |
| Admin Entreprise | admin@entreprise-demo.sn | admin123 | Gestion de l'entreprise démo |
| Caissier | caissier@entreprise-demo.sn | caissier123 | Gestion des paiements uniquement |

## 🛣 Routes API Principales

### Authentification
- `POST /api/auth/connexion` - Connexion utilisateur
- `POST /api/auth/inscription` - Inscription (Super-Admin uniquement)
- `GET /api/auth/profil` - Profil utilisateur connecté

### Employés
- `GET /api/employes` - Liste des employés avec filtres
- `POST /api/employes` - Créer un employé
- `PUT /api/employes/:id` - Modifier un employé
- `DELETE /api/employes/:id` - Supprimer un employé
- `PATCH /api/employes/:id/activer` - Activer un employé
- `PATCH /api/employes/:id/desactiver` - Désactiver un employé

### Dashboard
- `GET /api/dashboard` - Résumé complet du dashboard
- `GET /api/dashboard/kpi` - Indicateurs clés
- `GET /api/dashboard/evolution-masse-salariale` - Évolution sur 6 mois
- `GET /api/dashboard/prochains-paiements` - Paiements à effectuer

## 🎨 Exemples d'Utilisation

### Connexion
```bash
curl -X POST http://localhost:3001/api/auth/connexion \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@entreprise-demo.sn",
    "motDePasse": "admin123"
  }'
```

### Créer un employé
```bash
curl -X POST http://localhost:3001/api/employes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "nomComplet": "John DOE",
    "poste": "Développeur",
    "typeContrat": "SALAIRE_FIXE",
    "salaireFixe": 750000,
    "dateEmbauche": "2024-01-01"
  }'
```

### Obtenir les KPI
```bash
curl -X GET http://localhost:3001/api/dashboard/kpi \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔧 Scripts Disponibles

```bash
# Développement
npm run dev                 # Démarrer en mode développement
npm run build              # Compiler le TypeScript
npm start                  # Démarrer en production

# Base de données
npm run prisma:generate    # Générer le client Prisma
npm run prisma:migrate     # Créer et appliquer les migrations
npm run prisma:studio      # Interface web Prisma
npm run prisma:seed        # Initialiser avec des données de test
npm run prisma:reset       # Réinitialiser la base de données

# Utilitaires
npm run lint               # Linter le code
npm test                   # Lancer les tests
```

## 🏗 Architecture et Patterns

### Pattern Repository
Chaque entité a son repository qui encapsule les opérations de base de données :
```typescript
class EmployeRepository extends BasePrismaRepository {
  async obtenirParEntreprise(entrepriseId: string, filtres: FiltresEmployeDto): Promise<Employe[]>
  async creer(donnees: CreerEmployeDto): Promise<Employe>
  // ... autres méthodes
}
```

### Validation avec Zod
Toutes les entrées sont validées avec Zod :
```typescript
export const schemaCreerEmploye = z.object({
  nomComplet: z.string().min(1, MESSAGES_VALIDATION.NOM_REQUIS),
  typeContrat: z.nativeEnum(TypeContrat),
  // ... autres validations
});
```

### Messages Centralisés
Tous les messages sont centralisés dans des énumérations :
```typescript
export const MESSAGES_SUCCES = {
  EMPLOYE_CREE: 'Employé créé avec succès',
  // ... autres messages
};
```

## 🔒 Sécurité

- **JWT** pour l'authentification avec expiration
- **bcrypt** pour le hashage des mots de passe
- **Middleware RBAC** pour la gestion des permissions
- **Validation** stricte des données d'entrée
- **CORS** configuré pour le frontend

## 📊 Modèle de Données

### Entités Principales
- **Entreprise** : Informations de base, logo, devise, type de période
- **Utilisateur** : Comptes avec rôles (Super-Admin, Admin, Caissier)
- **Employe** : Données personnelles, type de contrat, salaires
- **CyclePaie** : Périodes de paie avec statuts
- **BulletinPaie** : Bulletins individuels avec calculs de salaire
- **Paiement** : Historique des paiements avec modes et références

### Relations
- Une entreprise a plusieurs utilisateurs et employés
- Un cycle de paie contient plusieurs bulletins
- Un bulletin peut avoir plusieurs paiements (paiements partiels)

## 🚧 Fonctionnalités à Développer

### Phase 2
- [ ] Génération de PDF (bulletins, reçus, listes)
- [ ] Gestion des entreprises (CRUD)
- [ ] Routes des cycles de paie
- [ ] Routes des bulletins de paie
- [ ] Routes des paiements
- [ ] Service de génération de documents

### Phase 3
- [ ] Interface React complète
- [ ] Notifications en temps réel
- [ ] Export Excel/CSV
- [ ] Intégration email
- [ ] Sauvegarde automatique

## 🐛 Débogage

### Logs de développement
Les logs sont affichés dans la console du serveur avec le format :
```
2024-09-26T10:30:00.000Z - POST /api/auth/connexion
```

### Prisma Studio
Pour explorer la base de données visuellement :
```bash
npm run prisma:studio
```

### Variables d'environnement de debug
```env
NODE_ENV=development
DEBUG=true
```

## 🤝 Contribution

1. Fork le projet
2. Créer une branche pour votre fonctionnalité (`git checkout -b feature/nouvelle-fonctionnalite`)
3. Commiter vos changements (`git commit -am 'Ajouter nouvelle fonctionnalité'`)
4. Pousser vers la branche (`git push origin feature/nouvelle-fonctionnalite`)
5. Créer une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🎯 Roadmap

- [x] ✅ Architecture backend avec TypeScript
- [x] ✅ Pattern Repository avec Prisma
- [x] ✅ Authentification JWT avec rôles
- [x] ✅ CRUD Employés avec filtres
- [x] ✅ Dashboard avec KPI
- [x] ✅ Gestion des cycles de paie
- [x] ✅ Messages centralisés en français
- [ ] 🚧 Interface React/Tailwind CSS
- [ ] 📋 Génération de PDF
- [ ] 🔔 Notifications et emails
- [ ] 📱 Application mobile (React Native)

---

**Développé avec ❤️ pour la digitalisation de la gestion des salaires en Afrique**
