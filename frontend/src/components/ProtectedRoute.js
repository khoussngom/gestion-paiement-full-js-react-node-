import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Box, Spinner, Text, VStack } from '@chakra-ui/react';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        alignItems="center"
        justifyContent="center"
        minHeight="100vh"
      >
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Chargement...</Text>
        </VStack>
      </Box>
    );
  }

  if (!isAuthenticated()) {
    return <Navigate to="/auth/sign-in" replace />;
  }

  return children;
};

export default ProtectedRoute;
