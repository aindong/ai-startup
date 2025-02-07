import { Test, TestingModule } from '@nestjs/testing';
import { Server, Socket } from 'socket.io';
import { CollaborationGateway } from './collaboration.gateway';
import { CollaborationService } from './services/collaboration.service';
import {
  CollaborationSession,
  VotingSession,
  CollaborationType,
} from './types/collaboration.types';

describe('CollaborationGateway', () => {
  let gateway: CollaborationGateway;
  let mockServer: Partial<Server>;

  const mockCollaborationService = {
    findActiveCollaborations: jest.fn(),
    initiateCollaboration: jest.fn(),
    respondToCollaboration: jest.fn(),
    castVote: jest.fn(),
  };

  const mockClient = {
    emit: jest.fn(),
    data: {
      user: {
        sub: 'user-id',
        email: 'test@example.com',
      },
    },
  } as unknown as Socket;

  beforeEach(async () => {
    mockServer = {
      emit: jest.fn(),
      to: jest.fn().mockReturnThis(),
    };

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
    gateway.server = mockServer as Server;
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });

  describe('handleConnection', () => {
    it('should send initial collaborations to connected client', async () => {
      const mockCollaborations = [{ id: 'collab-1' }] as CollaborationSession[];
      mockCollaborationService.findActiveCollaborations.mockResolvedValueOnce(
        mockCollaborations,
      );

      await gateway.handleConnection(mockClient);

      const emitSpy = jest.spyOn(mockClient, 'emit');
      expect(emitSpy).toHaveBeenCalledWith(
        'collaboration:initial',
        mockCollaborations,
      );
    });
  });

  describe('handleInitiateCollaboration', () => {
    it('should initiate collaboration and broadcast to all clients', async () => {
      const mockPayload = {
        type: 'TASK_HELP' as CollaborationType,
        participantIds: ['participant-1'],
        context: { taskId: 'task-1', description: 'Help needed' },
      };

      const mockSession = {
        id: 'session-1',
        type: mockPayload.type,
      } as CollaborationSession;

      mockCollaborationService.initiateCollaboration.mockResolvedValueOnce(
        mockSession,
      );

      await gateway.handleInitiateCollaboration(mockClient, mockPayload);

      const emitSpy = jest.spyOn(mockServer, 'emit');
      expect(emitSpy).toHaveBeenCalledWith(
        'collaboration:initiated',
        mockSession,
      );
    });
  });

  describe('handleCollaborationResponse', () => {
    it('should handle response and broadcast updates', async () => {
      const mockPayload = {
        sessionId: 'session-1',
        response: true,
        reasoning: 'Approved',
      };

      const mockSession = {
        id: mockPayload.sessionId,
        status: 'ACTIVE',
      } as CollaborationSession;

      mockCollaborationService.respondToCollaboration.mockResolvedValueOnce(
        mockSession,
      );

      await gateway.handleCollaborationResponse(mockClient, mockPayload);

      const emitSpy = jest.spyOn(mockServer, 'emit');
      expect(emitSpy).toHaveBeenCalledWith(
        'collaboration:response_received',
        mockSession,
      );
      expect(emitSpy).toHaveBeenCalledWith(
        'collaboration:status_changed',
        mockSession,
      );
    });
  });

  describe('handleVote', () => {
    it('should handle vote and broadcast updates', async () => {
      const mockPayload = {
        votingId: 'voting-1',
        optionId: 'option-1',
        confidence: 0.8,
        reasoning: 'Good choice',
      };

      const mockVotingSession = {
        id: mockPayload.votingId,
        status: 'OPEN',
        votes: [
          {
            agentId: 'user-id',
            optionId: 'option-1',
            confidence: 0.8,
            reasoning: 'Good choice',
            timestamp: new Date(),
          },
        ],
      } as VotingSession;

      mockCollaborationService.castVote.mockResolvedValueOnce(
        mockVotingSession,
      );

      await gateway.handleVote(mockClient, mockPayload);

      const emitSpy = jest.spyOn(mockServer, 'emit');
      expect(emitSpy).toHaveBeenCalledWith(
        'collaboration:vote_cast',
        mockVotingSession,
      );
    });
  });

  describe('broadcast methods', () => {
    it('should broadcast collaboration updates', () => {
      const mockSession = { id: 'session-1' } as CollaborationSession;
      gateway.broadcastCollaborationUpdate(mockSession);

      const emitSpy = jest.spyOn(mockServer, 'emit');
      expect(emitSpy).toHaveBeenCalledWith(
        'collaboration:updated',
        mockSession,
      );
    });

    it('should broadcast voting session updates', () => {
      const mockVotingSession = { id: 'voting-1' } as VotingSession;
      gateway.broadcastVotingSessionUpdate(mockVotingSession);

      const emitSpy = jest.spyOn(mockServer, 'emit');
      expect(emitSpy).toHaveBeenCalledWith(
        'collaboration:voting_updated',
        mockVotingSession,
      );
    });

    it('should broadcast collaboration completion', () => {
      const mockSession = { id: 'session-1' } as CollaborationSession;
      gateway.broadcastCollaborationCompletion(mockSession);

      const emitSpy = jest.spyOn(mockServer, 'emit');
      expect(emitSpy).toHaveBeenCalledWith(
        'collaboration:completed',
        mockSession,
      );
    });
  });
});
