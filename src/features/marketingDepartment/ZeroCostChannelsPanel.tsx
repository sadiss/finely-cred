import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getGoogleBusinessProfileChecks,
  getMetaPublishChecks,
  getYouTubeChannelChecks,
} from '../../lib/zeroCostChannelsOps';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

/** GBP, YouTube, Meta — $0 channel setup status (official APIs where connected). */
export function ZeroCostChannelsPanel() {
  const navigate = useNavigate();
  const gbp = getGoogleBusinessProfileChecks();
  const yt = getYouTubeChannelChecks();
  const meta = getMetaPublishChecks();

  const Section = ({ title, checks }: { title: string; checks: ReturnType<typeof getMetaPublishChecks> }) => (
    <div className="mt-3">
      <p className={`text-[10px] font-bold uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>{title}</p>
      <ul className={`mt-1 space-y-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
        {checks.map((c) => (
          <li key={c.id} className="flex flex-wrap items-center gap-2">
            <span className={c.ok ? finelyOsStatusChip('ok') : finelyOsStatusChip('warn')}>{c.ok ? 'OK' : 'Setup'}</span>
            <span>{c.label}</span>
            <span className="text-white/50">— {c.hint}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <div className={finelyOsCatalogCardCompact('emerald')}>
      <p className={FINELY_OS_ENTITY_SUBLABEL}>$0 channel bridges</p>
      <p className="mt-1 text-sm font-semibold text-white">Google · YouTube · Meta — official paths only</p>
      <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
        Email + organic social are your $0 outreach. Meta can auto-publish when OAuth is connected. GBP and YouTube API
        scaffolds show what to wire next.
      </p>
      <Section title="Google Business Profile" checks={gbp} />
      <Section title="YouTube" checks={yt} />
      <Section title="Meta (Facebook / Instagram)" checks={meta} />
      <div className="mt-3 flex flex-wrap gap-2">
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
