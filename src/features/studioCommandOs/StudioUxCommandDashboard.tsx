import React, { useState } from 'react';
import { Bot, Clapperboard, LayoutDashboard, Mail, Route, Trash2, Workflow } from 'lucide-react';
import { GeminiStyleVideoCommand } from './GeminiStyleVideoCommand';
import { AutomationCommandGrid } from './AutomationCommandGrid';
import { CommsCommandLibrary } from './CommsCommandLibrary';
import { LeadTrashPanel } from './LeadTrashPanel';
import { SiteWideUxAuditPanel } from './SiteWideUxAuditPanel';
import { StudioSection } from './StudioKpiCards';

type Tab = 'overview' | 'media' | 'automation' | 'comms' | 'lead_trash' | 'sitewide';
const tabs: Array<{ id: Tab; label: string; icon: React.ReactNode; desc: string }> = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={15} />, desc: 'Unified layout rules and command flow' },
  { id: 'media', label: 'Media Studio', icon: <Clapperboard size={15} />, desc: 'Prompt-to-video command' },
  { id: 'automation', label: 'Automation Grid', icon: <Workflow size={15} />, desc: 'Blueprint workflows' },
  { id: 'comms', label: 'Comms Hub', icon: <Mail size={15} />, desc: 'Template deck layout' },
  { id: 'lead_trash', label: 'Lead Trash', icon: <Trash2 size={15} />, desc: 'Delete/restore lead control' },
  { id: 'sitewide', label: 'Sitewide UX', icon: <Route size={15} />, desc: 'Long-list + side-by-side cleanup' },
];

export function StudioUxCommandDashboard() {
  const [tab, setTab] = useState<Tab>('overview');
  return <div className="space-y-6">
    <div className="rounded-[2rem] border border-white/10 bg-gradient-to-br from-amber-500/12 via-white/[0.04] to-black/40 p-5 md:p-7">
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div><div className="inline-flex items-center gap-2 text-amber-300 text-xs uppercase tracking-[0.24em] font-black"><Bot size={16} /> Studio UX Command OS</div><h1 className="mt-3 text-3xl md:text-5xl font-black text-white tracking-tight">Make the admin feel expensive, obvious, and powerful.</h1><p className="mt-4 max-w-4xl text-white/60 leading-relaxed">This layer removes cramped two-column studio layouts, replaces ridiculous long lists with command decks, upgrades the video generator to a prompt-first workflow, and gives Automation Studio scenario-based blueprints.</p></div>
      </div>
      <div className="mt-6 grid sm:grid-cols-2 xl:grid-cols-6 gap-3">{tabs.map((t) => <button key={t.id} type="button" onClick={() => setTab(t.id)} className={`rounded-3xl border p-4 text-left transition-all ${tab === t.id ? 'border-amber-400/40 bg-amber-500/10' : 'border-white/10 bg-black/30 hover:bg-white/[0.04]'}`}><div className="inline-flex items-center gap-2 text-white font-bold">{t.icon}{t.label}</div><div className="mt-2 text-xs text-white/45 leading-relaxed">{t.desc}</div></button>)}</div>
    </div>
    {tab === 'overview' ? <StudioSection eyebrow="merged upgrade" title="What changes immediately"><div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">{['Media Studio becomes prompt-to-video first', 'Communication Hub becomes card deck + preview', 'Automation Studio becomes blueprint grid', 'Leads get visible trash / restore controls', 'Long lists become KPI cards + decks', 'Grid movement is locked unless editing', 'Primary action appears at the top', 'Everything is Cursor-ready in copy_to_repo'].map((x) => <div key={x} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 text-white/70 leading-relaxed">{x}</div>)}</div></StudioSection> : null}
    {tab === 'media' ? <GeminiStyleVideoCommand /> : null}
    {tab === 'automation' ? <AutomationCommandGrid /> : null}
    {tab === 'comms' ? <CommsCommandLibrary /> : null}
    {tab === 'lead_trash' ? <LeadTrashPanel /> : null}
    {tab === 'sitewide' ? <SiteWideUxAuditPanel /> : null}
  </div>;
}
