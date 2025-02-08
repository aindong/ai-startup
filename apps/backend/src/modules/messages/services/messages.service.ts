import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentMessage } from '../entities/agent-message.entity';
import { Agent } from '../../agents/entities/agent.entity';
import { Room } from '../../rooms/entities/room.entity';

@Injectable()
export class MessagesService {
  constructor(
    @InjectRepository(AgentMessage)
    private readonly messageRepository: Repository<AgentMessage>,
  ) {}

  async createMessage(
    content: string,
    type: 'CHAT' | 'DECISION' | 'TASK_UPDATE',
    agent: Agent,
    room: Room,
  ): Promise<AgentMessage> {
    const message = this.messageRepository.create({
      content,
      type,
      agent,
      room,
    });

    return this.messageRepository.save(message);
  }

  async getRoomMessages(roomId: string): Promise<AgentMessage[]> {
    return this.messageRepository.find({
      where: { room: { id: roomId } },
      relations: ['agent', 'room'],
      order: { createdAt: 'DESC' },
      take: 50, // Limit to last 50 messages
    });
  }

  async getAgentMessages(agentId: string): Promise<AgentMessage[]> {
    return this.messageRepository.find({
      where: { agent: { id: agentId } },
      relations: ['agent', 'room'],
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async getMessage(id: string): Promise<AgentMessage> {
    const message = await this.messageRepository.findOne({
      where: { id },
      relations: ['agent', 'room'],
    });

    if (!message) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }

    return message;
  }

  async deleteMessage(id: string): Promise<void> {
    const result = await this.messageRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Message with ID ${id} not found`);
    }
  }
}
