import React from 'react';
import { Bot, Clock, ShieldCheck, Sparkles } from 'lucide-react';
import { SYNTHETIC_STAFF_AGENTS } from './syntheticStaff';

function badgeClass(status: string) {
  if (status === 'working') return 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100';
  if (status === 'needs_admin') return 'border-amber-500/25 bg-amber-500/10 text-amber-100';
  if (status === 'blocked') return 'border-rose-500/25 bg-rose-500/10 text-rose-100';
  return 'border-white/10 bg-white/[0.04] text-white/60';
}

export function SyntheticStaffFloor() {
  return (
    <section className="space-y-5">
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-amber-500/10 via-black/40 to-emerald-500/10 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-amber-300 text-xs font-black uppercase tracking-[0.24em]"><Sparkles size={16} /> Synthetic staff floor</div>
            <h2 className="mt-3 text-2xl md:text-3xl font-black text-white">20 digital employees, clear shifts, real blockers.</h2>
            <p className="mt-2 max-w-3xl text-white/65 text-sm">This is an internal operating view. It does not pretend to be human publicly. It shows which agent owns each job, what is blocked, and what needs admin approval.</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-white/70 text-sm"><ShieldCheck className="inline mr-2 text-emerald-300" size={16} /> Compliance Cop is always on.</div>
        </div>
      </div>
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {SYNTHETIC_STAFF_AGENTS.map((a) => (
          <article key={a.id} className="rounded-3xl border border-white/10 bg-black/30 p-5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="h-11 w-11 rounded-2xl border border-amber-500/25 bg-amber-500/10 grid place-items-center text-amber-200"><Bot size={20} /></div>
              <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${badgeClass(a.status)}`}>{a.status.replace('_', ' ')}</span>
            </div>
            <div>
              <h3 className="text-white font-black">{a.name}</h3>
              <div className="text-amber-200/80 text-xs font-semibold mt-1">{a.role}</div>
            </div>
            <div className="text-white/60 text-sm">{a.currentTask}</div>
            <div className="grid gap-2 text-[11px] text-white/45">
              <div className="inline-flex items-center gap-2"><Clock size={13} /> {a.shift}</div>
              <div>KPI: <span className="text-white/65">{a.kpi}</span></div>
              <div>Guardrail: <span className="text-white/65">{a.complianceBoundary}</span></div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
