import React, { useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, ArrowRight, ArrowLeft, Upload, Trash2, Badge, RefreshCcw, Mail, X } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { PartnerCreatePanel } from '../../components/admin/PartnerCreatePanel';
import type { Partner } from '../../domain/partners';
import { fetchAllPartnersAsAdmin, listPartnersLocal } from '../../data/partnersRepo';
import { deletePartnerCompletely } from '../../data/partnerDelete';
import { SensitiveActionCodeGate } from '../../components/admin/SensitiveActionCodeGate';
import { partnerDeletionSummary, partnerDeletionTier } from '../../lib/partnerDeletionPolicy';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { isAdminEmail } from '../../auth/admin';
import { canViewAllClients, getMembershipByUserAndTenant, isPlatformAdmin, getTenant } from '../../data/tenantsRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { getStaffCommsCapabilities } from '../../lib/staffCommsPermissions';
import { ClickableCard } from '../../components/ui';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsDataErrorBanner } from '../../features/os/FinelyOsDataErrorBanner';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildPartnersAdminNoticedItems } from '../../lib/finelyProactiveSignals';
import {
  derivePartnerSignupStatus,
  healClaimedPartnersStuckPending,
  signupStatusChipTone,
} from '../../lib/partnerAuthActivity';
import {
  careTeamSummaryLabels,
  isClientPartner,
  listEligibleHelpers,
  saveCareTeamRole,
} from '../../lib/partnerCareTeam';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_EMPTY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_DANGER_BTN,
  FINELY_OS_ENTITY_SELECT,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';

type PartnersHubTab = 'directory' | 'create';

const COURT_IMPORT_TIP_DISMISS_KEY = 'finely.admin.partners.courtImportTip.dismissed.v1';

