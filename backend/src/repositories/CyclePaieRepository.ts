import { PrismaClient } from '@prisma/client';
import { BasePrismaRepository } from './BasePrismaRepository';
import { CyclePaie } from '@/entities/CyclePaie';
import { CreerCyclePaieDto } from '@/validators';
import { StatutCyclePaie, TypeCyclePaie } from '@/enums';

export class CyclePaieRepository extends BasePrismaRepository {
  
  async getAll(): Promise<CyclePaie[]> {
    const cycles = await this.prisma.cyclePaie.findMany({
      include: {
        entreprise: true,
        bulletinsPaie: {
          include: {
            employe: true
          }
        }
      },
      orderBy: {
        dateCreation: 'desc'
      }
    });
    return cycles.map(c => new CyclePaie(c));
  }

  async getById(id: string): Promise<CyclePaie | null> {
    const cycle = await this.prisma.cyclePaie.findUnique({
      where: { id },
      include: {
        entreprise: true,
        bulletinsPaie: {
          include: {
            employe: true
          }
        }
      }
    });
    return cycle ? new CyclePaie(cycle) : null;
  }

  async getByEntreprise(entrepriseId: string): Promise<CyclePaie[]> {
    const cycles = await this.prisma.cyclePaie.findMany({
      where: { entrepriseId },
      include: {
        entreprise: true,
        bulletinsPaie: {
          include: {
            employe: true
          }
        }
      },
      orderBy: {
        dateCreation: 'desc'
      }
    });
    return cycles.map(c => new CyclePaie(c));
  }

  async create(donnees: CreerCyclePaieDto): Promise<CyclePaie> {
    const cycle = await this.prisma.cyclePaie.create({
      data: donnees,
      include: {
        entreprise: true,
        bulletinsPaie: true
      }
    });
    return new CyclePaie(cycle);
  }

  async update(id: string, donnees: Partial<CreerCyclePaieDto>): Promise<CyclePaie> {
    const cycle = await this.prisma.cyclePaie.update({
      where: { id },
      data: {
        ...donnees,
        dateModification: new Date()
      },
      include: {
        entreprise: true,
        bulletinsPaie: {
          include: {
            employe: true
          }
        }
      }
    });
    return new CyclePaie(cycle);
  }

  async updateStatus(id: string, statut: StatutCyclePaie): Promise<CyclePaie> {
    const cycle = await this.prisma.cyclePaie.update({
      where: { id },
      data: {
        statut,
        dateModification: new Date()
      },
      include: {
        entreprise: true,
        bulletinsPaie: {
          include: {
            employe: true
          }
        }
      }
    });
    return new CyclePaie(cycle);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.cyclePaie.delete({
      where: { id }
    });
  }

  async getActiveCycles(entrepriseId: string): Promise<CyclePaie[]> {
    const cycles = await this.prisma.cyclePaie.findMany({
      where: {
        entrepriseId,
        statut: {
          in: [StatutCyclePaie.BROUILLON, StatutCyclePaie.APPROUVE]
        }
      },
      include: {
        entreprise: true,
        bulletinsPaie: {
          include: {
            employe: true
          }
        }
      },
      orderBy: {
        dateCreation: 'desc'
      }
    });
    return cycles.map(c => new CyclePaie(c));
  }

  async getByPeriod(entrepriseId: string, dateDebut: Date, dateFin: Date): Promise<CyclePaie[]> {
    const cycles = await this.prisma.cyclePaie.findMany({
      where: {
        entrepriseId,
        dateDebut: {
          gte: dateDebut
        },
        dateFin: {
          lte: dateFin
        }
      },
      include: {
        entreprise: true,
        bulletinsPaie: {
          include: {
            employe: true
          }
        }
      },
      orderBy: {
        dateDebut: 'desc'
      }
    });
    return cycles.map(c => new CyclePaie(c));
  }

  async checkOverlap(entrepriseId: string, dateDebut: Date, dateFin: Date, typeCycle: TypeCyclePaie, excluId?: string): Promise<CyclePaie | null> {
    const cycle = await this.prisma.cyclePaie.findFirst({
      where: {
        entrepriseId,
        // Vérifier les chevauchements uniquement pour le même type de cycle
        // Car les cycles mensuels (SALAIRE_FIXE) et hebdomadaires (HONORAIRE) ciblent des employés différents
        typeCycle,
        ...(excluId && { id: { not: excluId } }),
        OR: [
          {
            dateDebut: {
              lte: dateFin
            },
            dateFin: {
              gte: dateDebut
            }
          }
        ]
      },
      include: {
        entreprise: true,
        bulletinsPaie: true
      }
    });
    return cycle ? new CyclePaie(cycle) : null;
  }

  async countByEntreprise(entrepriseId: string): Promise<number> {
    return await this.prisma.cyclePaie.count({
      where: { entrepriseId }
    });
  }
}
