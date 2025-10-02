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
import { MdAdd, MdEdit, MdDelete, MdMoreVert, MdVisibility, MdFileUpload } from 'react-icons/md';
import Card from 'components/card/Card';
import { employeeService } from 'services/employeeService';
import EmployeeModal from 'components/modals/EmployeeModal';
import EmployeeImportModal from 'components/employee/EmployeeImportModal';
import EmployeeDetailModal from 'components/employee/EmployeeDetailModal';

export default function Employees() {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [contractTypeFilter, setContractTypeFilter] = useState('all');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  
  const { isOpen: isAddOpen, onOpen: onAddOpen, onClose: onAddClose } = useDisclosure();
  const { isOpen: isImportOpen, onOpen: onImportOpen, onClose: onImportClose } = useDisclosure();
  const { isOpen: isEditOpen, onOpen: onEditOpen, onClose: onEditClose } = useDisclosure();
  const { isOpen: isViewOpen, onOpen: onViewOpen, onClose: onViewClose } = useDisclosure();
  
  const toast = useToast();
  const textColor = useColorModeValue('secondaryGray.900', 'white');
  const cardShadow = useColorModeValue('0px 18px 40px rgba(112, 144, 176, 0.12)', 'unset');

  const loadEmployees = useCallback(async () => {
    try {
      setLoading(true);
      const response = await employeeService.getAll();
      if (response.succes) {
        setEmployees(response.donnees);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les employés',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const filterEmployees = useCallback(() => {
    let filtered = employees;

    // Filtrage par recherche
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.nomComplet.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.poste.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrage par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(emp => 
        statusFilter === 'active' ? emp.actif : !emp.actif
      );
    }

    // Filtrage par type de contrat
    if (contractTypeFilter !== 'all') {
      filtered = filtered.filter(emp => emp.typeContrat === contractTypeFilter);
    }

    setFilteredEmployees(filtered);
  }, [employees, searchTerm, statusFilter, contractTypeFilter]);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  useEffect(() => {
    filterEmployees();
  }, [filterEmployees]);

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet employé ?')) {
      try {
        await employeeService.delete(employeeId);
        toast({
          title: 'Succès',
          description: 'Employé supprimé avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        loadEmployees();
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer l\'employé',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    }
  };

  const handleToggleStatus = async (employeeId, currentStatus) => {
    try {
      await employeeService.toggleStatus(employeeId, !currentStatus);
      toast({
        title: 'Succès',
        description: `Employé ${!currentStatus ? 'activé' : 'désactivé'} avec succès`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      loadEmployees();
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

  const openViewModal = (employee) => {
    setSelectedEmployee(employee);
    onViewOpen();
  };

  const openEditModal = (employee) => {
    setSelectedEmployee(employee);
    onEditOpen();
  };

  const getContractTypeLabel = (type) => {
    const labels = {
      CDI: 'CDI',
      CDD: 'CDD',
      STAGE: 'Stage',
      FREELANCE: 'Freelance',
      CONSULTANT: 'Consultant'
    };
    return labels[type] || type;
  };

  const getStatusColor = (actif) => {
    return actif ? 'green' : 'red';
  };

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      {/* Header */}
      <Card mb="20px" boxShadow={cardShadow}>
        <VStack align="stretch" spacing={4}>
          <HStack justify="space-between">
            <Text fontSize="2xl" fontWeight="700" color={textColor}>
              Gestion des Employés
            </Text>
            <HStack spacing={3}>
              <Button
                leftIcon={<MdFileUpload />}
                variant="outline"
                colorScheme="blue"
                onClick={onImportOpen}
              >
                Importer Excel
              </Button>
              <Button
                leftIcon={<MdAdd />}
                colorScheme="brand"
                onClick={onAddOpen}
              >
                Ajouter un Employé
              </Button>
            </HStack>
          </HStack>

          {/* Filtres */}
          <SimpleGrid columns={{ base: 1, md: 4 }} spacing={4}>
            <FormControl>
              <FormLabel>Rechercher</FormLabel>
              <Input
                placeholder="Nom, email, poste..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </FormControl>
            
            <FormControl>
              <FormLabel>Statut</FormLabel>
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">Tous</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Type de contrat</FormLabel>
              <Select value={contractTypeFilter} onChange={(e) => setContractTypeFilter(e.target.value)}>
                <option value="all">Tous</option>
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="STAGE">Stage</option>
                <option value="FREELANCE">Freelance</option>
                <option value="CONSULTANT">Consultant</option>
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Résultats</FormLabel>
              <Text pt={2} color="gray.500">
                {filteredEmployees.length} employé(s)
              </Text>
            </FormControl>
          </SimpleGrid>
        </VStack>
      </Card>

      {/* Table des employés */}
      <Card boxShadow={cardShadow}>
        <TableContainer>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Nom Complet</Th>
                <Th>Email</Th>
                <Th>Poste</Th>
                <Th>Type Contrat</Th>
                <Th>Salaire</Th>
                <Th>Statut</Th>
                <Th>Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {loading ? (
                <Tr>
                  <Td colSpan={7} textAlign="center">
                    Chargement...
                  </Td>
                </Tr>
              ) : filteredEmployees.length === 0 ? (
                <Tr>
                  <Td colSpan={7} textAlign="center">
                    Aucun employé trouvé
                  </Td>
                </Tr>
              ) : (
                filteredEmployees.map((employee) => (
                  <Tr key={employee.id}>
                    <Td>{employee.nomComplet}</Td>
                    <Td>{employee.email}</Td>
                    <Td>{employee.poste}</Td>
                    <Td>{getContractTypeLabel(employee.typeContrat)}</Td>
                    <Td>
                      {employee.typeContrat === 'SALAIRE_FIXE' 
                        ? `${(employee.salaireFixe || 0).toLocaleString()} FCFA/mois`
                        : employee.typeContrat === 'HONORAIRE'
                        ? `${(employee.tauxHonoraire || 0).toLocaleString()} FCFA/jour`
                        : `${(employee.tauxSalaireHoraire || 0).toLocaleString()} FCFA/h`
                      }
                    </Td>
                    <Td>
                      <Badge colorScheme={getStatusColor(employee.actif)}>
                        {employee.actif ? 'Actif' : 'Inactif'}
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
                            onClick={() => openViewModal(employee)}
                          >
                            Voir détails
                          </MenuItem>
                          <MenuItem
                            icon={<MdEdit />}
                            onClick={() => openEditModal(employee)}
                          >
                            Modifier
                          </MenuItem>
                          <MenuItem
                            onClick={() => handleToggleStatus(employee.id, employee.actif)}
                          >
                            {employee.actif ? 'Désactiver' : 'Activer'}
                          </MenuItem>
                          <MenuItem
                            icon={<MdDelete />}
                            color="red.500"
                            onClick={() => handleDeleteEmployee(employee.id)}
                          >
                            Supprimer
                          </MenuItem>
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

      {/* Modal de visualisation avec pointage */}
      <EmployeeDetailModal
        isOpen={isViewOpen}
        onClose={() => {
          onViewClose();
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
      />

      {/* Modal d'ajout/modification */}
      <EmployeeModal
        isOpen={isAddOpen || isEditOpen}
        onClose={() => {
          onAddClose();
          onEditClose();
          setSelectedEmployee(null);
        }}
        employee={isEditOpen ? selectedEmployee : null}
        onSuccess={loadEmployees}
      />

      {/* Modal d'import Excel */}
      <EmployeeImportModal
        isOpen={isImportOpen}
        onClose={onImportClose}
        onImportComplete={loadEmployees}
      />
    </Box>
  );
}
