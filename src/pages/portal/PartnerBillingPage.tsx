import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CreditCard, Shield, BadgeCheck, Clock, CheckCircle2, ArrowRight, Star, ExternalLink, Building2 } from 'lucide-react';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { useLocation, useNavigate } from 'react-router-dom';
import { getOrCreatePartnerForSession } from '../../portal/getOrCreatePartnerForSession';
import { upsertPartner } from '../../data/partnersRepo';
import { ENTITLEMENT_KEYS, ensurePartnerEntitlements, type EntitlementKey } from '../../billing/entitlements';
import { getFeatureFlags } from '../../data/settingsRepo';
import {
  createBillingAccount,
  getBillingAccountForPartner,
  getAgreement,
  addAgreementEvent,
  listAgreementsByPartner,
  listEntitlementsByPartner,
  patchAgreement,
  updateAgreementStatus,
  grantEntitlementsFromPackage,
} from '../../data/billingRepo';
import { verifyStripeCheckoutSession } from '../../lib/stripeCheckoutClient';
import { pullBillingSnapshotFromSupabase } from '../../data/billingSupabaseSync';
import { isAdminEmail } from '../../auth/admin';
import { listCustomFieldDefinitionsByScope } from '../../data/customFieldsRepo';
import { getFieldLayout } from '../../data/fieldLayoutsRepo';
import { getCustomFieldValues, upsertCustomFieldValues } from '../../data/customFieldValuesRepo';
import { FieldLayoutRenderer } from '../../components/fields/FieldLayoutRenderer';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { getPackageById, getPackagesByCategory, formatPrice, type PricingCategory, type PricingPackage } from '../../config/pricingCatalog';

