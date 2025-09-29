import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import { AuthProvider } from 'contexts/AuthContext';
import LandingPage from 'views/auth/landing/LandingPage';
import SignIn from 'views/auth/signIn/SignIn';
import SuperAdminDashboard from 'views/superAdmin/SuperAdminDashboard';
import theme from 'theme/theme.js';

// Composant de test pour la route protégée
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('authToken');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (!token || user.role !== 'SUPER_ADMIN') {
    return <Navigate to="/auth/sign-in" replace />;
  }
  
  return children;
};

function TestApp() {
  return (
    <ChakraProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Route d'accueil - Landing Page */}
            <Route path="/" element={<Navigate to="/auth/landing" replace />} />
            <Route path="/auth/landing" element={<LandingPage />} />
            
            {/* Route de connexion */}
            <Route path="/auth/sign-in" element={<SignIn />} />
            
            {/* Route Super Admin protégée */}
            <Route 
              path="/admin/super-admin" 
              element={
                <ProtectedRoute>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Redirection par défaut */}
            <Route path="*" element={<Navigate to="/auth/landing" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ChakraProvider>
  );
}

export default TestApp;
