import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollaborationSession } from '../entities/collaboration-session.entity';
import { VotingSession } from '../entities/voting-session.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { AgentsService } from '../../agents/services/agents.service';
import {
  CollaborationRequest,
  CollaborationResponse,
  VoteType,
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
      request.targetAgentIds.map((id) => this.agentsService.findOne(id)),
    );

    // Check if all participants are available
    const unavailableAgents = participants.filter(
      (agent) => agent.state !== 'IDLE' && agent.state !== 'WORKING',
    );

    if (unavailableAgents.length > 0) {
      throw new BadRequestException(
        `Some agents are not available: ${unavailableAgents
          .map((a) => a.name)
          .join(', ')}`,
      );
    }

    const session = this.collaborationRepository.create({
      type: request.type,
      initiator,
      participants,
      context: request.context,
      status: 'PENDING',
      votes: [],
      startTime: new Date(),
    });

    return this.collaborationRepository.save(session);
  }

  async respondToCollaboration(
    sessionId: string,
    response: CollaborationResponse,
  ): Promise<CollaborationSession> {
    const session = await this.findOne(sessionId);
    const agent = await this.agentsService.findOne(response.agentId);

    if (!session.participants.some((p) => p.id === agent.id)) {
      throw new BadRequestException('Agent is not part of this collaboration');
    }

    session.votes.push({
      agentId: agent.id,
      vote: response.accepted ? 'APPROVE' : 'REJECT',
      reason: response.reason,
      timestamp: new Date(),
    });

    // Check if all participants have responded
    const allResponded =
      session.votes.length === session.participants.length + 1; // +1 for initiator
    if (allResponded) {
      const approvals = session.votes.filter(
        (v) => v.vote === 'APPROVE',
      ).length;
      const threshold = Math.ceil(((session.participants.length + 1) * 2) / 3); // 2/3 majority

      session.status = approvals >= threshold ? 'ACTIVE' : 'CANCELLED';
      if (session.status === 'CANCELLED') {
        session.endTime = new Date();
      }
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

    if (collaboration.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Cannot create voting session for inactive collaboration',
      );
    }

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
      throw new NotFoundException('Voting session not found');
    }

    if (votingSession.status === 'CLOSED') {
      throw new BadRequestException('Voting session is closed');
    }

    const agent = await this.agentsService.findOne(agentId);
    const isParticipant = votingSession.collaboration.participants.some(
      (p) => p.id === agent.id,
    );

    if (!isParticipant) {
      throw new BadRequestException('Agent is not part of this voting session');
    }

    // Check if option exists
    if (!votingSession.options.some((o) => o.id === optionId)) {
      throw new BadRequestException('Invalid option ID');
    }

    // Add or update vote
    const existingVoteIndex = votingSession.votes.findIndex(
      (v) => v.agentId === agentId,
    );
    const vote = {
      agentId,
      optionId,
      confidence,
      reasoning,
      timestamp: new Date(),
    };

    if (existingVoteIndex >= 0) {
      votingSession.votes[existingVoteIndex] = vote;
    } else {
      votingSession.votes.push(vote);
    }

    // Check if all participants have voted
    const allVoted =
      votingSession.votes.length ===
      votingSession.collaboration.participants.length;

    if (allVoted || new Date() >= votingSession.deadline) {
      await this.finalizeVoting(votingSession);
    }

    return this.votingRepository.save(votingSession);
  }

  private async finalizeVoting(votingSession: VotingSession): Promise<void> {
    votingSession.status = 'CLOSED';

    // Calculate results
    const voteCounts = new Map<string, number>();
    const confidenceSum = new Map<string, number>();
    votingSession.votes.forEach((vote) => {
      voteCounts.set(vote.optionId, (voteCounts.get(vote.optionId) || 0) + 1);
      confidenceSum.set(
        vote.optionId,
        (confidenceSum.get(vote.optionId) || 0) + vote.confidence,
      );
    });

    // Find option with highest weighted votes
    let maxScore = 0;
    let selectedOptionId = '';
    voteCounts.forEach((count, optionId) => {
      const avgConfidence = (confidenceSum.get(optionId) || 0) / count;
      const score = count * avgConfidence;
      if (score > maxScore) {
        maxScore = score;
        selectedOptionId = optionId;
      }
    });

    // Calculate consensus level
    const totalVotes = votingSession.votes.length;
    const winningVotes = voteCounts.get(selectedOptionId) || 0;
    const consensusLevel = winningVotes / totalVotes;

    // Identify dissenting opinions
    const dissent = votingSession.votes
      .filter((vote) => vote.optionId !== selectedOptionId)
      .map((vote) => ({
        agentId: vote.agentId,
        reason: vote.reasoning,
      }));

    votingSession.result = {
      selectedOptionId,
      consensusLevel,
      dissent,
    };

    // Update collaboration session with the outcome
    const collaboration = votingSession.collaboration;
    collaboration.outcome = {
      decision: selectedOptionId,
      reasoning: `Selected by majority with ${Math.round(
        consensusLevel * 100,
      )}% consensus`,
      actionItems: [
        `Implement decision: ${
          votingSession.options.find((o) => o.id === selectedOptionId)
            ?.description
        }`,
      ],
      timestamp: new Date(),
    };

    if (dissent.length > 0) {
      collaboration.outcome.actionItems.push(
        'Address concerns raised by dissenting agents',
      );
    }

    await this.collaborationRepository.save(collaboration);
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
    return this.collaborationRepository
      .createQueryBuilder('session')
      .leftJoinAndSelect('session.initiator', 'initiator')
      .leftJoinAndSelect('session.participants', 'participants')
      .where('session.status = :status', { status: 'ACTIVE' })
      .andWhere('(initiator.id = :agentId OR participants.id = :agentId)', {
        agentId,
      })
      .getMany();
  }

  async completeCollaboration(
    sessionId: string,
    outcome: CollaborationSession['outcome'],
  ): Promise<CollaborationSession> {
    const session = await this.findOne(sessionId);

    if (session.status !== 'ACTIVE') {
      throw new BadRequestException(
        'Can only complete active collaboration sessions',
      );
    }

    session.status = 'COMPLETED';
    session.endTime = new Date();
    session.outcome = outcome;

    return this.collaborationRepository.save(session);
  }
}
