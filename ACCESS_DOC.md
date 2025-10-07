# Documentation Technique - Système d'Autorisation d'Accès SuperAdmin

## 📋 Vue d'ensemble

Ce système permet aux administrateurs d'entreprise d'accorder temporairement l'accès au SuperAdmin pour effectuer des opérations de support, d'audit ou de maintenance sur leur interface. Le SuperAdmin peut ainsi intervenir sur l'interface d'une entreprise uniquement après autorisation explicite et pour une durée limitée.

## 🏗️ Architecture du Système

### Modèle de Données

#### Table `autorisations_acces`
```sql
CREATE TABLE autorisations_acces (
    id VARCHAR(191) PRIMARY KEY,
    entreprise_id VARCHAR(191) NOT NULL,
    super_admin_id VARCHAR(191) NOT NULL,
    admin_id VARCHAR(191) NOT NULL,
    date_creation DATETIME(3) DEFAULT CURRENT_TIMESTAMP(3),
    date_expiration DATETIME(3) NOT NULL,
    est_actif BOOLEAN DEFAULT true,
    raison_acces TEXT,
    date_desactivation DATETIME(3),
    
    FOREIGN KEY (entreprise_id) REFERENCES entreprises(id) ON DELETE CASCADE,
    FOREIGN KEY (super_admin_id) REFERENCES utilisateurs(id),
    FOREIGN KEY (admin_id) REFERENCES utilisateurs(id),
    
    INDEX idx_entreprise_id (entreprise_id),
    INDEX idx_super_admin_id (super_admin_id),
    INDEX idx_admin_id (admin_id),
    INDEX idx_date_expiration (date_expiration),
    INDEX idx_est_actif (est_actif)
);
```

### Entité AutorisationAcces
- **id** : Identifiant unique
- **entrepriseId** : ID de l'entreprise concernée
- **superAdminId** : ID du SuperAdmin autorisé
- **adminId** : ID de l'admin qui accorde l'accès
- **dateCreation** : Date de création de l'autorisation
- **dateExpiration** : Date d'expiration automatique
- **estActif** : Statut actif/inactif
- **raisonAcces** : Motif de la demande d'accès
- **dateDesactivation** : Date de désactivation manuelle

## 🔐 Gestion des Rôles et Permissions

### Rôles Impliqués

#### 1. SuperAdmin (`SUPER_ADMIN`)
- **Droits par défaut** : Accès global au système mais PAS aux interfaces d'entreprise
- **Avec autorisation** : Accès temporaire à l'interface d'une entreprise spécifique
- **Actions autorisées** :
  - Consulter ses autorisations actives
  - Prolonger ses autorisations (si pas encore expirées)
  - Révoquer ses propres autorisations
  - Nettoyer les autorisations expirées (maintenance)
  - Consulter les statistiques globales

#### 2. Admin d'Entreprise (`ADMIN_ENTREPRISE`)
- **Droits** : Gestion complète de son entreprise
- **Actions autorisées** :
  - Accorder l'accès au SuperAdmin pour son entreprise
  - Consulter les autorisations qu'il a accordées
  - Révoquer les autorisations qu'il a accordées
  - Prolonger les autorisations qu'il a accordées

#### 3. Autres Rôles (`CAISSIER`, `VIGILE`)
- **Droits** : Accès uniquement aux données de leur entreprise
- **Restrictions** : Aucun accès aux fonctionnalités d'autorisation

## 🛠️ Composants Backend

### 1. Repository (`AutorisationAccesRepository`)
```typescript
class AutorisationAccesRepository extends BasePrismaRepository {
  // Méthodes principales
  async creer(autorisation: AutorisationAcces): Promise<AutorisationAcces>
  async verifierAcces(superAdminId: string, entrepriseId: string): Promise<AutorisationAcces | null>
  async obtenirAutorisationsActives(superAdminId: string): Promise<AutorisationAcces[]>
  async desactiver(id: string): Promise<AutorisationAcces | null>
  async nettoyerAutorisationsExpirees(): Promise<number>
}
```

### 2. Service (`ServiceAutorisationAcces`)
```typescript
class ServiceAutorisationAcces {
  // Logique métier principale
  async accorderAcces(data: AccorderAccesDto): Promise<ResultatService<AutorisationAcces>>
  async verifierAcces(superAdminId: string, entrepriseId: string): Promise<ResultatService>
  async revoquerAcces(autorisationId: string, utilisateurId: string): Promise<ResultatService>
  async prolongerAutorisation(autorisationId: string, heuresSupplementaires: number): Promise<ResultatService>
}
```

### 3. Contrôleur (`AutorisationAccesController`)
Gère les endpoints HTTP et la validation des requêtes.

### 4. Middleware (`middlewareAutorisationEntreprise`)
```typescript
// Vérifie automatiquement les autorisations sur les routes sensibles
async function middlewareAutorisationEntreprise(req, res, next)
```

