import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  formatBusinessCapitalOutlook,
  formatPrice,
  getPackageDisplayDetails,
  type PricingPackage,
} from '../../config/pricingCatalog';

const ACCENT: Record<string, 'violet' | 'sky' | 'rose' | 'emerald'> = {
  business_foundation: 'sky',
  business_builder: 'violet',
  business_elite: 'rose',
  business_empire: 'emerald',
};

const TIER_LABELS = [
  { ordinal: '1st', title: 'First trades' },
  { ordinal: '2nd', title: 'Trade depth' },
  { ordinal: '3rd', title: 'Store & fleet' },
  { ordinal: '4th', title: 'Capital asks' },
] as const;

const TIER_COUNT: Record<string, number> = {
  business_foundation: 1,
  business_builder: 4,
  business_elite: 4,
  business_empire: 4,
};

type Props = {
  pkg: PricingPackage | null;
  onClose: () => void;
  onSelect: (packageId: string) => void;
};

export function BusinessCreditIncludesModal({ pkg, onClose, onSelect }: Props) {
  useEffect(() => {
    if (!pkg) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pkg, onClose]);

  if (!pkg) return null;

  const details = getPackageDisplayDetails(pkg);
  const outlook = formatBusinessCapitalOutlook(pkg);
  const accent = ACCENT[pkg.id] ?? 'violet';
  const priceLabel = pkg.isCustomQuote ? 'Custom quote' : formatPrice(pkg.priceAmount);
  const tierCount = TIER_COUNT[pkg.id] ?? 4;
  const chips = details.highlights.slice(0, 6);

  const modal = (
    <div className="bc-includes" role="presentation">
      <button type="button" className="bc-includes__backdrop" aria-label="Close package details" onClick={onClose} />
      <div
        className="bc-includes__panel bc-mosaic"
        data-fc-accent={accent}
        role="dialog"
        aria-modal="true"
        aria-labelledby="bc-includes-title"
      >
        <div className="bc-includes__head">
          <div>
            <p>What&apos;s included</p>
            <h2 id="bc-includes-title">{details.name}</h2>
            <span>
              {priceLabel} · {pkg.delivery}
              {pkg.badge ? ` · ${pkg.badge}` : ''}
            </span>
          </div>
          <button type="button" className="bc-includes__close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="bc-includes__body">
          {outlook ? (
            <div className="bc-includes__figures" aria-label="Capital outlook">
              <div>
                <span>Program fee</span>
                <strong>{outlook.programLabel}</strong>
              </div>
              <div>
                <span>Vendor outlay</span>
                <strong>{outlook.outlayLabel}</strong>
              </div>
              <div>
                <span>Potential capital</span>
                <strong>{outlook.potentialLabel}</strong>
              </div>
            </div>
          ) : null}

          <p className="bc-includes__lede">{details.tagline}.</p>

          <div className="bc-includes__room">
            <h3>Vendor path in this ticket</h3>
            <div className="bc-includes__tiers">
              {TIER_LABELS.map((tier, index) => (
                <div key={tier.ordinal}>
                  <span>{index < tierCount ? tier.ordinal : 'Next'}</span>
                  <strong>{index < tierCount ? tier.title : 'Builder+'}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="bc-includes__room">
            <h3>In this ticket</h3>
            <ul className="bc-includes__chips">
              {chips.map((line) => (
                <li key={line}>{line.replace(' in Business Credit OS', '')}</li>
              ))}
            </ul>
          </div>

          <p className="bc-includes__note">
            Results vary · not legal advice · funding subject to underwriting
          </p>
        </div>

        <div className="bc-includes__foot">
          <button
            type="button"
            className="bc-prev-btn-primary"
            onClick={() => {
              onSelect(pkg.id);
              onClose();
            }}
          >
            Select package
          </button>
          <button type="button" className="bc-prev-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modal, document.body) : modal;
}
