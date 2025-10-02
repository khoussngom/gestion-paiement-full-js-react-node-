import api from './api';

const attendanceService = {
  // Scanner un code QR et enregistrer le pointage
  scanQRCode: async (codeQR, latitude, longitude) => {
    try {
      const response = await api.post('/pointages/scanner', {
        codeQR,
        latitude,
        longitude
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtenir tous les pointages avec filtres
  getAttendanceRecords: async (filters = {}) => {
    try {
      const params = new URLSearchParams();
      if (filters.dateDebut) params.append('dateDebut', filters.dateDebut);
      if (filters.dateFin) params.append('dateFin', filters.dateFin);
      if (filters.employeId) params.append('employeId', filters.employeId);
      if (filters.statut) params.append('statut', filters.statut);

      const response = await api.get(`/pointages?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtenir les statistiques de pointage
  getAttendanceStatistics: async (dateDebut, dateFin) => {
    try {
      const params = new URLSearchParams();
      if (dateDebut) params.append('dateDebut', dateDebut);
      if (dateFin) params.append('dateFin', dateFin);

      const response = await api.get(`/pointages/statistiques?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtenir le rapport par employé
  getEmployeeAttendanceReport: async (dateDebut, dateFin) => {
    try {
      const params = new URLSearchParams();
      if (dateDebut) params.append('dateDebut', dateDebut);
      if (dateFin) params.append('dateFin', dateFin);

      const response = await api.get(`/pointages/rapport-employes?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Marquer les absents (après 16h00)
  markAbsentees: async () => {
    try {
      const response = await api.post('/pointages/marquer-absents');
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Générer un code QR pour un employé
  generateQRCode: async (employeId) => {
    try {
      const response = await api.post(`/pointages/generer-qr/${employeId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtenir le code QR d'un employé
  getEmployeeQRCode: async (employeId) => {
    try {
      const response = await api.get(`/pointages/qr/${employeId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  // Obtenir l'historique de pointage d'un employé
  getEmployeeAttendanceHistory: async (employeId, dateDebut, dateFin) => {
    try {
      const params = new URLSearchParams();
      if (dateDebut) params.append('dateDebut', dateDebut);
      if (dateFin) params.append('dateFin', dateFin);

      const response = await api.get(`/pointages/employe/${employeId}?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default attendanceService;
