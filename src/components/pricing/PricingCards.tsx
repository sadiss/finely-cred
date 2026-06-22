import React from 'react';
import { ArrowRight, Check } from 'lucide-react';
import { formatPrice, type AgencyTier, type PricingPackage } from '../../config/pricingCatalog';
import { AgencySplitBreakdown } from './AgencySplitBreakdown';

export type MetalVariant = 'gold' | 'platinum' | 'black';

export function variantForTierIndex(idx: number, total: number): MetalVariant {
  // Always make the final tier “the crown” (gold), keep adjacency alternating.
  if (total <= 1) return 'gold';
  if (idx === total - 1) return 'gold';
  if (idx === total - 2) return 'black';
  return idx % 2 === 0 ? 'platinum' : 'black';
}

export function metalBoxStyle(variant: MetalVariant): React.CSSProperties {
  if (variant === 'platinum') {
    return {
      backgroundImage: [
        'linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(229,228,226,0.86) 28%, rgba(192,192,192,0.78) 58%, rgba(148,163,184,0.70) 100%)',
        'radial-gradient(260px 180px at 70% 15%, rgba(255,255,255,0.55), transparent 62%)',
        'radial-gradient(320px 220px at 18% 78%, rgba(0,0,0,0.18), transparent 72%)',
      ].join(', '),
    };
  }
  if (variant === 'black') {
    return {
      backgroundImage: [
        'linear-gradient(145deg, rgba(15,23,42,0.92) 0%, rgba(3,7,18,0.92) 45%, rgba(0,0,0,0.92) 100%)',
        'radial-gradient(240px 160px at 20% 10%, rgba(245,158,11,0.12), transparent 65%)',
        'radial-gradient(280px 180px at 78% 20%, rgba(16,185,129,0.10), transparent 62%)',
      ].join(', '),
    };
  }
  // gold
  return {
    backgroundImage: [
      'linear-gradient(145deg, rgba(245,158,11,0.18) 0%, rgba(0,0,0,0.35) 35%, rgba(0,0,0,0.38) 100%)',
      'radial-gradient(260px 180px at 72% 18%, rgba(255,255,255,0.16), transparent 62%)',
    ].join(', '),
  };
}

