import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  Badge,
  Card,
  CardBody,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon
} from '@chakra-ui/react';
import { MdArrowBack, MdBusiness, MdPeople, MdAttachMoney, MdTrendingUp } from 'react-icons/md';
import PayrollDashboard from '../admin/payrollDashboard';

const EnterpriseDashboard = () => {
  const { entrepriseId } = useParams();
  const navigate = useNavigate();
  const [entreprise, setEntreprise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const loadEntreprise = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/entreprises/${entrepriseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      
      if (data.succes) {
        setEntreprise(data.donnees);
      } else {
        setError(data.message || 'Entreprise non trouvée');
      }
    } catch (error) {
      setError('Erreur lors du chargement de l\'entreprise');
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de l\'entreprise',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [entrepriseId, toast]);

  useEffect(() => {
    loadEntreprise();
  }, [loadEntreprise]);

  if (loading) {
    return (
      <Container maxW="7xl" py={8}>
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Chargement des données de l'entreprise...</Text>
        </VStack>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="7xl" py={8}>
        <VStack spacing={4}>
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
          <Button leftIcon={<MdArrowBack />} onClick={() => navigate('/admin/super-admin/enterprises')}>
            Retour aux entreprises
          </Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="7xl" pt={{ base: "130px", md: "80px", xl: "100px" }} py={8}>
      <VStack spacing={6} align="stretch">
        {/* Header avec info entreprise */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <HStack justify="space-between">
                <Button
                  leftIcon={<MdArrowBack />}
                  variant="ghost"
                  onClick={() => navigate('/admin/super-admin/enterprises')}
                >
                  Retour aux entreprises
                </Button>
                <Badge colorScheme={entreprise.actif ? 'green' : 'red'} size="lg">
                  {entreprise.actif ? 'Active' : 'Inactive'}
                </Badge>
              </HStack>

              <Box>
                <Heading size="xl" mb={2}>
                  <HStack>
                    <Icon as={MdBusiness} color="blue.500" />
                    <Text>{entreprise.nom}</Text>
                  </HStack>
                </Heading>
                <Text color="gray.600" fontSize="lg">
                  Dashboard de l'entreprise - Vue Super Administrateur
                </Text>
              </Box>

              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="gray.500">EMAIL</Text>
                  <Text>{entreprise.email || 'Non renseigné'}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="gray.500">TÉLÉPHONE</Text>
                  <Text>{entreprise.telephone || 'Non renseigné'}</Text>
                </Box>
                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="gray.500">DEVISE</Text>
                  <Text>{entreprise.devise || 'FCFA'}</Text>
                </Box>
              </SimpleGrid>

              {entreprise.adresse && (
                <Box>
                  <Text fontWeight="bold" fontSize="sm" color="gray.500">ADRESSE</Text>
                  <Text>{entreprise.adresse}</Text>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Statistiques rapides */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={MdPeople} color="blue.500" />
                    <Text>Employés</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="blue.600">
                  {entreprise._count?.employes || 0}
                </StatNumber>
                <StatHelpText>Total actif</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={MdBusiness} color="green.500" />
                    <Text>Utilisateurs</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="green.600">
                  {entreprise._count?.utilisateurs || 0}
                </StatNumber>
                <StatHelpText>Total actif</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={MdTrendingUp} color="purple.500" />
                    <Text>Cycles de Paie</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="purple.600">
                  {entreprise._count?.cyclesPaie || 0}
                </StatNumber>
                <StatHelpText>Total</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card>
            <CardBody>
              <Stat>
                <StatLabel>
                  <HStack>
                    <Icon as={MdAttachMoney} color="orange.500" />
                    <Text>Bulletins</Text>
                  </HStack>
                </StatLabel>
                <StatNumber color="orange.600">
                  {entreprise._count?.bulletinsPaie || 0}
                </StatNumber>
                <StatHelpText>Total</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Alert pour expliquer la vue */}
        <Alert status="info">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold">Vue Super Administrateur</Text>
            <Text>
              Vous visualisez le dashboard de cette entreprise comme si vous étiez son administrateur. 
              Toutes les données affichées ci-dessous sont spécifiques à cette entreprise.
            </Text>
          </Box>
        </Alert>

        {/* Dashboard de l'entreprise */}
        <Box>
          <PayrollDashboard overrideEnterpriseId={entrepriseId} showEnterpriseHeader={false} />
        </Box>
      </VStack>
    </Container>
  );
};

export default EnterpriseDashboard;
