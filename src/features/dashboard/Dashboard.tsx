import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Input,
  Button,
  VStack,
  Grid,
  GridItem,
  Card,
  CardBody,
  Badge,
  useToast,
  Flex,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { getSubmissions, submitUrl, Submission } from '../../api/submissions';
import { useSupabaseAuth as useSupabase } from '../auth/SupabaseAuthProvider';

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
  const { user, supabase, isLoading: isSupabaseLoading } = useSupabase();
  const toast = useToast();
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
  
  if (isSupabaseLoading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="info">
          <AlertIcon />
          <AlertTitle>Setting up secure connection</AlertTitle>
          <AlertDescription>
            Please wait while we establish a secure connection to the database...
          </AlertDescription>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Heading as="h1" mb={8}>Dashboard</Heading>
      
      <Grid templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }} gap={8}>
        {/* URL Submission Section */}
        <GridItem>
          <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
            <Heading as="h2" size="md" mb={4}>
              Submit a Product URL for Analysis
            </Heading>
            <Text mb={4}>
              Enter a product URL from a Shopify store or Amazon to analyze reviews.
            </Text>
            
            <form onSubmit={handleSubmit}>
              <VStack spacing={4} align="stretch">
                <Input
                  placeholder="https://example.com/product"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  size="lg"
                />
                <Button
                  colorScheme="blue"
                  type="submit"
                  isLoading={isSubmitting}
                  loadingText="Submitting"
                  size="lg"
                  isDisabled={!user || isSupabaseLoading}
                >
                  Analyze
                </Button>
              </VStack>
            </form>
          </Box>
        </GridItem>
        
        {/* Analysis History Section */}
        <GridItem>
          <Box bg="white" p={6} borderRadius="lg" boxShadow="sm">
            <Heading as="h2" size="md" mb={4}>
              Analysis History
            </Heading>
            
            <VStack spacing={4} align="stretch">
              {isLoading ? (
                <Text>Loading your analyses...</Text>
              ) : analyses.length === 0 ? (
                <Text>No analyses yet. Submit a product URL to get started.</Text>
              ) : (
                analyses.map((analysis) => (
                  <Card key={analysis.id} variant="outline">
                    <CardBody>
                      <VStack align="stretch" spacing={2}>
                        <Text noOfLines={1}>{analysis.url}</Text>
                        <Flex justify="space-between" align="center">
                          <Badge colorScheme={getStatusColor(analysis.status)}>
                            {analysis.status}
                          </Badge>
                          <Text fontSize="sm" color="gray.500">
                            {new Date(analysis.created_at).toLocaleDateString()}
                          </Text>
                        </Flex>
                      </VStack>
                    </CardBody>
                  </Card>
                ))
              )}
            </VStack>
          </Box>
        </GridItem>
      </Grid>
    </Container>
  );
} 