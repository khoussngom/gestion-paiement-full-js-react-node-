import React, { useState, useCallback } from 'react';
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
  Box,
  Alert,
  AlertIcon,
  Progress,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Badge,
  useToast,
  Icon,
  Divider,
  List,
  ListItem,
  ListIcon
} from '@chakra-ui/react';
import { useDropzone } from 'react-dropzone';
import { MdCloudUpload, MdCheckCircle, MdError, MdWarning, MdFileDownload } from 'react-icons/md';
import * as XLSX from 'xlsx';

const EmployeeImportModal = ({ isOpen, onClose, onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [data, setData] = useState([]);
  const [errors, setErrors] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Import
  const toast = useToast();

  const requiredColumns = ['nom', 'prenom', 'email', 'salaire', 'typeContrat'];
  const optionalColumns = ['poste', 'telephone', 'adresse', 'dateEmbauche'];
  
  // Template Excel pour téléchargement
  const downloadTemplate = () => {
    const templateData = [
      {
        nom: 'Ngom',
        prenom: 'Khouss',
        email: 'khouss@email.com',
        salaire: 500000,
        typeContrat: 'SALAIRE_FIXE',
        poste: 'Développeur',
        telephone: '774123456',
        adresse: 'Dakar, Sénégal',
        dateEmbauche: '2024-01-15'
      },
      {
        nom: 'senghor',
        prenom: 'fallou',
        email: 'fallou@email.com',
        salaire: 10000,
        typeContrat: 'HONORAIRE',
        poste: 'Designer',
        telephone: '775234567',
        adresse: 'Thiès, Sénégal',
        dateEmbauche: '2024-02-01'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Employés');
    XLSX.writeFile(wb, 'template_employes.xlsx');
    
    toast({
      title: 'Template téléchargé',
      description: 'Le fichier template_employes.xlsx a été téléchargé',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });
  };

  const validateData = (jsonData) => {
    const newErrors = [];
    const newWarnings = [];
    const validData = [];

    // Vérifier les colonnes requises
    if (jsonData.length > 0) {
      const columns = Object.keys(jsonData[0]);
      const missingColumns = requiredColumns.filter(col => !columns.includes(col));
      
      if (missingColumns.length > 0) {
        newErrors.push(`Colonnes manquantes: ${missingColumns.join(', ')}`);
        return { errors: newErrors, warnings: newWarnings, validData: [] };
      }
    }

    jsonData.forEach((row, index) => {
      const rowErrors = [];
      const rowNumber = index + 2; // +2 car Excel commence à 1 et on a l'header

      // Validation des champs requis
      requiredColumns.forEach(col => {
        if (!row[col] || String(row[col]).trim() === '') {
          rowErrors.push(`${col} est requis`);
        }
      });

      // Validation email
      if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
        rowErrors.push('Format email invalide');
      }

      // Validation salaire
      if (row.salaire && (isNaN(row.salaire) || row.salaire <= 0)) {
        rowErrors.push('Le salaire doit être un nombre positif');
      }

      // Validation type de contrat
      const validContractTypes = ['SALAIRE_FIXE', 'HONORAIRE'];
      if (row.typeContrat && !validContractTypes.includes(row.typeContrat.toUpperCase())) {
        rowErrors.push(`Type de contrat invalide. Valeurs acceptées: ${validContractTypes.join(', ')}`);
      }

      // Validation téléphone
      if (row.telephone && !/^[0-9+\-\s()]+$/.test(row.telephone)) {
        newWarnings.push(`Ligne ${rowNumber}: Format de téléphone suspect`);
      }

      // Validation date
      if (row.dateEmbauche) {
        const date = new Date(row.dateEmbauche);
        if (isNaN(date.getTime())) {
          newWarnings.push(`Ligne ${rowNumber}: Format de date invalide`);
        }
      }

      if (rowErrors.length > 0) {
        newErrors.push(`Ligne ${rowNumber}: ${rowErrors.join(', ')}`);
      } else {
        validData.push({
          ...row,
          salaire: parseFloat(row.salaire),
          typeContrat: row.typeContrat?.toUpperCase(),
          dateEmbauche: row.dateEmbauche ? new Date(row.dateEmbauche).toISOString().split('T')[0] : null
        });
      }
    });

    return { errors: newErrors, warnings: newWarnings, validData };
  };

  const processFile = useCallback((acceptedFile) => {
    setLoading(true);
    const file = acceptedFile[0];
    setFile(file);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast({
            title: 'Fichier vide',
            description: 'Le fichier Excel ne contient aucune donnée',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
          setLoading(false);
          return;
        }

        const { errors, warnings, validData } = validateData(jsonData);
        setErrors(errors);
        setWarnings(warnings);
        setData(validData);
        setStep(2);
        
        toast({
          title: 'Fichier analysé',
          description: `${validData.length} employé(s) valide(s) trouvé(s)`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de lire le fichier Excel',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      }
      setLoading(false);
    };

    reader.readAsArrayBuffer(file);
  }, [toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: processFile,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: false
  });

  const handleImport = async () => {
    setImporting(true);
    try {
      const response = await fetch('http://localhost:3001/api/employes/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ employes: data })
      });

      const result = await response.json();
      
      if (result.succes) {
        toast({
          title: 'Import réussi',
          description: `${result.donnees.imported} employé(s) importé(s) avec succès`,
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        onImportComplete && onImportComplete();
        handleClose();
      } else {
        toast({
          title: 'Erreur d\'import',
          description: result.message || 'Erreur lors de l\'import',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur de connexion lors de l\'import',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
    setImporting(false);
  };

  const handleClose = () => {
    setFile(null);
    setData([]);
    setErrors([]);
    setWarnings([]);
    setStep(1);
    onClose();
  };

  const renderUploadStep = () => (
    <VStack spacing={6}>
      <Box
        {...getRootProps()}
        border="2px dashed"
        borderColor={isDragActive ? "blue.500" : "gray.300"}
        borderRadius="lg"
        p={10}
        textAlign="center"
        cursor="pointer"
        bg={isDragActive ? "blue.50" : "gray.50"}
        transition="all 0.2s"
        w="full"
      >
        <input {...getInputProps()} />
        <Icon as={MdCloudUpload} w={16} h={16} color="blue.500" mb={4} />
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          {isDragActive ? 'Déposez le fichier ici' : 'Glissez votre fichier Excel ici'}
        </Text>
        <Text color="gray.500" mb={4}>
          ou cliquez pour sélectionner un fichier (.xlsx, .xls)
        </Text>
        {loading && <Progress size="sm" isIndeterminate colorScheme="blue" />}
      </Box>

      <Divider />
      
      <VStack spacing={3} align="stretch" w="full">
        <Text fontWeight="bold">Format requis:</Text>
        <Text fontSize="sm" color="gray.600">
          Votre fichier Excel doit contenir les colonnes suivantes:
        </Text>
        <List spacing={2}>
          <ListItem fontSize="sm">
            <ListIcon as={MdCheckCircle} color="red.500" />
            <Text as="span" fontWeight="bold">nom</Text> (obligatoire)
          </ListItem>
          <ListItem fontSize="sm">
            <ListIcon as={MdCheckCircle} color="red.500" />
            <Text as="span" fontWeight="bold">prenom</Text> (obligatoire)
          </ListItem>
          <ListItem fontSize="sm">
            <ListIcon as={MdCheckCircle} color="red.500" />
            <Text as="span" fontWeight="bold">email</Text> (obligatoire)
          </ListItem>
          <ListItem fontSize="sm">
            <ListIcon as={MdCheckCircle} color="red.500" />
            <Text as="span" fontWeight="bold">salaire</Text> (obligatoire)
          </ListItem>
          <ListItem fontSize="sm">
            <ListIcon as={MdCheckCircle} color="red.500" />
            <Text as="span" fontWeight="bold">typeContrat</Text> (obligatoire - SALAIRE_FIXE, HONORAIRE)
          </ListItem>
          <ListItem fontSize="sm">
            <ListIcon as={MdCheckCircle} color="green.500" />
            <Text as="span" fontWeight="bold">poste</Text> (optionnel)
          </ListItem>
          <ListItem fontSize="sm">
            <ListIcon as={MdCheckCircle} color="green.500" />
            <Text as="span" fontWeight="bold">telephone</Text> (optionnel)
          </ListItem>
          <ListItem fontSize="sm">
            <ListIcon as={MdCheckCircle} color="green.500" />
            <Text as="span" fontWeight="bold">adresse</Text> (optionnel)
          </ListItem>
          <ListItem fontSize="sm">
            <ListIcon as={MdCheckCircle} color="green.500" />
            <Text as="span" fontWeight="bold">dateEmbauche</Text> (optionnel, format: YYYY-MM-DD)
          </ListItem>
        </List>
      </VStack>

      <Button
        leftIcon={<MdFileDownload />}
        variant="outline"
        onClick={downloadTemplate}
        w="full"
      >
        Télécharger un fichier template
      </Button>
    </VStack>
  );

  const renderPreviewStep = () => (
    <VStack spacing={4} align="stretch">
      {/* Résumé */}
      <HStack spacing={4} justify="space-between">
        <Badge colorScheme="blue" p={2} borderRadius="md">
          {data.length} employé(s) valide(s)
        </Badge>
        {errors.length > 0 && (
          <Badge colorScheme="red" p={2} borderRadius="md">
            {errors.length} erreur(s)
          </Badge>
        )}
        {warnings.length > 0 && (
          <Badge colorScheme="orange" p={2} borderRadius="md">
            {warnings.length} avertissement(s)
          </Badge>
        )}
      </HStack>

      {/* Erreurs */}
      {errors.length > 0 && (
        <Alert status="error">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold" mb={2}>Erreurs détectées:</Text>
            <VStack align="stretch" spacing={1}>
              {errors.slice(0, 5).map((error, index) => (
                <Text key={index} fontSize="sm">{error}</Text>
              ))}
              {errors.length > 5 && (
                <Text fontSize="sm" color="gray.600">
                  ... et {errors.length - 5} autre(s) erreur(s)
                </Text>
              )}
            </VStack>
          </Box>
        </Alert>
      )}

      {/* Avertissements */}
      {warnings.length > 0 && (
        <Alert status="warning">
          <AlertIcon />
          <Box>
            <Text fontWeight="bold" mb={2}>Avertissements:</Text>
            <VStack align="stretch" spacing={1}>
              {warnings.slice(0, 3).map((warning, index) => (
                <Text key={index} fontSize="sm">{warning}</Text>
              ))}
              {warnings.length > 3 && (
                <Text fontSize="sm" color="gray.600">
                  ... et {warnings.length - 3} autre(s) avertissement(s)
                </Text>
              )}
            </VStack>
          </Box>
        </Alert>
      )}

      {/* Prévisualisation des données */}
      {data.length > 0 && (
        <Box>
          <Text fontWeight="bold" mb={3}>Aperçu des données (5 premiers):</Text>
          <TableContainer>
            <Table size="sm" variant="simple">
              <Thead>
                <Tr>
                  <Th>Nom</Th>
                  <Th>Prénom</Th>
                  <Th>Email</Th>
                  <Th>Salaire</Th>
                  <Th>Type Contrat</Th>
                  <Th>Poste</Th>
                </Tr>
              </Thead>
              <Tbody>
                {data.slice(0, 5).map((row, index) => (
                  <Tr key={index}>
                    <Td>{row.nom}</Td>
                    <Td>{row.prenom}</Td>
                    <Td>{row.email}</Td>
                    <Td>{row.salaire?.toLocaleString()} FCFA</Td>
                    <Td>{row.typeContrat}</Td>
                    <Td>{row.poste || '-'}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
          {data.length > 5 && (
            <Text fontSize="sm" color="gray.600" mt={2}>
              ... et {data.length - 5} autre(s) employé(s)
            </Text>
          )}
        </Box>
      )}
    </VStack>
  );

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="4xl">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {step === 1 ? 'Importer des employés' : step === 2 ? 'Prévisualisation' : 'Import en cours'}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          {step === 1 && renderUploadStep()}
          {step === 2 && renderPreviewStep()}
        </ModalBody>

        <ModalFooter>
          <HStack spacing={3}>
            {step === 2 && (
              <Button variant="ghost" onClick={() => setStep(1)}>
                Retour
              </Button>
            )}
            <Button variant="ghost" onClick={handleClose}>
              Annuler
            </Button>
            {step === 2 && data.length > 0 && errors.length === 0 && (
              <Button
                colorScheme="blue"
                onClick={handleImport}
                isLoading={importing}
                loadingText="Import en cours..."
              >
                Importer {data.length} employé(s)
              </Button>
            )}
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default EmployeeImportModal;