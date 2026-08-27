import React from 'react';
import { ArrowRight, Check, Clock3, Sparkles, X, type LucideIcon } from 'lucide-react';
import {
  WORKSPACE_PRODUCT_STATUS,
  type WorkspaceProductAccent,
  type WorkspaceProductStatus,
} from '../workspaceProductTokens';
import type { WorkspaceIntelligenceSignal } from '../data/workspaceProductIntelligence';
import { accentAt, intelligenceSurfaceStyles } from '../workspaceAccentArrangement';
import { ProductAnimatedNumber } from './ProductMotion';
import {
  fcmCornerWash,
  fcmDepth,
  fcmLacquer,
  type FcmAccent,
  type FcmBed,
  type FcmDivProps,
} from '../../../../styles/finelyMaterials';
import { bedAt } from '../workspaceAccentArrangement';
import './productBoxes.css';

/**
 * Box weight tier — see `ProductBoxSurface` below and the comment on
 * `ProductPanel`'s `emphasis` prop. Three tonal tiers, so nesting reads by
 * VALUE (lightness), not just by hue:
 *   - `quiet`    — containers. Near-white, hairline border, minimal/no fill.
 *                  Recedes so whatever it holds can step forward.
 *   - `raised`   — objects sitting inside a `quiet` container. Noticeably
 *                  more saturated accent fill + a real shadow — reads as an
 *                  object ON the panel, not a tile blending into it.
 *   - `featured` — roughly one dark-bed object per section. Strongest fill
 *                  + the accent glow ring + specular lacquer.
 *
 * `hero` and `standard` are kept as exact synonyms for `featured` and
 * `raised` (every selector below matches both) purely because
 * `ProductCollectionSurface.tsx` still passes those literal values — do not
 * remove them without updating that file too.
 */
export type ProductBoxEmphasis = 'featured' | 'raised' | 'quiet' | 'hero' | 'standard';

/** Maps the workspace's 5-accent palette onto the material layer's 5-accent palette (`graphite` has no direct fcm accent — it is the neutral/dark-plate case, so it resolves to `platinum`). */
export function toFcmAccent(accent: WorkspaceProductAccent): FcmAccent {
  return accent === 'graphite' ? 'platinum' : accent;
}

/** Prefixes an `fcm-*` helper's className with `pbx-layer` so it can be used as a full-bleed decorative child (see `productBoxes.css`) instead of the container class the helper assumes by default. */
function pbxLayer(props: FcmDivProps): FcmDivProps {
  return { ...props, className: `pbx-layer ${props.className}` };
}

/**
 * The shared "real surface" recipe: depth (`fcmDepth`) + a corner wash
 * (`fcmCornerWash`) on every non-`quiet` box, plus a specular lacquer sheen
 * (`fcmLacquer`) reserved for `featured`/`hero`-tier boxes only. Renders as the first
 * children of a `.pbx-object` root — absolutely positioned, so it never
 * consumes a CSS grid/flex track and content siblings simply paint above it
 * (see `.pbx-object > :not(.pbx-layer)` in `productBoxes.css`).
 *
 * The specular edge hairline + tier glow are NOT rendered here as an
 * `fcm-specular`/`fcm-glow-ring` child: both of those materials work via
 * `box-shadow`, which is not additive across classes on the same element
 * (see the header comment in `finelyMaterials.css`). Every box root already
 * carries its own drop shadow from `workspaceProduct.css`, so the hairline +
 * glow are composed into ONE combined `box-shadow` value per tier directly
 * in `productBoxes.css` (`.pbx-object[data-pbx-tier], [data-bed]`), reusing
 * the same `--fcm-hairline` / `--fcm-accent-rgb` tokens `fcm-specular` and
 * `fcm-glow-ring` use internally.
 */
export function ProductBoxSurface({
  accent,
  bed = 'light',
  tier = 'raised',
}: {
  accent: FcmAccent;
  bed?: FcmBed;
  tier?: ProductBoxEmphasis;
}) {
  const isFeatured = tier === 'hero' || tier === 'featured';
  return (
    <>
      <span {...pbxLayer(fcmDepth(accent, bed))} aria-hidden="true" />
      {tier !== 'quiet' ? <span {...pbxLayer(fcmCornerWash(accent, 'panel'))} aria-hidden="true" /> : null}
      {isFeatured ? <span {...pbxLayer(fcmLacquer(bed))} aria-hidden="true" /> : null}
    </>
  );
}

