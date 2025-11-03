import React, { useState, useEffect, useRef } from 'react';
import {
  ChakraProvider,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  useToast,
  Container,
  Heading,
  Card,
  CardBody,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  FormControl,
  FormLabel,
  Box,
  Flex,
  Badge,
  IconButton,
  Divider,
  Avatar,
  Grid,
  GridItem,
  Textarea,
  RadioGroup,
  Radio,
  CircularProgress, 
  CircularProgressLabel,
  Spinner, 
  SimpleGrid 
} from '@chakra-ui/react';
import { io, Socket } from 'socket.io-client';
import { 
  MessageCircle, Brain, BarChart3, Users, Home, Send, Bot, User, Award, 
  TrendingUp, Target, Star, Trophy, BookOpen, Settings, Menu, X, Plus,
  Timer, Volume2, VolumeX, Zap, ThumbsUp, ThumbsDown, ArrowLeft, Play, 
  RefreshCw, Mic, MicOff, CheckCircle, AlertTriangle, TrendingDown, Pause, Square
} from 'lucide-react';
// Add these to your existing imports at the top
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,

} from 'recharts';
import LearningCenter from './LearningCenter.tsx';
import { ttsManager } from './ttsManager.ts';


interface Message {
  id: string;
  username: string;
  text: string;
  timestamp: Date;
  stance: 'pro' | 'con';
}

interface Participant {
  id: string;
  username: string;
  stance: 'pro' | 'con';
  isTyping: boolean;
}

interface AppUser {
  id: string;
  username: string;
  email: string;
}

// Simple inline AuthPage component
const AuthPage: React.FC<{ onLogin: (email: string, password: string) => Promise<void>; onRegister: (userData: any) => Promise<void>; isLoading: boolean }> = ({ onLogin, onRegister, isLoading }) => {
  const [tabIndex, setTabIndex] = useState(0);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [registerData, setRegisterData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loginEmail && loginPassword) {
      await onLogin(loginEmail, loginPassword);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (registerData.username && registerData.email && registerData.password && registerData.password === registerData.confirmPassword) {
      await onRegister(registerData);
    }
  };

  return (
    <Container maxW="md" centerContent py={10}>
      <Card width="100%">
        <CardBody>
          <VStack spacing={6}>
            <VStack spacing={2}>
              <Heading size="xl" color="blue.600">DebateSphere</Heading>
              <Text color="gray.600">AI-Powered Critical Thinking Platform</Text>
            </VStack>

            <Tabs index={tabIndex} onChange={setTabIndex} variant="enclosed" width="100%">
              <TabList>
                <Tab>Login</Tab>
                <Tab>Register</Tab>
              </TabList>
              
              <TabPanels>
                <TabPanel>
                  <form onSubmit={handleLoginSubmit}>
                    <VStack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input
                          type="email"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          placeholder="Enter your email"
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Password</FormLabel>
                        <Input
                          type="password"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          placeholder="Enter your password"
                        />
                      </FormControl>
                      
                      <Button
                        type="submit"
                        colorScheme="blue"
                        size="lg"
                        width="100%"
                        isLoading={isLoading}
                      >
                        Sign In
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>
                
                <TabPanel>
                  <form onSubmit={handleRegisterSubmit}>
                    <VStack spacing={4}>
                      <FormControl isRequired>
                        <FormLabel>Username</FormLabel>
                        <Input
                          value={registerData.username}
                          onChange={(e) => setRegisterData({...registerData, username: e.target.value})}
                          placeholder="Choose a username"
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input
                          type="email"
                          value={registerData.email}
                          onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                          placeholder="Enter your email"
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Password</FormLabel>
                        <Input
                          type="password"
                          value={registerData.password}
                          onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                          placeholder="Create a password"
                        />
                      </FormControl>
                      
                      <FormControl isRequired>
                        <FormLabel>Confirm Password</FormLabel>
                        <Input
                          type="password"
                          value={registerData.confirmPassword}
                          onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                          placeholder="Confirm your password"
                        />
                      </FormControl>
                      
                      <Button
                        type="submit"
                        colorScheme="blue"
                        size="lg"
                        width="100%"
                        isLoading={isLoading}
                      >
                        Create Account
                      </Button>
                    </VStack>
                  </form>
                </TabPanel>
              </TabPanels>
            </Tabs>
          </VStack>
        </CardBody>
      </Card>
    </Container>
  );
};

