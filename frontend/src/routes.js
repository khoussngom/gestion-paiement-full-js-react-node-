import React from 'react';

import { Icon } from '@chakra-ui/react';
import {
  MdPerson,
  MdHome,
  MdLogout,
  MdWork,
  MdAttachMoney,
  MdSettings,
  MdQrCodeScanner,
  MdAssessment,
  MdQrCode,
} from 'react-icons/md';

// Admin Imports - Gestion des Salariés
import PayrollDashboard from 'views/admin/payrollDashboard';
import Employees from 'views/admin/employees';
import PayrollCycles from 'views/admin/payrollCycles';
import Payments from 'views/admin/payments';
import Profile from 'views/admin/profile';
import SignIn from 'views/auth/signIn/SignIn';
import LandingPage from 'views/auth/landing/LandingPage';
import SuperAdminDashboard from 'views/superAdmin/SuperAdminDashboard';
import CompanySettings from 'views/admin/settings/CompanySettings';

// Pointage Imports
import VigileScanner from 'views/vigile/Scanner';
import PointageReports from 'views/admin/pointage/Reports';
import QRCodeManagement from 'views/admin/pointage/QRCodeManagement';

const routes = [
  {
    name: 'Tableau de Bord',
    layout: '/admin',
    path: '/dashboard',
    icon: <Icon as={MdHome} width="20px" height="20px" color="inherit" />,
    component: <PayrollDashboard />,
  },
  {
    name: 'Employés',
    layout: '/admin',
    path: '/employees',
    icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
    component: <Employees />,
  },
  {
    name: 'Cycles de Paie',
    layout: '/admin',
    path: '/payroll-cycles',
    icon: <Icon as={MdWork} width="20px" height="20px" color="inherit" />,
    component: <PayrollCycles />,
  },
  {
    name: 'Paiements',
    layout: '/admin',
    path: '/payments',
    icon: <Icon as={MdAttachMoney} width="20px" height="20px" color="inherit" />,
    component: <Payments />,
  },
  {
    name: 'Paramètres Entreprise',
    layout: '/admin',
    path: '/company-settings',
    icon: <Icon as={MdSettings} width="20px" height="20px" color="inherit" />,
    component: <CompanySettings />,
  },
  {
    name: 'Scanner QR',
    layout: '/admin',
    path: '/scanner',
    icon: <Icon as={MdQrCodeScanner} width="20px" height="20px" color="inherit" />,
    component: <VigileScanner />,
    vigileOnly: true, // Accessible uniquement aux vigiles
  },
  {
    name: 'Rapports Pointage',
    layout: '/admin',
    path: '/pointage-reports',
    icon: <Icon as={MdAssessment} width="20px" height="20px" color="inherit" />,
    component: <PointageReports />,
    adminOnly: true, // Accessible uniquement aux admins
  },
  {
    name: 'QR Codes',
    layout: '/admin',
    path: '/qr-management',
    icon: <Icon as={MdQrCode} width="20px" height="20px" color="inherit" />,
    component: <QRCodeManagement />,
    adminOnly: true, // Accessible uniquement aux admins
  },
  {
    name: 'Profil',
    layout: '/admin',
    path: '/profile',
    icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
    component: <Profile />,
  },
  // Routes cachées (pas dans la sidebar)
  {
    name: 'Accueil',
    layout: '/auth',
    path: '/landing',
    component: <LandingPage />,
    hideInSidebar: true,
  },
  {
    name: 'Connexion',
    layout: '/auth',
    path: '/sign-in',
    component: <SignIn />,
    hideInSidebar: true,
  },
  {
    name: 'Super Admin',
    layout: '/admin',
    path: '/super-admin',
    icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
    component: <SuperAdminDashboard />,
    hideInSidebar: true, // Caché de la sidebar normale
    superAdminOnly: true, // Accessible seulement au super admin
  },
  {
    name: 'Déconnexion',
    layout: '/admin',
    path: '/logout',
    icon: <Icon as={MdLogout} width="20px" height="20px" color="inherit" />,
    action: 'logout',
  }
];

export default routes;
