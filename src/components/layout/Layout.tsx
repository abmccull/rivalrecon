import React, { useState } from 'react';
import { Box, useBreakpointValue } from '@chakra-ui/react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { motion } from 'framer-motion';

const MotionBox = motion(Box);

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const isMobile = useBreakpointValue({ base: true, md: false }) || false;
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Determine content margin based on sidebar state
  const contentMarginLeft = useBreakpointValue({ 
    base: '0px',
    md: isCollapsed ? '60px' : '240px'
  }) || '0px';

  return (
    <Box 
      minH="100vh" 
      bg="gray.50"
      display="flex"
      flexDirection="column"
    >
      <Navbar />
      
      <Box 
        display="flex" 
        flex="1" 
        position="relative"
      >
        <Sidebar 
          isMobile={isMobile} 
          isCollapsed={isCollapsed} 
          setIsCollapsed={setIsCollapsed} 
        />
        
        <MotionBox
          flex="1"
          marginLeft={contentMarginLeft}
          transition={{ duration: 0.2 }}
          initial={false}
          animate={{ marginLeft: contentMarginLeft }}
          padding={4}
          pb="80px" // Ensure content doesn't get hidden behind footer
        >
          {children}
        </MotionBox>
      </Box>
      
      <Footer />
    </Box>
  );
}; 