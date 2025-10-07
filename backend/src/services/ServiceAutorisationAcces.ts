import { AutorisationAcces } from '../entities/AutorisationAcces';
import { AutorisationAccesRepository } from '../repositories/AutorisationAccesRepository';
import { UtilisateurRepository } from '../repositories/UtilisateurRepository';
import { EntrepriseRepository } from '../repositories/EntrepriseRepository';
import { RoleUtilisateur } from '../enums';
import { ResultatService } from '../interfaces/entities';

export class ServiceAutorisationAcces {
  private autorisationRepository: AutorisationAccesRepository;
  private utilisateurRepository: UtilisateurRepository;
  private entrepriseRepository: EntrepriseRepository;

  constructor(
    autorisationRepository: AutorisationAccesRepository,
    utilisateurRepository: UtilisateurRepository,
    entrepriseRepository: EntrepriseRepository
  ) {
    this.autorisationRepository = autorisationRepository;
    this.utilisateurRepository = utilisateurRepository;
    this.entrepriseRepository = entrepriseRepository;
  }

  /**
   * Accorde un accès temporaire au SuperAdmin
   */
  async accorderAcces(data: {
    entrepriseId: string;
    adminId: string;
    dureeHeures?: number;
    raisonAcces?: string;
  }): Promise<ResultatService<AutorisationAcces>> {
    try {
      // Validation des paramètres
      if (!data.entrepriseId || !data.adminId) {
        return {
          succes: false,
          message: 'L\'ID de l\'entreprise et de l\'admin sont requis'
        };
      }

      // Vérifier que l'admin existe et appartient à l'entreprise
      const admin = await this.utilisateurRepository.getById(data.adminId);
      if (!admin || admin.entrepriseId !== data.entrepriseId || admin.role !== RoleUtilisateur.ADMIN_ENTREPRISE) {
        return {
          succes: false,
          message: 'Admin non trouvé ou non autorisé pour cette entreprise'
        };
      }

      // Vérifier que l'entreprise existe
      const entreprise = await this.entrepriseRepository.getById(data.entrepriseId);
      if (!entreprise) {
        return {
          succes: false,
          message: 'Entreprise non trouvée'
        };
      }

      // Trouver le SuperAdmin (il ne devrait y en avoir qu'un)
      const superAdmins = await this.utilisateurRepository.getByRole(RoleUtilisateur.SUPER_ADMIN);
      if (superAdmins.length === 0) {
        return {
          succes: false,
          message: 'Aucun SuperAdmin trouvé dans le système'
        };
      }

      const superAdmin = superAdmins[0]; // Prendre le premier (et normalement unique)

      // Vérifier s'il existe déjà une autorisation active
      const autorisationExistante = await this.autorisationRepository.existeAutorisationActive(
        superAdmin.id,
        data.entrepriseId
      );

      if (autorisationExistante) {
        return {
          succes: false,
          message: 'Une autorisation active existe déjà pour cette entreprise'
        };
      }

      // Créer la nouvelle autorisation
      const dureeHeures = data.dureeHeures || 24; // 24h par défaut
      const nouvelleAutorisation = AutorisationAcces.creerAvecDuree({
        entrepriseId: data.entrepriseId,
        superAdminId: superAdmin.id,
        adminId: data.adminId,
        raisonAcces: data.raisonAcces
      }, dureeHeures);

      // Valider l'autorisation
      const erreurs = nouvelleAutorisation.valider();
      if (erreurs.length > 0) {
        return {
          succes: false,
          message: `Erreurs de validation: ${erreurs.join(', ')}`
        };
      }

      // Enregistrer en base
      const autorisationCreee = await this.autorisationRepository.creer(nouvelleAutorisation);

      return {
        succes: true,
        message: `Accès accordé au SuperAdmin jusqu'au ${autorisationCreee.dateExpiration.toLocaleString('fr-FR')}`,
        donnees: autorisationCreee
      };

    } catch (error) {
      console.error('Erreur lors de l\'accord d\'accès:', error);
      return {
        succes: false,
        message: 'Erreur interne lors de l\'accord d\'accès'
      };
    }
  }

