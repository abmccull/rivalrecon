import { theme as baseTheme } from '@chakra-ui/theme';

const config = {
  initialColorMode: 'light',
  useSystemColorMode: false,
};

const colors = {
  brand: {
    deepBlue: '#1A365D',
    teal: '#319795',
    paleBlue: '#EBF8FF',
    darkGray: '#2D3748',
  },
};

const theme = {
  ...baseTheme,
  config,
  colors: {
    ...baseTheme.colors,
    ...colors,
  },
  fonts: {
    heading: 'Inter, sans-serif',
    body: 'Inter, sans-serif',
  },
  styles: {
    global: (props: any) => ({
      body: {
        bg: props.colorMode === 'dark' ? 'gray.800' : 'white',
        color: props.colorMode === 'dark' ? 'white' : 'gray.800',
      },
    }),
  },
};

export default theme; 