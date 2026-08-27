import React, { useMemo, useState } from 'react';
import { Globe2, LayoutDashboard, ListOrdered, Pencil, ShieldCheck, Sparkles } from 'lucide-react';
import { buildSitewideCursorPlan, buildSitewideUxSummary } from '../../../sitewideUxCommand/sitewideUxEngine';
import { SitewideKpiCommandStrip } from '../../../sitewideUxCommand/SitewideKpiCommandStrip';
import { SitewideNegativeItemsGuardPanel } from '../../../sitewideUxCommand/SitewideNegativeItemsGuardPanel';
import { SitewidePageMatrixPanel } from '../../../sitewideUxCommand/SitewidePageMatrixPanel';
import { SitewidePatternGallery } from '../../../sitewideUxCommand/SitewidePatternGallery';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import './adminSitewideUxProductSurface.css';

type StudioTool = 'overview' | 'pages' | 'patterns' | 'build-order';

const STUDIO_TOOLS: Array<{
  id: StudioTool;
  label: string;
  purpose: string;
  icon: typeof Sparkles;
  accent: 'sky' | 'emerald' | 'violet' | 'rose';
  countKey: 'totalPages' | 'criticalPages' | 'longListRiskPages' | 'protectedPages';
}> = [
  { id: 'overview', label: 'Overview', purpose: 'Layout health snapshot', icon: Sparkles, accent: 'sky', countKey: 'totalPages' },
  { id: 'pages', label: 'Pages', purpose: 'Surface upgrade matrix', icon: LayoutDashboard, accent: 'emerald', countKey: 'criticalPages' },
  { id: 'patterns', label: 'Patterns', purpose: 'Repeating UX debt', icon: Globe2, accent: 'violet', countKey: 'longListRiskPages' },
  { id: 'build-order', label: 'Build order', purpose: 'Upgrade sequence', icon: ListOrdered, accent: 'rose', countKey: 'protectedPages' },
];

