import { io, Socket } from 'socket.io-client';

export interface Message {
  id: string;
  content: string;
  type: 'CHAT' | 'DECISION' | 'TASK_UPDATE';
  sender: {
    id: string;
    name: string;
  };
  channelId: string;
  channelType: 'room' | 'agent';
  timestamp: string;
  fromCurrentUser?: boolean;
}

export interface SendMessageOptions {
  channelId: string;
  channelType: 'room' | 'agent';
  content: string;
  type: 'CHAT' | 'DECISION' | 'TASK_UPDATE';
}

export class ChatService {
  private socket: Socket | null = null;
  private messageHandlers: ((message: Message) => void)[] = [];

  initialize(token: string) {
    this.socket = io('http://localhost:3001', {
      auth: {
        token
      }
    });

    this.socket.on('message', (message: Message) => {
      this.messageHandlers.forEach(handler => handler(message));
    });

    this.socket.on('error', (error: Error) => {
      console.error('Chat socket error:', error);
    });
  }

  joinChannel(channelId: string, channelType: 'room' | 'agent') {
    if (!this.socket) return;
    this.socket.emit('join_channel', { channelId, channelType });
  }

  leaveChannel(channelId: string, channelType: 'room' | 'agent') {
    if (!this.socket) return;
    this.socket.emit('leave_channel', { channelId, channelType });
  }

  sendMessage(options: SendMessageOptions) {
    if (!this.socket) return;
    this.socket.emit('message', options);
  }

  onMessage(handler: (message: Message) => void) {
    this.messageHandlers.push(handler);
  }

  offMessage(handler: (message: Message) => void) {
    this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
  }

  disconnect() {
    if (!this.socket) return;
    this.socket.disconnect();
    this.socket = null;
    this.messageHandlers = [];
  }
}

export const chatService = new ChatService(); 