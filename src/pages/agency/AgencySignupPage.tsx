import React, { useMemo, useState } from 'react';
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, LogIn, ShieldAlert } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { createTenant, createMembership } from '../../data/tenantsRepo';
import { setActiveTenantId } from '../../tenancy/activeTenant';
import { CareersQuickNav } from '../../components/careers/CareersQuickNav';
import { CareerPriceCardGrid, type CareerPriceCardOption } from '../../components/careers/CareerPriceCard';
import type { CareerAccent } from '../../components/careers/careerUi';
import { careerAccentText, careerSolidBtn } from '../../components/careers/careerUi';
import {
  AGENCY,
  agencyCapacityTierIdForBuyIn,
  getAgencyPlanBullets,
  getPublicAgencyBuyInTiers,
  recommendedAgencyBuyInIdForTier,
} from '../../config/agencyPartnersProgram';
import { getAgencyTierById } from '../../config/pricingCatalog';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
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
  'w-full rounded-xl border-2 border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100 transition-colors';

const BUY_IN_ACCENTS: CareerAccent[] = ['emerald', 'sky', 'rose', 'navy', 'emerald', 'sky'];

function agencySignupAuthUrl(tierId?: string): string {
  const next = tierId ? `/agency/signup?tier=${encodeURIComponent(tierId)}` : '/agency/signup';
  const qs = new URLSearchParams({ auth: 'signup', next });
  return `/signup?${qs.toString()}`;
}

export default function AgencySignupPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();

  usePublicSeoMeta({
    title: 'Create your agency workspace',
    description: 'Pick your buy-in, confirm the short summary, then name your white-label agency workspace on Finely OS.',
    path: '/agency/signup',
  });

  const buyInTiers = useMemo(() => getPublicAgencyBuyInTiers(), []);

  const tierFromUrl = (sp.get('tier') || '').trim();
  const initialBuyInId = useMemo(() => {
    if (!tierFromUrl) return buyInTiers[0]?.id ?? '';
    // Accept either capacity tier ids (agency_solo) or buy-in ids (agency_buyin_starter).
    if (buyInTiers.some((b) => b.id === tierFromUrl)) return tierFromUrl;
    return recommendedAgencyBuyInIdForTier(tierFromUrl) ?? buyInTiers[0]?.id ?? '';
  }, [tierFromUrl, buyInTiers]);

  const [selectedBuyInId, setSelectedBuyInId] = useState(initialBuyInId);
  const [agencyName, setAgencyName] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [noticeTone, setNoticeTone] = useState<'success' | 'error'>('success');
  const [busy, setBusy] = useState(false);

  const email = useMemo(() => normalizeEmail(auth.user), [auth.user]);

  const selectedBuyIn = buyInTiers.find((b) => b.id === selectedBuyInId) ?? buyInTiers[0] ?? null;
  const capacityTierId = selectedBuyIn
    ? agencyCapacityTierIdForBuyIn(selectedBuyIn.id) ?? selectedBuyIn.capacityTierId
    : tierFromUrl || '';
  const tier = useMemo(() => (capacityTierId ? getAgencyTierById(capacityTierId) ?? null : null), [capacityTierId]);
  const planBullets = useMemo(() => getAgencyPlanBullets(tier).slice(0, 4), [tier]);

  const selectBuyIn = (id: string) => {
    setSelectedBuyInId(id);
    const capacityId = agencyCapacityTierIdForBuyIn(id);
    const next = new URLSearchParams(sp);
    if (capacityId) next.set('tier', capacityId);
    else next.set('tier', id);
    setSp(next, { replace: true });
  };

  const planOptions: CareerPriceCardOption[] = buyInTiers.map((b, i) => {
    const capacity = getAgencyTierById(b.capacityTierId);
    return {
      id: b.id,
      name: b.name,
      tagline: b.tagline,
      badge: capacity?.badge,
      priceLabel: b.priceLabel,
      priceSubLabel: 'one-time buy-in',
      bullets: getAgencyPlanBullets(capacity),
      accent: BUY_IN_ACCENTS[i % BUY_IN_ACCENTS.length],
    };
  });

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

  const canSubmit = Boolean(auth.user?.id && email && agencyName.trim().length >= 3 && selectedBuyIn && !busy);

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
      window.setTimeout(() => navigate('/agency/hub'), 450);
    } catch (e: any) {
      setNoticeTone('error');
      setNotice(e?.message || 'Could not create agency workspace. Please try again.');
      setBusy(false);
    }
  };

  return (
    <PageShell
      badge="Agency"
      title="Create your agency workspace"
      subtitle="Pick your buy-in once, confirm the short summary, then name the tenant."
      hideHero
    >
      <div className={`${FINELY_OS_PAGE} max-w-5xl mx-auto pb-20`}>
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

        {/* One colorful buy-in chooser — no full includes re-list */}
        <section className="rounded-3xl border-2 border-slate-200 bg-slate-50 p-6 sm:p-8 space-y-5">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-emerald-700">Your plan</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">Pick your buy-in</h2>
            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              One-time buy-in activates the matching capacity tier. Change it here anytime before you create the workspace.
            </p>
          </div>
          <CareerPriceCardGrid
            options={planOptions}
            selectedId={selectedBuyInId}
            onSelect={selectBuyIn}
            columns={3}
          />
        </section>

        {/* Short summary only */}
        {selectedBuyIn && tier ? (
          <section className="rounded-3xl border-2 border-emerald-200 bg-white p-5 sm:p-6 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-emerald-700">Summary</p>
                <h3 className="mt-1 text-xl font-bold text-slate-900">
                  {selectedBuyIn.name} · {tier.name}
                </h3>
                <p className="mt-0.5 text-sm text-slate-500">{selectedBuyIn.tagline}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-2xl font-black text-emerald-700">{selectedBuyIn.priceLabel}</p>
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">one-time</p>
              </div>
            </div>
            <ul className="flex flex-wrap gap-2">
              {planBullets.map((b) => (
                <li
                  key={b}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                >
                  {b}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => navigate(AGENCY.publicPath)}
              className="text-sm font-semibold text-slate-500 underline decoration-slate-300 underline-offset-4 hover:text-slate-800"
            >
              Compare on program page
            </button>
          </section>
        ) : null}

        {/* Workspace details */}
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
                <span>Requires a Finely account. Sign in or create one — your buy-in stays on the return URL.</span>
                <button
                  type="button"
                  onClick={() => navigate(agencySignupAuthUrl(capacityTierId || undefined))}
                  className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:border-slate-400"
                >
                  <LogIn size={14} /> Sign in / create account
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            disabled={!canSubmit}
            onClick={submit}
            className={`w-full sm:w-auto ${careerSolidBtn('emerald', 'h-12 py-0 disabled:opacity-60 disabled:cursor-not-allowed')}`}
          >
            {busy ? 'Creating…' : 'Create workspace'} <ArrowRight size={16} />
          </button>
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
