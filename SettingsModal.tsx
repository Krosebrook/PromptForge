
import React, { useState } from 'react';
import { Modal } from './Modal';
import { SimulationSettings, UserProfile } from './types';
import { THEMES } from './constants';
import { Palette, BrainCircuit, Sliders, ChevronDown, CheckCircle2, RefreshCw, Gauge, Hash, Cpu, LayoutTemplate, User, Shield, Briefcase, Zap, Terminal, Code, Globe, Info } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SimulationSettings;
  onSettingsChange: (settings: SimulationSettings) => void;
  target: 'primary' | 'secondary';
  currentThemeId: string;
  onThemeChange: (id: string) => void;
  userProfile?: UserProfile | null;
  onResetProfile?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  target,
  currentThemeId,
  onThemeChange,
  userProfile,
  onResetProfile
}) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'model' | 'params' | 'identity'>('theme');

  const updateSetting = <K extends keyof SimulationSettings>(key: K, value: SimulationSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Simulation Config (${target === 'primary' ? 'A' : 'B'})`}>
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 p-1 mb-6 bg-[var(--bg-element)]/50 rounded-xl border border-[var(--border)] shrink-0">
        <button onClick={() => setActiveTab('theme')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${activeTab === 'theme' ? 'bg-[var(--bg-panel)] text-[var(--text-heading)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'}`}><Palette size={14} /> Theme</button>
        <button onClick={() => setActiveTab('model')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${activeTab === 'model' ? 'bg-[var(--bg-panel)] text-[var(--text-heading)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'}`}><BrainCircuit size={14} /> Model</button>
        <button onClick={() => setActiveTab('params')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${activeTab === 'params' ? 'bg-[var(--bg-panel)] text-[var(--text-heading)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'}`}><Sliders size={14} /> Params</button>
        {userProfile && <button onClick={() => setActiveTab('identity')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${activeTab === 'identity' ? 'bg-[var(--bg-panel)] text-[var(--text-heading)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'}`}><User size={14} /> Identity</button>}
      </div>

      <div className="space-y-6 min-h-[440px]">
        {activeTab === 'theme' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="grid grid-cols-1 gap-3">
              {THEMES.map(theme => (
                <button key={theme.id} onClick={() => onThemeChange(theme.id)} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${currentThemeId === theme.id ? 'bg-[var(--accent)]/10 border-[var(--accent)] ring-1 ring-[var(--accent)]' : 'bg-[var(--bg-element)] border-[var(--border)] hover:border-[var(--accent)]/50'}`}>
                  <div className="w-10 h-10 rounded-lg shadow-sm border border-[var(--border)] relative overflow-hidden" style={{ backgroundColor: theme.colors['--bg-panel'] }}>
                    <div className="absolute inset-0 flex items-center justify-center"><div className="w-6 h-1 rounded-full" style={{ backgroundColor: theme.colors['--accent'] }}></div></div>
                  </div>
                  <div className="flex-1 text-left"><span className="text-sm font-bold block text-[var(--text-heading)]">{theme.name}</span><span className="text-[10px] text-[var(--text-muted)]">High contrast interface</span></div>
                  {currentThemeId === theme.id && <div className="p-1 bg-[var(--accent)] rounded-full text-white"><CheckCircle2 size={14} /></div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'model' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1">Active Architecture</label>
              <div className="relative group">
                <select className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-bold appearance-none cursor-pointer text-[var(--text-body)] transition-all group-hover:border-[var(--accent)]/50" value={settings.model} onChange={(e) => updateSetting('model', e.target.value)}>
                  <option value="gemini-3-flash-preview">Gemini 3 Flash (Fast & Lean)</option>
                  <option value="gemini-3-pro-preview">Gemini 3 Pro (Complex Reasoning)</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]"><ChevronDown size={18} /></div>
              </div>
            </div>
            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-heading)]"><Info size={14} className="text-[var(--accent)]" /> Model Guidance</div>
              <p className="text-[10px] text-[var(--text-muted)] leading-relaxed"><strong>Flash</strong> is optimized for speed and large-scale interactions. <strong>Pro</strong> is superior for multi-step logic, code architecture, and precise instruction following.</p>
            </div>
          </div>
        )}

        {activeTab === 'params' && (
          <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2 group cursor-help">
                    <RefreshCw size={14} className="text-blue-400" /> Temperature
                  </label>
                  <span className="text-[10px] font-mono font-bold px-2 py-1 bg-[var(--bg-element)] rounded-lg text-[var(--text-heading)]">{settings.temperature.toFixed(1)}</span>
                </div>
                <input type="range" min="0" max="2" step="0.1" value={settings.temperature} onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))} className="w-full h-1.5 bg-[var(--bg-element)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)]" />
                <p className="text-[9px] text-[var(--text-muted)] italic leading-tight">Lower = deterministic & factual. Higher = creative & experimental.</p>
              </div>

              <div className="pt-4 border-t border-[var(--border)] space-y-4">
                <h4 className="text-[10px] font-black text-[var(--text-heading)] uppercase tracking-wider flex items-center gap-2"><Sliders size={12} /> Probabilistic Logic</h4>
                
                <div className="space-y-4 pl-3 border-l-2 border-[var(--border)]">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2"><Gauge size={14} className="text-emerald-400" /> Top P (Nucleus)</label>
                      <span className="text-[10px] font-mono font-bold px-2 py-1 bg-[var(--bg-element)] rounded-lg text-[var(--text-heading)]">{settings.topP.toFixed(2)}</span>
                    </div>
                    <input type="range" min="0" max="1" step="0.01" value={settings.topP} onChange={(e) => updateSetting('topP', parseFloat(e.target.value))} className="w-full h-1.5 bg-[var(--bg-element)] rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                    <p className="text-[9px] text-[var(--text-muted)] italic leading-tight">Filters token pool by cumulative probability. Sharpens vocabulary focus.</p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2"><Hash size={14} className="text-orange-400" /> Top K</label>
                      <span className="text-[10px] font-mono font-bold px-2 py-1 bg-[var(--bg-element)] rounded-lg text-[var(--text-heading)]">{settings.topK}</span>
                    </div>
                    <input type="range" min="1" max="100" step="1" value={settings.topK} onChange={(e) => updateSetting('topK', parseInt(e.target.value))} className="w-full h-1.5 bg-[var(--bg-element)] rounded-lg appearance-none cursor-pointer accent-orange-500" />
                    <p className="text-[9px] text-[var(--text-muted)] italic leading-tight">Limits selection to the K most likely tokens. Prevents "hallucinating" rare words.</p>
                  </div>

                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)] flex items-center gap-2"><Cpu size={14} className="text-purple-400" /> Thinking Budget</label>
                      <span className="text-[10px] font-mono font-bold px-2 py-1 bg-[var(--bg-element)] rounded-lg text-[var(--text-heading)]">{settings.thinkingBudget}</span>
                    </div>
                    <input type="range" min="0" max={settings.model.includes('pro') ? 32768 : 24576} step="128" value={settings.thinkingBudget} onChange={(e) => updateSetting('thinkingBudget', parseInt(e.target.value))} className="w-full h-1.5 bg-[var(--bg-element)] rounded-lg appearance-none cursor-pointer accent-purple-500" />
                    <p className="text-[9px] text-[var(--text-muted)] italic leading-tight">Allocated tokens for internal reasoning steps. Essential for complex logic tasks.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center p-3 rounded-xl bg-[var(--bg-panel)] border border-[var(--border)]">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><Globe size={16} /></div>
                    <div className="text-xs font-bold text-[var(--text-heading)]">Web Grounding</div>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" className="sr-only peer" checked={settings.enableSearch ?? false} onChange={(e) => updateSetting('enableSearch', e.target.checked)} />
                   <div className="w-9 h-5 bg-[var(--bg-element)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500"></div>
                 </label>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'identity' && userProfile && (
           <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-3">
                 <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-panel)] border border-[var(--border)]">
                    <div className="flex items-center gap-3"><User size={16} className="text-[var(--text-muted)]" /><span className="text-xs font-bold text-[var(--text-heading)]">Role</span></div>
                    <span className="text-xs font-mono text-[var(--accent)] uppercase">{userProfile.identity.role}</span>
                 </div>
                 <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-panel)] border border-[var(--border)]">
                    <div className="flex items-center gap-3"><Shield size={16} className="text-[var(--text-muted)]" /><span className="text-xs font-bold text-[var(--text-heading)]">Expertise</span></div>
                    <span className="text-xs font-mono text-emerald-400">{userProfile.identity.expertise}</span>
                 </div>
              </div>
              <button onClick={onResetProfile} className="w-full py-4 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-all text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2"><RefreshCw size={14} /> Recalibrate Identity</button>
           </div>
        )}
      </div>
      {activeTab !== 'identity' && <button onClick={onClose} className="w-full py-5 mt-6 rounded-[2rem] bg-[var(--accent)] text-white font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all">Apply Config</button>}
    </Modal>
  );
};
