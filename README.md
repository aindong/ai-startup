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

4. Start development servers:
   ```bash
   npm run dev
   ```

## Development Roadmap

### Phase 1: Foundation Setup ✅
- [x] Initialize monorepo structure
- [x] Set up shared types package
- [x] Configure Docker services (PostgreSQL, Redis)
- [x] Basic project documentation

### Phase 2: Backend Infrastructure
- [ ] Database Schema and Migrations
  - [ ] Agent entities
  - [ ] Task management
  - [ ] Room system
  - [ ] Message history
- [ ] Authentication System
  - [ ] JWT implementation
  - [ ] User registration/login
- [ ] WebSocket Setup
  - [ ] Real-time communication gateway
  - [ ] Room-based connections
  - [ ] Message broadcasting

### Phase 3: AI Agent System
- [ ] Agent Management
  - [ ] Agent state machine
  - [ ] Decision-making system
  - [ ] Task generation and execution
- [ ] Task Queue Implementation
  - [ ] Bull queue setup
  - [ ] Task processors
  - [ ] Priority handling
- [ ] Collaboration System
  - [ ] Agent communication
  - [ ] Decision voting mechanism
  - [ ] Break time management

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

## Available Scripts

- `npm run dev` - Start development servers
- `npm run build` - Build all packages and applications
- `npm run lint` - Run linting
- `npm run test` - Run tests (when implemented)

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

ISC
