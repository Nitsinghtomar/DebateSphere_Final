# DebateSphere - The AI-Powered Critical Thinking Incubator

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [System Architecture](#system-architecture)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Development](#development)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [AI Integration](#ai-integration)
- [Team Roles](#team-roles)
- [Development Roadmap](#development-roadmap)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

DebateSphere is a real-time, interactive web application designed to function as a "critical thinking incubator." It provides a structured environment where students and professionals can practice and refine their argumentation skills through debates with peers or an advanced AI opponent.

### Problem Statement
Modern digital discourse faces challenges with polarization and misinformation, while AI tools risk creating "cognitive offloading" where users become overly reliant on AI-generated answers rather than developing critical thinking skills.

### Solution
DebateSphere leverages AI not as an answer engine, but as a training partner that builds cognitive skills through:
- Real-time logical fallacy detection
- Structured argumentation practice
- Evidence-based reasoning development
- Civil discourse training

## Features

### Core MVP Features
- **Real-Time Debate Arena**: Live 1v1 debates with WebSocket-powered messaging
- **AI Fallacy-Detection Coach**: Real-time analysis and feedback on logical fallacies
- **Argument-Mapping Tool**: Visual organization of pro/con arguments
- **Personalized Analytics**: Performance tracking and skill development metrics

### Target User Personas
- **High School Debaters**: Practice and skill refinement outside team meetings
- **University Students**: Support for persuasive writing and class discussions
- **Professionals**: Communication and stakeholder persuasion skill development

## Technology Stack

### MERN Stack
- **Frontend**: React.js with modern hooks and component architecture
- **Backend**: Node.js with Express.js framework
- **Database**: MongoDB with Mongoose ODM
- **Real-time**: Socket.IO for WebSocket communication

### AI Integration
- **Local AI Model**: CPU-optimized fallacy detection model
- **Model Options**: 
  - `MidhunKanadan/roberta-large-fallacy-classification`
  - `deepset/tinyroberta-6l-768d`
- **Inference**: Python script with Hugging Face Transformers
- **Communication**: Python-Node.js bridge for AI processing

### Key Libraries
- **Frontend**: create-react-app, react-router-dom, socket.io-client, axios, Material-UI/Chakra UI
- **Backend**: express, mongoose, socket.io, jsonwebtoken, bcryptjs, cors, dotenv
- **AI**: transformers, torch (CPU), ctransformers

## System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (React SPA)   │◄──►│  (Node.js/      │◄──►│   (MongoDB)     │
│                 │    │   Express)      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         │              ┌─────────────────┐
         │              │  Real-time      │
         └──────────────►│  (Socket.IO)    │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │  AI Services    │
                        │  (Python +      │
                        │   HuggingFace)  │
                        └─────────────────┘
```

## Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or Atlas)
- Python 3.8+ (for AI model)
- Git

### Clone Repository
```bash
git clone https://github.com/yourteam/debatesphere.git
cd debatesphere
```

### Install Dependencies

#### Backend
```bash
cd backend
npm install
```

#### Frontend
```bash
cd ../frontend
npm install
```

#### AI Service
```bash
cd ../ai-service
pip install -r requirements.txt
```

## Environment Setup

Create `.env` files in the backend directory:

```env
# Backend .env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/debatesphere
JWT_SECRET=your_jwt_secret_key_here
SOCKET_IO_CORS_ORIGIN=http://localhost:3000
AI_SERVICE_URL=http://localhost:5001
```

Create `.env` file in the frontend directory:

```env
# Frontend .env
REACT_APP_API_URL=${process.env.REACT_APP_API_URL}
REACT_APP_SOCKET_URL=${process.env.REACT_APP_API_URL}
```

## Development

### Start Development Servers

#### Backend Server
```bash
cd backend
npm run dev
```

#### Frontend Server
```bash
cd frontend
npm start
```

#### AI Service
```bash
cd ai-service
python app.py
```

### Development Workflow
1. Use feature-branch Git workflow
2. All changes via pull requests
3. Code review required before merging
4. Daily stand-ups for team coordination

## API Documentation

### Authentication Endpoints
```
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile
```

### Debate Endpoints
```
GET    /api/debates
POST   /api/debates
GET    /api/debates/:id
PUT    /api/debates/:id
DELETE /api/debates/:id
```

### Argument Analysis
```
POST /api/analyze-argument
Body: { "text": "argument text" }
Response: { "fallacies": [...], "strength_score": 0.8 }
```

### User Analytics
```
GET /api/users/:id/stats
GET /api/users/:id/performance-history
```

## Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  username: String,
  email: String,
  passwordHash: String,
  createdAt: Date,
  stats: {
    debatesWon: Number,
    fallaciesCommitted: [{
      type: String,
      count: Number
    }]
  }
}
```

### Debates Collection
```javascript
{
  _id: ObjectId,
  topic: String,
  participants: [ObjectId],
  status: String, // "active", "finished"
  winner_id: ObjectId,
  createdAt: Date,
  argumentTree_id: ObjectId
}
```

### Arguments Collection
```javascript
{
  _id: ObjectId,
  debate_id: ObjectId,
  user_id: ObjectId,
  text: String,
  timestamp: Date,
  parent_argument_id: ObjectId,
  position: String // "pro", "con"
}
```

### AI Feedback Collection
```javascript
{
  _id: ObjectId,
  argument_id: ObjectId,
  fallacy_type: String,
  explanation: String,
  confidence_score: Number,
  timestamp: Date
}
```

## AI Integration

### Model Setup
The AI service uses a specialized fallacy detection model running locally to ensure:
- Zero API costs
- Complete data privacy
- Offline functionality

### Model Loading
```python
from transformers import pipeline

# Load fallacy detection model
classifier = pipeline(
    "text-classification",
    model="MidhunKanadan/roberta-large-fallacy-classification",
    device=-1  # CPU inference
)
```

### Fallacy Types Detected
- Ad Hominem
- Strawman
- Appeal to Ignorance
- Hasty Generalization
- False Dilemma
- Slippery Slope
- Circular Reasoning
- Appeal to Authority
- Red Herring
- Tu Quoque
- Bandwagon
- No True Scotsman
- Equivocation

## Team Roles

| Role | Responsibilities | Technologies |
|------|-----------------|--------------|
| **Project Manager & UI/UX Lead** | Timeline management, wireframes, user experience | Agile, Figma, User-Centered Design |
| **Frontend Lead** | React architecture, state management, routing | React, JavaScript ES6+, State Management |
| **Frontend Developer** | UI components, Socket.IO integration | React, CSS/SASS, socket.io-client |
| **Backend Lead** | Express API, MongoDB schemas, authentication | Node.js, Express, MongoDB, JWT |
| **AI & DevOps Engineer** | AI model integration, Socket.IO server, deployment | Python, Transformers, Socket.IO, Git |

## Development Roadmap

### Sprint 0 (Weeks 1-2): Foundation
- [x] Git repository setup
- [x] MERN project structure
- [x] User authentication system
- [x] MongoDB Atlas configuration

### Sprint 1 (Weeks 3-5): Real-Time Arena
- [x] Socket.IO integration
- [x] Basic chat functionality
- [x] Two-pane debate UI
- [ ] Real-time message exchange

**Milestone 1**: Functional real-time chat application

### Sprint 2 (Weeks 6-8): AI Coach Implementation
- [ ] AI model selection and testing
- [ ] `/analyze-argument` endpoint
- [ ] Frontend AI feedback integration
- [ ] Python-Node.js communication bridge

**Milestone 2**: Working AI fallacy detection and feedback

### Sprint 3 (Weeks 9-10): Advanced Features
- [ ] Argument mapping tool UI
- [ ] Argument tree data persistence
- [ ] User analytics dashboard
- [ ] Performance tracking logic

### Sprint 4 (Weeks 11-12): Polish & Deployment
- [ ] UI/UX refinements
- [ ] AI model optimization
- [ ] End-to-end testing
- [ ] Production deployment

**Milestone 3**: Feature-complete MVP deployed

## Deployment

### Production Environment
- **Frontend**: Vercel or Netlify
- **Backend**: Heroku or Railway
- **Database**: MongoDB Atlas
- **AI Service**: Same server as backend or separate container

### Environment Variables (Production)
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/debatesphere
JWT_SECRET=secure_production_secret
SOCKET_IO_CORS_ORIGIN=https://your-frontend-domain.com
```

### Deployment Commands
```bash
# Build frontend
cd frontend && npm run build

# Deploy backend
cd backend && git push heroku main

# Deploy frontend
cd frontend && vercel --prod
```

## Contributing

### Development Guidelines
1. Follow the feature-branch workflow
2. Write descriptive commit messages
3. Include unit tests for new features
4. Update documentation for API changes
5. Ensure code passes linting checks

### Pull Request Process
1. Create feature branch from `main`
2. Implement changes with tests
3. Submit pull request with description
4. Code review by team member
5. Merge after approval

### Code Style
- Use ESLint and Prettier for consistent formatting
- Follow React functional component patterns
- Use async/await for asynchronous operations
- Implement proper error handling

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Quick Start Commands

```bash
# Clone and setup
git clone https://github.com/yourteam/debatesphere.git
cd debatesphere

# Install all dependencies
npm run install-all

# Start development environment
npm run dev

# Run tests
npm run test

# Build for production
npm run build
```

For detailed development setup, see the [Development](#development) section above.