import React, { createContext, useContext, useState, useEffect } from 'react';
import autorisationService from '../services/autorisationService';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [autorisationsActives, setAutorisationsActives] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Simuler le polling pour les nouvelles autorisations
  useEffect(() => {
    const checkNewAuthorizations = async () => {
      try {
        setIsLoading(true);
        const result = await autorisationService.obtenirMesAutorisations();
        
        if (result.succes && result.donnees) {
          const nouvellesAutorisations = result.donnees;
          
          // Vérifier s'il y a de nouvelles autorisations
          const nouvellesNotifications = nouvellesAutorisations
            .filter(auth => auth.estValide && !autorisationsActives.some(existing => existing.id === auth.id))
            .map(auth => ({
              id: auth.id,
              type: 'nouvelle_autorisation',
              entrepriseId: auth.entrepriseId,
              entrepriseNom: auth.entreprise?.nom,
              adminNom: `${auth.admin?.prenom} ${auth.admin?.nom}`,
              dateCreation: new Date(auth.dateCreation),
              dateExpiration: new Date(auth.dateExpiration),
              tempsRestant: auth.tempsRestant,
              raisonAcces: auth.raisonAcces,
              lu: false,
              autorisation: auth
            }));

          if (nouvellesNotifications.length > 0) {
            setNotifications(prev => [...nouvellesNotifications, ...prev]);
            setUnreadCount(prev => prev + nouvellesNotifications.length);
          }

          setAutorisationsActives(nouvellesAutorisations);
        }
      } catch (error) {
        console.error('Erreur lors de la vérification des autorisations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    // Vérification initiale
    checkNewAuthorizations();

    // Polling toutes les 30 secondes
    const interval = setInterval(checkNewAuthorizations, 30000);

    return () => clearInterval(interval);
  }, [autorisationsActives]);

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId 
          ? { ...notif, lu: true }
          : notif
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, lu: true }))
    );
    setUnreadCount(0);
  };

  const removeNotification = (notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.lu) {
        setUnreadCount(count => Math.max(0, count - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now().toString(),
      ...notification,
      dateCreation: new Date(),
      lu: false
    };
    setNotifications(prev => [newNotification, ...prev]);
    setUnreadCount(prev => prev + 1);
  };

  const value = {
    notifications,
    autorisationsActives,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAllNotifications,
    addNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};