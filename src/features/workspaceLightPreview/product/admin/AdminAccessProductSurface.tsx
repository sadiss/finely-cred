import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  KeyRound,
  Lock,
  RefreshCcw,
  Rocket,
  Settings,
  Shield,
  Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { Button, CollapsibleSection } from '../../../../components/ui';
import { ADMIN_EMAIL_ALLOWLIST, isAdminEmail } from '../../../../auth/admin';
import { getActiveTenantId, setActiveTenantId } from '../../../../tenancy/activeTenant';
import { listTenants } from '../../../../data/tenantsRepo';
import { FINELY_TENANT_ID } from '../../../../domain/tenants';
import {
  canManageTeam,
  canUseFinanceTools,
  canViewAllClients,
  getMembershipByUserAndTenant,
  isPlatformAdmin,
} from '../../../../data/tenantsRepo';
import { getAccessiblePartnerIdsForAdmin } from '../../../../tenancy/adminPartnerScope';
import { loadSettings, updateSecuritySettings } from '../../../../data/settingsRepo';
import { allRolePreviewEntries } from '../../../../config/rolePreviewCatalog';
import { canUseAdminRolePreview } from '../../../../lib/adminRolePreviewAccess';
import {
  hasSensitiveActionCode,
  sensitiveActionLabel,
  setSensitiveActionCode,
  type SensitiveActionKey,
} from '../../../../lib/sensitiveActionGuard';
import { listAuditEventsByTenant } from '../../../../data/auditRepo';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import { FinelyOsOverviewStatTile } from '../../../os/FinelyOsOverviewStatTile';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import './adminAccessProductSurface.css';

type AccessZone = 'access' | 'tenant' | 'allowlist' | 'codes';

const ACCESS_ZONES: Array<{
  id: AccessZone;
  label: string;
  purpose: string;
  icon: typeof Shield;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
}> = [
  { id: 'access', label: 'Effective access', purpose: 'Your admin status and capabilities', icon: Shield, accent: 'emerald' },
  { id: 'tenant', label: 'Tenant scope', purpose: 'Active tenant and partner filtering', icon: Users, accent: 'violet' },
  { id: 'allowlist', label: 'Admin allowlist', purpose: 'Email-based admin grants', icon: Lock, accent: 'sky' },
  { id: 'codes', label: 'Action codes', purpose: 'Sensitive operation authorization', icon: KeyRound, accent: 'rose' },
];

const SHORTCUTS = [
  { path: '/admin/launch-os#go-live', icon: Rocket, label: 'Go-live center', desc: 'Production pillars and terminal commands.', accent: 'emerald' as const },
  { path: '/admin/settings?tab=appearance', icon: Settings, label: 'Light theme preview', desc: 'Admin-only theme polish.', accent: 'violet' as const },
  { path: '/admin/settings', icon: Settings, label: 'System settings', desc: 'Security, flags, and integrations.', accent: 'sky' as const },
  { path: '/admin/team', icon: Users, label: 'Team & roles', desc: 'Invite, roles, and permissions.', accent: 'rose' as const },
  { path: '/admin/billing', icon: Lock, label: 'Billing', desc: 'Plans and entitlements.', accent: 'emerald' as const },
  { path: '/admin/templates', icon: Shield, label: 'Templates', desc: 'Template vault and generators.', accent: 'violet' as const },
];

function normalizeEmail(v: string) {
  return String(v || '')
    .trim()
    .toLowerCase();
}

function yesNoChip(yes: boolean) {
  return finelyOsStatusChip(yes ? 'ok' : 'warn');
}

