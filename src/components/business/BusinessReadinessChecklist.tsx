import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, Circle, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type ChecklistItem = {
  id: string;
  label: string;
  desc: string;
  category: 'Profile' | 'Compliance' | 'Vendors' | 'Funding';
  path?: string;
  externalHref?: string;
};

const STORAGE_KEY = 'finely.business.readiness.v1';

const ITEMS: ChecklistItem[] = [
  {
    id: 'profile_entity',
    category: 'Profile',
    label: 'Entity basics complete (EIN, SOS, ownership)',
    desc: 'The legal foundation for underwriting.',
    path: '/business/profile',
  },
  {
    id: 'profile_address_signals',
    category: 'Compliance',
    label: 'Address + web signals (domain email, website, 411)',
    desc: 'Consistency + legitimacy checks lenders use.',
    path: '/business/profile',
  },
  {
    id: 'docs_core',
    category: 'Compliance',
    label: 'Core docs staged (EIN letter, filings, banking)',
    desc: 'So you can respond fast when asked for proof.',
    path: '/business/documents',
  },
  {
    id: 'vendors_tier1',
    category: 'Vendors',
    label: 'Tier 1 reporting vendors opened',
    desc: 'Starter reporting accounts to begin bureau history.',
    path: '/business/vendors',
  },
  {
    id: 'vendors_tier2',
    category: 'Vendors',
    label: 'Tier 2 scaling accounts opened',
    desc: 'Move up after signals are clean + reporting begins.',
    path: '/business/vendors',
  },
  {
    id: 'vendors_tier3',
    category: 'Vendors',
    label: 'Tier 3 cards / fleet / cash accounts opened',
    desc: 'Deeper approvals once maturity and banking are strong.',
    path: '/business/vendors',
  },
  {
    id: 'funding_fit',
    category: 'Funding',
    label: 'Run Lender Logic (fit + next-best actions)',
    desc: 'Use the engine to model utilization/revenue/time changes.',
    path: '/business/lender-logic',
  },
];

function loadState(): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean> | null;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveState(state: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function BusinessReadinessChecklist({
  title = 'Readiness checklist',
  compact = false,
}: {
  title?: string;
  compact?: boolean;
}) {
  const navigate = useNavigate();
  const [state, setState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setState(loadState());
  }, []);

  const progress = useMemo(() => {
    const total = ITEMS.length;
    const done = ITEMS.filter((i) => state[i.id]).length;
    const pct = total ? Math.round((done / total) * 100) : 0;
    return { total, done, pct };
  }, [state]);

  const grouped = useMemo(() => {
    const m = new Map<ChecklistItem['category'], ChecklistItem[]>();
    for (const it of ITEMS) {
      m.set(it.category, [...(m.get(it.category) ?? []), it]);
    }
    return Array.from(m.entries());
  }, []);

  const toggle = (id: string) => {
    setState((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      saveState(next);
      return next;
    });
  };

  const open = (it: ChecklistItem) => {
    if (it.externalHref) window.open(it.externalHref, '_blank', 'noopener,noreferrer');
    else if (it.path) navigate(it.path);
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/40">{title}</div>
          <div className="mt-2 text-white font-semibold">
            {progress.done} / {progress.total} completed
          </div>
          <div className="mt-1 text-white/60 text-sm">Keep this tight and sequential; avoid premature applications.</div>
        </div>
        <div className="min-w-[220px]">
          <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-white/40">
            <span>Progress</span>
            <span className="text-white/70 font-mono">{progress.pct}%</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-amber-500" style={{ width: `${progress.pct}%` }} />
          </div>
        </div>
      </div>

      <div className={`grid gap-4 ${compact ? 'md:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
        {grouped.map(([cat, items]) => (
          <div key={cat} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
            <div className="text-[10px] uppercase tracking-widest text-amber-400">{cat}</div>
            <div className="space-y-2">
              {items.map((it) => {
                const done = Boolean(state[it.id]);
                return (
                  <div key={it.id} className="flex items-start gap-2">
                    <button
                      type="button"
                      onClick={() => toggle(it.id)}
                      className="mt-0.5 text-white/70 hover:text-white transition-colors"
                      title={done ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {done ? <CheckCircle2 size={16} className="text-emerald-400" /> : <Circle size={16} />}
                    </button>
                    <div className="min-w-0">
                      <div className="text-white/80 text-sm">{it.label}</div>
                      {!compact && <div className="text-white/45 text-[11px]">{it.desc}</div>}
                      {(it.path || it.externalHref) && (
                        <button
                          type="button"
                          onClick={() => open(it)}
                          className="mt-1 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/45 hover:text-white/70 transition-colors"
                        >
                          Open <ArrowRight size={12} />
                          {it.externalHref ? <ExternalLink size={12} className="opacity-70" /> : null}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

