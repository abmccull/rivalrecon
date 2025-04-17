import { ChakraProvider } from '@chakra-ui/react';
import { SupabaseAuthProvider } from '../features/auth/SupabaseAuthProvider';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ChakraProvider>
      <SupabaseAuthProvider>
        {children}
      </SupabaseAuthProvider>
    </ChakraProvider>
  );
} 