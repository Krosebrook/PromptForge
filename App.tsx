
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PROMPTS_DATA, THEMES, TEMPLATE_PROMPTS as INITIAL_TEMPLATES, DEFAULT_SETTINGS, ART_SUGGESTIONS } from './constants';
import { PromptItem, Message, Category, ChatSession, SimulationSettings, PersonaVersion } from './types';
import { geminiService } from './services/geminiService';
import { DOCUMENTATION_CONTENT } from './documentation';
import { Modal } from './Modal';
import { ChatStreamView } from './ChatStreamView';
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
  FileDown,
  Upload,
  RefreshCw,
  Layers,
  ChevronDown,
  Undo2,
  Redo2,
  Share2,
  Clock,
  Save,
  ArrowUpDown,
  Calendar,
  Wand2,
  ChevronRight
} from 'lucide-react';

const CATEGORIES: Category[] = [
  'Code Assistance',
  'AI Art Generation',
  'Writing & Content',
  'Data Analysis',
  'Miscellaneous'
];

const TYPES: PromptItem['type'][] = ['TEXT', 'STRUCTURED', 'IMAGE'];

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
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [activeType, setActiveType] = useState<PromptItem['type'] | 'All'>('All');
  const [selectedContributor, setSelectedContributor] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filtering & Sorting State
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState<'name' | 'recent'>('name');
  
  // History UI States
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historySortOrder, setHistorySortOrder] = useState<'recent' | 'name' | 'model'>('recent');

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
  const [settingsTab, setSettingsTab] = useState<'model' | 'params' | 'theme'>('model');
  const [isClearHistoryConfirmOpen, setIsClearHistoryConfirmOpen] = useState(false);
  
  // Interaction states
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Undo/Redo Logic
  const [editorHistory, setEditorHistory] = useState<Partial<PromptItem>[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

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
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesType = activeType === 'All' || p.type === activeType;
      const matchesContributor = selectedContributor === 'All' || p.contributor === selectedContributor;
      const matchesTagsFilter = activeTags.length === 0 || activeTags.every(tag => p.tags.includes(tag));
      return matchesCategory && matchesType && matchesContributor && matchesTagsFilter;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return list.map(p => {
        let score = 0;
        if (p.act.toLowerCase() === q) score += 100; // Exact Name Match
        else if (p.act.toLowerCase().includes(q)) score += 50; // Partial Name Match
        
        const tagMatchCount = p.tags.filter(t => t.toLowerCase() === q).length;
        score += tagMatchCount * 30; // Exact Tag Match
        
        if (p.prompt.toLowerCase().includes(q)) score += 10; // Prompt Content Match
        
        return { p, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.p);
    }

    return list.sort((a, b) => {
      if (sortOrder === 'name') return a.act.localeCompare(b.act);
      return 0;
    });
  }, [allPrompts, favorites, view, searchQuery, activeCategory, activeType, selectedContributor, activeTags, sortOrder]);

  const filteredHistory = useMemo(() => {
    let list = [...chatHistory];
    if (historySearchQuery.trim()) {
      const q = historySearchQuery.toLowerCase();
      list = list.filter(s => 
        s.personaName.toLowerCase().includes(q) || 
        s.messages.some(m => m.text.toLowerCase().includes(q))
      );
    }

    return list.sort((a, b) => {
      if (historySortOrder === 'recent') return b.lastUpdateTime - a.lastUpdateTime;
      if (historySortOrder === 'name') return a.personaName.localeCompare(b.personaName);
      if (historySortOrder === 'model') return (a.modelId || '').localeCompare(b.modelId || '');
      return 0;
    });
  }, [chatHistory, historySearchQuery, historySortOrder]);

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
    setEditorHistory([initialState]);
    setHistoryIndex(0);
    setIsEditorOpen(true);
  };

  const updateEditingState = (update: Partial<PromptItem>) => {
    setEditingPrompt(prev => {
      const next = { ...prev, ...update } as PromptItem;
      const newHistory = editorHistory.slice(0, historyIndex + 1);
      newHistory.push(next);
      setEditorHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      return next;
    });
  };

  const appendToPrompt = (text: string) => {
    const current = editingPrompt?.prompt || '';
    const separator = current.length > 0 && !current.endsWith('\n') && !current.endsWith(' ') ? ', ' : '';
    updateEditingState({ prompt: `${current}${separator}${text}` });
  };

  const handleUndo = () => {
    if (historyIndex > 0) {
      const nextIndex = historyIndex - 1;
      setHistoryIndex(nextIndex);
      setEditingPrompt(editorHistory[nextIndex]);
    }
  };

  const handleRedo = () => {
    if (historyIndex < editorHistory.length - 1) {
      const nextIndex = historyIndex + 1;
      setHistoryIndex(nextIndex);
      setEditingPrompt(editorHistory[nextIndex]);
    }
  };

  const savePrompt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPrompt) return;
    const p = { ...editingPrompt } as PromptItem;
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

  const saveAsTemplate = () => {
    if (!editingPrompt) return;
    const newTemplate = {
      name: editingPrompt.act || 'New Template',
      act: editingPrompt.act,
      category: editingPrompt.category,
      tags: editingPrompt.tags,
      description: editingPrompt.description,
      prompt: editingPrompt.prompt
    };
    setCustomTemplates(prev => [...prev, newTemplate]);
    alert('Persona saved as a template successfully.');
  };

  const revertToVersion = (version: PersonaVersion) => {
    if (!editingPrompt) return;
    updateEditingState({ prompt: version.prompt, act: version.act, description: version.description });
  };

  const exportPromptAsJson = (item: Partial<PromptItem>) => {
    try {
        const jsonString = JSON.stringify(item, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        // Sanitize filename
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

  const handleShare = async (item: PromptItem) => {
    const shareData = { title: `PromptForge: ${item.act}`, text: item.description || item.prompt.slice(0, 100), url: window.location.href };
    if (navigator.share) await navigator.share(shareData);
    else { navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`); alert('Share info copied!'); }
  };

  const applyTemplate = (template: any) => {
    updateEditingState({ act: template.act, category: template.category, prompt: template.prompt, description: template.description, tags: template.tags });
  };

  const toggleCompareMode = () => setIsCompareMode(!isCompareMode);
  const openSettings = (target: 'primary' | 'secondary') => { setSettingsTarget(target); setIsSettingsOpen(true); };
  const activeSettingsToEdit = settingsTarget === 'primary' ? settings : secondarySettings;
  const setSettingsToEdit = settingsTarget === 'primary' ? setSettings : setSecondarySettings;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--bg-app)] text-[var(--text-body)] transition-colors duration-300">
      {/* Sidebar */}
      <div className={`flex flex-col border-r border-[var(--border)] bg-[var(--bg-panel)]/50 transition-all duration-300 ${selectedPrompt || selectedDoc ? 'w-80 hidden lg:flex' : 'w-full lg:w-96'}`}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--accent)]/20 text-[var(--accent)]"><Zap size={24} /></div>
              <h1 className="text-xl font-bold text-[var(--text-heading)]">PromptForge</h1>
            </div>
            <div className="flex gap-2">
              <input type="file" ref={fileInputRef} onChange={handleImportPersona} className="hidden" accept=".json" />
              <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-all"><Upload size={20} /></button>
              <button onClick={() => openPromptEditor()} className="p-2 rounded-xl bg-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)]/30 transition-all"><Plus size={20} /></button>
            </div>
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

          {(view === 'library' || view === 'favorites') && (
            <div className="space-y-4 overflow-y-auto no-scrollbar max-h-[60vh]">
              <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
                <input type="text" placeholder="Search by name, tag, or content..." className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all text-sm text-[var(--text-body)]" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2"><Filter size={10} /> Category</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button onClick={() => setActiveCategory('All')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border ${activeCategory === 'All' ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>All</button>
                  {CATEGORIES.map(cat => <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border whitespace-nowrap ${activeCategory === cat ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>{cat}</button>)}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2"><Layers size={10} /> Persona Type</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button onClick={() => setActiveType('All')} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border ${activeType === 'All' ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>All</button>
                  {TYPES.map(t => <button key={t} onClick={() => setActiveType(t)} className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-all border whitespace-nowrap ${activeType === t ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>{t}</button>)}
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-[var(--border)]/50 mt-2">
                 <div className="flex items-center gap-2 bg-[var(--bg-element)]/50 p-2 rounded-xl border border-[var(--border)]/50 flex-1">
                  <Users size={14} className="text-[var(--text-muted)]" />
                  <select className="flex-1 bg-transparent text-[10px] font-bold uppercase text-[var(--text-muted)] outline-none cursor-pointer" value={selectedContributor} onChange={(e) => setSelectedContributor(e.target.value)}>
                    {contributorsList.map(c => <option key={c} value={c} className="bg-[var(--bg-panel)]">By: {c}</option>)}
                  </select>
                </div>
                <button onClick={() => setSortOrder(prev => prev === 'name' ? 'recent' : 'name')} className="p-2 rounded-xl bg-[var(--bg-element)] border border-[var(--border)] text-[var(--text-muted)] transition-colors"><SortAsc size={14} /></button>
              </div>
            </div>
          )}

          {view === 'history' && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                <input type="text" placeholder="Search history..." className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-element)] border border-[var(--border)] text-sm" value={historySearchQuery} onChange={(e) => setHistorySearchQuery(e.target.value)} />
              </div>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                <button onClick={() => setHistorySortOrder('recent')} className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase border whitespace-nowrap ${historySortOrder === 'recent' ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>Recent</button>
                <button onClick={() => setHistorySortOrder('name')} className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase border whitespace-nowrap ${historySortOrder === 'name' ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>Persona</button>
                <button onClick={() => setHistorySortOrder('model')} className={`px-3 py-1 rounded-full text-[9px] font-bold uppercase border whitespace-nowrap ${historySortOrder === 'model' ? 'bg-[var(--accent)] text-white border-[var(--accent)]' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>Model</button>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2">
          {view === 'history' ? (
             filteredHistory.map(session => (
              <div key={session.id} className="group relative">
                <button onClick={() => resumeSession(session)} className="w-full text-left p-4 rounded-2xl border border-transparent bg-[var(--bg-element)]/40 hover:border-[var(--border)] hover:bg-[var(--bg-element)] transition-all pr-16">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-bold text-[var(--text-heading)] text-sm line-clamp-1">{session.personaName}</span>
                  </div>
                  <div className="flex items-center gap-2 mb-1.5">
                     <span className="text-[10px] font-mono text-[var(--text-muted)]">{new Date(session.lastUpdateTime).toLocaleDateString()}</span>
                     <span className="text-[10px] font-mono text-[var(--accent)]">{session.modelId}</span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] line-clamp-1 italic">{session.messages[session.messages.length - 1]?.text}</p>
                </button>
                <div className="absolute right-2 top-2 bottom-2 flex flex-col justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => downloadSession(e, session)} className="p-1.5 rounded-lg bg-[var(--bg-element-hover)] text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-white transition-colors"><FileDown size={14} /></button>
                  <button onClick={(e) => deleteSession(e, session.id)} className="p-1.5 rounded-lg bg-[var(--bg-element-hover)] text-[var(--text-muted)] hover:bg-red-600 hover:text-white transition-colors"><Trash2 size={14} /></button>
                </div>
              </div>
            ))
          ) : view === 'docs' ? (
            Object.keys(DOCUMENTATION_CONTENT).map(fileName => (
              <button key={fileName} onClick={() => { setSelectedDoc(fileName); setSelectedPrompt(null); }} className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedDoc === fileName ? 'bg-[var(--accent)]/10 border-[var(--accent)]/50' : 'bg-[var(--bg-element)]/40 border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-element)]'}`}>
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-[var(--accent)]" />
                  <span className="text-sm font-medium text-[var(--text-heading)]">{fileName}</span>
                </div>
              </button>
            ))
          ) : (
            filteredPrompts.map(p => (
              <button key={p.id} onClick={() => handleSelectPrompt(p)} className={`w-full text-left p-4 rounded-2xl border transition-all group relative ${selectedPrompt?.id === p.id ? 'bg-[var(--accent)]/10 border-[var(--accent)]/50' : 'bg-[var(--bg-element)]/40 border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-element)]'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-[var(--text-heading)] group-hover:text-[var(--accent)] transition-colors pr-6">{p.act}</span>
                  <button onClick={(e) => toggleFavorite(p.id, e)} className={`transition-colors ${favorites.has(p.id) ? 'text-amber-400' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'}`}><Star size={14} fill={favorites.has(p.id) ? "currentColor" : "none"} /></button>
                </div>
                <p className="text-xs text-[var(--text-muted)] line-clamp-2 mb-3">{p.description || p.prompt}</p>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border border-[var(--border)] text-[var(--text-muted)]">{p.category}</span>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border border-[var(--border)] text-[var(--accent)]">{p.type}</span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-panel)]/80 flex items-center gap-2">
          <button onClick={() => setIsHelpOpen(true)} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--text-body)] transition-all text-xs font-medium"><HelpCircle size={14} /> Help</button>
          <button onClick={() => openSettings('primary')} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--text-body)] transition-all text-xs font-medium"><Settings size={14} /></button>
        </div>
      </div>

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

      {/* Editor Modal */}
      <Modal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} title={editingPrompt?.act ? "Refine Persona Node" : "Forge New Persona"}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
               <button type="button" onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--accent)] disabled:opacity-30 transition-all"><Undo2 size={18} /></button>
               <button type="button" onClick={handleRedo} disabled={historyIndex >= editorHistory.length - 1} className="p-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--accent)] disabled:opacity-30 transition-all"><Redo2 size={18} /></button>
            </div>
          </div>

          <div className="mb-6 p-4 rounded-2xl bg-[var(--bg-element)]/50 border border-[var(--border)]">
            <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3 block">Persona Templates</label>
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {allTemplates.map((t, i) => (
                <button key={i} type="button" onClick={() => applyTemplate(t)} className="px-3 py-2 rounded-xl bg-[var(--bg-panel)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all text-xs font-medium whitespace-nowrap text-[var(--text-body)]">
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={savePrompt} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Behavior Label</label>
                <input required className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm transition-all text-[var(--text-body)]" value={editingPrompt?.act || ''} onChange={e => updateEditingState({ act: e.target.value })} placeholder="e.g. Code Reviewer" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Taxonomy</label>
                <select className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm appearance-none cursor-pointer text-[var(--text-body)]" value={editingPrompt?.category} onChange={e => updateEditingState({ category: e.target.value as Category })}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Description</label>
              <textarea rows={2} className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-xs placeholder:text-[var(--text-muted)] text-[var(--text-body)]" value={editingPrompt?.description || ''} onChange={e => updateEditingState({ description: e.target.value })} placeholder="Context, background story..." />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Instruction Matrix</label>
              <textarea required rows={6} className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-mono text-[var(--text-body)]" value={editingPrompt?.prompt || ''} onChange={e => updateEditingState({ prompt: e.target.value })} placeholder="System instructions..." />
            </div>

            {editingPrompt?.category === 'AI Art Generation' && (
              <div className="p-4 rounded-2xl bg-[var(--bg-element)]/30 border border-[var(--border)] space-y-4">
                <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2"><Wand2 size={12} /> Art Direction Helper</h4>
                
                <div className="space-y-2">
                   <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Artistic Styles</span>
                   <div className="flex flex-wrap gap-1.5">
                     {ART_SUGGESTIONS.styles.map(s => (
                       <button key={s} type="button" onClick={() => appendToPrompt(s)} className="px-2 py-1 rounded-md bg-[var(--bg-panel)] border border-[var(--border)] text-[10px] font-medium text-[var(--text-body)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">+ {s}</button>
                     ))}
                   </div>
                </div>

                <div className="space-y-2">
                   <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Lighting & Atmosphere</span>
                   <div className="flex flex-wrap gap-1.5">
                     {ART_SUGGESTIONS.lighting.map(s => (
                       <button key={s} type="button" onClick={() => appendToPrompt(s)} className="px-2 py-1 rounded-md bg-[var(--bg-panel)] border border-[var(--border)] text-[10px] font-medium text-[var(--text-body)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">+ {s}</button>
                     ))}
                   </div>
                </div>

                <div className="space-y-2">
                   <span className="text-[9px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Technical Parameters</span>
                   <div className="flex flex-wrap gap-1.5">
                     {ART_SUGGESTIONS.params.map(s => (
                       <button key={s} type="button" onClick={() => appendToPrompt(s)} className="px-2 py-1 rounded-md bg-[var(--bg-panel)] border border-[var(--border)] text-[10px] font-medium text-[var(--text-body)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-all">{s}</button>
                     ))}
                   </div>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Tags (Autocomplete Active)</label>
              <div className="relative">
                <input className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-xs text-[var(--text-body)]" value={editingPrompt?.tags?.join(', ') || ''} onChange={e => updateEditingState({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })} placeholder="e.g. coding, python, web" list="all-tags-list" />
                <datalist id="all-tags-list">{allTags.map(tag => <option key={tag} value={tag} />)}</datalist>
              </div>
            </div>

            {/* Version Management Component */}
            {editingPrompt?.versions && editingPrompt.versions.length > 0 && (
              <div className="p-4 rounded-2xl bg-[var(--bg-element)]/50 border border-[var(--border)]">
                <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-3 flex items-center gap-2"><Clock size={12} /> Revision History</h4>
                <div className="space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                  {[...editingPrompt.versions].reverse().map((v, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded-xl bg-[var(--bg-panel)] border border-[var(--border)] hover:border-[var(--accent)] transition-all group">
                      <div className="flex flex-col min-w-0 flex-1 mr-3">
                        <div className="flex items-center gap-2">
                           <span className="text-[9px] font-mono text-[var(--text-muted)]">{new Date(v.timestamp).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                        <span className="text-[10px] font-bold truncate text-[var(--text-body)]">{v.act}</span>
                        {v.description && <span className="text-[9px] text-[var(--text-muted)] truncate">{v.description}</span>}
                      </div>
                      <button type="button" onClick={() => revertToVersion(v)} className="px-2 py-1 rounded-lg bg-[var(--bg-element)] text-[var(--text-muted)] text-[9px] font-bold uppercase tracking-wider group-hover:bg-[var(--accent)] group-hover:text-white transition-all">Revert</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <div className="flex gap-3">
                <button type="button" onClick={saveAsTemplate} className="flex-1 py-4 rounded-[1.5rem] bg-[var(--bg-element)] text-[var(--text-heading)] font-black uppercase tracking-wider hover:bg-[var(--bg-element-hover)] transition-all border border-[var(--border)] flex items-center justify-center gap-2 text-[10px]"><Save size={16} /> Save as Template</button>
                <button type="button" onClick={() => exportPromptAsJson(editingPrompt as PromptItem)} className="flex-1 py-4 rounded-[1.5rem] bg-[var(--bg-element)] text-[var(--text-heading)] font-black uppercase tracking-wider hover:bg-[var(--bg-element-hover)] transition-all border border-[var(--border)] flex items-center justify-center gap-2 text-[10px]"><Download size={16} /> Export JSON</button>
              </div>
              <button type="submit" className="w-full py-5 rounded-[2rem] bg-[var(--accent)] text-white font-black uppercase tracking-[0.2em] hover:bg-[var(--accent-hover)] transition-all shadow-xl shadow-[var(--accent)]/30">Commit Persona Node</button>
            </div>
          </form>
        </div>
      </Modal>

      {/* Enhanced Settings Modal */}
      <Modal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} title={`Simulation Config (${settingsTarget === 'primary' ? 'A' : 'B'})`}>
        <div className="flex items-center gap-1 p-1 mb-6 bg-[var(--bg-element)]/50 rounded-xl border border-[var(--border)] shrink-0">
            <button onClick={() => setSettingsTab('model')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${settingsTab === 'model' ? 'bg-[var(--bg-panel)] text-[var(--text-heading)] shadow-sm' : 'text-[var(--text-muted)]'}`}><BrainCircuit size={14} /> Model</button>
            <button onClick={() => setSettingsTab('params')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${settingsTab === 'params' ? 'bg-[var(--bg-panel)] text-[var(--text-heading)] shadow-sm' : 'text-[var(--text-muted)]'}`}><Sliders size={14} /> Params</button>
            <button onClick={() => setSettingsTab('theme')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all ${settingsTab === 'theme' ? 'bg-[var(--bg-panel)] text-[var(--text-heading)] shadow-sm' : 'text-[var(--text-muted)]'}`}><Palette size={14} /> Theme</button>
        </div>

        <div className="space-y-6 min-h-[350px]">
            {settingsTab === 'model' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="p-4 rounded-2xl bg-[var(--bg-element)]/30 border border-[var(--border)] text-xs text-[var(--text-muted)] leading-relaxed">Choose the primary reasoning engine. <strong>Gemini 3 Pro</strong> is recommended for high-stakes logic and complex engineering tasks.</div>
                    
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 flex items-center gap-2"><Cpu size={10}/> Select Engine</label>
                      <div className="relative">
                        <select 
                          className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-bold appearance-none cursor-pointer text-[var(--text-body)] transition-all hover:border-[var(--accent)]"
                          value={activeSettingsToEdit.model}
                          onChange={(e) => setSettingsToEdit(prev => ({ ...prev, model: e.target.value }))}
                        >
                          <option value="gemini-3-flash-preview">Gemini 3 Flash (High Concurrency)</option>
                          <option value="gemini-3-pro-preview">Gemini 3 Pro (SOTA Reasoning)</option>
                        </select>
                        <ChevronDown size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] space-y-3">
                       <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-heading)]">
                          <Info size={14} className="text-[var(--accent)]" />
                          {activeSettingsToEdit.model.includes('pro') ? 'Gemini 3 Pro Capabilities' : 'Gemini 3 Flash Capabilities'}
                       </div>
                       <ul className="text-[10px] text-[var(--text-muted)] space-y-1 ml-5 list-disc leading-relaxed">
                          {activeSettingsToEdit.model.includes('pro') ? (
                            <>
                              <li>Advanced multi-step reasoning capabilities.</li>
                              <li>Superior instruction following for complex personas.</li>
                              <li>Highest reasoning budget (32k thinking tokens).</li>
                            </>
                          ) : (
                            <>
                              <li>Sub-second response latency for interactive chat.</li>
                              <li>Optimized for rapid iterative persona development.</li>
                              <li>High throughput for standard text tasks.</li>
                            </>
                          )}
                       </ul>
                    </div>
                </div>
            )}

            {settingsTab === 'params' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold flex items-center gap-2" title="Controls randomness: lower is more deterministic, higher is more creative."><RefreshCw size={14} className="text-blue-400" /> Temperature</label>
                          <span className="text-xs font-mono font-bold px-2 py-1 bg-[var(--bg-element)] rounded-lg">{activeSettingsToEdit.temperature.toFixed(1)}</span>
                        </div>
                        <input type="range" min="0" max="2" step="0.1" value={activeSettingsToEdit.temperature} onChange={(e) => setSettingsToEdit(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))} className="w-full h-1.5 bg-[var(--bg-element)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]" />
                    </div>

                    <div className="space-y-3 pt-4 border-t border-[var(--border)]/50">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold flex items-center gap-2" title="Nucleus sampling: filters tokens whose cumulative probability exceeds P."><Gauge size={14} className="text-emerald-400" /> Top P</label>
                          <span className="text-xs font-mono font-bold px-2 py-1 bg-[var(--bg-element)] rounded-lg">{activeSettingsToEdit.topP.toFixed(2)}</span>
                        </div>
                        <input type="range" min="0" max="1" step="0.01" value={activeSettingsToEdit.topP} onChange={(e) => setSettingsToEdit(prev => ({ ...prev, topP: parseFloat(e.target.value) }))} className="w-full h-1.5 bg-[var(--bg-element)] rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                    </div>

                    <div className="space-y-3 pt-4 border-t border-[var(--border)]/50">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold flex items-center gap-2" title="Limits selection to the top K most likely tokens."><Hash size={14} className="text-orange-400" /> Top K</label>
                          <span className="text-xs font-mono font-bold px-2 py-1 bg-[var(--bg-element)] rounded-lg">{activeSettingsToEdit.topK}</span>
                        </div>
                        <input type="range" min="1" max="100" step="1" value={activeSettingsToEdit.topK} onChange={(e) => setSettingsToEdit(prev => ({ ...prev, topK: parseInt(e.target.value) }))} className="w-full h-1.5 bg-[var(--bg-element)] rounded-lg appearance-none cursor-pointer accent-orange-500" />
                    </div>

                    <div className="space-y-3 pt-4 border-t border-[var(--border)]/50">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold flex items-center gap-2" title="The number of tokens the model uses to 'think' internally before providing a response."><BrainCircuit size={14} className="text-purple-400" /> Thinking Budget</label>
                          <span className="text-xs font-mono font-bold px-2 py-1 bg-[var(--bg-element)] rounded-lg">{activeSettingsToEdit.thinkingBudget}</span>
                        </div>
                        <input 
                          type="range" 
                          min="0" 
                          max={activeSettingsToEdit.model.includes('pro') ? 32768 : 24576} 
                          step="128" 
                          value={activeSettingsToEdit.thinkingBudget} 
                          onChange={(e) => setSettingsToEdit(prev => ({ ...prev, thinkingBudget: parseInt(e.target.value) }))} 
                          className="w-full h-1.5 bg-[var(--bg-element)] rounded-lg appearance-none cursor-pointer accent-purple-500" 
                        />
                        <div className="flex justify-between text-[10px] text-[var(--text-muted)] italic">
                          <span>Concise Reasoning</span>
                          <span>Deep Chain-of-Thought</span>
                        </div>
                    </div>
                </div>
            )}

            {settingsTab === 'theme' && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="grid grid-cols-1 gap-3">
                    {THEMES.map(theme => (
                        <button key={theme.id} onClick={() => setCurrentThemeId(theme.id)} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${currentThemeId === theme.id ? 'bg-[var(--accent)]/10 border-[var(--accent)]' : 'bg-[var(--bg-element)] border-[var(--border)]'}`}>
                            <div className="w-8 h-8 rounded-lg shadow-sm border border-[var(--border)]" style={{ backgroundColor: theme.colors['--bg-panel'] }} />
                            <div className="flex-1 text-left"><span className="text-sm font-bold block">{theme.name}</span></div>
                            {currentThemeId === theme.id && <CheckCircle2 size={18} className="text-[var(--accent)]" />}
                        </button>
                    ))}
                 </div>
              </div>
            )}
        </div>
        <button onClick={() => setIsSettingsOpen(false)} className="w-full py-4 mt-6 rounded-xl bg-[var(--accent)] text-white font-bold shadow-lg shadow-[var(--accent)]/20 hover:bg-[var(--accent-hover)] transition-all">Apply Configuration</button>
      </Modal>

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
