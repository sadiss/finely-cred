import React from 'react';
import { CheckCircle2, Circle, AlertTriangle } from 'lucide-react';
import type { LetterAgentChainStep } from '../../lib/letterAgentChain';

export function LetterAgentChainStrip({ steps }: { steps: LetterAgentChainStep[] }) {
  return (
    <div className="fc-senior-simple rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 space-y-3">
      <div className="text-[10px] uppercase tracking-widest text-white/45">Before you mail</div>
      <div className="space-y-2">
        {steps.map((step, i) => (
          <div key={step.id} className="flex items-start gap-3 text-sm">
            {step.status === 'done' ? (
              <CheckCircle2 size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            ) : step.status === 'blocked' ? (
              <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <Circle size={18} className="text-white/30 shrink-0 mt-0.5" />
            )}
            <div className="min-w-0">
              <div className="text-white/90 font-medium">
                {i + 1}. {step.label}
                <span className="text-white/40 font-normal"> · {step.agent}</span>
              </div>
              <div className="text-white/55 text-xs mt-0.5">{step.detail}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