export default function PartnersListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const auth = useAuth();
  const [searchParams] = useSearchParams();
  const addAffiliate = searchParams.get('add') === 'affiliate';
  const [hubTab, setHubTab] = useState<PartnersHubTab>(() =>
    addAffiliate || location.hash === '#create-partner' ? 'create' : 'directory',
  );
  const [q, setQ] = useState('');
  const [specialistFilter, setSpecialistFilter] = useState('');
  const [quickAssignBusy, setQuickAssignBusy] = useState<string | null>(null);
  const [fetchKey, setFetchKey] = useState(0);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const [deleteGatePartner, setDeleteGatePartner] = useState<Partner | null>(null);
  const [showCourtImportTip, setShowCourtImportTip] = useState(() => {
    try {
      return localStorage.getItem(COURT_IMPORT_TIP_DISMISS_KEY) !== '1';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (location.hash === '#create-partner') {
      setHubTab('create');
      const el = document.getElementById('create-partner');
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  // Fetch ALL partners via Edge Function (service_role server-side) — no localStorage,
  // no RLS filtering. Every admin always sees the same complete list.
  useEffect(() => {
    if (!auth.user) { setLoading(false); return; }
    setLoading(true);
    setFetchErr(null);
    fetchAllPartnersAsAdmin()
      .then(async (data) => {
        try {
          const healed = await healClaimedPartnersStuckPending(data);
          setPartners(healed.partners);
        } catch {
          setPartners(data);
        }
        setLoading(false);
      })
      .catch((e: unknown) => {
        setFetchErr((e as Error)?.message || 'Could not load partners.');
        setLoading(false);
      });
  }, [auth.user, fetchKey]);

  // Prefer admin-fetched partners (complete list); merge local so newly created specialists appear.
  const tenantHelpers = useMemo(() => {
    const byId = new Map<string, Partner>();
    for (const p of listPartnersLocal()) byId.set(p.id, p);
    for (const p of partners) byId.set(p.id, p);
    return Array.from(byId.values());
  }, [partners, fetchKey]);

  const specialistsForFilter = useMemo(
    () => listEligibleHelpers({ tenantId: getActiveTenantId(), role: 'specialist', partners: tenantHelpers }),
    [tenantHelpers],
  );

  const filteredPartners = useMemo(() => {
    const query = q.trim().toLowerCase();
    return partners.filter((p) => {
      if (specialistFilter && p.assignedAgentId !== specialistFilter) return false;
      if (!query) return true;
      const labels = careTeamSummaryLabels(p, tenantHelpers);
      const hay = `${p.profile.fullName} ${p.profile.email ?? ''} ${p.status} ${labels.specialist ?? ''} ${labels.coach ?? ''} ${labels.affiliate ?? ''}`.toLowerCase();
      return hay.includes(query);
    });
  }, [partners, q, specialistFilter, tenantHelpers]);



  const handleDeletePartner = (partner: Partner) => {
    const summary = partnerDeletionSummary(partner);
    const confirmed = window.confirm(
      `Delete "${partner.profile.fullName}" permanently?\n\n${summary}\n\nThis cannot be undone.`,
    );
    if (!confirmed) return;
    if (partnerDeletionTier(partner) === 'admin_approval_required') {
      setDeleteGatePartner(partner);
      return;
    }
    void executeDeletePartner(partner);
  };

  const executeDeletePartner = async (partner: Partner) => {
    setDeleting(partner.id);
    setDeleteErr(null);

    try {
      const result = await deletePartnerCompletely(partner.id);
      if (result.ok) {
        setFetchKey((v) => v + 1);
        setDeleting(null);
        setDeleteGatePartner(null);
      } else {
        setDeleteErr(result.error || 'Failed to delete partner');
        setDeleting(null);
      }
    } catch (e: any) {
      setDeleteErr(e?.message || 'Failed to delete partner');
      setDeleting(null);
    }
  };

  const getPartnerDisplayBadges = (p: Partner) => {
    const signup = derivePartnerSignupStatus(p);
    const joined = Boolean(p.claimedUserId) || signup.stage === 'active' || signup.stage === 'signup_complete';

    // Joined/claimed partners must not show lifecycle "Pending" as the primary badge.
    if (joined) {
      return {
        primary: {
          chip:
            'inline-flex items-center px-3.5 py-1.5 rounded-xl border border-emerald-300/80 bg-gradient-to-b from-emerald-100 to-white text-[12px] font-black uppercase tracking-widest text-emerald-900 shadow-sm',
          label: signup.stage === 'active' ? 'Joined · Active' : 'Joined',
        },
        secondary: null as null | { chip: string; label: string },
      };
    }

    if (p.status === 'paused') {
      return {
        primary: {
          chip:
            'inline-flex items-center px-3.5 py-1.5 rounded-xl border border-orange-200/80 bg-gradient-to-b from-orange-50 to-white text-[12px] font-black uppercase tracking-widest text-orange-800',
          label: 'Paused',
        },
        secondary: {
          chip: `${finelyOsStatusChip(signupStatusChipTone(signup.tone))} text-[11px]`,
          label: signup.label,
        },
      };
    }

    if (p.status === 'active') {
      return {
        primary: {
          chip: `${finelyOsStatusChip('ok')} px-3.5 py-1.5 text-[12px]`,
          label: 'Active',
        },
        secondary: {
          chip: `${finelyOsStatusChip(signupStatusChipTone(signup.tone))} text-[11px]`,
          label: signup.label,
        },
      };
    }

    // Unclaimed lead / invite pipeline
    return {
      primary: {
        chip: `${finelyOsStatusChip('warn')} px-3.5 py-1.5 text-[12px]`,
        label: signup.stage === 'invite_sent' ? 'Invite pending' : 'Pending',
      },
      secondary: {
        chip: `${finelyOsStatusChip(signupStatusChipTone(signup.tone))} text-[11px]`,
        label: signup.label,
      },
    };
  };

  const canCreatePartner = useMemo(() => {
    const caps = getStaffCommsCapabilities({
      userId: auth.user?.id,
      email: auth.user?.email,
      tenantId: getActiveTenantId(),
    });
    if (caps.canCreatePartners) return true;
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

  const staffCaps = useMemo(
    () =>
      getStaffCommsCapabilities({
        userId: auth.user?.id,
        email: auth.user?.email,
        tenantId: getActiveTenantId(),
      }),
    [auth.user?.id, auth.user?.email],
  );

  const tenantName = useMemo(() => {
    const t = getTenant(getActiveTenantId());
    return t?.name || 'Finely Cred';
  }, []);

  return (
    <PageShell
      badge="Admin"
      title="Partner Management"
      subtitle="Partners are your customers. Every report, evidence item, dispute, and letter is anchored to a Partner profile for auditability."
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex items-center justify-between gap-4">
          <button type="button" onClick={() => navigate('/dashboard')} className={FINELY_OS_BACK_LINK} title="Back to Finely Cred Dashboard">
            <ArrowLeft size={16} /> Dashboard
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setFetchKey((v) => v + 1)}
              disabled={loading}
              className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}
              title="Refresh partners from Supabase"
            >
              <RefreshCcw size={12} />
              {loading ? 'Loading…' : 'Refresh'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/partners/import')}
              className={FINELY_OS_SECONDARY_BTN}
              title="Import partners from legacy software"
            >
              <Upload size={14} /> Import partners
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/mail')}
              className={FINELY_OS_PRIMARY_BTN}
              title="Mail letters for any partner via Finely Mail"
            >
              <Mail size={14} /> Mail letters
            </button>
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
              tenant: {tenantName}
            </div>
          </div>
        </div>

        {showCourtImportTip ? (
          <div className={`${finelyOsCatalogCard('sky')} !p-3 flex flex-wrap items-start justify-between gap-3`}>
            <div className="min-w-0 space-y-1">
              <div className={FINELY_OS_ENTITY_SUBLABEL}>One-time tip · court / Midland-style partners</div>
              <p className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
                Search the directory like any partner. Court seed / Midland–Citi toolkit lives under{' '}
                <button type="button" className="underline text-sky-200" onClick={() => navigate('/admin/partners/import')}>
                  Import partners
                </button>
                {' '}
                (not a permanent top button). Mail partner letters from{' '}
                <button type="button" className="underline text-amber-200" onClick={() => navigate('/admin/mail')}>
                  Mail letters
                </button>
                .
              </p>
            </div>
            <button
              type="button"
              className={FINELY_OS_SECONDARY_BTN}
              title="Dismiss this tip"
              onClick={() => {
                try {
                  localStorage.setItem(COURT_IMPORT_TIP_DISMISS_KEY, '1');
                } catch {
                  /* ignore */
                }
                setShowCourtImportTip(false);
              }}
            >
              <X size={12} /> Dismiss
            </button>
          </div>
        ) : null}

        {fetchErr ? (
          <FinelyOsDataErrorBanner message={fetchErr} hint="Check Supabase connection and admin-list-partners edge function." onRetry={() => setFetchKey((v) => v + 1)} />
        ) : null}

        <FinelyNoticedStrip
          items={buildPartnersAdminNoticedItems({
            partnerCount: filteredPartners.length,
            hubTab,
          })}
        />

        <FinelyNowDoThisStrip currentIndex={0} />

        <FinelyUnifiedHubLayout
          eyebrow="Customer management"
          title="Partner directory"
          subtitle="Browse partners, create records, and jump into profiles — paginated, not a wall of cards."
          accent="emerald"
          tabs={[
            { id: 'directory', label: 'Directory', badge: filteredPartners.length || undefined },
            { id: 'create', label: 'Create partner' },
          ]}
          activeTab={hubTab}
          onTabChange={(id) => setHubTab(id as PartnersHubTab)}
          secondaryAction={{ label: 'Import partners', onClick: () => navigate('/admin/partners/import') }}
        >
          {hubTab === 'create' ? (
            <div id="create-partner" className={`${finelyOsCatalogCard('violet')} !p-5 space-y-5`}>
          <div className="flex items-center gap-3 text-violet-300">
            <UserPlus size={16} />
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Create Partner</span>
          </div>

          {deleteErr && <div className={FINELY_OS_NOTICE_ERROR}>{deleteErr}</div>}

          <PartnerCreatePanel
            canCreate={canCreatePartner}
            initialAffiliate={addAffiliate}
            onCreated={() => setFetchKey((v) => v + 1)}
          />
            </div>
          ) : null}

          {hubTab === 'directory' ? (
        <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className={`flex items-center gap-3 px-4 py-2 rounded-xl ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}>
                <Search size={16} className="text-emerald-400 shrink-0" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className={`bg-transparent outline-none w-72 max-w-full text-sm ${FINELY_OS_ENTITY_VALUE} placeholder:text-white/35`}
                  placeholder="Search partners…"
                />
              </div>
              <select
                value={specialistFilter}
                onChange={(e) => setSpecialistFilter(e.target.value)}
                className={`${FINELY_OS_ENTITY_SELECT} !mt-0 min-w-[200px]`}
                title="Filter by assigned credit specialist"
              >
                <option value="">All specialists</option>
                {specialistsForFilter.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.profile.fullName || s.profile.email || s.id}
                  </option>
                ))}
              </select>
            </div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>
              {filteredPartners.length} partners{loading ? ' (loading…)' : ''}
            </div>
          </div>

          <div className={`text-xs leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>
            <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE} mb-2`}>Partner Sources:</div>
            <ul className="space-y-1 ml-3">
              <li><span className="text-emerald-400">●</span> Created manually via Create Partner form</li>
              <li><span className="text-amber-400">●</span> Import Partners (admin Supabase upsert / one-time court seed)</li>
              <li><span className="text-fuchsia-400">●</span> Signed up partners (auto-created on first login)</li>
            </ul>
          </div>

          <div className="mt-6">
          <FinelyOsPaginatedStack
            items={filteredPartners}
            pageSize={12}
            itemSpacingClassName="grid md:grid-cols-2 lg:grid-cols-3 gap-4"
            emptyMessage="No partners match your search."
            renderItem={(p) => (
              <ClickableCard
                key={p.id}
                onClick={() => {
                  navigate(`/admin/partners/${p.id}`);
                }}
                className="p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{p.profile.fullName}</p>
                    <p className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate`}>
                      {p.profile.email || 'no-email'}
                    </p>
                    {(() => {
                      const labels = careTeamSummaryLabels(p, tenantHelpers);
                      if (!labels.specialist && !labels.coach && !labels.affiliate) return null;
                      return (
                        <p className={`mt-2 text-[11px] ${FINELY_OS_ENTITY_BODY} line-clamp-2`}>
                          {labels.specialist ? <span>Specialist: {labels.specialist}</span> : null}
                          {labels.coach ? <span>{labels.specialist ? ' · ' : ''}Coach: {labels.coach}</span> : null}
                          {labels.affiliate ? (
                            <span>
                              {labels.specialist || labels.coach ? ' · ' : ''}BP: {labels.affiliate}
                            </span>
                          ) : null}
                        </p>
                      );
                    })()}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {(() => {
                      const badges = getPartnerDisplayBadges(p);
                      return (
                        <>
                          <div className={`${badges.primary.chip} gap-1.5 whitespace-nowrap`}>
                            <Badge size={12} />
                            {badges.primary.label}
                          </div>
                          {badges.secondary ? (
                            <div className={`${badges.secondary.chip} gap-1.5 whitespace-nowrap`}>
                              {badges.secondary.label}
                            </div>
                          ) : null}
                        </>
                      );
                    })()}
                    <ArrowRight size={16} className="text-violet-500 shrink-0" />
                  </div>
                </div>

                {isClientPartner(p) ? (
                  <div className="mt-3" role="presentation" onClick={(e) => e.stopPropagation()}>
                    <select
                      value={p.assignedAgentId || ''}
                      disabled={quickAssignBusy === p.id}
                      onChange={(e) => {
                        const nextId = e.target.value;
                        setQuickAssignBusy(p.id);
                        void saveCareTeamRole({ partner: p, role: 'specialist', helperPartnerId: nextId || null })
                          .then(() => setFetchKey((v) => v + 1))
                          .finally(() => setQuickAssignBusy(null));
                      }}
                      className={`${FINELY_OS_ENTITY_SELECT} !mt-0 w-full text-xs`}
                      title="Quick-assign credit specialist"
                    >
                      <option value="">Quick assign specialist…</option>
                      {specialistsForFilter.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.profile.fullName || s.profile.email || s.id}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2" role="presentation" onClick={(e) => e.stopPropagation()}>
                  <span
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/admin/partners/${p.id}?tab=reports`);
                      }
                    }}
                    onClick={() => navigate(`/admin/partners/${p.id}?tab=reports`)}
                    className={`${FINELY_OS_PRIMARY_BTN} cursor-pointer inline-flex`}
                    title="Upload a credit report for this partner"
                  >
                    Upload report <ArrowRight size={12} />
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/admin/partners/${p.id}?tab=letters`);
                      }
                    }}
                    onClick={() => navigate(`/admin/partners/${p.id}?tab=letters`)}
                    className={`${FINELY_OS_SECONDARY_BTN} cursor-pointer inline-flex`}
                    title="Open Letters module"
                  >
                    Letters <ArrowRight size={12} />
                  </span>
                  <span
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/admin/partners/${p.id}?tab=notes`);
                      }
                    }}
                    onClick={() => navigate(`/admin/partners/${p.id}?tab=notes`)}
                    className={`${FINELY_OS_SECONDARY_BTN} cursor-pointer inline-flex`}
                    title="Open Partner notes"
                  >
                    Notes <ArrowRight size={12} />
                  </span>
                  {staffCaps.canDeletePartners ? (
                  <span
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        if (deleting !== p.id) handleDeletePartner(p);
                      }
                    }}
                    onClick={() => {
                      if (deleting !== p.id) handleDeletePartner(p);
                    }}
                    className={`${FINELY_OS_DANGER_BTN} cursor-pointer inline-flex disabled:opacity-60 disabled:cursor-not-allowed`}
                    title="Delete partner and all associated data"
                    aria-disabled={deleting === p.id}
                  >
                    {deleting === p.id ? (
                      <>Deleting…</>
                    ) : (
                      <>
                        <Trash2 size={12} /> Delete
                      </>
                    )}
                  </span>
                  ) : null}
                </div>
              </ClickableCard>
            )}
          />
          </div>
        </div>
          ) : null}
        </FinelyUnifiedHubLayout>
        <FinelyOsPageFooter />
      </div>
      <SensitiveActionCodeGate
        open={Boolean(deleteGatePartner)}
        action="partner_delete"
        title={deleteGatePartner ? `Authorize deletion — ${deleteGatePartner.profile.fullName}` : 'Authorize deletion'}
        description={deleteGatePartner ? partnerDeletionSummary(deleteGatePartner) : ''}
        onClose={() => setDeleteGatePartner(null)}
        onVerified={() => {
          if (deleteGatePartner) void executeDeletePartner(deleteGatePartner);
        }}
      />
    </PageShell>
  );
}

