import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  VStack,
  HStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton
} from '@chakra-ui/react';
import { MdVisibility, MdVisibilityOff } from 'react-icons/md';
import { authService } from 'services/authService';

export default function CreateVigileModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    nom: '',
    prenom: '',
    email: '',
    motDePasse: '',
    confirmMotDePasse: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const toast = useToast();

  // Fonction de validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.nom.trim()) {
      newErrors.nom = 'Le nom est requis';
    }

    if (!formData.prenom.trim()) {
      newErrors.prenom = 'Le prénom est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData.motDePasse) {
      newErrors.motDePasse = 'Le mot de passe est requis';
    } else if (formData.motDePasse.length < 6) {
      newErrors.motDePasse = 'Le mot de passe doit faire au moins 6 caractères';
    }

    if (formData.motDePasse !== formData.confirmMotDePasse) {
      newErrors.confirmMotDePasse = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gérer les changements de formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Effacer l'erreur du champ modifié
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Données à envoyer
      const vigileData = {
        nom: formData.nom.trim(),
        prenom: formData.prenom.trim(),
        email: formData.email.trim().toLowerCase(),
        motDePasse: formData.motDePasse,
        role: 'VIGILE'
      };

      const response = await authService.createVigile(vigileData);

      if (response.succes) {
        toast({
          title: 'Vigile créé avec succès',
          description: `Le compte vigile pour ${formData.prenom} ${formData.nom} a été créé.`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        // Réinitialiser le formulaire
        setFormData({
          nom: '',
          prenom: '',
          email: '',
          motDePasse: '',
          confirmMotDePasse: ''
        });
        setErrors({});

        // Callback de succès
        if (onSuccess) {
          onSuccess(response.donnees);
        }

        // Fermer le modal
        onClose();
      } else {
        throw new Error(response.message || 'Erreur lors de la création du vigile');
      }
    } catch (error) {
      console.error('Erreur création vigile:', error);
      
      toast({
        title: 'Erreur lors de la création',
        description: error.message || 'Une erreur est survenue lors de la création du vigile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fermer le modal et réinitialiser
  const handleClose = () => {
    setFormData({
      nom: '',
      prenom: '',
      email: '',
      motDePasse: '',
      confirmMotDePasse: ''
    });
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Créer un compte vigile</ModalHeader>
        <ModalCloseButton />
        
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <Alert status="info" borderRadius="md" size="sm">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <AlertTitle fontSize="sm">Information</AlertTitle>
                  <AlertDescription fontSize="xs">
                    Un vigile peut uniquement accéder au scanner QR pour enregistrer les pointages des employés.
                  </AlertDescription>
                </VStack>
              </Alert>

              <HStack spacing={4} w="100%">
                <FormControl isInvalid={errors.prenom}>
                  <FormLabel fontSize="sm">Prénom</FormLabel>
                  <Input
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleInputChange}
                    placeholder="Prénom du vigile"
                    size="sm"
                  />
                  <FormErrorMessage fontSize="xs">{errors.prenom}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={errors.nom}>
                  <FormLabel fontSize="sm">Nom</FormLabel>
                  <Input
                    name="nom"
                    value={formData.nom}
                    onChange={handleInputChange}
                    placeholder="Nom du vigile"
                    size="sm"
                  />
                  <FormErrorMessage fontSize="xs">{errors.nom}</FormErrorMessage>
                </FormControl>
              </HStack>

              <FormControl isInvalid={errors.email}>
                <FormLabel fontSize="sm">Email de connexion</FormLabel>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="email@exemple.com"
                  size="sm"
                />
                <FormErrorMessage fontSize="xs">{errors.email}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={errors.motDePasse}>
                <FormLabel fontSize="sm">Mot de passe</FormLabel>
                <InputGroup size="sm">
                  <Input
                    name="motDePasse"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.motDePasse}
                    onChange={handleInputChange}
                    placeholder="Mot de passe (min 6 caractères)"
                  />
                  <InputRightElement>
                    <IconButton
                      size="xs"
                      variant="ghost"
                      icon={showPassword ? <MdVisibilityOff /> : <MdVisibility />}
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage fontSize="xs">{errors.motDePasse}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={errors.confirmMotDePasse}>
                <FormLabel fontSize="sm">Confirmer le mot de passe</FormLabel>
                <InputGroup size="sm">
                  <Input
                    name="confirmMotDePasse"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmMotDePasse}
                    onChange={handleInputChange}
                    placeholder="Retapez le mot de passe"
                  />
                  <InputRightElement>
                    <IconButton
                      size="xs"
                      variant="ghost"
                      icon={showConfirmPassword ? <MdVisibilityOff /> : <MdVisibility />}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                  </InputRightElement>
                </InputGroup>
                <FormErrorMessage fontSize="xs">{errors.confirmMotDePasse}</FormErrorMessage>
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={handleClose} size="sm">
                Annuler
              </Button>
              <Button
                colorScheme="blue"
                type="submit"
                isLoading={isLoading}
                loadingText="Création..."
                size="sm"
              >
                Créer le vigile
              </Button>
            </HStack>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}