export type ProductBarSegment = {
  id: string;
  /** Share this segment takes up. Segments are normalized against their total, so callers can pass raw counts or percentages. */
  value: number;
  accent: WorkspaceProductAccent;
  label?: string;
};

/**
 * Multi-segment stacked distribution bar — the material-layer replacement for
 * a flat `<div style={{ background: someHex }} />` row of fills. Each
 * segment resolves its own `--fcm-accent-rgb` via `data-fcm-accent` (no
 * hardcoded hex), and gets a top-lit gradient instead of a single flat tint
 * so the bar reads as a lacquered strip rather than paint. Width is
 * `transition`-animated on value change; disabled under
 * `prefers-reduced-motion: reduce` (see `productBoxes.css`).
 */
export function ProductSegmentedBar({
  segments,
  bed = 'light',
  height = 8,
  ariaLabel,
}: {
  segments: ProductBarSegment[];
  bed?: FcmBed;
  height?: number;
  ariaLabel?: string;
}) {
  const total = segments.reduce((sum, segment) => sum + Math.max(0, segment.value), 0) || 1;
  const summary =
    ariaLabel ??
    segments
      .map((segment) => `${segment.label ?? segment.id}: ${Math.round((Math.max(0, segment.value) / total) * 100)}%`)
      .join(', ');
  return (
    <div
      className="pbx-segmented-bar"
      data-bed={bed}
      role="img"
      aria-label={summary}
      style={{ height }}
    >
      {segments.map((segment) => (
        <span
          key={segment.id}
          className="pbx-segmented-bar-fill"
          data-fcm-accent={toFcmAccent(segment.accent)}
          style={{ width: `${(Math.max(0, segment.value) / total) * 100}%` }}
        />
      ))}
    </div>
  );
}

