
import React, { useMemo } from 'react';
import { Clock, RotateCcw, ChevronRight, FileText, Calendar, Trash2, GitCommit, Tag } from 'lucide-react';
import { PersonaVersion } from './types';

interface VersionHistoryProps {
  versions: PersonaVersion[];
  onRevert: (version: PersonaVersion) => void;
  onDelete: (index: number) => void;
}

const EmptyState = () => (
  <div className="py-12 px-6 border-2 border-dashed border-[var(--border)] rounded-3xl text-center bg-[var(--bg-panel)]/30">
    <div className="w-16 h-16 mx-auto rounded-full bg-[var(--bg-element)] flex items-center justify-center mb-4 text-[var(--text-muted)]">
      <HistoryIcon size={32} opacity={0.5} />
    </div>
    <h5 className="text-sm font-bold text-[var(--text-heading)] mb-1">No Snapshots Yet</h5>
    <p className="text-xs text-[var(--text-muted)] font-medium max-w-[200px] mx-auto">
      Create a snapshot above to save the current state of your persona.
    </p>
  </div>
);

const HistoryIcon = ({ size, opacity }: { size: number, opacity?: number }) => (
  <Clock size={size} style={{ opacity }} />
);

interface VersionItemProps {
  version: PersonaVersion;
  originalIndex: number;
  onRevert: (version: PersonaVersion) => void;
  onDelete: (index: number) => void;
  isLast: boolean;
}

const VersionItem: React.FC<VersionItemProps> = ({ version, originalIndex, onRevert, onDelete, isLast }) => {
  const dateObj = new Date(version.timestamp);
  const dateString = dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const timeString = dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="relative pl-8 pb-8 group">
      {/* Timeline Connector */}
      {!isLast && (
        <div className="absolute left-[11px] top-8 bottom-0 w-px bg-[var(--border)] group-hover:bg-[var(--accent)]/30 transition-colors" />
      )}
      
      {/* Timeline Dot */}
      <div className="absolute left-0 top-1 w-[22px] h-[22px] rounded-full bg-[var(--bg-app)] border-2 border-[var(--border)] group-hover:border-[var(--accent)] transition-colors flex items-center justify-center z-10">
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] group-hover:bg-[var(--accent)] transition-colors" />
      </div>

      <div className="flex flex-col gap-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-black text-[var(--text-heading)]">{version.act}</span>
              <span className="text-[9px] font-mono text-[var(--text-muted)] bg-[var(--bg-element)] px-1.5 py-0.5 rounded border border-[var(--border)]">
                {dateString} • {timeString}
              </span>
            </div>
            {version.description && (
              <p className="text-[10px] text-[var(--text-muted)] font-medium italic">
                "{version.description}"
              </p>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              type="button" 
              onClick={() => onRevert(version)}
              className="p-2 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white transition-all"
              title="Restore this version"
            >
              <RotateCcw size={14} />
            </button>
            <button 
              type="button" 
              onClick={() => onDelete(originalIndex)}
              className="p-2 rounded-lg hover:bg-red-500/10 hover:text-red-500 text-[var(--text-muted)] transition-all"
              title="Delete snapshot"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        {/* Content Preview */}
        <div className="p-3 rounded-xl bg-[var(--bg-element)]/50 border border-[var(--border)] group-hover:border-[var(--accent)]/30 transition-all">
          <p className="text-[10px] text-[var(--text-muted)] font-mono line-clamp-2 leading-relaxed opacity-80">
            {version.prompt}
          </p>
        </div>

        {/* Tags */}
        {version.tags && version.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-1">
            <Tag size={10} className="text-[var(--text-muted)] mt-0.5" />
            {version.tags.map(tag => (
              <span key={tag} className="text-[9px] text-[var(--text-muted)] hover:text-[var(--text-body)] transition-colors">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const VersionHistory: React.FC<VersionHistoryProps> = ({ versions, onRevert, onDelete }) => {
  if (!versions || versions.length === 0) {
    return <EmptyState />;
  }

  const displayVersions = useMemo(() => {
    return versions.map((v, index) => ({ ...v, originalIndex: index })).reverse();
  }, [versions]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="flex items-center justify-between mb-6">
         <h4 className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest flex items-center gap-2">
            <GitCommit size={14} /> Version Timeline
         </h4>
         <span className="px-2 py-0.5 rounded-md bg-[var(--bg-element)] border border-[var(--border)] text-[9px] font-mono text-[var(--text-muted)]">
            {versions.length} Total
         </span>
      </div>
      
      <div className="relative pl-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
        {displayVersions.map((v, idx) => (
          <VersionItem 
            key={v.timestamp} 
            version={v} 
            originalIndex={v.originalIndex} 
            onRevert={onRevert} 
            onDelete={onDelete} 
            isLast={idx === displayVersions.length - 1}
          />
        ))}
      </div>
    </div>
  );
};
