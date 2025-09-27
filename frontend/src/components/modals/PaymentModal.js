import React, { useState, useEffect, useCallback } from 'react';
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
  Select,
  VStack,
  SimpleGrid,
  useToast,
  NumberInput,
  NumberInputField,
  Textarea,
  Input,
  Text,
  HStack,
  Badge,
  Box,
} from '@chakra-ui/react';
import { paymentService } from 'services/api';
import { employeeService } from 'services/employeeService';

export default function PaymentModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    employeId: '',
    montant: 0,
    modePaiement: 'VIREMENT_BANCAIRE',
    reference: '',
    notes: '',
  });
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const loadEmployees = useCallback(async () => {
    try {
      const response = await employeeService.getAll();
      if (response.succes) {
        setEmployees(response.donnees);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger la liste des employés',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  }, [toast]);

  useEffect(() => {
    if (isOpen) {
      loadEmployees();
      // Reset form
      setFormData({
        employeId: '',
        montant: 0,
        modePaiement: 'VIREMENT_BANCAIRE',
        reference: '',
        notes: '',
      });
      setSelectedEmployee(null);
    }
  }, [isOpen, loadEmployees]);

  const handleEmployeeChange = (employeId) => {
    const employee = employees.find(emp => emp.id === employeId);
    setSelectedEmployee(employee);
    
    if (employee) {
      // Calculer le montant automatiquement selon le type de contrat
      let montant = 0;
      if (employee.typeContrat === 'SALAIRE_FIXE') {
        montant = employee.salaireFixe || 0;
      } else if (employee.typeContrat === 'HONORAIRE') {
        montant = employee.tauxHonoraire || 0;
      } else if (employee.typeContrat === 'JOURNALIER') {
        montant = (employee.tauxSalaireHoraire || 0) * 160; // 160h par mois approximativement
      }
      
      setFormData(prev => ({
        ...prev,
        employeId,
        montant,
      }));
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getPaymentMethodLabel = (method) => {
    const labels = {
      'ESPECES': 'Espèces',
      'VIREMENT_BANCAIRE': 'Virement Bancaire',
      'ORANGE_MONEY': 'Orange Money',
      'WAVE': 'Wave',
      'AUTRE': 'Autre'
    };
    return labels[method] || method;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.employeId || !formData.montant) {
      toast({
        title: 'Erreur',
        description: 'Veuillez sélectionner un employé et saisir un montant',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const response = await paymentService.create(formData);

      if (response.succes) {
        toast({
          title: 'Succès',
          description: 'Paiement effectué avec succès',
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
        description: error.response?.data?.message || 'Une erreur est survenue lors du paiement',
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
        <ModalHeader>Effectuer un Paiement</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <SimpleGrid columns={2} spacing={4} w="100%">
                <FormControl isRequired>
                  <FormLabel>Employé</FormLabel>
                  <Select
                    placeholder="Sélectionner un employé"
                    value={formData.employeId}
                    onChange={(e) => handleEmployeeChange(e.target.value)}
                  >
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.nomComplet} - {employee.poste}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                {selectedEmployee && (
                  <FormControl>
                    <FormLabel>Informations Employé</FormLabel>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="sm" color="gray.600">
                        <strong>Contrat:</strong> {selectedEmployee.typeContrat}
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        <strong>Email:</strong> {selectedEmployee.email}
                      </Text>
                      {selectedEmployee.typeContrat === 'SALAIRE_FIXE' && (
                        <Badge colorScheme="green">
                          Salaire: {(selectedEmployee.salaireFixe || 0).toLocaleString()} FCFA/mois
                        </Badge>
                      )}
                    </VStack>
                  </FormControl>
                )}

                <FormControl isRequired>
                  <FormLabel>Montant (FCFA)</FormLabel>
                  <NumberInput
                    value={formData.montant}
                    onChange={(valueString) => handleInputChange('montant', parseFloat(valueString) || 0)}
                    min={0}
                  >
                    <NumberInputField placeholder="250000" />
                  </NumberInput>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Mode de Paiement</FormLabel>
                  <Select
                    value={formData.modePaiement}
                    onChange={(e) => handleInputChange('modePaiement', e.target.value)}
                  >
                    <option value="VIREMENT_BANCAIRE">Virement Bancaire</option>
                    <option value="ESPECES">Espèces</option>
                    <option value="ORANGE_MONEY">Orange Money</option>
                    <option value="WAVE">Wave</option>
                    <option value="AUTRE">Autre</option>
                  </Select>
                </FormControl>

                <FormControl>
                  <FormLabel>Référence</FormLabel>
                  <Input
                    value={formData.reference}
                    onChange={(e) => handleInputChange('reference', e.target.value)}
                    placeholder="Numéro de transaction, référence, etc."
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Notes supplémentaires (optionnel)"
                  rows={3}
                />
              </FormControl>

              {selectedEmployee && formData.montant > 0 && (
                <Box w="100%" p={4} bg="gray.50" borderRadius="md">
                  <Text fontSize="md" fontWeight="bold" mb={2}>Résumé du Paiement</Text>
                  <HStack justify="space-between">
                    <Text>Employé:</Text>
                    <Text fontWeight="bold">{selectedEmployee.nomComplet}</Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Montant:</Text>
                    <Text fontWeight="bold" color="green.500">
                      {formData.montant.toLocaleString()} FCFA
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text>Mode:</Text>
                    <Text fontWeight="bold">{getPaymentMethodLabel(formData.modePaiement)}</Text>
                  </HStack>
                </Box>
              )}
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
            loadingText="Traitement..."
            isDisabled={!formData.employeId || !formData.montant}
          >
            Effectuer le Paiement
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
