import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Agent } from '../../../modules/agents/entities/agent.entity';
import { Room } from '../../../modules/rooms/entities/room.entity';

@Entity('agent_messages')
export class AgentMessage extends BaseEntity {
  @Column('text')
  content: string;

  @ManyToOne(() => Agent, (agent) => agent.messages)
  agent: Agent;

  @ManyToOne(() => Room, (room) => room.messages)
  room: Room;

  @Column({
    type: 'enum',
    enum: ['CHAT', 'DECISION', 'TASK_UPDATE'],
    default: 'CHAT',
  })
  type: 'CHAT' | 'DECISION' | 'TASK_UPDATE';
}
