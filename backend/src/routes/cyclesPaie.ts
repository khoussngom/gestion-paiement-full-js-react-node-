import { Router } from 'express';
import { CyclePaieRepository } from '@/repositories/CyclePaieRepository';
import { ServiceCyclePaie } from '@/services/ServiceCyclePaie';
import { schemaCreerCyclePaie, schemaModifierCyclePaie } from '@/validators';
import { StatutBulletinPaie, TypeCyclePaie } from '@/enums';
import { MESSAGES_SUCCES, MESSAGES_ERREUR } from '@/enums/messages';
import { obtenirEntrepriseId } from '@/utils/entrepriseHelper';

const routeurCyclesPaie = Router();
const cyclePaieRepo = new CyclePaieRepository();
const serviceCyclePaie = new ServiceCyclePaie();

// GET /cycles-paie - Obtenir tous les cycles de paie
routeurCyclesPaie.get('/', async (req, res) => {
  try {
    const entrepriseId = obtenirEntrepriseId(req);
    
    if (!entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    const cycles = await cyclePaieRepo.getByEntreprise(entrepriseId);
    
    res.status(200).json({
      succes: true,
      donnees: cycles
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// GET /cycles-paie/:id - Obtenir un cycle de paie par ID avec employés
routeurCyclesPaie.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const entrepriseId = obtenirEntrepriseId(req);
    
    const resultat = await serviceCyclePaie.obtenirCycleAvecEmployes(id);
    
    if (resultat.cycle.entrepriseId !== entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    res.status(200).json({
      succes: true,
      donnees: resultat
    });
  } catch (error: any) {
    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        succes: false,
        message: 'Cycle de paie introuvable'
      });
    }
    
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// POST /cycles-paie - Créer un nouveau cycle de paie
routeurCyclesPaie.post('/', async (req, res) => {
  try {
    const entrepriseId = obtenirEntrepriseId(req);
    
    if (!entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    // Validation des données
    const donneesValidees = schemaCreerCyclePaie.parse({
      ...req.body,
      entrepriseId
    });

    // Générer un nom automatique si pas fourni
    if (!donneesValidees.nom || donneesValidees.nom.trim() === '') {
      donneesValidees.nom = serviceCyclePaie.genererNomCycle(
        donneesValidees.typeCycle, 
        donneesValidees.dateDebut
      );
    }

    const resultat = await serviceCyclePaie.creerCyclePaie(donneesValidees);

    res.status(201).json({
      succes: true,
      donnees: resultat,
      message: `Cycle de paie créé avec succès. ${resultat.bulletinsGeneres} bulletins générés pour ${resultat.employesInclus} employés.`
    });
  } catch (error: any) {
    if (error.message.includes('chevauchement') || error.message.includes('existe déjà')) {
      return res.status(400).json({
        succes: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// PUT /cycles-paie/:id - Modifier un cycle de paie
routeurCyclesPaie.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const entrepriseId = obtenirEntrepriseId(req);

    // Validation des données
    const donneesValidees = schemaModifierCyclePaie.parse(req.body);

    const cycle = await serviceCyclePaie.modifierCyclePaie(id, donneesValidees);

    if (cycle.entrepriseId !== entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    res.status(200).json({
      succes: true,
      donnees: cycle,
      message: MESSAGES_SUCCES.CYCLE_MODIFIE
    });
  } catch (error: any) {
    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        succes: false,
        message: 'Cycle de paie introuvable'
      });
    }

    if (error.message.includes('ne peut plus être modifié')) {
      return res.status(400).json({
        succes: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// POST /cycles-paie/:id/approuver - Approuver un cycle de paie
routeurCyclesPaie.post('/:id/approuver', async (req, res) => {
  try {
    const { id } = req.params;
    const entrepriseId = obtenirEntrepriseId(req);

    const cycle = await serviceCyclePaie.approuverCycle(id);

    if (cycle.entrepriseId !== entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    res.status(200).json({
      succes: true,
      donnees: cycle,
      message: 'Cycle de paie approuvé avec succès'
    });
  } catch (error: any) {
    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        succes: false,
        message: 'Cycle de paie introuvable'
      });
    }
    
    res.status(400).json({
      succes: false,
      message: error.message
    });
  }
});

// POST /cycles-paie/:id/cloturer - Clôturer un cycle de paie
routeurCyclesPaie.post('/:id/cloturer', async (req, res) => {
  try {
    const { id } = req.params;
    const entrepriseId = obtenirEntrepriseId(req);

    const cycle = await serviceCyclePaie.cloturerCycle(id);

    if (cycle.entrepriseId !== entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    res.status(200).json({
      succes: true,
      donnees: cycle,
      message: 'Cycle de paie clôturé avec succès'
    });
  } catch (error: any) {
    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        succes: false,
        message: 'Cycle de paie introuvable'
      });
    }
    
    res.status(400).json({
      succes: false,
      message: error.message
    });
  }
});

// PUT /cycles-paie/:id/bulletins/:bulletinId/status - Mettre à jour le statut d'un bulletin
routeurCyclesPaie.put('/:cycleId/bulletins/:bulletinId/status', async (req, res) => {
  try {
    const { bulletinId } = req.params;
    const { statut } = req.body;
    
    await serviceCyclePaie.mettreAJourStatutPaiement(bulletinId, statut);
    
    res.status(200).json({
      succes: true,
      message: 'Statut du bulletin mis à jour avec succès'
    });
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour du statut de l\'employé:', error);
    res.status(500).json({
      succes: false,
      message: error.message || MESSAGES_ERREUR.ERREUR_SERVEUR
    });
  }
});

// Routes pour les bulletins de salaire
import { ServiceBulletinPDF } from '../services/ServiceBulletinPDF';
const serviceBulletinPDF = new ServiceBulletinPDF();

// GET /cycles-paie/bulletins/:bulletinId/pdf - Télécharger le bulletin en PDF
routeurCyclesPaie.get('/bulletins/:bulletinId/pdf', async (req, res) => {
  try {
    const { bulletinId } = req.params;
    
    const pdfBuffer = await serviceBulletinPDF.genererBulletinPDF(bulletinId);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=bulletin-${bulletinId}.pdf`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Erreur lors de la génération du PDF:', error);
    res.status(500).json({
      succes: false,
      message: error.message || 'Erreur lors de la génération du PDF'
    });
  }
});

// POST /cycles-paie/bulletins/:bulletinId/payer - Valider le paiement d'un bulletin
routeurCyclesPaie.post('/bulletins/:bulletinId/payer', async (req, res) => {
  try {
    const { bulletinId } = req.params;
    const { modePaiement } = req.body;
    const utilisateurId = (req as any).utilisateur?.id;

    if (!utilisateurId) {
      return res.status(401).json({
        succes: false,
        message: 'Utilisateur non identifié'
      });
    }
    
    await serviceBulletinPDF.validerPaiementBulletin(bulletinId, modePaiement, utilisateurId);
    
    res.status(200).json({
      succes: true,
      message: 'Paiement validé avec succès'
    });
  } catch (error: any) {
    console.error('Erreur lors de la validation du paiement:', error);
    res.status(500).json({
      succes: false,
      message: error.message || MESSAGES_ERREUR.ERREUR_SERVEUR
    });
  }
});

// GET /cycles-paie/:id/statistiques - Obtenir les statistiques d'un cycle
routeurCyclesPaie.get('/:id/statistiques', async (req, res) => {
  try {
    const { id } = req.params;
    const entrepriseId = obtenirEntrepriseId(req);

    // Vérifier que le cycle appartient à l'entreprise
    const cycle = await cyclePaieRepo.getById(id);
    if (!cycle || cycle.entrepriseId !== entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    const statistiques = await serviceCyclePaie.obtenirStatistiquesCycle(id);

    res.status(200).json({
      succes: true,
      donnees: statistiques
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// GET /cycles-paie/employes-non-payes - Obtenir les employés non payés des cycles actifs
routeurCyclesPaie.get('/employes-non-payes', async (req, res) => {
  try {
    const entrepriseId = obtenirEntrepriseId(req);

    if (!entrepriseId) {
      return res.status(400).json({
        succes: false,
        message: MESSAGES_ERREUR.PARAMETRES_MANQUANTS
      });
    }

    // Obtenir les employés non payés des cycles actifs
    const employesNonPayes = await serviceCyclePaie.obtenirEmployesNonPayesCyclesActifs(entrepriseId);

    res.status(200).json({
      succes: true,
      donnees: employesNonPayes,
      message: 'Employés non payés récupérés avec succès'
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des employés non payés:', error);
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

export default routeurCyclesPaie;
