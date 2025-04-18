import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Text,
  VStack,
  Card,
  CardBody,
  CardHeader,
  IconButton,
  Link as ChakraLink,
  Image,
  Collapse,
  useDisclosure,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Circle,
  Divider,
  Icon,
  useColorModeValue,
  SimpleGrid,
  List,
  ListIcon,
  ListItem,
  Stack,
} from '@chakra-ui/react';
import { ChevronRightIcon, HamburgerIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
// Import icons from react-icons
import { 
  FiSearch, 
  FiBarChart2, 
  FiCpu, 
  FiDatabase, 
  FiUsers, 
  FiTrendingUp, 
  FiTarget, 
  FiLayers, 
  FiShield, 
  FiMessageCircle, 
  FiCheckCircle,
  FiDownload,
  FiCalendar,
  FiMail,
  FiSettings,
  FiServer,
  FiUserCheck,
  FiCode,
  FiActivity,
  FiLinkedin,
  FiTwitter,
  FiInstagram,
  FiMenu,
  FiChevronRight,
  FiLogIn,
  FiUserPlus,
  FiClock,
  FiZap,
  FiArrowRight,
  FiPieChart,
  FiBriefcase,
} from 'react-icons/fi';

// NavBar Component
const NavBar: React.FC = () => {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Box bg="#1E3A8A" p={4} color="white">
      <Flex justify="space-between" align="center" maxW="1200px" mx="auto">
        <HStack spacing={2}>
          <Box 
            as="span"
            bgGradient="linear(to-r, #1E3A8A, #2DD4BF)"
            borderRadius="md"
            p={1.5}
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            color="white"
            mr={2}
          >
            <FiBarChart2 size={20} />
          </Box>
          <Heading size="md">RivalRecon</Heading>
        </HStack>
        
        {/* Mobile menu button */}
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          onClick={onToggle}
          icon={<FiMenu />}
          variant="outline"
          aria-label="Toggle Navigation"
        />
        
        {/* Desktop menu */}
        <HStack spacing={6} display={{ base: 'none', md: 'flex' }}>
          <ChakraLink href="#features" _hover={{ textDecoration: 'underline' }}>Features</ChakraLink>
          <ChakraLink href="#pricing" _hover={{ textDecoration: 'underline' }}>Pricing</ChakraLink>
          <RouterLink to="/sign-in">
            <Button variant="ghost" leftIcon={<FiLogIn />} size="sm">
              Login
            </Button>
          </RouterLink>
          <RouterLink to="/sign-up">
            <Button 
              colorScheme="teal" 
              variant="solid" 
              leftIcon={<FiUserPlus />}
              size="sm"
            >
              Sign Up
            </Button>
          </RouterLink>
        </HStack>
      </Flex>
      
      {/* Mobile menu */}
      <Collapse in={isOpen} animateOpacity>
        <Box px={4} py={4} display={{ md: 'none' }}>
          <VStack align="start" spacing={4}>
            <ChakraLink href="#features" _hover={{ textDecoration: 'underline' }}>
              <HStack>
                <FiSearch />
                <Text>Features</Text>
              </HStack>
            </ChakraLink>
            <ChakraLink href="#pricing" _hover={{ textDecoration: 'underline' }}>
              <HStack>
                <FiBarChart2 />
                <Text>Pricing</Text>
              </HStack>
            </ChakraLink>
            <RouterLink to="/sign-in">
              <Button variant="ghost" leftIcon={<FiLogIn />} size="sm" width="100%" justifyContent="flex-start">
                Login
              </Button>
            </RouterLink>
            <RouterLink to="/sign-up">
              <Button 
                colorScheme="teal" 
                variant="solid" 
                leftIcon={<FiUserPlus />}
                size="sm"
                width="100%"
                justifyContent="flex-start"
              >
                Sign Up
              </Button>
            </RouterLink>
          </VStack>
        </Box>
      </Collapse>
    </Box>
  );
};

