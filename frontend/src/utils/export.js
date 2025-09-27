// Utilitaires pour l'export de données

export const exportToCSV = (data, filename = 'export.csv') => {
  if (!data || data.length === 0) {
    console.warn('Aucune donnée à exporter');
    return;
  }

  // Obtenir les en-têtes des colonnes à partir du premier élément
  const headers = Object.keys(data[0]);
  
  // Créer le contenu CSV
  const csvContent = [
    // En-têtes
    headers.join(','),
    // Données
    ...data.map(row => 
      headers.map(header => {
        const value = row[header];
        // Gérer les valeurs qui contiennent des virgules, des guillemets ou des sauts de ligne
        if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value || '';
      }).join(',')
    )
  ].join('\n');

  // Créer et télécharger le fichier
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export const formatEmployeeForExport = (employee) => {
  return {
    'Nom complet': employee.nomComplet,
    'Email': employee.email || '',
    'Téléphone': employee.telephone || '',
    'Poste': employee.poste,
    'Type de contrat': employee.typeContrat,
    'Salaire fixe': employee.salaireFixe || '',
    'Taux honoraire': employee.tauxHonoraire || '',
    'Taux salaire horaire': employee.tauxSalaireHoraire || '',
    'Date d\'embauche': employee.dateEmbauche ? new Date(employee.dateEmbauche).toLocaleDateString('fr-FR') : '',
    'Adresse': employee.adresse || '',
    'Actif': employee.actif ? 'Oui' : 'Non',
    'Dernier paiement - Montant': employee.dernierPaiement?.montant || '',
    'Dernier paiement - Date': employee.dernierPaiement?.date ? new Date(employee.dernierPaiement.date).toLocaleDateString('fr-FR') : '',
    'Dernier paiement - Mode': employee.dernierPaiement?.modePaiement || ''
  };
};

export const formatCurrency = (amount, currency = 'FCFA') => {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('fr-FR', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ` ${currency}`;
};

export const downloadJSON = (data, filename = 'export.json') => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
