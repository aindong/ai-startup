import { Agent, AgentOptions } from './Agent';
import { websocketService } from '../services/websocket.service';
import { Vector2 } from '../utils/Vector2';

export interface GameOptions {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

export interface Room {
  id: string;
  name: string;
  gridX: number;
  gridY: number;
  gridWidth: number;
  gridHeight: number;
  color: string;
}

export interface AgentData {
  id: string;
  name: string;
  role: string;
  state: string;
  position: {
    x: number;
    y: number;
  };
  room: string;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private gridSize = 32; // Size of each grid cell
  private agents: Agent[] = [];
  private rooms: Room[] = [
    {
      id: 'dev',
      name: 'Development',
      gridX: 2,
      gridY: 2,
      gridWidth: 10,
      gridHeight: 8,
      color: '#2a4858'
    },
    {
      id: 'marketing',
      name: 'Marketing',
      gridX: 13,
      gridY: 2,
      gridWidth: 8,
      gridHeight: 6,
      color: '#2d4b1e'
    },
    {
      id: 'sales',
      name: 'Sales',
      gridX: 13,
      gridY: 9,
      gridWidth: 8,
      gridHeight: 6,
      color: '#4b1e1e'
    },
    {
      id: 'meeting',
      name: 'Meeting',
      gridX: 2,
      gridY: 11,
      gridWidth: 10,
      gridHeight: 4,
      color: '#463366'
    }
  ];
  private lastTime: number = 0;

  constructor(options: GameOptions) {
    this.canvas = options.canvas;
    this.width = options.width;
    this.height = options.height;

    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Could not get canvas context');
    }
    this.ctx = context;

    // Set canvas size
    this.resize(this.width, this.height);

    // Initialize WebSocket listeners
    this.initializeWebSocketListeners();

    // Initialize some test agents
    this.initializeTestAgents();
  }

  private initializeWebSocketListeners() {
    // Listen for initial agents data
    websocketService.onInitialAgents((agents: AgentData[]) => {
      this.agents = agents.map(agentData => 
        new Agent({
          id: agentData.id,
          name: agentData.name,
          role: agentData.role as AgentOptions['role'],
          state: agentData.state as AgentOptions['state'],
          position: agentData.position,
          room: agentData.room
        }, this.rooms, this.gridSize)
      );
    });

    // Listen for agent movements
    websocketService.onAgentMoved((agentData: AgentData) => {
      const agent = this.getAgent(agentData.id);
      if (agent) {
        const newPosition = new Vector2(agentData.position.x, agentData.position.y);
        agent.moveTo(newPosition);
      }
    });

    // Listen for agent status changes
    websocketService.onAgentStatusChanged((agentData: AgentData) => {
      const agent = this.getAgent(agentData.id);
      if (agent) {
        agent.state = agentData.state as AgentOptions['state'];
      }
    });

    // Listen for room changes
    websocketService.onAgentJoinedRoom(({ roomId, agent: agentData }: { roomId: string; agent: AgentData }) => {
      const agent = this.getAgent(agentData.id);
      if (agent) {
        agent.room = roomId;
      }
    });

    websocketService.onAgentLeftRoom(({ agent: agentData }: { agent: AgentData }) => {
      const agent = this.getAgent(agentData.id);
      if (agent) {
        agent.room = '';
      }
    });
  }

  public resize(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
  }

  public update(currentTime: number) {
    const deltaTime = (currentTime - this.lastTime) / 1000; // Convert to seconds
    this.lastTime = currentTime;

    // Update all agents
    this.agents.forEach(agent => agent.update(deltaTime));
  }

  public render(currentTime: number) {
    // Update game state
    this.update(currentTime);

    // Clear the canvas
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw grid
    this.drawGrid();

    // Draw rooms
    this.drawRooms();

    // Draw agents
    this.agents.forEach(agent => agent.render(this.ctx));
  }

  private drawGrid() {
    this.ctx.strokeStyle = '#333333';
    this.ctx.lineWidth = 1;

    // Draw vertical lines
    for (let x = 0; x <= this.width; x += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, this.height);
      this.ctx.stroke();
    }

