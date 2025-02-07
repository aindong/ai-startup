import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { AgentTask } from './entities/agent-task.entity';
import { Agent } from '../agents/entities/agent.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { User } from '../auth/entities/user.entity';
import { TaskJobData } from './processors/task.processor';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(AgentTask)
    private readonly taskRepository: Repository<AgentTask>,
    @InjectRepository(Agent)
    private readonly agentRepository: Repository<Agent>,
    @InjectQueue('tasks')
    private readonly taskQueue: Queue<TaskJobData>,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User): Promise<AgentTask> {
    let assignedAgent: Agent | null = null;
    if (createTaskDto.assignedTo) {
      assignedAgent = await this.agentRepository.findOne({
        where: { id: createTaskDto.assignedTo },
      });
      if (!assignedAgent) {
        throw new NotFoundException('Agent not found');
      }
    }

    const task = this.taskRepository.create({
      title: createTaskDto.title,
      description: createTaskDto.description,
      priority: createTaskDto.priority,
      status: 'TODO',
      assignedTo: assignedAgent,
      createdBy: user,
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

    return savedTask;
  }

  async findAll(): Promise<AgentTask[]> {
    return this.taskRepository.find({
      relations: ['assignedTo', 'createdBy'],
    });
  }

  async findOne(id: string): Promise<AgentTask> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['assignedTo', 'createdBy'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(id: string, updateTaskDto: UpdateTaskDto): Promise<AgentTask> {
    const task = await this.findOne(id);
    let assignedAgent: Agent | null = null;

    if (updateTaskDto.assignedTo) {
      assignedAgent = await this.agentRepository.findOne({
        where: { id: updateTaskDto.assignedTo },
      });
      if (!assignedAgent) {
        throw new NotFoundException('Agent not found');
      }
    }

    Object.assign(task, {
      ...updateTaskDto,
      assignedTo: assignedAgent,
    });

    const updatedTask = await this.taskRepository.save(task);

    // Handle status changes
    if (updateTaskDto.status) {
      const agentId = updatedTask.assignedTo?.id;
      if (!agentId) {
        throw new BadRequestException('Task must be assigned to update status');
      }

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
        agentId,
        action,
      });
    }

    return updatedTask;
  }

  async remove(id: string): Promise<void> {
    const result = await this.taskRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }
  }

  async assignToAgent(taskId: string, agentId: string): Promise<AgentTask> {
    const [task, agent] = await Promise.all([
      this.findOne(taskId),
      this.agentRepository.findOne({ where: { id: agentId } }),
    ]);

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    if (task.status !== 'TODO') {
      throw new BadRequestException(
        'Can only assign tasks that are in TODO status',
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

    return updatedTask;
  }

  async updateStatus(
    id: string,
    status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE',
  ): Promise<AgentTask> {
    return this.update(id, { status });
  }

  async failTask(id: string, reason: string): Promise<AgentTask> {
    const task = await this.findOne(id);
    const agentId = task.assignedTo?.id;

    if (!agentId) {
      throw new BadRequestException('Task must be assigned to fail it');
    }

    await this.taskQueue.add('execute', {
      taskId: task.id,
      agentId,
      action: 'FAIL',
      metadata: { reason },
    });

    return task;
  }
}
