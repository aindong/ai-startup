import { DataSource } from 'typeorm';
import { Agent } from '../../modules/agents/entities/agent.entity';
import { AgentTask } from '../../modules/tasks/entities/agent-task.entity';
import { Room } from '../../modules/rooms/entities/room.entity';
import { CollaborationSession } from '../../modules/collaboration/entities/collaboration-session.entity';
import { VotingSession } from '../../modules/collaboration/entities/voting-session.entity';
import { Seeder } from '../seeder.interface';

interface Identifier {
  id: string;
}

export class InitialSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    // Create rooms
    const rooms = await dataSource
      .createQueryBuilder()
      .insert()
      .into(Room)
      .values([
        {
          name: 'Development Room',
          type: 'DEVELOPMENT',
        },
        {
          name: 'Marketing Room',
          type: 'MARKETING',
        },
        {
          name: 'Sales Room',
          type: 'SALES',
        },
        {
          name: 'Meeting Room',
          type: 'MEETING',
        },
      ])
      .execute();

    const roomIds = rooms.identifiers as Identifier[];

    // Create agents
    const agents = await dataSource
      .createQueryBuilder()
      .insert()
      .into(Agent)
      .values([
        {
          name: 'Tech Lead',
          role: 'CTO',
          state: 'IDLE',
          location: {
            room: roomIds[0].id,
            x: 100,
            y: 100,
          },
          metrics: {
            productivity: 0.9,
            collaboration: 0.85,
            decisionQuality: 0.95,
            taskCompletionRate: 0.88,
            breakTimeEfficiency: 0.92,
          },
        },
        {
          name: 'Senior Engineer',
          role: 'ENGINEER',
          state: 'WORKING',
          location: {
            room: roomIds[0].id,
            x: 200,
            y: 100,
          },
          metrics: {
            productivity: 0.85,
            collaboration: 0.8,
            decisionQuality: 0.9,
            taskCompletionRate: 0.85,
            breakTimeEfficiency: 0.88,
          },
        },
        {
          name: 'Marketing Manager',
          role: 'MARKETER',
          state: 'IDLE',
          location: {
            room: roomIds[1].id,
            x: 100,
            y: 100,
          },
          metrics: {
            productivity: 0.87,
            collaboration: 0.92,
            decisionQuality: 0.88,
            taskCompletionRate: 0.9,
            breakTimeEfficiency: 0.85,
          },
        },
        {
          name: 'Sales Representative',
          role: 'SALES',
          state: 'COLLABORATING',
          location: {
            room: roomIds[2].id,
            x: 100,
            y: 100,
          },
          metrics: {
            productivity: 0.82,
            collaboration: 0.95,
            decisionQuality: 0.85,
            taskCompletionRate: 0.87,
            breakTimeEfficiency: 0.9,
          },
        },
      ])
      .execute();

    const agentIds = agents.identifiers as Identifier[];

    // Create tasks
    const tasks = await dataSource
      .createQueryBuilder()
      .insert()
      .into(AgentTask)
      .values([
        {
          title: 'Implement Authentication System',
          description: 'Set up JWT authentication for the API endpoints',
          status: 'IN_PROGRESS',
          assignedTo: { id: agentIds[1].id },
          createdBy: { id: agentIds[0].id },
          priority: 'HIGH',
          metadata: () =>
            `'${JSON.stringify({
              estimatedHours: 8,
              technicalDetails: {
                framework: 'NestJS',
                security: 'JWT',
              },
            })}'`,
        },
        {
          title: 'Create Marketing Campaign',
          description: 'Design and launch Q1 marketing campaign',
          status: 'TODO',
          assignedTo: { id: agentIds[2].id },
          createdBy: { id: agentIds[0].id },
          priority: 'MEDIUM',
          metadata: () =>
            `'${JSON.stringify({
              budget: 5000,
              channels: ['social', 'email', 'content'],
            })}'`,
        },
        {
          title: 'Client Presentation',
          description: 'Prepare and deliver product demo to potential client',
          status: 'TODO',
          assignedTo: { id: agentIds[3].id },
          createdBy: { id: agentIds[0].id },
          priority: 'HIGH',
          metadata: () =>
            `'${JSON.stringify({
              clientName: 'TechCorp Inc',
              meetingDate: '2024-02-15T10:00:00Z',
            })}'`,
        },
      ])
      .execute();

    const taskIds = tasks.identifiers as Identifier[];

    // Create collaboration session
    await dataSource
      .createQueryBuilder()
      .insert()
      .into(CollaborationSession)
      .values([
        {
          type: 'TASK_HELP',
          initiator: { id: agentIds[1].id },
          participants: [{ id: agentIds[0].id }],
          status: 'ACTIVE',
          context: () =>
            `'${JSON.stringify({
              taskId: taskIds[0].id,
              description: 'Need help with authentication implementation',
            })}'`,
          votes: () =>
            `'${JSON.stringify([
              {
                agentId: agentIds[0].id,
                vote: 'APPROVE',
                reason: 'Available to help with technical guidance',
                timestamp: new Date(),
              },
            ])}'`,
          startTime: new Date(),
        },
      ])
      .execute();

    // Create voting session
    await dataSource
      .createQueryBuilder()
      .insert()
      .into(VotingSession)
      .values([
        {
          topic: 'Authentication Method Decision',
          description: 'Choose the best authentication method for our system',
          options: () =>
            `'${JSON.stringify([
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
            ])}'`,
          votes: () => `'${JSON.stringify([])}'`,
          status: 'OPEN',
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
        },
      ])
      .execute();
  }
}
