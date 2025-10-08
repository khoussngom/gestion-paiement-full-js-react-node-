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
  VStack,
  HStack,
  Text,
  Badge,
  useToast,
  Divider,
  Icon,
  Box,
  Flex,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { FaMoneyBillWave, FaCreditCard, FaMobile, FaUniversity } from 'react-icons/fa';
import kkiaPayService from 'services/kkiaPayService';
import KkiaPayPaymentButton from '../payment/KkiaPayPaymentButton';
import payrollCycleService from 'services/payrollCycleService';

const PaymentMethodModal = ({ 
  isOpen, 
  onClose, 
  employee, 
  onPaymentSuccess 
}) => {
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('');
  const toast = useToast();

  const paymentMethods = [
    {
      id: 'ESPECES',
      label: 'Espèces',
      description: 'Paiement en liquide',
      icon: FaMoneyBillWave,
      color: 'green',
      available: true
    },
    {
      id: 'VIREMENT_BANCAIRE',
      label: 'Virement Bancaire',
      description: 'Transfert bancaire classique',
      icon: FaUniversity,
      color: 'blue',
      available: true
    },
    {
      id: 'ORANGE_MONEY',
      label: 'Orange Money',
      description: 'Paiement mobile Orange',
      icon: FaMobile,
      color: 'orange',
      available: true
    },
    {
      id: 'WAVE',
      label: 'Wave',
      description: 'Paiement mobile Wave',
      icon: FaMobile,
      color: 'purple',
      available: true
    },
    {
      id: 'KKIAPAY',
      label: 'KkiaPay',
      description: 'Paiement sécurisé via KkiaPay',
      icon: FaCreditCard,
      color: 'teal',
      available: true,
      isNew: true
    }
  ];

  const handleTraditionalPayment = async (method) => {
    try {
      setProcessing(true);
      setSelectedMethod(method);

      // Utiliser l'ancien système pour les méthodes traditionnelles
      await payrollCycleService.payerBulletin(employee.bulletinId, method);
      
      toast({
        title: 'Succès',
        description: `Paiement validé via ${paymentMethods.find(m => m.id === method)?.label}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onPaymentSuccess();
      onClose();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de valider le paiement',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setProcessing(false);
      setSelectedMethod('');
    }
  };

  const handleKkiaPayPayment = async () => {
    try {
      setProcessing(true);
      setSelectedMethod('KKIAPAY');

      // Diagnostic KkiaPay
      const diagnosis = kkiaPayService.diagnose();
      console.log('🔍 Diagnostic avant paiement:', diagnosis);

      // Valider les données de l'employé
      if (!employee.nomComplet || !employee.salaireNet) {
        throw new Error('Informations de l\'employé incomplètes');
      }

      // Préparer les données pour KkiaPay
      const paymentData = {
        amount: employee.salaireNet,
        reason: `Salaire - ${employee.nomComplet}`,
        employeeName: employee.nomComplet,
        employeePhone: employee.telephone || '',
        bulletinId: employee.bulletinId,
        cycleId: employee.cycleId,
        onSuccess: async (transaction) => {
          try {
            // Valider le paiement côté serveur
            await payrollCycleService.payerBulletin(employee.bulletinId, 'KKIAPAY');
            
            toast({
              title: 'Paiement réussi !',
              description: `Paiement KkiaPay validé pour ${employee.nomComplet}`,
              status: 'success',
              duration: 5000,
              isClosable: true,
            });

            onPaymentSuccess();
            onClose();
          } catch (error) {
            toast({
              title: 'Erreur de validation',
              description: 'Le paiement a été effectué mais la validation a échoué',
              status: 'warning',
              duration: 5000,
              isClosable: true,
            });
          } finally {
            setProcessing(false);
            setSelectedMethod('');
          }
        },
        onFailed: (error) => {
          const isServiceUnavailable = error.fallback || error.message?.includes('indisponible');
          
          toast({
            title: isServiceUnavailable ? 'Service temporairement indisponible' : 'Paiement échoué',
            description: isServiceUnavailable 
              ? 'Le service KkiaPay n\'est pas disponible. Veuillez utiliser un autre mode de paiement.'
              : (error.message || 'Le paiement KkiaPay a échoué'),
            status: isServiceUnavailable ? 'warning' : 'error',
            duration: isServiceUnavailable ? 8000 : 5000,
            isClosable: true,
          });
          setProcessing(false);
          setSelectedMethod('');
        }
      };

      // Mode rapide : essayer widget puis basculer automatiquement
      console.log('⚡ Mode paiement rapide activé');
      
      // Option 1: Paiement instantané (pas d'attente du tout)
      if (diagnosis.popupsBlocked) {
        kkiaPayService.showFallbackPaymentInterface({
          amount: paymentData.amount,
          employeeName: paymentData.employeeName,
          onClose: () => {
            setProcessing(false);
            setSelectedMethod('');
          }
        });
        return;
      }

      // Option 2: Essai rapide du widget avec fallback automatique
      try {
        await kkiaPayService.processPayment(paymentData);
      } catch (error) {
        // Si ça échoue, fallback instantané sur l'API directe
        console.log('🔄 Fallback automatique vers API directe');
        await kkiaPayService.directApiPayment(paymentData);
      }

    } catch (error) {
      toast({
        title: 'Erreur KkiaPay',
        description: error.message || 'Impossible d\'initialiser le paiement KkiaPay',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setProcessing(false);
      setSelectedMethod('');
    }
  };

  const handlePayment = (method) => {
    if (method === 'KKIAPAY') {
      handleKkiaPayPayment();
    } else {
      handleTraditionalPayment(method);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          Choisir le mode de paiement
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {employee && (
            <>
              {/* Mode rapide activé */}
              {/* Informations de l'employé */}
              <Box bg="blue.50" p={4} borderRadius="md" mb={4}>
                <Text fontSize="lg" fontWeight="bold" color="blue.800">
                  {employee.nomComplet}
                </Text>
                <Text color="blue.600">
                  Montant à payer: {kkiaPayService.formatAmountForDisplay(employee.salaireNet)}
                </Text>
              </Box>

              <Divider my={4} />

              {/* KkiaPay SDK Payment Section */}
              <Box mb={6}>
                <Text fontSize="md" fontWeight="bold" mb={3} color="gray.700">
                  💳 Paiement Électronique Sécurisé
                </Text>
                <KkiaPayPaymentButton
                  employee={{
                    nomComplet: employee.nomComplet,
                    salaireNet: employee.salaireNet,
                    telephone: employee.telephone,
                    email: employee.email || ''
                  }}
                  onSuccess={async (result) => {
                    try {
                      // Valider le paiement côté serveur
                      await payrollCycleService.payerBulletin(employee.bulletinId, 'KKIAPAY');
                      onPaymentSuccess();
                      onClose();
                    } catch (error) {
                      toast({
                        title: 'Erreur de validation',
                        description: 'Le paiement a réussi mais la validation a échoué',
                        status: 'warning',
                        duration: 5000,
                        isClosable: true,
                      });
                    }
                  }}
                  onError={(error) => {
                    console.error('Erreur KkiaPay:', error);
                  }}
                  disabled={processing}
                />
              </Box>

              <Divider my={4} />

              {/* Méthodes de paiement traditionnelles */}
              <Text fontSize="md" fontWeight="bold" mb={3} color="gray.700">
                📝 Autres Méthodes de Paiement
              </Text>
              <VStack spacing={3} align="stretch">
                {paymentMethods.filter(method => method.id !== 'KKIAPAY').map((method) => (
                  <Box
                    key={method.id}
                    p={4}
                    border="1px solid"
                    borderColor={method.available ? "gray.200" : "gray.100"}
                    borderRadius="md"
                    cursor={method.available ? "pointer" : "not-allowed"}
                    opacity={method.available ? 1 : 0.5}
                    _hover={method.available ? { borderColor: `${method.color}.300`, bg: `${method.color}.50` } : {}}
                    onClick={() => method.available && !processing && handlePayment(method.id)}
                    position="relative"
                  >
                    <Flex align="center" justify="space-between">
                      <HStack>
                        <Icon as={method.icon} color={`${method.color}.500`} boxSize={6} />
                        <VStack align="start" spacing={0}>
                          <HStack>
                            <Text fontWeight="bold" color="gray.700">
                              {method.label}
                            </Text>
                            {method.isNew && (
                              <Badge colorScheme="green" size="sm">
                                NOUVEAU
                              </Badge>
                            )}
                          </HStack>
                          <Text fontSize="sm" color="gray.500">
                            {method.description}
                          </Text>
                        </VStack>
                      </HStack>

                      {processing && selectedMethod === method.id && (
                        <Text fontSize="sm" color={`${method.color}.500`}>
                          Traitement...
                        </Text>
                      )}
                    </Flex>
                  </Box>
                ))}
              </VStack>

              {/* Note pour KkiaPay */}
              <Box bg="teal.50" p={3} borderRadius="md" mt={4}>
                <Text fontSize="sm" color="teal.700">
                  💡 <strong>KkiaPay</strong> permet les paiements sécurisés par carte bancaire, 
                  mobile money et autres moyens de paiement numériques.
                </Text>
              </Box>
            </>
          )}
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" onClick={onClose} disabled={processing}>
            Annuler
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default PaymentMethodModal;