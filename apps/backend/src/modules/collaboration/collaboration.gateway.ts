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
import { CollaborationService } from './services/collaboration.service';
import {
  CollaborationSession,
  VotingSession,
} from './types/collaboration.types';

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
  namespace: 'collaboration',
})
@UseGuards(WsJwtAuthGuard)
export class CollaborationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly collaborationService: CollaborationService) {}

  async handleConnection(client: AuthenticatedSocket) {
    // Send initial active collaborations for the connected agent
    const agentId = client.data.user?.sub;
    if (agentId) {
      const collaborations =
        await this.collaborationService.findActiveCollaborations(agentId);
      client.emit('collaboration:initial', collaborations);
    }
  }

  handleDisconnect(_client: AuthenticatedSocket) {
    // Handle client disconnection
  }

  @SubscribeMessage('collaboration:initiate')
  async handleInitiateCollaboration(
    client: AuthenticatedSocket,
    payload: {
      type: CollaborationSession['type'];
      participantIds: string[];
      context: Record<string, any>;
    },
  ) {
    const initiatorId = client.data.user?.sub;
    if (!initiatorId) {
      return;
    }

    const session = await this.collaborationService.initiateCollaboration({
      type: payload.type,
      initiatorId,
      participantIds: payload.participantIds,
      context: payload.context,
    });

    // Notify all participants
    this.server.emit('collaboration:initiated', session);
  }

  @SubscribeMessage('collaboration:respond')
  async handleCollaborationResponse(
    client: AuthenticatedSocket,
    payload: {
      sessionId: string;
      response: boolean;
      reasoning?: string;
    },
  ) {
    const agentId = client.data.user?.sub;
    if (!agentId) {
      return;
    }

    const session = await this.collaborationService.respondToCollaboration(
      payload.sessionId,
      {
        agentId,
        response: payload.response ? 'APPROVE' : 'REJECT',
        reasoning: payload.reasoning,
      },
    );

    // Notify all participants about the response
    this.server.emit('collaboration:response_received', session);

    // If collaboration status changed, notify about the change
    if (session.status === 'ACTIVE' || session.status === 'CANCELLED') {
      this.server.emit('collaboration:status_changed', session);
    }
  }

  @SubscribeMessage('collaboration:vote')
  async handleVote(
    client: AuthenticatedSocket,
    payload: {
      votingId: string;
      optionId: string;
      confidence: number;
      reasoning: string;
    },
  ) {
    const agentId = client.data.user?.sub;
    if (!agentId) {
      return;
    }

    const votingSession = await this.collaborationService.castVote(
      payload.votingId,
      agentId,
      payload.optionId,
      payload.confidence,
      payload.reasoning,
    );

    // Notify about the new vote
    this.server.emit('collaboration:vote_cast', votingSession);

    // If voting session is closed, notify about results
    if (votingSession.status === 'CLOSED') {
      this.server.emit('collaboration:voting_completed', votingSession);
    }
  }

  // Broadcast methods for other parts of the application to use
  broadcastCollaborationUpdate(session: CollaborationSession) {
    this.server.emit('collaboration:updated', session);
  }

  broadcastVotingSessionUpdate(votingSession: VotingSession) {
    this.server.emit('collaboration:voting_updated', votingSession);
  }

  broadcastCollaborationCompletion(session: CollaborationSession) {
    this.server.emit('collaboration:completed', session);
  }
}
