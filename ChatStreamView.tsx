
import React, { useEffect, useRef } from 'react';
import { ChatSession, SimulationSettings } from './types';
import { Cpu } from 'lucide-react';

interface ChatStreamViewProps {
  session: ChatSession | null;
  settings: SimulationSettings;
  isLoading: boolean;
  title?: string;
  isActive?: boolean;
}

export const ChatStreamView: React.FC<ChatStreamViewProps> = ({ session, settings, isLoading, title, isActive = true }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [session?.messages, isLoading]);

  if (!session) return null;

  return (
    <div className={`flex flex-col h-full ${isActive ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
      <div className="px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-panel)]/50 backdrop-blur-sm flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-2">
           <Cpu size={14} className="text-[var(--accent)]" />
           <span className="text-xs font-bold text-[var(--text-body)]">{title || settings.model}</span>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-mono text-[var(--text-muted)]">T: {settings.temperature}</span>
           <div className={`w-1.5 h-1.5 rounded-full ${isLoading ? 'bg-[var(--accent)] animate-pulse' : 'bg-emerald-500'}`} />
        </div>
      </div>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth no-scrollbar">
        {session.messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[90%] p-4 rounded-2xl text-sm ${
              m.role === 'user' 
                ? 'bg-[var(--accent)] text-[var(--accent-text)] rounded-br-none shadow-md' 
                : 'bg-[var(--bg-element)] text-[var(--text-body)] rounded-bl-none border border-[var(--border)]'
            }`}>
              <p className="leading-relaxed whitespace-pre-wrap">{m.text}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-[var(--bg-element)]/50 p-4 rounded-2xl rounded-bl-none border border-[var(--border)]/50 flex gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:-0.2s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:-0.4s]" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
