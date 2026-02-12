
import React, { useEffect, useRef, useState } from 'react';
import { ChatSession, SimulationSettings } from './types';
import { Cpu, ChevronDown, Activity, Search, MapPin, Globe, ExternalLink, Globe2, Sparkles, Terminal, FileCheck, Copy, Check, X, Eye, Download, Video } from 'lucide-react';

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
      <div className={`border transition-all duration-300 ease-out overflow-hidden ${isOpen ? 'rounded-2xl bg-[var(--bg-app)] border-purple-500/30' : 'rounded-xl bg-purple-500/5 border-purple-500/10 hover:border-purple-500/30'}`}>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="w-full flex items-center justify-between p-3 cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className={`flex items-center justify-center w-6 h-6 rounded-lg transition-all duration-300 ${isOpen ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-500/5 text-purple-400/60'}`}>
               <Terminal size={12} />
            </div>
            <span className="text-[10px] font-mono font-bold text-purple-300/80 uppercase tracking-widest">Process Log</span>
          </div>
          <ChevronDown size={14} className={`text-purple-400/50 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        <div className={`transition-[max-height,opacity] duration-300 ease-in-out overflow-hidden ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-4 pt-0">
             <div className="p-4 rounded-lg bg-black/40 border border-purple-500/10 font-mono text-[10px] leading-relaxed text-purple-200/50 overflow-y-auto custom-scrollbar max-h-[300px]">
                {text.split('\n').map((line, i) => (
                  <div key={i} className="flex gap-3 opacity-80 hover:opacity-100 transition-opacity">
                     <span className="select-none text-purple-500/20 w-4 text-right">{i+1}</span>
                     <span className="break-all">{line || ' '}</span>
                  </div>
                ))}
             </div>
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
    <div className="mt-6 pt-6 border-t border-[var(--border)]/50 space-y-3 animate-in fade-in duration-500">
      <div className="flex items-center justify-between px-1">
        <h5 className="text-[9px] font-black uppercase tracking-[0.3em] flex items-center gap-2 text-blue-400">
          <Globe2 size={12} /> 
          Verified Sources
        </h5>
      </div>
      <div className="grid grid-cols-1 gap-2">
        {chunks.map((chunk, idx) => {
          const isMap = !!chunk.maps;
          const uri = chunk.web?.uri || chunk.maps?.uri;
          const title = chunk.web?.title || chunk.maps?.title || "Context Node";
          if (!uri) return null;
          const domain = uri.split('/')[2];
          const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;

          return (
            <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-[var(--bg-element)]/30 border border-[var(--border)]/50 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group">
               {isMap ? (
                 <div className="w-6 h-6 rounded-md bg-red-500/10 flex items-center justify-center shrink-0"><MapPin size={12} className="text-red-400" /></div>
               ) : (
                 <img src={favicon} alt="" className="w-6 h-6 rounded-md bg-white/5 shrink-0 p-0.5" onError={(e) => { e.currentTarget.src = "https://cdn-icons-png.flaticon.com/512/2103/2103633.png"; }} />
               )}
               <div className="min-w-0 flex-1">
                  <div className="text-[10px] font-bold text-[var(--text-heading)] truncate group-hover:text-blue-400 transition-colors">{title}</div>
                  <div className="text-[8px] text-[var(--text-muted)] truncate opacity-70 flex items-center gap-1.5">
                    <span className="truncate">{domain}</span>
                    {isMap && <span className="px-1 py-px rounded bg-red-500/10 text-red-400 text-[7px] font-black uppercase tracking-wider">MAPS</span>}
                  </div>
               </div>
               <a href={uri} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-md bg-[var(--bg-panel)] text-[var(--text-muted)] hover:bg-blue-500 hover:text-white transition-all border border-[var(--border)] group-hover:border-blue-500/30"><ExternalLink size={12} /></a>
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
                  <ThinkingInspector text={m.metadata.thinking} />
                )}
                
                {m.videoUrl && (
                  <div className="mb-6 rounded-2xl overflow-hidden bg-black border border-[var(--border)] relative group/video">
                    <video src={m.videoUrl} controls className="w-full h-auto aspect-video" />
                    <a 
                      href={m.videoUrl} 
                      download={`generated-video-${Date.now()}.mp4`}
                      className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-lg opacity-0 group-hover/video:opacity-100 transition-opacity hover:bg-[var(--accent)] backdrop-blur-md"
                      title="Download Video"
                    >
                      <Download size={16} />
                    </a>
                  </div>
                )}
                
                {m.text && (
                  <div className={`leading-relaxed whitespace-pre-wrap font-serif text-base sm:text-lg selection:bg-[var(--accent)]/30 ${m.role === 'user' ? 'selection:bg-white/20' : ''}`}>
                    {m.text}
                  </div>
                )}

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
