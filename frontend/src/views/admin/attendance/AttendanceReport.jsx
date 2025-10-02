import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Flex,
  Icon,
  Select,
  Input,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Spinner,
  Center
} from '@chakra-ui/react';
import { MdCheckCircle, MdAccessTime, MdError, MdRefresh, MdFileDownload } from 'react-icons/md';
import attendanceService from '../../../services/attendanceService';

const AttendanceReport = () => {
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    dateDebut: new Date().toISOString().split('T')[0],
    dateFin: new Date().toISOString().split('T')[0],
    statut: ''
  });
  const toast = useToast();

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [recordsResult, statsResult] = await Promise.all([
        attendanceService.getAttendanceRecords(filters),
        attendanceService.getAttendanceStatistics(filters.dateDebut, filters.dateFin)
      ]);

      setAttendanceRecords(recordsResult.donnees || []);
      setStatistics(statsResult.donnees || null);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données de pointage',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const getStatusColor = (statut) => {
    switch (statut) {
      case 'PRESENT': return 'green';
      case 'RETARD': return 'orange';
      case 'ABSENT': return 'red';
      default: return 'gray';
    }
  };

  const getStatusLabel = (statut) => {
    switch (statut) {
      case 'PRESENT': return 'Présent';
      case 'RETARD': return 'En Retard';
      case 'ABSENT': return 'Absent';
      default: return statut;
    }
  };

  const getStatusIcon = (statut) => {
    switch (statut) {
      case 'PRESENT': return MdCheckCircle;
      case 'RETARD': return MdAccessTime;
      case 'ABSENT': return MdError;
      default: return MdCheckCircle;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Heure', 'Employé', 'Poste', 'Statut'];
    const rows = attendanceRecords.map(record => [
      formatDate(record.datePointage),
      formatTime(record.heurePointage),
      record.employe.nomComplet,
      record.employe.poste,
      getStatusLabel(record.statut)
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = \`pointages_\${filters.dateDebut}_\${filters.dateFin}.csv\`;
    link.click();

    toast({
      title: 'Export réussi',
      description: 'Le fichier CSV a été téléchargé',
      status: 'success',
      duration: 3000,
      isClosable: true
    });
  };

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <VStack spacing={6} align='stretch'>
        {/* Header */}
        <Flex justify='space-between' align='center'>
          <Text fontSize='2xl' fontWeight='bold'>Rapport de Pointage</Text>
          <HStack>
            <Button leftIcon={<MdRefresh />} onClick={loadData} variant='outline'>
              Actualiser
            </Button>
            <Button leftIcon={<MdFileDownload />} onClick={exportToCSV} colorScheme='brand'>
              Exporter CSV
            </Button>
          </HStack>
        </Flex>

        {/* Statistics */}
        {statistics && (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <Card>
              <CardBody>
                <Stat>
                  <StatLabel>Total Pointages</StatLabel>
                  <StatNumber>{statistics.total}</StatNumber>
                </Stat>
              </CardBody>
            </Card>
            <Card bg='green.50'>
              <CardBody>
                <Stat>
                  <StatLabel color='green.700'>Présents</StatLabel>
                  <StatNumber color='green.700'>{statistics.presents}</StatNumber>
                  <StatHelpText color='green.700'>{statistics.tauxPresence.toFixed(1)}%</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card bg='orange.50'>
              <CardBody>
                <Stat>
                  <StatLabel color='orange.700'>En Retard</StatLabel>
                  <StatNumber color='orange.700'>{statistics.retards}</StatNumber>
                  <StatHelpText color='orange.700'>{statistics.tauxRetard.toFixed(1)}%</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
            <Card bg='red.50'>
              <CardBody>
                <Stat>
                  <StatLabel color='red.700'>Absents</StatLabel>
                  <StatNumber color='red.700'>{statistics.absents}</StatNumber>
                  <StatHelpText color='red.700'>{statistics.tauxAbsence.toFixed(1)}%</StatHelpText>
                </Stat>
              </CardBody>
            </Card>
          </SimpleGrid>
        )}

        {/* Filters */}
        <Card>
          <CardBody>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
              <Box>
                <Text mb={2} fontSize='sm' fontWeight='medium'>Date Début</Text>
                <Input
                  type='date'
                  value={filters.dateDebut}
                  onChange={(e) => handleFilterChange('dateDebut', e.target.value)}
                />
              </Box>
              <Box>
                <Text mb={2} fontSize='sm' fontWeight='medium'>Date Fin</Text>
                <Input
                  type='date'
                  value={filters.dateFin}
                  onChange={(e) => handleFilterChange('dateFin', e.target.value)}
                />
              </Box>
              <Box>
                <Text mb={2} fontSize='sm' fontWeight='medium'>Statut</Text>
                <Select
                  value={filters.statut}
                  onChange={(e) => handleFilterChange('statut', e.target.value)}
                  placeholder='Tous les statuts'
                >
                  <option value='PRESENT'>Présent</option>
                  <option value='RETARD'>En Retard</option>
                  <option value='ABSENT'>Absent</option>
                </Select>
              </Box>
            </SimpleGrid>
          </CardBody>
        </Card>

        {/* Attendance Table */}
        <Card>
          <CardHeader>
            <Text fontSize='lg' fontWeight='bold'>Historique des Pointages</Text>
          </CardHeader>
          <CardBody>
            {loading ? (
              <Center py={10}>
                <Spinner size='xl' color='brand.500' />
              </Center>
            ) : attendanceRecords.length === 0 ? (
              <Center py={10}>
                <Text color='gray.500'>Aucun pointage trouvé pour cette période</Text>
              </Center>
            ) : (
              <Box overflowX='auto'>
                <Table variant='simple'>
                  <Thead>
                    <Tr>
                      <Th>Date</Th>
                      <Th>Heure</Th>
                      <Th>Employé</Th>
                      <Th>Poste</Th>
                      <Th>Statut</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {attendanceRecords.map((record) => (
                      <Tr key={record.id}>
                        <Td>{formatDate(record.datePointage)}</Td>
                        <Td fontWeight='medium'>{formatTime(record.heurePointage)}</Td>
                        <Td fontWeight='bold'>{record.employe.nomComplet}</Td>
                        <Td color='gray.600'>{record.employe.poste}</Td>
                        <Td>
                          <Badge
                            colorScheme={getStatusColor(record.statut)}
                            px={3}
                            py={1}
                            borderRadius='full'
                            display='inline-flex'
                            alignItems='center'
                            gap={1}
                          >
                            <Icon as={getStatusIcon(record.statut)} />
                            {getStatusLabel(record.statut)}
                          </Badge>
                        </Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              </Box>
            )}
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );
};

export default AttendanceReport;
