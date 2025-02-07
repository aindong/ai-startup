import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agent } from './entities/agent.entity';
import { AgentsService } from './agents.service';
import { AgentsController } from './agents.controller';
import { AgentsGateway } from './agents.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([Agent]), AuthModule],
  controllers: [AgentsController],
  providers: [AgentsService, AgentsGateway],
  exports: [AgentsService],
})
export class AgentsModule {}
