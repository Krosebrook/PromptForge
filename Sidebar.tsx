
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { 
  Search, Book, Star, History, FileText, Filter, Layers, Users, SortAsc, 
  ArrowUpDown, Calendar, Cpu, X, Eraser, Zap, Upload, Archive, Plus,
  FileDown, Trash2, Settings, HelpCircle, Hash, User, GripVertical, Download,
  ChevronDown, ChevronRight, FileSearch, GitFork, Play
} from 'lucide-react';
import { PromptItem, Category, ChatSession, PromptDocument, PipelineConfig } from './types';
import { CATEGORIES, TYPES } from './constants';

interface SidebarProps {
  allPrompts: PromptItem[];
  chatHistory: ChatSession[];
  favorites: Set<string>;
  savedPipelines?: PipelineConfig[];
  currentView: 'library' | 'favorites' | 'history' | 'docs' | 'pipeline';
  onViewChange: (view: 'library' | 'favorites' | 'history' | 'docs' | 'pipeline') => void;
  selectedPromptId?: string;
  selectedDocId?: string | null;
  selectedPipelineId?: string | null;
  onSelectPrompt: (prompt: PromptItem) => void;
  onSelectDoc: (docId: string) => void;
  onSelectPipeline?: (pipelineId: string) => void;
  onResumeSession: (session: ChatSession) => void;
  onToggleFavorite: (id: string, e?: React.MouseEvent) => void;
  onDeleteSession: (e: React.MouseEvent, id: string) => void;
  onDownloadSession: (e: React.MouseEvent, session: ChatSession) => void;
  onClearAllHistory: () => void;
  onImportPersona: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExportData: () => void;
  onNewPersona: () => void;
  onNewPipeline?: () => void;
  onDeletePipeline?: (id: string, e: React.MouseEvent) => void;
  onOpenSettings: () => void;
  onOpenHelp: () => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  isInstallable: boolean;
  onInstallApp: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  allPrompts,
  chatHistory,
  favorites,
  savedPipelines = [],
  currentView,
  onViewChange,
  selectedPromptId,
  selectedDocId,
  selectedPipelineId,
  onSelectPrompt,
  onSelectDoc,
  onSelectPipeline,
  onResumeSession,
  onToggleFavorite,
  onDeleteSession,
  onDownloadSession,
  onClearAllHistory,
  onImportPersona,
  onExportData,
  onNewPersona,
  onNewPipeline,
  onDeletePipeline,
  onOpenSettings,
  onOpenHelp,
  fileInputRef,
  isInstallable,
  onInstallApp
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All');
  const [activeType, setActiveType] = useState<PromptItem['type'] | 'All'>('All');
  const [selectedContributor, setSelectedContributor] = useState<string>('All');
  const [sortOrder, setSortOrder] = useState<'name' | 'recent'>('name');
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // History specific state
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [historySortOrder, setHistorySortOrder] = useState<'recent' | 'name' | 'model'>('recent');
  const [historyModelFilter, setHistoryModelFilter] = useState<string>('All');
  const [isHistoryFiltersOpen, setIsHistoryFiltersOpen] = useState(false);
  
  // Docs specific state
  const [docSearchQuery, setDocSearchQuery] = useState('');

