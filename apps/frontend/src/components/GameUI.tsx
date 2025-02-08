import { Agent } from '../engine/Agent';
import { TaskList } from './TaskList';
import { ControlPanel } from './ControlPanel';

interface GameUIProps {
  selectedAgent: Agent | null;
}

// Mock tasks for now - later we'll fetch these from the backend
const mockTasks = [
  {
    id: '1',
    title: 'Implement new feature',
    status: 'IN_PROGRESS' as const,
    assignedTo: 'agent1',
    priority: 'HIGH' as const,
  },
  {
    id: '2',
    title: 'Review code changes',
    status: 'TODO' as const,
    assignedTo: 'agent2',
    priority: 'MEDIUM' as const,
  },
  {
    id: '3',
    title: 'Debug production issue',
    status: 'REVIEW' as const,
    assignedTo: 'agent3',
    priority: 'HIGH' as const,
  },
];

export function GameUI({ selectedAgent }: GameUIProps) {
  const handleSpeedChange = (speed: string) => {
    console.log('Speed changed:', speed);
    // TODO: Implement speed change
  };

  const handleToggleRandomWalk = (enabled: boolean) => {
    console.log('Random walk toggled:', enabled);
    // TODO: Implement random walk toggle
  };

  const handleToggleDebugInfo = (enabled: boolean) => {
    console.log('Debug info toggled:', enabled);
    // TODO: Implement debug info toggle
  };

  return (
    <div className="w-full h-full">
      <div className="absolute top-6 right-6 flex flex-col gap-6 min-w-[320px] pointer-events-auto">
        {/* Agent Info Panel */}
        {selectedAgent && (
          <div className="w-full bg-slate-900/90 backdrop-blur shadow-xl ring-1 ring-white/10 rounded-xl p-6">
            <h3 className="text-xl font-bold mb-4 text-white flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              {selectedAgent.name}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Role</span>
                <span className="text-white font-medium">{selectedAgent.role}</span>
              </div>
              <div className="h-px bg-white/10" />
              <div className="flex justify-between items-center">
                <span className="text-slate-400">State</span>
                <span className="text-white font-medium">{selectedAgent.state}</span>
              </div>
            </div>
          </div>
        )}

        {/* Task List Panel */}
        <TaskList tasks={mockTasks} />

        {/* Control Panel */}
        <ControlPanel
          onSpeedChange={handleSpeedChange}
          onToggleRandomWalk={handleToggleRandomWalk}
          onToggleDebugInfo={handleToggleDebugInfo}
        />
      </div>
    </div>
  );
} 