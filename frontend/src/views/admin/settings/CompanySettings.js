import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  FormControl,
  FormLabel,
  Input,
  useToast,
  Card,
  CardBody,
  Heading,
  Image,
  Flex,
  Divider,
  Badge,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  useDisclosure
} from '@chakra-ui/react';
import { 
  MdUpload, 
  MdDelete, 
  MdSave, 
  MdBusiness, 
  MdImage
} from 'react-icons/md';

const CompanySettings = () => {
  const [companyData, setCompanyData] = useState(null);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const fileInputRef = useRef();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef();

  const [formData, setFormData] = useState({
    nom: '',
    adresse: '',
    telephone: '',
    email: '',
    description: ''
  });

  const loadCompanyData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/dashboard/statistiques?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.succes && data.donnees && data.donnees.entreprise) {
          const entreprise = data.donnees.entreprise;
          setCompanyData(entreprise);
          setFormData({
            nom: entreprise.nom || '',
            adresse: entreprise.adresse || '',
            telephone: entreprise.telephone || '',
            email: entreprise.email || '',
            description: entreprise.description || ''
          });
          if (entreprise.logo) {
            setLogoPreview(entreprise.logo);
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de l\'entreprise',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadCompanyData();
  }, [loadCompanyData]);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
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

      // Vérifier la taille (max 5MB)
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
      
      // Créer une preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadLogo = async () => {
    if (!logoFile) return null;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await fetch('http://localhost:3001/api/entreprises/logo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: formData
      });

      const data = await response.json();
      
      if (data.succes) {
        return data.donnees.logoUrl;
      } else {
        throw new Error(data.message || 'Erreur lors du téléchargement');
      }
    } catch (error) {
      console.error('Erreur upload logo:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors du téléchargement du logo',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      let logoUrl = companyData?.logo;
      
      // Télécharger le nouveau logo si un fichier a été sélectionné
      if (logoFile) {
        logoUrl = await uploadLogo();
        if (!logoUrl) return; // Erreur lors du téléchargement
      }

      // Mettre à jour les informations de l'entreprise
      const updateData = {
        ...formData,
        logo: logoUrl
      };

      const response = await fetch(`http://localhost:3001/api/entreprises/${companyData.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(updateData)
      });

      const data = await response.json();
      
      if (data.succes) {
        toast({
          title: 'Succès',
          description: 'Paramètres de l\'entreprise mis à jour avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Recharger les données après un petit délai
        setTimeout(async () => {
          await loadCompanyData();
          setLogoFile(null);
          
          // Forcer un rafraîchissement du sidebar
          window.dispatchEvent(new Event('companyLogoUpdated'));
        }, 500);
      } else {
        throw new Error(data.message || 'Erreur lors de la sauvegarde');
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la sauvegarde',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLogo = async () => {
    try {
      setSaving(true);
      const response = await fetch(`http://localhost:3001/api/entreprises/${companyData.id}/logo`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      const data = await response.json();
      
      if (data.succes) {
        toast({
          title: 'Succès',
          description: 'Logo supprimé avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        setLogoPreview(null);
        setLogoFile(null);
        await loadCompanyData();
        
        // Forcer un rafraîchissement du sidebar
        window.dispatchEvent(new Event('companyLogoUpdated'));
      }
    } catch (error) {
      console.error('Erreur suppression logo:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la suppression du logo',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setSaving(false);
      onClose();
    }
  };

  if (loading) {
    return (
      <Box p={6} pt={{ base: "130px", md: "80px", xl: "100px" }}>
        <Text textAlign="center">Chargement...</Text>
      </Box>
    );
  }

  return (
    <Box p={6} pt={{ base: "130px", md: "80px", xl: "100px" }}>
      <VStack spacing={6} align="stretch" maxW="800px" mx="auto">
        {/* Header */}
        <Box>
          <Heading size="lg" mb={2} display="flex" alignItems="center">
            <MdBusiness style={{ marginRight: '12px' }} />
            Paramètres de l'Entreprise
          </Heading>
          <Text color="gray.500">Gérez les informations et le logo de votre entreprise</Text>
        </Box>

        {/* Logo Section */}
        <Card>
          <CardBody>
            <VStack spacing={4}>
              <HStack justify="space-between" w="full">
                <Heading size="md" display="flex" alignItems="center">
                  <MdImage style={{ marginRight: '8px' }} />
                  Logo de l'entreprise
                </Heading>
                {logoPreview && (
                  <Badge colorScheme="green">Logo configuré</Badge>
                )}
              </HStack>

              {logoPreview && (
                <Box
                  p={4}
                  border="2px dashed"
                  borderColor="gray.200"
                  borderRadius="lg"
                  textAlign="center"
                  bg="gray.50"
                >
                  <Image
                    src={logoPreview}
                    alt="Logo de l'entreprise"
                    maxH="120px"
                    maxW="300px"
                    objectFit="contain"
                    mx="auto"
                    borderRadius="md"
                  />
                </Box>
              )}

              <VStack spacing={3} w="full">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                
                <HStack spacing={3}>
                  <Button
                    leftIcon={<MdUpload />}
                    colorScheme="blue"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    isDisabled={uploading}
                  >
                    {logoPreview ? 'Changer le logo' : 'Télécharger un logo'}
                  </Button>
                  
                  {logoPreview && (
                    <Button
                      leftIcon={<MdDelete />}
                      colorScheme="red"
                      variant="ghost"
                      onClick={onOpen}
                      isDisabled={saving}
                    >
                      Supprimer
                    </Button>
                  )}
                </HStack>

                <Text fontSize="sm" color="gray.500" textAlign="center">
                  Formats acceptés: JPG, PNG, GIF • Taille max: 5MB
                  <br />
                  Recommandé: 200x60px pour un meilleur rendu
                </Text>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        <Divider />

        {/* Company Info Section */}
        <Card>
          <CardBody>
            <VStack spacing={4}>
              <Heading size="md" alignSelf="flex-start">
                Informations de l'entreprise
              </Heading>

              <VStack spacing={4} w="full">
                <HStack spacing={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>Nom de l'entreprise</FormLabel>
                    <Input
                      value={formData.nom}
                      onChange={(e) => setFormData({...formData, nom: e.target.value})}
                      placeholder="Nom de votre entreprise"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      placeholder="contact@entreprise.com"
                    />
                  </FormControl>
                </HStack>

                <HStack spacing={4} w="full">
                  <FormControl isRequired>
                    <FormLabel>Téléphone</FormLabel>
                    <Input
                      value={formData.telephone}
                      onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                      placeholder="+221 77 473 00 39"
                    />
                  </FormControl>
                  <FormControl isRequired>
                    <FormLabel>Adresse</FormLabel>
                    <Input
                      value={formData.adresse}
                      onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                      placeholder="Adresse complète"
                    />
                  </FormControl>
                </HStack>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Description de votre entreprise"
                  />
                </FormControl>
              </VStack>
            </VStack>
          </CardBody>
        </Card>

        {/* Actions */}
        <Flex justify="flex-end">
          <Button
            leftIcon={<MdSave />}
            colorScheme="blue"
            onClick={handleSave}
            isLoading={saving || uploading}
            loadingText={uploading ? "Téléchargement..." : "Sauvegarde..."}
            size="lg"
          >
            Sauvegarder les modifications
          </Button>
        </Flex>

        {/* Alert Dialog for Delete Confirmation */}
        <AlertDialog
          isOpen={isOpen}
          leastDestructiveRef={cancelRef}
          onClose={onClose}
        >
          <AlertDialogOverlay>
            <AlertDialogContent>
              <AlertDialogHeader fontSize="lg" fontWeight="bold">
                Supprimer le logo
              </AlertDialogHeader>

              <AlertDialogBody>
                Êtes-vous sûr de vouloir supprimer le logo de votre entreprise ? 
                Cette action ne peut pas être annulée.
              </AlertDialogBody>

              <AlertDialogFooter>
                <Button ref={cancelRef} onClick={onClose}>
                  Annuler
                </Button>
                <Button 
                  colorScheme="red" 
                  onClick={handleDeleteLogo} 
                  ml={3}
                  isLoading={saving}
                >
                  Supprimer
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialogOverlay>
        </AlertDialog>
      </VStack>
    </Box>
  );
};

export default CompanySettings;
