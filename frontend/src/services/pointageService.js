import api from './api';

export const pointageService = {
  // QR Code Services
  genererQRCode: async (employeId, dureeValidite = null) => {
    return (await api.post('/pointages/qr-code/generer', { 
      employeId, 
      dureeValidite 
    })).data;
  },

  obtenirQRCode: async (employeId) => {
    return (await api.get(`/pointages/qr-code/${employeId}`)).data;
  },

  renouverrQRCode: async (employeId) => {
    return (await api.post('/pointages/qr-code/renouveler', { 
      employeId 
    })).data;
  },

  genererQRCodesPourTous: async () => {
    return (await api.post('/pointages/qr-code/generer-tous')).data;
  },

  // Scanning Services
  scanQRCode: async (donneesQR, notes = null) => {
    return (await api.post('/pointages/scanner', { 
      donneesQR, 
      notes 
    })).data;
  },

  // Pointage Management
  obtenirPointages: async (filtres = {}) => {
    const params = new URLSearchParams();
    
    if (filtres.dateDebut) params.append('dateDebut', filtres.dateDebut.toISOString().split('T')[0]);
    if (filtres.dateFin) params.append('dateFin', filtres.dateFin.toISOString().split('T')[0]);
    if (filtres.employeId) params.append('employeId', filtres.employeId);
    if (filtres.statutPresence) params.append('statutPresence', filtres.statutPresence);
    if (filtres.page) params.append('page', filtres.page.toString());
    if (filtres.limite) params.append('limite', filtres.limite.toString());

    return (await api.get(`/pointages?${params}`)).data;
  },

  enregistrerPointageManuel: async (donneesPointage) => {
    return (await api.post('/pointages/manuel', donneesPointage)).data;
  },

  corrigerPointage: async (pointageId, corrections) => {
    return (await api.put(`/pointages/${pointageId}/corriger`, corrections)).data;
  },

  // Statistics & Reports
  obtenirStatistiques: async (periode = null) => {
    const params = new URLSearchParams();
    if (periode?.dateDebut) params.append('dateDebut', periode.dateDebut.toISOString().split('T')[0]);
    if (periode?.dateFin) params.append('dateFin', periode.dateFin.toISOString().split('T')[0]);

    return (await api.get(`/pointages/statistiques?${params}`)).data;
  },

  obtenirRapportEmployes: async (periode) => {
    const params = new URLSearchParams();
    params.append('dateDebut', periode.dateDebut.toISOString().split('T')[0]);
    params.append('dateFin', periode.dateFin.toISOString().split('T')[0]);

    return (await api.get(`/pointages/rapport-employes?${params}`)).data;
  },

  obtenirPresentsEnTempsReel: async () => {
    return (await api.get('/pointages/presents')).data;
  },

  obtenirHistoriqueEmploye: async (employeId, limite = 100) => {
    return (await api.get(`/pointages/historique/${employeId}?limite=${limite}`)).data;
  },

  // Utilities
  marquerAbsents: async () => {
    return (await api.post('/pointages/marquer-absents')).data;
  },

  exporterCSV: async (periode = null) => {
    const params = new URLSearchParams();
    if (periode?.dateDebut) params.append('dateDebut', periode.dateDebut.toISOString().split('T')[0]);
    if (periode?.dateFin) params.append('dateFin', periode.dateFin.toISOString().split('T')[0]);

    const response = await api.get(`/pointages/export/csv?${params}`, { 
      responseType: 'blob' 
    });
    
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pointages_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Helper functions pour l'interface
  formatStatutPresence: (statut) => {
    const statuts = {
      'PRESENT': { label: 'Présent', color: 'green' },
      'RETARD': { label: 'En retard', color: 'orange' },
      'ABSENT': { label: 'Absent', color: 'red' },
      'CONGE': { label: 'Congé', color: 'blue' },
      'MALADIE': { label: 'Maladie', color: 'purple' }
    };
    return statuts[statut] || { label: statut, color: 'gray' };
  },

  formatTypePointage: (type) => {
    const types = {
      'ENTREE': { label: 'Entrée', color: 'blue' },
      'SORTIE': { label: 'Sortie', color: 'orange' }
    };
    return types[type] || { label: type, color: 'gray' };
  },

  calculerTempsTravaile: (heureArrivee, heureSortie) => {
    if (!heureArrivee || !heureSortie) return 0;
    
    const debut = new Date(heureArrivee);
    const fin = new Date(heureSortie);
    const diff = fin.getTime() - debut.getTime();
    
    return Math.round(diff / (1000 * 60 * 60) * 100) / 100; // Heures avec 2 décimales
  },

  calculerTempsRetard: (heureArrivee) => {
    if (!heureArrivee) return 0;
    
    const arrivee = new Date(heureArrivee);
    const heures = arrivee.getHours();
    const minutes = arrivee.getMinutes();
    const heureEnMinutes = heures * 60 + minutes;
    const heureLimite = 8 * 60 + 30; // 8h30
    
    return Math.max(0, heureEnMinutes - heureLimite);
  },

  // Validation helpers
  validerDonneesPointage: (donnees) => {
    const erreurs = [];
    
    if (!donnees.employeId) {
      erreurs.push('ID de l\'employé requis');
    }
    
    if (!donnees.date) {
      erreurs.push('Date requise');
    }
    
    if (!donnees.statutPresence) {
      erreurs.push('Statut de présence requis');
    }
    
    if (donnees.heureArrivee && donnees.heureSortie) {
      const arrivee = new Date(donnees.heureArrivee);
      const sortie = new Date(donnees.heureSortie);
      
      if (sortie <= arrivee) {
        erreurs.push('L\'heure de sortie doit être après l\'heure d\'arrivée');
      }
      
      const diffHeures = (sortie.getTime() - arrivee.getTime()) / (1000 * 60 * 60);
      if (diffHeures > 24) {
        erreurs.push('La durée ne peut pas dépasser 24 heures');
      }
    }
    
    return erreurs;
  },

  // Cache management pour les données fréquemment utilisées
  _cache: new Map(),
  
  getCachedData: function(key) {
    const cached = this._cache.get(key);
    if (cached && Date.now() - cached.timestamp < 300000) { // 5 minutes
      return cached.data;
    }
    return null;
  },
  
  setCachedData: function(key, data) {
    this._cache.set(key, {
      data,
      timestamp: Date.now()
    });
  },
  
  clearCache: function() {
    this._cache.clear();
  },

  // Fonctions utilitaires pour les filtres
  creerFiltresPeriode: (type = 'semaine') => {
    const aujourd = new Date();
    const filtres = { dateFin: new Date(aujourd) };
    
    switch (type) {
      case 'jour':
        filtres.dateDebut = new Date(aujourd);
        break;
      case 'semaine':
        const debutSemaine = new Date(aujourd);
        debutSemaine.setDate(aujourd.getDate() - aujourd.getDay());
        filtres.dateDebut = debutSemaine;
        break;
      case 'mois':
        const debutMois = new Date(aujourd.getFullYear(), aujourd.getMonth(), 1);
        filtres.dateDebut = debutMois;
        break;
      case 'trimestre':
        const debutTrimestre = new Date(aujourd.getFullYear(), Math.floor(aujourd.getMonth() / 3) * 3, 1);
        filtres.dateDebut = debutTrimestre;
        break;
      default:
        filtres.dateDebut = new Date(aujourd);
    }
    
    return filtres;
  }
};