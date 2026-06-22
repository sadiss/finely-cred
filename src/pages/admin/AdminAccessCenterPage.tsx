import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, Shield, Users, Globe, Settings, CheckCircle2, AlertCircle, Lock, RefreshCcw, Rocket } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { ActionLink, Button, CollapsibleSection } from '../../components/ui';
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
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyOsOverviewStatTile } from '../../features/os/FinelyOsOverviewStatTile';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

function normalizeEmail(v: string) {
  return String(v || '')
    .trim()
    .toLowerCase();
}

function yesNoChip(yes: boolean) {
  return finelyOsStatusChip(yes ? 'ok' : 'warn');
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
  const runtimeAdminEmails = useMemo((): string[] => {
    const extra = Array.isArray((security as any)?.adminEmails) ? ((security as any).adminEmails as string[]) : [];
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
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ActionLink to="/admin" icon={<ArrowLeft size={16} />} className={FINELY_OS_BACK_LINK}>
            Admin Dashboard
          </ActionLink>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setStoreVersion((v) => v + 1)} className={FINELY_OS_SECONDARY_BTN} title="Refresh">
              <RefreshCcw size={14} /> Refresh
            </button>
            <button type="button" onClick={() => navigate('/admin/settings')} className={FINELY_OS_PRIMARY_BTN}>
              System Settings <ArrowRight size={14} />
            </button>
          </div>
        </div>

        <div className={FINELY_OS_BANNER}>
          <Shield size={18} className="text-violet-600 shrink-0 mt-0.5" />
          <p className={`${FINELY_OS_ENTITY_BODY} leading-relaxed`}>
            One place to control admin access, team roles, and system settings — without hunting across the platform.
          </p>
        </div>

        {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { path: '/admin/launch-os#go-live', icon: Rocket, label: 'Go-live center', desc: 'Production pillars, Twilio, theme, and terminal commands.', accent: 'emerald' as const },
            { path: '/admin/settings?tab=appearance', icon: Settings, label: 'Light theme preview', desc: 'Admin-only light theme polish before public go-live.', accent: 'fuchsia' as const },
            { path: '/admin/settings', icon: Settings, label: 'System Settings', desc: 'Security, feature flags, pricing, integrations.', accent: 'violet' as const },
            { path: '/admin/team', icon: Users, label: 'Team & Roles', desc: 'Invite, roles, permission visibility.', accent: 'emerald' as const },
            { path: '/admin/billing', icon: Lock, label: 'Billing & Entitlements', desc: 'Plans, entitlements, access grants.', accent: 'amber' as const },
            { path: '/admin/templates', icon: Shield, label: 'Templates', desc: 'Template vault + generator library.', accent: 'sky' as const },
          ].map((item) => (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`${finelyOsCatalogCard(item.accent)} !p-5 w-full text-left transition-all hover:brightness-[1.02]`}
              data-fc-accent={item.accent}
            >
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_VALUE} text-sm`}>
                <item.icon size={16} /> {item.label}
              </div>
              <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{item.desc}</div>
            </button>
          ))}
        </div>

        <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
          <div className={FINELY_OS_ENTITY_SUBLABEL}>Funnel snapshot (last 7 days)</div>
          <div className="grid md:grid-cols-2 xl:grid-cols-6 gap-3">
            {[
              { k: 'Reports', v: funnel.reportsUploaded, accent: 'violet' as const },
              { k: 'Evidence', v: funnel.evidenceCaptured, accent: 'sky' as const },
              { k: 'Disputes picked', v: funnel.disputesSelected, accent: 'amber' as const },
              { k: 'Letters generated', v: funnel.letterGenerated, accent: 'fuchsia' as const },
              { k: 'Letters saved', v: funnel.letterSaved, accent: 'emerald' as const },
              { k: 'Events', v: funnel.events7d, accent: 'rose' as const },
            ].map((x) => (
              <FinelyOsOverviewStatTile key={x.k} icon={Shield} label={x.k} value={x.v} accent={x.accent} iconAccent={x.accent} />
            ))}
          </div>
          <div className={FINELY_OS_ENTITY_BODY}>
            These counts are generated locally from the audit log (demo store). They’re useful for spotting where partners drop off.
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-7 ${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Effective access</div>

            <div className="flex flex-wrap items-center gap-2">
              <span className={effectiveAdmin ? finelyOsStatusChip('ok') : finelyOsStatusChip('blocked')}>
                {effectiveAdmin ? 'Admin access: granted' : 'Admin access: denied'}
              </span>
              <span className={yesNoChip(isAllowlisted)}>allowlist={String(isAllowlisted)}</span>
              <span className={yesNoChip(allowByMembership)}>membership={String(allowByMembership)}</span>
            </div>

            <div className={FINELY_OS_ENTITY_BODY}>
              Admin access is granted if <strong>either</strong> your email is allowlisted <strong>or</strong> you have an active tenant membership with admin-level permissions.
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-1`}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Signed in</div>
                <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{email || '—'}</div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>
                  user_id: {String(user?.id || '—').slice(0, 8)}
                </div>
              </div>

              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-1`}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Active tenant</div>
                <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{activeTenant?.name ?? 'Finely Cred'}</div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate normal-case tracking-normal`}>
                  tenant_id: {activeTenantId}
                </div>
              </div>
            </div>

            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Capabilities (what you can see)</div>
              <div className="flex flex-wrap gap-2">
                <span className={yesNoChip(caps.canManageTeam)}>team={String(caps.canManageTeam)}</span>
                <span className={yesNoChip(caps.canManageTenants)}>tenants={String(caps.canManageTenants)}</span>
                <span className={yesNoChip(caps.canViewAllClients)}>allClients={String(caps.canViewAllClients)}</span>
                <span className={yesNoChip(caps.canUseFinanceTools)}>finance={String(caps.canUseFinanceTools)}</span>
                <span className={finelyOsStatusChip('warn')}>partnerScope={accessiblePartnerCount}</span>
              </div>
              <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
                Partner scope is computed from your active tenant + membership. If this number is unexpectedly low, check the tenant selector and your team membership assignments.
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  <Users size={16} />
                  Membership (active tenant)
                </div>
                {membershipActive ? (
                  <div className={FINELY_OS_ENTITY_BODY}>
                    role: <span className="font-mono font-semibold">{membershipActive.role}</span> • status:{' '}
                    <span className="font-mono font-semibold">{membershipActive.status}</span>
                  </div>
                ) : (
                  <div className={FINELY_OS_ENTITY_BODY}>No membership record for this tenant.</div>
                )}
              </div>
              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  <Lock size={16} />
                  Membership (platform)
                </div>
                {membershipPlatform ? (
                  <div className={FINELY_OS_ENTITY_BODY}>
                    role: <span className="font-mono font-semibold">{membershipPlatform.role}</span> • status:{' '}
                    <span className="font-mono font-semibold">{membershipPlatform.status}</span>
                  </div>
                ) : (
                  <div className={FINELY_OS_ENTITY_BODY}>No platform membership record.</div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Tenant selector</div>
              <div className={FINELY_OS_ENTITY_BODY}>
                Many admin views (partners, tasks, cases) are filtered by the <strong>active tenant</strong>.
              </div>
              <select
                value={activeTenantId}
                onChange={(e) => {
                  setActiveTenantId(e.target.value);
                  setNotice('Active tenant updated.');
                  window.setTimeout(() => setNotice(null), 1800);
                }}
                className={FINELY_OS_ENTITY_INPUT}
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.slug})
                  </option>
                ))}
              </select>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => navigate('/admin/partners')} className={FINELY_OS_PRIMARY_BTN}>
                  Open Partner Management <ArrowRight size={14} />
                </button>
                <button type="button" onClick={() => navigate('/admin/tenants')} className={FINELY_OS_SECONDARY_BTN}>
                  Manage tenants
                </button>
              </div>
            </div>

            <CollapsibleSection
              title="Admin emails (security allowlist)"
              subtitle="Fastest way to grant admin access in local/demo builds (used by isAdminEmail)."
              defaultOpen={false}
              storageKey="admin.access.adminEmails"
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
                className="bg-white/[0.02]"
              >
                <FinelyOsPaginatedStack
                  items={bootstrap}
                  pageSize={24}
                  emptyMessage="No bootstrap admins."
                  renderItem={(e) => (
                    <span key={e} className={`${FINELY_OS_ENTITY_CHIP} inline-block font-mono normal-case tracking-normal`}>
                      {e}
                    </span>
                  )}
                />
              </CollapsibleSection>

              <div className="h-4" />

              <CollapsibleSection
                title="Runtime admins (editable)"
                subtitle="Click an email chip to remove."
                count={`${runtimeAdminEmails.length}`}
                defaultOpen
                storageKey="admin.access.adminEmails.runtime"
                className="bg-white/[0.02]"
              >
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      value={draftAdminEmail}
                      onChange={(e) => setDraftAdminEmail(e.target.value)}
                      placeholder="name@domain.com"
                      className={`flex-1 ${FINELY_OS_ENTITY_INPUT}`}
                    />
                    <Button variant="primary" size="sm" onClick={addAdminEmail}>
                      Add
                    </Button>
                  </div>

                  {runtimeAdminEmails.length === 0 ? (
                    <div className={FINELY_OS_ENTITY_BODY}>No runtime admin emails yet.</div>
                  ) : (
                    <FinelyOsPaginatedStack
                      items={runtimeAdminEmails}
                      pageSize={20}
                      emptyMessage="No runtime admin emails yet."
                      renderItem={(e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => removeAdminEmail(e)}
                          className={`${FINELY_OS_ENTITY_CHIP} hover:brightness-95 transition-all w-fit font-mono normal-case tracking-normal`}
                          title="Click to remove"
                        >
                          {e}
                        </button>
                      )}
                    />
                  )}
                </div>
              </CollapsibleSection>

              <div className="h-4" />

              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony flex items-start gap-3`}>
                {effectiveAdmin ? (
                  <CheckCircle2 size={18} className="text-emerald-600 mt-0.5" />
                ) : (
                  <AlertCircle size={18} className="text-rose-600 mt-0.5" />
                )}
                <div className={FINELY_OS_ENTITY_BODY}>
                  If you just added your email here, <strong>refresh the page</strong> (or sign out/in) so the admin guard recalculates.
                </div>
              </div>
            </CollapsibleSection>
          </div>
        </div>
        <FinelyOsPageFooter />
</div>
    </PageShell>
  );
}

