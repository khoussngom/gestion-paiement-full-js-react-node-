import { Router } from 'express';
import { AutorisationAccesController } from '../controllers/AutorisationAccesController';
import { middlewareAuthentification } from '../middleware/authentification';

const routeurAutorisations = Router();
const autorisationController = new AutorisationAccesController();

// Middleware d'authentification pour toutes les routes
routeurAutorisations.use(middlewareAuthentification);

/**
 * @route   POST /api/autorisations/accorder
 * @desc    Accorde un accès temporaire au SuperAdmin
 * @access  Admin d'entreprise seulement
 * @body    { dureeHeures?: number, raisonAcces?: string }
 */
routeurAutorisations.post('/accorder', (req, res) => 
  autorisationController.accorderAcces(req, res)
);

/**
 * @route   GET /api/autorisations/verification/:entrepriseId
 * @desc    Vérifie si le SuperAdmin a accès à une entreprise
 * @access  SuperAdmin seulement
 */
routeurAutorisations.get('/verification/:entrepriseId', (req, res) => 
  autorisationController.verifierAcces(req, res)
);

/**
 * @route   DELETE /api/autorisations/:autorisationId/revoquer
 * @desc    Révoque un accès spécifique
 * @access  Admin d'entreprise (ses propres autorisations) ou SuperAdmin
 */
routeurAutorisations.delete('/:autorisationId/revoquer', (req, res) => 
  autorisationController.revoquerAcces(req, res)
);

/**
 * @route   GET /api/autorisations/mes-autorisations
 * @desc    Obtient les autorisations pour l'utilisateur connecté
 * @access  Admin d'entreprise ou SuperAdmin
 */
routeurAutorisations.get('/mes-autorisations', (req, res) => 
  autorisationController.obtenirMesAutorisations(req, res)
);

/**
 * @route   GET /api/autorisations/entreprise/:entrepriseId
 * @desc    Obtient toutes les autorisations pour une entreprise
 * @access  Admin d'entreprise (sa propre entreprise) ou SuperAdmin
 */
routeurAutorisations.get('/entreprise/:entrepriseId', (req, res) => 
  autorisationController.obtenirAutorisationsEntreprise(req, res)
);

/**
 * @route   GET /api/autorisations/statistiques
 * @desc    Obtient les statistiques des autorisations
 * @access  SuperAdmin seulement
 */
routeurAutorisations.get('/statistiques', (req, res) => 
  autorisationController.obtenirStatistiques(req, res)
);

/**
 * @route   PUT /api/autorisations/:autorisationId/prolonger
 * @desc    Prolonge une autorisation existante
 * @access  Admin d'entreprise (ses propres autorisations) ou SuperAdmin
 * @body    { heuresSupplementaires: number }
 */
routeurAutorisations.put('/:autorisationId/prolonger', (req, res) => 
  autorisationController.prolongerAutorisation(req, res)
);

/**
 * @route   POST /api/autorisations/nettoyer-expirees
 * @desc    Nettoie les autorisations expirées (tâche de maintenance)
 * @access  SuperAdmin seulement
 */
routeurAutorisations.post('/nettoyer-expirees', (req, res) => 
  autorisationController.nettoyerAutorisationsExpirees(req, res)
);

export { routeurAutorisations };