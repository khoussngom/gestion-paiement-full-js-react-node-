import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  VStack,
  HStack,
  Text,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  Badge,
  Box,
  Divider,
  SimpleGrid,
  Avatar,
  Icon,
  Flex
} from '@chakra-ui/react';
import { MdBusiness, MdEmail, MdPhone, MdPerson, MdWork, MdPeople } from 'react-icons/md';

const DemandeApprovalModal = ({ isOpen, onClose, demande, onApprove, onReject }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [motifRejet, setMotifRejet] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const toast = useToast();

  // Données de l'entreprise pré-remplies basées sur la demande
  const [entrepriseData, setEntrepriseData] = useState({
    nom: '',
    adresse: '',
    telephone: '',
    email: '',
    secteurActivite: '',
    nombreEmployes: ''
  });

  useEffect(() => {
    if (demande) {
      setEntrepriseData({
        nom: demande.nomEntreprise || '',
        adresse: '', // À compléter par le super admin
        telephone: demande.telephone || '',
        email: demande.email || '',
        secteurActivite: demande.secteurActivite || '',
        nombreEmployes: demande.nombreEmployes?.toString() || ''
      });
    }
  }, [demande]);

  const handleApprove = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/demandes/${demande.id}/accepter`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          entrepriseData: {
            nom: entrepriseData.nom,
            adresse: entrepriseData.adresse,
            telephone: entrepriseData.telephone,
            email: entrepriseData.email,
            secteurActivite: entrepriseData.secteurActivite
          },
          adminData: {
            nom: demande.nomResponsable,
            email: demande.email
          }
        })
      });
      
      const data = await response.json();
      
      if (data.succes) {
        toast({
          title: 'Demande acceptée !',
          description: `Entreprise créée avec succès. Mot de passe temporaire : ${data.donnees.motDePasseTemporaire}`,
          status: 'success',
          duration: 10000,
          isClosable: true,
        });
        
        onApprove(data.donnees);
        onClose();
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors de l\'acceptation de la demande',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!motifRejet.trim()) {
      toast({
        title: 'Erreur',
        description: 'Veuillez saisir un motif de rejet',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/demandes/${demande.id}/rejeter`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ motifRejet })
      });
      
      const data = await response.json();
      
      if (data.succes) {
        toast({
          title: 'Demande rejetée',
          description: 'La demande a été rejetée avec succès',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
        
        onReject(data.donnees);
        onClose();
        setShowRejectForm(false);
        setMotifRejet('');
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.message || 'Erreur lors du rejet de la demande',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!demande) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="6xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          <Flex align="center">
            <Icon as={MdBusiness} mr={2} />
            Approuver la demande d'accès
          </Flex>
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={6} align="stretch">
            {/* Informations de la demande */}
            <Box p={4} borderWidth={1} borderRadius="md" bg="blue.50">
              <Text fontWeight="bold" mb={3}>Informations de la demande</Text>
              <SimpleGrid columns={2} spacing={4}>
                <Box>
                  <HStack>
                    <Icon as={MdBusiness} color="blue.500" />
                    <Text><strong>Entreprise:</strong> {demande.nomEntreprise}</Text>
                  </HStack>
                </Box>
                <Box>
                  <HStack>
                    <Icon as={MdPerson} color="green.500" />
                    <Text><strong>Responsable:</strong> {demande.nomResponsable}</Text>
                  </HStack>
                </Box>
                <Box>
                  <HStack>
                    <Icon as={MdEmail} color="purple.500" />
                    <Text><strong>Email:</strong> {demande.email}</Text>
                  </HStack>
                </Box>
                <Box>
                  <HStack>
                    <Icon as={MdPhone} color="orange.500" />
                    <Text><strong>Téléphone:</strong> {demande.telephone}</Text>
                  </HStack>
                </Box>
                <Box>
                  <HStack>
                    <Icon as={MdWork} color="teal.500" />
                    <Text><strong>Secteur:</strong> {demande.secteurActivite}</Text>
                  </HStack>
                </Box>
                <Box>
                  <HStack>
                    <Icon as={MdPeople} color="pink.500" />
                    <Text><strong>Employés:</strong> {demande.nombreEmployes}</Text>
                  </HStack>
                </Box>
              </SimpleGrid>
              
              {demande.message && (
                <Box mt={4}>
                  <Text><strong>Message:</strong></Text>
                  <Text mt={1} p={2} bg="white" borderRadius="md" fontStyle="italic">
                    "{demande.message}"
                  </Text>
                </Box>
              )}
            </Box>

            <Divider />

            {!showRejectForm ? (
              /* Formulaire de création d'entreprise */
              <Box>
                <Text fontWeight="bold" mb={4}>Détails de l'entreprise à créer</Text>
                <SimpleGrid columns={2} spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Nom de l'entreprise</FormLabel>
                    <Input
                      value={entrepriseData.nom}
                      onChange={(e) => setEntrepriseData({...entrepriseData, nom: e.target.value})}
                      placeholder="Nom de l'entreprise"
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Adresse</FormLabel>
                    <Input
                      value={entrepriseData.adresse}
                      onChange={(e) => setEntrepriseData({...entrepriseData, adresse: e.target.value})}
                      placeholder="Adresse complète"
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Téléphone</FormLabel>
                    <Input
                      value={entrepriseData.telephone}
                      onChange={(e) => setEntrepriseData({...entrepriseData, telephone: e.target.value})}
                      placeholder="Numéro de téléphone"
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={entrepriseData.email}
                      onChange={(e) => setEntrepriseData({...entrepriseData, email: e.target.value})}
                      placeholder="Email de l'entreprise"
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Secteur d'activité</FormLabel>
                    <Input
                      value={entrepriseData.secteurActivite}
                      onChange={(e) => setEntrepriseData({...entrepriseData, secteurActivite: e.target.value})}
                      placeholder="Secteur d'activité"
                    />
                  </FormControl>
                  
                  <FormControl>
                    <FormLabel>Nombre d'employés estimé</FormLabel>
                    <Input
                      value={entrepriseData.nombreEmployes}
                      onChange={(e) => setEntrepriseData({...entrepriseData, nombreEmployes: e.target.value})}
                      placeholder="Nombre d'employés"
                    />
                  </FormControl>
                </SimpleGrid>
              </Box>
            ) : (
              /* Formulaire de rejet */
              <Box>
                <Text fontWeight="bold" mb={4} color="red.500">Motif du rejet</Text>
                <FormControl isRequired>
                  <FormLabel>Expliquez pourquoi cette demande est rejetée</FormLabel>
                  <Textarea
                    value={motifRejet}
                    onChange={(e) => setMotifRejet(e.target.value)}
                    placeholder="Expliquez les raisons du rejet de cette demande..."
                    rows={4}
                  />
                </FormControl>
              </Box>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            <Button variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            
            {!showRejectForm ? (
              <>
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={() => setShowRejectForm(true)}
                >
                  Rejeter
                </Button>
                <Button
                  colorScheme="green"
                  onClick={handleApprove}
                  isLoading={isLoading}
                  loadingText="Création..."
                >
                  Accepter et Créer l'Entreprise
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowRejectForm(false)}
                >
                  Retour
                </Button>
                <Button
                  colorScheme="red"
                  onClick={handleReject}
                  isLoading={isLoading}
                  loadingText="Rejet..."
                >
                  Confirmer le Rejet
                </Button>
              </>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default DemandeApprovalModal;
