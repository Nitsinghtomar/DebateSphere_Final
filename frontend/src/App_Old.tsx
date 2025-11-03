import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  ChakraProvider, Box, VStack, HStack, Input, Button, Text, Badge, Grid, GridItem, 
  Flex, Heading, Container, IconButton, Avatar, Divider, Card, CardBody, CardHeader, 
  Progress, Stat, StatLabel, StatNumber, StatHelpText, useToast, Modal, ModalOverlay, 
  ModalContent, ModalHeader, ModalBody, ModalCloseButton, useDisclosure, Select, 
  Switch, FormControl, FormLabel, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton,
  DrawerHeader, DrawerBody, useBreakpointValue, Icon, Spinner
} from '@chakra-ui/react';
import { io } from 'socket.io-client';

// Icon components (using Unicode symbols as placeholders for Lucide icons)
const Icons = {
  MessageCircle: () => <Text fontSize="16px">💬</Text>,
  Brain: () => <Text fontSize="16px">🧠</Text>,
  BarChart3: () => <Text fontSize="16px">📊</Text>,
  Users: () => <Text fontSize="16px">👥</Text>,
  Home: () => <Text fontSize="16px">🏠</Text>,
  TreePine: () => <Text fontSize="16px">🌲</Text>,
  Send: () => <Text fontSize="16px">📤</Text>,
  Bot: () => <Text fontSize="16px">🤖</Text>,
  User: () => <Text fontSize="16px">👤</Text>,
  Award: () => <Text fontSize="16px">🏆</Text>,
  TrendingUp: () => <Text fontSize="16px">📈</Text>,
  AlertTriangle: () => <Text fontSize="16px">⚠️</Text>,
  CheckCircle: () => <Text fontSize="16px">✅</Text>,
  X: () => <Text fontSize="16px">❌</Text>,
  Menu: () => <Text fontSize="16px">☰</Text>,
  Plus: () => <Text fontSize="16px">➕</Text>,
  Settings: () => <Text fontSize="16px">⚙️</Text>,
  Timer: () => <Text fontSize="16px">⏱️</Text>,
  Target: () => <Text fontSize="16px">🎯</Text>,
  Zap: () => <Text fontSize="16px">⚡</Text>,
  Star: () => <Text fontSize="16px">⭐</Text>,
  Trophy: () => <Text fontSize="16px">🏆</Text>,
  BookOpen: () => <Text fontSize="16px">📖</Text>,
  ThumbsUp: () => <Text fontSize="16px">👍</Text>,
  ThumbsDown: () => <Text fontSize="16px">👎</Text>,
  Volume2: () => <Text fontSize="16px">🔊</Text>,
  VolumeX: () => <Text fontSize="16px">🔇</Text>,
  Bell: () => <Text fontSize="16px">🔔</Text>,
  Shield: () => <Text fontSize="16px">🛡️</Text>
};

