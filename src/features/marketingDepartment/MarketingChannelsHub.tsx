import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, MessageSquare, Radio } from 'lucide-react';
import {
  getGoogleBusinessProfileChecks,
  getMetaPublishChecks,
  getYouTubeChannelChecks,
} from '../../lib/zeroCostChannelsOps';
import { isFeatureEnabled, getCommsSettings } from '../../data/settingsRepo';
import { getPhoneProductionChecks, buildTwilioWebhookUrl } from '../../lib/phoneProductionOps';
import {
  listCommunityListenDrafts,
  markCommunityDraftPosted,
  runCommunityListenScan,
} from './communityListenCopilot';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN } from '../os/finelyOsLightUi';
import {
  MARKETING_HUB_CONTENT_SHELL,
  MarketingMiniTabs,
  MarketingOnOffTile,
  MarketingSectionHeader,
  MarketingStatusTile,
  marketingVividShell,
} from './marketingHubUi';

const MINI_TABS = [
  { id: 'channels', label: '$0 channels', accent: 'emerald' as const },
  { id: 'community', label: 'Community listen', accent: 'violet' as const },
  { id: 'sms', label: 'SMS & Twilio', accent: 'sky' as const },
];

function ZeroCostChannelsGrid() {
  const navigate = useNavigate();
  const channels = [
    { id: 'gbp', title: 'Google Business', icon: Globe, accent: 'emerald' as const, checks: getGoogleBusinessProfileChecks() },
    { id: 'yt', title: 'YouTube', icon: Radio, accent: 'sky' as const, checks: getYouTubeChannelChecks() },
    { id: 'meta', title: 'Meta publish', icon: MessageSquare, accent: 'fuchsia' as const, checks: getMetaPublishChecks() },
  ];

  return (
    <div className="space-y-3">
      <div className="grid md:grid-cols-3 gap-3">
        {channels.map((ch) => {
          const okCount = ch.checks.filter((c) => c.ok).length;
          const allOk = okCount === ch.checks.length;
          const Icon = ch.icon;
          return (
            <div key={ch.id} className={`${marketingVividShell(ch.accent)} !p-4`}>
              <div className="flex items-center gap-2">
                <Icon size={20} />
                <h4 className="font-bold">{ch.title}</h4>
              </div>
              <p className="mt-2 text-xs text-white/90">
                {okCount}/{ch.checks.length} checks · {allOk ? 'Ready to automate' : 'Finish setup'}
              </p>
              <div className="mt-3 grid gap-2">
                {ch.checks.map((c) => (
                  <MarketingStatusTile
                    key={c.id}
                    ok={c.ok}
                    label={c.label}
                    hint={c.hint}
                    accent={ch.accent}
                    helpId={c.ok ? 'channel_ready' : 'channel_setup'}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/social-hub?tab=settings')}>
          Meta settings
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/marketing?tab=content')}>
          Content Studio
        </button>
      </div>
    </div>
  );
}

function SmsTwilioGrid() {
  const navigate = useNavigate();
  const commsOn = isFeatureEnabled('commsDelivery');
  const comms = getCommsSettings();
  const checks = getPhoneProductionChecks();
  const webhook = buildTwilioWebhookUrl();
  const fromPhone = (comms.twilioFromPhone ?? '').trim();

  return (
    <div className="space-y-3">
      <MarketingOnOffTile
        on={commsOn}
        title={commsOn ? 'SMS is LIVE — carrier cost per text' : 'SMS is OFF — $0 dry-run'}
        subtitle={
          commsOn
            ? 'Comms Delivery is on. Email remains $0; texts bill through Twilio.'
            : 'Sequences stay wired but no texts send until you turn Comms Delivery on.'
        }
        helpId={commsOn ? 'sms_live' : 'sms_dormant'}
      />
      <div className="grid sm:grid-cols-3 gap-3">
        <MarketingStatusTile ok accent="emerald" label="Email ($0)" hint="Primary outreach when SMTP/SendGrid is set." helpId="nurture_active" />
        <MarketingStatusTile
          ok={Boolean(fromPhone)}
          accent="sky"
          label="Twilio from number"
          hint={fromPhone || 'Add in Settings → Comms'}
          helpId="channel_setup"
        />
        <MarketingStatusTile
          ok={Boolean(webhook)}
          accent="violet"
          label="Webhook URL"
          hint={webhook ? 'Ready for inbound SMS' : 'Needs Supabase project URL'}
          helpId="channel_setup"
        />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {checks.map((c) => (
          <MarketingStatusTile key={c.id} ok={c.ok} label={c.label} accent="sky" helpId={c.ok ? 'channel_ready' : 'channel_setup'} />
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/settings')}>
          Comms settings
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/phone')}>
          Phone Hub
        </button>
        <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/comms?room=sequences')}>
          Email sequences
        </button>
      </div>
    </div>
  );
}

function CommunityListenGrid() {
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  void tick;
  const drafts = listCommunityListenDrafts(6);

  const scan = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const r = await runCommunityListenScan();
      setMsg(r.message);
    } finally {
      setBusy(false);
      setTick((t) => t + 1);
    }
  };

  return (
    <div className="space-y-3">
      <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
        Purpose: find people asking credit questions in public forums — Miriam drafts, you post manually ($0).
      </p>
      <button type="button" className={FINELY_OS_PRIMARY_BTN} disabled={busy} onClick={() => void scan()}>
        {busy ? 'Scanning…' : 'Scan forums & draft replies'}
      </button>
      {msg ? <p className="text-xs text-emerald-100 font-semibold">{msg}</p> : null}
      {drafts.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-3">
          {drafts.map((d) => (
            <div key={d.id} className={`${marketingVividShell('violet')} !p-3`}>
              <a href={d.sourceUrl} target="_blank" rel="noreferrer" className="text-xs font-bold hover:underline line-clamp-2">
                {d.sourceTitle}
              </a>
              <p className="mt-2 text-[11px] line-clamp-4 whitespace-pre-wrap text-white/90">{d.suggestedReply}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void navigator.clipboard.writeText(d.suggestedReply)}>
                  Copy
                </button>
                <button
                  type="button"
                  className={FINELY_OS_SECONDARY_BTN}
                  onClick={() => {
                    markCommunityDraftPosted(d.id);
                    setTick((t) => t + 1);
                  }}
                >
                  Posted
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>No drafts yet — run a scan when Serper/Caleb is configured.</p>
      )}
    </div>
  );
}

export function MarketingChannelsHub() {
  const [tab, setTab] = useState('channels');

  return (
    <div className={`${MARKETING_HUB_CONTENT_SHELL} space-y-4`}>
      <MarketingSectionHeader
        eyebrow="Setup & channels"
        title="Connect what powers $0 growth"
        subtitle="Green = ready · Red = needs setup · Tap ? on any tile for a plain-English explanation."
        helpId="channel_setup"
      />
      <MarketingMiniTabs tabs={MINI_TABS} active={tab} onChange={setTab} />
      {tab === 'channels' ? <ZeroCostChannelsGrid /> : null}
      {tab === 'community' ? <CommunityListenGrid /> : null}
      {tab === 'sms' ? <SmsTwilioGrid /> : null}
    </div>
  );
}
