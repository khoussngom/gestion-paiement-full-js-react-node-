import { PrismaClient } from '@prisma/client';
import { ServiceDashboard } from './ServiceDashboard';

export class PaiementService {
  private prisma: PrismaClient;
  private serviceDashboard: ServiceDashboard;

  constructor() {
    this.prisma = new PrismaClient();
    this.serviceDashboard = new ServiceDashboard();
  }

  async obtenirTousPaiements(entrepriseId: string) {
    return await this.prisma.paiement.findMany({
      where: { entrepriseId },
      include: {
        employe: true,
        bulletinPaie: true,
        utilisateur: true
      },
      orderBy: { dateCreation: 'desc' }
    });
  }

  async obtenirStatistiques(entrepriseId: string) {
    const stats = await this.serviceDashboard.obtenirStatistiquesCompletes(entrepriseId);
    
    // Adapter la structure pour le frontend des paiements
    return {
      totalEmployes: stats.employes?.actifs || 0,
      totalSalaireBrut: stats.paiements?.masseSalarialeTotal || 0,
      paiementsEffectues: stats.paiements?.total?.nombre || 0,
      paiementsEnAttente: Math.max(0, (stats.employes?.actifs || 0) - (stats.paiements?.total?.nombre || 0))
    };
  }

  async creerPaiement(entrepriseId: string, utilisateurId: string, donneesPaiement: any) {
    return await this.prisma.paiement.create({
      data: {
        ...donneesPaiement,
        entrepriseId,
        utilisateurId
      },
      include: {
        employe: true,
        bulletinPaie: true
      }
    });
  }

  async exporterCSV(entrepriseId: string) {
    const paiements = await this.obtenirTousPaiements(entrepriseId);
    
    const csvHeader = 'Employé,Montant,Mode de paiement,Date,Statut Bulletin,Référence\n';
    const csvData = paiements.map(p => 
      `"${p.employe?.nomComplet || 'N/A'}","${p.montant}","${p.modePaiement}","${new Date(p.datePaiement).toLocaleDateString('fr-FR')}","${p.bulletinPaie?.statut || 'N/A'}","${p.reference || 'N/A'}"`
    ).join('\n');

    return csvHeader + csvData;
  }

  async genererRapport(entrepriseId: string) {
    const paiements = await this.obtenirTousPaiements(entrepriseId);
    const stats = await this.serviceDashboard.obtenirStatistiquesCompletes(entrepriseId);
    
    return `
RAPPORT DES PAIEMENTS
=====================
Date de génération: ${new Date().toLocaleDateString('fr-FR')}

STATISTIQUES GÉNÉRALES
----------------------
Total employés: ${stats.employes?.actifs || 0}
Paiements effectués: ${paiements.length}
Masse salariale totale: ${paiements.reduce((sum, p) => sum + Number(p.montant), 0)} FCFA

DÉTAIL DES PAIEMENTS
--------------------
${paiements.map(p => `
- ${p.employe?.nomComplet || 'N/A'}: ${p.montant} FCFA (${p.modePaiement}) - ${new Date(p.datePaiement).toLocaleDateString('fr-FR')} - Statut bulletin: ${p.bulletinPaie?.statut || 'N/A'}
`).join('')}

Fin du rapport
`;
  }
}
