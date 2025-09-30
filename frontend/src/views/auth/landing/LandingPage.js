import React, { useState } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Button,
  Container,
  Heading,
  SimpleGrid,
  Icon,
  Image,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  Badge,
  useDisclosure,
} from '@chakra-ui/react';
import { 
  MdPayment, 
  MdPeople, 
  MdAssessment, 
  MdSecurity, 
  MdCloud,
  MdSupport,
  MdLogin
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [demande, setDemande] = useState({
    nomEntreprise: '',
    nomResponsable: '',
    email: '',
    telephone: '',
    secteurActivite: '',
    nombreEmployes: '',
    message: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const bgGradient = useColorModeValue(
    'linear(to-r, blue.400, purple.500)',
    'linear(to-r, blue.600, purple.700)'
  );
  
  const cardBg = useColorModeValue('white', 'gray.800');
  const textColor = useColorModeValue('gray.600', 'gray.200');

  const services = [
    {
      icon: MdPayment,
      title: 'Gestion des Paiements',
      description: 'Automatisez vos paiements de salaires avec des rapports détaillés et un suivi en temps réel.'
    },
    {
      icon: MdPeople,
      title: 'Gestion des Employés',
      description: 'Centralisez toutes les informations de vos employés avec un système complet de RH.'
    },
    {
      icon: MdAssessment,
      title: 'Rapports & Analytics',
      description: 'Obtenez des insights précieux avec nos tableaux de bord et rapports personnalisables.'
    },
    {
      icon: MdSecurity,
      title: 'Sécurité Avancée',
      description: 'Vos données sont protégées avec un chiffrement de niveau bancaire et des sauvegardes automatiques.'
    },
    {
      icon: MdCloud,
      title: 'Cloud & Mobile',
      description: 'Accédez à votre système depuis n\'importe où, sur tous vos appareils.'
    },
    {
      icon: MdSupport,
      title: 'Support 24/7',
      description: 'Notre équipe d\'experts est là pour vous accompagner à chaque étape.'
    }
  ];

  const handleDemandeSubmit = async () => {
    setIsLoading(true);
    try {
      // Ici on enverrait la demande au backend
      const response = await fetch('http://localhost:3001/api/demandes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(demande)
      });

      if (response.ok) {
        toast({
          title: 'Demande envoyée !',
          description: 'Votre demande a été transmise à notre équipe. Nous vous contacterons sous 24h.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        onClose();
        setDemande({
          nomEntreprise: '',
          nomResponsable: '',
          email: '',
          telephone: '',
          secteurActivite: '',
          nombreEmployes: '',
          message: ''
        });
      } else {
        throw new Error('Erreur lors de l\'envoi');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'envoi de votre demande.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      {/* Header */}
      <Box bg={cardBg} shadow="sm" px={4} py={3}>
        <Container maxW="7xl">
          <Flex justify="space-between" align="center">
            <Heading size="md" color="blue.500">
              MARAKHIB-GLOBAL
            </Heading>
            <Button
              leftIcon={<Icon as={MdLogin} />}
              colorScheme="blue"
              variant="outline"
              onClick={() => navigate('/auth/sign-in')}
            >
              Se Connecter
            </Button>
          </Flex>
        </Container>
      </Box>

      {/* Hero Section */}
      <Box bgGradient={bgGradient} color="white" py={20}>
        <Container maxW="7xl">
          <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={10} alignItems="center">
            <VStack align="start" spacing={8}>
              <Badge colorScheme="yellow" px={3} py={1} borderRadius="full">
                Solution SaaS Complète
              </Badge>
              
              <Heading size="2xl" lineHeight="1.2">
                Révolutionnez la gestion 
                <Text as="span" color="yellow.300"> des salaires </Text>
                de votre entreprise
              </Heading>
              
              <Text fontSize="xl" opacity={0.9}>
                Une plateforme tout-en-un pour gérer vos employés, automatiser les paiements 
                et analyser vos données RH avec une simplicité inégalée.
              </Text>
              
              <HStack spacing={4}>
                <Button
                  size="lg"
                  colorScheme="yellow"
                  color="blue.900"
                  onClick={onOpen}
                  fontWeight="bold"
                >
                  Faire une Demande
                </Button>
                {/* <Button
                  size="lg"
                  variant="outline"
                  color="white"
                  borderColor="white"
                  _hover={{ bg: 'whiteAlpha.200' }}
                >
                  Voir une Démo
                </Button> */}
              </HStack>

              <HStack spacing={8} pt={4}>
                <VStack spacing={1}>
                  <Text fontSize="2xl" fontWeight="bold">500+</Text>
                  <Text fontSize="sm" opacity={0.8}>Entreprises</Text>
                </VStack>
                <VStack spacing={1}>
                  <Text fontSize="2xl" fontWeight="bold">50k+</Text>
                  <Text fontSize="sm" opacity={0.8}>Employés gérés</Text>
                </VStack>
                <VStack spacing={1}>
                  <Text fontSize="2xl" fontWeight="bold">99.9%</Text>
                  <Text fontSize="sm" opacity={0.8}>Uptime</Text>
                </VStack>
              </HStack>
            </VStack>

            <Box>
              <Image
                src="/api/placeholder/600/400"
                alt="Dashboard Preview"
                borderRadius="lg"
                shadow="2xl"
                fallback={
                  <Box
                    w="100%"
                    h="400px"
                    bg="whiteAlpha.200"
                    borderRadius="lg"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text>Aperçu du Dashboard</Text>
                  </Box>
                }
              />
            </Box>
          </SimpleGrid>
        </Container>
      </Box>

      {/* Services Section */}
      <Box py={20}>
        <Container maxW="7xl">
          <VStack spacing={16}>
            <VStack spacing={4} textAlign="center">
              <Heading size="xl" color={useColorModeValue('gray.800', 'white')}>
                Nos Services Complets
              </Heading>
              <Text fontSize="lg" color={textColor} maxW="600px">
                Découvrez comment notre plateforme peut transformer la gestion 
                de votre entreprise avec des outils modernes et intuitifs.
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
              {services.map((service, index) => (
                <Box
                  key={index}
                  bg={cardBg}
                  p={8}
                  borderRadius="xl"
                  shadow="md"
                  _hover={{ shadow: 'lg', transform: 'translateY(-4px)' }}
                  transition="all 0.3s"
                >
                  <VStack align="start" spacing={4}>
                    <Icon
                      as={service.icon}
                      w={12}
                      h={12}
                      color="blue.500"
                    />
                    <Heading size="md">{service.title}</Heading>
                    <Text color={textColor}>{service.description}</Text>
                  </VStack>
                </Box>
              ))}
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* CTA Section */}
      <Box bg={useColorModeValue('blue.50', 'blue.900')} py={16}>
        <Container maxW="4xl" textAlign="center">
          <VStack spacing={6}>
            <Heading size="xl" color={useColorModeValue('blue.900', 'white')}>
              Prêt à transformer votre entreprise ?
            </Heading>
            <Text fontSize="lg" color={textColor}>
              Rejoignez des centaines d'entreprises qui nous font confiance pour gérer leurs salaires.
            </Text>
            <Button
              size="lg"
              colorScheme="blue"
              onClick={onOpen}
              fontWeight="bold"
            >
              Commencer Gratuitement
            </Button>
          </VStack>
        </Container>
      </Box>

      {/* Footer */}
      <Box bg={useColorModeValue('gray.800', 'gray.900')} color="white" py={8}>
        <Container maxW="7xl">
          <Text textAlign="center" opacity={0.7}>
            © 2025 MARAKHIB-GLOBAL. Tous droits réservés.
          </Text>
        </Container>
      </Box>

      {/* Modal de Demande */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Faire une demande d'accès</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <SimpleGrid columns={2} spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Nom de l'entreprise</FormLabel>
                  <Input
                    value={demande.nomEntreprise}
                    onChange={(e) => setDemande({...demande, nomEntreprise: e.target.value})}
                    placeholder="Ex: Mon Entreprise SARL"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Nom du responsable</FormLabel>
                  <Input
                    value={demande.nomResponsable}
                    onChange={(e) => setDemande({...demande, nomResponsable: e.target.value})}
                    placeholder="Votre nom complet"
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={demande.email}
                    onChange={(e) => setDemande({...demande, email: e.target.value})}
                    placeholder="contact@monentreprise.com"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Téléphone</FormLabel>
                  <Input
                    value={demande.telephone}
                    onChange={(e) => setDemande({...demande, telephone: e.target.value})}
                    placeholder="+221 XX XXX XX XX"
                  />
                </FormControl>
              </SimpleGrid>

              <SimpleGrid columns={2} spacing={4} w="full">
                <FormControl isRequired>
                  <FormLabel>Secteur d'activité</FormLabel>
                  <Input
                    value={demande.secteurActivite}
                    onChange={(e) => setDemande({...demande, secteurActivite: e.target.value})}
                    placeholder="Ex: Technology, Finance..."
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel>Nombre d'employés</FormLabel>
                  <Input
                    value={demande.nombreEmployes}
                    onChange={(e) => setDemande({...demande, nombreEmployes: e.target.value})}
                    placeholder="Ex: 10-50"
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Message (optionnel)</FormLabel>
                <Textarea
                  value={demande.message}
                  onChange={(e) => setDemande({...demande, message: e.target.value})}
                  placeholder="Décrivez vos besoins spécifiques..."
                  rows={3}
                />
              </FormControl>

              <Button
                colorScheme="blue"
                size="lg"
                w="full"
                onClick={handleDemandeSubmit}
                isLoading={isLoading}
                loadingText="Envoi en cours..."
              >
                Envoyer la demande
              </Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default LandingPage;
