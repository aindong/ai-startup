import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollaborationSession } from '../entities/collaboration-session.entity';
import { VotingSession } from '../entities/voting-session.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { AgentsService } from '../../agents/services/agents.service';
import {
  CollaborationRequest,
  CollaborationResponse,
} from '../types/collaboration.types';

@Injectable()
export class CollaborationService {
  private readonly logger = new Logger(CollaborationService.name);

  constructor(
    @InjectRepository(CollaborationSession)
    private readonly collaborationRepository: Repository<CollaborationSession>,
    @InjectRepository(VotingSession)
    private readonly votingRepository: Repository<VotingSession>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    private readonly agentsService: AgentsService,
  ) {}

  async initiateCollaboration(
    request: CollaborationRequest,
  ): Promise<CollaborationSession> {
    const initiator = await this.agentsService.findOne(request.initiatorId);
    const participants = await Promise.all(
      request.participantIds.map((id) => this.agentsService.findOne(id)),
    );

    const session = this.collaborationRepository.create({
      type: request.type,
      initiator,
      participants,
      status: 'PENDING',
      context: request.context,
      votes: [],
      startTime: new Date(),
      metadata: request.metadata,
    });

    return this.collaborationRepository.save(session);
  }

  async respondToCollaboration(
    sessionId: string,
    response: CollaborationResponse,
  ): Promise<CollaborationSession> {
    const session = await this.findOne(sessionId);
    const agent = await this.agentsService.findOne(response.agentId);

    session.votes.push({
      agentId: agent.id,
      vote: response.response,
      reason: response.reasoning || '',
      timestamp: new Date(),
    });

    // Check if all participants have voted
    const uniqueVoters = new Set(session.votes.map((v) => v.agentId));
    const allParticipantsVoted =
      uniqueVoters.size === session.participants.length;

    if (allParticipantsVoted) {
      const approvalVotes = session.votes.filter(
        (v) => v.vote === 'APPROVE',
      ).length;
      const approvalRatio = approvalVotes / session.votes.length;

      session.status = approvalRatio >= 0.5 ? 'ACTIVE' : 'CANCELLED';
    }

    return this.collaborationRepository.save(session);
  }

  async createVotingSession(
    collaborationId: string,
    topic: string,
    description: string,
    options: VotingSession['options'],
    durationMinutes: number,
  ): Promise<VotingSession> {
    const collaboration = await this.findOne(collaborationId);

    const votingSession = this.votingRepository.create({
      collaboration,
      topic,
      description,
      options,
      votes: [],
      status: 'OPEN',
      deadline: new Date(Date.now() + durationMinutes * 60000),
    });

    return this.votingRepository.save(votingSession);
  }

  async castVote(
    votingId: string,
    agentId: string,
    optionId: string,
    confidence: number,
    reasoning: string,
  ): Promise<VotingSession> {
    const votingSession = await this.votingRepository.findOne({
      where: { id: votingId },
      relations: ['collaboration', 'collaboration.participants'],
    });

    if (!votingSession) {
      throw new NotFoundException(`Voting session ${votingId} not found`);
    }

    if (votingSession.status === 'CLOSED') {
      throw new Error('Voting session is closed');
    }

    const agent = await this.agentsService.findOne(agentId);
    const isParticipant = votingSession.collaboration.participants.some(
      (p) => p.id === agent.id,
    );

    if (!isParticipant) {
      throw new Error('Agent is not a participant in this collaboration');
    }

    const vote = {
      agentId,
      optionId,
      confidence,
      reasoning,
      timestamp: new Date(),
    };

    votingSession.votes.push(vote);

    // Check if all participants have voted
    const uniqueVoters = new Set(votingSession.votes.map((v) => v.agentId));
    const allParticipantsVoted =
      uniqueVoters.size === votingSession.collaboration.participants.length;

    if (allParticipantsVoted || new Date() >= votingSession.deadline) {
      await this.finalizeVoting(votingSession);
    }

    return this.votingRepository.save(votingSession);
  }

  private async finalizeVoting(votingSession: VotingSession): Promise<void> {
    votingSession.status = 'CLOSED';

    // Calculate results
    const optionVotes = new Map<string, number>();
    votingSession.options.forEach((opt) => optionVotes.set(opt.id, 0));

    votingSession.votes.forEach((vote) => {
      const currentVotes = optionVotes.get(vote.optionId) || 0;
      optionVotes.set(vote.optionId, currentVotes + vote.confidence);
    });

    let maxVotes = 0;
    let selectedOptionId = '';
    optionVotes.forEach((votes, optionId) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        selectedOptionId = optionId;
      }
    });

    const totalPossibleVotes =
      votingSession.collaboration.participants.length * 1; // max confidence
    const consensusLevel = maxVotes / totalPossibleVotes;

    // Collect dissenting opinions
    const dissentingVotes = votingSession.votes.filter(
      (v) => v.optionId !== selectedOptionId && v.confidence > 0.7,
    );

    votingSession.result = {
      selectedOptionId,
      consensusLevel,
      dissent: dissentingVotes.map((v) => ({
        agentId: v.agentId,
        reason: v.reasoning,
      })),
    };

    await this.votingRepository.save(votingSession);
  }

  async findOne(id: string): Promise<CollaborationSession> {
    const session = await this.collaborationRepository.findOne({
      where: { id },
      relations: ['initiator', 'participants'],
    });

    if (!session) {
      throw new NotFoundException(`Collaboration session ${id} not found`);
    }

    return session;
  }

  async findActiveCollaborations(
    agentId: string,
  ): Promise<CollaborationSession[]> {
    return this.collaborationRepository.find({
      where: [
        { initiator: { id: agentId }, status: 'ACTIVE' },
        { participants: { id: agentId }, status: 'ACTIVE' },
      ],
      relations: ['initiator', 'participants'],
    });
  }

  async completeCollaboration(
    sessionId: string,
    outcome: CollaborationSession['outcome'],
  ): Promise<CollaborationSession> {
    const session = await this.findOne(sessionId);

    if (session.status !== 'ACTIVE') {
      throw new Error('Can only complete active collaborations');
    }

    session.status = 'COMPLETED';
    session.outcome = outcome;
    session.endTime = new Date();

    return this.collaborationRepository.save(session);
  }
}
