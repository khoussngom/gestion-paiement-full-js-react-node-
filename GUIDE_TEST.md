# Guide de Test - Nouvelles Fonctionnalités

## ✅ Fonctionnalités Implémentées

### 1. **Variation du salaire selon le type de contrat**
**Où tester :** Interface Admin > Employés > Ajouter/Modifier un employé

**Test :**
1. Cliquez sur "Ajouter un Employé"
2. Sélectionnez différents types de contrat :
   - **SALAIRE_FIXE** : Affiche "Salaire fixe mensuel (FCFA)"
   - **JOURNALIER** : Affiche "Taux horaire (FCFA)"
   - **HONORAIRE** : Affiche "Taux d'honoraire par heure (FCFA)"

### 2. **Profession avec dropdown et recherche**
**Où tester :** Interface Admin > Employés > Ajouter/Modifier un employé

**Test :**
1. Dans le formulaire employé, trouvez le champ "Profession"
2. Cliquez dans le champ pour voir la liste des professions
3. Tapez quelques lettres (ex: "dev") pour filtrer
4. Sélectionnez une profession ou saisissez une profession personnalisée

### 3. **Accès Super Admin aux interfaces d'entreprise**
**Où tester :** Interface Super Admin > Gestion Entreprises

**Test :**
1. Connectez-vous en tant que Super Admin
2. Allez dans "Gestion Entreprises"
3. Cliquez sur les 3 points d'une entreprise
4. Sélectionnez "Accéder à l'interface"
5. Vous devriez être redirigé vers l'interface admin de cette entreprise
6. Un bouton de retour (flèche) devrait apparaître dans la navbar
7. Cliquez sur la flèche pour revenir au mode Super Admin

### 4. **Logo dynamique par entreprise**
**Où tester :** Sidebar gauche

**Test :**
1. Connectez-vous en tant qu'admin d'une entreprise qui a un logo
2. Le logo de l'entreprise devrait s'afficher dans la sidebar
3. Si pas de logo, le nom de l'entreprise s'affiche
4. Si aucune entreprise, "MARAKHIB-GLOBAL" s'affiche

### 5. **Réorganisation de la sidebar**
**Où tester :** Interface Super Admin

**Test :**
1. Connectez-vous en tant que Super Admin
2. Dans la sidebar, vérifiez l'ordre :
   - Dashboard Super Admin
   - Demandes d'Accès
   - Paramètres
   - Gestion Entreprises (en bas)
   - Icône utilisateur (au lieu de "Utilisateurs")

## 🔧 Résolution des Problèmes

### Si vous ne voyez pas les fonctionnalités :

1. **Vérifiez votre rôle utilisateur :**
   - Super Admin : Accès aux fonctionnalités super admin
   - Admin Entreprise : Accès aux fonctionnalités employés
   - Caissier : Accès limité

2. **Rechargez complètement la page :** Ctrl+F5

3. **Vérifiez la console du navigateur :** F12 > Console

4. **Assurez-vous que le backend fonctionne :**
   ```bash
   cd backend
   npm run dev
   ```

5. **Assurez-vous que le frontend fonctionne :**
   ```bash
   cd frontend  
   npm start
   ```

## 🎯 Données de Test

### Utilisateurs par défaut :
- **Super Admin :** admin@marakhib.sn / password123
- **Admin Entreprise :** (créé automatiquement lors de la création d'entreprise)

### Pour tester :
1. Connectez-vous en tant que Super Admin
2. Créez une entreprise avec un admin
3. Testez "Accéder à l'interface" pour cette entreprise
4. Créez des employés avec différents types de contrat
5. Testez la recherche de profession

## 📝 Fonctionnalités Visibles par Rôle

### Super Admin :
- Dashboard Super Admin
- Gestion Entreprises (avec bouton "Accéder à l'interface")  
- Demandes d'Accès
- Paramètres
- Icône Utilisateur (gestion des utilisateurs)
- Logo dynamique
- Bouton de retour (quand en mode accès entreprise)

### Admin Entreprise :
- Dashboard
- Employés (avec nouveau modal amélioré)
- Cycles de Paie
- Paiements
- Profil
- Logo de l'entreprise dans la sidebar

### Caissier :
- Dashboard (limité)
- Paiements
- Logo de l'entreprise dans la sidebar
