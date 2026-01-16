import React, { useState, useMemo } from 'react';
import { 
  Search, Book, Star, History, FileText, Filter, Layers, Users, SortAsc, 
  ArrowUpDown, Calendar, Cpu, X, Eraser, Zap, Upload, Archive, Plus,
  FileDown, Trash2, Settings, HelpCircle, Hash, User
} from 'lucide-react';
import { PromptItem, Category, ChatSession } from './types';
import { CATEGORIES, TYPES } from './constants';
import { DOCUMENTATION_CONTENT } from './documentation';

interface SidebarProps {
  // Data
  allPrompts: PromptItem[];
  chatHistory: ChatSession[];
  favorites: Set<string>;
  
  // Navigation State
  currentView: 'library' | 'favorites' | 'history' | 'docs';
  onViewChange: (view: 'library' | 'favorites' | 'history' | 'docs') => void;
  
  // Selection
  selectedPromptId?: string;
  selectedDocId?: string | null;
  onSelectPrompt: (prompt: PromptItem) => void;
  onSelectDoc: (docId: string) => void;
  onResumeSession: (session: ChatSession) => void;

  // Actions
  onToggleFavorite: (id: string, e?: React.MouseEvent) => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  onDownloadSession: (e: React.MouseEvent, session: ChatSession) => void;
  onImportPersona: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportData: () => void;
  onNewPersona: () => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const Sidebar: React.FC<SidebarProps> = ({
  allPrompts,
  chatHistory,
  favorites,
  currentView,
  onViewChange,
  selectedPromptId,
  selectedDocId,
  onSelectPrompt,
  onSelectDoc,
  onResumeSession,
  onToggleFavorite,
  onDeleteSession,
  onDownloadSession,
  onImportPersona,
  onExportData,
  onNewPersona,
  onOpenSettings,
  onOpenHelp,
  fileInputRef
}) => {
  // --- Internal Filtering State ---
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [activeType, setActiveType] = useState<PromptItem['type'] | 'All'>('All');
  const [selectedContributor, setSelectedContributor] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'name' | 'recent'>('name');

  // History specific state
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historySortOrder, setHistorySortOrder] = useState<'recent' | 'name' | 'model'>('recent');
  const [historyModelFilter, setHistoryModelFilter] = useState<string>('All');

  // --- Derived Data ---
  
  const contributorsList = useMemo(() => {
    const contributors = new Set(allPrompts.map(p => p.contributor));
    return ['All', ...Array.from(contributors)].sort();
  }, [allPrompts]);

  const historyModels = useMemo(() => {
    const models = new Set(chatHistory.filter(s => s.modelId).map(s => s.modelId!));
    return ['All', ...Array.from(models)].sort();
  }, [chatHistory]);

