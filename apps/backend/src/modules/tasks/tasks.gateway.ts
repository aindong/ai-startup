import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UseGuards } from '@nestjs/common';
import { WsJwtAuthGuard } from '../auth/guards/ws-jwt-auth.guard';
import { TasksService } from './tasks.service';
import { AgentTask } from './entities/agent-task.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'tasks',
})
@UseGuards(WsJwtAuthGuard)
export class TasksGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly tasksService: TasksService) {}

  async handleConnection(client: Socket) {
    // Send initial tasks data
    const tasks = await this.tasksService.findAll();
    client.emit('tasks:initial', tasks);
  }

  handleDisconnect(client: Socket) {
    // Handle client disconnection
  }

  @SubscribeMessage('tasks:status_update')
  async handleStatusUpdate(
    client: Socket,
    payload: {
      taskId: string;
      status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
    },
  ) {
    const updatedTask = await this.tasksService.updateStatus(
      payload.taskId,
      payload.status,
    );
    this.server.emit('tasks:status_updated', updatedTask);
  }

  @SubscribeMessage('tasks:assign')
  async handleTaskAssignment(
    client: Socket,
    payload: { taskId: string; agentId: string },
  ) {
    const updatedTask = await this.tasksService.assignToAgent(
      payload.taskId,
      payload.agentId,
    );
    this.server.emit('tasks:assigned', updatedTask);
  }

  // Broadcast task updates to all connected clients
  broadcastTaskUpdate(task: AgentTask) {
    this.server.emit('tasks:updated', task);
  }

  // Broadcast new task creation
  broadcastNewTask(task: AgentTask) {
    this.server.emit('tasks:created', task);
  }

  // Broadcast task deletion
  broadcastTaskDeletion(taskId: string) {
    this.server.emit('tasks:deleted', { id: taskId });
  }
}
