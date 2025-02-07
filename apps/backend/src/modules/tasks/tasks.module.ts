import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentTask } from './entities/agent-task.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AgentTask])],
  controllers: [],
  providers: [],
  exports: [TypeOrmModule],
})
export class TasksModule {}
