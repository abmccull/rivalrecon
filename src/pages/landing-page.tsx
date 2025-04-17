import React from 'react';
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  type BoxProps,
} from '@chakra-ui/react';
import { motion, type MotionProps } from 'framer-motion';
import { Link } from 'react-router-dom';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type MotionBoxProps = Omit<BoxProps, keyof MotionProps> & MotionProps;

const MotionBox = motion<BoxProps>(Box);

const LandingPage: React.FC = () => {
  const bgGradient = "linear(to-r, blue.400, purple.500)";

  return (
    <Box
      minH="100vh"
      bgGradient={bgGradient}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Container maxW="container.xl">
        <VStack gap="8" textAlign="center" color="white">
          <MotionBox
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" } as any}
          >
            <Heading
              as="h1"
              size="2xl"
              bgGradient="linear(to-r, white, blue.100)"
              bgClip="text"
              mb={4}
            >
              RivalRecon
            </Heading>
            <Text fontSize="xl" mb={6}>
              Unlock Competitive Intelligence Through Product Reviews
            </Text>
            <Text fontSize="lg" mb={8} maxW="2xl" mx="auto">
              Analyze product reviews from your competitors, gain actionable insights,
              and make data-driven decisions to stay ahead in the CPG market.
            </Text>
          </MotionBox>

          <MotionBox
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 } as any}
          >
            <Link to="/sign-in">
              <Button
                size="lg"
                colorScheme="whiteAlpha"
                variant="outline"
                _hover={{
                  bg: 'whiteAlpha.200',
                  transform: 'translateY(-2px)',
                }}
              >
                Get Started
              </Button>
            </Link>
          </MotionBox>
        </VStack>
      </Container>
    </Box>
  );
};

export default LandingPage; 