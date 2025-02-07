import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from '../entities/agent.entity';
import { CreateAgentDto, UpdateAgentDto } from '../dto/agent.dto';
import { AgentStateService } from './agent-state.service';
import { AgentDecisionService } from './agent-decision.service';
import { AgentState } from '../types/agent-state.types';

@Injectable()
export class AgentsService {
  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    private readonly agentStateService: AgentStateService,
    private readonly agentDecisionService: AgentDecisionService,
  ) {}

  async create(createAgentDto: CreateAgentDto): Promise<Agent> {
    const agent = this.agentRepository.create({
      ...createAgentDto,
      state: 'IDLE' as AgentState,
      metrics: {
        productivity: 0,
        collaboration: 0,
        decisionQuality: 0,
        taskCompletionRate: 0,
        breakTimeEfficiency: 0,
      },
    });
    return this.agentRepository.save(agent);
  }

  async findAll(): Promise<Agent[]> {
    return this.agentRepository.find({
      relations: ['currentTask', 'currentRoom', 'messages'],
    });
  }

  async findOne(id: string): Promise<Agent> {
    const agent = await this.agentRepository.findOne({
      where: { id },
      relations: ['currentTask', 'currentRoom', 'messages'],
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

  async makeDecision(id: string): Promise<void> {
    await this.agentDecisionService.makeDecision(id);
  }
}
