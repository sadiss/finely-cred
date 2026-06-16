import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, ExternalLink, RefreshCw, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { fetchAllPartnersAsAdmin } from '../../data/partnersRepo';
import { fetchBridgeOpsSnapshot, getProviderGatewayUrl, runMlPipelineInsights } from '../../lib/finelyBridgeClient';
import { buildClientCreditProgram } from '../../lib/finelyBridgeCreditProgram';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsDataErrorBanner } from '../../features/os/FinelyOsDataErrorBanner';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

type OpsSnapshot = {
  kpis: {
    fundReady: number;
    bridgeReady: number;
    handoffsPending: number;
    phaseDistribution: Record<string, number>;
  };
  fundReadyQueue: Array<{ partnerId: string; fullName: string | null; score: number; suggestedAt: string | null }>;
  recentHandoffs: Array<{ partnerId: string; fullName: string | null; at: string }>;
};

export default function FinelyBridgeOpsPage() {
  const navigate = useNavigate();
  const gatewayUrl = getProviderGatewayUrl();
  const [ops, setOps] = useState<OpsSnapshot | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanOut, setScanOut] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetchBridgeOpsSnapshot();
      setOps(res.ops as OpsSnapshot);
    } catch (e: any) {
      setErr(e?.message || 'Could not load Bridge ops snapshot.');
      try {
        const partners = await fetchAllPartnersAsAdmin();
        const phaseDistribution: Record<string, number> = {};
        let fundReady = 0;
        let bridgeReady = 0;
        let handoffsPending = 0;
        const fundReadyQueue: OpsSnapshot['fundReadyQueue'] = [];
        const recentHandoffs: OpsSnapshot['recentHandoffs'] = [];
        for (const p of partners) {
          const program = buildClientCreditProgram(p);
          phaseDistribution[program.phase] = (phaseDistribution[program.phase] ?? 0) + 1;
          if (program.phase === 'fund_ready') {
            fundReady += 1;
            fundReadyQueue.push({
              partnerId: p.id,
              fullName: p.profile.fullName ?? null,
              score: program.readinessScore,
              suggestedAt: program.bridgeHandoffSuggestedAt ?? null,
            });
          }
          if (program.phase === 'bridge_handoff') bridgeReady += 1;
          if (program.bridgeHandoffQueued) handoffsPending += 1;
          if (program.bridgeHandoffSuggestedAt) {
            recentHandoffs.push({ partnerId: p.id, fullName: p.profile.fullName ?? null, at: program.bridgeHandoffSuggestedAt });
          }
        }
        recentHandoffs.sort((a, b) => b.at.localeCompare(a.at));
        setOps({ kpis: { fundReady, bridgeReady, handoffsPending, phaseDistribution }, fundReadyQueue, recentHandoffs: recentHandoffs.slice(0, 15) });
      } catch {
        setOps(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const runPipelineScan = async () => {
    setBusy(true);
    setScanOut(null);
    try {
      const res = await runMlPipelineInsights(25);
      const pipeline = res.pipeline as { opsRecommendations?: string[]; fundingReady?: number };
      setScanOut((pipeline?.opsRecommendations ?? []).join('\n') || `Funding-ready sample: ${pipeline?.fundingReady ?? 0}`);
    } catch (e: any) {
      setScanOut(e?.message || 'Pipeline scan failed.');
    } finally {
      setBusy(false);
    }
  };

  const kpis = ops?.kpis;

  return (
    <PageShell title="Finely Cred ↔ Bridge ops" subtitle="Fund-ready queue, handoffs, and ML pipeline scan">
      <div className={FINELY_OS_PAGE}>
        <button type="button" className={FINELY_OS_BACK_LINK} onClick={() => navigate('/admin/dashboard')}>
          <ArrowLeft size={14} /> Admin Command
        </button>

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <h1 className={`text-xl font-bold ${FINELY_OS_ENTITY_VALUE}`}>Finely Cred ↔ Bridge ops</h1>
          <span className={finelyOsStatusChip('ok')}>Ops dashboard</span>
        </div>
        <p className={`mb-4 ${FINELY_OS_ENTITY_BODY}`}>
          KPIs for fund-ready partners, Bridge handoff queue, phase distribution, and quick links to Provider Gateway and CRM pipeline.
        </p>

        {err ? <FinelyOsDataErrorBanner message={err} onRetry={() => void load()} /> : null}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Fund-ready', value: kpis?.fundReady ?? '—', accent: 'text-emerald-300' },
            { label: 'Bridge-ready', value: kpis?.bridgeReady ?? '—', accent: 'text-violet-300' },
            { label: 'Handoffs pending', value: kpis?.handoffsPending ?? '—', accent: 'text-amber-300' },
            { label: 'Phases tracked', value: kpis ? Object.keys(kpis.phaseDistribution).length : '—', accent: 'text-sky-300' },
          ].map((k) => (
            <div key={k.label} className={`${finelyOsCatalogCard('emerald')} p-4`}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>{k.label}</div>
              <div className={`text-2xl font-bold mt-1 ${k.accent}`}>{k.value}</div>
            </div>
          ))}
        </div>

        {kpis?.phaseDistribution ? (
          <div className={`mb-6 ${finelyOsCatalogCard('violet')} p-4`}>
            <div className={`text-sm font-semibold mb-2 ${FINELY_OS_ENTITY_VALUE}`}>Phase distribution</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(kpis.phaseDistribution).map(([phase, count]) => (
                <span key={phase} className={finelyOsStatusChip('ok')}>
                  {phase.replace(/_/g, ' ')}: {count}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className={`${finelyOsCatalogCard('sky')} p-4`}>
            <div className={`flex items-center justify-between mb-3 ${FINELY_OS_ENTITY_VALUE}`}>
              <span className="font-semibold">Fund-ready queue</span>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void load()} disabled={loading}>
                <RefreshCw size={14} className="inline mr-1" />
                Refresh
              </button>
            </div>
            {loading ? (
              <p className={FINELY_OS_ENTITY_BODY}>Loading…</p>
            ) : (ops?.fundReadyQueue ?? []).length === 0 ? (
              <p className={FINELY_OS_ENTITY_BODY}>No fund-ready partners in queue.</p>
            ) : (
              <ul className="space-y-2">
                {(ops?.fundReadyQueue ?? []).map((row) => (
                  <li key={row.partnerId} className="flex items-center justify-between gap-2 text-sm">
                    <button
                      type="button"
                      className={`text-left truncate ${FINELY_OS_ENTITY_VALUE} hover:text-violet-300`}
                      onClick={() => navigate(`/admin/partners/${row.partnerId}`)}
                    >
                      {row.fullName || row.partnerId}
                    </button>
                    <span className={finelyOsStatusChip('ok')}>{row.score}%</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className={`${finelyOsCatalogCard('sky')} p-4`}>
            <div className={`font-semibold mb-3 ${FINELY_OS_ENTITY_VALUE}`}>Recent handoffs</div>
            {(ops?.recentHandoffs ?? []).length === 0 ? (
              <p className={FINELY_OS_ENTITY_BODY}>No Bridge handoffs queued yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {(ops?.recentHandoffs ?? []).map((row) => (
                  <li key={`${row.partnerId}-${row.at}`} className="flex justify-between gap-2">
                    <span className={FINELY_OS_ENTITY_VALUE}>{row.fullName || row.partnerId}</span>
                    <span className={FINELY_OS_ENTITY_BODY}>{new Date(row.at).toLocaleDateString()}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className={`mb-6 ${finelyOsCatalogCard('violet')} p-4`}>
          <div className={`font-semibold mb-2 ${FINELY_OS_ENTITY_VALUE}`}>ML pipeline scan</div>
          <p className={`mb-3 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            Aggregate pipeline insights (v4) — blockers, funding-ready counts, and ops recommendations.
          </p>
          <button type="button" className={FINELY_OS_PRIMARY_BTN} disabled={busy} onClick={() => void runPipelineScan()}>
            <Sparkles size={14} className="inline mr-1" />
            {busy ? 'Scanning…' : 'Run pipeline scan'}
          </button>
          {scanOut ? (
            <pre className={`mt-3 text-xs whitespace-pre-wrap rounded-lg border border-white/10 p-3 ${FINELY_OS_ENTITY_INPUT}`}>{scanOut}</pre>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2">
          {gatewayUrl ? (
            <a href={gatewayUrl} target="_blank" rel="noopener noreferrer" className={FINELY_OS_SECONDARY_BTN}>
              <ExternalLink size={14} className="inline mr-1" />
              Provider Gateway (Bridge)
            </a>
          ) : null}
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/crm')}>
            <BriefcaseBusiness size={14} className="inline mr-1" />
            CRM pipeline
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/nora-capital')}>
            Nora Capital API
            <ArrowRight size={14} className="inline ml-1" />
          </button>
        </div>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
