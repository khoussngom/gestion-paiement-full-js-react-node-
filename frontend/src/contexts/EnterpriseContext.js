import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const EnterpriseContext = createContext();

export const useEnterprise = () => {
  const context = useContext(EnterpriseContext);
  if (!context) {
    throw new Error('useEnterprise must be used within an EnterpriseProvider');
  }
  return context;
};

export const EnterpriseProvider = ({ children }) => {
  const [currentEnterprise, setCurrentEnterprise] = useState(null);
  const [isEnterpriseMode, setIsEnterpriseMode] = useState(false);
  const { user, setUser } = useAuth();

  useEffect(() => {
    // Vérifier s'il y a un contexte d'entreprise dans l'utilisateur
    if (user?.entrepriseId && user?.isSuperAdminAccess) {
      setCurrentEnterprise({
        id: user.entrepriseId,
        nom: user.entrepriseNom,
        autorisation: user.autorisation
      });
      setIsEnterpriseMode(true);
    } else {
      setCurrentEnterprise(null);
      setIsEnterpriseMode(false);
    }
  }, [user]);

  const enterEnterpriseMode = (enterpriseData) => {
    // Sauvegarder le rôle original si ce n'est pas déjà fait
    const originalRole = user.originalRole || user.role;
    
    // Créer le nouvel utilisateur avec le contexte d'entreprise
    const updatedUser = {
      ...user,
      entrepriseId: enterpriseData.id,
      entrepriseNom: enterpriseData.nom,
      autorisation: enterpriseData.autorisation,
      isSuperAdminAccess: true,
      originalRole: originalRole,
      role: 'ADMIN' // Temporairement agir comme admin de cette entreprise
    };

    // Mettre à jour le localStorage
    localStorage.setItem('user', JSON.stringify(updatedUser));
    setUser(updatedUser);

    setCurrentEnterprise(enterpriseData);
    setIsEnterpriseMode(true);
  };

  const exitEnterpriseMode = () => {
    // Restaurer l'utilisateur original
    const originalUser = {
      ...user,
      entrepriseId: null,
      entrepriseNom: null,
      autorisation: null,
      isSuperAdminAccess: false,
      role: user.originalRole || 'SUPER_ADMIN'
    };
    delete originalUser.originalRole;

    // Mettre à jour le localStorage
    localStorage.setItem('user', JSON.stringify(originalUser));
    setUser(originalUser);

    setCurrentEnterprise(null);
    setIsEnterpriseMode(false);
  };

  const value = {
    currentEnterprise,
    isEnterpriseMode,
    enterEnterpriseMode,
    exitEnterpriseMode,
    
    // Helpers pour vérifier les autorisations dans le contexte actuel
    hasPermission: (permission) => {
      if (!isEnterpriseMode || !currentEnterprise?.autorisation) {
        return false;
      }
      
      const autorisation = currentEnterprise.autorisation;
      
      // Vérifier si l'autorisation est encore valide
      if (new Date(autorisation.dateExpiration) <= new Date()) {
        return false;
      }

      // Vérifier les permissions selon le rôle accordé
      const rolePermissions = {
        'ADMIN': ['read', 'write', 'delete', 'manage_employees', 'manage_payroll'],
        'RH': ['read', 'write', 'manage_employees'],
        'COMPTABLE': ['read', 'manage_payroll'],
        'EMPLOYE': ['read']
      };

      const allowedPermissions = rolePermissions[autorisation.roleAccorde] || [];
      return allowedPermissions.includes(permission);
    },

    // Obtenir les informations d'affichage pour l'interface
    getDisplayInfo: () => {
      if (!isEnterpriseMode || !currentEnterprise) {
        return null;
      }

      return {
        titre: `Interface ${currentEnterprise.nom}`,
        sousTitre: `Accès ${currentEnterprise.autorisation?.roleAccorde || 'Temporaire'}`,
        entreprise: currentEnterprise.nom,
        role: currentEnterprise.autorisation?.roleAccorde,
        expirationFormatee: currentEnterprise.autorisation?.tempsRestant,
        isTemporary: true
      };
    }
  };

  return (
    <EnterpriseContext.Provider value={value}>
      {children}
    </EnterpriseContext.Provider>
  );
};