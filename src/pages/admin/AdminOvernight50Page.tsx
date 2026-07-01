import React, { useMemo } from 'react';
import { Moon, Sun, TrendingUp } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { buildMicroBudgetPlan } from '../../lib/geo/microBudgetBrain';
import { LeadIntelSwarmDashboard } from '../../features/overnight50/LeadIntelSwarmDashboard';
import { SyntheticStaffFloor } from '../../features/overnight50/SyntheticStaffFloor';

export default function AdminOvernight50Page() {
  const budget = useMemo(() => buildMicroBudgetPlan(), []);
  const target = budget.freeLeadPlan.reduce((n, x) => n + x.targetLeads, 0) + budget.paidLeadEstimate.high;
  return (
    <PageShell badge="Admin" title="Overnight50 War Room" subtitle="Continuous Lead Intel, geo funnels, budget math, synthetic staff, and honest overnight attribution.">
      <div className="space-y-8">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950 via-black to-amber-950/30 p-6">
          <div className="flex flex-wrap items-center justify-between gap-5">
            <div>
              <div className="inline-flex items-center gap-2 text-amber-300 text-xs font-black uppercase tracking-[0.24em]"><Moon size={16} /> Last-night target model</div>
              <h2 className="mt-3 text-3xl md:text-5xl font-black text-white">Wake up goal: 50 leads. Honest paid estimate: {budget.paidLeadEstimate.low}-{budget.paidLeadEstimate.high}.</h2>
              <p className="mt-3 text-white/65 max-w-4xl">The math is transparent: $25/day cannot buy 50 leads by itself. The system uses geo SEO, revival, partner referrals, community capture, and Lead Intel nurture to close the gap.</p>
            </div>
            <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/10 p-5 text-center min-w-[180px]"><TrendingUp className="mx-auto text-emerald-200" /><div className="mt-2 text-4xl font-black text-white">{target}</div><div className="text-white/50 text-xs uppercase tracking-widest">modeled high case</div></div>
          </div>
        </section>
        <section className="grid lg:grid-cols-4 gap-4">
          {budget.cells.map((c) => <div key={c.bucket} className="rounded-3xl border border-white/10 bg-black/30 p-5"><div className="text-white font-black">{c.bucket}</div><div className="mt-2 text-3xl text-amber-200 font-black">${(c.amountCents/100).toFixed(2)}</div><p className="mt-2 text-white/60 text-sm">{c.purpose}</p><div className="mt-3 text-white/40 text-xs">Expected paid leads: {c.expectedLeadsLow}-{c.expectedLeadsHigh}</div></div>)}
        </section>
        <section className="rounded-3xl border border-white/10 bg-black/30 p-5"><div className="inline-flex items-center gap-2 text-white font-black"><Sun className="text-amber-300" size={18} /> Free/owned sources needed to make 50 possible</div><div className="mt-4 grid md:grid-cols-2 xl:grid-cols-5 gap-4">{budget.freeLeadPlan.map((p) => <div key={p.source} className="rounded-2xl border border-white/10 bg-white/[0.025] p-4"><div className="text-2xl font-black text-white">{p.targetLeads}</div><div className="mt-1 text-amber-200 text-sm font-semibold">{p.source.replace('_', ' ')}</div><p className="mt-2 text-white/55 text-xs">{p.action}</p><div className="mt-3 text-white/40 text-[10px] uppercase tracking-widest">Owner: {p.owner}</div></div>)}</div></section>
        <LeadIntelSwarmDashboard />
        <SyntheticStaffFloor />
      </div>
    </PageShell>
  );
}
