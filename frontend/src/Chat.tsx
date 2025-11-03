import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Input,
  Button,
  Text,
  Badge,
  useToast,
  Container,
  Heading,
  Divider,
  Avatar,
  Flex,
  Card,
  CardBody,
} from '@chakra-ui/react';
import { io, Socket } from 'socket.io-client';

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

const Chat: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [username, setUsername] = useState('');
  const [stance, setStance] = useState<'pro' | 'con'>('pro');
  const [isJoined, setIsJoined] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const toast = useToast();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(`${process.env.REACT_APP_API_URL}`);
    setSocket(newSocket);

    // Socket event listeners
    newSocket.on('message', (message: Message) => {
      setMessages(prev => [...prev, message]);
    });

    newSocket.on('participantJoined', (participant: Participant) => {
      setParticipants(prev => [...prev, participant]);
      toast({
        title: `${participant.username} joined the debate`,
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    });

    newSocket.on('participantLeft', (participantId: string) => {
      setParticipants(prev => prev.filter(p => p.id !== participantId));
    });

    newSocket.on('participantsUpdate', (updatedParticipants: Participant[]) => {
      setParticipants(updatedParticipants);
    });

    newSocket.on('userTyping', ({ userId, isTyping }: { userId: string; isTyping: boolean }) => {
      setParticipants(prev => 
        prev.map(p => p.id === userId ? { ...p, isTyping } : p)
      );
    });

    return () => {
      newSocket.close();
    };
  }, [toast]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const joinChat = () => {
    if (!username.trim() || !socket) return;

    socket.emit('joinDebate', { username, stance });
    setIsJoined(true);
  };

  const sendMessage = () => {
    if (!currentMessage.trim() || !socket) return;

    socket.emit('sendMessage', { text: currentMessage });
    setCurrentMessage('');
    stopTyping();
  };

  const handleTyping = (text: string) => {
    setCurrentMessage(text);
    
    if (!isTyping && socket) {
      setIsTyping(true);
      socket.emit('typing', { isTyping: true });
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 1000);
  };

  const stopTyping = () => {
    if (isTyping && socket) {
      setIsTyping(false);
      socket.emit('typing', { isTyping: false });
    }
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  if (!isJoined) {
    return (
      <Container maxW="md" centerContent py={10}>
        <Card>
          <CardBody>
            <VStack spacing={4}>
              <Heading size="lg">Join Debate Room</Heading>
              <Input
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <HStack>
                <Button
                  colorScheme={stance === 'pro' ? 'green' : 'gray'}
                  onClick={() => setStance('pro')}
                >
                  Pro
                </Button>
                <Button
                  colorScheme={stance === 'con' ? 'red' : 'gray'}
                  onClick={() => setStance('con')}
                >
                  Con
                </Button>
              </HStack>
              <Button colorScheme="blue" onClick={joinChat} isDisabled={!username.trim()}>
                Join Debate
              </Button>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxW="6xl" py={4}>
      <VStack spacing={4} height="90vh">
        <Heading size="lg">Debate Room</Heading>
        
        <HStack width="100%" spacing={4} flex={1}>
          {/* Participants Panel */}
          <Box width="250px" bg="gray.50" p={4} borderRadius="md">
            <Heading size="md" mb={4}>Participants</Heading>
            <VStack spacing={2} align="stretch">
              {participants.map(participant => (
                <Flex key={participant.id} align="center" p={2} bg="white" borderRadius="md">
                  <Avatar size="sm" name={participant.username} />
                  <VStack ml={2} align="start" spacing={0}>
                    <Text fontSize="sm" fontWeight="bold">{participant.username}</Text>
                    <Badge colorScheme={participant.stance === 'pro' ? 'green' : 'red'} size="sm">
                      {participant.stance.toUpperCase()}
                    </Badge>
                    {participant.isTyping && (
                      <Text fontSize="xs" color="gray.500">typing...</Text>
                    )}
                  </VStack>
                </Flex>
              ))}
            </VStack>
          </Box>

          {/* Chat Area */}
          <VStack flex={1} spacing={4}>
            {/* Messages */}
            <Box
              flex={1}
              width="100%"
              bg="white"
              border="1px"
              borderColor="gray.200"
              borderRadius="md"
              p={4}
              overflowY="auto"
            >
              <VStack spacing={3} align="stretch">
                {messages.map(message => (
                  <Box
                    key={message.id}
                    p={3}
                    bg={message.stance === 'pro' ? 'green.50' : 'red.50'}
                    borderLeft="4px"
                    borderLeftColor={message.stance === 'pro' ? 'green.400' : 'red.400'}
                    borderRadius="md"
                  >
                    <HStack justify="space-between" mb={2}>
                      <HStack>
                        <Text fontWeight="bold" color={message.stance === 'pro' ? 'green.600' : 'red.600'}>
                          {message.username}
                        </Text>
                        <Badge colorScheme={message.stance === 'pro' ? 'green' : 'red'} size="sm">
                          {message.stance.toUpperCase()}
                        </Badge>
                      </HStack>
                      <Text fontSize="xs" color="gray.500">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </Text>
                    </HStack>
                    <Text>{message.text}</Text>
                  </Box>
                ))}
                <div ref={messagesEndRef} />
              </VStack>
            </Box>

            <Divider />

            {/* Message Input */}
            <HStack width="100%">
              <Input
                placeholder="Type your message..."
                value={currentMessage}
                onChange={(e) => handleTyping(e.target.value)}
                onKeyPress={handleKeyPress}
                flex={1}
              />
              <Button colorScheme="blue" onClick={sendMessage} isDisabled={!currentMessage.trim()}>
                Send
              </Button>
            </HStack>
          </VStack>
        </HStack>
      </VStack>
    </Container>
  );
};

export default Chat;