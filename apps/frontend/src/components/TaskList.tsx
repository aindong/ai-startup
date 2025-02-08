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
    <div className="fixed top-[180px] right-5 w-[300px] bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-4">
      <h2 className="text-xl font-bold mb-4 text-white">Tasks</h2>
      <div className="h-[300px] overflow-auto">
        {tasks.map((task, index) => (
          <div key={task.id}>
            <div className="p-2 rounded hover:bg-white/5 transition-colors">
              <div>
                <p className="font-medium text-white">{task.title}</p>
                <div className="flex gap-3 mt-1">
                  <span className="text-sm text-gray-400">Status: {task.status}</span>
                  <span className="text-sm text-gray-400">Priority: {task.priority}</span>
                </div>
              </div>
            </div>
            {index < tasks.length - 1 && <div className="h-px bg-white/10 my-2" />}
          </div>
        ))}
        {tasks.length === 0 && (
          <p className="text-center text-gray-400">No tasks available</p>
        )}
      </div>
    </div>
  );
} 