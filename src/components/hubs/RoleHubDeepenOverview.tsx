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
  finelyOsCatalogCardCompact,
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
 * Compact “You run / Finely runs” deepen band for CS · Affiliate · AU Seller hubs.
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
    <section className={`${finelyOsCatalogCardCompact(accent)} !p-4 space-y-3 ${className}`} data-fc-hub-deepen="1">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 space-y-1">
          <p className={FINELY_OS_ENTITY_SUBLABEL}>You run / Finely runs</p>
          <p className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{split.headline}</p>
        </div>
        {pathBadge ? (
          <span className="rounded-full border border-white/15 bg-black/25 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/70">
            {pathBadge}
          </span>
        ) : null}
      </div>

      {nextStep && nextPath ? (
        <div className="rounded-xl border border-white/12 bg-black/25 px-3 py-2.5 flex flex-wrap items-center justify-between gap-2">
          <div className="min-w-0">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Do this next</p>
            <p className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{nextStep.label}</p>
            <p className={`text-[11px] leading-snug ${FINELY_OS_ENTITY_BODY}`}>{nextStep.detail}</p>
          </div>
          <button type="button" onClick={() => navigate(nextPath)} className={FINELY_OS_PRIMARY_BTN}>
            Go <ArrowRight size={14} />
          </button>
        </div>
      ) : null}

      <div className="grid sm:grid-cols-3 gap-2">
        {[
          { t: 'You do', rows: split.youDo },
          { t: 'Finely runs', rows: split.finelyRuns },
          { t: 'Not your job', rows: split.notYourJob },
        ].map((col) => (
          <div key={col.t}>
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-1`}>{col.t}</div>
            <ul className={`text-xs ${FINELY_OS_ENTITY_BODY} space-y-1`}>
              {col.rows.slice(0, 3).map((r) => (
                <li key={r}>• {r}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {shot ? (
        <MarketingProductShot shot={shot} compact showCaption theme="dark" className="!p-3" />
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
      <p className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </section>
  );
}
