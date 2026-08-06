import React from 'react';
import { ArrowRight, BadgeCheck, CalendarClock, Layers, ShieldCheck, Users } from 'lucide-react';
import { CreditCardAsset } from '../landing';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

type AuListingType = 'chase' | 'boa' | 'tdbank' | 'citi' | 'wells' | 'platinum' | 'black';

type AuListing = {
  id: string;
  issuer: string;
  cardType: AuListingType;
  limit: string;
  age: string;
  slots: string;
  season: string;
  utilOptics: string;
  reportsTo: string;
  badge?: string;
};

/** Curated AU profile showcase — illustrative inventory shape (issuer/limit/age/seats/season), not live checkout
 * pricing. "Check availability" hands the listing to the parent, which gets the buyer matched to real seat
 * availability — this is the only inventory section on `/tradelines`, no second competing grid. */
const AU_LISTINGS: AuListing[] = [
  {
    id: 'amex-platinum',
    issuer: 'American Express',
    cardType: 'platinum',
    limit: '$45,000',
    age: '12 Years',
    slots: '2 of 5 seats open',
    season: '60-day cycle · posts by the 21st',
    utilOptics: 'Sub-9% utilization on file keeps this line clean for revolving mix.',
    reportsTo: 'EX · EQ · TU',
    badge: 'High demand',
  },
  {
    id: 'chase',
    issuer: 'Chase',
    cardType: 'chase',
    limit: '$30,000',
    age: '12 Years',
    slots: '3 seats open',
    season: '45-day cycle · posts by the 6th',
    utilOptics: 'Strong limit-to-balance ratio for prime-leaning profiles.',
    reportsTo: 'EX · TU',
  },
  {
    id: 'tdbank',
    issuer: 'TD Bank',
    cardType: 'tdbank',
    limit: '$25,000',
    age: '10 Years',
    slots: '4 seats open',
    season: '60-day cycle · posts by the 7th',
    utilOptics: 'Reliable mid-tier limit for building revolving history.',
    reportsTo: 'EX · EQ · TU',
  },
  {
    id: 'citi',
    issuer: 'Citi',
    cardType: 'citi',
    limit: '$35,000',
    age: '15 Years',
    slots: '1 seat open',
    season: '60-day cycle · posts by the 12th',
    utilOptics: 'Deep account age supports length-of-history factors.',
    reportsTo: 'EX · EQ',
    badge: 'Aged line',
  },
  {
    id: 'wells',
    issuer: 'Wells Fargo',
    cardType: 'wells',
    limit: '$30,000',
    age: '14 Years',
    slots: '2 seats open',
    season: '45-day cycle · posts by the 24th',
    utilOptics: 'Long tenure plus a comfortable mid utilization band.',
    reportsTo: 'EX · TU',
  },
  {
    id: 'boa',
    issuer: 'Bank of America',
    cardType: 'boa',
    limit: '$22,500',
    age: '9 Years',
    slots: '5 seats open',
    season: '60-day cycle · posts by the 13th',
    utilOptics: 'Entry-friendly limit for thinner files starting out.',
    reportsTo: 'EX · EQ · TU',
  },
  {
    id: 'navy-black',
    issuer: 'Navy Federal',
    cardType: 'black',
    limit: '$50,000',
    age: '9 Years',
    slots: '1 seat open',
    season: '60-day cycle · posts by the 5th',
    utilOptics: 'Largest limit in this set for maximum utilization lift.',
    reportsTo: 'EQ · TU',
    badge: 'Top limit',
  },
];

function AuListingCard({ listing, onCheckAvailability }: { listing: AuListing; onCheckAvailability: () => void }) {
  return (
    <div className={`flex flex-col gap-4 ${finelyOsCatalogCard('amber')} !p-5`} data-fc-accent="amber">
      <div className="flex justify-center">
        <CreditCardAsset
          type={listing.cardType}
          className="w-full max-w-[300px] h-auto aspect-[360/230]"
          metaTop={listing.badge ? listing.badge.toUpperCase() : 'AUTHORIZED USER'}
          metaBottom={listing.issuer}
          numberText={`${listing.limit} • ${listing.age}`}
          bottomLeftLabel="SLOTS"
          bottomLeftValue={listing.slots}
          bottomRightLabel="REPORTS"
          bottomRightValue={listing.reportsTo}
          microText="AUTHORIZED USER • VERIFIED PROFILE • FINELY CRED"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 text-left">
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className={`flex items-center gap-1.5 ${FINELY_OS_ENTITY_SUBLABEL} text-[9px]`}>
            <Layers size={11} className="text-amber-400 shrink-0" /> Limit / age
          </div>
          <div className={`${FINELY_OS_ENTITY_VALUE} text-sm mt-1`}>{listing.limit} · {listing.age}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3">
          <div className={`flex items-center gap-1.5 ${FINELY_OS_ENTITY_SUBLABEL} text-[9px]`}>
            <Users size={11} className="text-emerald-400 shrink-0" /> Seats
          </div>
          <div className={`${FINELY_OS_ENTITY_VALUE} text-sm mt-1`}>{listing.slots}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3 col-span-2">
          <div className={`flex items-center gap-1.5 ${FINELY_OS_ENTITY_SUBLABEL} text-[9px]`}>
            <CalendarClock size={11} className="text-sky-400 shrink-0" /> Season
          </div>
          <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>{listing.season}</div>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 p-3 col-span-2">
          <div className={`flex items-center gap-1.5 ${FINELY_OS_ENTITY_SUBLABEL} text-[9px]`}>
            <ShieldCheck size={11} className="text-violet-400 shrink-0" /> Utilization optics
          </div>
          <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-1`}>{listing.utilOptics}</div>
        </div>
      </div>

      <button
        type="button"
        onClick={onCheckAvailability}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-amber-200 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all"
      >
        Check live availability <ArrowRight size={13} />
      </button>
    </div>
  );
}

/**
 * Public AU inventory cards (limit, age, seats, issuer, utilization optics, season).
 * "Check availability" is the buyer action — get matched / reserve — not a jump to a second competing grid.
 */
export function AuListingShowcase({
  onNavigateAuTeenSheet,
  onCheckAvailability,
}: {
  onNavigateAuTeenSheet: () => void;
  /** Buyer next step for this listing (get matched, checkout, etc.). */
  onCheckAvailability: (listing: AuListing) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-6 flex-wrap">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-amber-400">AU inventory</div>
          <h3 className="text-2xl font-light text-white mt-2">
            Browse profiles <span className="text-amber-500">and check availability</span>
          </h3>
          <p className="text-white/50 text-sm max-w-2xl mt-2">
            Limit, age, open seats, issuer, reporting bureaus, and utilization optics. Check availability to get matched
            or head to checkout.
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-200 text-[10px] font-black uppercase tracking-widest">
          <BadgeCheck size={13} /> Verified issuers only
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {AU_LISTINGS.map((listing) => (
          <AuListingCard key={listing.id} listing={listing} onCheckAvailability={() => onCheckAvailability(listing)} />
        ))}
      </div>

      <div className={`flex flex-col sm:flex-row sm:items-center gap-4 justify-between ${finelyOsCatalogCard('violet')} !p-5`} data-fc-accent="violet">
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
