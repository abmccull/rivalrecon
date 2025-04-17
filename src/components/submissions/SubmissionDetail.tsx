import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  VStack,
  Heading,
  Text,
  Badge,
  Spinner,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast
} from '@chakra-ui/react';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { getSubmission, Submission } from '../../api/submissions';
import Plot from 'react-plotly.js';
import { Data, Datum } from 'plotly.js';

export const SubmissionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabaseAuth();
  const toast = useToast();

  useEffect(() => {
    const fetchSubmission = async () => {
      if (!id) return;
      
      try {
        const data = await getSubmission(supabase, id);
        setSubmission(data);
      } catch (error: any) {
        toast({
          title: 'Error Loading Submission',
          description: error.message || 'Failed to load submission details.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmission();
  }, [id, supabase, toast]);

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading submission details...</Text>
      </Box>
    );
  }

  if (!submission) {
    return (
      <Box textAlign="center" py={10}>
        <Text>Submission not found</Text>
      </Box>
    );
  }

  const getStatusColor = (status: Submission['status']) => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'processing':
        return 'blue';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };

  const renderRatingsPlot = () => {
    if (!submission.analyses?.[0]?.ratings_over_time) return null;

    const dates = Object.keys(submission.analyses[0].ratings_over_time);
    const ratings = Object.values(submission.analyses[0].ratings_over_time);

    const data: Data[] = [{
      x: dates.map(date => new Date(date).toISOString()) as Datum[],
      y: ratings as Datum[],
      type: 'scatter',
      mode: 'lines+markers',
      name: 'Average Rating'
    }];

    return (
      <Plot
        data={data}
        layout={{
          title: 'Rating Trends',
          xaxis: { title: 'Date' },
          yaxis: { title: 'Average Rating' },
        }}
        style={{ width: '100%', height: '400px' }}
      />
    );
  };

  return (
    <VStack spacing={6} align="stretch" width="100%" maxW="1200px" mx="auto" p={4}>
      <Box>
        <Heading size="lg" mb={2}>{new URL(submission.url).hostname}</Heading>
        <Badge colorScheme={getStatusColor(submission.status)} fontSize="md">
          {submission.status}
        </Badge>
      </Box>

      {submission.status === 'completed' && submission.analyses && submission.analyses[0] && (
        <Tabs variant="enclosed">
          <TabList>
            <Tab>Overview</Tab>
            <Tab>Reviews</Tab>
            <Tab>Analysis</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
                <Stat>
                  <StatLabel>Total Reviews</StatLabel>
                  <StatNumber>{submission.reviews?.length || 0}</StatNumber>
                  <StatHelpText>Analyzed</StatHelpText>
                </Stat>
                
                <Stat>
                  <StatLabel>Average Rating</StatLabel>
                  <StatNumber>
                    {submission.reviews && submission.reviews.length > 0
                      ? (submission.reviews.reduce((acc, review) => 
                          acc + (review.overall_rating || 0), 0) / submission.reviews.length
                        ).toFixed(1)
                      : 'N/A'}
                  </StatNumber>
                  <StatHelpText>Out of 5</StatHelpText>
                </Stat>
                
                <Stat>
                  <StatLabel>Analysis Date</StatLabel>
                  <StatNumber>
                    {new Date(submission.analyses[0].created_at).toLocaleDateString()}
                  </StatNumber>
                  <StatHelpText>Completed</StatHelpText>
                </Stat>
              </SimpleGrid>
            </TabPanel>

            <TabPanel>
              <VStack spacing={4} align="stretch">
                {submission.reviews?.map((review) => (
                  <Box key={review.id} p={4} borderWidth={1} borderRadius="md">
                    <Text fontSize="lg" fontWeight="medium" mb={2}>
                      {review.product_name}
                    </Text>
                    {review.brand_name && (
                      <Text color="gray.600" mb={2}>
                        Brand: {review.brand_name}
                      </Text>
                    )}
                    {review.overall_rating && (
                      <Badge colorScheme={review.overall_rating >= 4 ? 'green' : 'orange'} mb={2}>
                        Rating: {review.overall_rating}/5
                      </Badge>
                    )}
                    {review.review_text && (
                      <Text mt={2}>{review.review_text}</Text>
                    )}
                    {review.review_date && (
                      <Text fontSize="sm" color="gray.500" mt={2}>
                        Review Date: {new Date(review.review_date).toLocaleDateString()}
                      </Text>
                    )}
                  </Box>
                ))}
              </VStack>
            </TabPanel>

            <TabPanel>
              <VStack spacing={6} align="stretch">
                {submission.analyses[0].ratings_over_time && (
                  <Box p={4} borderWidth={1} borderRadius="md">
                    <Heading size="sm" mb={4}>Ratings Over Time</Heading>
                    {renderRatingsPlot()}
                  </Box>
                )}

                {submission.analyses[0].top_positives && (
                  <Box p={4} borderWidth={1} borderRadius="md">
                    <Heading size="sm" mb={4}>Top Positive Aspects</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      {Object.entries(submission.analyses[0].top_positives).map(([key, value]) => (
                        <Stat key={key}>
                          <StatLabel>{key}</StatLabel>
                          <StatNumber>
                            {typeof value === 'number' ? value.toFixed(1) : String(value)}
                          </StatNumber>
                        </Stat>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}

                {submission.analyses[0].top_negatives && (
                  <Box p={4} borderWidth={1} borderRadius="md">
                    <Heading size="sm" mb={4}>Areas for Improvement</Heading>
                    <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                      {Object.entries(submission.analyses[0].top_negatives).map(([key, value]) => (
                        <Stat key={key}>
                          <StatLabel>{key}</StatLabel>
                          <StatNumber>
                            {typeof value === 'number' ? value.toFixed(1) : String(value)}
                          </StatNumber>
                        </Stat>
                      ))}
                    </SimpleGrid>
                  </Box>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      )}

      {submission.status === 'processing' && (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" />
          <Text mt={4}>Analysis in progress...</Text>
        </Box>
      )}

      {submission.status === 'failed' && (
        <Box textAlign="center" py={10}>
          <Text color="red.500">Analysis failed. Please try submitting the URL again.</Text>
        </Box>
      )}
    </VStack>
  );
}; 