import React from 'react';
import { Box, Text, Badge, VStack, HStack } from '@chakra-ui/react';
import { useAuth } from 'contexts/AuthContext';

const UserDebugInfo = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <Box p={4} bg="red.100" borderRadius="md" m={4}>
        <Text color="red.600" fontWeight="bold">
          ❌ Aucun utilisateur connecté
        </Text>
      </Box>
    );
  }

  return (
    <Box p={4} bg="blue.50" borderRadius="md" m={4} fontSize="sm">
      <Text fontWeight="bold" mb={2}>🔍 Informations utilisateur actuel :</Text>
      <VStack align="start" spacing={1}>
        <HStack>
          <Text fontWeight="medium">Nom :</Text>
          <Text>{user.nom} {user.prenom}</Text>
        </HStack>
        <HStack>
          <Text fontWeight="medium">Email :</Text>
          <Text>{user.email}</Text>
        </HStack>
        <HStack>
          <Text fontWeight="medium">Rôle :</Text>
          <Badge colorScheme={
            user.role === 'SUPER_ADMIN' ? 'purple' : 
            user.role === 'ADMIN_ENTREPRISE' ? 'blue' : 'green'
          }>
            {user.role}
          </Badge>
        </HStack>
        {user.entrepriseId && (
          <HStack>
            <Text fontWeight="medium">Entreprise ID :</Text>
            <Text>{user.entrepriseId}</Text>
          </HStack>
        )}
        {user.entrepriseNom && (
          <HStack>
            <Text fontWeight="medium">Entreprise :</Text>
            <Text>{user.entrepriseNom}</Text>
          </HStack>
        )}
        {user.isSuperAdminAccess && (
          <HStack>
            <Text fontWeight="medium">Mode :</Text>
            <Badge colorScheme="orange">Accès Super Admin</Badge>
          </HStack>
        )}
      </VStack>
    </Box>
  );
};

export default UserDebugInfo;
