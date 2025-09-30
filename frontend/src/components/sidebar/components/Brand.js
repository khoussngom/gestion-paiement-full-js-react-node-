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
    // Récupérer les informations d'entreprise depuis les statistiques du dashboard
    fetchDashboardStats();
    
    // Écouter les mises à jour du logo
    const handleLogoUpdate = () => {
      fetchDashboardStats();
    };
    
    window.addEventListener('companyLogoUpdated', handleLogoUpdate);
    
    return () => {
      window.removeEventListener('companyLogoUpdated', handleLogoUpdate);
    };
  }, []);

  const fetchDashboardStats = async () => {
    try {
      console.log('Brand - Fetching dashboard statistics...');
      const response = await fetch(`http://localhost:3001/api/dashboard/statistiques?t=${Date.now()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
          'Cache-Control': 'no-cache'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Brand - Dashboard data received:', data);
        
        if (data.succes && data.donnees && data.donnees.entreprise) {
          const entrepriseData = data.donnees.entreprise;
          console.log('Brand - Setting entreprise info from dashboard:', entrepriseData);
          console.log('Brand - Logo URL:', entrepriseData.logo);
          
          setEntrepriseInfo({
            nom: entrepriseData.nom,
            logo: entrepriseData.logo || null
          });
        } else {
          console.log('Brand - No entreprise in dashboard data');
          setEntrepriseInfo(null);
        }
      } else {
        console.log('Brand - Dashboard fetch failed:', response.status);
        setEntrepriseInfo(null);
      }
    } catch (error) {
      console.error('Brand - Error fetching dashboard stats:', error);
      setEntrepriseInfo(null);
    }
  };

  // Affichage du logo et nom de l'entreprise si disponible
  if (entrepriseInfo) {
    return (
      <Flex align='center' direction='column'>
        {entrepriseInfo.logo && (
          <Box mb='10px'>
            <Image 
              src={`${entrepriseInfo.logo}?t=${Date.now()}`}
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
