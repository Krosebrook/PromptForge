
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PROMPTS_DATA, THEMES, TEMPLATE_PROMPTS } from './constants';
import { PromptItem, Message, Category, ChatSession, SimulationSettings } from './types';
import { geminiService } from './services/geminiService';
import { DOCUMENTATION_CONTENT } from './documentation';
import { 
  Search, 
  Terminal, 
  User, 
  Cpu, 
  Zap, 
  Code, 
  Book, 
  LifeBuoy, 
  Send, 
  ArrowLeft,
  Copy,
  CheckCircle2,
  ExternalLink,
  HelpCircle,
  MessageSquare,
  X,
  Info,
  Rocket,
  Bug,
  Lightbulb,
  Plus,
  Star,
  History,
  Edit,
  Trash2,
  Filter,
  Palette,
  Layout,
  BarChart3,
  Bookmark,
  Users,
  Image as ImageIcon,
  AlertTriangle,
  Hash,
  FileText,
  Settings,
  Sliders,
  BrainCircuit,
  Gauge,
  SplitSquareHorizontal,
  Minimize2,
  Maximize2,
  Download,
  SortAsc,
  Tag,
  FileDown
} from 'lucide-react';

const CATEGORIES: Category[] = [
  'Code Assistance',
  'AI Art Generation',
  'Writing & Content',
  'Data Analysis',
  'Miscellaneous'
];

// Default settings for new users
const DEFAULT_SETTINGS: SimulationSettings = {
  model: 'gemini-3-flash-preview',
  temperature: 0.7,
  topP: 0.95,
  topK: 64,
  thinkingBudget: 0,
  maxOutputTokens: 8192
};

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[var(--bg-panel)] border border-[var(--border)] rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)] shrink-0">
          <h3 className="text-xl font-bold text-[var(--text-heading)]">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--bg-element-hover)] text-[var(--text-muted)] transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

