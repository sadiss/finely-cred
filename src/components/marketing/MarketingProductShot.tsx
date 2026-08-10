import React, { useState } from 'react';
import {
  getProductShot,
  type ProductShotKey,
  type ProductShotSlot,
} from '../../config/productShots';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

type Props = {
  shotKey?: ProductShotKey;
  shot?: ProductShotSlot;
  className?: string;
  /** Show caption under the frame. */
  showCaption?: boolean;
  /** Compact density for career bands. */
  compact?: boolean;
  /** Light = white marketing pages; dark = OS / dark heroes. */
  theme?: 'dark' | 'light';
};

function kindLabel(kind: ProductShotSlot['kind']): string {
  if (kind === 'guide-art') return 'Guide art';
  if (kind === 'pending') return 'Capture pending';
  return 'Demo capture';
}

/**
 * Honest product-shot frame — never pretends a missing/pending asset is live OS UI.
 */
export function MarketingProductShot({
  shotKey,
  shot: shotProp,
  className = '',
  showCaption = true,
  compact = false,
  theme = 'dark',
}: Props) {
  const shot = shotProp ?? (shotKey ? getProductShot(shotKey) : null);
  const [broken, setBroken] = useState(false);

  if (!shot) return null;

  const pending = shot.kind === 'pending' || broken;
  const framePad = compact ? '!p-3' : '!p-4';
  const light = theme === 'light';
  const shell = light
    ? `rounded-2xl border-2 ${pending ? 'border-amber-200 bg-amber-50/80' : 'border-slate-200 bg-white'} shadow-sm`
    : finelyOsCatalogCard(pending ? 'amber' : 'sky');
  const labelCls = light ? 'text-[10px] font-black uppercase tracking-[0.16em] text-slate-500' : FINELY_OS_ENTITY_SUBLABEL;
  const capCls = light ? 'text-[10px] font-semibold text-slate-500' : `text-[10px] font-semibold ${FINELY_OS_ENTITY_BODY}`;
  const pendingTitle = light ? 'text-sm font-semibold text-slate-800' : 'text-sm font-semibold text-white/85';
  const pendingBody = light ? 'text-xs leading-relaxed text-slate-600' : `text-xs leading-relaxed ${FINELY_OS_ENTITY_BODY}`;

  return (
    <figure
      className={`${shell} ${framePad} space-y-2 ${className}`}
      data-fc-product-shot={shot.id}
      data-fc-shot-kind={shot.kind}
    >
      <div className="flex items-center justify-between gap-2">
        <span className={labelCls}>{kindLabel(shot.kind)}</span>
        {showCaption ? <span className={capCls}>{shot.caption}</span> : null}
      </div>

      {pending ? (
        <div
          className={`relative overflow-hidden rounded-xl border border-dashed ${
            light ? 'border-amber-300/80 bg-white' : 'border-amber-400/35 bg-black/25'
          } ${compact ? 'min-h-[140px]' : 'min-h-[180px]'} grid place-items-center px-4 text-center`}
          role="img"
          aria-label={shot.alt}
        >
          <div className="space-y-1.5 max-w-sm">
            <p className={pendingTitle}>Product capture slot</p>
            <p className={pendingBody}>
              Demo hub screenshot not filed yet. The live hub UI opens after signup — this frame stays empty rather
              than showing a fake dashboard.
            </p>
          </div>
        </div>
      ) : (
        <div
          className={`relative overflow-hidden rounded-xl border ${
            light ? 'border-slate-200 bg-slate-50' : 'border-white/10 bg-black/30'
          }`}
        >
          <img
            src={shot.src}
            alt={shot.alt}
            loading="lazy"
            decoding="async"
            className={`w-full object-cover object-top ${compact ? 'max-h-[220px]' : 'max-h-[320px]'}`}
            onError={() => setBroken(true)}
          />
        </div>
      )}
    </figure>
  );
}