export default function PartnerBillingPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const email = auth.user?.email || '';
  const partner = useMemo(() => getOrCreatePartnerForSession({ user: auth.user }), [auth.user]);
  const [refreshKey, setRefreshKey] = useState(0);
  const [storeVersion, setStoreVersion] = useState(0);
  const [notice, setNotice] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [stripeHandled, setStripeHandled] = useState(false);
  const [phoneDraft, setPhoneDraft] = useState('');
  const features = useMemo(() => getFeatureFlags(), []);
  const isAdmin = useMemo(() => (email ? isAdminEmail(String(email)) : false), [email]);
  const allPortalEntitlementKeys = useMemo(() => Object.values(ENTITLEMENT_KEYS) as EntitlementKey[], []);

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    setPhoneDraft(partner?.profile.phone ?? '');
  }, [partner?.id]);

  const billingAccount = useMemo(() => {
    if (!partner) return null;
    return getBillingAccountForPartner(partner.id) ?? createBillingAccount(partner.id);
  }, [partner]);

  const tenantId = (partner?.tenantId || '').trim() || FINELY_TENANT_ID;
  const partnerFieldDefs = useMemo(() => listCustomFieldDefinitionsByScope('partners', tenantId), [tenantId, storeVersion]);
  const partnerFieldLayout = useMemo(() => getFieldLayout({ tenantId, scope: 'partners' }), [tenantId, storeVersion]);
  const partnerValuesRecord = useMemo(
    () => (partner ? getCustomFieldValues('partners', partner.id, tenantId) : null),
    [partner?.id, tenantId, storeVersion],
  );
  const [partnerValues, setPartnerValues] = useState<Record<string, any>>(partnerValuesRecord?.values ?? {});

  useEffect(() => {
    setPartnerValues(partnerValuesRecord?.values ?? {});
  }, [partnerValuesRecord?.updatedAt, partner?.id]);

  useEffect(() => {
    if (!auth.user || !partner) return;
    if (stripeHandled) return;

    let stripe: string | null = null;
    let sessionId: string | null = null;
    let agreementId: string | null = null;
    try {
      const sp = new URLSearchParams(location.search);
      stripe = sp.get('stripe');
      sessionId = sp.get('session_id');
      agreementId = sp.get('agreementId');
    } catch {
      stripe = null;
      sessionId = null;
      agreementId = null;
    }

    if (!stripe) return;

    // Cancel: just show message and clean URL.
    if (stripe === 'cancel') {
      setStripeHandled(true);
      setNotice('Checkout cancelled. If you had questions, book a free enlightenment session and we’ll match the safest plan.');
      navigate('/portal/billing', { replace: true });
      return;
    }

    // Success: verify with Stripe, then activate local agreement + grant entitlements.
    if (stripe === 'success' && sessionId && agreementId) {
      setStripeHandled(true);
      (async () => {
        try {
          const verified = await verifyStripeCheckoutSession({ sessionId, agreementId });
          if (!verified.paid) {
            setNotice('Payment is still processing. Refresh in a moment or contact support if it persists.');
            navigate('/portal/billing', { replace: true });
            return;
          }
          // Production flow: webhook activates agreement + grants entitlements server-side.
          // We immediately refresh the local billing cache from Supabase so gating unlocks across the app.
          setNotice('Payment verified. Activating your plan… (may take a few seconds)');
          try {
            await pullBillingSnapshotFromSupabase({ partnerId: partner.id });
          } catch {
            // ignore
          }
          setNotice('Payment verified. Your plan is now active and your portal modules are unlocked.');
          setRefreshKey((k) => k + 1);
        } catch (e: any) {
          setNotice(e?.message || 'Could not verify payment. Please contact support.');
        } finally {
          navigate('/portal/billing', { replace: true });
        }
      })();
    }
  }, [auth.user, location.search, navigate, partner, stripeHandled]);

  const agreements = useMemo(
    () => (partner ? listAgreementsByPartner(partner.id) : []),
    [partner, refreshKey],
  );
  const entitlements = useMemo(
    () => (partner ? listEntitlementsByPartner(partner.id) : []),
    [partner, refreshKey],
  );
  const activeEntitlementKeys = useMemo(
    () => new Set(entitlements.filter((e) => e.status === 'active').map((e) => e.key)),
    [entitlements],
  );
  const trial = useMemo(() => {
    const now = new Date().toISOString();
    const activeTrial = entitlements
      .filter((e) => e.status === 'active')
      .filter((e) => e.sourceAgreementId === 'trial_30d')
      .filter((e) => !e.endsAt || e.endsAt > now);
    const endsAt = activeTrial.map((e) => e.endsAt).filter(Boolean).sort().at(-1) ?? null;
    return {
      isActive: activeTrial.length > 0,
      endsAt,
      keys: Array.from(new Set(activeTrial.map((e) => e.key))).sort(),
    };
  }, [entitlements]);
  const entitlementLabel = useMemo(() => {
    const m: Record<string, string> = {
      [ENTITLEMENT_KEYS.reports]: 'Credit reports',
      [ENTITLEMENT_KEYS.documents]: 'Documents vault',
      [ENTITLEMENT_KEYS.messages]: 'Messages & support',
      [ENTITLEMENT_KEYS.tasks]: 'Tasks & notifications',
      [ENTITLEMENT_KEYS.disputes]: 'Dispute center',
      [ENTITLEMENT_KEYS.letters]: 'Letters (studio + vault)',
      [ENTITLEMENT_KEYS.debt]: 'Debt & summons',
      [ENTITLEMENT_KEYS.escalations]: 'Complaints & escalations',
      [ENTITLEMENT_KEYS.identityTheft]: 'Identity theft center',
      [ENTITLEMENT_KEYS.businessBuild]: 'Credit building center',
      [ENTITLEMENT_KEYS.packBankruptcy]: 'Letter Pack: Bankruptcy',
      [ENTITLEMENT_KEYS.packRepossession]: 'Letter Pack: Repossession',
      [ENTITLEMENT_KEYS.packForeclosure]: 'Letter Pack: Foreclosure',
      [ENTITLEMENT_KEYS.packStudentLoans]: 'Letter Pack: Student loans',
      [ENTITLEMENT_KEYS.packInquiries]: 'Letter Pack: Inquiries',
    };
    return (key: string) => m[key] ?? key;
  }, []);

  const recommendedCategory = useMemo<PricingCategory>(() => {
    const lane = String((partner as any)?.lane || '').trim();
    const route = String(partner?.primaryRoute || '').trim();
    const intake = partner?.primaryRoute ? (partner?.routes as any)?.[partner.primaryRoute] : null;
    const goal = String(intake?.goal || '').trim();
    if (lane === 'business_credit' || route === 'business_build' || goal === 'business') return 'business_credit';
    if (lane === 'debt_kill' || goal === 'debt') return 'debt_legal';
    return 'personal_credit';
  }, [partner]);

  const planCategories: Array<{ id: PricingCategory; label: string; hint: string }> = useMemo(
    () => [
      { id: 'personal_credit', label: 'Personal', hint: 'Free/Core/Restore + letter packs' },
      { id: 'business_credit', label: 'Business', hint: 'Fundability + vendor sequencing' },
      { id: 'debt_legal', label: 'Debt & Legal', hint: 'DV, court answers, summons workflow' },
    ],
    [],
  );

  const [planCategory, setPlanCategory] = useState<PricingCategory>(recommendedCategory);

  useEffect(() => {
    setPlanCategory(recommendedCategory);
  }, [recommendedCategory]);

  const packagesByCategory = useMemo(() => {
    const list = getPackagesByCategory(planCategory).filter((p) => p.isPublic);
    return list.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [planCategory, refreshKey]);

  return (
    <PageShell
      badge="Partner Portal"
      title="Profile & Billing"
      subtitle="Account profile, billing, and compliance settings. Payments are processed via Stripe or in‑house financing depending on your plan."
    >
      {!partner ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60">
            No partner profile found for this account. If you're an admin, use Partner Management to pick a partner.
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
          >
            <ArrowLeft size={14} /> Back to Dashboard
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {notice && (
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100 flex items-center gap-3">
              <CheckCircle2 size={18} />
              {notice}
            </div>
          )}

          {trial.isActive && (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-white/80">
              <div className="flex items-start gap-3">
                <Clock size={18} className="text-emerald-200 mt-0.5" />
                <div className="space-y-2">
                  <div className="text-white font-semibold">30‑day free trial is active</div>
                  <div className="text-white/70 text-sm">
                    Access is scoped to your onboarding lane. {trial.endsAt ? `Trial ends ${new Date(trial.endsAt).toLocaleDateString()}.` : ''}
                  </div>
                  {trial.keys.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {trial.keys.slice(0, 10).map((k) => (
                        <span key={k} className="px-2.5 py-1 rounded-full border border-emerald-500/25 bg-black/20 text-[10px] font-black uppercase tracking-widest text-emerald-100">
                          {entitlementLabel(k)}
                        </span>
                      ))}
                      {trial.keys.length > 10 && (
                        <span className="px-2.5 py-1 rounded-full border border-white/10 bg-black/20 text-[10px] font-black uppercase tracking-widest text-white/60">
                          +{trial.keys.length - 10} more
                        </span>
                      )}
                    </div>
                  )}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => navigate('/portal/checkout')}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                    >
                      Upgrade plan <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              onClick={() => navigate('/portal/dashboard')}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
              title="Back to Partner Dashboard"
            >
              <ArrowLeft size={16} /> Partner Dashboard
            </button>
            <button
              onClick={() => {
                const el = document.getElementById('plans-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all"
            >
              New plan <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-3">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <Shield size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Profile</span>
              </div>
              <div className="text-white/70 text-sm">
                <div className="text-white font-semibold">{partner.profile.fullName}</div>
                <div className="mt-1 text-white/60">{partner.profile.email || email || '—'}</div>
                <div className="mt-4 grid md:grid-cols-3 gap-3 items-end">
                  <div className="md:col-span-2">
                    <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Phone</label>
                    <input
                      value={phoneDraft}
                      onChange={(e) => setPhoneDraft(e.target.value)}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="(555) 555-5555"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const nextPhone = phoneDraft.trim() || undefined;
                      upsertPartner({ ...partner, profile: { ...partner.profile, phone: nextPhone } });
                      setNotice('Profile updated.');
                      setTimeout(() => setNotice(null), 2500);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                  >
                    Save
                  </button>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/30 p-4 text-white/60 text-sm">
                Keep your contact information current so we can support your workflow, deadlines, and document requests.
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-3">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <CreditCard size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Billing</span>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-white/60 text-sm space-y-2">
                <div className="text-white/80 font-semibold">Billing account</div>
                <div className="text-[10px] uppercase tracking-widest text-white/40">status</div>
                <div className="text-white/70">{billingAccount?.status ?? 'not created'}</div>
                <div className="text-[10px] uppercase tracking-widest text-white/40 mt-3">rails</div>
                <div className="text-white/60">Stripe (short-term plans) · In-house financing (12–36 months)</div>
              </div>

              {partner.denefits?.contractUrl ? (
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-white/80 text-sm space-y-2">
                  <div className="inline-flex items-center gap-2 text-emerald-200">
                    <Building2 size={18} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Assigned in‑house financing contract</span>
                  </div>
                  <div className="text-white/70">
                    {partner.denefits.label ? <span className="text-white/90 font-semibold">{partner.denefits.label}</span> : 'A contract has been assigned to your account.'}
                  </div>
                  {!features.denefitsEnabled ? (
                    <div className="text-white/60 text-xs">
                      Note: In-house financing is currently disabled in platform settings, but your contract link is still available.
                    </div>
                  ) : null}
                  <a
                    href={partner.denefits.contractUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                  >
                    Open contract <ExternalLink size={14} />
                  </a>
                  {partner.denefits.assignedAt ? (
                    <div className="text-white/50 text-xs font-mono">Assigned: {new Date(partner.denefits.assignedAt).toLocaleString()}</div>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          {partnerFieldDefs.length ? (
            <details className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
              <summary className="cursor-pointer select-none text-white font-semibold">
                Enterprise profile fields <span className="text-white/40 font-normal">(advanced)</span>
              </summary>
              <div className="mt-3 text-white/60 text-sm">
                Optional fields for letter-ready identity/address data, monitoring credentials, and underwriting readiness. Saved to your profile.
              </div>
              <div className="mt-5">
                <FieldLayoutRenderer
                  layout={partnerFieldLayout}
                  definitions={partnerFieldDefs}
                  values={partnerValues}
                  onChangeValue={(key, next, persist) => {
                    if (!partner) return;
                    setPartnerValues((prev) => {
                      const merged = { ...(prev || {}), [key]: next };
                      if (persist) upsertCustomFieldValues('partners', partner.id, merged, tenantId);
                      return merged;
                    });
                  }}
                />
              </div>
            </details>
          ) : null}

          <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <BadgeCheck size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Active agreements</span>
              </div>
              {agreements.length === 0 ? (
                <div className="text-white/60 text-sm">
                  No agreements yet. Select a plan below to create a draft (Stripe) or pending review (in-house financing).
                </div>
              ) : (
                <div className="space-y-3">
                  {agreements.map((agreement) => {
                    const pkg = getPackageById(agreement.packageId);
                    const title = pkg?.name ?? agreement.packageId;
                    const priceLine = pkg
                      ? `${formatPrice(pkg.priceAmount)}${pkg.interval === 'month' ? ' / month' : ''}${pkg.termMonths ? ` • ${pkg.termMonths} mo` : ''}`
                      : `${(agreement.amountCents / 100).toLocaleString()} cents`;
                    return (
                      <div key={agreement.id} className="rounded-xl border border-white/10 bg-black/30 p-4 space-y-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-white font-semibold">{title}</div>
                          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                            {agreement.rail === 'stripe' ? 'Stripe' : 'In-house'}
                          </div>
                        </div>
                        <div className="text-white/60 text-sm">
                          {priceLine}
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          status: {agreement.status}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => navigate(`/portal/checkout?package=${encodeURIComponent(agreement.packageId)}`)}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                          >
                            View in checkout <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <CheckCircle2 size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Entitlements</span>
              </div>
              {entitlements.length === 0 ? (
                <div className="text-white/60 text-sm">
                  Entitlements will unlock after agreements activate and webhooks confirm payment.
                  {isAdmin ? (
                    <div className="mt-4">
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                        onClick={() => {
                          if (!partner) return;
                          ensurePartnerEntitlements({ partnerId: partner.id, keys: allPortalEntitlementKeys, sourceAgreementId: 'admin_demo_unlock' });
                          setNotice('Admin demo: portal modules unlocked for this partner on this device.');
                          setRefreshKey((k) => k + 1);
                        }}
                        title="Admin-only dev shortcut: unlock all portal modules locally"
                      >
                        Admin demo: unlock all modules <ArrowRight size={14} />
                      </button>
                      <div className="mt-2 text-[11px] text-white/40">
                        This is a local/dev unlock (no Stripe, no API usage).
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : (
                <div className="space-y-2">
                  {entitlements.map((entitlement) => (
                    <div key={entitlement.id} className="rounded-xl border border-white/10 bg-white/[0.02] p-3 text-sm text-white/70">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-white/85 font-semibold truncate">{entitlementLabel(entitlement.key)}</div>
                          <div className="mt-1 text-[10px] uppercase tracking-widest font-mono text-white/40 truncate">
                            {entitlement.key}
                          </div>
                          {entitlement.endsAt && (
                            <div className="mt-1 text-[10px] uppercase tracking-widest font-mono text-white/35 truncate">
                              ends: {new Date(entitlement.endsAt).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-white/60">{entitlement.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <BadgeCheck size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Module access</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const el = document.getElementById('plans-section');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all"
              >
                Unlock modules <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  key: ENTITLEMENT_KEYS.reports,
                  title: 'Credit reports',
                  desc: 'Upload + parse reports and view dispute candidates with insights.',
                  href: '/portal/reports',
                },
                {
                  key: ENTITLEMENT_KEYS.disputes,
                  title: 'Dispute center',
                  desc: 'Create disputes, track rounds, and generate letters.',
                  href: '/portal/disputes',
                },
                {
                  key: ENTITLEMENT_KEYS.letters,
                  title: 'Letters studio',
                  desc: 'Generate letters (dispute + debt), save PDFs to your Letters Vault.',
                  href: '/portal/letters',
                },
                {
                  key: ENTITLEMENT_KEYS.documents,
                  title: 'Documents vault',
                  desc: 'Store and retrieve documents and evidence files.',
                  href: '/portal/documents',
                },
                {
                  key: ENTITLEMENT_KEYS.debt,
                  title: 'Debt & summons',
                  desc: 'Track debt items, deadlines, and supporting documents.',
                  href: '/portal/debt',
                },
              ].map((m) => {
                const active = activeEntitlementKeys.has(m.key);
                return (
                  <div
                    key={m.key}
                    className={`rounded-2xl border p-5 space-y-3 ${
                      active ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-black/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-white font-semibold">{m.title}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest font-mono text-white/40">{m.key}</div>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                          active
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                        }`}
                      >
                        {active ? 'Unlocked' : 'Locked'}
                      </div>
                    </div>
                    <div className="text-white/60 text-sm">{m.desc}</div>
                    <button
                      type="button"
                      disabled={!active}
                      onClick={() => navigate(m.href)}
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        active
                          ? 'bg-amber-500 text-black hover:brightness-110'
                          : 'border border-white/10 bg-white/[0.02] text-white/35 cursor-not-allowed'
                      }`}
                    >
                      Open <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              {[
                {
                  key: ENTITLEMENT_KEYS.messages,
                  title: 'Messages & support',
                  desc: 'In-app support, updates, and case communications.',
                  href: '/portal/messages',
                },
                {
                  key: ENTITLEMENT_KEYS.escalations,
                  title: 'Complaints & escalations',
                  desc: 'Manage complaints, regulators, and escalation timelines.',
                  href: '/portal/escalations',
                },
                {
                  key: ENTITLEMENT_KEYS.identityTheft,
                  title: 'Identity theft center',
                  desc: 'Identity theft workflow, affidavits, and supporting evidence.',
                  href: '/portal/identity-theft',
                },
                {
                  key: ENTITLEMENT_KEYS.tasks,
                  title: 'Tasks & notifications',
                  desc: 'Deadlines, action items, and status nudges in one place.',
                  href: '/portal/tasks',
                },
                {
                  key: ENTITLEMENT_KEYS.businessBuild,
                  title: 'Credit building center',
                  desc: 'Vendor sequencing + building workflow (business build).',
                  href: '/portal/build',
                },
              ].map((m) => {
                const active = activeEntitlementKeys.has(m.key);
                return (
                  <div
                    key={m.key}
                    className={`rounded-2xl border p-5 space-y-3 ${
                      active ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/10 bg-black/30'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-white font-semibold">{m.title}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest font-mono text-white/40">{m.key}</div>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${
                          active
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                            : 'border-amber-500/30 bg-amber-500/10 text-amber-200'
                        }`}
                      >
                        {active ? 'Unlocked' : 'Locked'}
                      </div>
                    </div>
                    <div className="text-white/60 text-sm">{m.desc}</div>
                    <button
                      type="button"
                      disabled={!active}
                      onClick={() => navigate(m.href)}
                      className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        active
                          ? 'bg-amber-500 text-black hover:brightness-110'
                          : 'border border-white/10 bg-white/[0.02] text-white/35 cursor-not-allowed'
                      }`}
                    >
                      Open <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <Shield size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Compliance & consent</span>
            </div>
            <p className="text-white/60 text-sm">
              These acknowledgements help keep your file processing consistent across bureaus and support workflows.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                {
                  key: 'termsAcceptedAt' as const,
                  label: 'I agree to the Terms',
                  href: '/terms',
                },
                {
                  key: 'privacyAcceptedAt' as const,
                  label: 'I agree to the Privacy Policy',
                  href: '/privacy',
                },
                {
                  key: 'disclaimerAcceptedAt' as const,
                  label: 'I acknowledge the Disclaimer',
                  href: '/disclaimer',
                },
                {
                  key: 'communicationConsentAt' as const,
                  label: 'I consent to communication regarding my case (email/in-app)',
                  href: '/portal/messages',
                },
              ].map((x) => {
                const acceptedAt = (partner.consents as any)?.[x.key] as string | undefined;
                return (
                  <div key={x.key} className="rounded-2xl border border-white/10 bg-black/30 p-5 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(acceptedAt)}
                        onChange={(e) => {
                          const now = new Date().toISOString();
                          const next = {
                            ...partner,
                            consents: {
                              ...(partner.consents ?? {}),
                              [x.key]: e.target.checked ? now : undefined,
                            } as any,
                          };
                          upsertPartner(next);
                          setRefreshKey((k) => k + 1);
                        }}
                        className="mt-1"
                      />
                      <div className="min-w-0">
                        <div className="text-white/85 font-semibold text-sm">{x.label}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                          {acceptedAt ? `accepted ${new Date(acceptedAt).toLocaleString()}` : 'not accepted'}
                        </div>
                      </div>
                    </label>
                    <button
                      type="button"
                      onClick={() => navigate(x.href)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                    >
                      Open <ArrowRight size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div id="plans-section" className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-6">
            <div className="flex items-center gap-2 text-amber-400">
              <Clock size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Plans (hybrid)</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/30 p-1">
                {planCategories.map((c) => {
                  const active = c.id === planCategory;
                  const rec = c.id === recommendedCategory;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setPlanCategory(c.id)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        active ? 'bg-amber-500 text-black' : 'text-white/70 hover:text-white hover:bg-white/5'
                      }`}
                      title={c.hint}
                    >
                      {c.label}
                      {rec ? <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-black tracking-widest">★</span> : null}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => navigate('/portal/checkout')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all"
                title="Open full checkout catalog"
              >
                Open checkout <ArrowRight size={14} />
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packagesByCategory.slice(0, 9).map((pkg) => {
                const isRecommended = pkg.category === recommendedCategory && (pkg.badge === 'Most Popular' || pkg.id.endsWith('_core') || pkg.id === 'personal_free');
                const priceLine =
                  pkg.priceAmount <= 0
                    ? 'Free'
                    : `${formatPrice(pkg.priceAmount)}${pkg.interval === 'month' ? ' / month' : ''}${pkg.termMonths ? ` • ${pkg.termMonths} mo` : ''}`;
                const rails =
                  pkg.rail === 'both' ? 'Stripe + in-house' : pkg.rail === 'stripe' ? 'Stripe' : pkg.rail === 'in_house' ? 'In-house' : String(pkg.rail);
                return (
                  <div
                    key={pkg.id}
                    className={`relative rounded-2xl border bg-black/30 p-5 space-y-3 transition-all ${
                      isRecommended ? 'border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.08)]' : 'border-white/10'
                    }`}
                  >
                    {isRecommended ? (
                      <div className="absolute -top-3 left-4 px-3 py-1 bg-amber-500 text-black text-[10px] font-bold uppercase tracking-widest rounded-full flex items-center gap-1 shadow-lg shadow-amber-900/40">
                        <Star size={10} fill="currentColor" /> Recommended
                      </div>
                    ) : null}
                    <div className="pt-2">
                      <div className="text-white font-semibold">{pkg.name}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                        {pkg.delivery} • {rails}
                        {pkg.badge ? ` • ${pkg.badge}` : ''}
                      </div>
                    </div>
                    <div className="text-amber-300 text-lg font-semibold">{priceLine}</div>
                    <div className="text-white/60 text-sm line-clamp-3">{pkg.description}</div>

                    <div className="pt-1 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/portal/checkout?package=${encodeURIComponent(pkg.id)}`)}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                      >
                        Select <ArrowRight size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/pricing')}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                      >
                        Compare <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {packagesByCategory.length > 9 ? (
              <details className="rounded-2xl border border-white/10 bg-black/20 p-5">
                <summary className="cursor-pointer select-none text-white/70 font-semibold">
                  Show more ({packagesByCategory.length - 9})
                </summary>
                <div className="mt-4 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {packagesByCategory.slice(9, 21).map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => navigate(`/portal/checkout?package=${encodeURIComponent(pkg.id)}`)}
                      className="text-left rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all p-5"
                      title="Open in checkout"
                    >
                      <div className="text-white font-semibold">{pkg.name}</div>
                      <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono">
                        {pkg.delivery} • {pkg.rail}
                      </div>
                      <div className="mt-2 text-white/60 text-sm line-clamp-2">{pkg.tagline}</div>
                    </button>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        </div>
      )}
    </PageShell>
  );
}
