import React, { useState, useEffect } from 'react';
import { 
  ChakraProvider, useToast, Box, Button, Container, VStack, 
  Heading, Text, FormControl, FormLabel, Input, Card, CardBody,
  Flex, HStack, Avatar, Badge, Grid, GridItem, Progress, Divider,
  Menu, MenuButton, MenuList, MenuItem, IconButton, Stat, StatLabel,
  StatNumber, StatHelpText, Modal, ModalOverlay, ModalContent,
  ModalHeader, ModalCloseButton, ModalBody, Select, Tabs, TabList,
  Tab, TabPanels, TabPanel, Drawer, DrawerOverlay, DrawerContent,
  DrawerCloseButton, DrawerHeader, DrawerBody, useDisclosure
} from '@chakra-ui/react';

interface User {
  username: string;
  position: 'PRO' | 'CON';
}

interface UserProfile {
  name: string;
  level: string;
  avatar: string;
  streak: number;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<User>({ username: 'guest_user', position: 'PRO' });
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: 'Guest User',
    level: 'Beginner',
    avatar: '👤',
    streak: 0
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');

  const toast = useToast();
  const { isOpen: isNewDebateOpen, onOpen: onNewDebateOpen, onClose: onNewDebateClose } = useDisclosure();

  // Mock data matching prototype
  const userStats = {
    debatesCompleted: 47,
    winRate: 72,
    argumentStrength: 8.4,
    fallaciesDetected: 23,
    totalPoints: 2847,
    rank: 'Diamond',
    badges: ['Logical Thinker', 'Evidence Master', 'Fallacy Detective', 'Debate Champion'],
    debateHistory: [
      { date: '2025-08-20', topic: 'AI Ethics', result: 'won', score: 8.7 },
      { date: '2025-08-19', topic: 'Climate Policy', result: 'won', score: 8.2 }
    ]
  };

  const debateTopics = [
    "Social Media's Impact on Society", 
    "Climate Change Policy Solutions", 
    "Universal Basic Income", 
    "Artificial Intelligence Ethics", 
    "Remote Work vs Office Work"
  ];

