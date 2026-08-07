import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, BadgeCheck, CalendarClock, Loader2, Radio, ShieldCheck } from 'lucide-react';
import {
  AuMarketplaceCard,
  defaultTierForFinish,
  type AuCardFinish,
  type AuCardNetwork,
} from '../landing/AuMarketplaceCard';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';
import { listApprovedMarketplaceListingsAsync } from '../../data/auSellerRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import {
  mapApprovedListingToShowcase,
  type AuShowcaseListing,
} from '../../lib/auMarketplaceInventory';

export type { AuShowcaseListing };

/** Demo catalog — shown only when no live approved marketplace rows exist. */
const DEMO_AU_LISTINGS: AuShowcaseListing[] = [
  {
    id: 'demo:amex-platinum',
    issuer: 'American Express',
    finish: 'platinum' as AuCardFinish,
    network: 'amex' as AuCardNetwork,
    pan: '3706',
    limit: '$45,000',
    age: '12 Years',
    slots: '2 of 5 seats open',
    season: '60-day cycle · posts by the 21st',
    utilOptics: 'Sub-9% utilization on file keeps this line clean for revolving mix.',
    reportsTo: 'EX · EQ · TU',
    badge: 'Demo sample',
    source: 'demo',
    live: false,
    priceCents: 120000,
    slotsAvailable: 2,
  },
  {
    id: 'demo:chase',
    issuer: 'Chase',
    finish: 'sapphire',
    network: 'visa',
    pan: '4929',
    limit: '$30,000',
    age: '12 Years',
    slots: '3 seats open',
    season: '45-day cycle · posts by the 6th',
    utilOptics: 'Strong limit-to-balance ratio for prime-leaning profiles.',
    reportsTo: 'EX · TU',
    badge: 'Demo sample',
    source: 'demo',
    live: false,
    priceCents: 98000,
    slotsAvailable: 3,
  },
  {
    id: 'demo:tdbank',
    issuer: 'TD Bank',
    finish: 'emerald',
    network: 'visa',
    pan: '4118',
    limit: '$25,000',
    age: '10 Years',
    slots: '4 seats open',
    season: '60-day cycle · posts by the 7th',
    utilOptics: 'Reliable mid-tier limit for building revolving history.',
    reportsTo: 'EX · EQ · TU',
    badge: 'Demo sample',
    source: 'demo',
    live: false,
    priceCents: 85000,
    slotsAvailable: 4,
  },
  {
    id: 'demo:citi',
    issuer: 'Citi',
    finish: 'gold',
    network: 'mastercard',
    pan: '5412',
    limit: '$35,000',
    age: '15 Years',
    slots: '1 seat open',
    season: '60-day cycle · posts by the 12th',
    utilOptics: 'Deep account age supports length-of-history factors.',
    reportsTo: 'EX · EQ',
    badge: 'Demo sample',
    source: 'demo',
    live: false,
    priceCents: 95000,
    slotsAvailable: 1,
  },
  {
    id: 'demo:wells',
    issuer: 'Wells Fargo',
    finish: 'titanium',
    network: 'visa',
    pan: '4532',
    limit: '$30,000',
    age: '14 Years',
    slots: '2 seats open',
    season: '45-day cycle · posts by the 24th',
    utilOptics: 'Long tenure plus a comfortable mid utilization band.',
    reportsTo: 'EX · TU',
    badge: 'Demo sample',
    source: 'demo',
    live: false,
    priceCents: 89000,
    slotsAvailable: 2,
  },
  {
    id: 'demo:boa',
    issuer: 'Bank of America',
    finish: 'gold',
    network: 'discover',
    pan: '6011',
    limit: '$22,500',
    age: '9 Years',
    slots: '5 seats open',
    season: '60-day cycle · posts by the 13th',
    utilOptics: 'Entry-friendly limit for thinner files starting out.',
    reportsTo: 'EX · EQ · TU',
    badge: 'Demo sample',
    source: 'demo',
    live: false,
    priceCents: 79000,
    slotsAvailable: 5,
  },
  {
    id: 'demo:navy-black',
    issuer: 'Navy Federal',
    finish: 'obsidian',
    network: 'mastercard',
    pan: '5310',
    limit: '$50,000',
    age: '9 Years',
    slots: '1 seat open',
    season: '60-day cycle · posts by the 5th',
    utilOptics: 'Largest limit in this set for maximum utilization lift.',
    reportsTo: 'EQ · TU',
    badge: 'Demo sample',
    source: 'demo',
    live: false,
    priceCents: 110000,
    slotsAvailable: 1,
  },
];

