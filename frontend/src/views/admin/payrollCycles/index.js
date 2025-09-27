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
  Progress,
} from '@chakra-ui/react';
import { MdAdd, MdEdit, MdDelete, MdMoreVert, MdVisibility, MdPlayArrow, MdStop } from 'react-icons/md';
import Card from 'components/card/Card';
import { payrollCycleService } from 'services/payrollCycleService';

export default function PayrollCycles() {
  const [cycles, setCycles] = useState([]);
  const [filteredCycles, setFilteredCycles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCycle, setSelectedCycle] = useState(null);
  
  // Note: Modals pour ajouter/éditer seront implémentés plus tard
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  
  const toast = useToast();
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const cardShadow = useColorModeValue('0px 18px 40px rgba(112, 144, 176, 0.12)', 'unset');

  const loadCycles = useCallback(async () => {
    try {
      setLoading(true);
      const response = await payrollCycleService.getAll();
      if (response.succes) {
        setCycles(response.donnees);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les cycles de paie',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

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

  const handleDeleteCycle = async (cycleId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce cycle de paie ?')) {
      try {
        await payrollCycleService.delete(cycleId);
        toast({
          title: 'Succès',
          description: 'Cycle de paie supprimé avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        loadCycles();
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer le cycle de paie',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleUpdateStatus = async (cycleId, newStatus) => {
    try {
      await payrollCycleService.updateStatus(cycleId, newStatus);
      toast({
        title: 'Succès',
        description: 'Statut du cycle mis à jour avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadCycles();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const openViewModal = (cycle) => {
    setSelectedCycle(cycle);
    onViewOpen();
  };

  const openEditModal = (cycle) => {
    setSelectedCycle(cycle);
    // TODO: Implémenter le modal d'édition
    console.log('Édition du cycle:', cycle);
  };

  const getStatusLabel = (status) => {
    const labels = {
      BROUILLON: 'Brouillon',
      APPROUVE: 'Approuvé',
      EN_COURS: 'En cours',
      TERMINE: 'Terminé',
      ANNULE: 'Annulé'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status) => {
    const colors = {
      BROUILLON: 'gray',
      APPROUVE: 'blue',
      EN_COURS: 'orange',
      TERMINE: 'green',
      ANNULE: 'red'
    };
    return colors[status] || 'gray';
  };

  const calculateProgress = (cycle) => {
    if (!cycle.bulletinsPaie || cycle.bulletinsPaie.length === 0) return 0;
    
    const totalBulletins = cycle.bulletinsPaie.length;
    const completedBulletins = cycle.bulletinsPaie.filter(b => b.statut === 'VALIDE').length;
    
    return (completedBulletins / totalBulletins) * 100;
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
              onClick={() => console.log('TODO: Ajouter nouveau cycle')}
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
                <option value="EN_COURS">En cours</option>
                <option value="TERMINE">Terminé</option>
                <option value="ANNULE">Annulé</option>
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
                <Th>Période</Th>
                <Th>Bulletins</Th>
                <Th>Progression</Th>
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
                      <VStack align="start" spacing={1}>
                        <Text fontSize="sm">
                          {new Date(cycle.dateDebut).toLocaleDateString()}
                        </Text>
                        <Text fontSize="sm">
                          {new Date(cycle.dateFin).toLocaleDateString()}
                        </Text>
                      </VStack>
                    </Td>
                    <Td>
                      <Text>
                        {cycle.bulletinsPaie?.length || 0} bulletin(s)
                      </Text>
                    </Td>
                    <Td>
                      <VStack align="start" spacing={2}>
                        <Progress 
                          value={calculateProgress(cycle)} 
                          size="sm" 
                          colorScheme="brand" 
                          w="100px"
                        />
                        <Text fontSize="xs">
                          {Math.round(calculateProgress(cycle))}%
                        </Text>
                      </VStack>
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
                          {cycle.statut === 'BROUILLON' && (
                            <>
                              <MenuItem
                                icon={<MdEdit />}
                                onClick={() => openEditModal(cycle)}
                              >
                                Modifier
                              </MenuItem>
                              <MenuItem
                                icon={<MdPlayArrow />}
                                onClick={() => handleUpdateStatus(cycle.id, 'APPROUVE')}
                              >
                                Approuver
                              </MenuItem>
                            </>
                          )}
                          {cycle.statut === 'APPROUVE' && (
                            <MenuItem
                              icon={<MdPlayArrow />}
                              onClick={() => handleUpdateStatus(cycle.id, 'EN_COURS')}
                            >
                              Démarrer
                            </MenuItem>
                          )}
                          {(cycle.statut === 'BROUILLON' || cycle.statut === 'APPROUVE') && (
                            <MenuItem
                              icon={<MdStop />}
                              color="red.500"
                              onClick={() => handleUpdateStatus(cycle.id, 'ANNULE')}
                            >
                              Annuler
                            </MenuItem>
                          )}
                          {cycle.statut === 'BROUILLON' && (
                            <MenuItem
                              icon={<MdDelete />}
                              color="red.500"
                              onClick={() => handleDeleteCycle(cycle.id)}
                            >
                              Supprimer
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
      <Modal isOpen={isViewOpen} onClose={onViewClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Détails du cycle de paie</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedCycle && (
              <VStack align="stretch" spacing={4}>
                <SimpleGrid columns={2} spacing={4}>
                  <Box>
                    <Text fontWeight="bold">Nom:</Text>
                    <Text>{selectedCycle.nom}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Statut:</Text>
                    <Badge colorScheme={getStatusColor(selectedCycle.statut)}>
                      {getStatusLabel(selectedCycle.statut)}
                    </Badge>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Date début:</Text>
                    <Text>{new Date(selectedCycle.dateDebut).toLocaleDateString()}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Date fin:</Text>
                    <Text>{new Date(selectedCycle.dateFin).toLocaleDateString()}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Nombre de bulletins:</Text>
                    <Text>{selectedCycle.bulletinsPaie?.length || 0}</Text>
                  </Box>
                  <Box>
                    <Text fontWeight="bold">Progression:</Text>
                    <HStack>
                      <Progress 
                        value={calculateProgress(selectedCycle)} 
                        size="sm" 
                        colorScheme="brand" 
                        w="100px"
                      />
                      <Text fontSize="sm">
                        {Math.round(calculateProgress(selectedCycle))}%
                      </Text>
                    </HStack>
                  </Box>
                </SimpleGrid>
                {selectedCycle.description && (
                  <Box>
                    <Text fontWeight="bold">Description:</Text>
                    <Text>{selectedCycle.description}</Text>
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button onClick={onViewClose}>Fermer</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}
