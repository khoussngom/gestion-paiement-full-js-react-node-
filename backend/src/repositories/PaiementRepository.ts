import { BasePrismaRepository } from './BasePrismaRepository';
import { Paiement } from '../entities/Paiement';

export class PaiementRepository extends BasePrismaRepository {

  async creerPaiement(paiementData: {
    bulletinPaieId: string;
    employeId: string;
    utilisateurId: string;
    montant: number;
    modePaiement: 'ESPECES' | 'VIREMENT_BANCAIRE' | 'ORANGE_MONEY' | 'WAVE' | 'AUTRE';
    reference?: string;
    notes?: string;
    entrepriseId: string;
  }): Promise<any> {
    const result = await this.prisma.paiement.create({
      data: paiementData,
      include: {
        employe: true,
        bulletinPaie: {
          include: {
            cyclePaie: true,
          },
        },
      },
    });
    return result;
  }

  async obtenirPaiementsParEntreprise(entrepriseId: string): Promise<any[]> {
    return await this.prisma.paiement.findMany({
      where: { entrepriseId },
      include: {
        employe: true,
        bulletinPaie: {
          include: {
            cyclePaie: true,
          },
        },
      },
      orderBy: { dateCreation: 'desc' },
    });
  }

  async obtenirPaiementsParEmploye(employeId: string): Promise<any[]> {
    return await this.prisma.paiement.findMany({
      where: { employeId },
      include: {
        bulletinPaie: {
          include: {
            cyclePaie: true,
          },
        },
      },
      orderBy: { dateCreation: 'desc' },
    });
  }

  async calculerMasseSalarialeParPeriode(
    entrepriseId: string,
    dateDebut: Date,
    dateFin: Date
  ): Promise<number> {
    const result = await this.prisma.paiement.aggregate({
      _sum: {
        montant: true,
      },
      where: {
        entrepriseId,
        datePaiement: {
          gte: dateDebut,
          lte: dateFin,
        },
      },
    });

    return Number(result._sum.montant || 0);
  }
}
