/**
 * Service KkiaPay avec SDK officiel React
 */
class KkiaPayService {
  constructor() {
    this.publicKey = process.env.REACT_APP_KKIAPAY_PUBLIC_KEY || 'b9542980a76911ef843abb0c6fb21c96';
    this.privateKey = process.env.REACT_APP_KKIAPAY_PRIVATE_KEY;
    
    // Configuration par défaut pour le SDK
    this.defaultConfig = {
      position: "left",           // Widget à gauche comme votre autre app
      theme: "#00a896",          // Couleur KkiaPay officielle
      sandbox: true,             // Mode test (changer en false pour production)
    };
  }

  /**
   * Génère la configuration pour le KkiapayButton du SDK
   */
  getPaymentConfig({ amount, employeeName, employeePhone, employeeEmail }) {
    return {
      amount: Math.round(Number(amount)),
      publicKey: this.publicKey,
      position: "left",                    // Widget à gauche
      theme: "#00a896",                   // Couleur KkiaPay
      sandbox: true,                      // Mode test
      
      // Données du client/employé
      name: employeeName || 'Employé',
      phone: employeePhone || '',
      email: employeeEmail || '',
      
      // Métadonnées de la transaction
      reason: `Paiement de salaire - ${employeeName}`,
      data: JSON.stringify({
        employeeName,
        paymentType: 'salary',
        timestamp: Date.now()
      })
    };
  }

  /**
   * Gestion des callbacks de paiement
   */
  handlePaymentSuccess(response, onSuccess) {
    console.log('✅ Paiement KkiaPay réussi:', response);
    
    if (onSuccess) {
      onSuccess({
        transactionId: response.transactionId || response.transaction_id,
        status: 'SUCCESS',
        message: 'Paiement effectué avec succès',
        data: response
      });
    }
  }

  handlePaymentError(error, onFailed) {
    console.error('❌ Erreur paiement KkiaPay:', error);
    
    if (onFailed) {
      onFailed({
        message: error.message || 'Paiement échoué',
        error: error
      });
    }
  }

  handlePaymentPending(response, onPending) {
    console.log('⏳ Paiement KkiaPay en attente:', response);
    
    if (onPending) {
      onPending({
        transactionId: response.transactionId || response.transaction_id,
        status: 'PENDING',
        message: 'Paiement en cours de traitement',
        data: response
      });
    }
  }





  /**
   * Formate un montant pour l'affichage
   */
  formatDisplay(amount) {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Alias pour la compatibilité (utilisé dans PaymentMethodModal)
   */
  formatAmountForDisplay(amount) {
    return this.formatDisplay(amount);
  }

  /**
   * Valide les clés KkiaPay
   */
  validateKeys() {
    if (!this.publicKey) {
      console.error('❌ Clé publique KkiaPay manquante');
      return false;
    }
    
    console.log('✅ Clés KkiaPay configurées');
    return true;
  }
}

// Création et export de l'instance unique
const kkiaPayService = new KkiaPayService();
export default kkiaPayService;