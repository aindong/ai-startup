# AI Startup Simulation

A real-time simulation of an AI-powered startup where multiple AI agents collaborate, make decisions, and execute tasks in a virtual office environment.

## Project Overview

This project simulates a startup environment where AI agents (CEO, CTO, Engineers, Marketers, Sales) work together in different virtual rooms. Users can observe and interact with these agents as they generate and execute tasks, make decisions, and collaborate in real-time.

## Tech Stack

### Frontend
- Vite + React
- PixiJS (2D rendering)
- Socket.io Client (real-time communication)
- Mantine UI (components)
- Zustand (state management)
- React Query (data fetching)

### Backend
- NestJS
- Socket.io (WebSocket)
- Bull (job/task queue)
- TypeORM + PostgreSQL
- Redis
- JWT Authentication

### Shared
- TypeScript
- Common types and interfaces

## Project Structure

```
ai-startup/
├── apps/
│   ├── frontend/        # Vite + React frontend
│   └── backend/         # NestJS backend
├── packages/
│   └── shared/          # Shared TypeScript types
└── docker-compose.yml   # Development services
```

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

3. Test Coverage:
   ```bash
   cd apps/backend
   npm run test:cov
   ```

### Frontend Tests (Coming Soon)
- Component Tests
- Integration Tests
- E2E Tests with Cypress

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

### Phase 4: Frontend Development
- [ ] UI Framework Setup
  - [ ] Mantine UI integration
  - [ ] Responsive layout
  - [ ] Theme system
- [ ] 2D Visualization
  - [ ] PixiJS integration
  - [ ] Room rendering
  - [ ] Agent sprites and animations
  - [ ] Speech bubbles
- [ ] Real-time Updates
  - [ ] WebSocket integration
  - [ ] State management
  - [ ] Task board
  - [ ] Chat system

### Phase 5: Integration Features
- [ ] External API Integration
  - [ ] GitHub integration
  - [ ] Notion integration
  - [ ] PostHog analytics
- [ ] User Controls
  - [ ] Agent direction override
  - [ ] Task management interface
  - [ ] Settings and preferences

### Phase 6: Polish and Optimization
- [ ] Performance Optimization
  - [ ] Caching strategy
  - [ ] Database indexing
  - [ ] WebSocket message batching
- [ ] UI/UX Improvements
  - [ ] Loading states
  - [ ] Error handling
  - [ ] Animations and transitions
- [ ] Testing
  - [ ] Unit tests
  - [ ] Integration tests
  - [ ] E2E tests

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

## Available Scripts

- `npm run dev` - Start development servers
- `npm run build` - Build all packages and applications
- `npm run lint` - Run linting
- `npm run test` - Run tests
- `npm run seed` - Seed the database with initial data

## Testing Data

The seeder provides initial test data including:
- 4 virtual rooms (Development, Marketing, Sales, Meeting)
- 4 AI agents with different roles
- Sample tasks and collaborations
- A voting session example

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

ISC
