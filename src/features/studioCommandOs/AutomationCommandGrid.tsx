import React, { useMemo, useState } from 'react';
import { ArrowRight, CheckCircle2, GitBranch, Grid3X3, Lock, Pause, PlayCircle, Plus, ShieldCheck, Sparkles, Trash2, Unlock } from 'lucide-react';
import type { AutomationBlueprint, AutomationBlueprintCategory, AutomationGridNode } from './types';
import { AUTOMATION_BLUEPRINTS, blueprintToPlainEnglish, listBlueprintsByCategory } from './automationBlueprints';
import { StudioActionDeck, StudioKpiCards, StudioSection } from './StudioKpiCards';
import { createAutomationRule, deleteAutomationRule, listAutomationRules, setAutomationRuleEnabled } from '../../data/automationStudioRepo';
import type { AutomationRule } from '../../domain/automationStudio';
import { getSelectedAutomationBlueprintId, setSelectedAutomationBlueprint } from './studioCommandRepo';

const CATEGORY_LABEL: Record<AutomationBlueprintCategory, string> = {
  lead_capture: 'Lead Capture', nurture: 'Nurture', appointment: 'Appointment', sales: 'Sales', recruiting: 'Recruiting', reactivation: 'Reactivation', partner: 'Partner', content: 'Content', compliance: 'Compliance',
};

const NODE_TONE: Record<AutomationGridNode['type'], string> = {
  trigger: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-100',
  condition: 'border-sky-400/30 bg-sky-500/10 text-sky-100',
  action: 'border-amber-400/30 bg-amber-500/10 text-amber-100',
  delay: 'border-violet-400/30 bg-violet-500/10 text-violet-100',
  split: 'border-fuchsia-400/30 bg-fuchsia-500/10 text-fuchsia-100',
  approval: 'border-rose-400/30 bg-rose-500/10 text-rose-100',
  exit: 'border-white/15 bg-white/[0.04] text-white/80',
};

function blueprintToRule(b: AutomationBlueprint): Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: `Blueprint: ${b.title}`,
    enabled: false,
    trigger: { type: 'manual' },
    conditions: [{ type: 'always' }],
    actions: b.nodes
      .filter((n) => n.type === 'action' || n.type === 'approval')
      .slice(0, 8)
      .map((n) => ({
        type: 'create_task',
        title: n.title,
        kind: 'follow_up',
        priority: n.risk === 'high' ? 'urgent' : n.risk === 'medium' ? 'high' : 'normal',
        dueInDays: n.type === 'approval' ? 0 : 1,
        notes: `${n.subtitle}\n\n${n.detail}\n\nOwner: ${b.owner}`,
        tags: ['blueprint', b.category, b.id, n.type],
      } as any)),
    rollingHorizonDays: 30,
    meta: { blueprintId: b.id, category: b.category, owner: b.owner, expectedOutcome: b.expectedOutcome, installedAsDraft: true },
  };
}

function NodeCard({ node, index, editMode }: { node: AutomationGridNode; index: number; editMode: boolean }) {
  return (
    <div className={`relative rounded-3xl border ${NODE_TONE[node.type]} p-5 min-h-[170px] shadow-2xl shadow-black/20`}>
      <div className="flex items-start justify-between gap-3">
        <div className="text-[10px] uppercase tracking-widest font-black opacity-70">{node.type} • {index + 1}</div>
        <div className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest opacity-70">{editMode ? <Unlock size={12} /> : <Lock size={12} />} {editMode ? 'edit' : 'locked'}</div>
      </div>
      <div className="mt-4 text-white font-black leading-tight">{node.title}</div>
      <div className="mt-2 text-sm text-white/70 leading-relaxed">{node.subtitle}</div>
      <div className="mt-3 text-xs text-white/55 leading-relaxed">{node.detail}</div>
      <div className="absolute -right-3 top-1/2 hidden lg:block text-white/15"><ArrowRight size={24} /></div>
    </div>
  );
}

