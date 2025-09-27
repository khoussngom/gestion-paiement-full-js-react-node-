// Chakra imports
import { Box, Grid, Text, useColorModeValue } from "@chakra-ui/react";

// Custom components
import Banner from "views/admin/profile/components/Banner";
import Card from "components/card/Card";

// Assets
import banner from "assets/img/auth/banner.png";
import avatar from "assets/img/avatars/avatar4.png";
import React from "react";
import { useAuth } from "contexts/AuthContext";

export default function Overview() {
  const { user } = useAuth();
  const textColorPrimary = useColorModeValue("secondaryGray.900", "white");

  return (
    <Box pt={{ base: "130px", md: "80px", xl: "80px" }}>
      <Grid
        templateColumns={{
          base: "1fr",
          lg: "1fr",
        }}
        gap={{ base: "20px", xl: "20px" }}>
        <Banner
          banner={banner}
          avatar={avatar}
          name={user ? `${user.prenom} ${user.nom}` : 'Utilisateur'}
          job={user ? user.role : 'Rôle'}
          posts='0'
          followers='0'
          following='0'
        />
        <Card p="20px">
          <Text
            color={textColorPrimary}
            fontWeight='bold'
            fontSize='2xl'
            mt='10px'
            mb='4px'>
            Informations du Profil
          </Text>
          <Text fontSize='md' color="gray.400" mb='20px'>
            Gérez vos informations personnelles et préférences de compte.
          </Text>
          {user && (
            <Box>
              <Text><strong>Email:</strong> {user.email}</Text>
              <Text><strong>Rôle:</strong> {user.role}</Text>
              <Text><strong>Entreprise:</strong> {user.entrepriseId || 'Non assigné'}</Text>
            </Box>
          )}
        </Card>
      </Grid>
    </Box>
  );
}
