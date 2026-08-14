import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, ShieldAlert, Sparkles } from 'lucide-react';
import { computeAgentAttribution, runDecisionPostMortem } from '../../../lib/agentAttributionEngine';
import { FinelyOsPaginatedStack } from '../../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_EMPTY,
  finelyOsCatalogCardCompact,
  finelyOsStatusChip,
} from '../../os/finelyOsLightUi';

function conversionTone(rate: number, entitiesTouched: number): 'ok' | 'warn' | 'blocked' {
  if (entitiesTouched === 0) return 'blocked';
  if (rate >= 0.2) return 'ok';
  if (rate > 0) return 'warn';
  return 'blocked';
}

type AttributionTab = 'attribution' | 'post_mortem';

/**
 * Compact admin panel — which growth agents' actions are last-touch on CRM records that
 * eventually reached a "won" stage. Reusable mount point: today wired into the CRM workspace's
 * hub tabs; the Growth Agents roster page can mount the same component without any props.
 *
 * MANDATORY: the data-completeness caveat below must stay visibly rendered (not a tooltip, not
 * a code comment) — `auditRepo.ts` is localStorage-only today, so this only reflects the current
 * browser's action history.
 */
export function AgentAttributionPanel() {
  const [version, setVersion] = useState(0);
  const [tab, setTab] = useState<AttributionTab>('attribution');

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const summaries = useMemo(() => {
    void version;
    return computeAgentAttribution();
  }, [version]);

  const postMortemFindings = useMemo(() => {
    void version;
    return runDecisionPostMortem();
  }, [version]);

  const missedOpportunityCount = useMemo(
    () => postMortemFindings.filter((f) => f.wasLikelyMisjudged).length,
    [postMortemFindings],
  );

  const totals = useMemo(
    () =>
      summaries.reduce(
        (acc, s) => ({
          touches: acc.touches + s.touches,
          entities: acc.entities + s.entitiesTouched,
          won: acc.won + s.entitiesWon,
        }),
        { touches: 0, entities: 0, won: 0 },
      ),
    [summaries],
  );

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 p-3 flex items-start gap-2.5">
        <ShieldAlert size={16} className="text-amber-300 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-100/90 leading-relaxed">
          <span className="font-bold">Reflects activity from this browser's history</span> — agent-action logs are stored locally today,
          so this attribution view only counts sends/actions made from this browser. Full cross-device attribution ships with the
          server-side automation upgrade.
        </p>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('attribution')}
          className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-colors ${
            tab === 'attribution'
              ? 'border-fuchsia-400/40 bg-fuchsia-500/15 text-fuchsia-200'
              : 'border-white/10 bg-white/[0.04] text-white/50 hover:text-white/80'
          }`}
        >
          Attribution
        </button>
        <button
          type="button"
          onClick={() => setTab('post_mortem')}
          className={`rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider border transition-colors flex items-center gap-1.5 ${
            tab === 'post_mortem'
              ? 'border-rose-400/40 bg-rose-500/15 text-rose-200'
              : 'border-white/10 bg-white/[0.04] text-white/50 hover:text-white/80'
          }`}
        >
          Missed opportunities
          {missedOpportunityCount > 0 ? (
            <span className="rounded-full bg-rose-500/25 px-1.5 py-0.5 text-[9px] text-rose-100 tabular-nums">
              {missedOpportunityCount}
            </span>
          ) : null}
        </button>
      </div>

      {tab === 'attribution' ? (
        summaries.length === 0 ? (
          <div className={FINELY_OS_ENTITY_EMPTY}>
            <p className={FINELY_OS_ENTITY_BODY}>
              No agent-action → CRM touches logged yet in this browser. Sequence sends, outreach, and handoff decisions will populate
              this view as they happen.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-2">
              <div className={`${finelyOsCatalogCardCompact('sky')} text-center`}>
                <div className="text-lg font-bold text-white tabular-nums">{totals.touches}</div>
                <div className="text-[9px] uppercase tracking-wide text-white/50">Total touches</div>
              </div>
              <div className={`${finelyOsCatalogCardCompact('violet')} text-center`}>
                <div className="text-lg font-bold text-white tabular-nums">{totals.entities}</div>
                <div className="text-[9px] uppercase tracking-wide text-white/50">Records touched</div>
              </div>
              <div className={`${finelyOsCatalogCardCompact('emerald')} text-center`}>
                <div className="text-lg font-bold text-white tabular-nums">{totals.won}</div>
                <div className="text-[9px] uppercase tracking-wide text-white/50">Reached won</div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {summaries.map((s) => (
                <div key={s.agentId} className={finelyOsCatalogCardCompact('fuchsia')}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Sparkles size={12} className="text-fuchsia-300" />
                      {s.agentDisplayName}
                    </span>
                    <span className={finelyOsStatusChip(conversionTone(s.conversionRate, s.entitiesTouched))}>
                      {(s.conversionRate * 100).toFixed(0)}% won
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <div className="text-base font-bold text-white tabular-nums">{s.touches}</div>
                      <div className="text-[9px] uppercase tracking-wide text-white/50">Touches</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-white tabular-nums">{s.entitiesTouched}</div>
                      <div className="text-[9px] uppercase tracking-wide text-white/50">Records</div>
                    </div>
                    <div>
                      <div className="text-base font-bold text-white tabular-nums">{s.entitiesWon}</div>
                      <div className="text-[9px] uppercase tracking-wide text-white/50">Won</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      ) : (
        <div className="space-y-2">
          <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
            Every logged "no action / held" decision an agent made against a CRM record, joined against what actually happened to that
            record afterward. Flagged rows reached a won stage anyway — a real signal the hold-back call may have been too cautious, not
            proof it was wrong.
          </p>
          <FinelyOsPaginatedStack
            items={postMortemFindings}
            pageSize={6}
            emptyMessage="No no-action/held decisions logged yet in this browser — nothing to post-mortem."
            renderItem={(f) => (
              <div
                key={`${f.entityId}_${f.decisionAt}`}
                className={finelyOsCatalogCardCompact(f.wasLikelyMisjudged ? 'rose' : 'sky')}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-bold text-white truncate">{f.entityLabel}</div>
                    <div className="text-[10px] text-white/50 uppercase tracking-wide">{f.agentDisplayName}</div>
                  </div>
                  <span className={finelyOsStatusChip(f.wasLikelyMisjudged ? 'warn' : 'ok')}>
                    {f.wasLikelyMisjudged ? (
                      <span className="flex items-center gap-1">
                        <AlertTriangle size={10} /> Possible miss
                      </span>
                    ) : (
                      'Held, no loss'
                    )}
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-white/70 leading-relaxed">{f.decisionReasoning}</p>
                <div className="mt-1.5 text-[10px] text-white/45">
                  Decided {new Date(f.decisionAt).toLocaleDateString()} · now {f.actualOutcome}
                </div>
              </div>
            )}
          />
        </div>
      )}
    </div>
  );
}