  // Check for existing authentication on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/verify`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            setIsAuthenticated(true);
            setCurrentUser({ username: data.user.username, position: 'PRO' });
            setUserProfile({
              name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || data.user.username,
              level: 'Advanced Debater',
              avatar: '👨‍💼',
              streak: 5
            });
          } else {
            localStorage.removeItem('token');
          }
        } catch (error) {
          console.error('Auth verification error:', error);
          localStorage.removeItem('token');
        }
      }
      setIsInitializing(false);
    };

    checkAuthStatus();
  }, []);

  const handleLogin = async (email: string, password: string) => {
    setAuthLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setIsAuthenticated(true);
        setCurrentUser({ username: data.user.username, position: 'PRO' });
        setUserProfile({
          name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || data.user.username,
          level: 'Advanced Debater',
          avatar: '👨‍💼',
          streak: 5
        });
        localStorage.setItem('token', data.token);
        toast({ 
          title: 'Login successful!', 
          description: `Welcome back, ${data.user.username}!`, 
          status: 'success', 
          duration: 3000 
        });
      } else {
        toast({ 
          title: 'Login failed', 
          description: data.message || 'Invalid credentials', 
          status: 'error', 
          duration: 5000 
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({ 
        title: 'Login failed', 
        description: 'Network error. Please try again.', 
        status: 'error', 
        duration: 5000 
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (userData: RegisterData) => {
    setAuthLoading(true);
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        setIsAuthenticated(true);
        setCurrentUser({ username: data.user.username, position: 'PRO' });
        setUserProfile({
          name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || data.user.username,
          level: 'Beginner',
          avatar: '👤',
          streak: 0
        });
        localStorage.setItem('token', data.token);
        toast({ 
          title: 'Registration successful!', 
          description: 'Welcome to DebateSphere!', 
          status: 'success', 
          duration: 3000 
        });
      } else {
        // Handle validation errors
        if (data.errors && Array.isArray(data.errors)) {
          toast({ 
            title: 'Registration failed', 
            description: data.errors.join('. '), 
            status: 'error', 
            duration: 7000 
          });
        } else {
          toast({ 
            title: 'Registration failed', 
            description: data.message || 'Please check your information and try again.', 
            status: 'error', 
            duration: 5000 
          });
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({ 
        title: 'Registration failed', 
        description: 'Network error. Please try again.', 
        status: 'error', 
        duration: 5000 
      });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser({ username: 'guest_user', position: 'PRO' });
    setUserProfile({
      name: 'Guest User',
      level: 'Beginner',
      avatar: '👤',
      streak: 0
    });
    localStorage.removeItem('token');
    toast({ 
      title: 'Logged out', 
      description: 'You have been successfully logged out.', 
      status: 'info', 
      duration: 3000 
    });
  };

  const startNewDebate = (topic: string) => {
    setCurrentView('debate');
    onNewDebateClose();
    toast({
      title: 'Debate Started!',
      description: `Starting debate on "${topic}"`,
      status: 'success',
      duration: 3000
    });
  };

  // Authentication Page Component
  const AuthPageInline = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [isLogin, setIsLogin] = useState(true);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (isLogin) {
        if (!email || !password) {
          toast({ title: 'Please fill in all fields', status: 'error', duration: 3000 });
          return;
        }
        await handleLogin(email, password);
      } else {
        // Client-side validation first
        if (!email || !password || !confirmPassword || !username) {
          toast({ title: 'Please fill in all required fields', status: 'error', duration: 3000 });
          return;
        }
        if (password !== confirmPassword) {
          toast({ title: 'Passwords do not match', status: 'error', duration: 3000 });
          return;
        }
        if (password.length < 8) {
          toast({ title: 'Password must be at least 8 characters long', status: 'error', duration: 3000 });
          return;
        }
        if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
          toast({ 
            title: 'Password requirements not met', 
            description: 'Password must contain uppercase, lowercase, and number', 
            status: 'error', 
            duration: 5000 
          });
          return;
        }
        
        await handleRegister({
          email,
          password,
          confirmPassword,
          username,
          firstName,
          lastName
        });
      }
    };

    return (
      <Box minH="100vh" bg="gray.50" py={12}>
        <Container maxW="md" centerContent>
          <VStack spacing={8} w="full">
            <VStack spacing={4}>
              <Box fontSize="4xl">🏛️</Box>
              <Heading size="xl" color="blue.600" textAlign="center">
                DebateSphere
              </Heading>
              <Text fontSize="lg" color="gray.600" textAlign="center">
                The Ultimate AI-Powered Debate Platform
              </Text>
            </VStack>

            <Card w="full" shadow="lg">
              <CardBody p={8}>
                <VStack spacing={6}>
                  <Heading size="md">
                    {isLogin ? 'Sign In to DebateSphere' : 'Create Your Account'}
                  </Heading>

                  <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <VStack spacing={4}>
                      {!isLogin && (
                        <>
                          <HStack spacing={3} w="full">
                            <FormControl>
                              <FormLabel>First Name</FormLabel>
                              <Input
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                placeholder="First name"
                                size="lg"
                              />
                            </FormControl>
                            <FormControl>
                              <FormLabel>Last Name</FormLabel>
                              <Input
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                placeholder="Last name"
                                size="lg"
                              />
                            </FormControl>
                          </HStack>
                          <FormControl isRequired>
                            <FormLabel>Username</FormLabel>
                            <Input
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              placeholder="Choose a username (3-30 characters)"
                              size="lg"
                            />
                          </FormControl>
                        </>
                      )}

                      <FormControl isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="Enter your email"
                          size="lg"
                        />
                      </FormControl>

                      <FormControl isRequired>
                        <FormLabel>Password</FormLabel>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder={isLogin ? "Enter your password" : "8+ chars with uppercase, lowercase, number"}
                          size="lg"
                        />
                      </FormControl>

                      {!isLogin && (
                        <FormControl isRequired>
                          <FormLabel>Confirm Password</FormLabel>
                          <Input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm your password"
                            size="lg"
                          />
                        </FormControl>
                      )}

                      <Button
                        type="submit"
                        colorScheme="blue"
                        size="lg"
                        w="full"
                        isLoading={authLoading}
                        loadingText={isLogin ? 'Signing In...' : 'Creating Account...'}
                      >
                        {isLogin ? 'Sign In' : 'Create Account'}
                      </Button>

                      <Text textAlign="center" fontSize="sm" color="gray.600">
                        {isLogin ? "Don't have an account? " : "Already have an account? "}
                        <Button
                          variant="link"
                          colorScheme="blue"
                          size="sm"
                          onClick={() => {
                            setIsLogin(!isLogin);
                            // Reset form
                            setEmail('');
                            setPassword('');
                            setConfirmPassword('');
                            setUsername('');
                            setFirstName('');
                            setLastName('');
                          }}
                        >
                          {isLogin ? 'Sign Up' : 'Sign In'}
                        </Button>
                      </Text>
                    </VStack>
                  </form>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </Container>
      </Box>
    );
  };

  // Main Dashboard Component (Prototype Design)
  const DashboardMain = () => {
    return (
      <Flex h="100vh" bg="gray.50">
        {/* Sidebar - Prototype Design */}
        <Box w="300px" bg="gray.900" color="white" p={6}>
          <VStack spacing={6} align="stretch">
            {/* Logo */}
            <HStack spacing={3}>
              <Box fontSize="2xl">🧠</Box>
              <Heading size="md" color="blue.400">DebateSphere</Heading>
            </HStack>

            {/* User Profile */}
            <Box p={4} bg="gray.800" borderRadius="lg">
              <HStack spacing={3}>
                <Avatar size="md" name={userProfile.name} />
                <VStack align="start" spacing={1}>
                  <Text fontWeight="bold">{userProfile.name}</Text>
                  <Badge colorScheme="blue" fontSize="xs">{userProfile.level}</Badge>
                  <HStack spacing={1}>
                    <Text fontSize="xs" color="yellow.400">⚡</Text>
                    <Text fontSize="xs" color="yellow.400">{userProfile.streak} day streak</Text>
                  </HStack>
                </VStack>
              </HStack>
            </Box>

            {/* Navigation */}
            <VStack spacing={2} align="stretch">
              {[
                { label: "Dashboard", view: "dashboard", icon: "🏠" },
                { label: "Debate Arena", view: "debate", icon: "💬" },
                { label: "Argument Mapper", view: "mapper", icon: "🌲" },
                { label: "Analytics", view: "analytics", icon: "📊" },
                { label: "Find Opponents", view: "opponents", icon: "👥" },
                { label: "Learning Center", view: "learning", icon: "📚" },
                { label: "Settings", view: "settings", icon: "⚙️" }
              ].map(({ label, view, icon }) => (
                <Button
                  key={view}
                  variant={currentView === view ? "solid" : "ghost"}
                  colorScheme={currentView === view ? "blue" : undefined}
                  justifyContent="start"
                  leftIcon={<Text>{icon}</Text>}
                  onClick={() => setCurrentView(view)}
                  color={currentView === view ? "white" : "gray.300"}
                  _hover={{ bg: currentView === view ? "blue.600" : "gray.800", color: "white" }}
                >
                  {label}
                </Button>
              ))}
            </VStack>

            {/* Rank Card */}
            <Box p={4} bgGradient="linear(to-r, blue.600, purple.600)" borderRadius="lg">
              <HStack spacing={2} mb={2}>
                <Text fontSize="sm">🏆</Text>
                <Text fontSize="sm" fontWeight="bold">Rank: {userStats.rank}</Text>
              </HStack>
              <Text fontSize="xs" color="blue.100">{userStats.totalPoints} points</Text>
              <Progress value={73} colorScheme="yellow" size="sm" mt={2} />
            </Box>

            {/* Logout Button */}
            <Button variant="ghost" colorScheme="red" onClick={handleLogout}>
              🚪 Logout
            </Button>
          </VStack>
        </Box>

        {/* Main Content */}
        <Box flex={1} overflow="auto" p={6}>
          {currentView === 'dashboard' && (
            <VStack spacing={6} align="stretch">
              {/* Header */}
              <Flex justify="space-between" align="center">
                <VStack align="start" spacing={1}>
                  <Heading size="xl" color="gray.800">Welcome back, {userProfile.name}!</Heading>
                  <Text color="gray.600">Ready to sharpen your critical thinking skills?</Text>
                </VStack>
                <Button
                  bgGradient="linear(to-r, blue.600, purple.600)"
                  color="white"
                  size="lg"
                  leftIcon={<Text>➕</Text>}
                  onClick={onNewDebateOpen}
                  _hover={{ bgGradient: "linear(to-r, blue.700, purple.700)" }}
                >
                  Start New Debate
                </Button>
              </Flex>

              {/* Stats Grid */}
              <Grid templateColumns="repeat(4, 1fr)" gap={6}>
                {[
                  { title: "Debates Completed", value: userStats.debatesCompleted, change: "+3 this week", icon: "💬", color: "blue" },
                  { title: "Win Rate", value: `${userStats.winRate}%`, change: "+5% this month", icon: "🏆", color: "green" },
                  { title: "Argument Strength", value: userStats.argumentStrength, change: "+0.3 this week", icon: "📈", color: "purple" },
                  { title: "Fallacies Avoided", value: userStats.fallaciesDetected, change: "+2 this week", icon: "🎯", color: "orange" }
                ].map((stat, index) => (
                  <Card key={index}>
                    <CardBody>
                      <Flex justify="space-between" align="center" mb={4}>
                        <Box bg={`${stat.color}.100`} p={3} borderRadius="lg">
                          <Text fontSize="xl">{stat.icon}</Text>
                        </Box>
                        <VStack align="end" spacing={0}>
                          <Text fontSize="2xl" fontWeight="bold" color="gray.800">{stat.value}</Text>
                          <Text fontSize="sm" color="gray.600">{stat.title}</Text>
                        </VStack>
                      </Flex>
                      <HStack spacing={1}>
                        <Text fontSize="xs" color="green.500">📈</Text>
                        <Text fontSize="xs" color="green.600" fontWeight="medium">{stat.change}</Text>
                      </HStack>
                    </CardBody>
                  </Card>
                ))}
              </Grid>

              {/* Recent Achievements & Debates */}
              <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                <Card>
                  <CardBody>
                    <HStack spacing={2} mb={4}>
                      <Text fontSize="lg">⭐</Text>
                      <Heading size="md" color="gray.800">Recent Achievements</Heading>
                    </HStack>
                    <VStack spacing={3}>
                      {userStats.badges.map((badge, index) => (
                        <Box key={index} w="full" p={3} bgGradient="linear(to-r, yellow.50, orange.50)" borderRadius="lg" border="1px" borderColor="yellow.200">
                          <HStack spacing={3}>
                            <Text fontSize="lg">🏆</Text>
                            <Text fontWeight="medium" color="gray.800">{badge}</Text>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>

                <Card>
                  <CardBody>
                    <HStack spacing={2} mb={4}>
                      <Text fontSize="lg">💬</Text>
                      <Heading size="md" color="gray.800">Recent Debates</Heading>
                    </HStack>
                    <VStack spacing={3}>
                      {userStats.debateHistory.map((debate, index) => (
                        <Box key={index} w="full" p={3} bg="gray.50" borderRadius="lg" _hover={{ bg: "gray.100" }}>
                          <HStack spacing={3}>
                            <Box p={2} bg="green.100" borderRadius="lg">
                              <Text fontSize="sm">🏆</Text>
                            </Box>
                            <VStack align="start" spacing={1} flex={1}>
                              <Text fontSize="sm" fontWeight="medium" color="gray.800">{debate.topic}</Text>
                              <HStack spacing={4}>
                                <Text fontSize="xs" color="gray.500">{debate.date}</Text>
                                <Badge colorScheme="green" fontSize="xs">{debate.result.toUpperCase()}</Badge>
                                <Text fontSize="xs" color="gray.600">Score: {debate.score}</Text>
                              </HStack>
                            </VStack>
                          </HStack>
                        </Box>
                      ))}
                    </VStack>
                  </CardBody>
                </Card>
              </Grid>
            </VStack>
          )}

          {currentView === 'debate' && (
            <Card h="full">
              <CardBody>
                <VStack spacing={6} h="full">
                  <Heading size="lg" color="gray.800">🏟️ Debate Arena</Heading>
                  <Text color="gray.600">Interactive debate simulation coming soon!</Text>
                  <Button colorScheme="blue" onClick={() => setCurrentView('dashboard')}>
                    Return to Dashboard
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          )}

          {currentView === 'analytics' && (
            <Card h="full">
              <CardBody>
                <VStack spacing={6} h="full">
                  <Heading size="lg" color="gray.800">📊 Analytics Dashboard</Heading>
                  <Text color="gray.600">Detailed performance analytics coming soon!</Text>
                  <Button colorScheme="purple" onClick={() => setCurrentView('dashboard')}>
                    Return to Dashboard
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Add other views as needed */}
          {!['dashboard', 'debate', 'analytics'].includes(currentView) && (
            <Card h="full">
              <CardBody>
                <VStack spacing={6} h="full">
                  <Heading size="lg" color="gray.800">🚧 Coming Soon</Heading>
                  <Text color="gray.600">This feature is under development!</Text>
                  <Button colorScheme="blue" onClick={() => setCurrentView('dashboard')}>
                    Return to Dashboard
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          )}
        </Box>

        {/* New Debate Modal */}
        <Modal isOpen={isNewDebateOpen} onClose={onNewDebateClose} size="lg">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Start New Debate</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Select Topic</FormLabel>
                  <Select placeholder="Choose a debate topic">
                    {debateTopics.map((topic, index) => (
                      <option key={index} value={topic}>{topic}</option>
                    ))}
                  </Select>
                </FormControl>
                
                <FormControl>
                  <FormLabel>Opponent Type</FormLabel>
                  <Select defaultValue="ai">
                    <option value="ai">AI Opponent</option>
                    <option value="human">Human Opponent</option>
                  </Select>
                </FormControl>
                
                <HStack spacing={3} pt={4} w="full">
                  <Button 
                    colorScheme="blue" 
                    flex={1} 
                    onClick={() => startNewDebate(debateTopics[0])}
                  >
                    Start Debate
                  </Button>
                  <Button variant="ghost" onClick={onNewDebateClose}>
                    Cancel
                  </Button>
                </HStack>
              </VStack>
            </ModalBody>
          </ModalContent>
        </Modal>
      </Flex>
    );
  };

  // Show loading spinner while checking authentication
  if (isInitializing) {
    return (
      <ChakraProvider>
        <Box 
          height="100vh" 
          display="flex" 
          alignItems="center" 
          justifyContent="center"
          bg="gray.50"
        >
          <VStack spacing={4}>
            <Box fontSize="4xl">🏛️</Box>
            <Text>Loading DebateSphere...</Text>
          </VStack>
        </Box>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider>
      {isAuthenticated ? (
        <DashboardMain />
      ) : (
        <AuthPageInline />
      )}
    </ChakraProvider>
  );
};

export default App;
