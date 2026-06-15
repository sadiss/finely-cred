import React, { useEffect, useState } from 'react';
import { Copy, Sparkles, TrendingDown } from 'lucide-react';
import type { CrmRecord } from '../../../domain/crmRecords';
import { runCrmCopilot } from '../../ai/crmCopilot/runCrmCopilot';
import { FinelyOsAIPanelShell } from '../../os/FinelyOsAIPanelShell';
import { FinelyOsAiGatewayBanner } from '../../os/FinelyOsAiGatewayBanner';
import {FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_GLASS_INNER,
  finelyOsStatusChip,
  finelyOsCatalogCard,} from '../../os/finelyOsLightUi';

function scoreChip(label: 'hot' | 'warm' | 'cold' | undefined) {
  if (label === 'hot') return 'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase border border-emerald-500/30 bg-emerald-500/10 text-emerald-200';
  if (label === 'warm') return 'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase border border-amber-500/30 bg-amber-500/10 text-amber-200';
  return 'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold uppercase fc-light-glass-panel fc-light-chrome-panel border text-white/60';
}

function churnChip(risk: 'high' | 'medium' | 'low') {
  if (risk === 'high') return finelyOsStatusChip('blocked');
  if (risk === 'medium') return finelyOsStatusChip('warn');
  return finelyOsStatusChip('ok');
}

export function CrmAICopilotPanel({ record }: { record: CrmRecord }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof runCrmCopilot>> | null>(null);

  useEffect(() => {
    setResult(null);
  }, [record.id]);

  const run = async () => {
    setBusy(true);
    try {
      setResult(await runCrmCopilot(record));
    } finally {
      setBusy(false);
    }
  };

  return (
    <FinelyOsAIPanelShell icon={Sparkles} accent="fuchsia" title="CRM AI Copilot Pro" actionLabel={busy ? 'Analyzing…' : 'Analyze'} onAction={() => void run()} busy={busy}>
      <FinelyOsAiGatewayBanner compact className="!p-3" />
      {result ? (
        <div className="space-y-3 text-sm">
          <div className={scoreChip(result.scoreLabel)}>
            Score {result.score} • {result.scoreLabel}
          </div>
          <div className={`inline-flex items-center gap-2 ${churnChip(result.churnRisk)}`}>
            <TrendingDown size={12} /> Churn risk: {result.churnRisk}
          </div>
          <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>Forecast weight: {Math.round(result.forecastWeight * 100)}% of deal value</div>
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Next action</div>
            <p className={FINELY_OS_ENTITY_VALUE}>{result.nextAction}</p>
          </div>
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Convert path</div>
            <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>{result.convertPath}</p>
          </div>
          {result.packageSuggestions.length ? (
            <ul className={`space-y-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
              {result.packageSuggestions.map((p) => (
                <li key={p.packageId}>
                  <span className={FINELY_OS_ENTITY_VALUE}>{p.name}</span> ({p.delivery}) — {p.reason}
                </li>
              ))}
            </ul>
          ) : null}
          {result.objectionDraft ? (
            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Objection draft</span>
                <button type="button" onClick={() => void navigator.clipboard.writeText(result.objectionDraft || '')} className="text-white/45 hover:text-white/80" title="Copy">
                  <Copy size={14} />
                </button>
              </div>
              <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>{result.objectionDraft}</p>
            </div>
          ) : null}
          {result.outreachDraft ? (
            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Outreach draft</span>
                <button
                  type="button"
                  onClick={() => void navigator.clipboard.writeText(result.outreachDraft || '')}
                  className="text-white/45 hover:text-white/80"
                  title="Copy"
                >
                  <Copy size={14} />
                </button>
              </div>
              <pre className={`${FINELY_OS_ENTITY_BODY} text-xs whitespace-pre-wrap font-sans`}>{result.outreachDraft}</pre>
            </div>
          ) : null}
        </div>
      ) : (
        <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>Score, next action, package fit, and outreach draft — catalog-constrained.</p>
      )}
    </FinelyOsAIPanelShell>
  );
}
