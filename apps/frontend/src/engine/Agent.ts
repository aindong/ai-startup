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
  position: {
    x: number;
    y: number;
  };
  room: string;
}

export class Agent {
  public id: string;
  public name: string;
  public role: AgentRole;
  public state: AgentState;
  public room: string;
  public position: Vector2;
  
  private targetPosition: Vector2;
  private velocity: Vector2;
  private path: Vector2[] = [];
  private currentPathIndex = 0;
  private moveSpeed = 120; // pixels per second
  private size = 24; // Size of the agent circle
  private isMoving = false;
  private rooms: Room[] = []; // Reference to game rooms
  private gridSize = 32; // Reference to game grid size
  private animationTime = 0;
  private bounceHeight = 4; // Maximum bounce height in pixels
  private bounceSpeed = 5; // Bounce cycles per second

  constructor(options: AgentOptions, rooms: Room[], gridSize: number) {
    this.id = options.id;
    this.name = options.name;
    this.role = options.role;
    this.state = options.state;
    this.room = options.room;
    this.position = new Vector2(options.position.x, options.position.y);
    this.targetPosition = this.position.clone();
    this.velocity = Vector2.zero();
    this.rooms = rooms;
    this.gridSize = gridSize;
  }

  public getPositionData(): { x: number; y: number } {
    return {
      x: this.position.x,
      y: this.position.y
    };
  }

  public setPosition(position: Vector2) {
    this.position = position.clone();
    this.targetPosition = position.clone();
    this.path = [];
    this.isMoving = false;
  }

  public moveTo(target: Vector2) {
    // First try to find a path between rooms if needed
    const path = Navigation.findRoomPath(this.position, target, this.rooms, this.gridSize);
    
    if (path.length > 0) {
      // Use room-to-room path
      this.path = path;
      this.currentPathIndex = 0;
      this.targetPosition = this.path[0];
    } else {
      // Use A* pathfinding for local navigation
      const isWalkable = (pos: Vector2) => Navigation.isWalkable(pos, this.rooms, this.gridSize);
      this.path = Pathfinding.findPath(this.position, target, isWalkable, this.gridSize);
      
      if (this.path.length > 0) {
        this.currentPathIndex = 0;
        this.targetPosition = this.path[0];
      } else {
        // If no path found, try direct movement
        this.targetPosition = target.clone();
        this.path = [];
      }
    }
    
    this.isMoving = true;
  }

  public update(deltaTime: number) {
    if (!this.isMoving) return;

    // Update animation time
    this.animationTime += deltaTime;

    const distanceToTarget = this.position.distance(this.targetPosition);
    const moveDistance = this.moveSpeed * deltaTime;

    if (distanceToTarget <= moveDistance) {
      // Reached current target
      this.position = this.targetPosition.clone();

      if (this.path.length > 0) {
        // Move to next point in path
        this.currentPathIndex++;
        if (this.currentPathIndex < this.path.length) {
          this.targetPosition = this.path[this.currentPathIndex];
        } else {
          // Reached end of path
          this.isMoving = false;
          this.path = [];
        }
      } else {
        // Reached final target
        this.isMoving = false;
      }
    } else {
      // Move towards target
      const direction = this.targetPosition.subtract(this.position).normalize();
      this.velocity = direction.multiply(this.moveSpeed);
      this.position = this.position.add(this.velocity.multiply(deltaTime));
    }
  }

  public render(ctx: CanvasRenderingContext2D) {
    // Save context state
    ctx.save();

    // Calculate bounce offset
    const bounceOffset = this.isMoving ? 
      Math.sin(this.animationTime * this.bounceSpeed * Math.PI * 2) * this.bounceHeight : 
      0;

    // Apply bounce to position
    const renderPos = new Vector2(this.position.x, this.position.y - bounceOffset);

    // Draw agent circle
    ctx.beginPath();
    ctx.arc(renderPos.x, renderPos.y, this.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = this.getRoleColor();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // Draw state indicator
    this.drawStateIndicator(ctx, renderPos);

    // Draw name label
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, renderPos.x, renderPos.y + this.size);

    // Draw path (for debugging)
    if (this.path.length > 0) {
      ctx.beginPath();
      ctx.moveTo(this.position.x, this.position.y);
      this.path.slice(this.currentPathIndex).forEach(point => {
        ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Restore context state
    ctx.restore();
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