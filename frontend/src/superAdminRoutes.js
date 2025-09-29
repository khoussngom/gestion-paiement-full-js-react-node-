import React from 'react';
import { Icon } from '@chakra-ui/react';
import {
  MdDashboard,
  MdBusiness,
  MdNotifications,
  MdSettings,
  MdLogout,
  MdAccountCircle,
} from 'react-icons/md';

import SuperAdminDashboard from 'views/superAdmin/SuperAdminDashboard';
import EntrepriseManagement from 'views/superAdmin/EntrepriseManagement';
import UserManagement from 'views/superAdmin/UserManagement';
import EnterpriseDashboard from 'views/superAdmin/EnterpriseDashboard';

const superAdminRoutes = [
  {
    name: 'Dashboard Super Admin',
    layout: '/admin',
    path: '/super-admin',
    icon: <Icon as={MdDashboard} width="20px" height="20px" color="inherit" />,
    component: <SuperAdminDashboard />,
  },
  {
    name: 'Demandes d\'Accès',
    layout: '/admin',
    path: '/super-admin/requests',
    icon: <Icon as={MdNotifications} width="20px" height="20px" color="inherit" />,
    component: <SuperAdminDashboard />,
  },
  {
    name: 'Paramètres',
    layout: '/admin',
    path: '/super-admin/settings',
    icon: <Icon as={MdSettings} width="20px" height="20px" color="inherit" />,
    component: <SuperAdminDashboard />,
  },
  {
    name: 'Gestion Entreprises',
    layout: '/admin',
    path: '/super-admin/enterprises',
    icon: <Icon as={MdBusiness} width="20px" height="20px" color="inherit" />,
    component: <EntrepriseManagement />,
  },
  {
    name: '', // Nom vide pour juste l'icône
    layout: '/admin',
    path: '/super-admin/users',
    icon: <Icon as={MdAccountCircle} width="24px" height="24px" color="inherit" />,
    component: <UserManagement />,
    isUserIcon: true, // Flag pour identifier que c'est l'icône utilisateur
    tooltip: 'Gestion des Utilisateurs', // Texte du tooltip
  },
  {
    name: 'Dashboard Entreprise',
    layout: '/admin',
    path: '/entreprise/:entrepriseId/dashboard',
    component: <EnterpriseDashboard />,
    hidden: true, // Ne pas afficher dans le menu
  },
  {
    name: 'Déconnexion',
    layout: '/admin',
    path: '/logout',
    icon: <Icon as={MdLogout} width="20px" height="20px" color="inherit" />,
    action: 'logout',
  },
];

export default superAdminRoutes;
