import React from 'react';
import {
  Box,
  Flex,
  Text,
  Stack,
  Icon,
  IconButton,
  Link as ChakraLink,
  Heading,
  Select,
  Divider,
  useDisclosure,
  useBreakpointValue,
} from '@chakra-ui/react';
import { 
  ChevronLeftIcon, 
  ChevronRightIcon,
  InfoIcon,
  ViewIcon,
  SettingsIcon
} from '@chakra-ui/icons';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

// Convert Chakra Box to motion component
const MotionBox = motion(Box);

// Define sidebar items
const SIDEBAR_ITEMS = [
  { label: 'Home', icon: InfoIcon, href: '/' },
  { label: 'Dashboard', icon: ViewIcon, href: '/dashboard' },
  { label: 'Profile', icon: SettingsIcon, href: '/profile' },
];

interface SidebarProps {
  isMobile: boolean;
  isCollapsed: boolean;
  setIsCollapsed: (isCollapsed: boolean) => void;
}

export const Sidebar = ({ isMobile, isCollapsed, setIsCollapsed }: SidebarProps) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const location = useLocation();
  
  // Determine if we're on mobile
  const display = useBreakpointValue({ base: 'none', md: 'block' });
  
  // If on mobile, render nothing (we use the drawer from navbar)
  if (isMobile) {
    return null;
  }

  const sidebarWidth = isCollapsed ? '60px' : '240px';

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const renderSidebarContent = () => (
    <Stack spacing={4}>
      {/* Menu Items */}
      {SIDEBAR_ITEMS.map((item) => (
        <ChakraLink
          key={item.label}
          as={Link}
          to={item.href}
          textDecoration="none"
          _hover={{ textDecoration: 'none' }}
        >
          <Flex
            align="center"
            p={2}
            borderRadius="md"
            bg={location.pathname === item.href ? 'gray.100' : 'transparent'}
            color={location.pathname === item.href ? 'teal.500' : 'gray.700'}
            _hover={{ bg: 'gray.100' }}
          >
            <Icon as={item.icon} boxSize={5} mr={isCollapsed ? 0 : 3} />
            {!isCollapsed && <Text>{item.label}</Text>}
          </Flex>
        </ChakraLink>
      ))}

      {!isCollapsed && (
        <>
          <Divider my={4} />
          
          {/* Filter Section */}
          <Box>
            <Heading size="xs" mb={2}>Filter Analyses</Heading>
            <Select placeholder="All Statuses" size="sm">
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </Select>
          </Box>
        </>
      )}
    </Stack>
  );

  return (
    <MotionBox
      display={display}
      position="fixed"
      left={0}
      h="calc(100vh - 64px)" // Account for navbar height
      w={sidebarWidth}
      bg="gray.50"
      borderRight="1px solid"
      borderColor="gray.200"
      transition={{ duration: 0.2 }}
      initial={false}
      animate={{ width: sidebarWidth }}
      pt={4}
      pb={4}
      zIndex={900}
    >
      {/* Toggle button */}
      <IconButton
        icon={isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        position="absolute"
        right="-12px"
        top="20px"
        size="sm"
        colorScheme="gray"
        borderRadius="full"
        onClick={toggleSidebar}
        zIndex={2}
      />

      {/* Content */}
      <Box px={4}>
        {renderSidebarContent()}
      </Box>
    </MotionBox>
  );
}; 