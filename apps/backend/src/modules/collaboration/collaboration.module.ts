import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollaborationController } from './controllers/collaboration.controller';
import { CollaborationService } from './services/collaboration.service';
import { CollaborationGateway } from './collaboration.gateway';
import { CollaborationSession } from './entities/collaboration-session.entity';
import { VotingSession } from './entities/voting-session.entity';
import { AgentsModule } from '../agents/agents.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CollaborationSession, VotingSession]),
    AgentsModule,
    AuthModule,
  ],
  controllers: [CollaborationController],
  providers: [CollaborationService, CollaborationGateway],
  exports: [CollaborationService],
})
export class CollaborationModule {}
