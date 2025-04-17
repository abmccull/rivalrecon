import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSupabaseAuth } from '../../features/auth/SupabaseAuthProvider';
import { Spinner, Center } from '@chakra-ui/react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps): JSX.Element => {
  const { user, isLoading } = useSupabaseAuth();

  if (isLoading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="blue.500" />
      </Center>
    );
  }

  if (!user) {
    // Redirect to sign-in page if not authenticated
    return <Navigate to="/sign-in" replace />;
  }

  // Render children if authenticated
  return <>{children}</>;
};

export default ProtectedRoute; 