import { Router } from 'express';
import { EmployeController } from '../controllers/EmployeController';

const routeurEmployes = Router();
const employeController = new EmployeController();

// GET /employes - Obtenir tous les employés
routeurEmployes.get('/', (req, res) => employeController.obtenirTous(req, res));

// GET /employes/:id - Obtenir un employé par ID
routeurEmployes.get('/:id', (req, res) => employeController.obtenirParId(req, res));

// POST /employes - Créer un nouvel employé
routeurEmployes.post('/', (req, res) => employeController.creer(req, res));

// PUT /employes/:id - Modifier un employé
routeurEmployes.put('/:id', (req, res) => employeController.modifier(req, res));

// DELETE /employes/:id - Supprimer un employé
routeurEmployes.delete('/:id', (req, res) => employeController.supprimer(req, res));

// PATCH /employes/:id/activer - Activer un employé
routeurEmployes.patch('/:id/activer', (req, res) => employeController.activer(req, res));

// PATCH /employes/:id/desactiver - Désactiver un employé
routeurEmployes.patch('/:id/desactiver', (req, res) => employeController.desactiver(req, res));

// GET /employes/statistics - Obtenir les statistiques des employés
routeurEmployes.get('/statistics', (req, res) => employeController.obtenirStatistiques(req, res));

// GET /employes/export/csv - Exporter les employés en CSV
routeurEmployes.get('/export/csv', (req, res) => employeController.exporterCSV(req, res));

export default routeurEmployes;
