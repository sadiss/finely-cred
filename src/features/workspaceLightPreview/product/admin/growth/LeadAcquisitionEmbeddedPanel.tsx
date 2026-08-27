import React, { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  Link2,
  Play,
  Radio,
  Rss,
  Webhook,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  buildLaneAcquisitionUrl,
  buildLaneShortUrl,
  lanesByAudience,
  LEAD_ACQUISITION_LANES,
  syndicationFeedUrl,
  type LeadAcquisitionAudience,
} from '../../../../../lib/leadAcquisitionCatalog';
import {
  copySyndicationPayload,
  postAcquisitionLanesToWebhook,
  runApprovedDistributionWebhooks,
} from '../../../../../lib/leadSyndicationEngine';
import { listDistributionChannels, patchDistributionChannel } from '../../../../../data/leadDistributionRepo';
import { qrCodeImageUrl } from '../../../../../lib/leadAttribution';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../../os/finelyOsLightUi';

const AUDIENCE_LABELS: Record<LeadAcquisitionAudience | 'all', string> = {
  all: 'All lanes',
  consumer: 'Consumers · restore & debt',
  business: 'Business credit',
  affiliate: 'Affiliates',
  specialist: 'Credit specialists',
  au_seller: 'AU sellers',
  agency: 'Agencies',
};

const WEBHOOK_STORAGE_KEY = 'finely.lead_acquisition.webhook.v1';