// Hero Component
const Hero: React.FC = () => (
  <Box 
    bg="linear-gradient(135deg, #1E3A8A 0%, #1E3A8A 60%, #164e63 100%)" 
    color="white"
    py={16}
    position="relative"
    overflow="hidden"
  >
    {/* Background circles for visual appeal */}
    <Box 
      position="absolute"
      right="-10%"
      top="-10%"
      width="30%"
      height="30%"
      borderRadius="full"
      bg="linear-gradient(135deg, rgba(45, 212, 191, 0.1) 0%, rgba(45, 212, 191, 0.05) 100%)"
    />
    <Box 
      position="absolute"
      left="-8%"
      bottom="-15%"
      width="20%"
      height="50%"
      borderRadius="full"
      bg="linear-gradient(135deg, rgba(45, 212, 191, 0.05) 0%, rgba(45, 212, 191, 0.02) 100%)"
    />

    <Container maxW="1200px">
      <Flex 
        direction={{ base: 'column', lg: 'row' }} 
        align="center" 
        justify="space-between"
        gap={{ base: 12, lg: 0 }}
      >
        <VStack 
          align={{ base: 'center', lg: 'flex-start' }} 
          spacing={6} 
          maxW={{ base: "100%", lg: "50%" }}
          textAlign={{ base: 'center', lg: 'left' }}
        >
          <Heading 
            as="h1" 
            size="3xl" 
            lineHeight="1.2"
            fontWeight="extrabold"
            bgGradient="linear(to-r, white, #2DD4BF)"
            bgClip="text"
          >
            Turn Customer Reviews Into Competitive Insights
          </Heading>
          <Text fontSize="xl" opacity={0.9}>
            Analyze your competitor's product reviews to discover what customers love and hate, and how you can improve your products.
          </Text>
          <HStack spacing={4} mt={4}>
            <Button 
              size="lg" 
              colorScheme="teal" 
              px={8}
              leftIcon={<FiBarChart2 />}
              _hover={{ transform: 'translateY(-2px)', boxShadow: 'lg' }}
              transition="all 0.3s ease"
            >
              Get Started
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              px={8}
              _hover={{ bg: 'rgba(255,255,255,0.1)' }}
              leftIcon={<FiMessageCircle />}
            >
              See Demo
            </Button>
          </HStack>
          <HStack spacing={4} mt={2} fontSize="sm" opacity={0.8}>
            <HStack>
              <FiCheckCircle />
              <Text>No credit card</Text>
            </HStack>
            <HStack>
              <FiCheckCircle />
              <Text>Free 14-day trial</Text>
            </HStack>
            <HStack>
              <FiCheckCircle />
              <Text>Cancel anytime</Text>
            </HStack>
          </HStack>
        </VStack>
        
        <Box 
          w={{ base: "100%", lg: "45%" }} 
          position="relative"
          borderRadius="xl"
          overflow="hidden"
          boxShadow="2xl"
        >
          <Image 
            src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="RivalRecon dashboard showing competitive analysis of product reviews"
            objectFit="cover"
            width="100%"
            height="auto"
            filter="brightness(0.9)"
            transform="scale(1.02)" 
            transition="transform 0.5s ease"
            _hover={{ transform: "scale(1.05)" }}
          />
          <Box 
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bg="linear-gradient(135deg, rgba(30, 58, 138, 0.2) 0%, rgba(23, 37, 84, 0.2) 100%)"
          />
        </Box>
      </Flex>
    </Container>
  </Box>
);

