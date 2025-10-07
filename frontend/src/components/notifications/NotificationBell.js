import React from 'react';
import {
  Box,
  IconButton,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Text,
  VStack,
  HStack,
  Avatar,
  Button,
  useColorModeValue,
  useToast,
  Alert,
  AlertIcon
} from '@chakra-ui/react';
import { MdNotifications, MdBusiness, MdAccessTime, MdCheck } from 'react-icons/md';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const NotificationBell = () => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead
  } = useNotifications();
  
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const menuBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  // Filtrer pour afficher seulement les notifications pertinentes selon le rôle
  const filteredNotifications = notifications.filter(notif => {
    if (user?.role === 'SUPER_ADMIN') {
      return notif.type === 'nouvelle_autorisation';
    }
    return false; // Pour l'instant, seules les autorisations concernent les SuperAdmins
  });

  const handleAccessEnterprise = (notification) => {
    if (notification.type === 'nouvelle_autorisation') {
      // Marquer comme lu
      markAsRead(notification.id);

      // Naviguer vers l'interface de l'entreprise
      navigate(`/admin/entreprise/${notification.entrepriseId}/dashboard`, {
        state: {
          entrepriseContext: {
            id: notification.entrepriseId,
            nom: notification.entrepriseNom,
            autorisation: notification.autorisation
          }
        }
      });

      toast({
        title: "Accès à l'entreprise",
        description: `Vous accédez maintenant à l'interface de ${notification.entrepriseNom}`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}m`;
    if (hours < 24) return `Il y a ${hours}h`;
    return `Il y a ${days}j`;
  };

  const renderNotificationItem = (notification) => {
    const isUnread = !notification.lu;
    
    return (
      <MenuItem 
        key={notification.id}
        p={3}
        bg={isUnread ? 'blue.50' : 'transparent'}
        borderRadius="md"
        _hover={{ bg: isUnread ? 'blue.100' : 'gray.50' }}
        onClick={() => handleAccessEnterprise(notification)}
      >
        <VStack align="stretch" spacing={2} w="100%">
          <HStack spacing={3}>
            <Avatar 
              size="sm" 
              name={notification.entrepriseNom}
              bg="blue.500"
            />
            <Box flex="1">
              <Text fontSize="sm" fontWeight={isUnread ? "bold" : "medium"}>
                Nouveau accès accordé
              </Text>
              <Text fontSize="xs" color="gray.500">
                {notification.entrepriseNom}
              </Text>
            </Box>
            {isUnread && (
              <Box w="8px" h="8px" bg="blue.500" borderRadius="full" />
            )}
          </HStack>
          
          <VStack align="stretch" spacing={1} fontSize="xs" color="gray.600">
            <Text>
              <strong>Par:</strong> {notification.adminNom}
            </Text>
            {notification.raisonAcces && (
              <Text>
                <strong>Raison:</strong> {notification.raisonAcces}
              </Text>
            )}
            <HStack justify="space-between">
              <Text>
                <MdAccessTime style={{ display: 'inline', marginRight: '4px' }} />
                {notification.tempsRestant}
              </Text>
              <Text color="gray.400">
                {formatTimeAgo(notification.dateCreation)}
              </Text>
            </HStack>
          </VStack>
          
          <Button
            size="xs"
            colorScheme="blue"
            leftIcon={<MdBusiness />}
            onClick={(e) => {
              e.stopPropagation();
              handleAccessEnterprise(notification);
            }}
          >
            Accéder à l'entreprise
          </Button>
        </VStack>
      </MenuItem>
    );
  };

  if (user?.role !== 'SUPER_ADMIN') {
    return null; // Ne pas afficher pour les autres rôles
  }

  return (
    <Menu closeOnSelect={false}>
      <MenuButton
        as={IconButton}
        icon={
          <Badge 
            colorScheme="red" 
            variant={unreadCount > 0 ? "solid" : "subtle"}
            fontSize="0.8em"
            position="absolute"
            top="-1"
            right="-1"
            display={unreadCount > 0 ? "block" : "none"}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        }
        variant="ghost"
        size="sm"
        position="relative"
      >
        <MdNotifications size="20px" />
      </MenuButton>

      <MenuList 
        bg={menuBg}
        borderColor={borderColor}
        borderWidth="1px"
        maxW="400px"
        maxH="500px"
        overflowY="auto"
      >
        <Box p={3}>
          <HStack justify="space-between" align="center">
            <Text fontWeight="bold" fontSize="md">
              Notifications
            </Text>
            {unreadCount > 0 && (
              <Button
                size="xs"
                variant="ghost"
                leftIcon={<MdCheck />}
                onClick={markAllAsRead}
              >
                Tout marquer lu
              </Button>
            )}
          </HStack>
        </Box>

        <MenuDivider />

        {filteredNotifications.length === 0 ? (
          <Box p={4}>
            <Alert status="info" size="sm" borderRadius="md">
              <AlertIcon />
              <Text fontSize="sm">Aucune notification</Text>
            </Alert>
          </Box>
        ) : (
          <VStack spacing={1} align="stretch" p={2}>
            {filteredNotifications.slice(0, 10).map(renderNotificationItem)}
            
            {filteredNotifications.length > 10 && (
              <MenuItem justifyContent="center">
                <Text fontSize="sm" color="gray.500">
                  +{filteredNotifications.length - 10} notifications supplémentaires
                </Text>
              </MenuItem>
            )}
          </VStack>
        )}

        {filteredNotifications.length > 0 && (
          <>
            <MenuDivider />
            <Box p={2}>
              <Button
                size="sm"
                variant="ghost"
                w="100%"
                onClick={() => navigate('/admin/access-management')}
              >
                Voir tous les accès
              </Button>
            </Box>
          </>
        )}
      </MenuList>
    </Menu>
  );
};

export default NotificationBell;