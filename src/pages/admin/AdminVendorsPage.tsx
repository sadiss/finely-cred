import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Trash2, Search, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { isAdminEmail } from '../../auth/admin';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import type { Vendor, VendorCategory, VendorTier } from '../../domain/vendors';
import { createVendor } from '../../domain/vendors';
import { deleteVendor, ensureVendorCatalogDefaults, listVendors, upsertVendor } from '../../data/vendorsRepo';
import { canAccessAdminArea, getMembershipByUserAndTenant } from '../../data/tenantsRepo';

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
  const navigate = useNavigate();
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
        <div className="rounded-2xl border border-white/10 bg-black/30 p-6 text-white/60">Access denied.</div>
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
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                ensureVendorCatalogDefaults({ tenantId });
                setVersion((v) => v + 1);
                setNotice('Seeded vendor defaults (missing-only).');
                setTimeout(() => setNotice(null), 2500);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
            >
              <RefreshCw size={14} /> Seed defaults
            </button>
            <button
              type="button"
              onClick={() => {
                const v = createVendor({
                  tenantId,
                  name: 'New vendor',
                  tier: 1,
                  category: 'General',
                });
                const saved = upsertVendor(v);
                setSelectedId(saved.id);
                setVersion((x) => x + 1);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
            >
              <Plus size={14} /> Add vendor
            </button>
          </div>
        </div>

        {notice ? <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">{notice}</div> : null}

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
            <div className="flex items-center gap-2 text-white/70">
              <Search size={14} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent outline-none text-sm text-white/80 placeholder:text-white/30"
                placeholder="Search vendors…"
              />
            </div>
            <div className="grid gap-2">
              {filtered.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedId(v.id)}
                  className={`text-left rounded-2xl border p-4 transition-all ${
                    selectedId === v.id ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.03]'
                  }`}
                >
                  <div className="text-white font-semibold">{v.name}</div>
                  <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                    Tier {v.tier} • {v.category}
                  </div>
                </button>
              ))}
              {filtered.length === 0 ? <div className="text-white/50 text-sm">No vendors match.</div> : null}
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-4">
            {!draft ? (
              <div className="text-white/60 text-sm">Select a vendor to edit.</div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Edit vendor</div>
                    <div className="mt-1 text-white font-semibold">{draft.name}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">{draft.id}</div>
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
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
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
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/30 bg-red-500/10 text-red-200 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all"
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <label className="block">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Name</div>
                    <input
                      value={draft.name}
                      onChange={(e) => setDraft((prev) => (prev ? { ...prev, name: e.target.value } : prev))}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </label>
                  <label className="block">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Website</div>
                    <input
                      value={draft.website ?? ''}
                      onChange={(e) => setDraft((prev) => (prev ? { ...prev, website: e.target.value.trim() || undefined } : prev))}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="https://…"
                    />
                  </label>
                  <label className="block">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Tier</div>
                    <select
                      value={String(draft.tier)}
                      onChange={(e) => setDraft((prev) => (prev ? { ...prev, tier: Number(e.target.value) as VendorTier } : prev))}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="1">Tier 1</option>
                      <option value="2">Tier 2</option>
                      <option value="3">Tier 3</option>
                    </select>
                  </label>
                  <label className="block">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Category</div>
                    <select
                      value={draft.category}
                      onChange={(e) => setDraft((prev) => (prev ? { ...prev, category: e.target.value as VendorCategory } : prev))}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
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
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Notes</div>
                  <textarea
                    value={draft.notes ?? ''}
                    onChange={(e) => setDraft((prev) => (prev ? { ...prev, notes: e.target.value || undefined } : prev))}
                    rows={4}
                    className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                    placeholder="Operator notes shown in the Business portal."
                  />
                </label>
              </>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