// Enhanced DebateSphere App with Prototype UI
const App: React.FC = () => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const toast = useToast();
  const aiCoachRef = useRef<{ refresh: () => void }>(null);
  // Add after existing state declarations
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsChartView, setAnalyticsChartView] = useState<'scores' | 'fallacies' | 'speech'>('scores');



  // Mock user stats for the enhanced UI
  const userStats = {
    debatesCompleted: 12,
    winRate: 75,
    argumentStrength: 8.2,
    fallaciesDetected: 15,
    totalPoints: 1847,
    rank: 'Gold',
    badges: ['Logical Thinker', 'Evidence Master', 'Debate Champion'],
    debateHistory: [
      { date: '2025-09-20', topic: 'AI in Education', result: 'won', score: 8.5 },
      { date: '2025-09-19', topic: 'Climate Policy', result: 'won', score: 7.8 }
    ]
  };

  // Check for existing session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('debatesphere_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('debatesphere_user');
      }
    }
  }, []);

  const [cachedTopics, setCachedTopics] = useState<string[]>([]);
  const [topicsLoaded, setTopicsLoaded] = useState(false);

  const [debateState, setDebateState] = useState<{
    stance: 'pro' | 'con';
    isJoined: boolean;
    messages: Message[];
    debateActive: boolean;
    debateTimer: number;
    debateTopic: string;
    debateId: string;
    currentMessage: string;
    showTopicSelection: boolean;
    customTopic: string;
    audioRecordings: Array<{
      blob: Blob;
      timestamp: Date;
      duration: number;
    }>;  // 🔥 NEW FIELD
  }>({
    stance: 'pro',
    isJoined: false,
    messages: [],
    debateActive: false,
    debateTimer: 0,
    debateTopic: '',
    debateId: '',
    currentMessage: '',
    showTopicSelection: true,
    customTopic: '',
    audioRecordings: []  // 🔥 NEW FIELD
  });
  


  // Prefetch topics on app load (after successful login)
  useEffect(() => {
    if (user && !topicsLoaded) {
      prefetchDebateTopics();
    }
  }, [user, topicsLoaded]);

  // Auto-refresh AI Coach when switching to it
  useEffect(() => {
    if (currentView === 'ai-coach' && aiCoachRef.current) {
      console.log('🔄 Switched to AI Coach - refreshing analyses...');
      aiCoachRef.current.refresh();
    }
  }, [currentView]);

  const prefetchDebateTopics = async () => {
    console.log('🎲 Prefetching debate topics...');
    
    try {
      const token = localStorage.getItem('token') || 'demo-token';
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/debate-ai/topics?count=6`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Topics prefetched:', data.topics);
        setCachedTopics(data.topics);
        setTopicsLoaded(true);
      }
    } catch (error: any) {
      console.error('❌ Error prefetching topics:', error);
      // Set fallback topics
      setCachedTopics([
        "AI in Education",
        "Social Media Impact on Youth",
        "Electric Vehicles vs Gasoline Cars",
        "Universal Basic Income",
        "Remote Work vs Office Work",
        "Space Exploration Funding"
      ]);
      setTopicsLoaded(true);
    }
  };

  const handleLogin = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/login`;
      console.log(`[APP.TSX - LOGIN] Attempting to POST to: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed due to an unknown error.');
      }

      // IMPORTANT: Use the user data and token from the REAL backend response
      setUser(data.data.user);
      localStorage.setItem('token', data.token); // Store the JWT token
      localStorage.setItem('debatesphere_user', JSON.stringify(data.data.user)); // Store user info

      toast({
        title: 'Login Successful',
        description: `Welcome back, ${data.data.user.username}!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (error: any) {
      console.error('[APP.TSX - LOGIN] Fetch failed. Error:', error);
      toast({
        title: 'Login Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (userData: any) => {
    setIsLoading(true);
    try {
      const apiUrl = `${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/register`;
      console.log(`[APP.TSX - REGISTER] Attempting to POST to: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.errors ? data.errors.join(', ') : data.message;
        throw new Error(errorMessage || 'Registration failed due to an unknown error.');
      }
      
      // Use the real user data and token from the backend
      setUser(data.data.user);
      localStorage.setItem('token', data.token);
      localStorage.setItem('debatesphere_user', JSON.stringify(data.data.user));

      toast({
        title: 'Registration Successful',
        description: `Welcome to DebateSphere, ${data.data.user.username}!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

    } catch (error: any) {
      console.error('[APP.TSX - REGISTER] Fetch failed. Error:', error);
      toast({
        title: 'Registration Failed',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('debatesphere_user');
    setCurrentView('dashboard');
    toast({
      title: 'Logged Out',
      description: 'You have been successfully logged out.',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });
  };

  // If user is not logged in, show authentication page
  if (!user) {
    return (
      <ChakraProvider>
        <AuthPage 
          onLogin={handleLogin}
          onRegister={handleRegister}
          isLoading={isLoading}
        />
      </ChakraProvider>
    );
  }

  // Enhanced UI with sidebar and multiple views
  return (
    <ChakraProvider>
      <Flex height="100vh" bg="gray.50">
        {/* Enhanced Sidebar */}
        <Box
          width="280px"
          bg="gray.900"
          color="white"
          position={{ base: sidebarOpen ? "fixed" : "fixed", lg: "static" }}
          left={{ base: sidebarOpen ? "0" : "-280px", lg: "0" }}
          top="0"
          bottom="0"
          zIndex="50"
          transition="all 0.3s"
          boxShadow="xl"
        >
          <Flex align="center" justify="space-between" p={4} borderBottom="1px" borderColor="gray.700">
            <HStack spacing={2}>
              <Brain size={24} color="#60A5FA" />
              <Heading size="md" fontWeight="bold">DebateSphere</Heading>
            </HStack>
            <IconButton
              aria-label="Close sidebar"
              icon={<X size={20} />}
              display={{ base: "block", lg: "none" }}
              variant="ghost"
              color="white"
              onClick={() => setSidebarOpen(false)}
            />
          </Flex>
          
          <Box p={4}>
            {/* User Profile Card */}
            <Flex align="center" gap={3} mb={4} p={3} bg="gray.800" borderRadius="lg">
              <Text fontSize="2xl">👨‍💼</Text>
              <Box>
                <Text fontWeight="medium">{user.username}</Text>
                <Text fontSize="xs" color="gray.400">Advanced Debater</Text>
                <HStack gap={1} mt={1}>
                  <Zap size={12} color="#FCD34D" />
                  <Text fontSize="xs" color="yellow.400">5 day streak</Text>
                </HStack>
              </Box>
            </Flex>
            
            {/* Navigation Menu */}
            <VStack spacing={2} align="stretch">
              {[
                { icon: Home, label: "Dashboard", view: "dashboard" },
                { icon: MessageCircle, label: "Debate Arena", view: "debate" },
                { icon: Brain, label: "AI Coach", view: "ai-coach" },
                { icon: BarChart3, label: "Analytics", view: "analytics" },
                { icon: BookOpen, label: "Learning Center", view: "learning" },
                // { icon: Settings, label: "Settings", view: "settings" }
              ].map(({ icon: Icon, label, view }) => (
                <Button
                  key={view}
                  onClick={() => setCurrentView(view)}
                  variant={currentView === view ? "solid" : "ghost"}
                  colorScheme={currentView === view ? "blue" : "gray"}
                  color={currentView === view ? "white" : "gray.300"}
                  justifyContent="flex-start"
                  leftIcon={<Icon size={20} />}
                  _hover={{ bg: currentView === view ? "blue.600" : "gray.800", color: "white" }}
                >
                  {label}
                </Button>
              ))}
            </VStack>
            
            {/* Rank Display */}
            <Box mt={6} p={3} bgGradient="linear(to-r, blue.600, purple.600)" borderRadius="lg">
              <HStack gap={2} mb={2}>
                <Trophy size={16} color="#FCD34D" />
                <Text fontSize="sm" fontWeight="medium">Rank: {userStats.rank}</Text>
              </HStack>
              <Text fontSize="xs" color="blue.100">{userStats.totalPoints} points</Text>
              <Box w="full" bg="whiteAlpha.300" borderRadius="full" h={1} mt={2}>
                <Box bg="yellow.300" h={1} borderRadius="full" width="73%" />
              </Box>
            </Box>

            {/* Logout Button */}
            <Box mt={6}>
              <Button
                onClick={handleLogout}
                variant="ghost"
                color="gray.300"
                justifyContent="flex-start"
                leftIcon={<Settings size={20} />}
                _hover={{ bg: "red.600", color: "white" }}
                width="full"
              >
                Logout
              </Button>
            </Box>
          </Box>
        </Box>
        
        {/* Main Content Area */}
        <Flex flexDirection="column" flex={1} overflow="hidden">
          {/* Mobile Header */}
          <Flex
            bg="white"
            borderBottom="1px"
            borderColor="gray.200"
            px={4}
            py={3}
            align="center"
            justify="space-between"
            display={{ base: "flex", lg: "none" }}
          >
            <IconButton
              aria-label="Open sidebar"
              icon={<Menu size={24} />}
              variant="ghost"
              onClick={() => setSidebarOpen(true)}
            />
            <Heading size="md" color="gray.800">DebateSphere</Heading>
            <Box width={6} />
          </Flex>
          
          {/* Main Content */}
          <Box display={currentView === 'dashboard' ? 'block' : 'none'}>
  <DashboardView
    user={user}
    userStats={userStats}
    setCurrentView={setCurrentView}
  />
</Box>

<Box display={currentView === 'debate' ? 'block' : 'none'}>
  <DebateArenaView
    user={user!}
    cachedTopics={cachedTopics}
    setCachedTopics={setCachedTopics}
    topicsLoaded={topicsLoaded}
    debateState={debateState}
    setDebateState={setDebateState}
  />
</Box>

{/* Analytics View */}
<Box display={currentView === 'analytics' ? 'block' : 'none'}>
  <AnalyticsView user={user!} />
</Box>



<Box display={currentView === 'learning' ? 'block' : 'none'}>
{currentView === 'learning' && <LearningCenter />}
</Box>


<Box display={currentView === 'ai-coach' ? 'block' : 'none'}>
  <AICoachView user={user} ref={aiCoachRef} />
</Box>
        </Flex>
      </Flex>
    </ChakraProvider>
  );
};

// ===== ENHANCED DASHBOARD VIEW (FIXED) =====
const DashboardView: React.FC<{ user: AppUser; userStats: any; setCurrentView: (view: string) => void }> = ({ user, userStats, setCurrentView }) => {
  
  // Get current time for personalized greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return { text: 'Good morning', emoji: '☀️' };
    if (hour < 18) return { text: 'Good afternoon', emoji: '🌤️' };
    return { text: 'Good evening', emoji: '🌙' };
  };

  const greeting = getGreeting();

  return (
    <Box bg="gray.50" minH="100vh">
      <VStack spacing={8} align="stretch" p={8} maxW="1400px" mx="auto">
        
        {/* Hero Section with Gradient Background */}
        <Box
          bgGradient="linear(135deg, blue.600 0%, purple.600 50%, pink.500 100%)"
          borderRadius="2xl"
          p={8}
          color="white"
          boxShadow="2xl"
          position="relative"
          overflow="hidden"
        >
          {/* Decorative Background Elements */}
          <Box
            position="absolute"
            top="-50px"
            right="-50px"
            w="200px"
            h="200px"
            bg="whiteAlpha.100"
            borderRadius="full"
            filter="blur(40px)"
          />
          <Box
            position="absolute"
            bottom="-30px"
            left="-30px"
            w="150px"
            h="150px"
            bg="whiteAlpha.100"
            borderRadius="full"
            filter="blur(40px)"
          />

          <Flex align="center" justify="space-between" position="relative" zIndex={1}>
            <VStack align="start" spacing={2}>
              <HStack spacing={2}>
                <Text fontSize="2xl">{greeting.emoji}</Text>
                <Heading size="xl" fontWeight="bold">
                  {greeting.text}, {user.username}!
                </Heading>
              </HStack>
              <Text fontSize="lg" opacity={0.9}>
                Ready to sharpen your critical thinking skills?
              </Text>
              <HStack spacing={4} mt={2}>
                <Badge colorScheme="green" fontSize="sm" px={3} py={1} borderRadius="full">
                  🔥 5-day streak
                </Badge>
                <Badge colorScheme="yellow" fontSize="sm" px={3} py={1} borderRadius="full">
                  ⭐ Level {Math.floor(userStats.debatesCompleted / 10) + 1}
                </Badge>
              </HStack>
            </VStack>
            
            <Button 
              onClick={() => setCurrentView('debate')}
              bg="white"
              color="purple.600"
              px={8}
              py={6}
              fontSize="lg"
              borderRadius="xl"
              _hover={{ transform: 'translateY(-2px)', boxShadow: '2xl' }}
              transition="all 0.2s"
              boxShadow="xl"
              leftIcon={<Plus size={24} />}
            >
              Start New Debate
            </Button>
          </Flex>
        </Box>

        {/* Quick Stats Grid */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={6}>
          {[
            { 
              icon: MessageCircle, 
              title: "Total Debates", 
              value: userStats.debatesCompleted, 
              change: "+3 this week", 
              color: "blue",
              bgGradient: "linear(to-br, blue.400, blue.600)"
            },
            { 
              icon: Award, 
              title: "Win Rate", 
              value: `${userStats.winRate}%`, 
              change: "+5% this month", 
              color: "green",
              bgGradient: "linear(to-br, green.400, green.600)"
            },
            { 
              icon: TrendingUp, 
              title: "Avg Score", 
              value: userStats.argumentStrength, 
              change: "+0.3 this week", 
              color: "purple",
              bgGradient: "linear(to-br, purple.400, purple.600)"
            },
            { 
              icon: Target, 
              title: "Fallacy-Free", 
              value: `${userStats.fallaciesDetected}%`, 
              change: "+12% improvement", 
              color: "orange",
              bgGradient: "linear(to-br, orange.400, orange.600)"
            }
          ].map(({ icon: Icon, title, value, change, color, bgGradient }, index) => (
            <Card 
              key={index} 
              bg="white" 
              borderRadius="2xl" 
              overflow="hidden"
              boxShadow="lg" 
              border="1px" 
              borderColor="gray.100"
              _hover={{ transform: 'translateY(-4px)', boxShadow: '2xl' }}
              transition="all 0.3s"
            >
              <CardBody p={6}>
                <VStack align="stretch" spacing={4}>
                  <Flex align="center" justify="space-between">
                    <Box 
                      bgGradient={bgGradient}
                      p={3} 
                      borderRadius="xl"
                      color="white"
                    >
                      <Icon size={24} />
                    </Box>
                    <VStack align="end" spacing={0}>
                      <Text fontSize="3xl" fontWeight="bold" color="gray.800">
                        {value}
                      </Text>
                    </VStack>
                  </Flex>
                  <Box>
                    <Text fontSize="sm" color="gray.600" fontWeight="medium">
                      {title}
                    </Text>
                    <HStack spacing={1} mt={1}>
                      <TrendingUp size={14} color="#10B981" />
                      <Text fontSize="xs" color="green.600" fontWeight="semibold">
                        {change}
                      </Text>
                    </HStack>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </Grid>

        {/* Quick Actions */}
        <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={6}>
          {[
            {
              icon: Brain,
              title: "AI Coach",
              description: "Get personalized feedback",
              color: "purple",
              bgGradient: "linear(to-br, purple.50, purple.100)",
              view: 'ai-coach'
            },
            {
              icon: BarChart3,
              title: "Analytics",
              description: "Track your progress",
              color: "blue",
              bgGradient: "linear(to-br, blue.50, blue.100)",
              view: 'analytics'
            },
            {
              icon: BookOpen,
              title: "Learning Center",
              description: "Improve your skills",
              color: "green",
              bgGradient: "linear(to-br, green.50, green.100)",
              view: 'learning'
            }
          ].map((item, index) => (
            <Card
              key={index}
              bg={item.bgGradient}
              borderRadius="2xl"
              p={6}
              cursor="pointer"
              onClick={() => setCurrentView(item.view)}
              _hover={{ transform: 'translateY(-4px)', boxShadow: 'xl' }}
              transition="all 0.3s"
              border="1px"
              borderColor={`${item.color}.200`}
            >
              <CardBody>
                <VStack align="start" spacing={3}>
                  <Box 
                    bg={`${item.color}.500`}
                    p={3} 
                    borderRadius="xl"
                    color="white"
                  >
                    <item.icon size={28} />
                  </Box>
                  <Box>
                    <Heading size="md" color="gray.800">
                      {item.title}
                    </Heading>
                    <Text fontSize="sm" color="gray.600" mt={1}>
                      {item.description}
                    </Text>
                  </Box>
                  <Button
                    size="sm"
                    colorScheme={item.color}
                    variant="ghost"
                    rightIcon={<ArrowLeft size={16} style={{ transform: 'rotate(180deg)' }} />}
                    mt={2}
                  >
                    View
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </Grid>

        {/* Main Content Grid */}
        <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6}>
          
          {/* Recent Achievements */}
          <Card 
            bg="white" 
            borderRadius="2xl" 
            boxShadow="lg" 
            border="1px" 
            borderColor="gray.100"
          >
            <CardBody p={6}>
              <HStack spacing={3} mb={6}>
                <Box bg="yellow.100" p={2} borderRadius="lg">
                  <Trophy size={24} color="#D97706" />
                </Box>
                <Heading size="md" color="gray.800">Recent Achievements</Heading>
              </HStack>
              <VStack spacing={4} align="stretch">
                {userStats.badges.map((badge: string, index: number) => (
                  <Flex 
                    key={index} 
                    align="center" 
                    gap={4} 
                    p={4}
                    bgGradient="linear(to-r, yellow.50, orange.50)" 
                    borderRadius="xl" 
                    border="2px" 
                    borderColor="yellow.200"
                    _hover={{ transform: 'scale(1.02)', borderColor: 'yellow.300' }}
                    transition="all 0.2s"
                  >
                    <Box bg="yellow.400" p={2} borderRadius="lg">
                      <Star size={20} color="white" />
                    </Box>
                    <Box flex={1}>
                      <Text fontWeight="bold" color="gray.800" fontSize="md">
                        {badge}
                      </Text>
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        Earned recently
                      </Text>
                    </Box>
                    <Badge colorScheme="yellow" fontSize="xs" px={2} py={1}>
                      NEW
                    </Badge>
                  </Flex>
                ))}
                {userStats.badges.length === 0 && (
                  <Box textAlign="center" py={8}>
                    <Text color="gray.400" fontSize="sm">
                      Complete debates to earn achievements!
                    </Text>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Recent Debates */}
          <Card 
            bg="white" 
            borderRadius="2xl" 
            boxShadow="lg" 
            border="1px" 
            borderColor="gray.100"
          >
            <CardBody p={6}>
              <HStack spacing={3} mb={6} justify="space-between">
                <HStack spacing={3}>
                  <Box bg="blue.100" p={2} borderRadius="lg">
                    <MessageCircle size={24} color="#3B82F6" />
                  </Box>
                  <Heading size="md" color="gray.800">Recent Debates</Heading>
                </HStack>
                <Button size="sm" variant="ghost" colorScheme="blue">
                  View All
                </Button>
              </HStack>
              <VStack spacing={4} align="stretch">
                {userStats.debateHistory.slice(0, 4).map((debate: any, index: number) => (
                  <Flex 
                    key={index} 
                    align="center" 
                    gap={4} 
                    p={4}
                    bg="gray.50" 
                    borderRadius="xl"
                    border="1px"
                    borderColor="gray.200"
                    _hover={{ bg: 'blue.50', borderColor: 'blue.300', cursor: 'pointer' }}
                    transition="all 0.2s"
                    onClick={() => setCurrentView('coach')}
                  >
                    <Box 
                      p={3} 
                      borderRadius="lg" 
                      bg={debate.result === 'won' ? 'green.100' : 'orange.100'}
                    >
                      {debate.result === 'won' ? (
                        <CheckCircle size={20} color="#059669" />
                      ) : (
                        <Target size={20} color="#EA580C" />
                      )}
                    </Box>
                    <Box flex={1}>
                      <Text fontSize="sm" fontWeight="bold" color="gray.800" noOfLines={1}>
                        {debate.topic}
                      </Text>
                      <HStack spacing={3} mt={2}>
                        <Text fontSize="xs" color="gray.500">
                          {debate.date}
                        </Text>
                        <Badge 
                          colorScheme={debate.result === 'won' ? 'green' : 'orange'} 
                          fontSize="xs"
                        >
                          {debate.result.toUpperCase()}
                        </Badge>
                        <HStack spacing={1}>
                          <Star size={12} color="#F59E0B" fill="#F59E0B" />
                          <Text fontSize="xs" color="gray.600" fontWeight="bold">
                            {debate.score}/100
                          </Text>
                        </HStack>
                      </HStack>
                    </Box>
                    <ArrowLeft 
                      size={16} 
                      color="#9CA3AF" 
                      style={{ transform: 'rotate(180deg)' }}
                    />
                  </Flex>
                ))}
                {userStats.debateHistory.length === 0 && (
                  <Box textAlign="center" py={8}>
                    <Text color="gray.400" fontSize="sm">
                      No debates yet. Start your first debate!
                    </Text>
                    <Button 
                      size="sm" 
                      colorScheme="blue" 
                      mt={4}
                      onClick={() => setCurrentView('debate')}
                    >
                      Start Debate
                    </Button>
                  </Box>
                )}
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        {/* Personalized Recommendations */}
        <Card 
          bg="white" 
          borderRadius="2xl" 
          boxShadow="lg" 
          border="1px" 
          borderColor="gray.100"
          mt={4}
          mb={12}
        >
          <CardBody p={6}>
            <HStack spacing={3} mb={6}>
              <Box bg="purple.100" p={2} borderRadius="lg">
                <Zap size={24} color="#7C3AED" />
              </Box>
              <Heading size="md" color="gray.800">Recommended for You</Heading>
            </HStack>
            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap={4}>
              {[
                {
                  icon: Target,
                  title: "Practice Rebuttals",
                  description: "Strengthen your counter-arguments",
                  color: "blue",
                  view: 'learning'
                },
                {
                  icon: BookOpen,
                  title: "Logical Fallacies",
                  description: "Avoid common reasoning errors",
                  color: "orange",
                  view: 'learning'
                },
                {
                  icon: TrendingUp,
                  title: "Improve Fluency",
                  description: "Reduce filler words and pauses",
                  color: "green",
                  view: 'learning'
                }
              ].map((item, index) => (
                <Box
                  key={index}
                  p={5}
                  bg={`${item.color}.50`}
                  borderRadius="xl"
                  border="2px"
                  borderColor={`${item.color}.200`}
                  cursor="pointer"
                  onClick={() => setCurrentView(item.view)}
                  _hover={{ transform: 'translateY(-2px)', borderColor: `${item.color}.400` }}
                  transition="all 0.2s"
                >
                  <VStack align="start" spacing={3}>
                    <item.icon size={24} color={item.color === 'blue' ? '#3B82F6' : item.color === 'orange' ? '#EA580C' : '#059669'} />
                    <Box>
                      <Text fontWeight="bold" color="gray.800" fontSize="sm">
                        {item.title}
                      </Text>
                      <Text fontSize="xs" color="gray.600" mt={1}>
                        {item.description}
                      </Text>
                    </Box>
                    <Button size="xs" colorScheme={item.color} variant="ghost">
                      Start →
                    </Button>
                  </VStack>
                </Box>
              ))}
            </Grid>
          </CardBody>
        </Card>

      </VStack>
    </Box>
  );
};


const DebateArenaView: React.FC<{ 
  user: AppUser;
  cachedTopics: string[];
  setCachedTopics: (topics: string[]) => void;
  topicsLoaded: boolean;
  debateState: any;
  setDebateState: (state: any) => void;
}> = ({ user, cachedTopics, setCachedTopics, topicsLoaded, debateState, setDebateState }) => {
  
  // Extract state values from debateState
  const stance = debateState.stance;
  const isJoined = debateState.isJoined;
  const messages = debateState.messages;
  const debateActive = debateState.debateActive;
  const debateTimer = debateState.debateTimer;
  const debateTopic = debateState.debateTopic;
  const debateId = debateState.debateId;
  const currentMessage = debateState.currentMessage;
  const showTopicSelection = debateState.showTopicSelection;
  const customTopic = debateState.customTopic;
  const audioRecordings = debateState.audioRecordings || [];
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isAIPaused, setIsAIPaused] = useState(false);  // NEW
  const [currentSpeakingMessageId, setCurrentSpeakingMessageId] = useState<string | null>(null);

  // Setter functions that update debateState - USE FUNCTIONAL UPDATES
  const setStance = (value: 'pro' | 'con') => 
    setDebateState((prev) => ({ ...prev, stance: value }));

  const setIsJoined = (value: boolean) => 
    setDebateState((prev) => ({ ...prev, isJoined: value }));

  const setMessages = (value: Message[] | ((prev: Message[]) => Message[])) => {
    setDebateState((prevState) => ({
      ...prevState,
      messages: typeof value === 'function' ? value(prevState.messages) : value
    }));
  };

  const setDebateActive = (value: boolean) => 
    setDebateState((prev) => ({ ...prev, debateActive: value }));

  const setDebateTimer = (value: number | ((prev: number) => number)) => {
    setDebateState((prevState) => ({
      ...prevState,
      debateTimer: typeof value === 'function' ? value(prevState.debateTimer) : value
    }));
  };

  const setDebateTopic = (value: string) => 
    setDebateState((prev) => ({ ...prev, debateTopic: value }));

  const setDebateId = (value: string) => 
    setDebateState((prev) => ({ ...prev, debateId: value }));

  const setCurrentMessage = (value: string | ((prev: string) => string)) => {
    setDebateState((prevState) => ({
      ...prevState,
      currentMessage: typeof value === 'function' ? value(prevState.currentMessage) : value
    }));
  };

  const setShowTopicSelection = (value: boolean) => 
    setDebateState((prev) => ({ ...prev, showTopicSelection: value }));

  const setCustomTopic = (value: string) => 
    setDebateState((prev) => ({ ...prev, customTopic: value }));

  const setAudioRecordings = (value: any[] | ((prev: any[]) => any[])) => {
    setDebateState((prevState) => ({
      ...prevState,
      audioRecordings: typeof value === 'function' ? value(prevState.audioRecordings || []) : value
    }));
  };

  // Local state for non-critical UI elements (don't need to persist)
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [refreshingTopics, setRefreshingTopics] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [transcribing, setTranscribing] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  useEffect(() => {
    if (debateActive) {
      const interval = setInterval(() => setDebateTimer(prev => prev + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [debateActive]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchDebateTopics = async () => {
    console.log('🔄 Refreshing debate topics...');
    setRefreshingTopics(true);
    
    try {
      const token = localStorage.getItem('token') || 'demo-token';
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/debate-ai/topics?count=6`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ New topics loaded:', data.topics);
        setCachedTopics(data.topics);
        toast({
          title: 'Topics Refreshed!',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      console.error('❌ Error fetching topics:', error);
      toast({
        title: 'Error',
        description: 'Failed to refresh topics',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setRefreshingTopics(false);
    }
  };

  const selectTopic = (topic: string) => {
    console.log('📝 Topic selected:', topic);
    
    if (!topic || topic.trim() === '') {
      console.error('❌ Empty topic provided!');
      toast({
        title: 'Error',
        description: 'Please select a valid topic',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setDebateState({
      ...debateState,
      debateTopic: topic,
      showTopicSelection: false
    });
    
    console.log('✅ Topic set to:', topic);
  };

  const handleCustomTopic = () => {
    if (!customTopic.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter a topic',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setDebateState({
      ...debateState,
      debateTopic: customTopic.trim(),
      showTopicSelection: false,
      customTopic: ''
    });
  };

  const joinChat = async () => {
    console.log('🎯 Starting debate with AI...');
    console.log('   Topic:', debateTopic);
    console.log('   Stance:', stance);
    
    if (!debateTopic || debateTopic.trim() === '') {
      console.error('❌ Cannot start debate - no topic selected!');
      toast({
        title: 'Error',
        description: 'Please select a debate topic first',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      setDebateState({
        ...debateState,
        showTopicSelection: true
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const newDebateId = `ai-debate-${Date.now()}`;
      const token = localStorage.getItem('token') || 'demo-token';
  
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/debate-ai/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          debateId: newDebateId,
          topic: debateTopic,
          userPosition: stance
        })
      });
  
      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Debate started successfully!', data);
        
        const aiMessage: Message = {
          id: Date.now().toString(),
          username: 'AI',
          text: data.message,
          timestamp: new Date(),
          stance: stance === 'pro' ? 'con' : 'pro'
        };
        
        setDebateState({
          ...debateState,
          debateId: newDebateId,
          messages: [aiMessage],
          isJoined: true,
          debateActive: true,
          debateTimer: 0
        });
  
        toast({
          title: 'Debate Started!',
          description: `Debating "${debateTopic}" - You're ${stance.toUpperCase()}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        throw new Error(data.message || 'Failed to start debate');
      }
    } catch (error: any) {
      console.error('❌ Error starting debate:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to start debate with AI',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !debateId) return;
    
    console.log('💬 Sending message to AI...');
    
    const userMessage: Message = {
      id: Date.now().toString(),
      username: user.username,
      text: currentMessage.trim(),
      timestamp: new Date(),
      stance: stance
    };
    
    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setAiTyping(true);

    try {
      const token = localStorage.getItem('token') || 'demo-token';

      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/debate-ai/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          debateId: debateId,
          message: currentMessage.trim()
        })
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ AI response received!', data);
        const aiMessageId = (Date.now() + 1).toString();
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          username: 'AI',
          text: data.response,
          timestamp: new Date(),
          stance: stance === 'pro' ? 'con' : 'pro'
        };
        
        setMessages(prev => [...prev, aiMessage]);
        // ✅ AUTO-SPEAK AI RESPONSE
        if (ttsManager.isSupported()) {
          speakAIMessage(aiMessageId, data.response);
        }

      } else {
        throw new Error(data.message || 'Failed to get AI response');
      }
    } catch (error: any) {
      console.error('❌ Error getting AI response:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to get AI response',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setAiTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // WHISPER SPEECH-TO-TEXT FUNCTIONS
  const startRecording = async () => {
    console.log('🎤 [STT] ========== STARTING RECORDING ==========');
    console.log('   Time:', new Date().toISOString());
    stopAISpeech();
    try {
      console.log('🎤 [STT] Requesting microphone permission...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      
      console.log('✅ [STT] Microphone permission granted');
      console.log('   Stream tracks:', stream.getTracks().length);
      
      const recorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm'
      });
      
      console.log('✅ [STT] MediaRecorder created');
      console.log('   Mime type:', recorder.mimeType);
      console.log('   State:', recorder.state);
      
      const chunks: Blob[] = [];
      
      recorder.ondataavailable = (event) => {
        console.log('🎤 [STT] Data available event:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = async () => {
        console.log('🎤 [STT] Recording stopped');
        console.log('   Total chunks:', chunks.length);
        console.log('   Total size:', chunks.reduce((acc, chunk) => acc + chunk.size, 0), 'bytes');
        
        if (chunks.length > 0) {
          await transcribeAudio(chunks);
        } else {
          console.error('❌ [STT] No audio data recorded');
          toast({
            title: 'Recording Error',
            description: 'No audio was captured. Please try again.',
            status: 'error',
            duration: 3000,
            isClosable: true,
          });
        }
        
        stream.getTracks().forEach(track => {
          track.stop();
          console.log('🎤 [STT] Stopped track:', track.label);
        });
      };
      
      recorder.onerror = (event: any) => {
        console.error('❌ [STT] MediaRecorder error:', event.error);
        toast({
          title: 'Recording Error',
          description: event.error?.message || 'Failed to record audio',
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      };
      
      console.log('🎤 [STT] Starting recorder...');
      recorder.start();
      console.log('✅ [STT] Recorder started successfully');
      console.log('   State:', recorder.state);
      
      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      setIsRecording(true);
      
      toast({
        title: 'Recording Started',
        description: 'Speak now... Click Stop when finished',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
      
    } catch (error: any) {
      console.error('❌ [STT] Failed to start recording');
      console.error('   Error name:', error.name);
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
      
      let errorMessage = 'Failed to access microphone';
      
      if (error.name === 'NotAllowedError' || error.name === 'PermissionDeniedError') {
        errorMessage = 'Microphone permission denied. Please allow microphone access in your browser settings.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No microphone found. Please connect a microphone and try again.';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Microphone is already in use by another application.';
      }
      
      toast({
        title: 'Microphone Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const stopRecording = () => {
    console.log('🎤 [STT] Stop recording requested');
    
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      console.log('🎤 [STT] Stopping media recorder...');
      console.log('   Current state:', mediaRecorder.state);
      
      mediaRecorder.stop();
      setIsRecording(false);
      
      console.log('✅ [STT] Stop command sent');
    } else {
      console.warn('⚠️ [STT] MediaRecorder not active');
      setIsRecording(false);
    }
  };

  const transcribeAudio = async (chunks: Blob[]) => {
    console.log('\n🎤 [STT] ========== TRANSCRIPTION PROCESS ==========');
    console.log('   Time:', new Date().toISOString());
    console.log('   Chunks:', chunks.length);
    
    setTranscribing(true);
    
    try {
      const audioBlob = new Blob(chunks, { type: 'audio/webm' });
      console.log('✅ [STT] Audio blob created');
      console.log('   Type:', audioBlob.type);
      console.log('   Size:', (audioBlob.size / 1024).toFixed(2), 'KB');
      
      // 🔥 SAVE BLOB TO audioRecordings
      const recordingData = {
        blob: audioBlob,
        timestamp: new Date(),
        duration: audioBlob.size
      };
      
      setAudioRecordings(prev => [...prev, recordingData]);
      console.log('✅ [STT] Audio blob saved to recordings array');
      console.log('   Total recordings:', audioRecordings.length + 1);
      
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');
      
      console.log('🔄 [STT] Uploading to backend...');
      const token = localStorage.getItem('token') || 'demo-token';
      const startTime = Date.now();
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/whisper/transcribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const duration = Date.now() - startTime;
      console.log(`✅ [STT] Response received in ${duration}ms`);
      console.log('   Status:', response.status, response.statusText);
      
      const data = await response.json();
      console.log('📝 [STT] Response data:', data);
      
      if (data.success) {
        console.log('✅ [STT] Transcription successful!');
        console.log('   Text:', data.text);
        console.log('   Length:', data.text.length, 'characters');
        console.log('   Backend duration:', data.duration, 'ms');
        
        setCurrentMessage(prev => {
          const newMessage = prev + (prev ? ' ' : '') + data.text;
          console.log('✅ [STT] Message updated:', newMessage);
          return newMessage;
        });
        
        toast({
          title: 'Transcription Complete!',
          description: `"${data.text.substring(0, 50)}${data.text.length > 50 ? '...' : ''}"`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        
      } else {
        throw new Error(data.message || 'Transcription failed');
      }
      
    } catch (error: any) {
      console.error('❌ [STT] Transcription failed');
      console.error('   Error name:', error.name);
      console.error('   Error message:', error.message);
      console.error('   Error stack:', error.stack);
      
      toast({
        title: 'Transcription Failed',
        description: error.message || 'Failed to convert speech to text. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setTranscribing(false);
      setAudioChunks([]);
      console.log('🎤 [STT] Transcription process complete');
    }
  };

  const toggleRecording = () => {
    console.log('🎤 [STT] Toggle recording called');
    console.log('   Current isRecording state:', isRecording);
    console.log('   MediaRecorder exists:', !!mediaRecorder);
    console.log('   MediaRecorder state:', mediaRecorder?.state);
    
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // 🔥 NEW: FINISH DEBATE FUNCTION
  const finishDebate = async () => {
    console.log('🏁 Finishing debate...');
    console.log('   Total audio recordings:', audioRecordings.length);
    console.log('   Total messages:', messages.length);
    console.log('   Debate duration:', debateTimer, 'seconds');
    
    if (audioRecordings.length === 0) {
      toast({
        title: 'No Audio Recorded',
        description: 'Please record at least one message before finishing',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Combine all audio blobs
      console.log('🔄 Combining audio blobs...');
      const combinedBlob = new Blob(
        audioRecordings.map(r => r.blob),
        { type: 'audio/webm' }
      );
      console.log('✅ Combined blob size:', (combinedBlob.size / 1024).toFixed(2), 'KB');
      
      // Create FormData
      const formData = new FormData();
      formData.append('audio', combinedBlob, 'debate-recording.webm');
      formData.append('debateId', debateId);
      formData.append('userId', user.id);
      formData.append('topic', debateTopic);
      formData.append('userPosition', stance);
      formData.append('duration', debateTimer.toString());
      
      console.log('📤 Sending to backend...');
      const token = localStorage.getItem('token') || 'demo-token';
      
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/analysis/finish-debate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });
      
      const data = await response.json();
      console.log('📥 Response:', data);
      
      if (data.success) {
        toast({
          title: 'Debate Finished! 🎉',
          description: 'Your performance is being analyzed. Check AI Coach tab.',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
        
        // Clear debate state
        setDebateState({
          stance: 'pro',
          isJoined: false,
          messages: [],
          debateActive: false,
          debateTimer: 0,
          debateTopic: '',
          debateId: '',
          currentMessage: '',
          showTopicSelection: true,
          customTopic: '',
          audioRecordings: []
        });
        
      } else {
        throw new Error(data.message || 'Failed to finish debate');
      }
      
    } catch (error: any) {
      console.error('❌ Error finishing debate:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to finish debate',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  // ========== TTS HANDLER FUNCTIONS ==========

  const speakAIMessage = (messageId: string, text: string) => {
    console.log('🎙️ [TTS] Speaking message:', messageId);
    setCurrentSpeakingMessageId(messageId);
    ttsManager.speak(text);
    setIsAISpeaking(true);
    setIsAIPaused(false);
  };

  const handlePauseAudio = () => {
    console.log('⏸️ [TTS] User paused');
    ttsManager.pause();
    setIsAIPaused(true);
  };

  const handleResumeAudio = () => {
    console.log('▶️ [TTS] User resumed');
    ttsManager.resume();
    setIsAIPaused(false);
  };

  const handleStopAudio = () => {
    console.log('⏹️ [TTS] User stopped');
    ttsManager.stop();
    setIsAISpeaking(false);
    setIsAIPaused(false);
    setCurrentSpeakingMessageId(null);
  };

  const stopAISpeech = () => {
    if (ttsManager.isSpeaking() || ttsManager.isPaused()) {
      console.log('⏹️ [TTS] Auto-stopping for user input');
      ttsManager.stop();
      setIsAISpeaking(false);
      setIsAIPaused(false);
      setCurrentSpeakingMessageId(null);
      
      toast({
        title: "AI paused",
        description: "Listening to you now",
        status: "info",
        duration: 2000,
        position: "top",
      });
    }
  };

  return (
    <Flex direction="column" h="calc(100vh - 80px)" bg="gray.50">
      {/* Header */}
      <Box bg="gradient.blue" color="white" p={4} boxShadow="md">
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Heading size="lg">🤖 AI Debate Arena</Heading>
            <Text fontSize="sm" opacity={0.9}>
              {showTopicSelection ? 'Select a debate topic' : 
               !isJoined ? `Topic: ${debateTopic}` :
               `Debating: ${debateTopic} • Turn ${Math.floor(messages.length / 2) + 1}`}
            </Text>
          </VStack>
          
          <HStack>
            {debateActive && (
              <>
                <Badge colorScheme="green" fontSize="lg" px={3} py={1}>
                  <Timer size={16} style={{ display: 'inline', marginRight: '4px' }} />
                  {formatTime(debateTimer)}
                </Badge>
                
                {/* 🔥 NEW: Finish Debate Button */}
                <Button
                  colorScheme="red"
                  variant="solid"
                  size="md"
                  leftIcon={<CheckCircle size={18} />}
                  onClick={finishDebate}
                  isLoading={isLoading}
                  loadingText="Finishing..."
                >
                  Finish Debate
                </Button>
              </>
            )}
          </HStack>
        </HStack>
      </Box>

      {/* Main Content */}
      <Flex flex={1} overflow="hidden">
        <VStack flex={1} spacing={4} p={4} overflowY="auto" align="stretch">
          
          {/* TOPIC SELECTION SCREEN */}
          {showTopicSelection && (
            <VStack spacing={6} justify="center" h="full">
              <Card maxW="700px" p={6} w="full">
                <VStack spacing={4}>
                  <Heading size="md">🎯 Choose Your Debate Topic</Heading>
                  
                  {!topicsLoaded ? (
                    <VStack spacing={2}>
                      <Text>Loading topics...</Text>
                      <Text fontSize="sm" color="gray.500">Preparing your debate topics...</Text>
                    </VStack>
                  ) : (
                    <>
                      <Text textAlign="center" color="gray.600">
                        Select from AI-generated topics or enter your own
                      </Text>
                      
                      <Grid templateColumns="repeat(2, 1fr)" gap={3} w="full">
                        {cachedTopics.map((topic, index) => (
                          <Button
                            key={index}
                            onClick={() => selectTopic(topic)}
                            colorScheme="blue"
                            variant="outline"
                            h="auto"
                            py={4}
                            whiteSpace="normal"
                            textAlign="center"
                          >
                            {topic}
                          </Button>
                        ))}
                      </Grid>

                      <Divider />

                      <VStack w="full" spacing={2}>
                        <Text fontWeight="bold">Or enter custom topic:</Text>
                        <HStack w="full">
                          <Input
                            value={customTopic}
                            onChange={(e) => setCustomTopic(e.target.value)}
                            placeholder="e.g., Cryptocurrency as Currency"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') handleCustomTopic();
                            }}
                          />
                          <Button onClick={handleCustomTopic} colorScheme="green">
                            Use Topic
                          </Button>
                        </HStack>
                      </VStack>

                      <Button
                        onClick={fetchDebateTopics}
                        leftIcon={<RefreshCw size={16} />}
                        variant="outline"
                        colorScheme="blue"
                        size="sm"
                        isLoading={refreshingTopics}
                        loadingText="Generating..."
                      >
                        🔄 Generate New Topics
                      </Button>
                    </>
                  )}
                </VStack>
              </Card>
            </VStack>
          )}

          {/* POSITION SELECTION SCREEN */}
          {!showTopicSelection && !isJoined && (
            <VStack spacing={6} justify="center" h="full">
              <Card maxW="500px" p={6}>
                <VStack spacing={4}>
                  <Heading size="md">🎯 Choose Your Position</Heading>
                  <Text textAlign="center" color="gray.600" fontWeight="bold">
                    Topic: "{debateTopic}"
                  </Text>
                  
                  <RadioGroup value={stance} onChange={(value) => setStance(value as 'pro' | 'con')}>
                    <VStack spacing={3}>
                      <Radio value="pro" size="lg">
                        <strong>PRO</strong> - Support this topic
                      </Radio>
                      <Radio value="con" size="lg">
                        <strong>CON</strong> - Oppose this topic
                      </Radio>
                    </VStack>
                  </RadioGroup>

                  <HStack w="full">
                    <Button
                      onClick={() => setShowTopicSelection(true)}
                      variant="outline"
                      leftIcon={<ArrowLeft size={20} />}
                    >
                      Change Topic
                    </Button>
                    <Button
                      onClick={joinChat}
                      colorScheme="blue"
                      flex={1}
                      leftIcon={<Play size={20} />}
                      isLoading={isLoading}
                      loadingText="Starting..."
                    >
                      Start as {stance.toUpperCase()}
                    </Button>
                  </HStack>
                </VStack>
              </Card>
            </VStack>
          )}

          {/* DEBATE MESSAGES */}
          {isJoined && (
            <>
              {messages.map((message) => (
                <Flex
                  key={message.id}
                  justify={message.username === user.username ? 'flex-end' : 'flex-start'}
                >
                  <Card
                    maxW="70%"
                    bg={message.username === user.username ? 'blue.500' : 'white'}
                    color={message.username === user.username ? 'white' : 'gray.800'}
                  >
                    <CardBody>
                      <HStack justify="space-between" mb={2}>
                        <HStack>
                          {message.username === user.username ? <User size={16} /> : <Bot size={16} />}
                          <Text fontWeight="bold" fontSize="sm">
                            {message.username === user.username ? 'You' : 'AI'}
                          </Text>
                        </HStack>
                        <Text fontSize="xs" opacity={0.7}>
                          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </Text>
                      </HStack>
                      <Text whiteSpace="pre-wrap">{message.text}</Text>
                      
                      {/* ✅ TTS CONTROLS FOR AI MESSAGES */}
                      {message.username === 'AI' && ttsManager.isSupported() && (
                        <HStack spacing={2} mt={3} pt={2} borderTop="1px" borderColor="gray.200">
                          {/* Play/Resume Button */}
                          {(!isAISpeaking || isAIPaused || currentSpeakingMessageId !== message.id) && (
                            <IconButton
                              icon={<Play size={14} />}
                              aria-label={isAIPaused && currentSpeakingMessageId === message.id ? "Resume" : "Play"}
                              size="xs"
                              colorScheme="blue"
                              onClick={() => {
                                if (isAIPaused && currentSpeakingMessageId === message.id) {
                                  handleResumeAudio();
                                } else {
                                  speakAIMessage(message.id, message.text);
                                }
                              }}
                            />
                          )}
                          
                          {/* Pause Button */}
                          {isAISpeaking && !isAIPaused && currentSpeakingMessageId === message.id && (
                            <IconButton
                              icon={<Pause size={14} />}
                              aria-label="Pause"
                              size="xs"
                              colorScheme="orange"
                              onClick={handlePauseAudio}
                            />
                          )}
                          
                          {/* Stop Button */}
                          {(isAISpeaking || isAIPaused) && currentSpeakingMessageId === message.id && (
                            <IconButton
                              icon={<Square size={14} />}
                              aria-label="Stop"
                              size="xs"
                              colorScheme="red"
                              onClick={handleStopAudio}
                            />
                          )}
                          
                          {/* Speaking Indicator */}
                          {isAISpeaking && !isAIPaused && currentSpeakingMessageId === message.id && (
                            <HStack spacing={1}>
                              <Volume2 size={14} color="blue" />
                              <Text fontSize="xs" color="blue.600">Speaking...</Text>
                            </HStack>
                          )}
                          
                          {/* Paused Indicator */}
                          {isAIPaused && currentSpeakingMessageId === message.id && (
                            <Text fontSize="xs" color="orange.600">Paused</Text>
                          )}
                        </HStack>
                      )}
                    </CardBody>
                  </Card>
                </Flex>
              ))}

              {aiTyping && (
                <Flex justify="flex-start">
                  <Card bg="white">
                    <CardBody>
                      <HStack>
                        <Bot size={16} />
                        <Text fontSize="sm" color="gray.600">AI is thinking...</Text>
                      </HStack>
                    </CardBody>
                  </Card>
                </Flex>
              )}

              <div ref={messagesEndRef} />
            </>
          )}

        </VStack>
      </Flex>

      {/* Message Input with Speech-to-Text */}
      {isJoined && (
        <Box p={4} bg="white" borderTop="1px" borderColor="gray.200">
          <VStack spacing={2}>
            <HStack w="full">
              {/* Microphone Button */}
              <Button
                onClick={toggleRecording}
                colorScheme={isRecording ? 'red' : 'gray'}
                variant={isRecording ? 'solid' : 'outline'}
                px={4}
                isDisabled={aiTyping || transcribing}
                leftIcon={isRecording ? <MicOff size={18} /> : <Mic size={18} />}
                isLoading={transcribing}
                loadingText="..."
              >
                {isRecording ? 'Stop' : 'Mic'}
              </Button>

              {/* Text Input */}
              <Textarea
                value={currentMessage}
                onChange={(e) => setCurrentMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={transcribing ? "Transcribing..." : isRecording ? "Recording..." : "Present your argument..."}
                resize="none"
                rows={2}
                isDisabled={aiTyping || transcribing}
                bg={isRecording ? 'red.50' : transcribing ? 'blue.50' : 'white'}
              />

              {/* Send Button */}
              <Button
                onClick={sendMessage}
                colorScheme="blue"
                px={8}
                isLoading={aiTyping}
                loadingText="AI..."
                leftIcon={<Send size={18} />}
                isDisabled={transcribing}
              >
                Send
              </Button>
            </HStack>

            {/* Status Indicators */}
            {isRecording && (
              <Text fontSize="xs" color="red.500" textAlign="center" w="full">
                🔴 Recording... Click "Stop" when finished speaking
              </Text>
            )}
            
            {transcribing && (
              <Text fontSize="xs" color="blue.500" textAlign="center" w="full">
                ⏳ Transcribing your speech... Please wait
              </Text>
            )}
          </VStack>
        </Box>
      )}
    </Flex>
  );
};


// Add this component to your App.tsx (after DebateArenaView)

const AICoachView = React.forwardRef<{ refresh: () => void }, { user: AppUser }>(({ user }, ref) => {
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [selectedAnalysis, setSelectedAnalysis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const toast = useToast();
  const fallacyAlpha = 120;

  useEffect(() => {
    fetchAnalyses();
  }, []);

  // Auto-refresh for pending analyses every 10 seconds
  useEffect(() => {
    const hasPending = analyses.some(a => a.status === 'pending');
    
    if (hasPending) {
      console.log('🔄 Pending analyses detected, setting up auto-refresh...');
      const interval = setInterval(() => {
        console.log('🔄 Auto-refreshing analyses...');
        fetchAnalyses();
      }, 10000); // Refresh every 10 seconds
      
      return () => clearInterval(interval);
    }
  }, [analyses]);

  const fetchAnalyses = async () => {
    console.log('📊 Fetching user analyses...');
    setLoading(true);
    
    try {
      const token = localStorage.getItem('token') || 'demo-token';
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/analysis/user/${user.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('✅ Analyses loaded:', data.count);
        setAnalyses(data.analyses);
      } else {
        throw new Error(data.message || 'Failed to fetch analyses');
      }
    } catch (error: any) {
      console.error('❌ Error fetching analyses:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your debate analyses',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // Expose refresh function to parent
  React.useImperativeHandle(ref, () => ({
    refresh: fetchAnalyses
  }));

  const viewAnalysisDetails = async (analysisId: string, status: string) => {
    console.log('🔍 Loading analysis details:', analysisId, 'Status:', status);
    
    // Show toast for non-completed analyses but don't block the API call
    if (status === 'pending') {
      toast({
        title: 'Analysis Pending ⏳',
        description: 'Your debate is still being analyzed. Please check back in a minute.',
        status: 'info',
        duration: 4000,
        isClosable: true,
      });
      return; // Don't proceed with pending
    }
    
    if (status === 'failed') {
      toast({
        title: 'Analysis Failed ❌',
        description: 'This analysis failed to process. Please try debating again.',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return; // Don't proceed with failed
    }
    
    try {
      const token = localStorage.getItem('token') || 'demo-token';
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/analysis/${analysisId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success && data.status === 'completed') {
        console.log('✅ Analysis details loaded');
        setSelectedAnalysis(data.analysis);
        setViewMode('detail');
      } else if (data.status === 'pending') {
        toast({
          title: 'Analysis Pending',
          description: 'Your debate is still being analyzed. Please check back in a minute.',
          status: 'info',
          duration: 4000,
          isClosable: true,
        });
      } else {
        throw new Error(data.message || 'Failed to load analysis');
      }
    } catch (error: any) {
      console.error('❌ Error loading analysis:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analysis details',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'green';
    if (score >= 60) return 'blue';
    if (score >= 40) return 'yellow';
    return 'red';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'completed':
        return { colorScheme: 'green', label: 'Completed', showSpinner: false };
      case 'pending':
        return { colorScheme: 'yellow', label: 'Analyzing...', showSpinner: true };
      case 'failed':
        return { colorScheme: 'red', label: 'Failed', showSpinner: false };
      default:
        return { colorScheme: 'gray', label: status, showSpinner: false };
    }
  };

  return (
    <Flex direction="column" h="calc(100vh - 80px)" bg="gray.50">
    {/* Header */}
    <Box bg="purple.600" color="white" p={4} boxShadow="md">
      <HStack justify="space-between">
        <VStack align="start" spacing={0}>
          <Heading size="lg" color="white">🎓 AI Coach</Heading>
          <Text fontSize="sm" color="white" opacity={0.9}>
            {viewMode === 'list' 
              ? `${analyses.length} debate${analyses.length !== 1 ? 's' : ''} analyzed`
              : 'Detailed Performance Analysis'}
          </Text>
        </VStack>
        
        <HStack spacing={2}>
          {viewMode === 'list' && (
            <Button
              leftIcon={<RefreshCw size={18} />}
              colorScheme="whiteAlpha"
              variant="outline"
              color="white"
              borderColor="white"
              _hover={{ bg: 'whiteAlpha.300' }}
              onClick={fetchAnalyses}
              isLoading={loading}
            >
              Refresh
            </Button>
          )}
          
          {viewMode === 'detail' && (
            <Button
              leftIcon={<ArrowLeft size={18} />}
              colorScheme="whiteAlpha"
              variant="outline"
              color="white"
              borderColor="white"
              _hover={{ bg: 'whiteAlpha.300' }}
              onClick={() => {
                setViewMode('list');
                setSelectedAnalysis(null);
              }}
            >
              Back to List
            </Button>
          )}
        </HStack>
      </HStack>
    </Box>

  
      {/* Main Content */}
      <Box flex={1} overflowY="auto" p={6}>
        {loading ? (
          <VStack justify="center" h="full" spacing={4}>
            <Spinner size="xl" color="purple.500" thickness="4px" />
            <Text color="gray.600">Loading your analyses...</Text>
          </VStack>
        ) : viewMode === 'list' ? (
          // LIST VIEW
          <VStack spacing={4} align="stretch" maxW="1200px" mx="auto">
            {analyses.length === 0 ? (
              <Card p={8}>
                <VStack spacing={4}>
                  <Text fontSize="6xl">🎯</Text>
                  <Heading size="md">No Debates Analyzed Yet</Heading>
                  <Text color="gray.600" textAlign="center">
                    Finish a debate in the AI Arena to get your first analysis!
                  </Text>
                </VStack>
              </Card>
            ) : (
              analyses.map((analysis) => {
                const statusBadge = getStatusBadge(analysis.status);
                return (
                  <Card
                    key={analysis._id}
                    p={5}
                    cursor="pointer"
                    onClick={() => viewAnalysisDetails(analysis._id, analysis.status)}
                    _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                    transition="all 0.2s"
                    opacity={analysis.status === 'failed' ? 0.7 : 1}
                  >
                    <HStack justify="space-between" align="start">
                      <VStack align="start" spacing={2} flex={1}>
                        <HStack>
                          <Badge colorScheme="purple" fontSize="sm">
                            {analysis.userPosition.toUpperCase()}
                          </Badge>
                          <Badge 
                            colorScheme={statusBadge.colorScheme}
                            display="flex"
                            alignItems="center"
                            gap={1}
                          >
                            {statusBadge.showSpinner && <Spinner size="xs" />}
                            {statusBadge.label}
                          </Badge>
                        </HStack>
                        
                        <Heading size="md">{analysis.topic}</Heading>
                        
                        <Text fontSize="sm" color="gray.600">
                          {new Date(analysis.createdAt).toLocaleString()}
                        </Text>
                        
                        {analysis.status === 'pending' && (
                          <Text fontSize="xs" color="yellow.600" fontWeight="bold">
                            ⏳ Analysis in progress... This may take 1-2 minutes.
                          </Text>
                        )}
                        
                        {analysis.status === 'failed' && (
                          <Text fontSize="xs" color="red.600" fontWeight="bold">
                            ❌ Analysis failed. Please try again.
                          </Text>
                        )}
                      </VStack>
  
                      {analysis.status === 'completed' && analysis.analysis?.overallScore && (
                        <VStack spacing={1}>
                          <CircularProgress
                            value={analysis.analysis.overallScore}
                            size="80px"
                            thickness="8px"
                            color={`${getScoreColor(analysis.analysis.overallScore)}.400`}
                          >
                            <CircularProgressLabel fontSize="xl" fontWeight="bold">
                              {analysis.analysis.overallScore}
                            </CircularProgressLabel>
                          </CircularProgress>
                          <Text fontSize="xs" color="gray.600" fontWeight="bold">
                            {getScoreLabel(analysis.analysis.overallScore)}
                          </Text>
                        </VStack>
                      )}
                      
                      {analysis.status === 'pending' && (
                        <VStack spacing={1}>
                          <Spinner size="lg" color="yellow.500" thickness="4px" />
                          <Text fontSize="xs" color="gray.600" fontWeight="bold">
                            Processing
                          </Text>
                        </VStack>
                      )}
                    </HStack>
                  </Card>
                );
              })
            )}
          </VStack>
        ) : (
          // DETAIL VIEW - UPDATED WITH BADGES REMOVED
          selectedAnalysis && (
            <VStack spacing={6} align="stretch" maxW="1400px" mx="auto">
                {/* Header Card */}
                <Card bg="purple.600" color="white" p={6}>
                  <VStack align="start" spacing={3}>
                    <Heading size="xl" color="white">{selectedAnalysis.topic}</Heading>
                    
                    <Text fontSize="sm" color="white" opacity={0.9}>
                      Analyzed on {new Date(selectedAnalysis.completedAt || selectedAnalysis.createdAt).toLocaleString()}
                    </Text>
                  </VStack>
                </Card>

{/* Summary + Radar Chart Grid - Medium Height */}
<Grid templateColumns={{ base: '1fr', lg: '1.2fr 1fr' }} gap={6} mb={6}>
  {/* Left: Performance Summary */}
  <Card>
    <CardBody>
      <VStack align="start" spacing={4} h="100%">
        <Heading size="md">Performance Summary</Heading>
        <Box flex="1" overflowY="auto">
          <Text color="gray.700" lineHeight="tall">
            {selectedAnalysis.analysis.aiSummary?.overall || 'Comprehensive analysis completed.'}
          </Text>
        </Box>
      </VStack>
    </CardBody>
  </Card>

  {/* Right: Radar Chart */}
  <Card>
    <CardBody>
      <VStack spacing={2} h="100%">
        <Heading size="md">Performance Breakdown</Heading>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={[
            {
              metric: 'Fluency',
              score: selectedAnalysis.analysis.fluency?.score || 0,
            },
            {
              metric: 'Vocabulary',
              score: selectedAnalysis.analysis.vocabulary?.score || 0,
            },
            {
              metric: 'Arguments',
              score: selectedAnalysis.analysis.argumentStrength?.score || 0,
            },
            {
              metric: 'Delivery',
              score: selectedAnalysis.analysis.delivery?.score || 0,
            },
            {
              metric: 'Fallacy-Free',
              score: (() => {
                const totalFallacies = selectedAnalysis.fallacyCount?.total || 0;
                const totalWords = selectedAnalysis.analysis.vocabulary?.metrics?.totalWords || 1;
                const exponent = -1 * (totalFallacies / totalWords * 75);
                return Math.round(100 * Math.exp(exponent));
              })(),
            },
          ]}>
            <PolarGrid stroke="#E2E8F0" />
            <PolarAngleAxis 
              dataKey="metric" 
              tick={{ fill: '#4A5568', fontSize: 13, fontWeight: 'bold' }}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]}
              tick={{ fill: '#718096', fontSize: 11 }}
            />
            <Radar
              name="Score"
              dataKey="score"
              stroke="#3B82F6"
              fill="#3B82F6"
              fillOpacity={0.6}
              label={{ 
                fill: '#1F2937', 
                fontSize: 13, 
                fontWeight: 'bold',
                formatter: (value: number) => value
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </VStack>
    </CardBody>
  </Card>
</Grid>


  
              {/* Top Strengths & Weaknesses */}
              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
                {/* Strengths */}
                {selectedAnalysis.analysis.aiSummary?.topStrengths && (
                  <Card p={5}>
                    <VStack align="start" spacing={3}>
                      <HStack>
                        <Text fontSize="2xl">💪</Text>
                        <Heading size="md">Top Strengths</Heading>
                      </HStack>
                      <VStack align="start" spacing={2} w="full">
                        {selectedAnalysis.analysis.aiSummary.topStrengths.map((strength: string, idx: number) => (
                          <HStack key={idx} align="start" w="full">
                            <Badge colorScheme="green" fontSize="sm">{idx + 1}</Badge>
                            <Text flex={1}>{strength}</Text>
                          </HStack>
                        ))}
                      </VStack>
                    </VStack>
                  </Card>
                )}
  
                {/* Weaknesses */}
                {selectedAnalysis.analysis.aiSummary?.topWeaknesses && (
                  <Card p={5}>
                    <VStack align="start" spacing={3}>
                      <HStack>
                        <Text fontSize="2xl">🎯</Text>
                        <Heading size="md">Areas to Improve</Heading>
                      </HStack>
                      <VStack align="start" spacing={2} w="full">
                        {selectedAnalysis.analysis.aiSummary.topWeaknesses.map((weakness: string, idx: number) => (
                          <HStack key={idx} align="start" w="full">
                            <Badge colorScheme="orange" fontSize="sm">{idx + 1}</Badge>
                            <Text flex={1}>{weakness}</Text>
                          </HStack>
                        ))}
                      </VStack>
                    </VStack>
                  </Card>
                )}
              </SimpleGrid>

              {/* ✅ NEW: Fallacy Summary Card */}
              {selectedAnalysis.fallacyCount && selectedAnalysis.fallacyCount.total > 0 && (
                <Card bg="orange.50" borderColor="orange.200" borderWidth={1} p={4} mt={4}>
                  <HStack spacing={3}>
                    <Text fontSize="2xl">🚨</Text>
                    <VStack align="start" spacing={0}>
                      <Text fontWeight="bold" color="orange.700">
                        {selectedAnalysis.fallacyCount.total} Logical {selectedAnalysis.fallacyCount.total === 1 ? 'Fallacy' : 'Fallacies'} Detected
                      </Text>
                      <Text fontSize="sm" color="gray.600">
                        Rate: {selectedAnalysis.fallacyCount.rate.toFixed(2)} per 100 words
                      </Text>
                      <Text fontSize="sm" color="blue.600" mt={1}>
                        💡 Click the "Arguments" tab below to see details and learn how to improve
                      </Text>
                    </VStack>
                  </HStack>
                </Card>
              )}

  
              {/* Detailed Feedback Tabs */}
              <Card>
                <Tabs colorScheme="purple" variant="enclosed">
                  <TabList>
                    <Tab>📝 Transcript</Tab>
                    <Tab>🎤 Fluency</Tab>
                    <Tab>📚 Vocabulary</Tab>
                    <Tab>💡 Arguments</Tab>
                    <Tab>🎭 Delivery</Tab>
                    <Tab>✨ Recommendations</Tab>
                  </TabList>
  
                  <TabPanels>
                    {/* Transcript Tab */}
                    <TabPanel>
                      <VStack align="start" spacing={4}>
                        <Box w="full">
                          <Heading size="sm" mb={2}>Raw Transcript (with fillers)</Heading>
                          <Box bg="gray.50" p={4} borderRadius="md" maxH="300px" overflowY="auto">
                            <Text whiteSpace="pre-wrap" fontFamily="mono" fontSize="sm">
                              {selectedAnalysis.rawTranscript}
                            </Text>
                          </Box>
                        </Box>
  
                        <Box w="full">
                          <Heading size="sm" mb={2}>Cleaned Transcript</Heading>
                          <Box bg="blue.50" p={4} borderRadius="md" maxH="300px" overflowY="auto">
                            <Text whiteSpace="pre-wrap">
                              {selectedAnalysis.cleanedTranscript}
                            </Text>
                          </Box>
                        </Box>
                      </VStack>
                    </TabPanel>
  
                    {/* Fluency Tab */}
                    <TabPanel>
                      <VStack align="start" spacing={4}>
                        <Heading size="sm">Fluency Analysis</Heading>
                        
                        {selectedAnalysis.analysis.fluency?.metrics && (
                          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                            <Box>
                              <Text fontWeight="bold">Words Per Minute</Text>
                              <Text fontSize="2xl" color="purple.500">
                                {selectedAnalysis.analysis.fluency.metrics.wordsPerMinute}
                              </Text>
                            </Box>
                            <Box>
                              <Text fontWeight="bold">Pause Count</Text>
                              <Text fontSize="2xl" color="purple.500">
                                {selectedAnalysis.analysis.fluency.metrics.pauseCount}
                              </Text>
                            </Box>
                          </SimpleGrid>
                        )}
  
                        {selectedAnalysis.analysis.fluency?.disfluencies && (
                          <Box w="full">
                            <Text fontWeight="bold" mb={2}>Filler Words Breakdown</Text>
                            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
                              {Object.entries(selectedAnalysis.analysis.fluency.disfluencies.breakdown).map(([key, value]: [string, any]) => (
                                <Box key={key} bg="gray.50" p={2} borderRadius="md">
                                  <Text fontSize="sm" color="gray.600">{key.replace(/_/g, ' ')}</Text>
                                  <Text fontSize="lg" fontWeight="bold">{value}</Text>
                                </Box>
                              ))}
                            </SimpleGrid>
                          </Box>
                        )}
  
                        {selectedAnalysis.analysis.fluency?.feedback && (
                          <Box w="full">
                            <Text fontWeight="bold" mb={2}>Feedback</Text>
                            <Text>{selectedAnalysis.analysis.fluency.feedback}</Text>
                          </Box>
                        )}
  
                        {selectedAnalysis.analysis.fluency?.tips && (
                          <Box w="full">
                            <Text fontWeight="bold" mb={2}>Tips</Text>
                            <VStack align="start" spacing={1}>
                              {selectedAnalysis.analysis.fluency.tips.map((tip: string, idx: number) => (
                                <HStack key={idx}>
                                  <Text color="purple.500">•</Text>
                                  <Text>{tip}</Text>
                                </HStack>
                              ))}
                            </VStack>
                          </Box>
                        )}
                      </VStack>
                    </TabPanel>
  
                    {/* Vocabulary Tab */}
                    <TabPanel>
                      <VStack align="start" spacing={4}>
                        <Heading size="sm">Vocabulary Analysis</Heading>
                        
                        {selectedAnalysis.analysis.vocabulary?.metrics && (
                          <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} w="full">
                            <Box>
                              <Text fontWeight="bold" fontSize="sm">Total Words</Text>
                              <Text fontSize="2xl" color="purple.500">
                                {selectedAnalysis.analysis.vocabulary.metrics.totalWords}
                              </Text>
                            </Box>
                            <Box>
                              <Text fontWeight="bold" fontSize="sm">Unique Words</Text>
                              <Text fontSize="2xl" color="purple.500">
                                {selectedAnalysis.analysis.vocabulary.metrics.uniqueWords}
                              </Text>
                            </Box>
                            <Box>
                              <Text fontWeight="bold" fontSize="sm">Diversity</Text>
                              <Text fontSize="2xl" color="purple.500">
                                {(selectedAnalysis.analysis.vocabulary.metrics.lexicalDiversity * 100).toFixed(1)}%
                              </Text>
                            </Box>
                            <Box>
                              <Text fontWeight="bold" fontSize="sm">Avg Word Length</Text>
                              <Text fontSize="2xl" color="purple.500">
                                {selectedAnalysis.analysis.vocabulary.metrics.averageWordLength.toFixed(1)}
                              </Text>
                            </Box>
                          </SimpleGrid>
                        )}
  
                        {selectedAnalysis.analysis.vocabulary?.feedback && (
                          <Box w="full">
                            <Text fontWeight="bold" mb={2}>Feedback</Text>
                            <Text>{selectedAnalysis.analysis.vocabulary.feedback}</Text>
                          </Box>
                        )}
  
                        {selectedAnalysis.analysis.vocabulary?.tips && (
                          <Box w="full">
                            <Text fontWeight="bold" mb={2}>Tips</Text>
                            <VStack align="start" spacing={1}>
                              {selectedAnalysis.analysis.vocabulary.tips.map((tip: string, idx: number) => (
                                <HStack key={idx}>
                                  <Text color="purple.500">•</Text>
                                  <Text>{tip}</Text>
                                </HStack>
                              ))}
                            </VStack>
                          </Box>
                        )}
                      </VStack>
                    </TabPanel>
  
                    {/* Arguments Tab */}
                    <TabPanel>
                      <VStack align="start" spacing={4}>
                        <Heading size="sm">Argument Analysis</Heading>
                        
                        {selectedAnalysis.analysis.argumentStrength?.strengths && selectedAnalysis.analysis.argumentStrength.strengths.length > 0 && (
                          <Box w="full">
                            <Text fontWeight="bold" mb={2} color="green.600">Strengths</Text>
                            <VStack align="start" spacing={2}>
                              {selectedAnalysis.analysis.argumentStrength.strengths.map((strength: any, idx: number) => (
                                <Box key={idx} bg="green.50" p={3} borderRadius="md" w="full">
                                  <Text fontWeight="bold">{strength.point}</Text>
                                  <Text fontSize="sm" color="gray.600">{strength.reasoning}</Text>
                                </Box>
                              ))}
                            </VStack>
                          </Box>
                        )}
  
                        {selectedAnalysis.analysis.argumentStrength?.weaknesses && selectedAnalysis.analysis.argumentStrength.weaknesses.length > 0 && (
                          <Box w="full">
                            <Text fontWeight="bold" mb={2} color="orange.600">Weaknesses</Text>
                            <VStack align="start" spacing={2}>
                              {selectedAnalysis.analysis.argumentStrength.weaknesses.map((weakness: any, idx: number) => (
                                <Box key={idx} bg="orange.50" p={3} borderRadius="md" w="full">
                                  <Text fontWeight="bold">{weakness.point}</Text>
                                  <Text fontSize="sm" color="gray.600" mb={1}>{weakness.reasoning}</Text>
                                  <Text fontSize="sm" color="orange.700" fontWeight="bold">
                                    💡 Suggestion: {weakness.suggestion}
                                  </Text>
                                </Box>
                              ))}
                            </VStack>
                          </Box>
                        )}
  
                        {selectedAnalysis.analysis.argumentStrength?.feedback && (
                          <Box w="full">
                            <Text fontWeight="bold" mb={2}>Overall Feedback</Text>
                            <Text>{selectedAnalysis.analysis.argumentStrength.feedback}</Text>
                          </Box>
                        )}
                      </VStack>
                    </TabPanel>
  
                    {/* Delivery Tab */}
                    <TabPanel>
                      <VStack align="start" spacing={4}>
                        <Heading size="sm">Delivery Analysis</Heading>
                        
                        {selectedAnalysis.analysis.delivery?.pace && (
                          <Box w="full" bg="blue.50" p={4} borderRadius="md">
                            <Text fontWeight="bold" mb={2}>Pace</Text>
                            <Text>Assessment: {selectedAnalysis.analysis.delivery.pace.assessment}</Text>
                            <Text>Words Per Minute: {selectedAnalysis.analysis.delivery.pace.wordsPerMinute}</Text>
                            <Text fontSize="sm" color="gray.600" mt={1}>
                              {selectedAnalysis.analysis.delivery.pace.recommendation}
                            </Text>
                          </Box>
                        )}
  
                        {selectedAnalysis.analysis.delivery?.feedback && (
                          <Box w="full">
                            <Text fontWeight="bold" mb={2}>Feedback</Text>
                            <Text>{selectedAnalysis.analysis.delivery.feedback}</Text>
                          </Box>
                        )}
  
                        {selectedAnalysis.analysis.delivery?.tips && (
                          <Box w="full">
                            <Text fontWeight="bold" mb={2}>Tips</Text>
                            <VStack align="start" spacing={1}>
                              {selectedAnalysis.analysis.delivery.tips.map((tip: string, idx: number) => (
                                <HStack key={idx}>
                                  <Text color="purple.500">•</Text>
                                  <Text>{tip}</Text>
                                </HStack>
                              ))}
                            </VStack>
                          </Box>
                        )}
                      </VStack>
                    </TabPanel>
  
                    {/* Recommendations Tab */}
                    <TabPanel>
                      <VStack align="start" spacing={4}>
                        <Heading size="sm">Action Plan</Heading>
                        
                        {selectedAnalysis.analysis.recommendations?.immediate && (
                          <Box w="full">
                            <Text fontWeight="bold" mb={2} color="red.600">🚨 Immediate Actions</Text>
                            <VStack align="start" spacing={1}>
                              {selectedAnalysis.analysis.recommendations.immediate.map((rec: string, idx: number) => (
                                <HStack key={idx}>
                                  <Text color="red.500">•</Text>
                                  <Text>{rec}</Text>
                                </HStack>
                              ))}
                            </VStack>
                          </Box>
                        )}
  
                        {selectedAnalysis.analysis.recommendations?.practice && (
                          <Box w="full">
                            <Text fontWeight="bold" mb={2} color="orange.600">🎯 Practice Exercises</Text>
                            <VStack align="start" spacing={1}>
                              {selectedAnalysis.analysis.recommendations.practice.map((rec: string, idx: number) => (
                                <HStack key={idx}>
                                  <Text color="orange.500">•</Text>
                                  <Text>{rec}</Text>
                                </HStack>
                              ))}
                            </VStack>
                          </Box>
                        )}
  
                        {selectedAnalysis.analysis.recommendations?.advanced && (
                          <Box w="full">
                            <Text fontWeight="bold" mb={2} color="green.600">🌟 Advanced Techniques</Text>
                            <VStack align="start" spacing={1}>
                              {selectedAnalysis.analysis.recommendations.advanced.map((rec: string, idx: number) => (
                                <HStack key={idx}>
                                  <Text color="green.500">•</Text>
                                  <Text>{rec}</Text>
                                </HStack>
                              ))}
                            </VStack>
                          </Box>
                        )}
  
                        {selectedAnalysis.analysis.aiSummary?.keyTakeaway && (
                          <Box w="full" bg="purple.50" p={4} borderRadius="md" mt={4}>
                            <Text fontWeight="bold" mb={2}>🎯 Key Takeaway</Text>
                            <Text>{selectedAnalysis.analysis.aiSummary.keyTakeaway}</Text>
                          </Box>
                        )}
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </Card>
            </VStack>
          )
        )}
      </Box>
    </Flex>
  );
  
});

// ===== ANALYTICS VIEW =====
const AnalyticsView: React.FC<{ user: AppUser }> = ({ user }) => {
  const API_URL = process.env.REACT_APP_API_URL || `${process.env.REACT_APP_API_URL}`;
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [analyticsChartView, setAnalyticsChartView] = useState<'scores' | 'fallacies' | 'speech'>('scores');
  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      setAnalyticsLoading(true);

      const [analyticsRes, trendsRes, summaryRes] = await Promise.all([
        fetch(`${API_URL}/api/analytics?userId=${user.id}`),
        fetch(`${API_URL}/api/analytics/trends?userId=${user.id}`),
        fetch(`${API_URL}/api/analytics/summary?userId=${user.id}`)
      ]);

      const analytics = await analyticsRes.json();
      const trends = await trendsRes.json();
      const summary = await summaryRes.json();

      console.log('📊 Analytics Data:', analytics);
      console.log('📈 Trends Data:', trends);
      console.log('📊 Summary Data:', summary);

      setAnalyticsData(analytics);
      setTrendsData(trends);
      setSummaryData(summary);

    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics data',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const prepareScoreChartData = () => {
    if (!analyticsData?.debateHistory) return [];

    return analyticsData.debateHistory
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((debate: any, index: number) => ({
        debate: `#${index + 1}`,
        Overall: debate.metrics.overallScore,
        Fluency: debate.metrics.fluencyScore,
        Vocabulary: debate.metrics.vocabularyScore,
        Argument: debate.metrics.argumentScore,
        Structure: debate.metrics.structureScore,
        Delivery: debate.metrics.deliveryScore
      }));
  };

  const prepareFallacyChartData = () => {
    if (!analyticsData?.debateHistory) return [];

    const fallacyTotals: { [key: string]: number } = {};

    analyticsData.debateHistory.forEach((debate: any) => {
      Object.entries(debate.metrics.fallacyBreakdown).forEach(([type, count]) => {
        fallacyTotals[type] = (fallacyTotals[type] || 0) + (count as number);
      });
    });

    return Object.entries(fallacyTotals)
      .filter(([_, count]) => count > 0)
      .map(([type, count]) => ({
        name: type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        count
      }))
      .sort((a, b) => b.count - a.count);
  };

  const prepareSpeechChartData = () => {
    if (!analyticsData?.debateHistory) return [];

    return analyticsData.debateHistory
      .sort((a: any, b: any) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((debate: any, index: number) => ({
        debate: `#${index + 1}`,
        WPM: debate.metrics.wordsPerMinute,
        Disfluencies: debate.metrics.totalDisfluencies,
        Fallacies: debate.metrics.totalFallacies
      }));
  };

  const formatFallacyType = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (analyticsLoading) {
    return (
      <Flex direction="column" h="calc(100vh - 80px)" bg="gray.50" justify="center" align="center">
        <VStack spacing={4}>
          <Spinner size="xl" color="blue.500" />
          <Text>Loading analytics...</Text>
        </VStack>
      </Flex>
    );
  }

  if (!analyticsData?.debateHistory || analyticsData.debateHistory.length === 0) {
    return (
      <Flex direction="column" h="calc(100vh - 80px)" bg="gray.50">
        <Box bg="blue.600" color="white" p={4} boxShadow="md">
          <Heading size="lg">Performance Analytics</Heading>
          <Text fontSize="sm" opacity={0.9}>Track your debate performance over time</Text>
        </Box>
        <Flex flex={1} justify="center" align="center">
          <Card maxW="500px" p={6}>
            <VStack spacing={4}>
              <Text fontSize="6xl">📊</Text>
              <Heading size="md">No Analytics Data Yet</Heading>
              <Text color="gray.600" textAlign="center">
                Complete at least one debate to see your analytics and track your progress.
              </Text>
              <Button colorScheme="blue" onClick={() => setCurrentView('debate')}>
                Start Your First Debate
              </Button>
            </VStack>
          </Card>
        </Flex>
      </Flex>
    );
  }

  const scoreChartData = prepareScoreChartData();
  const fallacyChartData = prepareFallacyChartData();
  const speechChartData = prepareSpeechChartData();

  return (
    <Flex direction="column" h="calc(100vh - 80px)" bg="gray.50">
      {/* Header */}
      <Box bg="blue.600" color="white" p={4} boxShadow="md">
        <HStack justify="space-between">
          <VStack align="start" spacing={0}>
            <Heading size="lg">Performance Analytics</Heading>
            <Text fontSize="sm" opacity={0.9}>Track your improvement across {analyticsData.totalDebates} debates</Text>
          </VStack>
          <Button
            onClick={fetchAnalyticsData}
            colorScheme="whiteAlpha"
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw size={16} />}
          >
            Refresh
          </Button>
        </HStack>
      </Box>

      {/* Main Content */}
      <Box flex={1} overflowY="auto" p={6}>
        <VStack spacing={6} align="stretch" maxW="1400px" mx="auto">
          
          {/* Overview Stats */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <Card>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" fontWeight="bold" color="gray.600">Total Debates</Text>
                  <Text fontSize="3xl" fontWeight="bold">{summaryData?.stats?.totalDebates || 0}</Text>
                  <Text fontSize="xs" color="gray.500">Completed</Text>
                </VStack>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" fontWeight="bold" color="gray.600">Average Score</Text>
                  <Text fontSize="3xl" fontWeight="bold" color="blue.500">
                    {summaryData?.stats?.averages?.overallScore?.toFixed(1) || 0}
                  </Text>
                  {trendsData?.trends?.overallScore && (
                    <HStack>
                      {trendsData.trends.overallScore.trend === 'up' ? (
                        <TrendingUp size={16} color="#10B981" />
                      ) : (
                        <TrendingDown size={16} color="#EF4444" />
                      )}
                      <Text fontSize="xs" color={trendsData.trends.overallScore.trend === 'up' ? 'green.600' : 'red.600'}>
                        {Math.abs(trendsData.trends.overallScore.percentChange).toFixed(1)}%
                      </Text>
                    </HStack>
                  )}
                </VStack>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" fontWeight="bold" color="gray.600">Avg Fallacy Rate</Text>
                  <Text fontSize="3xl" fontWeight="bold" color="orange.500">
                    {summaryData?.stats?.averages?.fallacyRate?.toFixed(2) || 0}
                  </Text>
                  <Text fontSize="xs" color="gray.500">Per 100 words</Text>
                </VStack>
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <VStack align="start" spacing={2}>
                  <Text fontSize="sm" fontWeight="bold" color="gray.600">Best Score</Text>
                  <Text fontSize="3xl" fontWeight="bold" color="green.500">
                    {summaryData?.stats?.bestPerformance?.score || 0}
                  </Text>
                  {summaryData?.stats?.bestPerformance?.date && (
                    <Text fontSize="xs" color="gray.500">
                      {new Date(summaryData.stats.bestPerformance.date).toLocaleDateString()}
                    </Text>
                  )}
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Problem Areas */}
          {trendsData?.hasEnoughData && trendsData.problemAreas && trendsData.problemAreas.length > 0 && (
            <Card bg="orange.50" borderColor="orange.200" borderWidth={1}>
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <HStack>
                    <AlertTriangle size={20} color="#F97316" />
                    <Heading size="sm">Areas for Improvement</Heading>
                  </HStack>
                  {trendsData.problemAreas.map((area: any, index: number) => (
                    <Box key={index} p={3} bg="white" borderRadius="md">
                      <Text fontWeight="bold" color="orange.700">{area.metric}</Text>
                      <Text fontSize="sm" color="gray.600">{area.issue}</Text>
                      <Text fontSize="sm" color="blue.600" mt={1}>💡 {area.recommendation}</Text>
                    </Box>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Charts */}
          <Card>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <HStack justify="space-between">
                  <Heading size="md">Performance Trends</Heading>
                  <HStack spacing={2}>
                    <Button
                      size="sm"
                      colorScheme={analyticsChartView === 'scores' ? 'blue' : 'gray'}
                      variant={analyticsChartView === 'scores' ? 'solid' : 'outline'}
                      onClick={() => setAnalyticsChartView('scores')}
                    >
                      Scores
                    </Button>
                    <Button
                      size="sm"
                      colorScheme={analyticsChartView === 'fallacies' ? 'blue' : 'gray'}
                      variant={analyticsChartView === 'fallacies' ? 'solid' : 'outline'}
                      onClick={() => setAnalyticsChartView('fallacies')}
                    >
                      Fallacies
                    </Button>
                    <Button
                      size="sm"
                      colorScheme={analyticsChartView === 'speech' ? 'blue' : 'gray'}
                      variant={analyticsChartView === 'speech' ? 'solid' : 'outline'}
                      onClick={() => setAnalyticsChartView('speech')}
                    >
                      Speech
                    </Button>
                  </HStack>
                </HStack>

                {analyticsChartView === 'scores' && (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={scoreChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="debate" />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="Overall" stroke="#3B82F6" strokeWidth={2} />
                      <Line type="monotone" dataKey="Fluency" stroke="#10B981" />
                      <Line type="monotone" dataKey="Vocabulary" stroke="#F59E0B" />
                      <Line type="monotone" dataKey="Argument" stroke="#EF4444" />
                      <Line type="monotone" dataKey="Structure" stroke="#8B5CF6" />
                      <Line type="monotone" dataKey="Delivery" stroke="#EC4899" />
                    </LineChart>
                  </ResponsiveContainer>
                )}

                {analyticsChartView === 'fallacies' && (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={fallacyChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={120} fontSize={12} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#EF4444" />
                    </BarChart>
                  </ResponsiveContainer>
                )}

                {analyticsChartView === 'speech' && (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={speechChartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="debate" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="WPM" stroke="#3B82F6" strokeWidth={2} />
                      <Line type="monotone" dataKey="Disfluencies" stroke="#EF4444" />
                      <Line type="monotone" dataKey="Fallacies" stroke="#F59E0B" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </VStack>
            </CardBody>
          </Card>

          {/* Most Common Fallacies */}
          {summaryData?.stats?.mostCommonFallacies && summaryData.stats.mostCommonFallacies.length > 0 && (
            <Card>
              <CardBody>
                <VStack align="stretch" spacing={4}>
                  <Heading size="md">Most Common Fallacies</Heading>
                  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                    {summaryData.stats.mostCommonFallacies.slice(0, 6).map((fallacy: any, index: number) => (
                      <Box key={index} p={4} bg="red.50" borderRadius="md" borderWidth={1} borderColor="red.200">
                        <Text fontWeight="bold" fontSize="md">{formatFallacyType(fallacy.type)}</Text>
                        <Text fontSize="3xl" color="red.600" fontWeight="bold">{fallacy.count}</Text>
                        <Text fontSize="sm" color="gray.600">occurrences</Text>
                      </Box>
                    ))}
                  </SimpleGrid>
                </VStack>
              </CardBody>
            </Card>
          )}

          {/* Recent Debates Table */}
          <Card>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <Heading size="md">Recent Debates</Heading>
                <Box overflowX="auto">
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
                        <th style={{ textAlign: 'left', padding: '12px', fontSize: '14px', fontWeight: 'bold', color: '#4A5568' }}>Date</th>
                        <th style={{ textAlign: 'right', padding: '12px', fontSize: '14px', fontWeight: 'bold', color: '#4A5568' }}>Overall</th>
                        <th style={{ textAlign: 'right', padding: '12px', fontSize: '14px', fontWeight: 'bold', color: '#4A5568' }}>Fallacies</th>
                        <th style={{ textAlign: 'right', padding: '12px', fontSize: '14px', fontWeight: 'bold', color: '#4A5568' }}>Disfluencies</th>
                        <th style={{ textAlign: 'right', padding: '12px', fontSize: '14px', fontWeight: 'bold', color: '#4A5568' }}>WPM</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analyticsData.debateHistory
                        .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .slice(0, 10)
                        .map((debate: any, index: number) => (
                          <tr key={index} style={{ borderBottom: '1px solid #E2E8F0' }}>
                            <td style={{ padding: '12px', fontSize: '14px' }}>
                              {new Date(debate.timestamp).toLocaleDateString()}
                            </td>
                            <td style={{ textAlign: 'right', padding: '12px' }}>
                              <Badge colorScheme={debate.metrics.overallScore >= 80 ? 'green' : debate.metrics.overallScore >= 60 ? 'blue' : 'orange'}>
                                {debate.metrics.overallScore}
                              </Badge>
                            </td>
                            <td style={{ textAlign: 'right', padding: '12px', fontSize: '14px' }}>
                              {debate.metrics.totalFallacies}
                            </td>
                            <td style={{ textAlign: 'right', padding: '12px', fontSize: '14px' }}>
                              {debate.metrics.totalDisfluencies}
                            </td>
                            <td style={{ textAlign: 'right', padding: '12px', fontSize: '14px' }}>
                              {Math.round(debate.metrics.wordsPerMinute)}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </Box>
              </VStack>
            </CardBody>
          </Card>

        </VStack>
      </Box>
    </Flex>
  );
};


// Coming Soon View Component
const ComingSoonView: React.FC<{ title: string }> = ({ title }) => {
  return (
    <Flex flex={1} align="center" justify="center">
      <VStack spacing={4} textAlign="center">
        <Text fontSize="6xl">🚧</Text>
        <Heading size="xl" color="gray.600">{title}</Heading>
        <Text color="gray.500">This feature is coming soon!</Text>
      </VStack>
    </Flex>
  );
};

export default App;