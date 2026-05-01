import React, { useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, ArrowRight, ArrowLeft, Upload } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { createPartner, listPartnersByTenant } from '../../data/partnersRepo';
import type { PartnerLane, PartnerRoute } from '../../domain/partners';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { getTenant } from '../../data/tenantsRepo';
import { useAuth } from '../../auth/AuthProvider';
import { isAdminEmail } from '../../auth/admin';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';
import { canViewAllClients, getMembershipByUserAndTenant, isPlatformAdmin } from '../../data/tenantsRepo';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { ActionLink, Button, ClickableCard } from '../../components/ui';

export default function PartnersListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [searchParams] = useSearchParams();
  const addAffiliate = searchParams.get('add') === 'affiliate';
  const [q, setQ] = useState('');
  const [version, setVersion] = useState(0);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [primaryRoute, setPrimaryRoute] = useState<PartnerRoute>('personal_restore');
  const [lane, setLane] = useState<PartnerLane | undefined>(() => (addAffiliate ? 'affiliate' : undefined));
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);

  useEffect(() => {
    if (location.hash === '#create-partner') {
      const el = document.getElementById('create-partner');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  const partners = useMemo(() => {
    const tenantId = getActiveTenantId();
    const allowed = auth.user
      ? getAccessiblePartnerIdsForAdmin({ userId: auth.user.id, email: auth.user.email, tenantId })
      : new Set<string>();
    const all = listPartnersByTenant(tenantId).filter((p) => allowed.has(p.id));
    const query = q.trim().toLowerCase();
    if (!query) return all;
    return all.filter((p) => {
      const hay = `${p.profile.fullName} ${p.profile.email ?? ''} ${p.status}`.toLowerCase();
      return hay.includes(query);
    });
  }, [auth.user, q, version]);

  const canCreatePartner = useMemo(() => {
    const tenantId = getActiveTenantId();
    const u = auth.user;
    if (!u) return false;
    // Email-based platform admins (bootstrap) can always create.
    if (isAdminEmail(u.email)) return true;
    try {
      const membership =
        getMembershipByUserAndTenant(u.id, tenantId) ?? getMembershipByUserAndTenant(u.id, FINELY_TENANT_ID);
      if (membership) {
        if (membership.status !== 'active') return false;
        if (isPlatformAdmin(membership) || membership.role === 'tenant_owner' || canViewAllClients(membership)) return true;
      }
      const allowed = getAccessiblePartnerIdsForAdmin({ userId: u.id, email: u.email, tenantId });
      // If we can view any partners in-tenant, we treat this as an ops-capable account.
      if (allowed.size > 0) {
        // If no membership record exists yet, allow creation so ops can bootstrap the tenant.
        if (!membership) return true;
        // membership handled above
        return false;
      }
    } catch {
      // ignore
    }
    return false;
  }, [auth.user, version]);

  const tenantName = useMemo(() => {
    const t = getTenant(getActiveTenantId());
    return t?.name || 'Finely Cred';
  }, [version]);

  return (
    <PageShell
      badge="Admin"
      title="Partner Management"
      subtitle="Partners are your clients. Every report, evidence item, dispute, and letter is anchored to a Partner profile for auditability."
    >
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4">
          <ActionLink to="/dashboard" title="Back to Finely Cred Dashboard" icon={<ArrowLeft size={16} />}>
            Dashboard
          </ActionLink>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/admin/partners/import')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/25 bg-amber-500/10 text-amber-200 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all"
              title="Import partners from legacy software"
            >
              <Upload size={14} /> Import partners
            </button>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
              tenant: {tenantName}
            </div>
          </div>
        </div>

        <div id="create-partner" className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
          <div className="flex items-center gap-3 text-amber-400">
            <UserPlus size={16} />
            <span className="text-xs font-semibold uppercase tracking-wider">Create Partner</span>
          </div>

          {!canCreatePartner ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/30 p-4 text-white/60 text-sm">
              Your role doesn’t allow creating new partners in this tenant. Ask an admin/owner to grant access or assign you clients.
            </div>
          ) : null}

          {createErr && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200/90 text-sm">
              {createErr}
            </div>
          )}

          <div className="mt-5 grid md:grid-cols-3 gap-4">
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="Partner full name"
              />
              <div className="mt-2 text-[11px] text-white/40">Required to enable “Create Partner”.</div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="partner@email.com"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Primary route</label>
              <select
                value={primaryRoute}
                onChange={(e) => setPrimaryRoute(e.target.value as PartnerRoute)}
                className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="personal_restore">Personal Credit Restore</option>
                <option value="personal_build">Personal Credit Building</option>
                <option value="business_build">Business Credit Building</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Lane (optional)</label>
              <select
                value={lane ?? ''}
                onChange={(e) => setLane((e.target.value || undefined) as PartnerLane | undefined)}
                className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
              >
                <option value="">—</option>
                <option value="affiliate">Affiliate</option>
                <option value="agent">Agent</option>
                <option value="au_tradelines">AU Tradelines</option>
                <option value="funding_readiness">Funding Readiness</option>
                <option value="business_credit">Business Credit</option>
                <option value="debt_kill">Debt Kill</option>
                <option value="primary_tradeline">Primary Tradeline</option>
                <option value="other">Other</option>
              </select>
              {addAffiliate && <div className="mt-2 text-[11px] text-amber-400/80">Pre-selected for affiliate add flow.</div>}
            </div>
          </div>

          <div className="mt-5">
            <button
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={!canCreatePartner || !fullName.trim() || creating}
              onClick={() => {
                setCreateErr(null);
                const name = fullName.trim();
                if (!name) {
                  setCreateErr('Full name is required.');
                  return;
                }
                setCreating(true);
                try {
                  const p = createPartner({
                    tenantId: getActiveTenantId(),
                    fullName: name,
                    email: email.trim() || undefined,
                    primaryRoute,
                    lane,
                    intake: {},
                  });
                  setFullName('');
                  setEmail('');
                  setVersion((v) => v + 1);
                  navigate(`/admin/partners/${p.id}?tab=reports`);
                } catch (e: any) {
                  setCreateErr(e?.message || 'Failed to create partner.');
                } finally {
                  setCreating(false);
                }
              }}
            >
              {creating ? 'Creating…' : 'Create Partner'} <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-white/60">
              <Search size={16} className="text-white/40" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="bg-transparent outline-none w-72 max-w-full text-white/80 placeholder:text-white/20"
                placeholder="Search partners…"
              />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-white/40">{partners.length} partners</div>
          </div>

          <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {partners.map((p) => (
              <ClickableCard
                key={p.id}
                onClick={() => {
                  navigate(`/admin/partners/${p.id}`);
                }}
                className="p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-white font-semibold truncate">{p.profile.fullName}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                      {p.profile.email || 'no-email'} • {p.status}
                    </p>
                  </div>
                  <ArrowRight size={16} className="text-amber-400 shrink-0" />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex"
                    title="Upload a credit report for this partner"
                  >
                    <Button size="sm" variant="primary" onClick={() => navigate(`/admin/partners/${p.id}?tab=reports`)}>
                      Upload report <ArrowRight size={12} />
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/partners/${p.id}?tab=letters`);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    title="Open Letters module"
                  >
                    Letters <ArrowRight size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/admin/partners/${p.id}?tab=notes`);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    title="Open Partner notes"
                  >
                    Notes <ArrowRight size={12} />
                  </button>
                </div>
              </ClickableCard>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

