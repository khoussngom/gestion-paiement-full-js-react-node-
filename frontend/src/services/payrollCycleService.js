import api from './api';

// Types TypeScript pour le frontend
export const TypeCyclePaie = {
  MENSUEL: 'MENSUEL',
  HEBDOMADAIRE: 'HEBDOMADAIRE'
};

export const StatutCyclePaie = {
  BROUILLON: 'BROUILLON',
  APPROUVE: 'APPROUVE',
  CLOTURE: 'CLOTURE'
};

export const StatutBulletinPaie = {
  EN_ATTENTE: 'EN_ATTENTE',
  PARTIEL: 'PARTIEL',
  PAYE: 'PAYE'
};

/**
 * Service pour la gestion des cycles de paie
 */
class PayrollCycleService {
  
  /**
   * Récupère tous les cycles de paie de l'entreprise
   */
  async getAllCycles() {
    try {
      const response = await api.get('/cycles-paie');
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des cycles:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Récupère un cycle de paie avec ses employés
   */
  async getCycleWithEmployees(cycleId) {
    try {
      const response = await api.get(`/cycles-paie/${cycleId}`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération du cycle:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Crée un nouveau cycle de paie
   */
  async createCycle(cycleData) {
    try {
      const response = await api.post('/cycles-paie', cycleData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création du cycle:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Met à jour un cycle de paie
   */
  async updateCycle(cycleId, cycleData) {
    try {
      const response = await api.put(`/cycles-paie/${cycleId}`, cycleData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la modification du cycle:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Approuve un cycle de paie
   */
  async approveCycle(cycleId) {
    try {
      const response = await api.post(`/cycles-paie/${cycleId}/approuver`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de l\'approbation du cycle:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Clôture un cycle de paie
   */
  async closeCycle(cycleId) {
    try {
      const response = await api.post(`/cycles-paie/${cycleId}/cloturer`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la clôture du cycle:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Met à jour le statut de paiement d'un employé
   */
  async updateEmployeePaymentStatus(cycleId, bulletinId, status) {
    try {
      const response = await api.put(`/cycles-paie/${cycleId}/employes/${bulletinId}/statut`, {
        statut: status
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Récupère les statistiques d'un cycle
   */
  async getCycleStatistics(cycleId) {
    try {
      const response = await api.get(`/cycles-paie/${cycleId}/statistiques`);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Génère automatiquement les dates d'un cycle selon son type
   */
  generateCycleDates(type, startDate = new Date()) {
    const dates = {
      dateDebut: new Date(startDate),
      dateFin: new Date(startDate)
    };

    if (type === TypeCyclePaie.MENSUEL) {
      // Cycle mensuel : du 1er au dernier jour du mois
      dates.dateDebut.setDate(1);
      dates.dateFin.setMonth(dates.dateFin.getMonth() + 1);
      dates.dateFin.setDate(0); // Dernier jour du mois précédent
    } else if (type === TypeCyclePaie.HEBDOMADAIRE) {
      // Cycle hebdomadaire : 7 jours à partir de la date de début
      dates.dateFin.setDate(dates.dateFin.getDate() + 6);
    }

    return dates;
  }

  /**
   * Génère un nom automatique pour un cycle
   */
  generateCycleName(type, startDate) {
    const date = new Date(startDate);
    const options = { month: 'long', year: 'numeric' };

    if (type === TypeCyclePaie.MENSUEL) {
      return `Paie ${date.toLocaleDateString('fr-FR', options)}`;
    } else if (type === TypeCyclePaie.HEBDOMADAIRE) {
      const weekNumber = Math.ceil(date.getDate() / 7);
      return `Paie Semaine ${weekNumber} - ${date.toLocaleDateString('fr-FR', options)}`;
    }

    return `Cycle ${date.toLocaleDateString('fr-FR')}`;
  }

  /**
   * Valide les données d'un cycle avant création/modification
   */
  validateCycleData(cycleData) {
    const errors = [];

    // Validation du nom
    if (!cycleData.nom || cycleData.nom.trim() === '') {
      errors.push('Le nom du cycle est requis');
    }

    // Validation du type
    if (!Object.values(TypeCyclePaie).includes(cycleData.typeCycle)) {
      errors.push('Type de cycle invalide');
    }

    // Validation des dates
    const startDate = new Date(cycleData.dateDebut);
    const endDate = new Date(cycleData.dateFin);

    if (isNaN(startDate.getTime())) {
      errors.push('Date de début invalide');
    }

    if (isNaN(endDate.getTime())) {
      errors.push('Date de fin invalide');
    }

    if (startDate >= endDate) {
      errors.push('La date de fin doit être postérieure à la date de début');
    }

    // Validation de la durée selon le type
    if (!errors.length) {
      const durationDays = Math.ceil((endDate - startDate) / (24 * 60 * 60 * 1000));

      if (cycleData.typeCycle === TypeCyclePaie.MENSUEL) {
        if (durationDays < 28 || durationDays > 31) {
          errors.push('Un cycle mensuel doit avoir une durée entre 28 et 31 jours');
        }
      } else if (cycleData.typeCycle === TypeCyclePaie.HEBDOMADAIRE) {
        if (durationDays !== 7) {
          errors.push('Un cycle hebdomadaire doit avoir une durée de 7 jours exactement');
        }
      }
    }

    return errors;
  }

  /**
   * Formate les données d'un cycle pour l'affichage
   */
  formatCycleForDisplay(cycle) {
    return {
      ...cycle,
      dateDebut: new Date(cycle.dateDebut).toLocaleDateString('fr-FR'),
      dateFin: new Date(cycle.dateFin).toLocaleDateString('fr-FR'),
      duree: this.calculateCycleDuration(cycle.dateDebut, cycle.dateFin),
      statutLabel: this.getStatusLabel(cycle.statut),
      typeCycleLabel: this.getTypeLabel(cycle.typeCycle),
      canEdit: cycle.statut === StatutCyclePaie.BROUILLON,
      canApprove: cycle.statut === StatutCyclePaie.BROUILLON,
      canClose: cycle.statut === StatutCyclePaie.APPROUVE
    };
  }

  /**
   * Calcule la durée d'un cycle en jours
   */
  calculateCycleDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Obtient le libellé d'un statut
   */
  getStatusLabel(status) {
    const labels = {
      [StatutCyclePaie.BROUILLON]: 'Brouillon',
      [StatutCyclePaie.APPROUVE]: 'Approuvé',
      [StatutCyclePaie.CLOTURE]: 'Clôturé'
    };
    return labels[status] || status;
  }

  /**
   * Obtient le libellé d'un type de cycle
   */
  getTypeLabel(type) {
    const labels = {
      [TypeCyclePaie.MENSUEL]: 'Mensuel',
      [TypeCyclePaie.HEBDOMADAIRE]: 'Hebdomadaire'
    };
    return labels[type] || type;
  }

  /**
   * Obtient la couleur d'un statut pour l'affichage
   */
  getStatusColor(status) {
    const colors = {
      [StatutCyclePaie.BROUILLON]: 'orange',
      [StatutCyclePaie.APPROUVE]: 'blue',
      [StatutCyclePaie.CLOTURE]: 'green'
    };
    return colors[status] || 'gray';
  }

  /**
   * Obtient le libellé d'un statut de bulletin de paie
   */
  getPaymentStatusLabel(status) {
    const labels = {
      [StatutBulletinPaie.EN_ATTENTE]: 'Non payé',
      [StatutBulletinPaie.PARTIEL]: 'Partiellement payé',
      [StatutBulletinPaie.PAYE]: 'Payé'
    };
    return labels[status] || status;
  }

  /**
   * Obtient la couleur d'un statut de paiement
   */
  getPaymentStatusColor(status) {
    const colors = {
      [StatutBulletinPaie.EN_ATTENTE]: 'red',
      [StatutBulletinPaie.PARTIEL]: 'orange',
      [StatutBulletinPaie.PAYE]: 'green'
    };
    return colors[status] || 'gray';
  }

  /**
   * Télécharge le bulletin de salaire en PDF
   */
  async downloadBulletinPDF(bulletinId) {
    try {
      const response = await api.get(`/cycles-paie/bulletins/${bulletinId}/pdf`, {
        responseType: 'blob'
      });
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `bulletin-${bulletinId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { succes: true, message: 'Bulletin téléchargé avec succès' };
    } catch (error) {
      console.error('Erreur lors du téléchargement du bulletin:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Valide le paiement d'un bulletin de salaire
   */
  async payerBulletin(bulletinId, modePaiement) {
    try {
      const response = await api.post(`/cycles-paie/bulletins/${bulletinId}/payer`, {
        modePaiement
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors du paiement du bulletin:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Ouvre le bulletin de salaire dans un nouvel onglet pour prévisualisation
   */
  async previewBulletinPDF(bulletinId) {
    try {
      const url = `${api.defaults.baseURL}/cycles-paie/bulletins/${bulletinId}/pdf`;
      const authToken = localStorage.getItem('authToken');
      
      // Créer un lien temporaire avec l'authentification
      const link = document.createElement('a');
      link.href = `${url}?token=${authToken}`;
      link.target = '_blank';
      link.click();
      
      return { succes: true, message: 'Bulletin ouvert dans un nouvel onglet' };
    } catch (error) {
      console.error('Erreur lors de l\'ouverture du bulletin:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Gère les erreurs d'API
   */
  handleApiError(error) {
    if (error.response && error.response.data && error.response.data.message) {
      return new Error(error.response.data.message);
    }
    return new Error('Une erreur inattendue s\'est produite');
  }
}

const payrollCycleService = new PayrollCycleService();
export default payrollCycleService;
