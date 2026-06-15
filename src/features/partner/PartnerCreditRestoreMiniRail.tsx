import React from 'react';
import { ArrowRight } from 'lucide-react';

type PartnerTabKey = 'overview' | 'reports' | 'analysis' | 'evidence' | 'disputes' | 'letters' | 'tasks' | 'notes' | 'debt';

type Step = {
  id: string;
  label: string;
  done: boolean;
  tab: PartnerTabKey;
};

type Props = {
  reportsCount: number;
  evidenceCount: number;
  lettersCount: number;
  onOpenTab: (tab: PartnerTabKey) => void;
};

export function PartnerCreditRestoreMiniRail({ reportsCount, evidenceCount, lettersCount, onOpenTab }: Props) {
  const steps: Step[] = [
    { id: 'report', label: 'Report', done: reportsCount > 0, tab: 'reports' },
    { id: 'evidence', label: 'Evidence', done: evidenceCount > 0, tab: 'evidence' },
    { id: 'letters', label: 'Letters', done: lettersCount > 0, tab: 'disputes' },
  ];

  return (
    <div className="sticky top-14 z-30 rounded-xl border border-white/[0.08] bg-fc-shell/95 backdrop-blur-md px-3 py-2 shadow-lg">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-300/90 shrink-0">Restore</span>
        {steps.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => onOpenTab(s.tab)}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-semibold transition-colors ${
              s.done
                ? 'border-emerald-500/35 bg-emerald-500/10 text-emerald-200'
                : 'border-amber-500/30 bg-amber-500/10 text-amber-200 hover:bg-amber-500/15'
            }`}
          >
            {s.label}
            {!s.done ? <ArrowRight size={12} /> : null}
          </button>
        ))}
      </div>
    </div>
  );
}
