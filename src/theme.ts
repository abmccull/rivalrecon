import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  colors: {
    blue: {
      700: '#1E3A8A',
    },
    teal: {
      500: '#2DD4BF',
    },
    gray: {
      50: '#F7FAFC',
      200: '#D1D5DB',
      500: '#6B7280',
      800: '#1F2937',
    },
    green: {
      500: '#10B981',
    },
    red: {
      500: '#EF4444',
    },
    // Custom theme colors
    deepBlue: {
      800: '#1E3A8A',
    },
    paleBlue: {
      50: '#F7FAFC',
    },
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  fontSizes: {
    xl: '24px',
    lg: '20px',
    md: '16px',
    sm: '14px',
  },
  components: {
    Card: {
      baseStyle: {
        bg: 'white',
        borderRadius: 'md',
        boxShadow: 'md',
        p: 6,
        transition: 'transform 0.2s',
        _hover: { transform: 'scale(1.02)' },
      },
    },
    Button: {
      variants: {
        primary: {
          bgGradient: 'linear(to-r, blue.700, teal.500)',
          color: 'white',
          borderRadius: 'md',
          px: 6,
          py: 3,
          _hover: { bgGradient: 'linear(to-r, blue.600, teal.400)', transform: 'scale(1.05)' },
        },
        secondary: {
          bg: 'transparent',
          border: '1px solid',
          borderColor: 'teal.500',
          color: 'teal.500',
          _hover: { bg: 'teal.500', color: 'white' },
        },
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderColor: 'gray.300',
          borderRadius: 'md',
          p: 3,
          _focus: { borderColor: 'teal.500' },
          _placeholder: { color: 'gray.500' },
        },
      },
    },
    Badge: {
      baseStyle: {
        bg: 'teal.500',
        color: 'white',
        borderRadius: 'full',
        px: 3,
        py: 1,
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.800',
      },
    },
  },
});

export default theme; 