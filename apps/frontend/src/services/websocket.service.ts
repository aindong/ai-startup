import { io, Socket } from 'socket.io-client';
import { Agent } from '../engine/Agent';

export class WebSocketService {
  private agentsSocket: Socket;
  private roomsSocket: Socket;
  private tasksSocket: Socket;

  constructor() {
    // Initialize socket connections
    this.agentsSocket = io('http://localhost:3001/agents');
    this.roomsSocket = io('http://localhost:3001/rooms');
    this.tasksSocket = io('http://localhost:3001/tasks');
  }

  // Agent events
  onAgentMoved(callback: (agent: Agent) => void) {
    this.agentsSocket.on('agents:moved', callback);
  }

  onAgentStatusChanged(callback: (agent: Agent) => void) {
    this.agentsSocket.on('agents:status_changed', callback);
  }

  onInitialAgents(callback: (agents: Agent[]) => void) {
    this.agentsSocket.on('agents:initial', callback);
  }

  // Room events
  onAgentJoinedRoom(callback: (data: { roomId: string; agent: Agent }) => void) {
    this.roomsSocket.on('rooms:agent_joined', callback);
  }

  onAgentLeftRoom(callback: (data: { roomId: string; agent: Agent }) => void) {
    this.roomsSocket.on('rooms:agent_left', callback);
  }

  // Task events
  onTaskAssigned(callback: (data: { agentId: string; taskId: string }) => void) {
    this.tasksSocket.on('tasks:assigned', callback);
  }

  onTaskStatusChanged(callback: (data: { taskId: string; status: string }) => void) {
    this.tasksSocket.on('tasks:status_updated', callback);
  }

  // Cleanup
  disconnect() {
    this.agentsSocket.disconnect();
    this.roomsSocket.disconnect();
    this.tasksSocket.disconnect();
  }
}

export const websocketService = new WebSocketService(); 