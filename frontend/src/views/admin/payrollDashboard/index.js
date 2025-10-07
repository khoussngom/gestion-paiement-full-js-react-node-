import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  SimpleGrid,
  useColorModeValue,
  Text,
  Card,
  CardBody,
  VStack,
  HStack,
  Button,
  useToast,
  Alert,
  AlertIcon,
  Badge,
  Divider,
  Icon
} from '@chakra-ui/react';
import { MdPerson, MdWork, MdAttachMoney, MdTrendingUp, MdDownload, MdAssessment, MdArrowBack, MdBusiness, MdAccessTime } from 'react-icons/md';
import PaymentModeChart from 'components/charts/PaymentModeChart';
import EmployeeStatsChart from 'components/charts/EmployeeStatsChart';
import dashboardService from 'services/dashboardService';
import { exportToCSV, formatEmployeeForExport, formatCurrency } from 'utils/export';
import { useNavigate, useParams } from 'react-router-dom';
import { useEnterprise } from 'contexts/EnterpriseContext';

export default function PayrollDashboard() {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  const { entrepriseId } = useParams();
  const { currentEntreprise, isEnterpriseMode, exitEnterpriseMode } = useEnterprise();
  
  const cardShadow = useColorModeValue('0px 18px 40px rgba(112, 144, 176, 0.12)', 'unset');

  // Déterminer si on est en mode accès entreprise
  const isEnterpriseContext = entrepriseId || isEnterpriseMode;
  const targetEnterpriseId = entrepriseId || currentEntreprise?.id;

  console.log('🔍 [DASHBOARD DEBUG] Contexte:', {
    entrepriseId,
    isEnterpriseMode,
    currentEntreprise: currentEntreprise?.id,
    isEnterpriseContext,
    targetEnterpriseId
  });

  const loadStatistics = useCallback(async () => {
    try {
      setLoading(true);
      let response;
      
      console.log('🔍 [LOAD STATS] Conditions:', {
        isEnterpriseContext,
        targetEnterpriseId,
        willUseEnterpriseRoute: isEnterpriseContext && targetEnterpriseId
      });
      
      if (isEnterpriseContext && targetEnterpriseId) {
        console.log('🏢 Chargement stats pour entreprise:', targetEnterpriseId);
        response = await dashboardService.getStatisticsForEnterprise(targetEnterpriseId);
      } else {
        console.log('👤 Chargement stats utilisateur standard');
        response = await dashboardService.getStatistics();
      }
      
      if (response && response.succes) {
        setStatistics(response.donnees);
        console.log('📊 Statistiques chargées:', response.donnees);
      } else {
        throw new Error((response && response.message) || 'Erreur lors du chargement');
      }
    } catch (error) {
      console.error('❌ Erreur chargement stats:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de charger les statistiques',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [isEnterpriseContext, targetEnterpriseId, toast]);

  const handleExportEmployees = useCallback(async () => {
    try {
      setExportLoading(true);
      let response;
      
      if (isEnterpriseContext && targetEnterpriseId) {
        response = await dashboardService.exportEmployeesForEnterprise(targetEnterpriseId);
      } else {
        response = await dashboardService.exportEmployees();
      }
      
      if (response && response.succes && response.donnees) {
        const formattedData = response.donnees.map(formatEmployeeForExport);
        exportToCSV(formattedData, `employes-${new Date().toISOString().slice(0, 10)}.csv`);
        
        toast({
          title: 'Export réussi',
          description: `${response.donnees.length} employés exportés avec succès`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur d\'export',
        description: 'Impossible d\'exporter les employés',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setExportLoading(false);
    }
  }, [isEnterpriseContext, targetEnterpriseId, toast]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  if (loading) {
    return (
      <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
        <Text textAlign="center">
          {isEnterpriseContext ? 
            'Chargement des données de l\'entreprise...' : 
            'Chargement des statistiques...'
          }
        </Text>
      </Box>
    );
  }

  if (!statistics) {
    return (
      <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
        <Alert status="warning">
          <AlertIcon />
          Aucune donnée disponible pour cette entreprise
        </Alert>
      </Box>
    );
  }

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      {/* Header avec contexte entreprise */}
      {isEnterpriseContext && (
        <Box mb="20px">
          <Card bg="blue.50" borderLeft="4px solid" borderLeftColor="blue.500">
            <CardBody>
              <HStack justify="space-between" align="center">
                <VStack align="start" spacing={1}>
                  <HStack>
                    <Icon as={MdBusiness} color="blue.500" />
                    <Text fontSize="2xl" fontWeight="700" color="blue.700">
                      {statistics.entreprise?.nom || 'Entreprise'}
                    </Text>
                  </HStack>
                  <Text fontSize="sm" color="blue.600">
                    🏢 Accès entreprise accordé - Interface SuperAdmin
                  </Text>
                </VStack>
                
                <Button
                  leftIcon={<MdArrowBack />}
                  onClick={() => {
                    if (exitEnterpriseMode) {
                      exitEnterpriseMode();
                    }
                    navigate('/admin/super-admin');
                  }}
                  variant="outline"
                  colorScheme="blue"
                >
                  Retour SuperAdmin
                </Button>
              </HStack>

              <Divider my={3} />

              <HStack spacing={4} wrap="wrap">
                <HStack>
                  <Icon as={MdAccessTime} color="orange.500" />
                  <Text fontSize="sm">
                    <strong>Accès temporaire SuperAdmin</strong>
                  </Text>
                </HStack>
                
                <Badge colorScheme="blue" variant="subtle">
                  Contexte d'entreprise actif
                </Badge>
              </HStack>
            </CardBody>
          </Card>
        </Box>
      )}

      {/* Statistiques principales */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="20px" mb="20px">
        {/* Employés Actifs */}
        <Card
          p={5}
          borderRadius="xl"
          boxShadow="md"
          _hover={{ boxShadow: "xl", transform: "translateY(-4px)", transition: "0.2s" }}
        >
          <HStack spacing={4} align="center">
            <Box
              w="56px"
              h="56px"
              bg="linear-gradient(90deg, #4481EB 0%, #04BEFE 100%)"
              borderRadius="12px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <MdPerson color="white" size="24px" />
            </Box>
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" color="gray.500">
                Employés Actifs
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                {(statistics.employes && statistics.employes.actifs) || statistics.totalEmployes || 0}
              </Text>
              <Text fontSize="xs" color="green.500">
                +{(statistics.employes && statistics.employes.nouveauxCeMois) || 0} ce mois
              </Text>
            </VStack>
          </HStack>
        </Card>

        {/* Cycles en cours */}
        <Card
          p={5}
          borderRadius="xl"
          boxShadow="md"
          _hover={{ boxShadow: "xl", transform: "translateY(-4px)", transition: "0.2s" }}
        >
          <HStack spacing={4} align="center">
            <Box
              w="56px"
              h="56px"
              bg="linear-gradient(90deg, #FFB547 0%, #FFB547 100%)"
              borderRadius="12px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <MdWork color="white" size="24px" />
            </Box>
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" color="gray.500">
                Cycles en Cours
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                {(statistics.cycles && statistics.cycles.enCours) || 0}
              </Text>
              <Text fontSize="xs" color="gray.600">
                {(statistics.cycles && statistics.cycles.total) || 0} au total
              </Text>
            </VStack>
          </HStack>
        </Card>

        {/* Masse salariale */}
        <Card
          p={5}
          borderRadius="xl"
          boxShadow="md"
          _hover={{ boxShadow: "xl", transform: "translateY(-4px)", transition: "0.2s" }}
        >
          <HStack spacing={4} align="center">
            <Box
              w="56px"
              h="56px"
              bg="linear-gradient(90deg, #01B574 0%, #28C76F 100%)"
              borderRadius="12px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <MdAttachMoney color="white" size="24px" />
            </Box>
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" color="gray.500">
                Masse Salariale
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="green.500">
                {((statistics.paiements && statistics.paiements.masseSalarialeTotal) || statistics.montantTotalPaie || 0).toLocaleString()} FCFA
              </Text>
              <Text fontSize="xs" color="green.500">
                {((statistics.paiements && statistics.paiements.variationMois) || 0)}% vs mois dernier
              </Text>
            </VStack>
          </HStack>
        </Card>

        {/* Paiements */}
        <Card
          p={5}
          borderRadius="xl"
          boxShadow="md"
          _hover={{ boxShadow: "xl", transform: "translateY(-4px)", transition: "0.2s" }}
        >
          <HStack spacing={4} align="center">
            <Box
              w="56px"
              h="56px"
              bg="linear-gradient(90deg, #A855F7 0%, #C084FC 100%)"
              borderRadius="12px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <MdTrendingUp color="white" size="24px" />
            </Box>
            <VStack align="start" spacing={1}>
              <Text fontSize="sm" color="gray.500">
                Paiements
              </Text>
              <Text fontSize="2xl" fontWeight="bold" color="purple.500">
                {statistics.totalPaiements || 0}
              </Text>
              <Text fontSize="xs" color="gray.600">
                Total effectués
              </Text>
            </VStack>
          </HStack>
        </Card>
      </SimpleGrid>

      {/* Graphiques */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="20px" mb="20px">
        {/* Statistiques des employés */}
        <Card boxShadow={cardShadow}>
          <CardBody>
            <EmployeeStatsChart data={statistics.employes} />
          </CardBody>
        </Card>

        {/* Répartition des paiements par mode */}
        <Card boxShadow={cardShadow}>
          <CardBody>
            <PaymentModeChart data={statistics.paiements && statistics.paiements.parMode} />
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Section Export et Rapports */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap="20px" mb="20px">
        {/* Actions d'export */}
        <Card boxShadow={cardShadow}>
          <CardBody>
            <Text fontSize="lg" fontWeight="600" mb={4}>
              Export et Rapports
            </Text>
            <VStack spacing={3} align="stretch">
              <Button
                leftIcon={<MdDownload />}
                onClick={handleExportEmployees}
                isLoading={exportLoading}
                loadingText="Export en cours..."
                colorScheme="blue"
                variant="outline"
                size="sm"
              >
                Exporter les employés (CSV)
              </Button>
              <Button
                leftIcon={<MdAssessment />}
                colorScheme="purple"
                variant="outline"
                size="sm"
              >
                Générer rapport mensuel
              </Button>
            </VStack>
          </CardBody>
        </Card>

        {/* Derniers paiements */}
        <Card boxShadow={cardShadow}>
          <CardBody>
            <Text fontSize="lg" fontWeight="600" mb={4}>
              Derniers Paiements
            </Text>
            <VStack spacing={3} align="stretch">
              {(statistics.paiements && statistics.paiements.derniersPaiements && statistics.paiements.derniersPaiements.length > 0) ? 
                statistics.paiements.derniersPaiements.map((paiement, index) => (
                  <HStack key={index} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="600" fontSize="sm">{paiement.employe}</Text>
                      <Text fontSize="xs" color="gray.500">
                        {new Date(paiement.date).toLocaleDateString()} - {paiement.modePaiement}
                      </Text>
                    </VStack>
                    <Text fontWeight="600" color="green.500">
                      {formatCurrency(paiement.montant)}
                    </Text>
                  </HStack>
                )) : (
                  <Text color="gray.500" textAlign="center" py={4}>
                    Aucun paiement récent
                  </Text>
                )
              }
            </VStack>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Actions rapides */}
      <Card boxShadow={cardShadow} mt="20px">
        <CardBody>
          <Text fontSize="lg" fontWeight="600" mb={4}>
            Actions Rapides
          </Text>
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
            <Button
              colorScheme="brand"
              onClick={() => navigate(isEnterpriseContext ? 
                `/admin/entreprise/${targetEnterpriseId}/employees` : 
                '/admin/employees'
              )}
              leftIcon={<MdPerson />}
            >
              Gérer les Employés
            </Button>
            <Button
              colorScheme="orange"
              onClick={() => navigate(isEnterpriseContext ? 
                `/admin/entreprise/${targetEnterpriseId}/payroll-cycles` : 
                '/admin/payroll-cycles'
              )}
              leftIcon={<MdWork />}
            >
              Cycles de Paie
            </Button>
            <Button
              colorScheme="green"
              onClick={() => navigate(isEnterpriseContext ? 
                `/admin/entreprise/${targetEnterpriseId}/payments` : 
                '/admin/payments'
              )}
              leftIcon={<MdAttachMoney />}
            >
              Paiements
            </Button>
          </SimpleGrid>
        </CardBody>
      </Card>
    </Box>
  );
}
