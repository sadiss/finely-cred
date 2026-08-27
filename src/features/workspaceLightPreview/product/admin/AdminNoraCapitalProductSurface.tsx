import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  BriefcaseBusiness,
  ExternalLink,
  PlaneLanding,
  Radio,
  ShieldAlert,
  Sparkles,
  Terminal,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getNoraCapitalSettings } from '../../../../data/settingsRepo';
import { fetchAllPartnersAsAdmin } from '../../../../data/partnersRepo';
import type { Partner } from '../../../../domain/partners';
import { noraPing, noraRequest } from '../../../../lib/noraCapitalClient';
import { finelyPartnerReadiness } from '../../../../lib/finelyPartnerApiClient';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import { FinelyOsDataErrorBanner } from '../../../os/FinelyOsDataErrorBanner';
import {
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlowTextarea,
  finelyOsInlineListItem,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

const FUNDING_STAGE_LABEL: Record<string, string> = {
  not_ready: 'Not ready',
  ready: 'Ready',
  submitted: 'Submitted',
  in_review: 'In review',
  funded: 'Funded',
  declined: 'Declined',
};

const RUNWAY_LANES: Array<{
  id: string;
  label: string;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
}> = [
  { id: 'ready', label: 'Ready', accent: 'emerald' },
  { id: 'submitted', label: 'Submitted', accent: 'violet' },
  { id: 'in_review', label: 'In review', accent: 'sky' },
  { id: 'funded', label: 'Funded', accent: 'rose' },
];

type NoraTestPayload = {
  id: string;
  label: string;
  path: string;
  method: 'GET' | 'POST';
  body: string;
};

const NORA_PAYLOADS_KEY = 'finely.nora.testPayloads.v1';

const DEFAULT_NORA_PAYLOADS: NoraTestPayload[] = [
  {
    id: 'ping',
    label: 'Ping',
    path: '/ping',
    method: 'GET',
    body: '{}',
  },
  {
    id: 'create_app',
    label: 'Create application (sample)',
    path: '/v1/applications',
    method: 'POST',
    body: JSON.stringify(
      {
        partnerId: 'partner_REPLACE',
        fullName: 'Test Partner',
        email: 'test@example.com',
        fundingStage: 'ready',
        readinessScore: 72,
      },
      null,
      2,
    ),
  },
  {
    id: 'pull_dossiers',
    label: 'Pull dossiers list (Nora)',
    path: '/v1/partners/finelycred/dossiers',
    method: 'GET',
    body: '{}',
  },
  {
    id: 'pull_client_profile',
    label: 'Pull CRM profile (Nora)',
    path: '/v1/partners/finelycred/clients/profile?clientId=REPLACE',
    method: 'GET',
    body: '{}',
  },
];

function loadNoraPayloads(): NoraTestPayload[] {
  try {
    const raw = localStorage.getItem(NORA_PAYLOADS_KEY);
    if (!raw) return DEFAULT_NORA_PAYLOADS;
    const parsed = JSON.parse(raw) as NoraTestPayload[];
    return Array.isArray(parsed) && parsed.length ? parsed : DEFAULT_NORA_PAYLOADS;
  } catch {
    return DEFAULT_NORA_PAYLOADS;
  }
}

function saveNoraPayloads(payloads: NoraTestPayload[]) {
  try {
    localStorage.setItem(NORA_PAYLOADS_KEY, JSON.stringify(payloads));
  } catch {
    // ignore
  }
}

function stageAccentClass(accent: 'emerald' | 'violet' | 'sky' | 'rose') {
  if (accent === 'emerald') return 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200';
  if (accent === 'violet') return 'border-violet-500/50 bg-violet-500/15 text-violet-200';
  if (accent === 'sky') return 'border-sky-500/50 bg-sky-500/15 text-sky-200';
  return 'border-rose-500/50 bg-rose-500/15 text-rose-200';
}

export default function AdminNoraCapitalProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'emerald';
  const nora = useMemo(() => getNoraCapitalSettings(), []);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [out, setOut] = useState<string | null>(null);
  const [fundingPipeline, setFundingPipeline] = useState<Partner[]>([]);
  const [pipelineErr, setPipelineErr] = useState<string | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(true);
  const [selectedLane, setSelectedLane] = useState<string | null>(null);

  const [path, setPath] = useState('/ping');
  const [method, setMethod] = useState<'GET' | 'POST'>('GET');
  const [body, setBody] = useState('{\n  "hello": "world"\n}');
  const [partnerApiPartnerId, setPartnerApiPartnerId] = useState('');
  const [savedPayloads, setSavedPayloads] = useState<NoraTestPayload[]>(() => loadNoraPayloads());
  const [payloadLabel, setPayloadLabel] = useState('');

  const loadFundingPipeline = React.useCallback(async () => {
    setPipelineLoading(true);
    setPipelineErr(null);
    try {
      const all = await fetchAllPartnersAsAdmin();
      setFundingPipeline(
        all.filter((p) => {
          const stage = (p as Partner & { fundingStage?: string }).fundingStage ?? p.journeySignals?.fundingStage;
          return stage && stage !== 'not_ready';
        }),
      );
    } catch (e: unknown) {
      setPipelineErr((e as Error)?.message || 'Could not load funding pipeline.');
      setFundingPipeline([]);
    } finally {
      setPipelineLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFundingPipeline();
  }, [loadFundingPipeline]);

  const laneCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const lane of RUNWAY_LANES) counts[lane.id] = 0;
    for (const p of fundingPipeline) {
      const stage = p.fundingStage ?? String(p.journeySignals?.fundingStage ?? '');
      if (counts[stage] !== undefined) counts[stage] += 1;
    }
    return counts;
  }, [fundingPipeline]);

  const filteredPipeline = useMemo(() => {
    if (!selectedLane) return fundingPipeline;
    return fundingPipeline.filter((p) => {
      const stage = p.fundingStage ?? String(p.journeySignals?.fundingStage ?? '');
      return stage === selectedLane;
    });
  }, [fundingPipeline, selectedLane]);

  const runPing = async () => {
    setBusy(true);
    setErr(null);
    setOut(null);
    try {
      const res = await noraPing({ idempotencyKey: `ping:${Date.now().toString(16)}` });
      setOut(`status: ${res.status}\n\n${res.body}`);
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Ping failed.');
    } finally {
      setBusy(false);
    }
  };

  const runPartnerReadiness = async () => {
    setBusy(true);
    setErr(null);
    setOut(null);
    try {
      const res = await finelyPartnerReadiness({ partnerId: partnerApiPartnerId.trim() || undefined });
      setOut(JSON.stringify(res.readiness, null, 2));
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Partner readiness failed.');
    } finally {
      setBusy(false);
    }
  };

  const runReq = async () => {
    setBusy(true);
    setErr(null);
    setOut(null);
    try {
      let parsed: unknown = undefined;
      if (method !== 'GET') {
        try {
          parsed = JSON.parse(body);
        } catch {
          throw new Error('Body must be valid JSON.');
        }
      }
      const res = await noraRequest({
        path: path.trim(),
        method,
        body: method === 'GET' ? undefined : parsed,
        idempotencyKey: `req:${Date.now().toString(16)}`,
      });
      setOut(`status: ${res.status}\ncontent-type: ${res.contentType}\n\n${res.body}`);
    } catch (e: unknown) {
      setErr((e as Error)?.message || 'Request failed.');
    } finally {
      setBusy(false);
    }
  };

  const applyPayload = (payload: NoraTestPayload) => {
    setPath(payload.path);
    setMethod(payload.method);
    setBody(payload.body);
  };

  const saveCurrentPayload = () => {
    const label = payloadLabel.trim() || `Payload ${savedPayloads.length + 1}`;
    const next: NoraTestPayload = {
      id: `custom_${Date.now().toString(16)}`,
      label,
      path: path.trim(),
      method,
      body,
    };
    const merged = [...savedPayloads.filter((p) => p.id !== next.id), next];
    setSavedPayloads(merged);
    saveNoraPayloads(merged);
    setPayloadLabel('');
  };

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Finance"
      title="Nora Capital Group API"
      description="Funding runway and secure API shim — configure secrets in Supabase, then test calls here."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={<ProductPagePrimaryAction label="Ping Nora API" onClick={() => void runPing()} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/settings')}>
          Open settings <ArrowRight size={14} />
        </button>
      }
      metrics={[
        { label: 'Status', value: nora.status, hint: 'Integration health', accent: 'emerald' },
        { label: 'Test mode', value: String(nora.testMode), hint: 'Sandbox vs live', accent: 'violet' },
        { label: 'Pipeline', value: String(fundingPipeline.length), hint: 'Partners in funding', accent: 'sky' },
        { label: 'Payloads', value: String(savedPayloads.length), hint: 'Saved test bodies', accent: 'rose' },
      ]}
      metricTitle="Capital runway"
      metricDescription="Partners move left to right — test the API on the workbench."
      metricsVariant="inline"
    >
      <div className={FINELY_OS_PAGE} data-surface-layout="capital-runway">
        <div className="flex flex-wrap gap-2 justify-end">
          <button type="button" onClick={() => navigate('/admin/monitoring')} className={FINELY_OS_SECONDARY_BTN}>
            Monitoring <ArrowRight size={14} />
          </button>
        </div>

        {/* Horizontal capital runway — signature hero band */}
        <section
          className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-6`}
          data-fc-accent="violet"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <PlaneLanding size={18} />
                <span>Capital runway</span>
              </div>
              <h2 className="mt-2 text-3xl font-extrabold">Funding stage flow</h2>
              <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                {fundingPipeline.length} partners on the runway · tap a lane to filter the queue.
              </p>
            </div>
            <div className={`${finelyOsCatalogCard('emerald')} px-5 py-4`} data-fc-accent="emerald">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Connection</div>
              <div className={`mt-1 text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{nora.status}</div>
              <div className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                testMode: {String(nora.testMode)}
              </div>
            </div>
          </div>

          <div className="relative">
            <div
              className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-gradient-to-r from-emerald-500/50 via-violet-500/40 to-rose-500/50"
              aria-hidden
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
              {RUNWAY_LANES.map((lane) => {
                const active = selectedLane === lane.id;
                const count = laneCounts[lane.id] ?? 0;
                return (
                  <button
                    key={lane.id}
                    type="button"
                    onClick={() => setSelectedLane(active ? null : lane.id)}
                    className={`rounded-2xl border-2 p-5 text-left transition-all ${stageAccentClass(lane.accent)} ${
                      active ? 'ring-2 ring-white/30 scale-[1.02]' : 'opacity-90 hover:opacity-100'
                    }`}
                    data-fc-accent={lane.accent}
                  >
                    <div className="text-3xl font-extrabold">{count}</div>
                    <div className="mt-2 text-sm font-extrabold uppercase tracking-wide">{lane.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {selectedLane ? (
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setSelectedLane(null)}>
              Show all lanes
            </button>
          ) : null}
        </section>

        {/* Connection config strip */}
        <div className={`${FINELY_OS_BANNER} space-y-3`}>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-sky-300`}>
            <BriefcaseBusiness size={18} />
            <span>Configuration</span>
          </div>
          <div className={`${FINELY_OS_ENTITY_BODY} space-y-2 text-base font-semibold`}>
            <div>
              Base URL (non-secret): <span className={`font-mono ${FINELY_OS_ENTITY_VALUE}`}>{nora.baseUrl || '—'}</span>
            </div>
            <div className="text-sm">
              Secrets in Supabase Edge Function secrets:{' '}
              <span className="font-mono">NORA_CAPITAL_BASE_URL</span>,{' '}
              <span className="font-mono">NORA_CAPITAL_API_KEY</span>,{' '}
              <span className="font-mono">FINELY_PARTNER_API_KEYS_JSON</span> (for Nora → Finely readiness API).
            </div>
          </div>
        </div>

        {/* Split workbench — pipeline queue + API console */}
        <div className="grid gap-6 lg:grid-cols-12 items-start">
          <aside className={`lg:col-span-5 space-y-4 ${finelyOsCatalogCard('sky')} p-6 lg:p-8`} data-fc-accent="sky">
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <Radio size={16} />
              <span>Funding queue</span>
            </div>
            <h3 className="text-2xl font-extrabold">
              {selectedLane ? FUNDING_STAGE_LABEL[selectedLane] ?? selectedLane : 'All active partners'}
            </h3>

            {pipelineErr ? (
              <FinelyOsDataErrorBanner
                message={pipelineErr}
                hint="Check Supabase config and admin-list-partners edge function."
                onRetry={() => void loadFundingPipeline()}
              />
            ) : pipelineLoading ? (
              <div className={`${FINELY_OS_ENTITY_BODY} text-base font-semibold`}>Loading funding pipeline…</div>
            ) : filteredPipeline.length === 0 ? (
              <div className={`${FINELY_OS_ENTITY_BODY} text-base font-semibold`}>No partners in this lane yet.</div>
            ) : (
              <FinelyOsPaginatedStack
                items={filteredPipeline}
                pageSize={6}
                emptyMessage="No partners in this lane."
                renderItem={(p) => {
                  const stage = p.fundingStage ?? String(p.journeySignals?.fundingStage ?? '—');
                  const noraAppId = (p.journeySignals?.fundingMeta as { noraApplicationId?: string } | undefined)?.noraApplicationId;
                  return (
                    <div key={p.id} className={`${finelyOsInlineListItem()} p-4 flex flex-wrap justify-between gap-2`}>
                      <div>
                        <div className={FINELY_OS_ENTITY_VALUE}>{p.profile.fullName}</div>
                        <div className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>{p.profile.email}</div>
                        {noraAppId ? (
                          <div className={`text-xs font-mono mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>Nora app: {noraAppId}</div>
                        ) : null}
                      </div>
                      <div className={`text-sm font-mono font-bold ${FINELY_OS_ENTITY_SUBLABEL}`}>
                        {FUNDING_STAGE_LABEL[stage] ?? stage}
                      </div>
                    </div>
                  );
                }}
              />
            )}
          </aside>

          <section className={`lg:col-span-7 space-y-5 ${finelyOsCatalogCard('rose')} p-6 lg:p-8`} data-fc-accent="rose">
            <div>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <Terminal size={16} />
                <span>API workbench</span>
              </div>
              <h3 className="mt-2 text-2xl font-extrabold">Test the integration</h3>
            </div>

            <div className={`${finelyOsCatalogCard('emerald')} p-5 space-y-3`} data-fc-accent="emerald">
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <Sparkles size={16} />
                <span>Quick ping</span>
              </div>
              <button
                type="button"
                className={`${FINELY_OS_PRIMARY_BTN} w-full justify-center`}
                onClick={() => void runPing()}
                disabled={busy}
              >
                Ping Nora API
              </button>
              <p className={`text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                If ping fails, check secrets, allowlisted paths, and Nora endpoint availability.
              </p>
            </div>

            <div className="space-y-4">
              <p className={`text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                Unknown paths are blocked by default. Extend via{' '}
                <span className={`font-mono font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>NORA_CAPITAL_ALLOWED_PATHS_JSON</span>.
                See <span className={`font-mono ${FINELY_OS_ENTITY_VALUE}`}>docs/NORA_CAPITAL_API.md</span> for contract details.
              </p>

              <label className="block">
                <div className={FINELY_OS_ENTITY_LABEL}>Saved test payloads</div>
                <select
                  className={`${FINELY_OS_ENTITY_SELECT} text-sm w-full`}
                  defaultValue=""
                  onChange={(e) => {
                    const id = e.target.value;
                    if (!id) return;
                    const payload = savedPayloads.find((p) => p.id === id);
                    if (payload) applyPayload(payload);
                    e.target.value = '';
                  }}
                >
                  <option value="">Load saved payload…</option>
                  {savedPayloads.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap gap-2">
                <input
                  value={payloadLabel}
                  onChange={(e) => setPayloadLabel(e.target.value)}
                  className={`${FINELY_OS_ENTITY_INPUT} flex-1 min-w-[140px]`}
                  placeholder="Save as label…"
                />
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={saveCurrentPayload}>
                  Save payload
                </button>
              </div>

              <label className="block">
                <div className={FINELY_OS_ENTITY_LABEL}>Path</div>
                <input value={path} onChange={(e) => setPath(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>Method</div>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as 'GET' | 'POST')}
                    className={`${FINELY_OS_ENTITY_SELECT} text-sm`}
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                  </select>
                </label>
                <a
                  href="https://supabase.com/docs/guides/functions"
                  target="_blank"
                  rel="noreferrer"
                  className={`${FINELY_OS_SECONDARY_BTN} h-[46px] self-end justify-center`}
                >
                  Supabase functions <ExternalLink size={14} />
                </a>
              </div>

              {method !== 'GET' ? (
                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>JSON body</div>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    rows={6}
                    className={`${finelyOsGlowTextarea('violet')} min-h-[160px] font-mono text-sm`}
                  />
                </label>
              ) : null}

              <button
                type="button"
                className={`${FINELY_OS_PRIMARY_BTN} w-full justify-center`}
                onClick={() => void runReq()}
                disabled={busy}
              >
                Send request
              </button>
            </div>

            <div className={`${finelyOsCatalogCard('violet')} p-5 space-y-3`} data-fc-accent="violet">
              <div className={FINELY_OS_ENTITY_VALUE}>finely-partner-api (Nora reads readiness)</div>
              <label className="block">
                <div className={FINELY_OS_ENTITY_LABEL}>Partner ID</div>
                <input
                  value={partnerApiPartnerId}
                  onChange={(e) => setPartnerApiPartnerId(e.target.value)}
                  className={FINELY_OS_ENTITY_INPUT}
                  placeholder="partner_..."
                />
              </label>
              <button
                type="button"
                className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center`}
                onClick={() => void runPartnerReadiness()}
                disabled={busy}
              >
                Fetch readiness snapshot
              </button>
            </div>

            <div className={`${finelyOsCatalogCard('sky')} p-5 space-y-3`} data-fc-accent="sky">
              <div className={FINELY_OS_ENTITY_VALUE}>Response terminal</div>
              {err ? (
                <div className={FINELY_OS_NOTICE_WARN}>
                  <ShieldAlert size={18} className="mt-0.5 shrink-0" />
                  <div className="font-bold">{err}</div>
                </div>
              ) : null}
              <pre
                className={`whitespace-pre-wrap ${FINELY_OS_ENTITY_BODY} leading-relaxed font-mono text-sm min-h-[120px] text-base`}
              >
                {out || 'Run a test to see output here.'}
              </pre>
            </div>
          </section>
        </div>
      </div>
    </ProductHubScaffold>
  );
}
