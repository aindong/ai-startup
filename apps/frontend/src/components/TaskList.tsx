interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';
  assignedTo?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

interface TaskListProps {
  tasks: Task[];
}

export function TaskList({ tasks }: TaskListProps) {
  return (
    <div className="w-[320px] bg-slate-900/90 backdrop-blur shadow-xl ring-1 ring-white/10 rounded-xl p-6 pointer-events-auto">
      <h2 className="text-xl font-bold mb-4 text-white flex items-center gap-3">
        <div className="w-3 h-3 rounded-full bg-blue-400" />
        Tasks
      </h2>
      <div className="space-y-3 max-h-[300px] overflow-auto pr-2">
        {tasks.map((task) => (
          <div
            key={task.id}
            className="bg-slate-800/50 rounded-lg p-3 hover:bg-slate-800/70 transition-colors cursor-pointer group"
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
                  Assigned to: {task.assignedTo}
                </span>
              )}
            </div>
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-center text-slate-400">No tasks available</p>
        )}
      </div>
    </div>
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