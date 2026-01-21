
import React, { useState } from 'react';
import { UserProfile } from './types';
import { 
  Check, Globe, Code, Terminal, Activity, 
  Target, Cpu, Shield, Zap, Info, ChevronRight, ChevronLeft,
  Layers, Lock, Database, Layout, PenTool, Plus, X as XIcon
} from 'lucide-react';

interface OnboardingWizardProps {
  onComplete: (profile: UserProfile) => void;
}

const INITIAL_PROFILE: UserProfile = {
  onboardingStatus: 'incomplete',
  createdAt: '',
  identity: {
    role: 'Full Stack Dev',
    expertise: 'Senior',
    preferredStack: ['React', 'TypeScript']
  },
  preferences: {
    globalContext: '',
    autoSave: true,
    privacyMode: 'Local'
  }
};

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState<UserProfile>(INITIAL_PROFILE);
  const [animDirection, setAnimDirection] = useState<'forward' | 'backward'>('forward');

  const updateProfile = (section: keyof UserProfile, update: any) => {
    setProfile(prev => ({
      ...prev,
      [section]: { ...prev[section as any], ...update }
    }));
  };

  const nextStep = () => {
    setAnimDirection('forward');
    setStep(prev => prev + 1);
  };

  const prevStep = () => {
    setAnimDirection('backward');
    setStep(prev => prev - 1);
  };

  const handleFinish = () => {
    const finalProfile = {
      ...profile,
      onboardingStatus: 'complete' as const,
      createdAt: new Date().toISOString()
    };
    onComplete(finalProfile);
  };

  const renderStep = () => {
    switch(step) {
      case 0: return <WelcomeStep onNext={nextStep} />;
      case 1: return <IdentityStep profile={profile} updateProfile={updateProfile} />;
      case 2: return <StackStep profile={profile} updateProfile={updateProfile} />;
      case 3: return <ContextStep profile={profile} updateProfile={updateProfile} />;
      case 4: return <ReviewStep profile={profile} onFinish={handleFinish} onEdit={(s) => setStep(s)} />;
      default: return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020617] text-white overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/20 via-black to-slate-900/40" />
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
        <div 
          className="h-full bg-[var(--accent)] transition-all duration-700 ease-out" 
          style={{ width: `${(step / 4) * 100}%` }} 
        />
      </div>

      <div className="relative w-full max-w-4xl p-6 md:p-12">
        <div className={`transition-all duration-500 transform ${animDirection === 'forward' ? 'animate-in slide-in-from-right-8 fade-in' : 'animate-in slide-in-from-left-8 fade-in'}`}>
          {renderStep()}
        </div>

        {step > 0 && step < 4 && (
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-white/10">
            <button 
              onClick={prevStep} 
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-bold uppercase tracking-widest"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <button 
              onClick={nextStep} 
              className="flex items-center gap-2 px-8 py-3 bg-[var(--accent)] hover:bg-[var(--accent-hover)] rounded-full font-bold uppercase tracking-widest text-xs transition-all shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:scale-105"
            >
              Next Step <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const WelcomeStep = ({ onNext }: { onNext: () => void }) => (
  <div className="text-center space-y-8 max-w-2xl mx-auto">
    <div className="w-24 h-24 mx-auto rounded-3xl bg-[var(--accent)] flex items-center justify-center shadow-[0_0_40px_rgba(79,70,229,0.4)] mb-8">
      <Zap size={48} className="text-white" />
    </div>
    <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight">
      Initialize <br/>
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--accent)] to-indigo-300">Neural Interface</span>
    </h1>
    <p className="text-lg text-slate-400 leading-relaxed font-medium">
      PromptForge Pro is a high-fidelity IDE for LLM engineering. Let's calibrate the models to your specific technical expertise and stack.
    </p>
    <div className="pt-8">
      <button 
        onClick={onNext}
        className="group relative px-10 py-5 bg-white text-black rounded-full font-black text-sm uppercase tracking-[0.2em] hover:scale-105 transition-transform"
      >
        Begin Calibration
        <div className="absolute inset-0 rounded-full border border-white opacity-50 animate-ping" />
      </button>
      <p className="mt-4 text-[10px] text-slate-600 font-bold uppercase tracking-widest">System Check: Ready</p>
    </div>
  </div>
);

const IdentityStep = ({ profile, updateProfile }: { profile: UserProfile, updateProfile: any }) => {
  const roles = [
    { id: 'Full Stack Dev', icon: Layers }, 
    { id: 'Frontend Dev', icon: Layout }, 
    { id: 'Backend Dev', icon: Database }, 
    { id: 'Data Scientist', icon: Activity },
    { id: 'Product Designer', icon: PenTool }, 
    { id: 'Prompt Engineer', icon: Terminal }
  ];

  return (
    <div className="space-y-8">
      <Header 
        step="01" 
        title="Operative Identity" 
        subtitle="Define your role to tailor technical responses." 
      />

      <div className="space-y-6">
        <div className="space-y-4">
           <Label icon={<Target size={14} />} text="Primary Role" />
           <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {roles.map(r => (
                <button
                  key={r.id}
                  onClick={() => updateProfile('identity', { role: r.id })}
                  className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all ${profile.identity.role === r.id ? 'bg-[var(--accent)] border-[var(--accent)] text-white shadow-lg' : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500'}`}
                >
                  <r.icon size={20} />
                  <span className="text-[10px] font-bold uppercase text-center">{r.id}</span>
                </button>
              ))}
           </div>
        </div>

        <div className="space-y-4">
          <Label icon={<Activity size={14} />} text="Expertise Level" />
          <div className="grid grid-cols-3 gap-4">
            {['Junior', 'Senior', 'Staff/Principal'].map(level => (
               <button
                 key={level}
                 onClick={() => updateProfile('identity', { expertise: level })}
                 className={`py-3 rounded-xl border text-xs font-bold uppercase tracking-wider transition-all ${profile.identity.expertise === level ? 'bg-white text-black border-white' : 'bg-transparent border-slate-700 text-slate-500 hover:text-white'}`}
               >
                 {level}
               </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const StackStep = ({ profile, updateProfile }: { profile: UserProfile, updateProfile: any }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [customVal, setCustomVal] = useState('');

  const toggleStack = (tech: string) => {
    const current = profile.identity.preferredStack;
    const next = current.includes(tech) ? current.filter(t => t !== tech) : [...current, tech];
    updateProfile('identity', { preferredStack: next });
  };

  const handleAddCustom = () => {
    if (customVal.trim()) {
      toggleStack(customVal.trim());
    }
    setCustomVal('');
    setIsAdding(false);
  };

  const defaultTechs = ['React', 'TypeScript', 'Python', 'Node.js', 'Go', 'Rust', 'AWS', 'Tailwind', 'Next.js', 'PostgreSQL', 'TensorFlow', 'Figma'];
  
  // Combine defaults with current selection to ensure custom added ones remain visible as buttons
  const displayTechs = Array.from(new Set([...defaultTechs, ...profile.identity.preferredStack]));

  return (
    <div className="space-y-8">
      <Header 
        step="02" 
        title="Tech Matrix" 
        subtitle="Select your preferred technologies for context injection." 
      />

      <div className="space-y-6">
         <Label icon={<Cpu size={14} />} text="Active Stack" />
         <div className="flex flex-wrap gap-3">
            {displayTechs.map(t => (
               <button
                 key={t}
                 onClick={() => toggleStack(t)}
                 className={`px-4 py-2.5 rounded-lg border text-xs font-bold font-mono transition-all ${profile.identity.preferredStack.includes(t) ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-sm shadow-emerald-500/10' : 'bg-slate-900 text-slate-400 border-slate-700 hover:border-slate-500'}`}
               >
                 {t}
               </button>
            ))}
            
            {isAdding ? (
              <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-200">
                <input 
                  autoFocus
                  type="text" 
                  className="px-4 py-2.5 rounded-lg border border-slate-600 bg-slate-800 text-white text-xs font-bold font-mono outline-none focus:border-[var(--accent)] w-32 shadow-lg"
                  placeholder="Tech name..."
                  value={customVal}
                  onChange={(e) => setCustomVal(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddCustom();
                    if (e.key === 'Escape') setIsAdding(false);
                  }}
                  onBlur={() => {
                    // Slight delay to allow clicks on cancel button if we added one, 
                    // but standard behavior here is usually confirm on blur for tags.
                    handleAddCustom();
                  }}
                />
              </div>
            ) : (
              <button 
                onClick={() => setIsAdding(true)}
                className="px-4 py-2.5 rounded-lg border border-dashed border-slate-700 text-slate-500 text-xs font-bold hover:text-slate-300 transition-all hover:border-slate-500 hover:bg-slate-800 flex items-center gap-1"
              >
                <Plus size={14} /> Add Custom
              </button>
            )}
         </div>
         
         <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs leading-relaxed">
            <Info size={16} className="inline mr-2 mb-0.5" />
            Selected technologies will be automatically prioritized in code generation tasks.
         </div>
      </div>
    </div>
  );
};

const ContextStep = ({ profile, updateProfile }: { profile: UserProfile, updateProfile: any }) => {
  return (
    <div className="space-y-8">
      <Header 
        step="03" 
        title="Global Context" 
        subtitle="Set system-wide instructions that apply to every session." 
      />

      <div className="space-y-6">
        <div className="space-y-3">
           <Label icon={<Globe size={14} />} text="System Directive" />
           <textarea 
             className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm focus:border-[var(--accent)] outline-none font-mono text-slate-300"
             placeholder="e.g., Always use strict TypeScript types. Prefer functional programming patterns. Be concise and avoid conversational filler."
             value={profile.preferences.globalContext}
             onChange={(e) => updateProfile('preferences', { globalContext: e.target.value })}
           />
        </div>

        <div className="space-y-4">
           <Label icon={<Shield size={14} />} text="Data Protocol" />
           <div className="flex gap-4">
              <button 
                onClick={() => updateProfile('preferences', { privacyMode: 'Local' })}
                className={`flex-1 p-4 rounded-xl border text-left transition-all ${profile.preferences.privacyMode === 'Local' ? 'bg-[var(--accent)]/10 border-[var(--accent)]' : 'bg-slate-900 border-slate-800'}`}
              >
                 <Lock size={16} className="mb-2 text-slate-400" />
                 <div className="font-bold text-sm">Local Storage</div>
                 <div className="text-[10px] text-slate-500 mt-1">Data persists only on this device.</div>
              </button>
              <button 
                 onClick={() => updateProfile('preferences', { privacyMode: 'Cloud' })}
                 className={`flex-1 p-4 rounded-xl border text-left transition-all ${profile.preferences.privacyMode === 'Cloud' ? 'bg-[var(--accent)]/10 border-[var(--accent)]' : 'bg-slate-900 border-slate-800 opacity-50 cursor-not-allowed'}`}
                 disabled
              >
                 <Globe size={16} className="mb-2 text-slate-400" />
                 <div className="font-bold text-sm">Cloud Sync</div>
                 <div className="text-[10px] text-slate-500 mt-1">Coming in Pro Tier.</div>
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

const ReviewStep = ({ profile, onFinish, onEdit }: { profile: UserProfile, onFinish: () => void, onEdit: (s: number) => void }) => {
  return (
    <div className="space-y-8">
       <div className="text-center space-y-2 mb-8">
          <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500 mb-4 animate-in zoom-in duration-500">
            <Check size={32} />
          </div>
          <h2 className="text-2xl font-black">Interface Calibrated</h2>
          <p className="text-slate-400 text-sm">Review your configuration before boot.</p>
       </div>

       <div className="space-y-4">
          <ReviewCard 
            title="Identity" 
            onEdit={() => onEdit(1)}
            items={[
              { label: 'Role', val: profile.identity.role },
              { label: 'Level', val: profile.identity.expertise }
            ]}
          />
          <ReviewCard 
            title="Stack" 
            onEdit={() => onEdit(2)}
            items={[
              { label: 'Tech', val: profile.identity.preferredStack.join(', ') || 'None' }
            ]}
          />
          <ReviewCard 
            title="System" 
            onEdit={() => onEdit(3)}
            items={[
              { label: 'Storage', val: profile.preferences.privacyMode },
              { label: 'Context', val: profile.preferences.globalContext ? 'Active' : 'Empty' }
            ]}
          />
       </div>

       <button 
        onClick={onFinish}
        className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-emerald-400 transition-colors shadow-xl mt-4"
      >
        Initialize IDE
      </button>
    </div>
  );
};

// UI Helpers
const Header = ({ step, title, subtitle }: { step: string, title: string, subtitle: string }) => (
  <div className="space-y-2">
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-black text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-1 rounded border border-[var(--accent)]/20">STEP {step}</span>
      <h2 className="text-2xl font-bold">{title}</h2>
    </div>
    <p className="text-slate-400 text-sm leading-relaxed">{subtitle}</p>
  </div>
);

const Label = ({ icon, text }: { icon: React.ReactNode, text: string }) => (
  <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
    {icon} {text}
  </label>
);

const ReviewCard = ({ title, items, onEdit }: { title: string, items: {label: string, val: string}[], onEdit: () => void }) => (
  <div className="p-5 rounded-2xl bg-slate-900/50 border border-slate-800 flex items-start justify-between group hover:border-slate-600 transition-colors">
     <div className="space-y-3">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-500">{title}</h4>
        <div className="space-y-1">
          {items.map((i, idx) => (
            <div key={idx} className="text-sm">
               <span className="text-slate-500 mr-2">{i.label}:</span>
               <span className="font-medium text-white">{i.val}</span>
            </div>
          ))}
        </div>
     </div>
     <button onClick={onEdit} className="p-2 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-colors">
       <Info size={16} />
     </button>
  </div>
);
