import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CollaborationService } from './collaboration.service';
import { CollaborationSession } from '../entities/collaboration-session.entity';
import { VotingSession } from '../entities/voting-session.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { AgentsService } from '../../agents/services/agents.service';
import {
  CollaborationRequest,
  CollaborationResponse,
  CollaborationContext,
} from '../types/collaboration.types';

describe('CollaborationService', () => {
  let service: CollaborationService;

  const mockCollaborationRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockVotingRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  const mockAgentRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockAgentsService = {
    findOne: jest.fn(),
  };

  const mockAgent: Partial<Agent> = {
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
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CollaborationService,
        {
          provide: getRepositoryToken(CollaborationSession),
          useValue: mockCollaborationRepository,
        },
        {
          provide: getRepositoryToken(VotingSession),
          useValue: mockVotingRepository,
        },
        {
          provide: getRepositoryToken(Agent),
          useValue: mockAgentRepository,
        },
        {
          provide: AgentsService,
          useValue: mockAgentsService,
        },
      ],
    }).compile();

    service = module.get<CollaborationService>(CollaborationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('initiateCollaboration', () => {
    it('should create a new collaboration session', async () => {
      const request: CollaborationRequest = {
        type: 'TASK_HELP',
        initiatorId: 'initiator-id',
        participantIds: ['participant-id'],
        context: {
          taskId: 'task-id',
          description: 'Help needed with task',
          topic: 'Authentication Implementation',
        },
      };

      const mockSession: Partial<CollaborationSession> = {
        id: 'session-id',
        type: request.type,
        initiator: mockAgent as Agent,
        participants: [mockAgent as Agent],
        status: 'PENDING',
        context: request.context as CollaborationContext,
        votes: [],
      };

      mockAgentsService.findOne.mockResolvedValueOnce(mockAgent);
      mockAgentRepository.findOne.mockResolvedValueOnce(mockAgent);
      mockCollaborationRepository.create.mockReturnValueOnce(mockSession);
      mockCollaborationRepository.save.mockResolvedValueOnce(mockSession);

      const result = await service.initiateCollaboration(request);

      expect(result).toEqual(mockSession);
      expect(mockCollaborationRepository.create).toHaveBeenCalled();
      expect(mockCollaborationRepository.save).toHaveBeenCalled();
    });
  });

  describe('respondToCollaboration', () => {
    it('should update collaboration session with response', async () => {
      const sessionId = 'session-id';
      const response: CollaborationResponse = {
        agentId: 'agent-id',
        response: 'APPROVE',
        reasoning: 'Approved for testing',
      };

      const mockSession: Partial<CollaborationSession> = {
        id: sessionId,
        status: 'PENDING',
        votes: [],
        participants: [mockAgent as Agent],
      };

      mockCollaborationRepository.findOne.mockResolvedValueOnce(mockSession);
      mockCollaborationRepository.save.mockImplementation(
        (session: Partial<CollaborationSession>) =>
          Promise.resolve(session as CollaborationSession),
      );

      const result = await service.respondToCollaboration(sessionId, response);

      expect(result.votes).toContainEqual(
        expect.objectContaining({
          agentId: response.agentId,
          vote: response.response,
          reason: response.reasoning,
        }),
      );
    });
  });

  describe('createVotingSession', () => {
    it('should create a new voting session', async () => {
      const collaborationId = 'collab-id';
      const topic = 'Test Topic';
      const description = 'Test Description';
      const options = [
        {
          id: '1',
          description: 'Option 1',
          pros: ['Pro 1'],
          cons: ['Con 1'],
        },
      ];
      const durationMinutes = 30;

      const mockVotingSession: Partial<VotingSession> = {
        id: 'voting-id',
        topic,
        description,
        options,
        votes: [],
        status: 'OPEN',
        deadline: new Date(),
      };

      mockVotingRepository.create.mockReturnValueOnce(mockVotingSession);
      mockVotingRepository.save.mockResolvedValueOnce(mockVotingSession);

      const result = await service.createVotingSession(
        collaborationId,
        topic,
        description,
        options,
        durationMinutes,
      );

      expect(result).toEqual(mockVotingSession);
      expect(mockVotingRepository.create).toHaveBeenCalled();
      expect(mockVotingRepository.save).toHaveBeenCalled();
    });
  });

  describe('castVote', () => {
    it('should add a vote to the voting session', async () => {
      const votingId = 'voting-id';
      const agentId = 'agent-id';
      const optionId = 'option-id';
      const confidence = 0.8;
      const reasoning = 'Test reasoning';

      const mockVotingSession: Partial<VotingSession> = {
        id: votingId,
        status: 'OPEN',
        votes: [],
        options: [
          {
            id: optionId,
            description: 'Option 1',
            pros: ['Pro 1'],
            cons: ['Con 1'],
          },
        ],
      };

      mockVotingRepository.findOne.mockResolvedValueOnce(mockVotingSession);
      mockVotingRepository.save.mockImplementation(
        (session: Partial<VotingSession>) => session as VotingSession,
      );

      const result = await service.castVote(
        votingId,
        agentId,
        optionId,
        confidence,
        reasoning,
      );

      expect(result.votes).toContainEqual(
        expect.objectContaining({
          agentId,
          optionId,
          confidence,
          reasoning,
        }),
      );
    });
  });

  describe('findActiveCollaborations', () => {
    it('should return active collaborations for an agent', async () => {
      const agentId = 'agent-id';
      const mockCollaborations: Partial<CollaborationSession>[] = [
        {
          id: 'session-1',
          type: 'TASK_HELP',
          status: 'ACTIVE',
          initiator: mockAgent as Agent,
          participants: [mockAgent as Agent],
        },
      ];

      mockCollaborationRepository.find.mockResolvedValueOnce(
        mockCollaborations,
      );

      const result = await service.findActiveCollaborations(agentId);

      expect(result).toEqual(mockCollaborations);
      expect(mockCollaborationRepository.find).toHaveBeenCalled();
    });
  });

  describe('completeCollaboration', () => {
    it('should complete a collaboration session', async () => {
      const sessionId = 'session-id';
      const outcome = {
        decision: 'Approved',
        reasoning: 'All requirements met',
        actionItems: ['Deploy to production'],
        timestamp: new Date(),
      };

      const mockSession: Partial<CollaborationSession> = {
        id: sessionId,
        status: 'ACTIVE',
      };

      mockCollaborationRepository.findOne.mockResolvedValueOnce(mockSession);
      mockCollaborationRepository.save.mockImplementation(
        (session: Partial<CollaborationSession>) =>
          ({
            ...session,
            status: 'COMPLETED',
            outcome,
          }) as CollaborationSession,
      );

      const result = await service.completeCollaboration(sessionId, outcome);

      expect(result.status).toBe('COMPLETED');
      expect(result.outcome).toEqual(outcome);
      expect(mockCollaborationRepository.save).toHaveBeenCalled();
    });
  });
});
