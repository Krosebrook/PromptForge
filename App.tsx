
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { PROMPTS_DATA } from './constants';
import { PromptItem, Message, Category, ChatSession } from './types';
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
  FileText
} from 'lucide-react';

const CATEGORIES: Category[] = [
  'Code Assistance',
  'AI Art Generation',
  'Writing & Content',
  'Data Analysis',
  'Miscellaneous'
];

const Modal: React.FC<{ isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode }> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-800">
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-800 text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-y-auto">{children}</div>
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

  // UI Navigation states
  const [view, setView] = useState<'library' | 'favorites' | 'history' | 'docs'>('library');
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [selectedContributor, setSelectedContributor] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection states
  const [selectedPrompt, setSelectedPrompt] = useState<PromptItem | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Editor/Modal states
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingPrompt, setEditingPrompt] = useState<Partial<PromptItem> | null>(null);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isClearHistoryConfirmOpen, setIsClearHistoryConfirmOpen] = useState(false);
  
  // Interaction states
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const chatRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Sync to localStorage
  useEffect(() => localStorage.setItem('custom_prompts', JSON.stringify(customPrompts)), [customPrompts]);
  useEffect(() => localStorage.setItem('favorites', JSON.stringify(Array.from(favorites))), [favorites]);
  useEffect(() => localStorage.setItem('chat_history', JSON.stringify(chatHistory)), [chatHistory]);

  const allPrompts = useMemo(() => [...PROMPTS_DATA, ...customPrompts], [customPrompts]);

  const contributorsList = useMemo(() => {
    const contributors = new Set(allPrompts.map(p => p.contributor));
    return ['All', ...Array.from(contributors)].sort();
  }, [allPrompts]);

  const filteredPrompts = useMemo(() => {
    let list = view === 'favorites' 
      ? allPrompts.filter(p => favorites.has(p.id)) 
      : allPrompts;

    return list.filter(p => {
      const matchesSearch = p.act.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            p.prompt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesContributor = selectedContributor === 'All' || p.contributor === selectedContributor;
      return matchesSearch && matchesCategory && matchesContributor;
    });
  }, [allPrompts, favorites, view, searchQuery, activeCategory, selectedContributor]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSelectPrompt = (prompt: PromptItem) => {
    setSelectedPrompt(prompt);
    setMessages([]);
    setIsChatOpen(false);
    setCurrentSession(null);
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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const startChat = () => {
    if (!selectedPrompt) return;
    setIsChatOpen(true);
    chatRef.current = geminiService.createChat(selectedPrompt.prompt);
    
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      personaId: selectedPrompt.id,
      personaName: selectedPrompt.act,
      messages: [{
        role: 'model',
        text: `Hello! I am acting as the ${selectedPrompt.act}. How can I assist you today?`,
        timestamp: Date.now()
      }],
      startTime: Date.now(),
      lastUpdateTime: Date.now()
    };
    
    setCurrentSession(newSession);
    setMessages(newSession.messages);
    setChatHistory(prev => [newSession, ...prev]);
  };

  const resumeSession = (session: ChatSession) => {
    const prompt = allPrompts.find(p => p.id === session.personaId);
    if (!prompt) return;
    setSelectedPrompt(prompt);
    setCurrentSession(session);
    setMessages(session.messages);
    setIsChatOpen(true);
    chatRef.current = geminiService.createChat(prompt.prompt);
  };

  const clearHistory = () => {
    setChatHistory([]);
    setIsClearHistoryConfirmOpen(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !chatRef.current || isLoading || !currentSession) return;

    const userMessage: Message = {
      role: 'user',
      text: inputValue,
      timestamp: Date.now()
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      const reply = await geminiService.sendMessage(chatRef.current, inputValue);
      const modelMessage: Message = {
        role: 'model',
        text: reply,
        timestamp: Date.now()
      };
      const updatedMessages = [...newMessages, modelMessage];
      setMessages(updatedMessages);
      
      // Update history
      setChatHistory(prev => prev.map(s => s.id === currentSession.id ? {
        ...s,
        messages: updatedMessages,
        lastUpdateTime: Date.now()
      } : s));
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'model',
        text: "Error: Failed to connect to Gemini API.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

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

  const getCategoryIcon = (cat: Category | 'All') => {
    switch (cat) {
      case 'Code Assistance': return <Code size={14} />;
      case 'AI Art Generation': return <Palette size={14} />;
      case 'Writing & Content': return <Layout size={14} />;
      case 'Data Analysis': return <BarChart3 size={14} />;
      default: return <Info size={14} />;
    }
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
      <div className={`relative w-full aspect-video rounded-3xl overflow-hidden bg-slate-800 border border-slate-700 shadow-xl group transition-all duration-500`}>
        <img src={previewUrl} alt="Visual Preview" className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent flex flex-col justify-end p-6">
          <div className="flex items-center gap-2 text-indigo-400 mb-1">
            <ImageIcon size={compact ? 14 : 18} />
            <span className={`${compact ? 'text-[8px]' : 'text-xs'} font-bold uppercase tracking-widest`}>Real-time Interpretation</span>
          </div>
          {!compact && <p className="text-[10px] text-slate-400 italic font-mono uppercase tracking-tighter">Visualizing instruction vector...</p>}
        </div>
      </div>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-200">
      {/* Left Sidebar - Navigation & Explorer */}
      <div className={`flex flex-col border-r border-slate-800 bg-slate-900/50 transition-all duration-300 ${selectedPrompt || selectedDoc ? 'w-80 hidden lg:flex' : 'w-full lg:w-96'}`}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Zap size={24} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">PromptForge</h1>
            </div>
            <button 
              onClick={() => openPromptEditor()}
              className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 transition-all"
              title="Add Custom Prompt"
            >
              <Plus size={20} />
            </button>
          </div>
          
          <div className="flex gap-1 p-1 bg-slate-800 rounded-xl overflow-x-auto no-scrollbar">
            {(['library', 'favorites', 'history', 'docs'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-lg capitalize transition-all whitespace-nowrap ${view === v ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
              >
                {v === 'library' && <Book size={12} />}
                {v === 'favorites' && <Star size={12} />}
                {v === 'history' && <History size={12} />}
                {v === 'docs' && <FileText size={12} />}
                {v}
              </button>
            ))}
          </div>

          {view !== 'docs' && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input 
                type="text" 
                placeholder={`Search ${view}...`} 
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-sm placeholder:text-slate-600"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}

          {(view === 'library' || view === 'favorites') && (
            <div className="space-y-3">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                <button 
                  onClick={() => setActiveCategory('All')}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${activeCategory === 'All' ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-700 text-slate-400'}`}
                >
                  All
                </button>
                {CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border whitespace-nowrap ${activeCategory === cat ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-slate-700 text-slate-400'}`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 bg-slate-800/50 p-2 rounded-xl border border-slate-700/50">
                <Users size={14} className="text-slate-500" />
                <select 
                  className="flex-1 bg-transparent text-[10px] font-bold uppercase tracking-wider text-slate-300 outline-none cursor-pointer"
                  value={selectedContributor}
                  onChange={(e) => setSelectedContributor(e.target.value)}
                >
                  {contributorsList.map(c => (
                    <option key={c} value={c} className="bg-slate-900 text-white">Contributor: {c}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2">
          {view === 'history' ? (
            <div className="space-y-2">
              <div className="flex justify-between items-center px-2 mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Active Sessions</span>
                {chatHistory.length > 0 && (
                  <button 
                    onClick={() => setIsClearHistoryConfirmOpen(true)}
                    className="text-[10px] text-red-400 hover:text-red-300 transition-colors font-bold uppercase flex items-center gap-1"
                  >
                    <Trash2 size={10} />
                    Clear All
                  </button>
                )}
              </div>
              {chatHistory.length > 0 ? (
                chatHistory.map(session => (
                  <button
                    key={session.id}
                    onClick={() => resumeSession(session)}
                    className="w-full text-left p-4 rounded-2xl border border-transparent bg-slate-800/40 hover:border-slate-700 hover:bg-slate-800/80 transition-all"
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-white text-sm">{session.personaName}</span>
                      <span className="text-[10px] text-slate-500">{new Date(session.lastUpdateTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1 italic">
                      {session.messages[session.messages.length - 1]?.text}
                    </p>
                  </button>
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
                 <button
                   key={fileName}
                   onClick={() => { setSelectedDoc(fileName); setSelectedPrompt(null); }}
                   className={`w-full text-left p-4 rounded-2xl border transition-all ${
                     selectedDoc === fileName 
                     ? 'bg-indigo-500/10 border-indigo-500/50' 
                     : 'bg-slate-800/40 border-transparent hover:border-slate-700 hover:bg-slate-800/80'
                   }`}
                 >
                   <div className="flex items-center gap-3">
                     <FileText size={16} className="text-indigo-400" />
                     <span className="text-sm font-medium text-white">{fileName}</span>
                   </div>
                 </button>
               ))}
            </div>
          ) : (
            filteredPrompts.map(p => (
              <button
                key={p.id}
                onClick={() => handleSelectPrompt(p)}
                className={`w-full text-left p-4 rounded-2xl border transition-all group relative ${
                  selectedPrompt?.id === p.id 
                  ? 'bg-indigo-500/10 border-indigo-500/50' 
                  : 'bg-slate-800/40 border-transparent hover:border-slate-700 hover:bg-slate-800/80'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-white group-hover:text-indigo-300 transition-colors pr-6">{p.act}</span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => toggleFavorite(p.id, e)}
                      className={`transition-colors ${favorites.has(p.id) ? 'text-amber-400' : 'text-slate-600 hover:text-slate-400'}`}
                    >
                      <Star size={14} fill={favorites.has(p.id) ? "currentColor" : "none"} />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-3">{p.prompt}</p>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase border border-slate-700 text-slate-500`}>
                    {p.category}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900/80 grid grid-cols-2 gap-2">
          <button onClick={() => setIsHelpOpen(true)} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all text-xs font-medium">
            <HelpCircle size={14} /> Help
          </button>
          <button onClick={() => setIsFeedbackOpen(true)} className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-all text-xs font-medium">
            <MessageSquare size={14} /> Feedback
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative overflow-hidden bg-slate-950">
        {selectedDoc ? (
          <div className="flex-1 flex flex-col p-6 md:p-12 overflow-y-auto">
            <div className="max-w-4xl w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="flex items-center gap-4 mb-8">
                  <button onClick={() => setSelectedDoc(null)} className="lg:hidden p-2 rounded-full hover:bg-slate-800 text-slate-400">
                    <ArrowLeft size={20} />
                  </button>
                  <h2 className="text-3xl font-black text-white">{selectedDoc}</h2>
               </div>
               <div className="prose prose-invert max-w-none bg-slate-900/50 border border-slate-800 p-10 rounded-[3rem] shadow-2xl">
                  <pre className="text-slate-300 whitespace-pre-wrap font-sans leading-relaxed text-lg">
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
                    <button onClick={() => setSelectedPrompt(null)} className="lg:hidden p-2 rounded-full hover:bg-slate-800">
                      <ArrowLeft size={20} />
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <h2 className="text-3xl font-extrabold text-white leading-tight">{selectedPrompt.act}</h2>
                          <button onClick={() => toggleFavorite(selectedPrompt.id)}>
                             <Star size={24} className={favorites.has(selectedPrompt.id) ? "text-amber-400 fill-amber-400" : "text-slate-700"} />
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => openPromptEditor(selectedPrompt)} className="p-2.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white border border-slate-700 transition-all">
                            <Edit size={20} />
                          </button>
                          {(selectedPrompt.isCustom || !PROMPTS_DATA.find(x => x.id === selectedPrompt.id)) && (
                            <button onClick={() => deletePrompt(selectedPrompt.id)} className="p-2.5 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 transition-all">
                              <Trash2 size={20} />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-4 mt-6 p-5 rounded-3xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                            <Users size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Creator</span>
                            <span className="text-xs text-slate-200 font-semibold">{selectedPrompt.contributor}</span>
                          </div>
                        </div>
                        <div className="h-10 w-px bg-slate-800 hidden md:block" />
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                            <Filter size={18} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mb-1">Category</span>
                            <span className="text-xs text-slate-200 font-semibold">{selectedPrompt.category}</span>
                          </div>
                        </div>
                        <div className="h-10 w-px bg-slate-800 hidden md:block" />
                        <div className="flex-1 flex flex-wrap gap-2">
                          {selectedPrompt.tags.map(tag => (
                            <span key={tag} className="px-3 py-1 rounded-xl bg-slate-800 text-slate-400 text-[10px] font-bold border border-slate-700 flex items-center gap-1.5 shadow-sm">
                              <Hash size={10} className="text-slate-600" />
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

                  <div className="p-8 rounded-[2.5rem] bg-slate-900/80 border border-slate-800 shadow-2xl relative group overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl pointer-events-none" />
                    <button 
                      onClick={() => handleCopy(selectedPrompt.prompt, selectedPrompt.id)}
                      className="absolute right-6 top-6 p-2 rounded-xl bg-slate-800 text-slate-400 opacity-0 group-hover:opacity-100 hover:text-white transition-all border border-slate-700"
                    >
                      {copiedId === selectedPrompt.id ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Copy size={18} />}
                    </button>
                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Instruction Vector</h3>
                    <p className="text-xl text-slate-300 leading-relaxed font-serif whitespace-pre-wrap selection:bg-indigo-500/30">
                      {selectedPrompt.prompt}
                    </p>
                    {selectedPrompt.description && (
                      <div className="mt-10 pt-8 border-t border-slate-800/80">
                        <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-4">Functional Spec</h4>
                        <p className="text-base text-slate-400 leading-relaxed font-light">{selectedPrompt.description}</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-20">
                    <button onClick={startChat} className="flex items-center justify-center gap-4 px-8 py-5 rounded-[2rem] bg-indigo-600 text-white font-black uppercase tracking-widest hover:bg-indigo-500 active:scale-95 transition-all shadow-xl shadow-indigo-600/30">
                      <Terminal size={22} /> Initiate Simulation
                    </button>
                    <button onClick={() => handleCopy(selectedPrompt.prompt, selectedPrompt.id)} className="flex items-center justify-center gap-4 px-8 py-5 rounded-[2rem] bg-slate-800 text-white font-black uppercase tracking-widest hover:bg-slate-700 active:scale-95 transition-all border border-slate-700">
                      <Copy size={22} /> Export Logic
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full bg-slate-900/40">
                {/* Chat Header */}
                <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-md sticky top-0 z-10">
                  <div className="flex items-center gap-4">
                    <button onClick={() => setIsChatOpen(false)} className="p-2 rounded-full hover:bg-slate-800 text-slate-400 transition-colors">
                      <ArrowLeft size={20} />
                    </button>
                    <div>
                      <h3 className="text-lg font-bold text-white leading-none">{selectedPrompt.act}</h3>
                      <span className="text-[10px] text-indigo-400 font-mono tracking-tighter uppercase">Persona Live Simulation</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active SDK</span>
                  </div>
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth no-scrollbar">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                      <div className={`max-w-[85%] md:max-w-[75%] p-6 rounded-3xl ${m.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none shadow-xl' : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700 shadow-md'}`}>
                        <p className="text-[16px] leading-relaxed whitespace-pre-wrap selection:bg-slate-200/20">{m.text}</p>
                        <span className={`text-[10px] mt-3 block opacity-40 font-bold ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
                          {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex justify-start animate-pulse">
                      <div className="bg-slate-800/50 p-6 rounded-3xl rounded-bl-none border border-slate-700/50 flex gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.2s]" />
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:-0.4s]" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-slate-950/80 backdrop-blur-xl border-t border-slate-800 sticky bottom-0">
                  <div className="max-w-4xl mx-auto flex gap-3 relative">
                    <textarea 
                      rows={1}
                      placeholder={`Interface with the ${selectedPrompt.act}...`}
                      className="flex-1 px-6 py-4 rounded-3xl bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none shadow-lg placeholder:text-slate-600"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } }}
                    />
                    <button onClick={handleSendMessage} disabled={isLoading || !inputValue.trim()} className="p-5 rounded-3xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all active:scale-90 disabled:opacity-50 shadow-lg shadow-indigo-600/20">
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-from)_0%,_transparent_70%)] from-indigo-500/5">
            <div className="max-w-md space-y-8">
              <div className="inline-block p-8 rounded-[3rem] bg-slate-900/80 border border-slate-800 shadow-2xl text-indigo-500 relative group">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-[3rem] blur-2xl group-hover:blur-3xl transition-all" />
                <Book size={72} className="relative z-10" />
              </div>
              <div className="space-y-4">
                <h2 className="text-4xl font-black text-white tracking-tighter">Forge Nexus</h2>
                <p className="text-slate-400 text-lg font-light leading-relaxed">Bridge intent with expert execution via professional instruction sets.</p>
              </div>
              <div className="pt-6 grid grid-cols-2 gap-4">
                <button onClick={() => openPromptEditor()} className="p-6 rounded-[2.5rem] bg-indigo-600/10 border border-indigo-500/20 text-left space-y-2 hover:bg-indigo-600/20 transition-all group">
                  <Plus size={24} className="text-indigo-400 group-hover:rotate-90 transition-transform" />
                  <h4 className="text-sm font-bold text-white">Create Original</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Forge custom behaviors.</p>
                </button>
                <button onClick={() => setView('docs')} className="p-6 rounded-[2.5rem] bg-slate-900/50 border border-slate-800 text-left space-y-2 hover:bg-slate-800 transition-all">
                  <FileText size={24} className="text-emerald-400" />
                  <h4 className="text-sm font-bold text-white">Documentation</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">Policy, PRD, and Tech.</p>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Editor Modal */}
      <Modal isOpen={isEditorOpen} onClose={() => setIsEditorOpen(false)} title={editingPrompt?.act ? "Refine Persona Node" : "Forge New Persona"}>
        <form onSubmit={savePrompt} className="space-y-6">
          {editingPrompt?.type === 'IMAGE' && (
            <div className="mb-2">
              <ImagePreview compact promptText={editingPrompt?.prompt || ''} />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Behavior Label</label>
              <input 
                required
                className="w-full px-5 py-4 rounded-2xl bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm transition-all"
                value={editingPrompt?.act || ''}
                onChange={e => setEditingPrompt(prev => ({ ...prev, act: e.target.value }))}
                placeholder="e.g. Code Reviewer"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Taxonomy</label>
              <select 
                className="w-full px-5 py-4 rounded-2xl bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none cursor-pointer"
                value={editingPrompt?.category}
                onChange={e => setEditingPrompt(prev => ({ ...prev, category: e.target.value as Category }))}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Modality Target</label>
            <div className="flex gap-2">
              {(['TEXT', 'STRUCTURED', 'IMAGE'] as const).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setEditingPrompt(prev => ({ ...prev, type: t }))}
                  className={`flex-1 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border transition-all ${
                    editingPrompt?.type === t ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'border-slate-700 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Instruction Matrix</label>
            <textarea 
              required
              rows={6}
              className="w-full px-5 py-4 rounded-2xl bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-mono selection:bg-indigo-500/30"
              value={editingPrompt?.prompt || ''}
              onChange={e => setEditingPrompt(prev => ({ ...prev, prompt: e.target.value }))}
              placeholder="System instructions for the model..."
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Metadata Description</label>
            <textarea 
              rows={3}
              className="w-full px-5 py-4 rounded-2xl bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
              value={editingPrompt?.description || ''}
              onChange={e => setEditingPrompt(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Extended context..."
            />
          </div>

          <div className="flex items-center gap-6 px-1">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative">
                <input 
                  type="checkbox" 
                  checked={editingPrompt?.for_devs} 
                  onChange={e => setEditingPrompt(prev => ({ ...prev, for_devs: e.target.checked }))} 
                  className="sr-only"
                />
                <div className={`w-10 h-6 rounded-full transition-colors ${editingPrompt?.for_devs ? 'bg-indigo-600' : 'bg-slate-700'}`} />
                <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${editingPrompt?.for_devs ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
              <span className="text-xs font-bold text-slate-400 group-hover:text-white transition-colors">Technical</span>
            </label>
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input 
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Tag intent..."
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      const tag = (e.target as HTMLInputElement).value.trim().replace(',', '');
                      if (tag && !editingPrompt?.tags?.includes(tag)) {
                        setEditingPrompt(prev => ({ ...prev, tags: [...(prev?.tags || []), tag] }));
                        (e.target as HTMLInputElement).value = '';
                      }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {editingPrompt?.tags && editingPrompt.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {editingPrompt.tags.map(t => (
                <span key={t} className="px-3 py-1.5 rounded-xl bg-indigo-500/10 text-indigo-400 text-[10px] font-black flex items-center gap-2 border border-indigo-500/20 shadow-sm animate-in zoom-in-90">
                  <Hash size={10} />
                  {t}
                  <button type="button" onClick={() => setEditingPrompt(prev => ({ ...prev, tags: prev?.tags?.filter(tag => tag !== t) }))} className="hover:text-red-400 transition-colors p-0.5 rounded-full hover:bg-red-500/10">
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <button type="submit" className="w-full py-5 rounded-[2rem] bg-indigo-600 text-white font-black uppercase tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/30">
            Commit Vector
          </button>
        </form>
      </Modal>

      {/* Clear History Confirmation Modal */}
      <Modal isOpen={isClearHistoryConfirmOpen} onClose={() => setIsClearHistoryConfirmOpen(false)} title="Destroy Session Archive">
        <div className="space-y-8 text-center py-4">
          <div className="inline-block p-6 rounded-[2.5rem] bg-red-500/10 text-red-500 relative group">
            <div className="absolute inset-0 bg-red-500/10 blur-2xl rounded-full" />
            <AlertTriangle size={48} className="relative z-10" />
          </div>
          <div className="space-y-3">
            <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Wipe Log?</h4>
            <p className="text-slate-400 leading-relaxed max-w-xs mx-auto text-sm">Permanent deletion of simulation history. Instructions persist.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={() => setIsClearHistoryConfirmOpen(false)} className="py-4 rounded-3xl bg-slate-800 font-black uppercase tracking-widest hover:bg-slate-700 transition-all text-[10px]">Abort</button>
            <button onClick={clearHistory} className="py-4 rounded-3xl bg-red-600 font-black uppercase tracking-widest hover:bg-red-500 transition-all text-white text-[10px]">Execute</button>
          </div>
        </div>
      </Modal>

      {/* Help Modal */}
      <Modal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} title="Operational Tutorial">
        <div className="space-y-4">
          {[
            { icon: <Book className="text-indigo-400" />, title: "Library", desc: "Select behaviors for specialized persona emulation." },
            { icon: <Plus className="text-emerald-400" />, title: "The Forge", desc: "Design instruction sets for custom agents." },
            { icon: <Palette className="text-amber-400" />, title: "Vis-Preview", desc: "Live interpretative rendering of intent vectors." },
            { icon: <FileText className="text-purple-400" />, title: "Documentation", desc: "Consult governance, API, and architectural specs." },
            { icon: <Terminal className="text-indigo-400" />, title: "Sandbox", desc: "Active interface with the Gemini 3 Flash core." }
          ].map((item, i) => (
            <div key={i} className="flex gap-5 p-4 rounded-3xl bg-slate-800/40 border border-slate-700/30">
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">{item.icon}</div>
              <div className="space-y-1">
                <h4 className="font-black text-sm text-white uppercase tracking-wider">{item.title}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
          <button onClick={() => setIsHelpOpen(false)} className="w-full mt-4 py-4 rounded-3xl bg-indigo-600 text-white font-black uppercase tracking-widest hover:bg-indigo-500 transition-all text-xs">Acknowledge</button>
        </div>
      </Modal>

      {/* Feedback Modal */}
      <Modal isOpen={isFeedbackOpen} onClose={() => setIsFeedbackOpen(false)} title="Transmit Intel">
        {feedbackSubmitted ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in zoom-in-95">
            <div className="p-6 rounded-[2.5rem] bg-emerald-500/10 text-emerald-400 shadow-xl shadow-emerald-500/10"><CheckCircle2 size={56} /></div>
            <div className="text-center">
              <h4 className="text-2xl font-black text-white">Received.</h4>
              <p className="text-slate-500 text-sm font-medium">Feedback integrated into forge telemetry.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setFeedbackSubmitted(true); setTimeout(() => { setIsFeedbackOpen(false); setFeedbackSubmitted(false); }, 2000); }} className="space-y-5">
            <p className="text-xs text-slate-500 leading-relaxed font-medium">Identify anomalies or request module upgrades.</p>
            <textarea required rows={5} className="w-full px-5 py-4 rounded-2xl bg-slate-800 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-medium placeholder:text-slate-600" placeholder="Report findings..." />
            <button type="submit" className="w-full py-4 rounded-[2rem] bg-indigo-600 text-white font-black uppercase tracking-widest hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 shadow-lg">
              <Send size={20} /> Transmit
            </button>
          </form>
        )}
      </Modal>
    </div>
  );
};

export default App;
