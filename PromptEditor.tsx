
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Modal } from './Modal';
import { PromptItem, PersonaVersion, Category, PromptDocument } from './types';
import { CATEGORIES } from './constants';
import { VersionHistory } from './VersionHistory';
import { SchemaBuilder } from './SchemaBuilder';
import { geminiService } from './services/geminiService';
import { 
  Undo2, Redo2, Wand2, Save, Download, LayoutTemplate, Hash, 
  Camera, Sparkles, Database, FileText, Code, Settings2,
  Upload, X, Loader2, Braces, History, Copy, Palette, Check, Eye
} from 'lucide-react';

interface PromptEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt: Partial<PromptItem> | null;
  onSave: (prompt: PromptItem) => void;
  onSaveAsTemplate: (prompt: Partial<PromptItem>) => void;
  allTags: string[];
  allTemplates: any[];
}

export const PromptEditor: React.FC<PromptEditorProps> = ({
  isOpen,
  onClose,
  initialPrompt,
  onSave,
  onSaveAsTemplate,
  allTags,
  allTemplates
}) => {
  const [activeTab, setActiveTab] = useState<'core' | 'knowledge' | 'structure' | 'versions'>('core');
  const [editingPrompt, setEditingPrompt] = useState<Partial<PromptItem> | null>(null);
  const [editorHistory, setEditorHistory] = useState<Partial<PromptItem>[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [tagInput, setTagInput] = useState('');
  const [snapshotDesc, setSnapshotDesc] = useState('');
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [showTagSuccess, setShowTagSuccess] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<PromptDocument | null>(null);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && initialPrompt) {
      setEditingPrompt(initialPrompt);
      setEditorHistory([initialPrompt]);
      setHistoryIndex(0);
      setTagInput(initialPrompt.tags?.join(', ') || '');
      setActiveTab('core');
    }
  }, [isOpen, initialPrompt]);

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

  const handleUndo = () => {
    if (historyIndex > 0) {
      const idx = historyIndex - 1;
      setHistoryIndex(idx);
      setEditingPrompt(editorHistory[idx]);
      setTagInput(editorHistory[idx].tags?.join(', ') || '');
    }
  };

  const handleRedo = () => {
    if (historyIndex < editorHistory.length - 1) {
      const idx = historyIndex + 1;
      setHistoryIndex(idx);
      setEditingPrompt(editorHistory[idx]);
      setTagInput(editorHistory[idx].tags?.join(', ') || '');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = (ev.target?.result as string).split(',')[1];
        const newDoc: PromptDocument = { id: crypto.randomUUID(), name: file.name, type: file.type, data };
        setEditingPrompt(prev => {
          const nextDocs = [...(prev?.documents || []), newDoc];
          updateEditingState({ documents: nextDocs });
          return { ...prev, documents: nextDocs };
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handlePreview = (doc: PromptDocument) => {
    setPreviewDoc(doc);
  };

  const currentTagFragment = useMemo(() => {
    const parts = tagInput.split(',');
    return parts[parts.length - 1].trim().toLowerCase();
  }, [tagInput]);

  const tagSuggestions = useMemo(() => {
    if (!currentTagFragment) return [];
    const existing = new Set(editingPrompt?.tags || []);
    return allTags.filter(t => t.toLowerCase().includes(currentTagFragment) && !existing.has(t)).slice(0, 5);
  }, [allTags, currentTagFragment, editingPrompt?.tags]);

  // Reset selection when input changes
  useEffect(() => {
    setSelectedSuggestionIndex(-1);
  }, [tagInput]);

  const injectSuggestedTag = (tag: string) => {
    const parts = tagInput.split(',').map(p => p.trim());
    parts[parts.length - 1] = tag;
    const finalVal = Array.from(new Set(parts)).join(', ') + ', ';
    setTagInput(finalVal);
    updateEditingState({ tags: finalVal.split(',').map(t => t.trim()).filter(Boolean) });
    setShowTagSuccess(tag);
    setTimeout(() => setShowTagSuccess(null), 1000);
    setSelectedSuggestionIndex(-1);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (tagSuggestions.length > 0) {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => (prev <= 0 ? tagSuggestions.length - 1 : prev - 1));
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => (prev >= tagSuggestions.length - 1 ? 0 : prev + 1));
      } else if (e.key === 'Enter' || e.key === 'Tab') {
         if (selectedSuggestionIndex !== -1) {
            e.preventDefault();
            injectSuggestedTag(tagSuggestions[selectedSuggestionIndex]);
         }
      } else if (e.key === 'Escape') {
        setSelectedSuggestionIndex(-1);
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingPrompt?.act ? "Refine Persona Node" : "Forge New Persona"}>
        <div className="space-y-6">
          <div className="flex items-center justify-between shrink-0">
            <div className="flex gap-2">
               <button type="button" onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--accent)] disabled:opacity-30 transition-all"><Undo2 size={18} /></button>
               <button type="button" onClick={handleRedo} disabled={historyIndex >= editorHistory.length - 1} className="p-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--accent)] disabled:opacity-30 transition-all"><Redo2 size={18} /></button>
            </div>
            <div className="flex items-center gap-3">
               <button type="button" onClick={() => editingPrompt && onSaveAsTemplate(editingPrompt)} className="px-3 py-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-all flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider border border-transparent hover:border-[var(--accent)]/30"><LayoutTemplate size={16} /> Template</button>
               <button type="button" onClick={() => updateEditingState(editingPrompt || {})} className="p-2.5 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--accent)] transition-all" title="Export JSON Matrix"><Download size={18} /></button>
            </div>
          </div>

          <div className="flex bg-[var(--bg-element)] p-1 rounded-xl shrink-0">
            {[
              { id: 'core', icon: Settings2, label: 'Matrix' },
              { id: 'knowledge', icon: Database, label: 'KB' },
              { id: 'structure', icon: Braces, label: 'Schema' },
              { id: 'versions', icon: History, label: 'History' }
            ].map(tab => (
              <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] font-bold uppercase transition-all ${activeTab === tab.id ? 'bg-[var(--bg-panel)] text-[var(--text-heading)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'}`}><tab.icon size={14} /> {tab.label}</button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar min-h-[400px]">
            <form onSubmit={(e) => { e.preventDefault(); onSave(editingPrompt as PromptItem); }} className="space-y-6">
              {activeTab === 'core' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Callsign</label><input required className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-bold" value={editingPrompt?.act || ''} onChange={e => updateEditingState({ act: e.target.value })} /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Category</label><select className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-bold appearance-none cursor-pointer" value={editingPrompt?.category} onChange={e => updateEditingState({ category: e.target.value as Category })}>{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Matrix Intent (Description)</label>
                    <input className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm" value={editingPrompt?.description || ''} onChange={e => updateEditingState({ description: e.target.value })} placeholder="Briefly describe what this persona is for..." />
                  </div>
                  <div className="space-y-1.5 relative">
                    <div className="flex justify-between items-center px-1"><label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Instruction Matrix</label><button type="button" onClick={async () => { setIsOptimizing(true); const opt = await geminiService.optimizePrompt(editingPrompt?.prompt || ''); updateEditingState({ prompt: opt }); setIsOptimizing(false); }} disabled={isOptimizing} className="flex items-center gap-1.5 text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors disabled:opacity-50">{isOptimizing ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />} Auto-Tune</button></div>
                    <textarea required rows={10} className="w-full px-5 py-4 rounded-3xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-mono leading-relaxed" value={editingPrompt?.prompt || ''} onChange={e => updateEditingState({ prompt: e.target.value })} placeholder="Persona behavior patterns..." />
                  </div>
                  <div className="space-y-1.5 relative">
                    <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2"><Hash size={12} /> Semantic Tags</label>
                    <input 
                      className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-xs" 
                      value={tagInput} 
                      onChange={e => { setTagInput(e.target.value); updateEditingState({ tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) }); }} 
                      onKeyDown={handleTagKeyDown}
                      placeholder="web, react, senior..." 
                    />
                    {tagSuggestions.length > 0 && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 bg-[var(--bg-panel)] border border-[var(--border)] rounded-xl shadow-2xl z-20 p-2 flex flex-col gap-1 animate-in slide-in-from-bottom-2">
                         {tagSuggestions.map(tag => (
                            <button 
                              key={tag} 
                              type="button" 
                              onClick={() => injectSuggestedTag(tag)} 
                              onMouseEnter={() => setSelectedSuggestionIndex(tagSuggestions.indexOf(tag))}
                              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-bold transition-all text-left ${selectedSuggestionIndex === tagSuggestions.indexOf(tag) ? 'bg-[var(--accent)] text-white' : 'hover:bg-[var(--bg-element)] text-[var(--text-muted)]'}`}
                            >
                              <Hash size={10} className={selectedSuggestionIndex === tagSuggestions.indexOf(tag) ? 'text-white' : 'text-[var(--accent)]'} />
                              {tag}
                            </button>
                         ))}
                      </div>
                    )}
                    {showTagSuccess && <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-[10px] font-bold text-emerald-500 animate-out fade-out fill-mode-forwards duration-1000"><Check size={12} /> Added</div>}
                  </div>
                </div>
              )}
              {activeTab === 'knowledge' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="p-8 rounded-3xl bg-[var(--bg-element)]/30 border border-dashed border-[var(--border)] text-center group hover:border-[var(--accent)]/50 transition-all">
                      <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" multiple accept=".txt,.pdf,.md" />
                      <button type="button" onClick={() => fileInputRef.current?.click()} className="px-8 py-4 rounded-xl bg-[var(--bg-panel)] border border-[var(--border)] hover:border-[var(--accent)] text-xs font-bold uppercase tracking-widest flex items-center gap-3 mx-auto shadow-sm group-hover:scale-105 transition-all"><Upload size={16} /> Multi-Upload Context</button>
                      <p className="mt-4 text-[10px] text-[var(--text-muted)]">Attach up to 10 documents for RAG simulation.</p>
                   </div>
                   <div className="space-y-2">
                      {editingPrompt?.documents?.map(doc => (
                        <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-element)] border border-[var(--border)] group/doc">
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText size={16} className="text-[var(--accent)] shrink-0" />
                            <div className="truncate">
                              <span className="text-xs font-bold block truncate">{doc.name}</span>
                              <span className="text-[9px] uppercase tracking-tighter text-[var(--text-muted)]">{doc.type}</span>
                            </div>
                          </div>
                          <div className="flex gap-1 opacity-0 group-hover/doc:opacity-100 transition-opacity">
                             <button type="button" onClick={() => handlePreview(doc)} className="p-2 text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors"><Eye size={14} /></button>
                             <button type="button" onClick={() => updateEditingState({ documents: (editingPrompt.documents || []).filter(d => d.id !== doc.id) })} className="p-2 text-[var(--text-muted)] hover:text-red-500 transition-colors"><X size={14} /></button>
                          </div>
                        </div>
                      ))}
                   </div>
                </div>
              )}
              {activeTab === 'structure' && (
                <div className="space-y-4 animate-in fade-in duration-300 h-[500px] flex flex-col">
                   <SchemaBuilder 
                      value={editingPrompt?.responseSchema || ''} 
                      onChange={(val) => updateEditingState({ responseSchema: val })} 
                   />
                </div>
              )}
              {activeTab === 'versions' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                   <div className="flex gap-3"><input className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--bg-panel)] border border-[var(--border)] text-xs" placeholder="Describe this state..." value={snapshotDesc} onChange={(e) => setSnapshotDesc(e.target.value)} /><button type="button" onClick={() => { if(!editingPrompt?.prompt) return; const v: PersonaVersion = { timestamp: Date.now(), prompt: editingPrompt.prompt, act: editingPrompt.act || 'Untitled', description: snapshotDesc || 'Snapshot', personaDescription: editingPrompt.description, tags: editingPrompt.tags || [] }; updateEditingState({ versions: [v, ...(editingPrompt.versions || [])] }); setSnapshotDesc(''); }} className="px-4 py-2.5 rounded-xl bg-[var(--accent)] text-white font-bold uppercase text-[10px] tracking-widest shadow-lg hover:bg-[var(--accent-hover)] transition-all">Snapshot</button></div>
                   <VersionHistory 
                     versions={editingPrompt?.versions || []} 
                     onRevert={(v) => { 
                       updateEditingState({ 
                         prompt: v.prompt, 
                         act: v.act, 
                         tags: v.tags,
                         description: v.personaDescription || editingPrompt.description 
                       }); 
                       if (v.tags) setTagInput(v.tags.join(', ')); 
                     }} 
                     onDelete={(idx) => { 
                       const vs = [...(editingPrompt.versions || [])]; 
                       vs.splice(idx, 1); 
                       updateEditingState({ versions: vs }); 
                     }} 
                   />
                </div>
              )}
              <div className="pt-4 border-t border-[var(--border)] sticky bottom-0 bg-[var(--bg-panel)] pb-2">
                <button type="submit" className="w-full py-5 rounded-[2.5rem] bg-[var(--accent)] text-white font-black uppercase tracking-[0.3em] hover:bg-[var(--accent-hover)] transition-all shadow-xl text-sm">Commit Persona Matrix</button>
              </div>
            </form>
          </div>
        </div>

        {previewDoc && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-8 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
             <div className="w-full max-w-2xl bg-[var(--bg-panel)] rounded-3xl border border-[var(--border)] flex flex-col h-full max-h-[80vh] overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--bg-element)]/50">
                   <div className="flex items-center gap-3">
                      <FileText size={18} className="text-[var(--accent)]" />
                      <span className="text-sm font-bold text-[var(--text-heading)]">{previewDoc.name}</span>
                   </div>
                   <button onClick={() => setPreviewDoc(null)} className="p-2 rounded-xl hover:bg-[var(--bg-element)] text-[var(--text-muted)]"><X size={20} /></button>
                </div>
                <div className="flex-1 p-8 overflow-y-auto font-mono text-xs leading-relaxed text-[var(--text-body)] select-text">
                   {atob(previewDoc.data)}
                </div>
             </div>
          </div>
        )}
      </Modal>
  );
};
