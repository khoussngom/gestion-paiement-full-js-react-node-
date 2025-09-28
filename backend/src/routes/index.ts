import { Router } from 'express';
import routeurAuthentification from './authentification';
import routeurEmployes from './employes';
import routeurCyclesPaie from './cyclesPaie';
import routeurDashboard from './Dashboard';
import routeurPaiements from './paiements';
import { middlewareAuthentification } from '../middleware/authentification';

const routeurPrincipal = Router();

// Routes d'authentification (publiques)
routeurPrincipal.use('/auth', routeurAuthentification);

// Routes protégées
routeurPrincipal.use('/employes', middlewareAuthentification, routeurEmployes);
routeurPrincipal.use('/cycles-paie', middlewareAuthentification, routeurCyclesPaie);
routeurPrincipal.use('/paiements', middlewareAuthentification, routeurPaiements);
// Route dashboard temporairement sans auth pour les tests
routeurPrincipal.use('/dashboard', routeurDashboard);

// Route de santé
routeurPrincipal.get('/sante', (req, res) => {
  res.status(200).json({
    succes: true,
    message: 'API de gestion des salaires - Fonctionnelle',
    version: '1.0.0',
    horodatage: new Date().toISOString()
  });
});

export default routeurPrincipal;
