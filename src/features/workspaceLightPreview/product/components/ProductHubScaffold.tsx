import React from 'react';
import { ArrowRight, Radio, type LucideIcon } from 'lucide-react';
import type {
  WorkspaceProductAccent,
  WorkspaceProductRole,
} from '../workspaceProductTokens';
import type { WorkspaceProductSurfaceMode } from '../workspaceProductNav';
import type { WorkspaceProductArchetype } from '../workspaceProductArchetypes';
import {
  ProductCommandHeader,
  ProductMetricGrid,
  ProductSectionHeader,
  type ProductMetric,
} from './ProductUi';
import { ArchSpectrumBar } from './archetypes/archetypeChrome';
import { contrastingAccent } from '../workspaceAccentArrangement';
import './productFoilLightBed.css';
import './productMetricBand.css';

export type ProductHubMetricsVariant = 'grid' | 'instrument' | 'inline' | 'jewel';

const FOIL_BY_ACCENT: Record<WorkspaceProductAccent, 'emerald' | 'violet' | 'platinum'> = {
  emerald: 'emerald',
  violet: 'violet',
  sky: 'platinum',
  rose: 'platinum',
  graphite: 'platinum',
};

/** Small header widget that varies by archetype — the header should differ, not just the body. */
function ArchetypeHeaderInsight({
  archetype,
  accent,
  metrics,
  freshness,
}: {
  archetype?: WorkspaceProductArchetype;
  accent: WorkspaceProductAccent;
  metrics?: ProductMetric[];
  freshness?: string;
}) {
  if (!archetype || archetype === 'command') return null;

  // The page root already carries `accent`; echoing it here would stack the same colour on itself.
  const insightAccent = contrastingAccent(accent);

  if (archetype === 'pipeline') {
    if (!metrics?.length) return null;
    return (
      <div className="fc-wlp-arch-header-strip" data-fcm-accent={insightAccent}>
        {metrics.slice(0, 4).map((metric) => (
          <span key={metric.label} className="fc-wlp-arch-header-strip-chip" data-accent={metric.accent}>
            <strong>{typeof metric.value === 'number' || typeof metric.value === 'string' ? metric.value : ''}</strong>
            <em>{metric.label}</em>
          </span>
        ))}
      </div>
    );
  }

  if (archetype === 'journey') {
    const count = Math.max(3, Math.min(6, metrics?.length || 4));
    return (
      <div className="fc-wlp-arch-header-spine" data-fcm-accent={insightAccent} aria-hidden>
        {Array.from({ length: count }).map((_, index) => (
          <span key={index} data-current={index === 1 ? 'true' : undefined} data-complete={index === 0 ? 'true' : undefined} />
        ))}
      </div>
    );
  }

  if (archetype === 'ledger') {
    if (!metrics?.length) return null;
    return (
      <div className="fc-wlp-arch-header-dense" data-fcm-accent={insightAccent}>
        {metrics.slice(0, 4).map((metric, index) => (
          <React.Fragment key={metric.label}>
            {index > 0 ? <span className="fc-wlp-arch-header-dense-dot" aria-hidden>·</span> : null}
            <span>
              <strong>{typeof metric.value === 'number' || typeof metric.value === 'string' ? metric.value : ''}</strong> {metric.label}
            </span>
          </React.Fragment>
        ))}
      </div>
    );
  }

  if (archetype === 'matrix') {
    return (
      <div className="fc-wlp-arch-header-compare" data-fcm-accent={insightAccent}>
        Comparing options side by side — one recommended column is highlighted below.
      </div>
    );
  }

  if (archetype === 'feed') {
    return (
      <div className="fc-wlp-arch-header-live" data-fcm-accent={insightAccent}>
        <Radio size={12} strokeWidth={2.4} />
        Connected · updated {freshness ?? 'just now'}
      </div>
    );
  }

  return null;
}

function renderFocusTitle(title: React.ReactNode, accent: WorkspaceProductAccent) {
  if (typeof title !== 'string') return title;
  return (
    <span className="fc-wlp-arch-header-focus-title">
      <span className={`fcm-foil fcm-foil--${FOIL_BY_ACCENT[accent]}`}>{title}</span>
      <span className="fc-wlp-arch-header-focus-jewel fcm-jewel" data-fcm-accent={accent} aria-hidden />
    </span>
  );
}

