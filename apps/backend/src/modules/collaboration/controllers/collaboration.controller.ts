import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { CollaborationService } from '../services/collaboration.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import {
  CollaborationRequest,
  CollaborationResponse,
  CollaborationSession,
  VotingSession,
} from '../types/collaboration.types';

@Controller('collaboration')
@UseGuards(JwtAuthGuard)
export class CollaborationController {
  constructor(private readonly collaborationService: CollaborationService) {}

  @Post()
  initiateCollaboration(
    @Body() request: CollaborationRequest,
  ): Promise<CollaborationSession> {
    return this.collaborationService.initiateCollaboration(request);
  }

  @Post(':id/respond')
  respondToCollaboration(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() response: CollaborationResponse,
  ): Promise<CollaborationSession> {
    return this.collaborationService.respondToCollaboration(id, response);
  }

  @Post(':id/voting')
  createVotingSession(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    data: {
      topic: string;
      description: string;
      options: VotingSession['options'];
      durationMinutes: number;
    },
  ): Promise<VotingSession> {
    return this.collaborationService.createVotingSession(
      id,
      data.topic,
      data.description,
      data.options,
      data.durationMinutes,
    );
  }

  @Post('voting/:id/vote')
  castVote(
    @Param('id', ParseUUIDPipe) id: string,
    @Body()
    vote: {
      agentId: string;
      optionId: string;
      confidence: number;
      reasoning: string;
    },
  ): Promise<VotingSession> {
    return this.collaborationService.castVote(
      id,
      vote.agentId,
      vote.optionId,
      vote.confidence,
      vote.reasoning,
    );
  }

  @Get('agent/:agentId')
  findActiveCollaborations(
    @Param('agentId', ParseUUIDPipe) agentId: string,
  ): Promise<CollaborationSession[]> {
    return this.collaborationService.findActiveCollaborations(agentId);
  }

  @Post(':id/complete')
  completeCollaboration(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: { outcome: CollaborationSession['outcome'] },
  ): Promise<CollaborationSession> {
    return this.collaborationService.completeCollaboration(id, data.outcome);
  }
}
