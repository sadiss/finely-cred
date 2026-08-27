import React from 'react';
import './productCardObject.css';

export type ProductCardTier = 'platinum' | 'obsidian' | 'emerald' | 'verde' | 'sapphire' | 'titanium';

export type ProductCardObjectProps = {
  tier?: ProductCardTier;
  label: string;
  sublabel?: string;
  issuer?: string;
  last4?: string;
  status?: string;
  size?: 'sm' | 'md' | 'lg';
  showChip?: boolean;
  showHologram?: boolean;
  onClick?: () => void;
  className?: string;
};

function buildPan(last4?: string): string | null {
  if (!last4) return null;
  const digits = last4.replace(/\D/g, '').slice(-4);
  if (digits.length < 4) return null;
  return `•••• •••• •••• ${digits}`;
}

function buildAriaLabel(props: ProductCardObjectProps): string {
  const parts = [props.label];
  if (props.issuer) parts.push(props.issuer);
  if (props.last4) parts.push(`ending ${props.last4.slice(-4)}`);
  if (props.status) parts.push(props.status);
  return parts.join(' · ');
}

export function ProductCardObject({
  tier = 'platinum',
  label,
  sublabel,
  issuer,
  last4,
  status,
  size = 'md',
  showChip = true,
  showHologram = false,
  onClick,
  className = '',
}: ProductCardObjectProps) {
  const pan = buildPan(last4);
  const ariaLabel = buildAriaLabel({ tier, label, sublabel, issuer, last4, status, size, showChip, showHologram, onClick });

  const body = (
    <>
      <span className="fc-wlp-card__sheen" aria-hidden />
      <div className="fc-wlp-card__top">
        <div>
          {issuer ? <div className="fc-wlp-card__issuer">{issuer}</div> : null}
          <div className="fc-wlp-card__label">{label}</div>
          {sublabel ? <div className="fc-wlp-card__sublabel">{sublabel}</div> : null}
        </div>
        {status ? <span className="fc-wlp-card__badge">{status}</span> : null}
      </div>

      {showChip ? (
        <div className="fc-wlp-card__chip-row">
          <div className="fc-wlp-card__chip" aria-hidden>
            <div className="fc-wlp-card__chip-grid">
              {Array.from({ length: 6 }).map((_, index) => (
                <span key={index} />
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {pan ? <div className="fc-wlp-card__pan">{pan}</div> : null}

      {showHologram ? <span className="fc-wlp-card__hologram" aria-hidden /> : null}

      {status && !pan ? (
        <div className="fc-wlp-card__bottom">
          <div>
            <div className="fc-wlp-card__stat-label">Status</div>
            <div className="fc-wlp-card__stat-value">{status}</div>
          </div>
        </div>
      ) : null}
    </>
  );

  const classNames = ['fc-wlp-card', `fc-wlp-card--${tier}`, `fc-wlp-card--${size}`, className]
    .filter(Boolean)
    .join(' ');

  if (onClick) {
    return (
      <button type="button" className={classNames} onClick={onClick} aria-label={ariaLabel}>
        {body}
      </button>
    );
  }

  return (
    <div className={classNames} role="img" aria-label={ariaLabel}>
      {body}
    </div>
  );
}

/** Rotates workspace-safe card tiers (no gold). */
export const PRODUCT_CARD_TIERS: ProductCardTier[] = ['verde', 'obsidian', 'emerald', 'platinum', 'sapphire', 'titanium'];

export function productCardTierAt(index: number): ProductCardTier {
  return PRODUCT_CARD_TIERS[index % PRODUCT_CARD_TIERS.length];
}

/**
 * Maps a 0-100 readiness score to a card material.
 *
 * Deliberately banded rather than `productCardTierAt(score)`: that rotates on every whole
 * point, so a partner watching their score tick from 68 to 69 would see the card change
 * material for no reason. The card is a brand object, so its finish should mark real
 * progress and feel earned.
 *
 * The ramp is graphite → emerald → verde → obsidian: it warms toward the brand green as the
 * partner progresses and tops out on black. `sapphire` is excluded on purpose — the blue
 * reads cold against the brand and undercut the "this is worth having" feeling the card exists
 * to create.
 */
export function productCardTierForScore(score: number): ProductCardTier {
  const value = Number.isFinite(score) ? score : 0;
  if (value >= 85) return 'obsidian';
  if (value >= 68) return 'verde';
  if (value >= 45) return 'emerald';
  if (value >= 25) return 'platinum';
  return 'titanium';
}
