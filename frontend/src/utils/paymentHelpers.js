/**
 * Utilitaires pour les paiements
 */

/**
 * Formats un montant en FCFA
 */
export const formatAmount = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XOF',
    minimumFractionDigits: 0
  }).format(amount);
};

/**
 * Valide un numéro de téléphone
 */
export const validatePhoneNumber = (phone) => {
  if (!phone) return true; // Optionnel
  
  // Format pour les numéros béninois/ouest-africains
  const phoneRegex = /^(\+229|229)?[0-9]{8}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

/**
 * Messages d'erreur personnalisés pour KkiaPay
 */
export const getKkiaPayErrorMessage = (error) => {
  const errorMappings = {
    'timeout': 'Le service KkiaPay met trop de temps à répondre. Veuillez réessayer.',
    'network': 'Problème de connexion internet. Vérifiez votre connexion.',
    'blocked_popup': 'Les pop-ups sont bloquées. Autorisez les pop-ups pour ce site.',
    'script_load_failed': 'Impossible de charger le service KkiaPay. Vérifiez votre connexion.',
    'invalid_amount': 'Le montant du paiement n\'est pas valide.',
    'insufficient_funds': 'Fonds insuffisants sur le compte.',
    'transaction_failed': 'La transaction a échoué. Veuillez réessayer.',
    'service_unavailable': 'Le service KkiaPay est temporairement indisponible.'
  };

  const errorCode = error.code || error.type;
  return errorMappings[errorCode] || error.message || 'Une erreur est survenue lors du paiement.';
};

/**
 * Configuration des méthodes de paiement avec leurs icônes
 */
export const paymentMethodsConfig = {
  ESPECES: {
    label: 'Espèces',
    icon: '💵',
    description: 'Paiement en espèces',
    available: true
  },
  VIREMENT: {
    label: 'Virement bancaire',
    icon: '🏦',
    description: 'Virement sur compte bancaire',
    available: true
  },
  CHEQUE: {
    label: 'Chèque',
    icon: '📝',
    description: 'Paiement par chèque',
    available: true
  },
  MOBILE_MONEY: {
    label: 'Mobile Money',
    icon: '📱',
    description: 'Paiement mobile (MTN, Moov, etc.)',
    available: true
  },
  KKIAPAY: {
    label: 'KkiaPay',
    icon: '💳',
    description: 'Paiement électronique sécurisé',
    available: true,
    fallbackMethods: ['MOBILE_MONEY', 'VIREMENT', 'ESPECES']
  }
};

/**
 * Obtient les méthodes de fallback pour KkiaPay
 */
export const getFallbackPaymentMethods = () => {
  const fallbackIds = paymentMethodsConfig.KKIAPAY.fallbackMethods;
  return fallbackIds.map(id => ({
    id,
    ...paymentMethodsConfig[id]
  }));
};

/**
 * Génère un ID de transaction unique
 */
export const generateTransactionId = (prefix = 'PAY') => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}_${timestamp}_${random}`;
};

/**
 * Valide les données de paiement
 */
export const validatePaymentData = (data) => {
  const errors = [];

  if (!data.amount || data.amount <= 0) {
    errors.push('Le montant doit être supérieur à zéro');
  }

  if (!data.employeeName || data.employeeName.trim() === '') {
    errors.push('Le nom de l\'employé est requis');
  }

  if (data.employeePhone && !validatePhoneNumber(data.employeePhone)) {
    errors.push('Le numéro de téléphone n\'est pas valide');
  }

  return errors;
};

/**
 * Status de transaction KkiaPay
 */
export const TRANSACTION_STATUS = {
  PENDING: 'PENDING',
  SUCCESS: 'SUCCESS', 
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  TIMEOUT: 'TIMEOUT'
};

/**
 * Convertit le status KkiaPay vers notre format
 */
export const mapKkiaPayStatus = (kkiaPayStatus) => {
  const statusMap = {
    'SUCCESS': TRANSACTION_STATUS.SUCCESS,
    'FAILED': TRANSACTION_STATUS.FAILED,
    'PENDING': TRANSACTION_STATUS.PENDING,
    'CANCELLED': TRANSACTION_STATUS.CANCELLED,
    'TIMEOUT': TRANSACTION_STATUS.TIMEOUT
  };

  return statusMap[kkiaPayStatus] || TRANSACTION_STATUS.FAILED;
};