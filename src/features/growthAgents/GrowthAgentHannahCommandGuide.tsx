import React, { useMemo, useState } from 'react';
import { CircleHelp } from 'lucide-react';
import { FinelyOsWorkstationModal } from '../os/FinelyOsWorkstationModal';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowKpi,
} from '../os/finelyOsLightUi';
import { getHannahMaturity } from './growthAgentMaturity';

const SECTIONS = [
  { id: 'score', title: 'Ready %', blurb: 'Copy link once' },
  { id: 'factory', title: 'Link factory', blurb: 'Every lane · UTM chips' },
  { id: 'queue', title: 'Approve queue', blurb: 'Before webhooks fire' },
  { id: 'desk', title: 'Marketing Desk', blurb: 'Board · Mail · Find' },
] as const;

const BUTTONS: Array<{ group: typeof SECTIONS[number]['id']; name: string; does: string }> = [
  {
    group: 'factory',
    name: 'Copy tracked link',
    does: 'Full URL with utm_source=growth_agent_hannah, lane campaign, optional video utm_content.',
  },
  {
    group: 'factory',
    name: 'Lane magnet row',
    does: 'One-tap copy per offer lane — same referral code across magnets.',
  },
  {
    group: 'factory',
    name: 'UTM chips',
    does: 'Copy individual params when a platform wants fields split (Meta, directories).',
  },
  {
    group: 'queue',
    name: 'Approve in queue',
    does: 'Marks distribution job approved locally — run webhooks from Lead Acquisition.',
  },
  {
    group: 'queue',
    name: 'Open Lead Acquisition',
    does: 'Feeds, webhook POST, and distribution job runner.',
  },
  {
    group: 'desk',
    name: 'Marketing Desk · Board',
    does: 'Track partners after syndicated guide signups land in CRM.',
  },
  {
    group: 'desk',
    name: 'Marketing Desk · Mail',
    does: 'Cold sequences after capture — pause on reply.',
  },
];

export function GrowthAgentHannahCommandGuide({ tick = 0 }: { tick?: number }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<(typeof SECTIONS)[number]['id']>('score');

  const maturity = useMemo(() => {
    void tick;
    return getHannahMaturity();
  }, [tick]);

  const filtered = BUTTONS.filter((b) => b.group === active);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setActive('score');
          setOpen(true);
        }}
        className={`${finelyOsGlowKpi('amber')} inline-flex items-center gap-2 !px-3 !py-2 text-left w-full sm:w-auto`}
        aria-expanded={open}
      >
        <CircleHelp size={18} className="shrink-0 text-amber-200" aria-hidden />
        <span>
          <span className="block text-xs font-black uppercase tracking-widest text-amber-100/90">Command guide</span>
          <span className="block text-[11px] font-medium text-white/75 leading-snug">Links · UTM · approve queue</span>
        </span>
      </button>

      <FinelyOsWorkstationModal
        open={open}
        onClose={() => setOpen(false)}
        title="How to run Hannah (Capture & Links)"
        subtitle="Growth · Syndication-safe URLs"
        accent="amber"
        size="large"
        footer={
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setOpen(false)}>
            Got it — close
          </button>
        }
      >
        <div className="space-y-4">
          <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
            Educational only · results vary · not legal advice. Approve copy before RSS or webhooks post.
          </p>

          <div className="flex flex-col lg:flex-row gap-3">
            <nav className="lg:w-48 shrink-0 flex lg:flex-col flex-wrap gap-1.5" aria-label="Guide sections">
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

            <div className={`flex-1 min-w-0 ${finelyOsCatalogCardCompact('amber')} !p-4`}>
              {active === 'score' ? (
                <ul className={`space-y-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  {maturity.items.map((i) => (
                    <li key={i.id} className={i.done ? 'text-emerald-200/95' : 'text-amber-100/95'}>
                      {i.done ? '✓' : '○'} {i.label}
                    </li>
                  ))}
                </ul>
              ) : active === 'desk' ? (
                <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  After partners click your link, Caleb and the Desk handle find + mail. Hannah only owns attribution on the URL.
                </p>
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
