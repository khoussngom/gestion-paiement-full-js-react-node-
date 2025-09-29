import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Icon,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  useColorModeValue,
  useToast,
  VStack,
  Alert,
  AlertIcon,
  Image,
} from '@chakra-ui/react';
import DefaultAuth from 'layouts/auth/Default';
import { MdOutlineRemoveRedEye } from 'react-icons/md';
import { RiEyeCloseLine } from 'react-icons/ri';
import { useAuth } from 'contexts/AuthContext';
import loginImage from 'assets/img/auth/login.png';

function SignIn() {
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const { login } = useAuth();
  const toast = useToast();

  const textColor = useColorModeValue('navy.700', 'white');
  const textColorSecondary = 'gray.400';
  const textColorBrand = useColorModeValue('brand.500', 'white');
  const brandStars = useColorModeValue('brand.500', 'brand.400');

  const   handleClick = () => setShow(!show);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !motDePasse) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setLoading(true);
    try {
      const response = await login({ email, motDePasse });
      
      toast({
        title: 'Connexion réussie',
        description: 'Bienvenue dans le système de gestion des salariés',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Redirection basée sur le rôle
      const userRole = response.donnees?.utilisateur?.role;
      if (userRole === 'SUPER_ADMIN') {
        navigate('/admin/super-admin');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erreur de connexion';
      setError(errorMessage);
      toast({
        title: 'Erreur de connexion',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DefaultAuth>
      <Flex
        w="100%"
        h="100vh"
        direction={{ base: 'column', lg: 'row' }}
      >
              <Flex
        w={{ base: '100%', lg: '50%' }}
        h={{ base: '300px', lg: '100vh' }}
        display={{ base: 'none', lg: 'flex' }}
        alignItems="center"
        justifyContent="center"
        
      >
        <Image
          src={loginImage}
          alt="Login illustration"
          w="70%"
          h="70%"
          objectFit="cover"
          borderRadius={{ base: '15px', lg: '0' }}
        />
      </Flex>
        {/* Section du formulaire à gauche */}
        <Flex
          w={{ base: '100%', lg: '50%' }}
          alignItems="center"
          justifyContent="center"
          px={{ base: '25px', lg: '50px' }}
          py={{ base: '40px', lg: '0' }}
        >
          <Box 
            w="100%" 
            maxW="420px"
            bg="rgba(255, 255, 255, 0.08)"
            backdropFilter="blur(20px)"
            borderRadius="20px"
            border="1px solid rgba(255, 255, 255, 0.2)"
            boxShadow="0 8px 32px rgba(0, 0, 0, 0.1)"
            p="40px"
            position="relative"
            zIndex={1}
          >
            <Heading color={textColor} fontSize="36px" mb="10px">
              Connexion
            </Heading>
            <Text
              mb="36px"
              ms="4px"
              color={textColorSecondary}
              fontWeight="400"
              fontSize="md"
            >
              Accédez à votre système de gestion des salariés
            </Text>
            {error && (
              <Alert 
                status="error" 
                mb="24px" 
                borderRadius="15px"
                bg="rgba(245, 101, 101, 0.1)"
                backdropFilter="blur(10px)"
                border="1px solid rgba(245, 101, 101, 0.3)"
                color="red.300"
              >
                <AlertIcon />
                {error}
              </Alert>
            )}

          <form onSubmit={handleSubmit}>
            <VStack spacing="24px" align="stretch" position="relative" zIndex={2}>
              <FormControl>
                <FormLabel
                  ms="4px"
                  fontSize="sm"
                  fontWeight="500"
                  color={textColor}
                  display="flex"
                >
                  Email<Text color={brandStars}>*</Text>
                </FormLabel>
                <Input
                  isRequired={false}
                  variant="auth"
                  fontSize="sm"
                  type="email"
                  placeholder="admin@entreprise.com"
                  mb="24px"
                  fontWeight="500"
                  size="lg"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  bg="rgba(255, 255, 255, 0.1)"
                  backdropFilter="blur(10px)"
                  border="1px solid rgba(255, 255, 255, 0.2)"
                  borderRadius="12px"
                  _hover={{
                    bg: "rgba(255, 255, 255, 0.15)",
                    borderColor: "rgba(255, 255, 255, 0.3)"
                  }}
                  _focus={{
                    bg: "rgba(255, 255, 255, 0.15)",
                    borderColor: "rgba(255, 255, 255, 0.4)",
                    boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.2)"
                  }}
                />
                
                <FormLabel
                  ms="4px"
                  fontSize="sm"
                  fontWeight="500"
                  color={textColor}
                  display="flex"
                >
                  Mot de passe<Text color={brandStars}>*</Text>
                </FormLabel>
                <InputGroup size="md">
                  <Input
                    isRequired={false}
                    fontSize="sm"
                    placeholder="Votre mot de passe"
                    mb="24px"
                    size="lg"
                    type={show ? 'text' : 'password'}
                    variant="auth"
                    value={motDePasse}
                    onChange={(e) => setMotDePasse(e.target.value)}
                    bg="rgba(255, 255, 255, 0.1)"
                    backdropFilter="blur(10px)"
                    border="1px solid rgba(255, 255, 255, 0.2)"
                    borderRadius="12px"
                    _hover={{
                      bg: "rgba(255, 255, 255, 0.15)",
                      borderColor: "rgba(255, 255, 255, 0.3)"
                    }}
                    _focus={{
                      bg: "rgba(255, 255, 255, 0.15)",
                      borderColor: "rgba(255, 255, 255, 0.4)",
                      boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.2)"
                    }}
                  />
                  <InputRightElement display="flex" alignItems="center" mt="4px">
                    <Icon
                      color={textColorSecondary}
                      _hover={{ cursor: 'pointer' }}
                      as={show ? RiEyeCloseLine : MdOutlineRemoveRedEye}
                      onClick={handleClick}
                    />
                  </InputRightElement>
                </InputGroup>
                
                <Flex justifyContent="space-between" align="center" mb="24px">
                  <FormControl display="flex" alignItems="center">
                    <Checkbox
                      id="remember-login"
                      colorScheme="brandScheme"
                      me="10px"
                    />
                    <FormLabel
                      htmlFor="remember-login"
                      mb="0"
                      fontWeight="normal"
                      color={textColor}
                      fontSize="sm"
                    >
                      Se souvenir de moi
                    </FormLabel>
                  </FormControl>
                  <NavLink to="/auth/forgot-password">
                    <Text
                      color={textColorBrand}
                      fontSize="sm"
                      w="124px"
                      fontWeight="500"
                    >
                      Mot de passe oublié ?
                    </Text>
                  </NavLink>
                </Flex>
                
                <Button
                  fontSize="sm"
                  variant="brand"
                  fontWeight="500"
                  w="100%"
                  h="50"
                  mb="24px"
                  type="submit"
                  isLoading={loading}
                  loadingText="Connexion..."
                  bg="rgba(66, 153, 225, 0.8)"
                  backdropFilter="blur(10px)"
                  border="1px solid rgba(66, 153, 225, 0.3)"
                  borderRadius="12px"
                  color="white"
                  _hover={{
                    bg: "rgba(66, 153, 225, 0.9)",
                    borderColor: "rgba(66, 153, 225, 0.5)",
                    transform: "translateY(-2px)",
                    boxShadow: "0 4px 20px rgba(66, 153, 225, 0.4)"
                  }}
                  _active={{
                    transform: "translateY(0px)"
                  }}
                >
                  Se connecter
                </Button>
              </FormControl>
            </VStack>
          </form>
          
          <Flex
            flexDirection="column"
            justifyContent="center"
            alignItems="start"
            maxW="100%"
            mt="0px"
          >
            {/* <Text color={textColorDetails} fontWeight="400" fontSize="14px">
              Pas encore de compte ?
              <NavLink to="/auth/sign-up">
                <Text
                  color={textColorBrand}
                  as="span"
                  ms="5px"
                  fontWeight="500"
                >
                  Créer un compte
                </Text>
              </NavLink>
            </Text> */}
          </Flex>
        </Box>
      </Flex>
      
      {/* Section de l'image à droite */}
      <Box
        display={{ base: 'none', lg: 'flex' }}
        w={{ base: '100%', lg: '50%' }}
        h="100vh"
        justifyContent="center"
        alignItems="center"
        position="relative"
        bg="linear-gradient(135deg, rgba(66, 153, 225, 0.1) 0%, rgba(159, 122, 234, 0.1) 100%)"
        overflow="hidden"
      >
        <Box
          position="absolute"
          top="0"
          left="0"
          right="0"
          bottom="0"
          bgImage="url('/assets/img/auth/banner.png')"
          bgSize="cover"
          bgPosition="center"
          bgRepeat="no-repeat"
          opacity="0.7"
        />
        <Box
          position="relative"
          zIndex="1"
          textAlign="center"
          color="white"
          p={8}
        >
          <Heading size="xl" mb={4}>
            Bienvenue dans notre plateforme
          </Heading>
          <Text fontSize="lg">
            Gérez facilement vos salaires et vos employés
          </Text>
        </Box>
      </Box>
    </Flex>
    </DefaultAuth>
  );
}

export default SignIn;
