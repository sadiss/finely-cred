import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronDown, Plus, Search, Trash2, Shield, Users, Calendar, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { ActionLink, Button, CollapsibleSection } from '../../components/ui';
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
  if (role === 'agent') return { canViewAllClients: false };
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
  const [assignShowAllByMemberId, setAssignShowAllByMemberId] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    setTenantId(getActiveTenantId());
  }, [storeVersion]);

  const tenants = useMemo(() => listTenants().slice().sort((a, b) => a.name.localeCompare(b.name)), [storeVersion]);
  const partners = useMemo(() => listPartnersByTenant(tenantId), [tenantId, storeVersion]);

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
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <ActionLink to="/admin" icon={<ArrowLeft size={16} />}>
            Admin Dashboard
          </ActionLink>
          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 text-white/60 text-xs uppercase tracking-wider">Tenant</div>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-white text-sm"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.slug})
                </option>
              ))}
            </select>
            <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">signed in: {auth.user?.email || '—'}</div>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Permissions</div>
            <div className="mt-1 text-2xl font-light text-white">{ENTERPRISE_PERMISSION_GROUPS.length}</div>
            <div className="text-white/50 text-xs">Granular controls</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Roles</div>
            <div className="mt-1 text-2xl font-light text-white">{ENTERPRISE_ROLES.length}</div>
            <div className="text-white/50 text-xs">From Platform Admin to Partner</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Statuses</div>
            <div className="mt-1 text-2xl font-light text-white">{ENTERPRISE_STATUSES.length}</div>
            <div className="text-white/50 text-xs">Active, Invited, Suspended, etc.</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <div className="text-[10px] uppercase tracking-widest text-white/40">Members</div>
            <div className="mt-1 text-2xl font-light text-white">{members.length}</div>
            <div className="text-white/50 text-xs">In this tenant</div>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <Users size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Invite member</span>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider">Email</label>
                <input
                  value={draftEmail}
                  onChange={(e) => setDraftEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider">Role</label>
                <select
                  value={draftRole}
                  onChange={(e) => setDraftRole(e.target.value as MembershipRole)}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white text-sm focus:outline-none focus:border-amber-500/50"
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
                  <label className="text-white/60 text-xs uppercase tracking-wider">Department</label>
                  <input
                    value={draftDepartment}
                    onChange={(e) => setDraftDepartment(e.target.value)}
                    placeholder="e.g. Support"
                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-500/50"
                  />
                </div>
                <div>
                  <label className="text-white/60 text-xs uppercase tracking-wider">Job title</label>
                  <input
                    value={draftJobTitle}
                    onChange={(e) => setDraftJobTitle(e.target.value)}
                    placeholder="e.g. Agent"
                    className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider flex items-center gap-2">
                  <Calendar size={12} /> Invite expires (optional)
                </label>
                <input
                  type="date"
                  value={draftInviteExpiresAt}
                  onChange={(e) => setDraftInviteExpiresAt(e.target.value)}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white text-sm focus:outline-none focus:border-amber-500/50"
                />
              </div>
              <div>
                <label className="text-white/60 text-xs uppercase tracking-wider flex items-center gap-2">
                  <FileText size={12} /> Notes (optional)
                </label>
                <textarea
                  value={draftInviteNotes}
                  onChange={(e) => setDraftInviteNotes(e.target.value)}
                  placeholder="Internal note for this invite"
                  rows={2}
                  className="mt-1 w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white placeholder-white/30 text-sm focus:outline-none focus:border-amber-500/50 resize-none"
                />
              </div>
              <Button variant="primary" onClick={add} className="w-full">
                <Plus size={14} /> Invite
              </Button>
              <div className="text-white/40 text-xs">
                Invites are email-based. When the user signs in with that email, their membership becomes active. Roles determine default permissions; granular permissions can be edited per member below.
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <Shield size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Members</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2 w-full sm:w-[380px]">
                <Search size={14} className="text-white/30" />
                <input
                  value={memberQuery}
                  onChange={(e) => setMemberQuery(e.target.value)}
                  placeholder="Search members…"
                  className="bg-transparent outline-none text-white/80 placeholder:text-white/20 text-sm w-full"
                />
              </div>
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                {filteredMembers.length} member{filteredMembers.length === 1 ? '' : 's'}
              </div>
            </div>

            {filteredMembers.length === 0 ? (
              <div className="text-white/50 text-sm">No members yet.</div>
            ) : (
              <div className="space-y-3 max-h-[72vh] overflow-y-auto pr-2 fc-scroll-area">
                {filteredMembers.map((m) => (
                  <div key={m.id} className="rounded-2xl border border-white/10 bg-white/[0.02] p-5 space-y-3">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">{m.email}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                          {m.id} • {m.userId}
                        </div>
                        {(m.department || m.jobTitle) && (
                          <div className="mt-1 text-white/50 text-xs">
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
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-rose-500/25 bg-rose-500/10 text-rose-200 text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/15 transition-all"
                        title="Remove member"
                      >
                        <Trash2 size={14} /> Remove
                      </button>
                    </div>

                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Role</div>
                        <select
                          value={m.role}
                          onChange={(e) => setRole(m.id, e.target.value as MembershipRole)}
                          className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-white text-sm"
                        >
                          {ENTERPRISE_ROLES.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Status</div>
                        <select
                          value={m.status}
                          onChange={(e) => setStatus(m.id, e.target.value as MembershipStatus)}
                          className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-white text-sm"
                        >
                          {ENTERPRISE_STATUSES.map((s) => (
                            <option key={s.value} value={s.value}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Department</div>
                        <input
                          value={m.department ?? ''}
                          onChange={(e) => {
                            updateMembership(m.id, { department: e.target.value.trim() || undefined });
                            setStoreVersion((v) => v + 1);
                          }}
                          placeholder="—"
                          className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-white placeholder-white/30 text-sm"
                        />
                      </div>
                      <div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40">Job title</div>
                        <input
                          value={m.jobTitle ?? ''}
                          onChange={(e) => {
                            updateMembership(m.id, { jobTitle: e.target.value.trim() || undefined });
                            setStoreVersion((v) => v + 1);
                          }}
                          placeholder="—"
                          className="mt-1 w-full px-3 py-2 rounded-xl border border-white/10 bg-black/30 text-white placeholder-white/30 text-sm"
                        />
                      </div>
                    </div>

                    <CollapsibleSection
                      title="Permissions"
                      subtitle={`116 permissions by group. Collapse to keep compact.`}
                      count={`enabled: ${enabledCount(m)}`}
                      defaultOpen={false}
                      storageKey={`admin.team.${tenantId}.${m.id}.perms`}
                      className="bg-black/20"
                    >
                      <div className="space-y-4">
                        {permissionGroups.map(([groupName, keys]) => (
                          <details key={groupName} className="rounded-xl border border-white/10 bg-black/30 p-3 group/details">
                            <summary className="cursor-pointer text-[10px] uppercase tracking-widest text-white/50 font-semibold flex items-center justify-between">
                              {groupName}
                              <span className="text-white/40">
                                {keys.filter((k) => Boolean((m.permissions as any)?.[k])).length}/{keys.length}
                              </span>
                            </summary>
                            <div className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {keys.map((k) => {
                                const meta = ENTERPRISE_PERMISSIONS[k as keyof typeof ENTERPRISE_PERMISSIONS];
                                const enabled = Boolean((m.permissions as any)?.[k]);
                                return (
                                  <button
                                    key={k}
                                    type="button"
                                    onClick={() => togglePerm(m.id, k)}
                                    className={`text-left px-3 py-2 rounded-xl border text-[11px] transition-all ${
                                      enabled ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100' : 'border-white/10 bg-white/[0.02] text-white/60 hover:bg-white/[0.05]'
                                    }`}
                                  >
                                    <div className="text-[10px] uppercase tracking-widest opacity-70 truncate" title={k}>
                                      {meta?.label ?? k}
                                    </div>
                                    <div className="mt-0.5 font-mono text-[10px]">{String(enabled)}</div>
                                  </button>
                                );
                              })}
                            </div>
                          </details>
                        ))}
                      </div>
                    </CollapsibleSection>

                    {(m.role === 'agent' || m.role === 'sales_rep') && !Boolean((m.permissions as any)?.canViewAllClients) ? (
                      <div className="pt-2 border-t border-white/10">
                        <CollapsibleSection
                          title="Assigned partners"
                          subtitle="Only needed when “view all clients” is off."
                          count={`${Array.isArray((m.permissions as any)?.assignedPartnerIds) ? (m.permissions as any).assignedPartnerIds.length : 0} assigned`}
                          defaultOpen={false}
                          storageKey={`admin.team.${tenantId}.${m.id}.assignedPartners`}
                          className="bg-black/20"
                        >
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 px-3 py-2">
                              <Search size={14} className="text-white/30" />
                              <input
                                value={assignQueryByMemberId[m.id] ?? ''}
                                onChange={(e) => setAssignQueryByMemberId((cur) => ({ ...cur, [m.id]: e.target.value }))}
                                placeholder="Search partners…"
                                className="bg-transparent outline-none text-white/80 placeholder:text-white/20 text-sm w-full"
                              />
                            </div>
                            <div className="max-h-[260px] overflow-y-auto pr-1 space-y-1 fc-scroll-area">
                              {partners
                                .filter((p) => {
                                  const q = String(assignQueryByMemberId[m.id] ?? '').trim().toLowerCase();
                                  if (!q) return true;
                                  const hay = `${p.profile.fullName} ${p.profile.email ?? ''} ${p.id}`.toLowerCase();
                                  return hay.includes(q);
                                })
                                .slice(0, assignShowAllByMemberId[m.id] ? 2000 : 120)
                                .map((p) => {
                                  const assigned = Array.isArray((m.permissions as any)?.assignedPartnerIds)
                                    ? (m.permissions as any).assignedPartnerIds.includes(p.id)
                                    : false;
                                  return (
                                    <label
                                      key={p.id}
                                      className={`flex items-center justify-between gap-3 rounded-xl border px-3 py-2 cursor-pointer ${
                                        assigned ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-100' : 'border-white/10 bg-white/[0.02] text-white/70 hover:bg-white/[0.05]'
                                      }`}
                                    >
                                      <div className="min-w-0">
                                        <div className="text-sm font-semibold truncate">{p.profile.fullName}</div>
                                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                                          {p.profile.email ?? 'no-email'} • {p.id}
                                        </div>
                                      </div>
                                      <input type="checkbox" checked={assigned} onChange={() => toggleAssignedPartner(m.id, p.id)} className="accent-emerald-500" />
                                    </label>
                                  );
                                })}
                              {partners.length === 0 ? <div className="text-white/50 text-sm">No partners in this tenant yet.</div> : null}
                            </div>
                            {partners.length > 120 ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setAssignShowAllByMemberId((cur) => ({ ...cur, [m.id]: !Boolean(cur[m.id]) }))
                                }
                                className="fc-action-link fc-focus-ring"
                              >
                                {assignShowAllByMemberId[m.id] ? 'Show fewer partners' : 'Show more partners'}
                              </button>
                            ) : null}
                            <div className="text-white/40 text-xs">Members without “view all clients” must be assigned partners to access client files.</div>
                          </div>
                        </CollapsibleSection>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
