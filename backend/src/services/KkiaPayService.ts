import axios from 'axios';

export class KkiaPayService {
  private readonly apiUrl = 'https://api.kkiapay.me/v1/';
  private readonly privateKey: string;
  private readonly publicKey: string;

  constructor() {
    // Récupérer les clés depuis les variables d'environnement
    this.privateKey = process.env.KKIAPAY_PRIVATE_KEY || '';
    this.publicKey = process.env.KKIAPAY_PUBLIC_KEY || 'b9542980a76911ef843abb0c6fb21c96';
    
    if (!this.privateKey) {
      console.warn('KKIAPAY_PRIVATE_KEY non définie dans les variables d\'environnement');
    }
  }

  /**
   * Vérifie le statut d'une transaction KkiaPay
   * @param transactionId - ID de la transaction KkiaPay
   */
  async verifyTransaction(transactionId: string): Promise<{
    success: boolean;
    status: string;
    amount: number;
    data?: any;
    error?: string;
  }> {
    try {
      const response = await axios.get(
        `${this.apiUrl}transaction/${transactionId}/status`,
        {
          headers: {
            'X-API-KEY': this.privateKey,
            'Content-Type': 'application/json'
          },
          timeout: 10000
        }
      );

      const transaction = response.data;

      return {
        success: transaction.status === 'SUCCESS',
        status: transaction.status,
        amount: transaction.amount,
        data: transaction
      };

    } catch (error: any) {
      console.error('Erreur lors de la vérification KkiaPay:', error);
      
      if (error.response) {
        return {
          success: false,
          status: 'ERROR',
          amount: 0,
          error: `Erreur API KkiaPay: ${error.response.status} - ${error.response.data?.message || 'Erreur inconnue'}`
        };
      }

      return {
        success: false,
        status: 'ERROR',
        amount: 0,
        error: error.message || 'Erreur de connexion à KkiaPay'
      };
    }
  }

  /**
   * Récupère les détails d'une transaction
   * @param transactionId - ID de la transaction KkiaPay
   */
  async getTransactionDetails(transactionId: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.apiUrl}transaction/${transactionId}`,
        {
          headers: {
            'X-API-KEY': this.privateKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      console.error('Erreur lors de la récupération des détails de transaction KkiaPay:', error);
      throw new Error(`Impossible de récupérer les détails de la transaction: ${error.message}`);
    }
  }

  /**
   * Valide les données webhook de KkiaPay
   * @param webhookData - Données reçues du webhook
   */
  validateWebhook(webhookData: any): boolean {
    // Ici vous devriez implémenter la validation de signature du webhook
    // selon la documentation KkiaPay
    return webhookData && webhookData.transactionId && webhookData.status;
  }

  /**
   * Formate le montant pour KkiaPay (en FCFA)
   * @param amount - Montant en FCFA
   */
  formatAmount(amount: number): number {
    return Math.round(amount); // KkiaPay attend des entiers
  }

  /**
   * Génère une référence unique pour une transaction
   * @param prefix - Préfixe pour la référence
   */
  generateTransactionReference(prefix: string = 'SAL'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Vérifie si KkiaPay est configuré correctement
   */
  isConfigured(): boolean {
    return !!(this.privateKey && this.publicKey);
  }
}

export default KkiaPayService;