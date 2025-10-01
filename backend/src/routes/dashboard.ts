import { Router } from 'express';
import { ServiceDashboard } from '../services/ServiceDashboard';
import { PrismaClient } from '@prisma/client';
import { StatutCyclePaie } from '../enums';

const routeurDashboard = Router();
const serviceDashboard = new ServiceDashboard();
const prisma = new PrismaClient();

// GET /dashboard/statistiques - Obtenir toutes les statistiques complètes  
routeurDashboard.get('/statistiques', async (req, res) => {
  try {
    // Récupérer l'ID de l'entreprise depuis le contexte d'authentification
    let entrepriseId = (req as any).utilisateur?.entrepriseId;
    
    console.log('🔍 Dashboard statistiques demandées pour entreprise:', entrepriseId);
    console.log('🔧 [DEBUG] Route dashboard.ts principale utilisée');
    
    // Pour les tests, utiliser la première entreprise si pas d'auth
    if (!entrepriseId) {
      console.log('🔧 Mode test: utilisation de la première entreprise');
      const premiereEntreprise = await prisma.entreprise.findFirst();
      if (premiereEntreprise) {
        entrepriseId = premiereEntreprise.id;
      } else {
        return res.status(400).json({
          succes: false,
          message: 'Aucune entreprise trouvée'
        });
      }
    }

    // Récupérer les données directement avec des requêtes simples
    const totalEmployes = await prisma.employe.count({
      where: { entrepriseId }
    });

    const employesActifs = await prisma.employe.count({
      where: { entrepriseId, actif: true }
    });

    const employesInactifs = await prisma.employe.count({
      where: { entrepriseId, actif: false }
    });

    const employes = await prisma.employe.findMany({
      where: { entrepriseId, actif: true },
      select: {
        poste: true,
        typeContrat: true,
        salaireFixe: true,
        tauxHonoraire: true,
        tauxSalaireHoraire: true
      }
    });

    const totalPaiements = await prisma.paiement.count({
      where: { entrepriseId }
    });

    const montantTotalPaie = await prisma.paiement.aggregate({
      where: { entrepriseId },
      _sum: { montant: true }
    });

    console.log('📊 Données récupérées:', {
      totalEmployes,
      employesActifs, 
      employesInactifs,
      totalPaiements,
      montantTotal: montantTotalPaie._sum.montant,
      nombreEmployesDetails: employes.length
    });

    console.log('🔍 [DEBUG] Vérification comptes employés:');
    console.log('   - Total employés:', totalEmployes);
    console.log('   - Employés actifs:', employesActifs);
    console.log('   - Employés inactifs:', employesInactifs);

    console.log('🔍 DEBUG - Valeurs exactes:', {
      'Total employés': totalEmployes,
      'Employés actifs': employesActifs, 
      'Employés inactifs': employesInactifs,
      'Enterprise ID': entrepriseId
    });

    // Calculer les statistiques par poste
    const employesParPoste = employes.reduce((acc: any, emp) => {
      const poste = emp.poste || 'Non défini';
      acc[poste] = (acc[poste] || 0) + 1;
      return acc;
    }, {});

    // Calculer les statistiques par type de contrat
    const employesParTypeContrat = employes.reduce((acc: any, emp) => {
      acc[emp.typeContrat] = (acc[emp.typeContrat] || 0) + 1;
      return acc;
    }, {});

    // Calculer la masse salariale totale
    const masseSalariale = employes.reduce((total, emp) => {
      const salaire = Number(emp.salaireFixe || emp.tauxHonoraire || emp.tauxSalaireHoraire || 0);
      return total + salaire;
    }, 0);

    const moyenneSalaire = employesActifs > 0 ? Math.round(masseSalariale / employesActifs) : 0;

    // Compter les nouveaux employés ce mois
    const debutMois = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const nouveauxEmployesCeMois = await prisma.employe.count({
      where: { 
        entrepriseId, 
        actif: true,
        dateCreation: { gte: debutMois }
      }
    });

    // Récupérer les informations de l'entreprise
    const entreprise = await prisma.entreprise.findUnique({
      where: { id: entrepriseId },
      select: {
        id: true,
        nom: true,
        adresse: true,
        logo: true,
        couleurPrimaire: true,
        telephone: true,
        email: true
      }
    });

    // Récupérer les derniers paiements
    const derniersPaiements = await prisma.paiement.findMany({
      where: { entrepriseId },
      include: { employe: true },
      orderBy: { dateCreation: 'desc' },
      take: 5
    });

    // Compter les cycles actifs
    const cyclesActifs = await prisma.cyclePaie.count({
      where: { 
        entrepriseId,
        statut: { in: [StatutCyclePaie.BROUILLON, StatutCyclePaie.APPROUVE] }
      }
    });

    const totalCycles = await prisma.cyclePaie.count({
      where: { entrepriseId }
    });

    // Statistiques par mode de paiement
    const statsParMode = await prisma.paiement.groupBy({
      by: ['modePaiement'],
      where: { entrepriseId },
      _count: { id: true },
      _sum: { montant: true }
    });

    // Transformation des données pour correspondre au format attendu par le frontend
    const donneesFormatees = {
      entreprise: {
        id: entreprise?.id,
        nom: entreprise?.nom,
        adresse: entreprise?.adresse,
        logo: entreprise?.logo,
        couleurPrimaire: entreprise?.couleurPrimaire,
        telephone: entreprise?.telephone,
        email: entreprise?.email
      },
      employes: {
        total: totalEmployes,
        actifs: employesActifs,
        inactifs: employesInactifs,
        nouveauxCeMois: nouveauxEmployesCeMois,
        parTypeContrat: employesParTypeContrat
      },
      paiements: {
        total: {
          nombre: totalPaiements,
          montant: Number(montantTotalPaie._sum.montant || 0)
        },
        masseSalarialeTotal: masseSalariale,
        variationMois: 0,
        parMode: statsParMode.map(stat => ({
          mode: stat.modePaiement,
          nombre: stat._count.id,
          montantTotal: Number(stat._sum.montant) || 0
        })),
        derniersPaiements: derniersPaiements.map(p => ({
          id: p.id,
          employe: p.employe.nomComplet,
          montant: Number(p.montant),
          modePaiement: p.modePaiement,
          date: p.datePaiement
        }))
      },
      cycles: {
        total: totalCycles,
        enCours: cyclesActifs,
        recent: []
      },
      bulletins: {
        total: 0,
        cesMois: 0
      },
      // Données compatibles avec l'ancien format pour éviter les erreurs
      totalEmployes,
      totalPaiements,
      montantTotalPaie: Number(montantTotalPaie._sum.montant || 0),
      moyenneSalaire,
      employesParPoste,
      employesParTypeContrat
    };
    
    res.status(200).json({
      succes: true,
      donnees: donneesFormatees,
      message: 'Statistiques récupérées avec succès'
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      succes: false,
      message: 'Erreur serveur',
      erreur: error.message
    });
  }
});

