import { Agent } from '../../agents/entities/agent.entity';

export type CollaborationType =
  | 'TASK_HELP'
  | 'DECISION_MAKING'
  | 'KNOWLEDGE_SHARING';
export type VoteType = 'APPROVE' | 'REJECT' | 'ABSTAIN';
export type CollaborationStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'COMPLETED'
  | 'CANCELLED';
export type VotingStatus = 'OPEN' | 'CLOSED';

export interface CollaborationContext {
  taskId?: string;
  decisionId?: string;
  topic?: string;
  description: string;
}

export interface CollaborationSession {
  id: string;
  type: CollaborationType;
  initiator: Agent;
  participants: Agent[];
  status: CollaborationStatus;
  context: CollaborationContext;
  votes: Array<{
    agentId: string;
    vote: VoteType;
    reason: string;
    timestamp: Date;
  }>;
  outcome?: {
    decision: string;
    reasoning: string;
    actionItems: string[];
    timestamp: Date;
  };
  startTime: Date;
  endTime?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollaborationRequest {
  type: CollaborationType;
  initiatorId: string;
  participantIds: string[];
  context: CollaborationContext;
  metadata?: Record<string, any>;
}

export interface CollaborationResponse {
  agentId: string;
  response: VoteType;
  reasoning?: string;
}

export interface VotingSession {
  id: string;
  collaboration: CollaborationSession;
  topic: string;
  description: string;
  options: Array<{
    id: string;
    description: string;
    pros?: string[];
    cons?: string[];
  }>;
  votes: Array<{
    agentId: string;
    optionId: string;
    confidence: number;
    reasoning: string;
    timestamp: Date;
  }>;
  status: VotingStatus;
  deadline: Date;
  result?: {
    selectedOptionId: string;
    consensusLevel: number;
    dissent: Array<{
      agentId: string;
      reason: string;
    }>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface BreakRequest {
  agentId: string;
  duration: number; // in minutes
  reason: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  impactedTasks: string[];
  preferredTime?: Date;
}
