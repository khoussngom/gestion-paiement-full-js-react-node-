import React, { useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Button,
  useToast,
  HStack,
  Text,
  Box
} from '@chakra-ui/react';
import { MdPrint, MdFileDownload, MdClose } from 'react-icons/md';
import PaymentReceipt from './PaymentReceipt';
import { useCompanyTheme } from '../../contexts/CompanyThemeContext';

const ReceiptModal = ({ 
  isOpen, 
  onClose, 
  paiement, 
  employe, 
  entreprise, 
  cyclePaie 
}) => {
  const toast = useToast();
  const receiptRef = useRef();
  const { companyColors } = useCompanyTheme();

  // Générer un numéro de reçu unique
  const generateReceiptNumber = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `REC-${year}${month}${day}-${random}`;
  };

  const receiptNumber = generateReceiptNumber();

  const handlePrint = () => {
    const printContent = receiptRef.current;
    const originalContent = document.body.innerHTML;
    
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  const handleDownload = async () => {
    try {
      // Utiliser html2canvas si disponible pour générer un PDF
      if (window.html2canvas && window.jsPDF) {
        const canvas = await window.html2canvas(receiptRef.current);
        const imgData = canvas.toDataURL('image/png');
        
        const pdf = new window.jsPDF();
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft >= 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        pdf.save(`recu-${receiptNumber}.pdf`);
        
        toast({
          title: 'Succès',
          description: 'Reçu téléchargé avec succès',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Fallback: impression simple
        handlePrint();
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors du téléchargement du reçu',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="5xl">
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent 
        maxW="900px"
        bg="gray.50"
        borderRadius="xl"
        boxShadow="2xl"
      >
        <ModalHeader 
          bg={`linear-gradient(135deg, ${companyColors?.primary || "#007BFF"}, ${companyColors?.secondary || "#0056b3"})`}
          color="white"
          borderTopRadius="xl"
          py={4}
        >
          <HStack>
            <Box p={2} bg="whiteAlpha.200" borderRadius="md">
              <Text fontSize="lg">📄</Text>
            </Box>
            <Text fontSize="lg" fontWeight="bold">
              Reçu de Paiement N° {receiptNumber}
            </Text>
          </HStack>
        </ModalHeader>
        <ModalCloseButton color="white" _hover={{ bg: "whiteAlpha.200" }} />
        
        <ModalBody p={6} maxH="70vh" overflowY="auto">
          <div ref={receiptRef}>
            <PaymentReceipt
              paiement={paiement}
              employe={employe}
              entreprise={entreprise}
              cyclePaie={cyclePaie}
              receiptNumber={receiptNumber}
            />
          </div>
        </ModalBody>

        <ModalFooter 
          bg="white" 
          borderBottomRadius="xl" 
          borderTop="1px solid" 
          borderColor="gray.200"
          py={4}
        >
          <HStack spacing={3}>
            <Button
              leftIcon={<MdPrint />}
              colorScheme="blue"
              variant="outline"
              onClick={handlePrint}
              size="md"
              borderRadius="full"
              _hover={{ 
                transform: "translateY(-2px)",
                boxShadow: "lg"
              }}
              transition="all 0.2s"
            >
              Imprimer
            </Button>
            <Button
              leftIcon={<MdFileDownload />}
              style={{
                background: `linear-gradient(135deg, ${companyColors?.primary || "#007BFF"}, ${companyColors?.secondary || "#0056b3"})`,
                color: "white"
              }}
              onClick={handleDownload}
              size="md"
              borderRadius="full"
              _hover={{ 
                transform: "translateY(-2px)",
                boxShadow: "xl"
              }}
              transition="all 0.2s"
            >
              Télécharger PDF
            </Button>
            <Button 
              variant="ghost" 
              onClick={onClose}
              size="md"
              borderRadius="full"
              _hover={{ bg: "gray.100" }}
            >
              Fermer
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ReceiptModal;
