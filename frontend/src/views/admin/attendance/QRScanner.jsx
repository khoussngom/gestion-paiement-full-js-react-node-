import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  useToast,
  Card,
  CardBody,
  Badge,
  Icon,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { MdQrCodeScanner, MdCheckCircle, MdError, MdAccessTime } from 'react-icons/md';
import attendanceService from '../../../services/attendanceService';

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [lastScan, setLastScan] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanner, setScanner] = useState(null);
  const toast = useToast();

  useEffect(() => {
    const html5QrcodeScanner = new Html5QrcodeScanner(
      'qr-reader',
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    );

    setScanner(html5QrcodeScanner);

    return () => {
      if (html5QrcodeScanner) {
        html5QrcodeScanner.clear().catch(err => console.error(err));
      }
    };
  }, []);

  const handleScan = async (decodedText) => {
    if (scanning) return;
    
    setScanning(true);
    setScanResult(null);

    try {
      let latitude, longitude;
      if (navigator.geolocation) {
        try {
          const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          latitude = position.coords.latitude.toString();
          longitude = position.coords.longitude.toString();
        } catch (err) {
          console.log('Geolocation not available:', err);
        }
      }

      const result = await attendanceService.scanQRCode(decodedText, latitude, longitude);
      
      setScanResult({
        success: true,
        data: result.donnees,
        message: result.message
      });

      setLastScan(new Date());

      toast({
        title: 'Pointage enregistré',
        description: \`\${result.donnees.employe.nomComplet} - \${result.donnees.statut}\`,
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top'
      });

      setTimeout(() => {
        setScanResult(null);
        setScanning(false);
      }, 3000);

    } catch (error) {
      setScanResult({
        success: false,
        message: error.message || 'Erreur lors du scan',
        error: error
      });

      toast({
        title: 'Erreur de scan',
        description: error.message || 'Code QR invalide ou expiré',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top'
      });

      setTimeout(() => {
        setScanResult(null);
        setScanning(false);
      }, 3000);
    }
  };

  const startScanning = () => {
    if (scanner) {
      scanner.render(handleScan, (error) => {
        if (error.includes('NotFoundException')) return;
        console.log('QR scan error:', error);
      });
    }
  };

  const stopScanning = () => {
    if (scanner) {
      scanner.clear().catch(err => console.error(err));
    }
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
      default: return MdQrCodeScanner;
    }
  };

  return (
    <Box pt={{ base: '130px', md: '80px', xl: '80px' }}>
      <VStack spacing={6} align='stretch'>
        <Card>
          <CardBody>
            <VStack spacing={4} align='center'>
              <Icon as={MdQrCodeScanner} w={16} h={16} color='brand.500' />
              <Text fontSize='2xl' fontWeight='bold'>Scanner de Pointage</Text>
              <Text fontSize='md' color='gray.600' textAlign='center'>
                Scannez le code QR de l'employé pour enregistrer son pointage
              </Text>
            </VStack>
          </CardBody>
        </Card>

        <Card>
          <CardBody>
            <VStack spacing={4}>
              <Box id='qr-reader' width='100%' maxW='500px' mx='auto' borderRadius='lg' overflow='hidden' />
              
              <HStack spacing={4}>
                <Button colorScheme='brand' onClick={startScanning} leftIcon={<MdQrCodeScanner />} size='lg'>
                  Démarrer le scan
                </Button>
                <Button variant='outline' onClick={stopScanning} size='lg'>Arrêter</Button>
              </HStack>

              {scanning && !scanResult && (
                <HStack>
                  <Spinner size='sm' />
                  <Text fontSize='sm' color='gray.600'>Traitement du scan...</Text>
                </HStack>
              )}
            </VStack>
          </CardBody>
        </Card>

        {scanResult && (
          <Card>
            <CardBody>
              {scanResult.success ? (
                <Alert status='success' variant='subtle' flexDirection='column' alignItems='center' justifyContent='center' textAlign='center' borderRadius='lg' p={6}>
                  <Icon as={getStatusIcon(scanResult.data.statut)} boxSize='40px' mr={0} color={\`\${getStatusColor(scanResult.data.statut)}.500\`} />
                  <AlertTitle mt={4} mb={1} fontSize='lg'>Pointage Enregistré</AlertTitle>
                  <AlertDescription maxWidth='sm'>
                    <VStack spacing={2} mt={2}>
                      <Text fontWeight='bold' fontSize='xl'>{scanResult.data.employe.nomComplet}</Text>
                      <Text fontSize='md' color='gray.600'>{scanResult.data.employe.poste}</Text>
                      <Badge colorScheme={getStatusColor(scanResult.data.statut)} fontSize='md' px={4} py={2} borderRadius='full'>
                        {getStatusLabel(scanResult.data.statut)}
                      </Badge>
                      <Text fontSize='sm' color='gray.500'>{new Date(scanResult.data.heurePointage).toLocaleTimeString('fr-FR')}</Text>
                    </VStack>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert status='error' variant='subtle' flexDirection='column' alignItems='center' justifyContent='center' textAlign='center' borderRadius='lg' p={6}>
                  <AlertIcon boxSize='40px' mr={0} />
                  <AlertTitle mt={4} mb={1} fontSize='lg'>Erreur de Scan</AlertTitle>
                  <AlertDescription maxWidth='sm'>{scanResult.message || 'Code QR invalide ou expiré'}</AlertDescription>
                </Alert>
              )}
            </CardBody>
          </Card>
        )}

        {lastScan && (
          <Card>
            <CardBody>
              <Flex justify='space-between' align='center'>
                <Text fontSize='sm' color='gray.600'>Dernier scan:</Text>
                <Text fontSize='sm' fontWeight='bold'>{lastScan.toLocaleTimeString('fr-FR')}</Text>
              </Flex>
            </CardBody>
          </Card>
        )}
      </VStack>
    </Box>
  );
};

export default QRScanner;
