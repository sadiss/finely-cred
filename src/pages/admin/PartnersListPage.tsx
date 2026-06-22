import React, { useEffect, useMemo, useState } from 'react';
import { Search, UserPlus, ArrowRight, ArrowLeft, Upload, Trash2, Badge, RefreshCcw } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { adminUpsertPartner, createPartner, fetchAllPartnersAsAdmin, listPartners, rowToPartner } from '../../data/partnersRepo';
import { deletePartnerCompletely } from '../../data/partnerDelete';
import { createInvite } from '../../data/invitesRepo';
import { partnerSetupBaseUrl } from '../../lib/partnerInviteLinks';
import type { Partner, PartnerLane, PartnerRoute } from '../../domain/partners';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { isAdminEmail } from '../../auth/admin';
import { canViewAllClients, getMembershipByUserAndTenant, isPlatformAdmin, getTenant } from '../../data/tenantsRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { supabase } from '../../lib/supabaseClient';
import { ClickableCard } from '../../components/ui';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsDataErrorBanner } from '../../features/os/FinelyOsDataErrorBanner';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { FinelyNowDoThisStrip } from '../../components/tours/FinelyNowDoThisStrip';
import { FinelyNoticedStrip } from '../../components/tours/FinelyNoticedStrip';
import { buildPartnersAdminNoticedItems } from '../../lib/finelyProactiveSignals';
import { sendPartnerOutreachMessage, defaultPartnerWelcomeMessage } from '../../lib/partnerMessaging';
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
  const [fetchKey, setFetchKey] = useState(0);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchErr, setFetchErr] = useState<string | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [primaryRoute, setPrimaryRoute] = useState<PartnerRoute>('personal_restore');
  const [lane, setLane] = useState<PartnerLane | undefined>(() => (addAffiliate ? 'affiliate' : undefined));
  const [creating, setCreating] = useState(false);
  const [createErr, setCreateErr] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  // After creating a partner we generate a claim link so the partner can create
  // their own profile (set a password) and link to this record.
  const [createdInvite, setCreatedInvite] = useState<{ name: string; url: string; partnerId: string } | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

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
      .then((data) => {
        setPartners(data);
        setLoading(false);
      })
      .catch((e: unknown) => {
        setFetchErr((e as Error)?.message || 'Could not load partners.');
        setLoading(false);
      });
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
        return { chip: finelyOsStatusChip('ok'), label: 'Active' };
      case 'lead':
        return { chip: finelyOsStatusChip('warn'), label: 'Pending' };
      case 'paused':
        return {
          chip: 'inline-flex items-center px-2.5 py-1 rounded-lg border border-orange-200/80 bg-gradient-to-b from-orange-50 to-white text-[10px] font-black uppercase tracking-widest text-orange-800',
          label: 'Paused',
        };
      default:
        return { chip: finelyOsStatusChip('blocked'), label: status };
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
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono`}>
              tenant: {tenantName}
            </div>
          </div>
        </div>

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

          {!canCreatePartner ? (
            <div className={FINELY_OS_ENTITY_EMPTY}>
              Your role doesn’t allow creating new partners in this tenant. Ask an admin/owner to grant access or assign you customers.
            </div>
          ) : null}

          {createErr && <div className={FINELY_OS_NOTICE_ERROR}>{createErr}</div>}

          {deleteErr && <div className={FINELY_OS_NOTICE_ERROR}>{deleteErr}</div>}

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>Full name</label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={FINELY_OS_ENTITY_INPUT}
                placeholder="Partner full name"
              />
              <div className={`mt-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>Required to enable “Create Partner”.</div>
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={FINELY_OS_ENTITY_INPUT}
                placeholder="partner@email.com"
              />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>Primary route</label>
              <select
                value={primaryRoute}
                onChange={(e) => setPrimaryRoute(e.target.value as PartnerRoute)}
                className={FINELY_OS_ENTITY_SELECT}
              >
                <option value="personal_restore">Personal Credit Restore</option>
                <option value="personal_build">Personal Credit Building</option>
                <option value="business_build">Business Credit Building</option>
              </select>
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>Lane (optional)</label>
              <select
                value={lane ?? ''}
                onChange={(e) => setLane((e.target.value || undefined) as PartnerLane | undefined)}
                className={FINELY_OS_ENTITY_SELECT}
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
              {addAffiliate && <div className={`mt-2 text-xs text-fuchsia-300/90 ${FINELY_OS_ENTITY_BODY}`}>Pre-selected for affiliate add flow.</div>}
            </div>
          </div>

          <div>
            <button
              className={FINELY_OS_PRIMARY_BTN}
              disabled={!canCreatePartner || !fullName.trim() || creating}
              onClick={async () => {
                setCreateErr(null);
                setCreatedInvite(null);
                setInviteCopied(false);
                const name = fullName.trim();
                if (!name) {
                  setCreateErr('Full name is required.');
                  return;
                }
                setCreating(true);
                try {
                  const emailVal = email.trim();
                  const p = await createPartner({
                    tenantId: getActiveTenantId(),
                    fullName: name,
                    email: emailVal || undefined,
                    primaryRoute,
                    lane,
                    intake: {},
                    asAdmin: true,
                  });
                  // Trigger the partner-side "create your profile" flow: generate a claim
                  // link the partner uses to sign up (set a password) and link this record.
                  let claimUrl = '';
                  try {
                    const inv = createInvite({
                      partnerId: p.id,
                      claimUrl: partnerSetupBaseUrl(),
                      toEmail: emailVal || undefined,
                    });
                    claimUrl = inv.claimUrl;
                  } catch {
                    // best-effort: partner is still created even if invite generation fails
                  }
                  try {
                    sendPartnerOutreachMessage({
                      partnerId: p.id,
                      partnerName: name,
                      body: defaultPartnerWelcomeMessage(name),
                    });
                  } catch {
                    // non-blocking welcome thread
                  }
                  setFullName('');
                  setEmail('');
                  setFetchKey((v) => v + 1);
                  setCreatedInvite({ name, url: claimUrl, partnerId: p.id });
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

          {createdInvite ? (
            <div className={`${FINELY_OS_NOTICE_SUCCESS} space-y-3`}>
              <div className="font-semibold">Partner “{createdInvite.name}” created.</div>
              <div className={FINELY_OS_ENTITY_BODY}>
                A welcome message was queued in Team chat — they will see it when they log in. Send this link so they can claim their profile:
              </div>
              {createdInvite.url ? (
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    readOnly
                    value={createdInvite.url}
                    onFocus={(e) => e.currentTarget.select()}
                    className={`flex-1 ${FINELY_OS_ENTITY_INPUT} font-mono text-sm`}
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(createdInvite.url);
                        setInviteCopied(true);
                        window.setTimeout(() => setInviteCopied(false), 2000);
                      } catch {
                        // ignore
                      }
                    }}
                    className={FINELY_OS_SUCCESS_BTN}
                  >
                    {inviteCopied ? 'Copied!' : 'Copy link'}
                  </button>
                </div>
              ) : (
                <div className={FINELY_OS_ENTITY_BODY}>Claim link unavailable. You can still open the partner profile below.</div>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => navigate(`/admin/support?partnerId=${createdInvite.partnerId}`)}
                  className={FINELY_OS_SECONDARY_BTN}
                >
                  Open support inbox
                </button>
                <button
                  type="button"
                  onClick={() => navigate(`/admin/partners/${createdInvite.partnerId}?tab=reports`)}
                  className={FINELY_OS_PRIMARY_BTN}
                >
                  Open partner profile <ArrowRight size={14} />
                </button>
                <button type="button" onClick={() => setCreatedInvite(null)} className={FINELY_OS_SECONDARY_BTN}>
                  Dismiss
                </button>
              </div>
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>
                Tip: if the partner signs up with the same email, their account links automatically too.
              </div>
            </div>
          ) : null}
            </div>
          ) : null}

          {hubTab === 'directory' ? (
        <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
          <div className="flex items-center justify-between gap-4">
            <div className={`flex items-center gap-3 px-4 py-2 rounded-xl ${FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '')}`}>
              <Search size={16} className="text-emerald-400 shrink-0" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className={`bg-transparent outline-none w-72 max-w-full text-sm ${FINELY_OS_ENTITY_VALUE} placeholder:text-white/35`}
                placeholder="Search partners…"
              />
            </div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>
              {filteredPartners.length} partners{loading ? ' (loading…)' : ''}
            </div>
          </div>

          <div className={`text-xs leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>
            <div className={`font-semibold ${FINELY_OS_ENTITY_VALUE} mb-2`}>Partner Sources:</div>
            <ul className="space-y-1 ml-3">
              <li><span className="text-emerald-400">●</span> Created manually via "Create Partner" form</li>
              <li><span className="text-fuchsia-400">●</span> Signed up users (auto-created on first login)</li>
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
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className={`${getStatusBadge(p.status).chip} gap-1.5 whitespace-nowrap`}>
                      <Badge size={10} />
                      {getStatusBadge(p.status).label}
                    </div>
                    <ArrowRight size={16} className="text-violet-500 shrink-0" />
                  </div>
                </div>

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
    </PageShell>
  );
}

