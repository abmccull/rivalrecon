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
  FormErrorMessage,
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';

export default function SignUpForm() {
  const { signUp, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      await signUp(email, password);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during sign-up');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={4}>
        <FormControl id="signup-email" isRequired>
          <FormLabel>Email address</FormLabel>
          <Input 
            type="email" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </FormControl>
        
        <FormControl id="signup-password" isRequired isInvalid={!!error && (error.includes('Password') || error.includes('characters'))}>
          <FormLabel>Password</FormLabel>
          <Input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <FormErrorMessage>
            {error && (error.includes('Password') || error.includes('characters')) ? error : ''}
          </FormErrorMessage>
        </FormControl>

        <FormControl id="confirm-password" isRequired isInvalid={!!error && error.includes('match')}>
          <FormLabel>Confirm Password</FormLabel>
          <Input 
            type="password" 
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <FormErrorMessage>
            {error && error.includes('match') ? error : ''}
          </FormErrorMessage>
        </FormControl>
        
        {error && !error.includes('Password') && !error.includes('match') && !error.includes('characters') && (
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
          loadingText="Signing Up"
          w="100%"
          mt={2}
        >
          Sign Up
        </Button>
      </Stack>
    </form>
  );
} 