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
  useToast,
  IconButton,
  Tooltip,
  Grid,
  GridItem,
  Card,
  CardHeader,
  CardBody,
  useColorModeValue
} from '@chakra-ui/react';
import { 
  FiSend, 
  FiUsers, 
  FiMessageCircle, 
  FiClock, 
  FiPlay, 
  FiPause,
  FiSettings,
  FiLogOut,
  FiMic,
  FiMicOff
} from 'react-icons/fi';
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
  timestamp?: Date;
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
  currentTurn?: string;
  turnCount: number;
}

const DebateArenaComplete: React.FC = () => {
  // Demo data for Week 4 UI showcase
  const [socket, setSocket] = useState<Socket | null>(null);
  const [debate, setDebate] = useState<Debate>({
    _id: '68c040a6e00955c630a41c26',
    topic: 'Should AI replace human teachers in education?',
    description: 'A structured debate exploring the potential benefits and drawbacks of AI-powered education systems.',
    status: 'active',
    participants: [
      {
        user: { id: '1', username: 'debater_pro' },
        position: 'pro',
        joinedAt: new Date().toISOString()
      },
      {
        user: { id: '2', username: 'debater_con' },
        position: 'con', 
        joinedAt: new Date().toISOString()
      }
    ],
    settings: {
      timeLimit: 30,
      turnTimeLimit: 60,
      allowSpectators: true
    },
    turnCount: 3
  });

  const [messages, setMessages] = useState<Message[]>([
    {
      _id: '1',
      text: 'AI can provide personalized learning experiences at scale, adapting to each student\'s pace and learning style in ways human teachers cannot match.',
      user: { id: '1', username: 'debater_pro' },
      position: 'pro',
      type: 'opening',
      orderInDebate: 1,
      createdAt: new Date(Date.now() - 300000).toISOString()
    },
    {
      _id: '2', 
      text: 'While AI may offer personalization, it lacks the emotional intelligence and human connection that are crucial for effective teaching and student development.',
      user: { id: '2', username: 'debater_con' },
      position: 'con',
      type: 'rebuttal',
      orderInDebate: 2,
      createdAt: new Date(Date.now() - 180000).toISOString()
    },
    {
      _id: '3',
      text: 'AI systems can be available 24/7, providing consistent support and reducing educational inequality by making high-quality instruction accessible to all students regardless of location or economic status.',
      user: { id: '1', username: 'debater_pro' },
      position: 'pro',
      type: 'counter-rebuttal',
      orderInDebate: 3,
      createdAt: new Date(Date.now() - 60000).toISOString()
    }
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState('rebuttal');
  const [isConnected, setIsConnected] = useState(false);
  const [userRole] = useState<'participant' | 'spectator'>('participant');
  const [userPosition] = useState<'pro' | 'con'>('con');
  const [onlineUsers] = useState<string[]>(['debater_pro', 'debater_con', 'spectator1']);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState(1245); // 20:45 remaining
  const [turnTimeLeft, setTurnTimeLeft] = useState(45); // 45 seconds for current turn

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Color theme
  const bgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
      setTurnTimeLeft(prev => {
        if (prev <= 1) {
          return 60; // Reset turn timer
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Message = {
      _id: Date.now().toString(),
      text: newMessage.trim(),
      user: { id: '2', username: 'debater_con' },
      position: userPosition,
      type: messageType,
      orderInDebate: messages.length + 1,
      createdAt: new Date().toISOString(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');

    toast({
      title: 'Message Sent',
      description: 'Your argument has been added to the debate.',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const connectSocket = () => {
    setIsConnected(true);
    toast({
      title: 'Connected',
      description: 'Connected to real-time debate session!',
      status: 'success',
      duration: 3000,
      isClosable: true,
    });

    // Simulate typing indicator
    setTimeout(() => {
      setTypingUsers(new Set(['debater_pro']));
      setTimeout(() => setTypingUsers(new Set()), 3000);
    }, 5000);
  };

  const startTyping = () => {
    // Simulate typing indicator for other users
  };

  return (
    <Box minH="100vh" bg={bgColor}>
      <Container maxW="100%" p={0}>
        <Grid templateRows="auto 1fr" templateColumns="300px 1fr 300px" h="100vh">
          {/* Left Sidebar - Participants & Info */}
          <GridItem bg={cardBg} borderRight="1px" borderColor={borderColor} p={4}>
            <VStack spacing={4} align="stretch" h="100%">
              {/* Debate Info */}
              <Box>
                <Heading as="h3" size="sm" mb={2} color="blue.600">
                  Debate Info
                </Heading>
                <VStack align="stretch" spacing={2}>
                  <HStack justify="space-between">
                    <Text fontSize="xs" color="gray.600">Status:</Text>
                    <Badge colorScheme="green" size="sm">{debate.status.toUpperCase()}</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="xs" color="gray.600">Time Left:</Text>
                    <Text fontSize="sm" fontWeight="bold" color={timeLeft < 300 ? 'red.500' : 'green.500'}>
                      {formatTime(timeLeft)}
                    </Text>
                  </HStack>
                  <HStack justify="space-between">
                    <Text fontSize="xs" color="gray.600">Turn:</Text>
                    <Text fontSize="sm" fontWeight="bold" color={turnTimeLeft < 15 ? 'red.500' : 'blue.500'}>
                      {formatTime(turnTimeLeft)}
                    </Text>
                  </HStack>
                </VStack>
              </Box>

              <Divider />

              {/* Participants */}
              <Box>
                <HStack justify="space-between" mb={3}>
                  <Heading as="h3" size="sm">Participants</Heading>
                  <Badge colorScheme="blue" variant="outline">{debate.participants.length}</Badge>
                </HStack>
                <VStack spacing={3} align="stretch">
                  {debate.participants.map((participant, index) => (
                    <Card key={index} size="sm" variant="outline">
                      <CardBody p={3}>
                        <HStack>
                          <Avatar name={participant.user.username} size="sm" />
                          <VStack align="start" spacing={0} flex={1}>
                            <Text fontSize="sm" fontWeight="medium">
                              {participant.user.username}
                            </Text>
                            <HStack spacing={1}>
                              <Badge 
                                size="xs" 
                                colorScheme={participant.position === 'pro' ? 'green' : 'red'}
                              >
                                {participant.position.toUpperCase()}
                              </Badge>
                              {participant.user.username === 'debater_con' && (
                                <Badge size="xs" colorScheme="purple">YOU</Badge>
                              )}
                            </HStack>
                          </VStack>
                          <Box>
                            <Badge 
                              size="xs" 
                              colorScheme={onlineUsers.includes(participant.user.username) ? 'green' : 'gray'}
                              variant={onlineUsers.includes(participant.user.username) ? 'solid' : 'outline'}
                            >
                              {onlineUsers.includes(participant.user.username) ? 'ONLINE' : 'OFFLINE'}
                            </Badge>
                          </Box>
                        </HStack>
                      </CardBody>
                    </Card>
                  ))}
                </VStack>
              </Box>

              <Divider />

              {/* Connection Status */}
              <Box>
                <Heading as="h3" size="sm" mb={3}>Connection</Heading>
                <VStack spacing={2}>
                  <HStack w="100%" justify="space-between">
                    <Text fontSize="xs">Socket.IO:</Text>
                    <Badge colorScheme={isConnected ? 'green' : 'red'} size="sm">
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </HStack>
                  {!isConnected && (
                    <Button size="xs" colorScheme="blue" onClick={connectSocket} w="100%">
                      Connect to Real-time
                    </Button>
                  )}
                </VStack>
              </Box>

              {typingUsers.size > 0 && (
                <Box>
                  <Text fontSize="xs" color="blue.500">
                    {Array.from(typingUsers).join(', ')} typing...
                  </Text>
                </Box>
              )}
            </VStack>
          </GridItem>

          {/* Main Content - Debate Messages */}
          <GridItem bg={cardBg} display="flex" flexDirection="column">
            {/* Header */}
            <Box p={4} borderBottom="1px" borderColor={borderColor}>
              <HStack justify="space-between" align="center">
                <VStack align="start" spacing={0}>
                  <Heading as="h1" size="md" color="blue.600">
                    {debate.topic}
                  </Heading>
                  <Text fontSize="sm" color="gray.600" noOfLines={1}>
                    {debate.description}
                  </Text>
                </VStack>
                <HStack>
                  <Tooltip label="Debate Settings">
                    <IconButton 
                      aria-label="Settings" 
                      icon={<FiSettings />} 
                      variant="ghost" 
                      size="sm" 
                    />
                  </Tooltip>
                  <Tooltip label="Leave Debate">
                    <IconButton 
                      aria-label="Leave" 
                      icon={<FiLogOut />} 
                      variant="ghost" 
                      size="sm" 
                      colorScheme="red" 
                    />
                  </Tooltip>
                </HStack>
              </HStack>
            </Box>

            {/* Messages Area */}
            <Box flex="1" p={4} overflowY="auto" maxH="calc(100vh - 200px)">
              <VStack spacing={4} align="stretch">
                {messages.map((message) => (
                  <Box
                    key={message._id}
                    p={4}
                    bg={message.position === 'pro' ? 'green.50' : 'red.50'}
                    borderRadius="lg"
                    borderLeft="4px"
                    borderColor={message.position === 'pro' ? 'green.400' : 'red.400'}
                    position="relative"
                  >
                    <HStack justify="space-between" align="center" mb={3}>
                      <HStack>
                        <Avatar name={message.user.username} size="sm" />
                        <VStack align="start" spacing={0}>
                          <Text fontSize="sm" fontWeight="bold">
                            {message.user.username}
                          </Text>
                          <HStack spacing={2}>
                            <Badge
                              size="sm"
                              colorScheme={message.position === 'pro' ? 'green' : 'red'}
                            >
                              {message.position.toUpperCase()}
                            </Badge>
                            <Badge size="sm" variant="outline">
                              {message.type}
                            </Badge>
                            <Text fontSize="xs" color="gray.500">
                              #{message.orderInDebate}
                            </Text>
                          </HStack>
                        </VStack>
                      </HStack>
                      <Text fontSize="xs" color="gray.500">
                        {new Date(message.createdAt).toLocaleTimeString()}
                      </Text>
                    </HStack>
                    <Text fontSize="md" lineHeight="tall">
                      {message.text}
                    </Text>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </VStack>
            </Box>

            {/* Input Area */}
            <Box p={4} borderTop="1px" borderColor={borderColor}>
              <VStack spacing={3}>
                <HStack w="100%" spacing={2}>
                  <Select
                    value={messageType}
                    onChange={(e) => setMessageType(e.target.value)}
                    w="200px"
                    size="sm"
                  >
                    <option value="opening">Opening Statement</option>
                    <option value="rebuttal">Rebuttal</option>
                    <option value="counter-rebuttal">Counter-Rebuttal</option>
                    <option value="closing">Closing Statement</option>
                    <option value="clarification">Clarification</option>
                  </Select>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    leftIcon={<FiClock />}
                    colorScheme={turnTimeLeft < 15 ? 'red' : 'blue'}
                  >
                    {formatTime(turnTimeLeft)}
                  </Button>
                </HStack>
                
                <HStack w="100%" spacing={2}>
                  <Textarea
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      startTyping();
                    }}
                    placeholder="Enter your argument here..."
                    resize="none"
                    rows={3}
                    bg="white"
                  />
                  <VStack spacing={2}>
                    <Tooltip label="Send Argument">
                      <IconButton
                        aria-label="Send"
                        icon={<FiSend />}
                        colorScheme="blue"
                        onClick={sendMessage}
                        isDisabled={!newMessage.trim()}
                        size="lg"
                      />
                    </Tooltip>
                    <Tooltip label="Voice Input">
                      <IconButton
                        aria-label="Voice"
                        icon={<FiMic />}
                        variant="outline"
                        size="sm"
                      />
                    </Tooltip>
                  </VStack>
                </HStack>
              </VStack>
            </Box>
          </GridItem>

          {/* Right Sidebar - Analytics & Tools */}
          <GridItem bg={cardBg} borderLeft="1px" borderColor={borderColor} p={4}>
            <VStack spacing={4} align="stretch" h="100%">
              {/* Real-time Stats */}
              <Box>
                <Heading as="h3" size="sm" mb={3}>Debate Analytics</Heading>
                <VStack spacing={2} align="stretch">
                  <Card size="sm" variant="outline">
                    <CardBody p={3}>
                      <VStack spacing={1} align="center">
                        <Text fontSize="2xl" fontWeight="bold" color="green.500">
                          {messages.filter(m => m.position === 'pro').length}
                        </Text>
                        <Text fontSize="xs" color="gray.600">PRO Arguments</Text>
                      </VStack>
                    </CardBody>
                  </Card>
                  
                  <Card size="sm" variant="outline">
                    <CardBody p={3}>
                      <VStack spacing={1} align="center">
                        <Text fontSize="2xl" fontWeight="bold" color="red.500">
                          {messages.filter(m => m.position === 'con').length}
                        </Text>
                        <Text fontSize="xs" color="gray.600">CON Arguments</Text>
                      </VStack>
                    </CardBody>
                  </Card>

                  <Card size="sm" variant="outline">
                    <CardBody p={3}>
                      <VStack spacing={1} align="center">
                        <Text fontSize="2xl" fontWeight="bold" color="blue.500">
                          {Math.round((messages.reduce((sum, m) => sum + m.text.length, 0) / messages.length) || 0)}
                        </Text>
                        <Text fontSize="xs" color="gray.600">Avg. Length</Text>
                      </VStack>
                    </CardBody>
                  </Card>
                </VStack>
              </Box>

              <Divider />

              {/* Quick Actions */}
              <Box>
                <Heading as="h3" size="sm" mb={3}>Quick Actions</Heading>
                <VStack spacing={2}>
                  <Button size="sm" leftIcon={<FiUsers />} variant="outline" w="100%">
                    Invite Participants
                  </Button>
                  <Button size="sm" leftIcon={<FiMessageCircle />} variant="outline" w="100%">
                    View History
                  </Button>
                  <Button size="sm" leftIcon={<FiPlay />} colorScheme="green" w="100%">
                    AI Feedback
                  </Button>
                </VStack>
              </Box>

              <Divider />

              {/* Message Types Guide */}
              <Box>
                <Heading as="h3" size="sm" mb={3}>Message Types</Heading>
                <VStack spacing={2} align="stretch" fontSize="xs">
                  <HStack justify="space-between">
                    <Text color="gray.600">Opening:</Text>
                    <Badge size="xs" colorScheme="blue">Initial Position</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="gray.600">Rebuttal:</Text>
                    <Badge size="xs" colorScheme="orange">Counter Argument</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="gray.600">Counter:</Text>
                    <Badge size="xs" colorScheme="purple">Response</Badge>
                  </HStack>
                  <HStack justify="space-between">
                    <Text color="gray.600">Closing:</Text>
                    <Badge size="xs" colorScheme="green">Final Statement</Badge>
                  </HStack>
                </VStack>
              </Box>

              {/* Week 4 Status */}
              <Box mt="auto" p={3} bg="blue.50" borderRadius="md">
                <Text fontSize="xs" color="blue.800" textAlign="center" fontWeight="bold">
                  ✅ Week 4 Complete!<br/>
                  Two-Pane Debate UI Ready
                </Text>
              </Box>
            </VStack>
          </GridItem>
        </Grid>
      </Container>
    </Box>
  );
};

export default DebateArenaComplete;