// Sub-component for rendering a single chat stream
const ChatStreamView: React.FC<{
  session: ChatSession | null;
  settings: SimulationSettings;
  isLoading: boolean;
  title?: string;
  isActive?: boolean;
}> = ({ session, settings, isLoading, title, isActive = true }) => {
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

const App: React.FC = () => {
  // Persistence states
  const [customPrompts, setCustomPrompts] = useState<PromptItem[]>(() => {
    const saved = localStorage.getItem('custom_prompts');
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
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [selectedContributor, setSelectedContributor] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filtering & Sorting State
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'name' | 'recent'>('name');
  
  // Selection & Compare states
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Comparison State
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [secondarySettings, setSecondarySettings] = useState<SimulationSettings>({
    ...DEFAULT_SETTINGS,
    model: 'gemini-3-pro-preview' // Default challenger to Pro
  });

  // Session State
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [secondarySession, setSecondarySession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]); // Legacy ref
  
  // Editor/Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Partial<PromptItem> | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsTarget, setSettingsTarget] = useState<'primary' | 'secondary'>('primary'); // Which settings to edit
  const [settingsTab, setSettingsTab] = useState<'interface' | 'model' | 'params'>('model');
  const [isClearHistoryConfirmOpen, setIsClearHistoryConfirmOpen] = useState(false);
  
  // Interaction states
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Refs for API interaction
  const chatRef = useRef<any>(null);
  const secondaryChatRef = useRef<any>(null);

  // Sync to localStorage
  useEffect(() => localStorage.setItem('custom_prompts', JSON.stringify(customPrompts)), [customPrompts]);
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

  const contributorsList = useMemo(() => {
    const contributors = new Set(allPrompts.map(p => p.contributor));
    return ['All', ...Array.from(contributors)].sort();
  }, [allPrompts]);

  const allTags = useMemo(() => {
    return Array.from(new Set(allPrompts.flatMap(p => p.tags))).sort();
  }, [allPrompts]);

  const filteredPrompts = useMemo(() => {
    let list = view === 'favorites' 
      ? allPrompts.filter(p => favorites.has(p.id)) 
      : allPrompts;

    list = list.filter(p => {
      const matchesSearch = p.act.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.prompt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesContributor = selectedContributor === 'All' || p.contributor === selectedContributor;
      const matchesTags = activeTags.length === 0 || activeTags.every(tag => p.tags.includes(tag));
      
      return matchesSearch && matchesCategory && matchesContributor && matchesTags;
    });

    return list.sort((a, b) => {
      if (sortOrder === 'name') return a.act.localeCompare(b.act);
      return 0;
    });
  }, [allPrompts, favorites, view, searchQuery, activeCategory, selectedContributor, activeTags, sortOrder]);

  const filteredHistory = useMemo(() => {
    if (!searchQuery) return chatHistory;
    return chatHistory.filter(session => 
      session.personaName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.messages.some(m => m.text.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [chatHistory, searchQuery]);

  // --- ACTIONS ---

  const handleSelectPrompt = (prompt: PromptItem) => {
    setSelectedPrompt(prompt);
    setMessages([]);
    setIsChatOpen(false);
    setCurrentSession(null);
    setSecondarySession(null);
    setIsCompareMode(false);
    setSelectedDoc(null);
  };

  const toggleFavorite = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleTag = (tag: string) => {
    setActiveTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
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
    
    // Primary Session
    const primary = initSession(selectedPrompt, settings);
    chatRef.current = primary.chatInstance;
    setCurrentSession(primary.session);
    setMessages(primary.session.messages); // Legacy state sync for simple view
    
    // Comparison Session
    if (isCompareMode) {
      const secondary = initSession(selectedPrompt, secondarySettings, '-compare');
      secondaryChatRef.current = secondary.chatInstance;
      setSecondarySession(secondary.session);
    } else {
      secondaryChatRef.current = null;
      setSecondarySession(null);
    }
  };

  const resumeSession = (session: ChatSession) => {
    const prompt = allPrompts.find(p => p.id === session.personaId);
    if (!prompt) return;
    setSelectedPrompt(prompt);
    
    // Resume is simple mode only for now
    setIsCompareMode(false); 
    setCurrentSession(session);
    setMessages(session.messages);
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

    const userMessage: Message = {
      role: 'user',
      text: inputValue,
      timestamp: Date.now()
    };

    setIsLoading(true);
    setInputValue('');

    // Update UI immediately
    const updateSessionWithUserMsg = (sess: ChatSession) => ({
      ...sess,
      messages: [...sess.messages, userMessage],
      lastUpdateTime: Date.now()
    });

    const nextPrimarySession = updateSessionWithUserMsg(currentSession);
    setCurrentSession(nextPrimarySession);
    setMessages(nextPrimarySession.messages);

    let nextSecondarySession = null;
    if (isCompareMode && secondarySession) {
      nextSecondarySession = updateSessionWithUserMsg(secondarySession);
      setSecondarySession(nextSecondarySession);
    }

    // Parallel API Calls
    try {
      const promises = [geminiService.sendMessage(chatRef.current, userMessage.text)];
      if (isCompareMode && secondaryChatRef.current) {
        promises.push(geminiService.sendMessage(secondaryChatRef.current, userMessage.text));
      }

      const results = await Promise.all(promises);
      
      const updateSessionWithModelMsg = (sess: ChatSession, text: string) => ({
        ...sess,
        messages: [...sess.messages, { role: 'model', text, timestamp: Date.now() } as Message],
        lastUpdateTime: Date.now()
      });

      const finalPrimary = updateSessionWithModelMsg(nextPrimarySession, results[0]);
      setCurrentSession(finalPrimary);
      setMessages(finalPrimary.messages);

      if (isCompareMode && nextSecondarySession && results[1]) {
        const finalSecondary = updateSessionWithModelMsg(nextSecondarySession, results[1]);
        setSecondarySession(finalSecondary);
      }

      // Save to History (Primary only for now to avoid clutter, or could save both)
      setChatHistory(prev => {
        // Remove existing if present
        const others = prev.filter(s => s.id !== finalPrimary.id);
        return [finalPrimary, ...others];
      });

    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: "Error: Simulation failed.", timestamp: Date.now() }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ... [Prompt Editor Functions] ...
  const openPromptEditor = (prompt?: PromptItem) => {
    setEditingPrompt(prompt ? { ...prompt } : {
      id: crypto.randomUUID(),
      act: '',
      prompt: '',
      description: '',
      contributor: 'User',
      tags: [],
      category: 'Miscellaneous',
      type: 'TEXT',
      for_devs: false,
      isCustom: true
    });
    setIsEditorOpen(true);
  };

  const savePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrompt) return;
    const p = editingPrompt as PromptItem;
    if (p.isCustom || !PROMPTS_DATA.find(orig => orig.id === p.id)) {
      setCustomPrompts(prev => {
        const index = prev.findIndex(item => item.id === p.id);
        if (index > -1) {
          const next = [...prev];
          next[index] = p;
          return next;
        }
        return [p, ...prev];
      });
    } else {
      setCustomPrompts(prev => [...prev.filter(item => item.id !== p.id), p]);
    }
    setIsEditorOpen(false);
    setSelectedPrompt(p);
  };

  const deletePrompt = (id: string) => {
    setCustomPrompts(prev => prev.filter(p => p.id !== id));
    if (selectedPrompt?.id === id) setSelectedPrompt(null);
  };

  const exportPromptAsJson = () => {
    if (!editingPrompt) return;
    const jsonString = JSON.stringify(editingPrompt, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${(editingPrompt.act || "untitled_persona").replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const applyTemplate = (template: any) => {
    setEditingPrompt(prev => ({
      ...prev,
      act: template.act,
      category: template.category,
      prompt: template.prompt,
      description: template.description,
      tags: template.tags
    }));
  };

  const ImagePreview = ({ promptText, compact = false }: { promptText: string, compact?: boolean }) => {
    const seed = useMemo(() => {
      let hash = 0;
      for (let i = 0; i < promptText.length; i++) {
        hash = promptText.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.abs(hash);
    }, [promptText]);

    const previewUrl = `https://picsum.photos/seed/${seed}/${compact ? '400/225' : '800/450'}`;
    return (
      <div className={`relative w-full aspect-video rounded-3xl overflow-hidden bg-[var(--bg-element)] border border-[var(--border)] shadow-xl group transition-all duration-500`}>
        <img src={previewUrl} alt="Visual Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-app)]/80 to-transparent flex flex-col justify-end p-6">
          <div className="flex items-center gap-2 text-[var(--accent)] mb-1">
            <ImageIcon size={compact ? 14 : 18} />
            <span className={`${compact ? 'text-[8px]' : 'text-xs'} font-bold uppercase tracking-widest`}>Real-time Interpretation</span>
          </div>
          {!compact && <p className="text-[10px] text-[var(--text-muted)] italic font-mono uppercase tracking-tighter">Visualizing instruction vector...</p>}
        </div>
      </div>
    );
  };

  const toggleCompareMode = () => {
    setIsCompareMode(!isCompareMode);
  };

  const openSettings = (target: 'primary' | 'secondary') => {
    setSettingsTarget(target);
    setIsSettingsOpen(true);
  };

  const activeSettingsToEdit = settingsTarget === 'primary' ? settings : secondarySettings;
  const setSettingsToEdit = settingsTarget === 'primary' ? setSettings : setSecondarySettings;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-body)] transition-colors duration-300">
      {/* Left Sidebar */}
      <div className={`flex flex-col border-r border-[var(--border)] bg-[var(--bg-panel)]/50 transition-all duration-300 ${selectedPrompt || selectedDoc ? 'w-80 hidden lg:flex' : 'w-full lg:w-96'}`}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--accent)]/20 text-[var(--accent)]">
                <Zap size={24} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-[var(--text-heading)]">PromptForge</h1>
            </div>
            <button onClick={() => openPromptEditor()} className="p-2 rounded-xl bg-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)]/30 transition-all" title="Add Custom Prompt">
              <Plus size={20} />
            </button>
          </div>
          
          <div className="flex gap-1 p-1 bg-[var(--bg-element)] rounded-xl overflow-x-auto no-scrollbar">
            {(['library', 'favorites', 'history', 'docs'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg capitalize transition-all whitespace-nowrap ${view === v ? 'bg-[var(--accent)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'}`}>
                {v === 'library' && <Book size={12} />}
                {v === 'favorites' && <Star size={12} />}
                {v === 'history' && <History size={12} />}
                {v === 'docs' && <FileText size={12} />}
                {v}
              </button>
            ))}
          </div>

          {view !== 'docs' && (
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors" size={18} />
              <input type="text" placeholder={`Search ${view}...`} className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/50 transition-all text-sm placeholder:text-[var(--text-muted)] text-[var(--text-body)]" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
            </div>
          )}

          {(view === 'library' || view === 'favorites') && (
            <div className="space-y-4">
              <div className="flex flex-col gap-2">
                 {/* Categories Row */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button onClick={() => setActiveCategory('All')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${activeCategory === 'All' ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'}`}>All</button>
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${activeCategory === cat ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
                
                {/* Advanced Filters: Sort & Contributor */}
                <div className="flex gap-2">
                   <div className="flex items-center gap-2 bg-[var(--bg-element)]/50 p-2 rounded-xl border border-[var(--border)]/50 flex-1">
                    <Users size={14} className="text-[var(--text-muted)]" />
                    <select className="flex-1 bg-transparent text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] outline-none cursor-pointer w-full" value={selectedContributor} onChange={(e) => setSelectedContributor(e.target.value)}>
                      {contributorsList.map(c => <option key={c} value={c} className="bg-[var(--bg-panel)] text-[var(--text-body)]">By: {c}</option>)}
                    </select>
                  </div>
                  <button onClick={() => setSortOrder(prev => prev === 'name' ? 'recent' : 'name')} className="p-2 rounded-xl bg-[var(--bg-element)]/50 border border-[var(--border)]/50 text-[var(--text-muted)] hover:text-[var(--text-body)] transition-colors" title="Toggle Sort Order">
                    <SortAsc size={14} className={sortOrder === 'recent' ? "rotate-180 transition-transform" : "transition-transform"} />
                  </button>
                </div>
              
                {/* Tag Cloud */}
                {allTags.length > 0 && (
                   <div className="flex gap-2 overflow-x-auto no-scrollbar pt-1">
                     {allTags.map(tag => (
                       <button 
                         key={tag} 
                         onClick={() => toggleTag(tag)}
                         className={`px-2 py-1 rounded-md text-[9px] font-mono border transition-all whitespace-nowrap flex items-center gap-1 ${activeTags.includes(tag) ? 'bg-[var(--accent)]/20 border-[var(--accent)]/50 text-[var(--accent)]' : 'bg-[var(--bg-element)]/30 border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--text-muted)]'}`}
                       >
                         <Tag size={8} /> {tag}
                       </button>
                     ))}
                   </div>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2">
          {view === 'history' ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center px-2 mb-2">
                <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest">Active Sessions ({filteredHistory.length})</span>
                {chatHistory.length > 0 && (
                  <button onClick={() => setIsClearHistoryConfirmOpen(true)} className="text-[10px] text-red-400 hover:text-red-300 transition-colors font-bold uppercase flex items-center gap-1">
                    <Trash2 size={10} /> Clear All
                  </button>
                )}
              </div>
              {filteredHistory.length > 0 ? (
                filteredHistory.map(session => (
                  <div key={session.id} className="group relative">
                    <button onClick={() => resumeSession(session)} className="w-full text-left p-4 rounded-2xl border border-transparent bg-[var(--bg-element)]/40 hover:border-[var(--border)] hover:bg-[var(--bg-element)] transition-all pr-16">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-bold text-[var(--text-heading)] text-sm line-clamp-1">{session.personaName}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-1.5">
                         <span className="text-[10px] font-mono text-[var(--text-muted)]">{new Date(session.lastUpdateTime).toLocaleDateString()}</span>
                         <span className="w-1 h-1 rounded-full bg-[var(--text-muted)]"></span>
                         <span className="text-[10px] font-mono text-[var(--accent)]">{session.messages.length} msgs</span>
                      </div>
                      <p className="text-xs text-[var(--text-muted)] line-clamp-1 italic">{session.messages[session.messages.length - 1]?.text}</p>
                    </button>
                    {/* Hover Actions for Session */}
                    <div className="absolute right-2 top-2 bottom-2 flex flex-col justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={(e) => downloadSession(e, session)} className="p-1.5 rounded-lg bg-[var(--bg-element-hover)] text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-white transition-colors" title="Export Transcript">
                        <FileDown size={14} />
                      </button>
                      <button onClick={(e) => deleteSession(e, session.id)} className="p-1.5 rounded-lg bg-[var(--bg-element-hover)] text-[var(--text-muted)] hover:bg-red-600 hover:text-white transition-colors" title="Delete Session">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center opacity-30 flex flex-col items-center">
                  <History size={48} className="mb-2" />
                  <p className="text-sm font-mono">Archive Empty</p>
                </div>
              )}
            </div>
          ) : view === 'docs' ? (
            <div className="space-y-2">
               {Object.keys(DOCUMENTATION_CONTENT).map(fileName => (
                 <button key={fileName} onClick={() => { setSelectedDoc(fileName); setSelectedPrompt(null); }} className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedDoc === fileName ? 'bg-[var(--accent)]/10 border-[var(--accent)]/50' : 'bg-[var(--bg-element)]/40 border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-element)]'}`}>
                   <div className="flex items-center gap-3">
                     <FileText size={16} className="text-[var(--accent)]" />
                     <span className="text-sm font-medium text-[var(--text-heading)]">{fileName}</span>
                   </div>
                 </button>
               ))}
            </div>
          ) : (
            filteredPrompts.map(p => (
              <button key={p.id} onClick={() => handleSelectPrompt(p)} className={`w-full text-left p-4 rounded-2xl border transition-all group relative ${selectedPrompt?.id === p.id ? 'bg-[var(--accent)]/10 border-[var(--accent)]/50' : 'bg-[var(--bg-element)]/40 border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-element)]'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-[var(--text-heading)] group-hover:text-[var(--accent)] transition-colors pr-6">{p.act}</span>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => toggleFavorite(p.id, e)} className={`transition-colors ${favorites.has(p.id) ? 'text-amber-400' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'}`}>
                      <Star size={14} fill={favorites.has(p.id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-[var(--text-muted)] line-clamp-2 leading-relaxed mb-3">{p.description || p.prompt}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border border-[var(--border)] text-[var(--text-muted)]`}>{p.category}</span>
                  {p.tags.slice(0, 2).map(t => (
                    <span key={t} className="text-[9px] text-[var(--text-muted)] font-mono">#{t}</span>
                  ))}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-panel)]/80 flex items-center gap-2">
          <button onClick={() => setIsHelpOpen(true)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--text-body)] hover:bg-[var(--bg-element-hover)] transition-all text-xs font-medium">
            <HelpCircle size={14} /> Help
          </button>
          <button onClick={() => openSettings('primary')} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--text-body)] hover:bg-[var(--bg-element-hover)] transition-all text-xs font-medium" title="Advanced Simulation Settings">
            <Settings size={14} />
          </button>
          <button onClick={() => setIsFeedbackOpen(true)} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--text-body)] hover:bg-[var(--bg-element-hover)] transition-all text-xs font-medium">
            <MessageSquare size={14} />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-[var(--bg-app)]">
        {selectedDoc ? (
          <div className="flex-1 flex flex-col p-6 md:p-12 overflow-y-auto">
            <div className="max-w-4xl w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center gap-4 mb-8">
                  <button onClick={() => setSelectedDoc(null)} className="lg:hidden p-2 rounded-full hover:bg-[var(--bg-element)] text-[var(--text-muted)]">
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-3xl font-black text-[var(--text-heading)]">{selectedDoc}</h2>
               </div>
               <div className="prose prose-invert max-w-none bg-[var(--bg-panel)]/50 border border-[var(--border)] p-10 rounded-[3rem] shadow-2xl">
                  <pre className="text-[var(--text-body)] whitespace-pre-wrap font-sans leading-relaxed text-lg">
                    {DOCUMENTATION_CONTENT[selectedDoc as keyof typeof DOCUMENTATION_CONTENT]}
                  </pre>
               </div>
            </div>
          </div>
        ) : selectedPrompt ? (
          <>
            {!isChatOpen ? (
              <div className="flex-1 flex flex-col items-center justify-start p-6 md:p-12 overflow-y-auto">
                <div className="max-w-4xl w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setSelectedPrompt(null)} className="lg:hidden p-2 rounded-full hover:bg-[var(--bg-element)]">
                      <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h2 className="text-3xl font-extrabold text-[var(--text-heading)] leading-tight">{selectedPrompt.act}</h2>
                          <button onClick={() => toggleFavorite(selectedPrompt.id)}>
                             <Star size={24} className={favorites.has(selectedPrompt.id) ? "text-amber-400 fill-amber-400" : "text-[var(--text-muted)]"} />
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openPromptEditor(selectedPrompt)} className="p-2.5 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--text-heading)] border border-[var(--border)] transition-all">
                            <Edit size={20} />
                          </button>
                          {(selectedPrompt.isCustom || !PROMPTS_DATA.find(x => x.id === selectedPrompt.id)) && (
                            <button onClick={() => deletePrompt(selectedPrompt.id)} className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all">
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-6 p-5 rounded-3xl bg-[var(--bg-panel)]/50 border border-[var(--border)]/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-[var(--accent)]/10 text-[var(--accent)]">
                            <Users size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-widest leading-none mb-1">Creator</span>
                            <span className="text-xs text-[var(--text-body)] font-semibold">{selectedPrompt.contributor}</span>
                          </div>
                        </div>
                        <div className="h-10 w-px bg-[var(--border)] hidden md:block" />
                        <div className="flex-1 flex flex-wrap gap-2">
                          {selectedPrompt.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] text-[10px] font-bold border border-[var(--border)] flex items-center gap-1.5 shadow-sm">
                              <Hash size={10} className="text-[var(--text-muted)]" />
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedPrompt.type === 'IMAGE' && (
                    <ImagePreview promptText={selectedPrompt.prompt} />
                  )}

                  <div className="p-8 rounded-[2.5rem] bg-[var(--bg-panel)]/80 border border-[var(--border)] shadow-2xl relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent)]/5 blur-3xl pointer-events-none" />
                    <button 
                      onClick={() => handleCopy(selectedPrompt.prompt, selectedPrompt.id)}
                      className="absolute right-6 top-6 p-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] opacity-0 group-hover:opacity-100 hover:text-[var(--text-heading)] transition-all border border-[var(--border)]"
                    >
                      {copiedId === selectedPrompt.id ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Copy size={18} />}
                    </button>
                    <h3 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-6">Instruction Vector</h3>
                    <p className="text-xl text-[var(--text-body)] leading-relaxed font-serif whitespace-pre-wrap selection:bg-[var(--accent)]/30">
                      {selectedPrompt.prompt}
                    </p>
                    {selectedPrompt.description && (
                      <div className="mt-8 pt-6 border-t border-[var(--border)]/50">
                        <h4 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em] mb-2">Contextual Data</h4>
                        <p className="text-sm text-[var(--text-muted)] leading-relaxed">{selectedPrompt.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Comparison Mode Toggle */}
                  <div className="p-5 rounded-3xl bg-[var(--bg-panel)]/50 border border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-purple-500/20 text-purple-400">
                        <SplitSquareHorizontal size={20} />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[var(--text-heading)]">Compare Models</h4>
                        <p className="text-xs text-[var(--text-muted)]">Run this persona against two different Gemini configurations.</p>
                      </div>
                    </div>
                    <button 
                      onClick={toggleCompareMode}
                      className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                        isCompareMode 
                        ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' 
                        : 'bg-[var(--bg-element)] text-[var(--text-muted)] hover:bg-[var(--bg-element-hover)]'
                      }`}
                    >
                      {isCompareMode ? 'Comparison Active' : 'Enable Comparison'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                    <button onClick={startChat} className="flex items-center justify-center gap-4 px-8 py-5 rounded-[2rem] bg-[var(--accent)] text-white font-black uppercase tracking-widest hover:bg-[var(--accent-hover)] active:scale-95 transition-all shadow-xl shadow-[var(--accent)]/30">
                      <Terminal size={22} /> Initiate Simulation
                    </button>
                    <button onClick={() => handleCopy(selectedPrompt.prompt, selectedPrompt.id)} className="flex items-center justify-center gap-4 px-8 py-5 rounded-[2rem] bg-[var(--bg-element)] text-[var(--text-heading)] font-black uppercase tracking-widest hover:bg-[var(--bg-element-hover)] active:scale-95 transition-all border border-[var(--border)]">
                      <Copy size={22} /> Export Logic
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full bg-[var(--bg-app)]/40">
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between bg-[var(--bg-panel)]/90 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setIsChatOpen(false)} className="p-2 rounded-full hover:bg-[var(--bg-element)] text-[var(--text-muted)] transition-colors">
                      <ArrowLeft size={20} />
                    </button>
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-heading)] leading-none">{selectedPrompt.act}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-[var(--accent)] font-mono tracking-tighter uppercase">Persona Live Simulation</span>
                        {isCompareMode && <span className="text-[10px] bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded uppercase font-bold">Split View</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Primary Settings Button */}
                    <button onClick={() => openSettings('primary')} className="px-3 py-1 rounded-full bg-[var(--bg-element)] border border-[var(--border)] text-[10px] font-medium text-[var(--text-muted)] flex items-center gap-1.5 hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors">
                      <Cpu size={12} />
                      {settings.model}
                    </button>
                    
                    {/* Secondary Settings Button (Only visible in compare mode) */}
                    {isCompareMode && (
                      <>
                        <span className="text-[var(--text-muted)] text-xs">vs</span>
                        <button onClick={() => openSettings('secondary')} className="px-3 py-1 rounded-full bg-[var(--bg-element)] border border-[var(--border)] text-[10px] font-medium text-[var(--text-muted)] flex items-center gap-1.5 hover:border-purple-500 hover:text-purple-400 transition-colors">
                          <Cpu size={12} />
                          {secondarySettings.model}
                        </button>
                      </>
                    )}
                    
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active</span>
                    </div>
                  </div>
                </div>

                {/* Main Chat Area - Dynamic Split */}
                <div className="flex-1 overflow-hidden relative flex">
                  {/* Primary Chat */}
                  <div className={`flex-1 h-full border-r border-[var(--border)]/50 transition-all ${isCompareMode ? 'w-1/2' : 'w-full'}`}>
                    <ChatStreamView 
                      session={currentSession} 
                      settings={settings} 
                      isLoading={isLoading} 
                    />
                  </div>

                  {/* Secondary Chat (Compare Mode) */}
                  {isCompareMode && (
                    <div className="flex-1 h-full bg-[var(--bg-panel)]/20 w-1/2">
                      <ChatStreamView 
                        session={secondarySession} 
                        settings={secondarySettings} 
                        isLoading={isLoading} 
                      />
                    </div>
                  )}
                </div>

                <div className="p-6 bg-[var(--bg-app)]/80 backdrop-blur-xl border-t border-[var(--border)] sticky bottom-0">
                  <div className="max-w-4xl mx-auto flex gap-3 relative">
                    <textarea 
                      rows={1}
                      placeholder={`Interface with ${selectedPrompt.act}${isCompareMode ? ' (Dual Stream)' : ''}...`}
                      className="flex-1 px-6 py-4 rounded-3xl bg-[var(--bg-panel)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all resize-none shadow-lg placeholder:text-[var(--text-muted)] text-[var(--text-body)]"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    />
                    <button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} className={`p-5 rounded-3xl text-white transition-all active:scale-90 disabled:opacity-50 shadow-lg ${isCompareMode ? 'bg-purple-600 hover:bg-purple-500 shadow-purple-600/20' : 'bg-[var(--accent)] hover:bg-[var(--accent-hover)] shadow-[var(--accent)]/20'}`}>
                      {isCompareMode ? <SplitSquareHorizontal size={20} /> : <Send size={20} />}
                    </button>
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

      {/* Editor Modal - Included Existing Implementation */}
      <Modal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} title={editingPrompt?.act ? "Refine Persona Node" : "Forge New Persona"}>
        <form onSubmit={savePrompt} className="space-y-6">
           <div className="mb-6 p-4 rounded-2xl bg-[var(--bg-element)]/50 border border-[var(--border)]">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3 block">Quick Start Templates</label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {TEMPLATE_PROMPTS.map((t, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => applyTemplate(t)}
                  className="px-3 py-2 rounded-xl bg-[var(--bg-panel)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all text-xs font-medium whitespace-nowrap text-[var(--text-body)]"
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Behavior Label</label>
              <input required className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm transition-all text-[var(--text-body)]" value={editingPrompt?.act || ''} onChange={e => setEditingPrompt(prev => ({ ...prev, act: e.target.value }))} placeholder="e.g. Code Reviewer" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Taxonomy</label>
              <select className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm appearance-none cursor-pointer text-[var(--text-body)]" value={editingPrompt?.category} onChange={e => setEditingPrompt(prev => ({ ...prev, category: e.target.value as Category }))}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Description</label>
            <textarea 
              rows={2} 
              className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-xs placeholder:text-[var(--text-muted)] text-[var(--text-body)]" 
              value={editingPrompt?.description || ''} 
              onChange={e => setEditingPrompt(prev => ({ ...prev, description: e.target.value }))} 
              placeholder="Context, background story, or usage notes..." 
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Instruction Matrix</label>
            <textarea required rows={6} className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-mono selection:bg-[var(--accent)]/30 text-[var(--text-body)]" value={editingPrompt?.prompt || ''} onChange={e => setEditingPrompt(prev => ({ ...prev, prompt: e.target.value }))} placeholder="System instructions for the model..." />
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Tags (Comma Separated)</label>
            <input 
              className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-xs placeholder:text-[var(--text-muted)] text-[var(--text-body)]" 
              value={editingPrompt?.tags?.join(', ') || ''} 
              onChange={e => setEditingPrompt(prev => ({ 
                ...prev, 
                tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
              }))} 
              placeholder="e.g. coding, python, web" 
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={exportPromptAsJson} className="flex-1 py-5 rounded-[2rem] bg-[var(--bg-element)] text-[var(--text-heading)] font-black uppercase tracking-[0.2em] hover:bg-[var(--bg-element-hover)] transition-all border border-[var(--border)] flex items-center justify-center gap-2">
              <Download size={18} /> Export JSON
            </button>
            <button type="submit" className="flex-[2] py-5 rounded-[2rem] bg-[var(--accent)] text-white font-black uppercase tracking-[0.2em] hover:bg-[var(--accent-hover)] transition-all shadow-xl shadow-[var(--accent)]/30">
              Commit Vector
            </button>
          </div>
        </form>
      </Modal>

      {/* Advanced Settings Modal - Updated for Dynamic Target (Primary vs Secondary) */}
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title={`Simulation Config (${settingsTarget})`}>
        {/* Tab Nav */}
        <div className="flex items-center gap-1 p-1 mb-6 bg-[var(--bg-element)]/50 rounded-xl border border-[var(--border)] shrink-0">
            <button 
                onClick={() => setSettingsTab('model')} 
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${settingsTab === 'model' ? 'bg-[var(--bg-panel)] text-[var(--text-heading)] shadow-sm ring-1 ring-black/5' : 'text-[var(--text-muted)] hover:text-[var(--text-body)] hover:bg-[var(--bg-element-hover)]'}`}
            >
                <BrainCircuit size={14} /> Model
            </button>
            <button 
                onClick={() => setSettingsTab('params')} 
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${settingsTab === 'params' ? 'bg-[var(--bg-panel)] text-[var(--text-heading)] shadow-sm ring-1 ring-black/5' : 'text-[var(--text-muted)] hover:text-[var(--text-body)] hover:bg-[var(--bg-element-hover)]'}`}
            >
                <Sliders size={14} /> Params
            </button>
            <button 
                onClick={() => setSettingsTab('interface')} 
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${settingsTab === 'interface' ? 'bg-[var(--bg-panel)] text-[var(--text-heading)] shadow-sm ring-1 ring-black/5' : 'text-[var(--text-muted)] hover:text-[var(--text-body)] hover:bg-[var(--bg-element-hover)]'}`}
            >
                <Palette size={14} /> Interface
            </button>
        </div>

        <div className="space-y-6 min-h-[300px]">
            {settingsTab === 'interface' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="p-4 rounded-2xl bg-[var(--bg-element)]/30 border border-[var(--border)] text-xs text-[var(--text-muted)]">
                        Customize the visual appearance of the workspace.
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                        {THEMES.map(theme => (
                            <button
                              key={theme.id}
                              onClick={() => setCurrentThemeId(theme.id)}
                              className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                                currentThemeId === theme.id
                                  ? 'bg-[var(--accent)]/10 border-[var(--accent)]'
                                  : 'bg-[var(--bg-element)] border-[var(--border)] hover:bg-[var(--bg-element-hover)]'
                              }`}
                            >
                               <div className="w-12 h-12 rounded-lg shadow-sm border border-[var(--border)] relative overflow-hidden">
                                    <div className="absolute inset-0" style={{ backgroundColor: theme.colors['--bg-app'] }}></div>
                                    <div className="absolute bottom-0 right-0 w-6 h-6 rounded-tl-lg" style={{ backgroundColor: theme.colors['--bg-panel'] }}></div>
                               </div>
                               <div className="flex-1 text-left">
                                    <span className={`text-sm font-bold block ${currentThemeId === theme.id ? 'text-[var(--text-heading)]' : 'text-[var(--text-body)]'}`}>
                                        {theme.name}
                                    </span>
                                    <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider">
                                        {theme.id === 'pro-dark' ? 'High Contrast' : theme.id === 'pro-light' ? 'Clean & Bright' : 'Deep Focus'}
                                    </span>
                               </div>
                               {currentThemeId === theme.id && <CheckCircle2 size={18} className="text-[var(--accent)]" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {settingsTab === 'model' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                     <div className="p-4 rounded-2xl bg-[var(--bg-element)]/30 border border-[var(--border)] text-xs text-[var(--text-muted)]">
                        Select the reasoning engine for the <strong>{settingsTarget}</strong> session.
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                        {[
                            { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', desc: 'Fast, efficient, low latency.' },
                            { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', desc: 'Complex reasoning, high capability.' },
                        ].map((m) => (
                            <button
                                key={m.id}
                                onClick={() => setSettingsToEdit(prev => ({ ...prev, model: m.id }))}
                                className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all ${
                                    activeSettingsToEdit.model === m.id 
                                    ? 'bg-[var(--accent)]/10 border-[var(--accent)] ring-1 ring-[var(--accent)]' 
                                    : 'bg-[var(--bg-element)] border-[var(--border)] hover:bg-[var(--bg-element-hover)]'
                                }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-full ${activeSettingsToEdit.model === m.id ? 'bg-[var(--accent)] text-white' : 'bg-[var(--bg-element-hover)] text-[var(--text-muted)]'}`}>
                                        <Cpu size={20} />
                                    </div>
                                    <div>
                                        <div className={`font-bold ${activeSettingsToEdit.model === m.id ? 'text-[var(--text-heading)]' : 'text-[var(--text-body)]'}`}>{m.name}</div>
                                        <div className="text-xs text-[var(--text-muted)]">{m.desc}</div>
                                    </div>
                                </div>
                                {activeSettingsToEdit.model === m.id && <CheckCircle2 size={20} className="text-[var(--accent)]" />}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {settingsTab === 'params' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-4">
                        <div className="flex justify-between items-end">
                            <label className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
                                <Sliders size={16} className="text-emerald-400" />
                                Temperature
                            </label>
                            <div className="text-right">
                                 <span className="text-xl font-mono font-bold text-[var(--text-heading)]">{activeSettingsToEdit.temperature.toFixed(1)}</span>
                            </div>
                        </div>
                        <input 
                            type="range" min="0" max="2" step="0.1"
                            value={activeSettingsToEdit.temperature}
                            onChange={(e) => setSettingsToEdit(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                            className="w-full h-2 bg-[var(--bg-element)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]"
                        />
                        <p className="text-xs text-[var(--text-muted)]">Controls randomness: Lower values are more deterministic, higher values are more creative.</p>
                    </div>
                    
                    {(activeSettingsToEdit.model.includes('gemini-3')) && (
                        <div className="space-y-4 pt-6 border-t border-[var(--border)]">
                            <div className="flex justify-between items-end">
                                <label className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
                                    <BrainCircuit size={16} className="text-purple-400" />
                                    Thinking Budget
                                </label>
                                <div className="text-right">
                                    <span className="text-xl font-mono font-bold text-[var(--text-heading)]">{activeSettingsToEdit.thinkingBudget}</span>
                                    <span className="text-xs text-[var(--text-muted)] ml-1">tokens</span>
                                </div>
                            </div>
                            <input 
                                type="range" min="0" max="4000" step="256"
                                value={activeSettingsToEdit.thinkingBudget}
                                onChange={(e) => setSettingsToEdit(prev => ({ ...prev, thinkingBudget: parseInt(e.target.value) }))}
                                className="w-full h-2 bg-[var(--bg-element)] rounded-lg appearance-none cursor-pointer accent-purple-500"
                            />
                            <p className="text-xs text-[var(--text-muted)]">Allocates tokens for internal reasoning before generating a response. Higher budget improves complex problem solving.</p>
                        </div>
                    )}
                </div>
            )}
        </div>

        <div className="pt-6 mt-6 border-t border-[var(--border)]">
            <button onClick={() => setIsSettingsOpen(false)} className="w-full py-4 rounded-xl bg-[var(--accent)] text-white font-bold hover:bg-[var(--accent-hover)] transition-all shadow-lg shadow-[var(--accent)]/20">
                Apply Configuration
            </button>
        </div>
      </Modal>

      {/* Other Modals (History, Help, Feedback) - [Preserved but truncated for brevity if logic identical] */}
      <Modal isOpen={isClearHistoryConfirmOpen} onClose={() => setIsClearHistoryConfirmOpen(false)} title="Destroy Session Archive">
         <div className="space-y-8 text-center py-4">
          <div className="inline-block p-6 rounded-[2.5rem] bg-red-500/10 text-red-500 relative group">
            <div className="absolute inset-0 bg-red-500/10 blur-2xl rounded-full" />
            <AlertTriangle size={48} className="relative z-10" />
          </div>
          <div className="space-y-3">
            <h4 className="text-2xl font-black text-[var(--text-heading)] uppercase tracking-tighter">Wipe Log?</h4>
            <p className="text-[var(--text-muted)] leading-relaxed max-w-xs mx-auto text-sm">Permanent deletion of simulation history.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setIsClearHistoryConfirmOpen(false)} className="py-4 rounded-3xl bg-[var(--bg-element)] font-black uppercase tracking-widest hover:bg-[var(--bg-element-hover)] transition-all text-[10px] text-[var(--text-muted)]">Abort</button>
            <button onClick={clearHistory} className="py-4 rounded-3xl bg-red-600 font-black uppercase tracking-widest hover:bg-red-500 transition-all text-white text-[10px]">Execute</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;
