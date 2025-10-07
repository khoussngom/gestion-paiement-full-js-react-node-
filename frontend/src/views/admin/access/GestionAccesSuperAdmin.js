import React, { useState, useEffect } from 'react';
import {
  Box,
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
  Avatar,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Heading,
  Alert,
  AlertIcon,
  Spinner,
  Flex,
  Icon,
  useColorModeValue,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  Input
} from '@chakra-ui/react';
import { 
  MdSecurity, 
  MdBusiness, 
  MdAccessTime, 
  MdDelete,
  MdRefresh,
  MdCleaningServices,
  MdExtension
} from 'react-icons/md';
import autorisationService from '../../../services/autorisationService';

const GestionAccesSuperAdmin = () => {
  const [autorisations, setAutorisations] = useState([]);
  const [statistiques, setStatistiques] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedAutorisation, setSelectedAutorisation] = useState(null);
  
  const { isOpen: isRevokeOpen, onOpen: onRevokeOpen, onClose: onRevokeClose } = useDisclosure();
  const { isOpen: isExtendOpen, onOpen: onExtendOpen, onClose: onExtendClose } = useDisclosure();
  
  const [heuresSupplementaires, setHeuresSupplementaires] = useState('');
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [autorisationsResult, statsResult] = await Promise.all([
        autorisationService.obtenirMesAutorisations(),
        autorisationService.obtenirStatistiques()
      ]);

      if (autorisationsResult.succes) {
        setAutorisations(autorisationsResult.donnees);
      }

      if (statsResult.succes) {
        setStatistiques(statsResult.donnees);
      }
    } catch (error) {
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
  };

  const handleRevoquerAcces = async () => {
    if (!selectedAutorisation) return;

    try {
      const result = await autorisationService.revoquerAcces(selectedAutorisation.id);
      
      if (result.succes) {
        toast({
          title: 'Accès révoqué',
          description: result.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        await loadData();
        onRevokeClose();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la révocation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleProlongerAcces = async () => {
    if (!selectedAutorisation || !heuresSupplementaires) return;

    try {
      const result = await autorisationService.prolongerAutorisation(
        selectedAutorisation.id,
        parseInt(heuresSupplementaires)
      );
      
      if (result.succes) {
        toast({
          title: 'Accès prolongé',
          description: result.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        setHeuresSupplementaires('');
        await loadData();
        onExtendClose();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la prolongation',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleNettoyage = async () => {
    try {
      const result = await autorisationService.nettoyerAutorisationsExpirees();
      
      if (result.succes) {
        toast({
          title: 'Nettoyage effectué',
          description: result.message,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        await loadData();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors du nettoyage',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getStatutBadge = (autorisation) => {
    if (!autorisation.estValide) {
      return <Badge colorScheme="red">Expiré</Badge>;
    }
    if (autorisation.expireBientot) {
      return <Badge colorScheme="yellow">Expire bientôt</Badge>;
    }
    return <Badge colorScheme="green">Actif</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('fr-FR');
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="200px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  return (
    <Box p={5}>
      <VStack spacing="20px">
        
        {/* En-tête */}
        <Flex justify="space-between" align="center" w="100%">
          <Heading size="lg">
            <Flex align="center" gap={3}>
              <Icon as={MdSecurity} color="blue.500" />
              <Text>Gestion des Accès - SuperAdmin</Text>
            </Flex>
          </Heading>
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
              leftIcon={<MdCleaningServices />}
              onClick={handleNettoyage}
              colorScheme="red"
              variant="outline"
              size="sm"
            >
              Nettoyer expirés
            </Button>
          </HStack>
        </Flex>

        {/* Statistiques */}
        {statistiques && (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4} w="100%">
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <CardBody>
                <Stat>
                  <StatLabel>Total Autorisations</StatLabel>
                  <StatNumber color="blue.500">{statistiques.totalAutorisations}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <CardBody>
                <Stat>
                  <StatLabel>Autorisations Actives</StatLabel>
                  <StatNumber color="green.500">{statistiques.autorisationsActives}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <CardBody>
                <Stat>
                  <StatLabel>Autorisations Expirées</StatLabel>
                  <StatNumber color="red.500">{statistiques.autorisationsExpirees}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg} borderColor={borderColor} borderWidth="1px">
              <CardBody>
                <Stat>
                  <StatLabel>Entreprises avec Accès</StatLabel>
                  <StatNumber color="purple.500">{statistiques.entreprisesAvecAcces}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}

        {/* Liste des autorisations */}
        <Card bg={cardBg} borderColor={borderColor} borderWidth="1px" w="100%">
          <CardHeader>
            <Heading size="md">
              <Flex align="center" gap={2}>
                <Icon as={MdBusiness} />
                <Text>Mes Accès aux Entreprises</Text>
              </Flex>
            </Heading>
          </CardHeader>
          <CardBody>
            {autorisations.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                Aucun accès d'entreprise accordé pour le moment.
              </Alert>
            ) : (
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Entreprise</Th>
                      <Th>Admin qui a accordé</Th>
                      <Th>Création</Th>
                      <Th>Expiration</Th>
                      <Th>Temps restant</Th>
                      <Th>Statut</Th>
                      <Th>Raison</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {autorisations.map((autorisation) => (
                      <Tr key={autorisation.id}>
                        <Td>
                          <Flex align="center" gap={2}>
                            <Avatar size="sm" name={autorisation.entreprise?.nom} />
                            <Text fontWeight="medium">{autorisation.entreprise?.nom}</Text>
                          </Flex>
                        </Td>
                        <Td>
                          <Text fontSize="sm">
                            {autorisation.admin?.prenom} {autorisation.admin?.nom}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {autorisation.admin?.email}
                          </Text>
                        </Td>
                        <Td>{formatDate(autorisation.dateCreation)}</Td>
                        <Td>{formatDate(autorisation.dateExpiration)}</Td>
                        <Td>
                          <Text 
                            fontSize="sm" 
                            color={autorisation.expireBientot ? "orange.500" : "green.500"}
                            fontWeight="medium"
                          >
                            {autorisation.tempsRestant}
                          </Text>
                        </Td>
                        <Td>{getStatutBadge(autorisation)}</Td>
                        <Td>
                          <Text fontSize="sm" maxW="150px" noOfLines={2}>
                            {autorisation.raisonAcces || 'Non spécifiée'}
                          </Text>
                        </Td>
                        <Td>
                          <HStack spacing={1}>
                            {autorisation.estValide && (
                              <>
                                <Button
                                  size="xs"
                                  colorScheme="blue"
                                  variant="outline"
                                  leftIcon={<MdExtension />}
                                  onClick={() => {
                                    setSelectedAutorisation(autorisation);
                                    onExtendOpen();
                                  }}
                                >
                                  Prolonger
                                </Button>
                                <Button
                                  size="xs"
                                  colorScheme="red"
                                  variant="outline"
                                  leftIcon={<MdDelete />}
                                  onClick={() => {
                                    setSelectedAutorisation(autorisation);
                                    onRevokeOpen();
                                  }}
                                >
                                  Révoquer
                                </Button>
                              </>
                            )}
                          </HStack>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </TableContainer>
            )}
          </CardBody>
        </Card>
      </VStack>

      {/* Modal de révocation */}
      <Modal isOpen={isRevokeOpen} onClose={onRevokeClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Révoquer l'accès</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Alert status="warning" mb={4}>
              <AlertIcon />
              Êtes-vous sûr de vouloir révoquer votre accès à l'entreprise{' '}
              <strong>{selectedAutorisation?.entreprise?.nom}</strong> ?
            </Alert>
            <Text>Cette action ne peut pas être annulée. Vous devrez demander un nouvel accès si nécessaire.</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onRevokeClose}>
              Annuler
            </Button>
            <Button colorScheme="red" onClick={handleRevoquerAcces}>
              Révoquer l'accès
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de prolongation */}
      <Modal isOpen={isExtendOpen} onClose={onExtendClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Prolonger l'accès</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Text>
                Prolonger l'accès à l'entreprise{' '}
                <strong>{selectedAutorisation?.entreprise?.nom}</strong>
              </Text>
              
              <FormControl isRequired>
                <FormLabel>Heures supplémentaires</FormLabel>
                <Input
                  type="number"
                  min="1"
                  max="168"
                  value={heuresSupplementaires}
                  onChange={(e) => setHeuresSupplementaires(e.target.value)}
                  placeholder="Ex: 24"
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Maximum 168 heures (1 semaine)
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onExtendClose}>
              Annuler
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleProlongerAcces}
              isDisabled={!heuresSupplementaires || parseInt(heuresSupplementaires) <= 0}
            >
              Prolonger
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default GestionAccesSuperAdmin;