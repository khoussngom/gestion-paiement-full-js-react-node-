import { Request, Response } from 'express';
import { ServiceAutorisationAcces } from '../services/ServiceAutorisationAcces';
import { AutorisationAccesRepository } from '../repositories/AutorisationAccesRepository';
import { UtilisateurRepository } from '../repositories/UtilisateurRepository';
import { EntrepriseRepository } from '../repositories/EntrepriseRepository';
import { StatusCodes } from 'http-status-codes';
import { RoleUtilisateur } from '../enums';

export class AutorisationAccesController {
  private serviceAutorisation: ServiceAutorisationAcces;

  constructor() {
    const autorisationRepository = new AutorisationAccesRepository();
    const utilisateurRepository = new UtilisateurRepository();
    const entrepriseRepository = new EntrepriseRepository();
    
    this.serviceAutorisation = new ServiceAutorisationAcces(
      autorisationRepository,
      utilisateurRepository,
      entrepriseRepository
    );
  }

  /**
   * POST /api/autorisations/accorder
   * Accorde un accès temporaire au SuperAdmin
   */
  async accorderAcces(req: Request, res: Response) {
    try {
      console.log('🔐 [AUTORISATION] Demande d\'accès reçue:', req.body);

      const { dureeHeures, raisonAcces } = req.body;
      const utilisateur = (req as any).utilisateur;

      // Vérifier que l'utilisateur est bien admin d'entreprise
      if (utilisateur.role !== RoleUtilisateur.ADMIN_ENTREPRISE) {
        return res.status(StatusCodes.FORBIDDEN).json({
          succes: false,
          message: 'Seuls les admins d\'entreprise peuvent accorder des accès'
        });
      }

      // Accorder l'accès pour l'entreprise de l'admin connecté
      const resultat = await this.serviceAutorisation.accorderAcces({
        entrepriseId: utilisateur.entrepriseId,
        adminId: utilisateur.id,
        dureeHeures: dureeHeures || 24,
        raisonAcces
      });

      const statusCode = resultat.succes ? StatusCodes.CREATED : StatusCodes.BAD_REQUEST;
      res.status(statusCode).json(resultat);

    } catch (error) {
      console.error('❌ [AUTORISATION] Erreur lors de l\'accord d\'accès:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        succes: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * GET /api/autorisations/verification/:entrepriseId
   * Vérifie si le SuperAdmin a accès à une entreprise
   */
  async verifierAcces(req: Request, res: Response) {
    try {
      console.log('🔍 [AUTORISATION] Vérification d\'accès pour entreprise:', req.params.entrepriseId);

      const { entrepriseId } = req.params;
      const utilisateur = (req as any).utilisateur;

      // Seuls les SuperAdmins peuvent utiliser cette route
      if (utilisateur.role !== RoleUtilisateur.SUPER_ADMIN) {
        return res.status(StatusCodes.FORBIDDEN).json({
          succes: false,
          message: 'Accès réservé aux SuperAdmins'
        });
      }

      const resultat = await this.serviceAutorisation.verifierAcces(utilisateur.id, entrepriseId);

      res.status(StatusCodes.OK).json(resultat);

    } catch (error) {
      console.error('❌ [AUTORISATION] Erreur lors de la vérification d\'accès:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        succes: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * DELETE /api/autorisations/:autorisationId/revoquer
   * Révoque un accès spécifique
   */
  async revoquerAcces(req: Request, res: Response) {
    try {
      console.log('🚫 [AUTORISATION] Révocation d\'accès:', req.params.autorisationId);

      const { autorisationId } = req.params;
      const utilisateur = (req as any).utilisateur;

      const resultat = await this.serviceAutorisation.revoquerAcces(autorisationId, utilisateur.id);

      const statusCode = resultat.succes ? StatusCodes.OK : StatusCodes.BAD_REQUEST;
      res.status(statusCode).json(resultat);

    } catch (error) {
      console.error('❌ [AUTORISATION] Erreur lors de la révocation:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        succes: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * GET /api/autorisations/mes-autorisations
   * Obtient les autorisations pour l'utilisateur connecté
   */
  async obtenirMesAutorisations(req: Request, res: Response) {
    try {
      console.log('📋 [AUTORISATION] Récupération des autorisations pour:', req.body);

      const utilisateur = (req as any).utilisateur;
      let resultat;

      if (utilisateur.role === RoleUtilisateur.SUPER_ADMIN) {
        // SuperAdmin voit ses accès actifs
        resultat = await this.serviceAutorisation.obtenirAutorisationsActives(utilisateur.id);
      } else if (utilisateur.role === RoleUtilisateur.ADMIN_ENTREPRISE) {
        // Admin d'entreprise voit les accès qu'il a accordés
        resultat = await this.serviceAutorisation.obtenirAutorisationsParAdmin(utilisateur.id);
      } else {
        return res.status(StatusCodes.FORBIDDEN).json({
          succes: false,
          message: 'Accès non autorisé'
        });
      }

      res.status(StatusCodes.OK).json(resultat);

    } catch (error) {
      console.error('❌ [AUTORISATION] Erreur lors de la récupération des autorisations:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        succes: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * GET /api/autorisations/entreprise/:entrepriseId
   * Obtient toutes les autorisations pour une entreprise (SuperAdmin seulement)
   */
  async obtenirAutorisationsEntreprise(req: Request, res: Response) {
    try {
      console.log('🏢 [AUTORISATION] Autorisations pour entreprise:', req.params.entrepriseId);

      const { entrepriseId } = req.params;
      const utilisateur = (req as any).utilisateur;

      // Vérifier les droits d'accès
      if (utilisateur.role === RoleUtilisateur.SUPER_ADMIN) {
        // SuperAdmin peut voir toutes les autorisations
        const resultat = await this.serviceAutorisation.obtenirAutorisationsEntreprise(entrepriseId);
        res.status(StatusCodes.OK).json(resultat);
      } else if (utilisateur.role === RoleUtilisateur.ADMIN_ENTREPRISE && utilisateur.entrepriseId === entrepriseId) {
        // Admin peut voir les autorisations de sa propre entreprise
        const resultat = await this.serviceAutorisation.obtenirAutorisationsEntreprise(entrepriseId);
        res.status(StatusCodes.OK).json(resultat);
      } else {
        res.status(StatusCodes.FORBIDDEN).json({
          succes: false,
          message: 'Vous ne pouvez voir que les autorisations de votre entreprise'
        });
      }

    } catch (error) {
      console.error('❌ [AUTORISATION] Erreur lors de la récupération des autorisations d\'entreprise:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        succes: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * GET /api/autorisations/statistiques
   * Obtient les statistiques des autorisations (SuperAdmin seulement)
   */
  async obtenirStatistiques(req: Request, res: Response) {
    try {
      console.log('📊 [AUTORISATION] Demande de statistiques');

      const utilisateur = (req as any).utilisateur;

      if (utilisateur.role !== RoleUtilisateur.SUPER_ADMIN) {
        return res.status(StatusCodes.FORBIDDEN).json({
          succes: false,
          message: 'Accès réservé aux SuperAdmins'
        });
      }

      const resultat = await this.serviceAutorisation.obtenirStatistiques();

      res.status(StatusCodes.OK).json(resultat);

    } catch (error) {
      console.error('❌ [AUTORISATION] Erreur lors de la récupération des statistiques:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        succes: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * PUT /api/autorisations/:autorisationId/prolonger
   * Prolonge une autorisation existante
   */
  async prolongerAutorisation(req: Request, res: Response) {
    try {
      console.log('⏰ [AUTORISATION] Prolongation d\'autorisation:', req.params.autorisationId);

      const { autorisationId } = req.params;
      const { heuresSupplementaires } = req.body;
      const utilisateur = (req as any).utilisateur;

      if (!heuresSupplementaires || heuresSupplementaires <= 0) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          succes: false,
          message: 'Nombre d\'heures supplémentaires requis et doit être positif'
        });
      }

      const resultat = await this.serviceAutorisation.prolongerAutorisation(
        autorisationId,
        heuresSupplementaires,
        utilisateur.id
      );

      const statusCode = resultat.succes ? StatusCodes.OK : StatusCodes.BAD_REQUEST;
      res.status(statusCode).json(resultat);

    } catch (error) {
      console.error('❌ [AUTORISATION] Erreur lors de la prolongation:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        succes: false,
        message: 'Erreur interne du serveur'
      });
    }
  }

  /**
   * POST /api/autorisations/nettoyer-expirees
   * Nettoie les autorisations expirées (tâche de maintenance - SuperAdmin seulement)
   */
  async nettoyerAutorisationsExpirees(req: Request, res: Response) {
    try {
      console.log('🧹 [AUTORISATION] Nettoyage des autorisations expirées');

      const utilisateur = (req as any).utilisateur;

      if (utilisateur.role !== RoleUtilisateur.SUPER_ADMIN) {
        return res.status(StatusCodes.FORBIDDEN).json({
          succes: false,
          message: 'Accès réservé aux SuperAdmins'
        });
      }

      const resultat = await this.serviceAutorisation.nettoyerAutorisationsExpirees();

      res.status(StatusCodes.OK).json(resultat);

    } catch (error) {
      console.error('❌ [AUTORISATION] Erreur lors du nettoyage:', error);
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        succes: false,
        message: 'Erreur interne du serveur'
      });
    }
  }
}