import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Container,
  Flex,
  VStack,
  HStack,
  Heading,
  Text,
  Input,
  Button,
  Alert,
  AlertIcon,
  Badge,
  Avatar,
  Divider,
  Textarea,
  Select,
  useToast
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

interface User {
  id: string;
  username: string;
  profilePicture?: string;
}

interface Message {
  _id: string;
  text: string;
  user: User;
  position: 'pro' | 'con';
  type: string;
  orderInDebate: number;
  createdAt: string;
}

interface Debate {
  _id: string;
  topic: string;
  description?: string;
  status: 'waiting' | 'active' | 'finished' | 'cancelled';
  participants: Array<{
    user: User;
    position: 'pro' | 'con';
    joinedAt: string;
  }>;
  settings: {
    timeLimit: number;
    turnTimeLimit: number;
    allowSpectators: boolean;
  };
}

const DebateArena: React.FC = () => {
  const { id: debateId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();

  const [socket, setSocket] = useState<Socket | null>(null);
  const [debate, setDebate] = useState<Debate | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState('opening');
  const [isConnected, setIsConnected] = useState(false);
  const [userRole, setUserRole] = useState<'participant' | 'spectator' | null>(null);
  const [userPosition, setUserPosition] = useState<'pro' | 'con' | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!debateId) {
      navigate('/dashboard');
      return;
    }

    // Initialize socket connection
    initializeSocket();
    fetchDebateDetails();

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [debateId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const initializeSocket = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const newSocket = io(`${process.env.REACT_APP_API_URL}`, {
      auth: {
        token: token
      }
    });

    newSocket.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
      
      // Join the debate room
      newSocket.emit('join_debate', { debateId });
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to connect to real-time server',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    });

    // Debate events
    newSocket.on('debate_joined', (data) => {
      console.log('Joined debate:', data);
      setDebate(data.debate);
      setOnlineUsers([...data.participants, ...data.spectators]);
    });

    newSocket.on('new_message', (data) => {
      setMessages(prev => [...prev, data.argument]);
    });

    newSocket.on('message_history', (data) => {
      setMessages(data.arguments);
    });

    newSocket.on('user_joined_debate', (data) => {
      toast({
        title: 'User Joined',
        description: `${data.user.username} joined as ${data.user.type}`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    });

    newSocket.on('user_left_debate', (data) => {
      toast({
        title: 'User Left',
        description: `${data.user.username} left the debate`,
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
    });

    newSocket.on('debate_started', (data) => {
      setDebate(data.debate);
      toast({
        title: 'Debate Started!',
        description: `Started by ${data.startedBy}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    });

    newSocket.on('user_typing', (data) => {
      setTypingUsers(prev => {
        const newSet = new Set(prev);
        if (data.isTyping) {
          newSet.add(data.user.username);
        } else {
          newSet.delete(data.user.username);
        }
        return newSet;
      });
    });

    newSocket.on('error', (error) => {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    });

    setSocket(newSocket);
  };

  const fetchDebateDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/debates/${debateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setDebate(data.data.debate);
        setMessages(data.data.recentArguments || []);
        setUserRole(data.data.userRole);
        
        // Determine user position if participant
        if (data.data.userRole === 'participant') {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          const participant = data.data.debate.participants.find(
            (p: any) => p.user._id === user._id
          );
          setUserPosition(participant?.position || null);
        }
      } else {
        setError(data.message || 'Failed to load debate');
      }
    } catch (err) {
      setError('Network error. Please check your connection.');
      console.error('Fetch debate error:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = () => {
    if (!socket || !newMessage.trim()) return;

    if (userRole !== 'participant') {
      toast({
        title: 'Access Denied',
        description: 'Only participants can send messages',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    socket.emit('send_message', {
      debateId: debateId,
      text: newMessage.trim(),
      type: messageType
    });

    setNewMessage('');
    stopTyping();
  };

  const startTyping = () => {
    if (socket && userRole === 'participant') {
      socket.emit('typing_start', { debateId });
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set new timeout to stop typing
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 3000);
    }
  };

  const stopTyping = () => {
    if (socket) {
      socket.emit('typing_stop', { debateId });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  };

  const startDebate = () => {
    if (socket) {
      socket.emit('start_debate', { debateId });
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <Container maxW="6xl" py={8}>
        <Text>Loading debate arena...</Text>
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

  if (!debate) {
    return (
      <Container maxW="6xl" py={8}>
        <Alert status="warning" borderRadius="md">
          <AlertIcon />
          Debate not found
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="8xl" py={4} height="100vh">
      <VStack spacing={4} height="100%">
        {/* Header */}
        <Box
          w="100%"
          bg="white"
          p={4}
          borderRadius="lg"
          boxShadow="md"
          border="1px"
          borderColor="gray.200"
        >
          <Flex justify="space-between" align="center">
            <Box>
              <Heading as="h1" size="lg" color="blue.600">
                {debate.topic}
              </Heading>
              <HStack spacing={3} mt={2}>
                <Badge 
                  colorScheme={debate.status === 'active' ? 'green' : debate.status === 'waiting' ? 'yellow' : 'gray'}
                  variant="solid"
                >
                  {debate.status.toUpperCase()}
                </Badge>
                <Badge colorScheme="blue" variant="outline">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Badge>
                {userRole && (
                  <Badge colorScheme="purple" variant="outline">
                    {userRole} {userPosition && `(${userPosition})`}
                  </Badge>
                )}
              </HStack>
            </Box>
            
            <HStack spacing={2}>
              {debate.status === 'waiting' && userRole === 'participant' && (
                <Button colorScheme="green" onClick={startDebate}>
                  Start Debate
                </Button>
              )}
              <Button variant="outline" onClick={() => navigate('/dashboard')}>
                Leave Debate
              </Button>
            </HStack>
          </Flex>
        </Box>

        {/* Main Content */}
        <Flex w="100%" flex="1" gap={4}>
          {/* Participants Panel */}
          <Box
            w="250px"
            bg="white"
            borderRadius="lg"
            boxShadow="md"
            border="1px"
            borderColor="gray.200"
            p={4}
          >
            <Heading as="h3" size="sm" mb={3}>
              Participants
            </Heading>
            <VStack spacing={2} align="stretch">
              {debate.participants.map((participant, index) => (
                <Flex key={index} align="center" p={2} bg="gray.50" borderRadius="md">
                  <Avatar
                    name={participant.user.username}
                    size="sm"
                    mr={2}
                  />
                  <Box>
                    <Text fontSize="sm" fontWeight="medium">
                      {participant.user.username}
                    </Text>
                    <Badge size="xs" colorScheme={participant.position === 'pro' ? 'green' : 'red'}>
                      {participant.position}
                    </Badge>
                  </Box>
                </Flex>
              ))}
            </VStack>

            {typingUsers.size > 0 && (
              <>
                <Divider my={3} />
                <Box>
                  <Text fontSize="xs" color="gray.600" mb={1}>
                    Typing:
                  </Text>
                  {Array.from(typingUsers).map(username => (
                    <Text key={username} fontSize="xs" color="blue.500">
                      {username}...
                    </Text>
                  ))}
                </Box>
              </>
            )}
          </Box>

          {/* Messages Panel */}
          <Box
            flex="1"
            bg="white"
            borderRadius="lg"
            boxShadow="md"
            border="1px"
            borderColor="gray.200"
            display="flex"
            flexDirection="column"
          >
            {/* Messages Display */}
            <Box
              flex="1"
              p={4}
              overflowY="auto"
              maxHeight="calc(100vh - 300px)"
            >
              <VStack spacing={3} align="stretch">
                {messages.map((message) => (
                  <Box
                    key={message._id}
                    p={3}
                    bg={message.position === 'pro' ? 'green.50' : 'red.50'}
                    borderRadius="md"
                    borderLeft="4px"
                    borderColor={message.position === 'pro' ? 'green.400' : 'red.400'}
                  >
                    <Flex justify="space-between" align="center" mb={2}>
                      <HStack>
                        <Avatar name={message.user.username} size="xs" />
                        <Text fontSize="sm" fontWeight="medium">
                          {message.user.username}
                        </Text>
                        <Badge
                          size="xs"
                          colorScheme={message.position === 'pro' ? 'green' : 'red'}
                        >
                          {message.position}
                        </Badge>
                        <Badge size="xs" variant="outline">
                          {message.type}
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color="gray.500">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </Text>
                    </Flex>
                    <Text>{message.text}</Text>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </VStack>
            </Box>

            {/* Message Input */}
            {userRole === 'participant' && debate.status === 'active' && (
              <Box p={4} borderTop="1px" borderColor="gray.200">
                <VStack spacing={2}>
                  <HStack w="100%">
                    <Select
                      value={messageType}
                      onChange={(e) => setMessageType(e.target.value)}
                      w="200px"
                      size="sm"
                    >
                      <option value="opening">Opening</option>
                      <option value="rebuttal">Rebuttal</option>
                      <option value="counter-rebuttal">Counter-Rebuttal</option>
                      <option value="closing">Closing</option>
                      <option value="clarification">Clarification</option>
                    </Select>
                  </HStack>
                  <HStack w="100%">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        startTyping();
                      }}
                      onBlur={stopTyping}
                      placeholder="Type your argument here..."
                      resize="none"
                      rows={2}
                    />
                    <Button
                      colorScheme="blue"
                      onClick={sendMessage}
                      isDisabled={!newMessage.trim()}
                    >
                      Send
                    </Button>
                  </HStack>
                </VStack>
              </Box>
            )}

            {userRole === 'spectator' && (
              <Box p={4} borderTop="1px" borderColor="gray.200" textAlign="center">
                <Text color="gray.600" fontSize="sm">
                  You are watching this debate as a spectator
                </Text>
              </Box>
            )}

            {debate.status === 'waiting' && (
              <Box p={4} borderTop="1px" borderColor="gray.200" textAlign="center">
                <Text color="gray.600" fontSize="sm">
                  Waiting for debate to start...
                </Text>
              </Box>
            )}
          </Box>
        </Flex>
      </VStack>
    </Container>
  );
};

export default DebateArena;
