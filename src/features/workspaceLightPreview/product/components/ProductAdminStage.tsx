import React from 'react';
import { CircleHelp, PlayCircle, type LucideIcon } from 'lucide-react';
import type { WorkspaceProductAccent } from '../workspaceProductTokens';
import { openProductCopilot } from './ProductCopilotPanel';
import { ProductSignalRail } from './ProductSignalRail';
import './productAdminStage.css';

export type AdminStageTone =
  | 'command'
  | 'studio'
  | 'people'
  | 'pipeline'
  | 'docket'
  | 'control';

export type AdminStageNavItem = {
  id: string;
  label: string;
  description: string;
  icon: LucideIcon;
  accent: WorkspaceProductAccent;
  badge?: string | number;
};

export type AdminStageSignal = {
  id: string;
  label: string;
  value: React.ReactNode;
  detail: string;
  icon: LucideIcon;
  accent: WorkspaceProductAccent;
  onClick?: () => void;
  featured?: boolean;
};

/**
 * Alternative page composition for the admin workspace.
 *
 * ProductHubScaffold is intentionally predictable, which made it useful while routes were being
 * wired, but that same predictability flattened every admin destination into one silhouette.
 * AdminStageShell keeps the shared workspace chrome and accessibility conventions while allowing
 * a page to own its spatial composition: full-width studios, portrait floors, pipelines, dockets,
 * and control rooms all render without the mandatory KPI band + guide sidebar.
 */
export function AdminStageShell({
  family,
  signature,
  accent,
  children,
}: {
  family: string;
  signature: string;
  accent: WorkspaceProductAccent;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fc-wlp-stack fc-wlp-product-page fc-wlp-admin-stage-page"
      data-layout-family={family}
      data-page-signature={signature}
      data-page-accent={accent}
      data-fcm-accent={accent}
    >
      {children}
    </div>
  );
}

