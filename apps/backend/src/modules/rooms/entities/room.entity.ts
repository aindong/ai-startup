import { Column, Entity, OneToMany } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { AgentMessage } from '../../../modules/messages/entities/agent-message.entity';

@Entity('rooms')
export class Room extends BaseEntity {
  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: ['DEVELOPMENT', 'MARKETING', 'SALES', 'MEETING'],
  })
  type: 'DEVELOPMENT' | 'MARKETING' | 'SALES' | 'MEETING';

  @OneToMany(() => AgentMessage, (message) => message.room)
  messages: AgentMessage[];
}
