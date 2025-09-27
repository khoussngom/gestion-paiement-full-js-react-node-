import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Configuration axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/auth/sign-in';
    }
    return Promise.reject(error);
  }
);

export const employeeService = {
  // Récupérer tous les employés
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/employes?${params}`);
    return response.data;
  },

  // Récupérer un employé par ID
  getById: async (id) => {
    const response = await api.get(`/employes/${id}`);
    return response.data;
  },

  // Créer un nouvel employé
  create: async (employeeData) => {
    const response = await api.post('/employes', employeeData);
    return response.data;
  },

  // Mettre à jour un employé
  update: async (id, employeeData) => {
    const response = await api.put(`/employes/${id}`, employeeData);
    return response.data;
  },

  // Supprimer un employé
  delete: async (id) => {
    const response = await api.delete(`/employes/${id}`);
    return response.data;
  },

  // Activer/Désactiver un employé
  toggleStatus: async (id, active) => {
    const endpoint = active ? 'activer' : 'desactiver';
    const response = await api.patch(`/employes/${id}/${endpoint}`);
    return response.data;
  },

  // Obtenir les statistiques des employés
  getStatistics: async () => {
    const response = await api.get('/employes/statistiques');
    return response.data;
  },
};

export const payrollCycleService = {
  // Récupérer tous les cycles de paie
  getAll: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });
    
    const response = await api.get(`/cycles-paie?${params}`);
    return response.data;
  },

  // Récupérer un cycle par ID
  getById: async (id) => {
    const response = await api.get(`/cycles-paie/${id}`);
    return response.data;
  },

  // Créer un nouveau cycle
  create: async (cycleData) => {
    const response = await api.post('/cycles-paie', cycleData);
    return response.data;
  },

  // Mettre à jour un cycle
  update: async (id, cycleData) => {
    const response = await api.put(`/cycles-paie/${id}`, cycleData);
    return response.data;
  },

  // Supprimer un cycle
  delete: async (id) => {
    const response = await api.delete(`/cycles-paie/${id}`);
    return response.data;
  },

  // Mettre à jour le statut d'un cycle
  updateStatus: async (id, status) => {
    const response = await api.patch(`/cycles-paie/${id}/statut`, { statut: status });
    return response.data;
  },

  // Générer les bulletins de paie pour un cycle
  generatePayslips: async (cycleId) => {
    const response = await api.post(`/cycles-paie/${cycleId}/generer-bulletins`);
    return response.data;
  },
};

export const authService = {
  // Connexion
  login: async (credentials) => {
    const response = await api.post('/auth/connexion', credentials);
    if (response.data.succes && response.data.donnees.token) {
      localStorage.setItem('authToken', response.data.donnees.token);
      localStorage.setItem('user', JSON.stringify(response.data.donnees.utilisateur));
    }
    return response.data;
  },

  // Inscription
  register: async (userData) => {
    const response = await api.post('/auth/inscription', userData);
    return response.data;
  },

  // Déconnexion
  logout: async () => {
    try {
      await api.post('/auth/deconnexion');
    } finally {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
    }
  },

  // Récupérer l'utilisateur actuel
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },

  // Vérifier si l'utilisateur est connecté
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },
};

export const dashboardService = {
  // Récupérer les statistiques du tableau de bord
  getStatistics: async () => {
    const response = await api.get('/dashboard/statistiques');
    return response.data;
  },

  // Exporter la liste des employés
  exportEmployees: async () => {
    const response = await api.get('/dashboard/export/employes');
    return response.data;
  },

  // Générer un rapport mensuel
  getMonthlyReport: async (year, month) => {
    const params = new URLSearchParams();
    if (year) params.append('annee', year);
    if (month) params.append('mois', month);
    
    const response = await api.get(`/dashboard/rapport/mensuel?${params}`);
    return response.data;
  },
};

export const paymentService = {
  // Récupérer tous les paiements
  getAll: async () => {
    const response = await api.get('/paiements');
    return response.data;
  },

  // Récupérer les statistiques de paiement
  getStatistics: async () => {
    const response = await api.get('/paiements/statistiques');
    return response.data;
  },

  // Créer un nouveau paiement
  create: async (paymentData) => {
    const response = await api.post('/paiements', paymentData);
    return response.data;
  },

  // Récupérer un paiement par ID
  getById: async (id) => {
    const response = await api.get(`/paiements/${id}`);
    return response.data;
  },
};

export default api;
