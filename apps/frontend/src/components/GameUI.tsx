import { useState } from 'react';
import { Agent } from '../engine/Agent';
import { Room } from '../engine/Game';
import { Card } from './ui/Card';
import { TaskList } from './TaskList';
import { ControlPanel } from './ControlPanel';
import { Chat } from './Chat';
import { ChatSidebar } from './ChatSidebar';

interface GameUIProps {
  selectedAgent: Agent | null;
  agents: Agent[];
  rooms: Room[];
  onSpeedChange: (speed: number) => void;
  onRandomWalkToggle: (enabled: boolean) => void;
  onDebugToggle: (enabled: boolean) => void;
  onReset: () => void;
}

export function GameUI({
  selectedAgent,
  agents,
  rooms,
  onSpeedChange,
  onRandomWalkToggle,
  onDebugToggle,
  onReset,
}: GameUIProps) {
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [selectedChannel, setSelectedChannel] = useState<{
    id: string;
    type: 'room' | 'agent';
  } | null>(null);

  const handleChannelSelect = (channelId: string, type: 'room' | 'agent') => {
    setSelectedChannel({ id: channelId, type });
    if (!isChatOpen) {
      setIsChatOpen(true);
    }
  };

  // Convert agents to the format expected by ChatSidebar
  const agentList = agents.map(agent => ({
    id: agent.id,
    name: agent.name,
    role: agent.role,
    status: agent.state,
    unreadCount: 0, // TODO: Implement unread count
  }));

  // Convert rooms to the format expected by ChatSidebar
  const roomList = rooms.map(room => ({
    id: room.id,
    name: room.name,
    type: room.type,
    unreadCount: 0, // TODO: Implement unread count
  }));

  return (
    <div className="w-full h-full pointer-events-none">
      {/* Right side UI */}
      <div className="absolute top-6 right-6 flex flex-col gap-6 pointer-events-auto w-[400px]">
        {/* Agent Info & Task List */}
        <div className="space-y-6">
          {selectedAgent && (
            <Card title={selectedAgent.name}>
              <p className="text-slate-300">{selectedAgent.getSelectionMessage()}</p>
            </Card>
          )}
          <TaskList />
        </div>

        {/* Control Panel */}
        <ControlPanel
          onSpeedChange={(speed) => onSpeedChange(parseFloat(speed))}
          onToggleRandomWalk={onRandomWalkToggle}
          onToggleDebugInfo={onDebugToggle}
          onResetSimulation={onReset}
        />
      </div>

      {/* Chat UI */}
      <div className="absolute top-6 right-[424px] bottom-6 pointer-events-auto">
        <ChatSidebar
          isOpen={isChatOpen}
          onToggle={() => setIsChatOpen(!isChatOpen)}
          rooms={roomList}
          agents={agentList}
          selectedChannelId={selectedChannel?.id}
          onSelectChannel={handleChannelSelect}
        />
      </div>

      {/* Active Chat */}
      {isChatOpen && selectedChannel && (
        <div className="absolute bottom-6 right-[424px] pointer-events-auto w-[400px]">
          <Chat
            channelId={selectedChannel.id}
            channelType={selectedChannel.type}
            channelName={
              selectedChannel.type === 'room'
                ? rooms.find((r) => r.id === selectedChannel.id)?.name || ''
                : agents.find((a) => a.id === selectedChannel.id)?.name || ''
            }
          />
        </div>
      )}
    </div>
  );
} 