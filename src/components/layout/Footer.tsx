import React from 'react';
import {
  Box,
  Container,
  Stack,
  Text,
  Link,
  useColorModeValue,
  Flex,
} from '@chakra-ui/react';

const FOOTER_LINKS = [
  { label: 'About', href: '#' },
  { label: 'Contact', href: '#' },
  { label: 'Privacy Policy', href: '#' },
  { label: 'Terms of Service', href: '#' },
];

export const Footer = () => {
  return (
    <Box
      bg="gray.100"
      color="gray.700"
      borderTop="1px"
      borderColor="gray.200"
      py={4}
      position="sticky"
      bottom={0}
      width="100%"
      zIndex={900}
    >
      <Container
        as={Stack}
        maxW="container.xl"
        direction={{ base: 'column', md: 'row' }}
        spacing={4}
        justify={{ base: 'center', md: 'space-between' }}
        align={{ base: 'center', md: 'center' }}
      >
        <Text>© {new Date().getFullYear()} RivalRecon. All rights reserved</Text>
        <Stack direction={{ base: 'column', md: 'row' }} spacing={6}>
          {FOOTER_LINKS.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              color="teal.500"
              _hover={{ textDecoration: 'underline' }}
            >
              {link.label}
            </Link>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}; 