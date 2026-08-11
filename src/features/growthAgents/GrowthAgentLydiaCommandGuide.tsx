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
import { getLydiaMaturity } from './growthAgentMaturity';
import { getGrowthWeekFocus } from './growthWeekFocus';

const SECTIONS = [
  { id: 'score', title: 'Ready %', blurb: 'Catalog · video SEO' },
  { id: 'local', title: 'Local checklist', blurb: 'Per Esther city' },
  { id: 'audit', title: 'Page audit', blurb: 'Titles · schema' },
  { id: 'desk', title: 'Desk & content', blurb: 'Board · Studio' },
] as const;

export function GrowthAgentLydiaCommandGuide({ tick = 0 }: { tick?: number }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<(typeof SECTIONS)[number]['id']>('score');

  const maturity = useMemo(() => {
    void tick;
    return getLydiaMaturity();
  }, [tick]);

  const focus = useMemo(() => {
    void tick;
    return getGrowthWeekFocus();
  }, [tick]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setActive('score');
          setOpen(true);
        }}
        className={`${finelyOsGlowKpi('sky')} inline-flex items-center gap-2 !px-3 !py-2 text-left w-full sm:w-auto`}
        aria-expanded={open}
      >
        <CircleHelp size={18} className="shrink-0 text-sky-200" aria-hidden />
        <span>
          <span className="block text-xs font-black uppercase tracking-widest text-sky-100/90">Command guide</span>
          <span className="block text-[11px] font-medium text-white/75 leading-snug">Local SEO · catalog audit</span>
        </span>
      </button>

      <FinelyOsWorkstationModal
        open={open}
        onClose={() => setOpen(false)}
        title="How to run Lydia (SEO & Local Pages)"
        subtitle="Growth · Public pages + geo"
        accent="sky"
        footer={
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setOpen(false)}>
            Got it — close
          </button>
        }
      >
        <div className="space-y-4">
          <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
            Results vary · not legal advice. Fix public routes before scaling local syndication with Hannah links.
          </p>

          <div className="flex flex-col lg:flex-row gap-3">
            <nav className="lg:w-44 shrink-0 flex lg:flex-col flex-wrap gap-1.5" aria-label="Guide sections">
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

            <div className={`flex-1 min-w-0 ${finelyOsCatalogCardCompact('sky')} !p-4`}>
              {active === 'score' ? (
                <ul className={`space-y-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  {maturity.items.map((i) => (
                    <li key={i.id} className={i.done ? 'text-emerald-200/95' : 'text-amber-100/95'}>
                      {i.done ? '✓' : '○'} {i.label}
                    </li>
                  ))}
                </ul>
              ) : active === 'local' ? (
                <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  Esther sets city + lane — Lydia checklist regenerates for {focus.city}. Complete items before posting geo pages or directory listings with Hannah UTM links.
                </p>
              ) : active === 'audit' ? (
                <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  Catalog audit scans publicSeoCatalog: title length, meta description, hasSchema. Video library routes pin to top when public resource videos exist.
                </p>
              ) : (
                <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  Marketing Desk Board tracks partners after local signups. Content Studio publishes pillar videos Miriam and Jordan repurpose — Lydia ensures resource URLs are SEO-clean first.
                </p>
              )}
            </div>
          </div>
        </div>
      </FinelyOsWorkstationModal>
    </>
  );
}
