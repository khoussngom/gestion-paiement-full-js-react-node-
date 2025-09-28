import { Router } from 'express';
import { AuthentificationController } from '../controllers/AuthentificationController';

const routeurAuthentification = Router();
const authentificationController = new AuthentificationController();

// POST /auth/connexion - Se connecter
routeurAuthentification.post('/connexion', (req, res) => 
  authentificationController.connexion(req, res)
);

// POST /auth/inscription - S'inscrire
routeurAuthentification.post('/inscription', (req, res) => 
  authentificationController.inscription(req, res)
);

// GET /auth/profil - Obtenir le profil utilisateur (nécessite authentification)
routeurAuthentification.get('/profil', (req, res) => 
  authentificationController.profil(req, res)
);

// POST /auth/deconnexion - Se déconnecter
routeurAuthentification.post('/deconnexion', (req, res) => 
  authentificationController.deconnexion(req, res)
);

// POST /auth/changer-mot-de-passe - Changer le mot de passe
routeurAuthentification.post('/changer-mot-de-passe', (req, res) => 
  authentificationController.changerMotDePasse(req, res)
);

export default routeurAuthentification;
