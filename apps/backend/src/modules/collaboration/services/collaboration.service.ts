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
  CollaborationStatus,
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
    const [initiator, ...participants] = await Promise.all([
      this.agentsService.findOne(request.initiatorId),
      ...request.participantIds.map((id) => this.agentsService.findOne(id)),
    ]);

    if (!initiator) {
      throw new NotFoundException('Initiator not found');
    }

    const session = this.collaborationRepository.create({
      type: request.type,
      initiator,
      participants,
      status: 'PENDING' as CollaborationStatus,
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

    if (!session) {
      throw new NotFoundException('Collaboration session not found');
    }

    if (session.status !== 'PENDING') {
      throw new Error('Collaboration is not in pending state');
    }

    // Add vote
    session.votes = session.votes || [];
    session.votes.push({
      agentId: response.agentId,
      vote: response.response,
      reason: response.reasoning || '',
      timestamp: new Date(),
    });

    // Check if all participants have voted
    const allVoted = session.participants.every((participant) =>
      session.votes.some((vote) => vote.agentId === participant.id),
    );

    if (allVoted) {
      // Check if all approved
      const allApproved = session.votes.every(
        (vote) => vote.vote === 'APPROVE',
      );
      session.status = allApproved ? 'ACTIVE' : 'CANCELLED';
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

    if (!collaboration) {
      throw new NotFoundException('Collaboration session not found');
    }

    const votingSession = this.votingRepository.create({
      collaboration,
      topic,
      description,
      options,
      votes: [],
      status: 'OPEN',
      deadline: new Date(Date.now() + durationMinutes * 60 * 1000),
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
      throw new NotFoundException('Voting session not found');
    }

    if (votingSession.status === 'CLOSED') {
      throw new Error('Voting session is closed');
    }

    // Validate agent is a participant
    const isParticipant = votingSession.collaboration.participants.some(
      (p) => p.id === agentId,
    );
    if (!isParticipant) {
      throw new Error('Agent is not a participant in this collaboration');
    }

    // Validate option exists
    const optionExists = votingSession.options.some((o) => o.id === optionId);
    if (!optionExists) {
      throw new Error('Invalid option ID');
    }

    // Add vote
    votingSession.votes.push({
      agentId,
      optionId,
      confidence,
      reasoning,
      timestamp: new Date(),
    });

    // Check if all participants have voted
    const allVoted = votingSession.collaboration.participants.every(
      (participant) =>
        votingSession.votes.some((vote) => vote.agentId === participant.id),
    );

    if (allVoted) {
      await this.finalizeVoting(votingSession);
    }

    return this.votingRepository.save(votingSession);
  }

  private async finalizeVoting(votingSession: VotingSession): Promise<void> {
    // Calculate results
    const votesByOption = votingSession.options.map((option) => ({
      optionId: option.id,
      votes: votingSession.votes.filter((v) => v.optionId === option.id),
      totalConfidence: votingSession.votes
        .filter((v) => v.optionId === option.id)
        .reduce((sum, v) => sum + v.confidence, 0),
    }));

    // Find option with highest weighted votes
    const winner = votesByOption.reduce(
      (best, current) =>
        current.totalConfidence > best.totalConfidence ? current : best,
      votesByOption[0],
    );

    // Calculate consensus level (0-1)
    const totalVotes = votingSession.votes.length;
    const consensusLevel = winner.votes.length / totalVotes;

    // Get dissenting opinions
    const dissent = votingSession.votes
      .filter((v) => v.optionId !== winner.optionId)
      .map((v) => ({
        agentId: v.agentId,
        reason: v.reasoning,
      }));

    // Update session with results
    votingSession.status = 'CLOSED';
    votingSession.result = {
      selectedOptionId: winner.optionId,
      consensusLevel,
      dissent,
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
      throw new Error('Collaboration is not active');
    }

    session.status = 'COMPLETED';
    session.outcome = outcome;
    session.endTime = new Date();

    return this.collaborationRepository.save(session);
  }
}
