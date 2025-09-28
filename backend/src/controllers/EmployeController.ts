import { Request, Response } from 'express';
import { EmployeService } from '../services/EmployeService';
import { MESSAGES_ERREUR } from '../enums/messages';

export class EmployeController {
  private employeService: EmployeService;

  constructor() {
    this.employeService = new EmployeService();
  }

  async obtenirTous(req: Request, res: Response) {
    try {
      const entrepriseId = req.utilisateur?.entrepriseId;
      
      if (!entrepriseId) {
        return res.status(403).json({
          succes: false,
          message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
        });
      }

      const employes = await this.employeService.obtenirTousEmployes(entrepriseId);
      
      res.status(200).json({
        succes: true,
        donnees: employes
      });
    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  async obtenirParId(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const entrepriseId = req.utilisateur?.entrepriseId;
      
      if (!entrepriseId) {
        return res.status(403).json({
          succes: false,
          message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
        });
      }

      const employe = await this.employeService.obtenirEmployeParId(id, entrepriseId);
      
      if (!employe) {
        return res.status(404).json({
          succes: false,
          message: "Employé non trouvé"
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
  }

  async creer(req: Request, res: Response) {
    try {
      const entrepriseId = req.utilisateur?.entrepriseId;
      
      if (!entrepriseId) {
        return res.status(403).json({
          succes: false,
          message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
        });
      }

      const employe = await this.employeService.creerEmploye(entrepriseId, req.body);

      res.status(201).json({
        succes: true,
        message: "Employé créé avec succès",
        donnees: employe
      });
    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  async modifier(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const entrepriseId = req.utilisateur?.entrepriseId;
      
      if (!entrepriseId) {
        return res.status(403).json({
          succes: false,
          message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
        });
      }

      const employe = await this.employeService.modifierEmploye(id, entrepriseId, req.body);

      res.status(200).json({
        succes: true,
        message: "Employé modifié avec succès",
        donnees: employe
      });
    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  async supprimer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const entrepriseId = req.utilisateur?.entrepriseId;
      
      if (!entrepriseId) {
        return res.status(403).json({
          succes: false,
          message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
        });
      }

      await this.employeService.supprimerEmploye(id, entrepriseId);

      res.status(200).json({
        succes: true,
        message: "Employé supprimé avec succès"
      });
    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  async obtenirStatistiques(req: Request, res: Response) {
    try {
      const entrepriseId = req.utilisateur?.entrepriseId;
      
      if (!entrepriseId) {
        return res.status(403).json({
          succes: false,
          message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
        });
      }

      const stats = await this.employeService.obtenirStatistiques(entrepriseId);
      
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
  }

  async activer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const entrepriseId = req.utilisateur?.entrepriseId;
      
      if (!entrepriseId) {
        return res.status(403).json({
          succes: false,
          message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
        });
      }

      const employe = await this.employeService.activerEmploye(id, entrepriseId);

      res.status(200).json({
        succes: true,
        message: "Employé activé avec succès",
        donnees: employe
      });
    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  async desactiver(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const entrepriseId = req.utilisateur?.entrepriseId;
      
      if (!entrepriseId) {
        return res.status(403).json({
          succes: false,
          message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
        });
      }

      const employe = await this.employeService.desactiverEmploye(id, entrepriseId);

      res.status(200).json({
        succes: true,
        message: "Employé désactivé avec succès",
        donnees: employe
      });
    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  async exporterCSV(req: Request, res: Response) {
    try {
      const entrepriseId = req.utilisateur?.entrepriseId;
      
      if (!entrepriseId) {
        return res.status(403).json({
          succes: false,
          message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
        });
      }

      const csvContent = await this.employeService.exporterCSV(entrepriseId);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=employes_${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvContent);

    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }
}
