import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Badge,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  SimpleGrid,
  Card,
  CardBody,
  Heading,
  Select
} from '@chakra-ui/react';
import { MdAdd, MdMoreVert, MdEdit, MdDelete, MdVisibility, MdBusiness } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const EntrepriseManagement = () => {
  const [entreprises, setEntreprises] = useState([]);
  const [selectedEntreprise, setSelectedEntreprise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    telephone: '',
    email: '',
    logo: '',
    devise: 'FCFA',
    typePeriode: 'MENSUEL',
    adminEmail: '',
    adminMotDePasse: '',
    adminNom: '',
    adminPrenom: ''
  });

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  
  const toast = useToast();
  const navigate = useNavigate();

  const loadEntreprises = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/entreprises', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      
      if (data.succes) {
        setEntreprises(data.donnees);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les entreprises',
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

  const handleCreate = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/entreprises', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.succes) {
        toast({
          title: 'Succès',
          description: 'Entreprise créée avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        loadEntreprises();
        onCreateClose();
        resetForm();
      } else {
        toast({
          title: 'Erreur',
          description: data.message || 'Erreur lors de la création',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur de connexion',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleEdit = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/entreprises/${selectedEntreprise.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.succes) {
        toast({
          title: 'Succès',
          description: 'Entreprise modifiée avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        loadEntreprises();
        onEditClose();
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur de connexion',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette entreprise ?')) {
      try {
        const response = await fetch(`http://localhost:3001/api/entreprises/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        const data = await response.json();
        
        if (data.succes) {
          toast({
            title: 'Succès',
            description: 'Entreprise supprimée avec succès',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          loadEntreprises();
        }
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Erreur de connexion',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleViewDashboard = (entreprise) => {
    // Rediriger vers le dashboard de l'entreprise avec les stats
    navigate(`/admin/entreprise/${entreprise.id}/dashboard`);
  };

  const handleAccessInterface = (entreprise) => {
    // Permettre au super admin d'accéder à l'interface d'administration de l'entreprise
    // On va stocker temporairement l'ID de l'entreprise pour simuler la connexion
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    
    // Créer un utilisateur temporaire pour l'entreprise
    const tempUser = {
      ...currentUser,
      entrepriseId: entreprise.id,
      entrepriseNom: entreprise.nom,
      isSuperAdminAccess: true, // Flag pour identifier l'accès super admin
      originalRole: currentUser.role,
      role: 'ADMIN_ENTREPRISE' // Temporairement admin de l'entreprise
    };
    
    // Sauvegarder l'utilisateur temporaire
    localStorage.setItem('user', JSON.stringify(tempUser));
    
    // Message de confirmation
    toast({
      title: 'Accès accordé',
      description: `Vous accédez maintenant à l'interface de ${entreprise.nom}`,
      status: 'info',
      duration: 4000,
      isClosable: true,
    });
    
    // Rediriger vers le dashboard admin de l'entreprise
    navigate('/admin/dashboard');
  };

  const openCreateModal = () => {
    resetForm();
    onCreateOpen();
  };

  const openEditModal = (entreprise) => {
    setSelectedEntreprise(entreprise);
    setFormData({
      nom: entreprise.nom || '',
      adresse: entreprise.adresse || '',
      telephone: entreprise.telephone || '',
      email: entreprise.email || '',
      logo: entreprise.logo || '',
      devise: entreprise.devise || 'FCFA',
      typePeriode: entreprise.typePeriode || 'MENSUEL',
      adminEmail: '',
      adminMotDePasse: '',
      adminNom: '',
      adminPrenom: ''
    });
    onEditOpen();
  };

  const openViewModal = (entreprise) => {
    setSelectedEntreprise(entreprise);
    onViewOpen();
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      adresse: '',
      telephone: '',
      email: '',
      logo: '',
      devise: 'FCFA',
      typePeriode: 'MENSUEL',
      adminEmail: '',
      adminMotDePasse: '',
      adminNom: '',
      adminPrenom: ''
    });
    setSelectedEntreprise(null);
  };

  return (
    <Box p={6} pt={{ base: "130px", md: "80px", xl: "100px" }}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Box>
            <Heading size="lg" mb={2}>Gestion des Entreprises</Heading>
            <Text color="gray.500">Gérez toutes les entreprises de la plateforme</Text>
          </Box>
          <Button
            leftIcon={<MdAdd />}
            colorScheme="blue"
            onClick={openCreateModal}
          >
            Nouvelle Entreprise
          </Button>
        </HStack>

        {/* Statistiques */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Card>
            <CardBody>
              <HStack>
                <Box p={2} bg="blue.100" borderRadius="lg">
                  <MdBusiness color="blue" size="24px" />
                </Box>
                <Box>
                  <Text fontSize="2xl" fontWeight="bold">{entreprises.length}</Text>
                  <Text color="gray.500" fontSize="sm">Total Entreprises</Text>
                </Box>
              </HStack>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Box>
                <Text fontSize="2xl" fontWeight="bold">
                  {entreprises.filter(e => e.actif).length}
                </Text>
                <Text color="gray.500" fontSize="sm">Actives</Text>
              </Box>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Box>
                <Text fontSize="2xl" fontWeight="bold">
                  {entreprises.reduce((total, e) => total + (e._count?.employes || 0), 0)}
                </Text>
                <Text color="gray.500" fontSize="sm">Total Employés</Text>
              </Box>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Box>
                <Text fontSize="2xl" fontWeight="bold">
                  {entreprises.reduce((total, e) => total + (e._count?.utilisateurs || 0), 0)}
                </Text>
                <Text color="gray.500" fontSize="sm">Total Utilisateurs</Text>
              </Box>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Liste des entreprises */}
        <Card>
          <CardBody>
            <TableContainer>
              <Table variant="simple">
                <Thead>
                  <Tr>
                    <Th>Nom</Th>
                    <Th>Email</Th>
                    <Th>Téléphone</Th>
                    <Th>Employés</Th>
                    <Th>Statut</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {loading ? (
                    <Tr>
                      <Td colSpan={6} textAlign="center">Chargement...</Td>
                    </Tr>
                  ) : entreprises.length === 0 ? (
                    <Tr>
                      <Td colSpan={6} textAlign="center">Aucune entreprise trouvée</Td>
                    </Tr>
                  ) : (
                    entreprises.map((entreprise) => (
                      <Tr key={entreprise.id}>
                        <Td fontWeight="medium">{entreprise.nom}</Td>
                        <Td>{entreprise.email || 'Non renseigné'}</Td>
                        <Td>{entreprise.telephone || 'Non renseigné'}</Td>
                        <Td>{entreprise._count?.employes || 0}</Td>
                        <Td>
                          <Badge
                            colorScheme={entreprise.actif ? 'green' : 'red'}
                            variant="subtle"
                          >
                            {entreprise.actif ? 'Active' : 'Inactive'}
                          </Badge>
                        </Td>
                        <Td>
                          <Menu>
                            <MenuButton
                              as={IconButton}
                              icon={<MdMoreVert />}
                              variant="ghost"
                              size="sm"
                            />
                            <MenuList>
                              <MenuItem
                                icon={<MdVisibility />}
                                onClick={() => handleAccessInterface(entreprise)}
                                color="blue.500"
                                fontWeight="medium"
                              >
                                Accéder à l'interface
                              </MenuItem>
                              <MenuItem
                                icon={<MdVisibility />}
                                onClick={() => handleViewDashboard(entreprise)}
                              >
                                Voir Dashboard
                              </MenuItem>
                              <MenuItem
                                icon={<MdVisibility />}
                                onClick={() => openViewModal(entreprise)}
                              >
                                Voir Détails
                              </MenuItem>
                              <MenuItem
                                icon={<MdEdit />}
                                onClick={() => openEditModal(entreprise)}
                              >
                                Modifier
                              </MenuItem>
                              <MenuItem
                                icon={<MdDelete />}
                                color="red.500"
                                onClick={() => handleDelete(entreprise.id)}
                              >
                                Supprimer
                              </MenuItem>
                            </MenuList>
                          </Menu>
                        </Td>
                      </Tr>
                    ))
                  )}
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>
      </VStack>

      {/* Modal de création */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Nouvelle Entreprise</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Nom de l'entreprise</FormLabel>
                  <Input
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </FormControl>
              </HStack>
              
              <HStack spacing={4} w="full">
                <FormControl>
                  <FormLabel>Téléphone</FormLabel>
                  <Input
                    value={formData.telephone}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Devise</FormLabel>
                  <Select
                    value={formData.devise}
                    onChange={(e) => setFormData({...formData, devise: e.target.value})}
                  >
                    <option value="FCFA">FCFA</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </Select>
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Adresse</FormLabel>
                <Input
                  value={formData.adresse}
                  onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Logo (URL)</FormLabel>
                <Input
                  value={formData.logo}
                  onChange={(e) => setFormData({...formData, logo: e.target.value})}
                  placeholder="https://exemple.com/logo.png"
                />
              </FormControl>

              <Box w="full">
                <Text fontWeight="bold" mb={3}>Administrateur de l'entreprise (optionnel)</Text>
                <VStack spacing={3}>
                  <HStack spacing={4} w="full">
                    <FormControl>
                      <FormLabel>Nom</FormLabel>
                      <Input
                        value={formData.adminNom}
                        onChange={(e) => setFormData({...formData, adminNom: e.target.value})}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Prénom</FormLabel>
                      <Input
                        value={formData.adminPrenom}
                        onChange={(e) => setFormData({...formData, adminPrenom: e.target.value})}
                      />
                    </FormControl>
                  </HStack>
                  <HStack spacing={4} w="full">
                    <FormControl>
                      <FormLabel>Email Admin</FormLabel>
                      <Input
                        type="email"
                        value={formData.adminEmail}
                        onChange={(e) => setFormData({...formData, adminEmail: e.target.value})}
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Mot de passe</FormLabel>
                      <Input
                        type="password"
                        value={formData.adminMotDePasse}
                        onChange={(e) => setFormData({...formData, adminMotDePasse: e.target.value})}
                      />
                    </FormControl>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateClose}>
              Annuler
            </Button>
            <Button colorScheme="blue" onClick={handleCreate}>
              Créer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de modification */}
      <Modal isOpen={isEditOpen} onClose={onEditClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Modifier Entreprise</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Nom de l'entreprise</FormLabel>
                  <Input
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </FormControl>
              </HStack>
              
              <HStack spacing={4} w="full">
                <FormControl>
                  <FormLabel>Téléphone</FormLabel>
                  <Input
                    value={formData.telephone}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Devise</FormLabel>
                  <Select
                    value={formData.devise}
                    onChange={(e) => setFormData({...formData, devise: e.target.value})}
                  >
                    <option value="FCFA">FCFA</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </Select>
                </FormControl>
              </HStack>

              <FormControl>
                <FormLabel>Adresse</FormLabel>
                <Input
                  value={formData.adresse}
                  onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                />
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditClose}>
              Annuler
            </Button>
            <Button colorScheme="blue" onClick={handleEdit}>
              Modifier
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de visualisation */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Détails de l'Entreprise</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedEntreprise && (
              <VStack align="stretch" spacing={4}>
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontWeight="bold">Nom:</Text>
                    <Text>{selectedEntreprise.nom}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Email:</Text>
                    <Text>{selectedEntreprise.email || 'Non renseigné'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Téléphone:</Text>
                    <Text>{selectedEntreprise.telephone || 'Non renseigné'}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Devise:</Text>
                    <Text>{selectedEntreprise.devise}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Nombre d'employés:</Text>
                    <Text>{selectedEntreprise._count?.employes || 0}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Statut:</Text>
                    <Badge colorScheme={selectedEntreprise.actif ? 'green' : 'red'}>
                      {selectedEntreprise.actif ? 'Active' : 'Inactive'}
                    </Badge>
                  </Box>
                </SimpleGrid>
                
                {selectedEntreprise.adresse && (
                  <Box>
                    <Text fontWeight="bold">Adresse:</Text>
                    <Text>{selectedEntreprise.adresse}</Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              colorScheme="blue" 
              variant="solid"
              onClick={() => handleAccessInterface(selectedEntreprise)}
              mr={3}
            >
              Accéder à l'interface
            </Button>
            <Button 
              colorScheme="blue" 
              variant="outline"
              onClick={() => handleViewDashboard(selectedEntreprise)}
              mr={3}
            >
              Voir Dashboard
            </Button>
            <Button onClick={onViewClose}>
              Fermer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default EntrepriseManagement;
