import React, { useMemo } from 'react';
import { ArrowRight, Building2, Layers, Scale, Sparkles } from 'lucide-react';
import { LandingTypewriterTitle } from '../../components/landing/LandingTypewriterTitle';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  type FinelyOsPublicAccent,
} from './finelyOsLightUi';
import '../../pages/serviceLaneStage.css';

export type PricingSolutionKey =
  | 'personal_credit'
  | 'business_credit'
  | 'debt_legal'
  | 'tradeline_promo'
  | 'wealth_builder'
  | 'privacy_id'
  | 'bundle'
  | 'agency'
  | 'banking_reports';

type HeroCopy = {
  label: string;
  sell: string;
  sellAccent: string;
  accent: FinelyOsPublicAccent;
  Icon: typeof Sparkles;
};

const HERO_BY_KEY: Partial<Record<PricingSolutionKey, HeroCopy>> = {
  personal_credit: {
    label: 'Personal credit',
    sell: 'Restore the profile lenders ',
    sellAccent: 'actually read.',
    accent: 'emerald',
    Icon: Sparkles,
  },
  business_credit: {
    label: 'Business credit',
    sell: 'Build the EIN file commercial desks ',
    sellAccent: 'actually underwrite.',
    accent: 'violet',
    Icon: Building2,
  },
  debt_legal: {
    label: 'Debt & legal',
    sell: 'Answer the collector from a desk, ',
    sellAccent: 'not a panic.',
    accent: 'fuchsia',
    Icon: Scale,
  },
  tradeline_promo: {
    label: 'Tradelines',
    sell: 'Seasoned reporting lines, chosen with ',
    sellAccent: 'discipline.',
    accent: 'rose',
    Icon: Layers,
  },
  wealth_builder: {
    label: 'Wealth builder',
    sell: 'Sequence credit and capital for partners ',
    sellAccent: 'ready to scale.',
    accent: 'sky',
    Icon: Sparkles,
  },
  privacy_id: {
    label: 'Privacy & ID',
    sell: 'Freeze, lock, and clean identity ',
    sellAccent: 'before the next ask.',
    accent: 'sky',
    Icon: Sparkles,
  },
  bundle: {
    label: 'Bundles',
    sell: 'Combine the work and price it as ',
    sellAccent: 'one system.',
    accent: 'violet',
    Icon: Sparkles,
  },
  agency: {
    label: 'Credit Specialist',
    sell: 'Earn while you serve partners — revenue share, ',
    sellAccent: 'no access fee.',
    accent: 'fuchsia',
    Icon: Sparkles,
  },
  banking_reports: {
    label: 'Banking reports',
    sell: 'Clear ChexSystems and Early Warning ',
    sellAccent: 'so banking is ready.',
    accent: 'sky',
    Icon: Sparkles,
  },
};

const GLOW: Record<FinelyOsPublicAccent, string> = {
  emerald: 'rgba(52,211,153,0.38)',
  violet: 'rgba(167,139,250,0.38)',
  fuchsia: 'rgba(232,121,249,0.38)',
  amber: 'rgba(251,191,36,0.38)',
  sky: 'rgba(56,189,248,0.38)',
  rose: 'rgba(251,113,133,0.38)',
};

function resolveHero(active: PricingSolutionKey | null | undefined): HeroCopy {
  if (active && HERO_BY_KEY[active]) return HERO_BY_KEY[active]!;
  return {
    label: 'Your path',
    sell: 'Choose the work that fits ',
    sellAccent: 'this file.',
    accent: 'emerald',
    Icon: Sparkles,
  };
}

export function PricingSolutionsHero({
  activeKey,
  onBrowseSolutions,
  browseLabel = 'Browse all solutions',
}: {
  activeKey?: PricingSolutionKey | null;
  /** Opens ServicesChooserModal — replaces the old tile-wall chooser. */
  onBrowseSolutions?: () => void;
  browseLabel?: string;
}) {
  const hero = useMemo(() => resolveHero(activeKey), [activeKey]);
  const HeroIcon = hero.Icon;

  return (
    <section className="space-y-3" data-fc-pricing-solutions="1">
      <div className="svc-now-ribbon relative overflow-hidden" data-fc-accent={hero.accent}>
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full opacity-50 blur-3xl"
          style={{ background: GLOW[hero.accent] }}
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full opacity-30 blur-3xl"
          style={{ background: GLOW[hero.accent] }}
          aria-hidden
        />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`${FINELY_OS_ENTITY_SUBLABEL} tracking-[0.22em]`}>Now viewing</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-slate-300 bg-white/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-800">
                <HeroIcon size={12} /> {hero.label}
              </span>
            </div>
            <LandingTypewriterTitle
              key={`${hero.label}-${hero.sellAccent}`}
              text={hero.sell}
              accentText={hero.sellAccent}
              as="h2"
              immediate
              className={`text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight leading-snug ${FINELY_OS_ENTITY_VALUE}`}
              accentClassName="text-emerald-700"
              speedMs={20}
            />
            <p className={`mt-2.5 max-w-2xl text-base ${FINELY_OS_ENTITY_BODY}`}>
              Results vary · not legal advice · funding subject to underwriting
            </p>
          </div>
          {onBrowseSolutions ? (
            <button type="button" onClick={onBrowseSolutions} className="svc-stage__switch shrink-0 self-start">
              {browseLabel} <ArrowRight size={14} />
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
