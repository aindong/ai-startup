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
    <div className="fixed inset-0 pointer-events-none">
      {/* Agent Info Panel */}
      {selectedAgent && (
        <div className="fixed top-5 right-5 w-[300px] bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-4 pointer-events-auto">
          <h3 className="text-xl font-bold mb-3 text-white">{selectedAgent.name}</h3>
          <div className="flex flex-col gap-2">
            <p className="text-gray-300">Role: {selectedAgent.role}</p>
            <p className="text-gray-300">State: {selectedAgent.state}</p>
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
  );
} 