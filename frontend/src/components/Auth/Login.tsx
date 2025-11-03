import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Alert,
  AlertIcon,
  Link,
  Container,
  Divider
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

// ================== REPLACE THE ENTIRE try...catch BLOCK ==================
try {
  // commented ================== MODIFIED =================
  const apiUrl = `${process.env.REACT_APP_API_URL}/api/auth/login`;
  console.log('Attempting to send login request to:', apiUrl);
  // commented ================== MODIFIED =================

  const response = await fetch(apiUrl, { // Use the variable here
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(formData)
  });

  const data = await response.json();

  if (response.ok) {
    toast({
      title: "Login Successful",
      description: "Welcome back! Redirecting you...",
      status: "success",
      duration: 3000,
      isClosable: true,
      position: "top",
    });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.data.user));
    setTimeout(() => {
      navigate('/dashboard');
    }, 1000);
  } else {
    toast({
      title: "Login Failed",
      description: data.message || 'An unknown error occurred.',
      status: "error",
      duration: 5000,
      isClosable: true,
      position: "top",
    });
  }
} catch (err) {
  // commented ================== MODIFIED =================
  console.error('FETCH ERROR:', err);
  toast({
    title: "Network Error",
    description: "Could not connect to the server. Please check your connection and the server status.",
    status: "error",
    duration: 5000,
    isClosable: true,
    position: "top",
  });
  // commented ================== MODIFIED =================
} finally {
  setLoading(false);
}
// =========================================================================
  };

  return (
    <Container maxW="md" py={12}>
      <Box
        bg="white"
        p={8}
        borderRadius="lg"
        boxShadow="lg"
        border="1px"
        borderColor="gray.200"
      >
        <VStack spacing={6}>
          <Box textAlign="center">
            <Heading as="h2" size="lg" color="blue.600" mb={2}>
              Welcome Back
            </Heading>
            <Text color="gray.600">
              Sign in to your DebateSphere account
            </Text>
          </Box>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

          {success && (
            <Alert status="success" borderRadius="md">
              <AlertIcon />
              {success}
            </Alert>
          )}

          <Box as="form" onSubmit={handleSubmit} width="100%">
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Email Address</FormLabel>
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  focusBorderColor="blue.500"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  focusBorderColor="blue.500"
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                width="100%"
                isLoading={loading}
                loadingText="Signing In..."
              >
                Sign In
              </Button>
            </VStack>
          </Box>

          <Divider />

          <Box textAlign="center">
            <Text color="gray.600">
              Don't have an account?{' '}
              <Link
                color="blue.500"
                fontWeight="medium"
                onClick={() => navigate('/register')}
                cursor="pointer"
              >
                Sign up here
              </Link>
            </Text>
          </Box>

          <Box textAlign="center">
            <Link
              color="blue.500"
              fontSize="sm"
              onClick={() => navigate('/')}
              cursor="pointer"
            >
              ← Back to Home
            </Link>
          </Box>
        </VStack>
      </Box>
    </Container>
  );
};

export default Login;
