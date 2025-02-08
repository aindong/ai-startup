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
  message?: {
    content: string;
    type: 'SPEECH' | 'THOUGHT' | 'TASK' | 'DECISION';
  };
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
  private lastRandomWalkTime: number = 0;
  private randomWalkInterval: number = 3000; // Random walk every 3 seconds
  private selectedAgent: Agent | null = null;
  private simulationSpeed: number = 1;
  private randomWalkEnabled: boolean = true;
  private debugEnabled: boolean = false;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 0;
  private readonly FPS_UPDATE_INTERVAL = 1000; // Update FPS every second

  // Add callback for agent changes
  public onAgentsChange?: (agents: Agent[]) => void;

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

    // Listen for agent messages
    websocketService.onAgentMessage((data) => {
      console.log('💬 Agent message received:', data);
      const agent = this.getAgent(data.agentId);
      if (agent) {
        agent.addMessage(data.message.content, data.message.type);
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

    // Update FPS counter
    this.frameCount++;
    if (currentTime - this.lastFpsUpdate >= this.FPS_UPDATE_INTERVAL) {
      this.currentFps = Math.round((this.frameCount * 1000) / (currentTime - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = currentTime;
    }

    // Update all agents with adjusted deltaTime for simulation speed
    this.agents.forEach(agent => agent.update(deltaTime * this.simulationSpeed));

    // Random walk check
    if (this.randomWalkEnabled && currentTime - this.lastRandomWalkTime > this.randomWalkInterval) {
      this.lastRandomWalkTime = currentTime;
      this.performRandomWalks();
    }
  }

  private performRandomWalks() {
    this.agents.forEach(agent => {
      // 30% chance to move
      if (Math.random() < 0.3) {
        const room = this.rooms.find(r => r.id === agent.location.room);
        if (room) {
          // Calculate random position within the room
          const randomX = Math.floor(Math.random() * room.metadata.gridWidth) + room.metadata.gridX;
          const randomY = Math.floor(Math.random() * room.metadata.gridHeight) + room.metadata.gridY;
          
          console.log(`🚶 Agent ${agent.name} random walking to:`, { x: randomX, y: randomY });
          
          // Move agent to new position
          agent.moveTo(new Vector2(
            randomX * this.gridSize,
            randomY * this.gridSize
          ));
        }
      }
    });
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

    // Draw selected agent's path
    if (this.selectedAgent) {
      this.drawAgentPath(this.selectedAgent);
    }

    // Draw agents
    this.agents.forEach(agent => {
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
    // Notify about agent changes
    this.onAgentsChange?.(this.agents);
    return agent;
  }

  public removeAgent(id: string) {
    this.agents = this.agents.filter(agent => agent.id !== id);
    // Notify about agent changes
    this.onAgentsChange?.(this.agents);
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
    if (!this.debugEnabled || !this.mousePosition) return;

    const screenX = Math.round(this.mousePosition.x);
    const screenY = Math.round(this.mousePosition.y);
    const gridX = Math.floor(screenX / this.gridSize);
    const gridY = Math.floor(screenY / this.gridSize);

    // Draw text background
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(10, 10, 200, 100); // Increased height to accommodate FPS

    // Draw text
    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '14px monospace';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(`FPS: ${this.currentFps}`, 20, 30);
    this.ctx.fillText(`Screen: (${screenX}, ${screenY})`, 20, 50);
    this.ctx.fillText(`Grid: (${gridX}, ${gridY})`, 20, 70);
    this.ctx.fillText(`Selected: ${this.selectedAgent?.name || 'None'}`, 20, 90);

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

  public getClickedAgent(x: number, y: number): Agent | null {
    // Convert screen coordinates to grid coordinates
    const gridX = x / this.gridSize;
    const gridY = y / this.gridSize;

    // Check each agent
    for (const agent of this.agents) {
      const dx = gridX - agent.location.x;
      const dy = gridY - agent.location.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Check if click is within agent's circle (size/2 in grid units)
      if (distance < (agent.size / 2) / this.gridSize) {
        return agent;
      }
    }
    
    return null;
  }

  public selectAgent(agent: Agent | null) {
    if (this.selectedAgent) {
      // Deselect current agent
      this.selectedAgent.isSelected = false;
    }
    this.selectedAgent = agent;
    if (agent) {
      agent.isSelected = true;
    }
  }

  public getSelectedAgent(): Agent | null {
    return this.selectedAgent;
  }

  public handleClick(x: number, y: number, isRightClick: boolean = false) {
    if (isRightClick) {
      // Right click deselects current agent
      if (this.selectedAgent) {
        this.selectedAgent.isSelected = false;
        this.selectedAgent = null;
      }
      return;
    }

    const clickedAgent = this.getClickedAgent(x, y);
    
    if (clickedAgent) {
      // If we click an agent, select it
      this.selectAgent(clickedAgent);
      clickedAgent.addMessage(clickedAgent.getSelectionMessage(), 'SPEECH');
    } else if (this.selectedAgent) {
      // If we have a selected agent and click empty space, move the agent
      const gridX = Math.floor(x / this.gridSize);
      const gridY = Math.floor(y / this.gridSize);
      
      // Check if clicked position is in a room
      const targetRoom = this.getRoomAtPosition(new Vector2(x, y));
      if (targetRoom) {
        this.selectedAgent.moveTo(new Vector2(
          gridX * this.gridSize,
          gridY * this.gridSize
        ));
        this.selectedAgent.addMessage("Moving!", 'TASK');
      }
    }
  }

  private drawAgentPath(agent: Agent) {
    if (!agent.path || agent.path.length === 0) return;

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.beginPath();

    const startPos = new Vector2(agent.location.x * this.gridSize, agent.location.y * this.gridSize);
    this.ctx.moveTo(startPos.x, startPos.y);

    agent.path.forEach(point => {
      this.ctx.lineTo(point.x, point.y);
    });

    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  public setSimulationSpeed(speed: number) {
    this.simulationSpeed = speed;
    // Update agent speeds using the new updateSpeed method
    this.agents.forEach(agent => {
      agent.updateSpeed(speed);
    });
  }

  public toggleRandomWalk(enabled: boolean) {
    this.randomWalkEnabled = enabled;
    if (!enabled) {
      // Stop all agents from random walking
      this.agents.forEach(agent => {
        if (!agent.isSelected) {
          agent.path = [];
        }
      });
    }
  }

  public toggleDebug(enabled: boolean) {
    this.debugEnabled = enabled;
  }

  public resetSimulation() {
    // Reset all agents to their initial positions
    this.agents.forEach(agent => {
      const room = this.rooms.find(r => r.type === agent.role.toUpperCase());
      if (room) {
        const x = room.metadata.gridX + Math.floor(room.metadata.gridWidth / 2);
        const y = room.metadata.gridY + Math.floor(room.metadata.gridHeight / 2);
        agent.setLocation({
          room: room.id,
          x: x,
          y: y
        });
      }
    });

    // Reset all agent states
    this.agents.forEach(agent => {
      agent.state = 'IDLE';
    });

    // Clear selection
    this.selectAgent(null);
  }
} 