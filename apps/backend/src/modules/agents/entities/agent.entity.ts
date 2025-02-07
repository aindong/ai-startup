import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AgentRole } from '@ai-startup/shared';
import { AgentTask } from '../../../modules/tasks/entities/agent-task.entity';
import { AgentMessage } from '../../../modules/messages/entities/agent-message.entity';
import { Room } from '../../rooms/entities/room.entity';
import { AgentState } from '../types/agent-state.types';

@Entity('agents')
export class Agent extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['CEO', 'CTO', 'ENGINEER', 'MARKETER', 'SALES'],
  })
  role: AgentRole;

  @Column({
    type: 'enum',
    enum: ['IDLE', 'WORKING', 'COLLABORATING', 'BREAK', 'THINKING'],
    default: 'IDLE',
  })
  state: AgentState;

  @Column({ type: 'jsonb', nullable: true })
  location: {
    room: string;
    x: number;
    y: number;
  } | null;

  @Column({ type: 'jsonb', nullable: true })
  metrics: {
    productivity: number;
    collaboration: number;
    decisionQuality: number;
    taskCompletionRate: number;
    breakTimeEfficiency: number;
  };

  @Column({ type: 'timestamp', nullable: true })
  lastStateChange: Date;

  @Column({ type: 'timestamp', nullable: true })
  lastBreakTime: Date;

  @OneToMany(() => AgentTask, (task) => task.assignedTo)
  tasks: AgentTask[];

  @OneToOne(() => AgentTask)
  @JoinColumn()
  currentTask: AgentTask;

  @OneToMany(() => AgentTask, (task) => task.assignedTo)
  completedTasks: AgentTask[];

  @ManyToOne(() => Room, (room) => room.agents, { nullable: true })
  currentRoom: Room;

  @OneToMany(() => AgentMessage, (message) => message.agent)
  messages: AgentMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
