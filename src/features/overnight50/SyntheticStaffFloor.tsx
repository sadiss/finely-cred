import React from 'react';
import { Bot, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { SYNTHETIC_STAFF_AGENTS } from './syntheticStaff';
import { finelyOsCatalogCard, finelyOsGlowKpi } from '../os/finelyOsLightUi';

const FLOOR_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

const ICON_CHIP: Record<(typeof FLOOR_ACCENTS)[number], string> = {
  emerald: 'bg-emerald-500 text-white shadow-[0_10px_18px_-12px_rgba(16,185,129,0.95)]',
  violet: 'bg-violet-500 text-white shadow-[0_10px_18px_-12px_rgba(139,92,246,0.95)]',
  sky: 'bg-sky-500 text-white shadow-[0_10px_18px_-12px_rgba(14,165,233,0.95)]',
  rose: 'bg-rose-500 text-white shadow-[0_10px_18px_-12px_rgba(244,63,94,0.95)]',
};

function badgeClass(status: string) {
  if (status === 'working') return 'border-emerald-400/40 bg-emerald-500/20 text-emerald-100';
  if (status === 'needs_admin') return 'border-sky-400/40 bg-sky-500/20 text-sky-100';
  if (status === 'blocked') return 'border-rose-400/40 bg-rose-500/20 text-rose-100';
  return 'border-violet-400/30 bg-violet-500/15 text-violet-100';
}

export function SyntheticStaffFloor() {
  return (
    <section className="space-y-6">
      <div className={finelyOsCatalogCard('violet')}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-violet-300 text-sm font-black uppercase tracking-[0.24em]">
              <Sparkles size={18} /> Synthetic staff floor
            </div>
            <h2 className="mt-3 text-3xl font-extrabold text-white">20 digital employees, clear shifts, real blockers.</h2>
            <p className="mt-3 max-w-3xl text-white/75 text-base font-semibold">
              Internal operating view — which teammate owns each job, what is blocked, and what needs admin approval.
            </p>
          </div>
          <div className={`${finelyOsGlowKpi('emerald')} p-6 text-white/80 text-base font-semibold`}>
            <ShieldCheck className="inline mr-2 text-emerald-300" size={18} /> Compliance Cop is always on.
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {SYNTHETIC_STAFF_AGENTS.map((a, idx) => {
          const accent = FLOOR_ACCENTS[idx % FLOOR_ACCENTS.length];
          return (
            <article key={a.id} className={`${finelyOsCatalogCard(accent)} space-y-4`} data-fc-accent={accent}>
              <div className="flex items-start justify-between gap-3">
                <div className={`h-12 w-12 rounded-xl grid place-items-center ${ICON_CHIP[accent]}`}>
                  <Bot size={22} />
                </div>
                <span className={`rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-widest ${badgeClass(a.status)}`}>
                  {a.status.replace('_', ' ')}
                </span>
              </div>
              <div>
                <h3 className="text-white font-extrabold text-xl">{a.name}</h3>
                <div className="text-white/70 text-sm font-bold mt-1">{a.role}</div>
              </div>
              <div className="text-white/70 text-base font-semibold line-clamp-2">{a.currentTask}</div>
              <div className="grid gap-2 text-sm font-semibold text-white/55">
                <div className="inline-flex items-center gap-2">
                  <Clock size={16} /> {a.shift}
                </div>
                <div>
                  KPI: <span className="text-white/80">{a.kpi}</span>
                </div>
                <div className="line-clamp-2">
                  Guardrail: <span className="text-white/80">{a.complianceBoundary}</span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
