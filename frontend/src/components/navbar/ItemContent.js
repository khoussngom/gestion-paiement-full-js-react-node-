import React from 'react';
import { Text, useColorModeValue } from '@chakra-ui/react';

export const ItemContent = ({ info }) => {
  const textColor = useColorModeValue('navy.700', 'white');
  
  return (
    <Text color={textColor} fontSize="14px" fontWeight="400">
      {info}
    </Text>
  );
};

export default ItemContent;
