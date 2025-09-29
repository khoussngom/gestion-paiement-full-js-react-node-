import React from 'react';
import { Icon } from '@chakra-ui/react';
import {
  MdDashboard,
  MdBusiness,
  MdPeople,
  MdNotifications,
  MdSettings,
  MdLogout,
} from 'react-icons/md';

import SuperAdminDashboard from 'views/superAdmin/SuperAdminDashboard';

const superAdminRoutes = [
  {
    name: 'Dashboard Super Admin',
    layout: '/admin',
    path: '/super-admin',
    icon: <Icon as={MdDashboard} width="20px" height="20px" color="inherit" />,
    component: <SuperAdminDashboard />,
  },
  {
    name: 'Gestion Entreprises',
    layout: '/admin',
    path: '/super-admin/enterprises',
    icon: <Icon as={MdBusiness} width="20px" height="20px" color="inherit" />,
    component: <SuperAdminDashboard />, // Pour l'instant, même composant
  },
  {
    name: 'Demandes d\'Accès',
    layout: '/admin',
    path: '/super-admin/requests',
    icon: <Icon as={MdNotifications} width="20px" height="20px" color="inherit" />,
    component: <SuperAdminDashboard />,
  },
  {
    name: 'Utilisateurs',
    layout: '/admin',
    path: '/super-admin/users',
    icon: <Icon as={MdPeople} width="20px" height="20px" color="inherit" />,
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
    name: 'Déconnexion',
    layout: '/admin',
    path: '/logout',
    icon: <Icon as={MdLogout} width="20px" height="20px" color="inherit" />,
    action: 'logout',
  },
];

export default superAdminRoutes;
