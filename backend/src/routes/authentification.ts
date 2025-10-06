import { Router } from 'express';
import { UtilisateurRepository } from '@/repositories/UtilisateurRepository';
import { schemaCreerUtilisateur, schemaConnexion } from '@/validators';
import { MESSAGES_SUCCES, MESSAGES_ERREUR } from '@/enums/messages';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const routeurAuthentification = Router();
const utilisateurRepo = new UtilisateurRepository();

// POST /auth/connexion - Connexion utilisateur
routeurAuthentification.post('/connexion', async (req, res) => {
  try {
    const donneesValidees = schemaConnexion.parse(req.body);
    
    // Vérifier si l'utilisateur existe
    const utilisateur = await utilisateurRepo.getByEmail(donneesValidees.email);
    if (!utilisateur) {
      return res.status(401).json({
        succes: false,
        message: MESSAGES_ERREUR.IDENTIFIANTS_INVALIDES
      });
    }

    // Vérifier le mot de passe
    const motDePasseValide = await bcrypt.compare(donneesValidees.motDePasse, utilisateur.motDePasse);
    if (!motDePasseValide) {
      return res.status(401).json({
        succes: false,
        message: MESSAGES_ERREUR.IDENTIFIANTS_INVALIDES
      });
    }

    // Vérifier si l'utilisateur est actif
    if (!utilisateur.actif) {
      return res.status(401).json({
        succes: false,
        message: MESSAGES_ERREUR.ACCES_REFUSE
      });
    }

    // Générer le token JWT
    const token = jwt.sign(
      { 
        id: utilisateur.id, 
        email: utilisateur.email,
        role: utilisateur.role,
        entrepriseId: utilisateur.entrepriseId
      },
      process.env.JWT_SECRET || 'secret-key',
      { expiresIn: '24h' }
    );

    res.status(200).json({
      succes: true,
      message: MESSAGES_SUCCES.CONNEXION_REUSSIE,
      donnees: {
        utilisateur: {
          id: utilisateur.id,
          nom: utilisateur.nom,
          prenom: utilisateur.prenom,
          email: utilisateur.email,
          role: utilisateur.role,
          entrepriseId: utilisateur.entrepriseId,
          doitChangerMotDePasse: utilisateur.doitChangerMotDePasse
        },
        token
      }
    });
  } catch (error: any) {
    res.status(400).json({
      succes: false,
      message: MESSAGES_ERREUR.DONNEES_INVALIDES,
      erreurs: error.errors || error.message
    });
  }
});

// POST /auth/inscription - Inscription utilisateur (Super Admin uniquement)
routeurAuthentification.post('/inscription', async (req, res) => {
  try {
    const donneesValidees = schemaCreerUtilisateur.parse(req.body);
    
    // Vérifier si l'email existe déjà
    const emailExiste = await utilisateurRepo.verifierExistenceEmail(donneesValidees.email);
    if (emailExiste) {
      return res.status(409).json({
        succes: false,
        message: MESSAGES_ERREUR.EMAIL_DEJA_UTILISE
      });
    }

    // Hacher le mot de passe
    const motDePasseHache = await bcrypt.hash(donneesValidees.motDePasse, 10);

    // Créer l'utilisateur
    const nouvelUtilisateur = await utilisateurRepo.creer({
      ...donneesValidees,
      motDePasse: motDePasseHache
    });

    res.status(201).json({
      succes: true,
      message: MESSAGES_SUCCES.EMPLOYE_CREE,
      donnees: {
        id: nouvelUtilisateur.id,
        nom: nouvelUtilisateur.nom,
        prenom: nouvelUtilisateur.prenom,
        email: nouvelUtilisateur.email,
        role: nouvelUtilisateur.role,
        entrepriseId: nouvelUtilisateur.entrepriseId
      }
    });
  } catch (error: any) {
    res.status(400).json({
      succes: false,
      message: MESSAGES_ERREUR.DONNEES_INVALIDES,
      erreurs: error.errors || error.message
    });
  }
});

// POST /auth/creer-vigile - Créer un utilisateur vigile (Admin uniquement)
routeurAuthentification.post('/creer-vigile', async (req, res) => {
  try {
    // Pour l'instant, on permet la création sans authentification pour les tests
    // TODO: Ajouter middleware d'authentification admin
    
    const { nom, prenom, email, motDePasse } = req.body;
    
    // Validation de base
    if (!nom || !prenom || !email || !motDePasse) {
      return res.status(400).json({
        succes: false,
        message: 'Nom, prénom, email et mot de passe sont requis'
      });
    }

    // Vérifier si l'email existe déjà
    const emailExiste = await utilisateurRepo.verifierExistenceEmail(email);
    if (emailExiste) {
      return res.status(409).json({
        succes: false,
        message: 'Cet email est déjà utilisé'
      });
    }

    // Hacher le mot de passe
    const motDePasseHache = await bcrypt.hash(motDePasse, 10);

    // Créer l'utilisateur vigile
    const vigileData = {
      nom,
      prenom,
      email: email.toLowerCase(),
      motDePasse: motDePasseHache,
      role: 'VIGILE' as any,
      entrepriseId: 'cmg9jyzoi0000a5rrsh87fbmg', // ID entreprise par défaut pour les tests
      actif: true
    };

    const nouveauVigile = await utilisateurRepo.creer(vigileData);

    res.status(201).json({
      succes: true,
      message: 'Vigile créé avec succès',
      donnees: {
        id: nouveauVigile.id,
        nom: nouveauVigile.nom,
        prenom: nouveauVigile.prenom,
        email: nouveauVigile.email,
        role: nouveauVigile.role
      }
    });
  } catch (error: any) {
    console.error('Erreur création vigile:', error);
    res.status(500).json({
      succes: false,
      message: 'Erreur lors de la création du vigile',
      erreur: error.message
    });
  }
});

