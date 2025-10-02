import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  SimpleGrid,
  VStack,
  HStack,
  Button,
  Text,
  Card,
  CardBody,
  CardHeader,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Select,
  Input,
  useToast,
  Heading,
  Spinner,
  Progress,
  Avatar,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Flex,
  useColorModeValue
} from '@chakra-ui/react';
import { 
  MdPeople, 
  MdAccessTime, 
  MdTrendingUp, 
  MdDownload, 
  MdRefresh,
  MdFilterList,
  MdDateRange
} from 'react-icons/md';
import { pointageService } from 'services/pointageService';
import MiniStatistics from 'components/card/MiniStatistics';
import IconBox from 'components/icons/IconBox';

export default function PointageReports() {
  const [pointages, setPointages] = useState([]);
  const [statistiques, setStatistiques] = useState({});
  const [rapportEmployes, setRapportEmployes] = useState([]);
  const [presentsTempsReel, setPresentsTempsReel] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingExport, setLoadingExport] = useState(false);
  const [filtres, setFiltres] = useState({
    dateDebut: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    dateFin: new Date(),
    employeId: '',
    statutPresence: '',
    page: 1,
    limite: 50
  });

  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const textColor = useColorModeValue('gray.700', 'white');

  // Charger toutes les données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      const periode = {
        dateDebut: filtres.dateDebut,
        dateFin: filtres.dateFin
      };

      const [
        pointagesResult,
        statistiquesResult,
        rapportResult,
        presentsResult
      ] = await Promise.all([
        pointageService.obtenirPointages(filtres),
        pointageService.obtenirStatistiques(periode),
        pointageService.obtenirRapportEmployes(periode),
        pointageService.obtenirPresentsEnTempsReel()
      ]);

      if (pointagesResult.succes) setPointages(pointagesResult.donnees);
      if (statistiquesResult.succes) setStatistiques(statistiquesResult.donnees);
      if (rapportResult.succes) setRapportEmployes(rapportResult.donnees);
      if (presentsResult.succes) setPresentsTempsReel(presentsResult.donnees);

    } catch (error) {
      console.error('Erreur chargement:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors du chargement des données',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [filtres, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Gérer les changements de filtre
  const handleFilterChange = (field, value) => {
    setFiltres(prev => ({
      ...prev,
      [field]: value,
      page: 1 // Reset à la première page
    }));
  };

  // Appliquer un filtre de période prédéfini
  const appliquerFiltrePeriode = (type) => {
    const filtresPeriode = pointageService.creerFiltresPeriode(type);
    setFiltres(prev => ({
      ...prev,
      ...filtresPeriode,
      page: 1
    }));
  };

  // Exporter en CSV
  const handleExportCSV = async () => {
    try {
      setLoadingExport(true);
      await pointageService.exporterCSV({
        dateDebut: filtres.dateDebut,
        dateFin: filtres.dateFin
      });
      
      toast({
        title: 'Export réussi',
        description: 'Les données ont été exportées en CSV',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erreur d\'export',
        description: 'Impossible d\'exporter les données',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingExport(false);
    }
  };

  // Formater les statistiques pour affichage
  const formatStatistique = pointageService.formatStatutPresence;
  const formatType = pointageService.formatTypePointage;

  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <VStack>
          <Spinner size="xl" />
          <Text>Chargement des rapports...</Text>
        </VStack>
      </Flex>
    );
  }

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }} px="20px">
      <VStack spacing="20px">
        
        {/* En-tête avec titre et actions */}
        <Flex justify="space-between" align="center" w="100%">
          <Heading size="lg">Rapports de Pointage</Heading>
          <HStack>
            <Button
              leftIcon={<MdRefresh />}
              onClick={loadData}
              variant="outline"
              size="sm"
            >
              Actualiser
            </Button>
            <Button
              leftIcon={<MdDownload />}
              onClick={handleExportCSV}
              colorScheme="blue"
              size="sm"
              isLoading={loadingExport}
              loadingText="Export..."
            >
              Exporter CSV
            </Button>
          </HStack>
        </Flex>

        {/* Filtres rapides */}
        <Card w="100%" bg={bgColor} borderColor={borderColor}>
          <CardHeader>
            <HStack>
              <MdFilterList />
              <Text fontWeight="bold">Filtres</Text>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4} mb={4}>
              <Button
                size="sm"
                variant="outline"
                onClick={() => appliquerFiltrePeriode('jour')}
              >
                Aujourd'hui
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => appliquerFiltrePeriode('semaine')}
              >
                Cette semaine
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => appliquerFiltrePeriode('mois')}
              >
                Ce mois
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => appliquerFiltrePeriode('trimestre')}
              >
                Ce trimestre
              </Button>
            </SimpleGrid>
            
            <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
              <VStack align="start">
                <Text fontSize="sm" fontWeight="bold">Date début</Text>
                <Input
                  type="date"
                  size="sm"
                  value={filtres.dateDebut?.toISOString().split('T')[0]}
                  onChange={(e) => handleFilterChange('dateDebut', new Date(e.target.value))}
                />
              </VStack>
              
              <VStack align="start">
                <Text fontSize="sm" fontWeight="bold">Date fin</Text>
                <Input
                  type="date"
                  size="sm"
                  value={filtres.dateFin?.toISOString().split('T')[0]}
                  onChange={(e) => handleFilterChange('dateFin', new Date(e.target.value))}
                />
              </VStack>
              
              <VStack align="start">
                <Text fontSize="sm" fontWeight="bold">Statut</Text>
                <Select
                  size="sm"
                  value={filtres.statutPresence}
                  onChange={(e) => handleFilterChange('statutPresence', e.target.value)}
                >
                  <option value="">Tous</option>
                  <option value="PRESENT">Présent</option>
                  <option value="RETARD">En retard</option>
                  <option value="ABSENT">Absent</option>
                  <option value="CONGE">Congé</option>
                  <option value="MALADIE">Maladie</option>
                </Select>
              </VStack>
              
              <VStack align="start">
                <Text fontSize="sm" fontWeight="bold">Par page</Text>
                <Select
                  size="sm"
                  value={filtres.limite}
                  onChange={(e) => handleFilterChange('limite', parseInt(e.target.value))}
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </Select>
              </VStack>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Statistiques générales */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} gap="20px" w="100%">
          <MiniStatistics
            startContent={
              <IconBox
                w="56px"
                h="56px"
                bg="linear-gradient(90deg, #4481EB 0%, #04BEFE 100%)"
                icon={<MdPeople color="white" size="28px" />}
              />
            }
            name="Employés Actifs"
            value={statistiques.employesActifs?.toString() || '0'}
          />
          
          <MiniStatistics
            startContent={
              <IconBox
                w="56px"
                h="56px"
                bg="linear-gradient(90deg, #10B981 0%, #34D399 100%)"
                icon={<MdAccessTime color="white" size="28px" />}
              />
            }
            name="Présents Aujourd'hui"
            value={statistiques.presentsAujourdhui?.toString() || '0'}
          />
          
          <Stat bg={bgColor} p={4} borderRadius="lg" border="1px solid" borderColor={borderColor}>
            <StatLabel>Taux de Présence</StatLabel>
            <StatNumber>{Math.round(statistiques.tauxPresence || 0)}%</StatNumber>
            <StatHelpText>
              <StatArrow type={statistiques.tauxPresence > 80 ? 'increase' : 'decrease'} />
              Période sélectionnée
            </StatHelpText>
          </Stat>
          
          <Stat bg={bgColor} p={4} borderRadius="lg" border="1px solid" borderColor={borderColor}>
            <StatLabel>Taux de Retard</StatLabel>
            <StatNumber>{Math.round(statistiques.tauxRetard || 0)}%</StatNumber>
            <StatHelpText>
              <StatArrow type={statistiques.tauxRetard < 10 ? 'decrease' : 'increase'} />
              Période sélectionnée
            </StatHelpText>
          </Stat>
        </SimpleGrid>

        {/* Présents en temps réel */}
        <Card w="100%" bg={bgColor} borderColor={borderColor}>
          <CardHeader>
            <HStack justify="space-between">
              <Text fontWeight="bold">Employés présents actuellement</Text>
              <Badge colorScheme="green" px={2} py={1}>
                {presentsTempsReel.length} présents
              </Badge>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            {presentsTempsReel.length > 0 ? (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={3}>
                {presentsTempsReel.map((present) => (
                  <HStack key={present.id} p={3} bg="green.50" borderRadius="md">
                    <Avatar
                      size="sm"
                      name={present.employe?.nomComplet}
                      bg="green.500"
                    />
                    <VStack align="start" spacing={0} flex={1}>
                      <Text fontSize="sm" fontWeight="bold">
                        {present.employe?.nomComplet}
                      </Text>
                      <Text fontSize="xs" color="gray.600">
                        Arrivé à {new Date(present.heureArrivee).toLocaleTimeString('fr-FR')}
                      </Text>
                    </VStack>
                    <Badge 
                      size="sm" 
                      colorScheme={formatStatistique(present.statutPresence).color}
                    >
                      {formatStatistique(present.statutPresence).label}
                    </Badge>
                  </HStack>
                ))}
              </SimpleGrid>
            ) : (
              <Text color="gray.500" textAlign="center" py={4}>
                Aucun employé présent actuellement
              </Text>
            )}
          </CardBody>
        </Card>

        {/* Tableau des pointages récents */}
        <Card w="100%" bg={bgColor} borderColor={borderColor}>
          <CardHeader>
            <HStack justify="space-between">
              <Text fontWeight="bold">Historique des pointages</Text>
              <Text fontSize="sm" color="gray.500">
                {pointages.total || 0} entrées
              </Text>
            </HStack>
          </CardHeader>
          <CardBody pt={0}>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Employé</Th>
                    <Th>Date</Th>
                    <Th>Arrivée</Th>
                    <Th>Sortie</Th>
                    <Th>Statut</Th>
                    <Th>Heures</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {pointages.pointages?.map((pointage) => (
                    <Tr key={pointage.id}>
                      <Td>
                        <HStack>
                          <Avatar
                            size="xs"
                            name={pointage.employe?.nomComplet}
                          />
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="bold">
                              {pointage.employe?.nomComplet}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {pointage.employe?.poste}
                            </Text>
                          </VStack>
                        </HStack>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {new Date(pointage.date).toLocaleDateString('fr-FR')}
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {pointage.heureArrivee 
                            ? new Date(pointage.heureArrivee).toLocaleTimeString('fr-FR')
                            : '-'
                          }
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {pointage.heureSortie 
                            ? new Date(pointage.heureSortie).toLocaleTimeString('fr-FR')
                            : '-'
                          }
                        </Text>
                      </Td>
                      <Td>
                        <Badge 
                          colorScheme={formatStatistique(pointage.statutPresence).color}
                          size="sm"
                        >
                          {formatStatistique(pointage.statutPresence).label}
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {pointage.heureArrivee && pointage.heureSortie
                            ? `${pointageService.calculerTempsTravaile(
                                pointage.heureArrivee, 
                                pointage.heureSortie
                              )}h`
                            : '-'
                          }
                        </Text>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
            
            {pointages.pointages?.length === 0 && (
              <Text textAlign="center" color="gray.500" py={8}>
                Aucun pointage trouvé pour cette période
              </Text>
            )}

            {/* Pagination */}
            {pointages.totalPages > 1 && (
              <HStack justify="center" mt={4}>
                <Button
                  size="sm"
                  onClick={() => handleFilterChange('page', Math.max(1, filtres.page - 1))}
                  isDisabled={filtres.page <= 1}
                >
                  Précédent
                </Button>
                <Text fontSize="sm">
                  Page {filtres.page} sur {pointages.totalPages}
                </Text>
                <Button
                  size="sm"
                  onClick={() => handleFilterChange('page', Math.min(pointages.totalPages, filtres.page + 1))}
                  isDisabled={filtres.page >= pointages.totalPages}
                >
                  Suivant
                </Button>
              </HStack>
            )}
          </CardBody>
        </Card>

        {/* Rapport par employé */}
        <Card w="100%" bg={bgColor} borderColor={borderColor}>
          <CardHeader>
            <Text fontWeight="bold">Rapport par employé (Période sélectionnée)</Text>
          </CardHeader>
          <CardBody pt={0}>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Employé</Th>
                    <Th>Jours présents</Th>
                    <Th>Jours retard</Th>
                    <Th>Jours absents</Th>
                    <Th>Heures totales</Th>
                    <Th>Taux présence</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {rapportEmployes.map((employe) => (
                    <Tr key={employe.id}>
                      <Td>
                        <HStack>
                          <Avatar
                            size="xs"
                            name={employe.nomComplet}
                          />
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="bold">
                              {employe.nomComplet}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {employe.poste}
                            </Text>
                          </VStack>
                        </HStack>
                      </Td>
                      <Td>
                        <Badge colorScheme="green">
                          {employe.statistiques?.joursPresents || 0}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme="orange">
                          {employe.statistiques?.joursRetard || 0}
                        </Badge>
                      </Td>
                      <Td>
                        <Badge colorScheme="red">
                          {employe.statistiques?.joursAbsents || 0}
                        </Badge>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {employe.statistiques?.totalHeures || 0}h
                        </Text>
                      </Td>
                      <Td>
                        <VStack align="start" spacing={1}>
                          <Progress 
                            value={employe.statistiques?.tauxPresence || 0} 
                            size="sm" 
                            colorScheme="green"
                            w="60px"
                          />
                          <Text fontSize="xs">
                            {Math.round(employe.statistiques?.tauxPresence || 0)}%
                          </Text>
                        </VStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>

      </VStack>
    </Box>
  );
}