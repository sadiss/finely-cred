import React, { useMemo, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { FinelyOsWorkstationModal } from '../os/FinelyOsWorkstationModal';
import { FinelyOsAlertBanner } from '../os/FinelyOsAlertBanner';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowKpi,
} from '../os/finelyOsLightUi';
import { getCalebMaturity } from './growthAgentMaturity';
import { getMarketingFindReadiness } from '../marketingDesk/marketingDeskHunt';

type GuideSection = {
  id: string;
  title: string;
  blurb: string;
};

const SECTIONS: GuideSection[] = [
  { id: 'score', title: 'Ready %', blurb: 'Setup checklist — not “code installed.”' },
  { id: 'hero', title: 'Top buttons', blurb: 'Find new people · Test search' },
  { id: 'desk', title: 'Marketing Desk', blurb: 'Daily pack · Review · Board' },
  { id: 'engine', title: 'Lead Engine card', blurb: 'Multi-lane · Run daily pack' },
  { id: 'infra', title: 'Infra strip', blurb: 'Flags · Test worker' },
  { id: 'rest', title: 'Everything else', blurb: 'CRM · Hannah · copilot · advanced' },
];

const BUTTONS: Array<{ group: string; name: string; does: string }> = [
  {
    group: 'hero',
    name: 'Find new people',
    does: 'One live hunt for this week’s city + restore lane. Saves strong matches to CRM; unsure ones go to Review in Marketing Desk.',
  },
  {
    group: 'hero',
    name: 'Test search',
    does: 'Single Serper ping through your Supabase lead-intel function. Pass = “Search tested successfully” on the checklist.',
  },
  {
    group: 'desk',
    name: 'Daily pack (Find room)',
    does: 'Runs up to 5 hunt lanes back-to-back (same city). Best after setup is green. Overnight cron can run the same pack once per night if “Find while I sleep” is On.',
  },
  {
    group: 'desk',
    name: 'Review people',
    does: 'Approve or skip staged finds before you email or move them on the Board.',
  },
  {
    group: 'desk',
    name: 'Open Board',
    does: 'Kanban for New → Talking → Booked. Drag cards as you follow up.',
  },
  {
    group: 'engine',
    name: 'Run daily pack (Lead Engine card)',
    does: 'Same idea as Marketing Desk daily pack — multi-lane Serper hunts → CRM + optional nurture tasks. Needs leadIntel flag + Serper secret on edge.',
  },
  {
    group: 'engine',
    name: 'Multi-lane hunt',
    does: 'Pick lanes/modifiers and run one batch with more control than one-tap Find.',
  },
  {
    group: 'infra',
    name: 'Test worker',
    does: 'Calls worker tick in simulation unless GROWTH_WORKER_LIVE=true on the server. Proves cron wiring — not a substitute for Find.',
  },
  {
    group: 'rest',
    name: 'Open settings',
    does: 'Turn on marketingDesk + leadIntel; confirm Supabase env in this browser.',
  },
  {
    group: 'rest',
    name: 'Suggest hunt from video topics',
    does: 'Prefills Marketing Desk Find from Esther’s pillar video + city (no auto-run).',
  },
  {
    group: 'rest',
    name: 'Hannah · guide links',
    does: 'Copy UTM links for free-guide signups — attribution shows on Growth Results.',
  },
  {
    group: 'rest',
    name: 'Lead Intelligence Director (copilot)',
    does: 'Strategy chat only. Live imports = Find / Daily pack / Lead Engine — not swarm simulation counters.',
  },
  {
    group: 'rest',
    name: 'Advanced find (Lead Intel hub)',
    does: 'Full hunt UI inside Caleb — same Serper path, more knobs.',
  },
];

