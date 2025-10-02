import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  Image,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Spinner,
  Center,
  Icon,
  Badge
} from '@chakra-ui/react';
import { MdQrCode, MdRefresh, MdDownload } from 'react-icons/md';
import attendanceService from '../../services/attendanceService';

const EmployeeQRCode = ({ employeeId, employeeName, isOpen, onClose }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (isOpen && employeeId) {
      loadQRCode();
    }
  }, [isOpen, employeeId]);

  const loadQRCode = async () => {
    setLoading(true);
    try {
      const result = await attendanceService.getEmployeeQRCode(employeeId);
      setQrData(result.donnees);
    } catch (error) {
      if (error.message?.includes('Aucun code QR')) {
        setQrData(null);
      } else {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger le code QR',
          status: 'error',
          duration: 5000,
          isClosable: true
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const generateQRCode = async () => {
    setGenerating(true);
    try {
      const result = await attendanceService.generateQRCode(employeeId);
      setQrData(result.donnees);
      toast({
        title: 'Succès',
        description: result.message || 'Code QR généré avec succès',
        status: 'success',
        duration: 3000,
        isClosable: true
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le code QR',
        status: 'error',
        duration: 5000,
        isClosable: true
      });
    } finally {
      setGenerating(false);
    }
  };

  const downloadQRCode = () => {
    if (!qrData?.imageQR) return;

    const link = document.createElement('a');
    link.href = qrData.imageQR;
    link.download = \`qr_\${employeeName?.replace(/\s+/g, '_')}_\${employeeId}.png\`;
    link.click();

    toast({
      title: 'Téléchargement réussi',
      description: 'Le code QR a été téléchargé',
      status: 'success',
      duration: 3000,
      isClosable: true
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size='md' isCentered>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <HStack>
            <Icon as={MdQrCode} color='brand.500' />
            <Text>Code QR de Pointage</Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          {loading ? (
            <Center py={10}>
              <Spinner size='xl' color='brand.500' />
            </Center>
          ) : qrData ? (
            <VStack spacing={4}>
              <Box textAlign='center'>
                <Text fontSize='lg' fontWeight='bold' mb={2}>
                  {qrData.employe?.nomComplet || employeeName}
                </Text>
                <Text fontSize='sm' color='gray.600' mb={4}>
                  {qrData.employe?.poste}
                </Text>
                <Badge colorScheme='green' fontSize='sm' px={3} py={1} borderRadius='full'>
                  Code QR Actif
                </Badge>
              </Box>

              <Box
                p={4}
                bg='white'
                borderRadius='lg'
                boxShadow='md'
                border='2px'
                borderColor='gray.200'
              >
                <Image
                  src={qrData.imageQR}
                  alt='Code QR Employé'
                  boxSize='300px'
                  objectFit='contain'
                />
              </Box>

              <Text fontSize='xs' color='gray.500' textAlign='center' maxW='300px'>
                Scannez ce code QR avec l'application de pointage pour enregistrer votre présence
              </Text>
            </VStack>
          ) : (
            <VStack spacing={4} py={6}>
              <Icon as={MdQrCode} boxSize={16} color='gray.300' />
              <Text color='gray.600' textAlign='center'>
                Aucun code QR n'a été généré pour cet employé
              </Text>
              <Button
                colorScheme='brand'
                leftIcon={<MdQrCode />}
                onClick={generateQRCode}
                isLoading={generating}
                loadingText='Génération...'
              >
                Générer le Code QR
              </Button>
            </VStack>
          )}
        </ModalBody>
        <ModalFooter>
          {qrData && (
            <HStack spacing={2} width='100%'>
              <Button
                flex={1}
                leftIcon={<MdRefresh />}
                onClick={generateQRCode}
                isLoading={generating}
                loadingText='Régénération...'
                variant='outline'
              >
                Régénérer
              </Button>
              <Button
                flex={1}
                leftIcon={<MdDownload />}
                onClick={downloadQRCode}
                colorScheme='brand'
              >
                Télécharger
              </Button>
            </HStack>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EmployeeQRCode;
