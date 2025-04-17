import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Container,
  Heading,
} from '@chakra-ui/react';
import { useNavigate, Link } from 'react-router-dom';
import { useSupabaseAuth as useSupabase } from '../../features/auth/SupabaseAuthProvider';

interface SignInPageProps {
  isSignUp?: boolean;
}

export default function SignInPage({ isSignUp = false }: SignInPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useSupabase();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    console.log('Starting sign in process...', { email });

    try {
      if (isSignUp) {
        console.log('Attempting sign up...');
        const { error } = await signUp(email, password);
        console.log('Sign up response:', { error });
        if (error) throw error;
        toast({
          title: 'Account created successfully',
          description: 'Please check your email for verification.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      } else {
        console.log('Attempting sign in...');
        const { error } = await signIn(email, password);
        console.log('Sign in response:', { error });
        if (error) throw error;
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Authentication error:', error);
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.sm" py={10}>
      <VStack spacing={8}>
        <Heading>{isSignUp ? 'Create Account' : 'Sign In'}</Heading>
        <Box w="100%" as="form" onSubmit={handleSubmit}>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Email</FormLabel>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </FormControl>
            <FormControl isRequired>
              <FormLabel>Password</FormLabel>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
              />
            </FormControl>
            <Button
              type="submit"
              colorScheme="blue"
              width="100%"
              isLoading={isLoading}
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
          </VStack>
        </Box>
        <Text>
          {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
          <Link to={isSignUp ? '/sign-in' : '/sign-up'}>
            {isSignUp ? 'Sign In' : 'Sign Up'}
          </Link>
        </Text>
      </VStack>
    </Container>
  );
} 