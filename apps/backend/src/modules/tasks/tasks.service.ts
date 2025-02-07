import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AgentTask } from './entities/agent-task.entity';
import { Agent } from '../agents/entities/agent.entity';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { User } from '../auth/entities/user.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(AgentTask)
    private taskRepository: Repository<AgentTask>,
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
  ) {}

  async create(createTaskDto: CreateTaskDto, user: User): Promise<AgentTask> {
    const task = this.taskRepository.create({
      ...createTaskDto,
      status: 'TODO',
      createdBy: user,
    });

    if (createTaskDto.assignedTo) {
      const agent = await this.agentRepository.findOne({
        where: { id: createTaskDto.assignedTo },
      });
      if (!agent) {
        throw new NotFoundException('Agent not found');
      }
      task.assignedTo = agent;
    }

    return this.taskRepository.save(task);
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

    if (updateTaskDto.assignedTo) {
      const agent = await this.agentRepository.findOne({
        where: { id: updateTaskDto.assignedTo },
      });
      if (!agent) {
        throw new NotFoundException('Agent not found');
      }
      task.assignedTo = agent;
      delete updateTaskDto.assignedTo;
    }

    Object.assign(task, updateTaskDto);
    return this.taskRepository.save(task);
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
    return this.taskRepository.save(task);
  }

  async updateStatus(
    id: string,
    status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE',
  ): Promise<AgentTask> {
    const task = await this.findOne(id);
    task.status = status;
    return this.taskRepository.save(task);
  }
}
