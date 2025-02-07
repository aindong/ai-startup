import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AgentRole } from '@ai-startup/shared';
import { AgentTask } from '../../../modules/tasks/entities/agent-task.entity';
import { AgentMessage } from '../../../modules/messages/entities/agent-message.entity';

@Entity('agents')
export class Agent extends BaseEntity {
  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['CEO', 'CTO', 'ENGINEER', 'MARKETER', 'SALES'],
  })
  role: AgentRole;

  @Column({
    type: 'enum',
    enum: ['ACTIVE', 'BREAK', 'IDLE'],
    default: 'IDLE',
  })
  status: 'ACTIVE' | 'BREAK' | 'IDLE';

  @Column('jsonb')
  location: {
    room: string;
    x: number;
    y: number;
  };

  @OneToMany(() => AgentTask, (task) => task.assignedTo)
  tasks: AgentTask[];

  @OneToMany(() => AgentMessage, (message) => message.agent)
  messages: AgentMessage[];
}
