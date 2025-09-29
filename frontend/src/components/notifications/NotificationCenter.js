import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Card,
  CardBody,
  useColorModeValue,
  Icon,
  Flex,
  Avatar,
  useToast,
  Portal,
  Slide
} from '@chakra-ui/react';
import { MdNotifications, MdBusiness, MdClose } from 'react-icons/md';

const NotificationCenter = ({ onDemandeClick }) => {
  const [notifications, setNotifications] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const toast = useToast();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const unreadBg = useColorModeValue('blue.50', 'blue.900');

  useEffect(() => {
    // Simuler le chargement des notifications
    loadNotifications();
    
    // Polling pour les nouvelles demandes (à remplacer par WebSocket plus tard)
    const interval = setInterval(() => {
      checkForNewDemandes();
    }, 30000); // Check toutes les 30 secondes

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/demandes?statut=EN_ATTENTE', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      const data = await response.json();
      
      if (data.succes) {
        const newNotifications = data.donnees.map(demande => ({
          id: demande.id,
          type: 'nouvelle_demande',
          title: 'Nouvelle demande d\'accès',
          message: `${demande.nomEntreprise} - ${demande.nomResponsable}`,
          timestamp: new Date(demande.dateCreation),
          demande: demande,
          read: false
        }));
        
        setNotifications(newNotifications);
        setUnreadCount(newNotifications.filter(n => !n.read).length);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des notifications:', error);
    }
  };

  const checkForNewDemandes = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/demandes/statistics', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      const data = await response.json();
      
      if (data.succes && data.donnees.enAttente > unreadCount) {
        // Il y a de nouvelles demandes
        toast({
          title: '📢 Nouvelle demande !',
          description: 'Une nouvelle entreprise a fait une demande d\'accès',
          status: 'info',
          duration: 5000,
          isClosable: true,
          position: 'top-right'
        });
        
        loadNotifications();
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des nouvelles demandes:', error);
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (onDemandeClick && notification.demande) {
      onDemandeClick(notification.demande);
    }
    setIsOpen(false);
  };

  return (
    <Box position="relative">
      {/* Bouton de notification */}
      <Button
        variant="ghost"
        position="relative"
        onClick={() => setIsOpen(!isOpen)}
        leftIcon={<Icon as={MdNotifications} />}
      >
        Notifications
        {unreadCount > 0 && (
          <Badge
            colorScheme="red"
            variant="solid"
            borderRadius="full"
            position="absolute"
            top="-1"
            right="-1"
            fontSize="xs"
            minW="20px"
            h="20px"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* Panel de notifications */}
      <Portal>
        <Slide direction="top" in={isOpen}>
          <Box
            position="fixed"
            top="80px"
            right="20px"
            width="400px"
            maxH="500px"
            bg={bgColor}
            borderWidth={1}
            borderColor={borderColor}
            borderRadius="lg"
            boxShadow="xl"
            zIndex={1000}
            overflow="hidden"
          >
            {/* Header */}
            <Flex justify="space-between" align="center" p={4} borderBottomWidth={1}>
              <Text fontWeight="bold">Notifications</Text>
              <Button size="sm" variant="ghost" onClick={() => setIsOpen(false)}>
                <Icon as={MdClose} />
              </Button>
            </Flex>

            {/* Liste des notifications */}
            <VStack 
              spacing={0} 
              maxH="400px" 
              overflowY="auto"
              divider={<Box borderBottomWidth={1} borderColor={borderColor} />}
            >
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <Card
                    key={notification.id}
                    variant="unstyled"
                    w="full"
                    cursor="pointer"
                    onClick={() => handleNotificationClick(notification)}
                    _hover={{ bg: hoverBg }}
                    bg={notification.read ? 'transparent' : unreadBg}
                  >
                    <CardBody p={4}>
                      <HStack spacing={3} align="start">
                        <Avatar
                          size="sm"
                          name={notification.demande?.nomEntreprise}
                          bg="blue.500"
                          icon={<Icon as={MdBusiness} />}
                        />
                        <VStack align="start" spacing={1} flex={1}>
                          <Text fontWeight={notification.read ? 'normal' : 'bold'} fontSize="sm">
                            {notification.title}
                          </Text>
                          <Text fontSize="xs" color="gray.600">
                            {notification.message}
                          </Text>
                          <Text fontSize="xs" color="gray.500">
                            {notification.timestamp.toLocaleString('fr-FR')}
                          </Text>
                        </VStack>
                        {!notification.read && (
                          <Box w={2} h={2} bg="blue.500" borderRadius="full" />
                        )}
                      </HStack>
                    </CardBody>
                  </Card>
                ))
              ) : (
                <Box p={8} textAlign="center">
                  <Text color="gray.500">Aucune notification</Text>
                </Box>
              )}
            </VStack>
          </Box>
        </Slide>
      </Portal>
    </Box>
  );
};

export default NotificationCenter;
