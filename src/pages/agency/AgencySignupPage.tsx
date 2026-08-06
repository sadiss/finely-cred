import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, CheckCircle2, LogIn, ShieldAlert } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { createTenant, createMembership } from '../../data/tenantsRepo';
import { setActiveTenantId } from '../../tenancy/activeTenant';
import { CareersQuickNav } from '../../components/careers/CareersQuickNav';
import { careerAccentText, careerSolidBtn } from '../../components/careers/careerUi';
import {
  AGENCY,
  getAgencyPlanBullets,
  getPublicAgencyBuyInTiers,
  recommendedAgencyBuyInIdForTier,
} from '../../config/agencyPartnersProgram';
import { agencyTiers, getAgencyTierById } from '../../config/pricingCatalog';
import { AgencySplitBreakdown } from '../../components/pricing/AgencySplitBreakdown';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { MarketingStaffChatStrip } from '../../components/marketing/MarketingStaffChatStrip';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { FINELY_OS_BACK_LINK, FINELY_OS_PAGE } from '../../features/os/finelyOsLightUi';

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

const FORM_LABEL = 'block text-[11px] font-bold uppercase tracking-wide text-slate-500 mb-1.5';
const FORM_INPUT =
  'w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 transition-colors';

export default function AgencySignupPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  usePublicSeoMeta({
    title: 'Confirm your plan — agency signup',
    description: 'Confirm your buy-in and capacity tier, then create your white-label agency workspace on Finely OS.',
    path: '/agency/signup',
  });

  const tierId = (sp.get('tier') || '').trim();
  const tier = useMemo(() => (tierId ? getAgencyTierById(tierId) ?? null : null), [tierId]);

  const email = useMemo(() => normalizeEmail(auth.user), [auth.user]);

  const [agencyName, setAgencyName] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<'success' | 'error'>('success');
  const [busy, setBusy] = useState(false);

  const publicTiers = useMemo(
    () => agencyTiers.filter((t) => t.isPublic).slice().sort((a, b) => a.sortOrder - b.sortOrder),
    [],
  );

  const buyInTiers = useMemo(() => getPublicAgencyBuyInTiers(), []);
  const recommendedBuyIn = useMemo(() => {
    const id = recommendedAgencyBuyInIdForTier(tier?.id ?? null);
    return buyInTiers.find((b) => b.id === id) ?? buyInTiers[0] ?? null;
  }, [tier?.id, buyInTiers]);

  const planBullets = useMemo(() => getAgencyPlanBullets(tier), [tier]);

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
      setNoticeTone('error');
      setNotice('Please sign in or create a Finely account first.');
      return;
    }
    if (!email) {
      setNoticeTone('error');
      setNotice('Email missing on session. Please re-authenticate.');
      return;
    }
    const name = agencyName.trim();
    if (name.length < 3) {
      setNoticeTone('error');
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

      setNoticeTone('success');
      setNotice(`Workspace created: ${tenant.name}`);
      window.setTimeout(() => navigate('/admin/access'), 450);
    } catch (e: any) {
      setNoticeTone('error');
      setNotice(e?.message || 'Could not create agency workspace. Please try again.');
      setBusy(false);
    }
  };

  return (
    <PageShell
      badge="Agency"
      title="Confirm your plan"
      subtitle="You already picked a buy-in and tier — confirm it below, then name your workspace."
      hideHero
    >
      <div className={`${FINELY_OS_PAGE} max-w-4xl mx-auto pb-20`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" onClick={() => navigate(-1)} className={FINELY_OS_BACK_LINK}>
              <ArrowLeft size={16} /> Back
            </button>
            <a href="/" className={FINELY_OS_BACK_LINK}>
              <ArrowLeft size={16} /> Home
            </a>
          </div>
        </div>

        <CareersQuickNav active="agency_partners" />

        {notice ? (
          <div
            className={`rounded-xl border-2 p-4 text-sm flex items-start gap-3 ${
              noticeTone === 'success' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-rose-200 bg-rose-50 text-rose-800'
            }`}
          >
            {noticeTone === 'success' ? <BadgeCheck size={16} className="mt-0.5 shrink-0" /> : <ShieldAlert size={16} className="mt-0.5 shrink-0" />}
            <span>{notice}</span>
          </div>
        ) : null}

        {/* Confirm-tier card — this is a confirmation of the choice made on the previous page, not a new decision */}
        <section className="rounded-3xl border-2 border-amber-200 bg-white p-6 sm:p-8 space-y-5">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-amber-700">Your plan</p>

          {tier && recommendedBuyIn ? (
            <>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">{recommendedBuyIn.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{recommendedBuyIn.tagline}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-3xl font-black text-amber-700">{recommendedBuyIn.priceLabel}</p>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">one-time buy-in</p>
                </div>
              </div>

              <ul className="grid gap-2 sm:grid-cols-2">
                {planBullets.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-sm leading-relaxed text-slate-600">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-600" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>

              {tier.splitBreakdown?.length ? (
                <AgencySplitBreakdown tier={tier} variant="compact" theme="light" className="pt-1" />
              ) : null}

              <button
                type="button"
                onClick={() => navigate(AGENCY.publicPath)}
                className="text-sm font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-slate-800"
              >
                Change plan
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                No plan selected yet. Head back to the program overview to pick a buy-in — capacity, seats, and
                white-label depth all activate together.
              </p>
              <button type="button" onClick={() => navigate(AGENCY.publicPath)} className={careerSolidBtn('gold')}>
                Pick a plan <ArrowRight size={15} />
              </button>
            </div>
          )}
        </section>

        {/* Workspace details — short, choice-first form */}
        <section className="rounded-3xl border-2 border-slate-200 bg-white p-6 sm:p-8 space-y-5">
          <div className="inline-flex items-center gap-2">
            <Building2 size={18} className={careerAccentText('navy')} />
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Create your workspace</p>
          </div>

          <div>
            <label className={FORM_LABEL}>Agency name</label>
            <input
              value={agencyName}
              onChange={(e) => setAgencyName(e.target.value)}
              placeholder="Acme Credit Solutions"
              className={FORM_INPUT}
            />
            <p className="mt-1.5 text-xs text-slate-500">
              This becomes your tenant name + default brand name. You can customize it later in Tenants.
            </p>
          </div>

          <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            {auth.user?.id ? (
              <>
                Signed in as <span className="font-mono font-semibold text-slate-900">{email || '—'}</span>. After
                creation, you’ll be routed to <span className="font-mono">/admin/access</span> to verify tenant + permissions.
              </>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>Requires a Finely account. Sign in or create one to provision your tenant.</span>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-slate-400"
                >
                  <LogIn size={14} /> Sign in
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={submit}
            className={`w-full sm:w-auto ${careerSolidBtn('gold', 'h-12 py-0 disabled:opacity-60 disabled:cursor-not-allowed')}`}
          >
            {busy ? 'Creating…' : 'Create workspace'} <ArrowRight size={16} />
          </button>
        </section>

        {/* Compact tier browser — switch plans without leaving the confirm flow */}
        <section className="rounded-3xl border-2 border-slate-200 bg-slate-50 p-6 sm:p-8 space-y-4">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-slate-500">Other capacity tiers</p>
          <FinelyOsPaginatedStack
            items={publicTiers}
            pageSize={6}
            itemSpacingClassName="grid grid-cols-1 sm:grid-cols-2 gap-3"
            renderItem={(t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => navigate(`/agency/signup?tier=${encodeURIComponent(t.id)}`)}
                className={`text-left w-full rounded-xl border-2 p-4 transition-all ${
                  tier?.id === t.id ? 'border-amber-400 bg-amber-50 ring-2 ring-amber-100' : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-slate-900">{t.name}</div>
                    <div className="truncate text-xs text-slate-500">{t.description}</div>
                  </div>
                  {t.badge ? (
                    <span className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      {t.badge}
                    </span>
                  ) : null}
                </div>
              </button>
            )}
          />
        </section>

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
