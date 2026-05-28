import React, { useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, ArrowRight, ArrowLeft, Upload, Trash2, Badge, RefreshCcw } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { createPartner, listPartnersByTenant } from '../../data/partnersRepo';
import { deletePartnerCompletely } from '../../data/partnerDelete';
import type { Partner, PartnerLane, PartnerRoute } from '../../domain/partners';
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
  const [fetchKey, setFetchKey] = useState(0);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [primaryRoute, setPrimaryRoute] = useState<PartnerRoute>('personal_restore');
  const [lane, setLane] = useState<PartnerLane | undefined>(() => (addAffiliate ? 'affiliate' : undefined));
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);

  useEffect(() => {
    if (location.hash === '#create-partner') {
      const el = document.getElementById('create-partner');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  // Fetch partners directly from Supabase
  useEffect(() => {
    if (!auth.user) { setLoading(false); return; }
    const tenantId = getActiveTenantId();
    setLoading(true);
    getAccessiblePartnerIdsForAdmin({ userId: auth.user.id, email: auth.user.email, tenantId })
      .then(async (allowed) => {
        const all = await listPartnersByTenant(tenantId);
        return all.filter((p) => allowed.has(p.id));
      })
      .then((data) => {
        setPartners(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [auth.user, fetchKey]);

  const filteredPartners = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return partners;
    return partners.filter((p) => {
      const hay = `${p.profile.fullName} ${p.profile.email ?? ''} ${p.status}`.toLowerCase();
      return hay.includes(query);
    });
  }, [partners, q]);



  const handleDeletePartner = async (partner: Partner) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${partner.profile.fullName}" and all their data?\n\nThis includes:\n• All partner notes\n• All credit reports\n• All letters\n\nThis action cannot be undone.`
    );

    if (!confirmed) return;

    setDeleting(partner.id);
    setDeleteErr(null);

    try {
      const result = await deletePartnerCompletely(partner.id);
      if (result.ok) {
        setFetchKey((v) => v + 1);
        setDeleting(null);
      } else {
        setDeleteErr(result.error || 'Failed to delete partner');
        setDeleting(null);
      }
    } catch (e: any) {
      setDeleteErr(e?.message || 'Failed to delete partner');
      setDeleting(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-300', label: 'Active' };
      case 'lead':
        return { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-300', label: 'Pending' };
      case 'paused':
        return { bg: 'bg-orange-500/20', border: 'border-orange-500/40', text: 'text-orange-300', label: 'Paused' };
      default:
        return { bg: 'bg-white/10', border: 'border-white/20', text: 'text-white/60', label: status };
    }
  };

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
    } catch {
      // ignore
    }
    return false;
  }, [auth.user]);

  const tenantName = useMemo(() => {
    const t = getTenant(getActiveTenantId());
    return t?.name || 'Finely Cred';
  }, []);

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
              onClick={() => setFetchKey((v) => v + 1)}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-500/25 bg-blue-500/10 hover:bg-blue-500/20 text-blue-200 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              title="Refresh partners from Supabase"
            >
              <RefreshCcw size={12} />
              {loading ? 'Loading…' : 'Refresh'}
            </button>
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

          {deleteErr && (
            <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-200/90 text-sm">
              {deleteErr}
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
              onClick={async () => {
                setCreateErr(null);
                const name = fullName.trim();
                if (!name) {
                  setCreateErr('Full name is required.');
                  return;
                }
                setCreating(true);
                try {
                  const p = await createPartner({
                    tenantId: getActiveTenantId(),
                    fullName: name,
                    email: email.trim() || undefined,
                    primaryRoute,
                    lane,
                    intake: {},
                  });
                  setFullName('');
                  setEmail('');
                  setFetchKey((v) => v + 1);
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
          <div className="space-y-4">
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
              <div className="text-[10px] uppercase tracking-widest text-white/40">{filteredPartners.length} partners{loading ? ' (loading…)' : ''}</div>
            </div>

            <div className="text-[11px] text-white/50 leading-relaxed">
              <div className="font-semibold text-white/70 mb-2">Partner Sources:</div>
              <ul className="space-y-1 ml-3">
                <li><span className="text-emerald-300">●</span> Created manually via "Create Partner" form</li>
                <li><span className="text-amber-300">●</span> Signed up users (auto-created on first login)</li>
              </ul>
            </div>


          </div>

          <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPartners.map((p) => (
              <ClickableCard
                key={p.id}
                onClick={() => {
                  navigate(`/admin/partners/${p.id}`);
                }}
                className="p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-white font-semibold truncate">{p.profile.fullName}</p>
                    <p className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                      {p.profile.email || 'no-email'}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[9px] font-bold uppercase tracking-widest whitespace-nowrap ${getStatusBadge(p.status).bg} ${getStatusBadge(p.status).border} ${getStatusBadge(p.status).text}`}>
                      <Badge size={10} />
                      {getStatusBadge(p.status).label}
                    </div>
                    <ArrowRight size={16} className="text-amber-400 shrink-0" />
                  </div>
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
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePartner(p);
                    }}
                    disabled={deleting === p.id}
                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-[10px] font-black uppercase tracking-widest text-red-400 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    title="Delete partner and all associated data"
                  >
                    {deleting === p.id ? (
                      <>Deleting…</>
                    ) : (
                      <>
                        <Trash2 size={12} /> Delete
                      </>
                    )}
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

