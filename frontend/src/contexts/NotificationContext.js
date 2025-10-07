import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
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
  
  // Utiliser useRef pour éviter les dépendances infinies
  const autorisationsActivesRef = useRef([]);
  const isMountedRef = useRef(true);
  const lastCheckTimeRef = useRef(0);

  // Fonction callback stable pour vérifier les autorisations
  const checkNewAuthorizations = useCallback(async () => {
    // Éviter les appels trop fréquents (minimum 5 secondes entre les appels)
    const now = Date.now();
    if (now - lastCheckTimeRef.current < 5000) {
      console.log('🚫 Appel trop fréquent aux autorisations, ignoré');
      return;
    }
    lastCheckTimeRef.current = now;

    // Vérifier si le composant est toujours monté
    if (!isMountedRef.current) {
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔍 Vérification des autorisations...');
      const result = await autorisationService.obtenirMesAutorisations();
      
      // Vérifier à nouveau si le composant est monté après la requête async
      if (!isMountedRef.current) {
        return;
      }
      
      if (result.succes && result.donnees) {
        const nouvellesAutorisations = result.donnees;
        const currentAutorisations = autorisationsActivesRef.current;
        
        // Vérifier s'il y a de nouvelles autorisations
        const nouvellesNotifications = nouvellesAutorisations
          .filter(auth => auth.estValide && !currentAutorisations.some(existing => existing.id === auth.id))
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
          console.log(`🆕 ${nouvellesNotifications.length} nouvelles autorisations trouvées`);
          setNotifications(prev => [...nouvellesNotifications, ...prev]);
          setUnreadCount(prev => prev + nouvellesNotifications.length);
        }

        // Mettre à jour les autorisations actives dans la ref et le state
        autorisationsActivesRef.current = nouvellesAutorisations;
        setAutorisationsActives(nouvellesAutorisations);
      }
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des autorisations:', error);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  // Simuler le polling pour les nouvelles autorisations
  useEffect(() => {
    isMountedRef.current = true;
    
    // Vérification initiale avec un petit délai pour éviter les problèmes de timing
    const initialTimeout = setTimeout(() => {
      if (isMountedRef.current) {
        checkNewAuthorizations();
      }
    }, 1000);

    // Polling toutes les 30 secondes
    const interval = setInterval(() => {
      if (isMountedRef.current) {
        checkNewAuthorizations();
      }
    }, 30000);

    return () => {
      isMountedRef.current = false;
      clearTimeout(initialTimeout);
      clearInterval(interval);
      console.log('🧹 NotificationProvider cleanup effectué');
    };
  }, [checkNewAuthorizations]);

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