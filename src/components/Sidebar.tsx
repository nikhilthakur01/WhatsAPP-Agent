'use client';

import { formatDistanceToNow } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Conversation {
  id: string;
  user_phone: string;
  name: string;
  mode: 'agent' | 'human';
  updated_at: string;
  lastMessage?: {
    content: string;
    created_at: string;
    role: 'user' | 'assistant';
  };
}

interface SidebarProps {
  conversations: Conversation[];
  selectedId?: string;
  onSelect: (id: string) => void;
}

export default function Sidebar({ conversations, selectedId, onSelect }: SidebarProps) {
  return (
    <div className="w-80 h-full border-r border-gray-200 flex flex-col bg-white">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <h1 className="text-xl font-bold text-gray-800">WhatsApp Agent</h1>
      </div>
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="p-8 text-center text-gray-500 italic">
            No conversations yet
          </div>
        ) : (
          conversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                "w-full p-4 text-left border-b border-gray-100 hover:bg-gray-50 transition-colors flex flex-col gap-1",
                selectedId === conv.id && "bg-blue-50 hover:bg-blue-50"
              )}
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900 truncate">
                  {conv.name || conv.user_phone}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDistanceToNow(new Date(conv.updated_at), { addSuffix: true })}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={cn(
                  "text-[10px] uppercase font-bold px-1.5 py-0.5 rounded",
                  conv.mode === 'agent' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                )}>
                  {conv.mode}
                </span>
                {conv.lastMessage && (
                  <p className="text-sm text-gray-600 truncate flex-1">
                    {conv.lastMessage.role === 'assistant' ? 'AI: ' : ''}
                    {conv.lastMessage.content}
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
