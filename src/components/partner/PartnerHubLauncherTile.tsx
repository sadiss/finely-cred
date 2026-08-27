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
  partnerHubIconShellClass,
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
      className={`${PARTNER_HUB_ACTION_TINT[accent]} group w-full min-h-[12.5rem] text-left p-6 lg:p-8 transition-transform hover:scale-[1.01] active:scale-[0.99]`}
      data-fc-accent={accent}
      data-fc-hub-launcher={id}
    >
      <div className="flex items-start justify-between gap-4">
        <span className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${partnerHubIconShellClass(accent)}`}>
          <Icon size={24} strokeWidth={2.1} />
        </span>
        {badge ? (
          <span className={`${FINELY_OS_ENTITY_SUBLABEL} rounded-full border border-white/25 px-3 py-1`}>{badge}</span>
        ) : null}
      </div>
      <div className={`mt-5 text-2xl font-extrabold tracking-tight ${FINELY_OS_ENTITY_VALUE}`}>{label}</div>
      <p className={`mt-3 text-base font-semibold leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>{description}</p>
      <div className="mt-6 flex items-center justify-between gap-3">
        {stat ? <span className={`${FINELY_OS_ENTITY_SUBLABEL} text-sm`}>{stat}</span> : <span />}
        <span className={`inline-flex items-center gap-2 text-sm font-extrabold ${FINELY_OS_ENTITY_SUBLABEL} group-hover:gap-3 transition-all`}>
          Open <ArrowRight size={16} />
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
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`} data-fc-partner-hub-launcher="1">
      {tiles.map((tile) => (
        <PartnerHubLauncherTile key={tile.id} {...tile} onOpen={onOpen} />
      ))}
    </div>
  );
}
