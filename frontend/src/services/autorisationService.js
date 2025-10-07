import api from './api';

const autorisationService = {
  // Accorde un accès temporaire au SuperAdmin
  accorderAcces: async (dureeHeures, raisonAcces) => {
    return (await api.post('/autorisations/accorder', { 
      dureeHeures, 
      raisonAcces 
    })).data;
  },

  // Vérifie si le SuperAdmin a accès à une entreprise
  verifierAcces: async (entrepriseId) => {
    return (await api.get(`/autorisations/verification/${entrepriseId}`)).data;
  },

  // Révoque un accès spécifique
  revoquerAcces: async (autorisationId) => {
    return (await api.delete(`/autorisations/${autorisationId}/revoquer`)).data;
  },

  // Obtient les autorisations pour l'utilisateur connecté
  obtenirMesAutorisations: async () => {
    return (await api.get('/autorisations/mes-autorisations')).data;
  },

  // Obtient toutes les autorisations pour une entreprise
  obtenirAutorisationsEntreprise: async (entrepriseId) => {
    return (await api.get(`/autorisations/entreprise/${entrepriseId}`)).data;
  },

  // Obtient les statistiques des autorisations (SuperAdmin seulement)
  obtenirStatistiques: async () => {
    return (await api.get('/autorisations/statistiques')).data;
  },

  // Prolonge une autorisation existante
  prolongerAutorisation: async (autorisationId, heuresSupplementaires) => {
    return (await api.put(`/autorisations/${autorisationId}/prolonger`, { 
      heuresSupplementaires 
    })).data;
  },

  // Nettoie les autorisations expirées (tâche de maintenance)
  nettoyerAutorisationsExpirees: async () => {
    return (await api.post('/autorisations/nettoyer-expirees')).data;
  }
};

export default autorisationService;