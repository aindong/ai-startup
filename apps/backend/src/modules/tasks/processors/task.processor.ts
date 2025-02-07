import {
  OnQueueActive,
  OnQueueCompleted,
  OnQueueFailed,
  Process,
  Processor,
} from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { TasksService } from '../tasks.service';
import { AgentsService } from '../../agents/services/agents.service';
import { AgentTask } from '../entities/agent-task.entity';

export interface TaskJobData {
  taskId: string;
  agentId: string;
  action: 'START' | 'COMPLETE' | 'FAIL' | 'REVIEW';
  metadata?: Record<string, any>;
}

@Processor('tasks')
export class TaskProcessor {
  private readonly logger = new Logger(TaskProcessor.name);

  constructor(
    private readonly tasksService: TasksService,
    private readonly agentsService: AgentsService,
  ) {}

  @Process('execute')
  async handleTask(job: Job<TaskJobData>): Promise<void> {
    const { taskId, agentId, action, metadata } = job.data;

    try {
      switch (action) {
        case 'START':
          await this.handleTaskStart(taskId, agentId);
          break;
        case 'COMPLETE':
          await this.handleTaskComplete(taskId, agentId);
          break;
        case 'FAIL':
          await this.handleTaskFail(taskId, agentId, metadata?.reason);
          break;
        case 'REVIEW':
          await this.handleTaskReview(taskId, agentId);
          break;
      }
    } catch (error) {
      this.logger.error(
        `Failed to process task ${taskId} for agent ${agentId}: ${error.message}`,
      );
      throw error;
    }
  }

  private async handleTaskStart(
    taskId: string,
    agentId: string,
  ): Promise<AgentTask> {
    const task = await this.tasksService.findOne(taskId);
    const agent = await this.agentsService.findOne(agentId);

    // Validate task can be started
    if (task.status !== 'TODO') {
      throw new Error(`Task ${taskId} is not in TODO status`);
    }

    // Update task status and assign to agent
    return this.tasksService.update(taskId, {
      status: 'IN_PROGRESS',
      assignedTo: agentId,
    });
  }

  private async handleTaskComplete(
    taskId: string,
    agentId: string,
  ): Promise<AgentTask> {
    const task = await this.tasksService.findOne(taskId);

    // Validate task belongs to agent
    if (task.assignedTo.id !== agentId) {
      throw new Error(`Task ${taskId} is not assigned to agent ${agentId}`);
    }

    // Update task status
    return this.tasksService.update(taskId, {
      status: 'DONE',
    });
  }

  private async handleTaskFail(
    taskId: string,
    agentId: string,
    reason?: string,
  ): Promise<AgentTask> {
    const task = await this.tasksService.findOne(taskId);

    // Validate task belongs to agent
    if (task.assignedTo.id !== agentId) {
      throw new Error(`Task ${taskId} is not assigned to agent ${agentId}`);
    }

    // Reset task status and add failure reason
    return this.tasksService.update(taskId, {
      status: 'TODO',
      assignedTo: null,
      metadata: {
        ...task.metadata,
        lastFailure: {
          agentId,
          reason: reason || 'Unknown error',
          timestamp: new Date(),
        },
      },
    });
  }

  private async handleTaskReview(
    taskId: string,
    agentId: string,
  ): Promise<AgentTask> {
    const task = await this.tasksService.findOne(taskId);

    // Validate task can be reviewed
    if (task.status !== 'IN_PROGRESS') {
      throw new Error(`Task ${taskId} is not in progress`);
    }

    // Update task status to review
    return this.tasksService.update(taskId, {
      status: 'REVIEW',
    });
  }

  @OnQueueActive()
  onActive(job: Job) {
    this.logger.log(
      `Processing task ${job.data.taskId} for agent ${job.data.agentId}...`,
    );
  }

  @OnQueueCompleted()
  onComplete(job: Job) {
    this.logger.log(
      `Completed task ${job.data.taskId} for agent ${job.data.agentId}`,
    );
  }

  @OnQueueFailed()
  onError(job: Job<TaskJobData>, error: Error) {
    this.logger.error(
      `Failed to process task ${job.data.taskId} for agent ${job.data.agentId}: ${error.message}`,
    );
  }
}
