import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  CreditCard,
  ExternalLink,
  Hammer,
  Info,
  Landmark,
  Laptop,
  Package,
  ShoppingBag,
  Store,
  Truck,
  Wrench,
  type LucideIcon,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { finelyCtaNavigate } from '../../lib/finelyCtaIntent';
import { resolvePackageSelectPath } from '../../lib/packageCheckoutRouting';
import {
  businessCreditPackages,
  formatBusinessCapitalOutlook,
  formatPrice,
  type PricingPackage,
} from '../../config/pricingCatalog';
import { BusinessCreditIncludesModal } from './BusinessCreditIncludesModal';
import { CreditCardAsset } from '../../components/landing';
import { usePreviewReveal } from '../../features/personalCredit/preview/usePreviewReveal';
import './businessCreditPreview.css';

const LIVE_PATH = '/pricing/business-credit';

const BEATS = [
  {
    key: 'hygiene',
    label: 'Entity hygiene',
    stage: '01 · File identity',
    title: 'Make the company look real on paper.',
    body: 'Lenders and vendors read the EIN file before they read your pitch. A matching address, working domain, and commercial bureau profile tell them this is a company — not a consumer trying to borrow under a DBA.',
    points: [
      'EIN, address, phone, and domain lined up',
      'PAYDEX, Intelliscore, Equifax Business, FICO SBSS, Creditsafe — not only D-U-N-S',
      'A fundability scorecard you can actually work from',
    ],
  },
  {
    key: 'vendors',
    label: 'Reporting vendors',
    stage: '02 · First trades',
    title: 'Open vendors that report to the business bureaus.',
    body: 'Business credit is not a personal score with a new name. Net-30 and store accounts that report are how an empty EIN file starts to show payment history. That history is what later products underwrite.',
    points: [
      'Starter net-30 path that reports',
      'Pay-in-full habits that keep the file clean',
      'Monitoring so a missed report does not sit unnoticed',
    ],
  },
  {
    key: 'depth',
    label: 'Trade depth',
    stage: '03 · Thickness',
    title: 'Add depth so the file can carry larger asks.',
    body: 'One vendor is a start. A sequenced ladder is what separates a new file from a fundable one. Builder and Elite exist because depth, time-in-file, and clean utilization take specialist cycles — not a PDF checklist.',
    points: [
      'Tier 1–4 vendor sequencing',
      'Trade strategy and a monitoring cadence',
      'Funding-readiness documents when the file is ready',
    ],
  },
  {
    key: 'named',
    label: 'Named products',
    stage: '04 · Capital asks',
    title: 'Then ask for the products that price the entity.',
    body: 'Named cards and commercial products underwrite the company file. They often price vendor trades and bureau depth instead of a personal tax package. The file has to exist and report first.',
    points: [
      'Named card and lender product ladders',
      'Packaging that matches how commercial desks read a file',
      'Vendor trades that give the EIN file something to show',
    ],
  },
] as const;

const PACKAGE_FIT: Record<string, string> = {
  business_foundation: 'A new entity that needs hygiene and the first reporting vendors before any capital ask.',
  business_builder: 'Most partners start here — the full vendor ladder and a funding-ready file, not a checklist alone.',
  business_elite: 'Operators targeting named cards and lender products with a dedicated strategist cadence.',
  business_empire: 'Multi-entity or aggressive capital goals that need an executive weekly cadence.',
};

const PACKAGE_ACCENT: Record<string, 'violet' | 'sky' | 'rose' | 'emerald'> = {
  business_foundation: 'sky',
  business_builder: 'violet',
  business_elite: 'rose',
  business_empire: 'emerald',
};

const FAQ = [
  {
    q: 'How do commercial products underwrite the company?',
    a: 'Many commercial products price and fund from the company’s EIN file — vendor trades, bureau depth, and time-in-file — instead of a personal tax package the way a home mortgage often does. We sequence the file first so those desks have something to read.',
  },
  {
    q: 'Why is business credit different from personal credit?',
    a: 'Personal credit is the file attached to a Social Security number. Business credit is the file attached to an EIN. When you keep those files separate and the company file looks real, you can ask for capital as a company. That is the job of this lane.',
  },
  {
    q: 'What do I actually pay besides the program fee?',
    a: 'Most files also need vendor and trade outlay — deposits, starter accounts, and pay-in-full habits. Each package shows an estimated outlay range next to the fee and the potential business-credit capital range.',
  },
  {
    q: 'Which package should I start with?',
    a: 'Foundation is for a clean new entity. Builder is the most common start when you want the full ladder. Elite and Empire add named-product strategy and executive cadence. If the file is unusual, request a capital quote and we will match the work — not upsell a sticker.',
  },
];

