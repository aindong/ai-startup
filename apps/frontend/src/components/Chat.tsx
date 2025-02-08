import React, { useEffect, useState, useRef } from 'react';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { chatService, Message } from '../services/chat.service';
import { cn } from '../lib/utils';

interface ChatProps {
  channelId: string;
  channelType: 'room' | 'agent';
  channelName: string;
}

export function Chat({ channelId, channelType, channelName }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clear messages when changing channels
    setMessages([]);

    // Join the channel
    chatService.joinChannel(channelId, channelType);

    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      if (message.channelId === channelId) {
        setMessages(prev => [...prev, message]);
        scrollToBottom();
      }
    };

    chatService.onMessage(handleNewMessage);

    // Cleanup
    return () => {
      chatService.leaveChannel(channelId, channelType);
      chatService.offMessage(handleNewMessage);
    };
  }, [channelId, channelType]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    chatService.sendMessage({
      channelId,
      channelType,
      content: newMessage,
      type: 'CHAT'
    });

    setNewMessage('');
  };

  return (
    <Card className="h-[480px] flex flex-col pointer-events-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">
            {channelType === 'room' ? '#' : '@'}
          </span>
          <h3 className="font-medium text-white">{channelName}</h3>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={cn(
              'flex gap-3',
              message.fromCurrentUser && 'justify-end'
            )}
          >
            {!message.fromCurrentUser && (
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {message.sender.name[0]}
                </span>
              </div>
            )}
            <div
              className={cn(
                'max-w-[80%] rounded-lg p-3',
                message.fromCurrentUser
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300'
              )}
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
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-slate-800">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder={`Message ${channelType === 'room' ? '#' : '@'}${channelName}`}
            className="flex-1 bg-slate-800 text-white rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-600"
          />
          <Button type="submit" disabled={!newMessage.trim()}>
            Send
          </Button>
        </div>
      </form>
    </Card>
  );
} 