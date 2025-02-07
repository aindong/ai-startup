import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Agent } from '../../agents/entities/agent.entity';
import { Message } from '../../messages/entities/message.entity';

@Entity()
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['DEVELOPMENT', 'MARKETING', 'SALES', 'MEETING'],
  })
  type: 'DEVELOPMENT' | 'MARKETING' | 'SALES' | 'MEETING';

  @OneToMany(() => Agent, (agent) => agent.currentRoom)
  agents: Agent[];

  @OneToMany(() => Message, (message) => message.room)
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
