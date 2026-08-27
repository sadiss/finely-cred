import React from 'react';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import type { WlAccent } from '../workspaceLightDesignTokens';
import { WlSectionHeader } from './WlSectionHeader';
import { WlSolidDeck, WlSkyShelf } from './WlContrastTiles';
import type { FcAdminTone } from '../../os/finelyOsAdminSurface';
import { FinelyOsIconBadge } from '../../os/FinelyOsIconBadge';
import type { FinelyOsIconAccent } from '../../os/FinelyOsIconBadge';
import { wlAccentToAdminTone } from '../wlContrastMap';

export type WlModuleCard = {
  title: string;
  description: string;
  path: string;
  icon: LucideIcon;
  stat: string;
};

const DECK_TONES: FcAdminTone[] = ['emerald', 'violet', 'sky', 'rose', 'navy', 'fuchsia'];
const ICON_ACCENTS: FinelyOsIconAccent[] = ['violet', 'emerald', 'sky', 'rose', 'fuchsia', 'navy'];

export function WlFeaturedBand({
  cards,
  onNavigate,
}: {
  cards: WlModuleCard[];
  onNavigate: (path: string) => void;
}) {
  return (
    <WlSkyShelf eyebrow="Featured · primary destinations" title="Start here">
      <div className="grid gap-3 sm:grid-cols-2">
        {cards.map((card, idx) => (
          <WlSolidDeck
            key={card.path}
            tone={DECK_TONES[idx % DECK_TONES.length]}
            icon={card.icon}
            title={card.title}
            description={card.description}
            stat={card.stat}
            onClick={() => onNavigate(card.path)}
          />
        ))}
      </div>
    </WlSkyShelf>
  );
}

export function WlModuleShelf({
  groupKey,
  title,
  subtitle,
  defaultOpen,
  cards,
  onNavigate,
}: {
  groupKey: string;
  title: string;
  subtitle: string;
  defaultOpen?: boolean;
  cards: WlModuleCard[];
  onNavigate: (path: string) => void;
}) {
  const shelfAccent: WlAccent =
    groupKey === 'core' ? 'emerald' : groupKey === 'comms' ? 'sky' : groupKey === 'automation' ? 'violet' : 'navy';

  return (
    <details className="fc-wl-module-shelf" data-fc-group={groupKey} data-fc-accent={shelfAccent} open={defaultOpen}>
      <summary>
        <div className="min-w-0">
          <div className="fc-wl-module-shelf-title">{title}</div>
          <div className="fc-wl-module-shelf-sub">{subtitle}</div>
        </div>
        <span className="fc-wl-module-count-chip">{cards.length} modules</span>
      </summary>
      <div className="fc-wl-module-shelf-body">
        {groupKey === 'core' || groupKey === 'automation' ? (
          <div className={`fc-wl-module-grid ${groupKey === 'core' ? 'fc-wl-module-grid--core' : 'fc-wl-module-grid--auto'}`}>
            {cards.map((card, idx) => (
              <WlSolidDeck
                key={card.path}
                tone={DECK_TONES[idx % DECK_TONES.length]}
                icon={card.icon}
                title={card.title}
                description={card.description}
                stat={card.stat}
                onClick={() => onNavigate(card.path)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {cards.map((card, idx) => (
              <button
                key={card.path}
                type="button"
                onClick={() => onNavigate(card.path)}
                className="fc-wl-module-row-tinted"
                data-fc-tone={wlAccentToAdminTone(shelfAccent)}
              >
                <FinelyOsIconBadge icon={card.icon} accent={ICON_ACCENTS[(idx + 2) % ICON_ACCENTS.length]} size={14} className="p-2" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-[#0a1628]">{card.title}</span>
                  <span className="block truncate text-[11px] text-slate-600">{card.stat}</span>
                </span>
                <ArrowRight size={14} className="shrink-0 text-violet-600" />
              </button>
            ))}
          </div>
        )}
      </div>
    </details>
  );
}
