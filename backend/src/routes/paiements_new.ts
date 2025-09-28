import { Router } from 'express';
import { PaiementController } from '../controllers/PaiementController';

const routeurPaiements = Router();
const paiementController = new PaiementController();

// GET /paiements - Obtenir tous les paiements
routeurPaiements.get('/', (req, res) => paiementController.obtenirTous(req, res));

// POST /paiements - Créer un nouveau paiement
routeurPaiements.post('/', (req, res) => paiementController.creer(req, res));

// GET /paiements/statistics - Obtenir les statistiques des paiements
routeurPaiements.get('/statistics', (req, res) => paiementController.obtenirStatistiques(req, res));

// GET /paiements/export/csv - Exporter les paiements en CSV
routeurPaiements.get('/export/csv', (req, res) => paiementController.exporterCSV(req, res));

// GET /paiements/rapport/pdf - Générer un rapport PDF
routeurPaiements.get('/rapport/pdf', (req, res) => paiementController.genererRapport(req, res));

export default routeurPaiements;
