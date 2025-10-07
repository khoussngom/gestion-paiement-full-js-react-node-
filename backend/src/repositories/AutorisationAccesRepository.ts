import { BasePrismaRepository } from './BasePrismaRepository';
import { AutorisationAcces } from '../entities/AutorisationAcces';
import { PrismaClient } from '@prisma/client';

export class AutorisationAccesRepository extends BasePrismaRepository {
  constructor() {
    super();
  }

  /**
   * Crée une nouvelle autorisation d'accès
   */
  async creer(autorisation: AutorisationAcces): Promise<AutorisationAcces> {
    const nouvelleAutorisation = await this.prisma.autorisationAcces.create({
      data: {
        entrepriseId: autorisation.entrepriseId,
        superAdminId: autorisation.superAdminId,
        adminId: autorisation.adminId,
        dateExpiration: autorisation.dateExpiration,
        raisonAcces: autorisation.raisonAcces,
        estActif: autorisation.estActif
      },
      include: {
        entreprise: {
          select: { id: true, nom: true }
        },
        superAdmin: {
          select: { id: true, nom: true, prenom: true, email: true }
        },
        admin: {
          select: { id: true, nom: true, prenom: true, email: true }
        }
      }
    });

    return this.mapperVersEntite(nouvelleAutorisation);
  }

  /**
   * Vérifie si un SuperAdmin a accès à une entreprise
   */
  async verifierAcces(superAdminId: string, entrepriseId: string): Promise<AutorisationAcces | null> {
    const autorisation = await this.prisma.autorisationAcces.findFirst({
      where: {
        superAdminId,
        entrepriseId,
        estActif: true,
        dateExpiration: {
          gt: new Date()
        }
      },
      include: {
        entreprise: {
          select: { id: true, nom: true }
        },
        superAdmin: {
          select: { id: true, nom: true, prenom: true, email: true }
        },
        admin: {
          select: { id: true, nom: true, prenom: true, email: true }
        }
      }
    });

    return autorisation ? this.mapperVersEntite(autorisation) : null;
  }

  /**
   * Récupère toutes les autorisations actives pour un SuperAdmin
   */
  async obtenirAutorisationsActives(superAdminId: string): Promise<AutorisationAcces[]> {
    const autorisations = await this.prisma.autorisationAcces.findMany({
      where: {
        superAdminId,
        estActif: true,
        dateExpiration: {
          gt: new Date()
        }
      },
      include: {
        entreprise: {
          select: { id: true, nom: true }
        },
        superAdmin: {
          select: { id: true, nom: true, prenom: true, email: true }
        },
        admin: {
          select: { id: true, nom: true, prenom: true, email: true }
        }
      },
      orderBy: {
        dateCreation: 'desc'
      }
    });

    return autorisations.map(auth => this.mapperVersEntite(auth));
  }

  /**
   * Récupère toutes les autorisations accordées par un admin d'entreprise
   */
  async obtenirAutorisationsParAdmin(adminId: string): Promise<AutorisationAcces[]> {
    const autorisations = await this.prisma.autorisationAcces.findMany({
      where: {
        adminId
      },
      include: {
        entreprise: {
          select: { id: true, nom: true }
        },
        superAdmin: {
          select: { id: true, nom: true, prenom: true, email: true }
        },
        admin: {
          select: { id: true, nom: true, prenom: true, email: true }
        }
      },
      orderBy: {
        dateCreation: 'desc'
      }
    });

    return autorisations.map(auth => this.mapperVersEntite(auth));
  }

  /**
   * Récupère toutes les autorisations pour une entreprise
   */
  async obtenirAutorisationsEntreprise(entrepriseId: string): Promise<AutorisationAcces[]> {
    const autorisations = await this.prisma.autorisationAcces.findMany({
      where: {
        entrepriseId
      },
      include: {
        entreprise: {
          select: { id: true, nom: true }
        },
        superAdmin: {
          select: { id: true, nom: true, prenom: true, email: true }
        },
        admin: {
          select: { id: true, nom: true, prenom: true, email: true }
        }
      },
      orderBy: {
        dateCreation: 'desc'
      }
    });

    return autorisations.map(auth => this.mapperVersEntite(auth));
  }

  /**
   * Désactive une autorisation spécifique
   */
  async desactiver(id: string): Promise<AutorisationAcces | null> {
    const autorisationMiseAJour = await this.prisma.autorisationAcces.update({
      where: { id },
      data: { 
        estActif: false,
        dateDesactivation: new Date()
      },
      include: {
        entreprise: {
          select: { id: true, nom: true }
        },
        superAdmin: {
          select: { id: true, nom: true, prenom: true, email: true }
        },
        admin: {
          select: { id: true, nom: true, prenom: true, email: true }
        }
      }
    });

    return this.mapperVersEntite(autorisationMiseAJour);
  }

