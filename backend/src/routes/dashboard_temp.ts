import { Router } from 'express';

const routeurDashboard = Router();

// GET /dashboard/statistiques - Obtenir toutes les statistiques complètes  
routeurDashboard.get('/statistiques', async (req, res) => {
  try {
    console.log('🔧 [DEBUG] Route dashboard_temp.ts utilisée');
    
    // Structure mise à jour pour correspondre au frontend
    const statistiquesCompletes = {
      entreprise: {
        id: "test-id",
        nom: "Marakhib Global",
        adresse: "malibu, Guédiawaye"
      },
      employes: {
        total: 3,
        actifs: 3,
        inactifs: 0,
        nouveauxCeMois: 0,
        parTypeContrat: {
          "SALAIRE_FIXE": 2,
          "HONORAIRE": 1
        }
      },
      paiements: {
        total: {
          nombre: 3,
          montant: 1180000
        },
        masseSalarialeTotal: 1000000,
        variationMois: 5,
        parMode: [
          {
            mode: "VIREMENT_BANCAIRE",
            nombre: 2,
            montantTotal: 630000
          },
          {
            mode: "ESPECES",
            nombre: 1,
            montantTotal: 550000
          }
        ],
        derniersPaiements: [
          {
            id: "1",
            employe: "Fallou Senghor",
            montant: 450000,
            modePaiement: "VIREMENT_BANCAIRE",
            date: "2024-09-15"
          },
          {
            id: "2",
            employe: "Coach Aly",
            montant: 550000,
            modePaiement: "ESPECES",
            date: "2024-09-15"
          },
          {
            id: "3",
            employe: "Aliou Ndiaye",
            montant: 180000,
            modePaiement: "VIREMENT_BANCAIRE",
            date: "2024-09-20"
          }
        ]
      },
      cycles: {
        total: 1,
        enCours: 1,
        recent: []
      },
      bulletins: {
        total: 3,
        cesMois: 3
      },
      // Données compatibles avec l'ancien format pour éviter les erreurs
      totalEmployes: 3,
      totalPaiements: 3,
      montantTotalPaie: 1180000,
      moyenneSalaire: 333333,
      employesParPoste: {
        "Développeur Full Stack": 1,
        "Chef de Projet": 1,
        "Designer UX/UI": 1
      },
      employesParTypeContrat: {
        "SALAIRE_FIXE": 2,
        "HONORAIRE": 1
      }
    };
    
    res.status(200).json({
      succes: true,
      donnees: statistiquesCompletes,
      message: 'Statistiques récupérées avec succès'
    });
  } catch (error: any) {
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
    // Données statiques pour test
    const employes = [
      {
        id: "1",
        nomComplet: "John Doe",
        email: "john@example.com",
        poste: "Développeur",
        typeContrat: "SALAIRE_FIXE",
        salaireFixe: 120000,
        dateEmbauche: "2024-01-15"
      },
      {
        id: "2", 
        nomComplet: "Jane Smith",
        email: "jane@example.com",
        poste: "Designer",
        typeContrat: "SALAIRE_FIXE",
        salaireFixe: 95000,
        dateEmbauche: "2024-02-01"
      }
    ];
    
    res.status(200).json({
      succes: true,
      donnees: employes,
      message: `Export de ${employes.length} employés réalisé avec succès`
    });
  } catch (error: any) {
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
    const { annee, mois } = req.query;
    const currentYear = parseInt(annee as string) || new Date().getFullYear();
    const currentMonth = parseInt(mois as string) || new Date().getMonth() + 1;
    
    // Données statiques pour test
    const rapport = {
      periode: `${currentMonth}/${currentYear}`,
      totalPaiements: 4,
      montantTotal: 340000,
      nombreEmployes: 8,
      paiementsParType: {
        "SALAIRE_FIXE": 3,
        "HONORAIRE": 1,
        "JOURNALIER": 0
      },
      details: [
        {
          nomEmploye: "John Doe",
          montant: 120000,
          datePaiement: "2024-10-01",
          type: "SALAIRE_FIXE"
        },
        {
          nomEmploye: "Jane Smith", 
          montant: 95000,
          datePaiement: "2024-10-01",
          type: "SALAIRE_FIXE"
        }
      ]
    };
    
    res.status(200).json({
      succes: true,
      donnees: rapport,
      message: `Rapport mensuel pour ${currentMonth}/${currentYear} généré avec succès`
    });
  } catch (error: any) {
    res.status(500).json({
      succes: false,
      message: 'Erreur serveur',
      erreur: error.message
    });
  }
});

export default routeurDashboard;