  const filteredPrompts = useMemo(() => {
    let list = currentView === 'favorites' 
      ? allPrompts.filter(p => favorites.has(p.id)) 
      : allPrompts;

    list = list.filter(p => {
      const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
      const matchesType = activeType === 'All' || p.type === activeType;
      const matchesContributor = selectedContributor === 'All' || p.contributor === selectedContributor;
      return matchesCategory && matchesType && matchesContributor;
    });

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return list.map(p => {
        let score = 0;
        if (p.act.toLowerCase() === q) score += 100;
        else if (p.act.toLowerCase().includes(q)) score += 50;
        
        const tagMatchCount = p.tags.filter(t => t.toLowerCase() === q).length;
        score += tagMatchCount * 30;
        
        if (p.prompt.toLowerCase().includes(q)) score += 10;
        
        return { p, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(item => item.p);
    }

    return list.sort((a, b) => {
      if (sortOrder === 'name') return a.act.localeCompare(b.act);
      return 0; // Default to natural order (ID based or as loaded)
    });
  }, [allPrompts, favorites, currentView, searchQuery, activeCategory, activeType, selectedContributor, sortOrder]);

  const filteredHistory = useMemo(() => {
    let list = [...chatHistory];

    if (historySearchQuery.trim()) {
      const q = historySearchQuery.toLowerCase();
      list = list.filter(s => 
        s.personaName.toLowerCase().includes(q) || 
        s.messages.some(m => m.text.toLowerCase().includes(q))
      );
    }

    if (historyModelFilter !== 'All') {
      list = list.filter(s => s.modelId === historyModelFilter);
    }

    return list.sort((a, b) => {
      if (historySortOrder === 'recent') return b.lastUpdateTime - a.lastUpdateTime;
      if (historySortOrder === 'name') return a.personaName.localeCompare(b.personaName);
      if (historySortOrder === 'model') return (a.modelId || '').localeCompare(b.modelId || '');
      return 0;
    });
  }, [chatHistory, historySearchQuery, historySortOrder, historyModelFilter]);

  const resetHistoryFilters = () => {
    setHistorySearchQuery('');
    setHistoryModelFilter('All');
    setHistorySortOrder('recent');
  };

  return (
    <div className={`flex flex-col border-r border-[var(--border)] bg-[var(--bg-panel)]/50 transition-all duration-300 ${selectedPromptId || selectedDocId ? 'w-80 hidden lg:flex' : 'w-full lg:w-96'}`}>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--accent)]/20 text-[var(--accent)]"><Zap size={24} /></div>
              <h1 className="text-xl font-bold text-[var(--text-heading)]">PromptForge</h1>
            </div>
            <div className="flex gap-2">
              <input type="file" ref={fileInputRef} onChange={onImportPersona} className="hidden" accept=".json" />
              <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-all" title="Import JSON Persona"><Upload size={20} /></button>
              <button onClick={onExportData} className="p-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-all" title="Export Full Backup (JSON)"><Archive size={20} /></button>
              <button onClick={onNewPersona} className="p-2 rounded-xl bg-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)]/30 transition-all" title="Forge New Persona"><Plus size={20} /></button>
            </div>
          </div>
          
          <div className="flex gap-1 p-1 bg-[var(--bg-element)] rounded-xl overflow-x-auto no-scrollbar">
            {(['library', 'favorites', 'history', 'docs'] as const).map(v => (
              <button key={v} onClick={() => onViewChange(v)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold rounded-lg capitalize transition-all whitespace-nowrap ${currentView === v ? 'bg-[var(--accent)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'}`}>
                {v === 'library' && <Book size={12} />}
                {v === 'favorites' && <Star size={12} />}
                {v === 'history' && <History size={12} />}
                {v === 'docs' && <FileText size={12} />}
                {v}
              </button>
            ))}
          </div>

          {(currentView === 'library' || currentView === 'favorites') && (
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
                <button onClick={() => setSortOrder(prev => prev === 'name' ? 'recent' : 'name')} className="p-2 rounded-xl bg-[var(--bg-element)] border border-[var(--border)] text-[var(--text-muted)] transition-colors" title="Toggle Sort Name/Recent"><SortAsc size={14} /></button>
              </div>
            </div>
          )}

          {currentView === 'history' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="space-y-3">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors" size={16} />
                  <input type="text" placeholder="Search archive..." className="w-full pl-10 pr-4 py-2 rounded-xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm" value={historySearchQuery} onChange={(e) => setHistorySearchQuery(e.target.value)} />
                  {historySearchQuery && (
                    <button onClick={() => setHistorySearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-red-500 transition-colors">
                      <X size={14} />
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2 px-1">
                    <ArrowUpDown size={10} /> Sort sessions by
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-0.5">
                    {[
                      { id: 'recent', label: 'Date', icon: Calendar },
                      { id: 'name', label: 'Persona', icon: User },
                      { id: 'model', label: 'Model', icon: Cpu }
                    ].map(sort => (
                      <button 
                        key={sort.id} 
                        onClick={() => setHistorySortOrder(sort.id as any)} 
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all whitespace-nowrap ${historySortOrder === sort.id ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md' : 'bg-[var(--bg-element)]/50 border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]/50'}`}
                      >
                        <sort.icon size={10} />
                        {sort.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2 px-1">
                    <Filter size={10} /> Filter by engine
                  </label>
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-0.5">
                    {historyModels.map(model => (
                      <button 
                        key={model} 
                        onClick={() => setHistoryModelFilter(model)} 
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all whitespace-nowrap ${historyModelFilter === model ? 'bg-[var(--accent)] text-white border-[var(--accent)] shadow-md' : 'bg-[var(--bg-element)]/50 border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)]/50'}`}
                      >
                        {model}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-2 space-y-2">
          {currentView === 'history' ? (
            filteredHistory.length > 0 ? (
              filteredHistory.map(session => (
                <div key={session.id} className="group relative animate-in fade-in slide-in-from-right-2 duration-300">
                  <button onClick={() => onResumeSession(session)} className="w-full text-left p-4 rounded-2xl border border-transparent bg-[var(--bg-element)]/40 hover:border-[var(--border)] hover:bg-[var(--bg-element)] transition-all pr-16">
                    <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-[var(--text-heading)] text-sm line-clamp-1">{session.personaName}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-1.5">
                       <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-muted)]">
                        <Calendar size={10} /> {new Date(session.lastUpdateTime).toLocaleDateString()}
                       </span>
                       <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--accent)] bg-[var(--accent)]/10 px-1.5 py-0.5 rounded">
                        <Cpu size={10} /> {session.modelId}
                       </span>
                    </div>
                    <p className="text-xs text-[var(--text-muted)] line-clamp-1 italic">{session.messages[session.messages.length - 1]?.text}</p>
                  </button>
                  <div className="absolute right-2 top-2 bottom-2 flex flex-col justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => onDownloadSession(e, session)} className="p-1.5 rounded-lg bg-[var(--bg-element-hover)] text-[var(--text-muted)] hover:bg-[var(--accent)] hover:text-white transition-colors"><FileDown size={14} /></button>
                    <button onClick={(e) => onDeleteSession(e, session.id)} className="p-1.5 rounded-lg bg-[var(--bg-element-hover)] text-[var(--text-muted)] hover:bg-red-600 hover:text-white transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center space-y-4 opacity-50">
                <div className="p-4 rounded-full bg-[var(--bg-element)]">
                  <Eraser size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-[var(--text-heading)]">No matching history</p>
                  <p className="text-[10px] text-[var(--text-muted)]">Try adjusting your filters or search terms.</p>
                </div>
                <button onClick={resetHistoryFilters} className="text-[10px] font-black uppercase text-[var(--accent)] hover:underline">Reset Filters</button>
              </div>
            )
          ) : currentView === 'docs' ? (
            Object.keys(DOCUMENTATION_CONTENT).map(fileName => (
              <button key={fileName} onClick={() => onSelectDoc(fileName)} className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedDocId === fileName ? 'bg-[var(--accent)]/10 border-[var(--accent)]/50' : 'bg-[var(--bg-element)]/40 border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-element)]'}`}>
                <div className="flex items-center gap-3">
                  <FileText size={16} className="text-[var(--accent)]" />
                  <span className="text-sm font-medium text-[var(--text-heading)]">{fileName}</span>
                </div>
              </button>
            ))
          ) : (
            filteredPrompts.map(p => (
              <button key={p.id} onClick={() => onSelectPrompt(p)} className={`w-full text-left p-4 rounded-2xl border transition-all group relative ${selectedPromptId === p.id ? 'bg-[var(--accent)]/10 border-[var(--accent)]/50' : 'bg-[var(--bg-element)]/40 border-transparent hover:border-[var(--border)] hover:bg-[var(--bg-element)]'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-semibold text-[var(--text-heading)] group-hover:text-[var(--accent)] transition-colors pr-6">{p.act}</span>
                  <button onClick={(e) => onToggleFavorite(p.id, e)} className={`transition-colors ${favorites.has(p.id) ? 'text-amber-400' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'}`}><Star size={14} fill={favorites.has(p.id) ? "currentColor" : "none"} /></button>
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
          <button onClick={onOpenHelp} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--text-body)] transition-all text-xs font-medium"><HelpCircle size={14} /> Help</button>
          <button onClick={onOpenSettings} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--text-body)] transition-all text-xs font-medium"><Settings size={14} /> Config</button>
        </div>
    </div>
  );
};