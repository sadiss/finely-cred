import React, { useMemo } from 'react';
import { ArrowRight, Building2, Scale, Sparkles, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LandingTypewriterTitle } from '../../components/landing/LandingTypewriterTitle';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCardCompact,
  type FinelyOsPublicAccent,
} from './finelyOsLightUi';

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

type SolutionTile = {
  key: PricingSolutionKey;
  label: string;
  sell: string;
  sellAccent: string;
  hint: string;
  path: string;
  accent: FinelyOsPublicAccent;
  Icon: typeof Sparkles;
};

const SOLUTION_TILES: SolutionTile[] = [
  {
    key: 'personal_credit',
    label: 'Personal credit',
    sell: 'Restore the profile lenders ',
    sellAccent: 'actually read.',
    hint: 'Restore · Building',
    path: '/pricing/personal-credit-restore',
    accent: 'emerald',
    Icon: Sparkles,
  },
  {
    key: 'business_credit',
    label: 'Business credit',
    sell: 'Entity strength, vendors, ',
    sellAccent: 'fundability.',
    hint: 'Entity · Vendors',
    path: '/pricing/business-credit',
    accent: 'violet',
    Icon: Building2,
  },
  {
    key: 'debt_legal',
    label: 'Debt & legal',
    sell: 'Collections, validation, summons — ',
    sellAccent: 'clear playbook.',
    hint: 'Validation OS',
    path: '/pricing/debt-legal',
    accent: 'fuchsia',
    Icon: Scale,
  },
  {
    key: 'tradeline_promo',
    label: 'Tradelines',
    sell: 'Authorized-user strategy — ',
    sellAccent: 'no hype.',
    hint: 'AU strategy',
    path: '/pricing/tradelines',
    accent: 'amber',
    Icon: Layers,
  },
];

const EXTRA_SELL: Partial<
  Record<PricingSolutionKey, { label: string; sell: string; sellAccent: string; accent: FinelyOsPublicAccent }>
> = {
  wealth_builder: {
    label: 'Wealth builder',
    sell: 'Long-game credit and capital for partners ',
    sellAccent: 'ready to scale.',
    accent: 'amber',
  },
  privacy_id: {
    label: 'Privacy & ID',
    sell: 'Freeze, lock, identity hygiene — ',
    sellAccent: 'protect first.',
    accent: 'sky',
  },
  bundle: {
    label: 'Bundles',
    sell: 'Combined programs priced as a ',
    sellAccent: 'system.',
    accent: 'violet',
  },
  agency: {
    label: 'Credit Specialist',
    sell: 'Earn, serve, grow — revenue share, ',
    sellAccent: 'no access fee.',
    accent: 'amber',
  },
  banking_reports: {
    label: 'Banking reports',
    sell: 'ChexSystems & Early Warning — ',
    sellAccent: 'banking ready.',
    accent: 'sky',
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

function resolveHero(active: PricingSolutionKey | null | undefined) {
  const tile = SOLUTION_TILES.find((t) => t.key === active);
  if (tile) {
    return {
      label: tile.label,
      sell: tile.sell,
      sellAccent: tile.sellAccent,
      accent: tile.accent,
      Icon: tile.Icon,
    };
  }
  const extra = active ? EXTRA_SELL[active] : null;
  if (extra) {
    return {
      label: extra.label,
      sell: extra.sell,
      sellAccent: extra.sellAccent,
      accent: extra.accent,
      Icon: Sparkles,
    };
  }
  return {
    label: 'Choose your solution',
    sell: 'Pick a path — then choose ',
    sellAccent: 'DIY or DFY.',
    accent: 'emerald' as FinelyOsPublicAccent,
    Icon: Sparkles,
  };
}

export function PricingSolutionsHero({
  activeKey,
  onSelectKey,
  mode = 'navigate',
}: {
  activeKey?: PricingSolutionKey | null;
  onSelectKey?: (key: PricingSolutionKey) => void;
  mode?: 'navigate' | 'tabs';
}) {
  const navigate = useNavigate();
  const hero = useMemo(() => resolveHero(activeKey), [activeKey]);
  const HeroIcon = hero.Icon;

  return (
    <section className="space-y-3" data-fc-pricing-solutions="1">
      <div
        className={`${finelyOsCatalogCardCompact(hero.accent)} relative overflow-hidden !p-5 sm:!p-7`}
        data-fc-accent={hero.accent}
      >
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
              <span className={`${FINELY_OS_ENTITY_SUBLABEL} tracking-[0.22em]`}>Selected solution</span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-white/85">
                <HeroIcon size={12} /> {hero.label}
              </span>
            </div>
            <LandingTypewriterTitle
              key={`${hero.label}-${hero.sellAccent}`}
              text={hero.sell}
              accentText={hero.sellAccent}
              as="h2"
              immediate
              className={`text-xl sm:text-2xl lg:text-[1.75rem] font-semibold tracking-tight leading-snug ${FINELY_OS_ENTITY_VALUE}`}
              accentClassName="text-amber-300"
              speedMs={20}
            />
            <p className={`mt-2.5 max-w-2xl text-sm ${FINELY_OS_ENTITY_BODY}`}>
              Results vary · not legal advice · funding subject to underwriting
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/fundability-readiness')}
            className="shrink-0 inline-flex items-center gap-2 self-start rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-xs font-semibold text-white/85 transition hover:bg-white/[0.1]"
          >
            Fundability hub <ArrowRight size={14} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        {SOLUTION_TILES.map((tile) => {
          const active =
            activeKey === tile.key || (activeKey === 'banking_reports' && tile.key === 'personal_credit');
          const Icon = tile.Icon;
          return (
            <button
              key={tile.key}
              type="button"
              onClick={() => {
                if (mode === 'tabs' && onSelectKey) onSelectKey(tile.key);
                else navigate(tile.path);
              }}
              className={`${finelyOsCatalogCardCompact(tile.accent)} !p-3 sm:!p-3.5 text-left transition-all ${
                active
                  ? 'ring-2 ring-offset-0 ring-amber-400/45 shadow-[0_0_0_1px_rgba(251,191,36,0.28),0_14px_44px_-14px_rgba(0,0,0,0.7)]'
                  : 'opacity-75 hover:opacity-100'
              }`}
              data-fc-accent={tile.accent}
              data-active={active ? 'true' : 'false'}
              aria-current={active ? 'true' : undefined}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border ${
                    active ? 'border-white/25 bg-white/10' : 'border-white/10 bg-black/25'
                  }`}
                >
                  <Icon size={15} className="text-white/85" />
                </span>
                <div className="min-w-0">
                  <div className={`text-sm font-semibold truncate ${FINELY_OS_ENTITY_VALUE}`}>{tile.label}</div>
                  <div className={`text-[11px] truncate ${FINELY_OS_ENTITY_BODY}`}>{tile.hint}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