    // Draw horizontal lines
    for (let y = 0; y <= this.height; y += this.gridSize) {
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(this.width, y);
      this.ctx.stroke();
    }
  }

  private drawRooms() {
    this.rooms.forEach(room => {
      this.drawRoom(room);
    });

    // Draw doorways
    this.drawDoorways();
  }

  private drawRoom(room: Room) {
    const x = room.gridX * this.gridSize;
    const y = room.gridY * this.gridSize;
    const width = room.gridWidth * this.gridSize;
    const height = room.gridHeight * this.gridSize;

    // Draw room background
    this.ctx.fillStyle = room.color;
    this.ctx.fillRect(x, y, width, height);

    // Draw room border
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);

    // Draw room label
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(room.name, x + width / 2, y + 24);
  }

  private drawDoorways() {
    // Draw doorways between adjacent rooms
    for (let i = 0; i < this.rooms.length; i++) {
      for (let j = i + 1; j < this.rooms.length; j++) {
        const room1 = this.rooms[i];
        const room2 = this.rooms[j];

        // Check horizontal adjacency
        if (Math.abs((room1.gridX + room1.gridWidth) - room2.gridX) === 0 ||
            Math.abs(room1.gridX - (room2.gridX + room2.gridWidth)) === 0) {
          // Check vertical overlap
          const overlapStart = Math.max(room1.gridY, room2.gridY);
          const overlapEnd = Math.min(room1.gridY + room1.gridHeight, room2.gridY + room2.gridHeight);
          
          if (overlapEnd - overlapStart >= 2) {
            // Draw door in middle of overlap
            const doorY = Math.floor((overlapStart + overlapEnd - 2) / 2);
            const doorX = Math.min(room1.gridX + room1.gridWidth, room2.gridX);

            this.drawDoorway(doorX, doorY, false);
          }
        }

        // Check vertical adjacency
        if (Math.abs((room1.gridY + room1.gridHeight) - room2.gridY) === 0 ||
            Math.abs(room1.gridY - (room2.gridY + room2.gridHeight)) === 0) {
          // Check horizontal overlap
          const overlapStart = Math.max(room1.gridX, room2.gridX);
          const overlapEnd = Math.min(room1.gridX + room1.gridWidth, room2.gridX + room2.gridWidth);
          
          if (overlapEnd - overlapStart >= 2) {
            // Draw door in middle of overlap
            const doorX = Math.floor((overlapStart + overlapEnd - 2) / 2);
            const doorY = Math.min(room1.gridY + room1.gridHeight, room2.gridY);

            this.drawDoorway(doorX, doorY, true);
          }
        }
      }
    }
  }

  private drawDoorway(gridX: number, gridY: number, isHorizontal: boolean) {
    const x = gridX * this.gridSize;
    const y = gridY * this.gridSize;
    const width = isHorizontal ? this.gridSize * 2 : this.gridSize;
    const height = isHorizontal ? this.gridSize : this.gridSize * 2;

    // Draw doorway
    this.ctx.fillStyle = '#1a1a1a';
    this.ctx.fillRect(x, y, width, height);

    // Draw door frame
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(x, y, width, height);
  }

  private initializeTestAgents() {
    // Add some test agents
    const testAgents: AgentOptions[] = [
      {
        id: '1',
        name: 'Tech Lead',
        role: 'CTO',
        state: 'WORKING',
        position: {
          x: (2 + 5) * this.gridSize,
          y: (2 + 4) * this.gridSize
        },
        room: 'dev'
      },
      {
        id: '2',
        name: 'Senior Dev',
        role: 'ENGINEER',
        state: 'COLLABORATING',
        position: {
          x: (2 + 3) * this.gridSize,
          y: (2 + 4) * this.gridSize
        },
        room: 'dev'
      },
      {
        id: '3',
        name: 'Marketing Lead',
        role: 'MARKETER',
        state: 'THINKING',
        position: {
          x: (13 + 4) * this.gridSize,
          y: (2 + 3) * this.gridSize
        },
        room: 'marketing'
      }
    ];

    this.agents = testAgents.map(agentData => 
      new Agent(agentData, this.rooms, this.gridSize)
    );
  }

  private getAgent(id: string): Agent | undefined {
    return this.agents.find(agent => agent.id === id);
  }

  public addAgent(options: AgentOptions) {
    const agent = new Agent(options, this.rooms, this.gridSize);
    this.agents.push(agent);
    return agent;
  }

  public removeAgent(id: string) {
    this.agents = this.agents.filter(agent => agent.id !== id);
  }

  public getAgentsInRoom(roomId: string) {
    return this.agents.filter(agent => agent.room === roomId);
  }

  public cleanup() {
    websocketService.disconnect();
  }

  public moveAgent(agentId: string, targetX: number, targetY: number) {
    const agent = this.getAgent(agentId);
    if (!agent) return;

    const target = new Vector2(targetX, targetY);
    agent.moveTo(target);
  }

  private findPath(start: Vector2, end: Vector2): Vector2[] {
    // For now, return a direct path
    // We'll implement A* pathfinding later
    return [end];
  }

  private isPositionInRoom(position: Vector2, room: Room): boolean {
    const roomX = room.gridX * this.gridSize;
    const roomY = room.gridY * this.gridSize;
    const roomWidth = room.gridWidth * this.gridSize;
    const roomHeight = room.gridHeight * this.gridSize;

    return (
      position.x >= roomX &&
      position.x <= roomX + roomWidth &&
      position.y >= roomY &&
      position.y <= roomY + roomHeight
    );
  }

  private getRoomAtPosition(position: Vector2): Room | null {
    return this.rooms.find(room => this.isPositionInRoom(position, room)) || null;
  }
} 