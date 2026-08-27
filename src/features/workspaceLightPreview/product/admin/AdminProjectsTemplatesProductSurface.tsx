import React, { useEffect, useMemo, useState } from 'react';
import { FolderKanban, LayoutTemplate, Search, Sparkles, Tag } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { listServicePlaybookBundles } from '../../../../data/taskPlaybooksRepo';
import { allPackages, categoryLabels, formatPrice, type PricingCategory } from '../../../../config/pricingCatalog';
import { listPartnersByTenant } from '../../../../data/partnersRepo';
import { getActiveTenantId } from '../../../../tenancy/activeTenant';
import { useAuth } from '../../../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../../../tenancy/adminPartnerScope';
import { describeServiceBundle } from '../../../work/playbooks/servicePlaybookBundles';
import { provisionWorkFromPurchase } from '../../../work/playbooks/provisionWorkFromPurchase';
import { serviceLaneForCategory } from '../../../../domain/workSla';
import {
  FINELY_OS_ACTIVE_CHIP,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold } from '../components/ProductHubScaffold';

const MOSAIC_ACCENTS = ['emerald', 'violet', 'sky', 'rose'] as const;

export default function AdminProjectsTemplatesProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'sky';
  const auth = useAuth();
  const [category, setCategory] = useState<PricingCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const [partnerId, setPartnerId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [partnerIds, setPartnerIds] = useState<Set<string>>(new Set());
  const [partners, setPartners] = useState<import('../../../../domain/partners').Partner[]>([]);

  useEffect(() => {
    const u = auth.user;
    const tenantId = getActiveTenantId();
    if (!u) return;
    getAccessiblePartnerIdsForAdmin({ userId: u.id, email: u.email, tenantId }).then(setPartnerIds);
  }, [auth.user]);

  useEffect(() => {
    const tenantId = getActiveTenantId();
    listPartnersByTenant(tenantId).then((all) => {
      setPartners(all.filter((p) => partnerIds.has(p.id)));
    });
  }, [partnerIds]);

  const bundles = useMemo(() => listServicePlaybookBundles(), []);
  const packages = useMemo(() => {
    const q = query.trim().toLowerCase();
    let pkgs = allPackages.filter((p) => p.isPublic && (category === 'all' || p.category === category));
    if (q) {
      pkgs = pkgs.filter((p) =>
        [p.id, p.name, p.tagline, p.description, categoryLabels[p.category]].join(' ').toLowerCase().includes(q),
      );
    }
    return pkgs;
  }, [category, query]);

  const grouped = useMemo(() => {
    const m = new Map<string, typeof packages>();
    for (const p of packages) {
      const k = p.category;
      m.set(k, [...(m.get(k) || []), p]);
    }
    return Array.from(m.entries());
  }, [packages]);

  const selectedBundle = useMemo(() => (packageId ? describeServiceBundle(packageId) : null), [packageId]);

  const apply = () => {
    if (!partnerId || !packageId) {
      setNotice('Select a partner and package.');
      return;
    }
    const result = provisionWorkFromPurchase({ partnerId, packageId });
    if (!result) {
      setNotice('Could not provision — unknown package.');
      return;
    }
    if ('skipped' in result) {
      setNotice(`Project already exists: ${result.project.title}. Opening workspace…`);
      navigate(`/admin/projects/${result.project.id}`);
      return;
    }
    setNotice(`Created project with ${result.tasks.length} tasks.`);
    navigate(`/admin/projects/${result.project.id}`);
  };

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Delivery"
      title="Project templates"
      description="Pick a catalog package, choose a partner, and spawn a delivery project in one step."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={navItem?.icon ?? LayoutTemplate}
      primaryAction={
        <button type="button" className="fc-wlp-btn-primary" disabled={!partnerId || !packageId} onClick={apply}>
          Create project from template
        </button>
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/projects')}>
          <FolderKanban size={15} /> Projects
        </button>
      }
      metrics={[
        { label: 'Bundles', value: String(bundles.length), hint: 'Playbook bundles', accent: 'emerald' },
        { label: 'Packages', value: String(packages.length), hint: 'Public catalog', accent: 'violet' },
        { label: 'Categories', value: String(grouped.length), hint: 'Service families', accent: 'sky' },
        { label: 'Partners', value: String(partners.length), hint: 'In your scope', accent: 'rose' },
      ]}
      metricTitle="Template catalog"
      metricDescription="Large mosaic tiles — tap to select, then create at bottom."
      metricsVariant="inline"
    >
      <section className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-5`} data-fc-accent="emerald">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-emerald-700">
              <Sparkles size={16} />
              <span>Catalog mosaic</span>
            </div>
            <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
              {bundles.length} playbook bundles · {packages.length} public packages
            </p>
          </div>
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}>
            <Search size={14} className="text-emerald-500 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search packages…"
              className={`bg-transparent outline-none text-sm min-w-[200px] ${FINELY_OS_ENTITY_VALUE} placeholder:opacity-40`}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as PricingCategory | 'all')}
            className={`${FINELY_OS_ENTITY_SELECT} min-w-[180px]`}
          >
            <option value="all">All categories</option>
            {(Object.keys(categoryLabels) as PricingCategory[]).map((c) => (
              <option key={c} value={c}>
                {categoryLabels[c]}
              </option>
            ))}
          </select>
          <select
            value={partnerId}
            onChange={(e) => setPartnerId(e.target.value)}
            className={`${FINELY_OS_ENTITY_SELECT} min-w-[220px]`}
          >
            <option value="">Select partner…</option>
            {partners.map((p) => (
              <option key={p.id} value={p.id}>
                {p.profile.fullName || p.profile.email || p.id}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="space-y-10">
        {grouped.map(([cat, pkgs], groupIdx) => {
          const groupAccent = MOSAIC_ACCENTS[groupIdx % MOSAIC_ACCENTS.length];
          return (
            <section key={cat} className="space-y-5">
              <header className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_LABEL}`}>
                    <Tag size={14} />
                    {categoryLabels[cat as PricingCategory] ?? cat}
                  </div>
                </div>
                <span className={`font-mono text-sm font-bold ${FINELY_OS_ENTITY_SUBLABEL}`}>{pkgs.length} templates</span>
              </header>

              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {pkgs.map((pkg, tileIdx) => {
                  const tileAccent = MOSAIC_ACCENTS[(groupIdx + tileIdx + 1) % MOSAIC_ACCENTS.length];
                  const lane = serviceLaneForCategory(pkg.category);
                  const bundle = bundles.find((b) => b.packageId === pkg.id);
                  const selected = packageId === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setPackageId(pkg.id)}
                      className={`text-left ${finelyOsCatalogCard(tileAccent)} p-6 lg:p-8 flex flex-col gap-4 min-h-[240px] transition ring-offset-2 ${
                        selected ? 'ring-2 ring-violet-400/60' : ''
                      }`}
                      data-fc-accent={tileAccent}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className={`text-2xl font-extrabold leading-tight ${FINELY_OS_ENTITY_VALUE}`}>{pkg.name}</div>
                          {pkg.tagline ? <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm`}>{pkg.tagline}</div> : null}
                        </div>
                        {selected ? <span className={FINELY_OS_ACTIVE_CHIP}>Selected</span> : null}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <span className={finelyOsStatusChip('ok')}>{lane.label}</span>
                        <span className={FINELY_OS_ENTITY_CHIP}>{pkg.delivery}</span>
                        {bundle ? (
                          <span className={FINELY_OS_ENTITY_CHIP}>{bundle.playbookIds.length} playbooks</span>
                        ) : null}
                      </div>

                      <div className="mt-auto flex items-end justify-between gap-3">
                        <div>
                          <div className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>
                            {formatPrice(pkg.priceAmount)}
                            {pkg.interval === 'month' ? ' / mo' : ''}
                          </div>
                          <div className={`font-mono text-xs ${FINELY_OS_ENTITY_SUBLABEL}`}>{pkg.id}</div>
                        </div>
                        <LayoutTemplate size={28} className="opacity-30 shrink-0" />
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {packages.length === 0 ? (
        <div className={`${finelyOsCatalogCard('rose')} p-8 text-center`} data-fc-accent="rose">
          <p className={FINELY_OS_ENTITY_BODY}>No packages match your search or category filter.</p>
        </div>
      ) : null}

      {selectedBundle ? (
        <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Service bundle preview</div>
            <div className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{selectedBundle.bundle.name}</div>
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY} mt-2`}>
              Spawns {selectedBundle.taskCount} playbook task{selectedBundle.taskCount === 1 ? '' : 's'} · {selectedBundle.bundle.delivery} ·{' '}
              {selectedBundle.bundle.scope}
            </p>
          </div>
          <ul className="grid sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto">
            {selectedBundle.playbooks.slice(0, 8).map((pb) => (
              <li key={pb.id} className={`${finelyOsInlineListItem()} px-3 py-2 text-sm`}>
                <div className={FINELY_OS_ENTITY_VALUE}>{pb.title}</div>
                <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>{pb.kind.replace(/_/g, ' ')}</div>
              </li>
            ))}
          </ul>
          {selectedBundle.playbooks.length > 8 ? (
            <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>+{selectedBundle.playbooks.length - 8} more playbooks in bundle</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" disabled={!partnerId || !packageId} onClick={apply} className={FINELY_OS_PRIMARY_BTN}>
          <FolderKanban size={14} /> Create project from template
        </button>
        {notice ? <span className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{notice}</span> : null}
      </div>
    </ProductHubScaffold>
  );
}
