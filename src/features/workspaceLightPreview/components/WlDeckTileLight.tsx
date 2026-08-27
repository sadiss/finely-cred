import React from 'react';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import type { WlAccent } from '../workspaceLightDesignTokens';
import type { FinelyOsIconAccent } from '../../os/FinelyOsIconBadge';
import { WlSolidDeck } from './WlContrastTiles';
import { wlAccentToAdminTone } from '../wlContrastMap';
import type { FcAdminTone } from '../../os/finelyOsAdminSurface';

export function WlDeckTileLight({
  accent,
  icon,
  iconAccent: _iconAccent,
  title,
  description,
  stat,
  onClick,
  tone,
}: {
  accent: WlAccent;
  icon: LucideIcon;
  iconAccent?: FinelyOsIconAccent;
  title: string;
  description?: string;
  stat?: string;
  onClick?: () => void;
  tone?: FcAdminTone;
}) {
  return (
    <WlSolidDeck
      tone={tone ?? wlAccentToAdminTone(accent)}
      icon={icon}
      title={title}
      description={description}
      stat={stat}
      onClick={onClick}
    />
  );
}
