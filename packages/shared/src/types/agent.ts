export type AgentRole = 
  | 'CEO'
  | 'CTO'
  | 'ENGINEER'
  | 'MARKETER'
  | 'SALES';

export interface Agent {
  id: string;
  name: string;
  role: AgentRole;
  status: 'ACTIVE' | 'BREAK' | 'IDLE';
  currentTask?: string;
  location: {
    room: string;
    x: number;
    y: number;
  };
}

export interface AgentTask {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  assignedTo: string;
  createdBy: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentMessage {
  id: string;
  content: string;
  agentId: string;
  roomId: string;
  type: 'CHAT' | 'DECISION' | 'TASK_UPDATE';
  timestamp: Date;
}

export interface Room {
  id: string;
  name: string;
  type: 'DEVELOPMENT' | 'MARKETING' | 'SALES' | 'MEETING';
  agents: Agent[];
} 