import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  CheckCircle2,
  ChevronRight,
  Package,
  ScrollText,
  X,
} from 'lucide-react';
import {
  listServicePlaybookBundles,
  listTaskPlaybooks,
  getTaskPlaybookStats,
  getTaskPlaybook,
} from '../../../../data/taskPlaybooksRepo';
import type { PricingCategory } from '../../../../config/pricingCatalog';
import { categoryLabels } from '../../../../config/pricingCatalog';
import { FinelyOsCatalogBrowser, type FinelyOsCatalogItem } from '../../../os/FinelyOsCatalogBrowser';
import {
  FINELY_OS_CATALOG_SHELL,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_FIXED_OVERLAY,
  FINELY_OS_MODAL_SHELL,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
  finelyOsViewTab,
  FINELY_OS_VIEW_TABS,
} from '../../../os/finelyOsLightUi';
import type { TaskPlaybook } from '../../../../domain/taskPlaybooks';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

type HubView = 'playbooks' | 'bundles';

const DELIVERY_BADGE: Record<string, string> = {
  DIY: 'inline-flex items-center px-2.5 py-1 rounded-lg border border-sky-500/30 bg-sky-500/10 text-[10px] font-black uppercase tracking-widest text-sky-200',
  DFY: finelyOsStatusChip('ok'),
  HYBRID: 'inline-flex items-center px-2.5 py-1 rounded-lg border border-violet-500/30 bg-violet-500/10 text-[10px] font-black uppercase tracking-widest text-violet-200',
  any: FINELY_OS_ENTITY_CHIP,
};

const RUNWAY_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

function playbookToCatalogItem(pb: TaskPlaybook, index: number): FinelyOsCatalogItem {
  const primaryCategory = pb.categories[0];
  return {
    id: pb.id,
    title: pb.title,
    subtitle: pb.stage.replace(/_/g, ' '),
    description: pb.description ?? pb.adminInstructions ?? pb.partnerInstructions,
    groupKey: pb.stage,
    accentIndex: index,
    badges: [
      { label: pb.delivery, className: DELIVERY_BADGE[pb.delivery] ?? DELIVERY_BADGE.any },
      { label: pb.kind.replace(/_/g, ' '), className: FINELY_OS_ENTITY_CHIP },
      ...(primaryCategory
        ? [{ label: categoryLabels[primaryCategory], className: 'inline-flex items-center px-2.5 py-1 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 text-[10px] font-black uppercase tracking-widest text-fuchsia-200' }]
        : []),
      ...(pb.dependsOnPlaybookId ? [{ label: 'Chained', className: finelyOsStatusChip('warn') }] : []),
    ],
    meta: [
      pb.assignedTo ? `Assign: ${pb.assignedTo}` : '',
      pb.dueDaysOffset != null ? `Due +${pb.dueDaysOffset}d` : '',
    ].filter(Boolean),
  };
}