## 🌐 API Endpoints

### Routes d'Autorisation (`/api/autorisations`)

| Méthode | Endpoint | Description | Accès |
|---------|----------|-------------|-------|
| POST | `/accorder` | Accorde un accès temporaire | Admin d'entreprise |
| GET | `/verification/:entrepriseId` | Vérifie un accès | SuperAdmin |
| DELETE | `/:autorisationId/revoquer` | Révoque un accès | Admin ou SuperAdmin |
| GET | `/mes-autorisations` | Liste ses autorisations | Admin ou SuperAdmin |
| GET | `/entreprise/:entrepriseId` | Autorisations d'une entreprise | Admin ou SuperAdmin |
| GET | `/statistiques` | Statistiques globales | SuperAdmin |
| PUT | `/:autorisationId/prolonger` | Prolonge une autorisation | Admin ou SuperAdmin |
| POST | `/nettoyer-expirees` | Nettoyage maintenance | SuperAdmin |

### Exemples de Requêtes

#### Accorder un accès
```javascript
POST /api/autorisations/accorder
{
  \"dureeHeures\": 24,
  \"raisonAcces\": \"Support technique urgent\"
}
```

#### Vérifier un accès
```javascript
GET /api/autorisations/verification/entreprise-123
// Réponse
{
  \"succes\": true,
  \"donnees\": {
    \"aAcces\": true,
    \"message\": \"Accès autorisé - 18h 32m restantes\",
    \"autorisation\": { ... }
  }
}
```

## 🎨 Composants Frontend

### 1. Composant `DonnerAccesSuperAdmin`
**Localisation** : `frontend/src/components/access/DonnerAccesSuperAdmin.js`

**Usage** :
```javascript
import DonnerAccesSuperAdmin from '../components/access/DonnerAccesSuperAdmin';

<DonnerAccesSuperAdmin 
  onAccesAccorde={(autorisation) => console.log('Accès accordé:', autorisation)}
  buttonText=\"Donner accès support\"
  colorScheme=\"orange\"
/>
```

**Fonctionnalités** :
- Modal de configuration avec durée et raison
- Validation des champs
- Feedback utilisateur avec toasts
- Options de durée prédéfinies (1h à 1 semaine)

### 2. Page `GestionAccesSuperAdmin`
**Localisation** : `frontend/src/views/admin/access/GestionAccesSuperAdmin.js`

**Fonctionnalités** :
- Dashboard avec statistiques
- Liste des autorisations actives
- Actions : prolonger, révoquer
- Nettoyage des autorisations expirées
- Indicateurs visuels (badges de statut)

### 3. Service `autorisationService`
**Localisation** : `frontend/src/services/autorisationService.js`

**Méthodes disponibles** :
```javascript
autorisationService.accorderAcces(dureeHeures, raisonAcces)
autorisationService.verifierAcces(entrepriseId)
autorisationService.revoquerAcces(autorisationId)
autorisationService.obtenirMesAutorisations()
autorisationService.prolongerAutorisation(autorisationId, heuresSupplementaires)
```

## 🔒 Sécurité et Contrôles

### Validations Backend
1. **Authentification** : JWT obligatoire sur toutes les routes
2. **Autorisation par rôle** : Vérification du rôle utilisateur
3. **Validation des données** : Contrôle des paramètres d'entrée
4. **Expiration automatique** : Système de timeout intégré
5. **Traçabilité** : Logs détaillés de toutes les actions

### Contrôles d'Accès
```typescript
// Exemple de vérification d'accès
if (utilisateur.role === RoleUtilisateur.SUPER_ADMIN) {
  const verification = await verifierAcces(utilisateur.id, entrepriseId);
  if (!verification.aAcces) {
    return res.status(403).json({ message: \"Accès refusé\" });
  }
}
```

### Middleware de Protection
Le middleware `middlewareAutorisationEntreprise` peut être appliqué sur n'importe quelle route :

```typescript
// Protection automatique
router.get('/entreprises/:entrepriseId/dashboard', 
  middlewareAutorisationEntreprise,
  dashboardController.getStats
);
```

## 📊 Gestion et Maintenance

