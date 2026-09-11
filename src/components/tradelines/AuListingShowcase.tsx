import React, { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import {
  AuMarketplaceCard,
  defaultTierForFinish,
  type AuCardFinish,
} from '../landing/AuMarketplaceCard';
import { listApprovedMarketplaceListingsAsync } from '../../data/auSellerRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { formatPrice } from '../../config/pricingCatalog';
import {
  mapApprovedListingToShowcase,
  type AuShowcaseListing,
} from '../../lib/auMarketplaceInventory';

export type { AuShowcaseListing };

/** Preview floor — how seats read. Never sold as live inventory. */
const SAMPLE_FLOOR: AuShowcaseListing[] = [
  {
    id: 'sample:amex',
    issuer: 'American Express',
    finish: 'platinum',
    network: 'amex',
    pan: '',
    limit: '$45,000',
    age: '12 Years',
    slots: '2 of 5 seats',
    season: '60-day cycle · posts by the 21st',
    utilOptics: 'Reported under 9% use, so the available limit can show cleanly.',
    reportsTo: 'EX · EQ · TU',
    badge: 'Preview',
    source: 'demo',
    live: false,
    priceCents: 120000,
    slotsAvailable: 2,
  },
  {
    id: 'sample:chase',
    issuer: 'Chase',
    finish: 'sapphire',
    network: 'visa',
    pan: '',
    limit: '$30,000',
    age: '12 Years',
    slots: '3 of 5 seats',
    season: '45-day cycle · posts by the 6th',
    utilOptics: 'Strong limit-to-balance ratio for a prime-leaning revolving mix.',
    reportsTo: 'EX · TU',
    badge: 'Preview',
    source: 'demo',
    live: false,
    priceCents: 98000,
    slotsAvailable: 3,
  },
  {
    id: 'sample:citi',
    issuer: 'Citi',
    finish: 'gold',
    network: 'mastercard',
    pan: '',
    limit: '$35,000',
    age: '15 Years',
    slots: '1 of 5 seats',
    season: '60-day cycle · posts by the 12th',
    utilOptics: 'Deep account age supports length-of-history on the personal file.',
    reportsTo: 'EX · EQ',
    badge: 'Preview',
    source: 'demo',
    live: false,
    priceCents: 95000,
    slotsAvailable: 1,
  },
  {
    id: 'sample:wells',
    issuer: 'Wells Fargo',
    finish: 'titanium',
    network: 'visa',
    pan: '',
    limit: '$30,000',
    age: '14 Years',
    slots: '2 of 5 seats',
    season: '45-day cycle · posts by the 24th',
    utilOptics: 'Long tenure with a comfortable mid-band balance.',
    reportsTo: 'EX · TU',
    badge: 'Preview',
    source: 'demo',
    live: false,
    priceCents: 89000,
    slotsAvailable: 2,
  },
  {
    id: 'sample:td',
    issuer: 'TD Bank',
    finish: 'sapphire',
    network: 'visa',
    pan: '',
    limit: '$25,000',
    age: '10 Years',
    slots: '4 of 5 seats',
    season: '60-day cycle · posts by the 7th',
    utilOptics: 'A reliable mid-tier limit for building revolving history.',
    reportsTo: 'EX · EQ · TU',
    badge: 'Preview',
    source: 'demo',
    live: false,
    priceCents: 85000,
    slotsAvailable: 4,
  },
  {
    id: 'sample:boa',
    issuer: 'Bank of America',
    finish: 'platinum',
    network: 'visa',
    pan: '',
    limit: '$22,500',
    age: '9 Years',
    slots: '5 of 5 seats',
    season: '60-day cycle · posts by the 13th',
    utilOptics: 'An entry-friendly limit for a thinner file that is already readable.',
    reportsTo: 'EX · EQ · TU',
    badge: 'Preview',
    source: 'demo',
    live: false,
    priceCents: 79000,
    slotsAvailable: 5,
  },
  {
    id: 'sample:navy',
    issuer: 'Navy Federal',
    finish: 'obsidian',
    network: 'mastercard',
    pan: '',
    limit: '$50,000',
    age: '9 Years',
    slots: '1 of 5 seats',
    season: '60-day cycle · posts by the 5th',
    utilOptics: 'Largest limit in this set. Membership rules still apply when a seat goes live.',
    reportsTo: 'EQ · TU',
    badge: 'Preview',
    source: 'demo',
    live: false,
    priceCents: 110000,
    slotsAvailable: 1,
  },
];

type SortKey = 'limit' | 'age' | 'price' | 'seats';
type SeatFilter = 'open' | 'all';
type BureauFilter = 'any' | 'EX' | 'EQ' | 'TU';

function limitValue(label: string): number {
  const n = Number(String(label).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function ageValue(label: string): number {
  const n = Number(String(label).replace(/[^0-9.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function priceLabel(listing: AuShowcaseListing): string {
  if (!listing.priceCents) return 'Quoted after fit';
  return formatPrice(listing.priceCents);
}

function seatsLit(listing: AuShowcaseListing | null): number {
  if (!listing) return 2;
  if (listing.slotsAvailable == null) return 2;
  return Math.max(0, Math.min(5, listing.slotsAvailable));
}

function finishTone(finish: AuCardFinish): string {
  return `tl-swatch--${finish}`;
}

function sortRows(rows: AuShowcaseListing[], sortKey: SortKey): AuShowcaseListing[] {
  const dir = -1;
  return [...rows].sort((a, b) => {
    if (sortKey === 'limit') return dir * (limitValue(a.limit) - limitValue(b.limit));
    if (sortKey === 'age') return dir * (ageValue(a.age) - ageValue(b.age));
    if (sortKey === 'price') return dir * ((a.priceCents ?? 0) - (b.priceCents ?? 0));
    return dir * ((a.slotsAvailable ?? 0) - (b.slotsAvailable ?? 0));
  });
}

export function AuListingShowcase({
  onReserve,
  onRequestFit,
  onRequestNeed,
  onSelectedSeats,
}: {
  onReserve: (listing: AuShowcaseListing) => void;
  onRequestFit: () => void;
  onRequestNeed: (listing?: AuShowcaseListing) => void;
  onSelectedSeats?: (open: number) => void;
}) {
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [liveRows, setLiveRows] = useState<AuShowcaseListing[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('limit');
  const [seatFilter, setSeatFilter] = useState<SeatFilter>('open');
  const [bureauFilter, setBureauFilter] = useState<BureauFilter>('any');

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
        const next = rows.map(mapApprovedListingToShowcase);
        setLiveRows(next);
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

  const live = liveRows.length > 0;
  const floor = live ? liveRows : SAMPLE_FLOOR;

  const filtered = useMemo(() => {
    const rows = floor.filter((row) => {
      if (seatFilter === 'open' && (row.slotsAvailable ?? 0) <= 0) return false;
      if (bureauFilter !== 'any' && !row.reportsTo.includes(bureauFilter)) return false;
      return true;
    });
    return sortRows(rows, sortKey);
  }, [bureauFilter, floor, seatFilter, sortKey]);

  const selected = useMemo(
    () => filtered.find((row) => row.id === selectedId) ?? filtered[0] ?? floor[0],
    [filtered, floor, selectedId],
  );

  useEffect(() => {
    if (loading || !filtered[0]) return;
    setSelectedId((id) => (filtered.some((row) => row.id === id) ? id : filtered[0].id));
  }, [filtered, loading]);

  useEffect(() => {
    onSelectedSeats?.(seatsLit(selected));
  }, [onSelectedSeats, selected]);

  const soldOut = Boolean(selected.live && selected.slotsAvailable === 0);
  const canReserve = Boolean(selected.live && !soldOut);

  return (
    <div className="tl-shop">
      <div className="tl-shop-toolbar">
        <div>
          <p className="tl-kicker">{live ? `${liveRows.length} on the floor` : 'Preview floor'}</p>
          <h2>Authorized user seats</h2>
          <p className="tl-lede">
            {live
              ? 'Pick a line. Limit, age, seats, bureaus, posting window, and price sit on the row. Reserve only when a seat is open.'
              : 'How seats read when they list — issuer, limit, age, open seats, bureaus, posting window, and price. Live reserve turns on when a seller puts a line on the floor.'}
          </p>
        </div>
        <div className="tl-filters" role="group" aria-label="Filter seats">
          <label>
            Seats
            <select value={seatFilter} onChange={(e) => setSeatFilter(e.target.value as SeatFilter)}>
              <option value="open">Open now</option>
              <option value="all">All listings</option>
            </select>
          </label>
          <label>
            Bureau
            <select value={bureauFilter} onChange={(e) => setBureauFilter(e.target.value as BureauFilter)}>
              <option value="any">Any</option>
              <option value="EX">Experian</option>
              <option value="EQ">Equifax</option>
              <option value="TU">TransUnion</option>
            </select>
          </label>
          <label>
            Sort
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
              <option value="limit">Highest limit</option>
              <option value="age">Longest age</option>
              <option value="price">Price</option>
              <option value="seats">Most seats</option>
            </select>
          </label>
        </div>
      </div>

      {loading ? (
        <div className="tl-shop-loading">
          <Loader2 size={18} className="tl-spin" aria-hidden />
          Checking open seats…
        </div>
      ) : (
        <>
          {selected ? (
            <article className="tl-stage" aria-live="polite">
              <div className="tl-stage-card">
                <AuMarketplaceCard
                  finish={selected.finish}
                  issuer={selected.issuer}
                  tier={defaultTierForFinish(selected.finish)}
                  limit={selected.limit}
                  age={selected.age.replace(/\s*Years?/i, ' yrs')}
                  slots={selected.slots.replace(/\s+open$/i, '')}
                  network={selected.network}
                  badge={selected.live ? selected.badge ?? 'Open seat' : 'Preview'}
                />
              </div>
              <div className="tl-stage-copy">
                <p className="tl-kicker">{selected.live ? selected.badge || 'Open seat' : 'Preview seat'}</p>
                <h3>{selected.issuer}</h3>
                <p className="tl-lede">{selected.utilOptics}</p>
                <ul className="tl-spec">
                  <li>
                    <span>Limit</span>
                    <strong>{selected.limit}</strong>
                  </li>
                  <li>
                    <span>Age</span>
                    <strong>{selected.age.replace(/\s*Years?/i, ' yrs')}</strong>
                  </li>
                  <li>
                    <span>Price</span>
                    <strong>{priceLabel(selected)}</strong>
                  </li>
                  <li>
                    <span>Seats</span>
                    <strong>{selected.slots}</strong>
                  </li>
                  <li>
                    <span>Reports</span>
                    <strong>{selected.reportsTo}</strong>
                  </li>
                </ul>
                <p className="tl-posting">{selected.season}</p>
                <div className="tl-actions">
                  {canReserve ? (
                    <button type="button" className="tl-btn-primary" onClick={() => onReserve(selected)}>
                      Reserve this seat <ArrowRight size={18} aria-hidden />
                    </button>
                  ) : (
                    <button type="button" className="tl-btn-primary" onClick={() => onRequestNeed(selected)}>
                      Ask for this profile <ArrowRight size={18} aria-hidden />
                    </button>
                  )}
                  <button type="button" className="tl-btn-secondary" onClick={onRequestFit}>
                    Book a fit session
                  </button>
                </div>
                {soldOut ? (
                  <p className="tl-note">This line has no open seats. Book a session and we will watch the next window.</p>
                ) : null}
                {!selected.live ? (
                  <p className="tl-note">Preview only. We match you when a seat like this lists.</p>
                ) : null}
              </div>
            </article>
          ) : null}

          <div className="tl-fit">
            <div>
              <p className="tl-kicker">A fit when</p>
              <ul>
                <li>The personal file is already readable</li>
                <li>You want age and available limit, not a new loan</li>
                <li>You can wait for the issuer to report</li>
              </ul>
            </div>
            <div>
              <p className="tl-kicker tl-kicker--rose">Not a fit when</p>
              <ul>
                <li>You need restore work first</li>
                <li>You need a guaranteed score move</li>
                <li>You cannot wait out a posting window</li>
              </ul>
            </div>
          </div>

          <ol className="tl-runway" aria-label="Tradeline seats">
            <li className="tl-runway-head" aria-hidden>
              <span />
              <span>Line</span>
              <span>Limit</span>
              <span>Age</span>
              <span>Seats</span>
              <span>Reports</span>
              <span>Posts</span>
              <span>Price</span>
            </li>
            {filtered.length === 0 ? (
              <li className="tl-nav-empty">
                Nothing matches. Clear a filter to see the floor again.
                <button
                  type="button"
                  className="tl-text-btn"
                  onClick={() => {
                    setSeatFilter('all');
                    setBureauFilter('any');
                  }}
                >
                  Clear filters
                </button>
              </li>
            ) : (
              filtered.map((row) => {
                const closed = (row.slotsAvailable ?? 0) <= 0;
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      className={`tl-runway-row${row.id === selected?.id ? ' is-on' : ''}${closed ? ' is-closed' : ''}`}
                      onClick={() => setSelectedId(row.id)}
                    >
                      <span className={`tl-metal ${finishTone(row.finish)}`} aria-hidden />
                      <span className="tl-runway-line">
                        <strong>{row.issuer}</strong>
                        <em>{row.live ? row.badge || 'Open' : 'Preview'}</em>
                      </span>
                      <span className="tl-runway-limit">{row.limit}</span>
                      <span>{row.age.replace(/\s*Years?/i, ' yrs')}</span>
                      <span>{row.slots}</span>
                      <span>{row.reportsTo}</span>
                      <span className="tl-runway-post">{row.season}</span>
                      <span className="tl-runway-price">{priceLabel(row)}</span>
                    </button>
                  </li>
                );
              })
            )}
          </ol>
        </>
      )}
    </div>
  );
}
