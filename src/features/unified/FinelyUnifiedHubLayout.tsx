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
  finelyOsHubTab,
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
  /** Skip inner content card — use when child is already a full workstation shell */
  contentVariant?: 'card' | 'flush';
  /** Wider, readable tab buttons */
  tabDensity?: 'default' | 'comfortable';
  /** Light ivory marketing shell (personal credit lane) */
  variant?: 'default' | 'ivoryMarketing' | 'darkDeskLightSheets';
  primaryActionClassName?: string;
  secondaryActionClassName?: string;
  /** Big glow launcher tiles — hides tab nav when set (Phase 4 partner hub pattern). */
  launcherSlot?: React.ReactNode;
};

function hubCatalogAccent(accent: Props['accent'] = 'emerald'): FinelyOsPublicAccent {
  if (accent === 'rose') return 'fuchsia';
  return accent;
}

/** Dark-safe accent border/bg for hub KPI tiles — the `.fc-hub-kpi` ivory overrides only
 * apply under the light theme, so these Tailwind classes carry the seeability on the
 * default dark shell (no more invisible/borderless tiles). */
const HUB_KPI_TILE_ACCENT: Record<NonNullable<UnifiedHubKpi['accent']>, string> = {
  emerald: 'border-emerald-400/35 bg-emerald-500/10',
  violet: 'border-violet-400/35 bg-violet-500/10',
  amber: 'border-amber-400/35 bg-amber-500/10',
  sky: 'border-sky-400/35 bg-sky-500/10',
  fuchsia: 'border-fuchsia-400/35 bg-fuchsia-500/10',
  rose: 'border-rose-400/35 bg-rose-500/10',
};