// Main DebateSphere Application
const DebateSphere: React.FC = () => {
  // Core state
  const [currentView, setCurrentView] = useState('dashboard');
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [showCoachFeedback, setShowCoachFeedback] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [debateActive, setDebateActive] = useState(false);
  const [debateTimer, setDebateTimer] = useState(0);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [opponentType, setOpponentType] = useState('ai');
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  // Socket.IO state
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  
  // UI state
  const { isOpen: isNewDebateOpen, onOpen: onNewDebateOpen, onClose: onNewDebateClose } = useDisclosure();
  const { isOpen: isSidebarOpen, onOpen: onSidebarOpen, onClose: onSidebarClose } = useDisclosure();
  const { isOpen: isAuthOpen, onOpen: onAuthOpen, onClose: onAuthClose } = useDisclosure();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState({ username: 'guest_user', position: 'PRO' });
  const [userProfile, setUserProfile] = useState({ 
    name: 'Guest User', 
    level: 'Beginner', 
    avatar: '�', 
    streak: 0 
  });
  const [authLoading, setAuthLoading] = useState(false);
  
  const debateTopics = [
    "Social Media's Impact on Society", 
    "Climate Change Policy Solutions", 
    "Universal Basic Income", 
    "Artificial Intelligence Ethics", 
    "Remote Work vs Office Work"
  ];
  
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

  // Socket.IO setup
  const loadInitialMessages = useCallback(() => {
    console.log('Loading initial messages...');
    setMessages([
      { id: 1, user: 'system', text: 'Welcome to DebateSphere! Join the conversation.', timestamp: new Date(), type: 'system' }
    ]);
  }, []);

  useEffect(() => {
    console.log('Setting up Socket.IO connection...');
    const newSocket = io(`${process.env.REACT_APP_API_URL}`, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('Connected to server:', newSocket.id);
      setIsConnected(true);
      setSocket(newSocket);
      
      newSocket.emit('join_debate', {
        debateId: 'default_debate',
        username: currentUser.username,
        position: currentUser.position
      });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('debate_message', (message) => {
      console.log('Received message:', message);
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('participants_update', (participantsList) => {
      console.log('Participants updated:', participantsList);
      setParticipants(participantsList);
    });

    loadInitialMessages();

    return () => {
      newSocket.close();
    };
  }, [currentUser.username, currentUser.position, loadInitialMessages]);

  // Timer effect
  useEffect(() => {
    if (debateActive) {
      const interval = setInterval(() => setDebateTimer(prev => prev + 1), 1000);
      return () => clearInterval(interval);
    }
  }, [debateActive]);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Helper functions
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const startNewDebate = (topic: string, opponent: string) => {
    setSelectedTopic(topic);
    setOpponentType(opponent);
    setCurrentView('debate');
    setDebateActive(true);
    setDebateTimer(0);
    setMessages([
      { id: 1, user: 'system', text: `Debate started: "${topic}" - You vs ${opponent === 'ai' ? 'AI Opponent' : 'Human Opponent'}`, timestamp: new Date(), type: 'system' },
      { id: 2, user: 'ai', text: `Welcome to this debate on "${topic}". Please present your opening statement.`, timestamp: new Date() }
    ]);
    onNewDebateClose();
    toast({ title: 'Debate started successfully!', status: 'success', duration: 3000 });
  };

  const sendMessage = () => {
    console.log('sendMessage called - messageText:', newMessage, 'socket:', !!socket, 'isConnected:', isConnected);
    
    if (!newMessage.trim()) {
      console.log('Message is empty, not sending');
      return;
    }
    
    if (!socket) {
      console.log('Socket not available, not sending');
      return;
    }

    const messageData = {
      username: currentUser.username,
      position: currentUser.position,
      text: newMessage.trim(),
      timestamp: new Date().toISOString()
    };

    console.log('Sending message:', messageData);

    socket.emit('send_message', {
      debateId: 'default_debate',
      message: messageData
    });

    // Don't add locally - wait for server confirmation via 'debate_message' event
    setNewMessage('');
    console.log('Message sent and input cleared - waiting for server confirmation');
    
    // Simulate AI response for prototype
    if (debateActive && opponentType === 'ai') {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const aiResponse = {
          id: messages.length + 2, 
          user: 'ai',
          text: `That's an interesting perspective. Let me present a counterargument... [Response to: "${newMessage.substring(0, 30)}..."]`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 2000);
    }
  };

  const getCoachFeedback = (messageId: number) => {
    const feedback = {
      fallacyType: "Hasty Generalization",
      explanation: "Your argument makes a broad claim based on limited examples. Consider providing more comprehensive evidence.",
      confidence: 0.75,
      suggestions: ["Provide statistical evidence", "Acknowledge counterexamples", "Use qualifying language"],
      severity: "medium"
    };
    setShowCoachFeedback({ messageId, feedback });
    toast({ title: 'AI Coach feedback available!', status: 'info', duration: 3000 });
  };

  // Authentication functions
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

      if (response.ok) {
        setIsAuthenticated(true);
        setCurrentUser({ username: data.user.username, position: 'PRO' });
        setUserProfile({
          name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || data.user.username,
          level: data.user.stats?.debatesCompleted > 10 ? 'Advanced Debater' : 'Beginner',
          avatar: data.user.profilePicture || '👤',
          streak: data.user.stats?.currentStreak || 0
        });
        localStorage.setItem('token', data.token);
        onAuthClose();
        toast({ title: 'Login successful!', status: 'success', duration: 3000 });
      } else {
        toast({ title: 'Login failed', description: data.message, status: 'error', duration: 5000 });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({ title: 'Login failed', description: 'Network error. Please try again.', status: 'error', duration: 5000 });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (userData: any) => {
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

      if (response.ok) {
        setIsAuthenticated(true);
        setCurrentUser({ username: data.user.username, position: 'PRO' });
        setUserProfile({
          name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || data.user.username,
          level: 'Beginner',
          avatar: '👤',
          streak: 0
        });
        localStorage.setItem('token', data.token);
        onAuthClose();
        toast({ title: 'Registration successful!', description: 'Welcome to DebateSphere!', status: 'success', duration: 3000 });
      } else {
        toast({ title: 'Registration failed', description: data.message, status: 'error', duration: 5000 });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({ title: 'Registration failed', description: 'Network error. Please try again.', status: 'error', duration: 5000 });
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser({ username: 'guest_user', position: 'PRO' });
    setUserProfile({ name: 'Guest User', level: 'Beginner', avatar: '👤', streak: 0 });
    localStorage.removeItem('token');
    setCurrentView('dashboard');
    toast({ title: 'Logged out successfully', status: 'info', duration: 3000 });
  };

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token with backend
      fetch(`${process.env.REACT_APP_API_URL}/api/auth/verify`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      })
      .then(response => response.json())
      .then(data => {
        if (data.valid) {
          setIsAuthenticated(true);
          setCurrentUser({ username: data.user.username, position: 'PRO' });
          setUserProfile({
            name: `${data.user.firstName || ''} ${data.user.lastName || ''}`.trim() || data.user.username,
            level: data.user.stats?.debatesCompleted > 10 ? 'Advanced Debater' : 'Beginner',
            avatar: data.user.profilePicture || '👤',
            streak: data.user.stats?.currentStreak || 0
          });
        } else {
          localStorage.removeItem('token');
        }
      })
      .catch(() => {
        localStorage.removeItem('token');
      });
    }
  }, []);

  // Sidebar Navigation Component
  const Sidebar = () => (
    <Box
      bg="gray.900"
      color="white"
      w="280px"
      h="100vh"
      position="fixed"
      left={0}
      top={0}
      overflowY="auto"
      zIndex={1000}
      boxShadow="xl"
    >
      {/* Header */}
      <Flex align="center" justify="space-between" p={4} borderBottom="1px" borderColor="gray.700">
        <HStack spacing={2}>
          <Icons.Brain />
          <Heading size="md">DebateSphere</Heading>
        </HStack>
        <IconButton
          aria-label="Close sidebar"
          icon={<Icons.X />}
          size="sm"
          variant="ghost"
          color="white"
          onClick={onSidebarClose}
          display={{ base: 'flex', lg: 'none' }}
        />
      </Flex>

      {/* User Profile */}
      <Box p={4}>
        {isAuthenticated ? (
          <Flex align="center" gap={3} mb={4} p={3} bg="gray.800" borderRadius="lg">
            <Text fontSize="2xl">{userProfile.avatar}</Text>
            <Box flex={1}>
              <Text fontWeight="medium">{userProfile.name}</Text>
              <Text fontSize="xs" color="gray.400">{userProfile.level}</Text>
              <HStack spacing={1} mt={1}>
                <Icons.Zap />
                <Text fontSize="xs" color="yellow.400">{userProfile.streak} day streak</Text>
              </HStack>
            </Box>
            <Button
              size="xs"
              variant="ghost"
              color="gray.400"
              _hover={{ color: "white", bg: "gray.700" }}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Flex>
        ) : (
          <VStack spacing={2} mb={4}>
            <Button
              colorScheme="blue"
              size="sm"
              w="full"
              onClick={() => {
                setAuthMode('login');
                onAuthOpen();
              }}
            >
              Sign In
            </Button>
            <Button
              variant="outline"
              colorScheme="blue"
              size="sm"
              w="full"
              onClick={() => {
                setAuthMode('register');
                onAuthOpen();
              }}
            >
              Sign Up
            </Button>
          </VStack>
        )}

        {/* Navigation */}
        <VStack spacing={2} align="stretch">
          {[
            { icon: Icons.Home, label: "Dashboard", view: "dashboard" },
            { icon: Icons.MessageCircle, label: "Debate Arena", view: "debate" },
            { icon: Icons.TreePine, label: "Argument Mapper", view: "mapper" },
            { icon: Icons.BarChart3, label: "Analytics", view: "analytics" },
            { icon: Icons.Users, label: "Find Opponents", view: "opponents" },
            { icon: Icons.BookOpen, label: "Learning Center", view: "learning" },
            { icon: Icons.Settings, label: "Settings", view: "settings" }
          ].map(({ icon: IconComponent, label, view }) => (
            <Button
              key={view}
              leftIcon={<IconComponent />}
              onClick={() => {
                setCurrentView(view);
                onSidebarClose();
              }}
              variant={currentView === view ? 'solid' : 'ghost'}
              colorScheme={currentView === view ? 'blue' : 'gray'}
              justifyContent="flex-start"
              size="sm"
            >
              {label}
            </Button>
          ))}
        </VStack>

        {/* Rank Card */}
        <Box mt={6} p={3} bgGradient="linear(to-r, blue.600, purple.600)" borderRadius="lg">
          <HStack spacing={2} mb={2}>
            <Icons.Trophy />
            <Text fontSize="sm" fontWeight="medium">Rank: {userStats.rank}</Text>
          </HStack>
          <Text fontSize="xs" color="blue.100">{userStats.totalPoints} points</Text>
          <Progress value={73} colorScheme="yellow" size="sm" mt={2} />
        </Box>
      </Box>
    </Box>
  );

  // Dashboard Component
  const Dashboard = () => (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Heading size="lg" color="gray.800">Welcome back, {userProfile.name}!</Heading>
          <Text color="gray.600" mt={1}>Ready to sharpen your critical thinking skills?</Text>
        </Box>
        {isAuthenticated ? (
          <Button
            leftIcon={<Icons.Plus />}
            onClick={onNewDebateOpen}
            bgGradient="linear(to-r, blue.600, purple.600)"
            color="white"
            size="lg"
            _hover={{ bgGradient: "linear(to-r, blue.700, purple.700)" }}
          >
            Start New Debate
          </Button>
        ) : (
          <Button
            leftIcon={<Icons.User />}
            onClick={() => {
              setAuthMode('login');
              onAuthOpen();
            }}
            bgGradient="linear(to-r, blue.600, purple.600)"
            color="white"
            size="lg"
            _hover={{ bgGradient: "linear(to-r, blue.700, purple.700)" }}
          >
            Sign In to Start Debating
          </Button>
        )}
      </Flex>

      {/* Stats Cards */}
      <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }} gap={6} mb={6}>
        {[
          { icon: Icons.MessageCircle, title: "Debates Completed", value: userStats.debatesCompleted, change: "+3 this week", color: "blue" },
          { icon: Icons.Award, title: "Win Rate", value: `${userStats.winRate}%`, change: "+5% this month", color: "green" },
          { icon: Icons.TrendingUp, title: "Argument Strength", value: userStats.argumentStrength, change: "+0.3 this week", color: "purple" },
          { icon: Icons.Target, title: "Fallacies Avoided", value: userStats.fallaciesDetected, change: "+2 this week", color: "orange" }
        ].map(({ icon: IconComponent, title, value, change, color }, index) => (
          <Card key={index} bg="white" shadow="sm" _hover={{ shadow: "md" }} transition="all 0.2s">
            <CardBody>
              <Flex justify="space-between" align="center" mb={4}>
                <Box bg={`${color}.100`} p={3} borderRadius="lg">
                  <IconComponent />
                </Box>
                <Box textAlign="right">
                  <Text fontSize="2xl" fontWeight="bold" color="gray.800">{value}</Text>
                  <Text fontSize="sm" color="gray.600">{title}</Text>
                </Box>
              </Flex>
              <HStack spacing={1}>
                <Icons.TrendingUp />
                <Text fontSize="xs" color="green.600" fontWeight="medium">{change}</Text>
              </HStack>
            </CardBody>
          </Card>
        ))}
      </Grid>

      {/* Achievements and Recent Debates */}
      <Grid templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} gap={6}>
        <Card bg="white" shadow="sm">
          <CardHeader>
            <Heading size="md" color="gray.800">
              <HStack spacing={2}>
                <Icons.Star />
                <Text>Recent Achievements</Text>
              </HStack>
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={3}>
              {userStats.badges.map((badge, index) => (
                <Flex key={index} align="center" gap={3} p={3} bg="gradient-to-r from-yellow-50 to-orange-50" borderRadius="lg" w="full">
                  <Icons.Trophy />
                  <Text fontWeight="medium" color="gray.800">{badge}</Text>
                </Flex>
              ))}
            </VStack>
          </CardBody>
        </Card>

        <Card bg="white" shadow="sm">
          <CardHeader>
            <Heading size="md" color="gray.800">
              <HStack spacing={2}>
                <Icons.MessageCircle />
                <Text>Recent Debates</Text>
              </HStack>
            </Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={3}>
              {userStats.debateHistory.map((debate, index) => (
                <Flex key={index} align="center" gap={3} p={3} bg="gray.50" borderRadius="lg" w="full">
                  <Box p={2} borderRadius="lg" bg="green.100">
                    <Icons.Trophy />
                  </Box>
                  <Box flex={1}>
                    <Text fontSize="sm" fontWeight="medium" color="gray.800">{debate.topic}</Text>
                    <HStack spacing={4} mt={1}>
                      <Text fontSize="xs" color="gray.500">{debate.date}</Text>
                      <Badge colorScheme="green" size="sm">{debate.result.toUpperCase()}</Badge>
                      <Text fontSize="xs" color="gray.600">Score: {debate.score}</Text>
                    </HStack>
                  </Box>
                </Flex>
              ))}
            </VStack>
          </CardBody>
        </Card>
      </Grid>
    </Box>
  );

  // Debate Arena Component (keeping the existing functional one)
  const DebateArena = () => (
    <Card h="calc(100vh - 120px)" bg="white" shadow="sm" overflow="hidden">
      {/* Header */}
      <CardHeader bgGradient="linear(to-r, blue.600, purple.600)" color="white" p={4}>
        <Flex justify="space-between" align="center">
          <Box>
            <Heading size="md">
              <HStack spacing={2}>
                <Icons.MessageCircle />
                <Text>{selectedTopic || "Select a topic to start debating"}</Text>
              </HStack>
            </Heading>
            <Text fontSize="sm" opacity={0.9}>
              {debateActive ? `vs ${opponentType === 'ai' ? 'AI Opponent' : 'Human Opponent'}` : 'No active debate'}
            </Text>
          </Box>
          <HStack spacing={4}>
            {debateActive && (
              <Flex align="center" gap={2} bg="whiteAlpha.200" px={3} py={1} borderRadius="lg">
                <Icons.Timer />
                <Text fontFamily="mono">{formatTime(debateTimer)}</Text>
              </Flex>
            )}
            <IconButton
              aria-label="Toggle sound"
              icon={soundEnabled ? <Icons.Volume2 /> : <Icons.VolumeX />}
              onClick={() => setSoundEnabled(!soundEnabled)}
              variant="ghost"
              color="white"
              _hover={{ bg: "whiteAlpha.200" }}
            />
          </HStack>
        </Flex>
      </CardHeader>

      <Flex h="calc(100% - 80px)">
        {/* Messages Area */}
        <Box flex={1} display="flex" flexDirection="column">
          <Box flex={1} overflowY="auto" p={4} bg="gray.50">
            {messages.length === 0 ? (
              <Flex h="full" align="center" justify="center">
                <VStack textAlign="center">
                  <Icons.MessageCircle />
                  <Heading size="lg" color="gray.600" mb={2}>No active debate</Heading>
                  <Text color="gray.500" mb={4}>Start a new debate to begin practicing your argumentation skills</Text>
                  <Button onClick={onNewDebateOpen} colorScheme="blue">
                    Start Debate
                  </Button>
                </VStack>
              </Flex>
            ) : (
              <VStack spacing={4} align="stretch">
                {messages.map((message) => {
                  if (message.type === 'system') {
                    return (
                      <Flex key={message.id} justify="center">
                        <Badge colorScheme="blue" p={2} borderRadius="lg">
                          {message.text}
                        </Badge>
                      </Flex>
                    );
                  }

                  return (
                    <Flex key={message.id} justify={message.user === 'user' ? 'flex-end' : 'flex-start'}>
                      <Box
                        maxW="md"
                        bg={message.user === 'user' ? 'blue.600' : 'white'}
                        color={message.user === 'user' ? 'white' : 'gray.800'}
                        p={4}
                        borderRadius="2xl"
                        shadow="sm"
                        border={message.user !== 'user' ? '1px solid' : 'none'}
                        borderColor="gray.200"
                      >
                        <HStack spacing={2} mb={2}>
                          {message.user === 'user' ? <Icons.User /> : <Icons.Bot />}
                          <Text fontSize="xs" opacity={0.75} fontWeight="medium">
                            {message.user === 'user' ? 'You' : 'AI Opponent'}
                          </Text>
                          <Text fontSize="xs" opacity={0.5}>
                            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </Text>
                        </HStack>
                        <Text fontSize="sm">{message.text}</Text>
                        
                        <Flex justify="space-between" align="center" mt={3}>
                          {message.user === 'user' && (
                            <Button
                              size="xs"
                              onClick={() => getCoachFeedback(message.id)}
                              bg="whiteAlpha.200"
                              color="white"
                              _hover={{ bg: "whiteAlpha.300" }}
                              leftIcon={<Icons.Brain />}
                            >
                              Get Coach Feedback
                            </Button>
                          )}
                          
                          <HStack spacing={1} ml="auto">
                            <IconButton
                              aria-label="Like"
                              icon={<Icons.ThumbsUp />}
                              size="xs"
                              variant="ghost"
                              _hover={{ bg: "blackAlpha.100" }}
                            />
                            <IconButton
                              aria-label="Dislike"
                              icon={<Icons.ThumbsDown />}
                              size="xs"
                              variant="ghost"
                              _hover={{ bg: "blackAlpha.100" }}
                            />
                          </HStack>
                        </Flex>
                      </Box>
                    </Flex>
                  );
                })}
                
                {isTyping && (
                  <Flex justify="flex-start">
                    <Box bg="white" border="1px solid" borderColor="gray.200" p={4} borderRadius="2xl" shadow="sm" maxW="xs">
                      <HStack spacing={2} mb={2}>
                        <Icons.Bot />
                        <Text fontSize="xs" opacity={0.75} fontWeight="medium">AI Opponent</Text>
                      </HStack>
                      <HStack spacing={1}>
                        <Spinner size="sm" />
                        <Text fontSize="sm">Typing...</Text>
                      </HStack>
                    </Box>
                  </Flex>
                )}
                <div ref={messagesEndRef} />
              </VStack>
            )}
          </Box>
          
          {/* Input Area */}
          {(debateActive || messages.length > 0) && (
            <Box borderTop="1px solid" borderColor="gray.200" p={4} bg="white">
              <HStack spacing={2}>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder="Type your argument here..."
                  flex={1}
                  size="lg"
                  focusBorderColor="blue.500"
                />
                <Button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  colorScheme="blue"
                  size="lg"
                  rightIcon={<Icons.Send />}
                >
                  Send
                </Button>
              </HStack>
            </Box>
          )}
        </Box>
        
        {/* Coach Feedback Panel */}
        {showCoachFeedback && (
          <Box w="320px" bg="white" borderLeft="1px solid" borderColor="gray.200" shadow="xl" p={6} overflowY="auto">
            <Flex justify="space-between" align="center" mb={6}>
              <Heading size="md" color="gray.800">
                <HStack spacing={2}>
                  <Icons.Brain />
                  <Text>AI Coach Feedback</Text>
                </HStack>
              </Heading>
              <IconButton
                aria-label="Close feedback"
                icon={<Icons.X />}
                onClick={() => setShowCoachFeedback(null)}
                size="sm"
                variant="ghost"
              />
            </Flex>
            
            <VStack spacing={6} align="stretch">
              <Box borderLeft="4px solid" borderColor="yellow.400" bg="yellow.50" pl={4} py={3}>
                <HStack spacing={2} mb={2}>
                  <Icons.AlertTriangle />
                  <Text fontWeight="medium" color="yellow.800">{showCoachFeedback.feedback.fallacyType} Detected</Text>
                </HStack>
                <Text fontSize="sm" color="yellow.700">{showCoachFeedback.feedback.explanation}</Text>
              </Box>
              
              <Box>
                <Heading size="sm" color="gray.800" mb={3}>
                  <HStack spacing={2}>
                    <Icons.CheckCircle />
                    <Text>Suggestions for Improvement:</Text>
                  </HStack>
                </Heading>
                <VStack spacing={2} align="stretch">
                  {showCoachFeedback.feedback.suggestions.map((suggestion: string, index: number) => (
                    <Flex key={index} align="flex-start" gap={2} p={2} bg="green.50" borderRadius="lg">
                      <Box w="1.5" h="1.5" bg="green.500" borderRadius="full" mt={2} flexShrink={0} />
                      <Text fontSize="sm" color="gray.600">{suggestion}</Text>
                    </Flex>
                  ))}
                </VStack>
              </Box>
              
              <Box borderTop="1px solid" borderColor="gray.200" pt={4}>
                <Flex justify="space-between" align="center" fontSize="sm">
                  <Text color="gray.500">Confidence: {Math.round(showCoachFeedback.feedback.confidence * 100)}%</Text>
                  <HStack spacing={2}>
                    <Button 
                      size="xs" 
                      variant="ghost" 
                      colorScheme="green"
                      leftIcon={<Icons.ThumbsUp />}
                      onClick={() => toast({ title: 'Feedback marked as helpful!', status: 'success' })}
                    >
                      Helpful
                    </Button>
                    <Button 
                      size="xs" 
                      variant="ghost" 
                      colorScheme="red"
                      leftIcon={<Icons.ThumbsDown />}
                      onClick={() => toast({ title: 'Feedback marked as not helpful', status: 'info' })}
                    >
                      Not helpful
                    </Button>
                  </HStack>
                </Flex>
              </Box>
            </VStack>
          </Box>
        )}
      </Flex>
    </Card>
  );

  // Settings Component
  const Settings = () => (
    <Box>
      <Box mb={6}>
        <Heading size="lg" color="gray.800">Settings</Heading>
        <Text color="gray.600" mt={1}>Customize your DebateSphere experience</Text>
      </Box>

      <VStack spacing={6} align="stretch">
        <Card bg="white" shadow="sm">
          <CardHeader>
            <HStack spacing={3}>
              <Icons.Bell />
              <Box>
                <Heading size="md" color="gray.800">Notifications</Heading>
                <Text fontSize="sm" color="gray.600">Manage when and how you receive notifications</Text>
              </Box>
            </HStack>
          </CardHeader>
          <CardBody>
            <VStack spacing={4} align="stretch">
              {[
                { key: 'debates', label: 'Debate invitations', description: 'Get notified when someone challenges you' },
                { key: 'messages', label: 'New messages', description: 'Receive notifications for new debate messages' },
                { key: 'achievements', label: 'Achievements', description: 'Get notified when you earn badges' }
              ].map(({ key, label, description }) => (
                <FormControl key={key} display="flex" alignItems="center" justifyContent="space-between">
                  <Box flex={1}>
                    <FormLabel fontWeight="medium" color="gray.800" mb={0}>{label}</FormLabel>
                    <Text fontSize="sm" color="gray.600">{description}</Text>
                  </Box>
                  <Switch 
                    colorScheme="blue" 
                    defaultChecked={true}
                    onChange={(e) => toast({ title: `${label} setting updated!`, status: 'success' })}
                  />
                </FormControl>
              ))}
            </VStack>
          </CardBody>
        </Card>

        <Card bg="white" shadow="sm">
          <CardHeader>
            <HStack spacing={3}>
              <Icons.Shield />
              <Box>
                <Heading size="md" color="gray.800">Privacy & Security</Heading>
                <Text fontSize="sm" color="gray.600">Control who can see your information</Text>
              </Box>
            </HStack>
          </CardHeader>
          <CardBody>
            <FormControl display="flex" alignItems="center" justifyContent="space-between">
              <Box flex={1}>
                <FormLabel fontWeight="medium" color="gray.800" mb={0}>Profile visibility</FormLabel>
                <Text fontSize="sm" color="gray.600">Who can view your profile and statistics</Text>
              </Box>
              <Select maxW="150px" defaultValue="public" size="sm">
                <option value="public">Public</option>
                <option value="friends">Friends only</option>
                <option value="private">Private</option>
              </Select>
            </FormControl>
          </CardBody>
        </Card>
      </VStack>
    </Box>
  );

  // Authentication Modal
  const AuthModal = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');

    const handleSubmit = () => {
      if (authMode === 'login') {
        if (!email || !password) {
          toast({ title: 'Please fill in all fields', status: 'error', duration: 3000 });
          return;
        }
        handleLogin(email, password);
      } else {
        if (!email || !password || !confirmPassword || !username) {
          toast({ title: 'Please fill in all required fields', status: 'error', duration: 3000 });
          return;
        }
        if (password !== confirmPassword) {
          toast({ title: 'Passwords do not match', status: 'error', duration: 3000 });
          return;
        }
        handleRegister({
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
      <Modal isOpen={isAuthOpen} onClose={onAuthClose} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {authMode === 'login' ? 'Sign In to DebateSphere' : 'Create Your Account'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              {authMode === 'register' && (
                <>
                  <HStack spacing={3}>
                    <FormControl>
                      <FormLabel>First Name</FormLabel>
                      <Input
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter first name"
                      />
                    </FormControl>
                    <FormControl>
                      <FormLabel>Last Name</FormLabel>
                      <Input
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter last name"
                      />
                    </FormControl>
                  </HStack>
                  <FormControl isRequired>
                    <FormLabel>Username</FormLabel>
                    <Input
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Choose a username"
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
                />
              </FormControl>
              
              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </FormControl>
              
              {authMode === 'register' && (
                <FormControl isRequired>
                  <FormLabel>Confirm Password</FormLabel>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                  />
                </FormControl>
              )}
              
              <Button
                colorScheme="blue"
                onClick={handleSubmit}
                isLoading={authLoading}
                loadingText={authMode === 'login' ? 'Signing In...' : 'Creating Account...'}
                size="lg"
                w="full"
              >
                {authMode === 'login' ? 'Sign In' : 'Create Account'}
              </Button>
              
              <Text textAlign="center" fontSize="sm" color="gray.600">
                {authMode === 'login' ? "Don't have an account? " : "Already have an account? "}
                <Button
                  variant="link"
                  colorScheme="blue"
                  size="sm"
                  onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
                >
                  {authMode === 'login' ? 'Sign Up' : 'Sign In'}
                </Button>
              </Text>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  };

  // New Debate Modal
  const NewDebateModal = () => (
    <Modal isOpen={isNewDebateOpen} onClose={onNewDebateClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Start New Debate</ModalHeader>
        <ModalCloseButton />
        <ModalBody pb={6}>
          <VStack spacing={4} align="stretch">
            <FormControl>
              <FormLabel>Select Topic</FormLabel>
              <Select placeholder="Choose a debate topic" onChange={(e) => setSelectedTopic(e.target.value)}>
                {debateTopics.map((topic, index) => (
                  <option key={index} value={topic}>{topic}</option>
                ))}
              </Select>
            </FormControl>
            
            <FormControl>
              <FormLabel>Opponent Type</FormLabel>
              <Select value={opponentType} onChange={(e) => setOpponentType(e.target.value)}>
                <option value="ai">AI Opponent</option>
                <option value="human">Human Opponent</option>
              </Select>
            </FormControl>
            
            <HStack spacing={3} pt={4}>
              <Button 
                colorScheme="blue" 
                flex={1} 
                onClick={() => selectedTopic && startNewDebate(selectedTopic, opponentType)}
                disabled={!isAuthenticated}
              >
                Start Debate
              </Button>
              <Button variant="ghost" onClick={onNewDebateClose}>
                Cancel
              </Button>
            </HStack>
            
            {!isAuthenticated && (
              <Text fontSize="sm" color="orange.500" textAlign="center">
                Please sign in to start a debate
              </Text>
            )}
          </VStack>
        </ModalBody>
      </ModalContent>
    </Modal>
  );

  // Placeholder components for other views
  const PlaceholderView = ({ title, description }: { title: string; description: string }) => (
    <Card bg="white" shadow="sm" p={8}>
      <VStack spacing={4} textAlign="center">
        <Heading size="lg" color="gray.600">{title}</Heading>
        <Text color="gray.500">{description}</Text>
        <Button colorScheme="blue" variant="outline">Coming Soon</Button>
      </VStack>
    </Card>
  );

  // Main render
  return (
    <ChakraProvider>
      <Flex h="100vh" bg="gray.50">
        {/* Sidebar - Hidden on mobile, always visible on desktop */}
        <Box display={{ base: 'none', lg: 'block' }}>
          <Sidebar />
        </Box>

        {/* Mobile Sidebar Drawer */}
        <Drawer isOpen={isSidebarOpen} placement="left" onClose={onSidebarClose} size="sm">
          <DrawerOverlay />
          <DrawerContent>
            <Sidebar />
          </DrawerContent>
        </Drawer>

        {/* Main Content */}
        <Box flex={1} ml={{ base: 0, lg: '280px' }} overflow="hidden">
          {/* Mobile Header */}
          <Flex
            display={{ base: 'flex', lg: 'none' }}
            bg="white"
            borderBottom="1px"
            borderColor="gray.200"
            px={4}
            py={3}
            align="center"
            justify="space-between"
          >
            <IconButton
              aria-label="Open menu"
              icon={<Icons.Menu />}
              onClick={onSidebarOpen}
              variant="ghost"
            />
            <Heading size="md" color="gray.800">DebateSphere</Heading>
            <Box w={6} />
          </Flex>

          {/* Main Content Area */}
          <Box p={6} h={{ base: 'calc(100vh - 60px)', lg: '100vh' }} overflowY="auto">
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'debate' && <DebateArena />}
            {currentView === 'mapper' && <PlaceholderView title="Argument Mapper" description="Visual argument mapping coming soon" />}
            {currentView === 'analytics' && <PlaceholderView title="Analytics" description="Detailed performance analytics coming soon" />}
            {currentView === 'opponents' && <PlaceholderView title="Find Opponents" description="Opponent matching system coming soon" />}
            {currentView === 'learning' && <PlaceholderView title="Learning Center" description="Educational resources coming soon" />}
            {currentView === 'settings' && <Settings />}
          </Box>
        </Box>

        {/* Modals */}
        <AuthModal />
        <NewDebateModal />
      </Flex>
    </ChakraProvider>
  );
};

export default DebateSphere;
