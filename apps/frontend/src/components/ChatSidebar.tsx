import { useState } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Message } from '../services/chat.service';

interface ChatSidebarProps {
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
  rooms,
  agents,
  selectedChannelId,
  onSelectChannel,
}: ChatSidebarProps) {
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [newMessage, setNewMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]); // TODO: Replace with real messages
  const selectedRoom = rooms.find(r => r.id === selectedChannelId);
  const selectedAgent = agents.find(a => a.id === selectedChannelId);

  const handleBack = () => {
    setView('list');
    setMessages([]);
    setNewMessage('');
  };

  const handleChannelSelect = (channelId: string, type: 'room' | 'agent') => {
    onSelectChannel(channelId, type);
    setView('chat');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    // TODO: Implement real message sending
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      content: newMessage,
      type: 'CHAT',
      sender: { id: 'user', name: 'You' },
      channelId: selectedChannelId!,
      channelType: selectedRoom ? 'room' : 'agent',
      timestamp: new Date().toISOString(),
      fromCurrentUser: true,
    }]);
    setNewMessage('');
  };

  return (
    <Card className="h-[calc(100vh-3rem)] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-slate-800 space-y-4">
        {/* Action Buttons */}
        <div className="flex items-center">
          {view === 'chat' && (
            <Button variant="ghost" size="sm" onClick={handleBack}>
              Back
            </Button>
          )}
        </div>

        {/* Title */}
        <div className="flex items-center">
          {view === 'list' ? (
            <h2 className="text-xl font-bold text-white flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-blue-400" />
              Chat
            </h2>
          ) : (
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {selectedRoom ? (
                <>
                  <span>#</span>
                  <span className="truncate">{selectedRoom.name}</span>
                </>
              ) : (
                <>
                  <div className={`w-2 h-2 rounded-full ${
                    selectedAgent?.status === 'IDLE' ? 'bg-slate-400' :
                    selectedAgent?.status === 'WORKING' ? 'bg-green-400' :
                    selectedAgent?.status === 'BREAK' ? 'bg-yellow-400' :
                    'bg-blue-400'
                  }`} />
                  <span className="truncate">{selectedAgent?.name}</span>
                </>
              )}
            </h2>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {view === 'list' ? (
          <div className="p-4 space-y-6 h-full overflow-y-auto">
            {/* Rooms */}
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Rooms</h3>
              <div className="space-y-1">
                {rooms.map((room) => (
                  <button
                    key={room.id}
                    className="w-full px-2 py-1.5 text-left text-sm text-slate-300 hover:bg-slate-800/50 rounded-lg flex items-center justify-between group"
                    onClick={() => handleChannelSelect(room.id, 'room')}
                  >
                    <span>#{room.name}</span>
                    {room.unreadCount ? (
                      <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {room.unreadCount}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>

            {/* Direct Messages */}
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-2">Direct Messages</h3>
              <div className="space-y-1">
                {agents.map((agent) => (
                  <button
                    key={agent.id}
                    className="w-full px-2 py-1.5 text-left text-sm text-slate-300 hover:bg-slate-800/50 rounded-lg flex items-center justify-between group"
                    onClick={() => handleChannelSelect(agent.id, 'agent')}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        agent.status === 'IDLE' ? 'bg-slate-400' :
                        agent.status === 'WORKING' ? 'bg-green-400' :
                        agent.status === 'BREAK' ? 'bg-yellow-400' :
                        'bg-blue-400'
                      }`} />
                      <span>{agent.name}</span>
                    </div>
                    {agent.unreadCount ? (
                      <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                        {agent.unreadCount}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.fromCurrentUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 ${
                      message.fromCurrentUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {!message.fromCurrentUser && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white">
                          {message.sender.name}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                    <p>{message.content}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder={`Message ${selectedRoom ? '#' + selectedRoom.name : '@' + selectedAgent?.name}`}
                  className="flex-1 bg-slate-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button type="submit" disabled={!newMessage.trim()}>
                  Send
                </Button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Card>
  );
} 