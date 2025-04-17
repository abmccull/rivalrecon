import React from 'react';
import { 
  Box, 
  Flex, 
  Button, 
  Heading, 
  Spacer, 
  HStack, 
  Menu, 
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  useColorModeValue
} from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useSupabaseAuth as useSupabase } from '../../features/auth/SupabaseAuthProvider';

const Header: React.FC = () => {
  const { user, isLoading, signOut } = useSupabase();
  const navigate = useNavigate();
  
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  
  return (
    <Box 
      as="header" 
      bg={bgColor} 
      py={4} 
      px={6} 
      borderBottom="1px" 
      borderColor={borderColor}
      position="sticky"
      top={0}
      zIndex={10}
      shadow="sm"
    >
      <Flex align="center" maxW="container.xl" mx="auto">
        <Heading 
          as={RouterLink} 
          to="/" 
          size="md" 
          bgGradient="linear(to-r, blue.500, teal.500)" 
          bgClip="text"
        >
          RivalRecon
        </Heading>
        
        <Spacer />
        
        <HStack spacing={4}>
          {!isLoading && (
            user ? (
              <>
                <Button 
                  as={RouterLink} 
                  to="/dashboard" 
                  variant="ghost"
                >
                  Dashboard
                </Button>
                
                <Menu>
                  <MenuButton>
                    <Avatar size="sm" name={user?.email || ''} />
                  </MenuButton>
                  <MenuList>
                    <MenuItem as={RouterLink} to="/dashboard">
                      Dashboard
                    </MenuItem>
                    <MenuItem onClick={handleSignOut}>
                      Sign Out
                    </MenuItem>
                  </MenuList>
                </Menu>
              </>
            ) : (
              <>
                <Button 
                  as={RouterLink} 
                  to="/sign-in" 
                  variant="ghost"
                >
                  Sign In
                </Button>
                <Button 
                  as={RouterLink} 
                  to="/sign-up" 
                  colorScheme="blue"
                >
                  Sign Up
                </Button>
              </>
            )
          )}
        </HStack>
      </Flex>
    </Box>
  );
};

export default Header; 