function PlaybookDetailDrawer({
  playbook,
  onClose,
}: {
  playbook: TaskPlaybook;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className={FINELY_OS_FIXED_OVERLAY} role="dialog" aria-modal="true">
      <div className={`${FINELY_OS_MODAL_SHELL} max-w-lg w-full mx-auto mt-[8vh]`}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Service delivery checklist</p>
            <h2 className={FINELY_OS_ENTITY_TITLE}>{playbook.title}</h2>
          </div>
          <button type="button" onClick={onClose} className={FINELY_OS_SECONDARY_BTN} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
          {playbook.description ?? 'Step-by-step delivery template for projects and tasks.'}
        </p>
        <div className="mt-3 rounded-xl border border-sky-500/25 bg-sky-500/10 px-3 py-2 text-xs text-sky-100">
          These checklists guide human delivery — they do <strong>not</strong> fire automations. Use Automation Studio for triggers.
        </div>
        {playbook.checklist?.length ? (
          <ul className={`mt-4 space-y-2 text-sm ${FINELY_OS_ENTITY_BODY} list-decimal list-inside`}>
            {playbook.checklist.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        ) : null}
        {playbook.adminInstructions ? (
          <div className="mt-4">
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Admin instructions</p>
            <p className={`mt-1 text-sm whitespace-pre-wrap ${FINELY_OS_ENTITY_BODY}`}>{playbook.adminInstructions}</p>
          </div>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/admin/projects')}>
            Open projects
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/automations')}>
            Automation studio
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminPlaybooksProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'rose';
  const [hubView, setHubView] = useState<HubView>('playbooks');
  const [category, setCategory] = useState<PricingCategory | 'all'>('all');
  const [activeStageIndex, setActiveStageIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const stats = useMemo(() => getTaskPlaybookStats(), []);
  const playbooks = useMemo(
    () => listTaskPlaybooks({ category: category === 'all' ? undefined : category }),
    [category],
  );
  const bundles = useMemo(() => listServicePlaybookBundles(), []);
  const selectedPlaybook = selectedId ? getTaskPlaybook(selectedId) : null;

  const stages = useMemo(() => {
    const set = new Set(playbooks.map((p) => p.stage));
    return Array.from(set).sort();
  }, [playbooks]);

  const activeStage = stages[activeStageIndex] ?? null;

  const filtered = useMemo(() => {
    if (!activeStage) return playbooks;
    return playbooks.filter((p) => p.stage === activeStage);
  }, [playbooks, activeStage]);

  const catalogItems = useMemo(
    () => filtered.map((pb, i) => playbookToCatalogItem(pb, i)),
    [filtered],
  );

  const bundleItems = useMemo(
    (): FinelyOsCatalogItem[] =>
      bundles.map((b, i) => ({
        id: b.id,
        title: b.name,
        subtitle: b.delivery,
        description: b.projectTitleTemplate,
        groupKey: b.scope,
        accentIndex: i + 2,
        badges: [
          { label: `${b.playbookIds.length} checklists`, className: finelyOsStatusChip('ok') },
          { label: b.delivery, className: DELIVERY_BADGE[b.delivery] ?? DELIVERY_BADGE.any },
        ],
        meta: [`Package ${b.packageId}`],
      })),
    [bundles],
  );

  const stageCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const pb of playbooks) {
      counts.set(pb.stage, (counts.get(pb.stage) ?? 0) + 1);
    }
    return counts;
  }, [playbooks]);

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'playbooks' || t === 'bundles') setHubView(t);
  }, [searchParams]);

  const selectHubView = (id: HubView) => {
    setHubView(id);
    navigate(`/admin/playbooks?tab=${id}`, { replace: true });
  };

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Delivery"
      title="Playbooks"
      description="Human step templates for projects — not automation triggers."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={<ProductPagePrimaryAction label="Open projects" onClick={() => navigate('/admin/projects')} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/automations')}>
          Automation studio
        </button>
      }
      metrics={[
        { label: 'Checklists', value: String(stats.playbookCount), hint: 'Task templates', accent: 'violet', onClick: () => selectHubView('playbooks') },
        { label: 'Bundles', value: String(stats.bundleCount), hint: 'Service packages', accent: 'emerald', onClick: () => selectHubView('bundles') },
        { label: 'Filtered', value: String(filtered.length), hint: 'Current phase', accent: 'sky', onClick: () => selectHubView('playbooks') },
        { label: 'Phases', value: String(stages.length), hint: 'Delivery stages', accent: 'rose', onClick: () => selectHubView('playbooks') },
      ]}
      metricTitle="Delivery coverage"
      metricDescription="Follow the runway by phase, or jump to service bundles."
    >
      {hubView === 'playbooks' ? (
        <div className="space-y-6">
          <section className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <ScrollText size={16} />
              <span>Category filter</span>
            </div>
            <div className={`${FINELY_OS_VIEW_TABS} flex-wrap`}>
              <button type="button" onClick={() => setCategory('all')} className={finelyOsViewTab(category === 'all', 'violet')}>
                All categories
              </button>
              {(Object.keys(categoryLabels) as PricingCategory[]).map((c) => (
                <button key={c} type="button" onClick={() => setCategory(c)} className={finelyOsViewTab(category === c, 'violet')}>
                  {categoryLabels[c]}
                </button>
              ))}
            </div>
          </section>

          {/* Timeline runway — delivery phases along a vertical spine */}
          <div className="grid gap-6 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] lg:items-start">
            <nav
              className={`${finelyOsCatalogCard('emerald')} p-5 lg:p-6`}
              data-fc-accent="emerald"
              aria-label="Delivery phase runway"
            >
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} mb-4`}>Phase runway</div>
              <ol className="relative space-y-0">
                {stages.map((stage, index) => {
                  const nodeAccent = RUNWAY_ACCENTS[index % RUNWAY_ACCENTS.length]!;
                  const isActive = index === activeStageIndex;
                  const count = stageCounts.get(stage) ?? 0;
                  return (
                    <li key={stage} className="relative flex gap-3 pb-5 last:pb-0">
                      {index < stages.length - 1 ? (
                        <span
                          className="absolute left-[17px] top-9 bottom-0 w-0.5 bg-gradient-to-b from-emerald-400/50 via-violet-400/30 to-transparent"
                          aria-hidden
                        />
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setActiveStageIndex(index)}
                        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 text-xs font-extrabold transition-all ${
                          isActive
                            ? 'border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                            : `border-white/20 bg-white/5 hover:border-white/40 ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`
                        }`}
                        aria-current={isActive ? 'step' : undefined}
                      >
                        {index + 1}
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveStageIndex(index)}
                        className={`min-w-0 flex-1 rounded-2xl border px-3 py-2.5 text-left transition-all ${
                          isActive ? 'border-emerald-400/40 bg-emerald-500/10' : 'border-transparent hover:border-white/10 hover:bg-white/[0.03]'
                        }`}
                        data-fc-accent={isActive ? nodeAccent : undefined}
                      >
                        <div className={`text-sm font-extrabold capitalize ${isActive ? FINELY_OS_ENTITY_TITLE : 'opacity-70'}`}>
                          {stage.replace(/_/g, ' ')}
                        </div>
                        <div className={`mt-0.5 text-xs font-bold ${FINELY_OS_ENTITY_BODY}`}>
                          {count} checklist{count === 1 ? '' : 's'}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ol>

              <button
                type="button"
                onClick={() => selectHubView('bundles')}
                className={`mt-4 w-full rounded-2xl border border-violet-400/30 bg-violet-500/10 px-4 py-3 text-left transition-all hover:border-violet-400/50`}
                data-fc-accent="violet"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Package size={16} />
                    <span className="text-sm font-extrabold">Service bundles</span>
                  </div>
                  <ChevronRight size={14} className="opacity-60" />
                </div>
                <div className={`mt-1 text-xs font-bold ${FINELY_OS_ENTITY_BODY}`}>{bundles.length} pricing packages</div>
              </button>
            </nav>

            <article className="space-y-5">
              <section className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8`} data-fc-accent="sky">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                      <CheckCircle2 size={16} />
                      <span>
                        Phase {activeStageIndex + 1} of {stages.length}
                      </span>
                    </div>
                    <h2 className="mt-2 text-3xl font-extrabold capitalize">
                      {activeStage?.replace(/_/g, ' ') ?? 'All phases'}
                    </h2>
                    <p className={`mt-2 text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                      {filtered.length} checklist{filtered.length === 1 ? '' : 's'} in this delivery phase.
                    </p>
                  </div>
                </div>
              </section>

              <div className={FINELY_OS_CATALOG_SHELL}>
                <FinelyOsCatalogBrowser
                  items={catalogItems}
                  pageSize={24}
                  searchPlaceholder="Search checklists by title, phase, kind…"
                  emptyMessage="No checklists match these filters."
                  initialView="grid"
                  onItemClick={setSelectedId}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                {activeStageIndex > 0 ? (
                  <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setActiveStageIndex((i) => i - 1)}>
                    Previous phase
                  </button>
                ) : (
                  <span />
                )}
                {activeStageIndex < stages.length - 1 ? (
                  <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setActiveStageIndex((i) => i + 1)}>
                    Next phase <ChevronRight size={14} />
                  </button>
                ) : (
                  <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => selectHubView('bundles')}>
                    View bundles <Package size={14} />
                  </button>
                )}
              </div>
            </article>
          </div>
        </div>
      ) : (
        <section className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-6`} data-fc-accent="emerald">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <Package size={18} />
                <span>Service bundles terminal</span>
              </div>
              <h2 className="mt-2 text-3xl font-extrabold">Pricing package maps</h2>
              <p className={`mt-2 text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                {bundles.length} bundles linking checklists to packages.
              </p>
            </div>
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => selectHubView('playbooks')}>
              Back to phase runway
            </button>
          </div>
          <FinelyOsCatalogBrowser
            items={bundleItems}
            pageSize={12}
            searchPlaceholder="Search bundles…"
            emptyMessage="No bundles found."
            initialView="grid"
          />
        </section>
      )}

      {selectedPlaybook ? <PlaybookDetailDrawer playbook={selectedPlaybook} onClose={() => setSelectedId(null)} /> : null}

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
