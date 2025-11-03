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
  Divider,
  HStack,
  Checkbox
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [errors, setErrors] = useState<string[]>([]);
  const [success, setSuccess] = useState<string>('');
  const [acceptTerms, setAcceptTerms] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(''); // Clear error when user starts typing
    setErrors([]);
  };

  const validateForm = () => {
    const validationErrors: string[] = [];

    if (formData.username.length < 3) {
      validationErrors.push('Username must be at least 3 characters long');
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      validationErrors.push('Username can only contain letters, numbers, and underscores');
    }

    if (formData.password.length < 8) {
      validationErrors.push('Password must be at least 8 characters long');
    }

    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      validationErrors.push('Password must contain at least one uppercase letter, lowercase letter, and number');
    }

    if (formData.password !== formData.confirmPassword) {
      validationErrors.push('Password confirmation does not match');
    }

    if (!acceptTerms) {
      validationErrors.push('Please accept the terms and conditions');
    }

    return validationErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setErrors([]);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        // Store token in localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.data.user));
        
        // Redirect to dashboard after successful registration
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          setErrors(data.errors);
        } else {
          setError(data.message || 'Registration failed');
        }
      }
    } catch (err) {
      setError('Network error. Please check your connection and try again.');
      console.error('Registration error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="md" py={8}>
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
              Join DebateSphere
            </Heading>
            <Text color="gray.600">
              Create your account to start debating
            </Text>
          </Box>

          {error && (
            <Alert status="error" borderRadius="md">
              <AlertIcon />
              {error}
            </Alert>
          )}

          {errors.length > 0 && (
            <Alert status="error" borderRadius="md">
              <Box>
                <AlertIcon />
                <VStack align="start" spacing={1} ml={6}>
                  {errors.map((err, index) => (
                    <Text key={index} fontSize="sm">• {err}</Text>
                  ))}
                </VStack>
              </Box>
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
                <FormLabel>Username</FormLabel>
                <Input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Choose a unique username"
                  focusBorderColor="blue.500"
                />
              </FormControl>

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

              <HStack spacing={4} width="100%">
                <FormControl>
                  <FormLabel>First Name</FormLabel>
                  <Input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Your first name"
                    focusBorderColor="blue.500"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Last Name</FormLabel>
                  <Input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    placeholder="Your last name"
                    focusBorderColor="blue.500"
                  />
                </FormControl>
              </HStack>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a strong password"
                  focusBorderColor="blue.500"
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Confirm Password</FormLabel>
                <Input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  focusBorderColor="blue.500"
                />
              </FormControl>

              <FormControl>
                <Checkbox
                  isChecked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  colorScheme="blue"
                >
                  I accept the terms and conditions and privacy policy
                </Checkbox>
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                width="100%"
                isLoading={loading}
                loadingText="Creating Account..."
                isDisabled={!acceptTerms}
              >
                Create Account
              </Button>
            </VStack>
          </Box>

          <Divider />

          <Box textAlign="center">
            <Text color="gray.600">
              Already have an account?{' '}
              <Link
                color="blue.500"
                fontWeight="medium"
                onClick={() => navigate('/login')}
                cursor="pointer"
              >
                Sign in here
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

export default Register;