export function AutomationCommandGrid() {
  const [version, setVersion] = useState(0);
  const [category, setCategory] = useState<AutomationBlueprintCategory | 'all'>('all');
  const [editMode, setEditMode] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const selectedSeed = getSelectedAutomationBlueprintId();
  const [selectedId, setSelectedId] = useState<string | null>(selectedSeed ?? AUTOMATION_BLUEPRINTS[0]?.id ?? null);
  const blueprints = useMemo(() => category === 'all' ? AUTOMATION_BLUEPRINTS : listBlueprintsByCategory(category), [category]);
  const selected = useMemo(() => AUTOMATION_BLUEPRINTS.find((b) => b.id === selectedId) ?? blueprints[0] ?? null, [selectedId, blueprints]);
  const rules = useMemo(() => listAutomationRules(), [version]);
  const installed = selected ? rules.find((r) => r.meta?.blueprintId === selected.id) : null;

  const kpis = [
    { label: 'Blueprints', value: AUTOMATION_BLUEPRINTS.length, hint: 'Choose scenario instead of scrolling templates', tone: 'amber' as const },
    { label: 'Installed rules', value: rules.filter((r) => r.meta?.blueprintId).length, hint: 'Draft blueprint installs', tone: 'emerald' as const },
    { label: 'Grid movement', value: editMode ? 'Unlocked' : 'Locked', hint: 'No accidental drag/pan by default', tone: editMode ? 'rose' as const : 'sky' as const },
    { label: 'Actions', value: selected?.nodes.length ?? 0, hint: 'Beginning-to-end flow nodes', tone: 'violet' as const },
  ];

  function installBlueprint(b: AutomationBlueprint) {
    const cur = listAutomationRules().find((r) => r.meta?.blueprintId === b.id);
    if (cur) {
      setNotice(`${b.title} is already installed as a draft rule.`);
      return;
    }
    createAutomationRule(blueprintToRule(b));
    setSelectedAutomationBlueprint(b.id);
    setVersion((v) => v + 1);
    setNotice(`${b.title} installed as disabled draft automation. Review before enabling.`);
  }

  return (
    <div className="space-y-6">
      <StudioKpiCards items={kpis} />
      {notice ? <div className="rounded-3xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-100 text-sm inline-flex gap-3"><CheckCircle2 size={18} /> {notice}</div> : null}
      <StudioSection eyebrow="GoHighLevel-style automation gallery" title="Choose a scenario. Then open a stable automation grid." right={<button type="button" className={editMode ? 'fc-button-brand' : 'fc-button-soft'} onClick={() => setEditMode((v) => !v)}>{editMode ? <Unlock size={14} /> : <Lock size={14} />} {editMode ? 'Edit mode on' : 'Grid locked'}</button>}>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', ...Object.keys(CATEGORY_LABEL)] as Array<AutomationBlueprintCategory | 'all'>).map((c) => <button key={c} type="button" className={category === c ? 'fc-button-brand shrink-0' : 'fc-button-soft shrink-0'} onClick={() => setCategory(c)}>{c === 'all' ? 'All' : CATEGORY_LABEL[c]}</button>)}
        </div>
        <StudioActionDeck items={blueprints.map((b) => ({ ...b, summary: b.summary }))} activeId={selected?.id} onSelect={(b) => { setSelectedId(b.id); setSelectedAutomationBlueprint(b.id); }} renderMeta={(b) => <div className="flex flex-wrap gap-2"><span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-widest text-white/50">{CATEGORY_LABEL[b.category]}</span><span className="rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] uppercase tracking-widest text-white/50">{b.nodes.length} nodes</span></div>} />
      </StudioSection>
      {selected ? <StudioSection eyebrow="automation grid" title={selected.title} right={<div className="flex flex-wrap gap-2"><button className="fc-button-brand" type="button" onClick={() => installBlueprint(selected)}><Plus size={14} /> Install draft</button>{installed ? <button className="fc-button-soft" type="button" onClick={() => { setAutomationRuleEnabled(installed.id, !installed.enabled); setVersion((v) => v + 1); }}><PlayCircle size={14} /> {installed.enabled ? 'Disable' : 'Enable'}</button> : null}</div>}>
        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-[2rem] border border-white/10 bg-black/30 p-5 overflow-x-auto">
            <div className="grid xl:grid-cols-3 gap-5 min-w-[900px]">
              {selected.nodes.map((n, idx) => <NodeCard key={n.id} node={n} index={idx} editMode={editMode} />)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><div className="text-[10px] uppercase tracking-widest text-white/40">Owner</div><div className="mt-2 text-white font-bold">{selected.owner}</div></div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><div className="text-[10px] uppercase tracking-widest text-white/40">Expected outcome</div><div className="mt-2 text-white/70 text-sm leading-relaxed">{selected.expectedOutcome}</div></div>
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5"><div className="text-[10px] uppercase tracking-widest text-white/40">Caps</div><div className="mt-3 space-y-2">{selected.recommendedCaps.map((x) => <div key={x} className="text-xs text-white/60 rounded-2xl border border-white/10 bg-black/30 p-3">{x}</div>)}</div></div>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white/[0.035] p-5 whitespace-pre-wrap text-sm text-white/65 leading-relaxed">{blueprintToPlainEnglish(selected.id)}</div>
        {installed ? <div className="rounded-3xl border border-amber-400/20 bg-amber-500/10 p-4 text-amber-100 text-sm">Installed rule: {installed.name} • status: {installed.enabled ? 'enabled' : 'disabled draft'} <button className="ml-3 text-rose-200 underline" onClick={() => { deleteAutomationRule(installed.id); setVersion((v) => v + 1); }}>Remove draft</button></div> : null}
      </StudioSection> : null}
    </div>
  );
}
