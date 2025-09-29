import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  VStack,
  SimpleGrid,
  useToast,
  NumberInput,
  NumberInputField,
  Textarea,
  Box,
  List,
  ListItem,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { MdArrowDropDown, MdArrowDropUp } from 'react-icons/md';
import { employeeService } from 'services/employeeService';

// Liste des professions courantes
const PROFESSIONS = [
  // Informatique et Tech
  'Développeur Frontend', 'Développeur Backend', 'Développeur Fullstack', 'Développeur Mobile',
  'Développeur Web', 'Data Scientist', 'Analyste de Données', 'Administrateur Système',
  'Architecte Logiciel', 'Chef de Projet IT', 'Product Owner', 'Scrum Master',
  'DevOps Engineer', 'Ingénieur Cloud', 'Cybersécurité', 'UX/UI Designer',
  
  // Commerce et Vente
  'Commercial', 'Vendeur', 'Chargé de Clientèle', 'Responsable Commercial',
  'Account Manager', 'Business Developer', 'Téléconseiller', 'Caissier',
  
  // Finance et Comptabilité
  'Comptable', 'Assistant Comptable', 'Contrôleur de Gestion', 'Analyste Financier',
  'Trésorier', 'Auditeur', 'Expert-Comptable', 'Gestionnaire de Paie',
  
  // Ressources Humaines
  'Responsable RH', 'Chargé de Recrutement', 'Gestionnaire RH', 'Formation',
  'Consultant RH', 'Assistant RH',
  
  // Marketing et Communication
  'Chargé de Marketing', 'Community Manager', 'Content Manager', 'SEO Specialist',
  'Graphiste', 'Webdesigner', 'Chargé de Communication', 'Brand Manager',
  
  // Administration et Support
  'Assistant Administratif', 'Secrétaire', 'Réceptionniste', 'Office Manager',
  'Assistant de Direction', 'Gestionnaire Administratif',
  
  // Production et Logistique
  'Responsable Logistique', 'Magasinier', 'Préparateur de Commandes',
  'Responsable Production', 'Technicien', 'Mécanicien', 'Électricien',
  
  // Services et Autres
  'Consultant', 'Formateur', 'Chef de Projet', 'Analyste',
  'Juriste', 'Avocat', 'Médecin', 'Infirmier', 'Enseignant', 'Architecte'
].sort();

