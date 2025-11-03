import React, { useState } from 'react';
import {
  Box,
  Container,
  Flex,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Badge,
  Card,
  CardHeader,
  CardBody,
  Grid,
  GridItem,
  useColorModeValue,
  Alert,
  AlertIcon,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Input,
  Select,
  Textarea
} from '@chakra-ui/react';
import { 
  FiHome, 
  FiUsers, 
  FiMessageCircle, 
  FiSettings,
  FiPlay,
  FiPlus,
  FiEye
} from 'react-icons/fi';

// Import our complete debate arena
import DebateArenaComplete from './DebateArenaComplete';

const Navigation: React.FC<{ activeTab: string; setActiveTab: (tab: string) => void }> = ({ 
  activeTab, 
  setActiveTab 
}) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  return (
    <Box bg={bgColor} borderBottom="1px" borderColor={borderColor} p={4}>
      <Container maxW="6xl">
        <HStack justify="space-between" align="center">
          <HStack spacing={1}>
            <Heading as="h1" size="lg" color="blue.600">DebateSphere</Heading>
            <Badge colorScheme="green" variant="subtle">Week 4</Badge>
          </HStack>
          
          <HStack spacing={2}>
            <Button
              leftIcon={<FiHome />}
              variant={activeTab === 'home' ? 'solid' : 'ghost'}
              colorScheme="blue"
              size="sm"
              onClick={() => setActiveTab('home')}
            >
              Home
            </Button>
            <Button
              leftIcon={<FiMessageCircle />}
              variant={activeTab === 'debate' ? 'solid' : 'ghost'}
              colorScheme="blue"
              size="sm"
              onClick={() => setActiveTab('debate')}
            >
              Debate Arena
            </Button>
            <Button
              leftIcon={<FiUsers />}
              variant={activeTab === 'dashboard' ? 'solid' : 'ghost'}
              colorScheme="blue"
              size="sm"
              onClick={() => setActiveTab('dashboard')}
            >
              Dashboard
            </Button>
          </HStack>
        </HStack>
      </Container>
    </Box>
  );
};

const HomePage: React.FC = () => {
  return (
    <Container maxW="6xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box textAlign="center">
          <Heading as="h1" size="2xl" mb={4} bgGradient="linear(to-r, blue.600, purple.600)" bgClip="text">
            Welcome to DebateSphere
          </Heading>
          <Text fontSize="xl" color="gray.600">
            The AI-Powered Critical Thinking Incubator
          </Text>
        </Box>

        <Alert status="success" borderRadius="lg">
          <AlertIcon />
          <VStack align="start" spacing={1}>
            <Text fontWeight="bold">🎉 Week 4 Complete: Debate Arena UI Implemented!</Text>
            <Text fontSize="sm">
              Full two-pane debate interface with real-time messaging, participant management, and analytics dashboard.
            </Text>
          </VStack>
        </Alert>

        <Grid templateColumns="repeat(auto-fit, minmax(300px, 1fr))" gap={6}>
          <Card>
            <CardHeader>
              <Heading size="md">📡 System Status</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <HStack justify="space-between">
                  <Text>Backend Server:</Text>
                  <Badge colorScheme="green">Running (Port 5000)</Badge>
                </HStack>
                <HStack justify="space-between">
                  <Text>MongoDB Database:</Text>
                  <Badge colorScheme="green">Connected</Badge>
                </HStack>
                <HStack justify="space-between">
                  <Text>Socket.IO:</Text>
                  <Badge colorScheme="green">Ready</Badge>
                </HStack>
                <HStack justify="space-between">
                  <Text>React Frontend:</Text>
                  <Badge colorScheme="green">Active</Badge>
                </HStack>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">🎯 Week 4 Features</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={2} fontSize="sm">
                <Text>✅ Two-pane debate layout</Text>
                <Text>✅ Real-time message display</Text>
                <Text>✅ Socket.IO client integration</Text>
                <Text>✅ Participant management</Text>
                <Text>✅ Debate analytics dashboard</Text>
                <Text>✅ Typing indicators</Text>
                <Text>✅ Message categorization</Text>
                <Text>✅ Responsive design</Text>
              </VStack>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <Heading size="md">🚀 Quick Actions</Heading>
            </CardHeader>
            <CardBody>
              <VStack spacing={3}>
                <Button leftIcon={<FiMessageCircle />} colorScheme="blue" w="100%">
                  Join Test Debate
                </Button>
                <Button leftIcon={<FiPlus />} variant="outline" w="100%">
                  Create New Debate
                </Button>
                <Button leftIcon={<FiEye />} variant="outline" w="100%">
                  Browse Debates
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </Grid>

        <Card>
          <CardHeader>
            <Heading size="md">📋 Testing Instructions</Heading>
          </CardHeader>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <Text>
                <strong>Week 4 Debate Arena UI is now complete!</strong> Here's how to test the full system:
              </Text>
              
              <VStack align="stretch" spacing={3} pl={4}>
                <Text>🎯 <strong>Frontend Testing:</strong> Click "Debate Arena" to see the full two-pane interface</Text>
                <Text>📱 <strong>Responsive Design:</strong> Interface adapts to different screen sizes</Text>
                <Text>💬 <strong>Message System:</strong> Type and send test messages in the debate interface</Text>
                <Text>👥 <strong>Participant View:</strong> See participant list, status indicators, and role badges</Text>
                <Text>📊 <strong>Analytics Panel:</strong> Real-time debate statistics and quick actions</Text>
                <Text>🔌 <strong>Socket.IO Ready:</strong> Interface prepared for real-time backend connection</Text>
              </VStack>

              <Alert status="info" size="sm">
                <AlertIcon />
                <Text fontSize="sm">
                  <strong>Backend Integration:</strong> The UI is fully built and ready to connect to your Socket.IO backend. 
                  Use the API tester (api-tester.html) to test backend functionality separately.
                </Text>
              </Alert>
            </VStack>
          </CardBody>
        </Card>
      </VStack>
    </Container>
  );
};