const BUREAUS = [
  {
    name: 'Dun & Bradstreet',
    score: 'PAYDEX 0–100',
    job: 'Payment timing',
    accent: 'emerald' as const,
    href: 'https://www.dnb.com/',
  },
  {
    name: 'Experian Business',
    score: 'Intelliscore Plus',
    job: 'Bank/lender file',
    accent: 'sky' as const,
    href: 'https://www.experian.com/small-business',
  },
  {
    name: 'Equifax Business',
    score: 'Commercial risk',
    job: 'Credit risk score',
    accent: 'violet' as const,
    href: 'https://www.equifax.com/business/',
  },
  {
    name: 'FICO SBSS',
    score: 'Small-business underwriting',
    job: 'Lender score',
    accent: 'rose' as const,
    href: 'https://www.fico.com/en/products/fico-small-business-scoring-service',
  },
  {
    name: 'Creditsafe',
    score: 'International / trade',
    job: 'Trade desks',
    accent: 'emerald' as const,
    href: 'https://www.creditsafe.com/',
  },
  {
    name: 'Ansonia Credit',
    score: 'Trade credit',
    job: 'Supplier file',
    accent: 'sky' as const,
    href: 'https://www.ansoniacreditdata.com/',
  },
] as const;

const PAYDEX_ARC_START = -135;
const PAYDEX_ARC_SWEEP = 270;

function paydexArcPoint(cx: number, cy: number, r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) };
}

const ENTITY_TYPES = ['LLC', 'Corporation', 'Partnership', 'Sole proprietor'] as const;
const YEAR_OPTIONS = ['Not yet', 'Under 1 year', '1–2 years', '3+ years'] as const;
const YES_NO = ['Yes', 'No'] as const;
const VENDOR_COUNTS = ['None yet', '1–2', '3–5', '6+'] as const;
const PAYMENT_DEPTH = ['None yet', '1–3', '4–8', '9+'] as const;
const DEPOSIT_BANDS = ['Under $5k', '$5–25k', '$25k+', 'Not sure'] as const;

type EntityType = (typeof ENTITY_TYPES)[number] | '';
type YearsInFile = (typeof YEAR_OPTIONS)[number] | '';
type YesNo = (typeof YES_NO)[number] | '';
type VendorCount = (typeof VENDOR_COUNTS)[number] | '';
type PaymentDepth = (typeof PAYMENT_DEPTH)[number] | '';
type DepositBand = (typeof DEPOSIT_BANDS)[number] | '';
type DeskTicket = 'Foundation' | 'Builder' | 'Elite / named-product desk';

type SheetFields = {
  legalName: string;
  ein: string;
  entityType: EntityType;
  years: YearsInFile;
  addressMatch: YesNo;
  domainLive: YesNo;
  bankInName: YesNo;
  duns: YesNo;
  phoneListed: YesNo;
  vendorsReporting: VendorCount;
  reportedPayments: PaymentDepth;
  monthlyDeposits: DepositBand;
};

const VENDOR_LADDER = [
  {
    tier: 1,
    ordinal: '1st',
    title: 'First trades',
    job: 'Starter net-30 accounts worth researching — we do not charge an extra fee to find them.',
    accent: 'sky' as const,
    vendors: [
      { name: 'Quill', note: 'Office net-30', href: 'https://www.quill.com', host: 'quill.com' },
      { name: 'Uline', note: 'Shipping supplies', href: 'https://www.uline.com', host: 'uline.com' },
      { name: 'Grainger', note: 'Industrial trade', href: 'https://www.grainger.com', host: 'grainger.com' },
    ],
  },
  {
    tier: 2,
    ordinal: '2nd',
    title: 'Trade depth',
    job: 'Thicken the file after the first reports land.',
    accent: 'violet' as const,
    vendors: [
      { name: 'Amazon Business', note: 'Retail trade', href: 'https://www.amazon.com/business', host: 'amazon.com' },
      { name: 'Home Depot Pro', note: 'Pro account', href: 'https://www.homedepot.com/c/pro_xtra', host: 'homedepot.com' },
      { name: 'Apple Business', note: 'Equipment desk', href: 'https://www.apple.com/business/', host: 'apple.com' },
    ],
  },
  {
    tier: 3,
    ordinal: '3rd',
    title: 'Store & fleet',
    job: 'Named store, fleet, and card desks once the file can carry them.',
    accent: 'rose' as const,
    vendors: [
      { name: "Lowe's For Pros", note: 'Pro store', href: 'https://www.lowes.com/l/pro/forpros', host: 'lowes.com' },
      { name: 'Staples Business', note: 'Office card', href: 'https://www.staples.com', host: 'staples.com' },
      { name: 'FedEx', note: 'Shipping account', href: 'https://www.fedex.com', host: 'fedex.com' },
    ],
  },
  {
    tier: 4,
    ordinal: '4th',
    title: 'Capital asks',
    job: 'Named products when the file can carry a larger ask.',
    accent: 'emerald' as const,
    vendors: [
      { name: 'SBA pathways', note: 'Public programs', href: 'https://www.sba.gov', host: 'sba.gov' },
      { name: 'Dell Business', note: 'Equipment line', href: 'https://www.dell.com/en-us/work/', host: 'dell.com' },
      { name: 'Amex Business', note: 'Named card', href: 'https://www.americanexpress.com/us/credit-cards/business/', host: 'americanexpress.com' },
    ],
  },
] as const;

