import React from 'react';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  getProductShot,
  type ProductShotKey,
} from '../../config/productShots';
import { MarketingProductShot } from '../marketing/MarketingProductShot';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  type FinelyOsPublicAccent,
} from '../../features/os/finelyOsLightUi';

type WorkSplitLike = {
  headline: string;
  youDo: readonly string[];
  finelyRuns: readonly string[];
  notYourJob: readonly string[];
};

type NextStep = {
  label: string;
  detail: string;
  /** Prefer `path`; `to` accepted for FinelyNowDoThisStrip item reuse. */
  path?: string;
  to?: string;
};

type Props = {
  split: WorkSplitLike;
  accent?: FinelyOsPublicAccent;
  /** One obvious next action for this hub state. */
  nextStep?: NextStep;
  /** Optional free guide / toolkit CTA. */
  guide?: { label: string; path: string };
  /** Path / lane badge (e.g. affiliate path name). */
  pathBadge?: string | null;
  /**
   * Marketing track preview from `HUB_PRODUCT_SHOT` — honest caption, not labeled as live hub UI.
   */
  shotKey?: ProductShotKey;
  className?: string;
};

/**
 * Luxury “You run / Finely runs” deepen band for CS · Affiliate · AU Seller hubs.
 * Matches Agency/Case Help/RE overview density — no second KPI strip.
 */
export function RoleHubDeepenOverview({
  split,
  accent = 'emerald',
  nextStep,
  guide,
  pathBadge,
  shotKey,
  className = '',
}: Props) {
  const navigate = useNavigate();
  const shot = shotKey ? getProductShot(shotKey) : null;
  const nextPath = nextStep?.path || nextStep?.to || '';

  return (
    <section className={`${finelyOsCatalogCard(accent)} space-y-6 ${className}`} data-fc-hub-deepen="1">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 space-y-2">
          <p className={FINELY_OS_ENTITY_SUBLABEL}>You run / Finely runs</p>
          <p className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{split.headline}</p>
        </div>
        {pathBadge ? (
          <span className="rounded-full border border-white/15 bg-black/25 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-white/80">
            {pathBadge}
          </span>
        ) : null}
      </div>

      {nextStep && nextPath ? (
        <div className={`${finelyOsCatalogCard('violet')} flex flex-wrap items-center justify-between gap-4`} data-fc-accent="violet">
          <div className="min-w-0">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Do this next</p>
            <p className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{nextStep.label}</p>
            <p className={`mt-1 text-base leading-snug ${FINELY_OS_ENTITY_BODY}`}>{nextStep.detail}</p>
          </div>
          <button type="button" onClick={() => navigate(nextPath)} className={FINELY_OS_PRIMARY_BTN}>
            Go <ArrowRight size={14} />
          </button>
        </div>
      ) : null}

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { t: 'You do', rows: split.youDo, tone: 'emerald' as const },
          { t: 'Finely runs', rows: split.finelyRuns, tone: 'sky' as const },
          { t: 'Not your job', rows: split.notYourJob, tone: 'rose' as const },
        ].map((col) => (
          <div key={col.t} className={finelyOsCatalogCard(col.tone)} data-fc-accent={col.tone}>
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-2`}>{col.t}</div>
            <ul className={`text-base ${FINELY_OS_ENTITY_BODY} space-y-2`}>
              {col.rows.slice(0, 3).map((r) => (
                <li key={r}>• {r}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {shot ? (
        <MarketingProductShot shot={shot} showCaption theme="dark" />
      ) : null}

      {guide ? (
        <div className="flex flex-wrap gap-2 pt-0.5">
          <button type="button" onClick={() => navigate(guide.path)} className={nextStep ? FINELY_OS_SECONDARY_BTN : FINELY_OS_PRIMARY_BTN}>
            <BookOpen size={14} /> {guide.label}
          </button>
          <button type="button" onClick={() => navigate('/resources')} className={FINELY_OS_SECONDARY_BTN}>
            Resources hub
          </button>
        </div>
      ) : null}
      <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </section>
  );
}
