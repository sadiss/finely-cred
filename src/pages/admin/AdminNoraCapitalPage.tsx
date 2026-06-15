import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BriefcaseBusiness, ExternalLink, ShieldAlert, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { getNoraCapitalSettings } from '../../data/settingsRepo';
import { fetchAllPartnersAsAdmin } from '../../data/partnersRepo';
import type { Partner } from '../../domain/partners';
import { noraPing, noraRequest } from '../../lib/noraCapitalClient';
import { finelyPartnerReadiness } from '../../lib/finelyPartnerApiClient';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyOsDataErrorBanner } from '../../features/os/FinelyOsDataErrorBanner';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';

const FUNDING_STAGE_LABEL: Record<string, string> = {
  not_ready: 'Not ready',
  ready: 'Ready',
  submitted: 'Submitted',
  in_review: 'In review',
  funded: 'Funded',
  declined: 'Declined',
};

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

export default function AdminNoraCapitalPage() {
  const navigate = useNavigate();
  const nora = useMemo(() => getNoraCapitalSettings(), []);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [out, setOut] = useState<string | null>(null);
  const [fundingPipeline, setFundingPipeline] = useState<Partner[]>([]);
  const [pipelineErr, setPipelineErr] = useState<string | null>(null);
  const [pipelineLoading, setPipelineLoading] = useState(true);

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
    } catch (e: any) {
      setPipelineErr(e?.message || 'Could not load funding pipeline.');
      setFundingPipeline([]);
    } finally {
      setPipelineLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadFundingPipeline();
  }, [loadFundingPipeline]);

  const runPing = async () => {
    setBusy(true);
    setErr(null);
    setOut(null);
    try {
      const res = await noraPing({ idempotencyKey: `ping:${Date.now().toString(16)}` });
      setOut(`status: ${res.status}\n\n${res.body}`);
    } catch (e: any) {
      setErr(e?.message || 'Ping failed.');
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
    } catch (e: any) {
      setErr(e?.message || 'Partner readiness failed.');
    } finally {
      setBusy(false);
    }
  };

  const runReq = async () => {
    setBusy(true);
    setErr(null);
    setOut(null);
    try {
      let parsed: any = undefined;
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
    } catch (e: any) {
      setErr(e?.message || 'Request failed.');
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
    <PageShell
      badge="Admin"
      title="Nora Capital Group API"
      subtitle="Secure server-side integration shim (auth + allowlist + rate limiting + monitoring). Configure secrets in Supabase, then test calls here."
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate('/admin/settings')} className={FINELY_OS_SECONDARY_BTN}>
              Open Settings <ArrowRight size={14} />
            </button>
            <button type="button" onClick={() => navigate('/admin/monitoring')} className={FINELY_OS_SECONDARY_BTN}>
              Monitoring <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className={`${FINELY_OS_BANNER} space-y-3`}>
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300`}>
            <BriefcaseBusiness size={18} />
            <span>Configuration</span>
          </div>
          <div className={`${FINELY_OS_ENTITY_BODY} space-y-2`}>
            <div>
              UI status: <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{nora.status}</span> • testMode:{' '}
              <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{String(nora.testMode)}</span>
            </div>
            <div>
              Base URL (non-secret): <span className={`font-mono ${FINELY_OS_ENTITY_VALUE}`}>{nora.baseUrl || '—'}</span>
            </div>
            <div className="text-xs">
              Secrets must be set in Supabase Edge Function secrets: <span className="font-mono">NORA_CAPITAL_BASE_URL</span>,{' '}
              <span className="font-mono">NORA_CAPITAL_API_KEY</span>,{' '}
              <span className="font-mono">FINELY_PARTNER_API_KEYS_JSON</span> (for Nora → Finely readiness API).
            </div>
          </div>
        </div>

        <div className={`${finelyOsCatalogCard('violet')} !p-6 space-y-3 mb-6`} data-fc-accent="violet">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Funding pipeline</div>
          {pipelineErr ? (
            <FinelyOsDataErrorBanner
              message={pipelineErr}
              hint="Check Supabase config and admin-list-partners edge function."
              onRetry={() => void loadFundingPipeline()}
            />
          ) : pipelineLoading ? (
            <div className={FINELY_OS_ENTITY_BODY}>Loading funding pipeline…</div>
          ) : fundingPipeline.length === 0 ? (
            <div className={FINELY_OS_ENTITY_BODY}>No partners in funding stages yet.</div>
          ) : (
            <FinelyOsPaginatedStack
              items={fundingPipeline}
              pageSize={8}
              emptyMessage="No partners in funding stages yet."
              renderItem={(p) => {
                const stage = p.fundingStage ?? String(p.journeySignals?.fundingStage ?? '—');
                const noraAppId = (p.journeySignals?.fundingMeta as { noraApplicationId?: string } | undefined)?.noraApplicationId;
                return (
                  <div key={p.id} className={`${finelyOsInlineListItem()} p-4 flex flex-wrap justify-between gap-2`}>
                    <div>
                      <div className={FINELY_OS_ENTITY_VALUE}>{p.profile.fullName}</div>
                      <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{p.profile.email}</div>
                      {noraAppId ? (
                        <div className={`text-xs font-mono mt-1 ${FINELY_OS_ENTITY_SUBLABEL}`}>Nora app: {noraAppId}</div>
                      ) : null}
                    </div>
                    <div className={`text-sm font-mono ${FINELY_OS_ENTITY_SUBLABEL}`}>{FUNDING_STAGE_LABEL[stage] ?? stage}</div>
                  </div>
                );
              }}
            />
          )}
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-4`}>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-300`}>
                <Sparkles size={18} />
                <span>Quick test</span>
              </div>
              <button type="button" className={`${FINELY_OS_PRIMARY_BTN} w-full justify-center`} onClick={() => void runPing()} disabled={busy}>
                Ping Nora API
              </button>
              <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
                If ping fails, check secrets + allowlisted paths + Nora endpoint availability.
              </div>
            </div>

            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-4`}>
              <div className={FINELY_OS_ENTITY_VALUE}>Allowlisted request</div>
              <div className={FINELY_OS_ENTITY_BODY}>
                This endpoint blocks unknown paths by default for security. Extend allowlist via{' '}
                <span className={`font-mono font-semibold ${FINELY_OS_ENTITY_VALUE}`}>NORA_CAPITAL_ALLOWED_PATHS_JSON</span>.
                See <span className={`font-mono ${FINELY_OS_ENTITY_VALUE}`}>docs/NORA_CAPITAL_API.md</span> for contract details.
              </div>
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
                  <select value={method} onChange={(e) => setMethod(e.target.value as any)} className={`${FINELY_OS_ENTITY_SELECT} text-sm`}>
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
              {method !== 'GET' && (
                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>JSON body</div>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className={`${FINELY_OS_ENTITY_INPUT} min-h-[130px] font-mono text-xs`}
                  />
                </label>
              )}
              <button type="button" className={`${FINELY_OS_PRIMARY_BTN} w-full justify-center`} onClick={() => void runReq()} disabled={busy}>
                Send request
              </button>
            </div>

            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-4`}>
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
              <button type="button" className={`${FINELY_OS_SECONDARY_BTN} w-full justify-center`} onClick={() => void runPartnerReadiness()} disabled={busy}>
                Fetch readiness snapshot
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            {err && (
              <div className={FINELY_OS_NOTICE_WARN}>
                <ShieldAlert size={18} className="mt-0.5 shrink-0" />
                <div>{err}</div>
              </div>
            )}
            <div className={`${finelyOsCatalogCard('violet')} !p-6`} data-fc-accent="violet">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Response</div>
              <pre className={`mt-3 whitespace-pre-wrap ${FINELY_OS_ENTITY_BODY} leading-relaxed font-mono text-xs`}>
                {out || 'Run a test to see output here.'}
              </pre>
            </div>
          </div>
        </div>
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
