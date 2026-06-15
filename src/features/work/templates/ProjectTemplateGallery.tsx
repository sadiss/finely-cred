import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, FolderKanban, Sparkles } from 'lucide-react';
import { PageShell } from '../../../components/layout/PageShell';
import { listServicePlaybookBundles } from '../../../data/taskPlaybooksRepo';
import { allPackages, categoryLabels, formatPrice, type PricingCategory } from '../../../config/pricingCatalog';
import { listPartnersByTenant } from '../../../data/partnersRepo';
import { getActiveTenantId } from '../../../tenancy/activeTenant';
import { useAuth } from '../../../auth/AuthProvider';
import { getAccessiblePartnerIdsForAdmin } from '../../../tenancy/adminPartnerScope';
import { describeServiceBundle } from '../playbooks/servicePlaybookBundles';
import { provisionWorkFromPurchase } from '../playbooks/provisionWorkFromPurchase';
import { serviceLaneForCategory } from '../../../domain/workSla';
import { FinelyOsCatalogBrowser, type FinelyOsCatalogItem } from '../../os/FinelyOsCatalogBrowser';
import {FINELY_OS_ACTIVE_CHIP, FINELY_OS_BACK_LINK, FINELY_OS_BANNER, FINELY_OS_CATALOG_SHELL, FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_INPUT, FINELY_OS_ENTITY_PANEL_INNER, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_ENTITY_VALUE, FINELY_OS_PRIMARY_BTN, finelyOsStatusChip, finelyOsInlineListItem,
  finelyOsCatalogCard,} from '../../os/finelyOsLightUi';

export function ProjectTemplateGallery({ embedded }: { embedded?: boolean }) {
  const navigate = useNavigate();
  const auth = useAuth();
  const [category, setCategory] = useState<PricingCategory | 'all'>('all');
  const [partnerId, setPartnerId] = useState('');
  const [packageId, setPackageId] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [partnerIds, setPartnerIds] = useState<Set<string>>(new Set());
  const [partners, setPartners] = useState<import('../../../domain/partners').Partner[]>([]);

  React.useEffect(() => {
    const u = auth.user;
    const tenantId = getActiveTenantId();
    if (!u) return;
    getAccessiblePartnerIdsForAdmin({ userId: u.id, email: u.email, tenantId }).then(setPartnerIds);
  }, [auth.user]);

  React.useEffect(() => {
    const tenantId = getActiveTenantId();
    listPartnersByTenant(tenantId).then((all) => {
      setPartners(all.filter((p) => partnerIds.has(p.id)));
    });
  }, [partnerIds]);

  const bundles = useMemo(() => listServicePlaybookBundles(), []);
  const packages = useMemo(() => {
    return allPackages.filter((p) => p.isPublic && (category === 'all' || p.category === category));
  }, [category]);

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

  const packageItems = useMemo((): FinelyOsCatalogItem[] => {
    return packages.map((pkg, i) => {
      const lane = serviceLaneForCategory(pkg.category);
      const bundle = bundles.find((b) => b.packageId === pkg.id);
      return {
        id: pkg.id,
        title: pkg.name,
        subtitle: categoryLabels[pkg.category],
        description: pkg.tagline,
        groupKey: pkg.category,
        accentIndex: i,
        badges: [
          { label: lane.label, className: lane.className },
          { label: pkg.delivery, className: 'border-white/[0.08] bg-white/[0.07] text-white/60' },
          ...(bundle ? [{ label: `${bundle.playbookIds.length} playbooks`, className: finelyOsStatusChip('ok') }] : []),
        ],
        meta: [`${formatPrice(pkg.priceAmount)}${pkg.interval === 'month' ? ' / mo' : ''}`],
      };
    });
  }, [packages, bundles]);

  const body = (
    <div className="space-y-4">
      {!embedded ? (
        <button type="button" onClick={() => navigate('/admin/projects')} className={FINELY_OS_BACK_LINK}>
          <ArrowLeft size={16} /> Projects
        </button>
      ) : null}

      <div className={FINELY_OS_BANNER}>
        <Sparkles className="text-emerald-300 shrink-0 mt-0.5" size={18} />
        <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
          Start a delivery project from any pricing package — playbooks auto-map from the catalog ({bundles.length} bundles).
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <select value={category} onChange={(e) => setCategory(e.target.value as PricingCategory | 'all')} className={FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}>
          <option value="all">All categories</option>
          {(Object.keys(categoryLabels) as PricingCategory[]).map((c) => (
            <option key={c} value={c}>{categoryLabels[c]}</option>
          ))}
        </select>
        <select value={partnerId} onChange={(e) => setPartnerId(e.target.value)} className={`${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')} min-w-[200px]`}>
          <option value="">Select partner…</option>
          {partners.map((p) => (
            <option key={p.id} value={p.id}>{p.profile.fullName || p.profile.email || p.id}</option>
          ))}
        </select>
      </div>

      <div className={FINELY_OS_CATALOG_SHELL}>
        <FinelyOsCatalogBrowser
          items={packageItems}
          pageSize={12}
          searchPlaceholder="Search packages…"
          emptyMessage="No packages in this category."
          onItemClick={setPackageId}
          initialView="grid"
          renderTrailing={(item) =>
            packageId === item.id ? (
              <span className={FINELY_OS_ACTIVE_CHIP}>Selected</span>
            ) : null
          }
        />
      </div>

      {selectedBundle ? (
        <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Service bundle preview</div>
            <div className={FINELY_OS_ENTITY_VALUE}>{selectedBundle.bundle.name}</div>
            <p className={`text-sm ${FINELY_OS_ENTITY_BODY} mt-1`}>
              Spawns {selectedBundle.taskCount} playbook task{selectedBundle.taskCount === 1 ? '' : 's'} · {selectedBundle.bundle.delivery} · {selectedBundle.bundle.scope}
            </p>
          </div>
          <ul className="grid sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
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
        <button
          type="button"
          disabled={!partnerId || !packageId}
          onClick={apply}
          className={FINELY_OS_PRIMARY_BTN}
        >
          <FolderKanban size={14} /> Create project from template
        </button>
        {notice ? <span className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>{notice}</span> : null}
      </div>
    </div>
  );

  if (embedded) return body;

  return (
    <PageShell badge="Admin" title="Project templates" subtitle="Template gallery — one click to spawn a catalog-backed delivery project.">
      {body}
    </PageShell>
  );
}

export default function AdminProjectTemplatesPage() {
  return <ProjectTemplateGallery />;
}
