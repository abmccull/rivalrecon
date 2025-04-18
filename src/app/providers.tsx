import { ChakraProvider } from '@chakra-ui/react';
import { SupabaseAuthProvider } from '../features/auth/SupabaseAuthProvider';
import theme from '../theme';

interface ProvidersProps {
  children: React.ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <ChakraProvider theme={theme}>
      <SupabaseAuthProvider>
        {children}
      </SupabaseAuthProvider>
    </ChakraProvider>
  );
} 