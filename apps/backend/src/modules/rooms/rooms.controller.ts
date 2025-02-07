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
import { RoomsService } from './rooms.service';
import { CreateRoomDto, UpdateRoomDto } from './dto/room.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Room } from './entities/room.entity';
import { Agent } from '../agents/entities/agent.entity';

@Controller('rooms')
@UseGuards(JwtAuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  create(@Body() createRoomDto: CreateRoomDto): Promise<Room> {
    return this.roomsService.create(createRoomDto);
  }

  @Get()
  findAll(): Promise<Room[]> {
    return this.roomsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Room> {
    return this.roomsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ): Promise<Room> {
    return this.roomsService.update(id, updateRoomDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.roomsService.remove(id);
  }

  @Get(':id/agents')
  getAgentsInRoom(@Param('id', ParseUUIDPipe) id: string): Promise<Agent[]> {
    return this.roomsService.getAgentsInRoom(id);
  }

  @Post(':id/agents/:agentId')
  addAgentToRoom(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('agentId', ParseUUIDPipe) agentId: string,
  ): Promise<Room> {
    return this.roomsService.addAgentToRoom(id, agentId);
  }

  @Delete(':id/agents/:agentId')
  removeAgentFromRoom(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('agentId', ParseUUIDPipe) agentId: string,
  ): Promise<Room> {
    return this.roomsService.removeAgentFromRoom(id, agentId);
  }
}
