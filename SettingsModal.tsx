
import React, { useState } from 'react';
import { Modal } from './Modal';
import { SimulationSettings } from './types';
import { THEMES } from './constants';
import { Palette, BrainCircuit, Sliders, ChevronDown, CheckCircle2, RefreshCw, Gauge, Hash, Cpu } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SimulationSettings;
  onSettingsChange: (settings: SimulationSettings) => void;
  target: 'primary' | 'secondary';
  currentThemeId: string;
  onThemeChange: (id: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
  target,
  currentThemeId,
  onThemeChange
}) => {
  const [activeTab, setActiveTab] = useState<'theme' | 'model' | 'params'>('theme');

  // Helper to update a specific setting
  const updateSetting = <K extends keyof SimulationSettings>(key: K, value: SimulationSettings[K]) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Simulation Config (${target === 'primary' ? 'A' : 'B'})`}>
      {/* Tabs Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-1 p-1 mb-6 bg-[var(--bg-element)]/50 rounded-xl border border-[var(--border)] shrink-0">
        <button 
          onClick={() => setActiveTab('theme')} 
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${activeTab === 'theme' ? 'bg-[var(--bg-panel)] text-[var(--text-heading)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'}`}
        >
          <Palette size={14} /> Theme
        </button>
        <button 
          onClick={() => setActiveTab('model')} 
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${activeTab === 'model' ? 'bg-[var(--bg-panel)] text-[var(--text-heading)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'}`}
        >
          <BrainCircuit size={14} /> Model Architecture
        </button>
        <button 
          onClick={() => setActiveTab('params')} 
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-2 text-[10px] sm:text-xs font-bold rounded-lg transition-all ${activeTab === 'params' ? 'bg-[var(--bg-panel)] text-[var(--text-heading)] shadow-sm' : 'text-[var(--text-muted)] hover:text-[var(--text-body)]'}`}
        >
          <Sliders size={14} /> Advanced Parameters
        </button>
      </div>

      <div className="space-y-6 min-h-[350px]">
        {activeTab === 'theme' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 rounded-2xl bg-[var(--bg-element)]/30 border border-[var(--border)] text-xs text-[var(--text-muted)] leading-relaxed flex gap-3">
              <div className="p-2 bg-[var(--bg-panel)] rounded-lg h-fit"><Palette size={16} className="text-[var(--accent)]"/></div>
              <div>
                <strong className="text-[var(--text-heading)] block mb-1">Visual Interface</strong>
                Select a color scheme that suits your environment and reduces eye strain during prolonged coding sessions.
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3">
              {THEMES.map(theme => (
                <button key={theme.id} onClick={() => onThemeChange(theme.id)} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${currentThemeId === theme.id ? 'bg-[var(--accent)]/10 border-[var(--accent)] ring-1 ring-[var(--accent)]' : 'bg-[var(--bg-element)] border-[var(--border)] hover:border-[var(--accent)]/50'}`}>
                  <div className="w-10 h-10 rounded-lg shadow-sm border border-[var(--border)] relative overflow-hidden" style={{ backgroundColor: theme.colors['--bg-panel'] }}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-6 h-1 rounded-full" style={{ backgroundColor: theme.colors['--accent'] }}></div>
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <span className="text-sm font-bold block text-[var(--text-heading)]">{theme.name}</span>
                    <span className="text-[10px] text-[var(--text-muted)]">High contrast professional theme</span>
                  </div>
                  {currentThemeId === theme.id && <div className="p-1 bg-[var(--accent)] rounded-full text-white"><CheckCircle2 size={14} /></div>}
                </button>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'model' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 rounded-2xl bg-[var(--bg-element)]/30 border border-[var(--border)] text-xs text-[var(--text-muted)] leading-relaxed flex gap-3">
              <div className="p-2 bg-[var(--bg-panel)] rounded-lg h-fit"><Cpu size={16} className="text-[var(--accent)]"/></div>
              <div>
                <strong className="text-[var(--text-heading)] block mb-1">Reasoning Core</strong>
                Choose the primary intelligence engine. <strong>Gemini 3 Pro</strong> is recommended for high-stakes logic, while Flash offers superior speed.
              </div>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-widest ml-1 flex items-center gap-2">Active Model</label>
              <div className="relative group">
                <select 
                  className="w-full px-5 py-4 rounded-2xl bg-[var(--bg-element)] border border-[var(--border)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] text-sm font-bold appearance-none cursor-pointer text-[var(--text-body)] transition-all group-hover:border-[var(--accent)]/50"
                  value={settings.model}
                  onChange={(e) => updateSetting('model', e.target.value)}
                >
                  <option value="gemini-3-flash-preview">Gemini 3 Flash (High Concurrency)</option>
                  <option value="gemini-3-pro-preview">Gemini 3 Pro (SOTA Reasoning)</option>
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--text-muted)]">
                  <ChevronDown size={18} />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-[var(--border)] bg-[var(--bg-panel)] space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--text-heading)]">
                <BrainCircuit size={14} className="text-[var(--accent)]" />
                {settings.model.includes('pro') ? 'Gemini 3 Pro Specs' : 'Gemini 3 Flash Specs'}
              </div>
              <ul className="text-[10px] text-[var(--text-muted)] space-y-2 ml-1 leading-relaxed">
                {settings.model.includes('pro') ? (
                  <>
                    <li className="flex gap-2"><CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> Advanced multi-step reasoning capabilities for complex problem solving.</li>
                    <li className="flex gap-2"><CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> Superior instruction following for nuanced persona simulation.</li>
                    <li className="flex gap-2"><CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> Extended context window and reasoning budget (32k tokens).</li>
                  </>
                ) : (
                  <>
                    <li className="flex gap-2"><CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> Sub-second response latency for real-time interactive chat.</li>
                    <li className="flex gap-2"><CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> Optimized for rapid iterative persona development and testing.</li>
                    <li className="flex gap-2"><CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> High throughput for standard text generation tasks.</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'params' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="p-4 rounded-2xl bg-[var(--bg-element)]/30 border border-[var(--border)] text-xs text-[var(--text-muted)] leading-relaxed flex gap-3">
              <div className="p-2 bg-[var(--bg-panel)] rounded-lg h-fit"><Sliders size={16} className="text-[var(--accent)]"/></div>
              <div>
                <strong className="text-[var(--text-heading)] block mb-1">Hyperparameters</strong>
                Fine-tune the stochasticity and token selection strategies of the model.
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold flex items-center gap-2" title="Controls randomness: lower is more deterministic, higher is more creative."><RefreshCw size={14} className="text-blue-400" /> Temperature</label>
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-[var(--bg-element)] rounded-lg text-[var(--text-heading)]">{settings.temperature.toFixed(1)}</span>
                </div>
                <input type="range" min="0" max="2" step="0.1" value={settings.temperature} onChange={(e) => updateSetting('temperature', parseFloat(e.target.value))} className="w-full h-1.5 bg-[var(--bg-element)] rounded-lg appearance-none cursor-pointer accent-[var(--accent)] hover:accent-[var(--accent-hover)]" />
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] font-medium px-1">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-[var(--border)]/50">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold flex items-center gap-2" title="Nucleus sampling: filters tokens whose cumulative probability exceeds P."><Gauge size={14} className="text-emerald-400" /> Top P</label>
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-[var(--bg-element)] rounded-lg text-[var(--text-heading)]">{settings.topP.toFixed(2)}</span>
                </div>
                <input type="range" min="0" max="1" step="0.01" value={settings.topP} onChange={(e) => updateSetting('topP', parseFloat(e.target.value))} className="w-full h-1.5 bg-[var(--bg-element)] rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-600" />
              </div>

              <div className="space-y-3 pt-4 border-t border-[var(--border)]/50">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold flex items-center gap-2" title="Limits selection to the top K most likely tokens."><Hash size={14} className="text-orange-400" /> Top K</label>
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-[var(--bg-element)] rounded-lg text-[var(--text-heading)]">{settings.topK}</span>
                </div>
                <input type="range" min="1" max="100" step="1" value={settings.topK} onChange={(e) => updateSetting('topK', parseInt(e.target.value))} className="w-full h-1.5 bg-[var(--bg-element)] rounded-lg appearance-none cursor-pointer accent-orange-500 hover:accent-orange-600" />
              </div>

              <div className="space-y-3 pt-4 border-t border-[var(--border)]/50">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold flex items-center gap-2" title="The number of tokens the model uses to 'think' internally before providing a response."><BrainCircuit size={14} className="text-purple-400" /> Thinking Budget</label>
                  <span className="text-xs font-mono font-bold px-2 py-1 bg-[var(--bg-element)] rounded-lg text-[var(--text-heading)]">{settings.thinkingBudget}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max={settings.model.includes('pro') ? 32768 : 24576} 
                  step="128" 
                  value={settings.thinkingBudget} 
                  onChange={(e) => updateSetting('thinkingBudget', parseInt(e.target.value))} 
                  className="w-full h-1.5 bg-[var(--bg-element)] rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-600" 
                />
                <div className="flex justify-between text-[10px] text-[var(--text-muted)] italic px-1">
                  <span>Concise Reasoning</span>
                  <span>Deep Chain-of-Thought</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <button onClick={onClose} className="w-full py-4 mt-6 rounded-xl bg-[var(--accent)] text-white font-bold shadow-lg shadow-[var(--accent)]/20 hover:bg-[var(--accent-hover)] transition-all">Apply Configuration</button>
    </Modal>
  );
};
