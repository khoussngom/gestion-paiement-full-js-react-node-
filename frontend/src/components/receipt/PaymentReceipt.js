import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Divider,
  Badge,
  Image,
  Flex
} from '@chakra-ui/react';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';

const PaymentReceipt = ({ 
  paiement, 
  employe, 
  entreprise, 
  cyclePaie,
  receiptNumber 
}) => {
  const { companyColors } = useCompanyTheme();
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount, devise = 'FCFA') => {
    return `${amount?.toLocaleString('fr-FR')} ${devise}`;
  };

  return (
    <Box
      maxW="600px"
      mx="auto"
      bg="white"
      p={8}
      borderRadius="lg"
      boxShadow="lg"
      border="1px solid"
      borderColor="gray.200"
    >
      {/* En-tête avec logo et informations entreprise */}
      <Flex mb={6} align="center">
        {entreprise?.logo && (
          <Image
            src={entreprise.logo}
            alt={entreprise.nom}
            maxH="60px"
            maxW="120px"
            objectFit="contain"
            mr={4}
          />
        )}
        <Box flex="1">
          <Text 
            fontSize="xl" 
            fontWeight="bold" 
            color={companyColors?.primary || "blue.600"}
          >
            {entreprise?.nom || 'Entreprise'}
          </Text>
          {entreprise?.adresse && (
            <Text fontSize="sm" color="gray.600">
              {entreprise.adresse}
            </Text>
          )}
          {entreprise?.telephone && (
            <Text fontSize="sm" color="gray.600">
              Tél: {entreprise.telephone}
            </Text>
          )}
        </Box>
        <Box textAlign="right">
          <Text fontSize="lg" fontWeight="bold" color={companyColors?.primary || "blue.600"}>
            REÇU DE PAIEMENT
          </Text>
          <Text fontSize="sm" color="gray.600">
            N° {receiptNumber}
          </Text>
          <Text fontSize="sm" color="gray.600">
            Date: {formatDate(paiement?.datePaiement || new Date())}
          </Text>
        </Box>
      </Flex>

      <Divider mb={6} />

      {/* Informations du cycle de paie */}
      <VStack spacing={4} align="stretch" mb={6}>
        <Box bg="gray.50" p={4} borderRadius="md">
          <Text fontWeight="bold" mb={2} color={companyColors?.primary || "blue.600"}>
            Informations du Cycle de Paie
          </Text>
          <HStack justify="space-between">
            <Text fontSize="sm">Période:</Text>
            <Text fontSize="sm" fontWeight="semibold">
              {cyclePaie?.dateDebut && cyclePaie?.dateFin 
                ? `${formatDate(cyclePaie.dateDebut)} - ${formatDate(cyclePaie.dateFin)}`
                : 'N/A'
              }
            </Text>
          </HStack>
          <HStack justify="space-between">
            <Text fontSize="sm">Statut:</Text>
            <Badge 
              colorScheme={cyclePaie?.statut === 'VALIDE' ? 'green' : 'orange'}
              variant="subtle"
            >
              {cyclePaie?.statut || 'N/A'}
            </Badge>
          </HStack>
        </Box>

        {/* Informations de l'employé */}
        <Box bg="gray.50" p={4} borderRadius="md">
          <Text fontWeight="bold" mb={2} color={companyColors?.primary || "blue.600"}>
            Informations de l'Employé
          </Text>
          <HStack justify="space-between">
            <Text fontSize="sm">Nom complet:</Text>
            <Text fontSize="sm" fontWeight="semibold">
              {employe?.nomComplet || 'N/A'}
            </Text>
          </HStack>
          <HStack justify="space-between">
            <Text fontSize="sm">Poste:</Text>
            <Text fontSize="sm" fontWeight="semibold">
              {employe?.poste || 'N/A'}
            </Text>
          </HStack>
          <HStack justify="space-between">
            <Text fontSize="sm">Type de contrat:</Text>
            <Text fontSize="sm" fontWeight="semibold">
              {employe?.typeContrat || 'N/A'}
            </Text>
          </HStack>
        </Box>
      </VStack>

      {/* Détails du paiement */}
      <Box bg={companyColors?.light || "blue.50"} p={4} borderRadius="md" mb={6}>
        <Text fontWeight="bold" mb={3} color={companyColors?.primary || "blue.600"}>
          Détails du Paiement
        </Text>
        
        <VStack spacing={2} align="stretch">
          <HStack justify="space-between">
            <Text fontSize="sm">Salaire de base:</Text>
            <Text fontSize="sm" fontWeight="semibold">
              {formatCurrency(paiement?.salaireBase, entreprise?.devise)}
            </Text>
          </HStack>
          
          {paiement?.heuresSupplementaires > 0 && (
            <HStack justify="space-between">
              <Text fontSize="sm">Heures supplémentaires:</Text>
              <Text fontSize="sm" fontWeight="semibold">
                {paiement.heuresSupplementaires}h × {formatCurrency(paiement.tauxHoraire, entreprise?.devise)}
              </Text>
            </HStack>
          )}
          
          {paiement?.primes > 0 && (
            <HStack justify="space-between">
              <Text fontSize="sm">Primes:</Text>
              <Text fontSize="sm" fontWeight="semibold">
                {formatCurrency(paiement.primes, entreprise?.devise)}
              </Text>
            </HStack>
          )}
          
          {paiement?.deductions > 0 && (
            <HStack justify="space-between">
              <Text fontSize="sm" color="red.600">Déductions:</Text>
              <Text fontSize="sm" fontWeight="semibold" color="red.600">
                -{formatCurrency(paiement.deductions, entreprise?.devise)}
              </Text>
            </HStack>
          )}

          <Divider />
          
          <HStack justify="space-between">
            <Text fontWeight="bold" fontSize="md">MONTANT NET:</Text>
            <Text 
              fontWeight="bold" 
              fontSize="md" 
              color={companyColors?.primary || "blue.600"}
            >
              {formatCurrency(paiement?.montantNet, entreprise?.devise)}
            </Text>
          </HStack>
        </VStack>
      </Box>

      {/* Mode de paiement */}
      <HStack justify="space-between" mb={6}>
        <Text fontSize="sm">Mode de paiement:</Text>
        <Badge colorScheme="green" variant="subtle">
          {paiement?.modePaiement || 'VIREMENT'}
        </Badge>
      </HStack>

      <Divider mb={4} />

      {/* Pied de page */}
      <Box textAlign="center">
        <Text fontSize="xs" color="gray.500">
          Ce reçu a été généré automatiquement le {formatDate(new Date())}
        </Text>
        <Text fontSize="xs" color="gray.500" mt={1}>
          {entreprise?.nom} - Système de Gestion des Salaires
        </Text>
      </Box>
    </Box>
  );
};

export default PaymentReceipt;
