import React from 'react';
import { Inbox } from 'lucide-react';
import type { WorkspaceProductAccent } from '../../workspaceProductTokens';
import { ProductSpectrumBar } from '../ProductInstruments';
import { toFcmAccent } from '../ProductUi';

/**
 * Shared empty/loading chrome for all six archetype layouts, so a brand-new partner with zero
 * items sees the same material quality as a populated page instead of a bare line of grey text.
 */
export function ArchetypeEmptyState({
  accent,
  title,
  description,
  action,
}: {
  accent: WorkspaceProductAccent;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="fc-wlp-arch-empty fcm-depth fcm-specular" data-fcm-accent={accent} data-bed="light">
      <div className="fc-wlp-arch-empty-body">
        <span className="fc-wlp-arch-empty-jewel fcm-jewel" aria-hidden />
        <h3 className="fc-wlp-arch-empty-title">{title}</h3>
        <p className="fc-wlp-arch-empty-copy">{description}</p>
        {action ? <div className="fc-wlp-arch-empty-action">{action}</div> : null}
      </div>
    </div>
  );
}

export function ArchetypeEmptyIcon({ size = 20 }: { size?: number }) {
  return <Inbox size={size} strokeWidth={1.9} />;
}

/**
 * Skeleton shapes tuned per archetype so the loading state previews the destination shape rather
 * than a single generic shimmer block.
 */
export function ArchetypeSkeleton({
  kind,
  accent,
}: {
  kind: 'focus' | 'pipeline' | 'journey' | 'ledger' | 'matrix' | 'feed';
  accent: WorkspaceProductAccent;
}) {
  return (
    <div className={`fc-wlp-arch-skeleton fc-wlp-arch-skeleton--${kind}`} data-fcm-accent={accent} aria-busy="true" aria-label="Loading">
      {kind === 'focus' ? (
        <>
          <div className="fc-wlp-arch-skeleton-hero" />
          <div className="fc-wlp-arch-skeleton-rail">
            {[0, 1, 2].map((row) => <div key={row} className="fc-wlp-arch-skeleton-chip" />)}
          </div>
        </>
      ) : null}
      {kind === 'pipeline' ? (
        <>
          {[0, 1, 2, 3].map((lane) => (
            <div key={lane} className="fc-wlp-arch-skeleton-lane">
              <div className="fc-wlp-arch-skeleton-lane-head" />
              {[0, 1].map((card) => <div key={card} className="fc-wlp-arch-skeleton-card" />)}
            </div>
          ))}
        </>
      ) : null}
      {kind === 'journey' ? (
        <>
          {[0, 1, 2, 3].map((step) => (
            <div key={step} className="fc-wlp-arch-skeleton-step">
              <div className="fc-wlp-arch-skeleton-marker" />
              <div className="fc-wlp-arch-skeleton-step-body" />
            </div>
          ))}
        </>
      ) : null}
      {kind === 'ledger' ? (
        <>
          <div className="fc-wlp-arch-skeleton-ledger-head" />
          {[0, 1, 2, 3, 4, 5].map((row) => <div key={row} className="fc-wlp-arch-skeleton-row" />)}
        </>
      ) : null}
      {kind === 'matrix' ? (
        <>
          {[0, 1, 2, 3].map((col) => (
            <div key={col} className="fc-wlp-arch-skeleton-col">
              <div className="fc-wlp-arch-skeleton-col-head" />
              {[0, 1, 2, 3].map((row) => <div key={row} className="fc-wlp-arch-skeleton-cell" />)}
            </div>
          ))}
        </>
      ) : null}
      {kind === 'feed' ? (
        <>
          <div className="fc-wlp-arch-skeleton-composer" />
          {[0, 1, 2, 3, 4].map((row) => <div key={row} className="fc-wlp-arch-skeleton-feed-row" />)}
        </>
      ) : null}
    </div>
  );
}

/**
 * Archetype-facing wrapper over the shared `ProductSpectrumBar` instrument.
 *
 * Kept as a thin adapter because the archetypes measure counts against a lane maximum,
 * while the instrument defaults to a 300–850 credit-score range.
 */
export function ArchSpectrumBar({ value, max, accent }: { value: number; max: number; accent?: WorkspaceProductAccent }) {
  return (
    <span className="fc-wlp-arch-spectrum">
      <ProductSpectrumBar
        value={value}
        min={0}
        max={max > 0 ? max : 1}
        accent={accent ? toFcmAccent(accent) : 'platinum'}
        size="sm"
      />
      <span className="fc-wlp-arch-spectrum-value">{value}</span>
    </span>
  );
}
