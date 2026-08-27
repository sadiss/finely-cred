import React, { useEffect, useMemo, useState } from 'react';
import { Calendar, FileText, Plus, Search, Shield, Trash2, UserPlus, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../auth/AuthProvider';
import { CollapsibleSection } from '../../../../components/ui';
import {
  createMembership,
  deleteMembership,
  listMemberships,
  listTenants,
  updateMembership,
} from '../../../../data/tenantsRepo';
import { listPartnersByTenant } from '../../../../data/partnersRepo';
import type { MembershipRole, MembershipStatus } from '../../../../domain/tenants';
import {
  ENTERPRISE_PERMISSION_GROUPS,
  ENTERPRISE_PERMISSIONS,
  ENTERPRISE_ROLES,
  ENTERPRISE_STATUSES,
} from '../../../../domain/enterprisePermissions';
import { getActiveTenantId } from '../../../../tenancy/activeTenant';
import { FinelyOsPaginatedStack } from '../../../os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ACTIVE_CHIP,
  FINELY_OS_DANGER_BTN,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_TOOLBAR,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

type DeckMode = 'roster' | 'invite';

const DECK_MODES: Array<{
  id: DeckMode;
  label: string;
  desc: string;
  icon: React.ReactNode;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
}> = [
  { id: 'roster', label: 'Roster', desc: 'Roles, status, permissions', icon: <Users size={18} />, accent: 'sky' },
  { id: 'invite', label: 'Invite', desc: 'Add a member by email', icon: <UserPlus size={18} />, accent: 'emerald' },
];

function normalizeEmail(v: string) {
  return (v || '').trim().toLowerCase();
}

function roleLabel(role: MembershipRole): string {
  return ENTERPRISE_ROLES.find((r) => r.value === role)?.label ?? String(role);
}

function defaultPermissionsForRole(role: MembershipRole): Record<string, boolean> | undefined {
  if (role === 'platform_admin' || role === 'tenant_owner') {
    return Object.fromEntries(ENTERPRISE_PERMISSION_GROUPS.map((k) => [k, true]));
  }
  if (role === 'read_only_admin') {
    return Object.fromEntries(
      ENTERPRISE_PERMISSION_GROUPS.filter((k) =>
        ['canViewAllClients', 'canPreviewAllRoles', 'canViewBilling', 'canViewReports', 'canViewLetters', 'canViewCases', 'canViewTasks', 'canViewCourses', 'canViewLeads', 'canViewAutomations', 'canViewAnalytics', 'canViewAuditLogs'].includes(k),
      ).map((k) => [k, true]),
    );
  }
  if (role === 'billing_admin') {
    return Object.fromEntries(
      ENTERPRISE_PERMISSION_GROUPS.filter((k) =>
        ['canManageBilling', 'canViewBilling', 'canIssueRefunds', 'canApplyCredits', 'canManageSubscriptions', 'canViewPaymentHistory', 'canManageInvoices'].includes(k),
      ).map((k) => [k, true]),
    );
  }
  if (role === 'agent') return { canViewAllCustomers: false };
  if (role === 'paralegal' || role === 'attorney' || role === 'consultant') {
    return {
      canViewAllClients: false,
      canViewLetters: true,
      canManageLetters: true,
      canViewCases: true,
      canManageCases: true,
      canViewTasks: true,
      canAccessAdminArea: true,
    };
  }
  return undefined;
}

export default function AdminTeamProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'sky';
  const [deckMode, setDeckMode] = useState<DeckMode>('roster');
  const [storeVersion, setStoreVersion] = useState(0);
  const [draftEmail, setDraftEmail] = useState('');
  const [draftRole, setDraftRole] = useState<MembershipRole>('platform_admin');
  const [draftDepartment, setDraftDepartment] = useState('');
  const [draftJobTitle, setDraftJobTitle] = useState('');
  const [draftInviteExpiresAt, setDraftInviteExpiresAt] = useState('');
  const [draftInviteNotes, setDraftInviteNotes] = useState('');
  const [tenantId, setTenantId] = useState<string>(() => getActiveTenantId());
  const [memberQuery, setMemberQuery] = useState('');
  const [assignQueryByMemberId, setAssignQueryByMemberId] = useState<Record<string, string>>({});

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    setTenantId(getActiveTenantId());
  }, [storeVersion]);

  const tenants = useMemo(() => listTenants().slice().sort((a, b) => a.name.localeCompare(b.name)), [storeVersion]);
  const [partners, setPartners] = useState<import('../../../../domain/partners').Partner[]>([]);
  useEffect(() => {
    listPartnersByTenant(tenantId).then(setPartners);
  }, [tenantId, storeVersion]);

  const members = useMemo(
    () => listMemberships(tenantId).slice().sort((a, b) => a.email.localeCompare(b.email)),
    [tenantId, storeVersion],
  );

  const filteredMembers = useMemo(() => {
    const q = memberQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) => {
      const hay = `${m.email} ${m.id} ${m.userId} ${m.role} ${m.status} ${m.department ?? ''} ${m.jobTitle ?? ''}`.toLowerCase();
      return hay.includes(q);
    });
  }, [members, memberQuery]);

  const permissionGroups = useMemo(() => {
    const byGroup = new Map<string, string[]>();
    for (const k of ENTERPRISE_PERMISSION_GROUPS) {
      const meta = ENTERPRISE_PERMISSIONS[k as keyof typeof ENTERPRISE_PERMISSIONS];
      const g = meta?.group ?? 'Other';
      if (!byGroup.has(g)) byGroup.set(g, []);
      byGroup.get(g)!.push(k);
    }
    return Array.from(byGroup.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, []);

  const enabledCount = (m: (typeof members)[0]) =>
    permissionGroups.reduce(
      (acc, [, keys]) => acc + keys.filter((k) => Boolean((m.permissions as any)?.[k])).length,
      0,
    );

  const activeDeck = DECK_MODES.find((d) => d.id === deckMode) ?? DECK_MODES[0]!;

  const add = () => {
    const email = normalizeEmail(draftEmail);
    if (!email) return;
    const perms = defaultPermissionsForRole(draftRole);
    const needsAssign =
      draftRole === 'agent' ||
      draftRole === 'paralegal' ||
      draftRole === 'attorney' ||
      draftRole === 'consultant';
    const finalPerms = needsAssign ? { ...perms, assignedPartnerIds: [] as string[] } : perms;
    createMembership({
      tenantId,
      userId: `invited:${email}`,
      email,
      role: draftRole,
      status: 'invited',
      permissions: finalPerms as any,
      department: draftDepartment.trim() || undefined,
      jobTitle: draftJobTitle.trim() || undefined,
      inviteExpiresAt: draftInviteExpiresAt.trim() || undefined,
      inviteNotes: draftInviteNotes.trim() || undefined,
      createdBy: auth.user?.id,
    });
    setDraftEmail('');
    setDraftDepartment('');
    setDraftJobTitle('');
    setDraftInviteExpiresAt('');
    setDraftInviteNotes('');
    window.dispatchEvent(new Event('finely:store'));
    setDeckMode('roster');
  };

  const setStatus = (id: string, status: MembershipStatus) => {
    updateMembership(id, { status });
    window.dispatchEvent(new Event('finely:store'));
  };

  const setMemberRole = (id: string, nextRole: MembershipRole) => {
    updateMembership(id, { role: nextRole });
    window.dispatchEvent(new Event('finely:store'));
  };

  const togglePerm = (id: string, key: string) => {
    const cur = members.find((m) => m.id === id);
    if (!cur) return;
    const next = { ...(cur.permissions ?? {}) } as any;
    if (key === 'assignedPartnerIds') return;
    next[key] = !Boolean(next[key]);
    updateMembership(id, { permissions: next });
    window.dispatchEvent(new Event('finely:store'));
  };

  const toggleAssignedPartner = (memberId: string, partnerId: string) => {
    const cur = members.find((m) => m.id === memberId);
    if (!cur) return;
    const perms: any = { ...(cur.permissions ?? {}) };
    const list = Array.isArray(perms.assignedPartnerIds) ? (perms.assignedPartnerIds as string[]) : [];
    const next = list.includes(partnerId) ? list.filter((x) => x !== partnerId) : [...list, partnerId];
    perms.assignedPartnerIds = next;
    updateMembership(memberId, { permissions: perms });
    window.dispatchEvent(new Event('finely:store'));
  };

  const invitedCount = members.filter((m) => m.status === 'invited').length;
  const activeCount = members.filter((m) => m.status === 'active').length;

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Team"
      title="Roles"
      description="Invite members, assign roles, and tune granular permissions per tenant."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={<ProductPagePrimaryAction label="Invite member" onClick={() => setDeckMode('invite')} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/access')}>
          Access center
        </button>
      }
      metrics={[
        { label: 'Permissions', value: String(ENTERPRISE_PERMISSION_GROUPS.length), hint: 'Granular controls', accent: 'emerald', onClick: () => setDeckMode('roster') },
        { label: 'Roles', value: String(ENTERPRISE_ROLES.length), hint: ENTERPRISE_ROLES.map((r) => roleLabel(r.value)).slice(0, 2).join(', ') + '…', accent: 'violet', onClick: () => setDeckMode('roster') },
        { label: 'Active', value: String(activeCount), hint: `${invitedCount} invited`, accent: 'sky', onClick: () => setDeckMode('roster') },
        { label: 'Members', value: String(members.length), hint: 'In this tenant', accent: 'rose', onClick: () => setDeckMode('roster') },
      ]}
      metricTitle="Team command deck"
      metricDescription="Pick a tenant, invite by email, then edit roles and permissions in the roster."
    >
      <div className={FINELY_OS_PAGE} data-surface-layout="command-deck">
        {/* Command deck hero */}
        <section className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8`} data-fc-accent="violet">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="max-w-3xl">
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <Shield size={16} /> Roles command deck
              </div>
              <h2 className="mt-3 text-3xl font-extrabold lg:text-4xl">
                {activeDeck.label}: {activeDeck.desc}
              </h2>
              <p className={`mt-4 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                {members.length} members · {ENTERPRISE_ROLES.length} roles · {ENTERPRISE_PERMISSION_GROUPS.length} permission toggles
              </p>
            </div>
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setDeckMode(deckMode === 'invite' ? 'roster' : 'invite')}>
              {deckMode === 'invite' ? (
                <>
                  <Users size={14} /> View roster
                </>
              ) : (
                <>
                  <Plus size={14} /> Invite member
                </>
              )}
            </button>
          </div>
        </section>

        {/* Tenant context band */}
        <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 flex flex-wrap items-center gap-4`} data-fc-accent="emerald">
          <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
            <Shield size={16} /> Tenant
          </div>
          <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} className={`${FINELY_OS_ENTITY_SELECT} min-w-[220px]`}>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.slug})
              </option>
            ))}
          </select>
          <div className={`${FINELY_OS_ENTITY_BODY} text-base font-mono`}>signed in: {auth.user?.email || '—'}</div>
        </div>

        {/* Horizontal deck strip */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1" role="tablist" aria-label="Team deck modes">
          {DECK_MODES.map((mode) => {
            const active = deckMode === mode.id;
            const borderAccent =
              mode.accent === 'emerald'
                ? 'border-emerald-400/50 bg-emerald-500/15 shadow-lg shadow-emerald-500/10'
                : 'border-sky-400/50 bg-sky-500/15 shadow-lg shadow-sky-500/10';
            return (
              <button
                key={mode.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setDeckMode(mode.id)}
                className={`shrink-0 rounded-2xl border px-5 py-4 text-left transition-all min-w-[160px] ${
                  active ? borderAccent : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.06]'
                }`}
                data-fc-accent={mode.accent}
              >
                <div className="flex items-center gap-2 text-base font-extrabold">
                  {mode.icon}
                  {mode.label}
                </div>
                <div className={`mt-1 text-sm font-semibold ${FINELY_OS_ENTITY_BODY}`}>{mode.desc}</div>
              </button>
            );
          })}
        </div>

        {deckMode === 'invite' ? (
          <section className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-6`} data-fc-accent="emerald">
            <div>
              <h2 className="text-3xl font-extrabold">Invite member</h2>
              <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Email-based invites become active when the person signs in with that address. Role sets default permissions.
              </p>
            </div>
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className={FINELY_OS_ENTITY_SUBLABEL}>Email</label>
                  <input
                    value={draftEmail}
                    onChange={(e) => setDraftEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className={FINELY_OS_ENTITY_INPUT}
                  />
                </div>
                <div>
                  <label className={FINELY_OS_ENTITY_SUBLABEL}>Role</label>
                  <select
                    value={draftRole}
                    onChange={(e) => setDraftRole(e.target.value as MembershipRole)}
                    className={`mt-1 ${FINELY_OS_ENTITY_SELECT}`}
                  >
                    {ENTERPRISE_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className={FINELY_OS_ENTITY_SUBLABEL}>Department</label>
                    <input
                      value={draftDepartment}
                      onChange={(e) => setDraftDepartment(e.target.value)}
                      placeholder="e.g. Support"
                      className={FINELY_OS_ENTITY_INPUT}
                    />
                  </div>
                  <div>
                    <label className={FINELY_OS_ENTITY_SUBLABEL}>Job title</label>
                    <input
                      value={draftJobTitle}
                      onChange={(e) => setDraftJobTitle(e.target.value)}
                      placeholder="e.g. Credit Specialist"
                      className={FINELY_OS_ENTITY_INPUT}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={`${FINELY_OS_ENTITY_LABEL} flex items-center gap-2`}>
                    <Calendar size={12} /> Invite expires (optional)
                  </label>
                  <input
                    type="date"
                    value={draftInviteExpiresAt}
                    onChange={(e) => setDraftInviteExpiresAt(e.target.value)}
                    className={`mt-1 ${FINELY_OS_ENTITY_SELECT}`}
                  />
                </div>
                <div>
                  <label className={`${FINELY_OS_ENTITY_LABEL} flex items-center gap-2`}>
                    <FileText size={12} /> Notes (optional)
                  </label>
                  <textarea
                    value={draftInviteNotes}
                    onChange={(e) => setDraftInviteNotes(e.target.value)}
                    placeholder="Internal note for this invite"
                    rows={4}
                    className={`${FINELY_OS_ENTITY_INPUT} resize-none`}
                  />
                </div>
                <button type="button" onClick={add} className={`${FINELY_OS_PRIMARY_BTN} w-full justify-center`}>
                  <Plus size={14} /> Send invite
                </button>
              </div>
            </div>
          </section>
        ) : null}

        {deckMode === 'roster' ? (
          <section className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-6`} data-fc-accent="sky">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-extrabold">Member roster</h2>
                <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                  {ENTERPRISE_STATUSES.length} statuses · {ENTERPRISE_PERMISSION_GROUPS.length} permissions · edit per member below.
                </p>
              </div>
              <div className={`${FINELY_OS_TOOLBAR} py-2 sm:max-w-[380px] flex-1`}>
                <Search size={14} className="text-violet-400 shrink-0" />
                <input
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  placeholder="Search members…"
                  className={`bg-transparent outline-none text-base w-full ${FINELY_OS_ENTITY_VALUE} placeholder:text-white/35`}
                />
              </div>
            </div>

            {filteredMembers.length === 0 ? (
              <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>No members yet. Switch to Invite to add someone.</p>
            ) : (
              <FinelyOsPaginatedStack
                items={filteredMembers}
                pageSize={4}
                emptyMessage="No members yet."
                renderItem={(m) => (
                  <div key={m.id} className={`${finelyOsInlineListItem()} p-5 lg:p-6 space-y-3`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={`${FINELY_OS_ENTITY_VALUE} truncate text-lg font-extrabold`}>{m.email}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate normal-case tracking-normal`}>
                          {m.id} • {m.userId}
                        </div>
                        {(m.department || m.jobTitle) && (
                          <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm font-semibold`}>
                            {[m.department, m.jobTitle].filter(Boolean).join(' • ')}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          deleteMembership(m.id);
                          window.dispatchEvent(new Event('finely:store'));
                        }}
                        className={FINELY_OS_DANGER_BTN}
                        title="Remove member"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>Role</div>
                        <select
                          value={m.role}
                          onChange={(e) => setMemberRole(m.id, e.target.value as MembershipRole)}
                          className={`mt-1 ${FINELY_OS_ENTITY_SELECT}`}
                        >
                          {ENTERPRISE_ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>Status</div>
                        <select
                          value={m.status}
                          onChange={(e) => setStatus(m.id, e.target.value as MembershipStatus)}
                          className={`mt-1 ${FINELY_OS_ENTITY_SELECT}`}
                        >
                          {ENTERPRISE_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>Department</div>
                        <input
                          value={m.department ?? ''}
                          onChange={(e) => {
                            updateMembership(m.id, { department: e.target.value.trim() || undefined });
                            setStoreVersion((v) => v + 1);
                          }}
                          placeholder="—"
                          className={FINELY_OS_ENTITY_INPUT}
                        />
                      </div>
                      <div>
                        <div className={FINELY_OS_ENTITY_SUBLABEL}>Job title</div>
                        <input
                          value={m.jobTitle ?? ''}
                          onChange={(e) => {
                            updateMembership(m.id, { jobTitle: e.target.value.trim() || undefined });
                            setStoreVersion((v) => v + 1);
                          }}
                          placeholder="—"
                          className={FINELY_OS_ENTITY_INPUT}
                        />
                      </div>
                    </div>

                    <CollapsibleSection
                      title="Permissions"
                      subtitle="Toggle groups per member"
                      count={`enabled: ${enabledCount(m)}`}
                      defaultOpen={false}
                      storageKey={`admin.team.${tenantId}.${m.id}.perms`}
                      className="bg-violet-500/5"
                    >
                      <div className="space-y-4">
                        {permissionGroups.map(([groupName, keys], idx) => (
                          <details
                            key={groupName}
                            className={`${finelyOsCatalogCard((['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4])} fc-surface-harmony group/details`}
                            data-fc-accent={(['emerald', 'violet', 'sky', 'rose'] as const)[idx % 4]}
                          >
                            <summary className={`cursor-pointer ${FINELY_OS_ENTITY_SUBLABEL} flex items-center justify-between normal-case tracking-normal`}>
                              {groupName}
                              <span className={FINELY_OS_ENTITY_BODY}>
                                {keys.filter((k) => Boolean((m.permissions as any)?.[k])).length}/{keys.length}
                              </span>
                            </summary>
                            <div className="mt-3">
                              <FinelyOsPaginatedStack
                                items={keys}
                                pageSize={12}
                                emptyMessage="No permissions in this group."
                                renderItem={(k) => {
                                  const meta = ENTERPRISE_PERMISSIONS[k as keyof typeof ENTERPRISE_PERMISSIONS];
                                  const enabled = Boolean((m.permissions as any)?.[k]);
                                  return (
                                    <button
                                      key={k}
                                      type="button"
                                      onClick={() => togglePerm(m.id, k)}
                                      className={`text-left px-3 py-2 rounded-xl border text-sm font-bold transition-all ${
                                        enabled ? finelyOsStatusChip('ok') : `${finelyOsInlineListItem()} ${FINELY_OS_ENTITY_BODY}`
                                      }`}
                                    >
                                      <div className="text-xs uppercase tracking-widest opacity-70 truncate" title={k}>
                                        {meta?.label ?? k}
                                      </div>
                                      <div className="mt-0.5 font-mono text-xs">{String(enabled)}</div>
                                    </button>
                                  );
                                }}
                              />
                            </div>
                          </details>
                        ))}
                      </div>
                    </CollapsibleSection>

                    {(m.role === 'agent' || m.role === 'sales_rep') && !Boolean((m.permissions as any)?.canViewAllClients) ? (
                      <div className="pt-2 border-t border-white/[0.08]">
                        <CollapsibleSection
                          title="Assigned partners"
                          subtitle="Required when view-all-partners is off"
                          count={`${Array.isArray((m.permissions as any)?.assignedPartnerIds) ? (m.permissions as any).assignedPartnerIds.length : 0} assigned`}
                          defaultOpen={false}
                          storageKey={`admin.team.${tenantId}.${m.id}.assignedPartners`}
                          className="bg-violet-500/5"
                        >
                          <div className="space-y-2">
                            <div className={`${FINELY_OS_TOOLBAR} py-2`}>
                              <Search size={14} className="text-violet-400 shrink-0" />
                              <input
                                value={assignQueryByMemberId[m.id] ?? ''}
                                onChange={(e) => setAssignQueryByMemberId((cur) => ({ ...cur, [m.id]: e.target.value }))}
                                placeholder="Search partners…"
                                className={`bg-transparent outline-none text-base w-full ${FINELY_OS_ENTITY_VALUE} placeholder:text-white/35`}
                              />
                            </div>
                            <FinelyOsPaginatedStack
                              items={partners.filter((p) => {
                                const q = String(assignQueryByMemberId[m.id] ?? '').trim().toLowerCase();
                                if (!q) return true;
                                const hay = `${p.profile.fullName} ${p.profile.email ?? ''} ${p.id}`.toLowerCase();
                                return hay.includes(q);
                              })}
                              pageSize={8}
                              emptyMessage="No partners in this tenant yet."
                              renderItem={(p) => {
                                const assigned = Array.isArray((m.permissions as any)?.assignedPartnerIds)
                                  ? (m.permissions as any).assignedPartnerIds.includes(p.id)
                                  : false;
                                return (
                                  <label
                                    key={p.id}
                                    className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 cursor-pointer ${
                                      assigned ? FINELY_OS_ACTIVE_CHIP : `${finelyOsInlineListItem()} ${FINELY_OS_ENTITY_BODY}`
                                    }`}
                                  >
                                    <div className="min-w-0">
                                      <div className={`text-base font-extrabold truncate ${FINELY_OS_ENTITY_VALUE}`}>{p.profile.fullName}</div>
                                      <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate normal-case tracking-normal`}>
                                        {p.profile.email ?? 'no-email'} • {p.id}
                                      </div>
                                    </div>
                                    <input type="checkbox" checked={assigned} onChange={() => toggleAssignedPartner(m.id, p.id)} className="accent-emerald-500" />
                                  </label>
                                );
                              }}
                            />
                            <div className={`${FINELY_OS_ENTITY_BODY} text-sm font-semibold`}>
                              Members without view-all-partners must be assigned partners to open partner files.
                            </div>
                          </div>
                        </CollapsibleSection>
                      </div>
                    ) : null}
                  </div>
                )}
              />
            )}
          </section>
        ) : null}
      </div>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
