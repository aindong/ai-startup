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
import { RoomsService } from './rooms.service';
import { Room } from './entities/room.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'rooms',
})
@UseGuards(WsJwtAuthGuard)
export class RoomsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly roomsService: RoomsService) {}

  async handleConnection(client: Socket) {
    // Send initial rooms data
    const rooms = await this.roomsService.findAll();
    client.emit('rooms:initial', rooms);
  }

  handleDisconnect(client: Socket) {
    // Handle client disconnection
  }

  @SubscribeMessage('rooms:join')
  async handleJoinRoom(
    client: Socket,
    payload: { roomId: string; agentId: string },
  ) {
    const updatedRoom = await this.roomsService.addAgentToRoom(
      payload.roomId,
      payload.agentId,
    );
    client.join(payload.roomId);
    this.server.to(payload.roomId).emit('rooms:agent_joined', updatedRoom);
  }

  @SubscribeMessage('rooms:leave')
  async handleLeaveRoom(
    client: Socket,
    payload: { roomId: string; agentId: string },
  ) {
    const updatedRoom = await this.roomsService.removeAgentFromRoom(
      payload.roomId,
      payload.agentId,
    );
    client.leave(payload.roomId);
    this.server.to(payload.roomId).emit('rooms:agent_left', updatedRoom);
  }

  // Broadcast room updates to all connected clients
  broadcastRoomUpdate(room: Room) {
    this.server.emit('rooms:updated', room);
  }

  // Broadcast new room creation
  broadcastNewRoom(room: Room) {
    this.server.emit('rooms:created', room);
  }

  // Broadcast room deletion
  broadcastRoomDeletion(roomId: string) {
    this.server.emit('rooms:deleted', { id: roomId });
  }

  // Broadcast agent movement within a room
  broadcastAgentMovement(
    roomId: string,
    agentId: string,
    position: { x: number; y: number },
  ) {
    this.server.to(roomId).emit('rooms:agent_moved', {
      roomId,
      agentId,
      position,
    });
  }
}