// Problem Component
const Problem: React.FC = () => (
  <Box py={16} px={4} bg="gray.50">
    <Container maxW="1200px">
      <VStack spacing={12}>
        <Heading textAlign="center" size="xl">
          The Problem with Product Reviews
        </Heading>
        
        <Grid 
          templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} 
          gap={8}
        >
          <GridItem>
            <VStack 
              spacing={4} 
              p={6} 
              bg="white" 
              borderRadius="lg" 
              boxShadow="md"
              h="100%"
              transition="transform 0.3s, box-shadow 0.3s"
              _hover={{ transform: "translateY(-5px)", boxShadow: "lg" }}
            >
              <Box 
                p={3} 
                borderRadius="full" 
                bg="blue.50" 
                color="blue.600"
              >
                <FiSearch size="2.5rem" />
              </Box>
              <Heading size="md">Too Many Reviews</Heading>
              <Text align="center">
                With thousands of reviews across multiple platforms, it's impossible to manually read and analyze them all.
              </Text>
            </VStack>
          </GridItem>
          
          <GridItem>
            <VStack 
              spacing={4} 
              p={6} 
              bg="white" 
              borderRadius="lg" 
              boxShadow="md"
              h="100%"
              transition="transform 0.3s, box-shadow 0.3s"
              _hover={{ transform: "translateY(-5px)", boxShadow: "lg" }}
            >
              <Box 
                p={3} 
                borderRadius="full" 
                bg="teal.50" 
                color="teal.600"
              >
                <FiTrendingUp size="2.5rem" />
              </Box>
              <Heading size="md">Hidden Patterns</Heading>
              <Text align="center">
                Critical patterns and trends in customer feedback often go unnoticed without proper analytical tools.
              </Text>
            </VStack>
          </GridItem>
          
          <GridItem>
            <VStack 
              spacing={4} 
              p={6} 
              bg="white" 
              borderRadius="lg" 
              boxShadow="md"
              h="100%"
              transition="transform 0.3s, box-shadow 0.3s"
              _hover={{ transform: "translateY(-5px)", boxShadow: "lg" }}
            >
              <Box 
                p={3} 
                borderRadius="full" 
                bg="purple.50" 
                color="purple.600"
              >
                <FiClock size="2.5rem" />
              </Box>
              <Heading size="md">Time-Consuming</Heading>
              <Text align="center">
                Manual analysis is slow and biased, causing you to miss competitive opportunities and market shifts.
              </Text>
            </VStack>
          </GridItem>
        </Grid>
        
        <Box mt={8} w="full">
          <Alert 
            status="info" 
            variant="subtle" 
            borderRadius="md" 
            bg="blue.50"
            p={4}
          >
            <AlertIcon color="blue.600" />
            <Box>
              <AlertTitle fontWeight="bold" mb={1}>Did you know?</AlertTitle>
              <AlertDescription>
                Companies that leverage AI-powered product review analysis are 2.3x more likely to introduce successful product improvements.
              </AlertDescription>
            </Box>
          </Alert>
        </Box>
      </VStack>
    </Container>
  </Box>
);

// Solution Component
const Solution: React.FC = () => (
  <Box py={16} px={4} bg="gray.50">
    <Container maxW="1200px">
      <VStack spacing={12} align="center">
        <VStack spacing={4} textAlign="center" maxW="800px">
          <Text color="blue.500" fontWeight="bold">OUR SOLUTION</Text>
          <Heading size="xl">Transform Customer Reviews Into Strategic Insights</Heading>
          <Text fontSize="lg" color="gray.600">
            RivalRecon combines advanced AI with intuitive design to help you make
            data-driven decisions faster and with greater confidence.
          </Text>
        </VStack>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8} width="100%">
          <VStack 
            p={8} 
            bg="white" 
            borderRadius="lg" 
            boxShadow="md" 
            align="start" 
            spacing={4}
            transition="transform 0.3s, box-shadow 0.3s"
            _hover={{ transform: "translateY(-5px)", boxShadow: "lg" }}
            height="100%"
          >
            <Circle size="60px" bg="blue.100" color="blue.600">
              <FiTrendingUp size="30px" />
            </Circle>
            <Heading size="md">Competitive Analysis</Heading>
            <Text color="gray.600">
              Compare your products against competitors to identify gaps and opportunities in the market.
            </Text>
            <Divider />
            <HStack>
              <ChakraLink color="blue.500" fontWeight="bold">Learn more</ChakraLink>
              <Icon as={FiArrowRight} color="blue.500" />
            </HStack>
          </VStack>

          <VStack 
            p={8} 
            bg="white" 
            borderRadius="lg" 
            boxShadow="md" 
            align="start" 
            spacing={4}
            transition="transform 0.3s, box-shadow 0.3s"
            _hover={{ transform: "translateY(-5px)", boxShadow: "lg" }}
            height="100%"
          >
            <Circle size="60px" bg="green.100" color="green.600">
              <FiBarChart2 size="30px" />
            </Circle>
            <Heading size="md">Sentiment Analysis</Heading>
            <Text color="gray.600">
              Understand customer feelings toward specific product features and compare them against competitors.
            </Text>
            <Divider />
            <HStack>
              <ChakraLink color="blue.500" fontWeight="bold">Learn more</ChakraLink>
              <Icon as={FiArrowRight} color="blue.500" />
            </HStack>
          </VStack>

          <VStack 
            p={8} 
            bg="white" 
            borderRadius="lg" 
            boxShadow="md" 
            align="start" 
            spacing={4}
            transition="transform 0.3s, box-shadow 0.3s"
            _hover={{ transform: "translateY(-5px)", boxShadow: "lg" }}
            height="100%"
          >
            <Circle size="60px" bg="purple.100" color="purple.600">
              <FiTarget size="30px" />
            </Circle>
            <Heading size="md">Actionable Recommendations</Heading>
            <Text color="gray.600">
              Get AI-powered suggestions for product improvements and marketing strategies based on customer feedback.
            </Text>
            <Divider />
            <HStack>
              <ChakraLink color="blue.500" fontWeight="bold">Learn more</ChakraLink>
              <Icon as={FiArrowRight} color="blue.500" />
            </HStack>
          </VStack>
        </SimpleGrid>
      </VStack>
    </Container>
  </Box>
);

