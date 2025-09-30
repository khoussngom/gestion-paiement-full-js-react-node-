import React, { useState } from 'react';
import {
  Box,
  Button,
  Grid,
  Text,
  VStack,
  HStack,
  Input,
  FormControl,
  FormLabel,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { MdColorLens, MdCheck } from 'react-icons/md';

// Palette de couleurs pré-définies
const COLOR_PALETTE = [
  // Bleus
  '#4318FF', '#3182CE', '#2B6CB0', '#1A365D', '#0066CC',
  // Violets
  '#805AD5', '#6B46C1', '#553C9A', '#44337A', '#9F7AEA',
  // Verts
  '#38A169', '#2F855A', '#276749', '#22543D', '#48BB78',
  // Oranges/Rouge
  '#E53E3E', '#C53030', '#9B2C2C', '#742A2A', '#F56500',
  // Roses
  '#D53F8C', '#B83280', '#97266D', '#702459', '#ED64A6',
  // Jaunes
  '#D69E2E', '#B7791F', '#975A16', '#744210', '#ECC94B',
  // Teals
  '#319795', '#2C7A7B', '#285E61', '#234E52', '#4FD1C7',
  // Grays
  '#4A5568', '#2D3748', '#1A202C', '#171923', '#718096'
];

const ColorPicker = ({ 
  selectedColor = '#4318FF', 
  onColorChange, 
  label = 'Couleur primaire',
  isDisabled = false 
}) => {
  const [customColor, setCustomColor] = useState(selectedColor);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleColorSelect = (color) => {
    setCustomColor(color);
    onColorChange(color);
    onClose();
  };

  const handleCustomColorChange = (e) => {
    const color = e.target.value;
    setCustomColor(color);
    onColorChange(color);
  };

  return (
    <FormControl>
      <FormLabel>{label}</FormLabel>
      <Popover isOpen={isOpen} onOpen={onOpen} onClose={onClose}>
        <PopoverTrigger>
          <Button
            leftIcon={<MdColorLens />}
            variant="outline"
            size="md"
            w="200px"
            justifyContent="flex-start"
            isDisabled={isDisabled}
          >
            <HStack spacing={3}>
              <Box
                w="20px"
                h="20px"
                borderRadius="md"
                bg={selectedColor}
                border="1px solid"
                borderColor="gray.200"
              />
              <Text fontSize="sm">{selectedColor}</Text>
            </HStack>
          </Button>
        </PopoverTrigger>
        
        <PopoverContent w="320px">
          <PopoverHeader fontWeight="semibold">
            Choisir une couleur
          </PopoverHeader>
          <PopoverCloseButton />
          
          <PopoverBody>
            <VStack spacing={4} align="stretch">
              {/* Couleur personnalisée */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  Couleur personnalisée
                </Text>
                <HStack>
                  <Input
                    type="color"
                    value={customColor}
                    onChange={handleCustomColorChange}
                    w="60px"
                    h="40px"
                    p={1}
                    cursor="pointer"
                  />
                  <Input
                    value={customColor}
                    onChange={(e) => handleCustomColorChange(e)}
                    placeholder="#4318FF"
                    size="sm"
                    fontFamily="mono"
                  />
                </HStack>
              </Box>

              {/* Palette prédéfinie */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  Couleurs prédéfinies
                </Text>
                <Grid templateColumns="repeat(5, 1fr)" gap={2}>
                  {COLOR_PALETTE.map((color) => (
                    <Box
                      key={color}
                      w="45px"
                      h="45px"
                      bg={color}
                      borderRadius="lg"
                      cursor="pointer"
                      border="2px solid"
                      borderColor={selectedColor === color ? 'white' : 'transparent'}
                      boxShadow={selectedColor === color ? '0 0 0 2px currentColor' : 'md'}
                      position="relative"
                      onClick={() => handleColorSelect(color)}
                      _hover={{
                        transform: 'scale(1.1)',
                        transition: 'all 0.2s'
                      }}
                    >
                      {selectedColor === color && (
                        <Box
                          position="absolute"
                          top="50%"
                          left="50%"
                          transform="translate(-50%, -50%)"
                          color="white"
                          fontSize="lg"
                        >
                          <MdCheck />
                        </Box>
                      )}
                    </Box>
                  ))}
                </Grid>
              </Box>

              {/* Aperçu */}
              <Box>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  Aperçu
                </Text>
                <HStack spacing={3} p={3} bg="gray.50" borderRadius="md">
                  <Button
                    size="sm"
                    bg={selectedColor}
                    color="white"
                    _hover={{ bg: selectedColor, opacity: 0.8 }}
                  >
                    Bouton
                  </Button>
                  <Box
                    w="30px"
                    h="4px"
                    bg={selectedColor}
                    borderRadius="full"
                  />
                  <Text fontSize="sm" color={selectedColor} fontWeight="bold">
                    Texte coloré
                  </Text>
                </HStack>
              </Box>
            </VStack>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </FormControl>
  );
};

export default ColorPicker;