export function GrowthAgentCalebCommandGuide({ tick = 0 }: { tick?: number }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string>('score');

  const maturity = useMemo(() => {
    void tick;
    return getCalebMaturity();
  }, [tick]);

  const readiness = useMemo(() => {
    void tick;
    return getMarketingFindReadiness();
  }, [tick]);

  const scrapeReady = maturity.percent >= 80 && readiness.ready;
  const openGuide = () => {
    setActive('score');
    setOpen(true);
  };

  const filtered = BUTTONS.filter((b) => b.group === active);

  return (
    <>
      <button
        type="button"
        onClick={openGuide}
        className={`${finelyOsGlowKpi('emerald')} inline-flex items-center gap-2 !px-3 !py-2 text-left w-full sm:w-auto`}
        aria-expanded={open}
      >
        <CircleHelp size={18} className="shrink-0 text-emerald-200" aria-hidden />
        <span>
          <span className="block text-xs font-black uppercase tracking-widest text-emerald-100/90">Command guide</span>
          <span className="block text-[11px] font-medium text-white/75 leading-snug">Every button · daily limits · 100% meaning</span>
        </span>
      </button>

      <FinelyOsWorkstationModal
        open={open}
        onClose={() => setOpen(false)}
        title="How to run Caleb (Find engine)"
        subtitle="Growth · Lead discovery"
        accent="emerald"
        size="large"
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>Results vary · not legal advice · respect site terms when contacting leads.</p>
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setOpen(false)}>
              Got it — close
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <FinelyOsAlertBanner
            tone={scrapeReady ? 'success' : 'warning'}
            message={
              scrapeReady
                ? 'Auto-find is the default — Caleb runs the daily pack until you turn auto off. Live Serper still needs server keys.'
                : `Finish Supabase + flags (auto turns Find on for you). ${maturity.percent}% on checklist.`
            }
          />

          <div className="grid sm:grid-cols-3 gap-2">
            <div className={finelyOsCatalogCardCompact('emerald')}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Checklist “100%”</div>
              <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                All 7 setup lines ✓ (flags, Supabase, Serper test, 5+ ML labels, worker probed once). Label says{' '}
                <strong className="text-white">Ready to hunt daily</strong> at ≥80%.
              </p>
            </div>
            <div className={finelyOsCatalogCardCompact('sky')}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Estimated daily volume</div>
              <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                Each lane asks Serper for up to <strong className="text-white">~20</strong> results. One-tap Find ≈{' '}
                <strong className="text-white">20 raw</strong> (often fewer saved after quality filters). Daily pack ≈{' '}
                <strong className="text-white">5 lanes → up to ~100 raw</strong> per run. Typical owner day: 1 pack + a few
                one-taps → <strong className="text-white">~30–80 useful contacts</strong> if Serper and enrichment cooperate
                (not guaranteed).
              </p>
            </div>
            <div className={finelyOsCatalogCardCompact('amber')}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Overnight</div>
              <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                With deploy + optional live worker: about <strong className="text-white">one pack per night</strong> when
                sleep mode is On — same caps as manual Daily pack. Practice mode / Overnight50 dashboards are ops simulation unless
                worker is live.
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-3">
            <nav className="lg:w-52 shrink-0 flex lg:flex-col flex-wrap gap-1.5" aria-label="Guide sections">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setActive(s.id)}
                  className={
                    active === s.id
                      ? `${FINELY_OS_PRIMARY_BTN} !justify-start text-left !py-2.5 !px-3 w-full`
                      : `${FINELY_OS_SECONDARY_BTN} !justify-start text-left !py-2.5 !px-3 w-full`
                  }
                >
                  <span className="block text-sm font-semibold">{s.title}</span>
                  <span className="block text-[10px] font-normal opacity-70">{s.blurb}</span>
                </button>
              ))}
            </nav>

            <div className={`flex-1 min-w-0 ${finelyOsCatalogCardCompact('violet')} !p-4`}>
              {active === 'score' ? (
                <ul className={`space-y-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  {maturity.items.map((i) => (
                    <li key={i.id} className={i.done ? 'text-emerald-200/95' : 'text-amber-100/95'}>
                      {i.done ? '✓' : '○'} {i.label}
                    </li>
                  ))}
                  <li className="pt-2 text-xs text-white/60">
                    Working or not → “Search: ready to run” means flags + Supabase + Serper path OK (same as Marketing Desk
                    Fix setup).
                  </li>
                </ul>
              ) : (
                <ul className="space-y-3">
                  {filtered.map((row) => (
                    <li key={row.name} className="rounded-xl border border-white/10 bg-black/25 p-3">
                      <div className="text-sm font-bold text-white">{row.name}</div>
                      <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{row.does}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </FinelyOsWorkstationModal>
    </>
  );
}
