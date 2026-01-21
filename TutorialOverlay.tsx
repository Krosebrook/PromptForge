
import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

interface Step {
  id: string;
  title: string;
  content: string;
  selector: string | null;
}

interface TutorialOverlayProps {
  stepIndex: number;
  steps: Step[];
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  stepIndex,
  steps,
  onNext,
  onPrev,
  onClose
}) => {
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const currentStep = steps[stepIndex];

  const updatePosition = useCallback(() => {
    if (!currentStep.selector) {
      setTargetRect(null);
      return;
    }

    const element = document.querySelector(currentStep.selector);
    if (element) {
      const rect = element.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });
    } else {
      setTargetRect(null);
    }
  }, [currentStep]);

  useEffect(() => {
    updatePosition();
    window.addEventListener('resize', updatePosition);
    return () => window.removeEventListener('resize', updatePosition);
  }, [updatePosition]);

  // If no target, center on screen. If target, position below/near.
  const cardStyle: React.CSSProperties = targetRect
    ? {
        position: 'absolute',
        top: targetRect.top + targetRect.height + 16,
        left: targetRect.left + (targetRect.width / 2) - 160, // Center relative to target, assuming 320px width
        width: '320px',
        zIndex: 210,
      }
    : {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '400px',
        zIndex: 210,
      };

  // Ensure card stays on screen horizontally
  if (targetRect) {
      if ((cardStyle.left as number) < 20) cardStyle.left = 20;
      if ((cardStyle.left as number) + 320 > window.innerWidth) cardStyle.left = window.innerWidth - 340;
      
      // Flip to top if too close to bottom
      if ((cardStyle.top as number) + 200 > window.innerHeight) {
         cardStyle.top = targetRect.top - 200; // rough height estimate
      }
  }

  return (
    <div className="fixed inset-0 z-[200]">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500" />

      {/* Highlighter Box */}
      {targetRect && (
        <div
          className="absolute border-2 border-amber-400 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.4),0_0_20px_rgba(251,191,36,0.5)] transition-all duration-500 ease-in-out pointer-events-none"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
        />
      )}

      {/* Info Card */}
      <div
        className="flex flex-col bg-[#0f172a] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden transition-all duration-500 animate-in fade-in zoom-in-95"
        style={cardStyle}
      >
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/50">
          <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-400/10 text-amber-400 text-[10px]">
              {stepIndex + 1}
            </span>
            {currentStep.title}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-slate-300 leading-relaxed mb-6">
            {currentStep.content}
          </p>

          <div className="flex items-center justify-between">
            <button
              onClick={onPrev}
              disabled={stepIndex === 0}
              className={`flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors ${
                stepIndex === 0
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ChevronLeft size={14} /> Back
            </button>

            <div className="flex gap-1">
              {steps.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${idx === stepIndex ? 'bg-amber-400' : 'bg-slate-700'}`} 
                />
              ))}
            </div>

            <button
              onClick={onNext}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-400 text-black text-xs font-bold uppercase tracking-wider hover:bg-amber-300 transition-colors"
            >
              {stepIndex === steps.length - 1 ? 'Start Creating' : 'Continue'}
              {stepIndex !== steps.length - 1 && <ChevronRight size={14} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
