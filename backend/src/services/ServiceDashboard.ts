import { PrismaClient } from '@prisma/client';
import { StatutBulletinPaie, StatutCyclePaie } from '@/enums';

export class ServiceDashboard {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Obtenir les statistiques complètes du dashboard
  async obtenirStatistiquesCompletes(entrepriseId: string): Promise<any> {
    const [
      entreprise,
      employes,
      paiements,
      cycles
    ] = await Promise.all([
      this.obtenirInfosEntreprise(entrepriseId),
      this.obtenirStatistiquesEmployes(entrepriseId),
      this.obtenirStatistiquesPaiements(entrepriseId),
      this.obtenirStatistiquesCycles(entrepriseId)
    ]);

    return {
      entreprise,
      employes,
      paiements,
      cycles
    };
  }

  // Obtenir les informations de l'entreprise
  private async obtenirInfosEntreprise(entrepriseId: string): Promise<any> {
    const entreprise = await this.prisma.entreprise.findUnique({
      where: { id: entrepriseId }
    });

    return {
      id: entreprise?.id,
      nom: entreprise?.nom,
      adresse: entreprise?.adresse,
      devise: entreprise?.devise,
      logo: entreprise?.logo,
      telephone: entreprise?.telephone,
      email: entreprise?.email,
      secteurActivite: entreprise?.secteurActivite
    };
  }

