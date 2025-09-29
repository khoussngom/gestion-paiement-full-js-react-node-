import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Card,
  CardBody,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Textarea,
  FormControl,
  FormLabel,
  useColorModeValue,
  Icon,
  Flex,
  Avatar,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { 
  MdPending, 
  MdCheckCircle, 
  MdCancel, 
  MdBusiness,
  MdEmail,
  MdPhone,
  MdPerson,
  MdNotifications
} from 'react-icons/md';
import DemandeApprovalModal from '../../components/modals/DemandeApprovalModal';
import NotificationCenter from '../../components/notifications/NotificationCenter';

const SuperAdminDashboard = () => {
  const [demandes, setDemandes] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    enAttente: 0,
    acceptees: 0,
    rejetees: 0
  });
  const [selectedDemande, setSelectedDemande] = useState(null);
  const [motifRejet, setMotifRejet] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { isOpen: isRejectOpen, onOpen: onRejectOpen, onClose: onRejectClose } = useDisclosure();
  const { isOpen: isDetailOpen, onOpen: onDetailOpen, onClose: onDetailClose } = useDisclosure();
  const { isOpen: isApprovalOpen, onOpen: onApprovalOpen, onClose: onApprovalClose } = useDisclosure();
  
  const toast = useToast();
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const textColor = useColorModeValue('gray.600', 'gray.400');
  const emptyTextColor = useColorModeValue('gray.500', 'gray.400');

  useEffect(() => {
    loadDemandes();
    loadStats();
  }, []);

  const loadDemandes = async () => {
    try {
      const response = await fetch('/api/demandes', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      
      if (data.succes) {
        setDemandes(data.donnees);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des demandes:', error);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch('/api/demandes/statistics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      
      if (data.succes) {
        setStats(data.donnees);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
    }
  };

  const accepterDemande = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/demandes/${id}/accepter`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (data.succes) {
        toast({
          title: 'Demande acceptée',
          description: `L'entreprise a été créée avec succès. Mot de passe temporaire : ${data.donnees.motDePasseTemporaire}`,
          status: 'success',
          duration: 10000,
          isClosable: true,
        });
        
        loadDemandes();
        loadStats();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'acceptation de la demande',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const rejeterDemande = async () => {
    if (!motifRejet.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir un motif de rejet',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/demandes/${selectedDemande.id}/rejeter`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ motifRejet })
      });
      
      const data = await response.json();
      
      if (data.succes) {
        toast({
          title: 'Demande rejetée',
          description: 'La demande a été rejetée avec succès',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        
        loadDemandes();
        loadStats();
        onRejectClose();
        setMotifRejet('');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors du rejet de la demande',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'EN_ATTENTE': return 'orange';
      case 'ACCEPTEE': return 'green';
      case 'REJETEE': return 'red';
      default: return 'gray';
    }
  };

  const getStatusLabel = (statut) => {
    switch (statut) {
      case 'EN_ATTENTE': return 'En attente';
      case 'ACCEPTEE': return 'Acceptée';
      case 'REJETEE': return 'Rejetée';
      default: return statut;
    }
  };

  const showDemandeDetails = (demande) => {
    setSelectedDemande(demande);
    onDetailOpen();
  };

  const openRejectModal = (demande) => {
    setSelectedDemande(demande);
    onRejectOpen();
  };

  const openApprovalModal = (demande) => {
    setSelectedDemande(demande);
    onApprovalOpen();
  };

  const handleApprovalSuccess = (data) => {
    loadDemandes();
    loadStats();
  };

  const handleRejectionSuccess = (data) => {
    loadDemandes();
    loadStats();
  };

  return (
    <Box minH="100vh" bg={bgColor} py={8}>
      <Container maxW="7xl">
        <VStack spacing={8} align="stretch">
          {/* Header */}
          <Flex justify="space-between" align="center">
            <Box>
              <Heading size="xl" mb={2}>Dashboard Super Administrateur</Heading>
              <Text color={useColorModeValue('gray.600', 'gray.400')}>
                Gérez les demandes d'accès et les entreprises
              </Text>
            </Box>
            <NotificationCenter onDemandeClick={openApprovalModal} />
          </Flex>

          {/* Statistiques */}
          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Total des demandes</StatLabel>
                  <StatNumber>{stats.total}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>En attente</StatLabel>
                  <StatNumber color="orange.500">{stats.enAttente}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Acceptées</StatLabel>
                  <StatNumber color="green.500">{stats.acceptees}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            
            <Card bg={cardBg}>
              <CardBody>
                <Stat>
                  <StatLabel>Rejetées</StatLabel>
                  <StatNumber color="red.500">{stats.rejetees}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Table des demandes */}
          <Card bg={cardBg}>
            <CardBody>
              <Heading size="md" mb={4}>Demandes d'accès</Heading>
              
              <TableContainer>
                <Table variant="simple">
                  <Thead>
                    <Tr>
                      <Th>Entreprise</Th>
                      <Th>Responsable</Th>
                      <Th>Contact</Th>
                      <Th>Secteur</Th>
                      <Th>Employés</Th>
                      <Th>Date</Th>
                      <Th>Statut</Th>
                      <Th>Actions</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {demandes.map((demande) => (
                      <Tr key={demande.id}>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <Text fontWeight="bold">{demande.nomEntreprise}</Text>
                          </VStack>
                        </Td>
                        <Td>
                          <Flex align="center">
                            <Avatar size="sm" name={demande.nomResponsable} mr={3} />
                            <Text>{demande.nomResponsable}</Text>
                          </Flex>
                        </Td>
                        <Td>
                          <VStack align="start" spacing={1}>
                            <HStack>
                              <Icon as={MdEmail} color="gray.500" />
                              <Text fontSize="sm">{demande.email}</Text>
                            </HStack>
                            <HStack>
                              <Icon as={MdPhone} color="gray.500" />
                              <Text fontSize="sm">{demande.telephone}</Text>
                            </HStack>
                          </VStack>
                        </Td>
                        <Td>{demande.secteurActivite}</Td>
                        <Td>{demande.nombreEmployes}</Td>
                        <Td>{new Date(demande.dateCreation).toLocaleDateString('fr-FR')}</Td>
                        <Td>
                          <Badge colorScheme={getStatusColor(demande.statut)}>
                            {getStatusLabel(demande.statut)}
                          </Badge>
                        </Td>
                        <Td>
                          <HStack spacing={2}>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => showDemandeDetails(demande)}
                            >
                              Détails
                            </Button>
                            
                            {demande.statut === 'EN_ATTENTE' && (
                              <>
                                <Button
                                  size="sm"
                                  colorScheme="green"
                                  onClick={() => openApprovalModal(demande)}
                                  leftIcon={<Icon as={MdCheckCircle} />}
                                >
                                  Examiner
                                </Button>
                                <Button
                                  size="sm"
                                  colorScheme="red"
                                  variant="outline"
                                  onClick={() => openRejectModal(demande)}
                                  leftIcon={<Icon as={MdCancel} />}
                                >
                                  Rejeter
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

              {demandes.length === 0 && (
                <Box textAlign="center" py={8}>
                  <Text color={emptyTextColor}>
                    Aucune demande trouvée
                  </Text>
                </Box>
              )}
            </CardBody>
          </Card>
        </VStack>
      </Container>

      {/* Modal de détails */}
      <Modal isOpen={isDetailOpen} onClose={onDetailClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Détails de la demande</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedDemande && (
              <VStack spacing={4} align="stretch">
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontWeight="bold" mb={1}>Entreprise</Text>
                    <Text>{selectedDemande.nomEntreprise}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" mb={1}>Responsable</Text>
                    <Text>{selectedDemande.nomResponsable}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" mb={1}>Email</Text>
                    <Text>{selectedDemande.email}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" mb={1}>Téléphone</Text>
                    <Text>{selectedDemande.telephone}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" mb={1}>Secteur d'activité</Text>
                    <Text>{selectedDemande.secteurActivite}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold" mb={1}>Nombre d'employés</Text>
                    <Text>{selectedDemande.nombreEmployes}</Text>
                  </Box>
                </SimpleGrid>
                
                {selectedDemande.message && (
                  <Box>
                    <Text fontWeight="bold" mb={1}>Message</Text>
                    <Text>{selectedDemande.message}</Text>
                  </Box>
                )}
                
                <Box>
                  <Text fontWeight="bold" mb={1}>Statut</Text>
                  <Badge colorScheme={getStatusColor(selectedDemande.statut)}>
                    {getStatusLabel(selectedDemande.statut)}
                  </Badge>
                </Box>
              </VStack>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Modal de rejet */}
      <Modal isOpen={isRejectOpen} onClose={onRejectClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Rejeter la demande</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <FormControl isRequired>
              <FormLabel>Motif du rejet</FormLabel>
              <Textarea
                value={motifRejet}
                onChange={(e) => setMotifRejet(e.target.value)}
                placeholder="Expliquez pourquoi cette demande est rejetée..."
                rows={4}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <Button mr={3} onClick={onRejectClose}>
              Annuler
            </Button>
            <Button 
              colorScheme="red" 
              onClick={rejeterDemande}
              isLoading={loading}
            >
              Rejeter
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal d'approbation avec formulaire pré-rempli */}
      <DemandeApprovalModal
        isOpen={isApprovalOpen}
        onClose={onApprovalClose}
        demande={selectedDemande}
        onApprove={handleApprovalSuccess}
        onReject={handleRejectionSuccess}
      />
    </Box>
  );
};

export default SuperAdminDashboard;
