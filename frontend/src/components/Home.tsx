import React from 'react';
import { Box, Heading, Text, Button, VStack, Container } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

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
          <Text fontSize="lg" mb={6} color="gray.700" maxW="2xl">
            Practice and refine your argumentation skills through debates with peers 
            or an advanced AI opponent. Develop critical thinking through structured 
            practice and real-time feedback.
          </Text>
        </Box>

        <VStack spacing={4}>
          <Button 
            colorScheme="blue" 
            size="lg" 
            onClick={() => navigate('/register')}
          >
            Get Started
          </Button>
          <Button 
            variant="outline" 
            size="lg" 
            onClick={() => navigate('/login')}
          >
            Sign In
          </Button>
        </VStack>

        <Box mt={8} p={6} bg="gray.50" borderRadius="md">
          <Heading as="h3" size="md" mb={4}>
            Key Features
          </Heading>
          <VStack spacing={2} align="start">
            <Text>🎯 Real-time debate arena with live messaging</Text>
            <Text>🤖 AI-powered logical fallacy detection</Text>
            <Text>📊 Argument mapping and visualization tools</Text>
            <Text>📈 Personal analytics and skill tracking</Text>
          </VStack>
        </Box>

        <Text fontSize="sm" color="gray.500" mt={8}>
          ET 617 Course Project - Indian Institute of Technology Bombay
        </Text>
      </VStack>
    </Container>
  );
};

export default Home;
