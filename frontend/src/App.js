import './assets/css/App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import {} from 'react-router-dom';
import AuthLayout from './layouts/auth';
import AdminLayout from './layouts/admin';
import ProtectedRoute from './components/ProtectedRoute';
import {
  ChakraProvider,
  // extendTheme
} from '@chakra-ui/react';
import initialTheme from './theme/theme'; //  { themeGreen }
import { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
// Chakra imports

export default function Main() {
  // eslint-disable-next-line
  const [currentTheme, setCurrentTheme] = useState(initialTheme);
  return (
    <ChakraProvider theme={currentTheme}>
      <AuthProvider>
        <Routes>
          <Route path="auth/*" element={<AuthLayout />} />
          <Route
            path="admin/*"
            element={
              <ProtectedRoute>
                <AdminLayout theme={currentTheme} setTheme={setCurrentTheme} />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/auth/sign-in" replace />} />
        </Routes>
      </AuthProvider>
    </ChakraProvider>
  );
}
