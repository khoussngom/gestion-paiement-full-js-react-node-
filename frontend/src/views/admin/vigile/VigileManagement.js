import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Flex,
  Heading,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Badge,
  IconButton,
  useDisclosure,
  useToast,
  VStack,
  HStack,
  Avatar,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useColorModeValue,
  Spinner,
  Center
} from '@chakra-ui/react';
import { MdAdd, MdEdit, MdDelete, MdSecurity } from 'react-icons/md';
import CreateVigileModal from 'components/modals/CreateVigileModal';

export default function VigileManagement() {
  const [vigiles, setVigiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVigile, setSelectedVigile] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure();
  
  const toast = useToast();
  const cancelRef = React.useRef();
  const textColor = useColorModeValue("secondaryGray.900", "white");
  const borderColor = useColorModeValue("gray.200", "whiteAlpha.100");
  const bgCard = useColorModeValue("white", "navy.800");

  // Charger la liste des vigiles
  const loadVigiles = async () => {
    try {
      setLoading(true);
      // Pour l'instant, nous simulons les données car l'endpoint n'existe pas encore
      // TODO: Créer l'endpoint GET /api/auth/vigiles
      const response = await fetch('/api/auth/vigiles', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setVigiles(data.donnees || []);
      } else {
        // Simulation temporaire
        setVigiles([
          {
            id: 'vigile-1',
            nom: 'TestVigile',
            prenom: 'Vigile',
            email: 'vigile@test.com',
            actif: true,
            dateCreation: '2024-10-02T10:00:00.000Z'
          }
        ]);
      }
    } catch (error) {
      console.error('Erreur chargement vigiles:', error);
      // Simulation en cas d'erreur
      setVigiles([
        {
          id: 'vigile-1', 
          nom: 'TestVigile',
          prenom: 'Vigile',
          email: 'vigile@test.com',
          actif: true,
          dateCreation: '2024-10-02T10:00:00.000Z'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Gérer la création réussie d'un vigile
  const handleVigileCreated = (newVigile) => {
    setVigiles(prev => [...prev, newVigile]);
    toast({
      title: 'Vigile créé avec succès',
      description: `${newVigile.prenom} ${newVigile.nom} a été ajouté à l'équipe`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });
  };

  // Basculer le statut actif/inactif d'un vigile
  const toggleVigileStatus = async (vigile) => {
    try {
      setActionLoading(true);
      
      // TODO: Créer l'endpoint PATCH /api/auth/vigiles/:id/toggle-status
      const response = await fetch(`/api/auth/vigiles/${vigile.id}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        setVigiles(prev => 
          prev.map(v => 
            v.id === vigile.id 
              ? { ...v, actif: !v.actif }
              : v
          )
        );
        
        toast({
          title: `Vigile ${!vigile.actif ? 'activé' : 'désactivé'}`,
          description: `${vigile.prenom} ${vigile.nom} a été ${!vigile.actif ? 'activé' : 'désactivé'}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Erreur lors du changement de statut');
      }
    } catch (error) {
      console.error('Erreur toggle status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut du vigile',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Supprimer un vigile
  const deleteVigile = async () => {
    if (!selectedVigile) return;
    
    try {
      setActionLoading(true);
      
      // TODO: Créer l'endpoint DELETE /api/auth/vigiles/:id
      const response = await fetch(`/api/auth/vigiles/${selectedVigile.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        setVigiles(prev => prev.filter(v => v.id !== selectedVigile.id));
        
        toast({
          title: 'Vigile supprimé',
          description: `${selectedVigile.prenom} ${selectedVigile.nom} a été supprimé`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        onDeleteClose();
        setSelectedVigile(null);
      } else {
        throw new Error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur suppression vigile:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer le vigile',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Charger les vigiles au montage
  useEffect(() => {
    loadVigiles();
  }, []);

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <VStack spacing={4} align="stretch">
        
        {/* En-tête */}
        <Card bg={bgCard}>
          <CardHeader>
            <Flex justify="space-between" align="center">
              <VStack align="start" spacing={1}>
                <Heading size="lg" color={textColor}>
                  <HStack>
                    <MdSecurity />
                    <Text>Gestion des Vigiles</Text>
                  </HStack>
                </Heading>
                <Text fontSize="sm" color="gray.500">
                  Gérez les comptes vigiles pour le système de pointage
                </Text>
              </VStack>
              <Button
                colorScheme="blue"
                leftIcon={<MdAdd />}
                onClick={onCreateOpen}
              >
                Ajouter un Vigile
              </Button>
            </Flex>
          </CardHeader>
        </Card>

        {/* Tableau des vigiles */}
        <Card bg={bgCard}>
          <CardHeader>
            <Heading size="md" color={textColor}>
              Vigiles ({vigiles.length})
            </Heading>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Center py={10}>
                <VStack>
                  <Spinner size="lg" />
                  <Text>Chargement des vigiles...</Text>
                </VStack>
              </Center>
            ) : vigiles.length === 0 ? (
              <Center py={10}>
                <VStack spacing={4}>
                  <MdSecurity size="48px" color="gray.400" />
                  <Text color="gray.500">Aucun vigile créé</Text>
                  <Text fontSize="sm" color="gray.400" textAlign="center">
                    Créez votre premier vigile pour commencer le système de pointage
                  </Text>
                </VStack>
              </Center>
            ) : (
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th borderColor={borderColor}>Vigile</Th>
                    <Th borderColor={borderColor}>Email</Th>
                    <Th borderColor={borderColor}>Statut</Th>
                    <Th borderColor={borderColor}>Date création</Th>
                    <Th borderColor={borderColor}>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {vigiles.map((vigile) => (
                    <Tr key={vigile.id}>
                      <Td borderColor={borderColor}>
                        <HStack>
                          <Avatar
                            size="sm"
                            name={`${vigile.prenom} ${vigile.nom}`}
                            bg="blue.500"
                          />
                          <VStack align="start" spacing={0}>
                            <Text fontWeight="bold" color={textColor}>
                              {vigile.prenom} {vigile.nom}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              Vigile
                            </Text>
                          </VStack>
                        </HStack>
                      </Td>
                      <Td borderColor={borderColor}>
                        <Text color={textColor}>{vigile.email}</Text>
                      </Td>
                      <Td borderColor={borderColor}>
                        <Badge 
                          colorScheme={vigile.actif ? "green" : "red"}
                          cursor="pointer"
                          onClick={() => toggleVigileStatus(vigile)}
                          _hover={{ opacity: 0.8 }}
                        >
                          {vigile.actif ? "Actif" : "Inactif"}
                        </Badge>
                      </Td>
                      <Td borderColor={borderColor}>
                        <Text fontSize="sm" color={textColor}>
                          {new Date(vigile.dateCreation).toLocaleDateString('fr-FR')}
                        </Text>
                      </Td>
                      <Td borderColor={borderColor}>
                        <HStack spacing={2}>
                          <IconButton
                            icon={<MdEdit />}
                            size="sm"
                            variant="ghost"
                            colorScheme="blue"
                            aria-label="Modifier"
                            onClick={() => {
                              // TODO: Implémenter la modification
                              toast({
                                title: 'Fonctionnalité à venir',
                                description: 'La modification sera disponible prochainement',
                                status: 'info',
                                duration: 3000,
                                isClosable: true,
                              });
                            }}
                          />
                          <IconButton
                            icon={<MdDelete />}
                            size="sm"
                            variant="ghost"
                            colorScheme="red"
                            aria-label="Supprimer"
                            onClick={() => {
                              setSelectedVigile(vigile);
                              onDeleteOpen();
                            }}
                          />
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </CardBody>
        </Card>

        {/* Informations */}
        <Card bg="blue.50" borderColor="blue.200">
          <CardBody>
            <VStack align="start" spacing={2}>
              <Text fontWeight="bold" color="blue.800">
                ℹ️ Informations importantes
              </Text>
              <Text fontSize="sm" color="blue.700">
                • Les vigiles peuvent uniquement accéder au scanner QR et à leur profil
              </Text>
              <Text fontSize="sm" color="blue.700">
                • Ils peuvent scanner les QR codes des employés pour enregistrer les pointages
              </Text>
              <Text fontSize="sm" color="blue.700">
                • L'accès est restreint aux fonctionnalités de pointage uniquement
              </Text>
            </VStack>
          </CardBody>
        </Card>

      </VStack>

      {/* Modal de création */}
      <CreateVigileModal
        isOpen={isCreateOpen}
        onClose={onCreateClose}
        onSuccess={handleVigileCreated}
      />

      {/* Dialog de confirmation de suppression */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Supprimer le vigile
            </AlertDialogHeader>

            <AlertDialogBody>
              Êtes-vous sûr de vouloir supprimer le vigile{' '}
              <strong>{selectedVigile?.prenom} {selectedVigile?.nom}</strong> ?
              <br />
              Cette action est irréversible.
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Annuler
              </Button>
              <Button
                colorScheme="red"
                onClick={deleteVigile}
                ml={3}
                isLoading={actionLoading}
                loadingText="Suppression..."
              >
                Supprimer
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}