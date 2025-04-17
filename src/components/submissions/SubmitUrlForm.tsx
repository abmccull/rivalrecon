import { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Text
} from '@chakra-ui/react';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';
import { submitUrl } from '../../api/submissions';

export const SubmitUrlForm = () => {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { supabase } = useSupabaseAuth();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast({
        title: 'URL Required',
        description: 'Please enter a valid product URL to analyze.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const submission = await submitUrl(url, supabase);
      toast({
        title: 'Analysis Started',
        description: 'Your submission has been received and analysis is in progress.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      setUrl('');
    } catch (error: any) {
      toast({
        title: 'Submission Failed',
        description: error.message || 'Failed to submit URL for analysis. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} width="100%" maxW="600px" mx="auto">
      <VStack spacing={4} align="stretch">
        <Text fontSize="lg" fontWeight="medium" color="gray.700">
          Submit a product URL for competitive analysis
        </Text>
        
        <FormControl isRequired>
          <FormLabel>Product URL</FormLabel>
          <Input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter product URL (e.g., Amazon, Shopify)"
            size="lg"
            disabled={isSubmitting}
          />
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          size="lg"
          isLoading={isSubmitting}
          loadingText="Submitting..."
          width="100%"
        >
          Analyze Product
        </Button>
      </VStack>
    </Box>
  );
}; 