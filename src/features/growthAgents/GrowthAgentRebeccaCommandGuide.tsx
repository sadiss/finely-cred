import React, { useMemo, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { FinelyOsWorkstationModal } from '../os/FinelyOsWorkstationModal';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowKpi,
} from '../os/finelyOsLightUi';
import { getRebeccaMaturity } from './growthAgentMaturity';

const SECTIONS = [
  { id: 'score', title: 'Ready %', blurb: 'Apply · nurture' },
  { id: 'metrics', title: 'Apply funnel', blurb: 'Captures · opt-in' },
  { id: 'mail', title: 'Mail handoff', blurb: 'Desk · specialist seq' },
] as const;

export function GrowthAgentRebeccaCommandGuide({ tick = 0 }: { tick?: number }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<(typeof SECTIONS)[number]['id']>('score');

  const maturity = useMemo(() => {
    void tick;
    return getRebeccaMaturity();
  }, [tick]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setActive('score');
          setOpen(true);
        }}
        className={`${finelyOsGlowKpi('violet')} inline-flex items-center gap-2 !px-3 !py-2 text-left w-full sm:w-auto`}
        aria-expanded={open}
      >
        <CircleHelp size={18} className="shrink-0 text-violet-200" aria-hidden />
        <span>
          <span className="block text-xs font-black uppercase tracking-widest text-violet-100/90">Command guide</span>
          <span className="block text-[11px] font-medium text-white/75 leading-snug">Apply funnel · nurture handoff</span>
        </span>
      </button>

      <FinelyOsWorkstationModal
        open={open}
        onClose={() => setOpen(false)}
        title="How to run Rebecca (Specialist Recruitment)"
        subtitle="Growth · Credit specialist apply"
        accent="violet"
        footer={
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setOpen(false)}>
            Got it — close
          </button>
        }
      >
        <div className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <nav className="lg:w-44 shrink-0 flex lg:flex-col flex-wrap gap-1.5">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(s.id)}
                  className={
                    active === s.id
                      ? `${FINELY_OS_PRIMARY_BTN} !justify-start text-left !py-2 !px-3 w-full`
                      : `${FINELY_OS_SECONDARY_BTN} !justify-start text-left !py-2 !px-3 w-full`
                  }
                >
                  <span className="block text-sm font-semibold">{s.title}</span>
                  <span className="block text-[10px] font-normal opacity-70">{s.blurb}</span>
                </button>
              ))}
            </nav>

            <div className={`flex-1 ${finelyOsCatalogCardCompact('violet')} !p-4`}>
              {active === 'score' ? (
                <ul className={`space-y-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  {maturity.items.map((i) => (
                    <li key={i.id} className={i.done ? 'text-emerald-200/95' : 'text-amber-100/95'}>
                      {i.done ? '✓' : '○'} {i.label}
                    </li>
                  ))}
                </ul>
              ) : active === 'metrics' ? (
                <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  Metrics pull from lead captures tagged specialist apply, guide, or acq_specialist campaign. Guide downloads warm the apply funnel — follow up when Mail is Ready.
                </p>
              ) : (
                <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  Open Desk · Mail with seq_specialist_apply_funnel filter to confirm enrollments, pause when booked, and resume when Comms Delivery is live. Results vary · not legal advice.
                </p>
              )}
            </div>
          </div>
        </div>
      </FinelyOsWorkstationModal>
    </>
  );
}
