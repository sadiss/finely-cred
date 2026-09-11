import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { AuListingShowcase, type AuShowcaseListing } from '../../components/tradelines/AuListingShowcase';
import { auRequestSearchParams } from '../../lib/auMarketplaceInventory';
import { DigitalInviteShareBand } from '../../components/digitalCards';
import { captureDigitalInviteCardFromUrl } from '../../lib/digitalInviteCardAttribution';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { finelyCtaNavigate, resolveFinelyCtaPath } from '../../lib/finelyCtaIntent';
import { openPublicChat } from '../../lib/publicChatEvents';
import { useAuth } from '../../auth/AuthProvider';
import { ServicePackageDetailModal } from '../../components/pricing/ServicePackageDetailModal';
import { formatPrice, tradelinePromoPackages, type PricingPackage } from '../../config/pricingCatalog';
import { resolvePackageSelectPath } from '../../lib/packageCheckoutRouting';
import './tradelinesPublicPage.css';

type TradelinesNavView =
  | 'tradelines'
  | 'tradelines_primary'
  | 'tradelines_au'
  | 'checkout'
  | 'consultation'
  | 'pricing';

type Lane = 'au' | 'primary';

export interface TradelinesPublicPageProps {
  addToCart: (item: Record<string, unknown>) => void;
  onNavigate: (view: TradelinesNavView) => void;
  onFooterNavigate: (page: string) => void;
}

const HOW = [
  { n: '01', title: 'Pick a lane', body: 'An authorized-user seat adds age and limit when it reports. An installment is a plan you pay.' },
  { n: '02', title: 'Confirm fit', body: 'We check the file, the budget, and the posting window before anyone reserves a seat.' },
  { n: '03', title: 'Let it post', body: 'Seats and installments report on the issuer’s calendar. Results vary.' },
] as const;

const AFTER = [
  { n: '01', title: 'Reserve or ask', body: 'Hold a live seat, or tell us the limit and age you need.' },
  { n: '02', title: 'Fit check', body: 'Intake confirms identity, the file, and that you can wait out the window.' },
  { n: '03', title: 'Seat assigned', body: 'A live line is matched. Preview seats stay preview until a seller lists.' },
  { n: '04', title: 'Issuer posts', body: 'The bank reports on its cycle — often 45 to 60 days, not overnight.' },
  { n: '05', title: 'We watch', body: 'We track the window. Nothing here is a promised score move.' },
] as const;

const BUREAUS = [
  { id: 'EX', name: 'Experian', body: 'Many revolving seats post here. A line that skips Experian will not thicken that file.' },
  { id: 'EQ', name: 'Equifax', body: 'Revolving seats can post here. The in-house installment, when eligible, reports to Equifax only.' },
  { id: 'TU', name: 'TransUnion', body: 'Some issuers report here, some do not. Read the seat row before you reserve.' },
] as const;

const FAQ = [
  {
    q: 'Will a tradeline fix everything?',
    a: 'No. A tradeline is one lever. An authorized-user seat can add age and available limit when it reports. It does not replace restore work, and it does not clean a damaged file.',
  },
  {
    q: 'Are seats on this page live?',
    a: 'When a seller lists a seat, you can reserve it here. Until then the floor shows preview lines so you can see limit, age, seats, bureaus, and price. Preview seats are not sold as live inventory.',
  },
  {
    q: 'When does a seat post?',
    a: 'On the issuer’s calendar — often a 45- or 60-day cycle. The row names the posting window. We do not control the bank’s report date.',
  },
  {
    q: 'Which bureaus see the line?',
    a: 'Only the bureaus on that seat. Some lines hit all three. Some hit one or two. The installment lane, when eligible, reports to Equifax only.',
  },
  {
    q: 'What about adding a teen?',
    a: 'Issuer ages and whether a minor reports vary. Some never report a person under 18. Read the parent sheet before you add a teen to a line.',
  },
  {
    q: 'Do you guarantee a score move?',
    a: 'No. Results vary. Posting dates change. Funding is subject to underwriting. A seat is not a shortcut around a file that still needs restore work.',
  },
  {
    q: 'What happens after I reserve?',
    a: 'Guests review checkout, then open intake. Signed-in partners go straight to intake. We match identity, confirm fit, and watch the posting window. Payment instructions come after review.',
  },
] as const;