export function AdminStageHero({
  tone,
  accent,
  eyebrow,
  title,
  description,
  status,
  freshness,
  icon: Icon,
  primaryAction,
  secondaryAction,
  primaryFirst = false,
  feature,
  children,
}: {
  tone: AdminStageTone;
  accent: WorkspaceProductAccent;
  eyebrow: string;
  title: React.ReactNode;
  description: string;
  status?: string;
  freshness?: string;
  icon: LucideIcon;
  primaryAction?: React.ReactNode;
  secondaryAction?: React.ReactNode;
  primaryFirst?: boolean;
  feature?: React.ReactNode;
  children?: React.ReactNode;
}) {
  const visibleStatus = status
    ?.replace(/\s*·\s*(?:demo|live)\s+data\b/gi, '')
    .replace(/\b(?:demo|live)\s+data\b/gi, 'workspace data');
  const visibleFreshness =
    freshness && /^(?:demo snapshot|live snapshot)$/i.test(freshness) ? 'ready now' : freshness;
  return (
    <section
      className="fc-wlp-command fc-wlp-admin-stage-hero"
      data-tone={tone}
      data-accent={accent}
      data-bed="dark"
    >
      <span className="fc-wlp-admin-stage-plane fc-wlp-admin-stage-plane--one" aria-hidden />
      <span className="fc-wlp-admin-stage-plane fc-wlp-admin-stage-plane--two" aria-hidden />
      <span className="fc-wlp-admin-stage-grid" aria-hidden />

      <div className="fc-wlp-admin-stage-hero-grid">
        <div className="fc-wlp-admin-stage-hero-copy">
          <span className="fc-wlp-admin-stage-eyebrow">
            <Icon size={14} strokeWidth={2.2} aria-hidden />
            {eyebrow}
          </span>
          <h1 className="fc-wlp-admin-stage-title">{title}</h1>
          <p className="fc-wlp-admin-stage-description">{description}</p>
          {visibleStatus || visibleFreshness ? (
            <div className="fc-wlp-admin-stage-meta">
              {visibleStatus ? <strong>{visibleStatus}</strong> : null}
              {visibleFreshness ? <span>Updated {visibleFreshness}</span> : null}
            </div>
          ) : null}
          {children ? <div className="fc-wlp-admin-stage-hero-instrument">{children}</div> : null}
        </div>

        {feature || primaryAction || secondaryAction ? (
          <div className="fc-wlp-admin-stage-hero-aside">
            {feature ? <div className="fc-wlp-admin-stage-feature">{feature}</div> : null}
            {primaryAction || secondaryAction ? (
              <div className="fc-wlp-admin-stage-actions">
                {primaryFirst ? primaryAction : secondaryAction}
                {primaryFirst ? secondaryAction : primaryAction}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function AdminStageNav({
  label,
  items,
  activeId,
  onChange,
}: {
  label: string;
  items: AdminStageNavItem[];
  activeId: string;
  onChange: (id: string) => void;
}) {
  return (
    <section className="fc-wlp-admin-stage-nav" aria-label={label}>
      <div className="fc-wlp-admin-stage-nav-head">
        <span>{label}</span>
        <em>Choose a working room</em>
      </div>
      <div className="fc-wlp-admin-stage-nav-track" role="tablist" aria-label={label}>
        {items.map((item, index) => {
          const Icon = item.icon;
          const active = item.id === activeId;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              className="fc-wlp-admin-stage-nav-card"
              data-accent={item.accent}
              data-active={active ? 'true' : undefined}
              style={{ '--fc-admin-stage-index': index } as React.CSSProperties}
              onClick={() => onChange(item.id)}
            >
              <span className="fc-wlp-admin-stage-nav-icon">
                <Icon size={18} strokeWidth={2.15} aria-hidden />
              </span>
              <span className="fc-wlp-admin-stage-nav-copy">
                <strong>{item.label}</strong>
                <small>{item.description}</small>
              </span>
              {item.badge !== undefined ? <em>{item.badge}</em> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function AdminSignalRail({
  label,
  signals,
}: {
  label: string;
  signals: AdminStageSignal[];
}) {
  return (
    <ProductSignalRail
      label={label}
      items={signals.map((signal) => ({
        id: signal.id,
        label: signal.label,
        value: signal.value,
        hint: signal.detail,
        accent: signal.accent,
        icon: signal.icon,
        onClick: signal.onClick,
        featured: signal.featured,
      }))}
    />
  );
}

export function AdminStageSection({
  eyebrow,
  title,
  description,
  action,
  tone = 'light',
  children,
  className = '',
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  tone?: 'light' | 'dark' | 'clear';
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`fc-wlp-admin-stage-section ${className}`} data-tone={tone} data-bed={tone === 'dark' ? 'dark' : 'light'}>
      <div className="fc-wlp-admin-stage-section-head">
        <div>
          <span>{eyebrow}</span>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {action ? <div className="fc-wlp-admin-stage-section-action">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

/**
 * Compact help treatment for signature admin pages. It keeps the communication standard
 * available without reserving the same 310px sidebar on every route.
 */
export function AdminContextCommand({
  label,
  title,
  description,
  steps,
  prompt,
  contextLabel,
  onWatch,
}: {
  label?: string;
  title: string;
  description: string;
  steps: string[];
  prompt: string;
  contextLabel: string;
  onWatch?: () => void;
}) {
  return (
    <section className="fc-wlp-admin-context-command" data-bed="dark">
      <div className="fc-wlp-admin-context-copy">
        <span>{label ?? 'Operator brief'}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      <ol>
        {steps.slice(0, 3).map((step, index) => (
          <li key={step}>
            <strong>{String(index + 1).padStart(2, '0')}</strong>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <div className="fc-wlp-admin-context-actions">
        <button
          type="button"
          onClick={() => openProductCopilot({ prompt, contextLabel })}
        >
          <CircleHelp size={15} /> Ask Finely
        </button>
        {onWatch ? (
          <button type="button" onClick={onWatch}>
            <PlayCircle size={15} /> Watch how
          </button>
        ) : null}
      </div>
    </section>
  );
}
