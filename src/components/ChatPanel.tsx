'use client';

import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Send, Bot, User, UserCheck } from 'lucide-react';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Conversation {
  id: string;
  user_phone: string;
  name: string;
  mode: 'agent' | 'human' ;
}

interface ChatPanelProps {
  conversationId?: string;
}

export default function ChatPanel({ conversationId }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
      fetchMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchConversation = async () => {
    if (!conversationId) return;
    const res = await fetch(`/api/conversations/${conversationId}`);
    if (res.ok) {
      const data = await res.json();
      setConversation(data);
    }
  };

  const fetchMessages = async () => {
    if (!conversationId) return;
    const res = await fetch(`/api/conversations/${conversationId}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
    }
  };

  const toggleMode = async () => {
    if (!conversation) return;
    const newMode = conversation.mode === 'agent' ? 'human' : 'agent';
    const res = await fetch(`/api/conversations/${conversation.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: newMode })
    });
    if (res.ok) {
      setConversation({ ...conversation, mode: newMode });
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !conversationId) return;

    setIsLoading(true);
    setSendError(null);
    const text = inputText;
    setInputText('');

    const res = await fetch(`/api/conversations/${conversationId}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: text })
    });

    if (res.ok) {
      const newMessage = await res.json();
      setMessages([...messages, newMessage]);
    } else {
      const errorData = await res.json().catch(() => ({ error: 'Failed to send message' }));
      setInputText(text);
      setSendError(errorData.error || 'Failed to send message');
    }
    setIsLoading(false);
  };

  if (!conversationId) {
    return (
      <div className="flex-1 h-full flex items-center justify-center bg-gray-50 text-gray-400 italic">
        Select a conversation to start chatting
      </div>
    );
  }

  return (
    <div className="flex-1 h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{conversation?.name || conversation?.user_phone}</h2>
          <p className="text-xs text-gray-500">{conversation?.user_phone}</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2 py-1 rounded text-xs font-bold uppercase",
              conversation?.mode === 'agent' ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
            )}>
              {conversation?.mode} Mode
            </span>
            <button
              onClick={toggleMode}
              className="p-1.5 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
              title={`Switch to ${conversation?.mode === 'agent' ? 'Human' : 'Agent'} Mode`}
            >
              {conversation?.mode === 'agent' ? <UserCheck size={20} /> : <Bot size={20} />}
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#e5ddd5] dark:bg-gray-900">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex w-full",
              msg.role === 'user' ? "justify-start" : "justify-end"
            )}
          >
            <div
              className={cn(
                "max-w-[70%] p-3 rounded-lg shadow-sm relative",
                msg.role === 'user' 
                  ? "bg-white text-gray-900 rounded-tl-none" 
                  : "bg-[#dcf8c6] text-gray-900 rounded-tr-none"
              )}
            >
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold opacity-50 flex items-center gap-1 uppercase">
                  {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                  {msg.role === 'user' ? 'User' : 'Assistant'}
                </span>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <span className="text-[10px] text-right opacity-50 mt-1 block">
                  {format(new Date(msg.created_at), 'HH:mm')}
                </span>
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        {sendError && (
          <p className="mb-2 text-sm text-red-600">{sendError}</p>
        )}
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={conversation?.mode === 'human' ? "Type a reply..." : "AI is active, but you can still send a manual message..."}
            className="flex-1 p-3 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 shadow-sm"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="p-3 bg-[#128c7e] text-white rounded-full hover:bg-[#075e54] transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Send size={20} />
          </button>
        </form>
      </div>
    </div>
  );
}
