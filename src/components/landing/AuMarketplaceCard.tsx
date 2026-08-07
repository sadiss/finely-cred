/** Shared AU marketplace plastic card — homepage seller band + /tradelines inventory. */
import React from 'react';
import './landingSellBands.css';

export type AuCardFinish = 'platinum' | 'gold' | 'obsidian' | 'emerald' | 'sapphire' | 'titanium';
export type AuCardNetwork = 'amex' | 'visa' | 'mastercard' | 'discover';

export type AuMarketplaceCardProps = {
  finish: AuCardFinish;
  issuer: string;
  tier: string;
  limit: string;
  age: string;
  slots: string;
  /** Last-4 style digits shown after masked PAN. */
  pan?: string;
  badge?: string;
  network: AuCardNetwork;
  caption?: string;
  className?: string;
};

const FINISH_TIER: Record<AuCardFinish, string> = {
  platinum: 'Platinum Revolving',
  gold: 'Gold Signature',
  obsidian: 'Obsidian Reserve',
  emerald: 'Emerald Rewards',
  sapphire: 'Sapphire Preferred',
  titanium: 'Titanium Everyday',
};

/** BIN-ish first digit hints → network (illustrative only). */
export function networkFromPan(pan: string): AuCardNetwork {
  const d = String(pan).replace(/\D/g, '');
  if (d.startsWith('3')) return 'amex';
  if (d.startsWith('4')) return 'visa';
  if (d.startsWith('5')) return 'mastercard';
  if (d.startsWith('6')) return 'discover';
  return 'visa';
}

export function defaultTierForFinish(finish: AuCardFinish): string {
  return FINISH_TIER[finish];
}

function AuNetworkMark({ network }: { network: AuCardNetwork }) {
  if (network === 'amex') {
    return (
      <span className="fc-au-card__network fc-au-card__network--amex" aria-hidden>
        AMEX
      </span>
    );
  }
  if (network === 'visa') {
    return (
      <span className="fc-au-card__network fc-au-card__network--visa" aria-hidden>
        VISA
      </span>
    );
  }
  if (network === 'discover') {
    return (
      <span className="fc-au-card__network fc-au-card__network--discover" aria-hidden>
        <i />
        DISCOVER
      </span>
    );
  }
  return (
    <span className="fc-au-card__network fc-au-card__network--mastercard" aria-hidden>
      <span />
      <span />
    </span>
  );
}

/**
 * Plastic-card mockup used on the homepage AU band and /tradelines inventory.
 * Finishes and network marks are illustrative — not live issuer branding assets.
 */
export function AuMarketplaceCard({
  finish,
  issuer,
  tier,
  limit,
  age,
  slots,
  pan,
  badge = 'Authorized user',
  network,
  caption,
  className = '',
}: AuMarketplaceCardProps) {
  return (
    <div className={className || undefined}>
      <article className={`fc-au-card fc-au-card--${finish}`}>
        <div className="fc-au-card__top">
          <div className="min-w-0">
            <p className="fc-au-card__issuer">{issuer}</p>
            <p className="fc-au-card__tier mt-1">{tier}</p>
          </div>
          <span className="fc-au-card__badge">{badge}</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="fc-au-card__chip" aria-hidden />
          {pan ? <span className="fc-au-card__pan">•••• •••• •••• {pan}</span> : null}
        </div>

        <div className="fc-au-card__bottom">
          <div className="flex gap-5">
            <div>
              <p className="fc-au-card__stat-label">Reported limit</p>
              <p className="fc-au-card__stat-value">{limit}</p>
            </div>
            <div>
              <p className="fc-au-card__stat-label">Seasoned</p>
              <p className="fc-au-card__stat-value">{age}</p>
            </div>
            <div>
              <p className="fc-au-card__stat-label">Open</p>
              <p className="fc-au-card__stat-value">{slots}</p>
            </div>
          </div>
          <AuNetworkMark network={network} />
        </div>
      </article>
      {caption ? <p className="fc-au-card-caption">{caption}</p> : null}
    </div>
  );
}
