import React from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Divider,
  Badge,
  Image,
  Flex,
  Card,
  CardBody,
  CardHeader,
  Heading,
  SimpleGrid
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
      maxW="700px"
      mx="auto"
      bg="gray.50"
      p={6}
      borderRadius="xl"
      minH="800px"
    >
      {/* Card En-tête avec dégradé */}
      <Card 
        mb={6} 
        bg={`linear-gradient(135deg, ${companyColors?.primary || "#007BFF"}, ${companyColors?.secondary || "#0056b3"})`}
        color="white"
        boxShadow="xl"
      >
        <CardBody p={6}>
          <Flex align="center" justify="space-between">
            <HStack spacing={4}>
              {entreprise?.logo && (
                <Box 
                  bg="white" 
                  p={2} 
                  borderRadius="md"
                  boxShadow="md"
                >
                  <Image
                    src={entreprise.logo}
                    alt={entreprise.nom}
                    maxH="50px"
                    maxW="100px"
                    objectFit="contain"
                  />
                </Box>
              )}
              <VStack align="start" spacing={1}>
                <Heading size="lg" color="white">
                  {entreprise?.nom || 'Entreprise'}
                </Heading>
                {entreprise?.adresse && (
                  <Text fontSize="sm" opacity={0.9}>
                    📍 {entreprise.adresse}
                  </Text>
                )}
                {entreprise?.telephone && (
                  <Text fontSize="sm" opacity={0.9}>
                    📞 {entreprise.telephone}
                  </Text>
                )}
              </VStack>
            </HStack>
            
            <VStack align="end" spacing={1}>
              <Heading size="md" color="white">
                REÇU DE PAIEMENT
              </Heading>
              <Text fontSize="lg" fontWeight="bold" opacity={0.9}>
                N° {receiptNumber}
              </Text>
              <Text fontSize="sm" opacity={0.8}>
                📅 {formatDate(paiement?.datePaiement || new Date())}
              </Text>
            </VStack>
          </Flex>
        </CardBody>
      </Card>

      {/* Grille de cartes d'informations */}
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} mb={6}>
        {/* Card Cycle de Paie */}
        <Card 
          boxShadow="lg" 
          borderLeft="4px solid"
          borderLeftColor={companyColors?.primary || "blue.500"}
          bg="white"
        >
          <CardHeader pb={2}>
            <HStack>
              <Box 
                p={2} 
                bg={companyColors?.light || "blue.50"} 
                borderRadius="md"
              >
                <Text fontSize="lg">📊</Text>
              </Box>
              <Heading size="sm" color={companyColors?.primary || "blue.600"}>
                Cycle de Paie
              </Heading>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <VStack align="stretch" spacing={2}>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600">Période:</Text>
                <Text fontSize="sm" fontWeight="semibold">
                  {cyclePaie?.dateDebut && cyclePaie?.dateFin 
                    ? `${formatDate(cyclePaie.dateDebut)} - ${formatDate(cyclePaie.dateFin)}`
                    : 'N/A'
                  }
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600">Statut:</Text>
                <Badge 
                  colorScheme={cyclePaie?.statut === 'VALIDE' ? 'green' : 'orange'}
                  variant="subtle"
                  borderRadius="full"
                >
                  {cyclePaie?.statut || 'N/A'}
                </Badge>
              </HStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Card Employé */}
        <Card 
          boxShadow="lg" 
          borderLeft="4px solid"
          borderLeftColor={companyColors?.secondary || "blue.400"}
          bg="white"
        >
          <CardHeader pb={2}>
            <HStack>
              <Box 
                p={2} 
                bg={companyColors?.light || "blue.50"} 
                borderRadius="md"
              >
                <Text fontSize="lg">👤</Text>
              </Box>
              <Heading size="sm" color={companyColors?.primary || "blue.600"}>
                Employé
              </Heading>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <VStack align="stretch" spacing={2}>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600">Nom:</Text>
                <Text fontSize="sm" fontWeight="semibold">
                  {employe?.nomComplet || 'N/A'}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600">Poste:</Text>
                <Text fontSize="sm" fontWeight="semibold">
                  {employe?.poste || 'N/A'}
                </Text>
              </HStack>
              <HStack justify="space-between">
                <Text fontSize="sm" color="gray.600">Contrat:</Text>
                <Badge 
                  colorScheme="gray" 
                  variant="subtle"
                  borderRadius="full"
                >
                  {employe?.typeContrat || 'N/A'}
                </Badge>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Card principale des détails de paiement */}
      <Card 
        boxShadow="xl" 
        bg="white"
        border="2px solid"
        borderColor={companyColors?.primary || "blue.500"}
        mb={6}
      >
        <CardHeader 
          bg={companyColors?.light || "blue.50"}
          borderTopRadius="md"
        >
          <HStack>
            <Box 
              p={2} 
              bg={companyColors?.primary || "blue.500"} 
              borderRadius="md"
              color="white"
            >
              <Text fontSize="lg">💰</Text>
            </Box>
            <Heading size="md" color={companyColors?.primary || "blue.600"}>
              Détails du Paiement
            </Heading>
          </HStack>
        </CardHeader>
        
        <CardBody>
          <VStack spacing={4} align="stretch">
            {/* Ligne des éléments du salaire */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box 
                p={3} 
                bg="green.50" 
                borderRadius="md" 
                borderLeft="4px solid" 
                borderLeftColor="green.400"
              >
                <HStack justify="space-between">
                  <Text fontSize="sm" color="green.700">💼 Salaire de base:</Text>
                  <Text fontSize="sm" fontWeight="bold" color="green.700">
                    {formatCurrency(paiement?.salaireBase, entreprise?.devise)}
                  </Text>
                </HStack>
              </Box>
              
              {paiement?.primes > 0 && (
                <Box 
                  p={3} 
                  bg="blue.50" 
                  borderRadius="md" 
                  borderLeft="4px solid" 
                  borderLeftColor="blue.400"
                >
                  <HStack justify="space-between">
                    <Text fontSize="sm" color="blue.700">🎁 Primes:</Text>
                    <Text fontSize="sm" fontWeight="bold" color="blue.700">
                      {formatCurrency(paiement.primes, entreprise?.devise)}
                    </Text>
                  </HStack>
                </Box>
              )}
            </SimpleGrid>
            
            {paiement?.heuresSupplementaires > 0 && (
              <Box 
                p={3} 
                bg="orange.50" 
                borderRadius="md" 
                borderLeft="4px solid" 
                borderLeftColor="orange.400"
              >
                <HStack justify="space-between">
                  <Text fontSize="sm" color="orange.700">⏰ Heures supplémentaires:</Text>
                  <Text fontSize="sm" fontWeight="bold" color="orange.700">
                    {paiement.heuresSupplementaires}h × {formatCurrency(paiement.tauxHoraire, entreprise?.devise)}
                  </Text>
                </HStack>
              </Box>
            )}
            
            {paiement?.deductions > 0 && (
              <Box 
                p={3} 
                bg="red.50" 
                borderRadius="md" 
                borderLeft="4px solid" 
                borderLeftColor="red.400"
              >
                <HStack justify="space-between">
                  <Text fontSize="sm" color="red.700">➖ Déductions:</Text>
                  <Text fontSize="sm" fontWeight="bold" color="red.700">
                    -{formatCurrency(paiement.deductions, entreprise?.devise)}
                  </Text>
                </HStack>
              </Box>
            )}

            <Divider borderColor={companyColors?.primary || "blue.500"} />
            
            {/* Total avec effet visuel */}
            <Box 
              p={4} 
              bg={`linear-gradient(135deg, ${companyColors?.primary || "#007BFF"}, ${companyColors?.secondary || "#0056b3"})`}
              borderRadius="lg"
              color="white"
              textAlign="center"
            >
              <Text fontSize="sm" opacity={0.9} mb={1}>MONTANT NET À PAYER</Text>
              <Text 
                fontSize="2xl" 
                fontWeight="bold"
                textShadow="0 2px 4px rgba(0,0,0,0.3)"
              >
                {formatCurrency(paiement?.montantNet, entreprise?.devise)}
              </Text>
            </Box>
          </VStack>
        </CardBody>
      </Card>

      {/* Card Mode de paiement */}
      <Card boxShadow="md" bg="white" mb={4}>
        <CardBody>
          <HStack justify="space-between" align="center">
            <HStack>
              <Box 
                p={2} 
                bg={companyColors?.light || "blue.50"} 
                borderRadius="md"
              >
                <Text fontSize="md">💳</Text>
              </Box>
              <Text fontSize="sm" fontWeight="semibold" color="gray.700">
                Mode de paiement:
              </Text>
            </HStack>
            <Badge 
              colorScheme="green" 
              variant="solid"
              px={3}
              py={1}
              borderRadius="full"
              fontSize="xs"
            >
              {paiement?.modePaiement || 'VIREMENT'}
            </Badge>
          </HStack>
        </CardBody>
      </Card>

      {/* Card Pied de page avec style */}
      <Card 
        boxShadow="sm" 
        bg={companyColors?.light || "blue.50"}
        border="1px solid"
        borderColor={companyColors?.secondary || "blue.200"}
      >
        <CardBody textAlign="center" py={4}>
          <VStack spacing={2}>
            <HStack>
              <Text fontSize="xs" color="gray.600">📄</Text>
              <Text fontSize="xs" color="gray.600" fontWeight="medium">
                Reçu généré automatiquement le {formatDate(new Date())}
              </Text>
            </HStack>
            <Text 
              fontSize="xs" 
              color={companyColors?.primary || "blue.600"} 
              fontWeight="bold"
              letterSpacing="wide"
            >
              {entreprise?.nom?.toUpperCase()} - SYSTÈME DE GESTION DES SALAIRES
            </Text>
            <Text fontSize="xs" color="gray.500" fontStyle="italic">
              ✓ Document officiel certifié
            </Text>
          </VStack>
        </CardBody>
      </Card>
    </Box>
  );
};

export default PaymentReceipt;
