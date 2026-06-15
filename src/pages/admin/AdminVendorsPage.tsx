import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2, Search, RefreshCw, Store } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { isAdminEmail } from '../../auth/admin';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import type { Vendor, VendorCategory, VendorTier } from '../../domain/vendors';
import { createVendor } from '../../domain/vendors';
import { deleteVendor, ensureVendorCatalogDefaults, listVendors, upsertVendor } from '../../data/vendorsRepo';
import { canAccessAdminArea, getMembershipByUserAndTenant } from '../../data/tenantsRepo';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsOverviewStatTile } from '../../features/os/FinelyOsOverviewStatTile';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import {
  FINELY_OS_PAGE,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_DANGER_BTN,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_LUXURY_EMPTY,
  finelyOsCatalogCard,
  finelyOsListItem,
} from '../../features/os/finelyOsLightUi';

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

export default function AdminVendorsPage() {
  const auth = useAuth();
  const [version, setVersion] = useState(0);
  const [query, setQuery] = useState('');
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
    ((auth.user as any)?.user_metadata?.email as string | undefined) ||
    ((auth.user as any)?.identities?.[0]?.identity_data?.email as string | undefined) ||
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
    if (!q) return vendors;
    return vendors.filter((v) => `${v.name} ${v.category} ${(v.tags ?? []).join(' ')}`.toLowerCase().includes(q));
  }, [vendors, query]);

  useEffect(() => {
    if (!selectedId) return;
    const v = vendors.find((x) => x.id === selectedId) ?? null;
    setDraft(v ? { ...v } : null);
  }, [selectedId, vendors.length]);

  if (!canAccess) {
    return (
      <PageShell badge="Admin" title="Vendor Catalog" subtitle="Admin-only.">
        <div className={FINELY_OS_LUXURY_EMPTY}>Access denied.</div>
      </PageShell>
    );
  }

  return (
    <PageShell
      badge="Admin"
      title="Vendor Catalog"
      subtitle="Manage the tiered vendor recommendations used in the Business portal."
      back={{ to: -1 }}
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => {
              ensureVendorCatalogDefaults({ tenantId });
              setVersion((v) => v + 1);
              setNotice('Seeded vendor defaults (missing-only).');
              setTimeout(() => setNotice(null), 2500);
            }}
            className={FINELY_OS_SECONDARY_BTN}
          >
            <RefreshCw size={14} /> Seed defaults
          </button>
          <button
            type="button"
            onClick={() => {
              const v = createVendor({ tenantId, name: 'New vendor', tier: 1, category: 'General' });
              const saved = upsertVendor(v);
              setSelectedId(saved.id);
              setVersion((x) => x + 1);
            }}
            className={FINELY_OS_PRIMARY_BTN}
          >
            <Plus size={14} /> Add vendor
          </button>
        </div>

        {notice ? <div className={FINELY_OS_NOTICE_WARN}>{notice}</div> : null}

        <div className="grid sm:grid-cols-2 gap-4">
          <FinelyOsOverviewStatTile icon={Store} label="Vendors" value={vendors.length} accent="amber" iconAccent="amber" />
          <FinelyOsOverviewStatTile icon={Search} label="Filtered" value={filtered.length} accent="violet" iconAccent="violet" />
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-5 space-y-3 ${finelyOsCatalogCard('amber')} !p-5`} data-fc-accent="amber">
            <div className={`flex items-center gap-2 ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}>
              <Search size={14} className="text-emerald-700 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className={`w-full bg-transparent outline-none text-sm ${FINELY_OS_ENTITY_VALUE} placeholder:text-white/35`}
                placeholder="Search vendors…"
              />
            </div>
            <FinelyOsPaginatedStack
              items={filtered}
              pageSize={12}
              emptyMessage="No vendors match."
              renderItem={(v) => (
                <button key={v.id} type="button" onClick={() => setSelectedId(v.id)} className={finelyOsListItem(selectedId === v.id, 'amber')}>
                  <div className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{v.name}</div>
                  <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
                    Tier {v.tier} • {v.category}
                  </div>
                </button>
              )}
            />
          </div>

          <div className={`lg:col-span-7 space-y-4 ${finelyOsCatalogCard('violet')} !p-5`} data-fc-accent="violet">
            {!draft ? (
              <div className={FINELY_OS_LUXURY_EMPTY}>Select a vendor to edit.</div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className={FINELY_OS_ENTITY_LABEL}>Edit vendor</div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_VALUE} font-semibold`}>{draft.name}</div>
                    <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>{draft.id}</div>
                  </div>
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
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <label className="block">
                    <div className={FINELY_OS_ENTITY_LABEL}>Name</div>
                    <input
                      value={draft.name}
                      onChange={(e) => setDraft((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                      className={FINELY_OS_ENTITY_INPUT}
                    />
                  </label>
                  <label className="block">
                    <div className={FINELY_OS_ENTITY_LABEL}>Website</div>
                    <input
                      value={draft.website ?? ''}
                      onChange={(e) => setDraft((prev) => (prev ? { ...prev, website: e.target.value.trim() || undefined } : prev))}
                      className={FINELY_OS_ENTITY_INPUT}
                      placeholder="https://…"
                    />
                  </label>
                  <label className="block">
                    <div className={FINELY_OS_ENTITY_LABEL}>Tier</div>
                    <select
                      value={String(draft.tier)}
                      onChange={(e) => setDraft((prev) => (prev ? { ...prev, tier: Number(e.target.value) as VendorTier } : prev))}
                      className={FINELY_OS_ENTITY_INPUT}
                    >
                      <option value="1">Tier 1</option>
                      <option value="2">Tier 2</option>
                      <option value="3">Tier 3</option>
                    </select>
                  </label>
                  <label className="block">
                    <div className={FINELY_OS_ENTITY_LABEL}>Category</div>
                    <select
                      value={draft.category}
                      onChange={(e) => setDraft((prev) => (prev ? { ...prev, category: e.target.value as VendorCategory } : prev))}
                      className={FINELY_OS_ENTITY_INPUT}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>Notes</div>
                  <textarea
                    value={draft.notes ?? ''}
                    onChange={(e) => setDraft((prev) => (prev ? { ...prev, notes: e.target.value || undefined } : prev))}
                    rows={4}
                    className={FINELY_OS_ENTITY_INPUT}
                    placeholder="Operator notes shown in the Business portal."
                  />
                </label>
              </>
            )}
          </div>
        </div>
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}

