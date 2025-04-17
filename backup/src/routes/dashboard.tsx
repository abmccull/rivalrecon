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
} from '@chakra-ui/react';
import { getUserSubmissions as getSubmissions, submitUrl, Submission } from '../api/submissions';
import { useSupabase } from '../components/SupabaseAuthProvider';
import { User } from '@supabase/supabase-js';

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
  const { user, isLoading: isSupabaseLoading } = useSupabase();
  const toast = useToast();
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user's analyses from Supabase
  useEffect(() => {
    const fetchAnalyses = async () => {
      if (isSupabaseLoading || !user) return;
      
      try {
        setIsLoading(true);
        
        // Get submissions with associated analyses - pass userId directly
        const submissions = await getSubmissions(user.id);
        
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
          description: 'There was an error loading your analyses.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (user && !isSupabaseLoading) {
      fetchAnalyses();
    }
  }, [user, isSupabaseLoading, toast]);

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
    
    setIsSubmitting(true);
    
    try {
      // Submit URL for analysis - pass userId directly
      const submission = await submitUrl(url, user.id);
      
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
      toast({
        title: 'Submission failed',
        description: error.message || 'There was an error submitting your URL.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
                        <Flex justify="space-between" align="center">
                          <Heading size="sm">{analysis.productName || 'Processing...'}</Heading>
                          <Badge colorScheme={getStatusColor(analysis.status)}>
                            {analysis.status.charAt(0).toUpperCase() + analysis.status.slice(1)}
                          </Badge>
                        </Flex>
                        
                        <Text fontSize="sm" color="gray.600" noOfLines={1}>
                          URL: {analysis.url}
                        </Text>
                        
                        {analysis.brand && (
                          <Text fontSize="sm" color="gray.600">
                            Brand: {analysis.brand}
                          </Text>
                        )}
                        
                        {analysis.category && (
                          <Text fontSize="sm" color="gray.600">
                            Category: {analysis.category}
                          </Text>
                        )}
                        
                        <Text fontSize="xs" color="gray.400">
                          Submitted: {new Date(analysis.created_at).toLocaleString()}
                        </Text>
                        
                        {analysis.status === 'completed' && (
                          <Button size="sm" colorScheme="blue" variant="outline" mt={2}>
                            View Analysis
                          </Button>
                        )}
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