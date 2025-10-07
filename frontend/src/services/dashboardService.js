import api from './api';

const dashboardService = {
  // Récupérer les statistiques générales (utilisateur connecté)
  async getStatistics() {
    console.log('📊 [API] Appel route générale: /dashboard/statistiques');
    const response = await api.get('/dashboard/statistiques');
    console.log('📊 [API] Réponse route générale:', response.data);
    return response.data;
  },

  // Récupérer les statistiques d'une entreprise spécifique (SuperAdmin)
  async getStatisticsForEnterprise(entrepriseId) {
    console.log('🏢 [API] Appel route spécifique:', `/dashboard/statistiques/${entrepriseId}`);
    const response = await api.get(`/dashboard/statistiques/${entrepriseId}`);
    console.log('🏢 [API] Réponse route spécifique:', response.data);
    return response.data;
  },

  // Export des employés (général)
  async exportEmployees() {
    const response = await api.get('/dashboard/export-employes');
    return response.data;
  },

  // Export des employés d'une entreprise spécifique
  async exportEmployeesForEnterprise(entrepriseId) {
    const response = await api.get(`/dashboard/export-employes/${entrepriseId}`);
    return response.data;
  },

  // Rapport mensuel général
  async getMonthlyReport(annee, mois) {
    const response = await api.get(`/dashboard/rapport-mensuel/${annee}/${mois}`);
    return response.data;
  },

  // Rapport mensuel d'une entreprise spécifique
  async getMonthlyReportForEnterprise(entrepriseId, annee, mois) {
    const response = await api.get(`/dashboard/rapport-mensuel/${entrepriseId}/${annee}/${mois}`);
    return response.data;
  },

  // Récupérer les données de graphiques
  async getChartData() {
    const response = await api.get('/dashboard/graphiques');
    return response.data;
  },

  // Récupérer les données de graphiques pour une entreprise spécifique
  async getChartDataForEnterprise(entrepriseId) {
    const response = await api.get(`/dashboard/graphiques/${entrepriseId}`);
    return response.data;
  },

  // Récupérer les derniers paiements
  async getRecentPayments(limit = 5) {
    const response = await api.get(`/dashboard/paiements-recents?limit=${limit}`);
    return response.data;
  },

  // Récupérer les derniers paiements d'une entreprise spécifique
  async getRecentPaymentsForEnterprise(entrepriseId, limit = 5) {
    const response = await api.get(`/dashboard/paiements-recents/${entrepriseId}?limit=${limit}`);
    return response.data;
  }
};

export default dashboardService;