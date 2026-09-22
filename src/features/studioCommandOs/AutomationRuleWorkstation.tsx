import React, { useMemo, useState } from 'react';
import { Plus, Save, Workflow } from 'lucide-react';
import { AutomationStudioShell } from '../automation/AutomationStudioShell';
import { AutomationRuleEditor } from '../../components/automation/AutomationRuleEditor';
import type { AutomationRule } from '../../domain/automationStudio';
import {
  createAutomationRule,
  listAutomationRules,
  upsertAutomationRule,
  deleteAutomationRule,
} from '../../data/automationStudioRepo';
import { listCommsTemplates } from '../../data/commsRepo';
import { StudioSection } from './StudioKpiCards';

function blankRule(): Omit<AutomationRule, 'id' | 'createdAt' | 'updatedAt'> {
  return {
    name: 'New automation rule',
    enabled: false,
    trigger: { type: 'manual' },
    conditions: [{ type: 'always' }],
    actions: [{ type: 'notify_admin', title: 'Automation fired', body: 'Review and add actions in the flow canvas.' }],
    rollingHorizonDays: 30,
    meta: { source: 'automation_studio_builder' },
  };
}

export function AutomationRuleWorkstation() {
  const [version, setVersion] = useState(0);
  const [editorMode, setEditorMode] = useState<'canvas' | 'form'>('canvas');
  const rules = useMemo(() => listAutomationRules(), [version]);
  const [selectedId, setSelectedId] = useState<string | null>(() => rules[0]?.id ?? null);
  const selected = rules.find((r) => r.id === selectedId) ?? rules[0] ?? null;
  const commsTemplates = useMemo(() => listCommsTemplates(), []);

  function refresh() {
    setVersion((v) => v + 1);
  }

  function createRule() {
    const created = createAutomationRule(blankRule());
    setSelectedId(created.id);
    refresh();
  }

  function saveRule(next: AutomationRule) {
    upsertAutomationRule(next);
    refresh();
  }

  return (
    <div className="space-y-5">
      <StudioSection
        eyebrow="Visual flow builder"
        title="Build rules with triggers, branches, waits, and actions"
        right={
          <button type="button" className="fc-button-brand" onClick={createRule}>
            <Plus size={14} /> New rule
          </button>
        }
      >
        <p className="text-sm text-white/60 max-w-3xl">
          This is the full Automation Studio — React Flow canvas, drag nodes, connect branches, and pick from the live trigger catalog on the left rail of the canvas. Blueprints (Scenarios tab) install starter drafts here.
        </p>
      </StudioSection>

      <div className="grid gap-5 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="rounded-3xl border border-white/10 bg-black/30 p-3 space-y-2 max-h-[720px] overflow-auto">
          <div className="px-2 py-1 text-[10px] uppercase tracking-widest text-white/35 font-black">Your rules ({rules.length})</div>
          {rules.length === 0 ? (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/55">
              No rules yet. Create one or install a blueprint from the Scenarios tab.
            </div>
          ) : null}
          {rules.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelectedId(r.id)}
              className={`w-full text-left rounded-2xl border p-3 transition-all ${
                selected?.id === r.id ? 'border-violet-400/50 bg-violet-500/10' : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
              }`}
            >
              <div className="flex items-center gap-2">
                <Workflow size={14} className="text-violet-300 shrink-0" />
                <div className="font-bold text-white text-sm line-clamp-1">{r.name}</div>
              </div>
              <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40">
                {r.enabled ? 'Live' : 'Draft'} • {r.trigger.type.replace(/_/g, ' ')}
              </div>
            </button>
          ))}
        </div>

        <div className="space-y-4 min-w-0">
          {selected ? (
            <>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className={editorMode === 'canvas' ? 'fc-button-brand' : 'fc-button-soft'}
                  onClick={() => setEditorMode('canvas')}
                >
                  Flow canvas
                </button>
                <button
                  type="button"
                  className={editorMode === 'form' ? 'fc-button-brand' : 'fc-button-soft'}
                  onClick={() => setEditorMode('form')}
                >
                  <Save size={14} /> Form editor
                </button>
              </div>
              {editorMode === 'canvas' ? (
                <AutomationStudioShell
                  rule={selected}
                  onRuleChange={saveRule}
                  onDelete={(id) => {
                    deleteAutomationRule(id);
                    setSelectedId(null);
                    refresh();
                  }}
                  height={720}
                />
              ) : (
                <AutomationRuleEditor
                  rule={selected}
                  commsTemplates={commsTemplates}
                  onSave={saveRule}
                  onDelete={(id) => {
                    deleteAutomationRule(id);
                    setSelectedId(null);
                    refresh();
                  }}
                />
              )}
            </>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-10 text-center text-white/55">
              Select a rule or create a new automation.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