  // Obtenir les statistiques des employés
  private async obtenirStatistiquesEmployes(entrepriseId: string): Promise<any> {
    const [
      totalEmployes,
      employesActifs,
      employesInactifs,
      nouveauxCeMois,
      parTypeContrat
    ] = await Promise.all([
      this.prisma.employe.count({ where: { entrepriseId } }),
      this.prisma.employe.count({ where: { entrepriseId, actif: true } }),
      this.prisma.employe.count({ where: { entrepriseId, actif: false } }),
      this.prisma.employe.count({
        where: {
          entrepriseId,
          dateCreation: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      this.prisma.employe.groupBy({
        by: ['typeContrat'],
        where: { entrepriseId, actif: true },
        _count: true
      })
    ]);

    return {
      total: totalEmployes,
      actifs: employesActifs,
      inactifs: employesInactifs,
      nouveauxCeMois,
      parTypeContrat: parTypeContrat.reduce((acc, item) => {
        acc[item.typeContrat] = item._count;
        return acc;
      }, {} as any)
    };
  }

  // Obtenir les statistiques des cycles
  private async obtenirStatistiquesCycles(entrepriseId: string): Promise<any> {
    const cycles = await this.prisma.cyclePaie.findMany({
      where: { entrepriseId },
      orderBy: { dateCreation: 'desc' },
      take: 5,
      include: {
        bulletinsPaie: true
      }
    });

    return {
      recent: cycles.map(cycle => ({
        id: cycle.id,
        nom: cycle.nom,
        dateDebut: cycle.dateDebut,
        dateFin: cycle.dateFin,
        statut: cycle.statut,
        nombreBulletins: cycle.bulletinsPaie.length
      }))
    };
  }

  // Obtenir les statistiques des paiements
  async obtenirStatistiquesPaiements(entrepriseId: string): Promise<any> {
    const [
      statsParMode,
      paiementsDernierMois,
      totalPaiements,
      masseSalarialeTotal,
      derniersPaiements
    ] = await Promise.all([
      this.prisma.paiement.groupBy({
        by: ['modePaiement'],
        where: { entrepriseId },
        _count: { id: true },
        _sum: { montant: true }
      }),
      this.prisma.paiement.count({
        where: {
          entrepriseId,
          dateCreation: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      this.prisma.paiement.aggregate({
        where: { entrepriseId },
        _count: { id: true },
        _sum: { montant: true }
      }),
      this.prisma.employe.aggregate({
        where: { entrepriseId, actif: true },
        _sum: { salaireFixe: true }
      }),
      this.prisma.paiement.findMany({
        where: { entrepriseId },
        include: { employe: true },
        orderBy: { dateCreation: 'desc' },
        take: 5
      })
    ]);

    return {
      parMode: statsParMode.map(stat => ({
        mode: stat.modePaiement,
        nombre: stat._count.id,
        montantTotal: Number(stat._sum.montant) || 0
      })),
      dernierMois: paiementsDernierMois,
      total: {
        nombre: totalPaiements._count.id,
        montant: Number(totalPaiements._sum.montant) || 0
      },
      masseSalarialeTotal: Number(masseSalarialeTotal._sum.salaireFixe) || 0,
      variationMois: 0,
      derniersPaiements: derniersPaiements.map(p => ({
        id: p.id,
        employe: p.employe.nomComplet,
        montant: Number(p.montant),
        modePaiement: p.modePaiement,
        date: p.datePaiement
      }))
    };
  }

  // Exporter la liste des employés
  async exporterEmployes(entrepriseId: string): Promise<any[]> {
    const employes = await this.prisma.employe.findMany({
      where: { entrepriseId },
      orderBy: { nomComplet: 'asc' },
      include: {
        paiements: {
          orderBy: { dateCreation: 'desc' },
          take: 1
        }
      }
    });

    return employes.map(emp => ({
      id: emp.id,
      nomComplet: emp.nomComplet,
      email: emp.email,
      telephone: emp.telephone,
      poste: emp.poste,
      typeContrat: emp.typeContrat,
      salaireFixe: Number(emp.salaireFixe) || null,
      tauxHonoraire: Number(emp.tauxHonoraire) || null,
      tauxSalaireHoraire: Number(emp.tauxSalaireHoraire) || null,
      dateEmbauche: emp.dateEmbauche,
      adresse: emp.adresse,
      actif: emp.actif,
      dernierPaiement: emp.paiements[0] ? {
        montant: Number(emp.paiements[0].montant),
        date: emp.paiements[0].datePaiement,
        modePaiement: emp.paiements[0].modePaiement
      } : null
    }));
  }

  // Générer un rapport mensuel
  async genererRapportMensuel(entrepriseId: string, annee: number, mois: number): Promise<any> {
    const dateDebut = new Date(annee, mois - 1, 1);
    const dateFin = new Date(annee, mois, 0, 23, 59, 59);

    const [
      employes,
      paiements,
      cycles,
      statistiquesGlobales
    ] = await Promise.all([
      this.prisma.employe.findMany({
        where: { entrepriseId, actif: true }
      }),
      this.prisma.paiement.findMany({
        where: {
          entrepriseId,
          datePaiement: { gte: dateDebut, lte: dateFin }
        },
        include: { employe: true }
      }),
      this.prisma.cyclePaie.findMany({
        where: {
          entrepriseId,
          dateDebut: { gte: dateDebut },
          dateFin: { lte: dateFin }
        },
        include: { bulletinsPaie: true }
      }),
      this.prisma.entreprise.findUnique({
        where: { id: entrepriseId }
      })
    ]);

    const totalPaiements = paiements.reduce((sum, p) => sum + Number(p.montant), 0);
    const paiementsParMode = paiements.reduce((acc, p) => {
      acc[p.modePaiement] = (acc[p.modePaiement] || 0) + Number(p.montant);
      return acc;
    }, {} as any);

    return {
      periode: {
        annee,
        mois,
        dateDebut,
        dateFin
      },
      entreprise: {
        nom: statistiquesGlobales?.nom,
        adresse: statistiquesGlobales?.adresse
      },
      resume: {
        nombreEmployes: employes.length,
        nombrePaiements: paiements.length,
        montantTotalPaye: totalPaiements,
        nombreCycles: cycles.length
      },
      paiements: {
        liste: paiements.map(p => ({
          employe: p.employe.nomComplet,
          montant: Number(p.montant),
          modePaiement: p.modePaiement,
          date: p.datePaiement,
          reference: p.reference
        })),
        parMode: paiementsParMode
      },
      employes: employes.map(emp => ({
        nomComplet: emp.nomComplet,
        poste: emp.poste,
        typeContrat: emp.typeContrat,
        salaire: Number(emp.salaireFixe || emp.tauxHonoraire || emp.tauxSalaireHoraire) || 0
      }))
    };
  }
}
