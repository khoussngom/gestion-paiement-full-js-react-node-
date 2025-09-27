import { Router } from 'express';
import { CyclePaieRepository } from '@/repositories/CyclePaieRepository';
import { MESSAGES_SUCCES, MESSAGES_ERREUR } from '@/enums/messages';

const routeurCyclesPaie = Router();
const cyclePaieRepo = new CyclePaieRepository();

// GET /cycles-paie - Obtenir tous les cycles de paie
routeurCyclesPaie.get('/', async (req, res) => {
  try {
    const entrepriseId = req.utilisateur?.entrepriseId;
    
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

// GET /cycles-paie/:id - Obtenir un cycle de paie par ID
routeurCyclesPaie.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const entrepriseId = req.utilisateur?.entrepriseId;
    
    const cycle = await cyclePaieRepo.getById(id);
    
    if (!cycle) {
      return res.status(404).json({
        succes: false,
        message: 'Cycle de paie introuvable'
      });
    }

    if (cycle.entrepriseId !== entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    res.status(200).json({
      succes: true,
      donnees: cycle
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

export default routeurCyclesPaie;
