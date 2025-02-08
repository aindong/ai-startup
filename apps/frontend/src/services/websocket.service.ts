import { io, Socket } from 'socket.io-client';
import { AgentData } from '../engine/Game';
import { Room } from '../engine/Game';

export class WebSocketService {
  private agentsSocket: Socket;
  private roomsSocket: Socket;
  private tasksSocket: Socket;

  constructor() {
    const token = localStorage.getItem('token') || '';
    const socketOptions = {
      transports: ['websocket'],
      autoConnect: true,
      auth: {
        token: `Bearer ${token}`
      },
      extraHeaders: {
        Authorization: `Bearer ${token}`
      }
    };

    // Initialize socket connections
    this.agentsSocket = io('http://localhost:3001/agents', socketOptions);
    this.roomsSocket = io('http://localhost:3001/rooms', socketOptions);
    this.tasksSocket = io('http://localhost:3001/tasks', socketOptions);

    // Add connection event handlers
    this.agentsSocket.on('connect', () => {
      console.log('Connected to agents namespace');
    });

    this.roomsSocket.on('connect', () => {
      console.log('Connected to rooms namespace');
    });

    this.tasksSocket.on('connect', () => {
      console.log('Connected to tasks namespace');
    });

    this.agentsSocket.on('connect_error', (error) => {
      console.error('Agents socket connection error:', error);
    });

    this.roomsSocket.on('connect_error', (error) => {
      console.error('Rooms socket connection error:', error);
    });

    this.tasksSocket.on('connect_error', (error) => {
      console.error('Tasks socket connection error:', error);
    });
  }

  // Agent events
  onAgentMoved(callback: (agent: AgentData) => void) {
    this.agentsSocket.on('agents:moved', (data) => {
      console.log('Agent moved:', data);
      callback(data);
    });
  }

  onAgentStatusChanged(callback: (agent: AgentData) => void) {
    this.agentsSocket.on('agents:status_changed', (data) => {
      console.log('Agent status changed:', data);
      callback(data);
    });
  }

  onInitialAgents(callback: (agents: AgentData[]) => void) {
    this.agentsSocket.on('agents:initial', (data) => {
      console.log('Initial agents received:', data);
      callback(data);
    });
  }

  // Room events
  onInitialRooms(callback: (rooms: Room[]) => void) {
    this.roomsSocket.on('rooms:initial', (data) => {
      console.log('Initial rooms received:', data);
      callback(data);
    });
  }

  onAgentJoinedRoom(callback: (data: { roomId: string; agent: AgentData }) => void) {
    this.roomsSocket.on('rooms:agent_joined', (data) => {
      console.log('Agent joined room:', data);
      callback(data);
    });
  }

  onAgentLeftRoom(callback: (data: { agent: AgentData }) => void) {
    this.roomsSocket.on('rooms:agent_left', (data) => {
      console.log('Agent left room:', data);
      callback(data);
    });
  }

  onRoomUpdated(callback: (room: Room) => void) {
    this.roomsSocket.on('rooms:updated', (data) => {
      console.log('Room updated:', data);
      callback(data);
    });
  }

  // Task events
  onTaskAssigned(callback: (data: { agentId: string; taskId: string }) => void) {
    this.tasksSocket.on('tasks:assigned', (data) => {
      console.log('Task assigned:', data);
      callback(data);
    });
  }

  onTaskStatusChanged(callback: (data: { taskId: string; status: string }) => void) {
    this.tasksSocket.on('tasks:status_updated', (data) => {
      console.log('Task status changed:', data);
      callback(data);
    });
  }

  // Cleanup
  disconnect() {
    console.log('Disconnecting WebSocket connections...');
    this.agentsSocket.disconnect();
    this.roomsSocket.disconnect();
    this.tasksSocket.disconnect();
  }
}

export const websocketService = new WebSocketService(); 