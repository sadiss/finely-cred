import React, { useEffect, useMemo, useState } from 'react';
import { CreditCard, RefreshCw, Save, Search, Store, Trash2 } from 'lucide-react';
import { useAuth } from '../../../../auth/AuthProvider';
import { isAdminEmail } from '../../../../auth/admin';
import { getActiveTenantId } from '../../../../tenancy/activeTenant';
import { FINELY_TENANT_ID } from '../../../../domain/tenants';
import type { Vendor, VendorCategory, VendorTier } from '../../../../domain/vendors';
import { createVendor } from '../../../../domain/vendors';
import { deleteVendor, ensureVendorCatalogDefaults, listVendors, upsertVendor } from '../../../../data/vendorsRepo';
import { canAccessAdminArea, getMembershipByUserAndTenant } from '../../../../data/tenantsRepo';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_DANGER_BTN,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_LUXURY_EMPTY,
  finelyOsCatalogCard,
  finelyOsListItem,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import './adminVendorsProductSurface.css';

const CATEGORIES: VendorCategory[] = [
  'Office supplies',
  'Shipping',
  'Industrial',
  'Fuel',
  'Marketing',
  'Technology',
  'Banking',
  'General',
  'Other',
];

type TierFilter = 'all' | VendorTier;

const TIER_RAIL: Array<{ id: TierFilter; label: string; short: string; accent: 'emerald' | 'violet' | 'sky' | 'rose' }> = [
  { id: 'all', label: 'All tiers', short: 'All', accent: 'rose' },
  { id: 1, label: 'Tier 1', short: 'T1', accent: 'emerald' },
  { id: 2, label: 'Tier 2', short: 'T2', accent: 'violet' },
  { id: 3, label: 'Tier 3', short: 'T3', accent: 'sky' },
];

