import React from 'react';
import { Card } from './ui/Card';
import { Select } from './ui/Select';
import { Switch } from './ui/Switch';
import { Button } from './ui/Button';

interface ControlPanelProps {
  onSpeedChange: (speed: string) => void;
  onToggleRandomWalk: (enabled: boolean) => void;
  onToggleDebugInfo: (enabled: boolean) => void;
  onResetSimulation?: () => void;
}

export const ControlPanel = React.memo(function ControlPanel({ 
  onSpeedChange, 
  onToggleRandomWalk, 
  onToggleDebugInfo,
  onResetSimulation,
}: ControlPanelProps) {
  const speedOptions = [
    { value: 'slow', label: 'Slow' },
    { value: 'normal', label: 'Normal' },
    { value: 'fast', label: 'Fast' },
  ];

  return (
    <Card
      title="Controls"
      indicator={{ color: 'bg-purple-400' }}
    >
      <div className="space-y-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Select
              label="Simulation Speed"
              options={speedOptions}
              defaultValue="normal"
              onChange={(e) => onSpeedChange(e.target.value)}
              variant="ghost"
            />
          </div>

          <Switch
            label="Random Walk"
            defaultChecked
            onChange={(e) => onToggleRandomWalk(e.target.checked)}
          />

          <Switch
            label="Debug Info"
            onChange={(e) => onToggleDebugInfo(e.target.checked)}
          />
        </div>

        <div className="h-px bg-white/10" />

        <Button
          variant="secondary"
          className="w-full"
          onClick={onResetSimulation}
        >
          Reset Simulation
        </Button>
      </div>
    </Card>
  );
}); 