  /**
   * Vérifie si un SuperAdmin a accès à une entreprise
   */
  async verifierAcces(superAdminId: string, entrepriseId: string): Promise<ResultatService<{
    aAcces: boolean;
    autorisation?: AutorisationAcces;
    message: string;
  }>> {
    try {
      const autorisation = await this.autorisationRepository.verifierAcces(superAdminId, entrepriseId);

      if (!autorisation) {
        return {
          succes: true,
          message: 'Accès refusé - vous n\'avez pas les droits pour cette entreprise',
          donnees: {
            aAcces: false,
            message: 'Accès refusé - vous n\'avez pas les droits pour cette entreprise'
          }
        };
      }

      if (!autorisation.estValide()) {
        return {
          succes: true,
          message: 'Accès expiré - votre autorisation n\'est plus valide',
          donnees: {
            aAcces: false,
            message: 'Accès expiré - votre autorisation n\'est plus valide'
          }
        };
      }

      return {
        succes: true,
        message: `Accès autorisé - ${autorisation.tempsRestantFormate()}`,
        donnees: {
          aAcces: true,
          autorisation,
          message: `Accès autorisé - ${autorisation.tempsRestantFormate()}`
        }
      };

    } catch (error) {
      console.error('Erreur lors de la vérification d\'accès:', error);
      return {
        succes: false,
        message: 'Erreur interne lors de la vérification d\'accès'
      };
    }
  }

  /**
   * Révoque un accès spécifique
   */
  async revoquerAcces(autorisationId: string, utilisateurId: string): Promise<ResultatService<AutorisationAcces>> {
    try {
      // Vérifier que l'utilisateur est autorisé à révoquer (admin de l'entreprise ou SuperAdmin)
      const utilisateur = await this.utilisateurRepository.getById(utilisateurId);
      if (!utilisateur) {
        return {
          succes: false,
          message: 'Utilisateur non trouvé'
        };
      }

      // Récupérer l'autorisation pour vérification
      const autorisation = await this.autorisationRepository.obtenirAutorisationParId(autorisationId);
      if (!autorisation) {
        return {
          succes: false,
          message: 'Autorisation non trouvée'
        };
      }

      // Vérifier les droits
      const peutRevoquer = 
        utilisateur.role === RoleUtilisateur.SUPER_ADMIN || 
        (utilisateur.role === RoleUtilisateur.ADMIN_ENTREPRISE && utilisateur.id === autorisation.adminId);

      if (!peutRevoquer) {
        return {
          succes: false,
          message: 'Vous n\'êtes pas autorisé à révoquer cette autorisation'
        };
      }

      // Désactiver l'autorisation
      const autorisationRevoquee = await this.autorisationRepository.desactiver(autorisationId);

      return {
        succes: true,
        message: 'Autorisation révoquée avec succès',
        donnees: autorisationRevoquee!
      };

    } catch (error) {
      console.error('Erreur lors de la révocation d\'accès:', error);
      return {
        succes: false,
        message: 'Erreur interne lors de la révocation'
      };
    }
  }

  /**
   * Obtient toutes les autorisations actives pour un SuperAdmin
   */
  async obtenirAutorisationsActives(superAdminId: string): Promise<ResultatService<AutorisationAcces[]>> {
    try {
      const autorisations = await this.autorisationRepository.obtenirAutorisationsActives(superAdminId);

      return {
        succes: true,
        message: `${autorisations.length} autorisation(s) active(s) trouvée(s)`,
        donnees: autorisations
      };

    } catch (error) {
      console.error('Erreur lors de la récupération des autorisations actives:', error);
      return {
        succes: false,
        message: 'Erreur interne lors de la récupération des autorisations'
      };
    }
  }

  /**
   * Obtient toutes les autorisations accordées par un admin
   */
  async obtenirAutorisationsParAdmin(adminId: string): Promise<ResultatService<AutorisationAcces[]>> {
    try {
      const autorisations = await this.autorisationRepository.obtenirAutorisationsParAdmin(adminId);

      return {
        succes: true,
        message: `${autorisations.length} autorisation(s) trouvée(s)`,
        donnees: autorisations
      };

    } catch (error) {
      console.error('Erreur lors de la récupération des autorisations par admin:', error);
      return {
        succes: false,
        message: 'Erreur interne lors de la récupération des autorisations'
      };
    }
  }