export default function AdminVendorsProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const auth = useAuth();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'rose';
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Vendor | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const onStore = () => setVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const email =
    auth.user?.email ||
    ((auth.user as { user_metadata?: { email?: string } })?.user_metadata?.email) ||
    ((auth.user as { identities?: { identity_data?: { email?: string } }[] })?.identities?.[0]?.identity_data?.email) ||
    '';
  const canAdmin = Boolean(email && isAdminEmail(email));

  const tenantId = useMemo(() => (getActiveTenantId() || '').trim() || FINELY_TENANT_ID, [version]);
  const membership = useMemo(() => {
    const u = auth.user;
    if (!u?.id) return null;
    return getMembershipByUserAndTenant(u.id, tenantId) ?? getMembershipByUserAndTenant(u.id, FINELY_TENANT_ID);
  }, [auth.user?.id, tenantId, version]);
  const allowByMembership = useMemo(() => canAccessAdminArea(membership), [membership]);
  const canAccess = canAdmin || allowByMembership;
  const vendors = useMemo(() => listVendors({ tenantId }), [tenantId, version]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return vendors.filter((v) => {
      if (tierFilter !== 'all' && v.tier !== tierFilter) return false;
      if (!q) return true;
      return `${v.name} ${v.category} ${(v.tags ?? []).join(' ')}`.toLowerCase().includes(q);
    });
  }, [vendors, query, tierFilter]);

  useEffect(() => {
    if (!selectedId) return;
    const v = vendors.find((x) => x.id === selectedId) ?? null;
    setDraft(v ? { ...v } : null);
  }, [selectedId, vendors.length]);

  if (!canAccess) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow="Finance"
        title="Vendor catalog"
        description="Admin-only supplier recommendations for the Business portal."
        accent={accent}
        surfaceMode={navItem?.surfaceMode ?? 'light'}
        archetype={archetype}
        icon={navItem?.icon}
      >
        <div className={FINELY_OS_LUXURY_EMPTY}>Access denied.</div>
      </ProductHubScaffold>
    );
  }

  const addVendor = () => {
    const v = createVendor({ tenantId, name: 'New vendor', tier: 1, category: 'General' });
    const saved = upsertVendor(v);
    setSelectedId(saved.id);
    setVersion((x) => x + 1);
  };

  const tierCount = (tier: TierFilter) => {
    if (tier === 'all') return vendors.length;
    return vendors.filter((v) => v.tier === tier).length;
  };

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Finance"
      title="Vendor catalog"
      description="Manage tiered vendor recommendations used in the Business portal."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={<ProductPagePrimaryAction label="Add vendor" onClick={addVendor} />}
      secondaryAction={
        <button
          type="button"
          className="fc-wlp-btn-secondary"
          onClick={() => {
            ensureVendorCatalogDefaults({ tenantId });
            setVersion((v) => v + 1);
            setNotice('Seeded vendor defaults (missing-only).');
            setTimeout(() => setNotice(null), 2500);
          }}
        >
          <RefreshCw size={14} /> Seed defaults
        </button>
      }
      metrics={[
        { label: 'Vendors', value: String(vendors.length), hint: 'In catalog', accent: 'emerald' },
        { label: 'Filtered', value: String(filtered.length), hint: 'Current view', accent: 'violet' },
        { label: 'Tier 1', value: String(vendors.filter((v) => v.tier === 1).length), hint: 'Starter accounts', accent: 'sky' },
        { label: 'Categories', value: String(new Set(vendors.map((v) => v.category)).size), hint: 'Supplier types', accent: 'rose' },
      ]}
      metricTitle="Supplier workbench"
      metricDescription="Filter by tier on the rail — edit pay terms in the inspector."
      metricsVariant="jewel"
    >
      {notice ? <div className={FINELY_OS_NOTICE_WARN}>{notice}</div> : null}

      <div className="fc-admin-vendors-workbench" data-surface-layout="split-workbench">
        <nav className="fc-admin-vendors-tier-rail" aria-label="Tier filter">
          {TIER_RAIL.map((tier) => (
            <button
              key={String(tier.id)}
              type="button"
              data-active={tierFilter === tier.id ? 'true' : undefined}
              onClick={() => setTierFilter(tier.id)}
              className={`fc-admin-vendors-tier-btn ${finelyOsCatalogCard(tier.accent)}`}
              data-fc-accent={tier.accent}
              title={tier.label}
            >
              <span className="text-lg font-extrabold">{tier.short}</span>
              <span className="opacity-80">{tierCount(tier.id)}</span>
            </button>
          ))}
        </nav>

        <aside className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-7 space-y-4`} data-fc-accent="emerald">
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <Store size={16} />
            <span>Vendor navigator</span>
          </div>
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl border border-white/10`}>
            <Search size={14} className="text-emerald-500 shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`w-full bg-transparent outline-none text-base ${FINELY_OS_ENTITY_VALUE} placeholder:opacity-40`}
              placeholder="Search vendors…"
            />
          </div>
          <FinelyOsPaginatedStack
            items={filtered}
            pageSize={12}
            emptyMessage="No vendors match."
            renderItem={(v) => (
              <button key={v.id} type="button" onClick={() => setSelectedId(v.id)} className={finelyOsListItem(selectedId === v.id, 'emerald')}>
                <div className={`${FINELY_OS_ENTITY_VALUE} font-bold text-base`}>{v.name}</div>
                <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono text-xs normal-case tracking-normal`}>
                  Tier {v.tier} • {v.category}
                </div>
              </button>
            )}
          />
        </aside>

        <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-6`} data-fc-accent="sky">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
              <CreditCard size={16} />
              <span>Pay & terms inspector</span>
            </div>
            {draft ? (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (!draft) return;
                    upsertVendor(draft);
                    setVersion((v) => v + 1);
                    setNotice('Saved.');
                    setTimeout(() => setNotice(null), 1500);
                  }}
                  className={FINELY_OS_PRIMARY_BTN}
                >
                  <Save size={14} /> Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!draft) return;
                    deleteVendor(draft.id);
                    setSelectedId(null);
                    setDraft(null);
                    setVersion((v) => v + 1);
                  }}
                  className={FINELY_OS_DANGER_BTN}
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            ) : null}
          </div>

          {!draft ? (
            <div className={FINELY_OS_LUXURY_EMPTY}>Select a vendor from the navigator to edit pay terms and portal notes.</div>
          ) : (
            <>
              <div className={`${finelyOsCatalogCard('violet')} fc-surface-harmony p-6 lg:p-7`} data-fc-accent="violet">
                <div className={FINELY_OS_ENTITY_LABEL}>Vendor identity</div>
                <div className={`mt-2 text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{draft.name}</div>
                <div className={`mt-1 font-mono text-xs ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>{draft.id}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-violet-500/15 px-3 py-1 text-sm font-bold">Tier {draft.tier}</span>
                  <span className="rounded-full bg-sky-500/15 px-3 py-1 text-sm font-bold">{draft.category}</span>
                </div>
              </div>

              <div className="fc-admin-vendors-inspector-zones">
                <label className={`${finelyOsCatalogCard('emerald')} fc-surface-harmony block p-5`} data-fc-accent="emerald">
                  <div className={FINELY_OS_ENTITY_LABEL}>Name</div>
                  <input
                    value={draft.name}
                    onChange={(e) => setDraft((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                    className={`mt-2 ${FINELY_OS_ENTITY_INPUT}`}
                  />
                </label>
                <label className={`${finelyOsCatalogCard('rose')} fc-surface-harmony block p-5`} data-fc-accent="rose">
                  <div className={FINELY_OS_ENTITY_LABEL}>Website</div>
                  <input
                    value={draft.website ?? ''}
                    onChange={(e) => setDraft((prev) => (prev ? { ...prev, website: e.target.value.trim() || undefined } : prev))}
                    className={`mt-2 ${FINELY_OS_ENTITY_INPUT}`}
                    placeholder="https://…"
                  />
                </label>
                <label className={`${finelyOsCatalogCard('sky')} fc-surface-harmony block p-5`} data-fc-accent="sky">
                  <div className={FINELY_OS_ENTITY_LABEL}>Tier</div>
                  <select
                    value={String(draft.tier)}
                    onChange={(e) => setDraft((prev) => (prev ? { ...prev, tier: Number(e.target.value) as VendorTier } : prev))}
                    className={`mt-2 ${FINELY_OS_ENTITY_INPUT}`}
                  >
                    <option value="1">Tier 1</option>
                    <option value="2">Tier 2</option>
                    <option value="3">Tier 3</option>
                  </select>
                </label>
                <label className={`${finelyOsCatalogCard('violet')} fc-surface-harmony block p-5`} data-fc-accent="violet">
                  <div className={FINELY_OS_ENTITY_LABEL}>Category</div>
                  <select
                    value={draft.category}
                    onChange={(e) => setDraft((prev) => (prev ? { ...prev, category: e.target.value as VendorCategory } : prev))}
                    className={`mt-2 ${FINELY_OS_ENTITY_INPUT}`}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className={`${finelyOsCatalogCard('emerald')} fc-surface-harmony block p-5 lg:p-6`} data-fc-accent="emerald">
                <div className={FINELY_OS_ENTITY_LABEL}>Notes</div>
                <p className={`mt-1 text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>Shown in the Business portal vendor list.</p>
                <textarea
                  value={draft.notes ?? ''}
                  onChange={(e) => setDraft((prev) => (prev ? { ...prev, notes: e.target.value || undefined } : prev))}
                  rows={4}
                  className={`mt-3 ${FINELY_OS_ENTITY_INPUT}`}
                  placeholder="Operator notes for partners."
                />
              </label>
            </>
          )}
        </div>
      </div>
    </ProductHubScaffold>
  );
}
