import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AgentTask } from './entities/agent-task.entity';
import { Agent } from '../agents/entities/agent.entity';
import { TasksService } from './tasks.service';
import { TasksController } from './tasks.controller';
import { TasksGateway } from './tasks.gateway';
import { TaskProcessor } from './processors/task.processor';
import { AuthModule } from '../auth/auth.module';
import queueConfig from '../../config/queue.config';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentTask, Agent]),
    BullModule.forRootAsync({
      imports: [ConfigModule.forFeature(queueConfig)],
      useFactory: async (configService: ConfigService) => ({
        ...configService.get('queue'),
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'tasks',
    }),
    AuthModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, TasksGateway, TaskProcessor],
  exports: [TasksService],
})
export class TasksModule {}