  /**
   * Désactive toutes les autorisations d'un SuperAdmin pour une entreprise
   */
  async desactiverToutesAutorisations(superAdminId: string, entrepriseId: string): Promise<number> {
    const resultat = await this.prisma.autorisationAcces.updateMany({
      where: {
        superAdminId,
        entrepriseId,
        estActif: true
      },
      data: { 
        estActif: false,
        dateDesactivation: new Date()
      }
    });

    return resultat.count;
  }

  /**
   * Supprime les autorisations expirées
   */
  async nettoyerAutorisationsExpirees(): Promise<number> {
    const resultat = await this.prisma.autorisationAcces.deleteMany({
      where: {
        OR: [
          {
            dateExpiration: {
              lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Plus de 30 jours expirées
            }
          },
          {
            estActif: false,
            dateDesactivation: {
              lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Désactivées depuis plus de 7 jours
            }
          }
        ]
      }
    });

    return resultat.count;
  }

  /**
   * Vérifie s'il existe déjà une autorisation active pour ce SuperAdmin et cette entreprise
   */
  async existeAutorisationActive(superAdminId: string, entrepriseId: string): Promise<boolean> {
    const autorisation = await this.prisma.autorisationAcces.findFirst({
      where: {
        superAdminId,
        entrepriseId,
        estActif: true,
        dateExpiration: {
          gt: new Date()
        }
      }
    });

    return autorisation !== null;
  }

  /**
   * Récupère les statistiques des autorisations
   */
  async obtenirStatistiques(): Promise<{
    totalAutorisations: number;
    autorisationsActives: number;
    autorisationsExpirees: number;
    autorisationsDesactivees: number;
    entreprisesAvecAcces: number;
  }> {
    const [total, actives, expirees, desactivees, entreprisesUniques] = await Promise.all([
      this.prisma.autorisationAcces.count(),
      this.prisma.autorisationAcces.count({
        where: {
          estActif: true,
          dateExpiration: {
            gt: new Date()
          }
        }
      }),
      this.prisma.autorisationAcces.count({
        where: {
          estActif: true,
          dateExpiration: {
            lt: new Date()
          }
        }
      }),
      this.prisma.autorisationAcces.count({
        where: {
          estActif: false
        }
      }),
      this.prisma.autorisationAcces.findMany({
        where: {
          estActif: true,
          dateExpiration: {
            gt: new Date()
          }
        },
        select: {
          entrepriseId: true
        },
        distinct: ['entrepriseId']
      })
    ]);

    return {
      totalAutorisations: total,
      autorisationsActives: actives,
      autorisationsExpirees: expirees,
      autorisationsDesactivees: desactivees,
      entreprisesAvecAcces: entreprisesUniques.length
    };
  }

  /**
   * Récupère une autorisation par son ID
   */
  async obtenirAutorisationParId(id: string): Promise<AutorisationAcces | null> {
    const autorisation = await this.prisma.autorisationAcces.findUnique({
      where: { id },
      include: {
        entreprise: {
          select: { id: true, nom: true }
        },
        superAdmin: {
          select: { id: true, nom: true, prenom: true, email: true }
        },
        admin: {
          select: { id: true, nom: true, prenom: true, email: true }
        }
      }
    });

    return autorisation ? this.mapperVersEntite(autorisation) : null;
  }

  /**
   * Met à jour une autorisation
   */
  async mettreAJour(id: string, donnees: Partial<{
    dateExpiration: Date;
    estActif: boolean;
    raisonAcces: string;
  }>): Promise<AutorisationAcces | null> {
    const autorisationMiseAJour = await this.prisma.autorisationAcces.update({
      where: { id },
      data: donnees,
      include: {
        entreprise: {
          select: { id: true, nom: true }
        },
        superAdmin: {
          select: { id: true, nom: true, prenom: true, email: true }
        },
        admin: {
          select: { id: true, nom: true, prenom: true, email: true }
        }
      }
    });

    return this.mapperVersEntite(autorisationMiseAJour);
  }

  /**
   * Mappe les données Prisma vers l'entité AutorisationAcces
   */
  private mapperVersEntite(data: any): AutorisationAcces {
    const autorisation = new AutorisationAcces({
      id: data.id,
      entrepriseId: data.entrepriseId,
      superAdminId: data.superAdminId,
      adminId: data.adminId,
      dateCreation: data.dateCreation,
      dateExpiration: data.dateExpiration,
      estActif: data.estActif,
      raisonAcces: data.raisonAcces
    });

    // Ajouter les relations si elles existent
    if (data.entreprise) {
      autorisation.entreprise = data.entreprise;
    }
    if (data.superAdmin) {
      autorisation.superAdmin = data.superAdmin;
    }
    if (data.admin) {
      autorisation.admin = data.admin;
    }

    return autorisation;
  }
}