import React from 'react';
import { ArrowRight, Headphones, Layers, Package } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { formatPrice } from '../../config/pricingCatalog';
import {
  bundleListPriceCents,
  bundleSavingsCents,
  listPublishedBundles,
  resolveBundleProducts,
} from '../../lib/bookstoreCommerce';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlassShell,
} from '../../features/os/finelyOsLightUi';

export function BookstoreBundlesPanel({ compact }: { compact?: boolean }) {
  const navigate = useNavigate();
  const bundles = listPublishedBundles();
  if (!bundles.length) return null;

  return (
    <div className={`space-y-4 ${finelyOsGlassShell('panel', 'violet')}`}>
      <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
        <Package size={14} className="text-violet-300" /> Read + listen bundles
      </div>
      {!compact ? (
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
          Save on multi-title packs — each book unlocks in My Library with neural narration per chapter.
        </p>
      ) : null}

      <div className={`grid gap-4 ${compact ? '' : 'md:grid-cols-2'}`}>
        {bundles.map((b) => {
          const products = resolveBundleProducts(b);
          const list = bundleListPriceCents(b);
          const save = bundleSavingsCents(b);
          return (
            <div key={b.id} className={`${finelyOsGlassShell('inner', 'amber')} p-4 space-y-3`}>
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{b.title}</div>
                  <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{b.description}</p>
                </div>
                {b.badge ? <span className={FINELY_OS_ENTITY_CHIP}>{b.badge}</span> : null}
              </div>
              <div className="flex flex-wrap gap-1">
                {products.map((p) => (
                  <span key={p.slug} className={`${FINELY_OS_ENTITY_CHIP} text-[10px]`}>
                    <Layers size={10} className="inline mr-1" />
                    {p.title}
                  </span>
                ))}
              </div>
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-amber-300 font-black text-xl">{formatPrice(b.priceAmount)}</div>
                  {save > 0 ? (
                    <div className={`text-[10px] ${FINELY_OS_ENTITY_SUBLABEL}`}>
                      Was {formatPrice(list)} · save {formatPrice(save)}
                    </div>
                  ) : null}
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/portal/library/purchase/bundle/${b.slug}`)}
                  className={FINELY_OS_PRIMARY_BTN}
                >
                  <Headphones size={14} className="inline mr-1" /> Unlock bundle <ArrowRight size={12} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      {!compact ? (
        <button type="button" onClick={() => navigate('/portal/library')} className={FINELY_OS_SECONDARY_BTN}>
          Open My Library
        </button>
      ) : null}
    </div>
  );
}