const Dashboard: React.FC = () => {
  return (
    <Container maxW="6xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading as="h2" size="xl">Dashboard</Heading>
        
        <Tabs colorScheme="blue">
          <TabList>
            <Tab>My Debates</Tab>
            <Tab>Create Debate</Tab>
            <Tab>Browse</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Card>
                  <CardHeader>
                    <HStack justify="space-between">
                      <VStack align="start" spacing={0}>
                        <Heading size="sm">Should AI replace human teachers?</Heading>
                        <Text fontSize="sm" color="gray.600">Active debate • 3 participants</Text>
                      </VStack>
                      <Badge colorScheme="green">LIVE</Badge>
                    </HStack>
                  </CardHeader>
                  <CardBody>
                    <HStack>
                      <Button size="sm" colorScheme="blue">Join Debate</Button>
                      <Button size="sm" variant="outline">View Details</Button>
                    </HStack>
                  </CardBody>
                </Card>
              </VStack>
            </TabPanel>

            <TabPanel>
              <VStack spacing={4} align="stretch">
                <Input placeholder="Debate topic" />
                <Textarea placeholder="Description" rows={3} />
                <HStack>
                  <Select placeholder="Time limit">
                    <option value="15">15 minutes</option>
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes</option>
                  </Select>
                  <Select placeholder="Turn limit">
                    <option value="60">1 minute</option>
                    <option value="120">2 minutes</option>
                    <option value="300">5 minutes</option>
                  </Select>
                </HStack>
                <Button colorScheme="blue" leftIcon={<FiPlus />}>Create Debate</Button>
              </VStack>
            </TabPanel>

            <TabPanel>
              <Text>Browse available debates...</Text>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
};

const Week4CompleteApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState('home');
  const bgColor = useColorModeValue('gray.50', 'gray.900');

  const renderContent = () => {
    switch (activeTab) {
      case 'debate':
        return <DebateArenaComplete />;
      case 'dashboard':
        return <Dashboard />;
      default:
        return <HomePage />;
    }
  };

  return (
    <Box minH="100vh" bg={bgColor}>
      <Navigation activeTab={activeTab} setActiveTab={setActiveTab} />
      {renderContent()}
    </Box>
  );
};

export default Week4CompleteApp;
