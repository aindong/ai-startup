import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Agent } from '../../../modules/agents/entities/agent.entity';

@Entity('agent_tasks')
export class AgentTask extends BaseEntity {
  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({
    type: 'enum',
    enum: ['TODO', 'IN_PROGRESS', 'REVIEW', 'DONE'],
    default: 'TODO',
  })
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

  @ManyToOne(() => Agent, (agent) => agent.tasks)
  assignedTo: Agent;

  @ManyToOne(() => Agent)
  createdBy: Agent;

  @Column({
    type: 'enum',
    enum: ['LOW', 'MEDIUM', 'HIGH'],
    default: 'MEDIUM',
  })
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}
