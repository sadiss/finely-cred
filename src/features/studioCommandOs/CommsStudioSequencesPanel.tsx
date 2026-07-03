import React, { useMemo, useState } from 'react';
import { GitBranch, Plus, Trash2 } from 'lucide-react';
import { NURTURE_SEQUENCES } from '../../domain/nurtureSequences';
import {
  createCommsSequence,
  deleteCommsSequence,
  listCommsSequences,
  upsertCommsSequence,
} from '../../data/commsSequencesRepo';
import { listCommsTemplates } from '../../data/commsRepo';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN } from '../os/finelyOsLightUi';
import { StudioSection } from './StudioKpiCards';

export function CommsStudioSequencesPanel() {
  const [version, setVersion] = useState(0);
  const sequences = useMemo(() => {
    void version;
    return listCommsSequences();
  }, [version]);
  const templates = useMemo(() => listCommsTemplates(), [version]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = sequences.find((s) => s.id === activeId) ?? sequences[0] ?? null;

  const nurtureCatalog = NURTURE_SEQUENCES;

  return (
    <div className="space-y-4">
      <StudioSection
        eyebrow="nurture + CRM"
        title="Sequences — visual steps linked to templates"
        right={
          <button
            type="button"
            className={FINELY_OS_PRIMARY_BTN}
            onClick={() => {
              const s = createCommsSequence({ name: 'New nurture sequence' });
              setActiveId(s.id);
              setVersion((v) => v + 1);
            }}
          >
            <Plus size={14} /> New sequence
          </button>
        }
      >
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {sequences.length === 0 ? (
              <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>No custom sequences yet — import from nurture catalog below.</p>
            ) : (
              sequences.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActiveId(s.id)}
                  className={`w-full text-left rounded-xl border p-3 ${active?.id === s.id ? 'border-fuchsia-400/40 bg-fuchsia-500/10' : 'border-white/10 bg-black/30'}`}
                >
                  <div className="font-semibold text-white text-sm">{s.name}</div>
                  <div className="text-xs text-white/50 mt-1">
                    {s.steps.length} steps · {s.enabled ? 'enabled' : 'paused'}
                  </div>
                </button>
              ))
            )}
          </div>
          {active ? (
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 space-y-3">
              <input
                value={active.name}
                onChange={(e) => upsertCommsSequence({ ...active, name: e.target.value })}
                onBlur={() => setVersion((v) => v + 1)}
                className="fc-input w-full font-semibold"
              />
              <div className="space-y-2">
                {active.steps.map((step, i) => (
                  <div key={step.id} className="flex flex-wrap items-center gap-2 rounded-lg border border-white/10 p-2">
                    <GitBranch size={14} className="text-fuchsia-300" />
                    <span className="text-xs text-white/50 w-8">+{step.delayHours}h</span>
                    <select
                      value={step.templateId}
                      onChange={(e) => {
                        const steps = active.steps.map((st, j) => (j === i ? { ...st, templateId: e.target.value } : st));
                        upsertCommsSequence({ ...active, steps });
                        setVersion((v) => v + 1);
                      }}
                      className="fc-input flex-1 min-w-[140px] text-xs"
                    >
                      <option value="">— template —</option>
                      {templates.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  onClick={() => {
                    upsertCommsSequence({ ...active, enabled: !active.enabled });
                    setVersion((v) => v + 1);
                  }}
                >
                  {active.enabled ? 'Pause' : 'Enable'}
                </button>
                <button
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  onClick={() => {
                    deleteCommsSequence(active.id);
                    setActiveId(null);
                    setVersion((v) => v + 1);
                  }}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </StudioSection>

      <StudioSection eyebrow="seed catalog" title={`Nurture library — ${nurtureCatalog.length} funnel sequences`}>
        <div className="grid sm:grid-cols-2 gap-3">
          {nurtureCatalog.map((seq) => (
            <div key={seq.id} className="rounded-xl border border-white/10 bg-black/25 p-4">
              <div className="font-semibold text-white text-sm">{seq.name}</div>
              <div className="text-xs text-white/50 mt-1">{seq.steps.length} steps · {seq.funnelId}</div>
              <button
                type="button"
                className={`${FINELY_OS_SECONDARY_BTN} mt-3`}
                onClick={() => {
                  const s = createCommsSequence({ name: `Import: ${seq.name}` });
                  upsertCommsSequence({
                    ...s,
                    steps: seq.steps.map((st, i) => ({
                      id: `${s.id}_step_${i}`,
                      templateId: st.templateId,
                      delayHours: st.delayHours ?? i * 24,
                    })),
                    tags: ['imported', seq.id],
                  });
                  setActiveId(s.id);
                  setVersion((v) => v + 1);
                }}
              >
                Import to editor
              </button>
            </div>
          ))}
        </div>
      </StudioSection>
    </div>
  );
}
