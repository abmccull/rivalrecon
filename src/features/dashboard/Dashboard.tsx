import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Input,
  Button,
  VStack,
  Card,
  CardBody,
  Badge,
  useToast,
  Flex,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  InputGroup,
  InputRightElement,
  IconButton,
  Table,
  TableContainer,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  HStack,
  Select,
  InputLeftElement,
  Tooltip,
  useBreakpointValue,
  Stack,
} from '@chakra-ui/react';
import { CopyIcon, ExternalLinkIcon, SearchIcon } from '@chakra-ui/icons';
import { getSubmissions, submitUrl, Submission } from '../../api/submissions';
import { useSupabaseAuth } from '../auth/SupabaseAuthProvider';
import { Layout } from '../../components/layout';
import { Link as RouterLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiBarChart2, FiFilter } from 'react-icons/fi';

// Create motion components
const MotionCard = motion(Card);

// Animation variants
const cardVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  hover: { scale: 1.02, transition: { duration: 0.2 } },
};

// Define types for analyses
interface Analysis {
  id: string;
  url: string;
  productName?: string;
  brand?: string;
  category?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
}

export default function Dashboard() {
  const { user, supabase, isLoading: isSupabaseLoading } = useSupabaseAuth();
  const toast = useToast();
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // Responsive display settings
  const isMobile = useBreakpointValue({ base: true, md: false });
  const buttonSize = useBreakpointValue({ base: "sm", md: "md" });
  const headingSize = useBreakpointValue({ base: "sm", md: "md" });
  const fontSize = useBreakpointValue({ base: "sm", md: "md" });

  // Fetch user's analyses from Supabase
  useEffect(() => {
    const fetchAnalyses = async () => {
      if (isSupabaseLoading || !supabase || !user) return;
      
      try {
        setIsLoading(true);
        
        // Use supabase client directly - RLS will handle user filtering
        const submissions = await getSubmissions(supabase);
        
        // Transform data to match our Analysis interface
        const analysesData = submissions.map((sub: Submission) => ({
          id: String(sub.id), // Convert number to string
          url: sub.url,
          productName: 'Unknown Product', // Will be updated when analyses are available
          brand: 'Unknown Brand',
          category: 'Uncategorized',
          status: sub.status,
          created_at: sub.created_at
        }));
        
        setAnalyses(analysesData);
      } catch (error) {
        console.error('Error fetching analyses:', error);
        toast({
          title: 'Failed to load analyses',
          description: 'There was an error loading your analyses. Please try signing out and back in.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user && supabase && !isSupabaseLoading) {
      fetchAnalyses();
    }
  }, [user, toast, supabase, isSupabaseLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: 'URL is required',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please sign in to submit a URL for analysis.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    if (isSupabaseLoading || !supabase) {
      toast({
        title: 'Initializing connection',
        description: 'Please wait while we establish a secure connection.',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Use supabase client directly - RLS will handle user authentication
      const submission = await submitUrl(url, supabase);
      
      if (submission) {
        // Add the new submission to the list
        const newAnalysis: Analysis = {
          id: String(submission.id), // Convert number to string
          url: submission.url,
          status: submission.status,
          created_at: submission.created_at
        };
        
        setAnalyses(prev => [newAnalysis, ...prev]);
        setUrl('');
        
        toast({
          title: 'Analysis started',
          description: 'Your product URL has been submitted for analysis.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      console.error('Error submitting URL:', error);
      
      // Special handling for RLS policy violations
      if (error.code === '42501' || error.code === 'PGRST301') {
        toast({
          title: 'Authentication error',
          description: 'There was an issue with your authentication. Please try signing out and signing back in.',
          status: 'error',
          duration: 8000,
          isClosable: true,
        });
      } else {
        toast({
          title: 'Submission failed',
          description: error.message || 'There was an error submitting your URL.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusColor = (status: Analysis['status']) => {
    switch (status) {
      case 'completed': return 'green';
      case 'processing': return 'blue';
      case 'pending': return 'yellow';
      case 'failed': return 'red';
      default: return 'gray';
    }
  };
  
  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copied to clipboard",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };

  // Filter and search functionalities
  const filteredAnalyses = analyses.filter(analysis => {
    const matchesStatus = statusFilter === 'all' || analysis.status === statusFilter;
    const matchesSearch = searchTerm === '' || 
      analysis.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (analysis.productName && analysis.productName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (analysis.brand && analysis.brand.toLowerCase().includes(searchTerm.toLowerCase()));
      
    return matchesStatus && matchesSearch;
  });
  
  if (isSupabaseLoading) {
    return (
      <Layout>
        <Box maxW="container.xl" mx="auto">
          <Alert status="info">
            <AlertIcon />
            <AlertTitle>Setting up secure connection</AlertTitle>
            <AlertDescription>
              Please wait while we establish a secure connection to the database...
            </AlertDescription>
          </Alert>
        </Box>
      </Layout>
    );
  }

  // Render the mobile card view for each analysis item
  const renderMobileAnalysisCard = (analysis: Analysis) => (
    <Card key={analysis.id} mb={4} borderRadius="lg" overflow="hidden" boxShadow="sm">
      <CardBody p={4}>
        <Flex justify="space-between" align="center" mb={3}>
          <Badge 
            colorScheme={getStatusColor(analysis.status)}
            px={2}
            py={1}
            borderRadius="full"
            textTransform="capitalize"
          >
            {analysis.status}
          </Badge>
          <Text fontSize="xs" color="gray.500">
            {new Date(analysis.created_at).toLocaleDateString()}
          </Text>
        </Flex>
        
        <Text fontSize="sm" fontWeight="medium" mb={2} noOfLines={1}>
          {analysis.url}
        </Text>
        
        <Stack direction="row" spacing={2} mb={3}>
          <Badge variant="subtle" colorScheme="gray">
            {analysis.brand || "Unknown Brand"}
          </Badge>
          <Badge variant="subtle" colorScheme="gray">
            {analysis.productName || "Unknown Product"}
          </Badge>
          {analysis.category && (
            <Badge variant="subtle" colorScheme="teal" textTransform="uppercase">
              {analysis.category}
            </Badge>
          )}
        </Stack>
        
        {analysis.status === 'completed' ? (
          <Button
            as={RouterLink}
            to={`/analysis/${analysis.id}`}
            size="sm"
            width="full"
            colorScheme="blue"
            leftIcon={<FiBarChart2 />}
          >
            View Analysis
          </Button>
        ) : (
          <Button
            size="sm"
            width="full"
            colorScheme="gray"
            isDisabled
            opacity={0.7}
          >
            {analysis.status === 'failed' ? 'Failed' : 'Processing'}
          </Button>
        )}
      </CardBody>
    </Card>
  );

  // Render the desktop table view for analyses
  const renderDesktopAnalysisTable = () => (
    <Box overflowX="auto" width="100%">
      <Table variant="simple" colorScheme="gray">
        <Thead bg="gray.50">
          <Tr>
            <Th textTransform="uppercase" fontSize="xs">Status</Th>
            <Th textTransform="uppercase" fontSize="xs">Actions</Th>
            <Th textTransform="uppercase" fontSize="xs">Brand</Th>
            <Th textTransform="uppercase" fontSize="xs">Product Name</Th>
            <Th textTransform="uppercase" fontSize="xs">Category</Th>
            <Th textTransform="uppercase" fontSize="xs">URL</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredAnalyses.map((analysis) => (
            <Tr key={analysis.id} _hover={{ bg: "gray.50" }}>
              <Td>
                <Badge 
                  colorScheme={getStatusColor(analysis.status)}
                  px={2}
                  py={1}
                  borderRadius="full"
                  textTransform="capitalize"
                >
                  {analysis.status}
                </Badge>
              </Td>
              <Td>
                {analysis.status === 'completed' ? (
                  <Button
                    as={RouterLink}
                    to={`/analysis/${analysis.id}`}
                    size="sm"
                    colorScheme="blue"
                    leftIcon={<FiBarChart2 />}
                  >
                    View Analysis
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    colorScheme="gray"
                    isDisabled
                    opacity={0.7}
                  >
                    {analysis.status === 'failed' ? 'Failed' : 'Processing'}
                  </Button>
                )}
              </Td>
              <Td>{analysis.brand || "Unknown Brand"}</Td>
              <Td>{analysis.productName || "Unknown Product"}</Td>
              <Td>
                {analysis.category ? (
                  <Badge colorScheme="teal" textTransform="uppercase">
                    {analysis.category}
                  </Badge>
                ) : (
                  <Badge textTransform="uppercase" bg="teal.100" color="teal.800">
                    UNCATEGORIZED
                  </Badge>
                )}
              </Td>
              <Td maxW="200px">
                <Tooltip label={analysis.url} hasArrow>
                  <Text 
                    noOfLines={1}
                    overflow="hidden"
                    textOverflow="ellipsis"
                    whiteSpace="nowrap"
                  >
                    {analysis.url}
                  </Text>
                </Tooltip>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );

  return (
    <Layout>
      <Box maxW="container.xl" mx="auto" p={4}>
        <VStack spacing={6} align="stretch">
          {/* URL Submission Section */}
          <Card borderRadius="lg" overflow="hidden" boxShadow="md">
            <CardBody p={4}>
              <Heading as="h2" size={headingSize} color="teal.500" mb={2}>
                Submit a Product URL for Analysis
              </Heading>
              <Text mb={4} color="gray.500" fontSize={fontSize}>
                Enter a product URL from a Shopify store or Amazon to analyze reviews.
              </Text>
              
              <form onSubmit={handleSubmit}>
                <Stack 
                  direction={{ base: "column", sm: "row" }} 
                  spacing={3}
                >
                  <InputGroup size={buttonSize}>
                    <Input
                      placeholder="https://example.com/product"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      borderColor="gray.300"
                      _focus={{ borderColor: "teal.500" }}
                    />
                    <InputRightElement height="100%">
                      <IconButton
                        aria-label="Copy to clipboard"
                        icon={<CopyIcon />}
                        size="sm"
                        variant="ghost"
                        colorScheme="teal"
                        onClick={handleCopyToClipboard}
                      />
                    </InputRightElement>
                  </InputGroup>
                  <Button
                    variant="primary"
                    type="submit"
                    isLoading={isSubmitting}
                    loadingText="Submitting"
                    size={buttonSize}
                    isDisabled={!user || isSupabaseLoading}
                    minW={{ base: "full", sm: "120px" }}
                    colorScheme="teal"
                  >
                    Analyze
                  </Button>
                </Stack>
              </form>
            </CardBody>
          </Card>
          
          {/* Analysis History Section */}
          <Box>
            <Stack 
              direction={{ base: "column", md: "row" }}
              justify="space-between" 
              align={{ base: "start", md: "center" }}
              mb={4}
              spacing={3}
            >
              <Heading as="h2" size={headingSize} color="teal.500">
                Analysis History
              </Heading>
              
              {/* Filter and Search Controls */}
              <Stack 
                direction={{ base: "column", sm: "row" }}
                width={{ base: "100%", md: "auto" }}
                spacing={2}
              >
                <InputGroup size="sm">
                  <InputLeftElement pointerEvents="none">
                    <SearchIcon color="gray.400" />
                  </InputLeftElement>
                  <Input
                    placeholder="Search analyses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    borderRadius="md"
                  />
                </InputGroup>
                
                <Select 
                  size="sm"
                  icon={<FiFilter />}
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  width={{ base: "100%", sm: "150px" }}
                  borderRadius="md"
                >
                  <option value="all">All status</option>
                  <option value="completed">Completed</option>
                  <option value="processing">Processing</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </Select>
              </Stack>
            </Stack>
            
            {isLoading ? (
              <Text color="gray.500">Loading your analyses...</Text>
            ) : filteredAnalyses.length === 0 ? (
              <Card p={4} bg="gray.50" borderRadius="md">
                <Text color="gray.500" textAlign="center">
                  {analyses.length === 0 
                    ? "No analyses yet. Submit a product URL to get started." 
                    : "No analyses match your current filters."}
                </Text>
              </Card>
            ) : (
              <>
                {/* Conditional rendering based on screen size */}
                {isMobile ? (
                  <VStack spacing={4} align="stretch">
                    {filteredAnalyses.map(renderMobileAnalysisCard)}
                  </VStack>
                ) : (
                  renderDesktopAnalysisTable()
                )}
              </>
            )}
          </Box>
        </VStack>
      </Box>
    </Layout>
  );
} 