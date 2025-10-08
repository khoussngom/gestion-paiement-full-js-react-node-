import React, { useState } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Badge,
  Code,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Divider,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  useToast
} from '@chakra-ui/react';
import kkiaPayService from '../../services/kkiaPayService';

const KkiaPayTestComponent = () => {
  const [testResults, setTestResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const runDiagnostic = async () => {
    setIsLoading(true);
    setTestResults(null);

    try {
      // Test complet de KkiaPay
      console.log('🧪 Début du diagnostic KkiaPay...');

      // 1. Diagnostic initial
      const initialDiagnosis = kkiaPayService.diagnose();
      
      // 2. Test de chargement du script
      const loadTest = await kkiaPayService.checkAvailability();
      
      // 3. Test de paiement fictif
      let paymentTest = null;
      try {
        paymentTest = await testKkiaPayPayment();
      } catch (error) {
        paymentTest = { success: false, error: error.message };
      }

      const results = {
        timestamp: new Date().toLocaleString('fr-FR'),
        initialDiagnosis,
        loadTest,
        paymentTest,
        recommendations: generateRecommendations(initialDiagnosis, loadTest, paymentTest)
      };

      setTestResults(results);
      
      toast({
        title: 'Diagnostic terminé',
        description: `Résultats disponibles - KkiaPay ${loadTest ? '✅ OK' : '❌ KO'}`,
        status: loadTest ? 'success' : 'error',
        duration: 3000,
        isClosable: true,
      });

    } catch (error) {
      toast({
        title: 'Erreur du diagnostic',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testKkiaPayPayment = async () => {
    return new Promise((resolve, reject) => {
      const testTimeout = setTimeout(() => {
        reject(new Error('Timeout du test de paiement'));
      }, 10000);

      // Test avec des données fictives
      kkiaPayService.directApiPayment({
        amount: 1000, // 1000 FCFA pour le test
        employeeName: 'Test Employee',
        employeePhone: '+22961234567',
        onSuccess: (result) => {
          clearTimeout(testTimeout);
          resolve({ success: true, result });
        },
        onFailed: (error) => {
          clearTimeout(testTimeout);
          resolve({ success: false, error: error.message });
        }
      }).catch(error => {
        clearTimeout(testTimeout);
        reject(error);
      });
    });
  };

  const generateRecommendations = (diagnosis, loadTest, paymentTest) => {
    const recommendations = [];

    if (!diagnosis.windowObject) {
      recommendations.push({
        type: 'error',
        message: 'L\'objet window n\'est pas disponible - problème environnement navigateur'
      });
    }

    if (diagnosis.popupsBlocked) {
      recommendations.push({
        type: 'warning',
        message: 'Les pop-ups sont bloquées - autoriser les pop-ups pour KkiaPay'
      });
    }

    if (!loadTest) {
      recommendations.push({
        type: 'error',
        message: 'Le script KkiaPay ne se charge pas - vérifier la connexion internet'
      });
    }

    if (diagnosis.scripts.length === 0) {
      recommendations.push({
        type: 'info',
        message: 'Aucun script KkiaPay détecté - utilisation de l\'API directe recommandée'
      });
    }

    if (paymentTest && !paymentTest.success) {
      recommendations.push({
        type: 'warning',
        message: 'Test de paiement échoué - vérifier les paramètres et la clé publique'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        message: 'Tous les tests sont passés avec succès ! KkiaPay est opérationnel.'
      });
    }

    return recommendations;
  };

  const formatDiagnosisValue = (value) => {
    if (typeof value === 'boolean') {
      return value ? '✅ Oui' : '❌ Non';
    }
    if (typeof value === 'object' && value !== null) {
      return JSON.stringify(value, null, 2);
    }
    return String(value || 'Non défini');
  };

  const getStatusColor = (success) => {
    return success ? 'green' : 'red';
  };

  return (
    <Box p={6} maxWidth="800px" mx="auto">
      <VStack spacing={6} align="stretch">
        <Box textAlign="center">
          <Text fontSize="2xl" fontWeight="bold" mb={2}>
            🧪 Diagnostic KkiaPay
          </Text>
          <Text color="gray.600">
            Testez la connectivité et le fonctionnement de KkiaPay
          </Text>
        </Box>

        <Button
          onClick={runDiagnostic}
          isLoading={isLoading}
          loadingText="Test en cours..."
          colorScheme="blue"
          size="lg"
        >
          Lancer le diagnostic
        </Button>

        {testResults && (
          <VStack spacing={4} align="stretch">
            <Alert status={testResults.loadTest ? 'success' : 'error'}>
              <AlertIcon />
              <Box>
                <AlertTitle>
                  KkiaPay {testResults.loadTest ? 'Opérationnel' : 'Non disponible'}
                </AlertTitle>
                <AlertDescription>
                  Diagnostic effectué le {testResults.timestamp}
                </AlertDescription>
              </Box>
            </Alert>

            <Accordion allowToggle>
              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    📊 Diagnostic système
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <VStack spacing={3} align="stretch">
                    {Object.entries(testResults.initialDiagnosis).map(([key, value]) => (
                      <HStack key={key} justify="space-between">
                        <Text fontWeight="medium">{key}:</Text>
                        <Code colorScheme={typeof value === 'boolean' ? (value ? 'green' : 'red') : 'gray'}>
                          {formatDiagnosisValue(value)}
                        </Code>
                      </HStack>
                    ))}
                  </VStack>
                </AccordionPanel>
              </AccordionItem>

              <AccordionItem>
                <AccordionButton>
                  <Box flex="1" textAlign="left">
                    🔄 Test de chargement
                    <Badge ml={2} colorScheme={getStatusColor(testResults.loadTest)}>
                      {testResults.loadTest ? 'SUCCÈS' : 'ÉCHEC'}
                    </Badge>
                  </Box>
                  <AccordionIcon />
                </AccordionButton>
                <AccordionPanel pb={4}>
                  <Text>
                    Test de disponibilité du service KkiaPay: {' '}
                    <Badge colorScheme={getStatusColor(testResults.loadTest)}>
                      {testResults.loadTest ? 'Disponible' : 'Indisponible'}
                    </Badge>
                  </Text>
                </AccordionPanel>
              </AccordionItem>

              {testResults.paymentTest && (
                <AccordionItem>
                  <AccordionButton>
                    <Box flex="1" textAlign="left">
                      💳 Test de paiement
                      <Badge ml={2} colorScheme={getStatusColor(testResults.paymentTest.success)}>
                        {testResults.paymentTest.success ? 'SUCCÈS' : 'ÉCHEC'}
                      </Badge>
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <Text mb={2}>
                      Statut: <Badge colorScheme={getStatusColor(testResults.paymentTest.success)}>
                        {testResults.paymentTest.success ? 'Succès' : 'Échec'}
                      </Badge>
                    </Text>
                    {!testResults.paymentTest.success && (
                      <Code colorScheme="red" p={2} borderRadius="md" display="block">
                        {testResults.paymentTest.error}
                      </Code>
                    )}
                  </AccordionPanel>
                </AccordionItem>
              )}
            </Accordion>

            <Box>
              <Text fontSize="lg" fontWeight="bold" mb={3}>
                📋 Recommandations
              </Text>
              <VStack spacing={2} align="stretch">
                {testResults.recommendations.map((rec, index) => (
                  <Alert key={index} status={rec.type}>
                    <AlertIcon />
                    <AlertDescription>{rec.message}</AlertDescription>
                  </Alert>
                ))}
              </VStack>
            </Box>

            <Divider />

            <Box fontSize="sm" color="gray.500" textAlign="center">
              <Text>
                💡 Si KkiaPay n'est pas disponible, le système utilisera automatiquement 
                les méthodes de paiement traditionnelles.
              </Text>
            </Box>
          </VStack>
        )}
      </VStack>
    </Box>
  );
};

export default KkiaPayTestComponent;