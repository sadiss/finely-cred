import React from 'react';
import { CheckCircle2, X } from 'lucide-react';
import {
  formatPrice,
  getPackageDisplayDetails,
  type PricingPackage,
  type PricingRail,
} from '../../config/pricingCatalog';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

type Props = {
  pkg: PricingPackage | null;
  rail?: Exclude<PricingRail, 'both'>;
  onClose: () => void;
  onSelect?: (packageId: string) => void;
  selectLabel?: string;
};

export function ServicePackageDetailModal({ pkg, rail, onClose, onSelect, selectLabel = 'Select package' }: Props) {
  if (!pkg) return null;

  const details = getPackageDisplayDetails(pkg, rail);
  const priceLabel =
    pkg.priceAmount === 0
      ? 'Free'
      : `${formatPrice(pkg.priceAmount)}${pkg.interval === 'month' ? '/mo' : ''}`;

  return (
    <div className="fixed inset-0 z-[320]">
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={onClose} aria-hidden />
      <div className="absolute inset-x-0 top-8 px-4 pb-8 max-h-[calc(100vh-2rem)] overflow-y-auto">
        <div
          className={`mx-auto max-w-2xl shadow-2xl ${finelyOsCatalogCard('emerald')} !p-0 overflow-hidden`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="pkg-detail-title"
        >
          <div className="p-6 border-b border-white/[0.08] flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-300 font-bold`}>What&apos;s included</div>
              <h2 id="pkg-detail-title" className={`mt-2 text-xl sm:text-2xl font-bold ${FINELY_OS_ENTITY_VALUE}`}>
                {details.name}
              </h2>
              <p className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm`}>{details.tagline}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-widest">
                <span className="px-2 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-200">
                  {priceLabel}
                </span>
                <span className="px-2 py-1 rounded-full border border-white/[0.08] bg-white/[0.06] text-white/70">
                  {pkg.delivery}
                </span>
                {pkg.badge ? (
                  <span className="px-2 py-1 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-200">
                    {pkg.badge}
                  </span>
                ) : null}
              </div>
            </div>
            <button type="button" onClick={onClose} className={FINELY_OS_SECONDARY_BTN} title="Close" aria-label="Close">
              <X size={18} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div>
              <h3 className={`text-sm font-semibold uppercase tracking-wider ${FINELY_OS_ENTITY_SUBLABEL}`}>Overview</h3>
              <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm leading-relaxed`}>{details.description}</p>
            </div>

            {details.scopeBullets.length ? (
              <div>
                <h3 className={`text-sm font-semibold uppercase tracking-wider ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  Scope &amp; limits
                </h3>
                <ul className="mt-3 space-y-2">
                  {details.scopeBullets.map((line) => (
                    <li key={line} className={`flex items-start gap-2 ${FINELY_OS_ENTITY_BODY} text-sm`}>
                      <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {details.highlights.length ? (
              <div>
                <h3 className={`text-sm font-semibold uppercase tracking-wider ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  Full deliverables
                </h3>
                <ul className="mt-3 space-y-2">
                  {details.highlights.map((line) => (
                    <li key={line} className={`flex items-start gap-2 ${FINELY_OS_ENTITY_BODY} text-sm`}>
                      <CheckCircle2 size={16} className="text-violet-400 shrink-0 mt-0.5" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className={`text-[11px] ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
              Educational workflow only — not legal advice. Exact outcomes depend on bureau responses and file complexity.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              {onSelect ? (
                <button
                  type="button"
                  onClick={() => {
                    onSelect(pkg.id);
                    onClose();
                  }}
                  className={FINELY_OS_PRIMARY_BTN}
                >
                  {selectLabel}
                </button>
              ) : null}
              <button type="button" onClick={onClose} className={FINELY_OS_SECONDARY_BTN}>
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
