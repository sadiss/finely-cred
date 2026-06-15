import React, { useMemo } from 'react';
import { AlertTriangle, ArrowRight, LineChart, Sparkles, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { CreditIntelDashboardModel } from '../../lib/creditIntelDashboard';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlassShell,
} from '../../features/os/finelyOsLightUi';

export function CreditIntelDashboardPanel({
  model,
  onSpawnTask,
}: {
  model: CreditIntelDashboardModel;
  onSpawnTask?: (candidateId: string) => void;
}) {
  const navigate = useNavigate();

  const scoreDelta = useMemo(() => {
    const t = model.scoreTrend;
    if (t.length < 2) return null;
    return t[t.length - 1]!.score - t[0]!.score;
  }, [model.scoreTrend]);

  return (
    <div className={`space-y-4 ${finelyOsGlassShell('panel', 'sky')}`}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <Sparkles size={14} className="text-sky-300" /> Credit Intel Dashboard
          </div>
          <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE} text-xl font-bold`}>
            Readiness {model.readiness.score}/100
            {model.headlineScore != null ? (
              <span className="text-white/55 text-base font-normal ml-3">
                Score ~{model.headlineScore}
                {scoreDelta != null ? (
                  <span className={scoreDelta >= 0 ? ' text-emerald-300' : ' text-rose-300'}>
                    {' '}
                    ({scoreDelta >= 0 ? '+' : ''}
                    {scoreDelta})
                  </span>
                ) : null}
              </span>
            ) : null}
          </div>
        </div>
        <button type="button" onClick={() => navigate('/portal/letters')} className={FINELY_OS_PRIMARY_BTN}>
          Open Letter Studio <ArrowRight size={14} />
        </button>
      </div>

      {model.bureauAlert.show ? (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            model.bureauAlert.tone === 'blocking'
              ? 'border-rose-500/35 bg-rose-500/10 text-rose-100'
              : model.bureauAlert.tone === 'warning'
                ? 'border-amber-500/35 bg-amber-500/10 text-amber-100'
                : 'border-sky-500/25 bg-sky-500/10 text-sky-100'
          }`}
        >
          <AlertTriangle size={14} className="inline mr-2" />
          {model.bureauAlert.message}
        </div>
      ) : null}

      <div className="grid md:grid-cols-3 gap-4">
        <div className={`${finelyOsGlassShell('inner', 'emerald')} p-4`}>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} flex items-center gap-1`}>
            <LineChart size={12} /> Score trend
          </div>
          {model.scoreTrend.length === 0 ? (
            <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>Upload reports over time to see score snapshots.</p>
          ) : (
            <div className="mt-2 flex items-end gap-1 h-16">
              {model.scoreTrend.map((p) => (
                <div
                  key={p.at}
                  className="flex-1 bg-sky-500/40 rounded-t"
                  style={{ height: `${Math.max(8, ((p.score - 300) / 550) * 100)}%` }}
                  title={`${p.score} · ${new Date(p.at).toLocaleDateString()}`}
                />
              ))}
            </div>
          )}
        </div>

        <div className={`${finelyOsGlassShell('inner', 'violet')} p-4 md:col-span-2`}>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} flex items-center gap-1`}>
            <Target size={12} /> Dispute next (AI-ranked)
          </div>
          {model.nextDisputes.length === 0 ? (
            <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>No open candidates — or evidence is linked for top items.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {model.nextDisputes.map((d) => (
                <li key={d.candidateId} className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className={FINELY_OS_ENTITY_BODY}>
                    <span className="text-violet-200 font-semibold">{d.account}</span> · {d.type} · severity {d.severity}
                  </span>
                  {onSpawnTask ? (
                    <button type="button" onClick={() => onSpawnTask(d.candidateId)} className={FINELY_OS_SECONDARY_BTN}>
                      Create task
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {model.readiness.blockers.length > 0 ? (
        <div className="text-xs space-y-1">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Blockers</div>
          {model.readiness.blockers.slice(0, 3).map((b) => (
            <div key={b} className={FINELY_OS_ENTITY_BODY}>
              • {b}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
