import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, FlaskConical, Plus, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import type { FunnelExperiment, FunnelExperimentVariant } from '../../domain/funnelExperiments';
import {
  ensureDefaultExperiments,
  listFunnelExperiments,
  upsertFunnelExperiment,
} from '../../data/funnelExperimentsRepo';
import { newId } from '../../utils/ids';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsListItem,
} from '../../features/os/finelyOsLightUi';

const VARIANTS: FunnelExperimentVariant[] = ['control', 'variant_a', 'variant_b'];

function conversionRate(impressions: number, conversions: number) {
  if (!impressions) return '—';
  return `${((conversions / impressions) * 100).toFixed(1)}%`;
}

export default function AdminFunnelExperimentsPage() {
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<FunnelExperiment | null>(null);

  useEffect(() => {
    ensureDefaultExperiments();
  }, []);

  const experiments = useMemo(() => listFunnelExperiments(), [version]);
  const active = draft ?? experiments.find((e) => e.id === selectedId) ?? experiments[0] ?? null;

  useEffect(() => {
    if (active && !selectedId) setSelectedId(active.id);
  }, [active, selectedId]);

  const patchActive = (patch: Partial<FunnelExperiment>) => {
    if (!active) return;
    setDraft({ ...active, ...patch });
  };

  const save = () => {
    if (!active) return;
    upsertFunnelExperiment(active);
    setDraft(null);
    setVersion((v) => v + 1);
  };

  const addExperiment = () => {
    const exp: FunnelExperiment = {
      id: newId('exp'),
      funnelId: 'credit_dispute',
      name: 'New funnel experiment',
      enabled: false,
      headlines: { control: 'Control headline' },
      ctaLabels: { control: 'Get started' },
      stats: {},
      updatedAt: new Date().toISOString(),
    };
    upsertFunnelExperiment(exp);
    setSelectedId(exp.id);
    setDraft(exp);
    setVersion((v) => v + 1);
  };

  return (
    <PageShell
      badge="Admin"
      title="Funnel A/B Lab"
      subtitle="Headline and CTA experiments for lead magnets — sticky variants per session with conversion tracking."
    >
      <div className="space-y-6">
        <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_SECONDARY_BTN}>
          <ArrowLeft size={14} className="inline mr-1" /> Admin home
        </button>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className={`lg:col-span-1 space-y-3 ${finelyOsCatalogCard('violet')} !p-5`} data-fc-accent="violet">
            <div className={`flex items-center justify-between ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <span className="inline-flex items-center gap-1">
                <FlaskConical size={14} /> Experiments
              </span>
              <button type="button" onClick={addExperiment} className={FINELY_OS_PRIMARY_BTN}>
                <Plus size={12} />
              </button>
            </div>
            <ul className="space-y-2">
              {experiments.map((e) => (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(e.id);
                      setDraft(null);
                    }}
                    className={`w-full text-left ${finelyOsListItem(active?.id === e.id, 'violet')}`}
                  >
                    <div className={FINELY_OS_ENTITY_VALUE}>{e.name}</div>
                    <div className={`text-[10px] ${FINELY_OS_ENTITY_SUBLABEL}`}>{e.funnelId}</div>
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {active ? (
            <div className={`lg:col-span-2 space-y-4 ${finelyOsCatalogCard('sky')} !p-5`} data-fc-accent="sky">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className={`${FINELY_OS_ENTITY_VALUE} text-lg font-bold`}>{active.name}</div>
                <button type="button" onClick={() => patchActive({ enabled: !active.enabled })} className={FINELY_OS_SECONDARY_BTN}>
                  {active.enabled ? <ToggleRight size={16} className="text-emerald-700" /> : <ToggleLeft size={16} />}
                  {active.enabled ? 'Live' : 'Paused'}
                </button>
              </div>

              <div>
                <label className={FINELY_OS_ENTITY_SUBLABEL}>Name</label>
                <input className={`${FINELY_OS_ENTITY_INPUT} mt-1 w-full`} value={active.name} onChange={(e) => patchActive({ name: e.target.value })} />
              </div>

              <div>
                <label className={FINELY_OS_ENTITY_SUBLABEL}>Funnel ID</label>
                <input
                  className={`${FINELY_OS_ENTITY_INPUT} mt-1 w-full`}
                  value={active.funnelId}
                  onChange={(e) => patchActive({ funnelId: e.target.value })}
                />
              </div>

              {VARIANTS.map((v) => {
                const stats = active.stats?.[v] ?? { impressions: 0, conversions: 0 };
                return (
                  <div key={v} className={`${finelyOsCatalogCard('emerald')} !p-4 fc-surface-harmony space-y-2`} data-fc-accent="emerald">
                    <div className="flex flex-wrap justify-between gap-2">
                      <span className={`${FINELY_OS_ENTITY_SUBLABEL} uppercase`}>{v.replace('_', ' ')}</span>
                      <span className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
                        {stats.impressions} views · {stats.conversions} conv · {conversionRate(stats.impressions, stats.conversions)}
                      </span>
                    </div>
                    <input
                      className={`${FINELY_OS_ENTITY_INPUT} w-full text-sm`}
                      placeholder="Headline"
                      value={active.headlines?.[v] ?? ''}
                      onChange={(e) => patchActive({ headlines: { ...active.headlines, [v]: e.target.value } })}
                    />
                    <input
                      className={`${FINELY_OS_ENTITY_INPUT} w-full text-sm`}
                      placeholder="CTA label"
                      value={active.ctaLabels?.[v] ?? ''}
                      onChange={(e) => patchActive({ ctaLabels: { ...active.ctaLabels, [v]: e.target.value } })}
                    />
                  </div>
                );
              })}

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={save} className={FINELY_OS_SUCCESS_BTN}>
                  <Save size={14} className="inline mr-1" /> Save experiment
                </button>
                <button type="button" onClick={() => navigate('/free-guide')} className={FINELY_OS_SECONDARY_BTN}>
                  Preview credit funnel
                </button>
              </div>
            </div>
          ) : (
            <div className={`lg:col-span-2 ${FINELY_OS_ENTITY_BODY}`}>Create an experiment to begin.</div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
