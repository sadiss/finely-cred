import React, { useState } from 'react';
import { ArrowUpRight, ChevronDown, ChevronRight, ExternalLink, ShieldAlert } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { escalationStepsForTrack, type EscalationTrack } from '../../lib/letterEscalationPaths';
import { adminEmbeddedNavHref } from '../../lib/adminPartnerRoutes';
import { REGULATORY_PORTALS } from '../../lib/legalResources';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

export function LetterEscalationPanel({
  track,
  accent = 'amber',
  compact = false,
  adminPartnerId,
}: {
  track: EscalationTrack;
  accent?: 'amber' | 'violet' | 'sky' | 'emerald' | 'fuchsia';
  compact?: boolean;
  adminPartnerId?: string;
}) {
  const navigate = useNavigate();
  const nav = (href: string) => adminEmbeddedNavHref(adminPartnerId, href);
  const steps = escalationStepsForTrack(track);
  const [openLevel, setOpenLevel] = useState<number>(1);

  const headline =
    track === 'bureau_dispute'
      ? 'Bureau escalation ladder'
      : track === 'debt_court'
        ? 'Court escalation ladder'
        : 'Validation escalation ladder';

  const levelAccent =
    track === 'debt_court' ? 'text-fuchsia-300' : track === 'debt_validation' ? 'text-emerald-300' : 'text-amber-300';
  const iconAccent =
    track === 'debt_court' ? 'text-fuchsia-300' : track === 'debt_validation' ? 'text-emerald-300' : 'text-sky-300';

  const shell = compact ? finelyOsCatalogCardCompact(accent) : finelyOsCatalogCardCompact(accent);

  return (
    <div className={`${shell} space-y-3`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldAlert size={14} className={iconAccent} />
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>{headline}</div>
            <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>If they ignore you — climb in order</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate(nav('/portal/escalations?tab=regulatory'))}>
            Open escalations
          </button>
          <Link to={nav('/portal/letters/vault')} className={FINELY_OS_SECONDARY_BTN}>
            Letters vault
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {REGULATORY_PORTALS.map((p) => (
          <a
            key={p.id}
            href={p.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-lg border border-white/10 bg-black/30 px-2.5 py-1.5 text-[10px] font-semibold text-amber-200 hover:bg-white/[0.05]"
          >
            {p.label} <ExternalLink size={10} />
          </a>
        ))}
      </div>

      <div className="space-y-1.5">
        {steps.map((step) => {
          const open = openLevel === step.level;
          return (
            <div key={step.level} className="rounded-xl border border-white/10 bg-black/25 overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenLevel(open ? 0 : step.level)}
                className="w-full text-left px-3 py-2.5 flex items-center justify-between gap-2 hover:bg-white/[0.03]"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-widest ${levelAccent}`}>L{step.level}</span>
                    <span className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{step.title}</span>
                    {step.timing ? <span className="text-[9px] text-white/40">{step.timing}</span> : null}
                  </div>
                </div>
                <span className="text-white/50 shrink-0">{open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}</span>
              </button>
              {open ? (
                <div className="px-3 pb-3 pt-0 space-y-2 border-t border-white/10">
                  <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                    <strong className="text-white/75">When:</strong> {step.when}
                  </p>
                  <ol className={`list-decimal pl-4 space-y-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                    {step.actions.map((a) => (
                      <li key={a}>{a}</li>
                    ))}
                  </ol>
                  <div className="flex flex-wrap gap-2">
                    <span className={finelyOsStatusChip('warn')}>{step.escalateTo}</span>
                    {step.externalUrl ? (
                      <a
                        href={step.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 hover:text-amber-200"
                      >
                        File now <ArrowUpRight size={10} />
                      </a>
                    ) : step.level >= 4 ? (
                      <button
                        type="button"
                        onClick={() => navigate(nav(`/portal/escalations?tab=regulatory&body=${step.level === 4 ? 'CFPB' : 'AG'}`))}
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 hover:text-amber-200"
                      >
                        Draft in Finely <ArrowUpRight size={10} />
                      </button>
                    ) : null}
                  </div>
                  <ul className={`list-disc pl-4 text-[10px] space-y-0.5 ${FINELY_OS_ENTITY_BODY}`}>
                    {step.evidenceChecklist.map((e) => (
                      <li key={e}>{e}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
      <p className={`text-[10px] ${FINELY_OS_ENTITY_BODY}`}>Educational only — not legal advice.</p>
    </div>
  );
}
