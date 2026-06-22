import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
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
import { PageShell } from '../../components/layout/PageShell';
import {
  buildLaneAcquisitionUrl,
  buildLaneShortUrl,
  lanesByAudience,
  LEAD_ACQUISITION_LANES,
  syndicationFeedUrl,
  type LeadAcquisitionAudience,
} from '../../lib/leadAcquisitionCatalog';
import { copySyndicationPayload, postAcquisitionLanesToWebhook, runApprovedDistributionWebhooks } from '../../lib/leadSyndicationEngine';
import { listDistributionChannels, patchDistributionChannel } from '../../data/leadDistributionRepo';
import { qrCodeImageUrl } from '../../lib/leadAttribution';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

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

export default function AdminLeadAcquisitionPage() {
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
      results.length ? `Distribution jobs: ${results.filter((r) => r.ok).length}/${results.length} posted` : 'No queued webhook jobs in Lead Distribution',
      ...runLog,
    ].slice(0, 12));
    setLastRun(new Date().toLocaleString());
    setRunning(null);
  };

  return (
    <PageShell
      badge="Admin"
      title="Lead Acquisition Hub"
      subtitle="Multi-lane links, public syndication feeds, and webhook posting to your automation stack (Zapier, Make, n8n). This runs real actions — not just copy packs."
    >
      <button
        type="button"
        onClick={() => navigate('/admin')}
        className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6"
      >
        <ArrowLeft size={16} /> Back to admin
      </button>

      <div className={`${finelyOsCatalogCard('sky')} !p-5 mb-6 border border-sky-400/25`}>
        <p className={FINELY_OS_ENTITY_SUBLABEL}>What this can do vs. what needs your accounts</p>
        <div className="mt-3 grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className={`${FINELY_OS_ENTITY_VALUE} text-sm mb-2`}>Automated here (no social login)</p>
            <ul className={`${FINELY_OS_ENTITY_BODY} space-y-1 list-disc pl-5`}>
              <li>Public RSS + JSON feeds crawlers and Zapier RSS triggers can pull</li>
              <li>IndexNow search ping on deploy (GitHub Action + INDEXNOW_KEY secret)</li>
              <li>Webhook blast of all 12 lead lanes to Zapier/Make → cross-post to Buffer, Reddit, LinkedIn, etc.</li>
              <li>Lead Distribution L4 approved jobs → your webhook endpoint</li>
              <li>Trackable UTM links for every lane (restore, debt, business, affiliate, AU, specialist)</li>
            </ul>
          </div>
          <div>
            <p className={`${FINELY_OS_ENTITY_VALUE} text-sm mb-2`}>You connect once (then it runs)</p>
            <ul className={`${FINELY_OS_ENTITY_BODY} space-y-1 list-disc pl-5`}>
              <li>Zapier: RSS by Zap → Buffer / social · Webhook → multi-post</li>
              <li>Google Search Console — submit sitemap once: /sitemap.xml</li>
              <li>Feedly / Flipboard — subscribe to /feeds/leads.xml</li>
              <li>Directory listings (manual or via your webhook to Airtable queue)</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-6">
        <div className={`${finelyOsCatalogCard('emerald')} !p-5 lg:col-span-2`}>
          <div className="flex items-center gap-2">
            <Webhook size={18} className="text-emerald-300" />
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Action · webhook syndication</p>
          </div>
          <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
            POST all {LEAD_ACQUISITION_LANES.length} acquisition lanes to your automation URL. Wire Zapier to post on LinkedIn, X, Reddit (where allowed), email lists, or a Google Sheet queue for manual directory submission.
          </p>
          <label className={`mt-4 block ${FINELY_OS_ENTITY_SUBLABEL}`}>Webhook URL (Zapier / Make / n8n)</label>
          <input
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className={`${FINELY_OS_ENTITY_INPUT} mt-2 font-mono text-xs`}
            placeholder="https://hooks.zapier.com/hooks/catch/…"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              className={FINELY_OS_PRIMARY_BTN}
              disabled={!webhookUrl.trim() || running !== null}
              onClick={() => void runWebhookSyndication()}
            >
              <Play size={14} /> {running === 'webhook' ? 'Posting…' : 'Post all lanes to webhook'}
            </button>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={saveWebhookToDistribution}>
              Save to Lead Distribution
            </button>
            <button
              type="button"
              className={FINELY_OS_SECONDARY_BTN}
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

        <div className={`${finelyOsCatalogCard('violet')} !p-5`}>
          <div className="flex items-center gap-2">
            <Rss size={18} className="text-violet-300" />
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Public feeds</p>
          </div>
          <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm`}>Submit to aggregators once; they pull updates automatically.</p>
          <div className="mt-4 space-y-2">
            {(['rss', 'json'] as const).map((kind) => {
              const url = syndicationFeedUrl(kind);
              return (
                <div key={kind} className="flex items-center gap-2">
                  <code className={`flex-1 text-[10px] ${FINELY_OS_ENTITY_BODY} truncate`}>{url}</code>
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void copyText(kind, url)}>
                    {copied === kind ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  <a href={url} target="_blank" rel="noopener noreferrer" className={FINELY_OS_SECONDARY_BTN}>
                    <ExternalLink size={14} />
                  </a>
                </div>
              );
            })}
          </div>
          <p className={`mt-4 text-xs ${FINELY_OS_ENTITY_BODY}`}>
            Deploy ping: <code className="opacity-80">npm run syndication:publish</code>
          </p>
        </div>
      </div>

      <div className={`${finelyOsCatalogCard('amber')} !p-5 mb-6`}>
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
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void copyText('short', shortUrl)}>
                {copied === 'short' ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          </div>
          <img src={qrCodeImageUrl(shortUrl, 120)} alt="QR" className="rounded-lg border border-white/10" width={80} height={80} />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {(Object.keys(AUDIENCE_LABELS) as Array<LeadAcquisitionAudience | 'all'>).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setAudience(key)}
            className={audience === key ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
          >
            {AUDIENCE_LABELS[key]}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {lanes.map((lane) => {
          const url = buildLaneAcquisitionUrl(lane, { referralCode: referralCode.trim() || undefined, utmSource: 'acquisition_hub' });
          const payload = copySyndicationPayload(lane, referralCode.trim() || undefined);
          return (
            <div key={lane.id} className={`${finelyOsCatalogCard('violet')} !p-4`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className={FINELY_OS_ENTITY_SUBLABEL}>{lane.audience.replace('_', ' ')}</p>
                  <p className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>{lane.label}</p>
                </div>
                {lane.sequenceId ? <span className={finelyOsStatusChip('ok')}>nurture</span> : null}
              </div>
              <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY} line-clamp-2`}>{lane.description}</p>
              <code className={`mt-3 block text-[10px] ${FINELY_OS_ENTITY_BODY} break-all`}>{url}</code>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void copyText(`url-${lane.id}`, url)}>
                  <Link2 size={12} /> {copied === `url-${lane.id}` ? 'Copied' : 'Link'}
                </button>
                <button
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  onClick={() => void copyText(`msg-${lane.id}`, payload.message)}
                >
                  <Copy size={12} /> {copied === `msg-${lane.id}` ? 'Copied' : 'Post copy'}
                </button>
                <a href={url} target="_blank" rel="noopener noreferrer" className={FINELY_OS_SUCCESS_BTN}>
                  <Globe size={12} /> Open
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <div className={`${finelyOsCatalogCard('sky')} !p-5 mt-6`}>
        <div className="flex items-center gap-2">
          <Zap size={18} className="text-sky-300" />
          <p className={FINELY_OS_ENTITY_VALUE}>GitHub Action · runs on deploy</p>
        </div>
        <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm`}>
          Add repo secrets <span className={FINELY_OS_ENTITY_CHIP}>INDEXNOW_KEY</span> and{' '}
          <span className={FINELY_OS_ENTITY_CHIP}>SYNDICATION_WEBHOOK_URL</span> — then each push regenerates feeds, pings search engines, and notifies your automation stack.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/leads')}>
            <Radio size={14} /> Leads OS · Distribution
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/lead-magnets')}>
            Lead magnet funnels
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/integrations')}>
            Integrations
          </button>
        </div>
      </div>
    </PageShell>
  );
}
