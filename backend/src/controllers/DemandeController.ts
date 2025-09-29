import { Request, Response } from 'express';
import { DemandeService } from '../services/DemandeService';
import { MESSAGES_ERREUR } from '../enums/messages';

export class DemandeController {
  private demandeService: DemandeService;

  constructor() {
    this.demandeService = new DemandeService();
  }

  async creer(req: Request, res: Response) {
    try {
      const demande = await this.demandeService.creerDemande(req.body);

      // Ici on peut ajouter une notification pour les super admins
      // await this.envoyerNotificationSuperAdmins(demande);

      res.status(201).json({
        succes: true,
        message: "Demande créée avec succès",
        donnees: demande
      });
    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  async obtenirTous(req: Request, res: Response) {
    try {
      // Vérifier que l'utilisateur est super admin
      if (req.utilisateur?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          succes: false,
          message: "Accès non autorisé. Seuls les super-administrateurs peuvent voir les demandes."
        });
      }

      const demandes = await this.demandeService.obtenirToutesDemandes();
      
      res.status(200).json({
        succes: true,
        donnees: demandes
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
      // Vérifier que l'utilisateur est super admin
      if (req.utilisateur?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          succes: false,
          message: "Accès non autorisé"
        });
      }

      const { id } = req.params;
      const demande = await this.demandeService.obtenirDemandeParId(id);
      
      if (!demande) {
        return res.status(404).json({
          succes: false,
          message: "Demande non trouvée"
        });
      }

      res.status(200).json({
        succes: true,
        donnees: demande
      });
    } catch (error: any) {
      res.status(500).json({
        succes: false,
        message: MESSAGES_ERREUR.ERREUR_SERVEUR,
        erreur: error.message
      });
    }
  }

  async accepter(req: Request, res: Response) {
    try {
      // Vérifier que l'utilisateur est super admin
      if (req.utilisateur?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          succes: false,
          message: "Accès non autorisé. Seuls les super-administrateurs peuvent accepter des demandes."
        });
      }

      const { id } = req.params;
      const superAdminId = req.utilisateur.id;

      const resultat = await this.demandeService.accepterDemande(id, superAdminId);

      // Ici on peut envoyer un email à l'entreprise avec les informations de connexion
      // await this.envoyerEmailAcceptation(resultat);

      res.status(200).json({
        succes: true,
        message: "Demande acceptée avec succès. L'entreprise a été créée.",
        donnees: {
          demande: resultat.demande,
          entreprise: resultat.entreprise,
          motDePasseTemporaire: resultat.motDePasseTemporaire
        }
      });
    } catch (error: any) {
      res.status(400).json({
        succes: false,
        message: error.message || MESSAGES_ERREUR.ERREUR_SERVEUR
      });
    }
  }

  async rejeter(req: Request, res: Response) {
    try {
      // Vérifier que l'utilisateur est super admin
      if (req.utilisateur?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          succes: false,
          message: "Accès non autorisé. Seuls les super-administrateurs peuvent rejeter des demandes."
        });
      }

      const { id } = req.params;
      const { motifRejet } = req.body;
      const superAdminId = req.utilisateur.id;

      if (!motifRejet) {
        return res.status(400).json({
          succes: false,
          message: "Le motif de rejet est requis"
        });
      }

      const demande = await this.demandeService.rejeterDemande(id, superAdminId, motifRejet);

      // Ici on peut envoyer un email à l'entreprise avec le motif de rejet
      // await this.envoyerEmailRejet(demande, motifRejet);

      res.status(200).json({
        succes: true,
        message: "Demande rejetée avec succès",
        donnees: demande
      });
    } catch (error: any) {
      res.status(400).json({
        succes: false,
        message: error.message || MESSAGES_ERREUR.ERREUR_SERVEUR
      });
    }
  }

  async obtenirStatistiques(req: Request, res: Response) {
    try {
      // Vérifier que l'utilisateur est super admin
      if (req.utilisateur?.role !== 'SUPER_ADMIN') {
        return res.status(403).json({
          succes: false,
          message: "Accès non autorisé"
        });
      }

      const stats = await this.demandeService.obtenirStatistiques();
      
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
}
