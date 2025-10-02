# Guide d'intégration rapide - Système de Pointage

## Démarrage rapide (5 minutes)

### 1. Migration de la base de données

```bash
cd backend
npx prisma migrate dev --name add_pointage_system
npx prisma generate
```

### 2. Redémarrage des serveurs

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd frontend
npm start
```

### 3. Ajout des routes dans le frontend

Ajouter dans `frontend/src/routes.js` :

```javascript
// Import des nouveaux composants
import VigileScanner from "views/vigile/Scanner.js";
import PointageReports from "views/admin/PointageReports.js"; 
import QRCodeManagement from "views/admin/QRCodeManagement.js";

// Routes à ajouter dans votre configuration
const routes = [
  // ... routes existantes

  // Routes pour le rôle VIGILE
  {
    name: "Scanner QR",
    layout: "/vigile",
    path: "/scanner",
    component: VigileScanner,
    roles: ["VIGILE"]
  },

  // Routes pour l'administration des pointages
  {
    name: "Rapports Pointages",
    layout: "/admin", 
    path: "/pointages/rapports",
    component: PointageReports,
    roles: ["ADMIN_ENTREPRISE"]
  },
  {
    name: "Gestion QR Codes",
    layout: "/admin",
    path: "/pointages/qr", 
    component: QRCodeManagement,
    roles: ["ADMIN_ENTREPRISE"]
  }
];
```

### 4. Test rapide du système

#### A. Créer un utilisateur vigile (via l'interface admin)
- Email : `vigile@test.com`
- Rôle : `VIGILE`

#### B. Générer un QR code pour un employé
1. Aller sur `/admin/pointages/qr`
2. Cliquer "Générer QR Code" pour un employé
3. Noter le QR code généré

#### C. Tester le scan
1. Se connecter avec le compte vigile
2. Aller sur `/vigile/scanner`
3. Permettre l'accès à la caméra
4. Scanner le QR code généré

#### D. Vérifier les rapports
1. Retourner sur le compte admin
2. Aller sur `/admin/pointages/rapports`
3. Vérifier que le pointage apparaît

## Integration dans l'interface existante

### Navigation principale

Ajouter dans le fichier de navigation principal :

```javascript
// Pour le rôle VIGILE
{
  name: "Scanner QR Codes",
  path: "/vigile/scanner",
  icon: <Icon as={MdQrCodeScanner} width='20px' height='20px' color='inherit' />,
  roles: ["VIGILE"]
}

// Pour les administrateurs  
{
  name: "Pointages",
  icon: <Icon as={MdAccessTime} width='20px' height='20px' color='inherit' />,
  roles: ["ADMIN_ENTREPRISE"],
  items: [
    {
      name: "Rapports",
      path: "/admin/pointages/rapports"
    },
    {
      name: "QR Codes", 
      path: "/admin/pointages/qr"
    }
  ]
}
```

### Dashboard principal

Ajouter des widgets dans le dashboard admin :

```javascript
import { pointageService } from 'services/pointageService';

// Widget présents en temps réel
const PresentsAujourdhui = () => {
  const [presents, setPresents] = useState([]);
  
  useEffect(() => {
    pointageService.obtenirPresentsAujourdhui()
      .then(setPresents);
  }, []);

  return (
    <Card>
      <CardHeader>
        <Heading size="md">Présents aujourd'hui</Heading>
      </CardHeader>
      <CardBody>
        <Text fontSize="2xl" color="green.500">
          {presents.length} employés
        </Text>
      </CardBody>
    </Card>
  );
};
```

## API Endpoints principaux

### Pour les interfaces frontend

```javascript
// Service pointageService.js - Principales méthodes
await pointageService.genererQRCode(employeId);
await pointageService.scannerQR(donneesQR);
await pointageService.obtenirStatistiques(dateDebut, dateFin);
await pointageService.exporterCSV(dateDebut, dateFin);
```

### URLs des endpoints backend

```
POST   /api/pointages/qr/generer/:employeId
POST   /api/pointages/qr/scanner  
GET    /api/pointages/statistiques
GET    /api/pointages/export/csv
GET    /api/pointages/presents-temps-reel
```

## Configuration des rôles

### Ajout du rôle VIGILE

Dans votre système de gestion des utilisateurs, s'assurer que le rôle `VIGILE` est disponible :

```javascript
// Exemple d'ajout dans les constantes
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN_ENTREPRISE: 'ADMIN_ENTREPRISE', 
  CAISSIER: 'CAISSIER',
  VIGILE: 'VIGILE' // Nouveau rôle
};
```

### Permissions

```javascript
// Contrôle d'accès dans ProtectedRoute
const rolePermissions = {
  VIGILE: ['/vigile/*'],
  ADMIN_ENTREPRISE: ['/admin/pointages/*', '/admin/*'],
  // ... autres rôles
};
```

## Tests de fonctionnement

### Checklist de vérification

- [ ] Backend démarre sans erreur
- [ ] Migration base de données appliquée  
- [ ] Routes frontend configurées
- [ ] Utilisateur vigile créé
- [ ] QR code généré pour un employé test
- [ ] Scan QR fonctionne via caméra
- [ ] Pointage apparaît dans les rapports
- [ ] Export CSV fonctionnel

### Commandes de test

```bash
# Tester les endpoints API
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:3001/api/pointages/statistiques"

# Vérifier la base de données
npx prisma studio
```

## Dépannage rapide

### Problèmes courants

**Backend ne démarre pas :**
- Vérifier que la migration est appliquée
- Régénérer Prisma : `npx prisma generate`

**Erreur caméra frontend :**  
- Utiliser HTTPS en local : `npm start` avec SSL
- Vérifier les permissions navigateur

**QR Code invalide :**
- Vérifier l'horloge système (timestamp)
- Régénérer le QR code si expiré

**Interface ne charge pas :**
- Vérifier les imports des composants
- Contrôler la console navigateur pour les erreurs

## Prochaines étapes

1. **Personnalisation** : Adapter l'interface aux couleurs de votre thème
2. **Formation** : Former les vigiles à l'utilisation du scanner  
3. **Déploiement** : Mettre en production avec HTTPS
4. **Monitoring** : Surveiller l'usage et les performances
5. **Extensions** : Ajouter les fonctionnalités avancées selon besoins

---

Le système de pointage est maintenant prêt à l'emploi ! 🎉