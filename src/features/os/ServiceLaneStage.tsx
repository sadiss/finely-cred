import React from 'react';
import { ArrowRight } from 'lucide-react';
import { LandingTypewriterTitle } from '../../components/landing/LandingTypewriterTitle';
import { FINELY_OS_COMPLIANCE_FOOTNOTE, FINELY_OS_PRIMARY_BTN } from './finelyOsLightUi';
import '../../pages/serviceLaneStage.css';

export type ServiceFloorSlug =
  | 'business-credit'
  | 'debt-legal'
  | 'personal-credit-building'
  | 'wealth-builder'
  | 'privacy-id'
  | 'bundles'
  | 'tradelines'
  | 'agencies';

type FloorCopy = {
  arch: 'deck' | 'desk' | 'runway' | 'mosaic' | 'control' | 'compare' | 'market' | 'command';
  kicker: string;
  sell: string;
  sellAccent: string;
  accentClass: string;
};

const FLOOR: Record<ServiceFloorSlug, FloorCopy> = {
  'business-credit': {
    arch: 'deck',
    kicker: 'Business credit',
    sell: 'Build the EIN file commercial desks ',
    sellAccent: 'actually underwrite.',
    accentClass: 'text-violet-700',
  },
  'debt-legal': {
    arch: 'desk',
    kicker: 'Debt & legal',
    sell: 'Answer the collector from a desk, ',
    sellAccent: 'not a panic.',
    accentClass: 'text-rose-700',
  },
  'personal-credit-building': {
    arch: 'runway',
    kicker: 'Credit building',
    sell: 'Thicken the file, then hold the ',
    sellAccent: 'healthy band.',
    accentClass: 'text-emerald-700',
  },
  'wealth-builder': {
    arch: 'mosaic',
    kicker: 'Wealth builder',
    sell: 'Sequence credit and capital for the ',
    sellAccent: 'long game.',
    accentClass: 'text-violet-700',
  },
  'privacy-id': {
    arch: 'control',
    kicker: 'Privacy & ID',
    sell: 'Freeze, lock, and clean identity ',
    sellAccent: 'before the next ask.',
    accentClass: 'text-sky-700',
  },
  bundles: {
    arch: 'compare',
    kicker: 'Bundles',
    sell: 'Combine the work and price it as ',
    sellAccent: 'one system.',
    accentClass: 'text-violet-700',
  },
  tradelines: {
    arch: 'market',
    kicker: 'Tradelines',
    sell: 'Seasoned reporting lines, chosen with ',
    sellAccent: 'discipline.',
    accentClass: 'text-emerald-700',
  },
  agencies: {
    arch: 'command',
    kicker: 'Credit Specialist',
    sell: 'A workspace, seats, and payout tiers ',
    sellAccent: 'for operators.',
    accentClass: 'text-emerald-700',
  },
};

