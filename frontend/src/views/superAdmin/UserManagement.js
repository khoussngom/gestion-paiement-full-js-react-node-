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
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Switch,
  Avatar,
  Flex
} from '@chakra-ui/react';
import { MdAdd, MdMoreVert, MdEdit, MdDelete, MdPerson, MdBusiness, MdSupervisedUserCircle } from 'react-icons/md';
import { useAuth } from 'contexts/AuthContext';

const UserManagement = () => {
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState(0);
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    role: 'CAISSIER',
    entrepriseId: '',
    actif: true
  });

  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  
  const toast = useToast();
  const { user } = useAuth();
  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const loadUtilisateurs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/api/utilisateurs', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      const data = await response.json();
      
      if (data.succes) {
        setUtilisateurs(data.donnees);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les utilisateurs',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const loadEntreprises = useCallback(async () => {
    try {
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
      console.error('Erreur lors du chargement des entreprises:', error);
    }
  }, []);

  useEffect(() => {
    loadUtilisateurs();
    if (isSuperAdmin) {
      loadEntreprises();
    }
  }, [loadUtilisateurs, loadEntreprises, isSuperAdmin]);

  const handleCreate = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/utilisateurs', {
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
          description: 'Utilisateur créé avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        loadUtilisateurs();
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
      const response = await fetch(`http://localhost:3001/api/utilisateurs/${selectedUser.id}`, {
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
          description: 'Utilisateur modifié avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        loadUtilisateurs();
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
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        const response = await fetch(`http://localhost:3001/api/utilisateurs/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`
          }
        });
        
        const data = await response.json();
        
        if (data.succes) {
          toast({
            title: 'Succès',
            description: 'Utilisateur supprimé avec succès',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
          loadUtilisateurs();
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

  const toggleUserStatus = async (id, currentStatus) => {
    try {
      const response = await fetch(`http://localhost:3001/api/utilisateurs/${id}/toggle-status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      const data = await response.json();
      
      if (data.succes) {
        toast({
          title: 'Succès',
          description: `Utilisateur ${currentStatus ? 'désactivé' : 'activé'} avec succès`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        loadUtilisateurs();
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

  const openCreateModal = () => {
    resetForm();
    onCreateOpen();
  };

  const openEditModal = (utilisateur) => {
    setSelectedUser(utilisateur);
    setFormData({
      nom: utilisateur.nom || '',
      prenom: utilisateur.prenom || '',
      email: utilisateur.email || '',
      motDePasse: '',
      role: utilisateur.role || 'CAISSIER',
      entrepriseId: utilisateur.entrepriseId || '',
      actif: utilisateur.actif
    });
    onEditOpen();
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      motDePasse: '',
      role: 'CAISSIER',
      entrepriseId: '',
      actif: true
    });
    setSelectedUser(null);
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'purple';
      case 'ADMIN_ENTREPRISE': return 'blue';
      case 'CAISSIER': return 'green';
      default: return 'gray';
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'Super Admin';
      case 'ADMIN_ENTREPRISE': return 'Admin Entreprise';
      case 'CAISSIER': return 'Caissier';
      default: return role;
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'SUPER_ADMIN': return <MdSupervisedUserCircle />;
      case 'ADMIN_ENTREPRISE': return <MdBusiness />;
      case 'CAISSIER': return <MdPerson />;
      default: return <MdPerson />;
    }
  };

  const filteredUsers = {
    superAdmins: utilisateurs.filter(u => u.role === 'SUPER_ADMIN'),
    adminEntreprises: utilisateurs.filter(u => u.role === 'ADMIN_ENTREPRISE'),
    caissiers: utilisateurs.filter(u => u.role === 'CAISSIER')
  };

  const UserTable = ({ users, showEntreprise = true }) => (
    <TableContainer>
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Utilisateur</Th>
            <Th>Email</Th>
            <Th>Rôle</Th>
            {showEntreprise && <Th>Entreprise</Th>}
            <Th>Statut</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.map((utilisateur) => (
            <Tr key={utilisateur.id}>
              <Td>
                <Flex align="center">
                  <Avatar size="sm" name={`${utilisateur.nom} ${utilisateur.prenom}`} mr={3} />
                  <Box>
                    <Text fontWeight="medium">{utilisateur.nom} {utilisateur.prenom}</Text>
                  </Box>
                </Flex>
              </Td>
              <Td>{utilisateur.email}</Td>
              <Td>
                <Badge
                  colorScheme={getRoleColor(utilisateur.role)}
                  variant="subtle"
                  leftIcon={getRoleIcon(utilisateur.role)}
                >
                  {getRoleLabel(utilisateur.role)}
                </Badge>
              </Td>
              {showEntreprise && (
                <Td>
                  {utilisateur.entreprise?.nom || 'Aucune'}
                </Td>
              )}
              <Td>
                <Switch
                  isChecked={utilisateur.actif}
                  onChange={() => toggleUserStatus(utilisateur.id, utilisateur.actif)}
                  colorScheme="green"
                />
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
                      icon={<MdEdit />}
                      onClick={() => openEditModal(utilisateur)}
                    >
                      Modifier
                    </MenuItem>
                    <MenuItem
                      icon={<MdDelete />}
                      color="red.500"
                      onClick={() => handleDelete(utilisateur.id)}
                    >
                      Supprimer
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </TableContainer>
  );

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        {/* Header */}
        <HStack justify="space-between">
          <Box>
            <Heading size="lg" mb={2}>Gestion des Utilisateurs</Heading>
            <Text color="gray.500">Gérez tous les utilisateurs de la plateforme</Text>
          </Box>
          <Button
            leftIcon={<MdAdd />}
            colorScheme="blue"
            onClick={openCreateModal}
          >
            Nouvel Utilisateur
          </Button>
        </HStack>

        {/* Statistiques */}
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
          <Card>
            <CardBody>
              <HStack>
                <Box p={2} bg="purple.100" borderRadius="lg">
                  <MdSupervisedUserCircle color="purple" size="24px" />
                </Box>
                <Box>
                  <Text fontSize="2xl" fontWeight="bold">{filteredUsers.superAdmins.length}</Text>
                  <Text color="gray.500" fontSize="sm">Super Admins</Text>
                </Box>
              </HStack>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <HStack>
                <Box p={2} bg="blue.100" borderRadius="lg">
                  <MdBusiness color="blue" size="24px" />
                </Box>
                <Box>
                  <Text fontSize="2xl" fontWeight="bold">{filteredUsers.adminEntreprises.length}</Text>
                  <Text color="gray.500" fontSize="sm">Admin Entreprises</Text>
                </Box>
              </HStack>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <HStack>
                <Box p={2} bg="green.100" borderRadius="lg">
                  <MdPerson color="green" size="24px" />
                </Box>
                <Box>
                  <Text fontSize="2xl" fontWeight="bold">{filteredUsers.caissiers.length}</Text>
                  <Text color="gray.500" fontSize="sm">Caissiers</Text>
                </Box>
              </HStack>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Box>
                <Text fontSize="2xl" fontWeight="bold">
                  {utilisateurs.filter(u => u.actif).length}
                </Text>
                <Text color="gray.500" fontSize="sm">Utilisateurs Actifs</Text>
              </Box>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Tabs par rôle */}
        <Card>
          <CardBody>
            <Tabs index={currentTab} onChange={setCurrentTab}>
              <TabList>
                <Tab>Super Admins ({filteredUsers.superAdmins.length})</Tab>
                <Tab>Admin Entreprises ({filteredUsers.adminEntreprises.length})</Tab>
                <Tab>Caissiers ({filteredUsers.caissiers.length})</Tab>
              </TabList>

              <TabPanels>
                <TabPanel p={0} pt={4}>
                  {loading ? (
                    <Text textAlign="center">Chargement...</Text>
                  ) : filteredUsers.superAdmins.length === 0 ? (
                    <Text textAlign="center">Aucun super admin trouvé</Text>
                  ) : (
                    <UserTable users={filteredUsers.superAdmins} showEntreprise={false} />
                  )}
                </TabPanel>
                
                <TabPanel p={0} pt={4}>
                  {loading ? (
                    <Text textAlign="center">Chargement...</Text>
                  ) : filteredUsers.adminEntreprises.length === 0 ? (
                    <Text textAlign="center">Aucun admin d'entreprise trouvé</Text>
                  ) : (
                    <UserTable users={filteredUsers.adminEntreprises} />
                  )}
                </TabPanel>
                
                <TabPanel p={0} pt={4}>
                  {loading ? (
                    <Text textAlign="center">Chargement...</Text>
                  ) : filteredUsers.caissiers.length === 0 ? (
                    <Text textAlign="center">Aucun caissier trouvé</Text>
                  ) : (
                    <UserTable users={filteredUsers.caissiers} />
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </CardBody>
        </Card>
      </VStack>

      {/* Modal de création */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Nouvel Utilisateur</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Nom</FormLabel>
                  <Input
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Prénom</FormLabel>
                  <Input
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Mot de passe</FormLabel>
                  <Input
                    type="password"
                    value={formData.motDePasse}
                    onChange={(e) => setFormData({...formData, motDePasse: e.target.value})}
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Rôle</FormLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
                    <option value="ADMIN_ENTREPRISE">Admin Entreprise</option>
                    <option value="CAISSIER">Caissier</option>
                  </Select>
                </FormControl>
                
                {formData.role !== 'SUPER_ADMIN' && (
                  <FormControl isRequired={formData.role !== 'SUPER_ADMIN'}>
                    <FormLabel>Entreprise</FormLabel>
                    <Select
                      value={formData.entrepriseId}
                      onChange={(e) => setFormData({...formData, entrepriseId: e.target.value})}
                    >
                      <option value="">Sélectionner une entreprise</option>
                      {entreprises.map((entreprise) => (
                        <option key={entreprise.id} value={entreprise.id}>
                          {entreprise.nom}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </HStack>
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
          <ModalHeader>Modifier Utilisateur</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Nom</FormLabel>
                  <Input
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Prénom</FormLabel>
                  <Input
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </FormControl>
                <FormControl>
                  <FormLabel>Nouveau mot de passe (optionnel)</FormLabel>
                  <Input
                    type="password"
                    value={formData.motDePasse}
                    onChange={(e) => setFormData({...formData, motDePasse: e.target.value})}
                    placeholder="Laisser vide pour ne pas changer"
                  />
                </FormControl>
              </HStack>

              <HStack spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Rôle</FormLabel>
                  <Select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    {isSuperAdmin && <option value="SUPER_ADMIN">Super Admin</option>}
                    <option value="ADMIN_ENTREPRISE">Admin Entreprise</option>
                    <option value="CAISSIER">Caissier</option>
                  </Select>
                </FormControl>
                
                {formData.role !== 'SUPER_ADMIN' && (
                  <FormControl isRequired={formData.role !== 'SUPER_ADMIN'}>
                    <FormLabel>Entreprise</FormLabel>
                    <Select
                      value={formData.entrepriseId}
                      onChange={(e) => setFormData({...formData, entrepriseId: e.target.value})}
                    >
                      <option value="">Sélectionner une entreprise</option>
                      {entreprises.map((entreprise) => (
                        <option key={entreprise.id} value={entreprise.id}>
                          {entreprise.nom}
                        </option>
                      ))}
                    </Select>
                  </FormControl>
                )}
              </HStack>
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
    </Box>
  );
};

export default UserManagement;
