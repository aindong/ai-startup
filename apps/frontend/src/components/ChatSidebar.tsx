import React from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  rooms: Array<{
    id: string;
    name: string;
    type: 'DEVELOPMENT' | 'MARKETING' | 'SALES' | 'MEETING';
    unreadCount?: number;
  }>;
  agents: Array<{
    id: string;
    name: string;
    role: string;
    status: string;
    unreadCount?: number;
  }>;
  selectedChannelId?: string;
  onSelectChannel: (channelId: string, type: 'room' | 'agent') => void;
}

export function ChatSidebar({
  isOpen,
  onToggle,
  rooms,
  agents,
  selectedChannelId,
  onSelectChannel,
}: ChatSidebarProps) {
  return (
    <div 
      className={cn(
        'fixed right-0 top-0 h-full w-80 transform transition-transform duration-300 ease-in-out z-20',
        !isOpen && 'translate-x-full'
      )}
    >
      <Card className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Chat</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-slate-400 hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </Button>
        </div>

        <div className="space-y-6 flex-1 overflow-y-auto">
          {/* Rooms Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-2">Rooms</h3>
            <div className="space-y-1">
              {rooms.map((room) => (
                <button
                  key={room.id}
                  onClick={() => onSelectChannel(room.id, 'room')}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg text-left transition-colors duration-200',
                    selectedChannelId === room.id
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span>#</span>
                      <span>{room.name}</span>
                    </span>
                    {room.unreadCount ? (
                      <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                        {room.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Direct Messages Section */}
          <div>
            <h3 className="text-sm font-semibold text-slate-400 mb-2">Direct Messages</h3>
            <div className="space-y-1">
              {agents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => onSelectChannel(agent.id, 'agent')}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg text-left transition-colors duration-200',
                    selectedChannelId === agent.id
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className={cn(
                        'w-2 h-2 rounded-full',
                        agent.status === 'ACTIVE' ? 'bg-green-400' :
                        agent.status === 'BUSY' ? 'bg-yellow-400' :
                        'bg-slate-400'
                      )} />
                      <span>{agent.name}</span>
                    </span>
                    {agent.unreadCount ? (
                      <span className="bg-purple-500 text-white text-xs px-2 py-1 rounded-full">
                        {agent.unreadCount}
                      </span>
                    ) : null}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
} 