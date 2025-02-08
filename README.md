# MetaSekai - AI Startup Simulation

A real-time AI agent simulation platform where multiple AI agents collaborate, make decisions, and work together in a virtual workspace.

## Features

- 🤖 Multiple AI Agents with different roles (CEO, CTO, Engineer, Marketer, Sales)
- 🏢 Virtual workspace with different rooms for collaboration
- 📋 Task management system with real-time updates
- 🤝 Real-time collaboration between agents
- 📊 Decision-making system with voting capabilities
- 🔄 Real-time state synchronization using WebSocket
- 🎨 Modern UI with Radix UI components
- 🔒 JWT-based authentication

## Tech Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling and components
- Socket.io client for real-time communication
- React Query for data fetching
- Canvas API for rendering

### Backend
- NestJS with TypeScript
- PostgreSQL with TypeORM
- Redis for queues and caching
- Bull for job processing
- Socket.io for WebSocket communication
- JWT for authentication

## Prerequisites

- Node.js v18.20.3 or higher
- Docker and Docker Compose
- npm or yarn package manager

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start development services:
   ```bash
   docker-compose up -d
   ```

3. Build shared package:
   ```bash
   cd packages/shared
   npm run build
   ```

4. Seed the database:
   ```bash
   cd apps/backend
   npm run seed
   ```

5. Start development servers:
   ```bash
   npm run dev
   ```

## Project Structure

```
.
├── apps/
│   ├── frontend/          # React frontend application
│   └── backend/           # NestJS backend application
├── packages/
│   └── shared/           # Shared types and utilities
└── docker-compose.yml    # Docker services configuration
```

## Development

### Frontend Development

The frontend application is located in `apps/frontend`. It uses:
- Vite for development and building
- Tailwind CSS for styling and components
- Socket.io client for real-time communication
- React Query for data fetching
- Canvas API for rendering

### Backend Development

The backend application is in `apps/backend`. Key features:
- Modular architecture with NestJS
- TypeORM for database operations
- WebSocket gateways for real-time communication
- Bull queues for background jobs

### Shared Package

Common types and utilities are in `packages/shared`. This ensures type consistency between frontend and backend.

## Testing

### Backend Tests

1. Unit Tests:
   ```bash
   cd apps/backend
   npm run test
   ```

2. E2E Tests:
   ```bash
   cd apps/backend
   npm run test:e2e
   ```

### Frontend Tests

1. Unit Tests:
   ```bash
   cd apps/frontend
   npm run test
   ```

## Environment Variables

### Backend (.env)
```
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=ai_startup
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=1d
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Development Roadmap

### Phase 1: Foundation Setup ✅
- [x] Initialize monorepo structure
- [x] Set up shared types package
- [x] Configure Docker services (PostgreSQL, Redis)
- [x] Basic project documentation

### Phase 2: Backend Infrastructure ✅
- [x] Database Schema and Migrations
  - [x] Agent entities
  - [x] Task management
  - [x] Room system
  - [x] Message history
- [x] Authentication System
  - [x] JWT implementation
  - [x] User registration/login
- [x] WebSocket Setup
  - [x] Real-time communication gateway
  - [x] Room-based connections
  - [x] Message broadcasting

### Phase 3: AI Agent System ✅
- [x] Agent Management
  - [x] Agent state machine
  - [x] Decision-making system
  - [x] Task generation and execution
- [x] Task Queue Implementation
  - [x] Bull queue setup
  - [x] Task processors
  - [x] Priority handling
- [x] Collaboration System
  - [x] Agent communication
  - [x] Decision voting mechanism
  - [x] Break time management

### Phase 4: Frontend Development 🚧
- [x] UI Framework Setup
  - [x] Basic canvas setup
  - [x] Game engine architecture
  - [x] Tailwind CSS integration
  - [x] Theme system
- [x] 2D Visualization
  - [x] Room rendering
    - [x] Grid system
    - [x] Room boundaries
    - [x] Doorways
    - [x] Room colors
  - [x] Agent sprites and animations
    - [x] Basic circle representation
    - [x] Role-based colors
    - [x] State indicators
    - [x] Smooth movement
    - [x] Bounce animation
    - [x] Path visualization
  - [x] Debug information
    - [x] FPS counter
    - [x] Grid coordinates
    - [x] Mouse position
    - [x] Selected agent info
  - [ ] Speech bubbles
- [x] Real-time Updates
  - [x] WebSocket integration
    - [x] Agent namespace
    - [x] Room namespace
    - [x] Task namespace
  - [x] State management
    - [x] Agent positions
    - [x] Room states
    - [x] Movement handling
    - [x] Random walk system
    - [x] Simulation speed control
  - [x] Task board
  - [ ] Chat system

### Phase 5: Integration Features 🚧
- [ ] External API Integration
  - [ ] GitHub integration
  - [ ] Notion integration
  - [ ] PostHog analytics
- [x] User Controls
  - [x] Agent selection system
  - [x] Movement controls
  - [x] Simulation speed control
  - [x] Random walk toggle
  - [x] Debug info toggle
  - [x] Task management interface
  - [ ] Settings and preferences

### Phase 6: Polish and Optimization 🚧
- [x] Performance Optimization
  - [x] Frame rate management
  - [x] Animation smoothing
  - [x] Movement optimization
  - [ ] Caching strategy
  - [ ] Database indexing
  - [ ] WebSocket message batching
- [ ] UI/UX Improvements
  - [x] Agent selection feedback
  - [x] Movement indicators
  - [x] Debug overlay
  - [ ] Loading states
  - [ ] Error handling
  - [ ] Animations and transitions
- [ ] Testing
  - [x] Backend unit tests
  - [ ] Frontend unit tests
  - [ ] Integration tests
  - [ ] E2E tests

### Next Steps 🎯

1. UI/UX Improvements
   - [ ] Add speech bubbles for agent communication
   - [x] Implement task board UI
   - [ ] Add agent interaction menu
   - [ ] Improve agent animations
   - [ ] Add particle effects for events
   - [ ] Implement message history view

2. Game Features
   - [ ] Add pathfinding for agent movement
   - [ ] Implement agent collision avoidance
   - [ ] Add room capacity limits
   - [ ] Create meeting scheduling system
   - [ ] Add agent energy/productivity metrics

3. Performance Optimizations
   - [ ] Implement spatial partitioning
   - [ ] Add object pooling for particles
   - [ ] Optimize WebSocket message frequency
   - [ ] Add frame skipping for low-end devices

## Features Implemented

### Agent System
- Agent state machine with states: IDLE, WORKING, COLLABORATING, BREAK, THINKING
- Decision-making system with context-aware choices
- Performance metrics tracking
- Real-time state updates via WebSocket

### Task Management
- Task creation and assignment
- Priority-based queueing
- Status tracking
- Real-time updates
- Task collaboration

### Collaboration System
- Real-time collaboration sessions
- Voting-based decision making
- Break time management
- Knowledge sharing
- Task-related help requests

### Room System
- Virtual rooms for different departments
- Agent movement tracking
- Room-based messaging
- Real-time occupancy updates
