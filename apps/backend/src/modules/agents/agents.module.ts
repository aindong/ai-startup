import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from './entities/agent.entity';
import { AgentTask } from '../tasks/entities/agent-task.entity';
import { AgentsService } from './services/agents.service';
import { AgentsController } from './controllers/agents.controller';
import { AgentStateService } from './services/agent-state.service';
import { AgentDecisionService } from './services/agent-decision.service';
import { AgentsGateway } from './agents.gateway';
import { TasksModule } from '../tasks/tasks.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Agent, AgentTask]),
    forwardRef(() => TasksModule),
    AuthModule,
  ],
  controllers: [AgentsController],
  providers: [
    AgentsService,
    AgentStateService,
    AgentDecisionService,
    AgentsGateway,
  ],
  exports: [
    AgentsService,
    AgentStateService,
    AgentDecisionService,
    TypeOrmModule.forFeature([Agent]),
  ],
})
export class AgentsModule {}
