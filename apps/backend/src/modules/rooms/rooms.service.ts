import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Room } from './entities/room.entity';
import { CreateRoomDto, UpdateRoomDto } from './dto/room.dto';
import { Agent } from '../agents/entities/agent.entity';

@Injectable()
export class RoomsService {
  constructor(
    @InjectRepository(Room)
    private roomRepository: Repository<Room>,
    @InjectRepository(Agent)
    private agentRepository: Repository<Agent>,
  ) {}

  async create(createRoomDto: CreateRoomDto): Promise<Room> {
    const room = this.roomRepository.create(createRoomDto);
    return this.roomRepository.save(room);
  }

  async findAll(): Promise<Room[]> {
    return this.roomRepository.find({
      relations: ['agents', 'messages', 'messages.agent'],
    });
  }

  async findOne(id: string): Promise<Room> {
    const room = await this.roomRepository.findOne({
      where: { id },
      relations: ['agents', 'messages', 'messages.agent'],
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }

    return room;
  }

  async update(id: string, updateRoomDto: UpdateRoomDto): Promise<Room> {
    const room = await this.findOne(id);
    Object.assign(room, updateRoomDto);
    return this.roomRepository.save(room);
  }

  async remove(id: string): Promise<void> {
    const result = await this.roomRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
  }

  async getAgentsInRoom(id: string): Promise<Agent[]> {
    const room = await this.findOne(id);
    return room.agents;
  }

  async addAgentToRoom(roomId: string, agentId: string): Promise<Room> {
    const [room, agent] = await Promise.all([
      this.findOne(roomId),
      this.agentRepository.findOne({ where: { id: agentId } }),
    ]);

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${agentId} not found`);
    }

    // Update agent's location
    agent.location = {
      room: room.id,
      x: 0, // Default position
      y: 0,
    };
    await this.agentRepository.save(agent);

    // Refresh room data
    return this.findOne(roomId);
  }

  async removeAgentFromRoom(roomId: string, agentId: string): Promise<Room> {
    const [room, agent] = await Promise.all([
      this.findOne(roomId),
      this.agentRepository.findOne({ where: { id: agentId } }),
    ]);

    if (!agent) {
      throw new NotFoundException(`Agent with ID ${agentId} not found`);
    }

    if (agent.location?.room !== room.id) {
      throw new NotFoundException(`Agent is not in this room`);
    }

    // Remove agent's location
    agent.location = null;
    await this.agentRepository.save(agent);

    // Refresh room data
    return this.findOne(roomId);
  }
}
