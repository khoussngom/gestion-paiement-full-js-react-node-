import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { schemaCreerPaiement } from '@/validators';
import { MESSAGES_SUCCES, MESSAGES_ERREUR } from '@/enums/messages';
import { PaiementRepository } from '../repositories/PaiementRepository';
import { ServiceDashboard } from '@/services/ServiceDashboard';

const prisma = new PrismaClient();
const paiementRepo = new PaiementRepository();
const serviceDashboard = new ServiceDashboard();

const routeurPaiements = Router();

// GET /paiements - Obtenir tous les paiements
routeurPaiements.get('/', async (req, res) => {
  try {
    const entrepriseId = req.utilisateur?.entrepriseId;
    
    if (!entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    const paiements = await prisma.paiement.findMany({
      where: { entrepriseId },
      include: {
        employe: true,
        bulletinPaie: true,
        utilisateur: true
      },
      orderBy: { dateCreation: 'desc' }
    });
    
    res.status(200).json({
      succes: true,
      donnees: paiements
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// POST /paiements - Créer un nouveau paiement
routeurPaiements.post('/', async (req, res) => {
  try {
    const entrepriseId = req.utilisateur?.entrepriseId;
    const utilisateurId = req.utilisateur?.id;
    
    if (!entrepriseId || !utilisateurId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    const validation = schemaCreerPaiement.omit({ entrepriseId: true, utilisateurId: true, bulletinPaieId: true }).safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        succes: false,
        message: 'Données invalides',
        erreurs: validation.error.errors
      });
    }

    const donneesValidees = validation.data;

    // Vérifier que l'employé appartient à l'entreprise
    const employe = await prisma.employe.findFirst({
      where: {
        id: donneesValidees.employeId,
        entrepriseId,
        actif: true,
      },
    });

    if (!employe) {
      return res.status(404).json({
        succes: false,
        message: "Employé non trouvé ou n'appartient pas à votre entreprise",
      });
    }

    // Créer ou trouver un cycle de paie actuel
    const dateActuelle = new Date();
    const annee = dateActuelle.getFullYear();
    const mois = dateActuelle.getMonth() + 1;
    const nomCycle = `Cycle ${mois}/${annee}`;
    
    let cyclePaie = await prisma.cyclePaie.findFirst({
      where: {
        entrepriseId,
        nom: nomCycle,
      },
    });

    if (!cyclePaie) {
      cyclePaie = await prisma.cyclePaie.create({
        data: {
          nom: nomCycle,
          entrepriseId,
          dateDebut: new Date(annee, mois - 1, 1),
          dateFin: new Date(annee, mois, 0),
          statut: 'BROUILLON',
        },
      });
    }

    // Créer ou trouver un bulletin de paie
    let bulletinPaie = await prisma.bulletinPaie.findFirst({
      where: {
        employeId: donneesValidees.employeId,
        cycleId: cyclePaie.id,
      },
    });

    if (!bulletinPaie) {
      // Calculer le salaire net (pour l'instant sans déductions)
      const salaireBrut = donneesValidees.montant;
      const salaireNet = salaireBrut; // Sans déductions pour l'instant

      bulletinPaie = await prisma.bulletinPaie.create({
        data: {
          employeId: donneesValidees.employeId,
          cycleId: cyclePaie.id,
          entrepriseId,
          salaireBrut,
          deductions: 0,
          salaireNet,
          statut: 'EN_ATTENTE',
        },
      });
    }

    const paiement = await paiementRepo.creerPaiement({
      ...donneesValidees,
      bulletinPaieId: bulletinPaie.id,
      entrepriseId,
      utilisateurId,
    });

    res.status(201).json({
      succes: true,
      message: 'Paiement créé avec succès',
      donnees: paiement,
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// GET /paiements/statistiques - Obtenir les statistiques de paiement
routeurPaiements.get('/statistiques', async (req, res) => {
  try {
    const entrepriseId = req.utilisateur?.entrepriseId;
    
    if (!entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    // Utiliser le service dashboard pour obtenir des statistiques complètes
    const statistiquesPaiements = await serviceDashboard.obtenirStatistiquesPaiements(entrepriseId);
    
    // Compter les employés actifs pour calculer les paiements en attente
    const employes = await prisma.employe.findMany({
      where: { entrepriseId, actif: true }
    });

    const totalEmployes = employes.length;
    const paiementsEffectues = statistiquesPaiements.total.nombre;
    const paiementsEnAttente = Math.max(0, totalEmployes - statistiquesPaiements.dernierMois);

    res.status(200).json({
      succes: true,
      donnees: {
        totalEmployes,
        totalSalaireBrut: statistiquesPaiements.masseSalarialeTotal,
        paiementsEffectues,
        paiementsEnAttente,
        montantTotalPaye: statistiquesPaiements.total.montant,
        paiementsDernierMois: statistiquesPaiements.dernierMois,
        paiementsParMode: statistiquesPaiements.parMode,
        derniersPaiements: statistiquesPaiements.derniersPaiements
      }
    });
  } catch (error: any) {
    console.error('Erreur lors de la récupération des statistiques de paiement:', error);
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// GET /paiements/statistics - Obtenir les statistiques des paiements
routeurPaiements.get('/statistics', async (req, res) => {
  try {
    const entrepriseId = req.utilisateur?.entrepriseId;
    
    if (!entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    const stats = await serviceDashboard.obtenirStatistiquesCompletes(entrepriseId);
    
    // Adapter la structure pour le frontend des paiements
    const statsFormatees = {
      totalEmployes: stats.employes?.actifs || 0,
      totalSalaireBrut: stats.paiements?.masseSalarialeTotal || 0,
      paiementsEffectues: stats.paiements?.total?.nombre || 0,
      paiementsEnAttente: Math.max(0, (stats.employes?.actifs || 0) - (stats.paiements?.total?.nombre || 0))
    };
    
    console.log('📊 Stats complètes:', JSON.stringify(stats, null, 2));
    console.log('📊 Stats formatées pour frontend:', statsFormatees);
    
    res.status(200).json({
      succes: true,
      donnees: statsFormatees
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// GET /paiements/export/csv - Exporter les paiements en CSV
routeurPaiements.get('/export/csv', async (req, res) => {
  try {
    const entrepriseId = req.utilisateur?.entrepriseId;
    
    if (!entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    const paiements = await prisma.paiement.findMany({
      where: { entrepriseId },
      include: {
        employe: true,
        bulletinPaie: true
      },
      orderBy: { dateCreation: 'desc' }
    });

    // Formatage en CSV
    const csvHeader = 'Employé,Montant,Mode de paiement,Date,Statut Bulletin,Référence\n';
    const csvData = paiements.map(p => 
      `"${p.employe?.nomComplet || 'N/A'}","${p.montant}","${p.modePaiement}","${new Date(p.datePaiement).toLocaleDateString('fr-FR')}","${p.bulletinPaie?.statut || 'N/A'}","${p.reference || 'N/A'}"`
    ).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=paiements_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csvHeader + csvData);

  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

// GET /paiements/rapport/pdf - Générer un rapport PDF
routeurPaiements.get('/rapport/pdf', async (req, res) => {
  try {
    const entrepriseId = req.utilisateur?.entrepriseId;
    
    if (!entrepriseId) {
      return res.status(403).json({
        succes: false,
        message: MESSAGES_ERREUR.ENTREPRISE_NON_AUTORISEE
      });
    }

    // Pour l'instant, générons un rapport simple en texte
    // Dans une vraie application, on utiliserait une lib comme puppeteer ou jsPDF
    const paiements = await prisma.paiement.findMany({
      where: { entrepriseId },
      include: {
        employe: true,
        bulletinPaie: true
      },
      orderBy: { dateCreation: 'desc' }
    });

    const stats = await serviceDashboard.obtenirStatistiquesCompletes(entrepriseId);
    
    const rapport = `
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

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=rapport_paiements_${new Date().toISOString().split('T')[0]}.pdf`);
    // Pour simplifier, on renvoie du texte brut pour l'instant
    res.setHeader('Content-Type', 'text/plain');
    res.send(rapport);

  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: MESSAGES_ERREUR.ERREUR_SERVEUR,
      erreur: error.message
    });
  }
});

export default routeurPaiements;