// Who We Help Component
const WhoWeHelp: React.FC = () => (
  <Box py={16} px={4} bg="gray.50">
    <Container maxW="1200px">
      <VStack spacing={12}>
        <VStack spacing={4} textAlign="center">
          <Heading size="xl">Who We Help</Heading>
          <Text fontSize="lg" color="gray.600" maxW="800px">
            RivalRecon is designed for teams that need to understand customer feedback at scale
          </Text>
        </VStack>
        
        <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={8}>
          <GridItem>
            <VStack 
              p={8} 
              bg="white" 
              borderRadius="lg" 
              boxShadow="md" 
              h="100%"
              align="flex-start"
              spacing={6}
              position="relative"
              transition="transform 0.3s"
              _hover={{ transform: "translateY(-5px)" }}
            >
              <Circle size="60px" bg="red.100" color="red.500">
                <FiUsers size="28px" />
              </Circle>
              <VStack align="flex-start" spacing={2}>
                <Heading size="md">Product Teams</Heading>
                <Text>
                  Identify feature gaps, prioritize product roadmaps, and understand what customers love and hate about your products.
                </Text>
              </VStack>
              <Button
                variant="link"
                colorScheme="red"
                rightIcon={<FiArrowRight />}
                alignSelf="flex-start"
                mt="auto"
              >
                Learn more
              </Button>
            </VStack>
          </GridItem>
          
          <GridItem>
            <VStack 
              p={8} 
              bg="white" 
              borderRadius="lg" 
              boxShadow="md" 
              h="100%"
              align="flex-start"
              spacing={6}
              position="relative"
              transition="transform 0.3s"
              _hover={{ transform: "translateY(-5px)" }}
            >
              <Circle size="60px" bg="green.100" color="green.500">
                <FiTrendingUp size="28px" />
              </Circle>
              <VStack align="flex-start" spacing={2}>
                <Heading size="md">Marketing Teams</Heading>
                <Text>
                  Discover your product's strongest selling points and competitive advantages to enhance your marketing strategy.
                </Text>
              </VStack>
              <Button
                variant="link"
                colorScheme="green"
                rightIcon={<FiArrowRight />}
                alignSelf="flex-start"
                mt="auto"
              >
                Learn more
              </Button>
            </VStack>
          </GridItem>
          
          <GridItem>
            <VStack 
              p={8} 
              bg="white" 
              borderRadius="lg" 
              boxShadow="md" 
              h="100%"
              align="flex-start"
              spacing={6}
              position="relative"
              transition="transform 0.3s"
              _hover={{ transform: "translateY(-5px)" }}
            >
              <Circle size="60px" bg="blue.100" color="blue.500">
                <FiActivity size="28px" />
              </Circle>
              <VStack align="flex-start" spacing={2}>
                <Heading size="md">Executive Leadership</Heading>
                <Text>
                  Get high-level insights into customer sentiment and competitive positioning to guide strategic decisions.
                </Text>
              </VStack>
              <Button
                variant="link"
                colorScheme="blue"
                rightIcon={<FiArrowRight />}
                alignSelf="flex-start"
                mt="auto"
              >
                Learn more
              </Button>
            </VStack>
          </GridItem>
        </Grid>
      </VStack>
    </Container>
  </Box>
);

