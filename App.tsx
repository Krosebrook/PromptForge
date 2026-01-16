
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PROMPTS_DATA, THEMES, TEMPLATE_PROMPTS as INITIAL_TEMPLATES, DEFAULT_SETTINGS } from './constants';
import { PromptItem, Message, ChatSession, SimulationSettings, PersonaVersion } from './types';
import { geminiService } from './services/geminiService';
import { DOCUMENTATION_CONTENT } from './documentation';
import { Modal } from './Modal';
import { ChatStreamView } from './ChatStreamView';
import { SettingsModal } from './SettingsModal';
import { PromptEditor } from './PromptEditor';
import { Sidebar } from './Sidebar';
import { 
  Terminal, 
  Book, 
  Send, 
  ArrowLeft,
  Copy,
  CheckCircle2,
  X,
  Plus,
  Star,
  Edit,
  Layout,
  Users,
  Image as ImageIcon,
  AlertTriangle,
  Hash,
  FileText,
  Settings,
  SplitSquareHorizontal,
  Download,
  RefreshCw,
  Share2,
} from 'lucide-react';

const App: React.FC = () => {
  // Persistence states
  const [customPrompts, setCustomPrompts] = useState<PromptItem[]>(() => {
    const saved = localStorage.getItem('custom_prompts');
    return saved ? JSON.parse(saved) : [];
  });
  const [customTemplates, setCustomTemplates] = useState<any[]>(() => {
    const saved = localStorage.getItem('custom_templates');
    return saved ? JSON.parse(saved) : [];
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
  const [currentThemeId, setCurrentThemeId] = useState<string>(() => {
    return localStorage.getItem('theme_id') || 'pro-dark';
  });

  // UI Navigation states
  const [view, setView] = useState<'library' | 'favorites' | 'history' | 'docs'>('library');

  // Selection & Compare states
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Image Generation States
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<"1:1" | "3:4" | "4:3" | "9:16" | "16:9">("1:1");
  const [generationProgress, setGenerationProgress] = useState(0);

  // Comparison State
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [secondarySettings, setSecondarySettings] = useState<SimulationSettings>({
    ...DEFAULT_SETTINGS,
    model: 'gemini-3-pro-preview'
  });

  // Session State
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [secondarySession, setSecondarySession] = useState<ChatSession | null>(null);
  
  // Editor/Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Partial<PromptItem> | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTarget, setSettingsTarget] = useState<'primary' | 'secondary'>('primary');
  const [isClearHistoryConfirmOpen, setIsClearHistoryConfirmOpen] = useState(false);
  
  // Interaction states
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Refs
  const chatRef = useRef<any>(null);
  const secondaryChatRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync to localStorage
  useEffect(() => localStorage.setItem('custom_prompts', JSON.stringify(customPrompts)), [customPrompts]);
  useEffect(() => localStorage.setItem('custom_templates', JSON.stringify(customTemplates)), [customTemplates]);
  useEffect(() => localStorage.setItem('favorites', JSON.stringify(Array.from(favorites))), [favorites]);
  useEffect(() => localStorage.setItem('chat_history', JSON.stringify(chatHistory)), [chatHistory]);
  useEffect(() => localStorage.setItem('simulation_settings', JSON.stringify(settings)), [settings]);
  useEffect(() => localStorage.setItem('theme_id', currentThemeId), [currentThemeId]);

  // Apply Theme Effect
  useEffect(() => {
    const theme = THEMES.find(t => t.id === currentThemeId) || THEMES[0];
    const root = document.documentElement;
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [currentThemeId]);

  // --- DERIVED DATA ---
  const allPrompts = useMemo(() => [...PROMPTS_DATA, ...customPrompts], [customPrompts]);
  const allTemplates = useMemo(() => [...INITIAL_TEMPLATES, ...customTemplates], [customTemplates]);

  const allTags = useMemo(() => {
    return Array.from(new Set(allPrompts.flatMap(p => p.tags))).sort();
  }, [allPrompts]);

  // --- ACTIONS ---

  const handleSelectPrompt = (prompt: PromptItem) => {
    setSelectedPrompt(prompt);
    setIsChatOpen(false);
    setCurrentSession(null);
    setSecondarySession(null);
    setIsCompareMode(false);
    setSelectedDoc(null);
    setGeneratedImageUrl(null);
    setAspectRatio("1:1"); // Reset aspect ratio
  };

  const toggleCompareMode = () => setIsCompareMode(prev => !prev);

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(curr => curr === id ? null : curr), 5000);
  };

  const dismissCopied = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCopiedId(null);
  };

  const handleImportPersona = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.act && json.prompt) {
          const newPersona: PromptItem = {
            ...json,
            id: json.id || crypto.randomUUID(),
            isCustom: true,
            contributor: json.contributor || 'Imported'
          };
          setCustomPrompts(prev => [newPersona, ...prev.filter(p => p.id !== newPersona.id)]);
          alert('Persona node integrated successfully.');
        }
      } catch (err) {
        alert('Integrity check failed: Invalid Persona JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const initSession = (prompt: PromptItem, config: SimulationSettings, idSuffix: string = '') => {
    const chatInstance = geminiService.createChat(prompt.prompt, config);
    const session: ChatSession = {
      id: crypto.randomUUID() + idSuffix,
      personaId: prompt.id,
      personaName: prompt.act,
      messages: [{
        role: 'model',
        text: `Active: ${prompt.act} [${config.model}]`,
        timestamp: Date.now()
      }],
      startTime: Date.now(),
      lastUpdateTime: Date.now(),
      modelId: config.model
    };
    return { chatInstance, session };
  };

  const startChat = () => {
    if (!selectedPrompt) return;
    setIsChatOpen(true);
    const primary = initSession(selectedPrompt, settings);
    chatRef.current = primary.chatInstance;
    setCurrentSession(primary.session);
    if (isCompareMode) {
      const secondary = initSession(selectedPrompt, secondarySettings, '-compare');
      secondaryChatRef.current = secondary.chatInstance;
      setSecondarySession(secondary.session);
    }
  };

  const startImageSynthesis = async () => {
    if (!selectedPrompt) return;
    setIsGeneratingImage(true);
    setGenerationProgress(0);
    setGeneratedImageUrl(null);
    
    // Simulate progress
    const interval = setInterval(() => {
        setGenerationProgress(prev => {
            if (prev >= 95) return 95;
            // Variable speed: fast start, slow finish
            const increment = prev < 30 ? 10 : prev < 70 ? 5 : 1; 
            return prev + increment;
        });
    }, 400);

    const result = await geminiService.generateImage(selectedPrompt.prompt, aspectRatio);
    
    clearInterval(interval);
    setGenerationProgress(100);
    
    setTimeout(() => {
        if (result) {
            setGeneratedImageUrl(result);
        } else {
            alert("Multimodal Synthesis Failed. Check API quota.");
        }
        setIsGeneratingImage(false);
    }, 500);
  };

  const resumeSession = (session: ChatSession) => {
    const prompt = allPrompts.find(p => p.id === session.personaId);
    if (!prompt) return;
    setSelectedPrompt(prompt);
    setIsCompareMode(false); 
    setCurrentSession(session);
    setIsChatOpen(true);
    chatRef.current = geminiService.createChat(prompt.prompt, settings);
  };

  const clearHistory = () => {
    setChatHistory([]);
    setIsClearHistoryConfirmOpen(false);
  };

  const deleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setChatHistory(prev => prev.filter(s => s.id !== id));
  };

  const downloadSession = (e: React.MouseEvent, session: ChatSession) => {
    e.stopPropagation();
    const content = `# Chat Session: ${session.personaName}\n` +
                    `Date: ${new Date(session.startTime).toLocaleString()}\n` +
                    `Model: ${session.modelId || 'Unknown'}\n\n` +
                    session.messages.map(m => `**${m.role.toUpperCase()}**: ${m.text}`).join('\n\n');
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `session-${session.personaName.replace(/\s+/g, '_')}-${session.id.slice(0, 4)}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !chatRef.current || isLoading || !currentSession) return;
    const userMessage: Message = { role: 'user', text: inputValue, timestamp: Date.now() };
    setIsLoading(true);
    setInputValue('');

    const updateSess = (sess: ChatSession) => ({ ...sess, messages: [...sess.messages, userMessage], lastUpdateTime: Date.now() });
    const nextPrimary = updateSess(currentSession);
    setCurrentSession(nextPrimary);
    let nextSecondary = null;
    if (isCompareMode && secondarySession) {
      nextSecondary = updateSess(secondarySession);
      setSecondarySession(nextSecondary);
    }

    try {
      const promises = [geminiService.sendMessage(chatRef.current, userMessage.text)];
      if (isCompareMode && secondaryChatRef.current) promises.push(geminiService.sendMessage(secondaryChatRef.current, userMessage.text));
      const results = await Promise.all(promises);
      const updateModelMsg = (sess: ChatSession, text: string) => ({ ...sess, messages: [...sess.messages, { role: 'model', text, timestamp: Date.now() } as Message], lastUpdateTime: Date.now() });
      const finalPrimary = updateModelMsg(nextPrimary, results[0]);
      setCurrentSession(finalPrimary);
      if (isCompareMode && nextSecondary && results[1]) setSecondarySession(updateModelMsg(nextSecondary, results[1]));
      setChatHistory(prev => [finalPrimary, ...prev.filter(s => s.id !== finalPrimary.id)]);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- EDITOR LOGIC ---

  const openPromptEditor = (prompt?: PromptItem) => {
    const initialState = prompt ? { ...prompt } : {
      id: crypto.randomUUID(), act: '', prompt: '', description: '', contributor: 'User', tags: [], category: 'Miscellaneous', type: 'TEXT', for_devs: false, isCustom: true, versions: []
    };
    setEditingPrompt(initialState);
    setIsEditorOpen(true);
  };

  const handleSavePrompt = (p: PromptItem) => {
    const oldVersion = allPrompts.find(item => item.id === p.id);
    
    // Check if critical fields or description have changed to create a version
    if (oldVersion && (oldVersion.prompt !== p.prompt || oldVersion.act !== p.act || oldVersion.description !== p.description)) {
      const versionRecord: PersonaVersion = { 
        timestamp: Date.now(), 
        prompt: oldVersion.prompt, 
        description: oldVersion.description, 
        act: oldVersion.act 
      };
      p.versions = [...(oldVersion.versions || []), versionRecord];
    }

    setCustomPrompts(prev => [p, ...prev.filter(item => item.id !== p.id)]);
    setIsEditorOpen(false);
    setSelectedPrompt(p);
  };

  const handleSaveAsTemplate = (prompt: Partial<PromptItem>) => {
    const newTemplate = {
      name: prompt.act || 'New Template',
      act: prompt.act,
      category: prompt.category,
      tags: prompt.tags,
      description: prompt.description,
      prompt: prompt.prompt
    };
    setCustomTemplates(prev => [...prev, newTemplate]);
    alert('Persona saved as a template successfully.');
  };

  const exportAllUserData = () => {
    try {
      const data = {
        exportDate: new Date().toISOString(),
        customPrompts,
        customTemplates
      };
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `promptforge_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Bulk export failed", e);
      alert("Failed to export your library.");
    }
  };

  const handleShare = async (item: PromptItem) => {
    const shareData = { title: `PromptForge: ${item.act}`, text: item.description || item.prompt.slice(0, 100), url: window.location.href };
    if (navigator.share) await navigator.share(shareData);
    else { navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`); alert('Share info copied!'); }
  };

  const exportPromptAsJson = (item: Partial<PromptItem>) => {
    try {
        const jsonString = JSON.stringify(item, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const filename = (item.act || "persona").replace(/[^a-z0-9]/gi, '_').toLowerCase();
        link.download = `${filename}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    } catch (e) {
        console.error("Export failed", e);
        alert("Failed to export persona.");
    }
  };

  const openSettings = (target: 'primary' | 'secondary') => { setSettingsTarget(target); setIsSettingsOpen(true); };
  
  const activeSettingsToEdit = settingsTarget === 'primary' ? settings : secondarySettings;
  const setSettingsToEdit = settingsTarget === 'primary' ? setSettings : setSecondarySettings;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-body)] transition-colors duration-300">
      <Sidebar
        allPrompts={allPrompts}
        chatHistory={chatHistory}
        favorites={favorites}
        currentView={view}
        onViewChange={setView}
        selectedPromptId={selectedPrompt?.id}
        selectedDocId={selectedDoc}
        onSelectPrompt={handleSelectPrompt}
        onSelectDoc={(docId) => { setSelectedDoc(docId); setSelectedPrompt(null); }}
        onResumeSession={resumeSession}
        onToggleFavorite={toggleFavorite}
        onDeleteSession={deleteSession}
        onDownloadSession={downloadSession}
        onImportPersona={handleImportPersona}
        onExportData={exportAllUserData}
        onNewPersona={() => openPromptEditor()}
        onOpenSettings={() => openSettings('primary')}
        onOpenHelp={() => setIsHelpOpen(true)}
        fileInputRef={fileInputRef}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[var(--bg-app)]">
        {selectedDoc ? (
          <div className="flex-1 flex flex-col p-6 md:p-12 overflow-y-auto">
             <div className="max-w-4xl w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center gap-4 mb-8">
                   <button onClick={() => setSelectedDoc(null)} className="lg:hidden p-2 rounded-full hover:bg-[var(--bg-element)] text-[var(--text-muted)]"><ArrowLeft size={20} /></button>
                   <h2 className="text-3xl font-black text-[var(--text-heading)]">{selectedDoc}</h2>
                </div>
                <div className="prose prose-invert max-w-none bg-[var(--bg-panel)]/50 border border-[var(--border)] p-10 rounded-[3rem] shadow-2xl">
                   <pre className="text-[var(--text-body)] whitespace-pre-wrap font-sans leading-relaxed text-lg">{DOCUMENTATION_CONTENT[selectedDoc as keyof typeof DOCUMENTATION_CONTENT]}</pre>
                </div>
             </div>
          </div>
        ) : selectedPrompt ? (
          <>
            {!isChatOpen ? (
              <div className="flex-1 flex flex-col items-center justify-start p-6 md:p-12 overflow-y-auto">
                <div className="max-w-4xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedPrompt(null)} className="lg:hidden p-2 rounded-full hover:bg-[var(--bg-element)]"><ArrowLeft size={20} /></button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h2 className="text-3xl font-extrabold text-[var(--text-heading)]">{selectedPrompt.act}</h2>
                          <button onClick={() => toggleFavorite(selectedPrompt.id)}><Star size={24} className={favorites.has(selectedPrompt.id) ? "text-amber-400 fill-amber-400" : "text-[var(--text-muted)]"} /></button>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleShare(selectedPrompt)} className="p-2.5 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--accent)] border border-[var(--border)] transition-all"><Share2 size={20} /></button>
                          <button onClick={() => exportPromptAsJson(selectedPrompt)} className="p-2.5 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--accent)] border border-[var(--border)] transition-all" title="Export JSON"><Download size={20} /></button>
                          <button onClick={() => openPromptEditor(selectedPrompt)} className="p-2.5 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--text-heading)] border border-[var(--border)] transition-all"><Edit size={20} /></button>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 mt-6 p-5 rounded-3xl bg-[var(--bg-panel)]/50 border border-[var(--border)]/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]"><Users size={18} /></div>
                          <div className="flex flex-col"><span className="text-[10px] text-[var(--text-muted)] font-bold uppercase mb-1">Creator</span><span className="text-xs text-[var(--text-body)] font-semibold">{selectedPrompt.contributor}</span></div>
                        </div>
                        <div className="h-10 w-px bg-[var(--border)] hidden md:block" />
                        <div className="flex-1 flex flex-wrap gap-2">
                          {selectedPrompt.tags.map(tag => <span key={tag} className="px-3 py-1 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] text-[10px] font-bold border border-[var(--border)] flex items-center gap-1.5"><Hash size={10} /> {tag}</span>)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="w-full">
                    {generatedImageUrl ? (
                      <div className="relative group rounded-[2.5rem] overflow-hidden border border-[var(--border)] shadow-2xl animate-in zoom-in duration-500">
                        <img src={generatedImageUrl} alt="Synthesis Output" className="w-full aspect-square object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 flex flex-col justify-end p-8 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { const link = document.createElement('a'); link.href = generatedImageUrl; link.download = 'artifact.png'; link.click(); }} className="p-4 rounded-2xl bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] transition-all self-end"><Download size={24} /></button>
                        </div>
                        <button onClick={() => setGeneratedImageUrl(null)} className="absolute top-4 right-4 p-2 rounded-full bg-black/50 text-white hover:bg-black transition-colors"><RefreshCw size={18} /></button>
                      </div>
                    ) : isGeneratingImage ? (
                      <div className="w-full aspect-square rounded-[2.5rem] bg-[var(--bg-element)] flex flex-col items-center justify-center border border-[var(--border)] relative overflow-hidden">
                         {/* Animated Background */}
                         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                         
                         <div className="z-10 flex flex-col items-center w-full max-w-xs space-y-6">
                            <div className="relative">
                                <div className="absolute inset-0 bg-[var(--accent)] blur-xl opacity-20 animate-pulse"></div>
                                <ImageIcon size={64} className="text-[var(--accent)] relative z-10 animate-bounce" />
                            </div>
                            
                            <div className="text-center space-y-2">
                                <p className="text-xl font-black text-[var(--text-heading)] uppercase tracking-[0.2em] animate-pulse">Forging Reality</p>
                                <p className="text-xs text-[var(--text-muted)] font-mono">Gemini 2.5 Flash • {aspectRatio}</p>
                            </div>

                            <div className="w-full space-y-2">
                                <div className="h-1.5 w-full bg-[var(--bg-panel)] rounded-full overflow-hidden border border-[var(--border)]">
                                    <div 
                                        className="h-full bg-gradient-to-r from-[var(--accent)] to-purple-500 transition-all duration-300 ease-out"
                                        style={{ width: `${generationProgress}%` }}
                                    />
                                </div>
                                <div className="flex justify-between text-[10px] font-mono text-[var(--text-muted)]">
                                    <span>Synthesizing...</span>
                                    <span>{Math.round(generationProgress)}%</span>
                                </div>
                            </div>
                         </div>
                       </div>
                    ) : (
                      <div className="p-8 rounded-[2.5rem] bg-[var(--bg-panel)]/80 border border-[var(--border)] shadow-2xl relative group">
                        <div className="absolute right-6 top-6 flex items-center gap-2">
                           {copiedId === selectedPrompt.id ? (
                             <div className="flex items-center gap-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/50 rounded-xl animate-in slide-in-from-right-2 fade-in duration-300">
                                <CheckCircle2 size={16} className="text-emerald-400" />
                                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Copied!</span>
                                <button onClick={dismissCopied} className="p-1 rounded hover:bg-emerald-500/20 text-emerald-400 transition-colors"><X size={12} /></button>
                             </div>
                           ) : (
                            <button onClick={() => handleCopy(selectedPrompt.prompt, selectedPrompt.id)} className="p-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--text-heading)] transition-all border border-[var(--border)]"><Copy size={18} /></button>
                           )}
                        </div>
                        <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-6">Instruction Vector</h3>
                        <p className="text-xl text-[var(--text-body)] leading-relaxed font-serif whitespace-pre-wrap">{selectedPrompt.prompt}</p>
                      </div>
                    )}
                  </div>

                  <div className="p-5 rounded-3xl bg-[var(--bg-panel)]/50 border border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400"><SplitSquareHorizontal size={20} /></div>
                      <div>
                        <h4 className="text-sm font-bold text-[var(--text-heading)]">Dual Simulation</h4>
                        <p className="text-xs text-[var(--text-muted)]">Run side-by-side with two distinct configurations.</p>
                      </div>
                    </div>
                    <button onClick={toggleCompareMode} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${isCompareMode ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'bg-[var(--bg-element)] text-[var(--text-muted)] hover:bg-[var(--bg-element-hover)]'}`}>{isCompareMode ? 'Comparison On' : 'Compare Mode'}</button>
                  </div>

                  {(selectedPrompt.category === 'AI Art Generation' || selectedPrompt.type === 'IMAGE') && !isGeneratingImage && (
                    <div className="flex justify-center mb-6">
                        <div className="inline-flex items-center p-1.5 rounded-2xl bg-[var(--bg-element)] border border-[var(--border)] gap-1">
                            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest px-3 flex items-center gap-2">
                                <Layout size={12} /> Aspect Ratio
                            </span>
                            {(['1:1', '3:4', '4:3', '9:16', '16:9'] as const).map(ratio => (
                                <button
                                    key={ratio}
                                    onClick={() => setAspectRatio(ratio)}
                                    className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${
                                        aspectRatio === ratio 
                                        ? 'bg-[var(--accent)] text-white shadow-md' 
                                        : 'text-[var(--text-muted)] hover:bg-[var(--bg-panel)] hover:text-[var(--text-body)]'
                                    }`}
                                >
                                    {ratio}
                                </button>
                            ))}
                        </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20 w-full">
                    {selectedPrompt.category === 'AI Art Generation' || selectedPrompt.type === 'IMAGE' ? (
                      <button onClick={startImageSynthesis} disabled={isGeneratingImage} className="flex items-center justify-center gap-4 px-8 py-5 rounded-[2rem] bg-amber-500 text-white font-black uppercase tracking-widest hover:bg-amber-600 active:scale-95 transition-all shadow-xl shadow-amber-500/30"><ImageIcon size={22} /> {isGeneratingImage ? 'Synthesizing...' : 'Forge Multimodal Art'}</button>
                    ) : (
                      <button onClick={startChat} className="flex items-center justify-center gap-4 px-8 py-5 rounded-[2rem] bg-[var(--accent)] text-white font-black uppercase tracking-widest hover:bg-[var(--accent-hover)] active:scale-95 transition-all shadow-xl shadow-[var(--accent)]/30"><Terminal size={22} /> Initiate Simulation</button>
                    )}
                    <button onClick={() => exportPromptAsJson(selectedPrompt)} className="flex items-center justify-center gap-4 px-8 py-5 rounded-[2rem] bg-[var(--bg-element)] text-[var(--text-heading)] font-black uppercase tracking-widest hover:bg-[var(--bg-element-hover)] active:scale-95 transition-all border border-[var(--border)]"><Download size={22} /> Export Node</button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full bg-[var(--bg-app)]/40">
                <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-panel)]/90 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setIsChatOpen(false)} className="p-2 rounded-full hover:bg-[var(--bg-element)] text-[var(--text-muted)]"><ArrowLeft size={20} /></button>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-heading)]">{selectedPrompt.act}</h3>
                      <div className="flex items-center gap-2 mt-1"><span className="text-[10px] text-[var(--accent)] font-mono tracking-tighter uppercase">Persona Live Simulation</span></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => openSettings('primary')} className="px-3 py-1 rounded-full bg-[var(--bg-element)] border border-[var(--border)] text-[10px] font-medium text-[var(--text-muted)] flex items-center gap-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"><Settings size={12} /> Config A</button>
                    {isCompareMode && <button onClick={() => openSettings('secondary')} className="px-3 py-1 rounded-full bg-[var(--bg-element)] border border-[var(--border)] text-[10px] font-medium text-[var(--text-muted)] flex items-center gap-1.5 hover:border-purple-500 hover:text-purple-400 transition-colors"><Settings size={12} /> Config B</button>}
                  </div>
                </div>
                <div className="flex-1 overflow-hidden relative flex">
                  <div className={`flex-1 h-full border-r border-[var(--border)]/50 transition-all ${isCompareMode ? 'w-1/2' : 'w-full'}`}><ChatStreamView session={currentSession} settings={settings} isLoading={isLoading} title="Configuration A" /></div>
                  {isCompareMode && <div className="flex-1 h-full bg-[var(--bg-panel)]/20 w-1/2"><ChatStreamView session={secondarySession} settings={secondarySettings} isLoading={isLoading} title="Configuration B" /></div>}
                </div>
                <div className="p-6 bg-[var(--bg-app)]/80 backdrop-blur-xl border-t border-[var(--border)] sticky bottom-0">
                  <div className="max-w-4xl mx-auto flex gap-3 relative">
                    <textarea rows={1} placeholder={`Interface with ${selectedPrompt.act}...`} className="flex-1 px-6 py-4 rounded-3xl bg-[var(--bg-panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all resize-none shadow-lg placeholder:text-[var(--text-muted)] text-[var(--text-body)]" value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }} />
                    <button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} className={`p-5 rounded-3xl text-white transition-all active:scale-90 disabled:opacity-50 shadow-lg ${isCompareMode ? 'bg-purple-600 shadow-purple-600/20' : 'bg-[var(--accent)] shadow-[var(--accent)]/20'}`}>{isCompareMode ? <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} /> : <Send size={20} />}</button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-[radial-gradient(circle_at_center,_var(--bg-element)_0%,_transparent_70%)]">
            <div className="max-w-md space-y-8">
              <div className="inline-block p-8 rounded-[3rem] bg-[var(--bg-panel)]/80 border border-[var(--border)] shadow-2xl text-[var(--accent)] relative group">
                <div className="absolute inset-0 bg-[var(--accent)]/20 rounded-[3rem] blur-2xl group-hover:blur-3xl transition-all" />
                <Book size={72} className="relative z-10" />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-[var(--text-heading)] tracking-tighter">Forge Nexus</h2>
                <p className="text-[var(--text-muted)] text-lg font-light leading-relaxed">Bridge intent with expert execution via professional instruction sets.</p>
              </div>
              <div className="pt-6 grid grid-cols-2 gap-4">
                <button onClick={() => openPromptEditor()} className="p-6 rounded-[2.5rem] bg-[var(--accent)]/10 border border-[var(--accent)]/20 text-left space-y-2 hover:bg-[var(--accent)]/20 transition-all group">
                  <Plus size={24} className="text-[var(--accent)] group-hover:rotate-90 transition-transform" />
                  <h4 className="text-sm font-bold text-[var(--text-heading)]">Create Original</h4>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">Forge custom behaviors.</p>
                </button>
                <button onClick={() => setView('docs')} className="p-6 rounded-[2.5rem] bg-[var(--bg-panel)]/50 border border-[var(--border)] text-left space-y-2 hover:bg-[var(--bg-element)] transition-all">
                  <FileText size={24} className="text-emerald-400" />
                  <h4 className="text-sm font-bold text-[var(--text-heading)]">Documentation</h4>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">Policy, PRD, and Tech.</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <PromptEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        initialPrompt={editingPrompt}
        onSave={handleSavePrompt}
        onSaveAsTemplate={handleSaveAsTemplate}
        allTags={allTags}
        allTemplates={allTemplates}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={activeSettingsToEdit}
        onSettingsChange={setSettingsToEdit}
        target={settingsTarget}
        currentThemeId={currentThemeId}
        onThemeChange={setCurrentThemeId}
      />

      <Modal isOpen={isClearHistoryConfirmOpen} onClose={() => setIsClearHistoryConfirmOpen(false)} title="Destroy Session Archive">
         <div className="space-y-8 text-center py-4">
          <div className="inline-block p-6 rounded-[2.5rem] bg-red-500/10 text-red-500 relative"><AlertTriangle size={48} /></div>
          <div className="space-y-3"><h4 className="text-2xl font-black uppercase tracking-tighter">Wipe Log?</h4><p className="text-[var(--text-muted)] text-sm">Permanent deletion of simulation history.</p></div>
          <div className="grid grid-cols-2 gap-4"><button onClick={() => setIsClearHistoryConfirmOpen(false)} className="py-4 rounded-3xl bg-[var(--bg-element)] font-black uppercase tracking-widest text-[10px] text-[var(--text-muted)]">Abort</button><button onClick={clearHistory} className="py-4 rounded-3xl bg-red-600 font-black uppercase tracking-widest text-white text-[10px]">Execute</button></div>
        </div>
      </Modal>
    </div>
  );
};

export default App;