  const [sidebarWidth, setSidebarWidth] = useState(() => parseInt(localStorage.getItem('sidebar_width') || '384', 10));
  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 1024);

  const startResizing = useCallback((e: React.MouseEvent) => { e.preventDefault(); setIsResizing(true); }, []);
  const stopResizing = useCallback(() => setIsResizing(false), []);
  const resize = useCallback((e: MouseEvent) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth > 260 && newWidth < 800) setSidebarWidth(newWidth);
    }
  }, [isResizing]);

  useEffect(() => {
    if (isResizing) {
      window.addEventListener("mousemove", resize);
      window.addEventListener("mouseup", stopResizing);
    } else {
      localStorage.setItem('sidebar_width', sidebarWidth.toString());
    }
    return () => { window.removeEventListener("mousemove", resize); window.removeEventListener("mouseup", stopResizing); };
  }, [isResizing, resize, stopResizing, sidebarWidth]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const contributorsList = useMemo(() => ['All', ...Array.from(new Set(allPrompts.map(p => p.contributor)))].sort(), [allPrompts]);

  const historyModels = useMemo(() => {
    const models = new Set(chatHistory.map(s => s.modelId).filter(Boolean));
    return ['All', ...Array.from(models)].sort();
  }, [chatHistory]);

  const filteredPrompts = useMemo(() => {
    let list = currentView === 'favorites' ? allPrompts.filter(p => favorites.has(p.id)) : allPrompts;
    list = list.filter(p => (activeCategory === 'All' || p.category === activeCategory) && (activeType === 'All' || p.type === activeType) && (selectedContributor === 'All' || p.contributor === selectedContributor));

    if (searchQuery.trim()) {
      const qRaw = searchQuery.toLowerCase().trim();
      const terms = qRaw.split(/\s+/).filter(t => t.length > 0);

      return list.map(p => {
        let score = 0;
        const name = p.act.toLowerCase();
        const desc = (p.description || '').toLowerCase();
        const promptText = p.prompt.toLowerCase();
        const tags = p.tags.map(t => t.toLowerCase());

        if (name === qRaw) score += 50000;
        else if (name.startsWith(qRaw)) score += 10000;
        
        if (desc === qRaw) score += 20000;

        let matchedTerms = 0;
        terms.forEach(term => {
          let termMatched = false;
          
          if (name.includes(term)) {
            score += 1000;
            if (name.split(/[\s-]+/).includes(term)) score += 1000;
            termMatched = true;
          }

          if (tags.some(t => t === term)) {
             score += 2000;
             termMatched = true;
          } else if (tags.some(t => t.includes(term))) {
             score += 800;
             termMatched = true;
          }

          if (desc.includes(term)) {
             score += 300;
             termMatched = true;
          }
          if (promptText.includes(term)) {
             score += 100;
             termMatched = true;
          }

          if (termMatched) matchedTerms++;
        });

        if (matchedTerms === terms.length && terms.length > 0) {
           score += 5000;
        } else {
           score += (matchedTerms * 500);
        }

        return { p, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score || a.p.act.localeCompare(b.p.act))
      .map(item => item.p);
    }
    return list.sort((a, b) => sortOrder === 'name' ? a.act.localeCompare(b.act) : 0);
  }, [allPrompts, favorites, currentView, searchQuery, activeCategory, activeType, selectedContributor, sortOrder]);

  const filteredHistory = useMemo(() => {
    let list = [...chatHistory];
    
    // Model Filter
    if (historyModelFilter !== 'All') {
       list = list.filter(s => s.modelId === historyModelFilter);
    }

    if (historySearchQuery.trim()) {
      const q = historySearchQuery.toLowerCase();
      list = list.filter(s => s.personaName.toLowerCase().includes(q) || s.messages.some(m => m.text.toLowerCase().includes(q)));
    }
    
    return list.sort((a, b) => {
      if (historySortOrder === 'recent') return b.lastUpdateTime - a.lastUpdateTime;
      if (historySortOrder === 'name') return a.personaName.localeCompare(b.personaName);
      if (historySortOrder === 'model') return (a.modelId || '').localeCompare(b.modelId || '');
      return 0;
    });
  }, [chatHistory, historySearchQuery, historySortOrder, historyModelFilter]);

  const allDocuments = useMemo(() => {
    const docs: (PromptDocument & { parentPrompt: string })[] = [];
    allPrompts.forEach(p => {
      p.documents?.forEach(d => {
        docs.push({ ...d, parentPrompt: p.act });
      });
    });
    if (docSearchQuery.trim()) {
      const q = docSearchQuery.toLowerCase();
      return docs.filter(d => d.name.toLowerCase().includes(q) || d.type.toLowerCase().includes(q) || d.parentPrompt.toLowerCase().includes(q));
    }
    return docs;
  }, [allPrompts, docSearchQuery]);

  return (
    <div 
      className={`flex flex-col border-r border-[var(--border)] bg-[var(--bg-panel)]/50 relative shrink-0 ${isResizing ? 'transition-none' : 'transition-all duration-300'} ${selectedPromptId || selectedDocId || selectedPipelineId ? 'hidden lg:flex' : 'flex'}`}
      style={{ width: isDesktop ? sidebarWidth : '100%' }}
    >
        <div className="p-6 space-y-4 flex flex-col h-full overflow-hidden">
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-[var(--accent)]/20 text-[var(--accent)]"><Zap size={24} /></div>
              <h1 className="text-xl font-bold text-[var(--text-heading)]">PromptForge</h1>
            </div>
            <div className="flex gap-2">
              <input type="file" ref={fileInputRef} onChange={onImportPersona} className="hidden" accept=".json" />
              <button onClick={() => fileInputRef.current?.click()} className="p-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-all" title="Import"><Upload size={18} /></button>
              <button onClick={onExportData} className="p-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-all" title="Export"><Archive size={18} /></button>
              {currentView === 'pipeline' ? (
                <button onClick={onNewPipeline} className="p-2 rounded-xl bg-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)]/30 transition-all" title="New Pipeline"><GitFork size={18} /></button>
              ) : (
                <button onClick={onNewPersona} className="p-2 rounded-xl bg-[var(--accent)]/20 text-[var(--accent)] hover:bg-[var(--accent)]/30 transition-all" title="New Persona"><Plus size={18} /></button>
              )}
            </div>
          </div>
          
          <div className="flex gap-1 p-1 bg-[var(--bg-element)] rounded-xl shrink-0 overflow-x-auto no-scrollbar">
            {(['library', 'favorites', 'history', 'docs', 'pipeline'] as const).map(v => (
              <button key={v} onClick={() => onViewChange(v)} className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 text-[10px] font-bold rounded-lg capitalize transition-all whitespace-nowrap ${currentView === v ? 'bg-[var(--accent)] text-white shadow-lg' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'}`}>
                {v === 'library' && <Book size={12} />}
                {v === 'favorites' && <Star size={12} />}
                {v === 'history' && <History size={12} />}
                {v === 'docs' && <FileText size={12} />}
                {v === 'pipeline' && <Layers size={12} />}
                {v}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 pr-1">
            {/* Library / Favorites View */}
            {(currentView === 'library' || currentView === 'favorites') && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] group-focus-within:text-[var(--accent)] transition-colors" size={16} />
                  <input type="text" placeholder="Search prompts..." className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-element)]/30 overflow-hidden">
                  <button onClick={() => setIsFiltersOpen(!isFiltersOpen)} className="w-full flex items-center justify-between p-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors">
                    <div className="flex items-center gap-2"><Filter size={12} /> Refine Results</div>
                    {isFiltersOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                  {isFiltersOpen && (
                    <div className="p-3 pt-0 space-y-4 border-t border-[var(--border)] animate-in slide-in-from-top-2 duration-200">
                       <div className="space-y-2">
                          <label className="text-[9px] font-bold text-[var(--text-muted)] flex items-center gap-1"><Layers size={10} /> Category</label>
                          <div className="flex flex-wrap gap-1.5">
                            <button onClick={() => setActiveCategory('All')} className={`px-2 py-1 rounded-md text-[9px] font-bold border ${activeCategory === 'All' ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>All</button>
                            {CATEGORIES.map(cat => <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-2 py-1 rounded-md text-[9px] font-bold border whitespace-nowrap ${activeCategory === cat ? 'bg-[var(--accent)] border-[var(--accent)] text-white' : 'border-[var(--border)] text-[var(--text-muted)]'}`}>{cat}</button>)}
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <div className="flex-1 space-y-2">
                             <label className="text-[9px] font-bold text-[var(--text-muted)] flex items-center gap-1"><Users size={10} /> Contributor</label>
                             <select className="w-full bg-[var(--bg-panel)] border border-[var(--border)] rounded-md px-2 py-1 text-[10px] outline-none" value={selectedContributor} onChange={(e) => setSelectedContributor(e.target.value)}>
                                {contributorsList.map(c => <option key={c} value={c}>{c}</option>)}
                             </select>
                          </div>
                          <div className="flex-1 space-y-2">
                             <label className="text-[9px] font-bold text-[var(--text-muted)] flex items-center gap-1"><SortAsc size={10} /> Sort</label>
                             <select className="w-full bg-[var(--bg-panel)] border border-[var(--border)] rounded-md px-2 py-1 text-[10px] outline-none" value={sortOrder} onChange={(e) => setSortOrder(e.target.value as any)}>
                                <option value="name">A-Z Name</option>
                                <option value="recent">Recently Used</option>
                             </select>
                          </div>
                       </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                   {filteredPrompts.map(p => (
                     <div key={p.id} onClick={() => onSelectPrompt(p)} className={`p-3.5 rounded-xl cursor-pointer border transition-all group ${selectedPromptId === p.id ? 'bg-[var(--accent)] border-[var(--accent)] shadow-md' : 'bg-[var(--bg-element)] border-[var(--border)] hover:border-[var(--accent)]/50'}`}>
                        <div className="flex justify-between items-start mb-2">
                           <h3 className={`text-xs font-bold truncate ${selectedPromptId === p.id ? 'text-white' : 'text-[var(--text-heading)]'}`}>{p.act}</h3>
                           <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(p.id); }} className={`p-1 rounded-md transition-all ${favorites.has(p.id) ? (selectedPromptId === p.id ? 'text-white fill-white' : 'text-[var(--accent)] fill-[var(--accent)]') : (selectedPromptId === p.id ? 'text-white/50 hover:text-white' : 'text-[var(--text-muted)] hover:text-[var(--accent)]')}`}><Star size={12} /></button>
                        </div>
                        <p className={`text-[11px] line-clamp-2 leading-relaxed ${selectedPromptId === p.id ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>{p.description || p.prompt}</p>
                        {p.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            {p.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-muted)]">#{tag}</span>
                            ))}
                          </div>
                        )}
                     </div>
                   ))}
                </div>
              </div>
            )}

            {/* History View */}
            {currentView === 'history' && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                  <input type="text" placeholder="Search archive (persona or msg)..." className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm" value={historySearchQuery} onChange={(e) => setHistorySearchQuery(e.target.value)} />
                </div>

                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-element)]/30 overflow-hidden">
                  <button onClick={() => setIsHistoryFiltersOpen(!isHistoryFiltersOpen)} className="w-full flex items-center justify-between p-3 text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] hover:text-[var(--text-heading)] transition-colors">
                    <div className="flex items-center gap-2"><Filter size={12} /> Filter & Sort</div>
                    {isHistoryFiltersOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                  </button>
                  
                  {isHistoryFiltersOpen && (
                    <div className="p-3 pt-0 space-y-4 border-t border-[var(--border)] animate-in slide-in-from-top-2 duration-200">
                       <div className="flex gap-2">
                          <div className="flex-1 space-y-2">
                             <label className="text-[9px] font-bold text-[var(--text-muted)] flex items-center gap-1"><Cpu size={10} /> Model</label>
                             <select className="w-full bg-[var(--bg-panel)] border border-[var(--border)] rounded-md px-2 py-1 text-[10px] outline-none" value={historyModelFilter} onChange={(e) => setHistoryModelFilter(e.target.value)}>
                                {historyModels.map(m => <option key={m} value={m}>{m === 'All' ? 'All Models' : m}</option>)}
                             </select>
                          </div>
                          <div className="flex-1 space-y-2">
                             <label className="text-[9px] font-bold text-[var(--text-muted)] flex items-center gap-1"><SortAsc size={10} /> Sort By</label>
                             <select className="w-full bg-[var(--bg-panel)] border border-[var(--border)] rounded-md px-2 py-1 text-[10px] outline-none" value={historySortOrder} onChange={(e) => setHistorySortOrder(e.target.value as any)}>
                                <option value="recent">Recent</option>
                                <option value="name">Name (A-Z)</option>
                                <option value="model">Model</option>
                             </select>
                          </div>
                       </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  {filteredHistory.map(session => (
                    <div key={session.id} onClick={() => onResumeSession(session)} className="group p-3 rounded-xl bg-[var(--bg-element)] border border-[var(--border)] hover:border-[var(--accent)] cursor-pointer transition-all relative">
                      <div className="flex justify-between items-start">
                        <h4 className="text-xs font-bold text-[var(--text-heading)] truncate pr-16">{session.personaName}</h4>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2">
                           <button onClick={(e) => onDownloadSession(e, session)} className="p-1 rounded-md hover:bg-[var(--bg-panel)] text-[var(--text-muted)] hover:text-[var(--accent)]"><FileDown size={12} /></button>
                           <button onClick={(e) => onDeleteSession(e, session.id)} className="p-1 rounded-md hover:bg-[var(--bg-panel)] text-[var(--text-muted)] hover:text-red-500"><Trash2 size={12} /></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                         <span className="text-[9px] font-mono text-[var(--text-muted)] bg-[var(--bg-panel)] px-1.5 py-0.5 rounded border border-[var(--border)]">{session.modelId || 'Unknown'}</span>
                         <span className="text-[9px] text-[var(--text-muted)]">{new Date(session.lastUpdateTime).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
                {chatHistory.length > 0 && <button onClick={onClearAllHistory} className="w-full py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2"><Trash2 size={12} /> Clear History</button>}
              </div>
            )}

            {/* Documents View */}
            {currentView === 'docs' && (
              <div className="space-y-3 animate-in fade-in duration-300">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                  <input type="text" placeholder="Search knowledge..." className="w-full pl-9 pr-4 py-2 rounded-xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm" value={docSearchQuery} onChange={(e) => setDocSearchQuery(e.target.value)} />
                </div>
                <div className="space-y-2">
                   {allDocuments.length === 0 ? (
                     <div className="text-center py-10 text-[var(--text-muted)] space-y-2">
                       <FileSearch size={32} className="mx-auto opacity-20" />
                       <p className="text-xs">No documents attached to personas yet.</p>
                     </div>
                   ) : (
                     allDocuments.map((doc, idx) => (
                       <div 
                         key={`${doc.id}-${idx}`} 
                         onClick={() => onSelectDoc(doc.id)}
                         className={`p-3 rounded-xl border transition-all cursor-pointer ${selectedDocId === doc.id ? 'bg-[var(--accent)] border-[var(--accent)] shadow-md' : 'bg-[var(--bg-element)] border-[var(--border)] hover:border-[var(--accent)]/50'}`}
                       >
                         <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${selectedDocId === doc.id ? 'bg-white/20' : 'bg-[var(--bg-panel)]'}`}>
                               <FileText size={16} className={selectedDocId === doc.id ? 'text-white' : 'text-[var(--accent)]'} />
                            </div>
                            <div className="min-w-0 flex-1">
                               <div className={`text-xs font-bold truncate ${selectedDocId === doc.id ? 'text-white' : 'text-[var(--text-heading)]'}`}>{doc.name}</div>
                               <div className={`text-[9px] uppercase tracking-wider font-bold truncate ${selectedDocId === doc.id ? 'text-white/60' : 'text-[var(--text-muted)]'}`}>
                                 {doc.parentPrompt} • {doc.type.split('/')[1] || doc.type}
                               </div>
                            </div>
                         </div>
                       </div>
                     ))
                   )}
                </div>
              </div>
            )}

            {/* Pipeline View */}
            {currentView === 'pipeline' && (
               <div className="space-y-3 animate-in fade-in duration-300">
                  <div className="p-4 rounded-xl bg-[var(--bg-element)] border border-[var(--border)] text-center space-y-2">
                     <GitFork size={24} className="mx-auto text-[var(--accent)]" />
                     <h3 className="text-xs font-bold">Pipeline Orchestration</h3>
                     <p className="text-[10px] text-[var(--text-muted)]">Chain personas to create complex workflows.</p>
                  </div>
                  
                  <div className="space-y-2">
                     {savedPipelines.length === 0 ? (
                        <div className="text-center py-6 text-[var(--text-muted)] text-[10px] italic">
                           No saved pipelines. Click + to create.
                        </div>
                     ) : (
                        savedPipelines.map(pipe => (
                           <div 
                              key={pipe.id} 
                              onClick={() => onSelectPipeline?.(pipe.id)}
                              className={`p-3.5 rounded-xl cursor-pointer border transition-all group relative ${selectedPipelineId === pipe.id ? 'bg-[var(--accent)] border-[var(--accent)] shadow-md' : 'bg-[var(--bg-element)] border-[var(--border)] hover:border-[var(--accent)]/50'}`}
                           >
                              <div className="flex justify-between items-start">
                                 <h3 className={`text-xs font-bold truncate ${selectedPipelineId === pipe.id ? 'text-white' : 'text-[var(--text-heading)]'}`}>{pipe.name}</h3>
                              </div>
                              <div className={`text-[9px] mt-1 ${selectedPipelineId === pipe.id ? 'text-white/70' : 'text-[var(--text-muted)]'}`}>
                                 {pipe.flowState.nodes.length} Nodes • {new Date(pipe.updatedAt).toLocaleDateString()}
                              </div>
                              <button 
                                 onClick={(e) => { e.stopPropagation(); onDeletePipeline?.(pipe.id, e); }} 
                                 className={`absolute right-2 top-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all ${selectedPipelineId === pipe.id ? 'hover:bg-white/20 text-white' : 'hover:bg-[var(--bg-panel)] text-[var(--text-muted)] hover:text-red-500'}`}
                              >
                                 <Trash2 size={12} />
                              </button>
                           </div>
                        ))
                     )}
                  </div>
               </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-panel)]/80 flex flex-col gap-2 shrink-0">
          {isInstallable && <button onClick={onInstallApp} className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-gradient-to-r from-[var(--accent)] to-purple-600 text-white font-bold uppercase tracking-widest text-[10px] shadow-lg hover:scale-[1.02] transition-all"><Download size={14} /> Install App</button>}
          <div className="flex items-center gap-2">
            <button onClick={onOpenHelp} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--text-body)] transition-all text-xs font-medium"><HelpCircle size={14} /> Help</button>
            <button onClick={onOpenSettings} className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--text-body)] transition-all text-xs font-medium"><Settings size={14} /> Config</button>
          </div>
        </div>

        <div className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--accent)] active:bg-[var(--accent)] transition-colors z-50 hidden lg:block group" onMouseDown={startResizing}>
          <div className="absolute top-1/2 -translate-y-1/2 -right-1.5 p-1 rounded-md bg-[var(--bg-element)] border border-[var(--border)] shadow-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity"><GripVertical size={12} className="text-[var(--text-muted)]" /></div>
        </div>
    </div>
  );
};
