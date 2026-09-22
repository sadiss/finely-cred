import React, { useMemo, useState } from 'react';
import { ArrowLeft, Plus, Save, Workflow } from 'lucide-react';
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const selected = rules.find((r) => r.id === selectedId) ?? rules[0] ?? null;
  const commsTemplates = useMemo(() => listCommsTemplates(), []);

  function refresh() {
    setVersion((v) => v + 1);
  }

  function createRule() {
    const created = createAutomationRule(blankRule());
    setSelectedId(created.id);
    setEditing(true);
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

      {!editing ? (
        <div className="grid gap-4 md:grid-cols-2">
          {rules.length === 0 ? (
            <p className="rounded-2xl border border-white/15 bg-[#0b1110] p-6 text-base text-[#e8e8e8]">
              No rules yet. Create one or install a blueprint from the Scenarios tab.
            </p>
          ) : null}
          {rules.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                setSelectedId(r.id);
                setEditing(true);
              }}
              className="w-full rounded-2xl border border-white/15 bg-[#0b1110] p-5 text-left"
            >
              <div className="flex items-center gap-2">
                <Workflow size={16} className="text-[#fbbf24] shrink-0" />
                <div className="text-lg font-semibold text-[#e8e8e8]">{r.name}</div>
              </div>
              <div className="mt-2 text-base text-[#e8e8e8]">
                {r.enabled ? 'Live' : 'Draft'} · {r.trigger.type.replace(/_/g, ' ')}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4 min-w-0">
          <button type="button" className="fc-button-soft" onClick={() => setEditing(false)}>
            <ArrowLeft size={14} /> All rules
          </button>
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
      )}
    </div>
  );
}
