import { Vector2 } from '../utils/Vector2';

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
  
  private position: Vector2;
  private targetPosition: Vector2;
  private velocity: Vector2;
  private path: Vector2[] = [];
  private currentPathIndex = 0;
  private moveSpeed = 120; // pixels per second
  private size = 24; // Size of the agent circle
  private isMoving = false;

  constructor(options: AgentOptions) {
    this.id = options.id;
    this.name = options.name;
    this.role = options.role;
    this.state = options.state;
    this.room = options.room;
    this.position = new Vector2(options.position.x, options.position.y);
    this.targetPosition = this.position.clone();
    this.velocity = Vector2.zero();
  }

  public getPosition(): Vector2 {
    return this.position.clone();
  }

  public setPosition(position: Vector2) {
    this.position = position.clone();
    this.targetPosition = position.clone();
    this.path = [];
    this.isMoving = false;
  }

  public moveTo(target: Vector2, path?: Vector2[]) {
    if (path) {
      this.path = path;
      this.currentPathIndex = 0;
      this.targetPosition = this.path[0];
    } else {
      this.targetPosition = target.clone();
      this.path = [];
    }
    this.isMoving = true;
  }

  public update(deltaTime: number) {
    if (!this.isMoving) return;

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

    // Draw agent circle
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size / 2, 0, Math.PI * 2);
    ctx.fillStyle = this.getRoleColor();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.closePath();

    // Draw state indicator
    this.drawStateIndicator(ctx);

    // Draw name label
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, this.position.x, this.position.y + this.size);

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

  private drawStateIndicator(ctx: CanvasRenderingContext2D) {
    const indicatorSize = 8;
    const x = this.position.x + this.size / 2;
    const y = this.position.y - this.size / 2;

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