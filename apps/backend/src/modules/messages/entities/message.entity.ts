import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Agent } from '../../agents/entities/agent.entity';
import { Room } from '../../rooms/entities/room.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({
    type: 'enum',
    enum: ['CHAT', 'DECISION', 'TASK_UPDATE'],
  })
  type: 'CHAT' | 'DECISION' | 'TASK_UPDATE';

  @ManyToOne(() => Agent, (agent) => agent.messages)
  agent: Agent;

  @ManyToOne(() => Room, (room) => room.messages)
  room: Room;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
