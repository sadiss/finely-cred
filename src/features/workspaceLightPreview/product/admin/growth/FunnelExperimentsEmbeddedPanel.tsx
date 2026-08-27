import React, { useEffect, useMemo, useState } from 'react';
import { FlaskConical, Plus, Save, ToggleLeft, ToggleRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { FunnelExperiment, FunnelExperimentVariant } from '../../../../../domain/funnelExperiments';
import {
  ensureDefaultExperiments,
  listFunnelExperiments,
  upsertFunnelExperiment,
} from '../../../../../data/funnelExperimentsRepo';
import { newId } from '../../../../../utils/ids';
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
} from '../../../../os/finelyOsLightUi';

const VARIANTS: FunnelExperimentVariant[] = ['control', 'variant_a', 'variant_b'];

function conversionRate(impressions: number, conversions: number) {
  if (!impressions) return '—';
  return `${((conversions / impressions) * 100).toFixed(1)}%`;
}

/** Funnel A/B lab without PageShell — for growth workstation embed. */
export function FunnelExperimentsEmbeddedPanel() {
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
    window.dispatchEvent(new Event('finely:store'));
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
    window.dispatchEvent(new Event('finely:store'));
  };

  return (
    <div className="fc-wlp-growth-funnel-embed-grid">
      <aside className="fc-wlp-growth-funnel-queue" data-fcm-accent="violet">
        <div className="fc-wlp-growth-funnel-queue-head">
          <span className="fc-wlp-growth-rail-label">
            <FlaskConical size={14} aria-hidden /> Experiments
          </span>
          <button type="button" onClick={addExperiment} className="fc-wlp-btn-secondary" aria-label="Add experiment">
            <Plus size={14} aria-hidden />
          </button>
        </div>
        <ul className="fc-wlp-growth-funnel-queue-list">
          {experiments.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => {
                  setSelectedId(e.id);
                  setDraft(null);
                }}
                className={`fc-wlp-growth-funnel-queue-item${active?.id === e.id ? ' fc-wlp-growth-funnel-queue-item--active' : ''}`}
                data-fcm-accent={e.enabled ? 'emerald' : 'rose'}
              >
                <strong>{e.name}</strong>
                <span>{e.funnelId}</span>
                <em>{e.enabled ? 'Live' : 'Paused'}</em>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {active ? (
        <div className="fc-wlp-growth-funnel-editor" data-fcm-accent="sky">
          <div className="fc-wlp-growth-funnel-editor-head">
            <h3 className="fc-wlp-growth-agent-inspector-title">{active.name}</h3>
            <button
              type="button"
              onClick={() => patchActive({ enabled: !active.enabled })}
              className="fc-wlp-btn-secondary"
            >
              {active.enabled ? <ToggleRight size={16} aria-hidden /> : <ToggleLeft size={16} aria-hidden />}
              {active.enabled ? 'Live' : 'Paused'}
            </button>
          </div>

          <div className={`space-y-4 ${finelyOsCatalogCard('sky')}`} data-fc-accent="sky">
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Name</label>
              <input
                className={`${FINELY_OS_ENTITY_INPUT} mt-1 w-full`}
                value={active.name}
                onChange={(e) => patchActive({ name: e.target.value })}
              />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_SUBLABEL}>Funnel ID</label>
              <input
                className={`${FINELY_OS_ENTITY_INPUT} mt-1 w-full`}
                value={active.funnelId}
                onChange={(e) => patchActive({ funnelId: e.target.value })}
              />
            </div>

            {VARIANTS.map((v, idx) => {
              const stats = active.stats?.[v] ?? { impressions: 0, conversions: 0 };
              const variantAccent = (['emerald', 'violet', 'sky'] as const)[idx % 3];
              return (
                <div
                  key={v}
                  className={`${finelyOsCatalogCard(variantAccent)} fc-surface-harmony space-y-3`}
                  data-fc-accent={variantAccent}
                >
                  <div className="flex flex-wrap justify-between gap-2">
                    <span className={`${FINELY_OS_ENTITY_SUBLABEL} uppercase`}>{v.replace('_', ' ')}</span>
                    <span className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
                      {stats.impressions} views · {stats.conversions} conv ·{' '}
                      {conversionRate(stats.impressions, stats.conversions)}
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
                  <input
                    className={`${FINELY_OS_ENTITY_INPUT} w-full text-sm`}
                    placeholder="CTA destination path — optional"
                    value={active.ctaDestinations?.[v] ?? ''}
                    onChange={(e) =>
                      patchActive({ ctaDestinations: { ...active.ctaDestinations, [v]: e.target.value } })
                    }
                  />
                </div>
              );
            })}

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={save} className={FINELY_OS_SUCCESS_BTN}>
                <Save size={14} className="inline mr-1" aria-hidden /> Save experiment
              </button>
              <button type="button" onClick={() => navigate('/free-guide')} className={FINELY_OS_SECONDARY_BTN}>
                Preview credit funnel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className={`fc-wlp-growth-funnel-editor ${FINELY_OS_ENTITY_BODY}`} data-fcm-accent="sky">
          <button type="button" onClick={addExperiment} className={FINELY_OS_PRIMARY_BTN}>
            <Plus size={14} aria-hidden /> Create an experiment
          </button>
        </div>
      )}
    </div>
  );
}
