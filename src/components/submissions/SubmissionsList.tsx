import { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Badge,
  Spinner,
  useToast,
  Link as ChakraLink
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { getSubmissions, Submission } from '../../api/submissions';

export const SubmissionsList = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { supabase } = useSupabaseAuth();
  const toast = useToast();

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const data = await getSubmissions(supabase);
        setSubmissions(data);
      } catch (error: any) {
        toast({
          title: 'Error Loading Submissions',
          description: error.message || 'Failed to load your submissions.',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubmissions();
  }, [supabase, toast]);

  if (isLoading) {
    return (
      <Box textAlign="center" py={10}>
        <Spinner size="xl" />
        <Text mt={4}>Loading submissions...</Text>
      </Box>
    );
  }

  if (submissions.length === 0) {
    return (
      <Box textAlign="center" py={10}>
        <Text>No submissions yet. Submit a product URL to get started!</Text>
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

  return (
    <VStack spacing={4} align="stretch" width="100%">
      <Heading size="md" mb={4}>Your Submissions</Heading>
      
      {submissions.map((submission) => (
        <Box
          key={submission.id}
          p={4}
          borderWidth={1}
          borderRadius="md"
          _hover={{ shadow: 'md' }}
        >
          <ChakraLink
            as={Link}
            to={`/submissions/${submission.id}`}
            display="block"
          >
            <Text fontSize="lg" fontWeight="medium" mb={2}>
              {new URL(submission.url).hostname}
            </Text>
            
            <Badge colorScheme={getStatusColor(submission.status)} mb={2}>
              {submission.status}
            </Badge>
            
            <Text fontSize="sm" color="gray.600">
              Submitted on {new Date(submission.created_at).toLocaleDateString()}
            </Text>
            
            {submission.reviews && (
              <Text fontSize="sm" mt={2}>
                {submission.reviews.length} reviews analyzed
              </Text>
            )}
          </ChakraLink>
        </Box>
      ))}
    </VStack>
  );
}; 