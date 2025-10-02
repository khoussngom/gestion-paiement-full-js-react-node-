/* eslint-disable */
import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
// chakra imports
import { Box, Flex, HStack, Text, useColorModeValue } from "@chakra-ui/react";
import { useAuth } from "contexts/AuthContext";

export function SidebarLinks(props) {
  //   Chakra color mode
  let location = useLocation();
  let navigate = useNavigate();
  let activeColor = useColorModeValue("gray.700", "white");
  let inactiveColor = useColorModeValue(
    "secondaryGray.600",
    "secondaryGray.600"
  );
  let activeIcon = useColorModeValue("brand.500", "white");
  let textColor = useColorModeValue("secondaryGray.500", "white");
  let brandColor = useColorModeValue("brand.500", "brand.400");

  const { routes } = props;
  const { logout, user } = useAuth();

  // Filtrer les routes selon le rôle et masquer les routes indésirables
  const filteredRoutes = routes.filter(route => {
    // Masquer les routes marquées comme hideInSidebar
    if (route.hideInSidebar) return false;
    
    // Si c'est une route super admin only, vérifier le rôle
    if (route.superAdminOnly && user?.role !== 'SUPER_ADMIN') {
      return false;
    }
    
    // Si c'est une route vigile only, vérifier le rôle
    if (route.vigileOnly && user?.role !== 'VIGILE') {
      return false;
    }
    
    // Si c'est une route admin only, vérifier le rôle
    if (route.adminOnly && !['ADMIN_ENTREPRISE', 'SUPER_ADMIN'].includes(user?.role)) {
      return false;
    }
    
    return true;
  });

  // Fonction pour gérer la déconnexion
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/auth/sign-in');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // verifies if routeName is the one active (in browser input)
  const activeRoute = (routeName) => {
    return location.pathname.includes(routeName);
  };

  // this function creates the links from the secondary accordions (for example auth -> sign-in -> default)
  const createLinks = (routes) => {
    return routes.map((route, index) => {
      if (route.category) {
        return (
          <>
            <Text
              fontSize={"md"}
              color={activeColor}
              fontWeight='bold'
              mx='auto'
              ps={{
                sm: "10px",
                xl: "16px",
              }}
              pt='18px'
              pb='12px'
              key={index}>
              {route.name}
            </Text>
            {createLinks(route.items)}
          </>
        );
      } else if (
        route.layout === "/admin" ||
        route.layout === "/auth" ||
        route.layout === "/rtl"
      ) {
        // Gestion spéciale pour le bouton de déconnexion
        if (route.action === 'logout') {
          return (
            <Box 
              key={index} 
              onClick={handleLogout}
              cursor="pointer"
              _hover={{ bg: 'gray.50' }}
              borderRadius="md"
            >
              {route.icon ? (
                <Box>
                  <HStack
                    spacing="26px"
                    py='5px'
                    ps='10px'>
                    <Flex w='100%' alignItems='center' justifyContent='center'>
                      <Box
                        color={textColor}
                        me='18px'>
                        {route.icon}
                      </Box>
                      <Text
                        me='auto'
                        color={textColor}
                        fontWeight="normal">
                        {route.name}
                      </Text>
                    </Flex>
                  </HStack>
                </Box>
              ) : null}
            </Box>
          );
        }

        return (
          <NavLink key={index} to={route.layout + route.path}>
            {route.icon ? (
              <Box>
                <HStack
                  spacing={
                    activeRoute(route.path.toLowerCase()) ? "22px" : "26px"
                  }
                  py='5px'
                  ps='10px'>
                  <Flex w='100%' alignItems='center' justifyContent='center'>
                    <Box
                      color={
                        activeRoute(route.path.toLowerCase())
                          ? activeIcon
                          : textColor
                      }
                      me='18px'>
                      {route.icon}
                    </Box>
                    <Text
                      me='auto'
                      color={
                        activeRoute(route.path.toLowerCase())
                          ? activeColor
                          : textColor
                      }
                      fontWeight={
                        activeRoute(route.path.toLowerCase())
                          ? "bold"
                          : "normal"
                      }>
                      {route.name}
                    </Text>
                  </Flex>
                  <Box
                    h='36px'
                    w='4px'
                    bg={
                      activeRoute(route.path.toLowerCase())
                        ? brandColor
                        : "transparent"
                    }
                    borderRadius='5px'
                  />
                </HStack>
              </Box>
            ) : (
              <Box>
                <HStack
                  spacing={
                    activeRoute(route.path.toLowerCase()) ? "22px" : "26px"
                  }
                  py='5px'
                  ps='10px'>
                  <Text
                    me='auto'
                    color={
                      activeRoute(route.path.toLowerCase())
                        ? activeColor
                        : inactiveColor
                    }
                    fontWeight={
                      activeRoute(route.path.toLowerCase()) ? "bold" : "normal"
                    }>
                    {route.name}
                  </Text>
                  <Box h='36px' w='4px' bg='brand.400' borderRadius='5px' />
                </HStack>
              </Box>
            )}
          </NavLink>
        );
      }
    });
  };
  //  BRAND
  return createLinks(filteredRoutes);
}

export default SidebarLinks;