  /**
   * Obtient toutes les autorisations pour une entreprise
   */
  async obtenirAutorisationsEntreprise(entrepriseId: string): Promise<ResultatService<AutorisationAcces[]>> {
    try {
      const autorisations = await this.autorisationRepository.obtenirAutorisationsEntreprise(entrepriseId);

      return {
        succes: true,
        message: `${autorisations.length} autorisation(s) trouvée(s) pour l'entreprise`,
        donnees: autorisations
      };

    } catch (error) {
      console.error('Erreur lors de la récupération des autorisations de l\'entreprise:', error);
      return {
        succes: false,
        message: 'Erreur interne lors de la récupération des autorisations'
      };
    }
  }

  /**
   * Obtient les statistiques des autorisations
   */
  async obtenirStatistiques(): Promise<ResultatService<any>> {
    try {
      const statistiques = await this.autorisationRepository.obtenirStatistiques();

      return {
        succes: true,
        message: 'Statistiques récupérées avec succès',
        donnees: statistiques
      };

    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      return {
        succes: false,
        message: 'Erreur interne lors de la récupération des statistiques'
      };
    }
  }

  /**
   * Nettoie les autorisations expirées (tâche de maintenance)
   */
  async nettoyerAutorisationsExpirees(): Promise<ResultatService<{ nombreSupprimees: number }>> {
    try {
      const nombreSupprimees = await this.autorisationRepository.nettoyerAutorisationsExpirees();

      return {
        succes: true,
        message: `${nombreSupprimees} autorisation(s) expirée(s) supprimée(s)`,
        donnees: { nombreSupprimees }
      };

    } catch (error) {
      console.error('Erreur lors du nettoyage des autorisations expirées:', error);
      return {
        succes: false,
        message: 'Erreur interne lors du nettoyage'
      };
    }
  }

  /**
   * Prolonge une autorisation existante
   */
  async prolongerAutorisation(
    autorisationId: string, 
    heuresSupplementaires: number,
    utilisateurId: string
  ): Promise<ResultatService<AutorisationAcces>> {
    try {
      // Vérifier que l'utilisateur est autorisé
      const utilisateur = await this.utilisateurRepository.getById(utilisateurId);
      if (!utilisateur || (utilisateur.role !== RoleUtilisateur.SUPER_ADMIN && utilisateur.role !== RoleUtilisateur.ADMIN_ENTREPRISE)) {
        return {
          succes: false,
          message: 'Non autorisé à prolonger cette autorisation'
        };
      }

      // Récupérer l'autorisation
      const autorisation = await this.autorisationRepository.obtenirAutorisationParId(autorisationId);
      if (!autorisation) {
        return {
          succes: false,
          message: 'Autorisation non trouvée'
        };
      }

      // Vérifier les droits spécifiques
      if (utilisateur.role === RoleUtilisateur.ADMIN_ENTREPRISE && utilisateur.id !== autorisation.adminId) {
        return {
          succes: false,
          message: 'Vous ne pouvez prolonger que vos propres autorisations'
        };
      }

      // Prolonger la date d'expiration
      const nouvelleExpiration = new Date(autorisation.dateExpiration);
      nouvelleExpiration.setHours(nouvelleExpiration.getHours() + heuresSupplementaires);

      const autorisationMiseAJour = await this.autorisationRepository.mettreAJour(autorisationId, {
        dateExpiration: nouvelleExpiration
      });

      return {
        succes: true,
        message: `Autorisation prolongée de ${heuresSupplementaires}h. Nouvelle expiration: ${nouvelleExpiration.toLocaleString('fr-FR')}`,
        donnees: autorisationMiseAJour!
      };

    } catch (error) {
      console.error('Erreur lors de la prolongation d\'autorisation:', error);
      return {
        succes: false,
        message: 'Erreur interne lors de la prolongation'
      };
    }
  }
}