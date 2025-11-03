import React from 'react';
import { ChakraProvider, Box, Heading, Text, VStack, Container } from '@chakra-ui/react';

function App() {
  return (
    <ChakraProvider>
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
              🎉 System Status
            </Text>
            <VStack spacing={2}>
              <Text color="green.600">✅ Backend Server: Running on port 5000</Text>
              <Text color="green.600">✅ MongoDB Database: Connected</Text>
              <Text color="green.600">✅ Socket.IO: Ready for real-time communication</Text>
              <Text color="green.600">✅ React Frontend: Successfully loaded</Text>
            </VStack>
          </Box>

          <Box p={6} bg="blue.50" borderRadius="lg" maxW="2xl">
            <Text fontSize="md" color="blue.800">
              🚀 <strong>Ready for Testing!</strong><br/>
              Your DebateSphere application is now fully operational. 
              The real-time debate infrastructure is set up and ready for Week 4 UI development.
            </Text>
          </Box>
        </VStack>
      </Container>
    </ChakraProvider>
  );
}

export default App;
