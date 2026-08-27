import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  CheckCircle2,
  GitBranch,
  Grid3X3,
  PlayCircle,
  Plus,
  Sparkles,
  Unlock,
} from 'lucide-react';
import type { AutomationBlueprint, AutomationBlueprintCategory, AutomationGridNode } from './types';
import { AUTOMATION_BLUEPRINTS, blueprintToPlainEnglish, listBlueprintsByCategory } from './automationBlueprints';
import { StudioActionDeck, StudioKpiCards, StudioSection } from './StudioKpiCards';
import { createAutomationRule, deleteAutomationRule, listAutomationRules, setAutomationRuleEnabled } from '../../data/automationStudioRepo';
import type { AutomationRule } from '../../domain/automationStudio';
import { getSelectedAutomationBlueprintId, setSelectedAutomationBlueprint } from './studioCommandRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsSolidIconChip,
  type FinelyOsPublicAccent,
} from '../os/finelyOsLightUi';
import { accentAt } from '../workspaceLightPreview/product/workspaceAccentArrangement';

const CATEGORY_LABEL: Record<AutomationBlueprintCategory, string> = {
  lead_capture: 'Lead Capture',
  nurture: 'Nurture',
  appointment: 'Appointment',
  sales: 'Sales',
  recruiting: 'Recruiting',
  reactivation: 'Reactivation',
  partner: 'Partner',
  content: 'Content',
  compliance: 'Compliance',
};

const NODE_ACCENT: Record<AutomationGridNode['type'], FinelyOsPublicAccent> = {
  trigger: 'emerald',
  condition: 'sky',
  action: 'violet',
  delay: 'violet',
  split: 'rose',
  approval: 'rose',
  exit: 'sky',
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

function NodeCard({ node, index }: { node: AutomationGridNode; index: number }) {
  const accent = NODE_ACCENT[node.type];

  return (
    <div
      className={`relative ${finelyOsCatalogCard(accent)} fc-surface-harmony min-h-[170px]`}
      data-fc-accent={accent}
    >
      <div className="flex items-start justify-between gap-3">
        <span className={finelyOsSolidIconChip(accent, 'md')}>
          <GitBranch size={16} strokeWidth={2.2} aria-hidden />
        </span>
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} opacity-80`}>
          {node.type} · {index + 1}
        </div>
      </div>
      <div className={`mt-4 ${FINELY_OS_ENTITY_TITLE} text-lg leading-tight`}>{node.title}</div>
      <div className={`mt-2 text-base font-semibold text-white/75 leading-relaxed`}>{node.subtitle}</div>
      <div className={`mt-3 text-sm font-semibold text-white/60 leading-relaxed`}>{node.detail}</div>
      <div className="absolute -right-3 top-1/2 hidden lg:block text-white/15">
        <ArrowRight size={24} />
      </div>
    </div>
  );
}

function categoryMetaChip(label: string, accent: FinelyOsPublicAccent) {
  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${finelyOsCatalogCard(accent)} !p-2 !inline-flex`}
      data-fc-accent={accent}
    >
      {label}
    </span>
  );
}

