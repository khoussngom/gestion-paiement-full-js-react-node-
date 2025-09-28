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
import { exportToCSV } from 'utils/export';

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
      if (statsResponse?.succes && statsResponse.donnees) {
        setStatistics(statsResponse.donnees);
      } else {
        // Garder les valeurs par défaut si l'API échoue
        setStatistics({
          totalEmployes: 0,
          totalSalaireBrut: 0,
          paiementsEffectues: 0,
          paiementsEnAttente: 0
        });
      }

      // Charger les paiements
      const paymentsResponse = await paymentService.getAll();
      if (paymentsResponse?.succes && paymentsResponse.donnees) {
        setPayments(paymentsResponse.donnees);
      } else {
        setPayments([]);
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

  const handleExportCSV = async () => {
    try {
      if (payments.length === 0) {
        // Export via backend si disponible
        await paymentService.exportCSV();
      } else {
        // Export local avec les données chargées
        const formattedData = payments.map(payment => ({
          'Employé': payment.employe?.nomComplet || 'N/A',
          'Montant': payment.montant,
          'Mode de paiement': getPaymentMethodLabel(payment.modePaiement),
          'Date': new Date(payment.datePaiement).toLocaleDateString('fr-FR'),
          'Statut': payment.statut,
          'Période': payment.periode || 'N/A'
        }));
        exportToCSV(formattedData, `paiements_${new Date().toISOString().split('T')[0]}.csv`);
      }
      toast({
        title: 'Export réussi',
        description: 'Les données ont été exportées avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erreur lors de l\'export:', error);
      toast({
        title: 'Erreur d\'export',
        description: 'Impossible d\'exporter les données',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleGenerateReport = async () => {
    try {
      await paymentService.generateReport();
      toast({
        title: 'Rapport généré',
        description: 'Le rapport PDF a été téléchargé avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Erreur lors de la génération du rapport:', error);
      toast({
        title: 'Erreur de génération',
        description: 'Impossible de générer le rapport PDF',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const formatCurrency = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return '0 FCFA';
    }
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
    if (!method) return 'Non défini';
    switch (method) {
      case 'ESPECES': return 'Espèces';
      case 'VIREMENT_BANCAIRE': return 'Virement';
      case 'ORANGE_MONEY': return 'Orange Money';
      case 'WAVE': return 'Wave';
      case 'AUTRE': return 'Autre';
      default: return method || 'Inconnu';
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
          value={statistics?.totalEmployes?.toString() || '0'}
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
          value={formatCurrency(statistics?.totalSalaireBrut || 0)}
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
          value={statistics?.paiementsEffectues?.toString() || '0'}
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
          value={statistics?.paiementsEnAttente?.toString() || '0'}
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
                        <Text fontWeight="bold">{payment?.employe?.nomComplet || 'N/A'}</Text>
                        <Text fontSize="sm" color="gray.500">{payment?.employe?.email || 'N/A'}</Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Text fontWeight="bold">{formatCurrency(payment?.montant)}</Text>
                    </Td>
                    <Td>
                      <Badge colorScheme="blue">
                        {getPaymentMethodLabel(payment?.modePaiement)}
                      </Badge>
                    </Td>
                    <Td>
                      {new Date(payment?.datePaiement || payment?.dateCreation || new Date()).toLocaleDateString('fr-FR')}
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
            <Button variant="outline" onClick={handleGenerateReport}>
              Générer Rapport
            </Button>
            <Button variant="outline" onClick={handleExportCSV}>
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
