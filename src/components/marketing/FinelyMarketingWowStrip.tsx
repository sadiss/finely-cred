import React from 'react';
import { Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { FINELY_WOW_CHIPS, type FinelyWowChip } from '../../config/finelyMarketingDifferentiators';
import { finelyCtaNavigate, resolveFinelyCtaPath } from '../../lib/finelyCtaIntent';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_SECONDARY_BTN,
  finelyOsDeckTile,
} from '../../features/os/finelyOsLightUi';
import { MARKETING_HUB_CONTENT_SHELL } from '../../features/marketingDepartment/marketingHubUi';

type Props = {
  chips?: FinelyWowChip[];
  title?: string;
  subtitle?: string;
  compact?: boolean;
  className?: string;
};

/** Wow differentiators as a card grid — not a flat chip list. */
export function FinelyMarketingWowStrip({
  chips = FINELY_WOW_CHIPS,
  title = 'Why Finely feels different',
  subtitle = 'Live portal tools, debt validation help, and credit-building financing.',
  compact = false,
  className = '',
}: Props) {
  const navigate = useNavigate();
  const auth = useAuth();
  const visible = compact ? chips.slice(0, 4) : chips.slice(0, 6);

  const resolveChipPath = (chip: FinelyWowChip) => {
    if (chip.path === '/free-guide') {
      return resolveFinelyCtaPath('personal_free_guide', { isAuthed: Boolean(auth.user) });
    }
    return chip.path;
  };

  return (
    <section className={`${MARKETING_HUB_CONTENT_SHELL} space-y-3 ${className}`} data-fc-accent="emerald">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-2 text-emerald-300/90 text-[10px] font-black uppercase tracking-[0.2em]">
            <Sparkles size={12} /> Finely edge
          </div>
          <h3 className={`mt-1 font-bold text-white ${compact ? 'text-base' : 'text-xl'}`}>{title}</h3>
          {!compact ? <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{subtitle}</p> : null}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {visible.map((chip) => (
          <button
            key={chip.id}
            type="button"
            className={`${finelyOsDeckTile(chip.accent)} !p-3 text-left`}
            title={chip.hint}
            onClick={() => chip.path && navigate(resolveChipPath(chip)!)}
          >
            <span className={FINELY_OS_ENTITY_SUBLABEL}>{chip.label}</span>
            <span className={`block mt-1 text-[11px] font-normal normal-case tracking-normal leading-snug ${FINELY_OS_ENTITY_BODY}`}>
              {chip.hint}
            </span>
          </button>
        ))}
      </div>
      {!compact ? (
        <button
          type="button"
          className={`${FINELY_OS_SECONDARY_BTN} inline-flex items-center gap-2 text-xs`}
          onClick={() => finelyCtaNavigate(navigate, 'personal_free_trial', { isAuthed: Boolean(auth.user) })}
        >
          Start free trial
        </button>
      ) : null}
    </section>
  );
}
