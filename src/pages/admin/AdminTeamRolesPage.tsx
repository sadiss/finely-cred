import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, Plus, Search, Trash2, Shield, Users, Calendar, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { ActionLink, CollapsibleSection } from '../../components/ui';
import {
  createMembership,
  deleteMembership,
  listMemberships,
  updateMembership,
} from '../../data/tenantsRepo';
import type { MembershipRole, MembershipStatus } from '../../domain/tenants';
import { listTenants } from '../../data/tenantsRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { listPartnersByTenant } from '../../data/partnersRepo';
import {
  ENTERPRISE_PERMISSION_GROUPS,
  ENTERPRISE_PERMISSIONS,
  ENTERPRISE_ROLES,
  ENTERPRISE_STATUSES,
} from '../../domain/enterprisePermissions';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyOsOverviewStatTile } from '../../features/os/FinelyOsOverviewStatTile';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ACTIVE_CHIP,
  FINELY_OS_DANGER_BTN,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_TOOLBAR,
  finelyOsInlineListItem,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

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
        ['canViewAllClients', 'canViewBilling', 'canViewReports', 'canViewLetters', 'canViewCases', 'canViewTasks', 'canViewCourses', 'canViewLeads', 'canViewAutomations', 'canViewAnalytics', 'canViewAuditLogs'].includes(k),
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
  return undefined;
}

