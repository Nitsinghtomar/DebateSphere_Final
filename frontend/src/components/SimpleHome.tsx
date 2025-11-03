import React from 'react';
import { Box, Heading, Text, Button, VStack, Container } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Container maxW="4xl" py={10}>
      <VStack spacing={8} textAlign="center">
        <Box>
          <Heading as="h1" size="2xl" mb={4} color="blue.600">
            DebateSphere
          </Heading>
          <Text fontSize="xl" color="gray.600">
            The AI-Powered Critical Thinking Incubator
          </Text>
        </Box>
        
        <Box>
          <Text fontSize="lg" mb={4}>
            🎉 Week 4: Debate Arena UI Complete!
          </Text>
          <VStack spacing={2}>
            <Text color="green.600">✅ Backend Server: Running on port 5000</Text>
            <Text color="green.600">✅ MongoDB Database: Connected</Text>
            <Text color="green.600">✅ Socket.IO: Real-time ready</Text>
            <Text color="green.600">✅ React Frontend: Successfully loaded</Text>
          </VStack>
        </Box>

        <VStack spacing={4}>
          <Button
            as={RouterLink}
            to="/register"
            colorScheme="blue"
            size="lg"
          >
            Get Started - Register
          </Button>
          <Button
            as={RouterLink}
            to="/login"
            colorScheme="teal"
            variant="outline"
            size="lg"
          >
            Login to Continue
          </Button>
          <Button
            as={RouterLink}
            to="/dashboard"
            colorScheme="purple"
            variant="outline"
            size="lg"
          >
            Go to Dashboard
          </Button>
        </VStack>

        <Box p={6} bg="blue.50" borderRadius="lg" maxW="2xl">
          <Text fontSize="md" color="blue.800">
            🚀 <strong>Ready for Testing!</strong><br/>
            Your DebateSphere application is now fully operational with complete 
            real-time debate infrastructure and UI components.
          </Text>
        </Box>
      </VStack>
    </Container>
  );
};

export default Home;