const VENDOR_ROW_ICON: Record<string, LucideIcon> = {
  Quill: Package,
  Uline: Truck,
  Grainger: Wrench,
  'Amazon Business': ShoppingBag,
  'Home Depot Pro': Hammer,
  'Apple Business': Laptop,
  "Lowe's For Pros": Store,
  'Staples Business': CreditCard,
  FedEx: Package,
  'SBA pathways': Landmark,
  'Dell Business': Laptop,
  'Amex Business': CreditCard,
};

type SheetReading = {
  score: number;
  ticket: DeskTicket;
  nextStep: string;
};

const EMPTY_SHEET: SheetFields = {
  legalName: '',
  ein: '',
  entityType: '',
  years: '',
  addressMatch: '',
  domainLive: '',
  bankInName: '',
  duns: '',
  phoneListed: '',
  vendorsReporting: '',
  reportedPayments: '',
  monthlyDeposits: '',
};

function Reveal({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const { ref, className: visibleClass } = usePreviewReveal<HTMLDivElement>();
  return (
    <div ref={ref} className={className} data-reveal={visibleClass}>
      {children}
    </div>
  );
}

function priceLabel(pkg: PricingPackage): string {
  if (pkg.isCustomQuote) return 'Custom quote';
  return formatPrice(pkg.priceAmount);
}

function einLooksReady(value: string): boolean {
  const compact = value.replace(/[\s-]/g, '');
  if (!/^\d{9}$/.test(compact)) return false;
  const trimmed = value.trim();
  return /^\d{2}-\d{7}$/.test(trimmed) || /^\d{9}$/.test(compact);
}

function readEntityFile(fields: SheetFields): SheetReading {
  let score = 0;
  if (einLooksReady(fields.ein)) score += 12;
  if (fields.entityType === 'LLC' || fields.entityType === 'Corporation') score += 10;
  if (fields.years === '1–2 years') score += 8;
  if (fields.years === '3+ years') score += 12;
  if (fields.addressMatch === 'Yes') score += 10;
  if (fields.domainLive === 'Yes') score += 10;
  if (fields.bankInName === 'Yes') score += 10;
  if (fields.duns === 'Yes') score += 10;
  if (fields.phoneListed === 'Yes') score += 8;
  if (fields.vendorsReporting === '1–2') score += 8;
  if (fields.vendorsReporting === '3–5') score += 12;
  if (fields.vendorsReporting === '6+') score += 14;
  if (fields.reportedPayments === '1–3') score += 8;
  if (fields.reportedPayments === '4–8') score += 12;
  if (fields.reportedPayments === '9+') score += 16;
  if (fields.monthlyDeposits === '$5–25k') score += 8;
  if (fields.monthlyDeposits === '$25k+') score += 12;
  if (fields.monthlyDeposits === 'Not sure') score += 2;
  score = Math.max(0, Math.min(100, score));

  if (score < 40) {
    return {
      score,
      ticket: 'Foundation',
      nextStep:
        'The file is still thin. Start with Foundation so the EIN, address, and first reporting vendors exist before any capital ask.',
    };
  }
  if (score < 70) {
    return {
      score,
      ticket: 'Builder',
      nextStep:
        'The entity looks real enough to sequence trades. Builder is the usual next step — the full vendor ladder and a funding-ready file.',
    };
  }
  return {
    score,
    ticket: 'Elite / named-product desk',
    nextStep:
      'The facts you entered point to a named-product desk. Elite or Empire packages the ask once the commercial files can carry it.',
  };
}

function PaydexRing() {
  const { ref, visible } = usePreviewReveal<HTMLDivElement>();
  const [score, setScore] = useState(0);
  const [live, setLive] = useState(false);
  const frameRef = useRef<number | null>(null);
  const liveRef = useRef(false);
  const scoreRef = useRef(0);
  const cx = 80;
  const cy = 86;
  const radius = 58;
  const ticks = 11;
  const fraction = score / 100;
  const arcLength = radius * ((PAYDEX_ARC_SWEEP * Math.PI) / 180);
  const dashOffset = arcLength * (1 - fraction);
  const trackStart = paydexArcPoint(cx, cy, radius, PAYDEX_ARC_START);
  const trackEnd = paydexArcPoint(cx, cy, radius, PAYDEX_ARC_START + PAYDEX_ARC_SWEEP);
  const trackPath = `M ${trackStart.x} ${trackStart.y} A ${radius} ${radius} 0 1 1 ${trackEnd.x} ${trackEnd.y}`;
  const head = paydexArcPoint(cx, cy, radius, PAYDEX_ARC_START + PAYDEX_ARC_SWEEP * fraction);

  useEffect(() => {
    liveRef.current = live;
  }, [live]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
    if (!visible) return;
    if (reduced) {
      setScore(80);
      return;
    }

    if (frameRef.current != null) cancelAnimationFrame(frameRef.current);

    if (live) {
      const started = performance.now();
      const tick = (now: number) => {
        const wave = (Math.sin(((now - started) / 1000) * 1.85) + 1) / 2;
        setScore(Math.round(32 + wave * 56));
        frameRef.current = requestAnimationFrame(tick);
      };
      frameRef.current = requestAnimationFrame(tick);
      return () => {
        if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
      };
    }

    const from = scoreRef.current;
    const started = performance.now();
    const duration = from === 0 ? 1400 : 520;
    const target = 80;
    const tick = (now: number) => {
      if (liveRef.current) return;
      const t = Math.min(1, (now - started) / duration);
      const eased = 1 - (1 - t) ** 3;
      setScore(Math.round(from + (target - from) * eased));
      if (t < 1) frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current != null) cancelAnimationFrame(frameRef.current);
    };
  }, [visible, live]);

  return (
    <div
      ref={ref}
      className={`bc-paydex${visible ? ' is-on' : ''}${live ? ' is-live' : ''}`}
      aria-label="PAYDEX target 80. Hover or tap to watch the score move."
      tabIndex={0}
      onPointerEnter={(event) => {
        if (event.pointerType === 'mouse') setLive(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === 'mouse') setLive(false);
      }}
      onFocus={() => setLive(true)}
      onBlur={() => setLive(false)}
      onPointerDown={(event) => {
        if (event.pointerType !== 'mouse') {
          event.preventDefault();
          setLive((on) => !on);
        }
      }}
    >
      <svg className="bc-paydex__svg" viewBox="0 0 160 160" role="img" aria-hidden="true">
        <defs>
          <linearGradient id="bc-paydex-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="48%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <filter id="bc-paydex-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <g className="bc-paydex__ticks">
          {Array.from({ length: ticks }).map((_, index) => {
            const deg = PAYDEX_ARC_START + (PAYDEX_ARC_SWEEP * index) / (ticks - 1);
            const inner = paydexArcPoint(cx, cy, radius - 10, deg);
            const outer = paydexArcPoint(cx, cy, radius - 2, deg);
            return (
              <line
                key={deg}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                strokeWidth={index === 0 || index === ticks - 1 || index === 8 ? 1.8 : 1}
              />
            );
          })}
        </g>
        <path className="bc-paydex__track" d={trackPath} fill="none" />
        <path
          className="bc-paydex__arc"
          d={trackPath}
          fill="none"
          stroke="url(#bc-paydex-grad)"
          strokeDasharray={arcLength}
          strokeDashoffset={dashOffset}
          filter="url(#bc-paydex-glow)"
        />
        <circle className="bc-paydex__head" cx={head.x} cy={head.y} r={6} />
      </svg>
      <div className="bc-paydex__readout">
        <strong>{score}</strong>
        <span>PAYDEX</span>
      </div>
    </div>
  );
}

