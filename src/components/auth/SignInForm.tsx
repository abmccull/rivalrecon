import { useState } from 'react';
import {
  Stack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Alert,
  AlertIcon,
  AlertDescription,
  Text,
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';

export default function SignInForm() {
  const { signIn, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during sign-in');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={4}>
        <FormControl id="email" isRequired>
          <FormLabel>Email address</FormLabel>
          <Input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormControl>
        
        <FormControl id="password" isRequired>
          <FormLabel>Password</FormLabel>
          <Input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </FormControl>
        
        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <Button
          type="submit"
          colorScheme="blue"
          size="lg"
          fontSize="md"
          isLoading={loading}
          loadingText="Signing In"
          w="100%"
          mt={2}
        >
          Sign In
        </Button>
      </Stack>
    </form>
  );
} 