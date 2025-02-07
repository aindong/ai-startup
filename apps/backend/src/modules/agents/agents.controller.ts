import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { AgentsService } from './services/agents.service';
import { CreateAgentDto, UpdateAgentDto } from './dto/agent.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Agent } from './entities/agent.entity';
import { AgentState } from './types/agent-state.types';

@Controller('agents')
@UseGuards(JwtAuthGuard)
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post()
  create(@Body() createAgentDto: CreateAgentDto): Promise<Agent> {
    return this.agentsService.create(createAgentDto);
  }

  @Get()
  findAll(): Promise<Agent[]> {
    return this.agentsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Agent> {
    return this.agentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateAgentDto: UpdateAgentDto,
  ): Promise<Agent> {
    return this.agentsService.update(id, updateAgentDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.agentsService.remove(id);
  }

  @Patch(':id/location')
  updateLocation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() location: { room: string; x: number; y: number },
  ): Promise<Agent> {
    return this.agentsService.updateLocation(id, location);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: AgentState,
  ): Promise<Agent> {
    return this.agentsService.updateState(id, status);
  }
}
