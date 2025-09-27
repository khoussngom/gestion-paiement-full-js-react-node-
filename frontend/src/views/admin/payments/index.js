import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  SimpleGrid,
  useColorModeValue,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Button,
  HStack,
  VStack,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
} from '@chakra-ui/react';
import { MdPayment, MdPerson, MdAttachMoney, MdTrendingUp } from 'react-icons/md';
import Card from 'components/card/Card';
import MiniStatistics from 'components/card/MiniStatistics';
import IconBox from 'components/icons/IconBox';
import { paymentService } from 'services/api';
import PaymentModal from 'components/modals/PaymentModal';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [statistics, setStatistics] = useState({
    totalEmployes: 0,
    totalSalaireBrut: 0,
    paiementsEffectues: 0,
    paiementsEnAttente: 0
  });
  const [loading, setLoading] = useState(true);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const toast = useToast();

  const textColor = useColorModeValue("secondaryGray.900", "white");
  const brandColor = useColorModeValue("brand.500", "white");
  const boxBg = useColorModeValue("secondaryGray.300", "whiteAlpha.100");

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Charger les statistiques
      const statsResponse = await paymentService.getStatistics();
      if (statsResponse.succes) {
        setStatistics(statsResponse.donnees);
      }

      // Charger les paiements
      const paymentsResponse = await paymentService.getAll();
      if (paymentsResponse.succes) {
        setPayments(paymentsResponse.donnees);
      }
      
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données des paiements',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF', // Franc CFA
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PAYE': return 'green';
      case 'EN_ATTENTE': return 'orange';
      case 'PARTIEL': return 'yellow';
      default: return 'gray';
    }
  };

  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'ESPECES': return 'Espèces';
      case 'VIREMENT_BANCAIRE': return 'Virement';
      case 'ORANGE_MONEY': return 'Orange Money';
      case 'WAVE': return 'Wave';
      case 'AUTRE': return 'Autre';
      default: return method;
    }
  };

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      {/* Statistics Cards */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 2, "2xl": 4 }} gap="20px" mb="20px">
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg="linear-gradient(90deg, #4481EB 0%, #04BEFE 100%)"
              icon={<MdPerson color="white" size="28px" />}
            />
          }
          name="Employés Actifs"
          value={statistics.totalEmployes.toString()}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<MdAttachMoney color={brandColor} size="32px" />}
            />
          }
          name="Masse Salariale"
          value={formatCurrency(statistics.totalSalaireBrut)}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg="linear-gradient(90deg, #4481EB 0%, #04BEFE 100%)"
              icon={<MdPayment color="white" size="28px" />}
            />
          }
          name="Paiements Effectués"
          value={statistics.paiementsEffectues.toString()}
        />
        <MiniStatistics
          startContent={
            <IconBox
              w="56px"
              h="56px"
              bg={boxBg}
              icon={<MdTrendingUp color={brandColor} size="32px" />}
            />
          }
          name="En Attente"
          value={statistics.paiementsEnAttente.toString()}
        />
      </SimpleGrid>

      {/* Payments Table */}
      <Card px="0px" mb="20px">
        <Box px="25px" mb="8px">
          <Text
            color={textColor}
            fontSize="22px"
            fontWeight="700"
            lineHeight="100%"
          >
            Historique des Paiements
          </Text>
        </Box>
        
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Employé</Th>
                <Th>Montant</Th>
                <Th>Mode de Paiement</Th>
                <Th>Date</Th>
                <Th>Statut</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {payments.length === 0 ? (
                <Tr>
                  <Td colSpan={6} textAlign="center" py="20px">
                    <VStack>
                      <Text color="gray.500">Aucun paiement effectué pour le moment</Text>
                      <Text fontSize="sm" color="gray.400">
                        Les paiements apparaîtront ici une fois effectués
                      </Text>
                    </VStack>
                  </Td>
                </Tr>
              ) : (
                payments.map((payment) => (
                  <Tr key={payment.id}>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">{payment.employe?.nomComplet}</Text>
                        <Text fontSize="sm" color="gray.500">{payment.employe?.email}</Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Text fontWeight="bold">{formatCurrency(payment.montant)}</Text>
                    </Td>
                    <Td>
                      <Badge colorScheme="blue">
                        {getPaymentMethodLabel(payment.modePaiement)}
                      </Badge>
                    </Td>
                    <Td>
                      {new Date(payment.datePaiement || payment.dateCreation).toLocaleDateString('fr-FR')}
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor('PAYE')}>
                        Payé
                      </Badge>
                    </Td>
                    <Td>
                      <Button size="sm" variant="ghost">
                        Détails
                      </Button>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Card>

      {/* Action Buttons */}
      <Card p="20px">
        <VStack spacing={4} align="start">
          <Text fontSize="lg" fontWeight="bold">Actions Rapides</Text>
          <HStack spacing={4}>
            <Button 
              colorScheme="brand"
              onClick={() => setIsPaymentModalOpen(true)}
            >
              Effectuer un Paiement
            </Button>
            <Button variant="outline">
              Générer Rapport
            </Button>
            <Button variant="outline">
              Exporter Données
            </Button>
          </HStack>
        </VStack>
      </Card>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        onSuccess={() => {
          setIsPaymentModalOpen(false);
          loadData(); // Recharger les données après un paiement réussi
        }}
      />
    </Box>
  );
}
