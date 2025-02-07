import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { AgentsService } from './services/agents.service';
import { Agent } from './entities/agent.entity';
import { WsJwtAuthGuard } from '../auth/guards/ws-jwt-auth.guard';
import { AgentState } from './types/agent-state.types';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'agents',
})
@UseGuards(WsJwtAuthGuard)
export class AgentsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly agentsService: AgentsService) {}

  async handleConnection(client: Socket) {
    // Handle client connection
    const agents = await this.agentsService.findAll();
    client.emit('agents:initial', agents);
  }

  handleDisconnect(client: Socket) {
    // Handle client disconnection
  }

  @SubscribeMessage('agents:move')
  async handleAgentMove(
    client: Socket,
    payload: { agentId: string; x: number; y: number; room: string },
  ) {
    const updatedAgent = await this.agentsService.updateLocation(
      payload.agentId,
      {
        room: payload.room,
        x: payload.x,
        y: payload.y,
      },
    );
    this.server.emit('agents:moved', updatedAgent);
  }

  @SubscribeMessage('agents:status')
  async handleAgentStatus(
    _client: Socket,
    payload: { agentId: string; status: AgentState },
  ) {
    const updatedAgent = await this.agentsService.updateState(
      payload.agentId,
      payload.status,
    );
    this.server.emit('agents:status_changed', updatedAgent);
  }

  // Broadcast agent updates to all connected clients
  broadcastAgentUpdate(agent: Agent) {
    this.server.emit('agents:updated', agent);
  }
}
