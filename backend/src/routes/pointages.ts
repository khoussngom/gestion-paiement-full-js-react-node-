import { Router } from 'express';
import { PointageController } from '../controllers/PointageController';

const routeurPointages = Router();
const pointageController = new PointageController();

// Routes QR Code
routeurPointages.post('/qr-code/generer', (req, res) => pointageController.genererQRCode(req, res));
routeurPointages.get('/qr-code/:employeId', (req, res) => pointageController.obtenirQRCodeEmploye(req, res));
routeurPointages.post('/qr-code/renouveler', (req, res) => pointageController.renouverrQRCode(req, res));
routeurPointages.post('/qr-code/generer-tous', (req, res) => pointageController.genererQRCodesPourTous(req, res));

// Routes Pointage
routeurPointages.post('/scanner', (req, res) => pointageController.scannerQRCode(req, res));
routeurPointages.get('/', (req, res) => pointageController.obtenirPointages(req, res));
routeurPointages.post('/manuel', (req, res) => pointageController.enregistrerPointageManuel(req, res));
routeurPointages.put('/:id/corriger', (req, res) => pointageController.corrigerPointage(req, res));

// Routes Statistiques et Rapports
routeurPointages.get('/statistiques', (req, res) => pointageController.obtenirStatistiques(req, res));
routeurPointages.get('/rapport-employes', (req, res) => pointageController.obtenirRapportEmployes(req, res));
routeurPointages.get('/presents', (req, res) => pointageController.obtenirPresentsEnTempsReel(req, res));
routeurPointages.get('/historique/:employeId', (req, res) => pointageController.obtenirHistoriqueEmploye(req, res));

// Routes Utilitaires
routeurPointages.post('/marquer-absents', (req, res) => pointageController.marquerAbsents(req, res));
routeurPointages.get('/export/csv', (req, res) => pointageController.exporterCSV(req, res));

export default routeurPointages;