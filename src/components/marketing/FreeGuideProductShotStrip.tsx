import React from 'react';
import {
  FREE_GUIDE_FALLBACK_SHOTS,
  FREE_GUIDE_MATERIAL_SHOTS,
  FREE_GUIDE_PRODUCT_SHOTS,
  getProductShot,
  type ProductShotKey,
} from '../../config/productShots';
import { MarketingProductShot } from './MarketingProductShot';

type Props = {
  className?: string;
};

/**
 * Demo product-shot strip for `/free-guide` — uses captures under
 * `public/images/product-shots/` when present; falls back to site/guide art.
 */
export function FreeGuideProductShotStrip({ className = '' }: Props) {
  const devices: ProductShotKey[] = FREE_GUIDE_PRODUCT_SHOTS.length
    ? FREE_GUIDE_PRODUCT_SHOTS
    : FREE_GUIDE_FALLBACK_SHOTS.slice(0, 3);
  const materials = FREE_GUIDE_MATERIAL_SHOTS;

  return (
    <section className={`space-y-3 ${className}`} data-fc-free-guide-shots="1">
      <div className="mx-auto max-w-2xl text-center space-y-1 px-1">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#c4803d]">Demo product shots</p>
        <h3 className="text-xl font-bold tracking-tight text-[#0a1628] sm:text-2xl">
          Real pages. Demo data. No fake dashboards.
        </h3>
        <p className="text-xs leading-relaxed text-[#0a1628]/60">
          Captures from the live site and guide kit. We do not invent product frames.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        {devices.map((key) => (
          <MarketingProductShot key={key} shot={getProductShot(key)} compact showCaption theme="light" />
        ))}
      </div>
      {materials.length ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {materials.map((key) => (
            <MarketingProductShot key={key} shot={getProductShot(key)} compact showCaption theme="light" />
          ))}
        </div>
      ) : null}
    </section>
  );
}