export function ProductSectionHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="fc-wlp-section-head">
      <div className="fc-wlp-section-copy">
        {eyebrow ? <div className="fc-wlp-eyebrow">{eyebrow}</div> : null}
        <h2 className="fc-wlp-section-title">{title}</h2>
        {description ? <p className="fc-wlp-section-description">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

/**
 * Box weight tier — the fix for "every panel shouting equally". Panels are
 * containers, so they default to `quiet` (near-white, hairline border,
 * recedes) so whatever is `raised` inside them actually reads as an object
 * sitting ON the panel rather than blending into it. Pass `featured` for
 * roughly ONE panel per view that should read as the standout (specular
 * lacquer + accent glow ring); `raised` is available for a panel that
 * should read as an object rather than a container.
 */
export function ProductPanel({
  title,
  subtitle,
  accent,
  action,
  children,
  className = '',
  emphasis = 'quiet',
}: {
  title?: string;
  subtitle?: string;
  accent?: WorkspaceProductAccent;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  emphasis?: ProductBoxEmphasis;
}) {
  const fcmAccent: FcmAccent = accent ? toFcmAccent(accent) : 'platinum';
  const bed: FcmBed = accent === 'graphite' ? 'dark' : 'light';
  return (
    <section
      className={`fc-wlp-panel pbx-object ${className}`}
      data-accent={accent}
      data-fcm-accent={fcmAccent}
      data-bed={bed}
      data-pbx-tier={emphasis}
    >
      <ProductBoxSurface accent={fcmAccent} bed={bed} tier={emphasis} />
      {title || subtitle || action ? (
        <div className="fc-wlp-panel-head">
          <div>
            {title ? <h3 className="fc-wlp-panel-title">{title}</h3> : null}
            {subtitle ? <p className="fc-wlp-panel-subtitle">{subtitle}</p> : null}
          </div>
          {action}
        </div>
      ) : null}
      <div className="fc-wlp-panel-body">{children}</div>
    </section>
  );
}

export function ProductCommandHeader({
  roleLabel,
  title,
  description,
  status,
  freshness,
  primaryAction,
  secondaryAction,
  insight,
  aside,
  children,
}: {
  roleLabel: string;
  title: React.ReactNode;
  description: string;
  status?: string;
  freshness?: string;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  insight?: React.ReactNode;
  /** Hero-right feature object (e.g. the member card) — sits level with the greeting, not buried under the scores. */
  aside?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    // The command hero is always a dark panel, so it declares a dark bed. Shared dark-bed rules
    // (foil legibility lift, glass tertiary buttons, muted-copy contrast) key off this attribute
    // and were silently skipping the hero, which is why metallic headings faded out here.
    <section className="fc-wlp-command" data-bed="dark">
      <div className="fc-wlp-command-grid">
        <div>
          <span className="fc-wlp-command-badge">
            <Sparkles size={13} strokeWidth={2.2} aria-hidden />
            {roleLabel}
          </span>
          <h1 className="fc-wlp-command-title">{title}</h1>
          <p className="fc-wlp-command-copy">{description}</p>
          {status || freshness ? (
            <div className="fc-wlp-command-meta">
              {status ? <span>{status}</span> : null}
              {freshness ? <span>Updated {freshness}</span> : null}
            </div>
          ) : null}
          {insight ? <div className="fc-wlp-command-insight-slot">{insight}</div> : null}
          {children}
        </div>
        {aside || primaryAction || secondaryAction ? (
          <div className="fc-wlp-command-aside">
            {aside ? <div className="fc-wlp-command-aside-feature">{aside}</div> : null}
            {primaryAction || secondaryAction ? (
              <div className="fc-wlp-command-actions">
                {secondaryAction}
                {primaryAction}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="fc-wlp-command-line" aria-hidden />
    </section>
  );
}

export type ProductMetric = {
  label: string;
  value: React.ReactNode;
  hint: string;
  accent: WorkspaceProductAccent;
  icon?: LucideIcon;
  onClick?: () => void;
};

export function ProductMetricGrid({ items, startDark = false }: { items: ProductMetric[]; startDark?: boolean }) {
  return (
    <div className="fc-wlp-metrics">
      {items.map((item, index) => {
        const Icon = item.icon;
        const fcmAccent = toFcmAccent(item.accent);
        // Keep the color rotation and value rhythm, but use the light material family throughout.
        // The former black-heavy featured beds hid their gradients; featured now means a richer
        // tint and stronger glow, not a near-black tile.
        const featureBeat = bedAt(index, startDark) === 'dark';
        const bed = 'light' as const;
        const tier: ProductBoxEmphasis = featureBeat ? 'featured' : 'raised';
        const content = (
          <>
            <ProductBoxSurface accent={fcmAccent} bed={bed} tier={tier} />
            <div className="fc-wlp-metric-top">
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
                {Icon ? (
                  <span className="fc-wlp-metric-icon">
                    <Icon size={20} strokeWidth={2.15} />
                  </span>
                ) : null}
                <div className="fc-wlp-metric-label">{item.label}</div>
              </div>
              {item.onClick ? <ArrowRight size={15} /> : null}
            </div>
            <div className="fc-wlp-metric-value">
              {typeof item.value === 'number' ? <ProductAnimatedNumber value={item.value} /> : item.value}
            </div>
            <div className="fc-wlp-metric-hint">{item.hint}</div>
          </>
        );
        return item.onClick ? (
          <button
            key={item.label}
            type="button"
            className="fc-wlp-metric pbx-object"
            data-accent={item.accent}
            data-fcm-accent={fcmAccent}
            data-bed={bed}
            data-pbx-tier={tier}
            onClick={item.onClick}
          >
            {content}
          </button>
        ) : (
          <div
            key={item.label}
            className="fc-wlp-metric pbx-object"
            data-accent={item.accent}
            data-fcm-accent={fcmAccent}
            data-bed={bed}
            data-pbx-tier={tier}
          >
            {content}
          </div>
        );
      })}
    </div>
  );
}

export function ProductStatusPill({
  status,
  label,
}: {
  status: WorkspaceProductStatus;
  label?: string;
}) {
  const meta = WORKSPACE_PRODUCT_STATUS[status];
  const Icon = meta.icon;
  return (
    <span className="fc-wlp-status" data-tone={meta.tone}>
      <Icon size={13} strokeWidth={2.25} />
      {label ?? meta.label}
    </span>
  );
}

export function ProductIntelligenceCallout({
  signal,
  onOpen,
  dark = false,
  surfaceAccent,
}: {
  signal: WorkspaceIntelligenceSignal;
  onOpen?: () => void;
  dark?: boolean;
  /** Decorative panel contrast — overrides default purple wash when nested in an accented panel. */
  surfaceAccent?: WorkspaceProductAccent;
}) {
  const surfaceStyles = surfaceAccent ? intelligenceSurfaceStyles(surfaceAccent) : undefined;
  const content = (
    <>
      <span className="fc-wlp-intelligence-icon" style={surfaceStyles?.icon}>
        <Sparkles size={15} strokeWidth={2.2} />
      </span>
      <span className="fc-wlp-intelligence-copy">
        <span>{signal.label}</span>
        <strong>{signal.headline}</strong>
      </span>
      <span className="fc-wlp-intelligence-confidence">{signal.confidence} confidence</span>
      {onOpen ? <ArrowRight size={14} aria-hidden /> : null}
    </>
  );

  return onOpen ? (
    <button
      type="button"
      className="fc-wlp-intelligence"
      data-dark={dark ? 'true' : undefined}
      data-status={signal.status}
      style={surfaceStyles?.root}
      onClick={onOpen}
    >
      {content}
    </button>
  ) : (
    <div
      className="fc-wlp-intelligence"
      data-dark={dark ? 'true' : undefined}
      data-status={signal.status}
      style={surfaceStyles?.root}
    >
      {content}
    </div>
  );
}

export type ProductListItem = {
  id: string;
  title: string;
  description: string;
  status: WorkspaceProductStatus;
  statusLabel?: string;
  meta?: string;
  icon: LucideIcon;
  onClick?: () => void;
};

export function ProductActionList({
  items,
  emptyMessage = 'Nothing needs attention right now.',
  parentAccent,
}: {
  items: ProductListItem[];
  emptyMessage?: string;
  /** Accent of the surface this list sits on/beside, if any — threaded into `accentAt` so the on-deck mosaic's rotation never lands on a colour that clashes with its container. */
  parentAccent?: WorkspaceProductAccent;
}) {
  if (!items.length) {
    return (
      <div className="fc-wlp-empty">
        <Check size={22} />
        <div className="fc-wlp-empty-title">You are caught up</div>
        <p className="fc-wlp-empty-copy">{emptyMessage}</p>
      </div>
    );
  }

  const [primary, ...queued] = items;
  const primaryMeta = WORKSPACE_PRODUCT_STATUS[primary.status];
  const PrimaryIcon = primary.icon;

  return (
    <div className="fc-wlp-action-stage">
      <article className="fc-wlp-action-feature" data-tone={primaryMeta.tone}>
        <div className="fc-wlp-action-feature-top">
          <span className="fc-wlp-action-order">01</span>
          <span className="fc-wlp-action-feature-icon">
            <PrimaryIcon size={24} strokeWidth={2.05} />
          </span>
          <ProductStatusPill status={primary.status} label={primary.statusLabel} />
        </div>
        <div className="fc-wlp-action-kicker">Start here</div>
        <h3 className="fc-wlp-action-title">{primary.title}</h3>
        <p className="fc-wlp-action-copy">{primary.description}</p>
        <div className="fc-wlp-action-feature-foot">
          {primary.meta ? (
            <span className="fc-wlp-action-time">
              <Clock3 size={14} />
              {primary.meta}
            </span>
          ) : <span />}
          {primary.onClick ? (
            <button type="button" className="fc-wlp-action-open" onClick={primary.onClick}>
              Open this step <ArrowRight size={15} />
            </button>
          ) : null}
        </div>
      </article>

      {queued.length ? (
        <div className="fc-wlp-action-queue">
          <div className="fc-wlp-action-queue-label">
            <span>On deck</span>
            <span>{queued.length} step{queued.length === 1 ? '' : 's'} after this</span>
          </div>
          <div className="fc-wlp-action-mosaic">
            {queued.map((item, index) => {
              const Icon = item.icon;
              const meta = WORKSPACE_PRODUCT_STATUS[item.status];
              const accent = accentAt(index, { parent: parentAccent });
              const fcmAccent = toFcmAccent(accent);
              const content = (
                <>
                  <ProductBoxSurface accent={fcmAccent} bed="light" tier="raised" />
                  <span className="fc-wlp-action-mosaic-order">{String(index + 2).padStart(2, '0')}</span>
                  <span className="fc-wlp-action-mosaic-icon" data-accent={accent}>
                    <Icon size={22} strokeWidth={2.05} />
                  </span>
                  <span className="fc-wlp-action-mosaic-title">{item.title}</span>
                  <span className="fc-wlp-action-mosaic-meta">{item.meta ?? item.description}</span>
                  <span className="fc-wlp-action-mosaic-foot">
                    <ProductStatusPill status={item.status} label={item.statusLabel} />
                    {item.onClick ? <ArrowRight size={15} aria-hidden /> : null}
                  </span>
                </>
              );

              return item.onClick ? (
                <button
                  key={item.id}
                  type="button"
                  className="fc-wlp-action-mosaic-card pbx-object"
                  data-accent={accent}
                  data-fcm-accent={fcmAccent}
                  data-bed="light"
                  data-pbx-tier="raised"
                  data-tone={meta.tone}
                  onClick={item.onClick}
                >
                  {content}
                </button>
              ) : (
                <div
                  key={item.id}
                  className="fc-wlp-action-mosaic-card pbx-object"
                  data-accent={accent}
                  data-fcm-accent={fcmAccent}
                  data-bed="light"
                  data-pbx-tier="raised"
                  data-tone={meta.tone}
                >
                  {content}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export type ProductDockItem = {
  id: string;
  title: string;
  description: string;
  accent: WorkspaceProductAccent;
  icon: LucideIcon;
  onClick: () => void;
};

export function ProductWorkspaceDock({ items }: { items: ProductDockItem[] }) {
  return (
    <div className="fc-wlp-workspace-dock">
      {items.map((item) => {
        const Icon = item.icon;
        const fcmAccent = toFcmAccent(item.accent);
        return (
          <button
            key={item.id}
            type="button"
            className="fc-wlp-dock-item pbx-object"
            data-accent={item.accent}
            data-fcm-accent={fcmAccent}
            data-bed="light"
            data-pbx-tier="raised"
            onClick={item.onClick}
          >
            <ProductBoxSurface accent={fcmAccent} bed="light" tier="raised" />
            <span className="fc-wlp-dock-icon" data-accent={item.accent}>
              <Icon size={21} strokeWidth={2.05} />
            </span>
            <span>
              <span className="fc-wlp-dock-title">{item.title}</span>
              <span className="fc-wlp-dock-copy">{item.description}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export type ProductProgressStep = {
  id: string;
  label: string;
  description: string;
  complete?: boolean;
  current?: boolean;
};

export function ProductProgressRail({ steps }: { steps: ProductProgressStep[] }) {
  return (
    <div className="fc-wlp-journey" aria-label="Journey progress">
      {steps.map((step, index) => {
        const accent = accentAt(index);
        const fcmAccent = toFcmAccent(accent);
        const statusLabel = step.complete ? 'Done' : step.current ? 'You are here' : 'Up next';
        return (
          <div
            key={step.id}
            className="fc-wlp-journey-node"
            data-accent={accent}
            data-fcm-accent={fcmAccent}
            data-current={step.current ? 'true' : undefined}
            data-complete={step.complete ? 'true' : undefined}
          >
            <span className="fc-wlp-journey-marker" aria-hidden>
              {step.complete ? <Check size={17} strokeWidth={2.5} /> : index + 1}
            </span>
            <div className="fc-wlp-journey-card">
              <em className="fc-wlp-journey-kicker">{statusLabel}</em>
              <div className="fc-wlp-journey-title">{step.label}</div>
              <div className="fc-wlp-journey-copy">{step.description}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export type ProductActivityItem = {
  id: string;
  title: string;
  description: string;
  time: string;
  status: WorkspaceProductStatus;
  icon?: LucideIcon;
  accent?: WorkspaceProductAccent;
  onClick?: () => void;
};

export function ProductActivityDeck({ items }: { items: ProductActivityItem[] }) {
  if (!items.length) return null;

  return (
    <div className="fc-wlp-activity-deck">
      {items.map((item, index) => {
        const Icon = item.icon ?? Sparkles;
        const accent = item.accent ?? (['emerald', 'violet', 'sky', 'rose'] as const)[index % 4];
        const fcmAccent = toFcmAccent(accent);
        const tier: ProductBoxEmphasis = index === 0 ? 'featured' : 'raised';
        const body = (
          <>
            <ProductBoxSurface accent={fcmAccent} bed="light" tier={tier} />
            <span className="fc-wlp-activity-deck-icon" data-accent={accent}>
              <Icon size={20} strokeWidth={2.05} />
            </span>
            <span className="fc-wlp-activity-deck-copy">
              <strong>{item.title}</strong>
              <span>{item.description}</span>
              <em>{item.time}</em>
            </span>
            <ProductStatusPill status={item.status} />
          </>
        );

        return item.onClick ? (
          <button
            key={item.id}
            type="button"
            className="fc-wlp-activity-deck-card pbx-object"
            data-accent={accent}
            data-fcm-accent={fcmAccent}
            data-bed="light"
            data-pbx-tier={tier}
            data-featured={index === 0 ? 'true' : undefined}
            onClick={item.onClick}
          >
            {body}
          </button>
        ) : (
          <div
            key={item.id}
            className="fc-wlp-activity-deck-card pbx-object"
            data-accent={accent}
            data-fcm-accent={fcmAccent}
            data-bed="light"
            data-pbx-tier={tier}
            data-featured={index === 0 ? 'true' : undefined}
          >
            {body}
          </div>
        );
      })}
    </div>
  );
}

export type ProductHealthItem = {
  id: string;
  label: string;
  value: string;
  detail: string;
  status: WorkspaceProductStatus;
  accent?: WorkspaceProductAccent;
  onClick?: () => void;
};

export function ProductHealthLattice({ items }: { items: ProductHealthItem[] }) {
  return (
    <div className="fc-wlp-health-lattice">
      {items.map((item, index) => {
        const accent = item.accent ?? (['violet', 'emerald', 'sky', 'rose'] as const)[index % 4];
        const fcmAccent = toFcmAccent(accent);
        const tier: ProductBoxEmphasis = index === 0 ? 'featured' : 'raised';
        const body = (
          <>
            <ProductBoxSurface accent={fcmAccent} bed="light" tier={tier} />
            <span className="fc-wlp-health-lattice-value" style={{ color: `rgba(var(--fcm-accent-rgb), 0.94)` }}>
              {item.value}
            </span>
            <span className="fc-wlp-health-lattice-label">{item.label}</span>
            <span className="fc-wlp-health-lattice-detail">{item.detail}</span>
            <ProductStatusPill status={item.status} />
          </>
        );

        return item.onClick ? (
          <button
            key={item.id}
            type="button"
            className="fc-wlp-health-lattice-tile pbx-object"
            data-accent={accent}
            data-fcm-accent={fcmAccent}
            data-bed="light"
            data-pbx-tier={tier}
            onClick={item.onClick}
          >
            {body}
          </button>
        ) : (
          <div
            key={item.id}
            className="fc-wlp-health-lattice-tile pbx-object"
            data-accent={accent}
            data-fcm-accent={fcmAccent}
            data-bed="light"
            data-pbx-tier={tier}
          >
            {body}
          </div>
        );
      })}
    </div>
  );
}

export type ProductPipelineStop = {
  id: string;
  label: string;
  detail: string;
  value: number | string;
  accent: WorkspaceProductAccent;
  icon: LucideIcon;
  onClick?: () => void;
};

export function ProductPipelineBento({ items }: { items: ProductPipelineStop[] }) {
  return (
    <div className="fc-wlp-pipeline-bento">
      {items.map((item, index) => {
        const Icon = item.icon;
        const featured = index === 0;
        const fcmAccent = toFcmAccent(item.accent);
        const bed: FcmBed = featured ? 'dark' : 'light';
        const tier: ProductBoxEmphasis = featured ? 'featured' : 'raised';
        const iconColor = featured ? undefined : `rgba(var(--fcm-accent-rgb), 0.94)`;
        const body = (
          <>
            <ProductBoxSurface accent={fcmAccent} bed={bed} tier={tier} />
            <span className="fc-wlp-pipeline-bento-icon" style={iconColor ? { color: iconColor } : undefined}>
              <Icon size={21} strokeWidth={2.05} />
            </span>
            <span className="fc-wlp-pipeline-bento-copy">
              <strong>{item.label}</strong>
              <span>{item.detail}</span>
            </span>
            <span className="fc-wlp-pipeline-bento-value">{item.value}</span>
            {item.onClick ? <ArrowRight className="fc-wlp-pipeline-bento-arrow" size={16} /> : null}
          </>
        );

        return item.onClick ? (
          <button
            key={item.id}
            type="button"
            className="fc-wlp-pipeline-bento-tile pbx-object"
            data-accent={item.accent}
            data-fcm-accent={fcmAccent}
            data-bed={bed}
            data-pbx-tier={tier}
            data-featured={featured ? 'true' : undefined}
            onClick={item.onClick}
          >
            {body}
          </button>
        ) : (
          <div
            key={item.id}
            className="fc-wlp-pipeline-bento-tile pbx-object"
            data-accent={item.accent}
            data-fcm-accent={fcmAccent}
            data-bed={bed}
            data-pbx-tier={tier}
            data-featured={featured ? 'true' : undefined}
          >
            {body}
          </div>
        );
      })}
    </div>
  );
}

export function ProductDrawer({
  open,
  title,
  subtitle,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fc-wlp-drawer-backdrop" role="presentation" onMouseDown={onClose}>
      <aside
        className="fc-wlp-drawer"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="fc-wlp-drawer-head">
          <div>
            <h2 className="fc-wlp-section-title">{title}</h2>
            {subtitle ? <p className="fc-wlp-panel-subtitle">{subtitle}</p> : null}
          </div>
          <button type="button" className="fc-wlp-utility-action" onClick={onClose} aria-label="Close">
            <X size={17} />
          </button>
        </div>
        <div className="fc-wlp-drawer-body">{children}</div>
      </aside>
    </div>
  );
}

export function ProductIntelligenceDrawer({
  signal,
  onClose,
}: {
  signal: WorkspaceIntelligenceSignal | null;
  onClose: () => void;
}) {
  return (
    <ProductDrawer
      open={Boolean(signal)}
      title={signal?.headline ?? 'Signal details'}
      subtitle={signal ? `${signal.label} · ${signal.confidence} confidence` : undefined}
      onClose={onClose}
    >
      {signal ? (
        <div className="fc-wlp-stack">
          <div className="fc-wlp-intelligence-explainer" data-status={signal.status}>
            <ProductStatusPill status={signal.status} />
            <p>{signal.explanation}</p>
          </div>
          <section>
            <div className="fc-wlp-eyebrow">Evidence used</div>
            {signal.evidence.length ? (
              <div className="fc-wlp-evidence-list">
                {signal.evidence.map((item, index) => (
                  <div key={`${item.label}-${item.value}-${index}`} className="fc-wlp-evidence-row">
                    <span>{item.label}</span>
                    <strong>{item.value}</strong>
                    <em>{item.source}</em>
                  </div>
                ))}
              </div>
            ) : (
              <p className="fc-wlp-panel-subtitle">No supporting evidence is available in this preview state.</p>
            )}
          </section>
          <p className="fc-wlp-intelligence-method">
            This signal summarizes current workspace data. It does not invent missing facts or guarantee an outcome.
          </p>
        </div>
      ) : null}
    </ProductDrawer>
  );
}

export function ProductEmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="fc-wlp-empty">
      <div className="fc-wlp-empty-title">{title}</div>
      <p className="fc-wlp-empty-copy">{description}</p>
      {action ? <div style={{ marginTop: 14 }}>{action}</div> : null}
    </div>
  );
}

export function ProductDashboardSkeleton({ label = 'Loading workspace' }: { label?: string }) {
  return (
    <div className="fc-wlp-stack" aria-busy="true" aria-label={label}>
      <div className="fc-wlp-panel" style={{ padding: 24 }}>
        <div className="fc-wlp-skeleton" style={{ width: 116, height: 22 }} />
        <div className="fc-wlp-skeleton" style={{ width: 'min(520px, 82%)', height: 30, marginTop: 14 }} />
        <div className="fc-wlp-skeleton" style={{ width: 'min(680px, 94%)', height: 14, marginTop: 12 }} />
      </div>
      <div className="fc-wlp-loading-grid">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="fc-wlp-loading-card">
            <div className="fc-wlp-skeleton" style={{ width: '58%', height: 12 }} />
            <div className="fc-wlp-skeleton" style={{ width: '36%', height: 28, marginTop: 13 }} />
            <div className="fc-wlp-skeleton" style={{ width: '72%', height: 10, marginTop: 10 }} />
          </div>
        ))}
      </div>
      <div className="fc-wlp-panel" style={{ padding: 20 }}>
        <div className="fc-wlp-skeleton" style={{ width: 170, height: 18 }} />
        <div className="fc-wlp-skeleton" style={{ width: '100%', height: 58, marginTop: 16 }} />
        <div className="fc-wlp-skeleton" style={{ width: '100%', height: 58, marginTop: 9 }} />
      </div>
    </div>
  );
}
