
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PROMPTS_DATA, THEMES, TEMPLATE_PROMPTS as INITIAL_TEMPLATES, DEFAULT_SETTINGS, TUTORIAL_STEPS } from './constants';
import { PromptItem, Message, ChatSession, SimulationSettings, UserProfile, PipelineConfig, PromptDocument } from './types';
import { geminiService } from './services/geminiService';
import { ChatStreamView } from './ChatStreamView';
import { SettingsModal } from './SettingsModal';
import { PromptEditor } from './PromptEditor';
import { Sidebar } from './Sidebar';
import { OnboardingWizard } from './OnboardingWizard';
import { TutorialOverlay } from './TutorialOverlay';
import { OnboardingAssistant } from './OnboardingAssistant';
import { 
  Terminal, Book, Send, ArrowLeft, X, Plus, Edit,
  Layout, Mic, Play, Layers, Activity, Loader2, Download, Sparkles, Wand2,
  ListRestart, Share2, FileVideo, ArrowRight, Video, Swords, GitGraph,
  Trophy, Split, GripVertical, Save, Trash2, ChevronDown, FolderOpen, Settings2,
  FileText
} from 'lucide-react';

const App: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('user_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [customPrompts, setCustomPrompts] = useState<PromptItem[]>(() => {
    const saved = localStorage.getItem('custom_prompts');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [templates, setTemplates] = useState<any[]>(() => {
    const saved = localStorage.getItem('custom_templates');
    return saved ? JSON.parse(saved) : INITIAL_TEMPLATES;
  });

  const [favorites, setFavorites] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [chatHistory, setChatHistory] = useState<ChatSession[]>(() => {
    const saved = localStorage.getItem('chat_history');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [settings, setSettings] = useState<SimulationSettings>(() => {
    const saved = localStorage.getItem('simulation_settings');
    return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SETTINGS;
  });
  
  const [secondarySettings, setSecondarySettings] = useState<SimulationSettings>(() => {
    return { ...DEFAULT_SETTINGS, model: 'gemini-3-pro-preview' }; 
  });

  const [currentThemeId, setCurrentThemeId] = useState<string>(() => localStorage.getItem('theme_id') || 'pro-dark');
  const [tutorialStep, setTutorialStep] = useState<number | null>(null);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);

  const [view, setView] = useState<'library' | 'favorites' | 'history' | 'docs' | 'pipeline'>('library');
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [promptVariables, setPromptVariables] = useState<Record<string, string>>({});

  const [isCompareMode, setIsCompareMode] = useState(false);
  const [secondarySession, setSecondarySession] = useState<ChatSession | null>(null);
  const chatRef = useRef<any>(null);
  const secondaryChatRef = useRef<any>(null);

  const [isLiveActive, setIsLiveActive] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState<{text: string, isUser: boolean}[]>([]);
  const liveSessionRef = useRef<any>(null);
  const liveTranscriptRef = useRef<HTMLDivElement>(null);

  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');

  const [pipeline, setPipeline] = useState<string[]>([]);
  const [savedPipelines, setSavedPipelines] = useState<PipelineConfig[]>(() => {
    const saved = localStorage.getItem('saved_pipelines');
    return saved ? JSON.parse(saved) : [];
  });
  const [isPipelineRunning, setIsPipelineRunning] = useState(false);
  const [pipelineProgress, setPipelineProgress] = useState(0);

  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSecondarySettingsOpen, setIsSecondarySettingsOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Partial<PromptItem> | null>(null);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);

  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const theme = THEMES.find(t => t.id === currentThemeId) || THEMES[0];
    Object.entries(theme.colors).forEach(([key, value]) => document.documentElement.style.setProperty(key, value));
    localStorage.setItem('theme_id', currentThemeId);
  }, [currentThemeId]);

  useEffect(() => {
    localStorage.setItem('simulation_settings', JSON.stringify(settings));
    localStorage.setItem('custom_prompts', JSON.stringify(customPrompts));
    localStorage.setItem('chat_history', JSON.stringify(chatHistory));
    localStorage.setItem('saved_pipelines', JSON.stringify(savedPipelines));
    localStorage.setItem('custom_templates', JSON.stringify(templates));
  }, [settings, customPrompts, chatHistory, savedPipelines, templates]);

  useEffect(() => {
    const handler = (e: any) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const allPrompts = useMemo(() => [...PROMPTS_DATA, ...customPrompts], [customPrompts]);

  // Fix: Defined allTags to aggregate all unique tags from prompts for the editor
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    allPrompts.forEach(p => p.tags.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  }, [allPrompts]);

  const selectedDocument = useMemo(() => {
    if (!selectedDocId) return null;
    for (const p of allPrompts) {
      const doc = p.documents?.find(d => d.id === selectedDocId);
      if (doc) return { ...doc, parentPrompt: p.act };
    }
    return null;
  }, [allPrompts, selectedDocId]);

  const handleSelectPrompt = (prompt: PromptItem) => {
    setSelectedPrompt(prompt);
    setSelectedDocId(null);
    setPromptVariables({});
    setIsChatOpen(false);
    setCurrentSession(null);
  };

  const handleSelectDoc = (docId: string) => {
    setSelectedDocId(docId);
    setSelectedPrompt(null);
    setIsChatOpen(false);
  };

  const startSimulation = async () => {
    if (!selectedPrompt) return;
    let finalPrompt = selectedPrompt.prompt;
    Object.entries(promptVariables).forEach(([key, val]) => {
      finalPrompt = finalPrompt.replace(new RegExp(`{{${key}}}`, 'g'), val);
    });
    const instruction = userProfile ? `[USER]: Role: ${userProfile.identity.role} (${userProfile.identity.expertise})\n[GLOBAL]: ${userProfile.preferences.globalContext}\n\n${finalPrompt}` : finalPrompt;

    setIsChatOpen(true);
    chatRef.current = geminiService.createChat(instruction, settings, selectedPrompt.documents, selectedPrompt.responseSchema);
    setCurrentSession({
      id: crypto.randomUUID(),
      personaId: selectedPrompt.id,
      personaName: selectedPrompt.act,
      messages: [{ role: 'model', text: `Node ${selectedPrompt.act} synthesized. Awaiting commands.`, timestamp: Date.now() }],
      startTime: Date.now(),
      lastUpdateTime: Date.now(),
      modelId: settings.model
    });
    if (isCompareMode) {
      secondaryChatRef.current = geminiService.createChat(instruction, secondarySettings, selectedPrompt.documents, selectedPrompt.responseSchema);
      setSecondarySession({
        id: crypto.randomUUID(),
        personaId: selectedPrompt.id,
        personaName: `${selectedPrompt.act} (Pro Branch)`,
        messages: [{ role: 'model', text: `Parallel branch initiated with ${secondarySettings.model}.`, timestamp: Date.now() }],
        startTime: Date.now(),
        lastUpdateTime: Date.now(),
        modelId: secondarySettings.model,
        isComparison: true
      });
    }
  };

  // Fix: Implemented handleSendMessage to process user input and receive AI responses
  const handleSendMessage = async () => {
    if (!inputValue.trim() || !currentSession || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      text: inputValue,
      timestamp: Date.now()
    };

    setInputValue('');
    setIsLoading(true);

    // Optimistically update sessions with user message
    setCurrentSession(prev => prev ? ({
      ...prev,
      messages: [...prev.messages, userMessage],
      lastUpdateTime: Date.now()
    }) : null);

    if (isCompareMode && secondarySession) {
      setSecondarySession(prev => prev ? ({
        ...prev,
        messages: [...prev.messages, userMessage],
        lastUpdateTime: Date.now()
      }) : null);
    }

    try {
      const tasks = [geminiService.sendMessage(chatRef.current, userMessage.text)];
      if (isCompareMode && secondaryChatRef.current) {
        tasks.push(geminiService.sendMessage(secondaryChatRef.current, userMessage.text));
      }

      const [response, secondaryResponse] = await Promise.all(tasks);
      
      const modelMessage: Message = {
        role: 'model',
        text: response.text,
        timestamp: Date.now(),
        metadata: response.metadata
      };

      setCurrentSession(prev => {
        if (!prev) return null;
        const next = {
          ...prev,
          messages: [...prev.messages, modelMessage],
          lastUpdateTime: Date.now()
        };
        
        setChatHistory(history => {
          const index = history.findIndex(s => s.id === next.id);
          if (index >= 0) {
            const h = [...history];
            h[index] = next;
            return h;
          }
          return [next, ...history];
        });
        
        return next;
      });

      if (isCompareMode && secondaryResponse) {
        const secondaryModelMessage: Message = {
          role: 'model',
          text: secondaryResponse.text,
          timestamp: Date.now(),
          metadata: secondaryResponse.metadata
        };
        setSecondarySession(prev => prev ? ({
          ...prev,
          messages: [...prev.messages, secondaryModelMessage],
          lastUpdateTime: Date.now()
        }) : null);
      }
    } catch (error) {
      console.error("Neural link error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-body)] transition-colors duration-300 select-none">
      {!userProfile && <OnboardingWizard onComplete={(p) => setUserProfile(p)} />}
      
      {tutorialStep !== null && (
        <TutorialOverlay stepIndex={tutorialStep} steps={TUTORIAL_STEPS} onNext={() => tutorialStep < TUTORIAL_STEPS.length - 1 ? setTutorialStep(tutorialStep + 1) : setTutorialStep(null)} onPrev={() => setTutorialStep(tutorialStep - 1)} onClose={() => setTutorialStep(null)} />
      )}

      <OnboardingAssistant isOpen={isAssistantOpen} onClose={() => setIsAssistantOpen(false)} userProfile={userProfile} />
      
      <Sidebar
        allPrompts={allPrompts}
        chatHistory={chatHistory}
        favorites={favorites}
        currentView={view}
        onViewChange={setView}
        selectedPromptId={selectedPrompt?.id}
        selectedDocId={selectedDocId}
        onSelectPrompt={handleSelectPrompt}
        onSelectDoc={handleSelectDoc}
        onResumeSession={(s) => { setSelectedPrompt(allPrompts.find(p => p.id === s.personaId) || null); setCurrentSession(s); setIsChatOpen(true); }}
        onToggleFavorite={(id) => setFavorites(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; })}
        onDeleteSession={(e, id) => setChatHistory(prev => prev.filter(s => s.id !== id))}
        onDownloadSession={() => {}}
        onClearAllHistory={() => setChatHistory([])}
        onImportPersona={() => {}}
        onExportData={() => {}}
        onNewPersona={() => { setEditingPrompt({ id: crypto.randomUUID(), category: 'Miscellaneous', type: 'TEXT' }); setIsEditorOpen(true); }}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenHelp={() => setIsAssistantOpen(true)}
        fileInputRef={useRef(null)}
        isInstallable={!!deferredPrompt}
        onInstallApp={() => deferredPrompt?.prompt()}
      />

      <div className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_top_right,var(--accent)_0%,transparent_40%)] opacity-20 pointer-events-none" />
      
      <div className="flex-1 flex flex-col relative overflow-hidden z-10">
        {isLiveActive && (
          <div className="absolute inset-0 z-[60] bg-black/80 backdrop-blur-2xl flex flex-col items-center justify-center p-12">
             <div className="w-full max-w-2xl space-y-8 flex flex-col h-full max-h-[80vh]">
                <div className="flex flex-col items-center gap-4">
                   <div className="w-24 h-24 rounded-full bg-red-600 flex items-center justify-center animate-pulse"><Mic size={40} className="text-white" /></div>
                   <h2 className="text-3xl font-black text-white uppercase tracking-[0.3em]">Live Neural Link</h2>
                </div>
                <div className="flex-1 bg-black/40 border border-white/10 rounded-[3.5rem] p-10 overflow-y-auto custom-scrollbar">
                   {liveTranscript.map((t, i) => (
                     <div key={i} className={`flex ${t.isUser ? 'justify-end' : 'justify-start'} mb-4`}>
                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm ${t.isUser ? 'bg-white/5 text-white' : 'bg-[var(--accent)] text-white'}`}>{t.text}</div>
                     </div>
                   ))}
                </div>
                <button onClick={() => setIsLiveActive(false)} className="mx-auto px-10 py-5 rounded-full bg-white/10 text-white font-black uppercase tracking-widest hover:bg-red-600 transition-all">Terminate Link</button>
             </div>
          </div>
        )}

        {selectedDocument ? (
          <div className="flex-1 flex flex-col p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="max-w-4xl w-full mx-auto space-y-8">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-4">
                      <div className="p-4 rounded-3xl bg-[var(--bg-element)] text-[var(--accent)] shadow-xl border border-[var(--border)]"><FileText size={40} /></div>
                      <div>
                        <h2 className="text-4xl font-black text-[var(--text-heading)] tracking-tighter">{selectedDocument.name}</h2>
                        <p className="text-[var(--text-muted)] font-bold uppercase tracking-widest text-[10px] mt-1">Belongs to: {selectedDocument.parentPrompt}</p>
                      </div>
                   </div>
                   <button onClick={() => setSelectedDocId(null)} className="p-4 rounded-2xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-red-500 transition-colors"><X size={24} /></button>
                </div>
                <div className="p-10 rounded-[3rem] bg-[var(--bg-panel)]/80 border border-[var(--border)] shadow-2xl backdrop-blur-xl h-[60vh] overflow-y-auto custom-scrollbar select-text selection:bg-[var(--accent)] selection:text-white">
                   <pre className="font-mono text-sm leading-relaxed whitespace-pre-wrap text-[var(--text-body)]">{atob(selectedDocument.data)}</pre>
                </div>
             </div>
          </div>
        ) : selectedPrompt && !isChatOpen ? (
          <div className="flex-1 flex flex-col items-center justify-start p-10 overflow-y-auto custom-scrollbar">
            <div className="max-w-4xl w-full space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-500">
               <div className="flex items-center justify-between">
                  <h2 className="text-5xl font-black text-[var(--text-heading)] tracking-tighter">{selectedPrompt.act}</h2>
                  <div className="flex gap-3">
                    <button onClick={() => setIsCompareMode(!isCompareMode)} className={`p-5 rounded-2xl border transition-all shadow-lg ${isCompareMode ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'bg-[var(--bg-panel)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--accent)]'}`} title="Compare Mode"><Swords size={24} /></button>
                    <button onClick={() => { setEditingPrompt(selectedPrompt); setIsEditorOpen(true); }} className="p-5 rounded-2xl bg-[var(--bg-panel)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-all shadow-lg"><Edit size={24} /></button>
                  </div>
               </div>
               
               <div className="p-12 rounded-[3.5rem] bg-[var(--bg-panel)]/80 border border-[var(--border)] shadow-2xl relative overflow-hidden backdrop-blur-xl group">
                  <h3 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-[0.4em] mb-8 flex items-center gap-2"><Sparkles size={12} className="text-[var(--accent)]" /> Simulation Matrix</h3>
                  <p className="text-2xl text-[var(--text-body)] leading-relaxed font-serif italic">{selectedPrompt.prompt}</p>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <button onClick={startSimulation} className="px-10 py-8 rounded-[3rem] bg-[var(--accent)] text-white font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 text-sm"><Terminal size={24} /> {isCompareMode ? 'Run Side-by-Side' : 'Initialize Session'}</button>
                 <button onClick={() => setIsLiveActive(true)} className="px-10 py-8 rounded-[3rem] bg-emerald-600 text-white font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-4 text-sm"><Mic size={24} /> Neural Audio</button>
               </div>
            </div>
          </div>
        ) : isChatOpen ? (
          <div className="flex-1 flex flex-col h-full relative">
             <div className="flex items-center justify-between p-4 border-b border-[var(--border)] bg-[var(--bg-panel)]/50 backdrop-blur-sm z-10 shrink-0">
                <div className="flex items-center gap-3">
                   <button onClick={() => setIsChatOpen(false)} className="p-2 rounded-xl hover:bg-[var(--bg-element)] text-[var(--text-muted)] transition-colors"><ArrowLeft size={20} /></button>
                   <div>
                      <h3 className="font-bold text-[var(--text-heading)] flex items-center gap-2">{currentSession?.personaName}</h3>
                      <p className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest">{settings.model}</p>
                   </div>
                </div>
             </div>
             <div className="flex-1 flex overflow-hidden">
                <div className={`flex-1 flex flex-col min-w-0 ${isCompareMode ? 'border-r border-[var(--border)]' : ''}`}>
                   <ChatStreamView session={currentSession} settings={settings} isLoading={isLoading} />
                </div>
                {isCompareMode && (
                  <div className="flex-1 flex flex-col min-w-0 bg-[var(--bg-panel)]/30">
                     <ChatStreamView session={secondarySession} settings={secondarySettings} isLoading={isLoading} />
                  </div>
                )}
             </div>
             <div className="p-4 bg-[var(--bg-app)] border-t border-[var(--border)] shrink-0">
                <div className="relative max-w-4xl mx-auto flex gap-3">
                   <textarea className="flex-1 pl-6 pr-12 py-4 rounded-[2rem] bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all resize-none text-sm shadow-sm" placeholder="Broadcasting command..." rows={1} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSendMessage())} />
                   <button onClick={handleSendMessage} disabled={!inputValue.trim() || isLoading} className="w-12 h-12 rounded-full bg-[var(--accent)] text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"><Send size={20} /></button>
                </div>
             </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-10 opacity-20 pointer-events-none">
             <Terminal size={120} strokeWidth={0.5} />
             <p className="text-xl font-black uppercase tracking-[0.5em] mt-8">Forge Link Awaiting</p>
          </div>
        )}
      </div>

      <PromptEditor isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} initialPrompt={editingPrompt} onSave={(p) => { setCustomPrompts(prev => prev.find(x => x.id === p.id) ? prev.map(x => x.id === p.id ? p : x) : [p, ...prev]); setIsEditorOpen(false); }} onSaveAsTemplate={(p) => setTemplates(prev => [...prev, p])} allTags={allTags} allTemplates={templates} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} settings={settings} onSettingsChange={setSettings} target="primary" currentThemeId={currentThemeId} onThemeChange={setCurrentThemeId} userProfile={userProfile} onResetProfile={() => { setUserProfile(null); setIsSettingsOpen(false); }} />
    </div>
  );
};

export default App;
