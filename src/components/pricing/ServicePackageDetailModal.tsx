import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2 } from 'lucide-react';
import {
  formatPrice,
  getPackageDisplayDetails,
  type PricingPackage,
  type PricingRail,
} from '../../config/pricingCatalog';
import {
  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';
import { FinelyOsModalCloseButton } from '../../features/os/FinelyOsModalCloseButton';
import { BusinessCapitalOutlookBlock } from './BusinessCapitalOutlookBlock';

type Props = {
  pkg: PricingPackage | null;
  rail?: Exclude<PricingRail, 'both'>;
  onClose: () => void;
  onSelect?: (packageId: string) => void;
  selectLabel?: string;
};

export function ServicePackageDetailModal({ pkg, rail, onClose, onSelect, selectLabel = 'Select package' }: Props) {
  useEffect(() => {
    if (!pkg) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pkg, onClose]);

  if (!pkg) return null;

  const details = getPackageDisplayDetails(pkg, rail);
  const priceLabel = pkg.isCustomQuote
    ? 'Custom quote'
    : pkg.priceAmount === 0
      ? 'Free'
      : `${formatPrice(pkg.priceAmount)}${pkg.interval === 'month' ? '/mo' : ''}`;

  const modal = (
    <div className={`${FINELY_OS_FIXED_OVERLAY} z-[320]`} role="presentation">
      <button type="button" className="absolute inset-0 cursor-default bg-slate-900/70 backdrop-blur-sm" aria-label="Close package details" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center px-4 py-10">
        <div
          className="relative mx-auto w-full max-w-lg max-h-[72vh] overflow-hidden rounded-2xl border border-emerald-500/35 bg-[#f7fbf8] text-[#0a1628] shadow-2xl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="pkg-detail-title"
        >
          <div className="sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-emerald-500/20 bg-[#ecf8f1] px-5 py-3">
            <div className="min-w-0">
              <div className="text-sm font-extrabold uppercase tracking-[0.14em] text-emerald-700">What&apos;s included</div>
              <h2 id="pkg-detail-title" className="mt-1 text-xl font-extrabold text-[#0a1628]">
                {details.name}
              </h2>
              <p className="mt-1 text-base font-semibold text-[#3d4f66]">{details.tagline}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-extrabold uppercase tracking-widest">
                <span className="rounded-full border border-emerald-600/25 bg-emerald-500/10 px-2 py-1 text-emerald-800">
                  {priceLabel}
                </span>
                <span className="rounded-full border border-sky-600/20 bg-sky-500/10 px-2 py-1 text-sky-800">
                  {pkg.delivery}
                </span>
                {pkg.badge ? (
                  <span className="rounded-full border border-violet-600/20 bg-violet-500/10 px-2 py-1 text-violet-800">
                    {pkg.badge}
                  </span>
                ) : null}
              </div>
            </div>
            <FinelyOsModalCloseButton onClick={onClose} />
          </div>

          <div className="max-h-[calc(72vh-8.5rem)] space-y-4 overflow-y-auto p-5 text-[#0a1628]">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0a1628]">Overview</h3>
              <p className="mt-2 text-base font-semibold leading-relaxed text-[#3d4f66]">{details.description}</p>
              {pkg.debtBalanceGuidance ? (
                <p className="mt-2 text-base font-semibold text-[#3d4f66]">
                  Partners with <span className="font-extrabold text-[#0a1628]">{pkg.debtBalanceGuidance.label}</span> often start here
                  (exact package confirmed after intake).
                </p>
              ) : null}
              {pkg.businessCapitalOutlook ? (
                <BusinessCapitalOutlookBlock pkg={pkg} tone="light" className="mt-3" />
              ) : null}
            </div>

            {details.scopeBullets.length ? (
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0a1628]">
                  Scope &amp; limits
                </h3>
                <ul className="mt-3 space-y-2">
                  {details.scopeBullets.map((line) => (
                    <li key={line} className="flex items-start gap-2 text-base font-semibold text-[#3d4f66]">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            {details.highlights.length ? (
              <div>
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#0a1628]">
                  Full deliverables
                </h3>
                <ul className="mt-3 space-y-2">
                  {details.highlights.map((line) => (
                    <li key={line} className="flex items-start gap-2 text-base font-semibold text-[#3d4f66]">
                      <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-violet-600" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <p className="text-xs font-semibold text-[#5b6f86]">
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

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal;
}
