import React, { useEffect, useRef, useState } from 'react';
import { ChatSession, SimulationSettings } from './types';
import { Cpu, ChevronDown, Activity, Search, MapPin, Globe, ExternalLink, Globe2, Sparkles, Terminal, FileCheck, Copy, Check, X, Eye } from 'lucide-react';

interface ChatStreamViewProps {
  session: ChatSession | null;
  settings: SimulationSettings;
  isLoading: boolean;
}

const ThinkingInspector: React.FC<{ text: string }> = ({ text }) => {
  const [isOpen, setIsOpen] = useState(false);
  if (!text) return null;

  return (
    <div className="mb-4 relative group/inspector z-10">
      <div className={`border transition-all duration-500 ease-out overflow-hidden ${isOpen ? 'rounded-[1.5rem] bg-[#0c0a14] border-purple-500/30 shadow-[0_0_40px_-10px_rgba(168,85,247,0.2)]' : 'rounded-full bg-purple-500/5 border-purple-500/10 hover:border-purple-500/30'}`}>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="w-full flex items-center justify-between p-2 pl-4 pr-5 hover:bg-purple-500/5 transition-all group/btn cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className={`relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-500 ${isOpen ? 'bg-purple-500/10 rotate-90' : 'bg-purple-500/5'}`}>
              {isOpen ? <Terminal size={14} className="text-purple-400" /> : <Cpu size={14} className="text-purple-400 opacity-70 group-hover/btn:scale-110 transition-transform" />}
            </div>
            <div className="flex flex-col items-start text-left">
              <span className="text-[9px] font-black text-purple-300 uppercase tracking-[0.2em]">Neural Chain of Thought</span>
              {isOpen && <span className="text-[8px] text-purple-500/50 font-medium">Inspecting Model Reasoning...</span>}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isOpen && <span className="text-[8px] font-mono text-purple-400/40 uppercase tracking-widest hidden sm:block">Expand Protocol</span>}
            <ChevronDown size={12} className={`text-purple-400/50 transition-transform duration-500 ${isOpen ? 'rotate-180' : ''}`} />
          </div>
        </button>

        <div className={`transition-[max-height,opacity] duration-500 ease-in-out overflow-hidden ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="relative border-t border-purple-500/10 bg-[#08060b]">
            {/* Ghost Code Container */}
            <div className="p-6 font-mono text-[10px] leading-relaxed text-purple-300/40 max-h-[400px] overflow-y-auto custom-scrollbar selection:bg-purple-500/20 selection:text-purple-100 relative z-0 italic opacity-80">
               {text.split('\n').map((line, i) => (
                 <div key={i} className="flex gap-4 hover:bg-white/5 rounded px-2 -mx-2 transition-colors group/line">
                    <span className="shrink-0 w-6 text-right text-purple-500/10 select-none text-[8px] pt-0.5 font-sans italic not-italic group-hover/line:text-purple-500/30 transition-colors">{i + 1}</span>
                    <span className="break-words w-full">{line || <span className="opacity-0">.</span>}</span>
                 </div>
               ))}
            </div>
            {/* Aesthetic Glow */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-purple-500/5 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
};

const CitationDrawer: React.FC<{ chunks: any[], enabled?: boolean }> = ({ chunks, enabled }) => {
  if (enabled === false) return null;
  const hasSources = chunks && chunks.length > 0;
  if (enabled && !hasSources) return null;

  return (
    <div className="mt-8 pt-8 border-t border-[var(--border)]/50 space-y-4 animate-in fade-in duration-700">
      <div className="flex items-center justify-between px-2">
        <h5 className="text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2 text-blue-400">
          <Globe2 size={14} className={hasSources ? "animate-spin-slow" : "opacity-50"} /> 
          Verified Sources
        </h5>
      </div>
      <div className="grid grid-cols-1 gap-3">
        {chunks.map((chunk, idx) => {
          const isMap = !!chunk.maps;
          const uri = chunk.web?.uri || chunk.maps?.uri;
          const title = chunk.web?.title || chunk.maps?.title || "Context Node";
          if (!uri) return null;
          const domain = uri.split('/')[2];
          const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

          return (
            <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-element)]/30 border border-[var(--border)]/50 hover:border-blue-500 hover:bg-blue-500/5 transition-all group">
               {isMap ? (
                 <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0"><MapPin size={16} className="text-red-400" /></div>
               ) : (
                 <img src={favicon} alt="" className="w-8 h-8 rounded-lg bg-white/5 shrink-0 p-1" onError={(e) => { e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2103/2103633.png"; }} />
               )}
               <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold text-[var(--text-heading)] truncate group-hover:text-blue-400 transition-colors">{title}</div>
                  <div className="text-[8px] text-[var(--text-muted)] truncate opacity-70 flex items-center gap-1.5">
                    <span className="truncate">{domain}</span>
                    {isMap && <span className="px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[7px] font-black uppercase tracking-wider">MAPS</span>}
                  </div>
               </div>
               <a href={uri} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors"><ExternalLink size={12} /></a>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const ChatStreamView: React.FC<ChatStreamViewProps> = ({ session, settings, isLoading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [session?.messages, isLoading]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => { setCopiedId(prev => prev === id ? null : prev); }, 3000);
  };

  if (!session) return (
    <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-muted)] opacity-30 p-10 text-center">
       <Activity size={48} className="mb-4" />
       <p className="text-xs uppercase font-black tracking-widest">Awaiting Neural Input</p>
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-10 space-y-8 scroll-smooth custom-scrollbar" ref={scrollRef}>
      {session.messages.map((m, i) => {
        const messageId = `${session.id}-${i}`;
        return (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-8 duration-500 group/message`}>
            <div className={`max-w-[95%] sm:max-w-[90%] space-y-3 ${m.role === 'user' ? 'ml-auto' : ''}`}>
              <div className={`relative p-6 sm:p-8 rounded-[2rem] shadow-sm backdrop-blur-xl border transition-all ${
                m.role === 'user' 
                  ? 'bg-[var(--accent)] text-white rounded-br-none border-white/10' 
                  : 'bg-[var(--bg-panel)]/95 text-[var(--text-body)] rounded-bl-none border-[var(--border)]'
              }`}>
                {/* Copy Status Overlay */}
                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover/message:opacity-100 transition-opacity z-20">
                  {copiedId === messageId ? (
                    <div className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-xl bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wider animate-in fade-in zoom-in shadow-lg">
                       <Check size={10} strokeWidth={3} />
                       <span>Copied!</span>
                       <button onClick={(e) => { e.stopPropagation(); setCopiedId(null); }} className="p-1 hover:bg-black/20 rounded-lg transition-colors ml-1"><X size={10} /></button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => handleCopy(m.text, messageId)} 
                      className={`p-2 rounded-xl transition-all hover:scale-110 active:scale-90 ${m.role === 'user' ? 'hover:bg-white/20 text-white/70' : 'hover:bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--accent)]'}`}
                      title="Copy to clipboard"
                    >
                      <Copy size={14} />
                    </button>
                  )}
                </div>

                {m.role === 'model' && m.metadata?.thinking && (
                  <div className="mb-6">
                    <ThinkingInspector text={m.metadata.thinking} />
                    <div className="flex items-center gap-4 mb-2 opacity-20 select-none">
                       <div className="h-px bg-[var(--text-muted)] flex-1" />
                       <span className="text-[8px] font-black uppercase tracking-[0.4em] text-[var(--text-muted)] flex items-center gap-2">
                         <Sparkles size={10} /> Response Matrix
                       </span>
                       <div className="h-px bg-[var(--text-muted)] flex-1" />
                    </div>
                  </div>
                )}
                
                <div className={`leading-relaxed whitespace-pre-wrap font-serif text-base sm:text-lg selection:bg-[var(--accent)]/30 ${m.role === 'user' ? 'selection:bg-white/20' : ''}`}>
                  {m.text}
                </div>

                {m.role === 'model' && <CitationDrawer chunks={m.metadata?.groundingChunks || []} enabled={m.metadata?.searchEnabled} />}
              </div>
              <div className={`flex items-center gap-4 px-4 ${m.role === 'user' ? 'justify-end' : 'justify-start'} opacity-50 hover:opacity-100 transition-opacity`}>
                 {m.role === 'model' && m.metadata && (
                   <>
                     <div className="flex items-center gap-1.5 text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest"><Activity size={10} className="text-[var(--accent)]" /> {m.metadata.latency}ms</div>
                     {m.metadata.tokenCount ? <div className="flex items-center gap-1.5 text-[8px] font-black text-[var(--text-muted)] uppercase tracking-widest"><FileCheck size={10} /> {m.metadata.tokenCount} Tokens</div> : null}
                   </>
                 )}
              </div>
            </div>
          </div>
        );
      })}
      {isLoading && (
        <div className="flex justify-start animate-in fade-in duration-500">
          <div className="bg-[var(--bg-panel)]/80 p-6 rounded-[2rem] rounded-bl-none border border-[var(--border)] flex gap-4 items-center shadow-lg">
            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[var(--text-muted)]">Synthesizing</span>
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce" />
              <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 rounded-full bg-[var(--accent)] animate-bounce [animation-delay:-0.3s]" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};