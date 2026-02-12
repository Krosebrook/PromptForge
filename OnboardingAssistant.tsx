
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Cpu, Sparkles, Terminal, Command, MessageSquare, Zap, Info } from 'lucide-react';
import { UserProfile } from './types';
import { geminiService } from './services/geminiService';

interface OnboardingAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
}

interface AssistantMessage {
  role: 'assistant' | 'user';
  text: string;
}

export const OnboardingAssistant: React.FC<OnboardingAssistantProps> = ({ isOpen, onClose, userProfile }) => {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting = userProfile 
        ? `Neural Guide active. Hello, ${userProfile.identity.role}. I am ready to assist with your ${userProfile.identity.expertise}-level engineering tasks.`
        : "Neural Guide active. I can help you navigate the Persona Library, build Pipelines, or configure Model Parameters.";
      setMessages([{ role: 'assistant', text: greeting }]);
      
      const systemInstruction = `
        You are the PromptForge Pro Neural Guide.
        Your goal is to help users utilize this professional AI Persona IDE.
        
        KEY FEATURES YOU KNOW ABOUT:
        - LIBRARY: A collection of specialized personas (Senior React Architect, Vibe Coder, etc.).
        - IDENTITY: Users can configure their Role, Stack, and Global Context in Settings > Identity.
        - COMPARE MODE: Run two models (Flash vs Pro) side-by-side to compare outputs.
        - PIPELINE GRAPH: Chain multiple personas together where the output of A becomes the input of B.
        - VEO VIDEO: Generate AI video using Google's Veo model.
        - THINKING BUDGET: Allocate tokens for internal Chain of Thought reasoning.
        
        USER CONTEXT:
        - Role: ${userProfile?.identity.role || 'User'}
        - Expertise: ${userProfile?.identity.expertise || 'General'}
        - Stack: ${userProfile?.identity.preferredStack?.join(', ') || 'None'}
        
        TONE:
        Keep responses concise, technical, and professional. Use monospaced formatting for key terms.
      `;
      chatRef.current = geminiService.createChat(systemInstruction, {
        model: 'gemini-3-flash-preview',
        temperature: 0.3,
        topP: 0.95,
        topK: 40,
        thinkingBudget: 0,
        maxOutputTokens: 1024
      });
    }
  }, [isOpen, userProfile, messages.length]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsLoading(true);

    try {
      const result = await geminiService.sendMessage(chatRef.current, userMsg);
      setMessages(prev => [...prev, { role: 'assistant', text: result.text }]);
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: "Signal interference detected. Please re-transmit." }]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] w-[400px] h-[600px] flex flex-col bg-[var(--bg-panel)] border-2 border-[var(--accent)] rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(79,70,229,0.5)] overflow-hidden animate-in slide-in-from-bottom-8 fade-in duration-300 backdrop-blur-2xl">
      {/* Header */}
      <div className="p-6 border-b border-[var(--border)] bg-[var(--accent)]/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20">
            <Cpu size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[var(--text-heading)] uppercase tracking-widest">Neural Guide</h3>
            <div className="flex items-center gap-1.5">
               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Link Active</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg-element)] text-[var(--text-muted)] transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[var(--bg-app)]/50">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed font-medium ${
              m.role === 'user' 
                ? 'bg-[var(--accent)] text-white rounded-br-none' 
                : 'bg-[var(--bg-element)] border border-[var(--border)] text-[var(--text-body)] rounded-bl-none shadow-sm'
            }`}>
              {m.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2 opacity-50">
                   <Sparkles size={10} />
                   <span className="text-[8px] font-black uppercase tracking-widest">Transmission</span>
                </div>
              )}
              <div className={m.role === 'assistant' ? 'font-mono' : ''}>{m.text}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[var(--bg-element)] p-4 rounded-2xl rounded-bl-none border border-[var(--border)] flex gap-2 items-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce" />
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:-0.15s]" />
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:-0.3s]" />
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 bg-[var(--bg-panel)] border-t border-[var(--border)]">
        <div className="relative">
          <input 
            autoFocus
            className="w-full pl-5 pr-12 py-4 rounded-2xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-xs font-medium"
            placeholder="Ask for guidance (Cmd+I to hide)..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
              if (e.key === 'Escape') onClose();
            }}
          />
          <button 
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl bg-[var(--accent)] text-white hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="flex items-center justify-center gap-4 mt-3 opacity-30 select-none">
           <div className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-widest">
              <Command size={10} /> + I : Toggle Guide
           </div>
        </div>
      </div>
    </div>
  );
};
