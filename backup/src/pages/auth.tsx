import React, { useState } from 'react';
import { 
  Box,
  Container,
  Heading,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  VStack,
} from '@chakra-ui/react';
import { useSupabase } from '../components/SupabaseAuthProvider';
import { useNavigate } from 'react-router-dom';

const AuthPage: React.FC = () => {
  const { signIn, signUp, user } = useSupabase();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // If user is already logged in, redirect to dashboard
  if (user) {
    navigate('/dashboard');
    return null;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    
    if (!email || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await signIn(email, password);
      
      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage('Successfully signed in!');
        // Redirect will happen automatically once user state updates
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    
    if (!email || !password) {
      setErrorMessage('Please enter both email and password');
      return;
    }
    
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error, data } = await signUp(email, password);
      
      if (error) {
        setErrorMessage(error.message);
      } else {
        if (data?.user && !data.session) {
          setSuccessMessage('Please check your email for a confirmation link!');
        } else {
          setSuccessMessage('Successfully signed up and logged in!');
          // Redirect will happen automatically once user state updates
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during sign up');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="md" py={12}>
      <Box p={8} borderWidth={1} borderRadius="lg" boxShadow="lg">
        <Heading as="h1" size="xl" textAlign="center" mb={6}>
          RivalRecon
        </Heading>
        
        <Tabs isFitted variant="enclosed">
          <TabList mb="1em">
            <Tab>Sign In</Tab>
            <Tab>Sign Up</Tab>
          </TabList>
          
          <TabPanels>
            {/* Sign In Panel */}
            <TabPanel>
              <form onSubmit={handleSignIn}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </FormControl>
                  
                  {errorMessage && (
                    <Alert status="error">
                      <AlertIcon />
                      {errorMessage}
                    </Alert>
                  )}
                  
                  {successMessage && (
                    <Alert status="success">
                      <AlertIcon />
                      {successMessage}
                    </Alert>
                  )}
                  
                  <Button
                    width="100%"
                    colorScheme="blue"
                    type="submit"
                    isLoading={isLoading}
                  >
                    Sign In
                  </Button>
                </VStack>
              </form>
            </TabPanel>
            
            {/* Sign Up Panel */}
            <TabPanel>
              <form onSubmit={handleSignUp}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel>Email</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </FormControl>
                  
                  <FormControl isRequired>
                    <FormLabel>Password</FormLabel>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      Must be at least 6 characters
                    </Text>
                  </FormControl>
                  
                  {errorMessage && (
                    <Alert status="error">
                      <AlertIcon />
                      {errorMessage}
                    </Alert>
                  )}
                  
                  {successMessage && (
                    <Alert status="success">
                      <AlertIcon />
                      {successMessage}
                    </Alert>
                  )}
                  
                  <Button
                    width="100%"
                    colorScheme="blue"
                    type="submit"
                    isLoading={isLoading}
                  >
                    Sign Up
                  </Button>
                </VStack>
              </form>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </Container>
  );
};

export default AuthPage; 