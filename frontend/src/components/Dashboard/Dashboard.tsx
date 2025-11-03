import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  Alert,
  AlertIcon,
  Badge,
  Avatar,
  Divider,
  useToast
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

interface User {
  _id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName: string;
  stats: {
    debatesWon: number;
    debatesLost: number;
    totalDebates: number;
    averageArgumentStrength: number;
  };
  winRate: string;
  createdAt: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.data.user);
      } else {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          navigate('/login');
        } else {
          setError(data.message || 'Failed to fetch profile');
        }
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
      console.error('Profile fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.REACT_APP_API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    }
  };

  const handleStartDebate = () => {
    // Navigate to debate creation (to be implemented in Week 3-4)
    alert('Debate creation will be available in Week 3-4!');
  };

  const handleViewProfile = () => {
    // Navigate to profile settings (to be implemented)
    alert('Profile settings will be available soon!');
  };

  if (loading) {
    return (
      <Container maxW="6xl" py={8}>
        <Text>Loading dashboard...</Text>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="6xl" py={8}>
        <Alert status="error" borderRadius="md">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  if (!user) {
    return (
      <Container maxW="6xl" py={8}>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          No user data available. Please try logging in again.
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="6xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Header */}
        <Box
          bg="white"
          p={6}
          borderRadius="lg"
          boxShadow="md"
          border="1px"
          borderColor="gray.200"
        >
          <HStack justify="space-between" align="center">
            <HStack spacing={4}>
              <Avatar
                name={user.fullName}
                size="lg"
                bg="blue.500"
                color="white"
              />
              <Box>
                <Heading as="h1" size="xl" color="blue.600">
                  Welcome back, {user.firstName || user.username}!
                </Heading>
                <Text color="gray.600" fontSize="lg">
                  Ready to sharpen your critical thinking skills?
                </Text>
              </Box>
            </HStack>
            <VStack spacing={2}>
              <Button colorScheme="red" variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
              <Button variant="ghost" size="sm" onClick={handleViewProfile}>
                Edit Profile
              </Button>
            </VStack>
          </HStack>
        </Box>

        {/* Quick Actions */}
        <Box
          bg="white"
          p={6}
          borderRadius="lg"
          boxShadow="md"
          border="1px"
          borderColor="gray.200"
        >
          <Heading as="h2" size="lg" mb={4} color="gray.800">
            Quick Actions
          </Heading>
          <HStack spacing={4}>
            <Button
              colorScheme="blue"
              size="lg"
              onClick={handleStartDebate}
            >
              Start New Debate
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => alert('Browse debates coming in Week 3-4!')}
            >
              Browse Public Debates
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => alert('AI Coach available in Week 6-8!')}
            >
              Practice with AI Coach
            </Button>
          </HStack>
        </Box>

        {/* Statistics */}
        <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={6}>
          <GridItem>
            <Box
              bg="white"
              p={6}
              borderRadius="lg"
              boxShadow="md"
              border="1px"
              borderColor="gray.200"
            >
              <Stat>
                <StatLabel>Total Debates</StatLabel>
                <StatNumber>{user.stats.totalDebates}</StatNumber>
                <StatHelpText>
                  {user.stats.totalDebates === 0 ? 'Start your first debate!' : 'Keep debating!'}
                </StatHelpText>
              </Stat>
            </Box>
          </GridItem>

          <GridItem>
            <Box
              bg="white"
              p={6}
              borderRadius="lg"
              boxShadow="md"
              border="1px"
              borderColor="gray.200"
            >
              <Stat>
                <StatLabel>Win Rate</StatLabel>
                <StatNumber>{user.winRate}%</StatNumber>
                <StatHelpText>
                  {user.stats.debatesWon} wins / {user.stats.debatesLost} losses
                </StatHelpText>
              </Stat>
            </Box>
          </GridItem>

          <GridItem>
            <Box
              bg="white"
              p={6}
              borderRadius="lg"
              boxShadow="md"
              border="1px"
              borderColor="gray.200"
            >
              <Stat>
                <StatLabel>Argument Strength</StatLabel>
                <StatNumber>
                  {user.stats.averageArgumentStrength ? 
                    `${(user.stats.averageArgumentStrength * 100).toFixed(0)}%` : 
                    'N/A'
                  }
                </StatNumber>
                <StatHelpText>
                  AI-analyzed average
                </StatHelpText>
              </Stat>
            </Box>
          </GridItem>

          <GridItem>
            <Box
              bg="white"
              p={6}
              borderRadius="lg"
              boxShadow="md"
              border="1px"
              borderColor="gray.200"
            >
              <Stat>
                <StatLabel>Member Since</StatLabel>
                <StatNumber fontSize="lg">
                  {new Date(user.createdAt).toLocaleDateString()}
                </StatNumber>
                <StatHelpText>
                  Account created
                </StatHelpText>
              </Stat>
            </Box>
          </GridItem>
        </Grid>

        {/* Development Status */}
        <Box
          bg="yellow.50"
          border="1px"
          borderColor="yellow.200"
          p={6}
          borderRadius="lg"
        >
          <HStack spacing={3} mb={4}>
            <Badge colorScheme="yellow" variant="solid">DEVELOPMENT STATUS</Badge>
            <Text fontWeight="bold" color="yellow.800">Week 2: Authentication Complete</Text>
          </HStack>
          
          <VStack align="start" spacing={2}>
            <Text color="yellow.800">
              <strong>✅ Completed:</strong> User registration, login, JWT authentication, profile management
            </Text>
            <Text color="yellow.800">
              <strong>🔄 Next (Week 3-4):</strong> Real-time debate arena with Socket.IO messaging
            </Text>
            <Text color="yellow.800">
              <strong>⏳ Coming Soon:</strong> AI fallacy detection (Week 6-8), argument mapping tools
            </Text>
          </VStack>
        </Box>

        {/* Account Info */}
        <Box
          bg="white"
          p={6}
          borderRadius="lg"
          boxShadow="md"
          border="1px"
          borderColor="gray.200"
        >
          <Heading as="h3" size="md" mb={4} color="gray.800">
            Account Information
          </Heading>
          <Grid templateColumns="repeat(auto-fit, minmax(250px, 1fr))" gap={4}>
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Username</Text>
              <Text fontWeight="medium">{user.username}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Email</Text>
              <Text fontWeight="medium">{user.email}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.600" mb={1}>Full Name</Text>
              <Text fontWeight="medium">{user.fullName}</Text>
            </Box>
          </Grid>
        </Box>
      </VStack>
    </Container>
  );
};

export default Dashboard;
