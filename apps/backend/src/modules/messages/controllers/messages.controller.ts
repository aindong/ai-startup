import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { MessagesService } from '../services/messages.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { AgentMessage } from '../entities/agent-message.entity';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('room/:roomId')
  getRoomMessages(
    @Param('roomId', ParseUUIDPipe) roomId: string,
  ): Promise<AgentMessage[]> {
    return this.messagesService.getRoomMessages(roomId);
  }

  @Get('agent/:agentId')
  getAgentMessages(
    @Param('agentId', ParseUUIDPipe) agentId: string,
  ): Promise<AgentMessage[]> {
    return this.messagesService.getAgentMessages(agentId);
  }

  @Get(':id')
  getMessage(@Param('id', ParseUUIDPipe) id: string): Promise<AgentMessage> {
    return this.messagesService.getMessage(id);
  }

  @Delete(':id')
  deleteMessage(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.messagesService.deleteMessage(id);
  }
}