function ProductHeaderMetrics({
  metrics,
  variant,
  metricTitle,
  metricDescription,
}: {
  metrics: ProductMetric[];
  variant: ProductHubMetricsVariant;
  metricTitle: string;
  metricDescription: string;
}) {
  if (variant === 'grid') {
    return (
      <section className="fc-wlp-section">
        <ProductSectionHeader eyebrow="Workspace summary" title={metricTitle} description={metricDescription} />
        <ProductMetricGrid items={metrics} />
      </section>
    );
  }

  if (variant === 'instrument') {
    const numericMax = Math.max(1, ...metrics.map((metric) => (typeof metric.value === 'number' ? metric.value : 0)));
    return (
      <section className="fc-wlp-section">
        <ProductSectionHeader eyebrow="Workspace summary" title={metricTitle} description={metricDescription} />
        <div className="fc-wlp-arch-metrics-instrument">
          {metrics.map((metric) => {
            const Icon = metric.icon;
            return (
              <button
                key={metric.label}
                type="button"
                className="fc-wlp-arch-metrics-instrument-row"
                data-accent={metric.accent}
                onClick={metric.onClick}
                disabled={!metric.onClick}
              >
                <span className="fc-wlp-arch-metrics-instrument-label">
                  {Icon ? <Icon size={15} strokeWidth={2} /> : null}
                  {metric.label}
                </span>
                {typeof metric.value === 'number' ? (
                  <ArchSpectrumBar value={metric.value} max={numericMax} accent={metric.accent} />
                ) : (
                  <span className="fc-wlp-arch-metrics-instrument-value">{metric.value}</span>
                )}
                <span className="fc-wlp-arch-metrics-instrument-hint">{metric.hint}</span>
              </button>
            );
          })}
        </div>
      </section>
    );
  }

  if (variant === 'jewel') {
    return (
      <section className="fc-wlp-section">
        <ProductSectionHeader eyebrow="Workspace summary" title={metricTitle} description={metricDescription} />
        <div className="fc-wlp-arch-metrics-jewel">
          {metrics.map((metric) => (
            <button
              key={metric.label}
              type="button"
              className="fc-wlp-arch-metrics-jewel-item"
              data-accent={metric.accent}
              onClick={metric.onClick}
              disabled={!metric.onClick}
            >
              <span className="fcm-jewel" data-fcm-accent={metric.accent} aria-hidden />
              <span className={`fcm-foil fcm-foil--${FOIL_BY_ACCENT[metric.accent]}`}>{metric.value}</span>
              <em>{metric.label}</em>
            </button>
          ))}
        </div>
      </section>
    );
  }

  // inline — compact chips, no dedicated section header, kept next to the command header.
  return (
    <div className="fc-wlp-arch-metrics-inline">
      {metrics.map((metric) => (
        <button
          key={metric.label}
          type="button"
          className="fc-wlp-arch-metrics-inline-chip"
          data-accent={metric.accent}
          onClick={metric.onClick}
          disabled={!metric.onClick}
        >
          <strong>{metric.value}</strong>
          <span>{metric.label}</span>
        </button>
      ))}
    </div>
  );
}

export function ProductHubScaffold({
  role,
  eyebrow,
  title,
  description,
  status,
  freshness = 'just now',
  accent,
  surfaceMode,
  primaryAction,
  secondaryAction,
  metrics,
  metricTitle = 'What matters now',
  metricDescription = 'Open a signal to move directly into the work behind it.',
  icon: Icon,
  archetype,
  metricsVariant = 'grid',
  pageId,
  children,
}: {
  role: WorkspaceProductRole;
  eyebrow: string;
  title: string;
  description: string;
  status?: string;
  freshness?: string;
  accent: WorkspaceProductAccent;
  surfaceMode: WorkspaceProductSurfaceMode;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  metrics?: ProductMetric[];
  metricTitle?: string;
  metricDescription?: string;
  icon?: LucideIcon;
  /** Body layout id from `workspaceProductArchetypes.ts`. Omit to keep the original scaffold byte-identical. */
  archetype?: WorkspaceProductArchetype;
  /** How `metrics` render. Defaults to today's grid so omitting `archetype` never changes existing pages. */
  metricsVariant?: ProductHubMetricsVariant;
  /** Scopes page-specific typography and layout overrides without touching shared tokens. */
  pageId?: string;
  children: React.ReactNode;
}) {
  const visibleStatus = status
    ?.replace(/\s*·\s*(?:demo|live)\s+data\b/gi, '')
    .replace(/\b(?:demo|live)\s+data\b/gi, 'workspace data');
  const visibleFreshness = /^(?:demo snapshot|live snapshot)$/i.test(freshness) ? 'ready now' : freshness;
  const headerTitle = archetype === 'focus' ? renderFocusTitle(title, accent) : title;
  const headerInsight = archetype ? (
    <ArchetypeHeaderInsight archetype={archetype} accent={accent} metrics={metrics} freshness={visibleFreshness} />
  ) : null;

  return (
    <div
      className="fc-wlp-stack fc-wlp-product-page"
      data-surface-mode={surfaceMode}
      data-page-accent={accent}
      data-archetype={archetype}
      data-page-id={pageId}
      data-fcm-accent={accent}
    >
      <ProductCommandHeader
        roleLabel={`${role === 'admin' ? 'Admin workspace' : 'Partner portal'} · ${eyebrow}`}
        title={headerTitle}
        description={description}
        status={visibleStatus}
        freshness={visibleFreshness}
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
        insight={headerInsight}
      >
        {Icon ? (
          <div className="fc-wlp-page-signature" aria-hidden>
            <Icon size={28} strokeWidth={1.9} />
            <span />
          </div>
        ) : null}
      </ProductCommandHeader>

      {metrics?.length ? (
        <ProductHeaderMetrics
          metrics={metrics}
          variant={metricsVariant}
          metricTitle={metricTitle}
          metricDescription={metricDescription}
        />
      ) : null}

      {children}
    </div>
  );
}

export function ProductPagePrimaryAction({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button type="button" className="fc-wlp-btn-primary" onClick={onClick} disabled={disabled}>
      {label} <ArrowRight size={15} />
    </button>
  );
}
