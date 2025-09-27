import { BasePrismaRepository } from './BasePrismaRepository';
import { CreerEmployeDto, FiltresEmployeDto } from '@/validators';
import { Employe } from '@/entities/Employe';
import { TypeContrat } from '@/enums';

export class EmployeRepository extends BasePrismaRepository {
  
  async getAll(): Promise<Employe[]> {
    const employes = await this.prisma.employe.findMany({
      include: {
        entreprise: true
      },
      orderBy: { nomComplet: 'asc' }
    });
    return employes.map(e => new Employe(e));
  }

  async getById(id: string): Promise<Employe | null> {
    const employe = await this.prisma.employe.findUnique({
      where: { id },
      include: {
        entreprise: {
          select: {
            id: true,
            nom: true,
            devise: true
          }
        },
        bulletinsPaie: {
          include: {
            cyclePaie: {
              select: {
                nom: true,
                dateDebut: true,
                dateFin: true
              }
            },
            paiements: {
              select: {
                montant: true,
                datePaiement: true
              }
            }
          },
          orderBy: {
            dateCreation: 'desc'
          },
          take: 10
        }
      }
    });
    return employe ? new Employe(employe) : null;
  }

  async create(donnees: CreerEmployeDto): Promise<Employe> {
    const employe = await this.prisma.employe.create({
      data: donnees,
      include: {
        entreprise: true
      }
    });
    return new Employe(employe);
  }

  async getByEntreprise(
    entrepriseId: string, 
    filtres?: FiltresEmployeDto
  ): Promise<Employe[]> {
    const conditions: any = { entrepriseId };

    // Application des filtres
    if (filtres?.actif !== undefined) {
      conditions.actif = filtres.actif;
    }

    if (filtres?.typeContrat) {
      conditions.typeContrat = filtres.typeContrat;
    }

    if (filtres?.poste) {
      conditions.poste = {
        contains: filtres.poste
      };
    }

    if (filtres?.recherche) {
      conditions.OR = [
        {
          nomComplet: {
            contains: filtres.recherche
          }
        },
        {
          poste: {
            contains: filtres.recherche
          }
        },
        {
          email: {
            contains: filtres.recherche
          }
        }
      ];
    }

    const employes = await this.prisma.employe.findMany({
      where: conditions,
      include: {
        entreprise: {
          select: {
            nom: true,
            devise: true
          }
        },
        _count: {
          select: {
            bulletinsPaie: true
          }
        }
      },
      orderBy: { nomComplet: 'asc' }
    });

    return employes.map(e => new Employe(e));
  }

  async update(id: string, donnees: Partial<CreerEmployeDto>): Promise<Employe> {
    const employe = await this.prisma.employe.update({
      where: { id },
      data: {
        ...donnees,
        dateModification: new Date()
      },
      include: {
        entreprise: true
      }
    });
    return new Employe(employe);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.employe.delete({
      where: { id }
    });
  }

  async toggleActive(id: string, actif: boolean): Promise<Employe> {
    const employe = await this.prisma.employe.update({
      where: { id },
      data: {
        actif,
        dateModification: new Date()
      },
      include: {
        entreprise: true
      }
    });
    return new Employe(employe);
  }

  async getActiveByEntreprise(entrepriseId: string): Promise<Employe[]> {
    const employes = await this.prisma.employe.findMany({
      where: {
        entrepriseId,
        actif: true
      },
      include: {
        entreprise: true
      },
      orderBy: { nomComplet: 'asc' }
    });
    return employes.map(e => new Employe(e));
  }

  async getStatistics(employeId: string): Promise<any> {
    const employe = await this.prisma.employe.findUnique({
      where: { id: employeId },
      include: {
        bulletinsPaie: {
          include: {
            paiements: {
              select: {
                montant: true
              }
            }
          }
        }
      }
    });

    if (!employe) return null;

    const totalBrut = employe.bulletinsPaie.reduce((total, bulletin) => 
      total + Number(bulletin.salaireBrut), 0
    );

    const totalNet = employe.bulletinsPaie.reduce((total, bulletin) => 
      total + Number(bulletin.salaireNet), 0
    );

    const totalPaye = employe.bulletinsPaie.reduce((total, bulletin) => {
      const paiementsBulletin = bulletin.paiements.reduce((somme, paiement) => 
        somme + Number(paiement.montant), 0
      );
      return total + paiementsBulletin;
    }, 0);

    return {
      ...employe,
      statistiques: {
        totalBrut,
        totalNet,
        totalPaye,
        totalRestant: totalNet - totalPaye,
        nombreBulletins: employe.bulletinsPaie.length
      }
    };
  }

  async search(
    entrepriseId: string, 
    termeRecherche: string
  ): Promise<Employe[]> {
    const employes = await this.prisma.employe.findMany({
      where: {
        entrepriseId,
        OR: [
          {
            nomComplet: {
              contains: termeRecherche
            }
          },
          {
            poste: {
              contains: termeRecherche
            }
          },
          {
            email: {
              contains: termeRecherche
            }
          }
        ]
      },
      include: {
        entreprise: {
          select: {
            nom: true,
            devise: true
          }
        }
      }
    });
    
    return employes.map(e => new Employe(e));
  }
  
  async countByEntreprise(entrepriseId: string): Promise<number> {
    return await this.prisma.employe.count({
      where: { entrepriseId }
    });
  }

  async countActiveByEntreprise(entrepriseId: string): Promise<number> {
    return await this.prisma.employe.count({
      where: { 
        entrepriseId,
        actif: true 
      }
    });
  }

  async getStatsByTypeContrat(entrepriseId: string): Promise<any[]> {
    const stats = await this.prisma.employe.groupBy({
      by: ['typeContrat'],
      where: { entrepriseId },
      _count: {
        typeContrat: true
      }
    });

    return stats.map(stat => ({
      typeContrat: stat.typeContrat,
      nombre: stat._count.typeContrat
    }));
  }
}
