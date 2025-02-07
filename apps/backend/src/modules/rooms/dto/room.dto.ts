import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(['DEVELOPMENT', 'MARKETING', 'SALES', 'MEETING'])
  type: 'DEVELOPMENT' | 'MARKETING' | 'SALES' | 'MEETING';
}

export class UpdateRoomDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsEnum(['DEVELOPMENT', 'MARKETING', 'SALES', 'MEETING'])
  @IsOptional()
  type?: 'DEVELOPMENT' | 'MARKETING' | 'SALES' | 'MEETING';
}

export class RoomResponse {
  id: string;
  name: string;
  type: 'DEVELOPMENT' | 'MARKETING' | 'SALES' | 'MEETING';
  agents: Array<{
    id: string;
    name: string;
    role: string;
    status: 'ACTIVE' | 'BREAK' | 'IDLE';
    location: {
      x: number;
      y: number;
    };
  }>;
  messages: Array<{
    id: string;
    content: string;
    type: 'CHAT' | 'DECISION' | 'TASK_UPDATE';
    agent: {
      id: string;
      name: string;
      role: string;
    };
    timestamp: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}
