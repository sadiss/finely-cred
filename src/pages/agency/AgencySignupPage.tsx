import React, { useMemo, useState } from 'react';
import { ArrowRight, Building2, CheckCircle2, Crown, Users } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { useAuth } from '../../auth/AuthProvider';
import { createTenant, createMembership } from '../../data/tenantsRepo';
import { setActiveTenantId } from '../../tenancy/activeTenant';
import { agencyTiers, getAgencyTierById, formatPrice } from '../../config/pricingCatalog';

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

export default function AgencySignupPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const [sp] = useSearchParams();

  const tierId = (sp.get('tier') || '').trim();
  const tier = useMemo(() => (tierId ? getAgencyTierById(tierId) ?? null : null), [tierId]);

  const email = useMemo(() => normalizeEmail(auth.user), [auth.user]);

  const [agencyName, setAgencyName] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const tierDefaults = useMemo(() => {
    const id = tier?.id || '';
    const isSolo = id === 'agency_solo';
    const isGrowth = id === 'agency_growth';
    const isPro = id === 'agency_pro';
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
      <div className="space-y-6">
        {notice ? (
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-emerald-100 text-sm">
            {notice}
          </div>
        ) : null}

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
            <div className="inline-flex items-center gap-2 text-amber-400">
              <Building2 size={18} />
              <span className="text-xs font-semibold uppercase tracking-wider">Workspace</span>
            </div>

            <div className="space-y-1">
              <label className="text-white/60 text-xs uppercase tracking-wider">Agency name</label>
              <input
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                placeholder="Acme Credit Solutions"
                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-black/30 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[rgba(var(--brand-primary-rgb),0.55)]"
              />
              <div className="text-white/40 text-xs">
                This becomes your tenant name + default brand name. You can customize it later in Tenants.
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 space-y-2">
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">Account</div>
              <div className="text-white/80 text-sm">
                Signed in as <span className="font-mono text-white/90">{email || '—'}</span>
              </div>
              <div className="text-white/50 text-xs">
                After creation, you’ll be routed to <span className="font-mono">/admin/access</span> to verify tenant + permissions.
              </div>
            </div>

            <button
              type="button"
              disabled={!canSubmit}
              onClick={submit}
              className={`inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                canSubmit ? 'bg-[color:var(--brand-primary)] text-black hover:brightness-110' : 'bg-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              {busy ? 'Creating…' : 'Create workspace'} <ArrowRight size={16} />
            </button>
          </div>

          <div className="lg:col-span-5 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <Crown size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Selected tier</span>
              </div>

              {tier ? (
                <div className="space-y-2">
                  <div className="text-white font-semibold">{tier.name}</div>
                  <div className="text-white/60 text-sm">{tier.description}</div>
                  <div className="text-white/80 text-sm">
                    {tier.monthlyPriceAmount === 0 ? 'Custom pricing' : `${formatPrice(tier.monthlyPriceAmount)}/month`}
                  </div>
                  <div className="text-white/50 text-xs">
                    Seats: {tier.seatLimit === -1 ? 'Unlimited' : tier.seatLimit} • Clients:{' '}
                    {tier.activeClientLimit === -1 ? 'Unlimited' : tier.activeClientLimit}
                  </div>
                </div>
              ) : (
                <div className="text-white/60 text-sm">
                  No tier selected. Go back to <span className="font-mono">/services?tab=agency</span> to pick a plan.
                </div>
              )}

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="inline-flex items-center gap-2 text-amber-300">
                  <Users size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">What’s next</span>
                </div>
                <ul className="mt-3 space-y-2 text-white/70 text-sm">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 text-emerald-400 shrink-0" />
                    <span>Set active tenant + verify capabilities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 text-emerald-400 shrink-0" />
                    <span>Configure branding + domain in Tenants</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 size={16} className="mt-0.5 text-emerald-400 shrink-0" />
                    <span>Add team seats + roles in Team</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-[10px] uppercase tracking-widest text-white/40 font-black">Available tiers</div>
              <div className="mt-3 grid grid-cols-1 gap-2">
                {agencyTiers
                  .filter((t) => t.isPublic)
                  .slice()
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => navigate(`/agency/signup?tier=${encodeURIComponent(t.id)}`)}
                      className={`text-left rounded-xl border px-4 py-3 transition-all ${
                        tier?.id === t.id ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/10 bg-black/30 hover:bg-white/[0.03]'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-white/90 font-semibold truncate">{t.name}</div>
                          <div className="text-white/50 text-xs truncate">{t.description}</div>
                        </div>
                        <div className="text-white/70 text-xs font-mono">
                          {t.monthlyPriceAmount === 0 ? 'Custom' : formatPrice(t.monthlyPriceAmount)}
                        </div>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

