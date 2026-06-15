/**
 * Sitewide unified hub layout — progressive disclosure, tab-first, less overwhelm.
 * Part AU: Finely OS Unification track.
 */
import React, { useState } from 'react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_PLATINUM_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsCatalogCard,
  finelyOsViewTab,
  type FinelyOsPublicAccent,
} from '../os/finelyOsLightUi';

export type UnifiedHubTab = {
  id: string;
  label: string;
  badge?: string | number;
};

export type UnifiedHubKpi = {
  label: string;
  value: string;
  hint?: string;
  accent?: 'emerald' | 'violet' | 'amber' | 'sky' | 'fuchsia' | 'rose';
};

type Props = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  accent?: 'emerald' | 'violet' | 'amber' | 'sky' | 'fuchsia' | 'rose';
  kpis?: UnifiedHubKpi[];
  tabs?: UnifiedHubTab[];
  activeTab?: string;
  onTabChange?: (id: string) => void;
  primaryAction?: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  children: React.ReactNode;
  /** Collapsible “More detail” slot — keeps primary view calm */
  detailSlot?: React.ReactNode;
  detailLabel?: string;
};

function hubCatalogAccent(accent: Props['accent'] = 'emerald'): FinelyOsPublicAccent {
  if (accent === 'rose') return 'fuchsia';
  return accent;
}

export function FinelyUnifiedHubLayout({
  eyebrow,
  title,
  subtitle,
  accent = 'emerald',
  kpis,
  tabs,
  activeTab,
  onTabChange,
  primaryAction,
  secondaryAction,
  children,
  detailSlot,
  detailLabel = 'More detail',
}: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const tabId = activeTab ?? tabs?.[0]?.id;

  return (
    <div className="space-y-5">
      <div className={`fc-unified-hub-shell fc-light-black-scope fc-light-hero-panel fc-pop-surface fc-light-readable ${finelyOsCatalogCard(hubCatalogAccent(accent))} !p-6 overflow-hidden`} data-fc-accent={accent}>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="min-w-0 space-y-2">
            {eyebrow ? <p className={FINELY_OS_ENTITY_SUBLABEL}>{eyebrow}</p> : null}
            <h1 className={`text-2xl md:text-3xl font-bold ${FINELY_OS_ENTITY_VALUE}`}>{title}</h1>
            {subtitle ? <p className={`${FINELY_OS_ENTITY_BODY} max-w-3xl text-base`}>{subtitle}</p> : null}
          </div>
          {(primaryAction || secondaryAction) && (
            <div className="flex flex-wrap gap-2 shrink-0">
              {secondaryAction ? (
                <button type="button" onClick={secondaryAction.onClick} className={FINELY_OS_PLATINUM_BTN}>
                  {secondaryAction.label}
                </button>
              ) : null}
              {primaryAction ? (
                <button type="button" onClick={primaryAction.onClick} className={FINELY_OS_PRIMARY_BTN}>
                  {primaryAction.label}
                </button>
              ) : null}
            </div>
          )}
        </div>
        {kpis?.length ? (
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            {kpis.map((k) => (
              <div
                key={k.label}
                className="fc-hub-kpi fc-light-pop-card fc-pop-surface rounded-xl px-4 py-3"
                data-fc-accent={k.accent ?? accent}
              >
                <div className={FINELY_OS_ENTITY_SUBLABEL}>{k.label}</div>
                <div className={`mt-1 text-lg font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{k.value}</div>
                {k.hint ? <div className={`mt-0.5 text-[10px] ${FINELY_OS_ENTITY_BODY}`}>{k.hint}</div> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {tabs?.length && onTabChange ? (
        <div className={FINELY_OS_VIEW_TABS} role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={tabId === t.id}
              data-fc-hub-tab={t.id}
              onClick={() => onTabChange(t.id)}
              className={finelyOsViewTab(tabId === t.id, accent === 'rose' ? 'fuchsia' : accent)}
            >
              {t.label}
              {t.badge != null && t.badge !== '' ? ` (${t.badge})` : ''}
            </button>
          ))}
        </div>
      ) : null}

      <div className={`fc-unified-hub-content fc-light-black-scope fc-light-pop-card fc-pop-surface fc-light-readable ${finelyOsCatalogCard(hubCatalogAccent(accent))} !p-5`} data-fc-accent={accent}>{children}</div>

      {detailSlot ? (
        <details
          open={detailOpen}
          onToggle={(e) => setDetailOpen((e.target as HTMLDetailsElement).open)}
          className="fc-light-pop-card fc-light-glass-panel fc-light-chrome-panel px-4 py-3"
        >
          <summary className={`cursor-pointer text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{detailLabel}</summary>
          <div className="mt-4 space-y-3">{detailSlot}</div>
        </details>
      ) : null}
    </div>
  );
}

export function FinelyUnifiedSection({
  title,
  subtitle,
  children,
  compact,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <section className={compact ? 'space-y-3' : 'space-y-4'}>
      <div>
        <h2 className={FINELY_OS_ENTITY_TITLE}>{title}</h2>
        {subtitle ? <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{subtitle}</p> : null}
      </div>
      {children}
    </section>
  );
}
