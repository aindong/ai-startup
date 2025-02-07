import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { CollaborationSession } from './collaboration-session.entity';

@Entity('voting_sessions')
export class VotingSession extends BaseEntity {
  @ManyToOne(() => CollaborationSession)
  collaboration: CollaborationSession;

  @Column()
  topic: string;

  @Column('text')
  description: string;

  @Column('jsonb')
  options: Array<{
    id: string;
    description: string;
    pros: string[];
    cons: string[];
  }>;

  @Column('jsonb')
  votes: Array<{
    agentId: string;
    optionId: string;
    confidence: number;
    reasoning: string;
    timestamp: Date;
  }>;

  @Column({
    type: 'enum',
    enum: ['OPEN', 'CLOSED'],
    default: 'OPEN',
  })
  status: 'OPEN' | 'CLOSED';

  @Column({ type: 'timestamp' })
  deadline: Date;

  @Column('jsonb', { nullable: true })
  result?: {
    selectedOptionId: string;
    consensusLevel: number;
    dissent: Array<{
      agentId: string;
      reason: string;
    }>;
  };
}