// GET /dashboard/export/employes - Exporter la liste des employés
routeurDashboard.get('/export/employes', async (req, res) => {
  try {
    // Récupérer l'ID de l'entreprise depuis le contexte d'authentification
    const entrepriseId = (req as any).utilisateur?.entrepriseId;
    
    if (!entrepriseId) {
      return res.status(400).json({
        succes: false,
        message: 'ID entreprise manquant'
      });
    }

    const employes = await serviceDashboard.exporterEmployes(entrepriseId);
    
    res.status(200).json({
      succes: true,
      donnees: employes,
      message: `Export de ${employes.length} employés réalisé avec succès`
    });
  } catch (error: any) {
    console.error('Erreur lors de l\'export des employés:', error);
    res.status(500).json({
      succes: false,
      message: 'Erreur serveur',
      erreur: error.message
    });
  }
});

// GET /dashboard/rapport/mensuel - Générer un rapport mensuel
routeurDashboard.get('/rapport/mensuel', async (req, res) => {
  try {
    // Récupérer l'ID de l'entreprise depuis le contexte d'authentification
    const entrepriseId = (req as any).utilisateur?.entrepriseId;
    
    if (!entrepriseId) {
      return res.status(400).json({
        succes: false,
        message: 'ID entreprise manquant'
      });
    }

    const { annee, mois } = req.query;
    const currentYear = parseInt(annee as string) || new Date().getFullYear();
    const currentMonth = parseInt(mois as string) || new Date().getMonth() + 1;
    
    const rapportComplet = await serviceDashboard.genererRapportMensuel(entrepriseId, currentYear, currentMonth);
    
    // Transformation des données pour correspondre au format attendu par le frontend
    const rapport = {
      periode: `${currentMonth}/${currentYear}`,
      totalPaiements: rapportComplet.resume.nombrePaiements,
      montantTotal: rapportComplet.resume.montantTotalPaye,
      nombreEmployes: rapportComplet.resume.nombreEmployes,
      paiementsParType: rapportComplet.paiements.parMode,
      details: rapportComplet.paiements.liste.map((p: any) => ({
        nomEmploye: p.employe,
        montant: p.montant,
        datePaiement: p.date,
        type: p.modePaiement,
        reference: p.reference
      })),
      entreprise: rapportComplet.entreprise,
      employes: rapportComplet.employes
    };
    
    res.status(200).json({
      succes: true,
      donnees: rapport,
      message: `Rapport mensuel pour ${currentMonth}/${currentYear} généré avec succès`
    });
  } catch (error: any) {
    console.error('Erreur lors de la génération du rapport mensuel:', error);
    res.status(500).json({
      succes: false,
      message: 'Erreur serveur',
      erreur: error.message
    });
  }
});

