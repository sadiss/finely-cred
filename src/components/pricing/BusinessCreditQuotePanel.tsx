import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import {
  DESTINATION_OPTIONS,
  MATURITY_OPTIONS,
  recommendBusinessCreditPackage,
  type BusinessDestination,
  type BusinessMaturity,
} from '../../config/businessCreditQuoteEngine';
import { formatPrice } from '../../config/pricingCatalog';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowTile,
} from '../../features/os/finelyOsLightUi';
import { resolvePackageSelectPath } from '../../lib/packageCheckoutRouting';
import { BusinessCapitalOutlookBlock } from './BusinessCapitalOutlookBlock';

export function BusinessCreditQuotePanel() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [maturity, setMaturity] = useState<BusinessMaturity>('startup');
  const [destination, setDestination] = useState<BusinessDestination>('G2_fundability');
  const [wantsNamedCards, setWantsNamedCards] = useState(false);
  const [namedProducts, setNamedProducts] = useState('');
  const [delivery, setDelivery] = useState<'HYBRID' | 'DFY'>('DFY');

  const quote = useMemo(
    () =>
      recommendBusinessCreditPackage({
        maturity,
        destination,
        wantsNamedCards,
        namedProducts,
        delivery,
      }),
    [maturity, destination, wantsNamedCards, namedProducts, delivery],
  );

  return (
    <section className={`${finelyOsCatalogCardCompact('amber')} space-y-4`} data-fc-accent="amber">
      <div>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Work-calibrated quote</div>
        <h3 className={`mt-1 ${FINELY_OS_ENTITY_VALUE}`}>Where is the business going?</h3>
        <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
          Maturity, destination, and named products change specialist hours — so the recommended tier changes with them.
        </p>
      </div>

      <div>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Business maturity</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {MATURITY_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setMaturity(o.id)}
              className={`${finelyOsGlowTile('amber', maturity === o.id)} px-3 py-2 text-left`}
            >
              <span className="font-semibold text-sm text-white">{o.label}</span>
              <span className="mt-0.5 block text-[10px] text-white/55">{o.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Destination</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {DESTINATION_OPTIONS.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setDestination(o.id)}
              className={`${finelyOsGlowTile('emerald', destination === o.id)} px-3 py-2 text-left`}
            >
              <span className="font-semibold text-sm text-white">{o.label}</span>
              <span className="mt-0.5 block text-[10px] text-white/55">{o.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setWantsNamedCards((v) => !v)}
          className={`${finelyOsGlowTile('fuchsia', wantsNamedCards)} px-3 py-2 text-sm text-white`}
        >
          Specific cards / products
        </button>
        <button
          type="button"
          onClick={() => setDelivery('HYBRID')}
          className={`${finelyOsGlowTile('amber', delivery === 'HYBRID')} px-3 py-2 text-sm text-white`}
        >
          Hybrid
        </button>
        <button
          type="button"
          onClick={() => setDelivery('DFY')}
          className={`${finelyOsGlowTile('amber', delivery === 'DFY')} px-3 py-2 text-sm text-white`}
        >
          Done-for-you
        </button>
      </div>

      {wantsNamedCards ? (
        <label className="block">
          <span className={FINELY_OS_ENTITY_SUBLABEL}>Named issuers / products (optional)</span>
          <input
            value={namedProducts}
            onChange={(e) => setNamedProducts(e.target.value)}
            placeholder="e.g. Amex Business, Chase Ink…"
            className="mt-1 w-full max-w-xl rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-sm text-white"
          />
        </label>
      ) : null}

      <div className={`${finelyOsCatalogCardCompact('emerald')} !p-4`} data-fc-accent="emerald">
        <div className={FINELY_OS_ENTITY_SUBLABEL}>Recommended</div>
        <div className={`mt-1 text-xl font-semibold text-white`}>{quote.pkg.name}</div>
        <div className="mt-1 text-2xl font-black text-amber-200">{quote.totalLabel}</div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{quote.hoursEstimate}</p>
        {(quote.establishedUpliftCents > 0 || quote.namedCardAddOnCents > 0) && (
          <p className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>
            Base {formatPrice(quote.basePriceCents)}
            {quote.establishedUpliftCents > 0 ? ` · Established uplift ${formatPrice(quote.establishedUpliftCents)}` : ''}
            {quote.namedCardAddOnCents > 0 ? ` · Named-card add-on ${formatPrice(quote.namedCardAddOnCents)}` : ''}
          </p>
        )}
        <BusinessCapitalOutlookBlock pkg={quote.pkg} compact className="mt-3" />
        <ul className={`mt-3 space-y-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          {quote.why.map((w) => (
            <li key={w}>• {w}</li>
          ))}
        </ul>
        <p className="mt-3 text-[10px] uppercase tracking-wider text-white/45">
          Results vary · funding subject to underwriting · not legal advice
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            className={FINELY_OS_PRIMARY_BTN}
            onClick={() =>
              navigate(
                resolvePackageSelectPath({
                  packageId: quote.packageId,
                  isAuthed: Boolean(auth.user),
                }),
              )
            }
          >
            Continue with {quote.pkg.name}
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/enlightenment-session')}>
            Book a session
          </button>
        </div>
      </div>
    </section>
  );
}