### Expiration Automatique
- Les autorisations expirent automatiquement selon la durée définie
- Vérification en temps réel lors de chaque requête
- Indicateurs visuels (\"expire bientôt\") 24h avant expiration

### Nettoyage Automatique
```typescript
// Supprimer les autorisations :
// - Expirées depuis plus de 30 jours
// - Désactivées depuis plus de 7 jours
await serviceAutorisation.nettoyerAutorisationsExpirees();
```

### Statistiques et Monitoring
- Nombre total d'autorisations
- Autorisations actives/expirées/désactivées
- Nombre d'entreprises avec accès accordé
- Historique des actions

## 🚀 Intégration dans l'Application

### Ajout du Bouton dans une Page Admin
```javascript
// Dans n'importe quelle page admin d'entreprise
import DonnerAccesSuperAdmin from '../components/access/DonnerAccesSuperAdmin';

function PageAdmin() {
  return (
    <Box>
      {/* Contenu de la page */}
      <DonnerAccesSuperAdmin 
        onAccesAccorde={handleAccesAccorde}
      />
    </Box>
  );
}
```

### Ajout de la Route SuperAdmin
```javascript
// Dans le système de routing
import GestionAccesSuperAdmin from '../views/admin/access/GestionAccesSuperAdmin';

// Route accessible uniquement au SuperAdmin
{
  path: \"/admin/access-management\",
  component: GestionAccesSuperAdmin,
  requiresAuth: true,
  requiredRole: \"SUPER_ADMIN\"
}
```

### Protection des Routes Sensibles
```typescript
// Backend - Protection d'une route entreprise
router.get('/entreprises/:entrepriseId/sensitive-data',
  authentification,
  middlewareAccesEntreprise,
  getSensitiveDataController
);
```

## ⚠️ Bonnes Pratiques

### Côté Admin d'Entreprise
1. **Durée minimale** : Ne pas accorder plus de temps que nécessaire
2. **Justification** : Toujours préciser la raison de l'accès
3. **Révocation rapide** : Révoquer dès que l'intervention est terminée
4. **Communication** : Informer le SuperAdmin des actions à effectuer

### Côté SuperAdmin
1. **Usage responsable** : N'utiliser l'accès que pour les actions autorisées
2. **Documentation** : Noter les modifications effectuées
3. **Durée limitée** : Ne pas prolonger inutilement les autorisations
4. **Confidentialité** : Respecter la confidentialité des données

### Côté Développeur
1. **Middleware** : Utiliser les middlewares sur toutes les routes sensibles
2. **Logs** : Maintenir une traçabilité complète
3. **Tests** : Tester tous les scénarios d'autorisation
4. **Performance** : Optimiser les requêtes de vérification

## 🧪 Tests et Validation

### Scénarios de Test
1. **Accord d'accès** : Admin accorde accès avec différentes durées
2. **Vérification** : SuperAdmin accède avec/sans autorisation
3. **Expiration** : Comportement après expiration automatique
4. **Révocation** : Révocation manuelle par admin ou SuperAdmin
5. **Prolongation** : Extension de durée d'accès existant

### Tests d'Intégration
```javascript
// Exemple de test
describe('Système d\\'autorisation', () => {
  it('doit refuser l\\'accès sans autorisation', async () => {
    const response = await request(app)
      .get('/api/entreprises/123/dashboard')
      .set('Authorization', `Bearer ${superAdminToken}`);
    
    expect(response.status).toBe(403);
    expect(response.body.message).toContain('Accès refusé');
  });
});
```

## 📈 Évolutions Futures

### Fonctionnalités Potentielles
1. **Notifications** : Alertes automatiques avant expiration
2. **Audit avancé** : Historique détaillé des actions SuperAdmin
3. **Autorisations granulaires** : Limiter l'accès à certaines sections
4. **Approbation multi-niveaux** : Validation par plusieurs admins
5. **API externe** : Webhook pour systèmes tiers

### Optimisations
1. **Cache** : Mise en cache des vérifications d'autorisation
2. **Batch processing** : Traitement par lots des expirations
3. **Monitoring** : Métriques de performance et utilisation
4. **Sécurité renforcée** : 2FA pour actions critiques

## 🆘 Dépannage

### Problèmes Courants

#### \"Accès refusé\" malgré autorisation
- Vérifier l'expiration de l'autorisation
- Contrôler l'ID d'entreprise dans l'URL
- Vérifier les logs du middleware

#### Autorisation non visible dans l'interface
- Actualiser les données (`loadData()`)
- Vérifier les permissions du rôle utilisateur
- Contrôler la connexion API

#### Erreurs de prolongation
- Vérifier que l'autorisation est encore active
- Contrôler les droits de l'utilisateur
- Valider le format des heures supplémentaires

### Logs de Debug
```typescript
// Activation des logs détaillés
console.log('🔐 [AUTORISATION] Vérification accès:', { superAdminId, entrepriseId });
console.log('✅ [AUTORISATION] Accès autorisé pour:', entrepriseId);
console.log('❌ [AUTORISATION] Accès refusé:', raison);
```

---

## 📞 Support

Pour toute question technique ou problème d'intégration, consulter :
1. Cette documentation
2. Les commentaires dans le code source  
3. Les tests d'intégration comme exemples
4. L'équipe de développement

**Version** : 1.0.0  
**Dernière mise à jour** : 2024-10-07