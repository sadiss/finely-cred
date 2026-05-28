import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Shield, Users, Globe, Settings, CheckCircle2, AlertCircle, Lock, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { ActionLink, Button, ClickableCard, CollapsibleSection } from '../../components/ui';
import { ADMIN_EMAIL_ALLOWLIST, isAdminEmail } from '../../auth/admin';
import { getActiveTenantId, setActiveTenantId } from '../../tenancy/activeTenant';
import { listTenants } from '../../data/tenantsRepo';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import {
  canManageTeam,
  canUseFinanceTools,
  canViewAllClients,
  getMembershipByUserAndTenant,
  isPlatformAdmin,
} from '../../data/tenantsRepo';
import { getAccessiblePartnerIdsForAdmin } from '../../tenancy/adminPartnerScope';
import { loadSettings, updateSecuritySettings } from '../../data/settingsRepo';
import { listAuditEventsByTenant } from '../../data/auditRepo';

function normalizeEmail(v: string) {
  return String(v || '')
    .trim()
    .toLowerCase();
}

function badge(cls: string) {
  return `px-2.5 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${cls}`;
}

export default function AdminAccessCenterPage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const user = auth.user;

  const [storeVersion, setStoreVersion] = useState(0);
  const [draftAdminEmail, setDraftAdminEmail] = useState('');
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const activeTenantId = useMemo(() => getActiveTenantId(), [storeVersion]);
  const tenants = useMemo(() => listTenants().slice().sort((a, b) => a.name.localeCompare(b.name)), [storeVersion]);
  const activeTenant = useMemo(() => tenants.find((t) => t.id === activeTenantId) ?? null, [tenants, activeTenantId]);

  const email =
    user?.email ||
    ((user as any)?.user_metadata?.email as string | undefined) ||
    ((user as any)?.identities?.[0]?.identity_data?.email as string | undefined) ||
    '';

  const isAllowlisted = useMemo(() => (email ? isAdminEmail(email) : false), [email, storeVersion]);

  const membershipActive = useMemo(() => {
    if (!user?.id) return null;
    return getMembershipByUserAndTenant(user.id, activeTenantId) ?? null;
  }, [user?.id, activeTenantId, storeVersion]);

  const membershipPlatform = useMemo(() => {
    if (!user?.id) return null;
    return getMembershipByUserAndTenant(user.id, FINELY_TENANT_ID) ?? null;
  }, [user?.id, storeVersion]);

  const allowByMembership = useMemo(() => {
    const m = membershipActive ?? membershipPlatform;
    return Boolean(
      m?.status === 'active' &&
        (isPlatformAdmin(m) || m.role === 'tenant_owner' || canViewAllClients(m) || m.role === 'agent'),
    );
  }, [membershipActive, membershipPlatform]);

  const effectiveAdmin = isAllowlisted || allowByMembership;

  const caps = useMemo(() => {
    if (isAllowlisted) {
      return { canManageTeam: true, canManageTenants: true, canViewAllClients: true, canUseFinanceTools: true };
    }
    const m = membershipActive ?? membershipPlatform;
    const ok = Boolean(m?.status === 'active' && (isPlatformAdmin(m) || m.role === 'tenant_owner'));
    return {
      canManageTeam: ok || canManageTeam(m),
      canManageTenants: ok,
      canViewAllClients: ok || canViewAllClients(m),
      canUseFinanceTools: ok || canUseFinanceTools(m),
    };
  }, [isAllowlisted, membershipActive, membershipPlatform]);

  const [accessiblePartnerCount, setAccessiblePartnerCount] = useState(0);
  useEffect(() => {
    if (!user?.id) { setAccessiblePartnerCount(0); return; }
    getAccessiblePartnerIdsForAdmin({ userId: user.id, email, tenantId: activeTenantId })
      .then((set) => setAccessiblePartnerCount(set.size));
  }, [user?.id, email, activeTenantId, storeVersion]);

  const security = useMemo(() => loadSettings().security ?? { adminEmails: [] }, [storeVersion]);
  const runtimeAdminEmails = useMemo(() => {
    const extra = Array.isArray((security as any)?.adminEmails) ? (security as any).adminEmails : [];
    return extra.map(normalizeEmail).filter(Boolean).sort();
  }, [security]);

  const bootstrap = useMemo(() => Array.from(ADMIN_EMAIL_ALLOWLIST).slice().sort(), []);

  const funnel = useMemo(() => {
    const sinceMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const events = listAuditEventsByTenant(activeTenantId).filter((e) => {
      const ms = Date.parse(e.createdAt);
      return Number.isFinite(ms) ? ms >= sinceMs : true;
    });
    const get = (action: string) => events.filter((e) => e.action === action).length;
    return {
      events7d: events.length,
      reportsUploaded: get('report.uploaded'),
      evidenceCaptured: get('evidence.captured'),
      disputesSelected: get('letter.disputes_selected'),
      letterGenerated: get('letter.generated'),
      letterSaved: get('letter.saved'),
    };
  }, [activeTenantId, storeVersion]);

  const addAdminEmail = () => {
    const e = normalizeEmail(draftAdminEmail);
    if (!e) return;
    const next = Array.from(new Set([...(runtimeAdminEmails ?? []), e])).sort();
    updateSecuritySettings({ adminEmails: next });
    setDraftAdminEmail('');
    setNotice(`Added admin email: ${e}`);
    window.setTimeout(() => setNotice(null), 2500);
  };

  const removeAdminEmail = (e: string) => {
    const next = (runtimeAdminEmails ?? []).filter((x: string) => x !== e);
    updateSecuritySettings({ adminEmails: next });
    setNotice(`Removed admin email: ${e}`);
    window.setTimeout(() => setNotice(null), 2500);
  };

  return (
    <PageShell
      badge="Admin"
      title="Admin Control Center"
      subtitle="One place to control admin access, team roles, and system settings — without hunting across the platform."
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ActionLink to="/admin" icon={<ArrowLeft size={16} />}>
            Admin Dashboard
          </ActionLink>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setStoreVersion((v) => v + 1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
              title="Refresh"
            >
              <RefreshCcw size={14} /> Refresh
            </button>
            <Button variant="primary" size="sm" onClick={() => navigate('/admin/settings')}>
              System Settings <ArrowRight size={14} />
            </Button>
          </div>
        </div>

        {notice ? (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-emerald-100 text-sm">
            {notice}
          </div>
        ) : null}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          <ClickableCard title="System Settings" onClick={() => navigate('/admin/settings')} className="p-5 text-left">
            <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold">
              <Settings size={16} /> System Settings
            </div>
            <div className="mt-2 text-white/55 text-sm">Security, feature flags, pricing, integrations.</div>
          </ClickableCard>
          <ClickableCard title="Team & Roles" onClick={() => navigate('/admin/team')} className="p-5 text-left">
            <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold">
              <Users size={16} /> Team & Roles
            </div>
            <div className="mt-2 text-white/55 text-sm">Invite, roles, permission visibility.</div>
          </ClickableCard>
          <ClickableCard title="Billing" onClick={() => navigate('/admin/billing')} className="p-5 text-left">
            <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold">
              <Lock size={16} /> Billing & Entitlements
            </div>
            <div className="mt-2 text-white/55 text-sm">Plans, entitlements, access grants.</div>
          </ClickableCard>
          <ClickableCard title="Templates" onClick={() => navigate('/admin/templates')} className="p-5 text-left">
            <div className="flex items-center gap-2 text-amber-300 text-sm font-semibold">
              <Shield size={16} /> Templates
            </div>
            <div className="mt-2 text-white/55 text-sm">Template vault + generator library.</div>
          </ClickableCard>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-white/40">Funnel snapshot (last 7 days)</div>
          <div className="grid md:grid-cols-2 xl:grid-cols-6 gap-3">
            {[
              { k: 'Reports', v: funnel.reportsUploaded },
              { k: 'Evidence', v: funnel.evidenceCaptured },
              { k: 'Disputes picked', v: funnel.disputesSelected },
              { k: 'Letters generated', v: funnel.letterGenerated },
              { k: 'Letters saved', v: funnel.letterSaved },
              { k: 'Events', v: funnel.events7d },
            ].map((x) => (
              <div key={x.k} className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
                <div className="text-[10px] uppercase tracking-widest text-white/40">{x.k}</div>
                <div className="mt-2 text-2xl font-light text-white">{x.v}</div>
              </div>
            ))}
          </div>
          <div className="text-white/50 text-sm">
            These counts are generated locally from the audit log (demo store). They’re useful for spotting where partners drop off.
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <Shield size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Effective access</span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={badge(effectiveAdmin ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200' : 'border-rose-500/25 bg-rose-500/10 text-rose-200')}>
                {effectiveAdmin ? 'Admin access: granted' : 'Admin access: denied'}
              </span>
              <span className={badge(isAllowlisted ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-white/[0.02] text-white/50')}>
                allowlist={String(isAllowlisted)}
              </span>
              <span className={badge(allowByMembership ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-white/[0.02] text-white/50')}>
                membership={String(allowByMembership)}
              </span>
            </div>

            <div className="text-white/60 text-sm">
              Admin access is granted if <strong>either</strong> your email is allowlisted <strong>or</strong> you have an active tenant membership with admin-level permissions.
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Signed in</div>
                <div className="text-white/85 font-semibold truncate">{email || '—'}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                  user_id: {String(user?.id || '—').slice(0, 8)}
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-1">
                <div className="text-[10px] uppercase tracking-widest text-white/40">Active tenant</div>
                <div className="text-white/85 font-semibold truncate">{activeTenant?.name ?? 'Finely Cred'}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                  tenant_id: {activeTenantId}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-white/40">Capabilities (what you can see)</div>
              <div className="flex flex-wrap gap-2">
                <span className={badge(caps.canManageTeam ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-black/30 text-white/50')}>
                  team={String(caps.canManageTeam)}
                </span>
                <span className={badge(caps.canManageTenants ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-black/30 text-white/50')}>
                  tenants={String(caps.canManageTenants)}
                </span>
                <span className={badge(caps.canViewAllClients ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-black/30 text-white/50')}>
                  allClients={String(caps.canViewAllClients)}
                </span>
                <span className={badge(caps.canUseFinanceTools ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-200' : 'border-white/10 bg-black/30 text-white/50')}>
                  finance={String(caps.canUseFinanceTools)}
                </span>
                <span className={badge('border-white/10 bg-black/30 text-white/50')}>
                  partnerScope={accessiblePartnerCount}
                </span>
              </div>
              <div className="text-[11px] text-white/40">
                Partner scope is computed from your active tenant + membership. If this number is unexpectedly low, check the tenant selector and your team membership assignments.
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
                <div className="inline-flex items-center gap-2 text-amber-400">
                  <Users size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Membership (active tenant)</span>
                </div>
                {membershipActive ? (
                  <div className="text-white/70 text-sm">
                    role: <span className="font-mono text-white/80">{membershipActive.role}</span> • status:{' '}
                    <span className="font-mono text-white/80">{membershipActive.status}</span>
                  </div>
                ) : (
                  <div className="text-white/50 text-sm">No membership record for this tenant.</div>
                )}
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-2">
                <div className="inline-flex items-center gap-2 text-amber-400">
                  <Lock size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Membership (platform)</span>
                </div>
                {membershipPlatform ? (
                  <div className="text-white/70 text-sm">
                    role: <span className="font-mono text-white/80">{membershipPlatform.role}</span> • status:{' '}
                    <span className="font-mono text-white/80">{membershipPlatform.status}</span>
                  </div>
                ) : (
                  <div className="text-white/50 text-sm">No platform membership record.</div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <Globe size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Tenant selector</span>
              </div>
              <div className="text-white/60 text-sm">
                Many admin views (partners, tasks, cases) are filtered by the <strong>active tenant</strong>.
              </div>
              <select
                value={activeTenantId}
                onChange={(e) => {
                  setActiveTenantId(e.target.value);
                  setNotice('Active tenant updated.');
                  window.setTimeout(() => setNotice(null), 1800);
                }}
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/30 text-white text-sm"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.slug})
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/admin/partners')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                >
                  Open Partner Management <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/tenants')}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-white/70 font-black uppercase tracking-widest text-[10px] hover:bg-white/[0.06] transition-all"
                >
                  Manage tenants
                </button>
              </div>
            </div>

            <CollapsibleSection
              title="Admin emails (security allowlist)"
              subtitle="Fastest way to grant admin access in local/demo builds (used by isAdminEmail)."
              defaultOpen={false}
              storageKey="admin.access.adminEmails"
              enableClamp
              clampClassName="max-h-[72vh]"
              actions={
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate('/admin/team')}>
                    Team & Roles
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate('/admin/settings?tab=security')}>
                    Security settings
                  </Button>
                </div>
              }
            >
              <CollapsibleSection
                title="Bootstrap admins (hardcoded)"
                subtitle="Built into the app for initial access."
                count={`${bootstrap.length}`}
                defaultOpen={false}
                storageKey="admin.access.adminEmails.bootstrap"
                enableClamp={bootstrap.length > 12}
                clampClassName="max-h-[240px]"
                className="bg-white/[0.02]"
              >
                <div className="flex flex-wrap gap-2">
                  {bootstrap.map((e) => (
                    <span key={e} className={badge('border-white/10 bg-black/30 text-white/60')}>
                      {e}
                    </span>
                  ))}
                </div>
              </CollapsibleSection>

              <div className="h-4" />

              <CollapsibleSection
                title="Runtime admins (editable)"
                subtitle="Click an email chip to remove."
                count={`${runtimeAdminEmails.length}`}
                defaultOpen
                storageKey="admin.access.adminEmails.runtime"
                enableClamp={runtimeAdminEmails.length > 18}
                clampClassName="max-h-[300px]"
                className="bg-white/[0.02]"
              >
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      value={draftAdminEmail}
                      onChange={(e) => setDraftAdminEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-500/50"
                    />
                    <Button variant="primary" size="sm" onClick={addAdminEmail}>
                      Add
                    </Button>
                  </div>

                  {runtimeAdminEmails.length === 0 ? (
                    <div className="text-white/50 text-sm">No runtime admin emails yet.</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {runtimeAdminEmails.map((e: string) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => removeAdminEmail(e)}
                          className={badge('border-amber-500/25 bg-amber-500/10 text-amber-200 hover:brightness-110 transition-all')}
                          title="Click to remove"
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </CollapsibleSection>

              <div className="h-4" />

              <div className="rounded-xl border border-white/10 bg-black/30 p-4 flex items-start gap-3">
                {effectiveAdmin ? (
                  <CheckCircle2 size={18} className="text-emerald-300 mt-0.5" />
                ) : (
                  <AlertCircle size={18} className="text-rose-300 mt-0.5" />
                )}
                <div className="text-white/60 text-sm">
                  If you just added your email here, <strong>refresh the page</strong> (or sign out/in) so the admin guard recalculates.
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

