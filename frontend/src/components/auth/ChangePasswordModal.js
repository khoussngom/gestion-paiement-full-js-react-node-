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
import { useAuth } from '../../contexts/AuthContext';
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
    if (!newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    setLoading(true);
    try {
      await api.put(`/utilisateurs/${user.id}/password`, { motDePasse: newPassword });
      toast({
        title: 'Mot de passe changé',
        description: 'Votre mot de passe a été mis à jour avec succès.',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      onClose();
      window.location.reload();
    } catch (err) {
      setError('Erreur lors du changement de mot de passe');
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
