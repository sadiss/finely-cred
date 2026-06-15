import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowRight, ArrowUp, GripVertical, Mail, Plus, Trash2, UserCheck, Workflow } from 'lucide-react';
import type { CrmSequence, CrmSequenceStep, CrmSequenceStepType } from '../../../domain/crmSequences';
import {
  addCrmSequenceStep,
  createCrmSequence,
  listCrmSequences,
  removeCrmSequenceStep,
  reorderCrmSequenceSteps,
  updateCrmSequenceStep,
  upsertCrmSequence,
} from '../../../data/crmSequencesRepo';
import type { ProspectTarget } from '../../../domain/crmProspects';
import { FinelyOsCatalogBrowser, type FinelyOsCatalogItem } from '../../os/FinelyOsCatalogBrowser';
import {FINELY_OS_ACTIVE_CHIP,
  FINELY_OS_BANNER,
  FINELY_OS_CATALOG_SHELL,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_EMPTY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_GLASS_INNER,
  FINELY_OS_KPI_ACCENTS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_TOOLBAR,
  finelyOsStatusChip,
  finelyOsCatalogCard,} from '../../os/finelyOsLightUi';
import CrmSequenceRunnerPanel from './CrmSequenceRunnerPanel';

const STEP_ICONS: Record<CrmSequenceStepType, typeof Mail> = {
  wait: GripVertical,
  email: Mail,
  task: UserCheck,
  stage_move: ArrowDown,
};

const STEP_BADGE: Record<CrmSequenceStepType, string> = {
  wait: 'border-sky-500/30 bg-sky-500/10 text-sky-200',
  email: 'border-violet-500/30 bg-violet-500/10 text-violet-200',
  task: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
  stage_move: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
};

