import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Tabs, TabList, TabPanels, TabPanel, Tab } from '@chakra-ui/react';
import SignInForm from '../components/auth/SignInForm';
import SignUpForm from '../components/auth/SignUpForm';
import { useSupabaseAuth as useSupabase } from '../features/auth/SupabaseAuthProvider';

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, isLoading } = useSupabase();
  const [tabIndex, setTabIndex] = useState(location.pathname === '/signin' ? 0 : 1);

  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Box maxW="md" mx="auto" mt={8} p={6}>
      <Tabs index={tabIndex} onChange={setTabIndex}>
        <TabList>
          <Tab>Sign In</Tab>
          <Tab>Sign Up</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <SignInForm />
          </TabPanel>
          <TabPanel>
            <SignUpForm />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
} 