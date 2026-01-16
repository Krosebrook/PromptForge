import React, { useMemo } from 'react';
import { Clock, RotateCcw, ChevronRight, FileText, Calendar, Trash2 } from 'lucide-react';
import { PersonaVersion } from './types';

interface VersionHistoryProps {
  versions: PersonaVersion[];
  onRevert: (version: PersonaVersion) => void;
  onDelete: (index: number) => void;
}

// Improvement: Extracted EmptyState for better readability and separation of concerns.
const EmptyState = () => (
  <div className="mt-8 p-8 border-2 border-dashed border-[var(--border)] rounded-3xl text-center">
    <Clock size={32} className="mx-auto text-[var(--text-muted)] opacity-20 mb-3" />
    <p className="text-xs text-[var(--text-muted)] font-medium">No previous versions found for this persona.</p>
  </div>
);

interface VersionItemProps {
  version: PersonaVersion;
  originalIndex: number;
  onRevert: (version: PersonaVersion) => void;
  onDelete: (index: number) => void;
}

// Improvement: Extracted individual item to a sub-component to reduce render complexity of the parent
// and isolate per-item logic (like date formatting).
const VersionItem: React.FC<VersionItemProps> = ({ version, originalIndex, onRevert, onDelete }) => {
  // Improvement: Date formatting is isolated here.
  const dateString = new Date(version.timestamp).toLocaleString(undefined, { 
    dateStyle: 'medium', 
    timeStyle: 'short' 
  });

  return (
    <div 
      className="group relative flex flex-col p-4 rounded-2xl bg-[var(--bg-element)]/30 border border-[var(--border)] hover:border-[var(--accent)] hover:bg-[var(--bg-element)]/50 transition-all cursor-default"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--text-muted)]">
          <Calendar size={12} />
          {dateString}
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
           <button 
            type="button" 
            onClick={() => onRevert(version)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--accent)] text-white text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--accent-hover)] shadow-lg shadow-[var(--accent)]/20 transition-all"
          >
            <RotateCcw size={12} />
            Restore
          </button>
          <button 
            type="button" 
            onClick={() => onDelete(originalIndex)}
            className="p-1.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all"
            title="Delete version"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-[var(--bg-panel)] border border-[var(--border)] text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors">
          <FileText size={14} />
        </div>
        <div className="flex-1 min-w-0">
          <h5 className="text-sm font-bold text-[var(--text-heading)] truncate mb-0.5">
            {version.act}
          </h5>
          <p className="text-xs text-[var(--text-muted)] line-clamp-1 italic">
            {version.description || 'No summary provided for this revision.'}
          </p>
        </div>
      </div>
      
      <div className="mt-3 text-[11px] text-[var(--text-muted)] bg-[var(--bg-panel)]/50 p-3 rounded-xl font-mono line-clamp-2 leading-relaxed border border-transparent group-hover:border-[var(--border)] overflow-hidden">
        {version.prompt}
      </div>

      <div className="absolute right-4 bottom-4 text-[var(--accent)] opacity-0 group-hover:opacity-10 transition-opacity">
         <ChevronRight size={32} />
      </div>
    </div>
  );
};

// Improvement: Removed React.FC in favor of direct function declaration for better default props/generics support.
export const VersionHistory = ({ versions, onRevert, onDelete }: VersionHistoryProps) => {
  if (!versions || versions.length === 0) {
    return <EmptyState />;
  }

  // Improvement: useMemo prevents recalculating the array structure on every render.
  // We map the original index *before* reversing so deletions target the correct item in the original array.
  const displayVersions = useMemo(() => {
    return versions.map((v, index) => ({ ...v, originalIndex: index })).reverse();
  }, [versions]);

  return (
    <div className="mt-8 pt-6 border-t border-[var(--border)] animate-in fade-in slide-in-from-top-4 duration-500">
      <div className="flex items-center justify-between mb-4 px-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)]">
            <Clock size={16} />
          </div>
          <h4 className="text-xs font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">
            Revision History
          </h4>
        </div>
        <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--bg-element)] px-2 py-1 rounded-md uppercase tracking-wider">
          {versions.length} {versions.length === 1 ? 'Snapshot' : 'Snapshots'}
        </span>
      </div>

      <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar pb-4">
        {displayVersions.map((v) => (
          <VersionItem 
            key={v.timestamp} 
            version={v} 
            originalIndex={v.originalIndex} 
            onRevert={onRevert} 
            onDelete={onDelete} 
          />
        ))}
      </div>
      
      <p className="mt-4 text-[9px] text-[var(--text-muted)] text-center font-medium italic opacity-60">
        * Restoring a snapshot will overwrite current editor contents. It is recommended to save your current work first.
      </p>
    </div>
  );
};