function StepEditor({ step, onChange }: { step: CrmSequenceStep; onChange: (s: CrmSequenceStep) => void }) {
  return (
    <div className="grid sm:grid-cols-2 gap-2 mt-2">
      <input
        value={step.label}
        onChange={(e) => onChange({ ...step, label: e.target.value })}
        className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} sm:col-span-2`}
        placeholder="Step label"
      />
      {step.type === 'wait' ? (
        <input
          type="number"
          min={0}
          value={step.waitDays ?? 1}
          onChange={(e) => onChange({ ...step, waitDays: Number(e.target.value) })}
          className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}
          placeholder="Days"
        />
      ) : null}
      {step.type === 'email' ? (
        <input
          value={step.emailSubject ?? ''}
          onChange={(e) => onChange({ ...step, emailSubject: e.target.value })}
          className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} sm:col-span-2`}
          placeholder="Email subject"
        />
      ) : null}
      {step.type === 'task' ? (
        <input
          value={step.taskTitle ?? ''}
          onChange={(e) => onChange({ ...step, taskTitle: e.target.value })}
          className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} sm:col-span-2`}
          placeholder="Task title"
        />
      ) : null}
      {step.type === 'stage_move' ? (
        <input
          value={step.targetStage ?? 'contacted'}
          onChange={(e) => onChange({ ...step, targetStage: e.target.value as CrmSequenceStep['targetStage'] })}
          className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}
          placeholder="Target stage"
        />
      ) : null}
    </div>
  );
}

function SequenceStepPreview({ steps }: { steps: CrmSequenceStep[] }) {
  if (!steps.length) {
    return <div className={`text-xs italic ${FINELY_OS_ENTITY_BODY}`}>Add steps to preview the follow-up flow.</div>;
  }
  return (
    <div className="flex flex-wrap items-center gap-1">
      {steps.map((step, idx) => {
        const Icon = STEP_ICONS[step.type];
        return (
          <React.Fragment key={step.id}>
            <div className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-bold uppercase ${STEP_BADGE[step.type]}`}>
              <Icon size={10} /> {step.type.replace('_', ' ')}
            </div>
            {idx < steps.length - 1 ? <ArrowRight size={12} className="text-white/35 shrink-0" /> : null}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export function CrmSequenceBuilder() {
  const [version, setVersion] = useState(0);
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const sequences = useMemo(() => listCrmSequences(), [version]);
  const selected = useMemo(
    () => sequences.find((s) => s.id === selectedId) ?? sequences[0] ?? null,
    [sequences, selectedId],
  );

  useEffect(() => {
    if (!selectedId && sequences[0]?.id) setSelectedId(sequences[0].id);
  }, [selectedId, sequences]);

  const catalogItems = useMemo((): FinelyOsCatalogItem[] =>
    sequences.map((s, i) => ({
      id: s.id,
      title: s.name,
      subtitle: `${s.steps.length} steps · ${s.target}`,
      description: s.enabled ? 'Active sequence' : 'Disabled',
      accentIndex: i,
      badges: [
        { label: s.enabled ? 'Enabled' : 'Off', className: s.enabled ? finelyOsStatusChip('ok') : finelyOsStatusChip('blocked') },
        { label: s.target, className: 'border-violet-500/30 bg-violet-500/10 text-violet-200' },
      ],
    })),
  [sequences]);

  const moveStep = (stepId: string, dir: -1 | 1) => {
    if (!selected) return;
    const idx = selected.steps.findIndex((s) => s.id === stepId);
    const nextIdx = idx + dir;
    if (idx < 0 || nextIdx < 0 || nextIdx >= selected.steps.length) return;
    const ids = selected.steps.map((s) => s.id);
    [ids[idx], ids[nextIdx]] = [ids[nextIdx], ids[idx]];
    reorderCrmSequenceSteps(selected.id, ids);
    setVersion((v) => v + 1);
  };

  const addStep = (type: CrmSequenceStepType) => {
    if (!selected) return;
    addCrmSequenceStep(selected.id, type);
    setVersion((v) => v + 1);
  };

  return (
    <div className="space-y-4">
      <div className={FINELY_OS_BANNER}>
        <Workflow className="text-violet-300 shrink-0 mt-0.5" size={18} />
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
          Build automated follow-ups: <strong className={FINELY_OS_ENTITY_VALUE}>wait → email → task → stage move</strong>. Paginated catalog — no endless scroll.
        </p>
      </div>

      <div className="grid lg:grid-cols-[minmax(280px,360px)_1fr] gap-4">
        <div className={FINELY_OS_CATALOG_SHELL}>
          <div className="flex items-center justify-between gap-2 mb-3">
            <span className={`text-sm font-bold ${FINELY_OS_ENTITY_VALUE}`}>Sequence catalog</span>
            <button
              type="button"
              onClick={() => {
                const seq = createCrmSequence({ name: 'New sequence', target: 'clients' });
                setSelectedId(seq.id);
                setVersion((v) => v + 1);
              }}
              className={`${FINELY_OS_PRIMARY_BTN} !px-2 !py-1.5`}
              title="New sequence"
            >
              <Plus size={14} />
            </button>
          </div>
          <FinelyOsCatalogBrowser
            items={catalogItems}
            pageSize={8}
            searchPlaceholder="Search sequences…"
            emptyMessage="Create your first sequence."
            onItemClick={setSelectedId}
            initialView="grid"
            showViewToggle={false}
            renderTrailing={(item) =>
              selected?.id === item.id ? <span className={FINELY_OS_ACTIVE_CHIP}>Editing</span> : null
            }
          />
        </div>

        {selected ? (
          <div className={`${FINELY_OS_CATALOG_SHELL} space-y-4`}>
            <div className={`${FINELY_OS_TOOLBAR} flex-wrap !p-3`}>
              <input
                value={selected.name}
                onChange={(e) => {
                  upsertCrmSequence({ ...selected, name: e.target.value });
                  setVersion((v) => v + 1);
                }}
                className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} font-semibold min-w-[180px] flex-1`}
              />
              <select
                value={selected.target}
                onChange={(e) => {
                  upsertCrmSequence({ ...selected, target: e.target.value as ProspectTarget });
                  setVersion((v) => v + 1);
                }}
                className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}
              >
                <option value="clients">Clients</option>
                <option value="affiliates">Affiliates</option>
                <option value="agents">Agents</option>
              </select>
              <label className={`inline-flex items-center gap-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                <input
                  type="checkbox"
                  checked={selected.enabled}
                  onChange={(e) => {
                    upsertCrmSequence({ ...selected, enabled: e.target.checked });
                    setVersion((v) => v + 1);
                  }}
                />
                Enabled
              </label>
            </div>

            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-2`}>Flow preview</div>
              <SequenceStepPreview steps={selected.steps} />
            </div>

            <div className="flex flex-wrap gap-2">
              {(['wait', 'email', 'task', 'stage_move'] as CrmSequenceStepType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => addStep(type)}
                  className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border ${STEP_BADGE[type]}`}
                >
                  + {type.replace('_', ' ')}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {selected.steps.map((step, idx) => {
                const Icon = STEP_ICONS[step.type];
                return (
                  <div key={step.id} className={`rounded-xl border p-4 shadow-sm ${FINELY_OS_KPI_ACCENTS[idx % FINELY_OS_KPI_ACCENTS.length]}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon size={16} className="text-violet-300 shrink-0" />
                        <div>
                          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>
                            Step {idx + 1} • {step.type.replace('_', ' ')}
                          </div>
                          <div className={FINELY_OS_ENTITY_VALUE}>{step.label}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button type="button" onClick={() => moveStep(step.id, -1)} className="p-1 rounded hover:bg-white/10 text-white/70" title="Move up"><ArrowUp size={14} /></button>
                        <button type="button" onClick={() => moveStep(step.id, 1)} className="p-1 rounded hover:bg-white/10 text-white/70" title="Move down"><ArrowDown size={14} /></button>
                        <button type="button" onClick={() => { removeCrmSequenceStep(selected.id, step.id); setVersion((v) => v + 1); }} className="p-1 rounded hover:bg-rose-500/15 text-rose-300" title="Remove"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <StepEditor
                      step={step}
                      onChange={(next) => {
                        updateCrmSequenceStep(selected.id, next);
                        setVersion((v) => v + 1);
                      }}
                    />
                  </div>
                );
              })}
            </div>

            <CrmSequenceRunnerPanel sequence={selected} />
          </div>
        ) : (
          <div className={FINELY_OS_ENTITY_EMPTY}>
            Select or create a sequence to edit steps.
          </div>
        )}
      </div>
    </div>
  );
}

export default CrmSequenceBuilder;
