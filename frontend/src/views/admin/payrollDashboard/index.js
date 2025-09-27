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
} from '@chakra-ui/react';
import { MdPerson, MdWork, MdAttachMoney, MdTrendingUp, MdDownload, MdAssessment } from 'react-icons/md';
import MiniStatistics from 'components/card/MiniStatistics';
import PaymentModeChart from 'components/charts/PaymentModeChart';
import EmployeeStatsChart from 'components/charts/EmployeeStatsChart';
import { dashboardService } from 'services/api';
import { exportToCSV, formatEmployeeForExport, formatCurrency } from 'utils/export';
import { useNavigate } from 'react-router-dom';

export default function PayrollDashboard() {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();
  
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const cardShadow = useColorModeValue('0px 18px 40px rgba(112, 144, 176, 0.12)', 'unset');

  const loadStatistics = useCallback(async () => {
    try {
      setLoading(true);
      const response = await dashboardService.getStatistics();
      if (response.succes) {
        setStatistics(response.donnees);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les statistiques',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleExportEmployees = useCallback(async () => {
    try {
      setExportLoading(true);
      const response = await dashboardService.exportEmployees();
      
      if (response.succes && response.donnees) {
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
  }, [toast]);

  const handleGenerateReport = useCallback(async () => {
    try {
      const now = new Date();
      const response = await dashboardService.getMonthlyReport(now.getFullYear(), now.getMonth() + 1);
      
      if (response.succes && response.donnees) {
        // Ici on pourrait ouvrir une modal avec le rapport ou télécharger un PDF
        console.log('Rapport:', response.donnees);
        toast({
          title: 'Rapport généré',
          description: 'Rapport mensuel généré avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur de rapport',
        description: 'Impossible de générer le rapport',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  useEffect(() => {
    loadStatistics();
  }, [loadStatistics]);

  if (loading || !statistics) {
    return (
      <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
        <Text textAlign="center">Chargement des statistiques...</Text>
      </Box>
    );
  }

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      {/* Header */}
      <Box mb="20px">
        <Text fontSize="2xl" fontWeight="700" color={textColor} mb={2}>
          Tableau de Bord - Gestion des Salariés
        </Text>
        <Text color="gray.500">
          Vue d'ensemble de votre entreprise - {statistics.entreprise?.nom}
        </Text>
      </Box>

      {/* Statistiques principales */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="20px" mb="20px">
        <MiniStatistics
          startContent={
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
          }
          name="Employés Actifs"
          value={statistics.employes?.actifs || 0}
          growth={`+${statistics.employes?.nouveauxCeMois || 0} ce mois`}
        />
        
        <MiniStatistics
          startContent={
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
          }
          name="Cycles en Cours"
          value={statistics.cycles?.enCours || 0}
          growth={`${statistics.cycles?.total || 0} au total`}
        />

        <MiniStatistics
          startContent={
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
          }
          name="Masse Salariale"
          value={`${(statistics.paiements?.masseSalarialeTotal || 0).toLocaleString()} FCFA`}
          growth={`${statistics.paiements?.variationMois || 0}% vs mois dernier`}
        />

        <MiniStatistics
          startContent={
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
          }
          name="Bulletins Générés"
          value={statistics.bulletins?.total || 0}
          growth={`${statistics.bulletins?.cesMois || 0} ce mois`}
        />
      </SimpleGrid>

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
            <PaymentModeChart data={statistics.paiements?.parMode} />
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
                onClick={handleGenerateReport}
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
              {statistics.paiements?.derniersPaiements?.map((paiement, index) => (
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
              ))}
              {(!statistics.paiements?.derniersPaiements || statistics.paiements.derniersPaiements.length === 0) && (
                <Text color="gray.500" textAlign="center" py={4}>
                  Aucun paiement récent
                </Text>
              )}
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
              onClick={() => navigate('/admin/employees')}
              leftIcon={<MdPerson />}
            >
              Gérer les Employés
            </Button>
            <Button
              colorScheme="orange"
              onClick={() => navigate('/admin/payroll-cycles')}
              leftIcon={<MdWork />}
            >
              Cycles de Paie
            </Button>
            <Button
              colorScheme="green"
              onClick={() => navigate('/admin/payslips')}
              leftIcon={<MdAttachMoney />}
            >
              Bulletins de Paie
            </Button>
          </SimpleGrid>
        </CardBody>
      </Card>
    </Box>
  );
}
