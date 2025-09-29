import { Router } from 'express';
import routeurAuthentification from './authentification_new';
import routeurEmployes from './employes_new';
import routeurCyclesPaie from './cyclesPaie';
import routeurDashboard from './dashboard_clean';
import routeurPaiements from './paiements';
import routeurDemandes from './demandes';
import { middlewareAuthentification } from '../middleware/authentification';

const routeurPrincipal = Router();

// Routes d'authentification (publiques)
routeurPrincipal.use('/auth', routeurAuthentification);

// Routes pour les demandes d'accès (publiques et protégées)
routeurPrincipal.use('/demandes', routeurDemandes);

// Routes protégées
routeurPrincipal.use('/employes', middlewareAuthentification, routeurEmployes);
routeurPrincipal.use('/cycles-paie', middlewareAuthentification, routeurCyclesPaie);
routeurPrincipal.use('/paiements', middlewareAuthentification, routeurPaiements);
routeurPrincipal.use('/dashboard', middlewareAuthentification, routeurDashboard);

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
