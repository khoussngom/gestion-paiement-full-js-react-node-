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
          entrepriseId: utilisateur.entrepriseId
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
