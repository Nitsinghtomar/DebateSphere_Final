import React, { useState, useEffect, useRef } from 'react';
import {
  ChakraProvider, Box, VStack, HStack, Input, Button, Text, 
  Container, Heading, Badge, Avatar, useToast, FormControl,
  InputGroup, InputRightElement, Divider, Card, CardHeader, CardBody
} from '@chakra-ui/react';
import io, { Socket } from 'socket.io-client';

interface Message {
  id: number;
  username: string;
  content: string;
  timestamp: string;
  position?: string;
}

interface Participant {
  username: string;
  position: string;
  status: string;
}

const ChatApp: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState('');
  const [position, setPosition] = useState('PRO');
  const [joined, setJoined] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io(`${process.env.REACT_APP_API_URL}`, {
      transports: ['websocket', 'polling']
    });

    newSocket.on('connect', () => {
      console.log('✅ Connected to server');
      setConnected(true);
      setSocket(newSocket);
    });

    newSocket.on('disconnect', () => {
      console.log('❌ Disconnected from server');
      setConnected(false);
    });

    newSocket.on('debate_message', (messageData: Message) => {
      console.log('📥 New message received:', messageData);
      setMessages(prev => [...prev, messageData]);
    });

    newSocket.on('participants_update', (updatedParticipants: Participant[]) => {
      console.log('👥 Participants updated:', updatedParticipants);
      setParticipants(updatedParticipants);
    });

    newSocket.on('user_typing', (data: { username: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        if (data.isTyping) {
          return prev.includes(data.username) ? prev : [...prev, data.username];
        } else {
          return prev.filter(user => user !== data.username);
        }
      });
    });

    return () => {
      newSocket.close();
    };
  }, []);

  const handleJoinDebate = () => {
    if (!username.trim()) {
      toast({
        title: 'Username Required',
        description: 'Please enter a username to join the chat',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (socket) {
      const debateId = 'demo-chat'; // Fixed chat room for demo
      socket.emit('join_debate', {
        debateId,
        username: username.trim(),
        position
      });
      setJoined(true);
      
      toast({
        title: 'Joined Chat!',
        description: `Welcome to DebateSphere chat, ${username}!`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleSendMessage = () => {
    if (!message.trim() || !socket) return;

    const messageData = {
      username,
      content: message.trim(),
      position,
      timestamp: new Date().toISOString()
    };

    socket.emit('send_message', {
      debateId: 'demo-chat',
      message: messageData
    });

    setMessage('');
    setIsTyping(false);
  };

  const handleTyping = (typing: boolean) => {
    if (socket && typing !== isTyping) {
      socket.emit('typing', {
        debateId: 'demo-chat',
        isTyping: typing
      });
      setIsTyping(typing);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!joined) {
    return (
      <ChakraProvider>
        <Container maxW="md" py={20}>
          <VStack spacing={6}>
            <Box textAlign="center">
              <Heading color="blue.600" mb={2}>DebateSphere Chat</Heading>
              <Text color="gray.600">Real-Time Communication Demo</Text>
              <Badge colorScheme={connected ? 'green' : 'red'} mt={2}>
                {connected ? '🟢 Connected' : '🔴 Connecting...'}
              </Badge>
            </Box>

            <Card w="full">
              <CardHeader>
                <Heading size="md">Join the Chat</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={4}>
                  <FormControl>
                    <Input
                      placeholder="Enter your username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      size="lg"
                    />
                  </FormControl>
                  
                  <HStack>
                    <Button
                      colorScheme={position === 'PRO' ? 'green' : 'gray'}
                      onClick={() => setPosition('PRO')}
                      size="sm"
                    >
                      PRO Side
                    </Button>
                    <Button
                      colorScheme={position === 'CON' ? 'red' : 'gray'}
                      onClick={() => setPosition('CON')}
                      size="sm"
                    >
                      CON Side
                    </Button>
                  </HStack>

                  <Button
                    colorScheme="blue"
                    size="lg"
                    onClick={handleJoinDebate}
                    isDisabled={!connected || !username.trim()}
                    w="full"
                  >
                    Join Chat Room
                  </Button>
                </VStack>
              </CardBody>
            </Card>
          </VStack>
        </Container>
      </ChakraProvider>
    );
  }

  return (
    <ChakraProvider>
      <Container maxW="6xl" py={4}>
        <VStack spacing={4} h="90vh">
          {/* Header */}
          <Box w="full" p={4} bg="blue.50" borderRadius="lg">
            <HStack justify="space-between">
              <Box>
                <Heading size="lg" color="blue.600">DebateSphere Chat</Heading>
                <Text color="blue.800">Topic: Real-Time Communication Demo</Text>
              </Box>
              <HStack>
                <Badge colorScheme="green">🟢 Live</Badge>
                <Text fontSize="sm">👥 {participants.length} users online</Text>
              </HStack>
            </HStack>
          </Box>

          <HStack w="full" flex={1} spacing={4} align="start">
            {/* Participants Panel */}
            <Card w="250px" h="full">
              <CardHeader>
                <Heading size="sm">Participants ({participants.length})</Heading>
              </CardHeader>
              <CardBody>
                <VStack spacing={2} align="start">
                  {participants.map((participant, index) => (
                    <HStack key={index} w="full">
                      <Avatar size="sm" name={participant.username} />
                      <Box>
                        <Text fontWeight="bold" fontSize="sm">
                          {participant.username}
                        </Text>
                        <Badge
                          colorScheme={participant.position === 'PRO' ? 'green' : 'red'}
                          size="sm"
                        >
                          {participant.position}
                        </Badge>
                      </Box>
                    </HStack>
                  ))}
                </VStack>
              </CardBody>
            </Card>

            {/* Chat Messages */}
            <Card flex={1} h="full">
              <CardBody>
                <VStack spacing={3} align="stretch" h="full">
                  {/* Messages Area */}
                  <Box
                    flex={1}
                    overflowY="auto"
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    p={4}
                    bg="white"
                  >
                    {messages.length === 0 ? (
                      <Text color="gray.500" textAlign="center" py={8}>
                        No messages yet. Start the conversation!
                      </Text>
                    ) : (
                      messages.map((msg, index) => (
                        <Box key={msg.id || index} mb={3}>
                          <HStack spacing={3} align="start">
                            <Avatar size="sm" name={msg.username} />
                            <Box flex={1}>
                              <HStack spacing={2} mb={1}>
                                <Text fontWeight="bold" fontSize="sm">
                                  {msg.username}
                                </Text>
                                <Badge
                                  colorScheme={msg.position === 'PRO' ? 'green' : 'red'}
                                  size="xs"
                                >
                                  {msg.position}
                                </Badge>
                                <Text fontSize="xs" color="gray.500">
                                  {new Date(msg.timestamp).toLocaleTimeString()}
                                </Text>
                              </HStack>
                              <Box
                                bg={msg.username === username ? 'blue.100' : 'gray.100'}
                                p={3}
                                borderRadius="md"
                                borderTopLeftRadius={msg.username === username ? 'md' : 'none'}
                                borderTopRightRadius={msg.username === username ? 'none' : 'md'}
                              >
                                <Text>{msg.content}</Text>
                              </Box>
                            </Box>
                          </HStack>
                        </Box>
                      ))
                    )}
                    
                    {/* Typing Indicators */}
                    {typingUsers.length > 0 && (
                      <Box>
                        <Text fontSize="xs" color="gray.500" fontStyle="italic">
                          {typingUsers.filter(user => user !== username).join(', ')} 
                          {typingUsers.filter(user => user !== username).length === 1 ? ' is' : ' are'} typing...
                        </Text>
                      </Box>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </Box>

                  {/* Message Input */}
                  <HStack>
                    <InputGroup>
                      <Input
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => {
                          setMessage(e.target.value);
                          handleTyping(e.target.value.length > 0);
                        }}
                        onKeyPress={handleKeyPress}
                        onBlur={() => handleTyping(false)}
                      />
                      <InputRightElement width="4.5rem">
                        <Button
                          h="1.75rem"
                          size="sm"
                          colorScheme="blue"
                          onClick={handleSendMessage}
                          isDisabled={!message.trim()}
                        >
                          Send
                        </Button>
                      </InputRightElement>
                    </InputGroup>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          </HStack>
        </VStack>
      </Container>
    </ChakraProvider>
  );
};

export default ChatApp;