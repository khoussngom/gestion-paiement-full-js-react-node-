import React, { useEffect, useState } from 'react';
import {
  Box,
  SimpleGrid,
  Alert,
  AlertIcon,
  Text,
  Badge,
  VStack,
  HStack,
  Card,
  CardHeader,
  CardBody,
  Heading,
  Divider,
  Button,
  useColorModeValue,
  Flex,
  Icon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText
} from '@chakra-ui/react';
import { 
  MdPeople, 
  MdAttachMoney, 
  MdTrendingUp, 
  MdArrowBack,
  MdBusiness,
  MdAccessTime,
  MdVerifiedUser
} from 'react-icons/md';
import { useEnterprise } from 'contexts/EnterpriseContext';
import { useNavigate, useParams } from 'react-router-dom';
import employeeService from 'services/employeeService';
import payrollCycleService from 'services/payrollCycleService';

const EnterpriseContextDashboard = () => {
  const { currentEnterprise, isEnterpriseMode, exitEnterpriseMode, getDisplayInfo } = useEnterprise();
  const navigate = useNavigate();
  const { entrepriseId } = useParams();
  
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeCycles: 0,
    totalPayments: 0,
    loading: true
  });

  const bg = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'white');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const displayInfo = getDisplayInfo();

  const hasDataAccess = React.useCallback((dataType) => {
    const role = currentEnterprise?.autorisation?.roleAccorde;
    
    const permissions = {
      'ADMIN': ['employees', 'payroll', 'payments', 'reports'],
      'RH': ['employees', 'payroll'],
      'COMPTABLE': ['payroll', 'payments'],
      'EMPLOYE': []
    };

    return permissions[role]?.includes(dataType) || false;
  }, [currentEnterprise]);

  const loadEnterpriseStats = React.useCallback(async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));

      // Charger les employés (si autorisé)
      let totalEmployees = 0;
      if (hasDataAccess('employees')) {
        try {
          const employeesData = await employeeService.getAllEmployees();
          totalEmployees = employeesData.length;
        } catch (error) {
          console.log('Pas d\'accès aux données employés:', error);
        }
      }

      // Charger les cycles de paie (si autorisé)
      let activeCycles = 0;
      if (hasDataAccess('payroll')) {
        try {
          const cyclesData = await payrollCycleService.getAllCycles();
          activeCycles = cyclesData.filter(cycle => cycle.statut === 'EN_COURS').length;
        } catch (error) {
          console.log('Pas d\'accès aux données de paie:', error);
        }
      }

      setStats({
        totalEmployees,
        activeCycles,
        totalPayments: 0, // À implémenter selon les permissions
        loading: false
      });

    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      setStats(prev => ({ ...prev, loading: false }));
    }
  }, [hasDataAccess]);

  useEffect(() => {
    // Vérifier que l'utilisateur a bien accès à cette entreprise
    if (!isEnterpriseMode || !currentEnterprise || currentEnterprise.id !== parseInt(entrepriseId)) {
      navigate('/admin/super-admin');
      return;
    }

    // Charger les statistiques de l'entreprise
    loadEnterpriseStats();
  }, [isEnterpriseMode, currentEnterprise, entrepriseId, navigate, loadEnterpriseStats]);

  const handleReturnToSuperAdmin = () => {
    exitEnterpriseMode();
    navigate('/admin/super-admin');
  };

  const StatCard = ({ title, value, icon, color, helpText, hasAccess = true }) => (
    <Card bg={bg} borderColor={borderColor} borderWidth="1px">
      <CardBody>
        <Flex justify="space-between" align="center">
          <Box>
            <Stat>
              <StatLabel color={textColor} fontSize="sm">
                {title}
              </StatLabel>
              {hasAccess ? (
                <>
                  <StatNumber color={textColor} fontSize="2xl">
                    {stats.loading ? '...' : value}
                  </StatNumber>
                  {helpText && (
                    <StatHelpText color="gray.500" fontSize="xs">
                      {helpText}
                    </StatHelpText>
                  )}
                </>
              ) : (
                <Text color="gray.400" fontSize="md">
                  Accès restreint
                </Text>
              )}
            </Stat>
          </Box>
          <Icon 
            as={icon} 
            w={8} 
            h={8} 
            color={hasAccess ? color : 'gray.400'} 
          />
        </Flex>
      </CardBody>
    </Card>
  );

  if (!isEnterpriseMode || !currentEnterprise) {
    return (
      <Box p={5}>
        <Alert status="error">
          <AlertIcon />
          Accès à l'entreprise non autorisé ou expiré.
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={5}>
      {/* En-tête avec informations du contexte */}
      <Card mb={5} bg="blue.50" borderLeft="4px solid" borderLeftColor="blue.500">
        <CardBody>
          <VStack align="stretch" spacing={3}>
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <HStack>
                  <Icon as={MdBusiness} color="blue.500" />
                  <Heading size="md" color="blue.700">
                    {displayInfo?.titre}
                  </Heading>
                </HStack>
                <Text fontSize="sm" color="blue.600">
                  {displayInfo?.sousTitre}
                </Text>
              </VStack>
              
              <Button
                leftIcon={<MdArrowBack />}
                colorScheme="blue"
                variant="outline"
                size="sm"
                onClick={handleReturnToSuperAdmin}
              >
                Retour SuperAdmin
              </Button>
            </HStack>

            <Divider />

            <HStack spacing={4} wrap="wrap">
              <HStack>
                <Icon as={MdVerifiedUser} color="green.500" />
                <Text fontSize="sm">
                  <strong>Rôle accordé:</strong> {currentEnterprise.autorisation?.roleAccorde}
                </Text>
              </HStack>
              
              <HStack>
                <Icon as={MdAccessTime} color="orange.500" />
                <Text fontSize="sm">
                  <strong>Expire dans:</strong> {currentEnterprise.autorisation?.tempsRestant}
                </Text>
              </HStack>
              
              <Badge colorScheme="blue" variant="subtle">
                Accès Temporaire SuperAdmin
              </Badge>
            </HStack>
          </VStack>
        </CardBody>
      </Card>

      {/* Statistiques de l'entreprise */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={5} mb={5}>
        <StatCard
          title="Employés"
          value={stats.totalEmployees}
          icon={MdPeople}
          color="blue.500"
          helpText="Employés actifs"
          hasAccess={hasDataAccess('employees')}
        />
        
        <StatCard
          title="Cycles Actifs"
          value={stats.activeCycles}
          icon={MdTrendingUp}
          color="green.500"
          helpText="En cours"
          hasAccess={hasDataAccess('payroll')}
        />
        
        <StatCard
          title="Paiements"
          value={stats.totalPayments}
          icon={MdAttachMoney}
          color="purple.500"
          helpText="Ce mois"
          hasAccess={hasDataAccess('payments')}
        />
        
        <StatCard
          title="Rapports"
          value="Disponibles"
          icon={MdBusiness}
          color="orange.500"
          helpText="Accès selon rôle"
          hasAccess={hasDataAccess('reports')}
        />
      </SimpleGrid>

      {/* Actions disponibles selon les permissions */}
      <Card>
        <CardHeader>
          <Heading size="sm">Actions Disponibles</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
            {hasDataAccess('employees') && (
              <Button
                leftIcon={<MdPeople />}
                colorScheme="blue"
                variant="outline"
                onClick={() => navigate(`/admin/entreprise/${entrepriseId}/employees`)}
              >
                Gérer les Employés
              </Button>
            )}
            
            {hasDataAccess('payroll') && (
              <Button
                leftIcon={<MdTrendingUp />}
                colorScheme="green"
                variant="outline"
                onClick={() => navigate(`/admin/entreprise/${entrepriseId}/payroll-cycles`)}
              >
                Cycles de Paie
              </Button>
            )}
            
            {hasDataAccess('payments') && (
              <Button
                leftIcon={<MdAttachMoney />}
                colorScheme="purple"
                variant="outline"
                onClick={() => navigate(`/admin/entreprise/${entrepriseId}/payments`)}
              >
                Voir Paiements
              </Button>
            )}

            {!hasDataAccess('employees') && !hasDataAccess('payroll') && !hasDataAccess('payments') && (
              <Alert status="info">
                <AlertIcon />
                Aucune action disponible avec les permissions actuelles.
              </Alert>
            )}
          </SimpleGrid>
        </CardBody>
      </Card>
    </Box>
  );
};

export default EnterpriseContextDashboard;