import React from 'react';
import {
  Box,
  Flex,
  Text,
  Button,
  Stack,
  IconButton,
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Drawer,
  DrawerBody,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Link as ChakraLink,
} from '@chakra-ui/react';
import { HamburgerIcon, ChevronDownIcon, SearchIcon } from '@chakra-ui/icons';
import { Link, useLocation } from 'react-router-dom';
import { useSupabaseAuth } from '../../features/auth/SupabaseAuthProvider';

// Navigation links
const NAV_ITEMS = [
  { label: 'Home', href: '/' },
  { label: 'Dashboard', href: '/dashboard' },
];

export const Navbar = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, signOut } = useSupabaseAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={1000}
      bg="blue.700"
      px={4}
      h={16}
      boxShadow="md"
    >
      <Flex h={16} alignItems="center" justifyContent="space-between">
        {/* Logo and Brand */}
        <Flex alignItems="center">
          <IconButton
            icon={<HamburgerIcon />}
            display={{ base: 'flex', md: 'none' }}
            aria-label="Open menu"
            variant="ghost"
            color="white"
            onClick={onOpen}
            _hover={{ bg: 'blue.600' }}
          />

          <Flex alignItems="center" ml={{ base: 0, md: 4 }}>
            <SearchIcon color="teal.500" boxSize={6} mr={2} />
            <Text
              color="white"
              fontWeight="bold"
              fontSize="xl"
              as={Link}
              to="/"
              _hover={{ textDecoration: 'none' }}
            >
              RivalRecon
            </Text>
          </Flex>
        </Flex>

        {/* Desktop Navigation Links */}
        <Stack
          direction="row"
          spacing={6}
          display={{ base: 'none', md: 'flex' }}
        >
          {NAV_ITEMS.map((navItem) => (
            <ChakraLink
              key={navItem.label}
              as={Link}
              to={navItem.href}
              fontWeight={location.pathname === navItem.href ? "bold" : "normal"}
              color="white"
              py={1}
              borderBottom={location.pathname === navItem.href ? "2px solid white" : "2px solid transparent"}
              _hover={{
                textDecoration: 'none',
                borderBottom: "2px solid white",
              }}
            >
              {navItem.label}
            </ChakraLink>
          ))}
        </Stack>

        {/* User Profile and Account */}
        {user ? (
          <Menu>
            <MenuButton
              as={Button}
              rounded="full"
              variant="link"
              cursor="pointer"
              minW={0}
            >
              <Avatar
                size="sm"
                name={user.email || 'User'}
                bg="teal.500"
                color="white"
              />
            </MenuButton>
            <MenuList>
              <MenuItem as={Link} to="/profile">Profile</MenuItem>
              <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <Button
            as={Link}
            to="/sign-in"
            variant="outline"
            colorScheme="whiteAlpha"
            size="sm"
          >
            Sign In
          </Button>
        )}
      </Flex>

      {/* Mobile Navigation Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerBody pt={10}>
            <Stack spacing={4}>
              {NAV_ITEMS.map((navItem) => (
                <ChakraLink
                  key={navItem.label}
                  as={Link}
                  to={navItem.href}
                  fontWeight={location.pathname === navItem.href ? "bold" : "normal"}
                  color="blue.700"
                  py={2}
                  onClick={onClose}
                >
                  {navItem.label}
                </ChakraLink>
              ))}
              {user && (
                <ChakraLink
                  as={Link}
                  to="/profile"
                  fontWeight={location.pathname === '/profile' ? "bold" : "normal"}
                  color="blue.700"
                  py={2}
                  onClick={onClose}
                >
                  Profile
                </ChakraLink>
              )}
            </Stack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}; 