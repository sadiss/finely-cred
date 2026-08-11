import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
} from '../../features/os/finelyOsLightUi';
import {
  PARTNER_HUB_ACTION_TINT,
  type PartnerHubLauncherAccent,
} from './partnerHubLauncherUi';

export type PartnerHubLauncherTileProps<T extends string = string> = {
  id: T;
  label: string;
  description: string;
  stat?: string;
  icon: LucideIcon;
  accent: PartnerHubLauncherAccent;
  badge?: string;
  onOpen: (id: T) => void;
};

export function PartnerHubLauncherTile<T extends string = string>({
  id,
  label,
  description,
  stat,
  icon: Icon,
  accent,
  badge,
  onOpen,
}: PartnerHubLauncherTileProps<T>) {
  return (
    <button
      type="button"
      onClick={() => onOpen(id)}
      className={`${PARTNER_HUB_ACTION_TINT[accent]} group w-full text-left !p-5 sm:!p-6 transition-transform hover:scale-[1.01] active:scale-[0.99]`}
      data-fc-accent={accent}
      data-fc-hub-launcher={id}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/15 bg-black/20 text-violet-800 group-hover:text-violet-900">
          <Icon size={22} />
        </span>
        {badge ? (
          <span className={`${FINELY_OS_ENTITY_SUBLABEL} rounded-full border border-current/20 px-2 py-0.5`}>{badge}</span>
        ) : null}
      </div>
      <div className={`mt-4 ${FINELY_OS_ENTITY_VALUE} text-lg`}>{label}</div>
      <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-sm leading-snug`}>{description}</p>
      <div className="mt-4 flex items-center justify-between gap-2">
        {stat ? <span className={FINELY_OS_ENTITY_SUBLABEL}>{stat}</span> : <span />}
        <span className={`inline-flex items-center gap-1 ${FINELY_OS_ENTITY_SUBLABEL} group-hover:gap-2 transition-all`}>
          Open <ArrowRight size={12} />
        </span>
      </div>
    </button>
  );
}

type GridProps<T extends string = string> = {
  tiles: Omit<PartnerHubLauncherTileProps<T>, 'onOpen'>[];
  onOpen: (id: T) => void;
  className?: string;
};

/** Launcher grid — 2 cols mobile, 3 cols desktop for 4–6 big glow tiles. */
export function PartnerHubLauncherGrid<T extends string = string>({ tiles, onOpen, className = '' }: GridProps<T>) {
  if (!tiles.length) return null;

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 ${className}`} data-fc-partner-hub-launcher="1">
      {tiles.map((tile) => (
        <PartnerHubLauncherTile key={tile.id} {...tile} onOpen={onOpen} />
      ))}
    </div>
  );
}
