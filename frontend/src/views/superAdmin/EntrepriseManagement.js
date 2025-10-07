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
  FormErrorMessage,
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
  Image
} from '@chakra-ui/react';
import { MdAdd, MdMoreVert, MdEdit, MdDelete, MdVisibility, MdBusiness } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import ColorPicker from '../../components/colorPicker/ColorPicker';
import { useEnterprise } from '../../contexts/EnterpriseContext';

const EntrepriseManagement = () => {
  const [entreprises, setEntreprises] = useState([]);
  const [selectedEntreprise, setSelectedEntreprise] = useState(null);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [logoPreview, setLogoPreview] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [errors, setErrors] = useState({});
  const { enterEnterpriseMode } = useEnterprise();
  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    telephone: '',
    email: '',
    logo: '',
    couleurPrimaire: '#007BFF',
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

  // Fonctions de validation
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case 'nom':
        if (!value.trim()) {
          newErrors.nom = 'Le nom de l\'entreprise est requis';
        } else if (value.trim().length < 2) {
          newErrors.nom = 'Le nom doit contenir au moins 2 caractères';
        } else {
          delete newErrors.nom;
        }
        break;
        
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
          newErrors.email = 'Format d\'email invalide';
        } else {
          delete newErrors.email;
        }
        break;
        
      case 'telephone':
        const phoneRegex = /^[0-9+\-\s()]+$/;
        if (value && !phoneRegex.test(value)) {
          newErrors.telephone = 'Format de téléphone invalide';
        } else if (value && value.replace(/[^0-9]/g, '').length < 8) {
          newErrors.telephone = 'Le téléphone doit contenir au moins 8 chiffres';
        } else {
          delete newErrors.telephone;
        }
        break;
        
      case 'adresse':
        if (value && value.trim().length < 5) {
          newErrors.adresse = 'L\'adresse doit contenir au moins 5 caractères';
        } else {
          delete newErrors.adresse;
        }
        break;
        
      case 'adminEmail':
        const adminEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !adminEmailRegex.test(value)) {
          newErrors.adminEmail = 'Format d\'email invalide';
        } else {
          delete newErrors.adminEmail;
        }
        break;
        
      case 'adminNom':
        if (value && value.trim().length < 2) {
          newErrors.adminNom = 'Le nom doit contenir au moins 2 caractères';
        } else {
          delete newErrors.adminNom;
        }
        break;
        
      case 'adminPrenom':
        if (value && value.trim().length < 2) {
          newErrors.adminPrenom = 'Le prénom doit contenir au moins 2 caractères';
        } else {
          delete newErrors.adminPrenom;
        }
        break;
        
      case 'adminMotDePasse':
        if (value && value.length < 6) {
          newErrors.adminMotDePasse = 'Le mot de passe doit contenir au moins 6 caractères';
        } else {
          delete newErrors.adminMotDePasse;
        }
        break;
        
      default:
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateForm = () => {
    let isValid = true;
    
    // Validation des champs requis
    isValid = validateField('nom', formData.nom) && isValid;
    
    // Validation des autres champs s'ils sont remplis
    if (formData.email) isValid = validateField('email', formData.email) && isValid;
    if (formData.telephone) isValid = validateField('telephone', formData.telephone) && isValid;
    if (formData.adresse) isValid = validateField('adresse', formData.adresse) && isValid;
    if (formData.adminEmail) isValid = validateField('adminEmail', formData.adminEmail) && isValid;
    if (formData.adminNom) isValid = validateField('adminNom', formData.adminNom) && isValid;
    if (formData.adminPrenom) isValid = validateField('adminPrenom', formData.adminPrenom) && isValid;
    if (formData.adminMotDePasse) isValid = validateField('adminMotDePasse', formData.adminMotDePasse) && isValid;
    
    return isValid;
  };

  const handleInputChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

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
    // Valider le formulaire avant envoi
    if (!validateForm()) {
      toast({
        title: 'Erreur de validation',
        description: 'Veuillez corriger les erreurs dans le formulaire',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    try {
      setCreateLoading(true);
      
      // D'abord créer l'entreprise
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
        let logoUrl = '';
        
        // Si un logo a été sélectionné, l'uploader
        if (logoFile) {
          const formDataLogo = new FormData();
          formDataLogo.append('logo', logoFile);
          formDataLogo.append('entrepriseId', data.donnees.id);

          const logoResponse = await fetch('http://localhost:3001/api/entreprises/logo', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('authToken')}`
            },
            body: formDataLogo
          });

          const logoData = await logoResponse.json();
          if (logoData.succes) {
            logoUrl = logoData.logoUrl;
          }
        }

        toast({
          title: 'Succès',
          description: `Entreprise créée avec succès${logoUrl ? ' et logo uploadé' : ''}`,
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
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = async () => {
    try {
      setEditLoading(true);
      
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
    } finally {
      setEditLoading(false);
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
    console.log('🏢 [ENTERPRISE ACCESS] Accès à l\'entreprise:', entreprise);
    
    // Utiliser le contexte Enterprise pour entrer en mode entreprise
    const enterpriseData = {
      id: entreprise.id,
      nom: entreprise.nom,
      // Pour l'accès direct du super admin, on simule une autorisation complète
      autorisation: {
        roleAccorde: 'ADMIN',
        dateExpiration: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24h
        tempsRestant: '24 heures'
      }
    };
    
    console.log('✅ [ENTERPRISE ACCESS] Données d\'entreprise:', enterpriseData);
    enterEnterpriseMode(enterpriseData);
    
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
      couleurPrimaire: '#007BFF',
      devise: 'FCFA',
      typePeriode: 'MENSUEL',
      adminEmail: '',
      adminMotDePasse: '',
      adminNom: '',
      adminPrenom: ''
    });
    setErrors({});
    setSelectedEntreprise(null);
    setLogoPreview(null);
    setLogoFile(null);
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Erreur',
          description: 'Veuillez sélectionner un fichier image valide',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // Vérifier la taille du fichier (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Erreur',
          description: 'La taille du fichier ne doit pas dépasser 5MB',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      setLogoFile(file);
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
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
                <FormControl isRequired isInvalid={!!errors.nom}>
                  <FormLabel>Nom de l'entreprise</FormLabel>
                  <Input
                    value={formData.nom}
                    onChange={(e) => handleInputChange('nom', e.target.value)}
                  />
                  <FormErrorMessage>{errors.nom}</FormErrorMessage>
                </FormControl>
                <FormControl isInvalid={!!errors.email}>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                  <FormErrorMessage>{errors.email}</FormErrorMessage>
                </FormControl>
              </HStack>
              
              <HStack spacing={4} w="full">
                <FormControl isInvalid={!!errors.telephone}>
                  <FormLabel>Téléphone</FormLabel>
                  <Input
                    value={formData.telephone}
                    onChange={(e) => handleInputChange('telephone', e.target.value)}
                  />
                  <FormErrorMessage>{errors.telephone}</FormErrorMessage>
                </FormControl>
                <FormControl>
                  <FormLabel>Devise</FormLabel>
                  <Select
                    value={formData.devise}
                    onChange={(e) => handleInputChange('devise', e.target.value)}
                  >
                    <option value="FCFA">FCFA</option>
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                  </Select>
                </FormControl>
              </HStack>

              <FormControl isInvalid={!!errors.adresse}>
                <FormLabel>Adresse</FormLabel>
                <Input
                  value={formData.adresse}
                  onChange={(e) => handleInputChange('adresse', e.target.value)}
                />
                <FormErrorMessage>{errors.adresse}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Logo de l'entreprise</FormLabel>
                <VStack spacing={3} align="stretch">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    placeholder="Choisir un fichier image"
                  />
                  {logoPreview && (
                    <Box>
                      <Text fontSize="sm" mb={2}>Aperçu :</Text>
                      <Image
                        src={logoPreview}
                        alt="Aperçu du logo"
                        maxH="100px"
                        maxW="200px"
                        objectFit="contain"
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="md"
                        p={2}
                      />
                    </Box>
                  )}
                </VStack>
              </FormControl>

              <FormControl>
                <FormLabel>Couleur Principale</FormLabel>
                <ColorPicker
                  selectedColor={formData.couleurPrimaire}
                  onColorChange={(color) => setFormData({...formData, couleurPrimaire: color})}
                />
              </FormControl>

              <Box w="full">
                <Text fontWeight="bold" mb={3}>Administrateur de l'entreprise (optionnel)</Text>
                <VStack spacing={3}>
                  <HStack spacing={4} w="full">
                    <FormControl isInvalid={!!errors.adminNom}>
                      <FormLabel>Nom</FormLabel>
                      <Input
                        value={formData.adminNom}
                        onChange={(e) => handleInputChange('adminNom', e.target.value)}
                      />
                      <FormErrorMessage>{errors.adminNom}</FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={!!errors.adminPrenom}>
                      <FormLabel>Prénom</FormLabel>
                      <Input
                        value={formData.adminPrenom}
                        onChange={(e) => handleInputChange('adminPrenom', e.target.value)}
                      />
                      <FormErrorMessage>{errors.adminPrenom}</FormErrorMessage>
                    </FormControl>
                  </HStack>
                  <HStack spacing={4} w="full">
                    <FormControl isInvalid={!!errors.adminEmail}>
                      <FormLabel>Email Admin</FormLabel>
                      <Input
                        type="email"
                        value={formData.adminEmail}
                        onChange={(e) => handleInputChange('adminEmail', e.target.value)}
                      />
                      <FormErrorMessage>{errors.adminEmail}</FormErrorMessage>
                    </FormControl>
                    <FormControl isInvalid={!!errors.adminMotDePasse}>
                      <FormLabel>Mot de passe</FormLabel>
                      <Input
                        type="password"
                        value={formData.adminMotDePasse}
                        onChange={(e) => handleInputChange('adminMotDePasse', e.target.value)}
                      />
                      <FormErrorMessage>{errors.adminMotDePasse}</FormErrorMessage>
                    </FormControl>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="ghost" 
              mr={3} 
              onClick={onCreateClose}
              isDisabled={createLoading}
            >
              Annuler
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleCreate}
              isLoading={createLoading}
              loadingText="Création en cours..."
            >
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
            <Button 
              variant="ghost" 
              mr={3} 
              onClick={onEditClose}
              isDisabled={editLoading}
            >
              Annuler
            </Button>
            <Button 
              colorScheme="blue" 
              onClick={handleEdit}
              isLoading={editLoading}
              loadingText="Modification en cours..."
            >
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
