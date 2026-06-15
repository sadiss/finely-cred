import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Copy,
  Download,
  Globe,
  Link2,
  Play,
  Shield,
  Sparkles,
  Zap,
} from 'lucide-react';
import {
  addDistributionJobs,
  exportDistributionStore,
  listAllDistributionLinkAssets,
  listDistributionCampaigns,
  listDistributionChannels,
  listDistributionJobs,
  patchDistributionChannel,
  patchDistributionJob,
  upsertDistributionCampaign,
} from '../../data/leadDistributionRepo';
import type { DistributionWisdomLevel } from '../../domain/leadDistribution';
import { DISTRIBUTION_WISDOM_LABELS } from '../../domain/leadDistribution';
import { FinelyOsCatalogBrowser } from '../os/FinelyOsCatalogBrowser';
import { FinelyOsOverviewStatTile } from '../os/FinelyOsOverviewStatTile';
import {
  buildAssetUrl,
  CAMPAIGN_PRESETS,
  DEFAULT_CAMPAIGN_TEMPLATE,
  exportJobsForPythonCli,
  jobsForCampaign,
  postJobViaWebhook,
  suggestChannelsForAsset,
} from './distributionEngine';
import {FINELY_OS_CATALOG_SHELL,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_PANEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsInlineListItem,
  finelyOsStatusChip,
  finelyOsViewTab,
  finelyOsCatalogCard,} from '../os/finelyOsLightUi';

type LevelTab = 'library' | 'campaigns' | 'queue' | 'channels' | 'cli';

const LEVEL_TABS: Array<{ id: LevelTab; label: string; accent: 'violet' | 'fuchsia' | 'emerald' | 'sky' | 'amber' }> = [
  { id: 'library', label: 'L1 · Link library', accent: 'violet' },
  { id: 'campaigns', label: 'L2 · Campaigns', accent: 'fuchsia' },
  { id: 'queue', label: 'L3 · Queue', accent: 'emerald' },
  { id: 'channels', label: 'L4 · Channels', accent: 'sky' },
  { id: 'cli', label: 'L5 · Python CLI', accent: 'amber' },
];