function FloorObject({ slug }: { slug: ServiceFloorSlug }) {
  if (slug === 'business-credit') {
    return (
      <div className="svc-glance" aria-label="Business capital outlook">
        <div className="svc-glance__cell svc-acc-emerald">
          <div className="svc-glance__value">$15K–$50K</div>
          <div className="svc-glance__label">Foundation</div>
          <div className="svc-glance__detail">Potential BC capital · approx</div>
        </div>
        <div className="svc-glance__cell svc-acc-violet">
          <div className="svc-glance__value">$50K–$150K</div>
          <div className="svc-glance__label">Builder</div>
          <div className="svc-glance__detail">Vendor sequencing + depth</div>
        </div>
        <div className="svc-glance__cell svc-acc-rose">
          <div className="svc-glance__value">$350K+</div>
          <div className="svc-glance__label">Empire</div>
          <div className="svc-glance__detail">Multi-entity capital path</div>
        </div>
      </div>
    );
  }

  if (slug === 'debt-legal') {
    return (
      <div className="svc-desk-chips" aria-label="What we handle">
        <span className="svc-desk-chip svc-acc-rose">Collections</span>
        <span className="svc-desk-chip svc-acc-sky">Summons & suits</span>
        <span className="svc-desk-chip svc-acc-violet">Foreclosure / repo</span>
      </div>
    );
  }

  if (slug === 'personal-credit-building') {
    return (
      <ol className="svc-runway" aria-label="Building runway">
        <li className="svc-runway__step svc-runway__step--emerald svc-acc-emerald">
          <span className="svc-runway__num">1</span>
          <div className="svc-runway__name">Thin file</div>
        </li>
        <li className="svc-runway__step svc-runway__step--violet svc-acc-violet">
          <span className="svc-runway__num">2</span>
          <div className="svc-runway__name">Utilization</div>
        </li>
        <li className="svc-runway__step svc-runway__step--sky svc-acc-sky">
          <span className="svc-runway__num">3</span>
          <div className="svc-runway__name">Tradelines</div>
        </li>
        <li className="svc-runway__step svc-runway__step--rose svc-acc-rose">
          <span className="svc-runway__num">4</span>
          <div className="svc-runway__name">Maintain</div>
        </li>
      </ol>
    );
  }

  if (slug === 'wealth-builder') {
    return (
      <div className="svc-path-mosaic" aria-label="Wealth path">
        <div className="svc-glance__cell svc-acc-violet">
          <div className="svc-glance__value">Credit</div>
          <div className="svc-glance__detail">Stabilize the personal file first</div>
        </div>
        <div className="svc-glance__cell svc-acc-emerald">
          <div className="svc-glance__value">Capital</div>
          <div className="svc-glance__detail">Readiness for funding conversations</div>
        </div>
        <div className="svc-glance__cell svc-acc-sky">
          <div className="svc-glance__value">Long game</div>
          <div className="svc-glance__detail">Keep the profile strong after the lift</div>
        </div>
      </div>
    );
  }

  if (slug === 'privacy-id') {
    return (
      <div className="svc-control-grid" aria-label="Privacy controls">
        <div className="svc-control-tile svc-acc-sky">
          <strong>Freeze</strong>
          <span>Bureau freezes on the file</span>
        </div>
        <div className="svc-control-tile svc-acc-violet">
          <strong>Lock</strong>
          <span>Lock and unlock cadence</span>
        </div>
        <div className="svc-control-tile svc-acc-emerald">
          <strong>Footprint</strong>
          <span>Data-broker hygiene</span>
        </div>
        <div className="svc-control-tile svc-acc-rose">
          <strong>Alerts</strong>
          <span>Watch the identity surface</span>
        </div>
      </div>
    );
  }

  if (slug === 'bundles') {
    return (
      <div className="svc-compare" aria-label="Bundle paths">
        <div className="svc-glance__cell svc-acc-emerald">
          <div className="svc-glance__label">Path</div>
          <div className="svc-glance__value">Restore</div>
          <div className="svc-glance__detail">Personal file first</div>
        </div>
        <div className="svc-glance__cell svc-acc-violet">
          <div className="svc-glance__label">Path</div>
          <div className="svc-glance__value">Build</div>
          <div className="svc-glance__detail">Strength after cleanup</div>
        </div>
        <div className="svc-glance__cell svc-acc-sky">
          <div className="svc-glance__label">Path</div>
          <div className="svc-glance__value">Together</div>
          <div className="svc-glance__detail">Priced as one system</div>
        </div>
      </div>
    );
  }

  if (slug === 'tradelines') {
    return (
      <div className="svc-market" aria-label="Tradeline factors">
        <div className="svc-ticket svc-acc-emerald">
          <div className="svc-glance__label">Factor</div>
          <div className="svc-glance__value">Seasoning</div>
        </div>
        <div className="svc-ticket svc-acc-violet">
          <div className="svc-glance__label">Factor</div>
          <div className="svc-glance__value">Utilization</div>
        </div>
        <div className="svc-ticket svc-acc-sky">
          <div className="svc-glance__label">Reports</div>
          <div className="svc-glance__value">Equifax</div>
        </div>
      </div>
    );
  }

  return (
    <div className="svc-plaques" aria-label="Agency steps">
      <div className="svc-plaque svc-acc-emerald">
        <strong>Buy-in</strong>
        <span>One-time workspace seat</span>
      </div>
      <div className="svc-plaque svc-acc-violet">
        <strong>Capacity</strong>
        <span>Pick the payout tier</span>
      </div>
      <div className="svc-plaque svc-acc-sky">
        <strong>Operate</strong>
        <span>Serve partners in the OS</span>
      </div>
    </div>
  );
}

export function ServiceLaneStage({
  slug,
  subtitle,
  onSwitch,
}: {
  slug: ServiceFloorSlug;
  subtitle: string;
  onSwitch: () => void;
}) {
  const floor = FLOOR[slug];

  const scrollToPackages = () => {
    document.getElementById('svc-packages')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <header className={`svc-stage svc-stage--${floor.arch}`} data-fc-service-stage={slug}>
      <div className="svc-stage__aurora" aria-hidden />
      <div className="svc-stage__mesh" aria-hidden />
      <div className="svc-stage__beam" aria-hidden />
      <div className="svc-stage__inner">
        <div className={floor.arch === 'deck' ? 'svc-stage__grid' : undefined}>
          <div className="min-w-0">
            <p className="svc-stage__kicker">{floor.kicker}</p>
            <LandingTypewriterTitle
              key={slug}
              as="h1"
              text={floor.sell}
              accentText={floor.sellAccent}
              immediate
              className="svc-stage__title"
              accentClassName={floor.accentClass}
              speedMs={22}
            />
            <p className="svc-stage__lede">{subtitle}</p>
            <div className="svc-stage__actions">
              <button type="button" onClick={scrollToPackages} className={FINELY_OS_PRIMARY_BTN}>
                See packages <ArrowRight size={16} />
              </button>
              <button type="button" onClick={onSwitch} className="svc-stage__switch">
                Switch solution <ArrowRight size={14} />
              </button>
            </div>
            <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-4`}>
              Results vary · not legal advice · funding subject to underwriting
            </p>
          </div>
          {floor.arch === 'deck' ? <FloorObject slug={slug} /> : null}
        </div>
        {floor.arch !== 'deck' ? <FloorObject slug={slug} /> : null}
      </div>
    </header>
  );
}
