import { Router } from 'express';
import { PaiementController } from '../controllers/PaiementController';
import KkiaPayService from '../services/KkiaPayService';

const routeurPaiements = Router();
const paiementController = new PaiementController();
const kkiaPayService = new KkiaPayService();

// GET /paiements - Obtenir tous les paiements
routeurPaiements.get('/', (req, res) => paiementController.obtenirTous(req, res));

// POST /paiements - Créer un nouveau paiement
routeurPaiements.post('/', (req, res) => paiementController.creer(req, res));

// GET /paiements/statistics - Obtenir les statistiques des paiements
routeurPaiements.get('/statistics', (req, res) => paiementController.obtenirStatistiques(req, res));

// GET /paiements/export/csv - Exporter les paiements en CSV
routeurPaiements.get('/export/csv', (req, res) => paiementController.exporterCSV(req, res));

// GET /paiements/rapport/pdf - Générer un rapport PDF
routeurPaiements.get('/rapport/pdf', (req, res) => paiementController.genererRapport(req, res));

// POST /paiements/verify-kkiapay - Vérifier un paiement KkiaPay
routeurPaiements.post('/verify-kkiapay', async (req, res) => {
  try {
    const { transactionId } = req.body;

    if (!transactionId) {
      return res.status(400).json({
        succes: false,
        message: 'ID de transaction KkiaPay requis'
      });
    }

    // Vérifier si KkiaPay est configuré
    if (!kkiaPayService.isConfigured()) {
      return res.status(500).json({
        succes: false,
        message: 'KkiaPay n\'est pas configuré correctement'
      });
    }

    // Vérifier la transaction
    const verificationResult = await kkiaPayService.verifyTransaction(transactionId);

    if (verificationResult.success) {
      return res.json({
        succes: true,
        donnees: {
          status: verificationResult.status,
          amount: verificationResult.amount,
          verified: true
        },
        message: 'Paiement KkiaPay vérifié avec succès'
      });
    } else {
      return res.status(400).json({
        succes: false,
        message: verificationResult.error || 'Le paiement KkiaPay n\'a pas été confirmé',
        donnees: {
          status: verificationResult.status,
          verified: false
        }
      });
    }

  } catch (error: any) {
    console.error('Erreur lors de la vérification KkiaPay:', error);
    return res.status(500).json({
      succes: false,
      message: 'Erreur serveur lors de la vérification KkiaPay',
      erreur: error.message
    });
  }
});

// POST /paiements/webhook/kkiapay - Webhook KkiaPay
routeurPaiements.post('/webhook/kkiapay', async (req, res) => {
  try {
    const webhookData = req.body;
    
    // Valider les données du webhook
    if (!kkiaPayService.validateWebhook(webhookData)) {
      return res.status(400).json({
        succes: false,
        message: 'Données webhook invalides'
      });
    }

    // Traiter le webhook (mise à jour du statut de paiement, etc.)
    console.log('Webhook KkiaPay reçu:', webhookData);
    
    // Ici vous pouvez ajouter la logique pour mettre à jour 
    // automatiquement le statut des bulletins de paie
    
    res.json({
      succes: true,
      message: 'Webhook KkiaPay traité avec succès'
    });

  } catch (error: any) {
    console.error('Erreur lors du traitement du webhook KkiaPay:', error);
    return res.status(500).json({
      succes: false,
      message: 'Erreur lors du traitement du webhook',
      erreur: error.message
    });
  }
});

export default routeurPaiements;
