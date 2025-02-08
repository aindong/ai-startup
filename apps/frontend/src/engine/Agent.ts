import { Vector2 } from '../utils/Vector2';
import { Pathfinding } from '../utils/Pathfinding';
import { Navigation } from '../utils/Navigation';
import { Room } from './Game';

export type AgentRole = 'CEO' | 'CTO' | 'ENGINEER' | 'MARKETER' | 'SALES';
export type AgentState = 'IDLE' | 'WORKING' | 'COLLABORATING' | 'BREAK' | 'THINKING';

export interface AgentOptions {
  id: string;
  name: string;
  role: AgentRole;
  state: AgentState;
  location: {
    room: string;
    x: number;
    y: number;
  } | null;
}

export class Agent {
  public id: string;
  public name: string;
  public role: AgentRole;
  public state: AgentState;
  public location: {
    room: string;
    x: number;
    y: number;
  };
  
  private targetLocation: Vector2;
  private velocity: Vector2;
  private path: Vector2[] = [];
  private currentPathIndex = 0;
  private baseSpeed = 120; // Base pixels per second
  private currentSpeed: number;
  private size = 24; // Size of the agent circle
  private isMoving = false;
  private rooms: Room[] = []; // Reference to game rooms
  private gridSize = 32; // Reference to game grid size
  private animationTime = 0;
  private bounceHeight = 4; // Maximum bounce height in pixels
  private bounceSpeed = 5; // Bounce cycles per second

  constructor(options: AgentOptions, rooms: Room[], gridSize: number) {
    console.log('🤖 Constructing agent:', options);
    this.id = options.id;
    this.name = options.name;
    this.role = options.role;
    this.state = options.state;
    this.location = options.location || { room: '', x: 0, y: 0 };
    this.rooms = rooms;
    this.gridSize = gridSize;
    this.targetLocation = new Vector2(
      this.location.x * gridSize,
      this.location.y * gridSize
    );
    this.velocity = Vector2.zero();
    this.currentSpeed = this.baseSpeed * (0.8 + Math.random() * 0.4); // Random speed variation
    console.log('🤖 Agent constructed:', this);
  }

  public getLocation(): { room: string; x: number; y: number } {
    return {
      room: this.location.room,
      x: this.location.x / this.gridSize,
      y: this.location.y / this.gridSize
    };
  }

  public setLocation(location: { room: string; x: number; y: number }) {
    this.location = {
      room: location.room,
      x: location.x * this.gridSize,
      y: location.y * this.gridSize
    };
    this.targetLocation = new Vector2(this.location.x, this.location.y);
    this.path = [];
    this.isMoving = false;
  }

  public moveTo(target: Vector2) {
    // First try to find a path between rooms if needed
    const currentPos = new Vector2(this.location.x, this.location.y);
    const path = Navigation.findRoomPath(currentPos, target, this.rooms, this.gridSize);
    
    if (path.length > 0) {
      // Use room-to-room path
      this.path = path;
      this.currentPathIndex = 0;
      this.targetLocation = this.path[0];
    } else {
      // Use A* pathfinding for local navigation
      const isWalkable = (pos: Vector2) => Navigation.isWalkable(pos, this.rooms, this.gridSize);
      this.path = Pathfinding.findPath(currentPos, target, isWalkable, this.gridSize);
      
      if (this.path.length > 0) {
        this.currentPathIndex = 0;
        this.targetLocation = this.path[0];
      } else {
        // If no path found, try direct movement
        this.targetLocation = target.clone();
        this.path = [];
      }
    }
    
    this.isMoving = true;
  }

  public update(deltaTime: number) {
    if (this.isMoving) {
      // Update position based on velocity and deltaTime
      const currentPos = new Vector2(
        this.location.x * this.gridSize,
        this.location.y * this.gridSize
      );
      
      const toTarget = this.targetLocation.subtract(currentPos);
      const distance = toTarget.magnitude();
      
      if (distance < 1) {
        // Reached target
        this.location.x = this.targetLocation.x / this.gridSize;
        this.location.y = this.targetLocation.y / this.gridSize;
        this.isMoving = false;
        this.velocity = Vector2.zero();
      } else {
        // Move towards target
        this.velocity = toTarget.normalize().multiply(this.currentSpeed);
        const movement = this.velocity.multiply(deltaTime);
        
        // Update location
        this.location.x = (currentPos.x + movement.x) / this.gridSize;
        this.location.y = (currentPos.y + movement.y) / this.gridSize;
      }
    }

    // Update animation time
    this.animationTime += deltaTime;
  }

  public render(ctx: CanvasRenderingContext2D) {
    const screenX = this.location.x * this.gridSize;
    const screenY = this.location.y * this.gridSize;

    // Calculate bounce offset
    const bounceOffset = this.isMoving ? 
      Math.sin(this.animationTime * this.bounceSpeed * Math.PI * 2) * this.bounceHeight : 0;

    // Draw shadow
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.ellipse(screenX, screenY + this.size/2, this.size/2, this.size/4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Draw agent circle with role color
    ctx.beginPath();
    ctx.fillStyle = this.getRoleColor();
    ctx.arc(screenX, screenY - bounceOffset, this.size/2, 0, Math.PI * 2);
    ctx.fill();

    // Draw agent name
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, screenX, screenY - this.size - bounceOffset);

    // Draw state indicator
    this.drawStateIndicator(ctx, new Vector2(screenX, screenY - bounceOffset));
  }

  private getRoleColor(): string {
    switch (this.role) {
      case 'CEO':
        return '#ffd700'; // Gold
      case 'CTO':
        return '#4169e1'; // Royal Blue
      case 'ENGINEER':
        return '#3498db'; // Blue
      case 'MARKETER':
        return '#2ecc71'; // Green
      case 'SALES':
        return '#e74c3c'; // Red
      default:
        return '#95a5a6'; // Gray
    }
  }

  private drawStateIndicator(ctx: CanvasRenderingContext2D, position: Vector2) {
    const indicatorSize = 8;
    const x = position.x + this.size / 2;
    const y = position.y - this.size / 2;

    ctx.beginPath();
    ctx.arc(x, y, indicatorSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = this.getStateColor();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.closePath();
  }

  private getStateColor(): string {
    switch (this.state) {
      case 'WORKING':
        return '#27ae60'; // Green
      case 'COLLABORATING':
        return '#3498db'; // Blue
      case 'BREAK':
        return '#e74c3c'; // Red
      case 'THINKING':
        return '#f1c40f'; // Yellow
      case 'IDLE':
      default:
        return '#95a5a6'; // Gray
    }
  }
} 