const EXITS = [
  { href: '/pricing/personal-credit-restore', label: 'Personal restore', body: 'Clean the file first when the report still needs work.' },
  { href: '/pricing/personal-credit-building', label: 'Credit building', body: 'Utilization and maintenance after the file is readable.' },
  { href: '/free-tradeline-guide', label: 'Free tradeline guide', body: 'How seats post, age, and fit a file — without the hype.' },
  { href: '/resources/au-teen-credit-sheet', label: 'Parent sheet', body: 'What to read before a teen is added to a line.' },
  { href: '/au-sellers', label: 'List a seat', body: 'Sellers put aged lines on the floor. Buyers reserve from here.' },
] as const;

const PACK_ACCENT = ['violet', 'sky', 'rose'] as const;

function packTitle(pkg: PricingPackage): string {
  return pkg.name.replace(/^Tradeline\s+/i, '');
}

function packSeats(pkg: PricingPackage): number {
  if (pkg.id === 'tradeline_max') return 3;
  if (pkg.id === 'tradeline_boost') return 2;
  return 1;
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export default function TradelinesPublicPage({ addToCart, onNavigate }: TradelinesPublicPageProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const auth = useAuth();
  const [miniCartPulse, setMiniCartPulse] = useState(0);
  const [railSeats, setRailSeats] = useState(2);
  const [detailPkg, setDetailPkg] = useState<PricingPackage | null>(null);
  const focus = new URLSearchParams(location.search).get('focus');
  const [lane, setLane] = useState<Lane>(focus === 'primary' ? 'primary' : 'au');

  const publicPacks = useMemo(
    () => tradelinePromoPackages.filter((pkg) => pkg.isPublic && pkg.id.startsWith('tradeline_')),
    [],
  );

  usePublicSeoMeta({
    title: 'Tradelines | Finely Cred',
    description:
      'Authorized-user seats and Equifax installment tradelines. Check open seats, pick a package, or book a fit session before you reserve.',
    path: '/tradelines',
    faqs: FAQ.map((item) => ({ q: item.q, a: item.a })),
  });

  useEffect(() => {
    captureDigitalInviteCardFromUrl(location.search, location.pathname);
  }, [location.pathname, location.search]);

  useEffect(() => {
    setLane(focus === 'primary' ? 'primary' : 'au');
  }, [focus]);

  const chooseLane = (next: Lane) => {
    setLane(next);
    const params = new URLSearchParams(location.search);
    params.set('focus', next);
    navigate({ pathname: '/tradelines', search: params.toString() }, { replace: true });
    window.requestAnimationFrame(() => scrollToId(next === 'primary' ? 'tradelines-primary' : 'tradelines-au'));
  };

  const bookFit = () => {
    finelyCtaNavigate(navigate, 'consultation', { consultationLane: 'Tradelines' });
  };

  const checkoutPack = (pkg: PricingPackage) => {
    navigate(
      resolvePackageSelectPath({
        packageId: pkg.id,
        rail: pkg.rail === 'in_house' ? 'in_house' : pkg.rail === 'stripe' ? 'stripe' : undefined,
        isAuthed: Boolean(auth.user),
      }),
    );
  };

  const onReserve = (listing: AuShowcaseListing) => {
    if (!listing.live) return;
    addToCart({
      id:
        listing.source === 'seller' && listing.sellerId && listing.listingId
          ? `seller:${listing.sellerId}:${listing.listingId}`
          : `au-interest:${listing.id}`,
      bank: listing.issuer,
      limit: listing.limit,
      age: listing.age,
      priceCents: listing.priceCents,
      basePriceCents: listing.priceCents,
      date: listing.season,
      kind: 'au_tradeline',
      label: `${listing.issuer} AU · reserve seat`,
      source: listing.source,
      sellerId: listing.sellerId,
      listingId: listing.listingId,
      slotsAvailable: listing.slotsAvailable,
    });
    setMiniCartPulse((v) => v + 1);
    if (auth.user) {
      navigate(`/au/request?${auRequestSearchParams(listing).toString()}`);
      return;
    }
    onNavigate('checkout');
  };

  const askForASeat = (listing?: AuShowcaseListing) => {
    const profile = listing ? `${listing.issuer}, ${listing.limit}, ${listing.age}. ` : '';
    openPublicChat({
      goal: 'tradelines',
      initialDraft: `I am looking for an authorized-user seat. ${profile}Age and limit I need: `,
    });
  };

  const onSelectedSeats = useCallback((open: number) => {
    setRailSeats(open);
  }, []);

  return (
    <PageShell hideHero surface="ivory" contentWidth="full" title="Tradelines">
      <div className="tl-page" data-fc-tradelines="1">
        <div className="tl-inner">
          <header className="tl-hero">
            <p className="tl-kicker">Tradelines</p>
            <h1>Open seats. Then the file.</h1>
            <p className="tl-lede">
              An authorized-user seat can add age and available limit when the issuer reports. An installment is a plan
              you pay — Equifax only, when eligible. Both need a fit check. Neither is a shortcut around underwriting.
            </p>

            <div className="tl-seat-rail" aria-hidden>
              {Array.from({ length: 5 }, (_, i) => (
                <i key={i} className={i < railSeats ? 'is-on' : undefined} />
              ))}
            </div>

            <div className="tl-hero-actions">
              <button type="button" className="tl-btn-primary" onClick={() => chooseLane('au')}>
                See open seats <ArrowRight size={18} aria-hidden />
              </button>
              <button type="button" className="tl-btn-secondary" onClick={() => scrollToId('tradelines-packages')}>
                See packages
              </button>
              <button type="button" className="tl-btn-secondary" onClick={bookFit}>
                Book a session
              </button>
              <button type="button" className="tl-btn-ghost" onClick={() => navigate('/free-tradeline-guide')}>
                Start free guide
              </button>
            </div>

            <div className="tl-chooser" role="tablist" aria-label="Tradeline lane">
              <button
                type="button"
                role="tab"
                aria-selected={lane === 'au'}
                className={lane === 'au' ? 'is-on' : undefined}
                onClick={() => chooseLane('au')}
              >
                Authorized user
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={lane === 'primary'}
                className={lane === 'primary' ? 'is-on' : undefined}
                onClick={() => chooseLane('primary')}
              >
                Installment
              </button>
            </div>
          </header>

          <ol className="tl-how">
            {HOW.map((step) => (
              <li key={step.n}>
                <em>{step.n}</em>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </li>
            ))}
          </ol>

          {lane === 'au' ? (
            <section id="tradelines-au" className="tl-room">
              <AuListingShowcase
                onReserve={onReserve}
                onRequestFit={bookFit}
                onRequestNeed={askForASeat}
                onSelectedSeats={onSelectedSeats}
              />
            </section>
          ) : (
            <section id="tradelines-primary" className="tl-room tl-installment">
              <p className="tl-kicker">Installment</p>
              <h2>Pay a plan. Equifax can report it.</h2>
              <p className="tl-lede">
                When eligible, in-house financing can report to Equifax as a positive installment. Terms live in the
                contract. This is not a debt swap, and it does not report to Experian or TransUnion. Starter, Boost, and
                Max packages include this lane.
              </p>

              <div className="tl-coupon" aria-hidden>
                <span>Equifax</span>
                <strong>Installment on file</strong>
                <ol>
                  {Array.from({ length: 12 }, (_, i) => (
                    <li key={i} className={i < 4 ? 'is-on' : undefined} />
                  ))}
                </ol>
                <p>Twelve payments. Four shown as posted.</p>
              </div>

              <div className="tl-fit">
                <div>
                  <p className="tl-kicker">A fit when</p>
                  <ul>
                    <li>You want an installment that can report to Equifax</li>
                    <li>The payment fits the month without crowding other lines</li>
                    <li>A strategy session has already named the sequence</li>
                  </ul>
                </div>
                <div>
                  <p className="tl-kicker tl-kicker--rose">Not a fit when</p>
                  <ul>
                    <li>You need all three bureaus to see the line</li>
                    <li>You cannot carry a structured payment</li>
                    <li>The personal file still needs restore work first</li>
                  </ul>
                </div>
              </div>

              <div className="tl-actions">
                <button type="button" className="tl-btn-primary" onClick={bookFit}>
                  Book a fit session <ArrowRight size={16} aria-hidden />
                </button>
                <button type="button" className="tl-btn-secondary" onClick={() => scrollToId('tradelines-packages')}>
                  See packages
                </button>
                <button type="button" className="tl-btn-ghost" onClick={() => navigate('/pricing/personal-credit-building')}>
                  See building programs
                </button>
              </div>
            </section>
          )}

          <section id="tradelines-fit" className="tl-section">
            <p className="tl-kicker">File gate</p>
            <h2>Is the personal file ready?</h2>
            <p className="tl-lede">
              A seat helps a file that is already readable. If collections or identity damage still lead the report, restore
              first. If you are not sure, ask — do not reserve blindly.
            </p>
            <div className="tl-gate">
              <button type="button" data-fc-accent="emerald" onClick={() => chooseLane('au')}>
                <span>Ready</span>
                <strong>The file is readable</strong>
                <em>See open seats and pick a profile.</em>
              </button>
              <button type="button" data-fc-accent="violet" onClick={() => navigate('/pricing/personal-credit-restore')}>
                <span>Not yet</span>
                <strong>I still need restore</strong>
                <em>Clean the file before you add a seat.</em>
              </button>
              <button type="button" data-fc-accent="rose" onClick={() => askForASeat()}>
                <span>Unsure</span>
                <strong>I need a read</strong>
                <em>Tell us what is on the report. We will name the lane.</em>
              </button>
            </div>
          </section>

          <section id="tradelines-window" className="tl-section">
            <p className="tl-kicker tl-kicker--violet">Posting window</p>
            <h2>The bank’s calendar, not ours.</h2>
            <p className="tl-lede">
              Most revolving seats run a 45- or 60-day cycle. The selected row names the post date. We watch that window
              after a seat is assigned.
            </p>
            <div className="tl-window" aria-hidden>
              <ol>
                {Array.from({ length: 8 }, (_, i) => (
                  <li key={i} className={i === 0 || i === 7 ? 'is-mark' : i < 3 ? 'is-on' : undefined}>
                    <span>{i === 0 ? 'Reserve' : i === 7 ? 'Posts' : `W${i}`}</span>
                  </li>
                ))}
              </ol>
              <p>Week 0 is reserve. The last mark is the issuer report — results vary.</p>
            </div>
          </section>

          <section id="tradelines-bureaus" className="tl-section">
            <p className="tl-kicker">Bureaus</p>
            <h2>A seat only hits the files it reports to.</h2>
            <div className="tl-bureaus">
              {BUREAUS.map((bureau) => (
                <article key={bureau.id}>
                  <em>{bureau.id}</em>
                  <strong>{bureau.name}</strong>
                  <p>{bureau.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section id="tradelines-packages" className="tl-section">
            <p className="tl-kicker tl-kicker--rose">Packages</p>
            <h2>Seats plus the Equifax installment.</h2>
            <p className="tl-lede">
              Pick a package when you want a sequenced set — authorized-user seats and, when eligible, the Equifax
              installment. Live floor seats can still be reserved one at a time.
            </p>
            <div className="tl-packs">
              {publicPacks.map((pkg, index) => {
                const seats = packSeats(pkg);
                return (
                  <article key={pkg.id} data-fc-accent={PACK_ACCENT[index] ?? 'violet'}>
                    <p className="tl-kicker">{pkg.badge || 'Package'}</p>
                    <div className="tl-pack-seats" aria-hidden>
                      {Array.from({ length: 3 }, (_, i) => (
                        <i key={i} className={i < seats ? 'is-on' : undefined} />
                      ))}
                    </div>
                    <h3>{packTitle(pkg)}</h3>
                    <p className="tl-pack-price">{formatPrice(pkg.priceAmount)}</p>
                    <p>{pkg.tagline}</p>
                    <ul>
                      {(pkg.highlights ?? []).slice(0, 4).map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <div className="tl-actions">
                      <button type="button" className="tl-btn-primary" onClick={() => checkoutPack(pkg)}>
                        Select {packTitle(pkg)}
                      </button>
                      <button type="button" className="tl-btn-secondary" onClick={() => setDetailPkg(pkg)}>
                        What’s included
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section id="tradelines-after" className="tl-section">
            <p className="tl-kicker">After you reserve</p>
            <h2>Checkout, then intake, then the window.</h2>
            <ol className="tl-path">
              {AFTER.map((step) => (
                <li key={step.n}>
                  <em>{step.n}</em>
                  <strong>{step.title}</strong>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
            <div className="tl-actions">
              <button type="button" className="tl-btn-secondary" onClick={() => onNavigate('checkout')}>
                Review checkout
              </button>
              {auth.user ? (
                <button type="button" className="tl-btn-ghost" onClick={() => navigate('/au/request')}>
                  Open intake
                </button>
              ) : (
                <button
                  type="button"
                  className="tl-btn-ghost"
                  onClick={() => navigate(resolveFinelyCtaPath('au_buyer_intake', { next: '/au/request' }))}
                >
                  Sign in to continue
                </button>
              )}
            </div>
          </section>

          <section id="tradelines-teen" className="tl-section">
            <p className="tl-kicker tl-kicker--violet">Teens</p>
            <h2>Adding a teen is a separate read.</h2>
            <p className="tl-lede">
              Issuer ages and whether a minor reports vary. Some never report a person under 18. Do not add a teen to a
              seat until you have read the parent sheet.
            </p>
            <div className="tl-actions">
              <button type="button" className="tl-btn-secondary" onClick={() => navigate('/resources/au-teen-credit-sheet')}>
                Open the parent sheet
              </button>
            </div>
          </section>

          <section id="tradelines-invite" className="tl-section">
            <p className="tl-kicker">Invite</p>
            <h2>Send a seat invite.</h2>
            <DigitalInviteShareBand
              role="tradelines"
              surface="ivory"
              heading="Share a seat invite"
              blurb="Send a card. They open intake, and we match them to open seats when a line is on the floor."
            />
          </section>

          <section id="tradelines-faq" className="tl-section">
            <p className="tl-kicker">Questions</p>
            <h2>What partners ask before they reserve.</h2>
            <div className="tl-faq">
              {FAQ.map((item) => (
                <details key={item.q}>
                  <summary>{item.q}</summary>
                  <p>{item.a}</p>
                </details>
              ))}
            </div>
          </section>

          <section id="tradelines-exits" className="tl-section">
            <p className="tl-kicker tl-kicker--rose">Next rooms</p>
            <h2>Tradelines sit next to restore and building.</h2>
            <div className="tl-exits">
              {EXITS.map((item) => (
                <button key={item.href} type="button" onClick={() => navigate(item.href)}>
                  <strong>{item.label}</strong>
                  <span>{item.body}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="tl-close">
            <p className="tl-kicker">Ready</p>
            <h2>Pick a seat, or book the fit first.</h2>
            <div className="tl-actions">
              <button type="button" className="tl-btn-primary" onClick={() => chooseLane('au')}>
                See open seats <ArrowRight size={18} aria-hidden />
              </button>
              <button type="button" className="tl-btn-secondary" onClick={bookFit}>
                Book a fit session
              </button>
            </div>
          </section>
        </div>

        {miniCartPulse > 0 ? (
          <div className="tl-mini-cart" key={miniCartPulse}>
            <button type="button" onClick={() => onNavigate('checkout')}>
              <span className="tl-kicker">Seat reserved</span>
              <strong>Review checkout</strong>
            </button>
          </div>
        ) : null}

        <p className="tl-compliance">
          Results vary · not legal advice · seats and posting dates change · funding subject to underwriting
        </p>
      </div>

      <ServicePackageDetailModal
        pkg={detailPkg}
        onClose={() => setDetailPkg(null)}
        onSelect={(packageId) => {
          const pkg = publicPacks.find((item) => item.id === packageId) ?? null;
          setDetailPkg(null);
          if (pkg) checkoutPack(pkg);
        }}
        selectLabel="Select package"
      />
    </PageShell>
  );
}
