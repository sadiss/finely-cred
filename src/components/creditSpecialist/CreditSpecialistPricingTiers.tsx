import React, { useState } from 'react';
import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import {
  CREDIT_SPECIALIST_OFFER_TIERS,
  type CreditSpecialistOfferTier,
  type CreditSpecialistOfferTierId,
} from '../../config/creditSpecialistOffer';
import { FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN, finelyOsCatalogCard } from '../../features/os/finelyOsLightUi';

type Props = {
  selectedTierId?: CreditSpecialistOfferTierId | '';
  onSelectTier?: (tier: CreditSpecialistOfferTier) => void;
  ctaLabel?: string;
  onCta?: (tier: CreditSpecialistOfferTier) => void;
  className?: string;
};

const BUCKETS: Array<{ key: keyof Pick<CreditSpecialistOfferTier, 'access' | 'education' | 'methods' | 'tools' | 'support'>; label: string }> = [
  { key: 'access', label: 'Access' },
  { key: 'education', label: 'Education' },
  { key: 'methods', label: 'Methods' },
  { key: 'tools', label: 'Tools' },
  { key: 'support', label: 'Support' },
];

/**
 * Expanded tier compare (access / education / methods / tools / support).
 * Kept for optional deep-dive surfaces — join flow uses CareerPriceCardGrid instead.
 * Ink tokens stay slate on light nested panels so copy never goes white-on-white.
 */
export function CreditSpecialistPricingTiers({
  selectedTierId,
  onSelectTier,
  ctaLabel = 'Choose this tier',
  onCta,
  className = '',
}: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(selectedTierId || CREDIT_SPECIALIST_OFFER_TIERS[1]?.id || null);

  return (
    <div className={`space-y-6 ${className}`}>
      <header className="space-y-3">
        <p className="text-sm font-bold uppercase tracking-widest text-amber-300">Transparent tiers</p>
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">What each level includes</h2>
        <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-3xl">
          Revenue share only — no flat platform fee. Every tier includes the 3-lead minimum and 30-day free-leads window.
          Expand a card for access, education, methods, tools, and support.
        </p>
      </header>

      <div className="grid lg:grid-cols-2 gap-4">
        {CREDIT_SPECIALIST_OFFER_TIERS.map((tier) => {
          const active = selectedTierId === tier.id;
          const open = expandedId === tier.id;
          return (
            <article
              key={tier.id}
              className={
                `${finelyOsCatalogCard(active ? 'emerald' : 'sky')} !p-5 sm:!p-6 border-2 space-y-4 ` +
                (active ? 'ring-4 ring-emerald-200/40 border-emerald-400' : '')
              }
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  {tier.badge ? (
                    <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#1c1206] bg-gradient-to-r from-amber-500 to-amber-600 px-2 py-1 rounded-md">
                      {tier.badge}
                    </span>
                  ) : null}
                  <h3 className="mt-2 text-xl sm:text-2xl font-bold text-white">{tier.name}</h3>
                  <p className="mt-1 text-sm text-white/75 leading-relaxed">{tier.tagline}</p>
                </div>
                <div className="text-right rounded-xl border-2 border-emerald-400/40 bg-emerald-500/15 px-3 py-2">
                  <div className="text-3xl sm:text-4xl font-black tabular-nums text-emerald-300">{tier.keepPctLabel}</div>
                  <div className="text-sm font-semibold text-white/60">typical keep</div>
                </div>
              </div>

              <div className="rounded-xl border border-white/15 bg-black/30 px-4 py-3">
                <div className="text-sm font-bold text-white">{tier.priceLabel}</div>
                <p className="text-sm text-white/70 leading-relaxed">{tier.priceHint}</p>
              </div>

              <p className="text-sm text-white/75 leading-relaxed">
                <strong className="text-amber-200">Best for:</strong> {tier.bestFor}
              </p>

              <button
                type="button"
                onClick={() => setExpandedId(open ? null : tier.id)}
                className="inline-flex items-center gap-1 text-sm font-bold text-sky-300 hover:underline"
              >
                {open ? 'Hide details' : 'Show access · education · methods · tools · support'}
                <ChevronDown size={16} className={open ? 'rotate-180 transition' : 'transition'} />
              </button>

              {open ? (
                <div className="grid sm:grid-cols-2 gap-3">
                  {BUCKETS.map((bucket) => (
                    <div key={bucket.key} className="rounded-xl border border-white/12 bg-black/35 p-4 space-y-2">
                      <div className="text-sm font-bold uppercase tracking-wider text-white/55">{bucket.label}</div>
                      <ul className="space-y-1.5">
                        {tier[bucket.key].map((line) => (
                          <li key={line} className="flex gap-2 text-sm text-white/80 leading-relaxed">
                            <Check size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                            {line}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2 pt-1">
                {onSelectTier ? (
                  <button
                    type="button"
                    onClick={() => onSelectTier(tier)}
                    className={active ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
                  >
                    {active ? 'Selected' : 'Select tier'}
                  </button>
                ) : null}
                {onCta ? (
                  <button type="button" onClick={() => onCta(tier)} className={FINELY_OS_PRIMARY_BTN}>
                    {ctaLabel} <ArrowRight size={14} />
                  </button>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
