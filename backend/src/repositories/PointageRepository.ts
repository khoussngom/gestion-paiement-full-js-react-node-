import { BasePrismaRepository } from './BasePrismaRepository';
import { Pointage } from '../entities/Pointage';
import { StatutPresence, TypePointage } from '../enums';

export class PointageRepository extends BasePrismaRepository {

  /**
   * Crée un nouveau pointage
   */
  async creerPointage(pointageData: {
    employeId: string;
    entrepriseId: string;
    date: Date;
    heureArrivee?: Date;
    heureSortie?: Date;
    typePointage: TypePointage;
    statutPresence: StatutPresence;
    adresseIP?: string;
    userAgent?: string;
    notes?: string;
    vigileId?: string;
  }): Promise<any> {
    return await this.prisma.pointage.create({
      data: {
        employeId: pointageData.employeId,
        entrepriseId: pointageData.entrepriseId,
        date: pointageData.date,
        heureArrivee: pointageData.heureArrivee,
        heureSortie: pointageData.heureSortie,
        typePointage: pointageData.typePointage,
        statutPresence: pointageData.statutPresence,
        adresseIP: pointageData.adresseIP,
        userAgent: pointageData.userAgent,
        notes: pointageData.notes,
        valideParVigile: !!pointageData.vigileId,
        vigileId: pointageData.vigileId,
        tempsTraite: new Date()
      },
      include: {
        employe: {
          select: {
            id: true,
            nomComplet: true,
            poste: true,
            email: true
          }
        },
        vigile: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        }
      }
    });
  }

  /**
   * Trouve un pointage existant pour un employé à une date donnée
   */
  async trouverPointageDuJour(employeId: string, date: Date, typePointage: TypePointage): Promise<any> {
    const dateSeule = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    return await this.prisma.pointage.findFirst({
      where: {
        employeId: employeId,
        date: dateSeule,
        typePointage: typePointage
      },
      include: {
        employe: {
          select: {
            id: true,
            nomComplet: true,
            poste: true
          }
        }
      }
    });
  }

  /**
   * Met à jour un pointage existant
   */
  async mettreAJour(pointageId: string, donneesUpdate: {
    heureSortie?: Date;
    statutPresence?: StatutPresence;
    notes?: string;
    vigileId?: string;
  }): Promise<any> {
    return await this.prisma.pointage.update({
      where: { id: pointageId },
      data: {
        ...donneesUpdate,
        valideParVigile: donneesUpdate.vigileId ? true : undefined
      },
      include: {
        employe: {
          select: {
            id: true,
            nomComplet: true,
            poste: true
          }
        },
        vigile: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        }
      }
    });
  }

  /**
   * Obtient les pointages d'une entreprise avec filtres
   */
  async obtenirPointages(entrepriseId: string, filtres?: {
    dateDebut?: Date;
    dateFin?: Date;
    employeId?: string;
    statutPresence?: StatutPresence;
    page?: number;
    limite?: number;
  }): Promise<any[]> {
    const page = filtres?.page || 1;
    const limite = filtres?.limite || 50;
    const skip = (page - 1) * limite;

    const where: any = {
      entrepriseId: entrepriseId
    };

    if (filtres?.dateDebut || filtres?.dateFin) {
      where.date = {};
      if (filtres.dateDebut) where.date.gte = filtres.dateDebut;
      if (filtres.dateFin) where.date.lte = filtres.dateFin;
    }

    if (filtres?.employeId) {
      where.employeId = filtres.employeId;
    }

    if (filtres?.statutPresence) {
      where.statutPresence = filtres.statutPresence;
    }

    return await this.prisma.pointage.findMany({
      where,
      include: {
        employe: {
          select: {
            id: true,
            nomComplet: true,
            poste: true,
            email: true
          }
        },
        vigile: {
          select: {
            id: true,
            nom: true,
            prenom: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { heureArrivee: 'desc' }
      ],
      skip,
      take: limite
    });
  }

  /**
   * Compte le nombre total de pointages avec filtres
   */
  async compterPointages(entrepriseId: string, filtres?: {
    dateDebut?: Date;
    dateFin?: Date;
    employeId?: string;
    statutPresence?: StatutPresence;
  }): Promise<number> {
    const where: any = {
      entrepriseId: entrepriseId
    };

    if (filtres?.dateDebut || filtres?.dateFin) {
      where.date = {};
      if (filtres.dateDebut) where.date.gte = filtres.dateDebut;
      if (filtres.dateFin) where.date.lte = filtres.dateFin;
    }

    if (filtres?.employeId) {
      where.employeId = filtres.employeId;
    }

    if (filtres?.statutPresence) {
      where.statutPresence = filtres.statutPresence;
    }

    return await this.prisma.pointage.count({ where });
  }

  /**
   * Obtient les statistiques de pointage d'une entreprise
   */
  async obtenirStatistiques(entrepriseId: string, periode?: {
    dateDebut: Date;
    dateFin: Date;
  }): Promise<any> {
    const where: any = {
      entrepriseId: entrepriseId
    };

    if (periode) {
      where.date = {
        gte: periode.dateDebut,
        lte: periode.dateFin
      };
    }

    const [
      totalPointages,
      presents,
      retards,
      absents,
      pointagesEntrees
    ] = await Promise.all([
      this.prisma.pointage.count({ where }),
      this.prisma.pointage.count({
        where: { ...where, statutPresence: StatutPresence.PRESENT }
      }),
      this.prisma.pointage.count({
        where: { ...where, statutPresence: StatutPresence.RETARD }
      }),
      this.prisma.pointage.count({
        where: { ...where, statutPresence: StatutPresence.ABSENT }
      }),
      this.prisma.pointage.findMany({
        where: {
          ...where,
          heureArrivee: { not: null },
          typePointage: TypePointage.ENTREE
        },
        select: {
          heureArrivee: true
        }
      })
    ]);

    // Calculer la moyenne des heures d'arrivée manuellement
    let moyenneArriveeCalculee: string | null = null;
    if (pointagesEntrees.length > 0) {
      const sommeMinutes = pointagesEntrees.reduce((acc: number, p: any) => {
        if (p.heureArrivee) {
          const date = new Date(p.heureArrivee);
          return acc + (date.getHours() * 60 + date.getMinutes());
        }
        return acc;
      }, 0);
      const moyenneMinutes = Math.round(sommeMinutes / pointagesEntrees.length);
      const heures = Math.floor(moyenneMinutes / 60);
      const minutes = moyenneMinutes % 60;
      moyenneArriveeCalculee = `${heures.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    return {
      totalPointages,
      presents,
      retards,
      absents,
      tauxPresence: totalPointages > 0 ? (presents / totalPointages) * 100 : 0,
      tauxRetard: totalPointages > 0 ? (retards / totalPointages) * 100 : 0,
      tauxAbsence: totalPointages > 0 ? (absents / totalPointages) * 100 : 0,
      moyenneArrivee: moyenneArriveeCalculee
    };
  }

  /**
   * Obtient le rapport de pointage par employé
   */
  async obtenirRapportParEmploye(entrepriseId: string, periode: {
    dateDebut: Date;
    dateFin: Date;
  }): Promise<any[]> {
    return await this.prisma.employe.findMany({
      where: {
        entrepriseId: entrepriseId,
        actif: true
      },
      select: {
        id: true,
        nomComplet: true,
        poste: true,
        pointages: {
          where: {
            date: {
              gte: periode.dateDebut,
              lte: periode.dateFin
            }
          },
          select: {
            date: true,
            heureArrivee: true,
            heureSortie: true,
            statutPresence: true,
            typePointage: true
          }
        }
      }
    });
  }

  /**
   * Marque automatiquement les absents (processus automatique)
   */
  async marquerAbsents(entrepriseId: string, date: Date): Promise<number> {
    const dateSeule = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const heureLimit = new Date(dateSeule);
    heureLimit.setHours(16, 0, 0, 0); // 16h00

    // Trouver les employés actifs qui n'ont pas de pointage aujourd'hui
    const employesSansPointage = await this.prisma.employe.findMany({
      where: {
        entrepriseId: entrepriseId,
        actif: true,
        pointages: {
          none: {
            date: dateSeule
          }
        }
      },
      select: {
        id: true,
        nomComplet: true
      }
    });

    let compteAbsents = 0;

    for (const employe of employesSansPointage) {
      await this.creerPointage({
        employeId: employe.id,
        entrepriseId: entrepriseId,
        date: dateSeule,
        typePointage: TypePointage.ENTREE,
        statutPresence: StatutPresence.ABSENT,
        notes: 'Marqué automatiquement comme absent - Aucun pointage avant 16h00'
      });
      compteAbsents++;
    }

    return compteAbsents;
  }

  /**
   * Obtient les employés présents en temps réel
   */
  async obtenirPresentsEnTempsReel(entrepriseId: string): Promise<any[]> {
    const aujourd = new Date();
    const dateSeule = new Date(aujourd.getFullYear(), aujourd.getMonth(), aujourd.getDate());

    return await this.prisma.pointage.findMany({
      where: {
        entrepriseId: entrepriseId,
        date: dateSeule,
        typePointage: TypePointage.ENTREE,
        statutPresence: {
          in: [StatutPresence.PRESENT, StatutPresence.RETARD]
        },
        // Pas encore de pointage de sortie
        employe: {
          pointages: {
            none: {
              date: dateSeule,
              typePointage: TypePointage.SORTIE
            }
          }
        }
      },
      include: {
        employe: {
          select: {
            id: true,
            nomComplet: true,
            poste: true
          }
        }
      },
      orderBy: {
        heureArrivee: 'asc'
      }
    });
  }

  /**
   * Obtient l'historique complet d'un employé
   */
  async obtenirHistoriqueEmploye(employeId: string, limite: number = 100): Promise<any[]> {
    return await this.prisma.pointage.findMany({
      where: {
        employeId: employeId
      },
      include: {
        vigile: {
          select: {
            nom: true,
            prenom: true
          }
        }
      },
      orderBy: {
        date: 'desc'
      },
      take: limite
    });
  }

  /**
   * Calcule les heures travaillées par employé sur une période
   */
  async calculerHeuresTravaillees(entrepriseId: string, periode: {
    dateDebut: Date;
    dateFin: Date;
  }): Promise<any[]> {
    const pointages = await this.prisma.pointage.findMany({
      where: {
        entrepriseId: entrepriseId,
        date: {
          gte: periode.dateDebut,
          lte: periode.dateFin
        },
        heureArrivee: { not: null },
        heureSortie: { not: null }
      },
      include: {
        employe: {
          select: {
            id: true,
            nomComplet: true,
            poste: true,
            salaireFixe: true,
            tauxSalaireHoraire: true
          }
        }
      }
    });

    // Grouper par employé et calculer les totaux
    const resultat = new Map();

    pointages.forEach(pointage => {
      const employeId = pointage.employeId;
      if (!resultat.has(employeId)) {
        resultat.set(employeId, {
          employe: pointage.employe,
          totalHeures: 0,
          joursPresents: 0,
          joursRetard: 0,
          heuresSupplementaires: 0
        });
      }

      const stats = resultat.get(employeId);
      const heureArrivee = new Date(pointage.heureArrivee!);
      const heureSortie = new Date(pointage.heureSortie!);
      const heuresTravaillees = (heureSortie.getTime() - heureArrivee.getTime()) / (1000 * 60 * 60);

      stats.totalHeures += heuresTravaillees;
      
      if (pointage.statutPresence === StatutPresence.PRESENT) {
        stats.joursPresents++;
      } else if (pointage.statutPresence === StatutPresence.RETARD) {
        stats.joursRetard++;
      }

      // Heures supplémentaires (au-delà de 8h par jour)
      if (heuresTravaillees > 8) {
        stats.heuresSupplementaires += heuresTravaillees - 8;
      }
    });

    return Array.from(resultat.values());
  }
}