import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AgentTask } from './entities/agent-task.entity';
import { Agent } from '../agents/entities/agent.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { User } from '../auth/entities/user.entity';
import { TaskJobData } from './processors/task.processor';
import {
  TaskValidationException,
  TaskAssignmentException,
  TaskStatusException,
} from './exceptions/task.exceptions';

interface DatabaseError extends Error {
  code?: string;
}

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    @InjectRepository(AgentTask)
    private readonly taskRepository: Repository<AgentTask>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectQueue('tasks')
    private readonly taskQueue: Queue<TaskJobData>,
  ) {}

  private handleError(error: unknown, context: string): never {
    const err = error as Error;
    this.logger.error(`${context}: ${err.message}`, err.stack);
    throw error;
  }

  async create(createTaskDto: CreateTaskDto, user: User): Promise<AgentTask> {
    try {
      // Find the CEO agent to be used as the creator for user-initiated tasks
      const ceoAgent = await this.agentRepository.findOne({
        where: { role: 'CEO' },
      });

      if (!ceoAgent) {
        throw new TaskValidationException(
          'System configuration error: CEO agent not found',
        );
      }

      let assignedAgent: Agent | null = null;

      if (createTaskDto.assignedTo) {
        assignedAgent = await this.agentRepository.findOne({
          where: { id: createTaskDto.assignedTo },
        });

        if (!assignedAgent) {
          throw new TaskAssignmentException(
            `Agent with ID ${createTaskDto.assignedTo} not found`,
          );
        }

        // Check if agent is available
        if (
          assignedAgent.state === 'BREAK' ||
          assignedAgent.state === 'COLLABORATING'
        ) {
          throw new TaskAssignmentException(
            `Agent ${assignedAgent.name} is currently ${assignedAgent.state.toLowerCase()} and cannot be assigned new tasks`,
          );
        }
      }

      const task = this.taskRepository.create({
        title: createTaskDto.title,
        description: createTaskDto.description,
        priority: createTaskDto.priority,
        status: 'TODO',
        assignedTo: assignedAgent,
        createdBy: ceoAgent, // Use CEO agent as the creator
        metadata: {
          createdByUser: user.id, // Store the actual user ID in metadata for reference
          createdByUserName: `${user.firstName} ${user.lastName}`,
        },
      });

      const savedTask = await this.taskRepository.save(task);

      // Add task to queue if assigned
      if (assignedAgent) {
        await this.taskQueue.add('execute', {
          taskId: savedTask.id,
          agentId: assignedAgent.id,
          action: 'START',
        });
      }

      this.logger.log(
        `Task created: ${savedTask.id} by user ${user.id} through CEO agent ${ceoAgent.id}`,
      );
      return savedTask;
    } catch (error) {
      if (
        error instanceof TaskAssignmentException ||
        error instanceof TaskValidationException
      ) {
        throw error;
      }

      const err = error as DatabaseError;
      if (err.code === '23503') {
        // Foreign key violation
        if (err.message?.includes('agent_tasks_assigned_to_fkey')) {
          throw new TaskAssignmentException(
            'The specified agent does not exist',
          );
        }
        if (err.message?.includes('agent_tasks_created_by_fkey')) {
          throw new TaskValidationException(
            'System configuration error: CEO agent not found or invalid',
          );
        }
      }

      if (err.code === '23505') {
        // Unique constraint violation
        throw new TaskValidationException(
          'A task with this title already exists',
        );
      }

      this.handleError(error, 'Failed to create task');
    }
  }

  async findAll(): Promise<AgentTask[]> {
    try {
      return await this.taskRepository.find({
        relations: ['assignedTo', 'createdBy'],
      });
    } catch (error) {
      this.handleError(error, 'Failed to fetch tasks');
    }
  }

  async findOne(id: string): Promise<AgentTask> {
    try {
      const task = await this.taskRepository.findOne({
        where: { id },
        relations: ['assignedTo', 'createdBy'],
      });

      if (!task) {
        throw new NotFoundException(`Task with ID ${id} not found`);
      }

      return task;
    } catch (error) {
      this.handleError(error, `Failed to fetch task ${id}`);
    }
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<AgentTask> {
    try {
      const task = await this.findOne(id);
      let assignedAgent: Agent | null = task.assignedTo;

      if (updateTaskDto.assignedTo !== undefined) {
        if (updateTaskDto.assignedTo === null) {
          assignedAgent = null;
        } else {
          assignedAgent = await this.agentRepository.findOne({
            where: { id: updateTaskDto.assignedTo },
          });

          if (!assignedAgent) {
            throw new TaskAssignmentException(
              `Agent with ID ${updateTaskDto.assignedTo} not found`,
            );
          }

          // Check if agent is available
          if (
            assignedAgent.state === 'BREAK' ||
            assignedAgent.state === 'COLLABORATING'
          ) {
            throw new TaskAssignmentException(
              `Agent ${assignedAgent.name} is currently ${assignedAgent.state.toLowerCase()} and cannot be assigned tasks`,
            );
          }
        }
      }

      // Validate status transitions
      if (updateTaskDto.status) {
        this.validateStatusTransition(
          task.status,
          updateTaskDto.status,
          !!assignedAgent,
        );
      }

      Object.assign(task, {
        ...updateTaskDto,
        assignedTo: assignedAgent,
      });

      const updatedTask = await this.taskRepository.save(task);

      // Handle status changes
      if (updateTaskDto.status && assignedAgent) {
        let action: TaskJobData['action'];
        switch (updateTaskDto.status) {
          case 'IN_PROGRESS':
            action = 'START';
            break;
          case 'DONE':
            action = 'COMPLETE';
            break;
          case 'REVIEW':
            action = 'REVIEW';
            break;
          default:
            return updatedTask;
        }

        await this.taskQueue.add('execute', {
          taskId: task.id,
          agentId: assignedAgent.id,
          action,
        });
      }

      this.logger.log(`Task updated: ${updatedTask.id}`);
      return updatedTask;
    } catch (error) {
      if (
        error instanceof TaskAssignmentException ||
        error instanceof TaskStatusException
      ) {
        throw error;
      }

      this.handleError(error, `Failed to update task ${id}`);
    }
  }

  private validateStatusTransition(
    currentStatus: AgentTask['status'],
    newStatus: AgentTask['status'],
    hasAssignee: boolean,
  ): void {
    if (!hasAssignee && newStatus !== 'TODO') {
      throw new TaskStatusException('Cannot change status of unassigned task');
    }

    const validTransitions: Record<AgentTask['status'], AgentTask['status'][]> =
      {
        TODO: ['IN_PROGRESS'],
        IN_PROGRESS: ['REVIEW', 'DONE'],
        REVIEW: ['IN_PROGRESS', 'DONE'],
        DONE: ['TODO'], // Allow reopening tasks
      };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new TaskStatusException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  async assignToAgent(taskId: string, agentId: string): Promise<AgentTask> {
    try {
      const [task, agent] = await Promise.all([
        this.findOne(taskId),
        this.agentRepository.findOne({ where: { id: agentId } }),
      ]);

      if (!agent) {
        throw new TaskAssignmentException(`Agent with ID ${agentId} not found`);
      }

      if (task.status !== 'TODO') {
        throw new TaskStatusException(
          'Can only assign tasks that are in TODO status',
        );
      }

      // Check if agent is available
      if (agent.state === 'BREAK' || agent.state === 'COLLABORATING') {
        throw new TaskAssignmentException(
          `Agent ${agent.name} is currently ${agent.state.toLowerCase()} and cannot be assigned tasks`,
        );
      }

      task.assignedTo = agent;
      task.status = 'IN_PROGRESS';

      const updatedTask = await this.taskRepository.save(task);

      // Add task to queue
      await this.taskQueue.add('execute', {
        taskId: task.id,
        agentId: agent.id,
        action: 'START',
      });

      this.logger.log(`Task ${taskId} assigned to agent ${agentId}`);
      return updatedTask;
    } catch (error) {
      this.handleError(
        error,
        `Failed to assign task ${taskId} to agent ${agentId}`,
      );
    }
  }

  async updateStatus(
    id: string,
    status: AgentTask['status'],
  ): Promise<AgentTask> {
    return this.update(id, { status });
  }

  async failTask(id: string, reason: string): Promise<AgentTask> {
    try {
      const task = await this.findOne(id);

      if (!task.assignedTo) {
        throw new TaskStatusException('Cannot fail an unassigned task');
      }

      await this.taskQueue.add('execute', {
        taskId: task.id,
        agentId: task.assignedTo.id,
        action: 'FAIL',
        metadata: { reason },
      });

      this.logger.log(`Task ${id} marked as failed: ${reason}`);
      return task;
    } catch (error) {
      this.handleError(error, `Failed to mark task ${id} as failed`);
    }
  }
}