export default function AdminAccessProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const auth = useAuth();
  const user = auth.user;

  const [zone, setZone] = useState<AccessZone>('access');
  const [storeVersion, setStoreVersion] = useState(0);
  const [draftAdminEmail, setDraftAdminEmail] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [codeDrafts, setCodeDrafts] = useState<Record<SensitiveActionKey, string>>({
    partner_delete: '',
    hos_access_grant: '',
    partner_access_grant: '',
    bulk_report_purge: '',
  });

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
    ((user as { user_metadata?: { email?: string } })?.user_metadata?.email) ||
    ((user as { identities?: { identity_data?: { email?: string } }[] })?.identities?.[0]?.identity_data?.email) ||
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
    if (!user?.id) {
      setAccessiblePartnerCount(0);
      return;
    }
    getAccessiblePartnerIdsForAdmin({ userId: user.id, email, tenantId: activeTenantId }).then((set) =>
      setAccessiblePartnerCount(set.size),
    );
  }, [user?.id, email, activeTenantId, storeVersion]);

  const security = useMemo(() => loadSettings().security ?? { adminEmails: [] }, [storeVersion]);
  const teamRolePreviewEnabled = (security as { teamRolePreviewEnabled?: boolean }).teamRolePreviewEnabled !== false;
  const rolePreviewAllowed = useMemo(() => canUseAdminRolePreview({ userId: user?.id, email }), [user?.id, email]);
  const previewableRoles = useMemo(() => allRolePreviewEntries(), []);
  const runtimeAdminEmails = useMemo((): string[] => {
    const extra = Array.isArray((security as { adminEmails?: string[] })?.adminEmails)
      ? ((security as { adminEmails?: string[] }).adminEmails as string[])
      : [];
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

  const missingCodes = (['partner_delete', 'partner_access_grant', 'hos_access_grant', 'bulk_report_purge'] as SensitiveActionKey[]).filter(
    (key) => !hasSensitiveActionCode(key),
  );

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

  const activeZone = ACCESS_ZONES.find((z) => z.id === zone) ?? ACCESS_ZONES[0]!;
  const ActiveIcon = activeZone.icon;

  const zoneStatus = (id: AccessZone): { tone: 'ok' | 'warn' | 'blocked'; label: string } => {
    switch (id) {
      case 'access':
        return effectiveAdmin ? { tone: 'ok', label: 'Granted' } : { tone: 'blocked', label: 'Denied' };
      case 'tenant':
        return { tone: 'ok', label: activeTenant?.name?.slice(0, 16) ?? 'Finely Cred' };
      case 'allowlist':
        return { tone: runtimeAdminEmails.length > 0 ? 'ok' : 'warn', label: `${runtimeAdminEmails.length} runtime` };
      case 'codes':
        return missingCodes.length > 0 ? { tone: 'warn', label: `${missingCodes.length} missing` } : { tone: 'ok', label: 'Configured' };
      default:
        return { tone: 'warn', label: '—' };
    }
  };

  const alerts = [
    !effectiveAdmin ? { tone: 'blocked' as const, title: 'Admin access denied', action: () => setZone('allowlist') } : null,
    missingCodes.length > 0 ? { tone: 'warn' as const, title: `${missingCodes.length} action code${missingCodes.length === 1 ? '' : 's'} not set`, action: () => setZone('codes') } : null,
    accessiblePartnerCount === 0 && effectiveAdmin
      ? { tone: 'warn' as const, title: 'Partner scope is zero', action: () => setZone('tenant') }
      : null,
  ].filter(Boolean) as Array<{ tone: 'ok' | 'warn' | 'blocked'; title: string; action: () => void }>;

  const renderInspector = () => {
    if (zone === 'access') {
      return (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className={effectiveAdmin ? finelyOsStatusChip('ok') : finelyOsStatusChip('blocked')}>
              {effectiveAdmin ? 'Admin access: granted' : 'Admin access: denied'}
            </span>
            <span className={yesNoChip(isAllowlisted)}>allowlist={String(isAllowlisted)}</span>
            <span className={yesNoChip(allowByMembership)}>membership={String(allowByMembership)}</span>
          </div>

          <p className={`text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>
            Admin access is granted if your email is allowlisted or you have an active tenant membership with admin-level permissions.
          </p>

          <div className="grid md:grid-cols-2 gap-4">
            <div className={`${finelyOsCatalogCard('emerald')} fc-surface-harmony p-5`} data-fc-accent="emerald">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Signed in</div>
              <div className={`mt-1 text-xl font-extrabold truncate ${FINELY_OS_ENTITY_VALUE}`}>{email || '—'}</div>
              <div className={`mt-1 font-mono text-xs ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                user_id: {String(user?.id || '—').slice(0, 8)}
              </div>
            </div>
            <div className={`${finelyOsCatalogCard('violet')} fc-surface-harmony p-5`} data-fc-accent="violet">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Active tenant</div>
              <div className={`mt-1 text-xl font-extrabold truncate ${FINELY_OS_ENTITY_VALUE}`}>{activeTenant?.name ?? 'Finely Cred'}</div>
              <div className={`mt-1 font-mono text-xs ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal truncate`}>
                tenant_id: {activeTenantId}
              </div>
            </div>
          </div>

          <div className={`${finelyOsCatalogCard('sky')} fc-surface-harmony p-5 space-y-3`} data-fc-accent="sky">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Capabilities</div>
            <div className="flex flex-wrap gap-2">
              <span className={yesNoChip(caps.canManageTeam)}>team={String(caps.canManageTeam)}</span>
              <span className={yesNoChip(caps.canManageTenants)}>tenants={String(caps.canManageTenants)}</span>
              <span className={yesNoChip(caps.canViewAllClients)}>allPartners={String(caps.canViewAllClients)}</span>
              <span className={yesNoChip(caps.canUseFinanceTools)}>finance={String(caps.canUseFinanceTools)}</span>
              <span className={finelyOsStatusChip('warn')}>partnerScope={accessiblePartnerCount}</span>
            </div>
          </div>

          <div className={`${finelyOsCatalogCard('rose')} fc-surface-harmony p-5 space-y-4`} data-fc-accent="rose">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Role preview</div>
            <p className={`text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>
              Let team members preview every product lane before provisioning access.
            </p>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="mt-1"
                checked={teamRolePreviewEnabled}
                onChange={(e) => {
                  updateSecuritySettings({ teamRolePreviewEnabled: e.target.checked });
                  setNotice(e.target.checked ? 'Team role preview enabled.' : 'Team role preview restricted to owners.');
                  window.setTimeout(() => setNotice(null), 2200);
                }}
              />
              <span className={`text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                <strong>Allow team role preview</strong> — requires canPreviewAllRoles on Team &amp; Roles.
              </span>
            </label>
            <div className="flex flex-wrap gap-2">
              {previewableRoles.map((r) => (
                <span key={r.role} className={FINELY_OS_ENTITY_CHIP}>
                  {r.shortLabel}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => navigate('/admin/role-preview')} className={FINELY_OS_PRIMARY_BTN} disabled={!rolePreviewAllowed}>
                Open role access studio <ArrowRight size={14} />
              </button>
              <button type="button" onClick={() => navigate('/admin/team')} className={FINELY_OS_SECONDARY_BTN}>
                Team permissions
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className={`${finelyOsCatalogCard('emerald')} fc-surface-harmony p-5`} data-fc-accent="emerald">
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <Users size={16} /> Membership (active tenant)
              </div>
              {membershipActive ? (
                <div className={`mt-2 text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                  role: <span className="font-mono font-bold">{membershipActive.role}</span> • status:{' '}
                  <span className="font-mono font-bold">{membershipActive.status}</span>
                </div>
              ) : (
                <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>No membership record for this tenant.</div>
              )}
            </div>
            <div className={`${finelyOsCatalogCard('violet')} fc-surface-harmony p-5`} data-fc-accent="violet">
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <Lock size={16} /> Membership (platform)
              </div>
              {membershipPlatform ? (
                <div className={`mt-2 text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>
                  role: <span className="font-mono font-bold">{membershipPlatform.role}</span> • status:{' '}
                  <span className="font-mono font-bold">{membershipPlatform.status}</span>
                </div>
              ) : (
                <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>No platform membership record.</div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (zone === 'tenant') {
      return (
        <div className="space-y-5">
          <p className={`text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>
            Many admin views filter partners, tasks, and cases by the active tenant.
          </p>
          <label className="block">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Active tenant</div>
            <select
              value={activeTenantId}
              onChange={(e) => {
                setActiveTenantId(e.target.value);
                setNotice('Active tenant updated.');
                window.setTimeout(() => setNotice(null), 1800);
              }}
              className={`mt-2 ${FINELY_OS_ENTITY_INPUT}`}
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.slug})
                </option>
              ))}
            </select>
          </label>
          <div className={`${finelyOsCatalogCard('sky')} fc-surface-harmony p-5`} data-fc-accent="sky">
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Partner scope</div>
            <div className={`mt-2 text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{accessiblePartnerCount}</div>
            <p className={`mt-2 text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>
              Partners visible under your current tenant and membership.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => navigate('/admin/partners')} className={FINELY_OS_PRIMARY_BTN}>
              Open partner management <ArrowRight size={14} />
            </button>
            <button type="button" onClick={() => navigate('/admin/tenants')} className={FINELY_OS_SECONDARY_BTN}>
              Manage tenants
            </button>
          </div>
        </div>
      );
    }

    if (zone === 'allowlist') {
      return (
        <CollapsibleSection
          title="Admin emails (security allowlist)"
          subtitle="Grant admin access in local and demo builds via isAdminEmail."
          defaultOpen
          storageKey="admin.access.product.adminEmails"
          actions={
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate('/admin/team')}>
                Team &amp; Roles
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
            storageKey="admin.access.product.adminEmails.bootstrap"
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
            storageKey="admin.access.product.adminEmails.runtime"
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

          <div className={`${finelyOsCatalogCard('rose')} fc-surface-harmony flex items-start gap-3 p-5`} data-fc-accent="rose">
            {effectiveAdmin ? (
              <CheckCircle2 size={18} className="text-emerald-600 mt-0.5 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-rose-600 mt-0.5 shrink-0" />
            )}
            <div className={`text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>
              After adding your email, refresh the page or sign out and back in so the admin guard recalculates.
            </div>
          </div>
        </CollapsibleSection>
      );
    }

    return (
      <div className="space-y-4">
        {(['partner_delete', 'partner_access_grant', 'hos_access_grant', 'bulk_report_purge'] as SensitiveActionKey[]).map((key, idx) => {
          const configured = hasSensitiveActionCode(key);
          const cardAccent = (['rose', 'violet', 'sky', 'emerald'] as const)[idx % 4];
          return (
            <div key={key} className={`${finelyOsCatalogCard(cardAccent)} p-5 space-y-2`} data-fc-accent={cardAccent}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>{sensitiveActionLabel(key)}</div>
              <div className={`text-sm font-bold ${configured ? 'text-emerald-700' : 'text-rose-700'}`}>
                {configured ? 'Code configured' : 'Not set — action blocked until configured'}
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  type="password"
                  value={codeDrafts[key]}
                  onChange={(e) => setCodeDrafts((d) => ({ ...d, [key]: e.target.value }))}
                  placeholder="New authorization code"
                  className={`flex-1 min-w-[200px] ${FINELY_OS_ENTITY_INPUT}`}
                  autoComplete="new-password"
                />
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    if (!codeDrafts[key].trim()) return;
                    setSensitiveActionCode(key, codeDrafts[key]);
                    setCodeDrafts((d) => ({ ...d, [key]: '' }));
                    setNotice(`${sensitiveActionLabel(key)} updated.`);
                    window.setTimeout(() => setNotice(null), 2200);
                  }}
                >
                  Save code
                </Button>
              </div>
            </div>
          );
        })}
        <div className={`${finelyOsCatalogCard('sky')} fc-surface-harmony p-5`} data-fc-accent="sky">
          <div className={`text-base font-semibold ${FINELY_OS_ENTITY_BODY}`}>
            Head of Society invite keys are managed in{' '}
            <button type="button" className="font-bold underline" onClick={() => navigate('/admin/settings?tab=heta')}>
              Settings → Heta / HOS
            </button>
            . Use the HOS grant code above when issuing master access from admin tools.
          </div>
        </div>
      </div>
    );
  };

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Team"
      title="Access center"
      description="Who can open admin, which tenant they are in, and the codes for sensitive actions."
      accent={navItem?.accent ?? 'emerald'}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={<ProductPagePrimaryAction label="System settings" onClick={() => navigate('/admin/settings')} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/team')}>
          Team and roles
        </button>
      }
      metrics={[
        { label: 'Access', value: effectiveAdmin ? 'Granted' : 'Denied', hint: 'Your admin status', accent: 'emerald', onClick: () => setZone('access') },
        { label: 'Tenant', value: activeTenant?.slug?.slice(0, 10) ?? 'finely', hint: 'Active scope', accent: 'violet', onClick: () => setZone('tenant') },
        { label: 'Allowlist', value: String(runtimeAdminEmails.length), hint: 'Runtime admins', accent: 'sky', onClick: () => setZone('allowlist') },
        { label: 'Codes', value: String(4 - missingCodes.length) + '/4', hint: 'Action codes set', accent: 'rose', onClick: () => setZone('codes') },
      ]}
      metricTitle="Permission pulse"
      metricDescription="Zone grid on the left — inspector in the center, alerts on the right."
    >
      <section className="fc-admin-access-control" data-surface-layout="control-room">
        <div className={`${finelyOsCatalogCard('emerald')} p-5 lg:p-6`} data-fc-accent="emerald">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Control room pulse</p>
              <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                {effectiveAdmin
                  ? `Admin access granted · ${accessiblePartnerCount} partners in scope · ${4 - missingCodes.length}/4 codes configured.`
                  : 'Admin access denied — add your email to the allowlist or request team membership.'}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setStoreVersion((v) => v + 1)} className={FINELY_OS_SECONDARY_BTN} title="Refresh">
                <RefreshCcw size={14} /> Refresh
              </button>
              <span className={finelyOsStatusChip(effectiveAdmin ? 'ok' : 'blocked')}>
                {effectiveAdmin ? 'Access OK' : 'Access blocked'}
              </span>
            </div>
          </div>
        </div>

        {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}

        <div className="fc-admin-access-layout">
          <aside className="fc-admin-access-zone-grid">
            <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Permission zones</h2>
            {ACCESS_ZONES.map((tile) => {
              const Icon = tile.icon;
              const selected = zone === tile.id;
              const status = zoneStatus(tile.id);
              return (
                <button
                  key={tile.id}
                  type="button"
                  data-selected={selected ? 'true' : undefined}
                  className={`fc-admin-access-zone-tile fc-wlp-control-room-family ${finelyOsCatalogCard(tile.accent)}`}
                  data-fc-accent={tile.accent}
                  onClick={() => setZone(tile.id)}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Icon size={18} className="shrink-0 opacity-90" />
                    <span className={finelyOsStatusChip(status.tone)}>{status.label}</span>
                  </div>
                  <div className={`text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{tile.label}</div>
                  <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{tile.purpose}</p>
                </button>
              );
            })}
          </aside>

          <div className="min-w-0">
            <div className="fc-admin-access-inspector-bed">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <ActiveIcon size={22} />
                <div>
                  <p className={FINELY_OS_ENTITY_SUBLABEL}>Inspector</p>
                  <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{activeZone.label}</h2>
                  <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{activeZone.purpose}</p>
                </div>
              </div>
              {renderInspector()}
            </div>
          </div>

          <aside className="fc-admin-access-alert-rail">
            <div className={`${finelyOsCatalogCard('rose')} p-5 lg:p-6 space-y-4`} data-fc-accent="rose">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} />
                <h3 className="text-lg font-extrabold">Alert rail</h3>
              </div>
              {alerts.length === 0 ? (
                <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>No permission alerts right now.</p>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <button
                      key={alert.title}
                      type="button"
                      onClick={alert.action}
                      className={`w-full text-left p-4 rounded-xl ${finelyOsCatalogCard('sky')}`}
                      data-fc-accent="sky"
                    >
                      <span className={finelyOsStatusChip(alert.tone)}>{alert.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={`${finelyOsCatalogCard('violet')} p-5 lg:p-6 space-y-3`} data-fc-accent="violet">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Funnel snapshot (7 days)</div>
              <div className="grid grid-cols-2 gap-2">
                <FinelyOsOverviewStatTile icon={Shield} label="Reports" value={funnel.reportsUploaded} accent="emerald" iconAccent="emerald" />
                <FinelyOsOverviewStatTile icon={Shield} label="Evidence" value={funnel.evidenceCaptured} accent="violet" iconAccent="violet" />
                <FinelyOsOverviewStatTile icon={Shield} label="Disputes" value={funnel.disputesSelected} accent="sky" iconAccent="sky" />
                <FinelyOsOverviewStatTile icon={Shield} label="Events" value={funnel.events7d} accent="rose" iconAccent="rose" />
              </div>
            </div>

            <div className={`${finelyOsCatalogCard('sky')} p-5 lg:p-6 space-y-3`} data-fc-accent="sky">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Quick links</div>
              {SHORTCUTS.slice(0, 4).map((item) => (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={`w-full text-left p-3 rounded-xl ${finelyOsCatalogCard(item.accent)}`}
                  data-fc-accent={item.accent}
                >
                  <div className={`text-sm font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{item.label}</div>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
