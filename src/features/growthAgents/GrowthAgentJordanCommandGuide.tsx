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
import { getJordanMaturity } from './growthAgentMaturity';

const SECTIONS = [
  { id: 'score', title: 'Ready %', blurb: 'Script · shots' },
  { id: 'script', title: 'Pillar script', blurb: 'Narration beats' },
  { id: 'shots', title: 'Shot list', blurb: 'Cuts · B-roll' },
  { id: 'hannah', title: 'Hannah UTM', blurb: 'Link factory' },
] as const;

export function GrowthAgentJordanCommandGuide({ tick = 0 }: { tick?: number }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<(typeof SECTIONS)[number]['id']>('score');

  const maturity = useMemo(() => {
    void tick;
    return getJordanMaturity();
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
          <span className="block text-[11px] font-medium text-white/75 leading-snug">Script · shots · Hannah</span>
        </span>
      </button>

      <FinelyOsWorkstationModal
        open={open}
        onClose={() => setOpen(false)}
        title="How to run Jordan (Media Producer)"
        subtitle="Growth · Pillar production"
        accent="fuchsia"
        footer={
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setOpen(false)}>
            Got it — close
          </button>
        }
      >
        <div className="space-y-4">
          <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
            Produce from one pillar upload — script and shot list stay compliance-safe. Promote opens Hannah with video attribution pre-filled.
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
              ) : active === 'script' ? (
                <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  Outline uses Content Studio asset script when present, else upload intel beats. Copy before recording voiceover or teleprompter run.
                </p>
              ) : active === 'shots' ? (
                <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  Shot list maps key topics to B-roll and CTA frames. Blur PII on bureau screenshots — educational framing only.
                </p>
              ) : (
                <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  Open Hannah UTM factory preloads videoId + utm_content from active pillar. Copy tracked link before publishing long-form or embedding on Lydia geo pages.
                </p>
              )}
            </div>
          </div>
        </div>
      </FinelyOsWorkstationModal>
    </>
  );
}
