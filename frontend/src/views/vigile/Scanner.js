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
  useColorModeValue
} from '@chakra-ui/react';
import { MdQrCodeScanner, MdCamera, MdRefresh } from 'react-icons/md';
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
  
  // Demander l'accès à la caméra
  const startCamera = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Arrêter le flux existant s'il y en a un
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }

      const newStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment', // Caméra arrière si disponible
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      setStream(newStream);
      setCameraPermission('granted');
      
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play();
      }
      
      setIsScanning(true);
      startScanning();
      
    } catch (err) {
      console.error('Erreur caméra:', err);
      setCameraPermission('denied');
      setError('Impossible d\'accéder à la caméra. Vérifiez les permissions.');
      toast({
        title: 'Erreur caméra',
        description: 'Impossible d\'accéder à la caméra',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Arrêter la caméra
  const stopCamera = () => {
    setIsScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
    }
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  // Scanner en continu
  const startScanning = () => {
    scanIntervalRef.current = setInterval(async () => {
      await scanQRCode();
    }, 500); // Scanner toutes les 500ms
  };

  // Fonction de scan QR Code
  const scanQRCode = async () => {
    if (!videoRef.current || !canvasRef.current || videoRef.current.readyState !== 4) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Ajuster la taille du canvas à la vidéo
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    // Dessiner la frame actuelle
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    try {
      // Ici on utiliserait une bibliothèque comme jsQR
      // Pour la démo, on simule la détection avec un clic
      // En production, intégrer jsQR ou zxing-js
      
    } catch (error) {
      // Ignorer les erreurs de scan - normal si pas de QR code
    }
  };

  // Traiter un QR Code scanné
  const processScan = async (qrData) => {
    if (loading) return;
    
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

  // Simuler un scan pour les tests (à retirer en production)
  const simulateScan = () => {
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
      stopCamera();
    };
  }, []);

  // Effet pour gérer le stream vidéo
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }} px="20px">
      <VStack spacing="20px" maxW="600px" mx="auto">
        
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

        {/* Zone de scan */}
        <Card w="100%" bg={bgColor} borderColor={borderColor}>
          <CardBody>
            <VStack spacing={4}>
              
              {/* Caméra */}
              <Box 
                position="relative" 
                w="100%" 
                maxW="400px"
                bg="gray.100"
                borderRadius="lg"
                overflow="hidden"
                aspectRatio="4/3"
              >
                {isScanning ? (
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
                    />
                    
                    {/* Overlay de scan */}
                    <Box
                      position="absolute"
                      top="50%"
                      left="50%"
                      transform="translate(-50%, -50%)"
                      w="200px"
                      h="200px"
                      border="3px solid"
                      borderColor="blue.500"
                      borderRadius="lg"
                      bg="transparent"
                      _before={{
                        content: '""',
                        position: 'absolute',
                        top: '-3px',
                        left: '-3px',
                        right: '-3px',
                        bottom: '-3px',
                        border: '3px solid',
                        borderColor: 'transparent blue.500 transparent transparent',
                        borderRadius: 'lg',
                        animation: 'spin 2s linear infinite'
                      }}
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
                    <Text mt={2} fontSize="sm">
                      {cameraPermission === 'denied' 
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
              <HStack spacing={3}>
                {!isScanning ? (
                  <Button
                    colorScheme="blue"
                    leftIcon={<MdCamera />}
                    onClick={startCamera}
                    isLoading={loading}
                    loadingText="Démarrage..."
                  >
                    Démarrer Scanner
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    leftIcon={<MdRefresh />}
                    onClick={stopCamera}
                  >
                    Arrêter
                  </Button>
                )}
                
                {/* Bouton de test (à retirer en production) */}
                {process.env.NODE_ENV === 'development' && (
                  <Button
                    variant="ghost"
                    colorScheme="orange"
                    onClick={simulateScan}
                    size="sm"
                  >
                    Test Scan
                  </Button>
                )}
              </HStack>

              {/* État de chargement */}
              {loading && (
                <HStack>
                  <Spinner size="sm" />
                  <Text fontSize="sm">Traitement en cours...</Text>
                </HStack>
              )}

            </VStack>
          </CardBody>
        </Card>

        {/* Résultat du scan */}
        {scanResult && (
          <Card w="100%" bg="green.50" borderColor="green.200">
            <CardHeader pb={2}>
              <HStack justify="space-between">
                <Text fontWeight="bold" color="green.700">
                  Pointage Enregistré
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

        {/* Erreur */}
        {error && (
          <Alert status="error" borderRadius="lg">
            <AlertIcon />
            <Text fontSize="sm">{error}</Text>
          </Alert>
        )}

        {/* Instructions */}
        <Card w="100%" bg={bgColor} borderColor={borderColor}>
          <CardHeader>
            <Text fontWeight="bold">Instructions d'utilisation</Text>
          </CardHeader>
          <CardBody pt={0}>
            <VStack align="start" spacing={2} fontSize="sm" color="gray.600">
              <Text>• Cliquez sur "Démarrer Scanner" pour activer la caméra</Text>
              <Text>• Positionnez le QR Code de l'employé dans le cadre</Text>
              <Text>• Le pointage sera automatiquement enregistré</Text>
              <Text>• Avant 8h30 = Présent | Après 8h30 = Retard</Text>
              <Text>• Premier scan = Entrée | Second scan = Sortie</Text>
            </VStack>
          </CardBody>
        </Card>

      </VStack>
    </Box>
  );
}