function VendorMark({ name, host }: { name: string; host: string }) {
  const [step, setStep] = useState(0);
  if (step >= 2) {
    return (
      <span className="bc-vendor-mark" aria-hidden>
        {name.slice(0, 1)}
      </span>
    );
  }
  const src =
    step === 0
      ? `https://logo.clearbit.com/${host}`
      : `https://www.google.com/s2/favicons?sz=256&domain=${host}`;
  return (
    <img
      className="bc-vendor-mark-img"
      src={src}
      alt=""
      width={72}
      height={72}
      loading="lazy"
      onError={() => setStep((current) => current + 1)}
    />
  );
}

function EntitySheet({
  onSeePackages,
  onBookSession,
}: {
  onSeePackages: () => void;
  onBookSession: () => void;
}) {
  const [fields, setFields] = useState<SheetFields>(EMPTY_SHEET);
  const [reading, setReading] = useState<SheetReading | null>(null);

  const setField = <K extends keyof SheetFields>(key: K, value: SheetFields[K]) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setReading(readEntityFile(fields));
  };

  return (
    <form className="bc-sheet bc-mosaic bc-gold-metal" onSubmit={onSubmit} noValidate>
      <span className="bc-sheet__tab">Entity file</span>
      <h3>Fundability checklist</h3>
      <p>
        These are the facts a commercial desk actually prices: identity, deposits, reporting vendors, and on-time
        payments already on file. You do not need a business credit score to start.
      </p>
      <div className="bc-sheet__grid">
        <label htmlFor="bc-sheet-legal-name">
          Legal name
          <input
            id="bc-sheet-legal-name"
            name="legalName"
            type="text"
            autoComplete="organization"
            value={fields.legalName}
            onChange={(event) => setField('legalName', event.target.value)}
            placeholder="Registered company name"
          />
        </label>
        <label htmlFor="bc-sheet-ein">
          EIN
          <input
            id="bc-sheet-ein"
            name="ein"
            type="text"
            inputMode="numeric"
            autoComplete="off"
            value={fields.ein}
            onChange={(event) => setField('ein', event.target.value)}
            placeholder="12-3456789"
          />
        </label>
        <label htmlFor="bc-sheet-entity-type">
          Entity type
          <select
            id="bc-sheet-entity-type"
            name="entityType"
            value={fields.entityType}
            onChange={(event) => setField('entityType', event.target.value as EntityType)}
          >
            <option value="">Select type</option>
            {ENTITY_TYPES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="bc-sheet-years">
          Years in business
          <select
            id="bc-sheet-years"
            name="years"
            value={fields.years}
            onChange={(event) => setField('years', event.target.value as YearsInFile)}
          >
            <option value="">Select years</option>
            {YEAR_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="bc-sheet-address">
          Address matches SOS, utility, and domain?
          <select
            id="bc-sheet-address"
            name="addressMatch"
            value={fields.addressMatch}
            onChange={(event) => setField('addressMatch', event.target.value as YesNo)}
          >
            <option value="">Select</option>
            {YES_NO.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="bc-sheet-domain">
          Website and domain email live?
          <select
            id="bc-sheet-domain"
            name="domainLive"
            value={fields.domainLive}
            onChange={(event) => setField('domainLive', event.target.value as YesNo)}
          >
            <option value="">Select</option>
            {YES_NO.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="bc-sheet-bank">
          Business bank in the company name?
          <select
            id="bc-sheet-bank"
            name="bankInName"
            value={fields.bankInName}
            onChange={(event) => setField('bankInName', event.target.value as YesNo)}
          >
            <option value="">Select</option>
            {YES_NO.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="bc-sheet-duns">
          D-U-N-S or a bureau profile started?
          <select
            id="bc-sheet-duns"
            name="duns"
            value={fields.duns}
            onChange={(event) => setField('duns', event.target.value as YesNo)}
          >
            <option value="">Select</option>
            {YES_NO.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="bc-sheet-phone">
          Business phone listed to the company?
          <select
            id="bc-sheet-phone"
            name="phoneListed"
            value={fields.phoneListed}
            onChange={(event) => setField('phoneListed', event.target.value as YesNo)}
          >
            <option value="">Select</option>
            {YES_NO.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="bc-sheet-deposits">
          Monthly deposits in the company account
          <select
            id="bc-sheet-deposits"
            name="monthlyDeposits"
            value={fields.monthlyDeposits}
            onChange={(event) => setField('monthlyDeposits', event.target.value as DepositBand)}
          >
            <option value="">Select a band</option>
            {DEPOSIT_BANDS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="bc-sheet-vendors">
          Vendors already reporting to a bureau
          <select
            id="bc-sheet-vendors"
            name="vendorsReporting"
            value={fields.vendorsReporting}
            onChange={(event) => setField('vendorsReporting', event.target.value as VendorCount)}
          >
            <option value="">Select</option>
            {VENDOR_COUNTS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <label htmlFor="bc-sheet-payments">
          On-time payments already on the file
          <select
            id="bc-sheet-payments"
            name="reportedPayments"
            value={fields.reportedPayments}
            onChange={(event) => setField('reportedPayments', event.target.value as PaymentDepth)}
          >
            <option value="">Select</option>
            {PAYMENT_DEPTH.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="bc-sheet__actions">
        <button type="submit" className="bc-prev-btn-primary">
          Read the file
        </button>
      </div>
      {reading ? (
        <div className="bc-sheet__result" data-on-target={reading.score >= 70 ? '1' : undefined} role="status">
          <div>
            <span>Readiness</span>
            <strong>{reading.score}</strong>
          </div>
          <div>
            <span>Recommended ticket</span>
            <strong>{reading.ticket}</strong>
          </div>
          <p>{reading.nextStep}</p>
          <div className="bc-sheet__result-actions">
            <button type="button" className="bc-prev-btn-primary" onClick={onSeePackages}>
              See packages <ArrowRight size={15} aria-hidden />
            </button>
            <button type="button" className="bc-prev-btn-secondary" onClick={onBookSession}>
              Book a session
            </button>
          </div>
          <p className="bc-prev-compliance">This reading is educational. It is not a bureau pull.</p>
        </div>
      ) : null}
    </form>
  );
}

function PackageTicket({
  pkg,
  featured,
  onSelect,
  onIncludes,
}: {
  pkg: PricingPackage;
  featured?: boolean;
  onSelect: () => void;
  onIncludes: () => void;
}) {
  const accent = PACKAGE_ACCENT[pkg.id] ?? 'sky';
  const outlook = formatBusinessCapitalOutlook(pkg);
  return (
    <article
      className={`bc-mosaic bc-prev-ticket${featured ? ' bc-prev-ticket--featured' : ''}`}
      data-fc-accent={accent}
    >
      {featured ? <span className="bc-prev-ticket__badge">Most partners start here</span> : null}
      {!featured && pkg.badge ? <span className="bc-prev-ticket__badge">{pkg.badge}</span> : null}
      <div className="bc-prev-ticket__price">{priceLabel(pkg)}</div>
      <h3 className="bc-prev-ticket__name">{pkg.name}</h3>
      <div className="bc-prev-ticket__fit">
        <span>Who it is for</span>
        <p>{PACKAGE_FIT[pkg.id] ?? pkg.tagline}</p>
      </div>
      <ul className="bc-prev-ticket__list">
        {(pkg.highlights ?? []).slice(0, featured ? 5 : 4).map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      {outlook ? (
        <div className="bc-prev-outlook-mini" aria-label="Capital outlook">
          <div>
            <span>Program fee</span>
            <strong>{outlook.programLabel}</strong>
          </div>
          <div>
            <span>Est. vendor outlay</span>
            <strong>{outlook.outlayLabel}</strong>
          </div>
          <div>
            <span>Potential capital</span>
            <strong>{outlook.potentialLabel}</strong>
          </div>
        </div>
      ) : null}
      <div className="bc-prev-ticket__actions">
        <button type="button" className="bc-prev-btn-primary" onClick={onSelect}>
          Select {pkg.name.replace('Business ', '')} <ArrowRight size={15} aria-hidden />
        </button>
        <button type="button" className="bc-prev-btn-secondary" onClick={onIncludes}>
          <Info size={14} aria-hidden /> What&apos;s included
        </button>
      </div>
    </article>
  );
}

export default function BusinessCreditPreviewPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const [beatKey, setBeatKey] = useState<(typeof BEATS)[number]['key']>('hygiene');
  const [detailPkg, setDetailPkg] = useState<PricingPackage | null>(null);

  const packages = useMemo(
    () => businessCreditPackages.filter((p) => p.isPublic).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
    [],
  );
  const featured = packages.find((p) => p.id === 'business_builder') ?? packages[1];
  const compare = packages.filter((p) => p.id !== featured?.id);
  const beat = BEATS.find((item) => item.key === beatKey) ?? BEATS[0];

  usePublicSeoMeta({
    title: 'Business credit | Finely Cred',
    description:
      'Build the EIN file commercial desks underwrite — reporting vendors, bureau depth, and a sequenced company profile so you can ask for capital as a company.',
    path: LIVE_PATH,
  });

  const checkout = (pkg: PricingPackage) => {
    if (pkg.isCustomQuote) {
      finelyCtaNavigate(navigate, 'business_intake');
      return;
    }
    navigate(
      resolvePackageSelectPath({
        packageId: pkg.id,
        rail: pkg.rail === 'in_house' ? 'in_house' : pkg.rail === 'stripe' ? 'stripe' : undefined,
        isAuthed: Boolean(auth.user),
      }),
    );
  };

  const bookSession = () => finelyCtaNavigate(navigate, 'consultation', { consultationLane: 'Business Credit' });
  const quote = () => finelyCtaNavigate(navigate, 'business_intake');
  const scrollPackages = () => document.getElementById('bc-prev-packages')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      <PageShell
        hideHero
        hideLaunchHelpStrip
        surface="ivory"
        contentWidth="full"
        title="Business credit"
      >
        <div data-fc-bc-preview="1">
          <header className="bc-prev-hero">
            <div className="bc-prev-hero__content bc-prev-inner">
              <div className="bc-prev-hero__copy">
                <p className="bc-prev-eyebrow">EIN file · commercial bureaus · vendor trades</p>
                <h1 className="bc-prev-hero__title">Business credit</h1>
                <p className="bc-prev-hero__sub">
                  Ask for capital as a <span className="bc-gold-trim">company</span>, not a consumer.
                </p>
                <p className="bc-prev-hero__lede">
                  Personal credit is the file attached to a Social Security number. Business credit is the file
                  attached to an EIN. We sequence reporting vendors so the company file can show payment history — then
                  you can ask for capital as a company.
                </p>
                <div className="bc-prev-hero__actions">
                  <button type="button" className="bc-prev-btn-primary" onClick={scrollPackages}>
                    See packages <ArrowRight size={15} aria-hidden />
                  </button>
                  <button type="button" className="bc-prev-btn-secondary" onClick={bookSession}>
                    Book a session
                  </button>
                  <button type="button" className="bc-prev-btn-ghost" onClick={quote}>
                    Request a capital quote
                  </button>
                </div>
              </div>
            </div>
          </header>

          <section className="bc-prev-section">
            <div className="bc-prev-inner">
              <Reveal>
                <p className="bc-prev-kicker">Entity file</p>
                <h2 className="bc-prev-h2">Open the checklist. Get a reading.</h2>
                <p className="bc-prev-lede">
                  Enter the facts a desk prices: EIN, deposits, listed phone, reporting vendors, and on-time payments
                  already on file. We recommend Foundation, Builder, or a named-product desk. This is not a bureau pull.
                </p>
              </Reveal>
              <EntitySheet onSeePackages={scrollPackages} onBookSession={bookSession} />
            </div>
          </section>

          <section className="bc-prev-section bc-prev-section--center">
            <div className="bc-prev-inner">
              <Reveal>
                <p className="bc-prev-kicker">Commercial bureaus</p>
                <h2 className="bc-prev-h2">Business credit bureaus</h2>
                <p className="bc-prev-lede">
                  Suppliers watch PAYDEX. Banks read Experian Business and Equifax Business. Lenders use FICO SBSS.
                  Creditsafe and Ansonia show up on trade desks. A strong PAYDEX with empty files elsewhere is only a
                  partial build.
                </p>
              </Reveal>
              <div className="bc-prev-bureau-stage">
                <div className="bc-prev-bureau-gauge">
                  <PaydexRing />
                  <p>Target 80 — early pay, not merely on time</p>
                </div>
                <div className="bc-bureau-grid">
                  {BUREAUS.map((bureau) => (
                    <a
                      key={bureau.name}
                      className="bc-bureau-tile bc-mosaic"
                      data-fc-accent={bureau.accent}
                      href={bureau.href}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <strong>
                        <span className="bc-shine">{bureau.name}</span>
                        <ExternalLink size={16} aria-hidden />
                      </strong>
                      <span className="bc-shine">{bureau.score}</span>
                      <p className="bc-shine">{bureau.job}</p>
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="bc-prev-section">
            <div className="bc-prev-inner">
              <Reveal>
                <p className="bc-prev-kicker">The capital path</p>
                <h2 className="bc-prev-h2">Four beats on one company file.</h2>
                <p className="bc-prev-lede">
                  Each beat is the reason the next product can exist. Open a step to see what we actually build on the
                  EIN file.
                </p>
              </Reveal>
              <div className="bc-prev-mosaic" role="tablist" aria-label="Capital path">
                {BEATS.map((item, index) => {
                  const accent = (['sky', 'violet', 'rose', 'emerald'] as const)[index];
                  return (
                    <button
                      key={item.key}
                      type="button"
                      role="tab"
                      aria-selected={beatKey === item.key}
                      aria-controls="bc-prev-beat-stage"
                      id={`bc-prev-beat-${item.key}`}
                      className="bc-prev-mosaic__tile bc-mosaic"
                      data-fc-accent={accent}
                      onClick={() => setBeatKey(item.key)}
                    >
                      <strong>
                        {index + 1}. {item.label}
                      </strong>
                      <span>{item.stage}</span>
                    </button>
                  );
                })}
              </div>
              <article
                id="bc-prev-beat-stage"
                className="bc-prev-slide__stage bc-mosaic bc-gold-metal"
                role="tabpanel"
                aria-labelledby={`bc-prev-beat-${beat.key}`}
              >
                <p className="bc-prev-slide__index">{beat.stage}</p>
                <h3 className="bc-prev-slide__title">{beat.title}</h3>
                <p className="bc-prev-slide__body">{beat.body}</p>
                <ul className="bc-prev-slide__points">
                  {beat.points.map((point) => (
                    <li key={point}>{point}</li>
                  ))}
                </ul>
              </article>
            </div>
          </section>

          <section className="bc-prev-section">
            <div className="bc-prev-inner">
              <Reveal>
                <p className="bc-prev-kicker">Vendor ladder</p>
                <h2 className="bc-prev-h2">First through fourth: the vendors partners open first.</h2>
                <p className="bc-prev-lede">
                  Starter net-30 and store accounts that report, shown by tier so the path is obvious.
                </p>
              </Reveal>
              <div className="bc-vendor-ladder">
                {VENDOR_LADDER.map((rung) => (
                  <article
                    key={rung.tier}
                    className="bc-mosaic bc-vendor-tier"
                    data-tier={rung.tier}
                    data-fc-accent={rung.accent}
                  >
                    <div className="bc-vendor-tier__head">
                      <div className="bc-vendor-tier__ordinal" aria-hidden>
                        <strong>{rung.ordinal}</strong>
                        <span>Tier</span>
                      </div>
                      <div className="bc-vendor-tier__copy">
                        <span>Vendors</span>
                        <strong>{rung.title}</strong>
                        <p>{rung.job}</p>
                      </div>
                    </div>
                    <ul>
                      {rung.vendors.map((vendor) => {
                        const Icon = VENDOR_ROW_ICON[vendor.name];
                        return (
                          <li key={vendor.name}>
                            <a href={vendor.href} target="_blank" rel="noopener noreferrer">
                              <VendorMark name={vendor.name} host={vendor.host} />
                              {Icon ? (
                                <span className="bc-vendor-ico" aria-hidden>
                                  <Icon size={16} strokeWidth={2.25} />
                                </span>
                              ) : null}
                              <span>
                                <em>{vendor.name}</em>
                                <small>{vendor.note}</small>
                              </span>
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </article>
                ))}
              </div>
              <p className="bc-prev-compliance">Starter vendors, sequenced by tier so the path stays clear.</p>
            </div>
          </section>

          <section className="bc-prev-section bc-mid">
            <div className="bc-prev-inner">
              <Reveal>
                <p className="bc-prev-kicker">Named product</p>
                <h2 className="bc-prev-h2">A business card the EIN file can carry.</h2>
                <p className="bc-prev-lede">
                  When vendors report and the company file looks real, named cards become the next ask — priced against
                  the entity, not the owner’s Social Security number.
                </p>
              </Reveal>
            </div>
            <div className="bc-mid-stage">
              <img
                className="bc-mid-stage__photo"
                src="/images/business-credit-gateway.jpg"
                alt=""
                loading="lazy"
              />
            </div>
            <div className="bc-mid-bridge">
              <CreditCardAsset
                type="gold"
                className="w-[min(100%,22rem)] max-w-[22rem]"
                metaTop="BUSINESS"
                metaBottom="Mastercard"
                numberText="5543 8812 9044 2176"
                bottomLeftLabel="COMPANY"
                bottomLeftValue="EIN FILE"
                bottomRightLabel="LIMIT"
                bottomRightValue="$75,000"
                microText="Business Mastercard · Finely Cred · EIN file · not a personal seat"
              />
            </div>
          </section>

          <section className="bc-prev-section">
            <div className="bc-prev-inner">
              <p className="bc-prev-kicker">Capital outlook</p>
              <h2 className="bc-prev-h2">What the file can ask for.</h2>
              <p className="bc-prev-lede">
                These ranges are business-credit channels — vendor trades, store cards, and commercial products.
                Builder is the most common path to the middle band. The figures are approximate.
              </p>
              <div className="bc-prev-outlook">
                <article className="bc-mosaic bc-prev-plaque" data-fc-accent="sky">
                  <span>Foundation</span>
                  <strong>$15K–$50K</strong>
                  <p>First reporting file. Hygiene plus starter vendors before any named-product ask.</p>
                </article>
                <article className="bc-mosaic bc-prev-plaque" data-fc-accent="violet">
                  <span>Builder</span>
                  <strong>$50K–$150K</strong>
                  <p>Full sequencing and trade depth. The band most operating companies work toward.</p>
                </article>
                <article className="bc-mosaic bc-prev-plaque" data-fc-accent="emerald">
                  <span>Elite · Empire</span>
                  <strong>$150K–$350K+</strong>
                  <p>Named products and executive cadence when the file can carry a larger ask.</p>
                </article>
              </div>
              <p className="bc-prev-compliance">Approximate potential ranges by ticket.</p>
            </div>
          </section>

          <section className="bc-prev-section" id="bc-prev-packages">
            <div className="bc-prev-inner">
              <p className="bc-prev-kicker">Packages</p>
              <h2 className="bc-prev-h2">Four tickets, one job: a fundable EIN file.</h2>
              <p className="bc-prev-lede">
                Each ticket shows who it is for, what you purchase, the program fee, estimated vendor outlay, and the
                potential business-credit range. Select opens checkout. What&apos;s included opens the full comparison.
              </p>
              {featured ? (
                <div className="bc-prev-featured">
                  <PackageTicket
                    pkg={featured}
                    featured
                    onSelect={() => checkout(featured)}
                    onIncludes={() => setDetailPkg(featured)}
                  />
                </div>
              ) : null}
              <div className="bc-prev-compare">
                {compare.map((pkg) => (
                  <PackageTicket
                    key={pkg.id}
                    pkg={pkg}
                    onSelect={() => checkout(pkg)}
                    onIncludes={() => setDetailPkg(pkg)}
                  />
                ))}
              </div>
              <p className="bc-prev-compliance">
                Vendor outlay is approximate and varies by deposits, starter accounts, and pay-in-full habits.
              </p>
            </div>
          </section>

          <section className="bc-prev-section bc-prev-section--tight">
            <div className="bc-prev-inner">
              <p className="bc-prev-kicker">Questions</p>
              <h2 className="bc-prev-h2">Straight answers on pricing and the EIN file</h2>
              <div className="bc-prev-faq">
                {FAQ.map((item) => (
                  <details key={item.q}>
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            </div>
          </section>

          <section className="bc-prev-section bc-prev-section--tight">
            <div className="bc-prev-inner">
              <div className="bc-prev-final">
                <h2>Ready to build the company file?</h2>
                <p>
                  Start with Builder if you want the full ladder, or book a session if the entity is new, multi-owner,
                  or already messy. We will match Foundation, Elite, or Empire when that is the honest ticket.
                </p>
                <div className="bc-prev-final__actions">
                  <button type="button" className="bc-prev-btn-primary" onClick={scrollPackages}>
                    See packages <ArrowRight size={15} aria-hidden />
                  </button>
                  <button type="button" className="bc-prev-btn-secondary" onClick={bookSession}>
                    Book a session
                  </button>
                </div>
              </div>
              <div className="bc-prev-exits">
                <Link className="bc-mosaic bc-prev-exit" data-fc-accent="sky" to="/fundability-readiness">
                  <strong>Fundability hub</strong>
                  <span>Check whether the entity is ready to ask before you buy a ladder.</span>
                </Link>
                <Link
                  className="bc-mosaic bc-prev-exit"
                  data-fc-accent="rose"
                  to="/resources/business-credit-one-sheets"
                >
                  <strong>Business credit one-sheets</strong>
                  <span>Process brief and tier sheets you can keep on the desk.</span>
                </Link>
                <button
                  type="button"
                  className="bc-mosaic bc-prev-exit"
                  data-fc-accent="emerald"
                  onClick={bookSession}
                >
                  <strong>Book a session</strong>
                  <span>Match Foundation, Builder, Elite, or Empire to the actual file.</span>
                </button>
              </div>
              <p className="bc-prev-compliance">Results vary · not legal advice · funding subject to underwriting</p>
              <div className="bc-prev-page-end" />
            </div>
          </section>
        </div>
      </PageShell>
      <BusinessCreditIncludesModal
        pkg={detailPkg}
        onClose={() => setDetailPkg(null)}
        onSelect={(packageId) => {
          const pkg = packages.find((item) => item.id === packageId) ?? null;
          setDetailPkg(null);
          if (pkg) checkout(pkg);
        }}
      />
    </>
  );
}
