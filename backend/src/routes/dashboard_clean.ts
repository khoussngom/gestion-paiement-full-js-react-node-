import { Router } from 'express';
import { DashboardController } from '../controllers/DashboardController';

const routeurDashboard = Router();
const dashboardController = new DashboardController();

// GET /dashboard/statistiques - Obtenir toutes les statistiques complètes  
routeurDashboard.get('/statistiques', (req, res) => dashboardController.obtenirStatistiques(req, res));

// GET /dashboard/employes - Exporter les employés pour le dashboard
routeurDashboard.get('/employes', (req, res) => dashboardController.exporterEmployes(req, res));

export default routeurDashboard;
