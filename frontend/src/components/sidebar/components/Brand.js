import React, { useState, useEffect } from "react";

// Chakra imports
import { Flex, Text, useColorModeValue, Image, Box } from "@chakra-ui/react";

// Custom components
import { HSeparator } from "components/separator/Separator";

export function SidebarBrand() {
  //   Chakra color mode
  let logoColor = useColorModeValue("navy.700", "white");
  const [entrepriseInfo, setEntrepriseInfo] = useState(null);

  useEffect(() => {
    // Récupérer les informations de l'utilisateur connecté
    const userData = JSON.parse(localStorage.getItem('user') || '{}');
    
    if (userData.entrepriseId) {
      // Si l'utilisateur a une entreprise, récupérer ses informations
      fetchEntrepriseInfo(userData.entrepriseId);
    } else if (userData.isSuperAdminAccess && userData.entrepriseNom) {
      // Si c'est un super admin qui accède à une entreprise
      setEntrepriseInfo({
        nom: userData.entrepriseNom,
        logo: null // Le logo sera récupéré via l'API si nécessaire
      });
    }
  }, []);

  const fetchEntrepriseInfo = async (entrepriseId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/entreprises/${entrepriseId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.succes) {
          setEntrepriseInfo(data.donnees);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des informations de l\'entreprise:', error);
    }
  };

  // Affichage du logo et nom de l'entreprise si disponible
  if (entrepriseInfo) {
    return (
      <Flex align='center' direction='column'>
        {entrepriseInfo.logo && (
          <Box mb='10px'>
            <Image 
              src={entrepriseInfo.logo}
              alt={`Logo ${entrepriseInfo.nom}`}
              maxH='60px'
              maxW='200px'
              objectFit='contain'
              fallback={
                <Text 
                  fontSize='18px' 
                  fontWeight='bold' 
                  color={logoColor}
                  textAlign='center'
                >
                  {entrepriseInfo.nom}
                </Text>
              }
            />
          </Box>
        )}
        <Text 
          fontSize={entrepriseInfo.logo ? '16px' : '20px'} 
          fontWeight='bold' 
          color={logoColor}
          my={entrepriseInfo.logo ? '16px' : '32px'}
          textAlign='center'
          letterSpacing='wider'
        >
          {entrepriseInfo.nom}
        </Text>
        <HSeparator mb='20px' />
      </Flex>
    );
  }

  // Affichage par défaut (MARAKHIB-GLOBAL)
  return (
    <Flex align='center' direction='column'>
      <Text 
        fontSize='20px' 
        fontWeight='bold' 
        color={logoColor}
        my='32px'
        textAlign='center'
        letterSpacing='wider'
      >
        MARAKHIB-GLOBAL
      </Text>
      <HSeparator mb='20px' />
    </Flex>
  );
}

export default SidebarBrand;
