import React, { useMemo, useState } from 'react';
import { LayoutDashboard, ListChecks, MonitorSmartphone, PanelTop, Sparkles } from 'lucide-react';
import { LONG_LIST_REPLACEMENT_RULES, PRIMARY_ADMIN_ACTIONS, SITE_WIDE_LAYOUT_REMEDIES, STUDIO_SURFACE_LABELS, buildSurfaceKpis } from './studioLayoutSystem';
import type { StudioUxSurface } from './types';
import { StudioKpiCards, StudioSection } from './StudioKpiCards';

const surfaces = Object.keys(STUDIO_SURFACE_LABELS) as StudioUxSurface[];

export function SiteWideUxAuditPanel() {
  const [surface, setSurface] = useState<StudioUxSurface>('media_studio');
  const remedies = useMemo(() => SITE_WIDE_LAYOUT_REMEDIES.filter((r) => r.surface === surface || r.surface === 'global_admin'), [surface]);
  const kpis = useMemo(() => buildSurfaceKpis(surface), [surface]);
  return (
    <div className="space-y-6">
      <StudioKpiCards items={kpis} />
      <StudioSection eyebrow="site-wide UX command rules" title="Kill cramped side-by-side layouts and endless list UIs across the admin system.">
        <div className="flex gap-2 overflow-x-auto pb-2">{surfaces.map((s) => <button key={s} className={surface === s ? 'fc-button-brand shrink-0' : 'fc-button-soft shrink-0'} onClick={() => setSurface(s)}>{STUDIO_SURFACE_LABELS[s]}</button>)}</div>
        <div className="grid lg:grid-cols-2 gap-4">{remedies.map((r) => <div key={r.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 space-y-4"><div className="flex items-start justify-between gap-3"><div><div className="text-[10px] uppercase tracking-widest text-amber-300 font-black">{r.priority}</div><div className="mt-2 text-white font-black text-lg">{r.title}</div></div><LayoutDashboard className="text-white/35" size={22} /></div><div className="grid md:grid-cols-2 gap-3"><div className="rounded-2xl border border-rose-400/15 bg-rose-500/10 p-4"><div className="text-[10px] uppercase tracking-widest text-rose-200/80">Before</div><div className="mt-2 text-sm text-white/60 leading-relaxed">{r.before}</div></div><div className="rounded-2xl border border-emerald-400/15 bg-emerald-500/10 p-4"><div className="text-[10px] uppercase tracking-widest text-emerald-200/80">After</div><div className="mt-2 text-sm text-white/60 leading-relaxed">{r.after}</div></div></div><div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/65"><strong className="text-white">Cursor action:</strong> {r.action}</div></div>)}</div>
      </StudioSection>
      <div className="grid lg:grid-cols-2 gap-6">
        <StudioSection eyebrow="rules" title="Long-list replacement system" right={<ListChecks className="text-amber-300" />}>
          <div className="space-y-3">{LONG_LIST_REPLACEMENT_RULES.map((r, idx) => <div key={r} className="rounded-2xl border border-white/10 bg-black/30 p-4 flex gap-3"><div className="shrink-0 h-7 w-7 rounded-full bg-amber-500 text-black font-black grid place-items-center text-xs">{idx + 1}</div><div className="text-white/70 text-sm leading-relaxed">{r}</div></div>)}</div>
        </StudioSection>
        <StudioSection eyebrow="primary actions" title="Every page gets one obvious next move" right={<Sparkles className="text-amber-300" />}>
          <div className="space-y-3">{PRIMARY_ADMIN_ACTIONS.map((a) => <div key={a.surface} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4"><div className="text-white font-bold">{a.action}</div><div className="mt-1 text-white/55 text-sm">{a.output}</div><div className="mt-2 text-[10px] uppercase tracking-widest text-white/35">Owner: {a.owner}</div></div>)}</div>
        </StudioSection>
      </div>
      <StudioSection eyebrow="responsive layout" title="Wide, spacious, mobile-safe admin design" right={<MonitorSmartphone className="text-sky-300" />}>
        <div className="grid md:grid-cols-3 gap-4"><div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><PanelTop className="text-amber-300" /><div className="mt-4 text-white font-bold">Header first</div><div className="mt-2 text-white/55 text-sm">Page title, outcome, primary action, then KPIs.</div></div><div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><LayoutDashboard className="text-emerald-300" /><div className="mt-4 text-white font-bold">Card decks</div><div className="mt-2 text-white/55 text-sm">Scrollable decks replace long walls of records.</div></div><div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><Sparkles className="text-violet-300" /><div className="mt-4 text-white font-bold">Action panels</div><div className="mt-2 text-white/55 text-sm">Detailed editing lives below the choice, not squeezed beside it.</div></div></div>
      </StudioSection>
    </div>
  );
}
