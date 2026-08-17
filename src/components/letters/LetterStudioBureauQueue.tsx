import React from 'react';
import type { Bureau } from '../../domain/creditReports';
import { bureauFullName } from '../../utils/bureaus';
import '../debt/validationDebtLayout.css';

const BUREAUS: Bureau[] = ['EXP', 'EQF', 'TUC'];

const BUREAU_STUDIO_CLASS: Record<Bureau, string> = {
  EXP: 'fc-bureau-studio-card--sky',
  EQF: 'fc-bureau-studio-card--rose',
  TUC: 'fc-bureau-studio-card--emerald',
};

function bureauNextStep(args: { active: boolean; hasItems: boolean; count: number }): string {
  if (!args.hasItems) return 'Select disputes in the picker first';
  if (args.active) return 'Finish reasons → generate PDF → save to Overview vault';
  return 'Tap to switch studio and work this bureau letter';
}

/** Full-width three-column bureau letter switcher — distinct from saved letter vault cards. */
export function LetterStudioBureauSwitcher({
  active,
  countsByBureau,
  onSelect,
  trailingActions,
}: {
  active: Bureau;
  countsByBureau: Record<Bureau, number>;
  onSelect: (b: Bureau) => void;
  /** Compact actions on the bureau switcher header row (e.g. attach screenshot). */
  trailingActions?: React.ReactNode;
}) {
  const withItems = BUREAUS.filter((b) => (countsByBureau[b] ?? 0) > 0);
  const activeName = bureauFullName(active);
  const activeCount = countsByBureau[active] ?? 0;

  if (withItems.length < 2 && !trailingActions) return null;

  return (
    <section
      id="fc-bureau-letter-switcher"
      className="fc-bureau-studio-shell w-full mt-6 pt-6 border-t-2 border-white/20 space-y-4 scroll-mt-6"
      data-fc-bureau-switcher="1"
    >
      <style>{`
        @keyframes fcBureauActivePulse {
          0%, 100% { box-shadow: 0 0 0 1px rgba(255,255,255,0.35), 0 0 28px rgba(251,191,36,0.35), inset 0 1px 0 rgba(255,255,255,0.2); }
          50% { box-shadow: 0 0 0 2px rgba(253,230,138,0.75), 0 0 44px rgba(251,191,36,0.55), inset 0 1px 0 rgba(255,255,255,0.28); }
        }
        @keyframes fcBureauTypewriterCaret {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
        .fc-bureau-studio-card--active {
          animation: fcBureauActivePulse 2.6s ease-in-out infinite;
        }
        .fc-bureau-studio-card__active-label {
          display: inline-block;
          font-size: 11px;
          font-weight: 900;
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: #fde68a;
          text-shadow: 0 0 18px rgba(251, 191, 36, 0.65);
        }
        .fc-bureau-studio-card__active-label::after {
          content: '|';
          margin-left: 2px;
          animation: fcBureauTypewriterCaret 1s step-end infinite;
          color: rgba(253, 230, 138, 0.9);
        }
      `}</style>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/90">Bureau letter studios</div>
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight mt-1">
            Working on: <span className="text-amber-100">{activeName}</span>
          </h3>
          <p className="mt-1 text-sm text-white/70 max-w-3xl">
            {withItems.length >= 2
              ? `Active studio: ${activeName} (${activeCount} negative${activeCount === 1 ? '' : 's'}). Tap another bureau to switch — each gets its own letter. Saved PDFs live under Overview.`
              : 'Attach bureau proof for this letter, then save PDF to Overview when you mail.'}
          </p>
        </div>
        {trailingActions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{trailingActions}</div> : null}
      </div>

      {withItems.length >= 2 ? (
        <div className="fc-bureau-studio-grid grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
          {BUREAUS.map((b) => {
            const n = countsByBureau[b] ?? 0;
            const hasItems = n > 0;
            const on = b === active;
            return (
              <button
                key={b}
                type="button"
                disabled={!hasItems}
                onClick={() => {
                  if (!hasItems) return;
                  onSelect(b);
                  requestAnimationFrame(() => {
                    document.getElementById('fc-focused-item')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  });
                }}
                aria-current={on ? 'true' : undefined}
                className={`fc-bureau-studio-card ${BUREAU_STUDIO_CLASS[b]} text-left ${on ? 'fc-bureau-studio-card--active' : ''} ${!hasItems ? 'opacity-35 cursor-not-allowed' : ''}`}
              >
                <div className="fc-bureau-studio-card__inner">
                  {on ? (
                    <div className="fc-bureau-studio-card__active-label">Active studio</div>
                  ) : (
                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-white/55">
                      {hasItems ? 'Switch studio' : 'No items yet'}
                    </div>
                  )}
                  <div className={`font-black mt-1 leading-tight text-white ${on ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'}`}>
                    {bureauFullName(b)}
                  </div>
                  <div className={`font-semibold mt-2 ${on ? 'text-sm text-amber-50/95' : 'text-sm text-white/80'}`}>
                    {hasItems ? `${n} negative${n === 1 ? '' : 's'} in this letter` : 'Select disputes first'}
                  </div>
                  <div
                    className={`mt-auto pt-3 text-[10px] font-black uppercase tracking-wider ${on ? 'text-amber-200/90' : 'text-white/55'}`}
                  >
                    {on ? 'You are here · keep building' : hasItems ? 'Tap to switch' : '—'}
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-white/65">
                    {bureauNextStep({ active: on, hasItems, count: n })}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      ) : null}
    </section>
  );
}

/** @deprecated Use LetterStudioBureauSwitcher */
export function LetterStudioBureauQueue(props: {
  active: Bureau;
  countsByBureau: Record<Bureau, number>;
  onSelect: (b: Bureau) => void;
}) {
  return <LetterStudioBureauSwitcher {...props} />;
}

export function LetterStudioBureauAccordion(_props: {
  active: Bureau;
  countsByBureau: Record<Bureau, number>;
  expandedBureau: Bureau | null;
  onToggle: (b: Bureau) => void;
  onSelect: (b: Bureau) => void;
}) {
  return null;
}
