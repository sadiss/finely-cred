import React, { useMemo, useState } from 'react';
import { ArchiveRestore, Search, Trash2, Undo2 } from 'lucide-react';
import { listLeadCaptures } from '../../data/leadsRepo';
import { getLeadOp, setLeadStage } from '../../data/leadOpsRepo';
import type { LeadStage } from '../../domain/leadOps';
import { isLeadTrashed, listLeadTrash, restoreLead, trashLead } from './leadTrashRepo';
import { StudioKpiCards, StudioSection } from './StudioKpiCards';

const stages: LeadStage[] = ['new', 'contacted', 'booked', 'converted', 'disqualified'];

export function LeadTrashPanel() {
  const [version, setVersion] = useState(0);
  const [q, setQ] = useState('');
  const leads = useMemo(() => listLeadCaptures(), [version]);
  const trash = useMemo(() => listLeadTrash(), [version]);
  const visible = useMemo(() => leads.filter((l) => !isLeadTrashed(l.id)), [leads, trash]);
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return visible.filter((l) => !query || [l.fullName, l.email, l.phone, l.interest ?? '', l.id].join(' ').toLowerCase().includes(query));
  }, [visible, q]);
  const kpis = [
    { label: 'Visible leads', value: visible.length, hint: 'Available in pipeline', tone: 'emerald' as const },
    { label: 'Trash', value: trash.length, hint: 'Restorable cleanup area', tone: 'rose' as const },
    { label: 'Converted', value: visible.filter((l) => getLeadOp(l.id).stage === 'converted').length, hint: 'Partner/CRM linked', tone: 'sky' as const },
    { label: 'No consent', value: visible.filter((l) => !l.consentToContact).length, hint: 'Do not contact directly', tone: 'violet' as const },
  ];
  return (
    <div className="space-y-6">
      <StudioKpiCards items={kpis} />
      <StudioSection eyebrow="lead controls" title="Stage, trash, restore, and clean up leads without keyboard shortcuts.">
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/35 px-4"><Search size={16} className="text-white/35" /><input value={q} onChange={(e) => setQ(e.target.value)} className="w-full bg-transparent py-3 text-sm text-white/80 outline-none placeholder:text-white/25" placeholder="Search visible leads…" /></div>
        <div className="grid lg:grid-cols-2 gap-4 max-h-[760px] overflow-auto pr-1">
          {filtered.slice(0, 100).map((l) => {
            const op = getLeadOp(l.id);
            return <div key={l.id} className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 space-y-4"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="text-white font-black truncate">{l.fullName || l.email}</div><div className="mt-1 text-white/45 text-xs font-mono truncate">{l.email} • {l.phone}</div><div className="mt-2 text-white/60 text-sm line-clamp-2">{l.interest || l.offer}</div></div><button className="fc-button-soft" onClick={() => { trashLead({ leadId: l.id, originalStage: op.stage, reason: 'Admin cleanup' }); setVersion((v) => v + 1); }}><Trash2 size={14} /> Trash</button></div><div className="flex flex-wrap gap-2">{stages.map((s) => <button key={s} className={op.stage === s ? 'fc-button-brand' : 'fc-button-soft'} onClick={() => { setLeadStage(l.id, s); setVersion((v) => v + 1); }}>{s}</button>)}</div></div>;
          })}
          {!filtered.length ? <div className="text-white/55">No visible leads match.</div> : null}
        </div>
      </StudioSection>
      <StudioSection eyebrow="viewable trash" title="Restore leads when they were removed by mistake" right={<div className="text-[10px] uppercase tracking-widest text-white/40">{trash.length} trashed</div>}>
        <div className="grid lg:grid-cols-3 gap-4">
          {trash.map((r) => <div key={r.id} className="rounded-3xl border border-rose-400/20 bg-rose-500/10 p-5 space-y-3"><div className="text-white font-bold">{r.leadId}</div><div className="text-white/55 text-sm">{r.reason}</div><div className="text-white/35 text-xs font-mono">{new Date(r.deletedAt).toLocaleString()}</div><button className="fc-button-brand" onClick={() => { restoreLead(r.leadId); setVersion((v) => v + 1); }}><ArchiveRestore size={14} /> Restore</button></div>)}
          {!trash.length ? <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-white/55 inline-flex gap-2"><Undo2 size={16} /> Trash is empty.</div> : null}
        </div>
      </StudioSection>
    </div>
  );
}
