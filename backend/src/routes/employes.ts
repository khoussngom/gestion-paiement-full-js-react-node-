import { Router } from 'express';
import { EmployeRepository } from '@/repositories/EmployeRepository';
import { schemaCreerEmploye, schemaModifierEmploye, schemaFiltresEmploye } from '@/validators';
import { MESSAGES_SUCCES, MESSAGES_ERREUR } from '@/enums/messages';

const routeurEmployes = Router();
const employeRepo = new EmployeRepository();

// GET /employes - Obtenir tous les employés avec filtres
routeurEmployes.get('/', async (req, res) => {
  try {
    const filtres = schemaFiltresEmploye.parse(req.query);
    const entrepriseId = req.utilisateur?.entrepriseId;
    
    if (!entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    const employes = await employeRepo.getByEntreprise(entrepriseId, filtres);
    
    res.status(200).json({
      succes: true,
      donnees: employes,
      total: employes.length
    });
  } catch (error: any) {
    res.status(400).json({
      succes: false,
      message: MESSAGES_ERREUR.DONNEES_INVALIDES,
      erreurs: error.errors || error.message
    });
  }
});

// GET /employes/:id - Obtenir un employé par ID
routeurEmployes.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const entrepriseId = req.utilisateur?.entrepriseId;
    
    const employe = await employeRepo.getById(id);
    
    if (!employe) {
      return res.status(404).json({
        succes: false,
        message: MESSAGES_ERREUR.EMPLOYE_INTROUVABLE
      });
    }

    // Vérifier que l'employé appartient à l'entreprise de l'utilisateur
    if (employe.entrepriseId !== entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    res.status(200).json({
      succes: true,
      donnees: employe
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// POST /employes - Créer un nouvel employé
routeurEmployes.post('/', async (req, res) => {
  try {
    const entrepriseId = req.utilisateur?.entrepriseId;
    const donneesValidees = schemaCreerEmploye.parse({
      ...req.body,
      entrepriseId
    });
    
    if (!entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    // S'assurer que l'employé est créé pour la bonne entreprise
    const nouvelEmploye = await employeRepo.create({
      ...donneesValidees,
      entrepriseId
    });

    res.status(201).json({
      succes: true,
      message: MESSAGES_SUCCES.EMPLOYE_CREE,
      donnees: nouvelEmploye
    });
  } catch (error: any) {
    res.status(400).json({
      succes: false,
      message: MESSAGES_ERREUR.DONNEES_INVALIDES,
      erreurs: error.errors || error.message
    });
  }
});

// PUT /employes/:id - Modifier un employé
routeurEmployes.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const donneesValidees = schemaModifierEmploye.parse(req.body);
    const entrepriseId = req.utilisateur?.entrepriseId;
    
    const employe = await employeRepo.getById(id);
    
    if (!employe) {
      return res.status(404).json({
        succes: false,
        message: MESSAGES_ERREUR.EMPLOYE_INTROUVABLE
      });
    }

    // Vérifier que l'employé appartient à l'entreprise de l'utilisateur
    if (employe.entrepriseId !== entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    const employeModifie = await employeRepo.update(id, donneesValidees);

    res.status(200).json({
      succes: true,
      message: MESSAGES_SUCCES.EMPLOYE_MODIFIE,
      donnees: employeModifie
    });
  } catch (error: any) {
    res.status(400).json({
      succes: false,
      message: MESSAGES_ERREUR.DONNEES_INVALIDES,
      erreurs: error.errors || error.message
    });
  }
});

// DELETE /employes/:id - Supprimer un employé
routeurEmployes.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const entrepriseId = req.utilisateur?.entrepriseId;
    
    const employe = await employeRepo.getById(id);
    
    if (!employe) {
      return res.status(404).json({
        succes: false,
        message: MESSAGES_ERREUR.EMPLOYE_INTROUVABLE
      });
    }

    // Vérifier que l'employé appartient à l'entreprise de l'utilisateur
    if (employe.entrepriseId !== entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    await employeRepo.delete(id);

    res.status(200).json({
      succes: true,
      message: MESSAGES_SUCCES.EMPLOYE_SUPPRIME
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// PATCH /employes/:id/activer - Activer un employé
routeurEmployes.patch('/:id/activer', async (req, res) => {
  try {
    const { id } = req.params;
    const entrepriseId = req.utilisateur?.entrepriseId;
    
    const employe = await employeRepo.getById(id);
    
    if (!employe) {
      return res.status(404).json({
        succes: false,
        message: MESSAGES_ERREUR.EMPLOYE_INTROUVABLE
      });
    }

    // Vérifier que l'employé appartient à l'entreprise de l'utilisateur
    if (employe.entrepriseId !== entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    const employeActive = await employeRepo.toggleActive(id, true);

    res.status(200).json({
      succes: true,
      message: MESSAGES_SUCCES.EMPLOYE_ACTIVE,
      donnees: employeActive
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// PATCH /employes/:id/desactiver - Désactiver un employé
routeurEmployes.patch('/:id/desactiver', async (req, res) => {
  try {
    const { id } = req.params;
    const entrepriseId = req.utilisateur?.entrepriseId;
    
    const employe = await employeRepo.getById(id);
    
    if (!employe) {
      return res.status(404).json({
        succes: false,
        message: MESSAGES_ERREUR.EMPLOYE_INTROUVABLE
      });
    }

    // Vérifier que l'employé appartient à l'entreprise de l'utilisateur
    if (employe.entrepriseId !== entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    const employeDesactive = await employeRepo.toggleActive(id, false);

    res.status(200).json({
      succes: true,
      message: MESSAGES_SUCCES.EMPLOYE_DESACTIVE,
      donnees: employeDesactive
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// GET /employes/statistiques - Obtenir les statistiques des employés
routeurEmployes.get('/statistiques', async (req, res) => {
  try {
    const entrepriseId = req.utilisateur?.entrepriseId;
    
    if (!entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    const total = await employeRepo.countByEntreprise(entrepriseId);
    const actifs = await employeRepo.countActiveByEntreprise(entrepriseId);
    const inactifs = total - actifs;

    const parTypeContrat = await employeRepo.getStatsByTypeContrat(entrepriseId);

    res.status(200).json({
      succes: true,
      donnees: {
        total,
        actifs,
        inactifs,
        parTypeContrat
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

// POST /employes/import - Importer des employés en masse
routeurEmployes.post('/import', async (req, res) => {
  try {
    const { employes } = req.body;
    const entrepriseId = req.utilisateur?.entrepriseId;
    
    if (!entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    if (!employes || !Array.isArray(employes) || employes.length === 0) {
      return res.status(400).json({
        succes: false,
        message: 'Aucune donnée d\'employé fournie'
      });
    }

    const results = {
      imported: 0,
      failed: 0,
      errors: [] as Array<{ligne: number, donnees: any, erreur: string}>
    };

    // Traitement en lot des employés
    for (let i = 0; i < employes.length; i++) {
      const employeData = employes[i];
      try {
        // Validation avec le schéma existant
        const donneesValidees = schemaCreerEmploye.parse({
          ...employeData,
          entrepriseId,
          actif: true
        });

        await employeRepo.create(donneesValidees);
        results.imported++;
      } catch (error: any) {
        results.failed++;
        results.errors.push({
          ligne: i + 1,
          donnees: employeData,
          erreur: error.message || 'Erreur de validation'
        });
      }
    }

    res.status(200).json({
      succes: true,
      message: `Import terminé: ${results.imported} réussi(s), ${results.failed} échec(s)`,
      donnees: results
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

export default routeurEmployes;
