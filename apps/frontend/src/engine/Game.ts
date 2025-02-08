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
  type: 'DEVELOPMENT' | 'MARKETING' | 'SALES' | 'MEETING';
  metadata: {
    gridX: number;
    gridY: number;
    gridWidth: number;
    gridHeight: number;
    color: string;
  };
}

export interface AgentData {
  id: string;
  name: string;
  role: string;
  state: string;
  location: {
    room: string;
    x: number;
    y: number;
  } | null;
}

export class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;
  private gridSize = 32; // Size of each grid cell
  private agents: Agent[] = [];
  private rooms: Room[] = [];
  private lastTime: number = 0;
  private mousePosition: { x: number; y: number } | null = null;

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

    // Add mouse move listener
    this.canvas.addEventListener('mousemove', (event) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mousePosition = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      };
    });

    // Get token and initialize WebSocket
    const token = localStorage.getItem('token');
    if (token) {
      websocketService.initialize(token);
      // Initialize WebSocket listeners
      this.initializeWebSocketListeners();
    } else {
      console.error('No authentication token found');
    }
  }

  private initializeWebSocketListeners() {
    // Listen for initial rooms data
    websocketService.onInitialRooms((rooms: Room[]) => {
      console.log('🏢 Setting up rooms:', rooms);
      this.rooms = rooms;
    });

    // Listen for room updates
    websocketService.onRoomUpdated((roomData: Room) => {
      console.log('🔄 Updating room:', roomData);
      const index = this.rooms.findIndex(r => r.id === roomData.id);
      if (index !== -1) {
        this.rooms[index] = roomData;
      }
    });

    // Listen for initial agents data
    websocketService.onInitialAgents((agents: AgentData[]) => {
      console.log('👥 Setting up agents:', agents);
      this.agents = agents.map(agentData => {
        console.log('🤖 Creating agent:', agentData);
        return new Agent({
          id: agentData.id,
          name: agentData.name,
          role: agentData.role as AgentOptions['role'],
          state: agentData.state as AgentOptions['state'],
          location: agentData.location ? {
            room: agentData.location.room,
            x: agentData.location.x,
            y: agentData.location.y
          } : null
        }, this.rooms, this.gridSize);
      });
      console.log('👥 Agents initialized:', this.agents);
    });

    // Listen for agent movements
    websocketService.onAgentMoved((agentData: AgentData) => {
      console.log('🔄 Moving agent:', agentData);
      const agent = this.getAgent(agentData.id);
      if (agent && agentData.location) {
        const target = new Vector2(
          agentData.location.x * this.gridSize,
          agentData.location.y * this.gridSize
        );
        console.log('📍 Moving agent to:', target);
        agent.moveTo(target);
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
      if (agent && agentData.location) {
        agent.setLocation({
          room: roomId,
          x: agentData.location.x,
          y: agentData.location.y
        });
      }
    });

    websocketService.onAgentLeftRoom(({ agent: agentData }: { agent: AgentData }) => {
      const agent = this.getAgent(agentData.id);
      if (agent && agentData.location) {
        agent.setLocation({
          room: '',
          x: agentData.location.x,
          y: agentData.location.y
        });
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
    console.log('🎨 Rendering agents:', this.agents.length);
    this.agents.forEach(agent => {
      console.log('🎨 Rendering agent:', agent.id, agent.location);
      agent.render(this.ctx);
    });

    // Draw mouse position debug info
    this.drawMouseDebugInfo();
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
    const x = room.metadata.gridX * this.gridSize;
    const y = room.metadata.gridY * this.gridSize;
    const width = room.metadata.gridWidth * this.gridSize;
    const height = room.metadata.gridHeight * this.gridSize;

    // Draw room background
    this.ctx.fillStyle = room.metadata.color;
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
        if (Math.abs((room1.metadata.gridX + room1.metadata.gridWidth) - room2.metadata.gridX) === 0 ||
            Math.abs(room1.metadata.gridX - (room2.metadata.gridX + room2.metadata.gridWidth)) === 0) {
          // Check vertical overlap
          const overlapStart = Math.max(room1.metadata.gridY, room2.metadata.gridY);
          const overlapEnd = Math.min(room1.metadata.gridY + room1.metadata.gridHeight, room2.metadata.gridY + room2.metadata.gridHeight);
          
          if (overlapEnd - overlapStart >= 2) {
            // Draw door in middle of overlap
            const doorY = Math.floor((overlapStart + overlapEnd - 2) / 2);
            const doorX = Math.min(room1.metadata.gridX + room1.metadata.gridWidth, room2.metadata.gridX);

            this.drawDoorway(doorX, doorY, false);
          }
        }

        // Check vertical adjacency
        if (Math.abs((room1.metadata.gridY + room1.metadata.gridHeight) - room2.metadata.gridY) === 0 ||
            Math.abs(room1.metadata.gridY - (room2.metadata.gridY + room2.metadata.gridHeight)) === 0) {
          // Check horizontal overlap
          const overlapStart = Math.max(room1.metadata.gridX, room2.metadata.gridX);
          const overlapEnd = Math.min(room1.metadata.gridX + room1.metadata.gridWidth, room2.metadata.gridX + room2.metadata.gridWidth);
          
          if (overlapEnd - overlapStart >= 2) {
            // Draw door in middle of overlap
            const doorX = Math.floor((overlapStart + overlapEnd - 2) / 2);
            const doorY = Math.min(room1.metadata.gridY + room1.metadata.gridHeight, room2.metadata.gridY);

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

  public getAgent(id: string): Agent | undefined {
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
    return this.agents.filter(agent => agent.location.room === roomId);
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
    const roomX = room.metadata.gridX * this.gridSize;
    const roomY = room.metadata.gridY * this.gridSize;
    const roomWidth = room.metadata.gridWidth * this.gridSize;
    const roomHeight = room.metadata.gridHeight * this.gridSize;

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

  private drawMouseDebugInfo() {
    if (!this.mousePosition) return;

    const screenX = Math.round(this.mousePosition.x);
    const screenY = Math.round(this.mousePosition.y);
    const gridX = Math.floor(screenX / this.gridSize);
    const gridY = Math.floor(screenY / this.gridSize);

    // Draw text background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 200, 60);

    // Draw text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`Screen: (${screenX}, ${screenY})`, 20, 30);
    this.ctx.fillText(`Grid: (${gridX}, ${gridY})`, 20, 50);

    // Draw crosshair at mouse position
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.lineWidth = 1;
    
    // Vertical line
    this.ctx.beginPath();
    this.ctx.moveTo(screenX, 0);
    this.ctx.lineTo(screenX, this.height);
    this.ctx.stroke();

    // Horizontal line
    this.ctx.beginPath();
    this.ctx.moveTo(0, screenY);
    this.ctx.lineTo(this.width, screenY);
    this.ctx.stroke();
  }
} 