function readWebhookDraft(): string {
  try {
    return localStorage.getItem(WEBHOOK_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function persistWebhookDraft(v: string) {
  try {
    localStorage.setItem(WEBHOOK_STORAGE_KEY, v);
  } catch {
    /* ignore */
  }
}

/** Lead acquisition syndication tools without PageShell — for growth workstation embed. */
export function LeadAcquisitionEmbeddedPanel() {
  const navigate = useNavigate();
  const [audience, setAudience] = useState<LeadAcquisitionAudience | 'all'>('all');
  const [referralCode, setReferralCode] = useState('finely');
  const [webhookUrl, setWebhookUrl] = useState(readWebhookDraft);
  const [copied, setCopied] = useState<string | null>(null);
  const [running, setRunning] = useState<'webhook' | 'distribution' | null>(null);
  const [lastRun, setLastRun] = useState<string | null>(null);
  const [runLog, setRunLog] = useState<string[]>([]);

  const lanes = useMemo(() => lanesByAudience(audience), [audience]);
  const shortUrl = useMemo(() => buildLaneShortUrl(referralCode.trim() || 'finely'), [referralCode]);

  const copyText = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const saveWebhookToDistribution = () => {
    const url = webhookUrl.trim();
    if (!url) return;
    persistWebhookDraft(url);
    const channels = listDistributionChannels();
    const ch = channels.find((c) => c.id === 'ch-webhook');
    if (ch) patchDistributionChannel(ch.id, { endpoint: url });
    setRunLog((l) => [`Saved webhook to Lead Distribution channel`, ...l].slice(0, 8));
  };

  const runWebhookSyndication = async () => {
    const url = webhookUrl.trim();
    if (!url) return;
    setRunning('webhook');
    saveWebhookToDistribution();
    const results = await postAcquisitionLanesToWebhook({
      webhookUrl: url,
      referralCode: referralCode.trim() || undefined,
      utmSource: 'acquisition_hub',
    });
    const ok = results.filter((r) => r.ok).length;
    setRunLog([
      `Webhook syndication: ${ok}/${results.length} lanes posted`,
      ...results.filter((r) => !r.ok).map((r) => `FAIL ${r.laneId}: ${r.error}`),
      ...runLog,
    ].slice(0, 12));
    setLastRun(new Date().toLocaleString());
    setRunning(null);
  };

  const runDistributionJobs = async () => {
    setRunning('distribution');
    const results = await runApprovedDistributionWebhooks();
    setRunLog([
      results.length
        ? `Distribution jobs: ${results.filter((r) => r.ok).length}/${results.length} posted`
        : 'No queued webhook jobs in Lead Distribution',
      ...runLog,
    ].slice(0, 12));
    setLastRun(new Date().toLocaleString());
    setRunning(null);
  };

  return (
    <div className="fc-wlp-growth-acquisition-embed">
      <div className="fc-wlp-growth-acquisition-actions-grid">
        <div className="fc-wlp-growth-acquisition-webhook" data-fcm-accent="emerald">
          <div className="flex items-center gap-2">
            <Webhook size={18} aria-hidden />
            <p className="fc-wlp-growth-rail-label mb-0">Webhook syndication</p>
          </div>
          <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
            POST all {LEAD_ACQUISITION_LANES.length} acquisition lanes to your automation URL — Zapier, Make, or n8n.
          </p>
          <label className={`mt-4 block ${FINELY_OS_ENTITY_SUBLABEL}`}>Webhook URL</label>
          <input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className={`${FINELY_OS_ENTITY_INPUT} mt-2 font-mono text-xs`}
            placeholder="https://hooks.zapier.com/hooks/catch/…"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className="fc-wlp-btn-primary"
              disabled={!webhookUrl.trim() || running !== null}
              onClick={() => void runWebhookSyndication()}
            >
              <Play size={14} aria-hidden /> {running === 'webhook' ? 'Posting…' : 'Post all lanes'}
            </button>
            <button type="button" className="fc-wlp-btn-secondary" onClick={saveWebhookToDistribution}>
              Save to Lead Distribution
            </button>
            <button
              type="button"
              className="fc-wlp-btn-secondary"
              disabled={running !== null}
              onClick={() => void runDistributionJobs()}
            >
              {running === 'distribution' ? 'Running…' : 'Run L4 distribution jobs'}
            </button>
          </div>
          {lastRun ? <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>Last run: {lastRun}</p> : null}
          {runLog.length ? (
            <pre className="mt-3 p-3 rounded-xl bg-black/40 text-[11px] text-white/70 overflow-x-auto max-h-32">{runLog.join('\n')}</pre>
          ) : null}
        </div>

        <aside className="fc-wlp-growth-acquisition-feeds" data-fcm-accent="violet">
          <div className="flex items-center gap-2">
            <Rss size={18} aria-hidden />
            <p className="fc-wlp-growth-rail-label mb-0">Public feeds</p>
          </div>
          <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm`}>RSS and JSON feeds for aggregators and automation triggers.</p>
          <div className="mt-4 space-y-2">
            {(['rss', 'json'] as const).map((kind) => {
              const url = syndicationFeedUrl(kind);
              return (
                <div key={kind} className="flex items-center gap-2">
                  <code className={`flex-1 text-[10px] ${FINELY_OS_ENTITY_BODY} truncate`}>{url}</code>
                  <button type="button" className="fc-wlp-btn-secondary" onClick={() => void copyText(kind, url)}>
                    {copied === kind ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
                  </button>
                  <a href={url} target="_blank" rel="noopener noreferrer" className="fc-wlp-btn-secondary">
                    <ExternalLink size={14} aria-hidden />
                  </a>
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      <div className="fc-wlp-growth-acquisition-attribution" data-fcm-accent="rose">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className={FINELY_OS_ENTITY_SUBLABEL}>Referral code (optional)</label>
            <input
              value={referralCode}
              onChange={(e) => setReferralCode(e.target.value)}
              className={`${FINELY_OS_ENTITY_INPUT} mt-2 w-40`}
              placeholder="finely"
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className={FINELY_OS_ENTITY_SUBLABEL}>Short link</label>
            <div className="mt-2 flex items-center gap-2">
              <code className={`flex-1 text-xs ${FINELY_OS_ENTITY_VALUE} truncate`}>{shortUrl}</code>
              <button type="button" className="fc-wlp-btn-secondary" onClick={() => void copyText('short', shortUrl)}>
                {copied === 'short' ? <Check size={14} aria-hidden /> : <Copy size={14} aria-hidden />}
              </button>
            </div>
          </div>
          <img src={qrCodeImageUrl(shortUrl, 120)} alt="QR code for short link" className="rounded-lg border border-white/10" width={80} height={80} />
        </div>
      </div>

      <div className="fc-wlp-growth-acquisition-audience-dock" role="tablist" aria-label="Audience lanes">
        {(Object.keys(AUDIENCE_LABELS) as Array<LeadAcquisitionAudience | 'all'>).map((key, index) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={audience === key}
            className="fc-wlp-growth-desk-room-chip"
            data-fcm-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[index % 4]}
            data-active={audience === key ? 'true' : undefined}
            onClick={() => setAudience(key)}
          >
            {AUDIENCE_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="fc-wlp-growth-acquisition-lane-grid">
        {lanes.map((lane, index) => {
          const url = buildLaneAcquisitionUrl(lane, {
            referralCode: referralCode.trim() || undefined,
            utmSource: 'acquisition_hub',
          });
          const payload = copySyndicationPayload(lane, referralCode.trim() || undefined);
          return (
            <article
              key={lane.id}
              className="fc-wlp-growth-acquisition-lane"
              data-fcm-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[index % 4]}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="fc-wlp-growth-rail-label">{lane.audience.replace('_', ' ')}</p>
                  <p className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{lane.label}</p>
                </div>
                {lane.sequenceId ? <span className={finelyOsStatusChip('ok')}>nurture</span> : null}
              </div>
              <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY} line-clamp-2`}>{lane.description}</p>
              <code className={`mt-3 block text-[10px] ${FINELY_OS_ENTITY_BODY} break-all`}>{url}</code>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="fc-wlp-btn-secondary" onClick={() => void copyText(`url-${lane.id}`, url)}>
                  <Link2 size={12} aria-hidden /> {copied === `url-${lane.id}` ? 'Copied' : 'Link'}
                </button>
                <button
                  type="button"
                  className="fc-wlp-btn-secondary"
                  onClick={() => void copyText(`msg-${lane.id}`, payload.message)}
                >
                  <Copy size={12} aria-hidden /> {copied === `msg-${lane.id}` ? 'Copied' : 'Post copy'}
                </button>
                <a href={url} target="_blank" rel="noopener noreferrer" className={FINELY_OS_SUCCESS_BTN}>
                  <Globe size={12} aria-hidden /> Open
                </a>
              </div>
            </article>
          );
        })}
      </div>

      <div className={`${finelyOsCatalogCard('sky')} fc-wlp-growth-acquisition-deploy`} data-fcm-accent="sky">
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-sky-300" aria-hidden />
          <p className={FINELY_OS_ENTITY_VALUE}>Deploy syndication</p>
        </div>
        <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm`}>
          Set repo secrets <span className={FINELY_OS_ENTITY_CHIP}>INDEXNOW_KEY</span> and{' '}
          <span className={FINELY_OS_ENTITY_CHIP}>SYNDICATION_WEBHOOK_URL</span> — each push regenerates feeds and pings search engines.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/leads')}>
            <Radio size={14} aria-hidden /> Leads OS · Distribution
          </button>
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/lead-magnets')}>
            Lead magnet funnels
          </button>
          <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/integrations')}>
            Integrations
          </button>
        </div>
      </div>
    </div>
  );
}
