import React, { useCallback } from 'react';
import { Agent } from '../engine/Agent';
import { TaskList } from './TaskList';
import { ControlPanel } from './ControlPanel';
import { Card } from './ui/Card';

interface GameUIProps {
  selectedAgent: Agent | null;
  onSpeedChange?: (speed: number) => void;
  onRandomWalkToggle?: (enabled: boolean) => void;
  onDebugToggle?: (enabled: boolean) => void;
  onReset?: () => void;
}

export function GameUI({ 
  selectedAgent,
  onSpeedChange,
  onRandomWalkToggle,
  onDebugToggle,
  onReset,
}: GameUIProps) {
  const handleSpeedChange = useCallback((newSpeed: string) => {
    if (onSpeedChange) {
      // Convert speed string to multiplier
      const multiplier = newSpeed === 'slow' ? 0.5 : newSpeed === 'fast' ? 2 : 1;
      onSpeedChange(multiplier);
    }
  }, [onSpeedChange]);

  const handleToggleRandomWalk = useCallback((enabled: boolean) => {
    onRandomWalkToggle?.(enabled);
  }, [onRandomWalkToggle]);

  const handleToggleDebugInfo = useCallback((enabled: boolean) => {
    onDebugToggle?.(enabled);
  }, [onDebugToggle]);

  return (
    <div className="w-full h-full">
      <div className="absolute top-6 right-6 flex flex-col gap-6 min-w-[320px] pointer-events-auto">
        {/* Agent Info Panel */}
        {selectedAgent && (
          <Card
            title={selectedAgent.name}
            indicator={{ color: 'bg-emerald-400', pulse: true }}
          >
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
          </Card>
        )}

        {/* Task List Panel */}
        <TaskList />

        {/* Control Panel */}
        <ControlPanel
          onSpeedChange={handleSpeedChange}
          onToggleRandomWalk={handleToggleRandomWalk}
          onToggleDebugInfo={handleToggleDebugInfo}
          onResetSimulation={onReset}
        />
      </div>
    </div>
  );
} 