// WhyUs Component
const WhyUs: React.FC = () => (
  <Box py={16} px={4} bg="white">
    <Container maxW="1200px">
      <Flex 
        direction={{ base: "column", lg: "row" }} 
        align="center" 
        justify="space-between" 
        gap={12}
      >
        <Box maxW={{ base: "100%", lg: "45%" }}>
          <VStack align="start" spacing={8}>
            <VStack align="start" spacing={4}>
              <Text color="blue.500" fontWeight="bold">WHY CHOOSE US</Text>
              <Heading size="xl">What Makes RivalRecon Different?</Heading>
              <Text fontSize="lg" color="gray.600">
                We transform raw customer feedback into actionable business intelligence that helps you outperform the competition.
              </Text>
            </VStack>
            
            <VStack align="start" spacing={6} width="100%">
              <HStack align="start" spacing={4}>
                <Box p={3} bg="blue.100" color="blue.600" borderRadius="full">
                  <Icon as={ChevronRightIcon} boxSize={5} />
                </Box>
                <VStack align="start" spacing={1}>
                  <Heading size="md">Advanced AI Analysis</Heading>
                  <Text color="gray.600">
                    Our DeepSeek-powered analysis extracts deeper insights than traditional NLP tools.
                  </Text>
                </VStack>
              </HStack>
              
              <HStack align="start" spacing={4}>
                <Box p={3} bg="blue.100" color="blue.600" borderRadius="full">
                  <Icon as={ChevronRightIcon} boxSize={5} />
                </Box>
                <VStack align="start" spacing={1}>
                  <Heading size="md">Visual Insights</Heading>
                  <Text color="gray.600">
                    Interactive dashboards make complex data patterns immediately apparent.
                  </Text>
                </VStack>
              </HStack>
              
              <HStack align="start" spacing={4}>
                <Box p={3} bg="blue.100" color="blue.600" borderRadius="full">
                  <Icon as={ChevronRightIcon} boxSize={5} />
                </Box>
                <VStack align="start" spacing={1}>
                  <Heading size="md">Industry Expertise</Heading>
                  <Text color="gray.600">
                    Built by CPG veterans who understand the challenges of the industry.
                  </Text>
                </VStack>
              </HStack>
              
              <HStack align="start" spacing={4}>
                <Box p={3} bg="blue.100" color="blue.600" borderRadius="full">
                  <Icon as={ChevronRightIcon} boxSize={5} />
                </Box>
                <VStack align="start" spacing={1}>
                  <Heading size="md">Time-Saving</Heading>
                  <Text color="gray.600">
                    Get in-depth analysis in minutes instead of weeks of manual review.
                  </Text>
                </VStack>
              </HStack>
            </VStack>
            
            <Button 
              size="lg" 
              colorScheme="blue" 
              rightIcon={<ChevronRightIcon />}
            >
              Start Your Free Trial
            </Button>
          </VStack>
        </Box>
        
        <Box 
          maxW={{ base: "100%", lg: "45%" }} 
          borderRadius="lg" 
          overflow="hidden"
          boxShadow="xl"
        >
          <Image 
            src="/dashboard-preview.png" 
            alt="RivalRecon Dashboard Preview" 
            fallbackSrc="https://via.placeholder.com/600x400?text=Dashboard+Preview"
            width="100%"
            height="auto"
          />
        </Box>
      </Flex>
    </Container>
  </Box>
);

