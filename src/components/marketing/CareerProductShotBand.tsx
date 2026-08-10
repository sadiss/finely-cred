import React from 'react';
import {
  CAREER_PRODUCT_SHOT,
  getProductShot,
  type ProductShotKey,
} from '../../config/productShots';
import type { PublicCareerTrackId } from '../../config/publicCareers';
import { MarketingProductShot } from './MarketingProductShot';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
} from '../../features/os/finelyOsLightUi';

/** Optional secondary guide-art key when a track has a real second asset on disk. */
const CAREER_SECONDARY_SHOT: Partial<Record<PublicCareerTrackId, ProductShotKey>> = {
  au_sellers: 'careerAuGuideArt',
  agency_partners: 'guideAgencyBook',
};

type Props = {
  trackId: PublicCareerTrackId;
  /** Override primary shot. */
  shotKey?: ProductShotKey;
  /** Override / disable secondary guide art. */
  secondaryShotKey?: ProductShotKey | null;
  title?: string;
  subtitle?: string;
  className?: string;
  theme?: 'dark' | 'light';
};

/**
 * Compact product-shot band for the six public career pages.
 * Uses real captures / guide art when present; never invents hub UI.
 */
export function CareerProductShotBand({
  trackId,
  shotKey,
  secondaryShotKey,
  title = 'See the surface',
  subtitle = 'Demo capture or guide art for this track — the live hub opens after you join.',
  className = '',
  theme = 'light',
}: Props) {
  const key = shotKey ?? CAREER_PRODUCT_SHOT[trackId];
  const secondary =
    secondaryShotKey === null
      ? null
      : secondaryShotKey
        ? getProductShot(secondaryShotKey)
        : CAREER_SECONDARY_SHOT[trackId]
          ? getProductShot(CAREER_SECONDARY_SHOT[trackId]!)
          : null;
  const light = theme === 'light';

  return (
    <section className={`space-y-2 ${className}`} data-fc-career-shot-band={trackId}>
      <div className="max-w-2xl space-y-1">
        <p className={light ? 'text-[10px] font-black uppercase tracking-[0.2em] text-slate-500' : FINELY_OS_ENTITY_SUBLABEL}>
          {title}
        </p>
        <h2 className={light ? 'text-lg font-bold tracking-tight text-slate-900' : `${FINELY_OS_ENTITY_TITLE} !text-lg`}>
          {subtitle}
        </h2>
        <p className={light ? 'text-xs text-slate-500' : `text-xs ${FINELY_OS_ENTITY_BODY}`}>
          Results vary · not legal advice · funding subject to underwriting
        </p>
      </div>
      <div className={secondary ? 'grid gap-3 sm:grid-cols-2' : undefined}>
        <MarketingProductShot shotKey={key} compact theme={theme} />
        {secondary ? <MarketingProductShot shot={secondary} compact theme={theme} /> : null}
      </div>
    </section>
  );
}