function hubKpiTileClass(accent: UnifiedHubKpi['accent'], fallback: Props['accent'] = 'emerald') {
  const key = (accent ?? fallback ?? 'emerald') as NonNullable<UnifiedHubKpi['accent']>;
  return HUB_KPI_TILE_ACCENT[key] ?? HUB_KPI_TILE_ACCENT.emerald;
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
  contentVariant = 'card',
  tabDensity = 'default',
  variant = 'default',
  primaryActionClassName,
  secondaryActionClassName,
  launcherSlot,
}: Props) {
  const [detailOpen, setDetailOpen] = useState(false);
  const tabId = activeTab ?? tabs?.[0]?.id;
  const ivory = variant === 'ivoryMarketing';
  const darkDesk = variant === 'darkDeskLightSheets';

  const shellClass = ivory
    ? 'pc-restore-hub-shell fc-light-readable min-w-0 overflow-hidden'
    : darkDesk
      ? 'pc-restore-hub-shell pc-restore-hub-shell--desk fc-light-black-scope min-w-0 overflow-hidden !p-4 sm:!p-6'
      : `fc-unified-hub-shell fc-light-hero-panel fc-pop-surface fc-light-readable min-w-0 ${finelyOsCatalogCard(hubCatalogAccent(accent))} !p-4 sm:!p-6 overflow-hidden`;

  const primaryBtn = primaryActionClassName ?? FINELY_OS_PRIMARY_BTN;
  const secondaryBtn = secondaryActionClassName ?? FINELY_OS_PLATINUM_BTN;

  return (
    <div className="space-y-4 min-w-0 overflow-x-clip">
      <div className={shellClass} data-fc-accent={accent}>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            {eyebrow ? (
              <p
                className={
                  ivory || darkDesk
                    ? 'pc-restore-hub-eyebrow'
                    : 'inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-amber-300/85'
                }
              >
                {!ivory && !darkDesk ? <span className="h-1 w-1 rounded-full bg-amber-300/85" /> : null}
                {eyebrow}
              </p>
            ) : null}
            <h2
              className={
                ivory
                  ? 'pc-restore-hub-title'
                  : darkDesk
                    ? 'text-2xl md:text-3xl font-bold text-white tracking-tight'
                    : `text-2xl md:text-3xl font-bold ${FINELY_OS_ENTITY_VALUE}`
              }
            >
              {title}
            </h2>
            {subtitle ? (
              <p
                className={
                  ivory
                    ? 'pc-restore-hub-sub max-w-3xl'
                    : darkDesk
                      ? 'pc-restore-hub-sub-dark max-w-3xl text-base'
                      : `${FINELY_OS_ENTITY_BODY} max-w-3xl text-base`
                }
              >
                {subtitle}
              </p>
            ) : null}
          </div>
          {(primaryAction || secondaryAction) && (
            <div className="flex flex-wrap gap-2 shrink-0">
              {secondaryAction ? (
                <button type="button" onClick={secondaryAction.onClick} className={secondaryBtn}>
                  {secondaryAction.label}
                </button>
              ) : null}
              {primaryAction ? (
                <button type="button" onClick={primaryAction.onClick} className={primaryBtn}>
                  {primaryAction.label}
                </button>
              ) : null}
            </div>
          )}
        </div>
        {kpis?.length ? (
          <div className={`mt-4 grid grid-cols-2 md:grid-cols-4 gap-2 ${ivory || darkDesk ? '' : 'gap-3 mt-6'}`}>
            {kpis.map((k) => (
              <div
                key={k.label}
                className={
                  ivory || darkDesk
                    ? 'pc-restore-kpi'
                    : `fc-hub-kpi fc-light-pop-card fc-pop-surface rounded-xl border px-4 py-3 ${hubKpiTileClass(k.accent, accent)}`
                }
                data-fc-accent={k.accent ?? accent}
              >
                <div className={ivory || darkDesk ? 'pc-restore-kpi-label' : FINELY_OS_ENTITY_SUBLABEL}>{k.label}</div>
                <div
                  className={
                    ivory || darkDesk ? 'pc-restore-kpi-value mt-0.5' : `mt-1 text-lg font-semibold ${FINELY_OS_ENTITY_VALUE}`
                  }
                >
                  {k.value}
                </div>
                {k.hint ? <div className={`mt-0.5 text-[10px] ${FINELY_OS_ENTITY_BODY}`}>{k.hint}</div> : null}
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {launcherSlot ? <div className="min-w-0">{launcherSlot}</div> : null}

      {!launcherSlot && tabs?.length && onTabChange ? (
        <div className="-mx-1 overflow-x-auto pb-1 [scrollbar-width:thin]">
          <div className={`${FINELY_OS_VIEW_TABS} ${tabDensity === 'comfortable' ? 'gap-2.5' : ''} min-w-max`} role="tablist">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tabId === t.id}
                data-fc-hub-tab={t.id}
                onClick={() => onTabChange(t.id)}
                className={
                  tabDensity === 'comfortable'
                    ? finelyOsHubTab(tabId === t.id, accent ?? 'emerald')
                    : `${finelyOsViewTab(tabId === t.id, accent === 'rose' ? 'fuchsia' : accent)} shrink-0`
                }
              >
                {t.label}
                {t.badge != null && t.badge !== '' ? ` (${t.badge})` : ''}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {!launcherSlot && (contentVariant === 'flush' ? (
        <div className="fc-unified-hub-content fc-light-readable min-w-0 overflow-x-clip" data-fc-accent={accent}>
          {children}
        </div>
      ) : (
        <div className={`fc-unified-hub-content fc-light-readable fc-light-pop-card fc-pop-surface min-w-0 overflow-x-clip ${finelyOsCatalogCard(hubCatalogAccent(accent))} !p-4 sm:!p-5`} data-fc-accent={accent}>{children}</div>
      ))}

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

/** Phase 4 partner hub launcher — re-export for role dashboards using `launcherSlot`. */
export { usePartnerHubLauncher } from '../../components/partner/usePartnerHubLauncher';
export { PartnerHubLauncherGrid, PartnerHubLauncherTile } from '../../components/partner/PartnerHubLauncherTile';
export { PartnerHubWorkModal } from '../../components/partner/PartnerHubWorkModal';