export default function AdminTeamRolesPage() {
  const navigate = useNavigate();
  const auth = useAuth();
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
  const [partners, setPartners] = useState<import('../../domain/partners').Partner[]>([]);
  useEffect(() => { listPartnersByTenant(tenantId).then(setPartners); }, [tenantId, storeVersion]);

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

  const add = () => {
    const email = normalizeEmail(draftEmail);
    if (!email) return;
    const perms = defaultPermissionsForRole(draftRole);
    const finalPerms = draftRole === 'agent' ? { ...perms, assignedPartnerIds: [] as string[] } : perms;
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
  };

  const setStatus = (id: string, status: MembershipStatus) => {
    updateMembership(id, { status });
    window.dispatchEvent(new Event('finely:store'));
  };

  const setRole = (id: string, role: MembershipRole) => {
    updateMembership(id, { role });
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

  return (
    <PageShell
      badge="Admin"
      title="Team & Roles"
      subtitle="Enterprise RBAC: 116+ permissions, 12 roles, 6 statuses. Invite members, assign granular access per tenant."
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ActionLink to="/admin" icon={<ArrowLeft size={16} />} className={FINELY_OS_BACK_LINK}>
            Admin Dashboard
          </ActionLink>
          <div className={`${FINELY_OS_TOOLBAR} flex-1 justify-end py-2`}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Tenant</div>
            <select value={tenantId} onChange={(e) => setTenantId(e.target.value)} className={`${FINELY_OS_ENTITY_SELECT} min-w-[200px]`}>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.slug})
                </option>
              ))}
            </select>
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>signed in: {auth.user?.email || '—'}</div>
          </div>
        </div>

        <div className={FINELY_OS_BANNER}>
          <Shield size={18} className="text-violet-600 shrink-0 mt-0.5" />
          <p className={FINELY_OS_ENTITY_BODY}>
            Enterprise RBAC with granular permissions, 12 roles, and 6 statuses. Invite members and assign access per tenant.
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <FinelyOsOverviewStatTile icon={Shield} label="Permissions" value={ENTERPRISE_PERMISSION_GROUPS.length} accent="violet" iconAccent="violet" hint="Granular controls" />
          <FinelyOsOverviewStatTile icon={Users} label="Roles" value={ENTERPRISE_ROLES.length} accent="amber" iconAccent="amber" hint="Platform Admin to Partner" />
          <FinelyOsOverviewStatTile icon={Calendar} label="Statuses" value={ENTERPRISE_STATUSES.length} accent="sky" iconAccent="sky" hint="Active, Invited, Suspended" />
          <FinelyOsOverviewStatTile icon={Users} label="Members" value={members.length} accent="emerald" iconAccent="emerald" hint="In this tenant" />
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-5 ${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Invite member</div>

            <div className="space-y-3">
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
              <div className="grid grid-cols-2 gap-2">
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
                    placeholder="e.g. Agent"
                    className={FINELY_OS_ENTITY_INPUT}
                  />
                </div>
              </div>
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
                  rows={2}
                  className={`${FINELY_OS_ENTITY_INPUT} resize-none`}
                />
              </div>
              <button type="button" onClick={add} className={`${FINELY_OS_PRIMARY_BTN} w-full justify-center`}>
                <Plus size={14} /> Invite
              </button>
              <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
                Invites are email-based. When the user signs in with that email, their membership becomes active. Roles determine default permissions; granular permissions can be edited per member below.
              </div>
            </div>
          </div>

          <div className={`lg:col-span-7 ${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Members</div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className={`${FINELY_OS_TOOLBAR} flex-1 py-2 sm:max-w-[380px]`}>
                <Search size={14} className="text-violet-400 shrink-0" />
                <input
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  placeholder="Search members…"
                  className={`bg-transparent outline-none text-sm w-full ${FINELY_OS_ENTITY_VALUE} placeholder:text-white/35`}
                />
              </div>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>
                {filteredMembers.length} member{filteredMembers.length === 1 ? '' : 's'}
              </div>
            </div>

            {filteredMembers.length === 0 ? (
              <div className={FINELY_OS_ENTITY_BODY}>No members yet.</div>
            ) : (
              <FinelyOsPaginatedStack
                items={filteredMembers}
                pageSize={4}
                emptyMessage="No members yet."
                renderItem={(m) => (
                  <div key={m.id} className={`${finelyOsInlineListItem()} p-5 space-y-3`}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{m.email}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate normal-case tracking-normal`}>
                          {m.id} • {m.userId}
                        </div>
                        {(m.department || m.jobTitle) && (
                          <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-xs`}>
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
                          onChange={(e) => setRole(m.id, e.target.value as MembershipRole)}
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
                      subtitle={`116 permissions by group. Collapse to keep compact.`}
                      count={`enabled: ${enabledCount(m)}`}
                      defaultOpen={false}
                      storageKey={`admin.team.${tenantId}.${m.id}.perms`}
                      className="bg-violet-500/5"
                    >
                      <div className="space-y-4">
                        {permissionGroups.map(([groupName, keys]) => (
                          <details key={groupName} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony group/details`}>
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
                                    className={`text-left px-3 py-2 rounded-xl border text-[11px] transition-all ${
                                      enabled ? finelyOsStatusChip('ok') : `${finelyOsInlineListItem()} ${FINELY_OS_ENTITY_BODY}`
                                    }`}
                                  >
                                    <div className="text-[10px] uppercase tracking-widest opacity-70 truncate" title={k}>
                                      {meta?.label ?? k}
                                    </div>
                                    <div className="mt-0.5 font-mono text-[10px]">{String(enabled)}</div>
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
                          subtitle="Only needed when “view all customers” is off."
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
                                className={`bg-transparent outline-none text-sm w-full ${FINELY_OS_ENTITY_VALUE} placeholder:text-white/35`}
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
                                      <div className={`text-sm font-semibold truncate ${FINELY_OS_ENTITY_VALUE}`}>{p.profile.fullName}</div>
                                      <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate normal-case tracking-normal`}>
                                        {p.profile.email ?? 'no-email'} • {p.id}
                                      </div>
                                    </div>
                                    <input type="checkbox" checked={assigned} onChange={() => toggleAssignedPartner(m.id, p.id)} className="accent-emerald-500" />
                                  </label>
                                );
                              }}
                            />
                            <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>Members without “view all customers” must be assigned partners to access customer files.</div>
                          </div>
                        </CollapsibleSection>
                      </div>
                    ) : null}
                  </div>
                )}
              />
            )}
          </div>
        </div>
        <FinelyOsPageFooter />
</div>
    </PageShell>
  );
}