export default function EmployeeModal({ isOpen, onClose, employee = null, onSuccess }) {
  const [formData, setFormData] = useState({
    nomComplet: '',
    email: '',
    telephone: '',
    adresse: '',
    poste: '',
    typeContrat: 'SALAIRE_FIXE',
    salaireFixe: 0,
    tauxHonoraire: 0,
    tauxSalaireHoraire: 0,
    dateEmbauche: '',
  });
  const [loading, setLoading] = useState(false);
  const [professionSearch, setProfessionSearch] = useState('');
  const [showProfessionDropdown, setShowProfessionDropdown] = useState(false);
  const [filteredProfessions, setFilteredProfessions] = useState(PROFESSIONS);
  const toast = useToast();

  useEffect(() => {
    if (employee) {
      setFormData({
        nomComplet: employee.nomComplet || '',
        email: employee.email || '', 
        telephone: employee.telephone || '',
        adresse: employee.adresse || '',
        poste: employee.poste || '',
        typeContrat: employee.typeContrat || 'SALAIRE_FIXE',
        salaireFixe: employee.salaireFixe || 0,
        tauxHonoraire: employee.tauxHonoraire || 0,
        tauxSalaireHoraire: employee.tauxSalaireHoraire || 0,
        dateEmbauche: employee.dateEmbauche ? new Date(employee.dateEmbauche).toISOString().split('T')[0] : '',
      });
      setProfessionSearch(employee.poste || '');
    } else {
      // Reset form for new employee
      setFormData({
        nomComplet: '',
        email: '',
        telephone: '',
        adresse: '',
        poste: '',
        typeContrat: 'SALAIRE_FIXE',
        salaireFixe: 0,
        tauxHonoraire: 0,
        tauxSalaireHoraire: 0,
        dateEmbauche: new Date().toISOString().split('T')[0],
      });
      setProfessionSearch('');
    }
    setShowProfessionDropdown(false);
    setFilteredProfessions(PROFESSIONS);
  }, [employee, isOpen]);

  // Filtrer les professions selon la recherche
  useEffect(() => {
    if (professionSearch.trim() === '') {
      setFilteredProfessions(PROFESSIONS);
    } else {
      const filtered = PROFESSIONS.filter(profession =>
        profession.toLowerCase().includes(professionSearch.toLowerCase())
      );
      setFilteredProfessions(filtered);
    }
  }, [professionSearch]);

  const handleProfessionSearch = (value) => {
    setProfessionSearch(value);
    setFormData(prev => ({ ...prev, poste: value }));
    setShowProfessionDropdown(true);
  };

  const selectProfession = (profession) => {
    setProfessionSearch(profession);
    setFormData(prev => ({ ...prev, poste: profession }));
    setShowProfessionDropdown(false);
  };

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfessionDropdown && !event.target.closest('.profession-dropdown')) {
        setShowProfessionDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showProfessionDropdown]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation basique
    if (!formData.nomComplet || !formData.email || !formData.poste) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        salaireFixe: formData.typeContrat === 'SALAIRE_FIXE' ? parseFloat(formData.salaireFixe) : undefined,
        tauxHonoraire: formData.typeContrat === 'HONORAIRE' ? parseFloat(formData.tauxHonoraire) : undefined,
        tauxSalaireHoraire: formData.typeContrat === 'JOURNALIER' ? parseFloat(formData.tauxSalaireHoraire) : undefined,
        dateEmbauche: new Date(formData.dateEmbauche).toISOString(),
      };

      let response;
      if (employee) {
        // Modification
        response = await employeeService.update(employee.id, submitData);
      } else {
        // Création
        response = await employeeService.create(submitData);
      }

      if (response.succes) {
        toast({
          title: 'Succès',
          description: employee ? 'Employé modifié avec succès' : 'Employé créé avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        onSuccess();
        onClose();
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: error.response?.data?.message || 'Une erreur est survenue',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {employee ? 'Modifier l\'employé' : 'Ajouter un employé'}
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <SimpleGrid columns={2} spacing={4} w="100%">
                <FormControl isRequired>
                  <FormLabel>Nom complet</FormLabel>
                  <Input
                    value={formData.nomComplet}
                    onChange={(e) => handleInputChange('nomComplet', e.target.value)}
                    placeholder="Nom complet"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="email@example.com"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Téléphone</FormLabel>
                  <Input
                    value={formData.telephone}
                    onChange={(e) => handleInputChange('telephone', e.target.value)}
                    placeholder="+221 77 473 00 39"
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Profession</FormLabel>
                  <Box position="relative" className="profession-dropdown">
                    <InputGroup>
                      <Input
                        value={professionSearch}
                        onChange={(e) => handleProfessionSearch(e.target.value)}
                        onFocus={() => setShowProfessionDropdown(true)}
                        placeholder="Rechercher ou saisir une profession..."
                      />
                      <InputRightElement>
                        <IconButton
                          size="sm"
                          variant="ghost"
                          icon={showProfessionDropdown ? <MdArrowDropUp /> : <MdArrowDropDown />}
                          onClick={() => setShowProfessionDropdown(!showProfessionDropdown)}
                        />
                      </InputRightElement>
                    </InputGroup>
                    
                    {showProfessionDropdown && filteredProfessions.length > 0 && (
                      <Box
                        position="absolute"
                        top="100%"
                        left={0}
                        right={0}
                        zIndex={10}
                        maxH="200px"
                        overflowY="auto"
                        bg="white"
                        border="1px solid"
                        borderColor="gray.200"
                        borderRadius="md"
                        boxShadow="lg"
                      >
                        <List>
                          {filteredProfessions.slice(0, 10).map((profession, index) => (
                            <ListItem
                              key={index}
                              px={3}
                              py={2}
                              cursor="pointer"
                              _hover={{ bg: 'blue.50' }}
                              onClick={() => selectProfession(profession)}
                            >
                              {profession}
                            </ListItem>
                          ))}
                          {filteredProfessions.length > 10 && (
                            <ListItem px={3} py={2} fontSize="sm" color="gray.500">
                              ... et {filteredProfessions.length - 10} autres
                            </ListItem>
                          )}
                        </List>
                      </Box>
                    )}
                  </Box>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Type de contrat</FormLabel>
                  <Select
                    value={formData.typeContrat}
                    onChange={(e) => handleInputChange('typeContrat', e.target.value)}
                  >
                    <option value="SALAIRE_FIXE">Salaire Fixe (CDI/CDD)</option>
                    <option value="JOURNALIER">Journalier/Horaire</option>
                    <option value="HONORAIRE">Honoraire/Freelance</option>
                  </Select>
                </FormControl>

                {formData.typeContrat === 'SALAIRE_FIXE' && (
                  <FormControl isRequired>
                    <FormLabel>Salaire fixe mensuel (FCFA)</FormLabel>
                    <NumberInput
                      value={formData.salaireFixe}
                      onChange={(valueString) => handleInputChange('salaireFixe', valueString)}
                      min={0}
                    >
                      <NumberInputField placeholder="250000" />
                    </NumberInput>
                  </FormControl>
                )}

                {formData.typeContrat === 'JOURNALIER' && (
                  <FormControl isRequired>
                    <FormLabel>Taux horaire (FCFA)</FormLabel>
                    <NumberInput
                      value={formData.tauxSalaireHoraire}
                      onChange={(valueString) => handleInputChange('tauxSalaireHoraire', valueString)}
                      min={0}
                    >
                      <NumberInputField placeholder="2500" />
                    </NumberInput>
                  </FormControl>
                )}

                {formData.typeContrat === 'HONORAIRE' && (
                  <FormControl isRequired>
                    <FormLabel>Taux d'honoraire par heure (FCFA)</FormLabel>
                    <NumberInput
                      value={formData.tauxHonoraire}
                      onChange={(valueString) => handleInputChange('tauxHonoraire', valueString)}
                      min={0}
                    >
                      <NumberInputField placeholder="15000" />
                    </NumberInput>
                  </FormControl>
                )}

                <FormControl isRequired>
                  <FormLabel>Date d'embauche</FormLabel>
                  <Input
                    type="date"
                    value={formData.dateEmbauche}
                    onChange={(e) => handleInputChange('dateEmbauche', e.target.value)}
                  />
                </FormControl>
              </SimpleGrid>

              <FormControl>
                <FormLabel>Adresse</FormLabel>
                <Textarea
                  value={formData.adresse}
                  onChange={(e) => handleInputChange('adresse', e.target.value)}
                  placeholder="Adresse complète"
                  rows={3}
                />
              </FormControl>
            </VStack>
          </form>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Annuler
          </Button>
          <Button
            colorScheme="brand"
            onClick={handleSubmit}
            isLoading={loading}
            loadingText={employee ? 'Modification...' : 'Création...'}
          >
            {employee ? 'Modifier' : 'Créer'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
