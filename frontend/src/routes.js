import React from 'react';

import { Icon } from '@chakra-ui/react';
import {
  MdPerson,
  MdHome,
  MdLogout,
  MdWork,
  MdAttachMoney,
} from 'react-icons/md';

// Admin Imports - Gestion des Salariés
import PayrollDashboard from 'views/admin/payrollDashboard';
import Employees from 'views/admin/employees';
import PayrollCycles from 'views/admin/payrollCycles';
import Payments from 'views/admin/payments';
import Profile from 'views/admin/profile';

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
    name: 'Profile',
    layout: '/admin',
    path: '/profile',
    icon: <Icon as={MdPerson} width="20px" height="20px" color="inherit" />,
    component: <Profile />,
  },
  {
    name: 'Déconnexion',
    layout: '/admin',
    path: '/logout',
    icon: <Icon as={MdLogout} width="20px" height="20px" color="inherit" />,
    action: 'logout', // Marquer cette route comme une action spéciale
  },
];

export default routes;