export function AutomationCommandGrid() {
  const [version, setVersion] = useState(0);
  const [category, setCategory] = useState<AutomationBlueprintCategory | 'all'>('all');
  const [editMode, setEditMode] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const selectedSeed = getSelectedAutomationBlueprintId();
  const [selectedId, setSelectedId] = useState<string | null>(selectedSeed ?? AUTOMATION_BLUEPRINTS[0]?.id ?? null);
  const blueprints = useMemo(() => (category === 'all' ? AUTOMATION_BLUEPRINTS : listBlueprintsByCategory(category)), [category]);
  const selected = useMemo(() => AUTOMATION_BLUEPRINTS.find((b) => b.id === selectedId) ?? blueprints[0] ?? null, [selectedId, blueprints]);
  const rules = useMemo(() => listAutomationRules(), [version]);
  const installed = selected ? rules.find((r) => r.meta?.blueprintId === selected.id) : null;

  const kpis = [
    { label: 'Blueprints', value: AUTOMATION_BLUEPRINTS.length, hint: 'Scenario storyboards', tone: 'emerald' as const },
    { label: 'Installed rules', value: rules.filter((r) => r.meta?.blueprintId).length, hint: 'Draft blueprint installs', tone: 'violet' as const },
    { label: 'Grid mode', value: editMode ? 'Canvas edit' : 'Storyboard', hint: 'Flow builder for branches', tone: editMode ? ('rose' as const) : ('sky' as const) },
    { label: 'Actions', value: selected?.nodes.length ?? 0, hint: 'Flow nodes in selection', tone: 'emerald' as const },
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
    setNotice(`${b.title} installed as disabled draft automation.`);
  }

  return (
    <div className="space-y-6">
      <StudioKpiCards items={kpis} />
      {notice ? (
        <div className={`${finelyOsCatalogCard('emerald')} inline-flex items-center gap-3 text-emerald-100 text-base font-semibold`}>
          <CheckCircle2 size={18} /> {notice}
        </div>
      ) : null}
      <StudioSection
        eyebrow="Scenario gallery"
        title="Blueprint scenarios"
        accentIndex={0}
        right={
          <button type="button" className={editMode ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN} onClick={() => setEditMode((v) => !v)}>
            {editMode ? <Unlock size={14} /> : <Grid3X3 size={14} />} {editMode ? 'Rearrange cards' : 'Storyboard view'}
          </button>
        }
      >
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(['all', ...Object.keys(CATEGORY_LABEL)] as Array<AutomationBlueprintCategory | 'all'>).map((c) => (
            <button
              key={c}
              type="button"
              className={category === c ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
              onClick={() => setCategory(c)}
            >
              {c === 'all' ? 'All' : CATEGORY_LABEL[c]}
            </button>
          ))}
        </div>
        <StudioActionDeck
          items={blueprints.map((b) => ({ ...b, summary: b.summary }))}
          activeId={selected?.id}
          onSelect={(b) => {
            setSelectedId(b.id);
            setSelectedAutomationBlueprint(b.id);
          }}
          icon={Sparkles}
          renderMeta={(b) => {
            const metaAccents = [accentAt(0), accentAt(1)] as FinelyOsPublicAccent[];
            return (
              <div className="flex flex-wrap gap-2">
                {categoryMetaChip(CATEGORY_LABEL[b.category], metaAccents[0])}
                {categoryMetaChip(`${b.nodes.length} nodes`, metaAccents[1])}
              </div>
            );
          }}
        />
      </StudioSection>
      {selected ? (
        <StudioSection
          eyebrow="Automation grid"
          title={selected.title}
          accentIndex={1}
          right={
            <div className="flex flex-wrap gap-2">
              <button className={FINELY_OS_PRIMARY_BTN} type="button" onClick={() => installBlueprint(selected)}>
                <Plus size={14} /> Install draft
              </button>
              {installed ? (
                <button
                  className={FINELY_OS_SECONDARY_BTN}
                  type="button"
                  onClick={() => {
                    setAutomationRuleEnabled(installed.id, !installed.enabled);
                    setVersion((v) => v + 1);
                  }}
                >
                  <PlayCircle size={14} /> {installed.enabled ? 'Disable' : 'Enable'}
                </button>
              ) : null}
            </div>
          }
        >
          <div className="grid lg:grid-cols-3 gap-4 lg:gap-6">
            <div className={`lg:col-span-2 ${finelyOsCatalogCard('sky')} fc-surface-harmony overflow-x-auto`} data-fc-accent="sky">
              <div className="grid xl:grid-cols-3 gap-5 min-w-[900px]">
                {selected.nodes.map((n, idx) => (
                  <NodeCard key={n.id} node={n} index={idx} />
                ))}
              </div>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Owner', value: selected.owner },
                { label: 'Expected outcome', value: selected.expectedOutcome, body: true },
              ].map((panel, index) => {
                const accent = accentAt(index + 2) as FinelyOsPublicAccent;
                return (
                  <div key={panel.label} className={`${finelyOsCatalogCard(accent)} fc-surface-harmony`} data-fc-accent={accent}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>{panel.label}</div>
                    <div className={`mt-2 ${panel.body ? `${FINELY_OS_ENTITY_BODY} text-white/75` : FINELY_OS_ENTITY_VALUE}`}>
                      {panel.value}
                    </div>
                  </div>
                );
              })}
              <div className={`${finelyOsCatalogCard('rose')} fc-surface-harmony space-y-3`} data-fc-accent="rose">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Caps</div>
                {selected.recommendedCaps.map((x, index) => {
                  const accent = accentAt(index + 4) as FinelyOsPublicAccent;
                  return (
                    <div
                      key={x}
                      className={`text-sm font-semibold rounded-2xl ${finelyOsCatalogCard(accent)} !p-4`}
                      data-fc-accent={accent}
                    >
                      {x}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className={`${finelyOsCatalogCard('violet')} whitespace-pre-wrap text-base font-semibold text-white/75 leading-relaxed`}>
            {blueprintToPlainEnglish(selected.id)}
          </div>
          {installed ? (
            <div className={`${finelyOsCatalogCard('violet')} text-violet-100 text-base font-semibold`}>
              Installed rule: {installed.name} · status: {installed.enabled ? 'enabled' : 'disabled draft'}{' '}
              <button
                className="ml-3 text-rose-200 underline font-bold"
                type="button"
                onClick={() => {
                  deleteAutomationRule(installed.id);
                  setVersion((v) => v + 1);
                }}
              >
                Remove draft
              </button>
            </div>
          ) : null}
        </StudioSection>
      ) : null}
    </div>
  );
}
