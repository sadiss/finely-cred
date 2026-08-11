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
import { getMiriamMaturity } from './growthAgentMaturity';

const SECTIONS = [
  { id: 'score', title: 'Ready %', blurb: 'Pillar · shorts pack' },
  { id: 'shorts', title: 'Shorts pack', blurb: 'Hooks · caption' },
  { id: 'calendar', title: 'Post calendar', blurb: 'Week stub' },
  { id: 'cta', title: 'Tracked CTA', blurb: 'Hannah link chip' },
] as const;

export function GrowthAgentMiriamCommandGuide({ tick = 0 }: { tick?: number }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<(typeof SECTIONS)[number]['id']>('score');

  const maturity = useMemo(() => {
    void tick;
    return getMiriamMaturity();
  }, [tick]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setActive('score');
          setOpen(true);
        }}
        className={`${finelyOsGlowKpi('fuchsia')} inline-flex items-center gap-2 !px-3 !py-2 text-left w-full sm:w-auto`}
        aria-expanded={open}
      >
        <CircleHelp size={18} className="shrink-0 text-fuchsia-200" aria-hidden />
        <span>
          <span className="block text-xs font-black uppercase tracking-widest text-fuchsia-100/90">Command guide</span>
          <span className="block text-[11px] font-medium text-white/75 leading-snug">Shorts · calendar · CTA</span>
        </span>
      </button>

      <FinelyOsWorkstationModal
        open={open}
        onClose={() => setOpen(false)}
        title="How to run Miriam (Social & Short Video)"
        subtitle="Growth · Shorts from pillar"
        accent="fuchsia"
        footer={
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setOpen(false)}>
            Got it — close
          </button>
        }
      >
        <div className="space-y-4">
          <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
            Educational only · results vary · not legal advice. Copy tracked Hannah link before posting — utm_content ties to pillar video.
          </p>

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

            <div className={`flex-1 ${finelyOsCatalogCardCompact('fuchsia')} !p-4`}>
              {active === 'score' ? (
                <ul className={`space-y-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  {maturity.items.map((i) => (
                    <li key={i.id} className={i.done ? 'text-emerald-200/95' : 'text-amber-100/95'}>
                      {i.done ? '✓' : '○'} {i.label}
                    </li>
                  ))}
                </ul>
              ) : active === 'shorts' ? (
                <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  Draft list pulls Hook A/B, caption, and hashtags from latest pillar upload intel. Copy full pack or individual rows before scheduling posts.
                </p>
              ) : active === 'calendar' ? (
                <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  Week stub suggests Mon/Wed/Fri slots — mark posted locally. Connect Meta API later; for now export captions + link to native schedulers.
                </p>
              ) : (
                <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  Tracked CTA chip copies Hannah guide URL with utm_source=growth_agent_miriam and video utm_content. Same link Jordan surfaces for long-form CTA cards.
                </p>
              )}
            </div>
          </div>
        </div>
      </FinelyOsWorkstationModal>
    </>
  );
}
