import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  SimpleGrid,
  useColorModeValue,
  Button,
  useDisclosure,
  Text,
  Badge,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Input,
  Select,
  HStack,
  VStack,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  useToast,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,

} from '@chakra-ui/react';
import { MdAdd, MdEdit, MdMoreVert, MdVisibility, MdPlayArrow, MdStop } from 'react-icons/md';
import Card from 'components/card/Card';
import payrollCycleService, { TypeCyclePaie, StatutCyclePaie, StatutBulletinPaie } from 'services/payrollCycleService';

export default function PayrollCycles() {
  const [cycles, setCycles] = useState([]);
  const [filteredCycles, setFilteredCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCycle, setSelectedCycle] = useState(null);
  
  // Modals
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure();
  
  // États pour la création de cycle
  const [newCycle, setNewCycle] = useState({
    nom: '',
    typeCycle: TypeCyclePaie.MENSUEL,
    dateDebut: '',
    dateFin: ''
  });
  const [creating, setCreating] = useState(false);

  const toast = useToast();

  // Fonction helper pour calculer la durée en jours
  const calculateDaysDifference = (startDate, endDate) => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 pour inclure le jour de fin
    return diffDays;
  };

  // Fonction pour générer des dates suggérées
  const generateSuggestedDates = (typeCycle) => {
    const today = new Date();
    let startDate, endDate;
    
    if (typeCycle === TypeCyclePaie.MENSUEL) {
      // Premier jour du mois courant
      startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      // Dernier jour du mois courant
      endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    } else {
      // Pour hebdomadaire, prendre lundi de cette semaine
      const dayOfWeek = today.getDay();
      const monday = new Date(today);
      monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      startDate = monday;
      
      // Dimanche de cette semaine
      endDate = new Date(monday);
      endDate.setDate(monday.getDate() + 6);
    }
    
    return {
      dateDebut: startDate.toISOString().split('T')[0],
      dateFin: endDate.toISOString().split('T')[0]
    };
  };

  // Fonction pour appliquer les dates suggérées
  const applySuggestedDates = () => {
    const suggested = generateSuggestedDates(newCycle.typeCycle);
    setNewCycle({
      ...newCycle,
      dateDebut: suggested.dateDebut,
      dateFin: suggested.dateFin
    });
  };

  // Fonction pour effectuer un paiement et imprimer le reçu
  const handlePayEmployee = async (employe, montant, modePaiement = 'ESPECES') => {
    try {
      // Créer le paiement via l'API
      const paiementData = {
        bulletinPaieId: employe.bulletinId,
        employeId: employe.id,
        montant: montant || employe.salaireNet,
        modePaiement: modePaiement,
        notes: `Paiement cycle ${selectedCycle.cycle?.nom}`,
        datePaiement: new Date().toISOString()
      };

      const response = await fetch('http://localhost:3001/api/paiements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify(paiementData)
      });

      if (response.ok) {
        const result = await response.json();
        
        // Mettre à jour le statut de l'employé à PAYE
        await handleUpdateEmployeeStatus(
          selectedCycle.cycle.id,
          employe.bulletinId,
          'PAYE'
        );

        // Imprimer le reçu
        await imprimerRecu(employe, result.donnees || paiementData);

        toast({
          title: 'Succès',
          description: `Paiement effectué pour ${employe.nomComplet}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error('Erreur lors du paiement');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'effectuer le paiement',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Fonction pour imprimer un reçu
  const imprimerRecu = async (employe, paiement) => {
    const recuContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Reçu de Paiement</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
            .amount { font-size: 24px; font-weight: bold; text-align: center; margin: 20px 0; }
            .footer { margin-top: 40px; text-align: center; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>REÇU DE PAIEMENT</h1>
            <p>Marakhib Global</p>
            <p>Date: ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          
          <div class="info-grid">
            <div>
              <h3>Informations Employé:</h3>
              <p><strong>Nom:</strong> ${employe.nomComplet}</p>
              <p><strong>Poste:</strong> ${employe.poste}</p>
              <p><strong>Type Contrat:</strong> ${employe.typeContrat}</p>
            </div>
            <div>
              <h3>Détails du Paiement:</h3>
              <p><strong>Cycle:</strong> ${selectedCycle.cycle?.nom}</p>
              <p><strong>Période:</strong> ${new Date(selectedCycle.cycle?.dateDebut).toLocaleDateString('fr-FR')} - ${new Date(selectedCycle.cycle?.dateFin).toLocaleDateString('fr-FR')}</p>
              <p><strong>Mode:</strong> ${paiement.modePaiement}</p>
            </div>
          </div>
          
          <div class="amount">
            Montant Payé: ${(paiement.montant || employe.salaireNet).toLocaleString()} FCFA
          </div>
          
          <div class="footer">
            <p>Signature: ________________________</p>
            <p style="margin-top: 20px; font-size: 12px;">
              Reçu généré automatiquement le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}
            </p>
          </div>
        </body>
      </html>
    `;

    // Créer une nouvelle fenêtre pour l'impression
    const printWindow = window.open('', '_blank');
    printWindow.document.write(recuContent);
    printWindow.document.close();
    
    // Attendre que le contenu se charge puis imprimer
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  // Nouvelles fonctions pour les bulletins de salaire
  const handleDownloadBulletin = async (bulletinId) => {
    try {
      await payrollCycleService.downloadBulletinPDF(bulletinId);
      toast({
        title: 'Succès',
        description: 'Bulletin de salaire téléchargé avec succès',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de télécharger le bulletin',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handlePreviewBulletin = async (bulletinId) => {
    try {
      await payrollCycleService.previewBulletinPDF(bulletinId);
      toast({
        title: 'Succès',
        description: 'Bulletin ouvert dans un nouvel onglet',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible d\'ouvrir le bulletin',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handlePayerViaBulletin = async (employe) => {
    try {
      // Demander le mode de paiement (simple prompt pour demo)
      const modePaiement = window.prompt(
        'Mode de paiement:\n- ESPECES\n- VIREMENT_BANCAIRE\n- ORANGE_MONEY\n- WAVE\n\nEntrez votre choix:',
        'ESPECES'
      );

      if (!modePaiement) return;

      // Valider le paiement via le bulletin
      await payrollCycleService.payerBulletin(employe.bulletinId, modePaiement.toUpperCase());
      
      toast({
        title: 'Succès',
        description: 'Paiement validé avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Recharger les détails du cycle
      if (selectedCycle?.cycle?.id) {
        const response = await payrollCycleService.getCycleWithEmployees(selectedCycle.cycle.id);
        if (response.succes) {
          setSelectedCycle(response.donnees);
        }
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de valider le paiement',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const cardShadow = useColorModeValue('0px 18px 40px rgba(112, 144, 176, 0.12)', 'unset');

  const loadCycles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await payrollCycleService.getAllCycles();
      if (response.succes) {
        // Formater les cycles pour l'affichage
        const formattedCycles = response.donnees.map(cycle => 
          payrollCycleService.formatCycleForDisplay(cycle)
        );
        setCycles(formattedCycles);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de charger les cycles de paie',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const handleCreateCycle = async () => {
    try {
      setCreating(true);
      
      // Validation simple
      if (!newCycle.nom || !newCycle.dateDebut || !newCycle.dateFin) {
        toast({
          title: 'Erreur',
          description: 'Veuillez remplir tous les champs obligatoires',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }
      
      // Créer le cycle
      const response = await payrollCycleService.createCycle(newCycle);
      if (response.succes) {
        toast({
          title: 'Succès',
          description: 'Cycle de paie créé avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
        // Réinitialiser le formulaire
        setNewCycle({
          nom: '',
          typeCycle: TypeCyclePaie.MENSUEL,
          dateDebut: '',
          dateFin: ''
        });
        
        onCreateClose();
        loadCycles(); // Recharger la liste
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer le cycle de paie',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setCreating(false);
    }
  };

  const filterCycles = useCallback(() => {
    let filtered = cycles;

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(cycle => 
        cycle.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cycle.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(cycle => cycle.statut === statusFilter);
    }

    setFilteredCycles(filtered);
  }, [cycles, searchTerm, statusFilter]);

  useEffect(() => {
    loadCycles();
  }, [loadCycles]);

  useEffect(() => {
    filterCycles();
  }, [filterCycles]);

  const handleApproveCycle = async (cycleId) => {
    if (window.confirm('Êtes-vous sûr de vouloir approuver ce cycle de paie ?')) {
      try {
        const response = await payrollCycleService.approveCycle(cycleId);
        toast({
          title: 'Succès',
          description: response.message || 'Cycle de paie approuvé avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        loadCycles();
      } catch (error) {
        toast({
          title: 'Erreur',
          description: error.message || 'Impossible d\'approuver le cycle de paie',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleCloseCycle = async (cycleId) => {
    if (window.confirm('Êtes-vous sûr de vouloir clôturer ce cycle de paie ?')) {
      try {
        const response = await payrollCycleService.closeCycle(cycleId);
        toast({
          title: 'Succès',
          description: response.message || 'Cycle de paie clôturé avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        loadCycles();
      } catch (error) {
        toast({
          title: 'Erreur',
          description: error.message || 'Impossible de clôturer le cycle de paie',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleUpdateEmployeeStatus = async (cycleId, bulletinId, newStatus) => {
    try {
      await payrollCycleService.updateEmployeePaymentStatus(cycleId, bulletinId, newStatus);
      toast({
        title: 'Succès',
        description: 'Statut de paiement mis à jour avec succès',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
      
      // Recharger les détails du cycle pour mettre à jour l'affichage
      if (selectedCycle?.cycle?.id) {
        const response = await payrollCycleService.getCycleWithEmployees(selectedCycle.cycle.id);
        if (response.succes) {
          setSelectedCycle(response.donnees);
        }
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de mettre à jour le statut',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const openViewModal = async (cycle) => {
    try {
      setLoading(true);
      const response = await payrollCycleService.getCycleWithEmployees(cycle.id);
      if (response.succes) {
        setSelectedCycle(response.donnees);
        onViewOpen();
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de charger les détails du cycle',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (cycle) => {
    setSelectedCycle(cycle);
    // TODO: Implémenter le modal d'édition
    console.log('Édition du cycle:', cycle);
  };

  const getStatusLabel = (status) => {
    return payrollCycleService.getStatusLabel(status);
  };

  const getStatusColor = (status) => {
    return payrollCycleService.getStatusColor(status);
  };

  const calculateProgress = async (cycle) => {
    try {
      const stats = await payrollCycleService.getCycleStatistics(cycle.id);
      return stats.succes ? stats.donnees.pourcentageCompletion : 0;
    } catch (error) {
      return 0;
    }
  };

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      {/* Header */}
      <Card mb="20px" boxShadow={cardShadow}>
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between">
            <Text fontSize="2xl" fontWeight="700" color={textColor}>
              Cycles de Paie
            </Text>
            <Button
              leftIcon={<MdAdd />}
              colorScheme="brand"
              onClick={onCreateOpen}
            >
              Nouveau Cycle
            </Button>
          </HStack>

          {/* Filtres */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <FormControl>
              <FormLabel>Rechercher</FormLabel>
              <Input
                placeholder="Nom du cycle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Statut</FormLabel>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Tous</option>
                <option value="BROUILLON">Brouillon</option>
                <option value="APPROUVE">Approuvé</option>
                <option value="CLOTURE">Clôturé</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Résultats</FormLabel>
              <Text pt={2} color="gray.500">
                {filteredCycles.length} cycle(s)
              </Text>
            </FormControl>
          </SimpleGrid>
        </VStack>
      </Card>

      {/* Table des cycles */}
      <Card boxShadow={cardShadow}>
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Nom</Th>
                <Th>Type</Th>
                <Th>Période</Th>
                <Th>Employés</Th>
                <Th>Statut</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={6} textAlign="center">
                    Chargement...
                  </Td>
                </Tr>
              ) : filteredCycles.length === 0 ? (
                <Tr>
                  <Td colSpan={6} textAlign="center">
                    Aucun cycle trouvé
                  </Td>
                </Tr>
              ) : (
                filteredCycles.map((cycle) => (
                  <Tr key={cycle.id}>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontWeight="bold">{cycle.nom}</Text>
                        {cycle.description && (
                          <Text fontSize="sm" color="gray.500">
                            {cycle.description}
                          </Text>
                        )}
                      </VStack>
                    </Td>
                    <Td>
                      <Badge colorScheme="purple" size="sm">
                        {cycle.typeCycleLabel}
                      </Badge>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm">
                          {cycle.dateDebut}
                        </Text>
                        <Text fontSize="sm">
                          {cycle.dateFin}
                        </Text>
                        <Text fontSize="xs" color="gray.500">
                          ({cycle.duree} jours)
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Text fontSize="sm">
                        À charger
                      </Text>
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(cycle.statut)}>
                        {getStatusLabel(cycle.statut)}
                      </Badge>
                    </Td>
                    <Td>
                      <Menu>
                        <MenuButton
                          as={IconButton}
                          icon={<MdMoreVert />}
                          variant="ghost"
                          size="sm"
                        />
                        <MenuList>
                          <MenuItem
                            icon={<MdVisibility />}
                            onClick={() => openViewModal(cycle)}
                          >
                            Voir détails
                          </MenuItem>
                          {cycle.canEdit && (
                            <MenuItem
                              icon={<MdEdit />}
                              onClick={() => openEditModal(cycle)}
                            >
                              Modifier
                            </MenuItem>
                          )}
                          {cycle.canApprove && (
                            <MenuItem
                              icon={<MdPlayArrow />}
                              onClick={() => handleApproveCycle(cycle.id)}
                            >
                              Approuver
                            </MenuItem>
                          )}
                          {cycle.canClose && (
                            <MenuItem
                              icon={<MdStop />}
                              onClick={() => handleCloseCycle(cycle.id)}
                            >
                              Clôturer
                            </MenuItem>
                          )}
                        </MenuList>
                      </Menu>
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </TableContainer>
      </Card>

      {/* Modal de visualisation */}
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="4xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Détails du cycle de paie</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedCycle && (
              <VStack align="stretch" spacing={6}>
                {/* Informations du cycle */}
                <Card p={4}>
                  <Text fontSize="lg" fontWeight="bold" mb={4}>Informations générales</Text>
                  <SimpleGrid columns={3} spacing={4}>
                    <Box>
                      <Text fontWeight="bold">Nom:</Text>
                      <Text>{selectedCycle.cycle?.nom}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Type:</Text>
                      <Text>{payrollCycleService.getTypeLabel(selectedCycle.cycle?.typeCycle)}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Statut:</Text>
                      <Badge colorScheme={getStatusColor(selectedCycle.cycle?.statut)}>
                        {getStatusLabel(selectedCycle.cycle?.statut)}
                      </Badge>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Date début:</Text>
                      <Text>{new Date(selectedCycle.cycle?.dateDebut).toLocaleDateString('fr-FR')}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Date fin:</Text>
                      <Text>{new Date(selectedCycle.cycle?.dateFin).toLocaleDateString('fr-FR')}</Text>
                    </Box>
                    <Box>
                      <Text fontWeight="bold">Durée:</Text>
                      <Text>{payrollCycleService.calculateCycleDuration(selectedCycle.cycle?.dateDebut, selectedCycle.cycle?.dateFin)} jours</Text>
                    </Box>
                  </SimpleGrid>
                </Card>

                {/* Liste des employés */}
                <Card p={4}>
                  <Text fontSize="lg" fontWeight="bold" mb={4}>
                    Employés ({selectedCycle.employes?.length || 0})
                  </Text>
                  {selectedCycle.employes && selectedCycle.employes.length > 0 ? (
                    <TableContainer>
                      <Table variant="simple" size="sm">
                        <Thead>
                          <Tr>
                            <Th>Employé</Th>
                            <Th>Poste</Th>
                            <Th>Type contrat</Th>
                            <Th>Salaire brut</Th>
                            <Th>Salaire net</Th>
                            <Th>Statut</Th>
                            <Th>Actions</Th>
                          </Tr>
                        </Thead>
                        <Tbody>
                          {selectedCycle.employes.map((employe) => (
                            <Tr key={employe.id}>
                              <Td>
                                <Text fontWeight="medium">{employe.nomComplet}</Text>
                              </Td>
                              <Td>{employe.poste}</Td>
                              <Td>
                                <Badge size="sm" colorScheme="blue">
                                  {employe.typeContrat}
                                </Badge>
                              </Td>
                              <Td>{employe.salaireBrut.toLocaleString()} FCFA</Td>
                              <Td>{employe.salaireNet.toLocaleString()} FCFA</Td>
                              <Td>
                                <Badge 
                                  colorScheme={payrollCycleService.getPaymentStatusColor(employe.statut)}
                                  size="sm"
                                >
                                  {payrollCycleService.getPaymentStatusLabel(employe.statut)}
                                </Badge>
                              </Td>
                              <Td>
                                <HStack spacing={1}>
                                  {/* Télécharger le bulletin PDF */}
                                  <Button
                                    size="sm"
                                    colorScheme="blue"
                                    variant="outline"
                                    leftIcon={<span>📄</span>}
                                    onClick={() => handleDownloadBulletin(employe.bulletinId)}
                                    title="Télécharger le bulletin PDF"
                                  >
                                    PDF
                                  </Button>

                                  {/* Payer via bulletin */}
                                  {employe.statut !== 'PAYE' && (
                                    <Button
                                      size="sm"
                                      colorScheme="green"
                                      leftIcon={<span>💰</span>}
                                      onClick={() => handlePayerViaBulletin(employe)}
                                      title="Valider le paiement via bulletin"
                                    >
                                      Payer
                                    </Button>
                                  )}
                                  
                                  {/* Menu d'options supplémentaires */}
                                  <Menu>
                                    <MenuButton
                                      as={IconButton}
                                      icon={<MdMoreVert />}
                                      size="sm"
                                      variant="ghost"
                                    />
                                    <MenuList>
                                      <MenuItem 
                                        icon={<span>�️</span>}
                                        onClick={() => handlePreviewBulletin(employe.bulletinId)}
                                      >
                                        Prévisualiser bulletin
                                      </MenuItem>
                                      <MenuItem 
                                        icon={<span>✏️</span>}
                                        onClick={() => handleUpdateEmployeeStatus(
                                          selectedCycle.cycle.id,
                                          employe.bulletinId,
                                          employe.statut === 'EN_ATTENTE' ? 'PARTIEL' : 
                                          employe.statut === 'PARTIEL' ? 'PAYE' : 'EN_ATTENTE'
                                        )}
                                      >
                                        Changer statut
                                      </MenuItem>
                                    </MenuList>
                                  </Menu>
                                </HStack>
                              </Td>
                            </Tr>
                          ))}
                        </Tbody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Text color="gray.500" textAlign="center" py={4}>
                      Aucun employé dans ce cycle
                    </Text>
                  )}
                </Card>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onViewClose}>Fermer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal de création de cycle */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Créer un nouveau cycle de paie</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Nom du cycle</FormLabel>
                <Input
                  placeholder="Ex: Paie Octobre 2024"
                  value={newCycle.nom}
                  onChange={(e) => setNewCycle({...newCycle, nom: e.target.value})}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Type de cycle</FormLabel>
                <Select
                  value={newCycle.typeCycle}
                  onChange={(e) => setNewCycle({...newCycle, typeCycle: e.target.value})}
                >
                  <option value={TypeCyclePaie.MENSUEL}>Mensuel (employés salariés)</option>
                  <option value={TypeCyclePaie.HEBDOMADAIRE}>Hebdomadaire (employés honoraires)</option>
                </Select>
              </FormControl>

              <HStack width="100%">
                <FormControl isRequired>
                  <FormLabel>Date de début</FormLabel>
                  <Input
                    type="date"
                    value={newCycle.dateDebut}
                    onChange={(e) => setNewCycle({...newCycle, dateDebut: e.target.value})}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Date de fin</FormLabel>
                  <Input
                    type="date"
                    value={newCycle.dateFin}
                    onChange={(e) => setNewCycle({...newCycle, dateFin: e.target.value})}
                  />
                </FormControl>
              </HStack>

              {/* Affichage de la durée calculée */}
              {newCycle.dateDebut && newCycle.dateFin && (
                <Box width="100%" p={2} borderRadius="md" bg={
                  (() => {
                    const days = calculateDaysDifference(newCycle.dateDebut, newCycle.dateFin);
                    if (newCycle.typeCycle === TypeCyclePaie.MENSUEL) {
                      return (days >= 28 && days <= 31) ? "green.50" : "red.50";
                    } else {
                      return days === 7 ? "green.50" : "red.50";
                    }
                  })()
                }>
                  <Text fontSize="sm" fontWeight="bold" color={
                    (() => {
                      const days = calculateDaysDifference(newCycle.dateDebut, newCycle.dateFin);
                      if (newCycle.typeCycle === TypeCyclePaie.MENSUEL) {
                        return (days >= 28 && days <= 31) ? "green.700" : "red.700";
                      } else {
                        return days === 7 ? "green.700" : "red.700";
                      }
                    })()
                  }>
                    Durée du cycle : {calculateDaysDifference(newCycle.dateDebut, newCycle.dateFin)} jour(s)
                  </Text>
                  <Text fontSize="xs" color="gray.600">
                    {newCycle.typeCycle === TypeCyclePaie.MENSUEL 
                      ? "Requis : entre 28 et 31 jours" 
                      : "Requis : exactement 7 jours"
                    }
                  </Text>
                </Box>
              )}

              {/* Bouton de suggestion automatique */}
              <Button
                variant="outline"
                colorScheme="blue"
                size="sm"
                onClick={applySuggestedDates}
              >
                📅 Utiliser les dates suggérées ({newCycle.typeCycle === TypeCyclePaie.MENSUEL ? 'mois courant' : 'semaine courante'})
              </Button>

              <Box width="100%" p={3} bg="blue.50" borderRadius="md" fontSize="sm">
                <Text fontWeight="bold" color="blue.800">ℹ️ Information</Text>
                <Text color="blue.700">
                  Les employés seront automatiquement ajoutés au cycle selon leur type de contrat :
                </Text>
                <Text color="blue.700">
                  • <strong>Mensuel</strong> : Employés avec salaire fixe (durée : 28-31 jours)
                </Text>
                <Text color="blue.700">
                  • <strong>Hebdomadaire</strong> : Employés avec honoraires (durée : 7 jours exactement)
                </Text>
              </Box>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateClose}>
              Annuler
            </Button>
            <Button
              colorScheme="brand"
              onClick={handleCreateCycle}
              isLoading={creating}
              loadingText="Création..."
            >
              Créer le cycle
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