export default function AdminSitewideUxProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const summary = useMemo(() => buildSitewideUxSummary(), []);
  const plan = useMemo(() => buildSitewideCursorPlan(), []);
  const [tool, setTool] = useState<StudioTool>('overview');

  const activeTool = STUDIO_TOOLS.find((t) => t.id === tool) ?? STUDIO_TOOLS[0]!;
  const ActiveIcon = activeTool.icon;

  const renderCanvas = () => {
    if (tool === 'overview') {
      return (
        <div className="space-y-6">
          <SitewideKpiCommandStrip summary={summary} />
          <SitewideNegativeItemsGuardPanel />
          <SitewidePatternGallery />
        </div>
      );
    }

    if (tool === 'pages') {
      return <SitewidePageMatrixPanel />;
    }

    if (tool === 'patterns') {
      return (
        <div className="space-y-6">
          <SitewidePatternGallery />
          <SitewideNegativeItemsGuardPanel />
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          {plan.order.map((step, idx) => {
            const family = (['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4];
            return (
              <div key={step} className={`${finelyOsCatalogCard(family)} p-6 lg:p-8`} data-fc-accent={family}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Step {idx + 1}</div>
                <div className={`mt-3 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{step}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Platform"
      title="Sitewide UX"
      description="Catalog mosaic — tap a scan tile to open its upgrade room below."
      accent={navItem?.accent ?? 'sky'}
      surfaceMode={navItem?.surfaceMode ?? 'studio'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={<ProductPagePrimaryAction label="Review pages" onClick={() => setTool('pages')} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => setTool('build-order')}>
          Build order
        </button>
      }
      metrics={[
        { label: 'Critical pages', value: String(summary.criticalPages), hint: 'Need a new layout first', accent: 'rose', onClick: () => setTool('pages') },
        { label: 'Protected layouts', value: String(summary.protectedPages), hint: 'Leave the report grid alone', accent: 'emerald', onClick: () => setTool('overview') },
        { label: 'Pages scanned', value: String(summary.totalPages), hint: 'Public and private', accent: 'sky', onClick: () => setTool('pages') },
        { label: 'Long-list risk', value: String(summary.longListRiskPages), hint: 'Endless scroll leftovers', accent: 'violet', onClick: () => setTool('patterns') },
      ]}
      metricTitle="UX scan mosaic"
      metricDescription="Four catalog tiles — each opens a different upgrade room."
    >
      <section className="fc-admin-sitewide-mosaic" data-surface-layout="catalog-mosaic">
        <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8`} data-fc-accent="sky">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <Pencil size={16} /> UX scan mosaic
              </div>
              <h2 className="mt-3 text-3xl font-extrabold lg:text-4xl">
                {summary.criticalPages > 0
                  ? `${summary.criticalPages} critical page${summary.criticalPages === 1 ? '' : 's'} need a new layout`
                  : `${summary.totalPages} pages scanned`}
              </h2>
              <p className={`mt-3 max-w-2xl text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Pick a mosaic tile — overview, page matrix, patterns, or build order — each room keeps its real controls.
              </p>
            </div>
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setTool(tool === 'pages' ? 'overview' : 'pages')}>
              {tool === 'pages' ? 'Back to overview' : 'Open page matrix'}
            </button>
          </div>

          <div className="fc-admin-sitewide-scan-strip mt-6">
            {[
              { label: 'Scanned', value: summary.totalPages, family: 'sky' as const },
              { label: 'Critical', value: summary.criticalPages, family: 'rose' as const },
              { label: 'Protected', value: summary.protectedPages, family: 'emerald' as const },
              { label: 'Long-list', value: summary.longListRiskPages, family: 'violet' as const },
            ].map((chip) => (
              <div key={chip.label} className={`${finelyOsCatalogCard(chip.family)} p-4 text-center`} data-fc-accent={chip.family}>
                <div className={`text-[10px] font-black uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>{chip.label}</div>
                <div className={`mt-2 text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{chip.value}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="fc-admin-sitewide-mosaic-grid" role="tablist" aria-label="Sitewide UX tools">
          {STUDIO_TOOLS.map((t) => {
            const Icon = t.icon;
            const count = summary[t.countKey];
            const active = tool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`${finelyOsCatalogCard(t.accent)} fc-admin-sitewide-mosaic-tile`}
                data-fc-accent={t.accent}
                data-active={active ? 'true' : undefined}
                onClick={() => setTool(t.id)}
              >
                <div className="fc-admin-sitewide-mosaic-tile-head">
                  <span className="inline-flex items-center gap-2 text-base font-extrabold">
                    <Icon size={18} />
                    {t.label}
                  </span>
                  {t.id === 'pages' && summary.criticalPages > 0 ? (
                    <span className={finelyOsStatusChip('warn')}>{summary.criticalPages} critical</span>
                  ) : null}
                </div>
                <span className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{t.purpose}</span>
                <span className="fc-admin-sitewide-mosaic-value">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="fc-admin-sitewide-canvas-bed">
          <div className="flex items-center gap-3 mb-6">
            <ActiveIcon size={24} />
            <div>
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Upgrade room</p>
              <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                {tool === 'build-order' ? plan.title : activeTool.label}
              </h2>
              <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{activeTool.purpose}</p>
            </div>
          </div>
          {renderCanvas()}
        </div>

        <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 flex flex-wrap items-center gap-4 justify-between`} data-fc-accent="violet">
          <div className="flex items-center gap-3">
            <ShieldCheck size={20} />
            <div>
              <div className={`font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Protected layout</div>
              <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Credit-report negative-items view stays untouched during this pass.
              </p>
            </div>
          </div>
          <button type="button" onClick={() => setTool('pages')} className={FINELY_OS_PRIMARY_BTN}>
            Open page matrix
          </button>
        </div>
      </section>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