// GET /dashboard/graphiques/employes-par-poste - Données pour le graphique des employés par poste
routeurDashboard.get('/graphiques/employes-par-poste', async (req, res) => {
  try {
    const entrepriseId = (req as any).utilisateur?.entrepriseId;
    
    if (!entrepriseId) {
      return res.status(400).json({
        succes: false,
        message: 'ID entreprise manquant'
      });
    }

    const employesParPoste = await serviceDashboard.obtenirStatistiquesCompletes(entrepriseId);
    
    const donnees = {
      labels: Object.keys(employesParPoste.employes.parTypeContrat || {}),
      datasets: [{
        label: 'Nombre d\'employés',
        data: Object.values(employesParPoste.employes.parTypeContrat || {}),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)',
          'rgba(255, 159, 64, 0.8)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ],
        borderWidth: 1
      }]
    };
    
    res.status(200).json({
      succes: true,
      donnees,
      message: 'Données du graphique récupérées avec succès'
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des données du graphique:', error);
    res.status(500).json({
      succes: false,
      message: 'Erreur serveur',
      erreur: error.message
    });
  }
});

// GET /dashboard/graphiques/paiements-evolution - Données pour le graphique d'évolution des paiements
routeurDashboard.get('/graphiques/paiements-evolution', async (req, res) => {
  try {
    const entrepriseId = (req as any).utilisateur?.entrepriseId;
    
    if (!entrepriseId) {
      return res.status(400).json({
        succes: false,
        message: 'ID entreprise manquant'
      });
    }

    // Récupérer les données des 6 derniers mois
    const maintenant = new Date();
    const donneesEvolution = [];
    const labels = [];

    for (let i = 5; i >= 0; i--) {
      const date = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
      const mois = date.getMonth() + 1;
      const annee = date.getFullYear();
      
      const rapport = await serviceDashboard.genererRapportMensuel(entrepriseId, annee, mois);
      
      labels.push(`${mois.toString().padStart(2, '0')}/${annee}`);
      donneesEvolution.push(rapport.resume.montantTotalPaye);
    }

    const donnees = {
      labels,
      datasets: [{
        label: 'Montant des paiements (FCFA)',
        data: donneesEvolution,
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 2,
        fill: true,
        tension: 0.4
      }]
    };
    
    res.status(200).json({
      succes: true,
      donnees,
      message: 'Données d\'évolution récupérées avec succès'
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des données d\'évolution:', error);
    res.status(500).json({
      succes: false,
      message: 'Erreur serveur',
      erreur: error.message
    });
  }
});

// GET /dashboard/graphiques/salaires-distribution - Données pour le graphique de distribution des salaires
routeurDashboard.get('/graphiques/salaires-distribution', async (req, res) => {
  try {
    const entrepriseId = (req as any).utilisateur?.entrepriseId;
    
    if (!entrepriseId) {
      return res.status(400).json({
        succes: false,
        message: 'ID entreprise manquant'
      });
    }

    const employes = await serviceDashboard.exporterEmployes(entrepriseId);
    
    // Créer des tranches de salaires
    const tranches = {
      '0-50k': 0,
      '50k-100k': 0,
      '100k-200k': 0,
      '200k-500k': 0,
      '500k+': 0
    };

    employes.forEach(emp => {
      const salaire = emp.salaireFixe || emp.tauxHonoraire || emp.tauxSalaireHoraire || 0;
      if (salaire < 50000) tranches['0-50k']++;
      else if (salaire < 100000) tranches['50k-100k']++;
      else if (salaire < 200000) tranches['100k-200k']++;
      else if (salaire < 500000) tranches['200k-500k']++;
      else tranches['500k+']++;
    });

    const donnees = {
      labels: Object.keys(tranches),
      datasets: [{
        label: 'Nombre d\'employés',
        data: Object.values(tranches),
        backgroundColor: [
          'rgba(255, 99, 132, 0.8)',
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 205, 86, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(153, 102, 255, 0.8)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)'
        ],
        borderWidth: 1
      }]
    };
    
    res.status(200).json({
      succes: true,
      donnees,
      message: 'Distribution des salaires récupérée avec succès'
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération de la distribution des salaires:', error);
    res.status(500).json({
      succes: false,
      message: 'Erreur serveur',
      erreur: error.message
    });
  }
});

export default routeurDashboard;
