import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  headers: { 'Content-Type': 'application/json' },
});

// Auth interceptor
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Error interceptor
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/auth/sign-in';
    }
    return Promise.reject(error);
  }
);

// Services condensés
export const employeeService = {
  getAll: async () => (await api.get('/employes')).data,
  getById: async (id) => (await api.get(`/employes/${id}`)).data,
  create: async (data) => (await api.post('/employes', data)).data,
  update: async (id, data) => (await api.put(`/employes/${id}`, data)).data,
  delete: async (id) => (await api.delete(`/employes/${id}`)).data,
  toggleStatus: async (id, active) => (await api.patch(`/employes/${id}/${active ? 'activer' : 'desactiver'}`)).data,
};

export const payrollCycleService = {
  getAll: async () => (await api.get('/cycles-paie')).data,
  getById: async (id) => (await api.get(`/cycles-paie/${id}`)).data,
  create: async (data) => (await api.post('/cycles-paie', data)).data,
  update: async (id, data) => (await api.put(`/cycles-paie/${id}`, data)).data,
  delete: async (id) => (await api.delete(`/cycles-paie/${id}`)).data,
};

export const authService = {
  login: async (credentials) => {
    const response = await api.post('/auth/connexion', credentials);
    if (response.data.succes && response.data.donnees.token) {
      localStorage.setItem('authToken', response.data.donnees.token);
      localStorage.setItem('user', JSON.stringify(response.data.donnees.utilisateur));
    }
    return response.data;
  },
  logout: async () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },
  getCurrentUser: () => JSON.parse(localStorage.getItem('user') || 'null'),
  isAuthenticated: () => !!localStorage.getItem('authToken'),
  createVigile: async (vigileData) => {
    const response = await api.post('/auth/creer-vigile', vigileData);
    return response.data;
  },
};

export const dashboardService = {
  getStatistics: async () => (await api.get('/dashboard/statistiques')).data,
  exportEmployees: async () => (await api.get('/dashboard/employes')).data,
};

export const paymentService = {
  getAll: async () => (await api.get('/paiements')).data,
  getStatistics: async () => (await api.get('/paiements/statistics')).data,
  create: async (data) => (await api.post('/paiements', data)).data,
  getUnpaidEmployeesFromActiveCycles: async () => (await api.get('/cycles-paie/employes-non-payes')).data,
  exportCSV: async () => {
    const response = await api.get('/paiements/export/csv', { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `paiements_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
  generateReport: async () => {
    const response = await api.get('/paiements/rapport/pdf', { responseType: 'blob' });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rapport_paiements_${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }
};

export default api;
