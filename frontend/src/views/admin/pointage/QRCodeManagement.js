import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Card,
  CardBody,
  CardHeader,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  useToast,
  Avatar,
  Image,
  SimpleGrid,
  Heading,
  Alert,
  AlertIcon,
  Spinner,
  Flex,
  useColorModeValue
} from '@chakra-ui/react';
import { 
  MdQrCode, 
  MdRefresh, 
  MdDownload, 
  MdAdd,
  MdVisibility,
  MdDelete
} from 'react-icons/md';
import { pointageService } from 'services/pointageService';
import { employeeService } from 'services/employeeService';

export default function QRCodeManagement() {
  const [employes, setEmployes] = useState([]);
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedQRCode, setSelectedQRCode] = useState(null);
  const [selectedEmploye, setSelectedEmploye] = useState(null);
  const [generatingAll, setGeneratingAll] = useState(false);
  
  const { isOpen: isQRModalOpen, onOpen: onQRModalOpen, onClose: onQRModalClose } = useDisclosure();
  const { isOpen: isGenModalOpen, onOpen: onGenModalOpen, onClose: onGenModalClose } = useDisclosure();
  
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Charger les données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [employesResult, qrCodesResult] = await Promise.all([
        employeeService.getAll(),
        // On récupère les QR codes via les employés pour simplifier
        employeeService.getAll()
      ]);

      if (employesResult.succes) {
        setEmployes(employesResult.donnees);
        // Pour chaque employé, récupérer son QR code s'il existe
        await loadQRCodes(employesResult.donnees);
      }
    } catch (error) {
      console.error('Erreur chargement:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors du chargement des données',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Charger les QR codes pour chaque employé
  const loadQRCodes = async (employesList) => {
    const qrCodesData = [];
    
    for (const employe of employesList) {
      try {
        const qrResult = await pointageService.obtenirQRCode(employe.id);
        if (qrResult.succes && qrResult.donnees.existe) {
          qrCodesData.push({
            ...qrResult.donnees.qrCode,
            employe: employe,
            qrCodeImage: qrResult.donnees.qrCodeImage
          });
        } else {
          // Employé sans QR code
          qrCodesData.push({
            employe: employe,
            existe: false
          });
        }
      } catch (error) {
        console.error(`Erreur QR pour ${employe.nomComplet}:`, error);
      }
    }
    
    setQrCodes(qrCodesData);
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Générer un QR code pour un employé
  const genererQRCode = async (employeId) => {
    try {
      const result = await pointageService.genererQRCode(employeId);
      
      if (result.succes) {
        toast({
          title: 'QR Code généré',
          description: 'QR Code généré avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        await loadData();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la génération',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Renouveler un QR code
  const renouverrQRCode = async (employeId) => {
    try {
      const result = await pointageService.renouverrQRCode(employeId);
      
      if (result.succes) {
        toast({
          title: 'QR Code renouvelé',
          description: 'QR Code renouvelé avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        await loadData();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors du renouvellement',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Générer tous les QR codes
  const genererTousQRCodes = async () => {
    try {
      setGeneratingAll(true);
      const result = await pointageService.genererQRCodesPourTous();
      
      if (result.succes) {
        toast({
          title: 'Génération terminée',
          description: `${result.donnees.succes} réussies, ${result.donnees.echecs} échecs`,
          status: result.donnees.echecs > 0 ? 'warning' : 'success',
          duration: 5000,
          isClosable: true,
        });
        await loadData();
        onGenModalClose();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de la génération',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setGeneratingAll(false);
    }
  };

  // Voir le QR code
  const voirQRCode = async (employe) => {
    try {
      const result = await pointageService.obtenirQRCode(employe.id);
      if (result.succes && result.donnees.existe) {
        setSelectedQRCode({
          ...result.donnees,
          employe: employe
        });
        onQRModalOpen();
      } else {
        toast({
          title: 'QR Code non trouvé',
          description: 'Aucun QR Code pour cet employé',
          status: 'warning',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la récupération du QR Code',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Télécharger le QR code
  const telechargerQRCode = (qrCodeImage, employe) => {
    const link = document.createElement('a');
    link.href = qrCodeImage;
    link.download = `QRCode_${employe.nomComplet.replace(/\s+/g, '_')}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Téléchargement',
      description: 'QR Code téléchargé',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  if (loading) {
    return (
      <Flex justify="center" align="center" h="400px">
        <VStack>
          <Spinner size="xl" />
          <Text>Chargement des QR Codes...</Text>
        </VStack>
      </Flex>
    );
  }

  const employesAvecQR = qrCodes.filter(item => item.existe !== false);
  const employesSansQR = qrCodes.filter(item => item.existe === false);

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }} px="20px">
      <VStack spacing="20px">
        
        {/* En-tête */}
        <Flex justify="space-between" align="center" w="100%">
          <Heading size="lg">Gestion des QR Codes</Heading>
          <HStack>
            <Button
              leftIcon={<MdRefresh />}
              onClick={loadData}
              variant="outline"
              size="sm"
            >
              Actualiser
            </Button>
            <Button
              leftIcon={<MdAdd />}
              onClick={onGenModalOpen}
              colorScheme="blue"
              size="sm"
            >
              Générer Tous
            </Button>
          </HStack>
        </Flex>

        {/* Statistiques */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="100%">
          <Card bg={bgColor} borderColor={borderColor}>
            <CardBody textAlign="center">
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                  {employes.length}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Employés totaux
                </Text>
              </VStack>
            </CardBody>
          </Card>
          
          <Card bg={bgColor} borderColor={borderColor}>
            <CardBody textAlign="center">
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="green.500">
                  {employesAvecQR.length}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  QR Codes générés
                </Text>
              </VStack>
            </CardBody>
          </Card>
          
          <Card bg={bgColor} borderColor={borderColor}>
            <CardBody textAlign="center">
              <VStack>
                <Text fontSize="2xl" fontWeight="bold" color="orange.500">
                  {employesSansQR.length}
                </Text>
                <Text fontSize="sm" color="gray.600">
                  Sans QR Code
                </Text>
              </VStack>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Alerte si des employés n'ont pas de QR code */}
        {employesSansQR.length > 0 && (
          <Alert status="warning" borderRadius="lg">
            <AlertIcon />
            <VStack align="start" spacing={1}>
              <Text fontWeight="bold">
                {employesSansQR.length} employé(s) sans QR Code
              </Text>
              <Text fontSize="sm">
                Cliquez sur "Générer Tous" pour créer les QR Codes manquants
              </Text>
            </VStack>
          </Alert>
        )}

        {/* Liste des QR Codes */}
        <Card w="100%" bg={bgColor} borderColor={borderColor}>
          <CardHeader>
            <Text fontWeight="bold">QR Codes des employés</Text>
          </CardHeader>
          <CardBody pt={0}>
            <TableContainer>
              <Table variant="simple" size="sm">
                <Thead>
                  <Tr>
                    <Th>Employé</Th>
                    <Th>Statut QR Code</Th>
                    <Th>Date génération</Th>
                    <Th>Utilisations</Th>
                    <Th>Actions</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {qrCodes.map((item) => (
                    <Tr key={item.employe.id}>
                      <Td>
                        <HStack>
                          <Avatar
                            size="sm"
                            name={item.employe.nomComplet}
                            bg="blue.500"
                          />
                          <VStack align="start" spacing={0}>
                            <Text fontSize="sm" fontWeight="bold">
                              {item.employe.nomComplet}
                            </Text>
                            <Text fontSize="xs" color="gray.500">
                              {item.employe.poste}
                            </Text>
                          </VStack>
                        </HStack>
                      </Td>
                      <Td>
                        {item.existe === false ? (
                          <Badge colorScheme="red">Aucun</Badge>
                        ) : item.actif ? (
                          <Badge colorScheme="green">Actif</Badge>
                        ) : (
                          <Badge colorScheme="gray">Inactif</Badge>
                        )}
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {item.dateGeneration 
                            ? new Date(item.dateGeneration).toLocaleDateString('fr-FR')
                            : '-'
                          }
                        </Text>
                      </Td>
                      <Td>
                        <Text fontSize="sm">
                          {item.nombreUtilisations || 0}
                        </Text>
                      </Td>
                      <Td>
                        <HStack spacing={2}>
                          {item.existe === false ? (
                            <Button
                              size="xs"
                              colorScheme="blue"
                              leftIcon={<MdAdd />}
                              onClick={() => genererQRCode(item.employe.id)}
                            >
                              Générer
                            </Button>
                          ) : (
                            <>
                              <Button
                                size="xs"
                                variant="outline"
                                leftIcon={<MdVisibility />}
                                onClick={() => voirQRCode(item.employe)}
                              >
                                Voir
                              </Button>
                              <Button
                                size="xs"
                                colorScheme="orange"
                                leftIcon={<MdRefresh />}
                                onClick={() => renouverrQRCode(item.employe.id)}
                              >
                                Renouveler
                              </Button>
                            </>
                          )}
                        </HStack>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </TableContainer>
          </CardBody>
        </Card>

      </VStack>

      {/* Modal QR Code */}
      <Modal isOpen={isQRModalOpen} onClose={onQRModalClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            QR Code - {selectedQRCode?.employe?.nomComplet}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody textAlign="center">
            {selectedQRCode && (
              <VStack spacing={4}>
                <Image
                  src={selectedQRCode.qrCodeImage}
                  alt="QR Code"
                  maxW="300px"
                  border="1px solid"
                  borderColor="gray.200"
                  borderRadius="lg"
                />
                
                <VStack spacing={2} fontSize="sm" color="gray.600">
                  <Text>
                    <strong>Code:</strong> {selectedQRCode.qrCode?.codeQR}
                  </Text>
                  <Text>
                    <strong>Généré le:</strong> {
                      new Date(selectedQRCode.qrCode?.dateGeneration).toLocaleDateString('fr-FR')
                    }
                  </Text>
                  <Text>
                    <strong>Utilisations:</strong> {selectedQRCode.qrCode?.nombreUtilisations || 0}
                  </Text>
                  {selectedQRCode.qrCode?.derniereUtilisation && (
                    <Text>
                      <strong>Dernière utilisation:</strong> {
                        new Date(selectedQRCode.qrCode.derniereUtilisation).toLocaleDateString('fr-FR')
                      }
                    </Text>
                  )}
                </VStack>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="ghost" 
              mr={3} 
              onClick={onQRModalClose}
            >
              Fermer
            </Button>
            <Button
              colorScheme="blue"
              leftIcon={<MdDownload />}
              onClick={() => {
                if (selectedQRCode) {
                  telechargerQRCode(selectedQRCode.qrCodeImage, selectedQRCode.employe);
                }
              }}
            >
              Télécharger
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Modal génération tous */}
      <Modal isOpen={isGenModalOpen} onClose={onGenModalClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Générer tous les QR Codes</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Alert status="info">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text fontSize="sm">
                    Cette action va générer des QR Codes pour tous les employés actifs 
                    qui n'en ont pas encore.
                  </Text>
                  <Text fontSize="sm" fontWeight="bold">
                    {employesSansQR.length} QR Code(s) seront générés.
                  </Text>
                </VStack>
              </Alert>
              
              <Text fontSize="sm" color="gray.600">
                Les QR Codes existants ne seront pas modifiés. 
                Cette opération peut prendre quelques secondes.
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="ghost" 
              mr={3} 
              onClick={onGenModalClose}
              isDisabled={generatingAll}
            >
              Annuler
            </Button>
            <Button
              colorScheme="blue"
              onClick={genererTousQRCodes}
              isLoading={generatingAll}
              loadingText="Génération..."
            >
              Générer
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
}