function AuListingCard({
  listing,
  onCheckAvailability,
}: {
  listing: AuShowcaseListing;
  onCheckAvailability: () => void;
}) {
  const soldOut = listing.slotsAvailable === 0;
  return (
    <div className="flex flex-col gap-3">
      <AuMarketplaceCard
        finish={listing.finish}
        issuer={listing.issuer}
        tier={defaultTierForFinish(listing.finish)}
        limit={listing.limit}
        age={listing.age.replace(/\s*Years?/i, ' yrs')}
        slots={listing.slots.replace(/\s+open$/i, '')}
        pan={listing.pan}
        network={listing.network}
        badge={listing.badge ?? (listing.live ? 'Live inventory' : 'Authorized user')}
      />

      <div className="grid gap-2 text-left">
        <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
          <CalendarClock size={13} className="text-sky-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-[9px]`}>Season</div>
            <div className={`${FINELY_OS_ENTITY_VALUE} text-xs mt-0.5`}>{listing.season}</div>
          </div>
        </div>
        <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
          <Radio size={13} className="text-amber-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-[9px]`}>Reports to</div>
            <div className={`${FINELY_OS_ENTITY_VALUE} text-xs mt-0.5`}>{listing.reportsTo}</div>
          </div>
        </div>
        <div className="flex items-start gap-2.5 rounded-xl border border-white/10 bg-black/25 px-3 py-2.5">
          <ShieldCheck size={13} className="text-violet-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-[9px]`}>Utilization optics</div>
            <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-0.5`}>{listing.utilOptics}</div>
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={soldOut}
        onClick={onCheckAvailability}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-amber-200 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all disabled:opacity-45 disabled:cursor-not-allowed disabled:hover:bg-amber-500/10"
      >
        {soldOut ? (
          'No seats open'
        ) : (
          <>
            Check availability <ArrowRight size={13} />
          </>
        )}
      </button>
    </div>
  );
}

/**
 * Public AU inventory on `/tradelines` — live approved seller listings when available,
 * otherwise a clearly labeled demo catalog. Check availability → reserve / `/au/request`.
 */
export function AuListingShowcase({
  onNavigateAuTeenSheet,
  onCheckAvailability,
}: {
  onNavigateAuTeenSheet: () => void;
  /** Buyer next step for this listing (reserve, checkout, `/au/request`). */
  onCheckAvailability: (listing: AuShowcaseListing) => void;
}) {
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [liveRows, setLiveRows] = useState<AuShowcaseListing[]>([]);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listApprovedMarketplaceListingsAsync(getActiveTenantId())
      .then((rows) => {
        if (cancelled) return;
        setLiveRows(rows.map(mapApprovedListingToShowcase));
      })
      .catch(() => {
        if (!cancelled) setLiveRows([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [version]);

  const liveOnly = liveRows.length > 0;
  const listings = useMemo(
    () => (liveOnly ? liveRows : DEMO_AU_LISTINGS),
    [liveOnly, liveRows],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">AU inventory</div>
          <h3 className="text-2xl font-light text-white mt-2">
            Browse profiles <span className="text-amber-500">and check availability</span>
          </h3>
          <p className="text-white/50 text-sm max-w-2xl mt-2">
            Limit, age, open seats, issuer, reporting bureaus, and utilization optics. Check availability to reserve a
            seat or continue to buyer intake — outcomes and posting dates vary.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-[10px] font-black uppercase tracking-widest">
          <BadgeCheck size={13} /> Verified issuers only
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-black/25 px-4 py-3 text-sm text-white/60">
          <Loader2 size={14} className="animate-spin text-amber-300" /> Loading verified AU inventory…
        </div>
      ) : liveOnly ? (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
          Live inventory — {liveRows.length} verified seller listing{liveRows.length === 1 ? '' : 's'} with real seat
          counts. Seats change as partners reserve.
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
          Demo catalog — illustrative samples only (not live seats). Publish verified AU seller listings in Admin → AU
          Sellers to replace this preview.
        </div>
      )}

      <div className="fc-au-card-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {listings.map((listing) => (
          <AuListingCard
            key={listing.id}
            listing={listing}
            onCheckAvailability={() => onCheckAvailability(listing)}
          />
        ))}
      </div>

      <p className="text-[11px] text-white/40 text-center">
        {liveOnly
          ? 'Live seller inventory · seat counts and posting windows change without notice · results vary'
          : 'Demo catalog for demonstration · not live inventory · limits, age, and availability vary by seller'}
      </p>

      <div
        className={`flex flex-col sm:flex-row sm:items-center gap-4 justify-between ${finelyOsCatalogCard('violet')} !p-5`}
        data-fc-accent="violet"
      >
        <div>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-300`}>Adding a teen or family member as AU?</div>
          <p className={`${FINELY_OS_ENTITY_BODY} text-sm mt-1 max-w-xl`}>
            Issuer minimum ages and minor-reporting rules vary (some never report a minor to the bureaus). Read the
            2-sheet parent kit before you add anyone under 18.
          </p>
        </div>
        <button
          type="button"
          onClick={onNavigateAuTeenSheet}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-500/30 bg-violet-500/10 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-violet-200 hover:bg-violet-500/20 hover:border-violet-500/50 transition-all whitespace-nowrap"
        >
          Get the AU & Teen Credit sheet <ArrowRight size={13} />
        </button>
      </div>

      <p className="text-[11px] text-white/35 text-center">
        Results vary · not legal advice · seat availability and posting dates change without notice.
      </p>
    </div>
  );
}
