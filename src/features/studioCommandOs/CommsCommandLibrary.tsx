import React, { useMemo, useState } from 'react';
import { Mail, MessageSquare, Plus, Search, ShieldCheck, Sparkles, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { createCommsTemplate, deleteCommsTemplate, listCommsTemplates, setCommsTemplateEnabled } from '../../data/commsRepo';
import type { CommsChannel, CommsTemplate } from '../../domain/comms';
import { StudioActionDeck, StudioKpiCards, StudioSection } from './StudioKpiCards';

const CHANNELS: Array<CommsChannel | 'all'> = ['all', 'portal', 'email', 'sms'];

function channelLabel(c: string) { return c === 'all' ? 'All' : c.toUpperCase(); }

export function CommsCommandLibrary() {
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState('');
  const [channel, setChannel] = useState<CommsChannel | 'all'>('all');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newName, setNewName] = useState('Lead magnet welcome sequence');
  const templates = useMemo(() => listCommsTemplates(), [version]);
  const filtered = useMemo(() => templates.filter((t) => {
    if (channel !== 'all' && t.channel !== channel) return false;
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [t.name, t.subjectTemplate || '', t.bodyTemplate, ...(t.tags ?? [])].join(' ').toLowerCase().includes(q);
  }), [templates, query, channel]);
  const active = useMemo(() => templates.find((t) => t.id === activeId) ?? filtered[0] ?? null, [templates, activeId, filtered]);
  const kpis = [
    { label: 'Templates', value: templates.length, hint: 'Total message assets', tone: 'amber' as const },
    { label: 'Enabled', value: templates.filter((t) => t.enabled).length, hint: 'Ready after review', tone: 'emerald' as const },
    { label: 'Email', value: templates.filter((t) => t.channel === 'email').length, hint: 'Email drafts', tone: 'sky' as const },
    { label: 'SMS', value: templates.filter((t) => t.channel === 'sms').length, hint: 'SMS drafts', tone: 'violet' as const },
  ];
  function createPremiumTemplate() {
    const t = createCommsTemplate({
      name: newName.trim() || 'Premium campaign template',
      channel: 'email',
      enabled: false,
      subjectTemplate: 'Your next Finely Cred step is ready',
      bodyTemplate: 'Hi {{firstName}},\n\nHere is the next clean step based on what you requested. Review the guide, choose the path that fits, and book when you are ready.\n\nCTA: {{trackedLink}}\n\nRespectfully,\nFinely Cred\n\nCompliance note: outcomes depend on profile, documentation, eligibility, and execution. No approval, deletion, score, or funding result is guaranteed.',
      tags: ['premium', 'lead-magnet', 'review-required'],
      meta: { source: 'studio_command_os', layout: 'deck_library' },
    });
    setActiveId(t.id); setVersion((v) => v + 1);
  }
  return (
    <div className="space-y-6">
      <StudioKpiCards items={kpis} />
      <StudioSection eyebrow="communication command layout" title="No cramped side-by-side. Templates are now grouped, searchable, and previewed as cards." right={<button className="fc-button-brand" type="button" onClick={createPremiumTemplate}><Plus size={14} /> Create template</button>}>
        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2 flex items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-4"><Search size={16} className="text-white/35" /><input value={query} onChange={(e) => setQuery(e.target.value)} className="w-full bg-transparent py-3 text-sm text-white/80 outline-none placeholder:text-white/25" placeholder="Search templates, tags, subjects…" /></div>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} className="fc-input" placeholder="New template name" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">{CHANNELS.map((c) => <button key={c} className={channel === c ? 'fc-button-brand shrink-0' : 'fc-button-soft shrink-0'} type="button" onClick={() => setChannel(c as any)}>{channelLabel(c)}</button>)}</div>
        <StudioActionDeck items={filtered.slice(0, 60).map((t) => ({ id: t.id, title: t.name, summary: `${t.channel.toUpperCase()} • ${t.enabled ? 'enabled' : 'draft'} • ${(t.tags ?? []).slice(0, 3).join(', ')}` }))} activeId={active?.id} onSelect={(x) => setActiveId(x.id)} />
      </StudioSection>
      {active ? <StudioSection eyebrow="template preview" title={active.name} right={<div className="flex flex-wrap gap-2"><button className="fc-button-soft" onClick={() => { setCommsTemplateEnabled(active.id, !active.enabled); setVersion((v) => v + 1); }}>{active.enabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />} {active.enabled ? 'Disable' : 'Enable'}</button><button className="fc-button-soft" onClick={() => { deleteCommsTemplate(active.id); setActiveId(null); setVersion((v) => v + 1); }}><Trash2 size={14} /> Delete</button></div>}>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><div className="text-[10px] uppercase tracking-widest text-white/40">Channel</div><div className="mt-3 text-white font-black inline-flex gap-2">{active.channel === 'sms' ? <MessageSquare size={18} /> : <Mail size={18} />} {active.channel.toUpperCase()}</div></div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><div className="text-[10px] uppercase tracking-widest text-white/40">Status</div><div className="mt-3 text-white font-black">{active.enabled ? 'Enabled' : 'Draft / review'}</div></div>
          <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><div className="text-[10px] uppercase tracking-widest text-white/40">Safety</div><div className="mt-3 text-white font-black inline-flex gap-2"><ShieldCheck size={18} /> Approval-first</div></div>
        </div>
        {active.subjectTemplate ? <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-5 text-amber-100"><div className="text-[10px] uppercase tracking-widest opacity-70">Subject</div><div className="mt-2 text-xl font-black">{active.subjectTemplate}</div></div> : null}
        <div className="rounded-3xl border border-white/10 bg-black/35 p-6 whitespace-pre-wrap text-white/70 leading-relaxed">{active.bodyTemplate}</div>
        <div className="flex flex-wrap gap-2">{(active.tags ?? []).map((tag) => <span key={tag} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-xs text-white/55">{tag}</span>)}</div>
      </StudioSection> : <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-white/55">No templates found.</div>}
    </div>
  );
}
