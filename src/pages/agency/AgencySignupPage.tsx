import React, { useMemo, useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, Crown, Users } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { createTenant, createMembership } from '../../data/tenantsRepo';
import { setActiveTenantId } from '../../tenancy/activeTenant';
import { CareersQuickNav } from '../../components/careers/CareersQuickNav';
import { AGENCY } from '../../config/agencyPartnersProgram';
import { agencyTiers, getAgencyTierById } from '../../config/pricingCatalog';
import { AgencySplitBreakdown, AgencySplitSummaryLine } from '../../components/pricing/AgencySplitBreakdown';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import { MarketingStaffChatStrip } from '../../components/marketing/MarketingStaffChatStrip';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  finelyOsCatalogCard,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsListItem,
} from '../../features/os/finelyOsLightUi';

function normalizeEmail(u: any): string {
  return (
    String(
      u?.email ||
        u?.user_metadata?.email ||
        u?.identities?.[0]?.identity_data?.email ||
        '',
    )
      .trim()
      .toLowerCase()
  );
}

const formLabel = `block ${FINELY_OS_ENTITY_LABEL} mb-1`;
const formInput = FINELY_OS_ENTITY_INPUT.replace('mt-2 ', '');

export default function AgencySignupPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  usePublicSeoMeta({
    title: 'Agency white-label signup',
    description: 'Launch a credit services agency on Finely Cred — white-label partner OS, compliance workflows, and revenue share.',
    path: '/agency/signup',
  });

  const tierId = (sp.get('tier') || '').trim();
  const tier = useMemo(() => (tierId ? getAgencyTierById(tierId) ?? null : null), [tierId]);

  const email = useMemo(() => normalizeEmail(auth.user), [auth.user]);

  const [agencyName, setAgencyName] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [laneTab, setLaneTab] = useState<'signup' | 'tiers'>('signup');

  const publicTiers = useMemo(
    () => agencyTiers.filter((t) => t.isPublic).slice().sort((a, b) => a.sortOrder - b.sortOrder),
    [],
  );

  const tierDefaults = useMemo(() => {
    const id = tier?.id || '';
    const isSolo = id === 'agency_solo';
    const isGrowth = id === 'agency_growth' || id === 'agency_operator';
    const isPro = id === 'agency_pro' || id === 'agency_scale';
    const isEnterprise = id === 'agency_enterprise';
    return {
      whiteLabel: !isSolo,
      apiAccess: isPro || isEnterprise,
      wealthPaths: isGrowth || isPro || isEnterprise,
      tradelines: false,
      businessCredit: true,
      debtResolution: true,
    };
  }, [tier?.id]);

  const canSubmit = Boolean(auth.user?.id && email && agencyName.trim().length >= 3 && !busy);

  const submit = () => {
    if (!auth.user?.id) {
      setNotice('Please complete onboarding / sign in first.');
      return;
    }
    if (!email) {
      setNotice('Email missing on session. Please re-authenticate.');
      return;
    }
    const name = agencyName.trim();
    if (name.length < 3) {
      setNotice('Agency name must be at least 3 characters.');
      return;
    }

    setBusy(true);
    try {
      const tenant = createTenant({
        name,
        type: 'agency',
        settings: {
          brandName: name,
          supportEmail: email,
          features: tierDefaults,
        },
      });

      createMembership({
        tenantId: tenant.id,
        userId: auth.user.id,
        email,
        role: 'tenant_owner',
        status: 'active',
      });

      setActiveTenantId(tenant.id);
      try {
        window.dispatchEvent(new Event('finely:store'));
      } catch {
        // ignore
      }

      void import('../../lib/funnelEmail').then(({ sendAgencySignupWelcomeEmail }) =>
        sendAgencySignupWelcomeEmail({
          email,
          fullName: auth.user?.user_metadata?.full_name || agencyName.trim(),
          agencyName: name,
          tenantId: tenant.id,
        }).catch(() => {}),
      );

      setNotice(`Workspace created: ${tenant.name}`);
      window.setTimeout(() => navigate('/admin/access'), 450);
    } catch (e: any) {
      setNotice(e?.message || 'Could not create agency workspace. Please try again.');
      setBusy(false);
    }
  };

  return (
    <PageShell
      badge="Agency"
      title="Create your agency workspace"
      subtitle="Spin up a white‑label tenant, then configure branding, team seats, and feature access."
    >
      <div className={FINELY_OS_PAGE}>
        {notice ? <div className={FINELY_OS_NOTICE_SUCCESS}>{notice}</div> : null}

        <CareersQuickNav active="agency_partners" className="mb-6" />

        <FinelyUnifiedHubLayout
          eyebrow={AGENCY.programName}
          title="Create your agency workspace"
          subtitle="Spin up a white-label tenant, then configure branding, team seats, and feature access."
          accent="violet"
          tabs={[
            { id: 'signup', label: 'Workspace' },
            { id: 'tiers', label: 'Tiers' },
          ]}
          activeTab={laneTab}
          onTabChange={(id) => setLaneTab(id as typeof laneTab)}
          primaryAction={{ label: 'Program overview', onClick: () => navigate(AGENCY.publicPath) }}
          secondaryAction={{ label: 'Compare tiers', onClick: () => navigate('/pricing?tab=agency') }}
        >
        <div className="grid lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-7 min-w-0 space-y-4 ${finelyOsCatalogCard('violet')} !p-5`}>
            <div className="inline-flex items-center gap-2 text-fuchsia-400">
              <Building2 size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Workspace</span>
            </div>

            <div className="space-y-1">
              <label className={formLabel}>Agency name</label>
              <input
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Acme Credit Solutions"
                className={formInput}
              />
              <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
                This becomes your tenant name + default brand name. You can customize it later in Tenants.
              </div>
            </div>

            <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Account</div>
              <div className={FINELY_OS_ENTITY_BODY}>
                Signed in as <span className={`font-mono font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{email || '—'}</span>
              </div>
              <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
                After creation, you’ll be routed to <span className="font-mono">/admin/access</span> to verify tenant + permissions.
              </div>
            </div>

            <button type="button" disabled={!canSubmit} onClick={submit} className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60 disabled:cursor-not-allowed`}>
              {busy ? 'Creating…' : 'Create workspace'} <ArrowRight size={16} />
            </button>
          </div>

          <div className="lg:col-span-5 min-w-0 space-y-6">
            <div className={`space-y-4 ${finelyOsCatalogCard('violet')} !p-5`}>
              <div className="inline-flex items-center gap-2 text-fuchsia-400">
                <Crown size={18} />
                <span className={FINELY_OS_ENTITY_SUBLABEL}>Selected tier</span>
              </div>

              {tier ? (
                <div className="space-y-2">
                  <div className={FINELY_OS_ENTITY_VALUE}>{tier.name}</div>
                  <div className={FINELY_OS_ENTITY_BODY}>{tier.description}</div>
                  {tier.splitBreakdown?.length || tier.platformShareMinPct != null ? (
                    <AgencySplitBreakdown tier={tier} variant="compact" className="mt-2" />
                  ) : null}
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} capitalize`}>{(tier.whiteLabelLevel ?? '').replace(/_/g, ' ')}</div>
                  <div className={FINELY_OS_ENTITY_BODY}>
                    Seats: {tier.seatLimit === -1 ? 'Unlimited' : tier.seatLimit} • Customers:{' '}
                    {tier.activeClientLimit === -1 ? 'Unlimited' : tier.activeClientLimit}
                  </div>
                  <button type="button" onClick={() => navigate(AGENCY.publicPath)} className={`mt-2 ${FINELY_OS_SECONDARY_BTN}`}>
                    Program overview →
                  </button>
                </div>
              ) : (
                <div className={FINELY_OS_ENTITY_BODY}>
                  No tier selected. Go back to <span className="font-mono">/services?tab=agency</span> to pick a plan.
                </div>
              )}

              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                <div className="inline-flex items-center gap-2 text-fuchsia-400">
                  <Users size={16} />
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>What’s next</span>
                </div>
                <ul className={`mt-3 space-y-2 ${FINELY_OS_ENTITY_BODY}`}>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 text-emerald-600 shrink-0" />
                    <span>Set active tenant + verify capabilities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 text-emerald-600 shrink-0" />
                    <span>Configure branding + domain in Tenants</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 text-emerald-600 shrink-0" />
                    <span>Add team seats + roles in Team</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
              <div className={FINELY_OS_ENTITY_SUBLABEL}>Available tiers</div>
              <FinelyOsPaginatedStack
                items={publicTiers}
                pageSize={4}
                itemSpacingClassName="grid grid-cols-1 gap-2"
                renderItem={(t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => navigate(`/agency/signup?tier=${encodeURIComponent(t.id)}`)}
                    className={`text-left w-full ${finelyOsListItem(tier?.id === t.id, 'amber')}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{t.name}</div>
                        <div className={`${FINELY_OS_ENTITY_BODY} text-xs truncate`}>{t.description}</div>
                      </div>
                      <div className="text-emerald-300 text-xs shrink-0 text-right">
                        <AgencySplitSummaryLine tier={t} />
                      </div>
                    </div>
                  </button>
                )}
              />
            </div>
          </div>
        </div>
        </FinelyUnifiedHubLayout>

        <MarketingStaffChatStrip
          roleId="lead_converter"
          goal="business"
          roleLabel="agency activation specialist"
          subline="Questions about white-label tiers, seats, or agency onboarding before you create a workspace?"
        />

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
