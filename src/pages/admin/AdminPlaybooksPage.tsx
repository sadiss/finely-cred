import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { listServicePlaybookBundles, listTaskPlaybooks, getTaskPlaybookStats } from '../../data/taskPlaybooksRepo';
import type { PricingCategory } from '../../config/pricingCatalog';
import { categoryLabels } from '../../config/pricingCatalog';
import { FinelyOsCatalogBrowser, type FinelyOsCatalogItem } from '../../features/os/FinelyOsCatalogBrowser';
import {
  FINELY_OS_CATALOG_SHELL,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  finelyOsStatusChip,
  finelyOsViewTab,
  FINELY_OS_VIEW_TABS,
} from '../../features/os/finelyOsLightUi';
import type { TaskPlaybook } from '../../domain/taskPlaybooks';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';

const DELIVERY_BADGE: Record<string, string> = {
  DIY: 'inline-flex items-center px-2.5 py-1 rounded-lg border border-sky-500/30 bg-sky-500/10 text-[10px] font-black uppercase tracking-widest text-sky-200',
  DFY: finelyOsStatusChip('ok'),
  HYBRID: 'inline-flex items-center px-2.5 py-1 rounded-lg border border-violet-500/30 bg-violet-500/10 text-[10px] font-black uppercase tracking-widest text-violet-200',
  any: FINELY_OS_ENTITY_CHIP,
};

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

type PlaybooksHubTab = 'playbooks' | 'bundles';

export default function AdminPlaybooksPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hubTab, setHubTab] = useState<PlaybooksHubTab>('playbooks');
  const [category, setCategory] = useState<PricingCategory | 'all'>('all');
  const [stage, setStage] = useState<string>('all');
  const stats = useMemo(() => getTaskPlaybookStats(), []);
  const playbooks = useMemo(
    () => listTaskPlaybooks({ category: category === 'all' ? undefined : category }),
    [category],
  );
  const bundles = useMemo(() => listServicePlaybookBundles(), []);

  const stages = useMemo(() => {
    const set = new Set(playbooks.map((p) => p.stage));
    return Array.from(set).sort();
  }, [playbooks]);

  const filtered = useMemo(() => {
    if (stage === 'all') return playbooks;
    return playbooks.filter((p) => p.stage === stage);
  }, [playbooks, stage]);

  const catalogItems = useMemo(
    () => filtered.map((pb, i) => playbookToCatalogItem(pb, i)),
    [filtered],
  );

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t === 'playbooks' || t === 'bundles') setHubTab(t);
  }, [searchParams]);

  const selectHubTab = (id: PlaybooksHubTab) => {
    setHubTab(id);
    navigate(`/admin/playbooks?tab=${id}`, { replace: true });
  };

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
          { label: `${b.playbookIds.length} playbooks`, className: finelyOsStatusChip('ok') },
          { label: b.delivery, className: DELIVERY_BADGE[b.delivery] ?? DELIVERY_BADGE.any },
        ],
        meta: [`Package ${b.packageId}`],
      })),
    [bundles],
  );

  return (
    <PageShell
      badge="Admin"
      title="Playbook library"
      subtitle={`${stats.playbookCount} task playbooks • ${stats.bundleCount} service bundles mapped to pricing catalog.`}
    >
      <div className="space-y-6">
        <FinelyUnifiedHubLayout
          eyebrow="Work OS delivery"
          title="Playbook library"
          subtitle="Browse task playbooks and service bundles — paginated catalog, not an infinite grid."
          accent="violet"
          kpis={[
            { label: 'Playbooks', value: String(stats.playbookCount), accent: 'violet' },
            { label: 'Bundles', value: String(stats.bundleCount), accent: 'emerald' },
            { label: 'Filtered', value: String(filtered.length), accent: 'sky', hint: 'Current filters' },
          ]}
          tabs={[
            { id: 'playbooks', label: 'Task playbooks', badge: filtered.length || undefined },
            { id: 'bundles', label: 'Service bundles', badge: bundles.length || undefined },
          ]}
          activeTab={hubTab}
          onTabChange={(id) => selectHubTab(id as PlaybooksHubTab)}
        >
          {hubTab === 'playbooks' ? (
            <>
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

              <div className={`${FINELY_OS_VIEW_TABS} flex-wrap`}>
                <button type="button" onClick={() => setStage('all')} className={finelyOsViewTab(stage === 'all', 'emerald')}>
                  All phases
                </button>
                {stages.map((s) => (
                  <button key={s} type="button" onClick={() => setStage(s)} className={finelyOsViewTab(stage === s, 'emerald')}>
                    {s.replace(/_/g, ' ')}
                  </button>
                ))}
              </div>

              <div className={FINELY_OS_CATALOG_SHELL}>
                <h2 className={`${FINELY_OS_ENTITY_TITLE} mb-3`}>Task playbooks</h2>
                <FinelyOsCatalogBrowser
                  items={catalogItems}
                  pageSize={24}
                  searchPlaceholder="Search playbooks by title, phase, kind…"
                  emptyMessage="No playbooks match these filters."
                  initialView="grid"
                />
              </div>
            </>
          ) : (
            <div className={FINELY_OS_CATALOG_SHELL}>
              <h2 className={`${FINELY_OS_ENTITY_TITLE} mb-3`}>Service bundles ({bundles.length})</h2>
              <FinelyOsCatalogBrowser
                items={bundleItems}
                pageSize={12}
                searchPlaceholder="Search bundles…"
                emptyMessage="No bundles found."
                initialView="grid"
              />
            </div>
          )}
        </FinelyUnifiedHubLayout>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
