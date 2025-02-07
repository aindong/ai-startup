import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsString, IsUUID } from 'class-validator';
import { AgentRole } from '@ai-startup/shared';

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(AgentRole)
  role: AgentRole;

  @IsObject()
  location: {
    @IsString()
    @IsNotEmpty()
    room: string;

    @IsNumber()
    x: number;

    @IsNumber()
    y: number;
  };
}

export class UpdateAgentDto {
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsEnum(['ACTIVE', 'BREAK', 'IDLE'])
  status?: 'ACTIVE' | 'BREAK' | 'IDLE';

  @IsObject()
  location?: {
    @IsString()
    @IsNotEmpty()
    room: string;

    @IsNumber()
    x: number;

    @IsNumber()
    y: number;
  };
}

export class AssignTaskDto {
  @IsUUID()
  taskId: string;
} 