// Pricing Component
const Pricing: React.FC = () => (
  <Box py={16} px={4} maxW="1200px" mx="auto" id="pricing">
    <Heading size="lg" color="#2DD4BF" mb={6} textAlign="center">Choose the Plan That's Right for You</Heading>
    <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
      <Card>
        <CardHeader bg="#F7FAFC"><Heading size="md" color="#2DD4BF">Basic</Heading></CardHeader>
        <CardBody>
          <Text fontSize="2xl" fontWeight="bold" color="#1F2937">$99/month</Text>
          <VStack spacing={3} align="start" mt={4}>
            <HStack>
              <Box as={FiCheckCircle} color="green.500" />
              <Text>5 analyses per month</Text>
            </HStack>
            <HStack>
              <Box as={FiMail} color="blue.500" />
              <Text>Email support</Text>
            </HStack>
            <HStack>
              <Box as={FiBarChart2} color="purple.500" />
              <Text>Standard dashboards</Text>
            </HStack>
          </VStack>
          <RouterLink to="/sign-up">
            <Button mt={6} variant="outline" colorScheme="teal" leftIcon={<FiDownload />}>Start Free Trial</Button>
          </RouterLink>
        </CardBody>
      </Card>
      <Card border="2px" borderColor="#2DD4BF" position="relative">
        <Box position="absolute" top="-10px" left="50%" transform="translateX(-50%)" bg="#2DD4BF" color="white" px={2} py={1} borderRadius="md">Most Popular</Box>
        <CardHeader bg="#F7FAFC"><Heading size="md" color="#2DD4BF">Pro</Heading></CardHeader>
        <CardBody>
          <Text fontSize="2xl" fontWeight="bold" color="#1F2937">$299/month</Text>
          <VStack spacing={3} align="start" mt={4}>
            <HStack>
              <Box as={FiCheckCircle} color="green.500" />
              <Text>20 analyses per month</Text>
            </HStack>
            <HStack>
              <Box as={FiMessageCircle} color="blue.500" />
              <Text>Priority support</Text>
            </HStack>
            <HStack>
              <Box as={FiSettings} color="purple.500" />
              <Text>Customizable dashboards</Text>
            </HStack>
            <HStack>
              <Box as={FiActivity} color="orange.500" />
              <Text>Advanced analytics</Text>
            </HStack>
          </VStack>
          <RouterLink to="/sign-up">
            <Button mt={6} bgGradient="linear(to-r, #1E3A8A, #2DD4BF)" color="white" leftIcon={<FiDownload />}>Start Free Trial</Button>
          </RouterLink>
        </CardBody>
      </Card>
      <Card>
        <CardHeader bg="#F7FAFC"><Heading size="md" color="#2DD4BF">Enterprise</Heading></CardHeader>
        <CardBody>
          <Text fontSize="2xl" fontWeight="bold" color="#1F2937">Custom Pricing</Text>
          <VStack spacing={3} align="start" mt={4}>
            <HStack>
              <Box as={FiCheckCircle} color="green.500" />
              <Text>Unlimited analyses</Text>
            </HStack>
            <HStack>
              <Box as={FiUserCheck} color="blue.500" />
              <Text>Dedicated account manager</Text>
            </HStack>
            <HStack>
              <Box as={FiCode} color="purple.500" />
              <Text>API access</Text>
            </HStack>
            <HStack>
              <Box as={FiServer} color="orange.500" />
              <Text>White-label options</Text>
            </HStack>
          </VStack>
          <Button mt={6} variant="outline" colorScheme="teal" leftIcon={<FiMessageCircle />}>Contact Sales</Button>
        </CardBody>
      </Card>
    </Grid>
    <Text fontSize="sm" color="#6B7280" mt={6} textAlign="center">All plans include a 14-day free trial. No credit card required.</Text>
  </Box>
);

// Testimonials Component
const Testimonials: React.FC = () => (
  <Box bg="white" py={16} px={4} borderRadius="md" boxShadow="md" maxW="1200px" mx="auto" my={8}>
    <Heading size="lg" color="#2DD4BF" mb={6} textAlign="center">What Our Customers Say</Heading>
    <Grid templateColumns={{ base: '1fr', md: 'repeat(3, 1fr)' }} gap={6}>
      <Card>
        <CardBody>
          <HStack spacing={4} mb={4}>
            <Image
              borderRadius="full"
              boxSize="60px"
              src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
              alt="Emily Rodriguez"
            />
            <Box>
              <Text fontSize="md" fontWeight="bold" color="#1F2937">Emily Rodriguez</Text>
              <Text fontSize="sm" color="#6B7280">Product Lead at InnovateCo</Text>
            </Box>
          </HStack>
          <Text fontSize="md" color="#1F2937">"RivalRecon has revolutionized how we approach product development. The insights are actionable and have directly impacted our bottom line."</Text>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <HStack spacing={4} mb={4}>
            <Image
              borderRadius="full"
              boxSize="60px"
              src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
              alt="David Kim"
            />
            <Box>
              <Text fontSize="md" fontWeight="bold" color="#1F2937">David Kim</Text>
              <Text fontSize="sm" color="#6B7280">Marketing Manager at FreshStart Brands</Text>
            </Box>
          </HStack>
          <Text fontSize="md" color="#1F2937">"As a marketer, I need to know what customers are saying. RivalRecon gives me that insight quickly and clearly. It's become an essential tool in our arsenal."</Text>
        </CardBody>
      </Card>
      <Card>
        <CardBody>
          <HStack spacing={4} mb={4}>
            <Image
              borderRadius="full"
              boxSize="60px"
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
              alt="Lisa Patel"
            />
            <Box>
              <Text fontSize="md" fontWeight="bold" color="#1F2937">Lisa Patel</Text>
              <Text fontSize="sm" color="#6B7280">CEO of EcoGoods</Text>
            </Box>
          </HStack>
          <Text fontSize="md" color="#1F2937">"The competitive benchmarking feature is a game-changer. We can now see exactly where we stand in the market and adjust our strategy accordingly."</Text>
        </CardBody>
      </Card>
    </Grid>
  </Box>
);

