import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Button,
  Text,
  Card,
  CardBody,
  CardHeader,
  Avatar,
  Badge,
  Alert,
  AlertIcon,
  Spinner,
  useToast,
  Heading,
  Divider,
  Flex,
  useColorModeValue,
  Container
} from '@chakra-ui/react';
import { MdQrCodeScanner, MdCamera, MdStop } from 'react-icons/md';
import { pointageService } from 'services/pointageService';

export default function VigileScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cameraPermission, setCameraPermission] = useState(null);
  const [stream, setStream] = useState(null);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  
  // Démarrer la caméra
  const startCamera = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Arrêter le flux existant s'il y en a un
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Caméra arrière si disponible
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      console.log('Demande d\'accès caméra...');
      const newStream = await navigator.mediaDevices.getUserMedia(constraints);
      
      console.log('Caméra obtenue:', newStream);
      setStream(newStream);
      setCameraPermission('granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        await videoRef.current.play();
        console.log('Vidéo en cours de lecture');
      }
      
      setIsScanning(true);
      startScanning();
      
    } catch (err) {
      console.error('Erreur caméra:', err);
      setCameraPermission('denied');
      setError(`Impossible d'accéder à la caméra: ${err.message}`);
      toast({
        title: 'Erreur caméra',
        description: `Impossible d'accéder à la caméra: ${err.message}`,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Arrêter la caméra
  const stopCamera = () => {
    console.log('Arrêt de la caméra...');
    setIsScanning(false);
    
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
        console.log('Track arrêté:', track);
      });
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraPermission(null);
  };

  // Scanner en continu
  const startScanning = () => {
    console.log('Démarrage du scan automatique...');
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    scanIntervalRef.current = setInterval(() => {
      scanQRCode();
    }, 1000); // Scanner toutes les 1 seconde pour éviter la surcharge
  };

  // Fonction de scan QR Code
  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== 4) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    try {
      // Ajuster la taille du canvas à la vidéo
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      if (canvas.width === 0 || canvas.height === 0) {
        return; // Vidéo pas encore prête
      }
      
      // Dessiner la frame actuelle
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Obtenir les données d'image pour jsQR
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Utiliser jsQR pour détecter le QR code
      const qrCode = window.jsQR && window.jsQR(imageData.data, imageData.width, imageData.height);
      
      if (qrCode) {
        console.log('QR Code détecté:', qrCode.data);
        
        // Arrêter le scan temporairement pour éviter les duplicatas
        if (scanIntervalRef.current) {
          clearInterval(scanIntervalRef.current);
          scanIntervalRef.current = null;
        }
        
        await processScan(qrCode.data);
        
        // Reprendre le scan après 3 secondes
        setTimeout(() => {
          if (isScanning) {
            startScanning();
          }
        }, 3000);
      }
      
    } catch (error) {
      // Ignorer les erreurs de scan - normal si pas de QR code visible
      console.log('Pas de QR code détecté dans cette frame');
    }
  };

  // Traiter un QR Code scanné
  const processScan = async (qrData) => {
    if (loading) return;
    
    console.log('Traitement du QR code:', qrData);
    setLoading(true);
    setError(null);
    
    try {
      const result = await pointageService.scanQRCode(qrData);
      
      if (result.succes) {
        setScanResult({
          ...result.donnees,
          timestamp: new Date()
        });
        
        toast({
          title: 'Pointage enregistré',
          description: result.message,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });

        // Auto-clear après 10 secondes
        setTimeout(() => setScanResult(null), 10000);
        
      } else {
        setError(result.message);
        toast({
          title: 'Erreur de scan',
          description: result.message,
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error('Erreur scan:', error);
      setError('Erreur lors du traitement du QR Code');
      toast({
        title: 'Erreur',
        description: 'Erreur lors du traitement du QR Code',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Simuler un scan pour les tests
  const simulateScan = () => {
    console.log('Test de scan simulé...');
    const testQRData = JSON.stringify({
      code: 'QR-TEST-123',
      secret: 'SECRET123',
      employeId: 'emp-123',
      timestamp: Date.now()
    });
    processScan(testQRData);
  };

  // Nettoyage au démontage
  useEffect(() => {
    return () => {
      console.log('Nettoyage du composant Scanner...');
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
      
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  return (
    <Container maxW="600px" py={6}>
      <VStack spacing={6}>
        
        {/* En-tête */}
        <Card w="100%" bg={bgColor} borderColor={borderColor}>
          <CardHeader textAlign="center" pb="10px">
            <VStack spacing={2}>
              <Box p={3} bg="blue.500" borderRadius="full">
                <MdQrCodeScanner size="32px" color="white" />
              </Box>
              <Heading size="md">Scanner QR Code</Heading>
              <Text fontSize="sm" color="gray.500">
                Interface Vigile - Pointage des employés
              </Text>
            </VStack>
          </CardHeader>
        </Card>

        {/* Zone d'erreur */}
        {error && (
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            <Text fontSize="sm">{error}</Text>
          </Alert>
        )}

        {/* Zone de scan */}
        <Card w="100%" bg={bgColor} borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4}>
              
              {/* Caméra */}
              <Box 
                position="relative" 
                w="100%" 
                maxW={{ base: "95%", md: "400px" }}
                bg="gray.100"
                borderRadius="lg"
                overflow="hidden"
                aspectRatio="4/3"
                minH={{ base: "250px", md: "300px" }}
              >
                {isScanning && cameraPermission === 'granted' ? (
                  <>
                    <video
                      ref={videoRef}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover'
                      }}
                      playsInline
                      muted
                      autoPlay
                    />
                    
                    {/* Overlay de scan */}
                    <Box
                      position="absolute"
                      top="50%"
                      left="50%"
                      transform="translate(-50%, -50%)"
                      w={{ base: "150px", md: "200px" }}
                      h={{ base: "150px", md: "200px" }}
                      border="3px solid"
                      borderColor="blue.500"
                      borderRadius="lg"
                      bg="transparent"
                    />
                    
                    {/* Instructions */}
                    <Box
                      position="absolute"
                      bottom="10px"
                      left="50%"
                      transform="translateX(-50%)"
                      bg="blackAlpha.700"
                      color="white"
                      px={3}
                      py={2}
                      borderRadius="md"
                      fontSize="sm"
                    >
                      Positionnez le QR Code dans le cadre
                    </Box>

                    {/* Indicateur de chargement */}
                    {loading && (
                      <Flex
                        position="absolute"
                        top={0}
                        left={0}
                        right={0}
                        bottom={0}
                        bg="blackAlpha.600"
                        align="center"
                        justify="center"
                        borderRadius="lg"
                      >
                        <VStack>
                          <Spinner size="lg" color="white" />
                          <Text color="white">Traitement...</Text>
                        </VStack>
                      </Flex>
                    )}
                  </>
                ) : (
                  <Flex
                    align="center"
                    justify="center"
                    h="100%"
                    direction="column"
                    color="gray.500"
                  >
                    <MdCamera size="48px" />
                    <Text mt={2} fontSize="sm" textAlign="center">
                      {loading ? 'Démarrage...' :
                       cameraPermission === 'denied' 
                        ? 'Accès caméra refusé' 
                        : 'Caméra désactivée'
                      }
                    </Text>
                  </Flex>
                )}
                
                {/* Canvas caché pour le traitement */}
                <canvas
                  ref={canvasRef}
                  style={{ display: 'none' }}
                />
              </Box>

              {/* Contrôles */}
              <VStack spacing={3} w="100%">
                <HStack spacing={3} wrap={{ base: "wrap", md: "nowrap" }} justify="center">
                  {!isScanning ? (
                    <Button
                      colorScheme="blue"
                      leftIcon={<MdCamera />}
                      onClick={startCamera}
                      isLoading={loading}
                      loadingText="Démarrage..."
                      size={{ base: "lg", md: "md" }}
                      w={{ base: "full", md: "auto" }}
                    >
                      Démarrer Scanner
                    </Button>
                  ) : (
                    <Button
                      colorScheme="red"
                      leftIcon={<MdStop />}
                      onClick={stopCamera}
                      size={{ base: "lg", md: "md" }}
                      w={{ base: "full", md: "auto" }}
                    >
                      Arrêter Scanner
                    </Button>
                  )}
                  
                  {/* Bouton de test (développement seulement) */}
                  {process.env.NODE_ENV === 'development' && (
                    <Button
                      variant="outline"
                      colorScheme="orange"
                      onClick={simulateScan}
                      size={{ base: "md", md: "sm" }}
                      w={{ base: "full", md: "auto" }}
                    >
                      Test Scan
                    </Button>
                  )}
                </HStack>
              </VStack>

            </VStack>
          </CardBody>
        </Card>

        {/* Résultat du scan */}
        {scanResult && (
          <Card w="100%" bg="green.50" borderColor="green.200" borderWidth={2}>
            <CardHeader pb={2}>
              <HStack justify="space-between">
                <Text fontWeight="bold" color="green.700">
                  ✅ Pointage Enregistré
                </Text>
                <Badge colorScheme="green">
                  {scanResult.timestamp?.toLocaleTimeString('fr-FR')}
                </Badge>
              </HStack>
            </CardHeader>
            <CardBody pt={0}>
              <VStack spacing={3} align="start">
                <HStack>
                  <Avatar
                    size="md"
                    name={scanResult.employe?.nomComplet}
                    bg="blue.500"
                  />
                  <VStack align="start" spacing={0}>
                    <Text fontWeight="bold">
                      {scanResult.employe?.nomComplet}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {scanResult.employe?.poste}
                    </Text>
                  </VStack>
                </HStack>
                
                <Divider />
                
                <HStack justify="space-between" w="100%">
                  <Text fontSize="sm">Type:</Text>
                  <Badge colorScheme={scanResult.pointage?.typePointage === 'ENTREE' ? 'blue' : 'orange'}>
                    {scanResult.pointage?.typePointage === 'ENTREE' ? 'Entrée' : 'Sortie'}
                  </Badge>
                </HStack>
                
                <HStack justify="space-between" w="100%">
                  <Text fontSize="sm">Statut:</Text>
                  <Badge 
                    colorScheme={
                      scanResult.pointage?.statutPresence === 'PRESENT' ? 'green' :
                      scanResult.pointage?.statutPresence === 'RETARD' ? 'orange' : 'red'
                    }
                  >
                    {scanResult.pointage?.statutPresence}
                  </Badge>
                </HStack>
                
                {scanResult.pointage?.heureArrivee && (
                  <HStack justify="space-between" w="100%">
                    <Text fontSize="sm">Heure:</Text>
                    <Text fontSize="sm" fontWeight="bold">
                      {new Date(scanResult.pointage.heureArrivee).toLocaleTimeString('fr-FR')}
                    </Text>
                  </HStack>
                )}
              </VStack>
            </CardBody>
          </Card>
        )}

        {/* Instructions */}
        <Card w="100%" bg="blue.50" borderColor="blue.200">
          <CardHeader>
            <Text fontWeight="bold" color="blue.700">Instructions d'utilisation</Text>
          </CardHeader>
          <CardBody pt={0}>
            <VStack align="start" spacing={2} fontSize="sm" color="blue.600">
              <Text>• Cliquez sur "Démarrer Scanner" pour activer la caméra</Text>
              <Text>• Positionnez le QR Code de l'employé dans le cadre</Text>
              <Text>• Le pointage sera automatiquement enregistré</Text>
              <Text>• Avant 8h30 = Présent | Après 8h30 = Retard</Text>
              <Text>• Premier scan = Entrée | Second scan = Sortie</Text>
            </VStack>
          </CardBody>
        </Card>

        {/* Informations de debug */}
        {process.env.NODE_ENV === 'development' && (
          <Card w="100%" bg="gray.50" borderColor="gray.200">
            <CardBody>
              <Text fontSize="xs" color="gray.600">
                Debug Info:
                <br />• URL correcte: /admin/scanner
                <br />• Caméra: {cameraPermission || 'non testée'}
                <br />• Scanner actif: {isScanning ? 'oui' : 'non'}
                <br />• Stream: {stream ? 'actif' : 'inactif'}
              </Text>
            </CardBody>
          </Card>
        )}

      </VStack>
    </Container>
  );
}