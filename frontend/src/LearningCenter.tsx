import React, { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Flex,
  Heading,
  Text,
  Card,
  CardBody,
  SimpleGrid,
  Badge,
  Button,
  Divider,
  AspectRatio,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/react';

// Learning Center Data
const learningCenterData = {
  categories: [
    {
      id: 'fallacies',
      name: 'Logical Fallacies',
      icon: '🚫',
      description: 'Learn to identify and avoid common reasoning errors',
      count: '12 types'
    },
    {
      id: 'skills',
      name: 'Debate Skills',
      icon: '🎓',
      description: 'Master fundamental debate techniques',
      count: '8 lessons'
    },
    {
      id: 'vocabulary',
      name: 'Vocabulary Builder',
      icon: '📊',
      description: 'Expand your debate vocabulary',
      count: '50 words'
    },
    {
      id: 'topics',
      name: 'Topics Guide',
      icon: '🎯',
      description: 'Prepare for common debate topics',
      count: '10 topics'
    },
    {
      id: 'tips',
      name: 'Tips & Tricks',
      icon: '💡',
      description: 'Quick tips to improve your performance',
      count: '15 tips'
    },
    {
      id: 'glossary',
      name: 'Glossary',
      icon: '📖',
      description: 'Debate terminology reference',
      count: '100+ terms'
    }
  ],
  
featuredVideos: [
    {
      "id": 1,
      "title": "BEN SHAPIRO: 8 Tips on How to Debate",
      "subtitle": "Practical Debate Advice",
      "youtubeId": "Kk0NmM3YCbY",
      "duration": "10:16",
      "views": "497K",
      "description": "Eight essential tips for structuring your arguments, handling pressure, and maintaining control during any discussion or political debate.",
      "topics": ["Fact-checking (1:15)", "Knowing your audience (3:40)", "The power of silence (5:20)", "Framing the debate (7:50)"]
    },
    {
      "id": 2,
      "title": "Debate world champion explains how to argue | Bo Seo",
      "subtitle": "Big Think",
      "youtubeId": "2pVdSEp-tT8",
      "duration": "5:06",
      "views": "856K",
      "description": "Harvard's former debate coach and world champion Bo Seo breaks down the core elements of a good argument and how to engage productively.",
      "topics": ["The anatomy of an argument (0:45)", "Listening effectively (1:50)", "Emotional intelligence (3:15)", "The goal of debate (4:00)"]
    },
    {
      "id": 3,
      "title": "How to DESTROY Anyone in an Argument",
      "subtitle": "Unsolicited Advice",
      "youtubeId": "3-uat0-azYE",
      "duration": "25:27",
      "views": "1.9M",
      "description": "A deep dive into rhetorical devices, logical fallacies, and psychological techniques used to dismantle an opponent's position in a complex argument.",
      "topics": ["Identifying logical fallacies (2:30)", "The strawman argument (5:10)", "Rhetorical strategies (10:45)", "Controlling the narrative (18:00)"]
    },
    {
      "id": 4,
      "title": "How to Win Every Argument (Even if You Are Wrong)",
      "subtitle": "The Art of Persuasion",
      "youtubeId": "IS8doeSyVNo",
      "duration": "6:19",
      "views": "977K",
      "description": "Secrets to mastering persuasion by focusing on presentation, confidence, and rhetorical flair, even when your core factual position is weak.",
      "topics": ["Confidence and delivery (1:05)", "Misdirection techniques (2:35)", "Appealing to emotion (4:10)", "Ending with impact (5:30)"]
    }
  ]
};

const LearningCenter: React.FC = () => {
  const [selectedVideo, setSelectedVideo] = useState<any>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const openVideoModal = (video: any) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };

  const closeVideoModal = () => {
    setIsVideoModalOpen(false);
    setSelectedVideo(null);
  };

  return (
    <Flex direction="column" h="calc(100vh - 80px)" bg="gray.50">
      {/* Header */}
      <Box bg="purple.600" color="white" p={4} boxShadow="md">
        <Heading size="lg">📚 Learning Center</Heading>
        <Text fontSize="sm" opacity={0.9}>Improve your debate skills with curated resources</Text>
      </Box>

      {/* Main Content */}
      <Box flex={1} overflowY="auto" p={6}>
        <VStack spacing={8} align="stretch" maxW="1400px" mx="auto">
          
          {/* Categories */}
          <Box>
            <Heading size="md" mb={4}>Browse by Category</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {learningCenterData.categories.map((category) => (
                <Card
                  key={category.id}
                  _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
                  transition="all 0.2s"
                  cursor="pointer"
                >
                  <CardBody>
                    <VStack align="start" spacing={3}>
                      <HStack>
                        <Text fontSize="3xl">{category.icon}</Text>
                        <Heading size="sm">{category.name}</Heading>
                      </HStack>
                      <Text fontSize="sm" color="gray.600">{category.description}</Text>
                      <Badge colorScheme="blue">{category.count}</Badge>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Box>

          {/* Featured Videos */}
          <Box>
            <HStack justify="space-between" mb={4}>
              <Heading size="md">🎬 Featured Debate Videos</Heading>
              <Button size="sm" variant="ghost" colorScheme="blue">View All →</Button>
            </HStack>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
              {learningCenterData.featuredVideos.map((video) => (
                <Card
                  key={video.id}
                  cursor="pointer"
                  onClick={() => openVideoModal(video)}
                  _hover={{ transform: 'translateY(-4px)', shadow: 'xl' }}
                  transition="all 0.2s"
                  overflow="hidden"
                >
                  <Box position="relative">
                    <AspectRatio ratio={16 / 9}>
                      <Box
                        bgImage={`url(https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg)`}
                        bgSize="cover"
                        bgPosition="center"
                      >
                        <Flex
                          justify="center"
                          align="center"
                          h="100%"
                          bg="blackAlpha.300"
                          _hover={{ bg: 'blackAlpha.500' }}
                          transition="all 0.2s"
                        >
                          <Box
                            bg="red.600"
                            color="white"
                            fontSize="4xl"
                            w="60px"
                            h="60px"
                            borderRadius="full"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                          >
                            ▶️
                          </Box>
                        </Flex>
                      </Box>
                    </AspectRatio>
                  </Box>
                  <CardBody>
                    <VStack align="start" spacing={2}>
                      <Text fontWeight="bold" fontSize="sm" noOfLines={2}>
                        {video.title}
                      </Text>
                      <Text fontSize="xs" color="gray.600">{video.subtitle}</Text>
                      <HStack fontSize="xs" color="gray.500" spacing={3}>
                        <Text>⏱️ {video.duration}</Text>
                        <Text>👁️ {video.views}</Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </Box>

          {/* Featured Lesson + Recommendations */}
          <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
            {/* Featured Lesson */}
            <Card>
              <CardBody>
                <VStack align="start" spacing={4}>
                  <Heading size="md">📌 Featured Lesson</Heading>
                  <Box p={4} bg="purple.50" borderRadius="md" w="100%">
                    <VStack align="start" spacing={3}>
                      <Text fontSize="2xl">🚫</Text>
                      <Heading size="sm">Logical Fallacies Guide</Heading>
                      <Text fontSize="sm" color="gray.700">
                        Master the 12 most common logical fallacies used in debates. Learn to identify and avoid them!
                      </Text>
                      <Button colorScheme="purple" size="sm" w="100%">
                        Start Learning →
                      </Button>
                    </VStack>
                  </Box>
                  
                  <Divider />
                  
                  <Box w="100%">
                    <Text fontSize="sm" fontWeight="bold" mb={2}>✨ NEW</Text>
                    <VStack align="start" spacing={2}>
                      <Text fontSize="sm">Vocabulary Builder</Text>
                      <Text fontSize="xs" color="gray.600">• Word of the day</Text>
                      <Text fontSize="xs" color="gray.600">• Practice exercises</Text>
                    </VStack>
                  </Box>

                  <Divider />

                  <Box w="100%">
                    <Text fontSize="sm" fontWeight="bold" mb={2}>📝 Recently Added</Text>
                    <VStack align="start" spacing={1}>
                      <Text fontSize="xs" color="gray.600">• Debate Structure 101</Text>
                      <Text fontSize="xs" color="gray.600">• Rebuttal Strategies</Text>
                      <Text fontSize="xs" color="gray.600">• Opening Statement Tips</Text>
                    </VStack>
                  </Box>
                </VStack>
              </CardBody>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardBody>
                <VStack align="start" spacing={4}>
                  <Heading size="md">🎯 Recommended for You</Heading>
                  <Text fontSize="sm" color="gray.600">
                    Based on your recent debate performance
                  </Text>

                  <Box p={4} bg="orange.50" borderRadius="md" w="100%" borderWidth={1} borderColor="orange.200">
                    <VStack align="start" spacing={3}>
                      <HStack>
                        <Text fontSize="xl">⚠️</Text>
                        <Text fontWeight="bold" color="orange.700">Focus Area: Logical Fallacies</Text>
                      </HStack>
                      <Text fontSize="sm" color="gray.700">
                        Suggested lessons to improve your fallacy-free score:
                      </Text>
                      <VStack align="start" spacing={1} w="100%">
                        <Text fontSize="xs" color="gray.600">• Ad Hominem - Attacking the person</Text>
                        <Text fontSize="xs" color="gray.600">• Strawman Arguments</Text>
                        <Text fontSize="xs" color="gray.600">• Appeal to Emotion</Text>
                      </VStack>
                      <Text fontSize="xs" color="blue.600">📊 Complete these to improve your score</Text>
                    </VStack>
                  </Box>

                  <Box p={4} bg="blue.50" borderRadius="md" w="100%" borderWidth={1} borderColor="blue.200">
                    <VStack align="start" spacing={3}>
                      <HStack>
                        <Text fontSize="xl">📈</Text>
                        <Text fontWeight="bold" color="blue.700">Strengthen: Fluency</Text>
                      </HStack>
                      <VStack align="start" spacing={1} w="100%">
                        <Text fontSize="xs" color="gray.600">• Reduce filler words (um, uh, like)</Text>
                        <Text fontSize="xs" color="gray.600">• Practice smooth transitions</Text>
                        <Text fontSize="xs" color="gray.600">• Improve pacing</Text>
                      </VStack>
                    </VStack>
                  </Box>
                </VStack>
              </CardBody>
            </Card>
          </SimpleGrid>

          {/* Popular Lessons */}
          <Box>
            <Heading size="md" mb={4}>📚 Popular Lessons</Heading>
            <Card>
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  {[
                    { name: 'Ad Hominem Fallacy', rating: '4.8', learners: '2,340', icon: '🚫' },
                    { name: 'Building Strong Arguments', rating: '4.9', learners: '3,120', icon: '🎓' },
                    { name: 'Advanced Vocabulary', rating: '4.7', learners: '1,890', icon: '📊' },
                    { name: 'Pre-Debate Preparation', rating: '4.8', learners: '2,650', icon: '💡' },
                    { name: 'Counter-Argument Techniques', rating: '4.9', learners: '2,940', icon: '🎯' }
                  ].map((lesson, index) => (
                    <Flex
                      key={index}
                      justify="space-between"
                      align="center"
                      p={3}
                      _hover={{ bg: 'gray.50' }}
                      borderRadius="md"
                      cursor="pointer"
                    >
                      <HStack spacing={3}>
                        <Text fontWeight="bold" color="gray.500">{index + 1}.</Text>
                        <Text fontSize="xl">{lesson.icon}</Text>
                        <Text fontWeight="semibold">{lesson.name}</Text>
                      </HStack>
                      <HStack spacing={4} fontSize="sm" color="gray.600">
                        <Text>⭐ {lesson.rating}</Text>
                        <Text>👥 {lesson.learners} learners</Text>
                      </HStack>
                    </Flex>
                  ))}
                </VStack>
              </CardBody>
            </Card>
          </Box>

        </VStack>
      </Box>

      {/* Video Modal */}
      <Modal isOpen={isVideoModalOpen} onClose={closeVideoModal} size="6xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedVideo?.title}
            <Text fontSize="sm" color="gray.600" fontWeight="normal">{selectedVideo?.subtitle}</Text>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <AspectRatio ratio={16 / 9}>
                <iframe
                  src={`https://www.youtube.com/embed/${selectedVideo?.youtubeId}?autoplay=1`}
                  title={selectedVideo?.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </AspectRatio>
              
              <HStack fontSize="sm" color="gray.600" spacing={4}>
                <Text>⏱️ {selectedVideo?.duration}</Text>
                <Text>👁️ {selectedVideo?.views} views</Text>
              </HStack>

              <Divider />

              <Box>
                <Text fontWeight="bold" mb={2}>📝 Description:</Text>
                <Text fontSize="sm" color="gray.700">{selectedVideo?.description}</Text>
              </Box>

              {selectedVideo?.topics && (
                <Box>
                  <Text fontWeight="bold" mb={2}>🔖 Topics covered:</Text>
                  <VStack align="start" spacing={1}>
                    {selectedVideo.topics.map((topic: string, index: number) => (
                      <Text key={index} fontSize="sm" color="gray.600">• {topic}</Text>
                    ))}
                  </VStack>
                </Box>
              )}
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

export default LearningCenter;
