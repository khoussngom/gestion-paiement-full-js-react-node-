import React, { useEffect, useCallback } from 'react';
import { 
  openKkiapayWidget, 
  addSuccessListener, 
  addFailedListener, 
  addPendingListener,
  removeKkiapayListener 
} from 'kkiapay';
import { Box, Text, Badge, useToast, Button } from '@chakra-ui/react';
import kkiaPayService from '../../services/kkiaPayService';

const KkiaPayPaymentButton = ({ 
  employee, 
  onSuccess, 
  onError, 
  disabled = false 
}) => {
  const toast = useToast();


  const paymentConfig = kkiaPayService.getPaymentConfig({
    amount: employee.salaireNet,
    employeeName: employee.nomComplet,
    employeePhone: employee.telephone,
    employeeEmail: employee.email
  });

  // Gestionnaire de succès
  const handleSuccess = useCallback((response) => {
    console.log('🎉 Paiement KkiaPay réussi:', response);
    
    toast({
      title: 'Paiement réussi !',
      description: `Paiement de ${kkiaPayService.formatAmountForDisplay(employee.salaireNet)} effectué pour ${employee.nomComplet}`,
      status: 'success',
      duration: 5000,
      isClosable: true,
    });

    if (onSuccess) {
      onSuccess({
        transactionId: response.transactionId,
        status: 'SUCCESS',
        message: 'Paiement effectué avec succès',
        data: response
      });
    }
  }, [toast, employee.salaireNet, employee.nomComplet, onSuccess]);

  // Gestionnaire d'erreur
  const handleError = useCallback((error) => {
    console.error('❌ Erreur paiement KkiaPay:', error);
    
    toast({
      title: 'Paiement échoué',
      description: error.message || 'Le paiement a échoué',
      status: 'error',
      duration: 5000,
      isClosable: true,
    });

    if (onError) {
      onError({
        message: error.message || 'Paiement échoué',
        error: error
      });
    }
  }, [toast, onError]);

  // Gestionnaire en attente
  const handlePending = useCallback((response) => {
    console.log('⏳ Paiement en attente:', response);
    
    toast({
      title: 'Paiement en cours',
      description: 'Votre paiement est en cours de traitement...',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  }, [toast]);

  // Configuration des listeners au montage
  useEffect(() => {
    // Ajouter les listeners
    addSuccessListener(handleSuccess);
    addFailedListener(handleError);
    addPendingListener(handlePending);

    // Nettoyage au démontage
    return () => {
      removeKkiapayListener();
    };
  }, [handleSuccess, handleError, handlePending]);

  // Fonction pour ouvrir le widget KkiaPay
  const openPayment = () => {
    if (disabled) return;

    console.log('🚀 Ouverture du widget KkiaPay avec config:', paymentConfig);
    
    try {
      openKkiapayWidget({
        amount: paymentConfig.amount,
        phone: paymentConfig.phone,
        name: paymentConfig.name,
        email: paymentConfig.email || '',
        reason: paymentConfig.reason,
        data: paymentConfig.data,
        
        // Configuration SDK
        key: paymentConfig.publicKey,
        sandbox: paymentConfig.sandbox,
        position: paymentConfig.position,
        theme: paymentConfig.theme
      });
    } catch (error) {
      console.error('Erreur ouverture widget:', error);
      handleError(error);
    }
  };

  // Vérifier les clés avant d'afficher le bouton
  if (!kkiaPayService.validateKeys()) {
    return (
      <Box p={4} bg="red.50" borderRadius="md" border="1px solid" borderColor="red.200">
        <Text color="red.600" fontSize="sm">
          ⚠️ Configuration KkiaPay incomplète
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      {/* Informations du paiement */}
      <Box mb={4} p={3} bg="blue.50" borderRadius="md">
        <Text fontSize="sm" color="blue.700" mb={1}>
          <strong>Employé:</strong> {employee.nomComplet}
        </Text>
        <Text fontSize="sm" color="blue.700" mb={1}>
          <strong>Montant:</strong> {kkiaPayService.formatAmountForDisplay(employee.salaireNet)}
        </Text>
        {employee.telephone && (
          <Text fontSize="sm" color="blue.700">
            <strong>Téléphone:</strong> {employee.telephone}
          </Text>
        )}
      </Box>

      {/* Badge indiquant le mode */}
      <Box mb={3} display="flex" alignItems="center" gap={2}>
        <Badge colorScheme="green" variant="subtle">
          KkiaPay SDK
        </Badge>
        <Badge colorScheme="orange" variant="subtle">
          Mode Test
        </Badge>
      </Box>

      {/* Bouton personnalisé utilisant le SDK */}
      <Button
        onClick={openPayment}
        disabled={disabled}
        width="100%"
        size="lg"
        leftIcon={<span>💳</span>}
        background="linear-gradient(135deg, #00a896, #028090)"
        color="white"
        fontWeight="600"
        borderRadius="8px"
        _hover={{
          background: "linear-gradient(135deg, #028090, #005f73)",
          transform: "translateY(-2px)",
          boxShadow: "0 8px 20px rgba(0, 168, 150, 0.4)"
        }}
        _active={{
          transform: "translateY(0px)"
        }}
        _disabled={{
          background: "#e2e8f0",
          color: "#a0aec0",
          cursor: "not-allowed",
          _hover: {
            background: "#e2e8f0",
            transform: "none"
          }
        }}
        boxShadow="0 4px 12px rgba(0, 168, 150, 0.3)"
        transition="all 0.3s ease"
      >
        Payer avec KkiaPay
      </Button>
    </Box>
  );
};

export default KkiaPayPaymentButton;