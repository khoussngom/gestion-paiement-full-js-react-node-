import React, { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  useToast,
  VStack,
  Text
} from '@chakra-ui/react';
import api from '../../services/api';

const ChangePasswordModal = ({ isOpen, onClose, user }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const toast = useToast();

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setError('');
    
    // Vérification que l'utilisateur est défini
    if (!user || !user.id) {
      setError('Utilisateur non identifié');
      return;
    }
    
    if (!newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.put(`/utilisateurs/${user.id}/password`, { 
        motDePasse: newPassword 
      });
      
      if (response.data.succes) {
        toast({
          title: 'Succès',
          description: response.data.message || 'Votre mot de passe a été mis à jour avec succès.',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onClose();
        // Rechargement pour actualiser l'état de l'utilisateur
        window.location.reload();
      } else {
        setError(response.data.message || 'Erreur lors du changement de mot de passe');
      }
    } catch (err) {
      console.error('Erreur changement mot de passe:', err);
      const errorMessage = err.response?.data?.message || 'Erreur lors du changement de mot de passe';
      setError(errorMessage);
      
      toast({
        title: 'Erreur',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Changer votre mot de passe</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <form onSubmit={handleChangePassword}>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Nouveau mot de passe</FormLabel>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </FormControl>
              <FormControl>
                <FormLabel>Confirmer le mot de passe</FormLabel>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </FormControl>
              {error && <Text color="red.500">{error}</Text>}
              <Button
                type="submit"
                colorScheme="blue"
                isLoading={loading}
                loadingText="Mise à jour..."
                w="100%"
              >
                Changer le mot de passe
              </Button>
            </VStack>
          </form>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ChangePasswordModal;
