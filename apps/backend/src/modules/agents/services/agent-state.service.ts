import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from '../entities/agent.entity';
import {
  AgentState,
  AgentAction,
  AgentStateTransition,
  AgentBehaviorMetrics,
} from '../types/agent-state.types';

@Injectable()
export class AgentStateService {
  private readonly logger = new Logger(AgentStateService.name);
  private readonly stateTransitions: AgentStateTransition[] = [
    {
      from: 'IDLE',
      to: 'WORKING',
      action: 'START_TASK',
    },
    {
      from: 'WORKING',
      to: 'COLLABORATING',
      action: 'REQUEST_HELP',
    },
    {
      from: 'WORKING',
      to: 'THINKING',
      action: 'MAKE_DECISION',
    },
    {
      from: 'WORKING',
      to: 'IDLE',
      action: 'COMPLETE_TASK',
    },
    {
      from: 'IDLE',
      to: 'BREAK',
      action: 'TAKE_BREAK',
      conditions: [(agent) => this.canTakeBreak(agent)],
    },
    {
      from: 'BREAK',
      to: 'IDLE',
      action: 'RESUME_WORK',
    },
    {
      from: 'IDLE',
      to: 'COLLABORATING',
      action: 'PROVIDE_HELP',
    },
  ];

  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
  ) {}

  async transitionState(
    agentId: string,
    action: AgentAction,
  ): Promise<{ success: boolean; newState?: AgentState; error?: string }> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
      relations: ['currentTask', 'metrics'],
    });

    if (!agent) {
      return { success: false, error: 'Agent not found' };
    }

    const possibleTransition = this.stateTransitions.find(
      (t) => t.from === agent.state && t.action === action,
    );

    if (!possibleTransition) {
      return {
        success: false,
        error: `Invalid transition: ${agent.state} -> ${action}`,
      };
    }

    if (
      possibleTransition.conditions &&
      !possibleTransition.conditions.every((condition) => condition(agent))
    ) {
      return {
        success: false,
        error: 'Transition conditions not met',
      };
    }

    agent.state = possibleTransition.to;
    agent.lastStateChange = new Date();

    await this.agentRepository.save(agent);
    this.logger.log(
      `Agent ${agent.name} transitioned from ${possibleTransition.from} to ${possibleTransition.to}`,
    );

    return { success: true, newState: agent.state };
  }

  private canTakeBreak(agent: Agent): boolean {
    const timeSinceLastBreak =
      Date.now() - (agent.lastBreakTime?.getTime() || 0);
    const minimumWorkTime = 45 * 60 * 1000; // 45 minutes in milliseconds

    return timeSinceLastBreak >= minimumWorkTime;
  }

  async updateMetrics(agentId: string): Promise<AgentBehaviorMetrics> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
      relations: ['metrics', 'completedTasks', 'collaborations'],
    });

    if (!agent || !agent.metrics) {
      throw new Error('Agent or metrics not found');
    }

    // Calculate metrics based on agent's history and current state
    const metrics: AgentBehaviorMetrics = {
      productivity: this.calculateProductivity(agent),
      collaboration: this.calculateCollaboration(agent),
      decisionQuality: this.calculateDecisionQuality(agent),
      taskCompletionRate: this.calculateTaskCompletionRate(agent),
      breakTimeEfficiency: this.calculateBreakTimeEfficiency(agent),
    };

    // Update agent metrics
    Object.assign(agent.metrics, metrics);
    await this.agentRepository.save(agent);

    return metrics;
  }

  private calculateProductivity(agent: Agent): number {
    // Implementation will be based on task completion time, quality, and complexity
    return 0.8; // Placeholder
  }

  private calculateCollaboration(agent: Agent): number {
    // Implementation will be based on successful collaborations and peer feedback
    return 0.7; // Placeholder
  }

  private calculateDecisionQuality(agent: Agent): number {
    // Implementation will be based on decision outcomes and impact
    return 0.9; // Placeholder
  }

  private calculateTaskCompletionRate(agent: Agent): number {
    // Implementation will be based on completed vs assigned tasks
    return 0.85; // Placeholder
  }

  private calculateBreakTimeEfficiency(agent: Agent): number {
    // Implementation will be based on break timing and duration
    return 0.75; // Placeholder
  }
}