// FAQ Component
const FAQ: React.FC = () => (
  <Box py={16} px={4} maxW="1200px" mx="auto">
    <Heading size="lg" color="#2DD4BF" mb={8} textAlign="center">Frequently Asked Questions</Heading>
    <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={8} maxW="800px" mx="auto">
      <Box>
        <HStack align="flex-start" spacing={3} mb={2}>
          <Box as={FiSearch} color="#2DD4BF" mt={1} boxSize={5} />
          <Heading size="sm" color="#1F2937">What review sources do you support?</Heading>
        </HStack>
        <Text fontSize="md" color="#6B7280" ml="32px">Currently, we support Shopify stores (including review apps like Yotpo, TrustPilot, Loox, Judge.me) and Amazon. More sources are in development.</Text>
      </Box>
      <Box>
        <HStack align="flex-start" spacing={3} mb={2}>
          <Box as={FiCpu} color="#2DD4BF" mt={1} boxSize={5} />
          <Heading size="sm" color="#1F2937">How accurate is the AI analysis?</Heading>
        </HStack>
        <Text fontSize="md" color="#6B7280" ml="32px">Our AI is trained on millions of CPG product reviews, achieving over 90% accuracy in sentiment analysis and aspect extraction. We continuously improve our models with new data.</Text>
      </Box>
      <Box>
        <HStack align="flex-start" spacing={3} mb={2}>
          <Box as={FiCode} color="#2DD4BF" mt={1} boxSize={5} />
          <Heading size="sm" color="#1F2937">Can I integrate RivalRecon with my existing tools?</Heading>
        </HStack>
        <Text fontSize="md" color="#6B7280" ml="32px">Yes! We offer API access on our Enterprise plan, allowing you to integrate insights directly into your workflows.</Text>
      </Box>
      <Box>
        <HStack align="flex-start" spacing={3} mb={2}>
          <Box as={FiMessageCircle} color="#2DD4BF" mt={1} boxSize={5} />
          <Heading size="sm" color="#1F2937">What if I need help getting started?</Heading>
        </HStack>
        <Text fontSize="md" color="#6B7280" ml="32px">Our support team is here for you. We provide onboarding resources, tutorials, and direct assistance to ensure you get the most out of RivalRecon.</Text>
      </Box>
    </Grid>
  </Box>
);

// FinalCTA Component
const FinalCTA: React.FC = () => (
  <Box 
    bg="white" 
    py={16} 
    px={4} 
    borderRadius="md" 
    boxShadow="md" 
    maxW="1200px" 
    mx="auto" 
    my={8} 
    textAlign="center"
    backgroundImage="url('https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')"
    backgroundSize="cover"
    backgroundPosition="center"
    position="relative"
    _before={{
      content: '""',
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderRadius: 'md',
    }}
  >
    <Box position="relative" zIndex={1}>
      <Heading size="lg" color="#2DD4BF" mb={4}>Ready to Gain a Competitive Edge?</Heading>
      <Text fontSize="md" color="white" mb={6}>Start your 14-day free trial today and unlock the power of customer reviews.</Text>
      <RouterLink to="/sign-up">
        <Button 
          bgGradient="linear(to-r, #1E3A8A, #2DD4BF)" 
          color="white" 
          size="lg" 
          _hover={{ transform: 'scale(1.05)' }}
          rightIcon={<ChevronRightIcon />}
        >
          Start Free Trial
        </Button>
      </RouterLink>
    </Box>
  </Box>
);

