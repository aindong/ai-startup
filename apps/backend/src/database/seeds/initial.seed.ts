import { DataSource } from 'typeorm';
import { Agent } from '../../modules/agents/entities/agent.entity';
import { AgentTask } from '../../modules/tasks/entities/agent-task.entity';
import { Room } from '../../modules/rooms/entities/room.entity';
import { CollaborationSession } from '../../modules/collaboration/entities/collaboration-session.entity';
import { VotingSession } from '../../modules/collaboration/entities/voting-session.entity';
import { Seeder } from '../seeder.interface';
import { AgentRole } from '@ai-startup/shared';

// Room IDs as UUIDs
const ROOM_IDS = {
  DEV: '550e8400-e29b-41d4-a716-446655440000',
  MARKETING: '550e8400-e29b-41d4-a716-446655440001',
  SALES: '550e8400-e29b-41d4-a716-446655440002',
  MEETING: '550e8400-e29b-41d4-a716-446655440003',
};

// Agent IDs as UUIDs
const AGENT_IDS = {
  TECH_LEAD: '550e8400-e29b-41d4-a716-446655440004',
  SENIOR_DEV: '550e8400-e29b-41d4-a716-446655440005',
  MARKETING_LEAD: '550e8400-e29b-41d4-a716-446655440006',
};

export class InitialSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    // Create rooms
    const roomRepository = dataSource.getRepository(Room);
    const rooms = await roomRepository.save([
      {
        name: 'Development',
        type: 'DEVELOPMENT',
        metadata: {
          gridX: 2,
          gridY: 2,
          gridWidth: 10,
          gridHeight: 8,
          color: '#2a4858',
        },
      },
      {
        name: 'Marketing',
        type: 'MARKETING',
        metadata: {
          gridX: 13,
          gridY: 2,
          gridWidth: 8,
          gridHeight: 6,
          color: '#2d4b1e',
        },
      },
      {
        name: 'Sales',
        type: 'SALES',
        metadata: {
          gridX: 13,
          gridY: 9,
          gridWidth: 8,
          gridHeight: 6,
          color: '#4b1e1e',
        },
      },
      {
        name: 'Meeting',
        type: 'MEETING',
        metadata: {
          gridX: 2,
          gridY: 11,
          gridWidth: 10,
          gridHeight: 4,
          color: '#463366',
        },
      },
    ]);

    // Then seed agents
    const agentRepository = dataSource.getRepository(Agent);
    const agents = await agentRepository.save([
      {
        id: AGENT_IDS.TECH_LEAD,
        name: 'Tech Lead',
        role: 'CTO' as AgentRole,
        state: 'WORKING',
        location: {
          room: ROOM_IDS.DEV,
          x: 224,
          y: 192,
        },
        metrics: {
          productivity: 0.9,
          collaboration: 0.8,
          decisionQuality: 0.85,
          taskCompletionRate: 0.9,
          breakTimeEfficiency: 0.7,
        },
        lastStateChange: new Date(),
        lastBreakTime: new Date(),
      },
      {
        id: AGENT_IDS.SENIOR_DEV,
        name: 'Senior Dev',
        role: 'ENGINEER' as AgentRole,
        state: 'COLLABORATING',
        location: {
          room: ROOM_IDS.DEV,
          x: 160,
          y: 192,
        },
        metrics: {
          productivity: 0.85,
          collaboration: 0.9,
          decisionQuality: 0.8,
          taskCompletionRate: 0.85,
          breakTimeEfficiency: 0.8,
        },
        lastStateChange: new Date(),
        lastBreakTime: new Date(),
      },
      {
        id: AGENT_IDS.MARKETING_LEAD,
        name: 'Marketing Lead',
        role: 'MARKETER' as AgentRole,
        state: 'THINKING',
        location: {
          room: ROOM_IDS.MARKETING,
          x: 544,
          y: 160,
        },
        metrics: {
          productivity: 0.8,
          collaboration: 0.85,
          decisionQuality: 0.9,
          taskCompletionRate: 0.8,
          breakTimeEfficiency: 0.85,
        },
        lastStateChange: new Date(),
        lastBreakTime: new Date(),
      },
    ]);

    // Create tasks
    const taskRepository = dataSource.getRepository(AgentTask);
    const tasks = await taskRepository.save([
      {
        title: 'Implement Authentication System',
        description: 'Set up JWT authentication for the API endpoints',
        status: 'IN_PROGRESS',
        assignedTo: agents[1], // Senior Dev
        createdBy: agents[0], // Tech Lead
        priority: 'HIGH',
        metadata: {
          estimatedHours: 8,
          technicalDetails: {
            framework: 'NestJS',
            security: 'JWT',
          },
        },
      },
      {
        title: 'Create Marketing Campaign',
        description: 'Design and launch Q1 marketing campaign',
        status: 'TODO',
        assignedTo: agents[2], // Marketing Lead
        createdBy: agents[0], // Tech Lead
        priority: 'MEDIUM',
        metadata: {
          budget: 5000,
          channels: ['social', 'email', 'content'],
        },
      },
      {
        title: 'Client Presentation',
        description: 'Prepare and deliver product demo to potential client',
        status: 'TODO',
        assignedTo: agents[2], // Marketing Lead
        createdBy: agents[0], // Tech Lead
        priority: 'HIGH',
        metadata: {
          clientName: 'TechCorp Inc',
          meetingDate: '2024-02-15T10:00:00Z',
        },
      },
    ]);

    // Create collaboration session
    const collaborationRepository =
      dataSource.getRepository(CollaborationSession);
    const collaboration = await collaborationRepository.save({
      type: 'TASK_HELP',
      initiator: agents[1], // Senior Dev
      participants: [agents[0]], // Tech Lead
      status: 'ACTIVE',
      context: {
        taskId: tasks[0].id,
        description: 'Need help with authentication implementation',
      },
      votes: [
        {
          agentId: agents[0].id,
          vote: 'APPROVE',
          reason: 'Available to help with technical guidance',
          timestamp: new Date(),
        },
      ],
      startTime: new Date(),
    });

    // Create voting session
    const votingRepository = dataSource.getRepository(VotingSession);
    await votingRepository.save({
      collaboration: collaboration,
      topic: 'Authentication Method Decision',
      description: 'Choose the best authentication method for our system',
      options: [
        {
          id: '1',
          description: 'JWT with refresh tokens',
          pros: ['Stateless', 'Scalable'],
          cons: ['Token size', "Can't revoke immediately"],
        },
        {
          id: '2',
          description: 'Session-based with Redis',
          pros: ['Revokable', 'Smaller payload'],
          cons: ['Additional infrastructure', 'State management'],
        },
      ],
      votes: [],
      status: 'OPEN',
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    });
  }
}
