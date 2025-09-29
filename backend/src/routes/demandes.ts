import { Router } from 'express';
import { DemandeController } from '../controllers/DemandeController';
import { middlewareAuthentification } from '../middleware/authentification';

const routeurDemandes = Router();
const demandeController = new DemandeController();

// POST /demandes - Créer une nouvelle demande (public)
routeurDemandes.post('/', (req, res) => demandeController.creer(req, res));

// Routes protégées (super admin seulement)
routeurDemandes.use(middlewareAuthentification);

// GET /demandes/statistics - Obtenir les statistiques des demandes (super admin seulement)
routeurDemandes.get('/statistics', (req, res) => demandeController.obtenirStatistiques(req, res));

// GET /demandes - Obtenir toutes les demandes (super admin seulement)
routeurDemandes.get('/', (req, res) => demandeController.obtenirTous(req, res));

// GET /demandes/:id - Obtenir une demande par ID (super admin seulement)
routeurDemandes.get('/:id', (req, res) => demandeController.obtenirParId(req, res));

// POST /demandes/:id/accepter - Accepter une demande (super admin seulement)
routeurDemandes.post('/:id/accepter', (req, res) => demandeController.accepter(req, res));

// POST /demandes/:id/rejeter - Rejeter une demande (super admin seulement)
routeurDemandes.post('/:id/rejeter', (req, res) => demandeController.rejeter(req, res));

export default routeurDemandes;
