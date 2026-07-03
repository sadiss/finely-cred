import React from 'react';
import { Bot, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { SYNTHETIC_STAFF_AGENTS } from './syntheticStaff';
import { finelyOsGlowKpi, finelyOsGlowTile } from '../os/finelyOsLightUi';

function badgeClass(status: string) {
  if (status === 'working') return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100';
  if (status === 'needs_admin') return 'border-sky-500/25 bg-sky-500/10 text-sky-100';
  if (status === 'blocked') return 'border-rose-500/25 bg-rose-500/10 text-rose-100';
  return 'border-white/10 bg-white/[0.04] text-white/60';
}

export function SyntheticStaffFloor() {
  return (
    <section className="space-y-5">
      <div className="rounded-[2rem] border border-violet-500/25 bg-[radial-gradient(900px_320px_at_0%_0%,rgba(139,92,246,0.14)_0%,transparent_55%),radial-gradient(700px_280px_at_100%_0%,rgba(16,185,129,0.10)_0%,transparent_50%)] p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-violet-300 text-xs font-black uppercase tracking-[0.24em]">
              <Sparkles size={16} /> Synthetic staff floor
            </div>
            <h2 className="mt-3 text-2xl md:text-3xl font-black text-white">20 digital employees, clear shifts, real blockers.</h2>
            <p className="mt-2 max-w-3xl text-white/65 text-sm">
              Internal operating view — which agent owns each job, what is blocked, and what needs admin approval.
            </p>
          </div>
          <div className={`${finelyOsGlowKpi('emerald')} p-4 text-white/70 text-sm`}>
            <ShieldCheck className="inline mr-2 text-emerald-300" size={16} /> Compliance Cop is always on.
          </div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
        {SYNTHETIC_STAFF_AGENTS.map((a) => (
          <article key={a.id} className={`${finelyOsGlowTile('violet', false)} p-4 space-y-2`}>
            <div className="flex items-start justify-between gap-3">
              <div className="h-10 w-10 rounded-xl border border-violet-500/25 bg-violet-500/10 grid place-items-center text-violet-200">
                <Bot size={18} />
              </div>
              <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-widest ${badgeClass(a.status)}`}>
                {a.status.replace('_', ' ')}
              </span>
            </div>
            <div>
              <h3 className="text-white font-bold text-sm">{a.name}</h3>
              <div className="text-violet-200/80 text-xs font-semibold mt-0.5">{a.role}</div>
            </div>
            <div className="text-white/60 text-xs line-clamp-2">{a.currentTask}</div>
            <div className="grid gap-1.5 text-[10px] text-white/45">
              <div className="inline-flex items-center gap-2">
                <Clock size={12} /> {a.shift}
              </div>
              <div>
                KPI: <span className="text-white/65">{a.kpi}</span>
              </div>
              <div className="line-clamp-2">
                Guardrail: <span className="text-white/65">{a.complianceBoundary}</span>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
