import { Router } from 'express';
import { ServicePointage } from '@/services/ServicePointage';
import { ServiceQRCode } from '@/services/ServiceQRCode';
import { PointageRepository } from '@/repositories/PointageRepository';
import { EmployeRepository } from '@/repositories/EmployeRepository';
import { schemaEnregistrerPointage, schemaFiltresPointage } from '@/validators';
import { MESSAGES_SUCCES, MESSAGES_ERREUR } from '@/enums/messages';
import { StatutPointage } from '@/enums';

const routeurPointages = Router();
const servicePointage = new ServicePointage();
const serviceQRCode = new ServiceQRCode();
const pointageRepo = new PointageRepository();
const employeRepo = new EmployeRepository();

// POST /pointages/scanner - Scanner un code QR et enregistrer le pointage (pour VIGILE)
routeurPointages.post('/scanner', async (req, res) => {
  try {
    const entrepriseId = req.utilisateur?.entrepriseId;
    
    if (!entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    const donneesValidees = schemaEnregistrerPointage.parse(req.body);
    
    const pointage = await servicePointage.enregistrerPointage(
      donneesValidees.codeQR,
      entrepriseId,
      donneesValidees.latitude,
      donneesValidees.longitude
    );

    res.status(201).json({
      succes: true,
      message: MESSAGES_SUCCES.POINTAGE_ENREGISTRE,
      donnees: pointage
    });
  } catch (error: any) {
    if (error.message.includes('Code QR invalide') || error.message.includes('Employé non trouvé')) {
      return res.status(400).json({
        succes: false,
        message: MESSAGES_ERREUR.QR_CODE_INVALIDE,
        erreur: error.message
      });
    }
    
    if (error.message.includes('déjà été enregistré')) {
      return res.status(400).json({
        succes: false,
        message: MESSAGES_ERREUR.POINTAGE_DEJA_EFFECTUE,
        erreur: error.message
      });
    }

    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// GET /pointages - Obtenir tous les pointages avec filtres
routeurPointages.get('/', async (req, res) => {
  try {
    const entrepriseId = req.utilisateur?.entrepriseId;
    
    if (!entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    const filtres = schemaFiltresPointage.parse(req.query);
    
    const pointages = await servicePointage.obtenirPointages(entrepriseId, {
      dateDebut: filtres.dateDebut,
      dateFin: filtres.dateFin,
      employeId: filtres.employeId,
      statut: filtres.statut as StatutPointage
    });

    res.status(200).json({
      succes: true,
      donnees: pointages,
      total: pointages.length
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// GET /pointages/statistiques - Obtenir les statistiques de pointage
routeurPointages.get('/statistiques', async (req, res) => {
  try {
    const entrepriseId = req.utilisateur?.entrepriseId;
    
    if (!entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    const { dateDebut, dateFin } = req.query;
    
    const stats = await servicePointage.obtenirStatistiques(
      entrepriseId,
      dateDebut ? new Date(dateDebut as string) : undefined,
      dateFin ? new Date(dateFin as string) : undefined
    );

    res.status(200).json({
      succes: true,
      donnees: stats
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// GET /pointages/rapport-employes - Obtenir le rapport par employé
routeurPointages.get('/rapport-employes', async (req, res) => {
  try {
    const entrepriseId = req.utilisateur?.entrepriseId;
    
    if (!entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    const { dateDebut, dateFin } = req.query;
    
    const rapport = await servicePointage.obtenirRapportParEmploye(
      entrepriseId,
      dateDebut ? new Date(dateDebut as string) : undefined,
      dateFin ? new Date(dateFin as string) : undefined
    );

    res.status(200).json({
      succes: true,
      donnees: rapport
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// POST /pointages/marquer-absents - Marquer les absents (tâche automatique après 16h)
routeurPointages.post('/marquer-absents', async (req, res) => {
  try {
    const entrepriseId = req.utilisateur?.entrepriseId;
    
    if (!entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    const absents = await servicePointage.marquerAbsents(entrepriseId);

    res.status(200).json({
      succes: true,
      message: 'Employés absents marqués avec succès',
      donnees: absents,
      total: absents.length
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// POST /pointages/generer-qr/:employeId - Générer ou régénérer un code QR pour un employé
routeurPointages.post('/generer-qr/:employeId', async (req, res) => {
  try {
    const { employeId } = req.params;
    const entrepriseId = req.utilisateur?.entrepriseId;
    
    if (!entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    const employe = await employeRepo.getById(employeId);
    
    if (!employe) {
      return res.status(404).json({
        succes: false,
        message: MESSAGES_ERREUR.EMPLOYE_INTROUVABLE
      });
    }

    if (employe.entrepriseId !== entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    // Générer le code QR
    const codeQR = await serviceQRCode.genererCodeQR(employeId, entrepriseId);
    
    // Mettre à jour l'employé avec le nouveau code QR
    const employeMisAJour = await employeRepo.update(employeId, { codeQR });

    // Générer l'image QR
    const imageQR = await serviceQRCode.genererImageQR(codeQR);

    res.status(200).json({
      succes: true,
      message: employe.codeQR ? MESSAGES_SUCCES.QR_CODE_REGENERE : MESSAGES_SUCCES.QR_CODE_GENERE,
      donnees: {
        employe: employeMisAJour,
        codeQR,
        imageQR
      }
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// GET /pointages/qr/:employeId - Obtenir le code QR d'un employé
routeurPointages.get('/qr/:employeId', async (req, res) => {
  try {
    const { employeId } = req.params;
    const entrepriseId = req.utilisateur?.entrepriseId;
    
    if (!entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    const employe = await employeRepo.getById(employeId);
    
    if (!employe) {
      return res.status(404).json({
        succes: false,
        message: MESSAGES_ERREUR.EMPLOYE_INTROUVABLE
      });
    }

    if (employe.entrepriseId !== entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    if (!employe.codeQR) {
      return res.status(404).json({
        succes: false,
        message: 'Aucun code QR généré pour cet employé'
      });
    }

    // Générer l'image QR
    const imageQR = await serviceQRCode.genererImageQR(employe.codeQR);

    res.status(200).json({
      succes: true,
      donnees: {
        codeQR: employe.codeQR,
        imageQR,
        employe: {
          id: employe.id,
          nomComplet: employe.nomComplet,
          poste: employe.poste
        }
      }
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// GET /pointages/employe/:employeId - Obtenir l'historique de pointage d'un employé
routeurPointages.get('/employe/:employeId', async (req, res) => {
  try {
    const { employeId } = req.params;
    const entrepriseId = req.utilisateur?.entrepriseId;
    
    if (!entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    const employe = await employeRepo.getById(employeId);
    
    if (!employe) {
      return res.status(404).json({
        succes: false,
        message: MESSAGES_ERREUR.EMPLOYE_INTROUVABLE
      });
    }

    if (employe.entrepriseId !== entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    const { dateDebut, dateFin } = req.query;
    
    const pointages = await pointageRepo.getByEmploye(
      employeId,
      dateDebut ? new Date(dateDebut as string) : undefined,
      dateFin ? new Date(dateFin as string) : undefined
    );

    res.status(200).json({
      succes: true,
      donnees: pointages,
      total: pointages.length
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

export default routeurPointages;
