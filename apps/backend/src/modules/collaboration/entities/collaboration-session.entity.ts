import { Column, Entity, ManyToMany, ManyToOne, JoinTable } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { CollaborationType, VoteType } from '../types/collaboration.types';

@Entity('collaboration_sessions')
export class CollaborationSession extends BaseEntity {
  @Column({
    type: 'enum',
    enum: ['TASK_HELP', 'DECISION_MAKING', 'KNOWLEDGE_SHARING'],
  })
  type: CollaborationType;

  @ManyToOne(() => Agent)
  initiator: Agent;

  @ManyToMany(() => Agent)
  @JoinTable({
    name: 'collaboration_participants',
    joinColumn: { name: 'session_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'agent_id', referencedColumnName: 'id' },
  })
  participants: Agent[];

  @Column({
    type: 'enum',
    enum: ['PENDING', 'ACTIVE', 'COMPLETED', 'CANCELLED'],
    default: 'PENDING',
  })
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

  @Column('jsonb')
  context: {
    taskId?: string;
    decisionId?: string;
    topic?: string;
    description: string;
  };

  @Column('jsonb')
  votes: Array<{
    agentId: string;
    vote: VoteType;
    reason: string;
    timestamp: Date;
  }>;

  @Column('jsonb', { nullable: true })
  outcome?: {
    decision: string;
    reasoning: string;
    actionItems: string[];
    timestamp: Date;
  };

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp', nullable: true })
  endTime?: Date;

  @Column('jsonb', { nullable: true })
  metadata?: Record<string, any>;
}
