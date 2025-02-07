import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';
import { AgentRole } from '@ai-startup/shared';
import { AgentState } from '../types/agent-state.types';

const AGENT_ROLES = ['CEO', 'CTO', 'ENGINEER', 'MARKETER', 'SALES'] as const;
const AGENT_STATES = [
  'IDLE',
  'WORKING',
  'COLLABORATING',
  'BREAK',
  'THINKING',
] as const;

class LocationDto {
  @IsString()
  @IsNotEmpty()
  room: string;

  @IsNumber()
  x: number;

  @IsNumber()
  y: number;
}

export class CreateAgentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(AGENT_ROLES)
  role: AgentRole;

  @ValidateNested()
  @Type(() => LocationDto)
  location: LocationDto;
}

export class UpdateAgentDto {
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsEnum(AGENT_STATES)
  state?: AgentState;

  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}

export class AssignTaskDto {
  @IsString()
  @IsNotEmpty()
  taskId: string;
}
