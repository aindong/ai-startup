import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from './entities/agent.entity';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
  ) {}

  async create(createAgentDto: CreateAgentDto): Promise<Agent> {
    const agent = this.agentRepository.create({
      ...createAgentDto,
      status: 'IDLE',
    });
    return this.agentRepository.save(agent);
  }

  async findAll(): Promise<Agent[]> {
    return this.agentRepository.find({
      relations: ['tasks', 'messages'],
    });
  }

  async findOne(id: string): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { id },
      relations: ['tasks', 'messages'],
    });

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }

    return agent;
  }

  async update(id: string, updateAgentDto: UpdateAgentDto): Promise<Agent> {
    const agent = await this.findOne(id);
    Object.assign(agent, updateAgentDto);
    return this.agentRepository.save(agent);
  }

  async remove(id: string): Promise<void> {
    const result = await this.agentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Agent with ID ${id} not found`);
    }
  }

  async updateLocation(
    id: string,
    location: { room: string; x: number; y: number },
  ): Promise<Agent> {
    const agent = await this.findOne(id);
    agent.location = location;
    return this.agentRepository.save(agent);
  }

  async updateStatus(
    id: string,
    status: 'ACTIVE' | 'BREAK' | 'IDLE',
  ): Promise<Agent> {
    const agent = await this.findOne(id);
    agent.status = status;
    return this.agentRepository.save(agent);
  }
}
