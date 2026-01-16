
import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from './Modal';
import { PromptItem, PersonaVersion, Category } from './types';
import { CATEGORIES, ART_SUGGESTIONS } from './constants';
import { VersionHistory } from './VersionHistory';
import { Undo2, Redo2, Wand2, Save, Download, Filter, LayoutTemplate } from 'lucide-react';

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
  const [editingPrompt, setEditingPrompt] = useState<Partial<PromptItem> | null>(null);
  const [editorHistory, setEditorHistory] = useState<Partial<PromptItem>[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [templateCategory, setTemplateCategory] = useState<'All' | 'Framework' | 'Coding' | 'Design' | 'Marketing'>('All');

  // Initialize state when opening with new data
  useEffect(() => {
    if (isOpen && initialPrompt) {
      setEditingPrompt(initialPrompt);
      setEditorHistory([initialPrompt]);
      setHistoryIndex(0);
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

  const appendToPrompt = (text: string) => {
    const current = editingPrompt?.prompt || '';
    const separator = current.length > 0 && !current.endsWith('\n') && !current.endsWith(' ') ? ', ' : '';
    updateEditingState({ prompt: `${current}${separator}${text}` });
  };

  const applyTemplate = (template: any) => {
    updateEditingState({ act: template.act, category: template.category, prompt: template.prompt, description: template.description, tags: template.tags });
  };

  const revertToVersion = (version: PersonaVersion) => {
    if (!editingPrompt) return;
    updateEditingState({ prompt: version.prompt, act: version.act, description: version.description });
  };

  const deleteVersion = (index: number) => {
    if (!editingPrompt || !editingPrompt.versions) return;
    const nextVersions = [...editingPrompt.versions];
    nextVersions.splice(index, 1);
    updateEditingState({ versions: nextVersions });
  };

  const handleExportJson = () => {
    if (!editingPrompt) return;
    try {
        const jsonString = JSON.stringify(editingPrompt, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const filename = (editingPrompt.act || "persona").replace(/[^a-z0-9]/gi, '_').toLowerCase();
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

  const handleSaveTemplateClick = () => {
    if (!editingPrompt || !editingPrompt.act || !editingPrompt.prompt) {
      alert("Please ensure the persona has at least a Name (Act) and Instructions before saving as a template.");
      return;
    }
    onSaveAsTemplate(editingPrompt);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingPrompt) {
        onSave(editingPrompt as PromptItem);
    }
  };

  const filteredTemplates = useMemo(() => {
    if (templateCategory === 'All') return allTemplates;
    const lowerCat = templateCategory.toLowerCase();
    return allTemplates.filter(t => {
      const tags = t.tags || [];
      if (lowerCat === 'framework') return tags.includes('framework');
      if (lowerCat === 'coding') return tags.includes('coding');
      if (lowerCat === 'design') return tags.includes('design') || tags.includes('product');
      if (lowerCat === 'marketing') return tags.includes('marketing') || tags.includes('writing');
      return true;
    });
  }, [allTemplates, templateCategory]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={editingPrompt?.act ? "Refine Persona Node" : "Forge New Persona"}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
               <button type="button" onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--accent)] disabled:opacity-30 transition-all"><Undo2 size={18} /></button>
               <button type="button" onClick={handleRedo} disabled={historyIndex >= editorHistory.length - 1} className="p-2 rounded-xl bg-[var(--bg-element)] text-[var(--text-muted)] hover:text-[var(--accent)] disabled:opacity-30 transition-all"><Redo2 size={18} /></button>
            </div>
          </div>

          <div className="mb-6 p-4 rounded-2xl bg-[var(--bg-element)]/50 border border-[var(--border)]">
            <div className="flex items-center justify-between mb-3">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2"><LayoutTemplate size={12} /> Load Template</label>
              <div className="flex bg-[var(--bg-panel)] rounded-lg p-0.5 border border-[var(--border)]">
                 {(['All', 'Framework', 'Coding', 'Design', 'Marketing'] as const).map(cat => (
                   <button 
                    key={cat} 
                    type="button" 
                    onClick={() => setTemplateCategory(cat)} 
                    className={`px-2 py-1 text-[9px] font-bold rounded-md transition-all ${templateCategory === cat ? 'bg-[var(--accent)] text-white shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'}`}
                   >
                     {cat}
                   </button>
                 ))}
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {filteredTemplates.map((t, i) => (
                <button key={i} type="button" onClick={() => applyTemplate(t)} className="flex flex-col items-start gap-1 px-3 py-2 rounded-xl bg-[var(--bg-panel)] border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--bg-element)] transition-all min-w-[140px] max-w-[140px] text-left group h-full">
                  <span className="text-[10px] font-bold text-[var(--text-heading)] group-hover:text-[var(--accent)] truncate w-full">{t.name}</span>
                  <span className="text-[9px] text-[var(--text-muted)] line-clamp-2 leading-tight">{t.description}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <VersionHistory versions={editingPrompt?.versions || []} onRevert={revertToVersion} onDelete={deleteVersion} />

            <div className="flex flex-col gap-3 pt-2">
              <div className="flex gap-3">
                <button type="button" onClick={handleSaveTemplateClick} className="flex-1 py-4 rounded-[1.5rem] bg-[var(--bg-element)] text-[var(--text-heading)] font-black uppercase tracking-wider hover:bg-[var(--bg-element-hover)] transition-all border border-[var(--border)] flex items-center justify-center gap-2 text-[10px]"><Save size={16} /> Save as Template</button>
                <button type="button" onClick={handleExportJson} className="flex-1 py-4 rounded-[1.5rem] bg-[var(--bg-element)] text-[var(--text-heading)] font-black uppercase tracking-wider hover:bg-[var(--bg-element-hover)] transition-all border border-[var(--border)] flex items-center justify-center gap-2 text-[10px]"><Download size={16} /> Export JSON</button>
              </div>
              <button type="submit" className="w-full py-5 rounded-[2rem] bg-[var(--accent)] text-white font-black uppercase tracking-[0.2em] hover:bg-[var(--accent-hover)] transition-all shadow-xl shadow-[var(--accent)]/30">Commit Persona Node</button>
            </div>
          </form>
        </div>
      </Modal>
  );
};
