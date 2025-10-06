import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Box,
  Text,
  Badge,
  SimpleGrid,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Avatar,
  Image,
  Card,
  CardBody,
  CardHeader,
  Spinner,
  Alert,
  AlertIcon,
  Progress,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useToast,
  useColorModeValue,
  Icon,
  Flex,
  Grid,
  GridItem,
  Divider,
  Center,
  ScaleFade,
  Tooltip
} from '@chakra-ui/react';
import { 
  MdQrCode, 
  MdRefresh, 
  MdDownload, 
  MdAccessTime, 
  MdCalendarToday,
  MdPerson,
  MdEmail,
  MdPhone,
  MdLocationOn,
  MdWork,
  MdAttachMoney,
  MdDateRange,
  MdTrendingUp,
  MdTrendingDown,
  MdCheckCircle,
  MdWarning,
  MdError,
  MdPrint
} from 'react-icons/md';
import { pointageService } from 'services/pointageService';
import MiniStatistics from 'components/card/MiniStatistics';

export default function EmployeeDetailModal({ isOpen, onClose, employee }) {
  const [qrCodeData, setQrCodeData] = useState(null);
  const [pointageHistory, setPointageHistory] = useState([]);
  const [employeeStats, setEmployeeStats] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingQR, setLoadingQR] = useState(false);

  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Charger les données de pointage de l'employé
  useEffect(() => {
    if (isOpen && employee) {
      loadPointageData();
      loadQRCode();
    }
  }, [isOpen, employee]);

  const loadPointageData = async () => {
    if (!employee?.id) return;
    
    try {
      setLoading(true);

      // Charger l'historique (30 derniers jours)
      const historyResult = await pointageService.obtenirHistoriqueEmploye(employee.id, 30);
      if (historyResult.succes) {
        setPointageHistory(historyResult.donnees);
      }

      // Charger les statistiques du mois courant
      const periode = {
        dateDebut: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        dateFin: new Date()
      };
      const statsResult = await pointageService.obtenirRapportEmployes(periode);
      if (statsResult.succes) {
        const empStats = statsResult.donnees.find(emp => emp.id === employee.id);
        setEmployeeStats(empStats?.statistiques || {});
      }

    } catch (error) {
      console.error('Erreur chargement pointage:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de pointage',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const loadQRCode = async () => {
    if (!employee?.id) return;
    
    try {
      setLoadingQR(true);
      const result = await pointageService.obtenirQRCode(employee.id);
      if (result.succes && result.donnees.existe) {
        setQrCodeData(result.donnees);
      } else {
        setQrCodeData(null);
      }
    } catch (error) {
      console.error('Erreur QR Code:', error);
      setQrCodeData(null);
    } finally {
      setLoadingQR(false);
    }
  };

  const generateQRCode = async () => {
    try {
      setLoadingQR(true);
      const result = await pointageService.genererQRCode(employee.id);
      if (result.succes) {
        toast({
          title: 'QR Code généré',
          description: 'QR Code généré avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        await loadQRCode();
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la génération du QR Code',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingQR(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeData?.qrCodeImage) return;
    
    const link = document.createElement('a');
    link.href = qrCodeData.qrCodeImage;
    link.download = `QRCode_${employee.nomComplet.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Téléchargement',
      description: 'QR Code téléchargé',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const getContractTypeLabel = (type) => {
    const labels = {
      CDI: 'CDI',
      CDD: 'CDD', 
      STAGE: 'Stage',
      FREELANCE: 'Freelance',
      CONSULTANT: 'Consultant'
    };
    return labels[type] || type;
  };

  const getStatusColor = (actif) => {
    return actif ? 'green' : 'red';
  };

  const formatStatut = pointageService.formatStatutPresence;
  const formatType = pointageService.formatTypePointage;

  if (!employee) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent maxH="90vh" overflow="hidden">
        <ModalHeader>
          <HStack>
            <Avatar size="md" name={employee.nomComplet} bg="blue.500" />
            <VStack align="start" spacing={0}>
              <Text fontSize="lg" fontWeight="bold">
                {employee.nomComplet}
              </Text>
              <Text fontSize="sm" color="gray.500">
                {employee.poste}
              </Text>
            </VStack>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody overflowY="auto">
          <Tabs variant="enclosed" colorScheme="blue">
            <TabList>
              <Tab>Informations Générales</Tab>
              <Tab>QR Code</Tab>
              <Tab>Historique Pointage</Tab>
              <Tab>Statistiques</Tab>
            </TabList>

            <TabPanels>
              {/* Onglet Informations Générales */}
              <TabPanel>
                <VStack align="stretch" spacing={6}>
                  {/* En-tête avec avatar et infos principales */}
                  <Card bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" color="white" borderRadius="xl">
                    <CardBody p={6}>
                      <Flex align="center" justify="space-between">
                        <HStack spacing={4}>
                          <Avatar size="xl" name={employee.nomComplet} bg="whiteAlpha.300" color="white" />
                          <VStack align="start" spacing={1}>
                            <Text fontSize="2xl" fontWeight="bold">{employee.nomComplet}</Text>
                            <Text fontSize="lg" opacity={0.9}>{employee.poste}</Text>
                            <Badge
                              colorScheme={employee.actif ? 'green' : 'red'}
                              variant="solid"
                              size="lg"
                              borderRadius="full"
                            >
                              {employee.actif ? '● Actif' : '● Inactif'}
                            </Badge>
                          </VStack>
                        </HStack>
                        <VStack align="end" spacing={1}>
                          <Text fontSize="sm" opacity={0.8}>ID Employé</Text>
                          <Text fontSize="lg" fontWeight="bold">#{employee.id.toString().padStart(4, '0')}</Text>
                        </VStack>
                      </Flex>
                    </CardBody>
                  </Card>

                  {/* Grille des informations détaillées */}
                  <SimpleGrid columns={{ base: 1, lg: 3 }} spacing={6}>
                    {/* Informations de contact */}
                    <Card bg={bgColor} borderColor={borderColor} borderRadius="xl" shadow="lg">
                      <CardHeader pb={2}>
                        <HStack>
                          <Icon as={MdPerson} color="blue.500" boxSize={6} />
                          <Text fontWeight="bold" fontSize="lg" color="blue.600">
                            Contact
                          </Text>
                        </HStack>
                      </CardHeader>
                      <CardBody pt={2}>
                        <VStack align="stretch" spacing={4}>
                          <Box>
                            <HStack mb={2}>
                              <Icon as={MdEmail} color="gray.500" />
                              <Text fontSize="sm" color="gray.500" fontWeight="medium">Email</Text>
                            </HStack>
                            <Text fontWeight="600" pl={6}>{employee.email}</Text>
                          </Box>
                          
                          <Divider />
                          
                          <Box>
                            <HStack mb={2}>
                              <Icon as={MdPhone} color="gray.500" />
                              <Text fontSize="sm" color="gray.500" fontWeight="medium">Téléphone</Text>
                            </HStack>
                            <Text fontWeight="600" pl={6}>
                              {employee.telephone || 'Non renseigné'}
                            </Text>
                          </Box>
                          
                          <Divider />
                          
                          <Box>
                            <HStack mb={2}>
                              <Icon as={MdLocationOn} color="gray.500" />
                              <Text fontSize="sm" color="gray.500" fontWeight="medium">Adresse</Text>
                            </HStack>
                            <Text fontWeight="600" pl={6}>
                              {employee.adresse || 'Non renseignée'}
                            </Text>
                          </Box>
                        </VStack>
                      </CardBody>
                    </Card>

                    {/* Informations professionnelles */}
                    <Card bg={bgColor} borderColor={borderColor} borderRadius="xl" shadow="lg">
                      <CardHeader pb={2}>
                        <HStack>
                          <Icon as={MdWork} color="green.500" boxSize={6} />
                          <Text fontWeight="bold" fontSize="lg" color="green.600">
                            Professionnel
                          </Text>
                        </HStack>
                      </CardHeader>
                      <CardBody pt={2}>
                        <VStack align="stretch" spacing={4}>
                          <Box>
                            <HStack mb={2}>
                              <Icon as={MdWork} color="gray.500" />
                              <Text fontSize="sm" color="gray.500" fontWeight="medium">Type de contrat</Text>
                            </HStack>
                            <Badge colorScheme="blue" variant="subtle" size="lg" pl={6}>
                              {getContractTypeLabel(employee.typeContrat)}
                            </Badge>
                          </Box>
                          
                          <Divider />
                          
                          <Box>
                            <HStack mb={2}>
                              <Icon as={MdDateRange} color="gray.500" />
                              <Text fontSize="sm" color="gray.500" fontWeight="medium">Date d'embauche</Text>
                            </HStack>
                            <Text fontWeight="600" pl={6}>
                              {new Date(employee.dateEmbauche).toLocaleDateString('fr-FR')}
                            </Text>
                          </Box>
                          
                          <Divider />
                          
                          <Box>
                            <HStack mb={2}>
                              <Icon as={MdWork} color="gray.500" />
                              <Text fontSize="sm" color="gray.500" fontWeight="medium">Département</Text>
                            </HStack>
                            <Text fontWeight="600" pl={6}>
                              {employee.departement || 'Non renseigné'}
                            </Text>
                          </Box>
                        </VStack>
                      </CardBody>
                    </Card>

                    {/* Informations de rémunération */}
                    <Card bg={bgColor} borderColor={borderColor} borderRadius="xl" shadow="lg">
                      <CardHeader pb={2}>
                        <HStack>
                          <Icon as={MdAttachMoney} color="orange.500" boxSize={6} />
                          <Text fontWeight="bold" fontSize="lg" color="orange.600">
                            Rémunération
                          </Text>
                        </HStack>
                      </CardHeader>
                      <CardBody pt={2}>
                        <VStack align="stretch" spacing={4}>
                          <Box textAlign="center" py={4}>
                            <Text fontSize="sm" color="gray.500" mb={2}>Montant</Text>
                            <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                              {employee.typeContrat === 'SALAIRE_FIXE' 
                                ? `${(employee.salaireFixe || 0).toLocaleString()}`
                                : employee.typeContrat === 'HONORAIRE'
                                ? `${(employee.tauxHonoraire || 0).toLocaleString()}`
                                : `${(employee.tauxSalaireHoraire || 0).toLocaleString()}`
                              }
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              FCFA{employee.typeContrat === 'SALAIRE_FIXE' 
                                ? '/mois'
                                : employee.typeContrat === 'HONORAIRE'
                                ? '/jour'
                                : '/heure'
                              }
                            </Text>
                          </Box>
                          
                          <Box bg="orange.50" p={3} borderRadius="md" textAlign="center">
                            <Text fontSize="xs" color="orange.700">
                              💰 Salaire {employee.typeContrat === 'SALAIRE_FIXE' ? 'mensuel' : 
                                employee.typeContrat === 'HONORAIRE' ? 'journalier' : 'horaire'}
                            </Text>
                          </Box>
                        </VStack>
                      </CardBody>
                    </Card>
                  </SimpleGrid>
                </VStack>
              </TabPanel>

              {/* Onglet QR Code */}
              <TabPanel>
                <VStack spacing={8}>
                  {loadingQR ? (
                    <Card w="100%" bg={bgColor} borderRadius="2xl" shadow="xl">
                      <CardBody py={16}>
                        <Center>
                          <VStack spacing={4}>
                            <Spinner size="xl" color="blue.500" thickness="4px" />
                            <Text fontSize="lg" color="gray.600">Chargement du QR Code...</Text>
                          </VStack>
                        </Center>
                      </CardBody>
                    </Card>
                  ) : qrCodeData ? (
                    <>
                      {/* QR Code existant avec design moderne */}
                      <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} w="100%">
                        {/* Carte QR Code principale */}
                        <Card bg="linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)" color="white" borderRadius="2xl" shadow="2xl">
                          <CardHeader textAlign="center" pb={2}>
                            <VStack spacing={2}>
                              <Icon as={MdQrCode} boxSize={8} />
                              <Text fontWeight="bold" fontSize="xl">QR Code Personnel</Text>
                              <Text fontSize="sm" opacity={0.8}>Scan pour pointer</Text>
                            </VStack>
                          </CardHeader>
                          <CardBody textAlign="center">
                            <VStack spacing={6}>
                              <ScaleFade initialScale={0.8} in={true}>
                                <Box 
                                  bg="white" 
                                  p={6} 
                                  borderRadius="xl" 
                                  shadow="inner"
                                  transform="rotate(0deg)"
                                  transition="all 0.3s ease"
                                  _hover={{ transform: "rotate(1deg) scale(1.02)" }}
                                >
                                  <Image
                                    src={qrCodeData.qrCodeImage}
                                    alt="QR Code"
                                    w="240px"
                                    h="240px"
                                    objectFit="contain"
                                  />
                                </Box>
                              </ScaleFade>
                              
                              <Text fontSize="lg" fontWeight="bold" opacity={0.9}>
                                {employee.nomComplet}
                              </Text>
                              
                              <HStack spacing={4}>
                                <Tooltip label="Télécharger l'image QR">
                                  <Button
                                    leftIcon={<MdDownload />}
                                    variant="outline"
                                    colorScheme="whiteAlpha"
                                    color="white"
                                    borderColor="whiteAlpha.400"
                                    onClick={downloadQRCode}
                                    _hover={{ bg: "whiteAlpha.200" }}
                                  >
                                    Télécharger
                                  </Button>
                                </Tooltip>
                                <Tooltip label="Imprimer le QR Code">
                                  <Button
                                    leftIcon={<MdPrint />}
                                    variant="outline"
                                    colorScheme="whiteAlpha"
                                    color="white"
                                    borderColor="whiteAlpha.400"
                                    onClick={() => window.print()}
                                    _hover={{ bg: "whiteAlpha.200" }}
                                  >
                                    Imprimer
                                  </Button>
                                </Tooltip>
                              </HStack>
                            </VStack>
                          </CardBody>
                        </Card>

                        {/* Informations du QR Code */}
                        <VStack spacing={4}>
                          {/* Statistiques rapides */}
                          <SimpleGrid columns={2} spacing={4} w="100%">
                            <MiniStatistics
                              startContent={<Icon as={MdCheckCircle} boxSize={8} color="green.500" />}
                              name="Utilisations"
                              value={qrCodeData.qrCode?.nombreUtilisations || 0}
                            />
                            <MiniStatistics
                              startContent={
                                <Icon 
                                  as={qrCodeData.qrCode?.actif ? MdCheckCircle : MdError} 
                                  boxSize={8} 
                                  color={qrCodeData.qrCode?.actif ? 'green.500' : 'red.500'} 
                                />
                              }
                              name="Statut"
                              value={qrCodeData.qrCode?.actif ? 'Actif' : 'Inactif'}
                            />
                          </SimpleGrid>

                          {/* Détails du QR Code */}
                          <Card bg={bgColor} borderColor={borderColor} w="100%" borderRadius="xl">
                            <CardHeader>
                              <Text fontWeight="bold" color="blue.600">Détails du QR Code</Text>
                            </CardHeader>
                            <CardBody>
                              <VStack align="stretch" spacing={4}>
                                <Box>
                                  <Text fontSize="sm" color="gray.500" mb={1}>Code unique</Text>
                                  <Text 
                                    fontFamily="mono" 
                                    fontSize="md" 
                                    fontWeight="bold" 
                                    bg="gray.50" 
                                    p={2} 
                                    borderRadius="md"
                                    wordBreak="break-all"
                                  >
                                    {qrCodeData.qrCode?.codeQR}
                                  </Text>
                                </Box>
                                
                                <Divider />
                                
                                <SimpleGrid columns={2} spacing={4}>
                                  <Box>
                                    <Text fontSize="sm" color="gray.500" mb={1}>Généré le</Text>
                                    <Text fontWeight="600">
                                      {new Date(qrCodeData.qrCode?.dateGeneration).toLocaleDateString('fr-FR')}
                                    </Text>
                                    <Text fontSize="xs" color="gray.400">
                                      {new Date(qrCodeData.qrCode?.dateGeneration).toLocaleTimeString('fr-FR')}
                                    </Text>
                                  </Box>
                                  
                                  <Box>
                                    <Text fontSize="sm" color="gray.500" mb={1}>Dernière utilisation</Text>
                                    <Text fontWeight="600">
                                      {qrCodeData.qrCode?.dernierUtilisation 
                                        ? new Date(qrCodeData.qrCode.dernierUtilisation).toLocaleDateString('fr-FR')
                                        : 'Jamais utilisé'
                                      }
                                    </Text>
                                  </Box>
                                </SimpleGrid>
                              </VStack>
                            </CardBody>
                          </Card>
                        </VStack>
                      </SimpleGrid>
                    </>
                  ) : (
                    <>
                      {/* Pas de QR Code - Design amélioré */}
                      <Card bg={bgColor} borderRadius="2xl" shadow="xl" w="100%">
                        <CardBody py={16}>
                          <Center>
                            <VStack spacing={8} maxW="400px">
                              <Box 
                                bg="orange.100" 
                                p={6} 
                                borderRadius="full"
                                animation="pulse 2s infinite"
                              >
                                <Icon as={MdQrCode} boxSize={16} color="orange.500" />
                              </Box>
                              
                              <VStack spacing={4} textAlign="center">
                                <Text fontSize="xl" fontWeight="bold" color="gray.700">
                                  Aucun QR Code généré
                                </Text>
                                <Text color="gray.500" maxW="300px">
                                  Cet employé n'a pas encore de QR Code pour le pointage. 
                                  Générez-en un pour permettre le pointage mobile.
                                </Text>
                              </VStack>
                              
                              <VStack spacing={3}>
                                <Button
                                  leftIcon={<MdQrCode />}
                                  colorScheme="blue"
                                  onClick={generateQRCode}
                                  size="lg"
                                  px={8}
                                  shadow="lg"
                                  _hover={{ transform: "translateY(-2px)", shadow: "xl" }}
                                >
                                  Générer QR Code
                                </Button>
                                
                                <Text fontSize="xs" color="gray.400" textAlign="center">
                                  ✨ Le QR Code sera unique et sécurisé
                                </Text>
                              </VStack>
                            </VStack>
                          </Center>
                        </CardBody>
                      </Card>
                    </>
                  )}
                </VStack>
              </TabPanel>

              {/* Onglet Historique */}
              <TabPanel>
                {loading ? (
                  <Box textAlign="center" py={8}>
                    <Spinner size="xl" />
                    <Text mt={4}>Chargement de l'historique...</Text>
                  </Box>
                ) : (
                  <VStack spacing={4}>
                    <HStack justify="space-between" w="100%">
                      <Text fontWeight="bold" fontSize="lg">
                        Historique des 30 derniers jours
                      </Text>
                      <Button
                        leftIcon={<MdRefresh />}
                        size="sm"
                        variant="outline"
                        onClick={loadPointageData}
                      >
                        Actualiser
                      </Button>
                    </HStack>

                    <TableContainer w="100%">
                      <Table size="sm">
                        <Thead>
                          <Tr>
                            <Th>Date</Th>
                            <Th>Arrivée</Th>
                            <Th>Sortie</Th>
                            <Th>Statut</Th>
                            <Th>Heures</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {pointageHistory.length > 0 ? (
                            pointageHistory.map((pointage) => (
                              <Tr key={pointage.id}>
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
                                    size="sm"
                                    colorScheme={formatStatut(pointage.statutPresence).color}
                                  >
                                    {formatStatut(pointage.statutPresence).label}
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
                            ))
                          ) : (
                            <Tr>
                              <Td colSpan={5} textAlign="center" color="gray.500">
                                Aucun pointage enregistré
                              </Td>
                            </Tr>
                          )}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  </VStack>
                )}
              </TabPanel>

              {/* Onglet Statistiques */}
              <TabPanel>
                {loading ? (
                  <Card bg={bgColor} borderRadius="2xl" shadow="xl" w="100%">
                    <CardBody py={16}>
                      <Center>
                        <VStack spacing={4}>
                          <Spinner size="xl" color="blue.500" thickness="4px" />
                          <Text fontSize="lg" color="gray.600">Chargement des statistiques...</Text>
                        </VStack>
                      </Center>
                    </CardBody>
                  </Card>
                ) : (
                  <VStack spacing={8}>
                    {/* En-tête avec période */}
                    <Card bg="linear-gradient(135deg, #667eea 0%, #764ba2 100%)" color="white" borderRadius="xl" w="100%">
                      <CardBody p={6}>
                        <Flex justify="space-between" align="center">
                          <VStack align="start" spacing={1}>
                            <Text fontSize="2xl" fontWeight="bold">Statistiques de Performance</Text>
                            <Text fontSize="lg" opacity={0.9}>
                              Mois de {new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                            </Text>
                          </VStack>
                          <Icon as={MdTrendingUp} boxSize={12} opacity={0.7} />
                        </Flex>
                      </CardBody>
                    </Card>

                    {/* Grille des statistiques principales */}
                    <SimpleGrid columns={{ base: 2, md: 4 }} spacing={6} w="100%">
                      <MiniStatistics
                        startContent={
                          <Box bg="green.100" p={3} borderRadius="full">
                            <Icon as={MdCheckCircle} boxSize={8} color="green.500" />
                          </Box>
                        }
                        name="Jours présents"
                        value={employeeStats.joursPresents || 0}
                        growth={`+${Math.round(((employeeStats.joursPresents || 0) / 22) * 100)}%`}
                      />

                      <MiniStatistics
                        startContent={
                          <Box bg="orange.100" p={3} borderRadius="full">
                            <Icon as={MdWarning} boxSize={8} color="orange.500" />
                          </Box>
                        }
                        name="Retards"
                        value={employeeStats.joursRetard || 0}
                      />

                      <MiniStatistics
                        startContent={
                          <Box bg="red.100" p={3} borderRadius="full">
                            <Icon as={MdError} boxSize={8} color="red.500" />
                          </Box>
                        }
                        name="Absences"
                        value={employeeStats.joursAbsents || 0}
                      />

                      <MiniStatistics
                        startContent={
                          <Box bg="blue.100" p={3} borderRadius="full">
                            <Icon as={MdAccessTime} boxSize={8} color="blue.500" />
                          </Box>
                        }
                        name="Heures totales"
                        value={`${employeeStats.totalHeures || 0}h`}
                      />
                    </SimpleGrid>

                    {/* Analyse détaillée */}
                    <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8} w="100%">
                      {/* Taux de présence */}
                      <Card bg={bgColor} borderColor={borderColor} borderRadius="xl" shadow="lg">
                        <CardHeader>
                          <HStack>
                            <Icon as={MdTrendingUp} color="blue.500" boxSize={6} />
                            <Text fontWeight="bold" fontSize="lg" color="blue.600">
                              Taux de présence
                            </Text>
                          </HStack>
                        </CardHeader>
                        <CardBody>
                          <VStack spacing={6}>
                            <Box textAlign="center" w="100%">
                              <Text fontSize="4xl" fontWeight="bold" 
                                color={
                                  (employeeStats.tauxPresence || 0) >= 90 
                                    ? 'green.500' 
                                    : (employeeStats.tauxPresence || 0) >= 75 
                                    ? 'orange.500' 
                                    : 'red.500'
                                }
                              >
                                {Math.round(employeeStats.tauxPresence || 0)}%
                              </Text>
                              <Text color="gray.500" fontSize="lg">Assiduité globale</Text>
                            </Box>
                            
                            <Box w="100%">
                              <Progress
                                value={employeeStats.tauxPresence || 0}
                                colorScheme={
                                  (employeeStats.tauxPresence || 0) >= 90 
                                    ? 'green' 
                                    : (employeeStats.tauxPresence || 0) >= 75 
                                    ? 'orange' 
                                    : 'red'
                                }
                                size="lg"
                                borderRadius="full"
                                height="12px"
                              />
                              <HStack justify="space-between" mt={2}>
                                <Text fontSize="xs" color="gray.400">0%</Text>
                                <Text fontSize="xs" color="gray.400">100%</Text>
                              </HStack>
                            </Box>
                            
                            <Alert
                              status={
                                (employeeStats.tauxPresence || 0) >= 90 
                                  ? 'success'
                                  : (employeeStats.tauxPresence || 0) >= 75 
                                  ? 'warning' 
                                  : 'error'
                              }
                              borderRadius="lg"
                              variant="subtle"
                            >
                              <AlertIcon />
                              <Text fontSize="sm">
                                Performance {' '}
                                {(employeeStats.tauxPresence || 0) >= 90 
                                  ? 'excellente 🏆' 
                                  : (employeeStats.tauxPresence || 0) >= 75 
                                  ? 'satisfaisante 👍' 
                                  : 'à améliorer 📈'
                                }
                              </Text>
                            </Alert>
                          </VStack>
                        </CardBody>
                      </Card>

                      {/* Répartition des activités */}
                      <Card bg={bgColor} borderColor={borderColor} borderRadius="xl" shadow="lg">
                        <CardHeader>
                          <HStack>
                            <Icon as={MdCalendarToday} color="purple.500" boxSize={6} />
                            <Text fontWeight="bold" fontSize="lg" color="purple.600">
                              Répartition mensuelle
                            </Text>
                          </HStack>
                        </CardHeader>
                        <CardBody>
                          <VStack spacing={4}>
                            {/* Présences */}
                            <Box w="100%">
                              <HStack justify="space-between" mb={2}>
                                <HStack>
                                  <Box w={3} h={3} bg="green.500" borderRadius="full" />
                                  <Text fontSize="sm">Présences</Text>
                                </HStack>
                                <Text fontSize="sm" fontWeight="bold">{employeeStats.joursPresents || 0} jours</Text>
                              </HStack>
                              <Progress 
                                value={((employeeStats.joursPresents || 0) / 22) * 100} 
                                colorScheme="green" 
                                size="md"
                                borderRadius="full"
                              />
                            </Box>

                            {/* Retards */}
                            <Box w="100%">
                              <HStack justify="space-between" mb={2}>
                                <HStack>
                                  <Box w={3} h={3} bg="orange.500" borderRadius="full" />
                                  <Text fontSize="sm">Retards</Text>
                                </HStack>
                                <Text fontSize="sm" fontWeight="bold">{employeeStats.joursRetard || 0} jours</Text>
                              </HStack>
                              <Progress 
                                value={((employeeStats.joursRetard || 0) / 22) * 100} 
                                colorScheme="orange" 
                                size="md"
                                borderRadius="full"
                              />
                            </Box>

                            {/* Absences */}
                            <Box w="100%">
                              <HStack justify="space-between" mb={2}>
                                <HStack>
                                  <Box w={3} h={3} bg="red.500" borderRadius="full" />
                                  <Text fontSize="sm">Absences</Text>
                                </HStack>
                                <Text fontSize="sm" fontWeight="bold">{employeeStats.joursAbsents || 0} jours</Text>
                              </HStack>
                              <Progress 
                                value={((employeeStats.joursAbsents || 0) / 22) * 100} 
                                colorScheme="red" 
                                size="md"
                                borderRadius="full"
                              />
                            </Box>

                            <Divider />

                            {/* Moyenne hebdomadaire */}
                            <Box w="100%" bg="blue.50" p={4} borderRadius="lg" textAlign="center">
                              <Text fontSize="sm" color="blue.600" mb={1}>Moyenne hebdomadaire</Text>
                              <Text fontSize="xl" fontWeight="bold" color="blue.700">
                                {Math.round((employeeStats.totalHeures || 0) / 4)}h
                              </Text>
                              <Text fontSize="xs" color="blue.500">par semaine</Text>
                            </Box>
                          </VStack>
                        </CardBody>
                      </Card>
                    </SimpleGrid>
                  </VStack>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </ModalBody>

        <ModalFooter>
          <Button onClick={onClose}>Fermer</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}