import React from 'react';
import type { WorkspaceProductAccent } from '../workspaceProductTokens';
import './productFoilStat.css';

export type ProductFoilStatAccent = 'emerald' | 'platinum' | 'violet';

export type ProductFoilStatProps = {
  kicker: string;
  value: string | number;
  caption?: string;
  accent?: ProductFoilStatAccent;
  size?: 'sm' | 'md' | 'lg';
  jewel?: boolean;
  className?: string;
};

const ACCENT_MAP: Record<ProductFoilStatAccent, string> = {
  emerald: 'fcm-foil--emerald',
  platinum: 'fcm-foil--platinum',
  violet: 'fcm-foil--violet',
};

const SIZE_CLASS: Record<NonNullable<ProductFoilStatProps['size']>, string> = {
  sm: 'fc-wlp-foil-stat__value--sm',
  md: 'fc-wlp-foil-stat__value--md',
  lg: 'fc-wlp-foil-stat__value--lg',
};

const JEWEL_SIZE: Record<NonNullable<ProductFoilStatProps['size']>, string> = {
  sm: '40px',
  md: '48px',
  lg: '56px',
};

function accentFromWorkspace(accent?: ProductFoilStatAccent): ProductFoilStatAccent {
  return accent ?? 'emerald';
}

export function ProductFoilStat({
  kicker,
  value,
  caption,
  accent,
  size = 'md',
  jewel = false,
  className = '',
}: ProductFoilStatProps) {
  const foilAccent = accentFromWorkspace(accent);
  const foilClass = ACCENT_MAP[foilAccent];

  return (
    <div className={`fc-wlp-foil-stat fc-wlp-foil-stat--${size} ${className}`.trim()} data-fcm-accent={foilAccent}>
      <div className="fc-wlp-foil-stat__kicker">{kicker}</div>
      <div className="fc-wlp-foil-stat__value-row">
        {jewel ? (
          <span
            className="fcm-jewel fc-wlp-foil-stat__jewel"
            style={{ ['--fcm-jewel-size' as string]: JEWEL_SIZE[size] }}
            aria-hidden
          />
        ) : null}
        <span className={`fcm-foil ${foilClass} fc-wlp-foil-stat__value ${SIZE_CLASS[size]}`}>{value}</span>
      </div>
      {caption ? <div className="fc-wlp-foil-stat__caption">{caption}</div> : null}
    </div>
  );
}

/** Maps workspace accent tokens to foil-safe variants (rose/sky → emerald). */
export function workspaceAccentToFoil(accent: WorkspaceProductAccent): ProductFoilStatAccent {
  if (accent === 'violet') return 'violet';
  if (accent === 'graphite') return 'platinum';
  return 'emerald';
}
