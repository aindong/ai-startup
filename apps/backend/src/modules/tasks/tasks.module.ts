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
import { BullModuleOptions } from '@nestjs/bull';

@Module({
  imports: [
    TypeOrmModule.forFeature([AgentTask, Agent]),
    BullModule.forRootAsync({
      imports: [ConfigModule.forFeature(queueConfig)],
      useFactory: (configService: ConfigService): BullModuleOptions => {
        const config = configService.get<BullModuleOptions>('queue');
        if (!config) {
          throw new Error('Queue configuration not found');
        }
        return config;
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'tasks',
    }),
    AuthModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, TasksGateway, TaskProcessor],
  exports: [TasksService, TypeOrmModule.forFeature([AgentTask])],
})
export class TasksModule {}
