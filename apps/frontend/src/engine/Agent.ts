import { Vector2 } from '../utils/Vector2';
import { Pathfinding } from '../utils/Pathfinding';
import { Navigation } from '../utils/Navigation';
import { Room } from './Game';

export type AgentRole = 'CEO' | 'CTO' | 'ENGINEER' | 'MARKETER' | 'SALES';
export type AgentState = 'IDLE' | 'WORKING' | 'COLLABORATING' | 'BREAK' | 'THINKING';
export type MessageType = 'SPEECH' | 'THOUGHT' | 'TASK' | 'DECISION';

export interface AgentMessage {
  id: string;
  type: MessageType;
  content: string;
  duration: number; // How long the message should be displayed in seconds
  createdAt: number; // Timestamp when the message was created
}

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
  public size = 24; // Size of the agent circle
  public isSelected = false;
  private isMoving = false;
  private selectionPulseTime = 0;
  private readonly pulseSpeed = 2; // Pulses per second
  private readonly pulseRange = 0.3; // Pulse intensity range (0.3 = 30%)

  public location: {
    room: string;
    x: number;
    y: number;
  };
  
  private targetLocation: Vector2;
  private velocity: Vector2;
  public path: Vector2[] = [];
  private currentPathIndex = 0;
  private baseSpeed = 120; // Base pixels per second
  private currentSpeed: number;
  private rooms: Room[] = []; // Reference to game rooms
  private gridSize = 32; // Reference to game grid size
  private animationTime = 0;
  private bounceHeight = 4; // Maximum bounce height in pixels
  private bounceSpeed = 5; // Bounce cycles per second
  private messages: AgentMessage[] = [];
  private readonly maxMessages = 3; // Maximum number of messages to show at once
  private readonly messageDuration = 5; // Default duration in seconds
  private readonly bubblePadding = 10;
  private readonly bubbleRadius = 5;
  private readonly maxBubbleWidth = 150;
  private readonly bubbleMargin = 5;
  private readonly bubbleOffset = 40; // Offset from agent center

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

    // Update messages
    const currentTime = performance.now();
    this.messages = this.messages.filter(message => {
      const messageAge = (currentTime - message.createdAt) / 1000;
      return messageAge < message.duration;
    });
  }

  public render(ctx: CanvasRenderingContext2D) {
    // Convert grid coordinates to screen coordinates
    const screenX = this.location.x * this.gridSize;
    const screenY = this.location.y * this.gridSize;
    const position = new Vector2(screenX, screenY);
    
    // Apply bounce effect
    const bounceOffset = Math.sin(this.animationTime * this.bounceSpeed) * this.bounceHeight;
    position.y -= this.isMoving ? bounceOffset : 0;

    // Draw selection effect if selected
    if (this.isSelected) {
      // Update pulse animation
      this.selectionPulseTime += 0.016; // Assuming 60fps
      const pulseScale = 1 + Math.sin(this.selectionPulseTime * this.pulseSpeed * Math.PI * 2) * this.pulseRange;
      
      // Draw outer glow
      const gradient = ctx.createRadialGradient(
        position.x, position.y, this.size * 0.5,
        position.x, position.y, this.size * pulseScale
      );
      gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(position.x, position.y, this.size * pulseScale, 0, Math.PI * 2);
      ctx.fill();

      // Draw selection ring
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(position.x, position.y, this.size * 0.7, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Draw agent circle
    ctx.fillStyle = this.getRoleColor();
    ctx.beginPath();
    ctx.arc(position.x, position.y, this.size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Draw state indicator
    this.drawStateIndicator(ctx, position);

    // Draw agent name below the circle
    ctx.fillStyle = '#ffffff';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(this.name, position.x, position.y + this.size * 0.8);

    // Draw messages
    this.drawMessages(ctx, position.x, position.y);
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

  public addMessage(content: string, type: MessageType = 'SPEECH', duration?: number) {
    const message: AgentMessage = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      content,
      duration: duration || this.messageDuration,
      createdAt: performance.now()
    };

    this.messages.push(message);
    
    // Keep only the most recent messages up to maxMessages
    if (this.messages.length > this.maxMessages) {
      this.messages.shift();
    }
  }

  private drawMessages(ctx: CanvasRenderingContext2D, x: number, y: number) {
    if (this.messages.length === 0) return;

    // First calculate total height of all messages
    let totalHeight = 0;
    const messageHeights: number[] = [];
    const currentTime = performance.now();

    // Pre-calculate message heights and total height
    this.messages.forEach(message => {
      const messageAge = (currentTime - message.createdAt) / 1000;
      const opacity = this.getMessageOpacity(messageAge, message.duration);
      
      if (opacity <= 0) return;

      const lines = this.wrapText(ctx, message.content, this.maxBubbleWidth - 2 * this.bubblePadding);
      const bubbleHeight = lines.length * 20 + 2 * this.bubblePadding;
      messageHeights.push(bubbleHeight);
      totalHeight += bubbleHeight + this.bubbleMargin;
    });

    // Start drawing from just above the agent
    let currentY = y - this.size - 10; // Start closer to the agent
    
    // If there's only one message, position it directly above the agent
    if (this.messages.length === 1) {
      const bubbleHeight = messageHeights[0];
      currentY -= bubbleHeight / 2;
    } else {
      // For multiple messages, stack them upward
      currentY -= totalHeight;
    }

    this.messages.forEach((message, index) => {
      const messageAge = (currentTime - message.createdAt) / 1000;
      const opacity = this.getMessageOpacity(messageAge, message.duration);
      
      if (opacity <= 0) return;

      const lines = this.wrapText(ctx, message.content, this.maxBubbleWidth - 2 * this.bubblePadding);
      const bubbleHeight = messageHeights[index];
      
      // Draw bubble
      ctx.save();
      ctx.globalAlpha = opacity;
      
      // Draw bubble background
      this.drawBubbleBackground(ctx, x, currentY, this.maxBubbleWidth, bubbleHeight);
      
      // Draw text
      ctx.fillStyle = '#000000';
      ctx.font = '14px Arial';
      ctx.textAlign = 'left';
      lines.forEach((line, lineIndex) => {
        ctx.fillText(
          line,
          x - this.maxBubbleWidth / 2 + this.bubblePadding,
          currentY - bubbleHeight / 2 + this.bubblePadding + (lineIndex + 1) * 20
        );
      });
      
      ctx.restore();
      
      currentY += bubbleHeight + this.bubbleMargin;
    });
  }

  private drawBubbleBackground(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number
  ) {
    const radius = this.bubbleRadius;
    const pointHeight = 10;
    const pointWidth = 20;

    ctx.beginPath();
    // Top left corner
    ctx.moveTo(x - width/2 + radius, y - height/2);
    // Top right corner
    ctx.lineTo(x + width/2 - radius, y - height/2);
    ctx.quadraticCurveTo(x + width/2, y - height/2, x + width/2, y - height/2 + radius);
    // Bottom right corner
    ctx.lineTo(x + width/2, y + height/2 - radius);
    ctx.quadraticCurveTo(x + width/2, y + height/2, x + width/2 - radius, y + height/2);
    // Point start
    ctx.lineTo(x + pointWidth/2, y + height/2);
    // Point
    ctx.lineTo(x, y + height/2 + pointHeight);
    ctx.lineTo(x - pointWidth/2, y + height/2);
    // Bottom left corner
    ctx.lineTo(x - width/2 + radius, y + height/2);
    ctx.quadraticCurveTo(x - width/2, y + height/2, x - width/2, y + height/2 - radius);
    // Top left corner
    ctx.lineTo(x - width/2, y - height/2 + radius);
    ctx.quadraticCurveTo(x - width/2, y - height/2, x - width/2 + radius, y - height/2);

    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private getMessageOpacity(age: number, duration: number): number {
    const fadeInDuration = 0.3;
    const fadeOutDuration = 0.5;
    
    if (age < fadeInDuration) {
      // Fade in
      return age / fadeInDuration;
    } else if (age > duration - fadeOutDuration) {
      // Fade out
      return (duration - age) / fadeOutDuration;
    }
    return 1;
  }

  private wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const word = words[i];
      const width = ctx.measureText(currentLine + ' ' + word).width;
      if (width < maxWidth) {
        currentLine += ' ' + word;
      } else {
        lines.push(currentLine);
        currentLine = word;
      }
    }
    lines.push(currentLine);
    return lines;
  }

  public getSelectionMessage(): string {
    const greetings = ["Hey there!", "Hello!", "Hi!", "Greetings!"];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    
    let roleMessage = "";
    switch (this.role) {
      case 'CEO':
        roleMessage = "I'm leading the company's vision.";
        break;
      case 'CTO':
        roleMessage = "I'm overseeing our tech strategy.";
        break;
      case 'ENGINEER':
        roleMessage = "I'm working on our codebase.";
        break;
      case 'MARKETER':
        roleMessage = "I'm planning our next campaign.";
        break;
      case 'SALES':
        roleMessage = "I'm closing deals with clients.";
        break;
    }

    let stateMessage = "";
    switch (this.state) {
      case 'WORKING':
        stateMessage = "Currently focused on work.";
        break;
      case 'COLLABORATING':
        stateMessage = "Working with the team.";
        break;
      case 'BREAK':
        stateMessage = "Taking a quick break.";
        break;
      case 'THINKING':
        stateMessage = "Brainstorming ideas.";
        break;
      case 'IDLE':
        stateMessage = "Ready for new tasks.";
        break;
    }

    return `${greeting} I'm ${this.name}. ${roleMessage} ${stateMessage}`;
  }
} 