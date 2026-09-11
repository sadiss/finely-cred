import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Copy, Radio } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { fetchLatestPlatformCronHeartbeat } from '../../data/platformCronHeartbeatRepo';
import { formatGbpQaPack } from '../../lib/gbpQaPack';
import { getPublicSiteOrigin } from '../../lib/funnelPublicLinks';
import {
  getEmailDeliveryLamp,
  getMarketingStorefrontLamps,
  getSearchIndexLamps,
  lampFromCronHeartbeat,
  type MarketingGoLiveLamp,
} from '../../lib/zeroCostChannelsOps';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';
import { FinelyOsAlertBanner } from '../os/FinelyOsAlertBanner';

const LAMP_ACCENT = ['emerald', 'violet', 'sky', 'rose', 'emerald', 'violet', 'sky', 'rose'] as const;

function chipFor(tone: MarketingGoLiveLamp['tone']) {
  if (tone === 'ok') return finelyOsStatusChip('ok');
  if (tone === 'blocked') return finelyOsStatusChip('blocked');
  return finelyOsStatusChip('warn');
}

function buildManualSendPack(): string {
  const origin = getPublicSiteOrigin();
  return [
    'Finely Cred — today’s $0 send pack',
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
  const [copied, setCopied] = useState<'pack' | 'gbp' | null>(null);

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

  const copyText = async (text: string, which: 'pack' | 'gbp') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(which);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Go live · $0 channels</div>
          <h2 className={`${FINELY_OS_ENTITY_TITLE} text-2xl`}>What is actually sending</h2>
          <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            {liveCount} of {lamps.length} ready. Email stays off until SMTP or SendGrid is on the edge.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void copyText(buildManualSendPack(), 'pack')}>
            <Copy size={14} /> {copied === 'pack' ? 'Copied' : 'Copy send pack'}
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => void copyText(formatGbpQaPack(), 'gbp')}>
            <Copy size={14} /> {copied === 'gbp' ? 'Copied' : 'Copy GBP Q&A'}
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/data-feeds')}>
            Data feeds
          </button>
          <button
            type="button"
            className={FINELY_OS_PRIMARY_BTN}
            onClick={() => navigate(emailBlocked ? '/admin/settings?tab=features' : '/admin/social-hub?tab=settings')}
          >
            {emailBlocked ? 'Open email flag' : 'Open Meta'} <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {emailBlocked ? (
        <FinelyOsAlertBanner
          tone="warning"
          message="Do not flip Email live until SMTP or SendGrid secrets are on the send-email function. Use Copy send pack until then."
        />
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {lamps.map((lamp, index) => {
          const accent = LAMP_ACCENT[index % LAMP_ACCENT.length];
          const go = () => {
            if (!lamp.href) return;
            if (lamp.href.startsWith('http')) {
              window.open(lamp.href, '_blank', 'noopener,noreferrer');
              return;
            }
            navigate(lamp.href);
          };
          return (
            <button
              key={lamp.id}
              type="button"
              onClick={go}
              className={`${finelyOsCatalogCard(accent)} text-left transition hover:brightness-110`}
              data-fc-accent={accent}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-extrabold text-white">
                  <Radio size={14} className="opacity-80" />
                  {lamp.label}
                </span>
                <span className={chipFor(lamp.tone)}>{lamp.ok ? 'Live' : lamp.tone === 'blocked' ? 'Blocked' : 'Setup'}</span>
              </div>
              <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>{lamp.hint}</p>
            </button>
          );
        })}
      </div>
    </section>
  );
}