// GET /auth/vigiles - Obtenir la liste des vigiles (Admin uniquement)
routeurAuthentification.get('/vigiles', async (req, res) => {
  try {
    // TODO: Ajouter middleware d'authentification admin
    
    // Récupérer tous les utilisateurs avec le rôle VIGILE
    const vigiles = await utilisateurRepo.getByRole('VIGILE');
    
    res.status(200).json({
      succes: true,
      message: 'Liste des vigiles récupérée avec succès',
      donnees: vigiles.map(vigile => ({
        id: vigile.id,
        nom: vigile.nom,
        prenom: vigile.prenom,
        email: vigile.email,
        actif: vigile.actif,
        dateCreation: vigile.dateCreation
      }))
    });
  } catch (error: any) {
    console.error('Erreur récupération vigiles:', error);
    res.status(500).json({
      succes: false,
      message: 'Erreur lors de la récupération des vigiles',
      erreur: error.message
    });
  }
});

// PATCH /auth/vigiles/:id/toggle-status - Basculer le statut d'un vigile (Admin uniquement)
routeurAuthentification.patch('/vigiles/:id/toggle-status', async (req, res) => {
  try {
    // TODO: Ajouter middleware d'authentification admin
    
    const { id } = req.params;
    
    // Récupérer le vigile
    const vigile = await utilisateurRepo.getById(id);
    if (!vigile) {
      return res.status(404).json({
        succes: false,
        message: 'Vigile non trouvé'
      });
    }
    
    // Vérifier que c'est bien un vigile
    if (vigile.role !== 'VIGILE') {
      return res.status(400).json({
        succes: false,
        message: 'Cet utilisateur n\'est pas un vigile'
      });
    }
    
    // Basculer le statut
    const vigileModifie = await utilisateurRepo.modifierStatut(id, !vigile.actif);
    
    res.status(200).json({
      succes: true,
      message: `Vigile ${vigileModifie.actif ? 'activé' : 'désactivé'} avec succès`,
      donnees: {
        id: vigileModifie.id,
        actif: vigileModifie.actif
      }
    });
  } catch (error: any) {
    console.error('Erreur modification statut vigile:', error);
    res.status(500).json({
      succes: false,
      message: 'Erreur lors de la modification du statut',
      erreur: error.message
    });
  }
});

// DELETE /auth/vigiles/:id - Supprimer un vigile (Admin uniquement)
routeurAuthentification.delete('/vigiles/:id', async (req, res) => {
  try {
    // TODO: Ajouter middleware d'authentification admin
    
    const { id } = req.params;
    
    // Récupérer le vigile
    const vigile = await utilisateurRepo.getById(id);
    if (!vigile) {
      return res.status(404).json({
        succes: false,
        message: 'Vigile non trouvé'
      });
    }
    
    // Vérifier que c'est bien un vigile
    if (vigile.role !== 'VIGILE') {
      return res.status(400).json({
        succes: false,
        message: 'Cet utilisateur n\'est pas un vigile'
      });
    }
    
    // Supprimer le vigile
    await utilisateurRepo.supprimer(id);
    
    res.status(200).json({
      succes: true,
      message: 'Vigile supprimé avec succès'
    });
  } catch (error: any) {
    console.error('Erreur suppression vigile:', error);
    res.status(500).json({
      succes: false,
      message: 'Erreur lors de la suppression du vigile',
      erreur: error.message
    });
  }
});

// POST /auth/deconnexion - Déconnexion utilisateur
routeurAuthentification.post('/deconnexion', (req, res) => {
  // Côté client, supprimer le token du localStorage/sessionStorage
  res.status(200).json({
    succes: true,
    message: MESSAGES_SUCCES.DECONNEXION_REUSSIE
  });
});

// GET /auth/profil - Obtenir le profil de l'utilisateur connecté
routeurAuthentification.get('/profil', async (req, res) => {
  try {
    // Cette route nécessiterait un middleware d'authentification
    // Pour l'exemple, on suppose que l'ID utilisateur est dans req.user
    const utilisateurId = (req as any).user?.id;
    
    if (!utilisateurId) {
      return res.status(401).json({
        succes: false,
        message: MESSAGES_ERREUR.TOKEN_INVALIDE
      });
    }

    const utilisateur = await utilisateurRepo.getById(utilisateurId);
    if (!utilisateur) {
      return res.status(404).json({
        succes: false,
        message: MESSAGES_ERREUR.UTILISATEUR_INEXISTANT
      });
    }

    res.status(200).json({
      succes: true,
      donnees: {
        id: utilisateur.id,
        nom: utilisateur.nom,
        prenom: utilisateur.prenom,
        email: utilisateur.email,
        role: utilisateur.role,
        entrepriseId: utilisateur.entrepriseId,
        actif: utilisateur.actif
      }
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

export default routeurAuthentification;
