import { Box } from '@chakra-ui/react';

const IconBox = ({ children, ...rest }) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      borderRadius="12px"
      {...rest}
    >
      {children}
    </Box>
  );
};

export default IconBox;