// Footer Component
const Footer: React.FC = () => (
  <Box bg="#1E3A8A" py={8} px={4} color="white">
    <Flex 
      direction={{ base: 'column', md: 'row' }} 
      justify="space-between" 
      align={{ base: 'center', md: 'flex-start' }}
      maxW="1200px"
      mx="auto"
      gap={8}
    >
      <VStack align={{ base: 'center', md: 'flex-start' }} spacing={4} mb={{ base: 4, md: 0 }}>
        <HStack spacing={2}>
          <Box 
            as="span"
            bgGradient="linear(to-r, #1E3A8A, #2DD4BF)"
            borderRadius="md"
            p={1.5}
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            color="white"
          >
            <FiBarChart2 size={16} />
          </Box>
          <Heading size="md">RivalRecon</Heading>
        </HStack>
        <Text fontSize="sm" color="gray.300">Competitive intelligence for CPG brands</Text>
        <HStack spacing={4} mt={2}>
          <IconButton 
            aria-label="LinkedIn" 
            icon={<FiLinkedin />} 
            variant="outline" 
            size="sm" 
            borderRadius="full"
            _hover={{ bg: "#2DD4BF", color: "white", borderColor: "#2DD4BF" }}
          />
          <IconButton 
            aria-label="Twitter" 
            icon={<FiTwitter />} 
            variant="outline" 
            size="sm" 
            borderRadius="full"
            _hover={{ bg: "#2DD4BF", color: "white", borderColor: "#2DD4BF" }}
          />
          <IconButton 
            aria-label="Instagram" 
            icon={<FiInstagram />} 
            variant="outline" 
            size="sm" 
            borderRadius="full"
            _hover={{ bg: "#2DD4BF", color: "white", borderColor: "#2DD4BF" }}
          />
        </HStack>
      </VStack>
      
      <Grid templateColumns={{ base: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' }} gap={8}>
        <VStack align="flex-start" spacing={3}>
          <Text fontWeight="bold" mb={2}>Product</Text>
          <ChakraLink href="#features" color="gray.300" _hover={{ color: '#2DD4BF' }}>Features</ChakraLink>
          <ChakraLink href="#pricing" color="gray.300" _hover={{ color: '#2DD4BF' }}>Pricing</ChakraLink>
          <ChakraLink href="#demo" color="gray.300" _hover={{ color: '#2DD4BF' }}>Request Demo</ChakraLink>
        </VStack>
        
        <VStack align="flex-start" spacing={3}>
          <Text fontWeight="bold" mb={2}>Company</Text>
          <ChakraLink href="#about" color="gray.300" _hover={{ color: '#2DD4BF' }}>About</ChakraLink>
          <ChakraLink href="#careers" color="gray.300" _hover={{ color: '#2DD4BF' }}>Careers</ChakraLink>
          <ChakraLink href="#contact" color="gray.300" _hover={{ color: '#2DD4BF' }}>Contact</ChakraLink>
        </VStack>
        
        <VStack align="flex-start" spacing={3}>
          <Text fontWeight="bold" mb={2}>Legal</Text>
          <ChakraLink href="#privacy" color="gray.300" _hover={{ color: '#2DD4BF' }}>Privacy Policy</ChakraLink>
          <ChakraLink href="#terms" color="gray.300" _hover={{ color: '#2DD4BF' }}>Terms of Service</ChakraLink>
        </VStack>
      </Grid>
    </Flex>
    <Text fontSize="sm" color="gray.400" textAlign="center" mt={8}>© 2025 RivalRecon. All rights reserved.</Text>
  </Box>
);

// Main Landing Page Component
const LandingPage: React.FC = () => {
  return (
    <Box minH="100vh" bg="#F7FAFC">
      <NavBar />
      <Hero />
      <Problem />
      <Solution />
      <WhoWeHelp />
      <WhyUs />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </Box>
  );
};

export default LandingPage; 