import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from '../auth/guards/ws-jwt-auth.guard';
import { MessagesService } from './services/messages.service';
import { AgentsService } from '../agents/services/agents.service';
import { RoomsService } from '../rooms/rooms.service';
import { AgentMessage } from './entities/agent-message.entity';

interface AuthenticatedSocket extends Socket {
  data: {
    user?: {
      sub: string;
      email: string;
    };
  };
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'messages',
})
@UseGuards(WsJwtAuthGuard)
export class MessagesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly messagesService: MessagesService,
    private readonly agentsService: AgentsService,
    private readonly roomsService: RoomsService,
  ) {}

  async handleConnection(client: AuthenticatedSocket) {
    // Send initial messages data
    // This could be implemented based on the current room/context
  }

  handleDisconnect(_client: AuthenticatedSocket) {
    // Handle client disconnection
  }

  @SubscribeMessage('messages:send')
  async handleMessage(
    client: AuthenticatedSocket,
    payload: {
      content: string;
      type: 'CHAT' | 'DECISION' | 'TASK_UPDATE';
      agentId: string;
      roomId: string;
    },
  ) {
    try {
      const agent = await this.agentsService.findOne(payload.agentId);
      const room = await this.roomsService.findOne(payload.roomId);

      const message = await this.messagesService.createMessage(
        payload.content,
        payload.type,
        agent,
        room,
      );

      // Broadcast the message to all clients in the room
      this.server.to(payload.roomId).emit('messages:new', message);

      return message;
    } catch (error) {
      console.error('Error handling message:', error);
      client.emit('messages:error', {
        message: 'Failed to send message',
        error: error.message,
      });
    }
  }

  @SubscribeMessage('messages:join_room')
  handleJoinRoom(client: AuthenticatedSocket, roomId: string) {
    client.join(roomId);
    client.emit('messages:joined_room', { roomId });
  }

  @SubscribeMessage('messages:leave_room')
  handleLeaveRoom(client: AuthenticatedSocket, roomId: string) {
    client.leave(roomId);
    client.emit('messages:left_room', { roomId });
  }

  // Broadcast message updates to all connected clients
  broadcastMessage(message: AgentMessage) {
    this.server.to(message.room.id).emit('messages:new', message);
  }

  // Broadcast message deletion to all connected clients
  broadcastMessageDeletion(messageId: string, roomId: string) {
    this.server.to(roomId).emit('messages:deleted', { id: messageId });
  }
}
