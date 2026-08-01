import React, { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AU_IS_NOT_DTI_CALLOUT,
  FANNIE_AU_RULE_SUMMARIES,
  RAPID_RESCORE_CALLOUT,
  REAL_ESTATE_COMPLIANCE_FOOTNOTES,
  REAL_ESTATE_ONBOARDING_STEPS,
  REAL_ESTATE_PLAYBOOK_LEVERS,
  REAL_ESTATE_PLAYBOOK_META,
  type RealEstatePlaybookLever,
  type RealEstatePlaybookLeverId,
} from '../../config/realEstatePartnerPlaybook';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCardCompact,
} from '../../features/os/finelyOsLightUi';

type PanelMode = 'levers' | 'onboarding' | 'rules' | 'full';

export type RealEstatePlaybookPanelProps = {
  /** Default `levers` — compact embed for AU/DTI tools. */
  mode?: PanelMode;
  /** Limit which levers render (e.g. AU + rescore only). */
  leverIds?: RealEstatePlaybookLeverId[];
  defaultOpen?: boolean;
  className?: string;
  title?: string;
};

function LeverRow({ lever }: { lever: RealEstatePlaybookLever }) {
  return (
    <details className={`${finelyOsCatalogCardCompact(lever.accent)} group !p-3`}>
      <summary className="cursor-pointer select-none list-none">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{lever.title}</div>
            <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{lever.howItHelps}</p>
          </div>
          <span className="shrink-0 text-[10px] uppercase tracking-widest text-white/40 group-open:text-emerald-300/80">
            Expand
          </span>
        </div>
      </summary>
      <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          <span className="text-amber-200/90">Underwriter caveat: </span>
          {lever.underwriterCaveat}
        </p>
        {lever.bullets.length ? (
          <ul className={`list-disc pl-4 space-y-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
            {lever.bullets.map((b) => (
              <li key={b.slice(0, 56)}>{b}</li>
            ))}
          </ul>
        ) : null}
        {lever.guideRefs?.length ? (
          <p className={`${FINELY_OS_ENTITY_SUBLABEL} text-white/45`}>Refs: {lever.guideRefs.join(' · ')}</p>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-1">
          <Link to={lever.finelyCtaPath} className={`${FINELY_OS_PRIMARY_BTN} !text-[11px]`}>
            {lever.finelyCtaLabel} <ArrowRight size={12} />
          </Link>
          {lever.secondaryCtaPath && lever.secondaryCtaLabel ? (
            <Link to={lever.secondaryCtaPath} className={`${FINELY_OS_SECONDARY_BTN} !text-[11px]`}>
              {lever.secondaryCtaLabel}
            </Link>
          ) : null}
        </div>
      </div>
    </details>
  );
}

/**
 * Compact embeddable playbook for Real Estate careers, AU marketplace, and DTI coaching surfaces.
 */
export function RealEstatePlaybookPanel({
  mode = 'levers',
  leverIds,
  defaultOpen = false,
  className = '',
  title = REAL_ESTATE_PLAYBOOK_META.title,
}: RealEstatePlaybookPanelProps) {
  const [showRules, setShowRules] = useState(false);

  const levers = useMemo(() => {
    if (!leverIds?.length) return REAL_ESTATE_PLAYBOOK_LEVERS;
    const set = new Set(leverIds);
    return REAL_ESTATE_PLAYBOOK_LEVERS.filter((l) => set.has(l.id));
  }, [leverIds]);

  const showLevers = mode === 'levers' || mode === 'full';
  const showOnboarding = mode === 'onboarding' || mode === 'full';
  const showRulesBlock = mode === 'rules' || mode === 'full' || showRules;

  return (
    <section className={`${FINELY_OS_COMPACT_PAGE} ${className}`.trim()} data-fc-playbook="real-estate">
      <details open={defaultOpen} className={`${finelyOsCatalogCardCompact('violet')} group`}>
        <summary className="cursor-pointer select-none list-none">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex items-start gap-2">
              <BookOpen size={16} className="mt-0.5 shrink-0 text-amber-300/90" />
              <div>
                <h2 className={FINELY_OS_ENTITY_TITLE}>{title}</h2>
                <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{REAL_ESTATE_PLAYBOOK_META.subtitle}</p>
              </div>
            </div>
            <span className="shrink-0 text-[10px] uppercase tracking-widest text-white/40 group-open:text-emerald-300/80">
              Expand
            </span>
          </div>
        </summary>

        <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
          <FinelyOsAlertBanner
            tone="warning"
            message={`${AU_IS_NOT_DTI_CALLOUT.title} — ${AU_IS_NOT_DTI_CALLOUT.body}`}
          />
          <FinelyOsAlertBanner
            tone="info"
            message={`${RAPID_RESCORE_CALLOUT.title} — ${RAPID_RESCORE_CALLOUT.body}`}
          />

          <div className="flex flex-wrap gap-2">
            <Link to={AU_IS_NOT_DTI_CALLOUT.finelyCtaPath} className={`${FINELY_OS_PRIMARY_BTN} !text-[11px]`}>
              {AU_IS_NOT_DTI_CALLOUT.finelyCtaLabel} <ArrowRight size={12} />
            </Link>
            <Link to={AU_IS_NOT_DTI_CALLOUT.dtiCtaPath} className={`${FINELY_OS_SECONDARY_BTN} !text-[11px]`}>
              {AU_IS_NOT_DTI_CALLOUT.dtiCtaLabel}
            </Link>
            <Link to={RAPID_RESCORE_CALLOUT.finelyCtaPath} className={`${FINELY_OS_SECONDARY_BTN} !text-[11px]`}>
              {RAPID_RESCORE_CALLOUT.finelyCtaLabel}
            </Link>
            <Link to={REAL_ESTATE_PLAYBOOK_META.careersPath} className={`${FINELY_OS_SECONDARY_BTN} !text-[11px]`}>
              RE careers page
            </Link>
            {mode !== 'rules' && mode !== 'full' ? (
              <button
                type="button"
                className={`${FINELY_OS_SECONDARY_BTN} !text-[11px]`}
                onClick={() => setShowRules((v) => !v)}
              >
                <ShieldAlert size={12} /> {showRules ? 'Hide Fannie rules' : 'Fannie AU rules'}
              </button>
            ) : null}
          </div>

          {showLevers ? (
            <div className="space-y-2">
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Readiness levers</p>
              {levers.map((l) => (
                <LeverRow key={l.id} lever={l} />
              ))}
            </div>
          ) : null}

          {showOnboarding ? (
            <div className={`${finelyOsCatalogCardCompact('emerald')} !p-3 space-y-2`}>
              <p className={FINELY_OS_ENTITY_SUBLABEL}>RE affiliate onboarding</p>
              <ol className="space-y-2">
                {REAL_ESTATE_ONBOARDING_STEPS.map((s) => (
                  <li key={s.id} className="flex flex-wrap items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
                        {String(s.order).padStart(2, '0')} · {s.title}
                      </div>
                      <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{s.body}</p>
                    </div>
                    <Link to={s.path} className={`${FINELY_OS_SUCCESS_BTN} !text-[11px]`}>
                      {s.cta} <ArrowRight size={12} />
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          ) : null}

          {showRulesBlock ? (
            <div className={`${finelyOsCatalogCardCompact('amber')} !p-3 space-y-2`}>
              <p className={`${FINELY_OS_ENTITY_SUBLABEL} flex items-center gap-1.5`}>
                <ShieldAlert size={12} /> Fannie AU / DTI rules (educational)
              </p>
              <ul className="space-y-2">
                {FANNIE_AU_RULE_SUMMARIES.map((r) => (
                  <li key={r.id} className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                    <span className="text-amber-200/90 font-semibold">{r.citation}: </span>
                    {r.rule}
                    {r.effectiveNote ? (
                      <span className="mt-1 block text-white/45">Effective: {r.effectiveNote}</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>{REAL_ESTATE_COMPLIANCE_FOOTNOTES[0]}</p>
        </div>
      </details>
    </section>
  );
}

export default RealEstatePlaybookPanel;
