import { useState } from 'react';
import { Task } from '../services/task.service';
import { TaskForm } from './TaskForm';
import { useTasks } from '../hooks/useTasks';

interface TaskListProps {
  tasks?: Task[];
}

export function TaskList({ tasks: propTasks }: TaskListProps) {
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { data: tasks = [], isLoading, error } = useTasks();

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowTaskForm(true);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setShowTaskForm(true);
  };

  const handleCloseForm = () => {
    setShowTaskForm(false);
    setEditingTask(null);
  };

  if (isLoading) {
    return (
      <div className="w-full bg-slate-900/90 backdrop-blur shadow-xl ring-1 ring-white/10 rounded-xl p-6 pointer-events-auto">
        <div className="flex items-center justify-center h-[200px]">
          <div className="text-slate-400">Loading tasks...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full bg-slate-900/90 backdrop-blur shadow-xl ring-1 ring-white/10 rounded-xl p-6 pointer-events-auto">
        <div className="flex items-center justify-center h-[200px]">
          <div className="text-red-400">Error loading tasks</div>
        </div>
      </div>
    );
  }

  const displayTasks = propTasks || tasks;

  return (
    <>
      <div className="w-full bg-slate-900/90 backdrop-blur shadow-xl ring-1 ring-white/10 rounded-xl p-6 pointer-events-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-blue-400" />
            Tasks
          </h2>
          <button
            onClick={handleCreateTask}
            className="px-2 py-1 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Task
          </button>
        </div>
        <div className="space-y-3 max-h-[300px] overflow-auto pr-2">
          {displayTasks.map((task) => (
            <div
              key={task.id}
              className="bg-slate-800/50 rounded-lg p-3 hover:bg-slate-800/70 transition-colors cursor-pointer group"
              onClick={() => handleEditTask(task)}
            >
              <div className="flex items-start justify-between">
                <h3 className="font-medium text-white group-hover:text-blue-400 transition-colors">
                  {task.title}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                  {task.status}
                </span>
                {task.assignedTo && (
                  <span className="text-xs text-slate-400">
                    Assigned to: {task.assignedTo.name}
                  </span>
                )}
              </div>
            </div>
          ))}
          {displayTasks.length === 0 && (
            <p className="text-center text-slate-400">No tasks available</p>
          )}
        </div>
      </div>

      {showTaskForm && (
        <TaskForm
          task={editingTask ?? undefined}
          onClose={handleCloseForm}
          onSuccess={handleCloseForm}
        />
      )}
    </>
  );
}

function getPriorityColor(priority: Task['priority']) {
  switch (priority) {
    case 'HIGH':
      return 'bg-red-500/20 text-red-400';
    case 'MEDIUM':
      return 'bg-yellow-500/20 text-yellow-400';
    case 'LOW':
      return 'bg-green-500/20 text-green-400';
  }
}

function getStatusColor(status: Task['status']) {
  switch (status) {
    case 'TODO':
      return 'bg-slate-500/20 text-slate-400';
    case 'IN_PROGRESS':
      return 'bg-blue-500/20 text-blue-400';
    case 'REVIEW':
      return 'bg-purple-500/20 text-purple-400';
    case 'DONE':
      return 'bg-green-500/20 text-green-400';
  }
} 