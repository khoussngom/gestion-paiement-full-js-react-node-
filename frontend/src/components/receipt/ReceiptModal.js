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
  HStack
} from '@chakra-ui/react';
import { MdPrint, MdFileDownload } from 'react-icons/md';
import PaymentReceipt from './PaymentReceipt';

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
    <Modal isOpen={isOpen} onClose={onClose} size="4xl">
      <ModalOverlay />
      <ModalContent maxW="800px">
        <ModalHeader>Reçu de Paiement</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
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

        <ModalFooter>
          <HStack spacing={3}>
            <Button
              leftIcon={<MdPrint />}
              colorScheme="blue"
              variant="outline"
              onClick={handlePrint}
            >
              Imprimer
            </Button>
            <Button
              leftIcon={<MdFileDownload />}
              colorScheme="green"
              onClick={handleDownload}
            >
              Télécharger PDF
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Fermer
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ReceiptModal;
