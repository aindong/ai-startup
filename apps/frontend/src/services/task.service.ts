import { websocketService } from './websocket.service';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  assignedTo?: {
    id: string;
    name: string;
  } | null;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  metadata?: {
    [key: string]: string | number | boolean | null;
  };
}

export interface CreateTaskDto {
  title: string;
  description: string;
  priority: Task['priority'];
  assignedTo: string | null;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface UpdateTaskDto extends Partial<CreateTaskDto> {
  status?: Task['status'];
}

class TaskService {
  private tasks: Task[] = [];
  private listeners: ((tasks: Task[]) => void)[] = [];

  constructor() {
    this.setupWebSocketListeners();
  }

  private setupWebSocketListeners() {
    websocketService.onTaskAssigned(({ taskId, agentId }) => {
      this.updateTaskAssignment(taskId, agentId);
    });

    websocketService.onTaskStatusChanged(({ taskId, status }) => {
      this.updateTaskStatus(taskId, status as Task['status']);
    });
  }

  async fetchTasks(): Promise<Task[]> {
    try {
      const response = await fetch('http://localhost:3001/tasks', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }

      const tasks = await response.json();
      this.tasks = tasks;
      this.notifyListeners();
      return tasks;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  }

  async createTask(data: {
    title: string;
    description: string;
    priority: Task['priority'];
    assignedTo?: string;
  }): Promise<Task | null> {
    try {
      const response = await fetch('http://localhost:3001/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      const task = await response.json();
      this.tasks.push(task);
      this.notifyListeners();
      return task;
    } catch (error) {
      console.error('Error creating task:', error);
      return null;
    }
  }

  async updateTask(taskId: string, data: Partial<Task>): Promise<Task | null> {
    try {
      const response = await fetch(`http://localhost:3001/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      const updatedTask = await response.json();
      this.tasks = this.tasks.map(task => 
        task.id === taskId ? updatedTask : task
      );
      this.notifyListeners();
      return updatedTask;
    } catch (error) {
      console.error('Error updating task:', error);
      return null;
    }
  }

  private updateTaskAssignment(taskId: string, agentId: string) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.assignedTo = { id: agentId, name: 'Loading...', role: 'Unknown' };
      this.notifyListeners();
    }
  }

  private updateTaskStatus(taskId: string, status: Task['status']) {
    const task = this.tasks.find(t => t.id === taskId);
    if (task) {
      task.status = status;
      this.notifyListeners();
    }
  }

  subscribe(listener: (tasks: Task[]) => void) {
    this.listeners.push(listener);
    listener(this.tasks); // Initial state
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.tasks));
  }
}

export const taskService = new TaskService(); 