import React, { useEffect, useMemo, useState } from 'react';
import { Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchLatestPlatformCronHeartbeat } from '../../data/platformCronHeartbeatRepo';
import { getPublicSiteOrigin } from '../../lib/funnelPublicLinks';
import {
  getEmailDeliveryLamp,
  getMarketingStorefrontLamps,
  getSearchIndexLamps,
  lampFromCronHeartbeat,
  type MarketingGoLiveLamp,
} from '../../lib/zeroCostChannelsOps';
import { FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN } from '../os/finelyOsLightUi';
import { FinelyOsAlertBanner } from '../os/FinelyOsAlertBanner';

const JARGON_RE = /VITE_|\.env|\bnpm\b|INDEXNOW|send-email|Supabase/i;

function operatorSafeHint(lamp: MarketingGoLiveLamp): string {
  const hint = lamp.hint;
  const label = lamp.label.toLowerCase();
  const id = lamp.id.toLowerCase();

  if (label.includes('email') || id === 'email' || /send-email|smtp|sendgrid/i.test(hint)) {
    return lamp.ok ? 'Email can send' : 'Email is not connected yet';
  }
  if (label.includes('youtube') || id.includes('youtube') || id === 'yt') {
    return lamp.ok ? 'YouTube channel is linked' : 'YouTube channel is not linked yet';
  }
  if (label.includes('google business') || id.includes('gbp')) {
    return lamp.ok ? 'Google Business Profile is claimed' : 'Claim your Google Business Profile';
  }
  if (label.includes('bluesky') || id.includes('bluesky')) {
    return lamp.ok ? 'Bluesky is connected' : 'Connect Bluesky in Social Hub';
  }
  if (label.includes('search console') || id.includes('search') || /sitemap|indexnow/i.test(hint) || label.includes('index')) {
    return lamp.ok ? 'Search listing is connected' : 'Search listing is not connected yet';
  }
  if (label.includes('cron') || id === 'cron') {
    return lamp.ok ? 'Scheduled tasks are running' : 'Scheduled tasks are not running yet';
  }
  if (JARGON_RE.test(hint) || /\$0|app password|\.xml/i.test(hint)) {
    return lamp.ok ? 'Connected' : 'Finish setup in admin settings';
  }
  return hint;
}

function statusChipClass(lamp: MarketingGoLiveLamp): string {
  const base = 'shrink-0 rounded-lg px-2.5 py-0.5 text-xs font-bold text-[#f8fafc]';
  if (lamp.ok) return `${base} bg-emerald-800`;
  if (lamp.tone === 'blocked') return `${base} bg-rose-800`;
  return `${base} bg-sky-800`;
}

function statusLabel(lamp: MarketingGoLiveLamp): string {
  if (lamp.ok) return 'Live';
  if (lamp.tone === 'blocked') return 'Blocked';
  return 'Setup';
}

function buildManualSendPack(): string {
  const origin = getPublicSiteOrigin();
  return [
    'Finely Cred — today’s send pack',
    '',
    `Start free guide: ${origin}/free-guide`,
    `Chat: ${origin}/`,
    `Book a session: ${origin}/enlightenment-session`,
    `Pricing: ${origin}/services`,
    '',
    'Results vary · not legal advice · funding subject to underwriting',
  ].join('\n');
}

export function MarketingGoLiveStrip() {
  const navigate = useNavigate();
  const [cronLamp, setCronLamp] = useState<MarketingGoLiveLamp>(() => lampFromCronHeartbeat(null));
  const [copied, setCopied] = useState(false);

  const emailLamp = useMemo(() => getEmailDeliveryLamp(), []);
  const storefront = useMemo(() => getMarketingStorefrontLamps(), []);
  const search = useMemo(() => getSearchIndexLamps(), []);

  useEffect(() => {
    let cancelled = false;
    void fetchLatestPlatformCronHeartbeat().then((beat) => {
      if (!cancelled) setCronLamp(lampFromCronHeartbeat(beat));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const lamps = [emailLamp, cronLamp, ...storefront, ...search];
  const liveCount = lamps.filter((l) => l.ok).length;
  const emailBlocked = emailLamp.tone !== 'ok';

  const copyPack = async () => {
    try {
      await navigator.clipboard.writeText(buildManualSendPack());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const openLamp = (lamp: MarketingGoLiveLamp) => {
    if (!lamp.href) return;
    if (lamp.href.startsWith('http')) {
      window.open(lamp.href, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(lamp.href);
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold tracking-tight text-[#0a1628]">Channels</h2>
          <p className="mt-1 text-sm font-semibold text-slate-600">
            {liveCount} of {lamps.length} live
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void copyPack()}>
            <Copy size={14} /> {copied ? 'Copied' : 'Copy send pack'}
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/data-feeds')}>
            Data feeds
          </button>
          {emailBlocked ? (
            <button
              type="button"
              className={FINELY_OS_PRIMARY_BTN}
              onClick={() => navigate('/admin/settings?tab=features')}
            >
              Fix email
            </button>
          ) : null}
        </div>
      </div>

      {emailBlocked ? (
        <FinelyOsAlertBanner
          tone="warning"
          message="Email is not connected. Use Copy send pack until it is."
        />
      ) : null}

      <ul className="space-y-2">
        {lamps.map((lamp) => (
          <li key={lamp.id}>
            <button
              type="button"
              onClick={() => openLamp(lamp)}
              disabled={!lamp.href}
              className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-left transition hover:border-slate-300 disabled:cursor-default disabled:hover:border-slate-200"
            >
              <div className="min-w-0">
                <div className="text-sm font-semibold text-[#0a1628]">{lamp.label}</div>
                <p className="mt-0.5 text-sm text-slate-600">{operatorSafeHint(lamp)}</p>
              </div>
              <span className={statusChipClass(lamp)}>{statusLabel(lamp)}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
