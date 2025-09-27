import React, { useState, useEffect } from 'react';
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
  Select,
  VStack,
  SimpleGrid,
  useToast,
  NumberInput,
  NumberInputField,
  Textarea,
} from '@chakra-ui/react';
import { employeeService } from 'services/employeeService';

export default function EmployeeModal({ isOpen, onClose, employee = null, onSuccess }) {
  const [formData, setFormData] = useState({
    nomComplet: '',
    email: '',
    telephone: '',
    adresse: '',
    poste: '',
    typeContrat: 'SALAIRE_FIXE',
    salaireFixe: 0,
    tauxHonoraire: 0,
    tauxSalaireHoraire: 0,
    dateEmbauche: '',
  });
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (employee) {
      setFormData({
        nomComplet: employee.nomComplet || '',
        email: employee.email || '', 
        telephone: employee.telephone || '',
        adresse: employee.adresse || '',
        poste: employee.poste || '',
        typeContrat: employee.typeContrat || 'SALAIRE_FIXE',
        salaireFixe: employee.salaireFixe || 0,
        tauxHonoraire: employee.tauxHonoraire || 0,
        tauxSalaireHoraire: employee.tauxSalaireHoraire || 0,
        dateEmbauche: employee.dateEmbauche ? new Date(employee.dateEmbauche).toISOString().split('T')[0] : '',
      });
    } else {
      // Reset form for new employee
      setFormData({
        nomComplet: '',
        email: '',
        telephone: '',
        adresse: '',
        poste: '',
        typeContrat: 'SALAIRE_FIXE',
        salaireFixe: 0,
        tauxHonoraire: 0,
        tauxSalaireHoraire: 0,
        dateEmbauche: new Date().toISOString().split('T')[0],
      });
    }
  }, [employee, isOpen]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation basique
    if (!formData.nomComplet || !formData.email || !formData.poste) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        salaireFixe: formData.typeContrat === 'SALAIRE_FIXE' ? parseFloat(formData.salaireFixe) : undefined,
        tauxHonoraire: formData.typeContrat === 'HONORAIRE' ? parseFloat(formData.tauxHonoraire) : undefined,
        tauxSalaireHoraire: formData.typeContrat === 'JOURNALIER' ? parseFloat(formData.tauxSalaireHoraire) : undefined,
        dateEmbauche: new Date(formData.dateEmbauche).toISOString(),
      };

      let response;
      if (employee) {
        // Modification
        response = await employeeService.update(employee.id, submitData);
      } else {
        // Création
        response = await employeeService.create(submitData);
      }

      if (response.succes) {
        toast({
          title: 'Succès',
          description: employee ? 'Employé modifié avec succès' : 'Employé créé avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Une erreur est survenue',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {employee ? 'Modifier l\'employé' : 'Ajouter un employé'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <SimpleGrid columns={2} spacing={4} w="100%">
                <FormControl isRequired>
                  <FormLabel>Nom complet</FormLabel>
                  <Input
                    value={formData.nomComplet}
                    onChange={(e) => handleInputChange('nomComplet', e.target.value)}
                    placeholder="Nom complet"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@example.com"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Téléphone</FormLabel>
                  <Input
                    value={formData.telephone}
                    onChange={(e) => handleInputChange('telephone', e.target.value)}
                    placeholder="+33 1 23 45 67 89"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Poste</FormLabel>
                  <Input
                    value={formData.poste}
                    onChange={(e) => handleInputChange('poste', e.target.value)}
                    placeholder="Développeur, Manager, etc."
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Type de contrat</FormLabel>
                  <Select
                    value={formData.typeContrat}
                    onChange={(e) => handleInputChange('typeContrat', e.target.value)}
                  >
                    <option value="SALAIRE_FIXE">Salaire Fixe (CDI/CDD)</option>
                    <option value="JOURNALIER">Journalier/Horaire</option>
                    <option value="HONORAIRE">Honoraire/Freelance</option>
                  </Select>
                </FormControl>

                {formData.typeContrat === 'SALAIRE_FIXE' && (
                  <FormControl isRequired>
                    <FormLabel>Salaire fixe mensuel (FCFA)</FormLabel>
                    <NumberInput
                      value={formData.salaireFixe}
                      onChange={(valueString) => handleInputChange('salaireFixe', valueString)}
                      min={0}
                    >
                      <NumberInputField placeholder="250000" />
                    </NumberInput>
                  </FormControl>
                )}

                {formData.typeContrat === 'JOURNALIER' && (
                  <FormControl isRequired>
                    <FormLabel>Taux horaire (FCFA)</FormLabel>
                    <NumberInput
                      value={formData.tauxSalaireHoraire}
                      onChange={(valueString) => handleInputChange('tauxSalaireHoraire', valueString)}
                      min={0}
                    >
                      <NumberInputField placeholder="2500" />
                    </NumberInput>
                  </FormControl>
                )}

                {formData.typeContrat === 'HONORAIRE' && (
                  <FormControl isRequired>
                    <FormLabel>Taux d'honoraire (FCFA)</FormLabel>
                    <NumberInput
                      value={formData.tauxHonoraire}
                      onChange={(valueString) => handleInputChange('tauxHonoraire', valueString)}
                      min={0}
                    >
                      <NumberInputField placeholder="50000" />
                    </NumberInput>
                  </FormControl>
                )}

                <FormControl isRequired>
                  <FormLabel>Date d'embauche</FormLabel>
                  <Input
                    type="date"
                    value={formData.dateEmbauche}
                    onChange={(e) => handleInputChange('dateEmbauche', e.target.value)}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Adresse</FormLabel>
                <Textarea
                  value={formData.adresse}
                  onChange={(e) => handleInputChange('adresse', e.target.value)}
                  placeholder="Adresse complète"
                  rows={3}
                />
              </FormControl>
            </VStack>
          </form>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Annuler
          </Button>
          <Button
            colorScheme="brand"
            onClick={handleSubmit}
            isLoading={loading}
            loadingText={employee ? 'Modification...' : 'Création...'}
          >
            {employee ? 'Modifier' : 'Créer'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
