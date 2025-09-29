import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Select,
  Text,
  VStack,
  HStack,
  Badge,
  useToast,
  FormControl,
  FormLabel,
  Flex,
  Icon,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Heading,
  Button,
  useColorModeValue
} from '@chakra-ui/react';
import { MdBusiness, MdPeople, MdAttachMoney, MdTrendingUp } from 'react-icons/md';
import { dashboardService } from '../../services/api';

const EnterpriseSelector = ({ onEnterpriseChange }) => {
  const [entreprises, setEntreprises] = useState([]);
  const [selectedEntreprise, setSelectedEntreprise] = useState('');
  const [enterpriseStats, setEnterpriseStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const loadEntreprises = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/entreprises', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      
      if (data.succes) {
        setEntreprises(data.donnees.filter(e => e.actif));
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les entreprises',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  const loadEnterpriseStats = useCallback(async (entrepriseId) => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/entreprises/${entrepriseId}/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      
      if (data.succes) {
        setEnterpriseStats(data.donnees);
        
        // Utiliser le service dashboard existant pour les stats détaillées
        try {
          const dashStats = await dashboardService.getStatistics();
          setEnterpriseStats(prev => ({
            ...prev,
            ...dashStats
          }));
        } catch (err) {
          console.log('Stats dashboard non disponibles:', err);
        }
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les statistiques de l\'entreprise',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadEntreprises();
  }, [loadEntreprises]);

  const handleEnterpriseChange = (entrepriseId) => {
    setSelectedEntreprise(entrepriseId);
    if (entrepriseId) {
      loadEnterpriseStats(entrepriseId);
      onEnterpriseChange && onEnterpriseChange(entrepriseId);
    } else {
      setEnterpriseStats(null);
      onEnterpriseChange && onEnterpriseChange(null);
    }
  };

  const selectedEntrepriseData = entreprises.find(e => e.id === selectedEntreprise);

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Sélecteur d'entreprise */}
        <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Flex justify="space-between" align="center">
                <Box>
                  <Heading size="md" mb={2}>Analyse par Entreprise</Heading>
                  <Text color="gray.500" fontSize="sm">
                    Sélectionnez une entreprise pour voir ses statistiques détaillées
                  </Text>
                </Box>
                <Icon as={MdBusiness} w={8} h={8} color="blue.500" />
              </Flex>

              <FormControl>
                <FormLabel>Entreprise</FormLabel>
                <Select
                  placeholder="Sélectionner une entreprise..."
                  value={selectedEntreprise}
                  onChange={(e) => handleEnterpriseChange(e.target.value)}
                  size="lg"
                >
                  {entreprises.map((entreprise) => (
                    <option key={entreprise.id} value={entreprise.id}>
                      {entreprise.nom} ({entreprise._count?.employes || 0} employés)
                    </option>
                  ))}
                </Select>
              </FormControl>

              {selectedEntrepriseData && (
                <Box p={4} bg="blue.50" borderRadius="md" borderColor="blue.200" borderWidth="1px">
                  <HStack justify="space-between">
                    <VStack align="start" spacing={1}>
                      <Text fontWeight="bold" color="blue.800">
                        {selectedEntrepriseData.nom}
                      </Text>
                      <Text fontSize="sm" color="blue.600">
                        {selectedEntrepriseData.email || 'Email non renseigné'}
                      </Text>
                      <Text fontSize="sm" color="blue.600">
                        {selectedEntrepriseData.telephone || 'Téléphone non renseigné'}
                      </Text>
                    </VStack>
                    <Badge colorScheme="blue" size="lg">
                      {selectedEntrepriseData._count?.employes || 0} employés
                    </Badge>
                  </HStack>
                </Box>
              )}
            </VStack>
          </CardBody>
        </Card>

        {/* Statistiques de l'entreprise sélectionnée */}
        {selectedEntreprise && enterpriseStats && (
          <Card bg={bgColor} borderColor={borderColor} borderWidth="1px">
            <CardBody>
              <VStack spacing={6} align="stretch">
                <Flex justify="space-between" align="center">
                  <Heading size="md">Statistiques - {selectedEntrepriseData?.nom}</Heading>
                  <Button 
                    size="sm" 
                    colorScheme="blue" 
                    variant="outline"
                    onClick={() => loadEnterpriseStats(selectedEntreprise)}
                    isLoading={loading}
                  >
                    Actualiser
                  </Button>
                </Flex>

                <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
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
                          {enterpriseStats.totalEmployes || selectedEntrepriseData?._count?.employes || 0}
                        </StatNumber>
                        <StatHelpText>
                          <StatArrow type="increase" />
                          Total actif
                        </StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>
                          <HStack>
                            <Icon as={MdAttachMoney} color="green.500" />
                            <Text>Masse Salariale</Text>
                          </HStack>
                        </StatLabel>
                        <StatNumber color="green.600">
                          {enterpriseStats.masseSalariale ? 
                            `${enterpriseStats.masseSalariale.toLocaleString()} ${selectedEntrepriseData?.devise || 'FCFA'}` : 
                            'N/A'
                          }
                        </StatNumber>
                        <StatHelpText>
                          <StatArrow type="increase" />
                          Ce mois
                        </StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>
                          <HStack>
                            <Icon as={MdTrendingUp} color="purple.500" />
                            <Text>Bulletins</Text>
                          </HStack>
                        </StatLabel>
                        <StatNumber color="purple.600">
                          {enterpriseStats.totalBulletins || 0}
                        </StatNumber>
                        <StatHelpText>
                          <StatArrow type="increase" />
                          Ce mois
                        </StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>

                  <Card>
                    <CardBody>
                      <Stat>
                        <StatLabel>
                          <HStack>
                            <Icon as={MdBusiness} color="orange.500" />
                            <Text>Cycles Paie</Text>
                          </HStack>
                        </StatLabel>
                        <StatNumber color="orange.600">
                          {enterpriseStats.totalCycles || 0}
                        </StatNumber>
                        <StatHelpText>
                          <StatArrow type="increase" />
                          Total
                        </StatHelpText>
                      </Stat>
                    </CardBody>
                  </Card>
                </SimpleGrid>

                {/* Informations détaillées */}
                {enterpriseStats.recentEmployees && enterpriseStats.recentEmployees.length > 0 && (
                  <Box>
                    <Heading size="sm" mb={3}>Employés Récents</Heading>
                    <VStack spacing={2} align="stretch">
                      {enterpriseStats.recentEmployees.slice(0, 5).map((employee, index) => (
                        <Flex key={index} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                          <Text fontWeight="medium">{employee.nom} {employee.prenom}</Text>
                          <Badge colorScheme="green" variant="subtle">{employee.poste || 'N/A'}</Badge>
                        </Flex>
                      ))}
                    </VStack>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Message si aucune entreprise sélectionnée */}
        {!selectedEntreprise && (
          <Card bg="gray.50" borderColor="gray.200" borderWidth="1px">
            <CardBody textAlign="center" py={8}>
              <Icon as={MdBusiness} w={12} h={12} color="gray.400" mb={4} />
              <Text color="gray.500" fontSize="lg" mb={2}>
                Aucune entreprise sélectionnée
              </Text>
              <Text color="gray.400" fontSize="sm">
                Sélectionnez une entreprise ci-dessus pour voir ses statistiques détaillées
              </Text>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Box>
  );
};

export default EnterpriseSelector;
