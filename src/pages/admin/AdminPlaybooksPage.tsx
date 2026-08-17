import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { X } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import {
  listServicePlaybookBundles,
  listTaskPlaybooks,
  getTaskPlaybookStats,
  getTaskPlaybook,
} from '../../data/taskPlaybooksRepo';
import type { PricingCategory } from '../../config/pricingCatalog';
import { categoryLabels } from '../../config/pricingCatalog';
import { FinelyOsCatalogBrowser, type FinelyOsCatalogItem } from '../../features/os/FinelyOsCatalogBrowser';
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
          <ul className="mt-4 space-y-2 text-sm text-white/85 list-decimal list-inside">
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
            Automation Studio
          </button>
        </div>
      </div>
    </div>
  );
}

type PlaybooksHubTab = 'playbooks' | 'bundles';

export default function AdminPlaybooksPage({ embedded = false }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [hubTab, setHubTab] = useState<PlaybooksHubTab>('playbooks');
  const [category, setCategory] = useState<PricingCategory | 'all'>('all');
  const [stage, setStage] = useState<string>('all');
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
    const sub = searchParams.get('checklistsTab');
    if (t === 'playbooks' || t === 'bundles') setHubTab(t);
    if (embedded && (sub === 'playbooks' || sub === 'bundles')) setHubTab(sub);
  }, [searchParams, embedded]);

  const selectHubTab = (id: PlaybooksHubTab) => {
    setHubTab(id);
    if (!embedded) navigate(`/admin/marketing?tab=checklists&checklistsTab=${id}`, { replace: true });
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
          { label: `${b.playbookIds.length} checklists`, className: finelyOsStatusChip('ok') },
          { label: b.delivery, className: DELIVERY_BADGE[b.delivery] ?? DELIVERY_BADGE.any },
        ],
        meta: [`Package ${b.packageId}`],
      })),
    [bundles],
  );

  const hub = (
    <FinelyUnifiedHubLayout
      eyebrow="Work OS delivery"
      title="Service delivery checklists"
      subtitle="Human step templates for projects — not automation triggers."
      accent="violet"
      kpis={[
        { label: 'Checklists', value: String(stats.playbookCount), accent: 'violet' },
        { label: 'Bundles', value: String(stats.bundleCount), accent: 'emerald' },
        { label: 'Filtered', value: String(filtered.length), accent: 'sky', hint: 'Current filters' },
      ]}
      tabs={[
        { id: 'playbooks', label: 'Task checklists', badge: filtered.length || undefined },
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
            <h2 className={`${FINELY_OS_ENTITY_TITLE} mb-3`}>Task checklists</h2>
            <FinelyOsCatalogBrowser
              items={catalogItems}
              pageSize={24}
              searchPlaceholder="Search checklists by title, phase, kind…"
              emptyMessage="No checklists match these filters."
              initialView="grid"
              onItemClick={setSelectedId}
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
  );

  const content = (
    <div className="space-y-6">
      {hub}
      {selectedPlaybook ? <PlaybookDetailDrawer playbook={selectedPlaybook} onClose={() => setSelectedId(null)} /> : null}
      {!embedded ? <FinelyOsPageFooter /> : null}
    </div>
  );

  if (embedded) return content;

  return (
    <PageShell
      badge="Admin"
      title="Service delivery checklists"
      subtitle={`${stats.playbookCount} task checklists • ${stats.bundleCount} service bundles mapped to pricing catalog.`}
    >
      {content}
    </PageShell>
  );
}
