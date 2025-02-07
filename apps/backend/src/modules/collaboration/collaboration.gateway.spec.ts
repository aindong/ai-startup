import { Test, TestingModule } from '@nestjs/testing';
import { Socket, Server } from 'socket.io';
import { CollaborationGateway } from './collaboration.gateway';
import { CollaborationService } from './services/collaboration.service';
import {
  CollaborationSession,
  VotingSession,
} from './types/collaboration.types';
import { Agent } from '../agents/entities/agent.entity';

describe('CollaborationGateway', () => {
  let gateway: CollaborationGateway;

  const mockCollaborationService = {
    findActiveCollaborations: jest.fn(),
    initiateCollaboration: jest.fn(),
    respondToCollaboration: jest.fn(),
    castVote: jest.fn(),
  };

  const mockAgent = {
    id: 'agent-id',
    name: 'Test Agent',
    role: 'ENGINEER',
    state: 'IDLE',
    location: { room: 'room-1', x: 0, y: 0 },
    metrics: {
      productivity: 0.8,
      collaboration: 0.8,
      decisionQuality: 0.8,
      taskCompletionRate: 0.8,
      breakTimeEfficiency: 0.8,
    },
    lastStateChange: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  } as Agent;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollaborationGateway,
        {
          provide: CollaborationService,
          useValue: mockCollaborationService,
        },
      ],
    }).compile();

    gateway = module.get<CollaborationGateway>(CollaborationGateway);
    gateway.server = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    } as unknown as Server;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should send initial active collaborations', async () => {
      const mockClient = {
        emit: jest.fn(),
        data: {
          user: {
            sub: 'user-id',
            email: 'test@example.com',
          },
        },
      } as unknown as Socket;

      const mockCollaborations: Partial<CollaborationSession>[] = [
        {
          id: 'collab-1',
          type: 'TASK_HELP',
          initiator: mockAgent,
          participants: [],
          status: 'ACTIVE',
          context: {},
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockCollaborationService.findActiveCollaborations.mockResolvedValueOnce(
        mockCollaborations,
      );

      await gateway.handleConnection(mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith(
        'collaboration:initial',
        mockCollaborations,
      );
    });
  });

  describe('handleInitiateCollaboration', () => {
    it('should initiate a new collaboration session', async () => {
      const mockClient = {
        data: {
          user: {
            sub: 'initiator-id',
            email: 'test@example.com',
          },
        },
      } as Socket;

      const mockPayload = {
        type: 'TASK_HELP' as const,
        participantIds: ['participant-1'],
        context: { taskId: 'task-1' },
      };

      const mockSession: Partial<CollaborationSession> = {
        id: 'session-1',
        type: mockPayload.type,
        initiator: mockAgent,
        participants: [mockAgent],
        status: 'PENDING',
      };

      mockCollaborationService.initiateCollaboration.mockResolvedValueOnce(
        mockSession,
      );

      await gateway.handleInitiateCollaboration(mockClient, mockPayload);

      expect(gateway.server.emit).toHaveBeenCalledWith(
        'collaboration:initiated',
        mockSession,
      );
    });
  });

  describe('handleCollaborationResponse', () => {
    it('should handle collaboration response', async () => {
      const mockClient = {
        data: {
          user: {
            sub: 'agent-id',
            email: 'test@example.com',
          },
        },
      } as Socket;

      const mockPayload = {
        sessionId: 'session-1',
        response: true,
        reasoning: 'Approved',
      };

      const mockSession: Partial<CollaborationSession> = {
        id: 'session-1',
        status: 'ACTIVE',
        votes: [
          {
            agentId: 'agent-id',
            vote: 'APPROVE',
            reason: 'Approved',
            timestamp: new Date(),
          },
        ],
      };

      mockCollaborationService.respondToCollaboration.mockResolvedValueOnce(
        mockSession,
      );

      await gateway.handleCollaborationResponse(mockClient, mockPayload);

      expect(gateway.server.emit).toHaveBeenCalledWith(
        'collaboration:response_received',
        mockSession,
      );
      expect(gateway.server.emit).toHaveBeenCalledWith(
        'collaboration:status_changed',
        mockSession,
      );
    });
  });

  describe('handleVote', () => {
    it('should handle casting a vote', async () => {
      const mockClient = {
        data: {
          user: {
            sub: 'agent-id',
            email: 'test@example.com',
          },
        },
      } as Socket;

      const mockPayload = {
        votingId: 'voting-1',
        optionId: 'option-1',
        confidence: 0.8,
        reasoning: 'Good choice',
      };

      const mockVotingSession: Partial<VotingSession> = {
        id: 'voting-1',
        status: 'OPEN',
        votes: [
          {
            agentId: 'agent-id',
            optionId: 'option-1',
            confidence: 0.8,
            reasoning: 'Good choice',
            timestamp: new Date(),
          },
        ],
      };

      mockCollaborationService.castVote.mockResolvedValueOnce(
        mockVotingSession,
      );

      await gateway.handleVote(mockClient, mockPayload);

      expect(gateway.server.emit).toHaveBeenCalledWith(
        'collaboration:vote_cast',
        mockVotingSession,
      );
    });
  });

  describe('broadcast methods', () => {
    it('should broadcast collaboration updates', () => {
      const mockSession = { id: 'session-1' } as CollaborationSession;
      gateway.broadcastCollaborationUpdate(mockSession);
      expect(gateway.server.emit).toHaveBeenCalledWith(
        'collaboration:updated',
        mockSession,
      );
    });

    it('should broadcast voting session updates', () => {
      const mockVotingSession = { id: 'voting-1' } as VotingSession;
      gateway.broadcastVotingSessionUpdate(mockVotingSession);
      expect(gateway.server.emit).toHaveBeenCalledWith(
        'collaboration:voting_updated',
        mockVotingSession,
      );
    });

    it('should broadcast collaboration completion', () => {
      const mockSession = { id: 'session-1' } as CollaborationSession;
      gateway.broadcastCollaborationCompletion(mockSession);
      expect(gateway.server.emit).toHaveBeenCalledWith(
        'collaboration:completed',
        mockSession,
      );
    });
  });
});
