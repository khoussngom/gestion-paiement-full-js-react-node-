import React from 'react';
import { Box, Text, Badge, VStack, HStack, useColorModeValue } from '@chakra-ui/react';
import { useAuth } from 'contexts/AuthContext';

const UserProfileInfo = () => {
  const { user } = useAuth();
  const bg = useColorModeValue('gray.50', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');

  if (!user) {
    return (
      <Box p={6} bg="red.50" borderRadius="lg" border="1px solid" borderColor="red.200">
        <Text color="red.600" fontWeight="bold">
          ❌ Aucun utilisateur connecté
        </Text>
      </Box>
    );
  }

  return (
    <Box p={6} bg={bg} borderRadius="lg" border="1px solid" borderColor="gray.200">
      <Text fontWeight="bold" mb={4} fontSize="lg" color={textColor}>
        📋 Informations du Compte
      </Text>
      <VStack align="start" spacing={3}>
        <HStack>
          <Text fontWeight="medium" color={textColor} minW="120px">Nom complet :</Text>
          <Text color={textColor}>{user.nom} {user.prenom}</Text>
        </HStack>
        <HStack>
          <Text fontWeight="medium" color={textColor} minW="120px">Email :</Text>
          <Text color={textColor}>{user.email}</Text>
        </HStack>
        <HStack>
          <Text fontWeight="medium" color={textColor} minW="120px">Rôle :</Text>
          <Badge 
            colorScheme={
              user.role === 'SUPER_ADMIN' ? 'purple' : 
              user.role === 'ADMIN_ENTREPRISE' ? 'blue' : 'green'
            }
            variant="subtle"
          >
            {user.role === 'SUPER_ADMIN' ? 'Super Administrateur' :
             user.role === 'ADMIN_ENTREPRISE' ? 'Admin Entreprise' : 
             user.role === 'CAISSIER' ? 'Caissier' : user.role}
          </Badge>
        </HStack>
        {user.entrepriseId && (
          <HStack>
            <Text fontWeight="medium" color={textColor} minW="120px">ID Entreprise :</Text>
            <Text color="gray.500" fontSize="sm">{user.entrepriseId}</Text>
          </HStack>
        )}
        {user.entrepriseNom && (
          <HStack>
            <Text fontWeight="medium" color={textColor} minW="120px">Entreprise :</Text>
            <Text color={textColor} fontWeight="medium">{user.entrepriseNom}</Text>
          </HStack>
        )}
        {user.isSuperAdminAccess && (
          <HStack>
            <Text fontWeight="medium" color={textColor} minW="120px">Mode spécial :</Text>
            <Badge colorScheme="orange" variant="solid">
              🔑 Accès Super Admin
            </Badge>
          </HStack>
        )}
        
        {/* Informations supplémentaires selon le rôle */}
        <Box pt={2} borderTop="1px solid" borderColor="gray.200" w="full">
          <Text fontSize="sm" color="gray.500" mb={2}>
            Permissions du rôle :
          </Text>
          <VStack align="start" spacing={1}>
            {user.role === 'SUPER_ADMIN' && (
              <>
                <Text fontSize="sm" color="green.600">✅ Gestion des entreprises</Text>
                <Text fontSize="sm" color="green.600">✅ Gestion des utilisateurs</Text>
                <Text fontSize="sm" color="green.600">✅ Accès aux interfaces d'entreprise</Text>
                <Text fontSize="sm" color="green.600">✅ Configuration système</Text>
              </>
            )}
            {user.role === 'ADMIN_ENTREPRISE' && (
              <>
                <Text fontSize="sm" color="blue.600">✅ Gestion des employés</Text>
                <Text fontSize="sm" color="blue.600">✅ Gestion des cycles de paie</Text>
                <Text fontSize="sm" color="blue.600">✅ Gestion des paiements</Text>
                <Text fontSize="sm" color="blue.600">✅ Rapports et statistiques</Text>
              </>
            )}
            {user.role === 'CAISSIER' && (
              <>
                <Text fontSize="sm" color="orange.600">✅ Enregistrement des paiements</Text>
                <Text fontSize="sm" color="orange.600">✅ Consultation des employés</Text>
                <Text fontSize="sm" color="gray.500">❌ Modification limitée</Text>
              </>
            )}
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
};

export default UserProfileInfo;
