import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agent } from '../entities/agent.entity';
import { AgentTask } from '../../tasks/entities/agent-task.entity';
import { AgentStateService } from './agent-state.service';
import { AgentDecision } from '../types/agent-state.types';

@Injectable()
export class AgentDecisionService {
  private readonly logger = new Logger(AgentDecisionService.name);

  constructor(
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectRepository(AgentTask)
    private readonly taskRepository: Repository<AgentTask>,
    private readonly agentStateService: AgentStateService,
  ) {}

  async makeDecision(agentId: string): Promise<AgentDecision> {
    const agent = await this.agentRepository.findOne({
      where: { id: agentId },
      relations: ['currentTask', 'metrics'],
    });

    if (!agent) {
      throw new Error('Agent not found');
    }

    // Transition to thinking state
    await this.agentStateService.transitionState(agentId, 'MAKE_DECISION');

    const decision = await this.generateDecision(agent);
    const selectedOption = await this.evaluateOptions(decision);

    // Execute the selected option
    await this.executeDecision(agent, decision, selectedOption);

    return decision;
  }

  private async generateDecision(agent: Agent): Promise<AgentDecision> {
    const decision: AgentDecision = {
      id: crypto.randomUUID(),
      agentId: agent.id,
      type: this.determineDecisionType(agent),
      context: this.gatherDecisionContext(agent),
      options: await this.generateOptions(agent),
      createdAt: new Date(),
    };

    return decision;
  }

  private determineDecisionType(agent: Agent): AgentDecision['type'] {
    if (agent.currentTask) {
      return 'TASK_RELATED';
    }

    const timeSinceLastBreak =
      Date.now() - (agent.lastBreakTime?.getTime() || 0);
    if (timeSinceLastBreak > 45 * 60 * 1000) {
      // 45 minutes
      return 'BREAK_TIME';
    }

    return 'COLLABORATION';
  }

  private gatherDecisionContext(agent: Agent): AgentDecision['context'] {
    return {
      taskId: agent.currentTask?.id,
      reason: this.determineDecisionReason(agent),
    };
  }

  private determineDecisionReason(agent: Agent): string {
    if (agent.currentTask) {
      return `Evaluating progress on task ${agent.currentTask.id}`;
    }

    const timeSinceLastBreak =
      Date.now() - (agent.lastBreakTime?.getTime() || 0);
    if (timeSinceLastBreak > 45 * 60 * 1000) {
      return 'Considering taking a break due to extended work period';
    }

    return 'Looking for collaboration opportunities';
  }

  private async generateOptions(
    agent: Agent,
  ): Promise<AgentDecision['options']> {
    const decisionType = this.determineDecisionType(agent);
    let options: AgentDecision['options'] = [];

    switch (decisionType) {
      case 'TASK_RELATED':
        options = await this.generateTaskOptions(agent);
        break;
      case 'BREAK_TIME':
        options = this.generateBreakOptions();
        break;
      case 'COLLABORATION':
        options = await this.generateCollaborationOptions(agent);
        break;
    }

    return options;
  }

  private async generateTaskOptions(
    agent: Agent,
  ): Promise<AgentDecision['options']> {
    if (!agent.currentTask) {
      return [];
    }

    return [
      {
        id: 'continue',
        description: 'Continue working on the current task',
        impact: 0.7,
        confidence: 0.8,
      },
      {
        id: 'request_help',
        description: 'Request help from another agent',
        impact: 0.5,
        confidence: 0.6,
      },
      {
        id: 'break',
        description: 'Take a short break to refresh',
        impact: 0.3,
        confidence: 0.4,
      },
    ];
  }

  private generateBreakOptions(): AgentDecision['options'] {
    return [
      {
        id: 'take_break',
        description: 'Take a 15-minute break',
        impact: 0.8,
        confidence: 0.9,
      },
      {
        id: 'continue_work',
        description: 'Continue working',
        impact: 0.4,
        confidence: 0.5,
      },
    ];
  }

  private async generateCollaborationOptions(
    agent: Agent,
  ): Promise<AgentDecision['options']> {
    const availableAgents = await this.agentRepository.find({
      where: { state: 'IDLE' },
    });

    return [
      {
        id: 'start_collaboration',
        description: `Start collaboration with ${availableAgents.length} available agents`,
        impact: 0.7,
        confidence: 0.6,
      },
      {
        id: 'wait',
        description: 'Wait for a new task assignment',
        impact: 0.3,
        confidence: 0.8,
      },
    ];
  }

  private async evaluateOptions(
    decision: AgentDecision,
  ): Promise<AgentDecision['options'][0]> {
    // For now, simply choose the option with the highest impact * confidence
    return decision.options.reduce((best, current) => {
      const bestScore = best.impact * best.confidence;
      const currentScore = current.impact * current.confidence;
      return currentScore > bestScore ? current : best;
    }, decision.options[0]);
  }

  private async executeDecision(
    agent: Agent,
    decision: AgentDecision,
    selectedOption: AgentDecision['options'][0],
  ): Promise<void> {
    decision.selectedOption = selectedOption.id;
    decision.decidedAt = new Date();

    switch (decision.type) {
      case 'TASK_RELATED':
        await this.executeTaskDecision(agent, selectedOption);
        break;
      case 'BREAK_TIME':
        await this.executeBreakDecision(agent, selectedOption);
        break;
      case 'COLLABORATION':
        await this.executeCollaborationDecision(agent, selectedOption);
        break;
    }

    // Update agent metrics
    await this.agentStateService.updateMetrics(agent.id);
  }

  private async executeTaskDecision(
    agent: Agent,
    option: AgentDecision['options'][0],
  ): Promise<void> {
    switch (option.id) {
      case 'continue':
        await this.agentStateService.transitionState(agent.id, 'START_TASK');
        break;
      case 'request_help':
        await this.agentStateService.transitionState(agent.id, 'REQUEST_HELP');
        break;
      case 'break':
        await this.agentStateService.transitionState(agent.id, 'TAKE_BREAK');
        break;
    }
  }

  private async executeBreakDecision(
    agent: Agent,
    option: AgentDecision['options'][0],
  ): Promise<void> {
    if (option.id === 'take_break') {
      await this.agentStateService.transitionState(agent.id, 'TAKE_BREAK');
    }
  }

  private async executeCollaborationDecision(
    agent: Agent,
    option: AgentDecision['options'][0],
  ): Promise<void> {
    if (option.id === 'start_collaboration') {
      await this.agentStateService.transitionState(agent.id, 'PROVIDE_HELP');
    }
  }
}