export function LeadDistributionHub() {
  const [tab, setTab] = useState<LevelTab>('library');
  const [version, setVersion] = useState(0);
  const [copied, setCopied] = useState<string | null>(null);
  const [busyJobId, setBusyJobId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [campaignName, setCampaignName] = useState('Lead magnet — multi-channel');
  const [assetId, setAssetId] = useState('asset-free-guide');
  const [messageTemplate, setMessageTemplate] = useState(DEFAULT_CAMPAIGN_TEMPLATE);
  const [utmSource, setUtmSource] = useState('social');
  const [utmMedium, setUtmMedium] = useState('post');
  const [utmCampaign, setUtmCampaign] = useState('lead_magnet_guide');
  const [wisdomLevel, setWisdomLevel] = useState<DistributionWisdomLevel>(3);
  const [referralCode, setReferralCode] = useState('finely-growth');

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const assets = useMemo(() => listAllDistributionLinkAssets(), [version]);
  const channels = useMemo(() => listDistributionChannels(), [version]);
  const campaigns = useMemo(() => listDistributionCampaigns(), [version]);
  const jobs = useMemo(() => listDistributionJobs(), [version]);

  const selectedAsset = assets.find((a) => a.id === assetId) ?? assets[0];
  const previewUrl = selectedAsset
    ? buildAssetUrl(selectedAsset, { utmSource, utmMedium, utmCampaign, referralCode })
    : '';

  const suggestedChannelIds = useMemo(() => {
    if (!selectedAsset) return ['ch-manual'];
    const kinds = suggestChannelsForAsset(selectedAsset);
    const matched = channels.filter((c) => kinds.includes(c.kind)).map((c) => c.id);
    return matched.length ? matched : ['ch-manual'];
  }, [selectedAsset, channels]);

  const queued = jobs.filter((j) => j.status === 'queued' || j.status === 'approved');
  const posted = jobs.filter((j) => j.status === 'posted');

  const copyText = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  const launchCampaign = () => {
    if (!selectedAsset) return;
    const campaign = upsertDistributionCampaign({
      name: campaignName,
      linkAssetId: selectedAsset.id,
      channelIds: suggestedChannelIds,
      messageTemplate,
      utmSource,
      utmMedium,
      utmCampaign,
      wisdomLevel,
      enabled: true,
    });
    const newJobs = jobsForCampaign({ campaign, asset: selectedAsset, channels, referralCode });
    addDistributionJobs(newJobs);
    setNotice(`Queued ${newJobs.length} distribution job(s) with wisdom level ${wisdomLevel}.`);
    setTab('queue');
    setVersion((v) => v + 1);
  };

  const approveAndPost = async (jobId: string) => {
    const job = jobs.find((j) => j.id === jobId);
    if (!job) return;
    const channel = channels.find((c) => c.id === job.channelId);
    setBusyJobId(jobId);
    patchDistributionJob(jobId, { status: 'approved' });
    if (channel?.kind === 'webhook' && channel.endpoint && wisdomLevel >= 4) {
      const res = await postJobViaWebhook(job, channel);
      patchDistributionJob(jobId, {
        status: res.ok ? 'posted' : 'failed',
        postedAt: res.ok ? new Date().toISOString() : undefined,
        error: res.error,
      });
      setNotice(res.ok ? 'Posted via webhook.' : res.error ?? 'Post failed.');
    } else {
      patchDistributionJob(jobId, {
        status: 'posted',
        postedAt: new Date().toISOString(),
      });
      setNotice('Marked posted — copy the message to your channel manually or run the Python CLI.');
    }
    setBusyJobId(null);
    setVersion((v) => v + 1);
  };

  const downloadCliPack = () => {
    const payload = exportJobsForPythonCli(jobs, campaigns, channels);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finely-distribution-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setNotice('Exported CLI job pack — run tools/lead_distribution/poster.py with this file.');
  };

  return (
    <div className="space-y-6">
      <div className={`${finelyOsCatalogCard('violet')} !p-5 border-violet-500/25 p-4 sm:p-5`}>
        <div className="flex flex-wrap items-start gap-4">
          <div className="p-2.5 rounded-xl bg-violet-500/15 border border-violet-500/30">
            <Globe size={20} className="text-violet-300" />
          </div>
          <div className="flex-1 min-w-0 space-y-2">
            <div className={`text-lg font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Lead Growth Distribution Engine</div>
            <p className={`text-sm ${FINELY_OS_ENTITY_BODY} leading-relaxed max-w-3xl`}>
              Five wisdom levels — from link library to Python-orchestrated posting. Every job carries compliance notes;
              auto-post only fires on webhooks you own. Never spam random sites — directories and social use approval gates.
            </p>
          </div>
        </div>
      </div>

      {notice ? (
        <div className={FINELY_OS_NOTICE_SUCCESS}>
          <CheckCircle2 size={16} /> {notice}
          <button type="button" className="ml-auto text-xs underline opacity-80" onClick={() => setNotice(null)}>
            dismiss
          </button>
        </div>
      ) : null}

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <FinelyOsOverviewStatTile icon={Link2} label="Link assets" value={assets.filter((a) => a.enabled).length} accent="violet" iconAccent="violet" />
        <FinelyOsOverviewStatTile icon={Sparkles} label="Campaigns" value={campaigns.length} accent="fuchsia" iconAccent="fuchsia" />
        <FinelyOsOverviewStatTile icon={Zap} label="Queue" value={queued.length} accent="emerald" iconAccent="emerald" hint="awaiting action" />
        <FinelyOsOverviewStatTile icon={CheckCircle2} label="Posted" value={posted.length} accent="sky" iconAccent="sky" />
      </div>

      <div className={FINELY_OS_VIEW_TABS} role="tablist">
        {LEVEL_TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)} className={finelyOsViewTab(tab === t.id, t.accent)}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'library' ? (
        <div className={FINELY_OS_CATALOG_SHELL}>
          <FinelyOsCatalogBrowser
            items={assets.map((a) => ({
              id: a.id,
              title: a.label,
              subtitle: a.path,
              meta: [a.kind.replace('_', ' '), a.enabled ? 'live' : 'off'],
            }))}
            pageSize={6}
            searchPlaceholder="Search link assets…"
            renderTrailing={(item) => {
              const asset = assets.find((a) => a.id === item.id);
              if (!asset) return null;
              const url = buildAssetUrl(asset, {
                utmSource: 'library',
                utmMedium: 'preview',
                utmCampaign: asset.utmCampaign ?? 'preview',
                referralCode,
              });
              return (
                <div className="flex flex-wrap gap-2 mt-2">
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => copyText(url, asset.id)}>
                    <Copy size={14} /> {copied === asset.id ? 'Copied' : 'Copy URL'}
                  </button>
                  <button
                    type="button"
                    className={FINELY_OS_PRIMARY_BTN}
                    onClick={() => {
                      setAssetId(asset.id);
                      setTab('campaigns');
                    }}
                  >
                    Build campaign <ArrowRight size={14} />
                  </button>
                </div>
              );
            }}
          />
        </div>
      ) : null}

      {tab === 'campaigns' ? (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4 p-5`}>
            <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Campaign builder</div>
            <label className="block space-y-1">
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Campaign name</span>
              <input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            </label>
            <label className="block space-y-1">
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Link asset</span>
              <select value={assetId} onChange={(e) => setAssetId(e.target.value)} className={FINELY_OS_ENTITY_SELECT}>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>{a.label}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1">
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Message template</span>
              <textarea value={messageTemplate} onChange={(e) => setMessageTemplate(e.target.value)} rows={4} className={`${FINELY_OS_ENTITY_INPUT} min-h-[96px]`} />
              <span className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>Tokens: {'{{url}}'} · {'{{label}}'} · {'{{path}}'}</span>
            </label>
            <div className="grid sm:grid-cols-3 gap-3">
              <label className="block space-y-1">
                <span className={FINELY_OS_ENTITY_SUBLABEL}>utm_source</span>
                <input value={utmSource} onChange={(e) => setUtmSource(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
              </label>
              <label className="block space-y-1">
                <span className={FINELY_OS_ENTITY_SUBLABEL}>utm_medium</span>
                <input value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
              </label>
              <label className="block space-y-1">
                <span className={FINELY_OS_ENTITY_SUBLABEL}>utm_campaign</span>
                <input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
              </label>
            </div>
            <label className="block space-y-1">
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Referral code (optional)</span>
              <input value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className={FINELY_OS_ENTITY_INPUT} />
            </label>
            <label className="block space-y-1">
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Wisdom level</span>
              <select value={wisdomLevel} onChange={(e) => setWisdomLevel(Number(e.target.value) as DistributionWisdomLevel)} className={FINELY_OS_ENTITY_SELECT}>
                {(Object.entries(DISTRIBUTION_WISDOM_LABELS) as Array<[string, string]>).map(([lvl, label]) => (
                  <option key={lvl} value={lvl}>L{lvl} — {label}</option>
                ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-2">
              {CAMPAIGN_PRESETS.map((p) => (
                <button
                  key={p.name}
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  onClick={() => {
                    setCampaignName(p.name);
                    setMessageTemplate(p.template);
                    setUtmSource(p.utmSource);
                    setUtmMedium(p.utmMedium);
                  }}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={launchCampaign}>
              <Play size={14} /> Launch to queue
            </button>
          </div>

          <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4 p-5`}>
            <div className="flex items-center gap-2">
              <Bot size={16} className="text-fuchsia-300" />
              <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Intelligent preview</span>
            </div>
            <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
              Suggested channels: {suggestedChannelIds.map((id) => channels.find((c) => c.id === id)?.label).filter(Boolean).join(' · ')}
            </p>
            <div className={`rounded-xl border border-white/[0.08] p-4 ${FINELY_OS_ENTITY_BODY} text-sm whitespace-pre-wrap`}>
              {selectedAsset ? messageTemplate.replace(/\{\{url\}\}/g, previewUrl).replace(/\{\{label\}\}/g, selectedAsset.label).replace(/\{\{path\}\}/g, selectedAsset.path) : null}
            </div>
            <p className={`text-xs break-all font-mono ${FINELY_OS_ENTITY_BODY}`}>{previewUrl}</p>
            <div className={FINELY_OS_NOTICE_WARN}>
              <Shield size={14} className="shrink-0" />
              <span className="text-xs">Wise posting: disclose affiliation, respect platform TOS, cap daily volume per channel.</span>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'queue' ? (
        <div className="space-y-3">
          {queued.length === 0 ? (
            <div className={`${finelyOsCatalogCard('violet')} !p-6 text-sm ${FINELY_OS_ENTITY_BODY}`}>No jobs in queue — launch a campaign from L2.</div>
          ) : (
            queued.map((job) => {
              const channel = channels.find((c) => c.id === job.channelId);
              return (
                <div key={job.id} className={`${finelyOsInlineListItem()} flex flex-col sm:flex-row gap-3 sm:items-center`}>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`font-medium ${FINELY_OS_ENTITY_VALUE}`}>{channel?.label ?? job.channelId}</span>
                      <span className={finelyOsStatusChip(job.status === 'approved' ? 'ok' : 'warn')}>{job.status}</span>
                    </div>
                    <p className={`text-xs ${FINELY_OS_ENTITY_BODY} line-clamp-2`}>{job.message}</p>
                    {job.wisdomNote ? <p className="text-[10px] text-amber-200/80">{job.wisdomNote}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => copyText(`${job.message}\n\n${job.finalUrl}`, job.id)}>
                      <Copy size={14} /> Copy
                    </button>
                    <button type="button" className={FINELY_OS_PRIMARY_BTN} disabled={busyJobId === job.id} onClick={() => approveAndPost(job.id)}>
                      {busyJobId === job.id ? '…' : 'Approve & post'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : null}

      {tab === 'channels' ? (
        <div className="grid md:grid-cols-2 gap-4">
          {channels.map((ch) => (
            <div key={ch.id} className={`${finelyOsCatalogCard('violet')} !p-5 p-4 space-y-3`}>
              <div className="flex items-center justify-between gap-2">
                <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{ch.label}</span>
                <span className={finelyOsStatusChip(ch.enabled ? 'ok' : 'blocked')}>{ch.kind}</span>
              </div>
              {ch.notes ? <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{ch.notes}</p> : null}
              <label className="block space-y-1">
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Webhook / profile endpoint</span>
                <input
                  value={ch.endpoint ?? ''}
                  onChange={(e) => patchDistributionChannel(ch.id, { endpoint: e.target.value })}
                  placeholder={ch.kind === 'webhook' ? 'https://hooks.zapier.com/...' : 'https://linkedin.com/in/...'}
                  className={FINELY_OS_ENTITY_INPUT}
                />
              </label>
              <p className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>Daily cap: {ch.dailyCap} · Approval: {ch.requireApproval ? 'required' : 'optional'}</p>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'cli' ? (
        <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
          <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Python distribution CLI (Level 5)</div>
          <p className={`text-sm ${FINELY_OS_ENTITY_BODY} max-w-2xl`}>
            Export queued jobs as JSON, then run the poster from your machine. Webhook channels post automatically when configured;
            other channels export copy-paste packs with compliance headers.
          </p>
          <pre className="text-xs p-4 rounded-xl bg-fc-input border border-white/[0.08] overflow-x-auto text-emerald-200/90">
{`cd tools/lead_distribution
pip install -r requirements.txt
python poster.py --jobs ../../exports/finely-distribution.json --dry-run
python poster.py --jobs ../../exports/finely-distribution.json --execute`}
          </pre>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={downloadCliPack}>
              <Download size={14} /> Export job pack
            </button>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => copyText(JSON.stringify(exportDistributionStore(), null, 2), 'store')}>
              <Copy size={14} /> {copied === 'store' ? 'Copied store' : 'Copy full store'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
