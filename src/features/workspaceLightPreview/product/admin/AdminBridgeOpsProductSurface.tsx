import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchAllPartnersAsAdmin } from '../../../../data/partnersRepo';
import { fetchBridgeOpsSnapshot, getProviderGatewayUrl, runMlPipelineInsights } from '../../../../lib/finelyBridgeClient';
import { buildClientCreditProgram } from '../../../../lib/finelyBridgeCreditProgram';
import { FinelyOsDataErrorBanner } from '../../../os/FinelyOsDataErrorBanner';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsGlowTextarea,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import './adminBridgeOpsProductSurface.css';

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

const PHASE_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

export default function AdminBridgeOpsProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'sky';
  const gatewayUrl = getProviderGatewayUrl();
  const [ops, setOps] = useState<OpsSnapshot | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [scanOut, setScanOut] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const res = await fetchBridgeOpsSnapshot();
      setOps(res.ops as OpsSnapshot);
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Could not load Bridge ops snapshot.');
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
        setOps({
          kpis: { fundReady, bridgeReady, handoffsPending, phaseDistribution },
          fundReadyQueue,
          recentHandoffs: recentHandoffs.slice(0, 15),
        });
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
    } catch (e: unknown) {
      setScanOut((e as Error)?.message || 'Pipeline scan failed.');
    } finally {
      setBusy(false);
    }
  };

  const kpis = ops?.kpis;
  const selectedPartner = ops?.fundReadyQueue.find((r) => r.partnerId === selectedPartnerId) ?? null;
  const phaseEntries = Object.entries(kpis?.phaseDistribution ?? {}).sort((a, b) => b[1] - a[1]);
  const fundReadyQueue = ops?.fundReadyQueue ?? [];

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Finance"
      title="Finely Cred ↔ Bridge ops"
      description="Command deck for fund-ready partners — scan the pipeline, pick a handoff, open the partner file."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon ?? Sparkles}
      primaryAction={
        <ProductPagePrimaryAction label={busy ? 'Scanning…' : 'Run pipeline scan'} onClick={() => void runPipelineScan()} />
      }
      secondaryAction={
        gatewayUrl ? (
          <a href={gatewayUrl} target="_blank" rel="noopener noreferrer" className="fc-wlp-btn-secondary">
            <ExternalLink size={14} /> Provider Gateway
          </a>
        ) : (
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/crm')}>
            CRM pipeline
          </button>
        )
      }
      metrics={[
        { label: 'Fund-ready', value: String(kpis?.fundReady ?? '—'), hint: 'Ready for Bridge', accent: 'emerald' },
        { label: 'Bridge-ready', value: String(kpis?.bridgeReady ?? '—'), hint: 'In handoff phase', accent: 'violet' },
        { label: 'Handoffs pending', value: String(kpis?.handoffsPending ?? '—'), hint: 'Queued transfers', accent: 'rose' },
        { label: 'Phases', value: String(kpis ? Object.keys(kpis.phaseDistribution).length : '—'), hint: 'Tracked stages', accent: 'sky' },
      ]}
      metricTitle="Bridge command deck"
      metricDescription="Status tiles up top, fund-ready runway in the middle, pipeline console below."
      metricsVariant="instrument"
    >
      {err ? <FinelyOsDataErrorBanner message={err} onRetry={() => void load()} /> : null}

      <div className="fc-admin-bridge-ops" data-surface-layout="command-deck">
        {/* Command deck — status tiles */}
        <section className="fc-admin-bridge-deck">
          {[
            { label: 'Fund-ready', value: kpis?.fundReady ?? '—', hint: 'Partners ready for Bridge', accent: 'emerald' as const, icon: TrendingUp },
            { label: 'Bridge-ready', value: kpis?.bridgeReady ?? '—', hint: 'In handoff phase', accent: 'violet' as const, icon: Sparkles },
            { label: 'Handoffs pending', value: kpis?.handoffsPending ?? '—', hint: 'Queued transfers', accent: 'rose' as const, icon: Users },
            { label: 'Phases tracked', value: kpis ? Object.keys(kpis.phaseDistribution).length : '—', hint: 'Credit program stages', accent: 'sky' as const, icon: BriefcaseBusiness },
          ].map((tile) => {
            const Icon = tile.icon;
            return (
              <div key={tile.label} className={`fc-admin-bridge-deck-tile ${finelyOsCatalogCard(tile.accent)}`} data-fc-accent={tile.accent}>
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-xs font-black uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>{tile.label}</span>
                  <Icon size={18} className="opacity-70" />
                </div>
                <div className={`fc-admin-bridge-deck-value ${FINELY_OS_ENTITY_VALUE}`}>{tile.value}</div>
                <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{tile.hint}</p>
              </div>
            );
          })}
        </section>

        {/* Phase runway */}
        {phaseEntries.length > 0 ? (
          <section className={`fc-admin-bridge-runway ${finelyOsCatalogCard('violet')} p-6 lg:p-8`} data-fc-accent="violet">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  <TrendingUp size={16} />
                  <span>Phase runway</span>
                </div>
                <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  Partner credit program stages across your portfolio.
                </p>
              </div>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void load()} disabled={loading}>
                <RefreshCw size={14} /> Refresh
              </button>
            </div>

            <div className="fc-admin-bridge-runway-track mt-6">
              {phaseEntries.map(([phase, count], index) => {
                const phaseAccent = PHASE_ACCENTS[index % PHASE_ACCENTS.length];
                return (
                  <React.Fragment key={phase}>
                    <div className={`fc-admin-bridge-runway-node ${finelyOsCatalogCard(phaseAccent)}`} data-fc-accent={phaseAccent}>
                      <span className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{count}</span>
                      <span className={`text-sm font-bold leading-tight ${FINELY_OS_ENTITY_BODY}`}>
                        {phase.replace(/_/g, ' ')}
                      </span>
                    </div>
                    {index < phaseEntries.length - 1 ? (
                      <div className="fc-admin-bridge-runway-connector" aria-hidden>
                        <ChevronRight size={18} />
                      </div>
                    ) : null}
                  </React.Fragment>
                );
              })}
            </div>
          </section>
        ) : null}

        {/* Fund-ready runway + handoff rail + pipeline console */}
        <div className="fc-admin-bridge-layout">
          <section className={`fc-admin-bridge-runway ${finelyOsCatalogCard('emerald')} p-6 lg:p-8`} data-fc-accent="emerald">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  <Users size={16} />
                  <span>Fund-ready runway</span>
                </div>
                <h2 className={`mt-2 text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Select a partner for handoff</h2>
                <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  {loading ? 'Loading queue…' : `${fundReadyQueue.length} partner${fundReadyQueue.length === 1 ? '' : 's'} ready for Bridge.`}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" className={FINELY_OS_PRIMARY_BTN} disabled={busy} onClick={() => void runPipelineScan()}>
                  <Sparkles size={14} /> {busy ? 'Scanning…' : 'Run pipeline scan'}
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/nora-capital')}>
                  Nora Capital API <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {fundReadyQueue.length === 0 ? (
              <p className={`mt-6 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>No fund-ready partners in queue.</p>
            ) : (
              <div className="fc-admin-bridge-runway-track mt-6">
                {fundReadyQueue.map((row, index) => {
                  const active = row.partnerId === selectedPartnerId;
                  const nodeAccent = PHASE_ACCENTS[index % PHASE_ACCENTS.length];
                  return (
                    <React.Fragment key={row.partnerId}>
                      <button
                        type="button"
                        data-selected={active ? 'true' : undefined}
                        onClick={() => setSelectedPartnerId(row.partnerId)}
                        className={`fc-admin-bridge-runway-node ${finelyOsCatalogCard(nodeAccent)}`}
                        data-fc-accent={nodeAccent}
                      >
                        <span className={`text-lg font-extrabold leading-tight line-clamp-2 ${FINELY_OS_ENTITY_VALUE}`}>
                          {row.fullName || row.partnerId}
                        </span>
                        <span className={finelyOsStatusChip('ok')}>{row.score}% ready</span>
                        {row.suggestedAt ? (
                          <span className={`text-xs ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                            {new Date(row.suggestedAt).toLocaleDateString()}
                          </span>
                        ) : null}
                      </button>
                      {index < fundReadyQueue.length - 1 ? (
                        <div className="fc-admin-bridge-runway-connector" aria-hidden>
                          <ChevronRight size={18} />
                        </div>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </div>
            )}

            {selectedPartner ? (
              <div className={`mt-6 ${finelyOsCatalogCard('sky')} p-5 lg:p-6 flex flex-wrap items-center justify-between gap-4`} data-fc-accent="sky">
                <div>
                  <div className={`text-sm font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Selected for handoff</div>
                  <div className={`mt-1 text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                    {selectedPartner.fullName || selectedPartner.partnerId}
                  </div>
                  <p className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>Readiness {selectedPartner.score}%</p>
                </div>
                <button
                  type="button"
                  className={FINELY_OS_PRIMARY_BTN}
                  onClick={() => navigate(`/admin/partners/${selectedPartner.partnerId}`)}
                >
                  Open partner file <ArrowRight size={14} />
                </button>
              </div>
            ) : null}

            <div className="fc-admin-bridge-console mt-6">
              <label className="block space-y-2">
                <span className={`text-sm font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Pipeline scan output</span>
                <textarea
                  readOnly
                  value={scanOut ?? ''}
                  placeholder="Run a pipeline scan — blockers, funding-ready counts, and ops recommendations appear here."
                  rows={10}
                  className={`${finelyOsGlowTextarea} w-full text-sm font-mono min-h-[280px]`}
                />
              </label>
            </div>
          </section>

          <aside className="space-y-4">
            <div className={`${finelyOsCatalogCard('rose')} p-5 lg:p-6`} data-fc-accent="rose">
              <div className={`text-lg font-extrabold mb-3 ${FINELY_OS_ENTITY_VALUE}`}>Recent handoffs</div>
              {(ops?.recentHandoffs ?? []).length === 0 ? (
                <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>No Bridge handoffs queued yet.</p>
              ) : (
                <div className="fc-admin-bridge-handoff-list">
                  {(ops?.recentHandoffs ?? []).map((row) => (
                    <button
                      key={`${row.partnerId}-${row.at}`}
                      type="button"
                      className={`fc-admin-bridge-handoff-row ${finelyOsCatalogCard('violet')}`}
                      data-fc-accent="violet"
                      onClick={() => navigate(`/admin/partners/${row.partnerId}`)}
                    >
                      <span className={`truncate font-bold ${FINELY_OS_ENTITY_VALUE}`}>{row.fullName || row.partnerId}</span>
                      <span className={`text-sm shrink-0 ${FINELY_OS_ENTITY_BODY}`}>{new Date(row.at).toLocaleDateString()}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={`${finelyOsCatalogCard('sky')} p-5 lg:p-6 space-y-3 fc-luxury-glass`} data-fc-accent="sky">
              <div className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Quick links</div>
              {gatewayUrl ? (
                <a href={gatewayUrl} target="_blank" rel="noopener noreferrer" className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center`}>
                  <ExternalLink size={14} /> Provider Gateway (Bridge)
                </a>
              ) : null}
              <button type="button" className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center`} onClick={() => navigate('/admin/crm')}>
                <BriefcaseBusiness size={14} /> CRM pipeline
              </button>
              <button type="button" className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center`} onClick={() => void load()} disabled={loading}>
                <RefreshCw size={14} /> Refresh snapshot
              </button>
            </div>
          </aside>
        </div>
      </div>
    </ProductHubScaffold>
  );
}
