import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Flex,
  VStack,
  HStack,
  Text,
  Button,
  Avatar,
  Heading,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Grid,
  GridItem,
  Badge,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  FormControl,
  FormLabel,
  Select,
  useToast,
  Container,
  Divider,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Progress,
  Input,
  InputGroup,
  InputLeftElement,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import { io, Socket } from 'socket.io-client';

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

interface Message {
  id: number;
  user: string;
  text: string;
  timestamp: Date;
  type: 'system' | 'user' | 'opponent';
  position?: 'PRO' | 'CON';
}

interface DashboardProps {
  user: User;
  userProfile: UserProfile;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, userProfile, onLogout }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [participants, setParticipants] = useState<any[]>([]);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [opponentType, setOpponentType] = useState('ai');
  const [currentView, setCurrentView] = useState('dashboard');
  
  const { isOpen: isNewDebateOpen, onOpen: onNewDebateOpen, onClose: onNewDebateClose } = useDisclosure();
  const toast = useToast();

  const debateTopics = [
    'Artificial Intelligence should be regulated',
    'Remote work is better than office work',
    'Social media does more harm than good',
    'Nuclear energy is the future',
    'Universal Basic Income should be implemented',
    'Climate change action vs Economic growth',
    'Privacy vs Security in digital age',
    'Traditional education vs Online learning'
  ];

  const mockStats = {
    totalDebates: 42,
    debatesWon: 28,
    winRate: 67,
    averageScore: 8.4,
    currentStreak: 5,
    recentDebates: [
      { date: '2025-08-22', topic: 'AI Regulation', result: 'won', score: 8.9 },
      { date: '2025-08-21', topic: 'Remote Work', result: 'lost', score: 7.8 },
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
        username: user.username,
        position: user.position
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
  }, [user, loadInitialMessages]);

  const sendMessage = () => {
    if (inputMessage.trim() && socket) {
      const messageData = {
        debateId: 'default_debate',
        message: inputMessage,
        username: user.username,
        position: user.position,
        timestamp: new Date()
      };
      
      console.log('Sending message:', messageData);
      socket.emit('debate_message', messageData);
      
      setMessages(prev => [...prev, {
        id: Date.now(),
        user: user.username,
        text: inputMessage,
        timestamp: new Date(),
        type: 'user',
        position: user.position
      }]);
      
      setInputMessage('');
    }
  };

  const startNewDebate = (topic: string, opponent: string) => {
    toast({
      title: 'New Debate Started!',
      description: `Debate on "${topic}" with ${opponent} opponent`,
      status: 'success',
      duration: 3000
    });
    onNewDebateClose();
    setCurrentView('arena');
  };

  const Sidebar = () => (
    <Box w="300px" bg="white" borderRight="1px" borderColor="gray.200" h="100vh" p={6}>
      <VStack spacing={6} align="stretch">
        {/* Logo */}
        <HStack spacing={3}>
          <Box fontSize="2xl">🏛️</Box>
          <Heading size="md" color="blue.600">DebateSphere</Heading>
        </HStack>

        <Divider />

        {/* User Profile */}
        <VStack spacing={3}>
          <Avatar size="lg" name={userProfile.name} src={userProfile.avatar} />
          <VStack spacing={1}>
            <Text fontWeight="bold" fontSize="lg">{userProfile.name}</Text>
            <Badge colorScheme="blue">{userProfile.level}</Badge>
            <Text fontSize="sm" color="gray.600">🔥 {userProfile.streak} day streak</Text>
          </VStack>
        </VStack>

        <Divider />

        {/* Navigation */}
        <VStack spacing={2} align="stretch">
          <Button
            variant={currentView === 'dashboard' ? 'solid' : 'ghost'}
            colorScheme="blue"
            justifyContent="start"
            onClick={() => setCurrentView('dashboard')}
          >
            📊 Dashboard
          </Button>
          <Button
            variant={currentView === 'arena' ? 'solid' : 'ghost'}
            colorScheme="blue"
            justifyContent="start"
            onClick={() => setCurrentView('arena')}
          >
            🏟️ Debate Arena
          </Button>
          <Button
            variant="ghost"
            colorScheme="blue"
            justifyContent="start"
            onClick={onNewDebateOpen}
          >
            ➕ New Debate
          </Button>
        </VStack>

        <Divider />

        {/* Connection Status */}
        <HStack>
          <Box w={3} h={3} borderRadius="full" bg={isConnected ? 'green.400' : 'red.400'} />
          <Text fontSize="sm" color="gray.600">
            {isConnected ? 'Connected' : 'Disconnected'}
          </Text>
        </HStack>

        {/* Logout */}
        <Button variant="ghost" colorScheme="red" onClick={onLogout}>
          🚪 Logout
        </Button>
      </VStack>
    </Box>
  );

  const DashboardView = () => (
    <Container maxW="6xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="lg">Welcome back, {userProfile.name}!</Heading>
        
        {/* Stats Grid */}
        <Grid templateColumns="repeat(4, 1fr)" gap={6}>
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Total Debates</StatLabel>
                <StatNumber>{mockStats.totalDebates}</StatNumber>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Debates Won</StatLabel>
                <StatNumber>{mockStats.debatesWon}</StatNumber>
                <StatHelpText>Win Rate: {mockStats.winRate}%</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Average Score</StatLabel>
                <StatNumber>{mockStats.averageScore}</StatNumber>
                <StatHelpText>Out of 10</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
          
          <Card>
            <CardBody>
              <Stat>
                <StatLabel>Current Streak</StatLabel>
                <StatNumber>{mockStats.currentStreak}</StatNumber>
                <StatHelpText>Days</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </Grid>

        {/* Progress Bar */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold">Progress to Next Level</Text>
              <Progress value={72} colorScheme="blue" size="lg" />
              <Text fontSize="sm" color="gray.600">72% to Advanced Level</Text>
            </VStack>
          </CardBody>
        </Card>

        {/* Recent Debates */}
        <Card>
          <CardBody>
            <VStack spacing={4} align="stretch">
              <Heading size="md">Recent Debates</Heading>
              {mockStats.recentDebates.map((debate, index) => (
                <HStack key={index} justify="space-between" p={3} bg="gray.50" borderRadius="md">
                  <VStack align="start" spacing={1}>
                    <Text fontWeight="medium">{debate.topic}</Text>
                    <Text fontSize="sm" color="gray.600">{debate.date}</Text>
                  </VStack>
                  <HStack spacing={3}>
                    <Badge colorScheme={debate.result === 'won' ? 'green' : 'red'}>
                      {debate.result.toUpperCase()}
                    </Badge>
                    <Text fontWeight="bold">⭐ {debate.score}</Text>
                  </HStack>
                </HStack>
              ))}
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );

  const ArenaView = () => (
    <Flex h="100%" direction="column">
      <Box p={4} bg="white" borderBottom="1px" borderColor="gray.200">
        <Heading size="md">Debate Arena</Heading>
        <Text color="gray.600">Current topic: AI Regulation</Text>
      </Box>
      
      <Flex flex={1}>
        {/* Messages */}
        <Box flex={1} p={4} overflowY="auto">
          <VStack spacing={4} align="stretch">
            {messages.map((message, index) => (
              <Box
                key={index}
                p={3}
                bg={message.type === 'user' ? 'blue.50' : message.type === 'system' ? 'gray.50' : 'orange.50'}
                borderRadius="md"
                alignSelf={message.type === 'user' ? 'flex-end' : 'flex-start'}
                maxW="70%"
              >
                <Text fontSize="sm" color="gray.600" mb={1}>
                  {message.user} {message.position && `(${message.position})`}
                </Text>
                <Text>{message.text}</Text>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  {message.timestamp.toLocaleTimeString()}
                </Text>
              </Box>
            ))}
          </VStack>
        </Box>

        {/* Participants Panel */}
        <Box w="250px" bg="gray.50" p={4} borderLeft="1px" borderColor="gray.200">
          <VStack spacing={4} align="stretch">
            <Heading size="sm">Participants</Heading>
            <Text fontSize="sm" color="gray.600">Online: {participants.length}</Text>
          </VStack>
        </Box>
      </Flex>

      {/* Input */}
      <Box p={4} bg="white" borderTop="1px" borderColor="gray.200">
        <HStack spacing={3}>
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your argument..."
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button colorScheme="blue" onClick={sendMessage} disabled={!isConnected}>
            Send
          </Button>
        </HStack>
      </Box>
    </Flex>
  );

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
  );

  return (
    <Flex h="100vh" bg="gray.50">
      <Sidebar />
      <Box flex={1}>
        {currentView === 'dashboard' ? <DashboardView /> : <ArenaView />}
      </Box>
      <NewDebateModal />
    </Flex>
  );
};

export default Dashboard;
