import React, { useState } from 'react';
import {
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Select,
  Textarea,
  VStack,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Text,
  useDisclosure,
  useToast,
  Box,
  Icon,
  Flex
} from '@chakra-ui/react';
import { MdSecurity, MdAccessTime } from 'react-icons/md';
import autorisationService from '../../services/autorisationService';

const DonnerAccesSuperAdmin = ({ 
  onAccesAccorde, 
  isDisabled = false, 
  buttonText = "Donner accès au SuperAdmin",
  buttonSize = "md",
  colorScheme = "orange"
}) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [dureeHeures, setDureeHeures] = useState('24');
  const [raisonAcces, setRaisonAcces] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const dureeOptions = [
    { value: '1', label: '1 heure' },
    { value: '2', label: '2 heures' },
    { value: '4', label: '4 heures' },
    { value: '8', label: '8 heures' },
    { value: '12', label: '12 heures' },
    { value: '24', label: '24 heures (recommandé)' },
    { value: '48', label: '48 heures' },
    { value: '72', label: '72 heures' },
    { value: '168', label: '1 semaine' }
  ];

  const handleAccorderAcces = async () => {
    if (!dureeHeures) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner une durée d\'accès',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await autorisationService.accorderAcces(
        parseInt(dureeHeures),
        raisonAcces || undefined
      );

      if (result.succes) {
        toast({
          title: 'Accès accordé',
          description: result.message,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        // Réinitialiser le formulaire
        setDureeHeures('24');
        setRaisonAcces('');
        onClose();

        // Callback pour informer le parent
        if (onAccesAccorde) {
          onAccesAccorde(result.donnees);
        }
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'accord d\'accès',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDureeLabel = (heures) => {
    const option = dureeOptions.find(opt => opt.value === heures);
    return option ? option.label : `${heures} heure(s)`;
  };

  return (
    <>
      <Button
        leftIcon={<Icon as={MdSecurity} />}
        colorScheme={colorScheme}
        size={buttonSize}
        onClick={onOpen}
        isDisabled={isDisabled}
        variant="solid"
      >
        {buttonText}
      </Button>

      <Modal isOpen={isOpen} onClose={onClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            <Flex align="center" gap={2}>
              <Icon as={MdSecurity} color="orange.500" />
              <Text>Accorder l'accès au SuperAdmin</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Alert status="warning" borderRadius="md">
                <AlertIcon />
                <Box>
                  <AlertTitle>Attention !</AlertTitle>
                  <AlertDescription fontSize="sm">
                    Vous êtes sur le point d'accorder un accès temporaire au SuperAdmin 
                    pour gérer votre entreprise. Cet accès lui permettra d'effectuer 
                    toutes les actions comme s'il était vous.
                  </AlertDescription>
                </Box>
              </Alert>

              <FormControl isRequired>
                <FormLabel>
                  <Flex align="center" gap={2}>
                    <Icon as={MdAccessTime} />
                    <Text>Durée de l'accès</Text>
                  </Flex>
                </FormLabel>
                <Select
                  value={dureeHeures}
                  onChange={(e) => setDureeHeures(e.target.value)}
                  placeholder="Choisir la durée"
                >
                  {dureeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  L'accès expirera automatiquement après cette durée
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel>Raison de l'accès (optionnel)</FormLabel>
                <Textarea
                  value={raisonAcces}
                  onChange={(e) => setRaisonAcces(e.target.value)}
                  placeholder="Ex: Support technique, audit des comptes, formation..."
                  rows={3}
                  resize="none"
                />
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Cette information sera enregistrée pour traçabilité
                </Text>
              </FormControl>

              {dureeHeures && (
                <Alert status="info" borderRadius="md" size="sm">
                  <AlertIcon />
                  <Box>
                    <AlertDescription fontSize="sm">
                      <strong>Récapitulatif :</strong> L'accès sera accordé pour{' '}
                      <strong>{getDureeLabel(dureeHeures)}</strong> à partir de maintenant.
                    </AlertDescription>
                  </Box>
                </Alert>
              )}
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={onClose}
              isDisabled={isLoading}
            >
              Annuler
            </Button>
            <Button
              colorScheme="orange"
              onClick={handleAccorderAcces}
              isLoading={isLoading}
              loadingText="Accord en cours..."
              leftIcon={<Icon as={MdSecurity} />}
            >
              Accorder l'accès
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default DonnerAccesSuperAdmin;