export function PackageCard({
  pkg,
  variant,
  onSelect,
}: {
  pkg: PricingPackage;
  variant: MetalVariant;
  onSelect: (rail: 'stripe' | 'in_house') => void;
}) {
  const isInHouseOnly = pkg.rail === 'in_house';
  const isPlatinum = variant === 'platinum';
  const genericAuCount = (() => {
    const hay = `${pkg.tagline} ${pkg.description} ${(pkg.highlights || []).join(' ')}`;
    const m = hay.match(/(\d+)\s+(authorized user|au)\b/i);
    if (!m) return null;
    const n = parseInt(m[1] || '', 10);
    return Number.isFinite(n) && n > 0 ? n : null;
  })();
  const stripeAuCount = pkg.auCountByRail?.stripe ?? genericAuCount;
  const inHouseAuCount = pkg.auCountByRail?.in_house ?? genericAuCount;

  return (
    <div
      className="group relative rounded-2xl border p-6 flex flex-col h-full transition-all hover:border-amber-500/50 border-white/[0.08] overflow-hidden"
      style={{
        ...metalBoxStyle(variant),
        boxShadow:
          variant === 'platinum'
            ? '0 24px 70px -30px rgba(0,0,0,0.70), inset 0 1px 0 rgba(255,255,255,0.55)'
            : '0 24px 70px -36px rgba(0,0,0,0.80), inset 0 1px 0 rgba(255,255,255,0.10)',
      }}
    >
      {/* Gloss layers */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-white/20 via-transparent to-black/30" />
      <div
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{
          background:
            'radial-gradient(240px 160px at 18% 18%, rgba(255,255,255,0.18), transparent 60%), radial-gradient(260px 180px at 82% 12%, rgba(255,255,255,0.10), transparent 62%)',
        }}
      />
      <div className="absolute -inset-[200%] pointer-events-none bg-gradient-to-r from-transparent via-white/20 to-transparent rotate-[35deg] translate-x-[-110%] group-hover:translate-x-[110%] transition-transform duration-1000 ease-out" />
      <div className="absolute inset-0 pointer-events-none rounded-2xl ring-1 ring-white/[0.08]" />

      <div className="relative z-10">
        <div className="space-y-2 mb-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`${isPlatinum ? 'text-[#0d1512]' : 'text-white'} font-semibold text-lg`}>{pkg.name}</h3>
            {pkg.badgeByRail?.stripe && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider">
                Stripe: {pkg.badgeByRail.stripe}
              </span>
            )}
            {pkg.badgeByRail?.in_house && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-200 text-[10px] font-black uppercase tracking-wider">
                In-house: {pkg.badgeByRail.in_house}
              </span>
            )}
            {!pkg.badgeByRail?.stripe && !pkg.badgeByRail?.in_house && pkg.badge && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider">
                {pkg.badge}
              </span>
            )}
          </div>
          <p className={`${isPlatinum ? 'text-[#0d1512]/70' : 'text-amber-400/80'} text-sm`}>{pkg.tagline}</p>
        </div>

        <div className="mb-4">
          {pkg.valueAmount && (
            <div className={`${isPlatinum ? 'text-[#0d1512]/40' : 'text-white/40'} text-sm line-through`}>
              {formatPrice(pkg.valueAmount)}
            </div>
          )}
          <div className={`text-3xl font-bold ${isPlatinum ? 'text-[#0d1512]' : 'text-white'}`}>
            {formatPrice(pkg.priceAmount)}
          </div>
          {pkg.interval === 'month' && pkg.termMonths && (
            <div className={`${isPlatinum ? 'text-[#0d1512]/50' : 'text-white/50'} text-sm`}>/month</div>
          )}
        </div>

        <p className={`${isPlatinum ? 'text-[#0d1512]/65' : 'text-white/60'} text-sm mb-4 flex-grow`}>{pkg.description}</p>

        <ul className="space-y-2 mb-6">
          {pkg.highlights.slice(0, 6).map((h, i) => (
            <li key={i} className={`flex items-start gap-2 text-sm ${isPlatinum ? 'text-[#0d1512]/80' : 'text-white/80'}`}>
              <Check size={14} className="mt-0.5 text-emerald-400 flex-shrink-0" />
              <span>{h}</span>
            </li>
          ))}
        </ul>

        {(pkg.scopeBullets?.length || pkg.scopeBulletsByRail?.stripe?.length || pkg.scopeBulletsByRail?.in_house?.length) ? (
          <details className={`mb-6 rounded-2xl border ${isPlatinum ? 'border-black/10 bg-white/40' : 'border-white/[0.08] bg-white/[0.06]'} p-4`}>
            <summary className={`cursor-pointer select-none font-semibold ${isPlatinum ? 'text-[#0d1512]/80' : 'text-white/80'}`}>
              Scope
            </summary>
            <div className="mt-3 space-y-3">
              {pkg.scopeBullets?.length ? (
                <ul className={`space-y-1 text-sm ${isPlatinum ? 'text-[#0d1512]/75' : 'text-white/70'}`}>
                  {pkg.scopeBullets.map((x, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className={`${isPlatinum ? 'text-[#0d1512]/50' : 'text-white/50'}`}>•</span>
                      <span>{x}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
              {pkg.scopeBulletsByRail?.stripe?.length ? (
                <div>
                  <div className={`text-[10px] uppercase tracking-widest ${isPlatinum ? 'text-[#0d1512]/55' : 'text-amber-300/80'}`}>Stripe</div>
                  <ul className={`mt-2 space-y-1 text-sm ${isPlatinum ? 'text-[#0d1512]/75' : 'text-white/70'}`}>
                    {pkg.scopeBulletsByRail.stripe.map((x, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className={`${isPlatinum ? 'text-[#0d1512]/50' : 'text-white/50'}`}>•</span>
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {pkg.scopeBulletsByRail?.in_house?.length ? (
                <div>
                  <div className={`text-[10px] uppercase tracking-widest ${isPlatinum ? 'text-[#0d1512]/55' : 'text-emerald-300/80'}`}>In-house</div>
                  <ul className={`mt-2 space-y-1 text-sm ${isPlatinum ? 'text-[#0d1512]/75' : 'text-white/70'}`}>
                    {pkg.scopeBulletsByRail.in_house.map((x, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className={`${isPlatinum ? 'text-[#0d1512]/50' : 'text-white/50'}`}>•</span>
                        <span>{x}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          </details>
        ) : null}

        <div className="mt-auto space-y-2">
          {(pkg.rail === 'stripe' || pkg.rail === 'both') && (
            <div className="space-y-1">
              <button onClick={() => onSelect('stripe')} className="w-full fc-button-brand">
                {pkg.delivery === 'DIY' ? 'Get access' : 'Apply now'} <ArrowRight size={14} />
              </button>
              {stripeAuCount ? (
                <div className={`text-[11px] text-center ${isPlatinum ? 'text-[#0d1512]/55' : 'text-white/55'}`}>
                  Includes {stripeAuCount} AU{stripeAuCount === 1 ? '' : 's'} (Stripe)
                </div>
              ) : null}
            </div>
          )}
          {(pkg.rail === 'in_house' || pkg.rail === 'both') && (
            <div className="space-y-1">
              <button
                onClick={() => onSelect('in_house')}
                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                  isInHouseOnly
                    ? 'bg-emerald-500 text-black hover:brightness-110'
                    : 'border border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10'
                }`}
              >
                {isInHouseOnly ? (
                  <>
                    In-house financing <ArrowRight size={14} />
                  </>
                ) : (
                  'Or in-house financing'
                )}
              </button>
              {inHouseAuCount ? (
                <div className={`text-[11px] text-center ${isPlatinum ? 'text-[#0d1512]/55' : 'text-white/55'}`}>
                  Includes {inHouseAuCount} AU{inHouseAuCount === 1 ? '' : 's'} (In-house)
                </div>
              ) : null}
            </div>
          )}
        </div>

        {isInHouseOnly && (
          <div className={`mt-3 text-center text-xs ${isPlatinum ? 'text-emerald-700/80' : 'text-emerald-400/70'}`}>
            Reports to Equifax — Build credit while you pay
          </div>
        )}
      </div>
    </div>
  );
}

export function AgencyTierCard({ tier, onSelect }: { tier: AgencyTier; onSelect: () => void }) {
  const isCustom = tier.pricingModel === 'custom';
  const whiteLabel = (tier.whiteLabelLevel ?? 'finely_branded').replace(/_/g, ' ');

  return (
    <div
      className={`relative rounded-2xl border p-6 flex flex-col h-full transition-all hover:border-amber-500/50 ${
        tier.badge ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/[0.08] bg-white/[0.07]'
      }`}
    >
      <div className="space-y-2 mb-4">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-white font-semibold text-lg">{tier.name}</h3>
          {tier.badge && (
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-500 text-black text-[10px] font-black uppercase tracking-wider">
              {tier.badge}
            </span>
          )}
        </div>
        <p className="text-white/60 text-sm">{tier.description}</p>
      </div>

      <div className="mb-4 space-y-2">
        {tier.splitBreakdown?.length || tier.platformShareMinPct != null ? (
          <>
            <AgencySplitBreakdown tier={tier} variant="full" />
            <div className="text-amber-200/80 text-xs capitalize pt-1">{whiteLabel}</div>
          </>
        ) : (
          <div className="text-3xl font-bold text-white">Custom agreement</div>
        )}
      </div>

      <div className="mb-4 flex gap-4 text-sm">
        <div>
          <div className="text-white/50 text-xs uppercase tracking-wider">Customers</div>
          <div className="text-white font-semibold">{tier.activeClientLimit === -1 ? 'Unlimited' : tier.activeClientLimit}</div>
        </div>
        <div>
          <div className="text-white/50 text-xs uppercase tracking-wider">Seats</div>
          <div className="text-white font-semibold">{tier.seatLimit === -1 ? 'Unlimited' : tier.seatLimit}</div>
        </div>
      </div>

      <ul className="space-y-2 mb-6 flex-grow">
        {tier.features.map((f, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-white/80">
            <Check size={14} className="mt-0.5 text-emerald-400 flex-shrink-0" />
            <span>{f}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        className="w-full fc-button-brand mt-auto"
      >
        {isCustom ? 'Contact us' : 'Get started'} <ArrowRight size={14} />
      </button>
    </div>
  );
}

