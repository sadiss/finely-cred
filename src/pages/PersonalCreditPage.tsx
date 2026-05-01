import React from 'react';
import { ArrowRight, Check, Shield, Sparkles, Star, Clock, Users, TrendingUp, CreditCard, UploadCloud, Gavel, FileText, ShieldCheck, Target } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { personalCreditPackages, formatPrice } from '../config/pricingCatalog';

const STATS = [
  { value: '700+', label: 'Average score increase goal' },
  { value: '45 days', label: 'First results timeline' },
  { value: '3 bureaus', label: 'Comprehensive coverage' },
  { value: '24/7', label: 'Platform access' },
];

const PROCESS_STEPS = [
  {
    step: 1,
    title: 'Credit Analysis',
    description: 'We analyze your credit reports from all three bureaus to identify every disputable item.',
  },
  {
    step: 2,
    title: 'Strategy Planning',
    description: 'Custom dispute strategy based on your unique situation, goals, and timeline.',
  },
  {
    step: 3,
    title: 'Dispute Execution',
    description: 'Professional dispute letters sent to bureaus and furnishers with proper documentation.',
  },
  {
    step: 4,
    title: 'Monitor & Adjust',
    description: 'Track responses, escalate when needed, and continue until maximum results achieved.',
  },
];

export default function PersonalCreditPage() {
  const navigate = useNavigate();

  const goToCheckout = (pkgId: string, rail?: 'stripe' | 'in_house') => {
    const next = `/portal/checkout?package=${encodeURIComponent(pkgId)}${rail ? `&rail=${encodeURIComponent(rail)}` : ''}`;
    const qs = new URLSearchParams();
    qs.set('package', pkgId);
    if (rail) qs.set('rail', rail);
    qs.set('next', next);
    navigate(`/onboarding?${qs.toString()}`);
  };

  // Get the flagship package for hero section
  const platinumPkg = personalCreditPackages.find((p) => p.id === 'personal_platinum');
  const restorePkg = personalCreditPackages.find((p) => p.id === 'personal_restore');
  const starterPkg = personalCreditPackages.find((p) => p.id === 'personal_starter');

  return (
    <PageShell
      badge="Personal Credit"
      title="Restore Your Credit. Reclaim Your Future."
      subtitle="Professional credit restoration with a proven system. We handle the disputes — you focus on your goals."
    >
      <div className="space-y-12">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-center"
            >
              <div className="text-2xl md:text-3xl font-bold text-amber-400">{stat.value}</div>
              <div className="text-white/60 text-sm mt-1">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Hero Package - Platinum */}
        {platinumPkg && (
          <div className="relative rounded-3xl border-2 border-amber-500/50 bg-gradient-to-br from-amber-500/10 via-transparent to-amber-500/5 p-8 md:p-10 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="relative flex flex-col lg:flex-row gap-8">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/30">
                  <Star size={14} className="text-amber-400" />
                  <span className="text-amber-300 text-xs font-semibold uppercase tracking-wider">
                    Premium Experience
                  </span>
                </div>

                <h2 className="text-3xl md:text-4xl font-bold text-white">{platinumPkg.name}</h2>
                <p className="text-white/70 text-lg">{platinumPkg.description}</p>

                <ul className="space-y-3">
                  {platinumPkg.highlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-3 text-white/90">
                      <div className="mt-1 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Check size={12} className="text-emerald-400" />
                      </div>
                      <span>{h}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="lg:w-80 flex flex-col items-center justify-center">
                <div className="text-center space-y-4">
                  <div>
                    <div className="text-5xl font-bold text-white">{formatPrice(platinumPkg.priceAmount)}</div>
                    <div className="text-white/50 mt-1">One-time investment</div>
                  </div>

                  <div className="space-y-2">
                    <button
                      onClick={() => goToCheckout(platinumPkg.id, 'stripe')}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-xs hover:brightness-110 transition-all"
                    >
                      Get started <ArrowRight size={16} />
                    </button>
                    <button
                      onClick={() => goToCheckout(platinumPkg.id, 'in_house')}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-emerald-500/50 text-emerald-400 font-semibold text-sm hover:bg-emerald-500/10 transition-all"
                    >
                      <Sparkles size={14} />
                      Finance & build credit
                    </button>
                  </div>

                  <p className="text-emerald-400/70 text-xs">
                    Financing reports to Equifax as positive tradeline
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Choose your card (matches homepage hero credit cards) */}
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-2xl font-bold text-white">Choose Your Card</h2>
              <p className="text-white/60 text-sm mt-1">
                Same program — different depth. Pick the lane that matches your timeline and complexity.
              </p>
            </div>
            <button
              onClick={() => navigate('/pricing')}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 transition-all text-sm"
            >
              View full pricing <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {starterPkg && (
              <div
                className="rounded-2xl border border-white/10 p-6 space-y-4"
                style={{
                  backgroundImage: [
                    'linear-gradient(145deg, rgba(245,158,11,0.14) 0%, rgba(0,0,0,0.38) 40%, rgba(0,0,0,0.42) 100%)',
                    'radial-gradient(260px 180px at 72% 18%, rgba(255,255,255,0.14), transparent 62%)',
                    'repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 1px, transparent 1px 28px)',
                  ].join(', '),
                  boxShadow: '0 24px 70px -36px rgba(0,0,0,0.80), inset 0 1px 0 rgba(255,255,255,0.10)',
                }}
              >
                <div className="space-y-2">
                  <div className="text-white font-semibold text-lg">{starterPkg.name}</div>
                  <div className="text-amber-400/80 text-sm">{starterPkg.tagline}</div>
                  <div className="text-3xl font-bold text-white">{formatPrice(starterPkg.priceAmount)}</div>
                </div>
                <button
                  onClick={() => goToCheckout(starterPkg.id, 'stripe')}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/10 text-white font-bold uppercase tracking-widest text-[10px] hover:bg-white/20 transition-all"
                >
                  Start DIY <ArrowRight size={14} />
                </button>
              </div>
            )}

            {restorePkg && (
              <div
                className="rounded-2xl border border-white/10 p-6 space-y-4"
                style={{
                  backgroundImage: [
                    'linear-gradient(145deg, rgba(15,23,42,0.92) 0%, rgba(3,7,18,0.92) 45%, rgba(0,0,0,0.92) 100%)',
                    'radial-gradient(240px 160px at 20% 10%, rgba(245,158,11,0.14), transparent 65%)',
                    'radial-gradient(280px 180px at 78% 20%, rgba(16,185,129,0.10), transparent 62%)',
                  ].join(', '),
                  boxShadow: '0 24px 70px -36px rgba(0,0,0,0.80), inset 0 1px 0 rgba(255,255,255,0.10)',
                }}
              >
                <div className="space-y-2">
                  <div className="text-white font-semibold text-lg">{restorePkg.name}</div>
                  <div className="text-amber-400/80 text-sm">{restorePkg.tagline}</div>
                  <div className="text-3xl font-bold text-white">{formatPrice(restorePkg.priceAmount)}</div>
                </div>
                <button
                  onClick={() => goToCheckout(restorePkg.id)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                >
                  Get started <ArrowRight size={14} />
                </button>
              </div>
            )}

            {platinumPkg && (
              <div
                className="rounded-2xl border border-white/10 p-6 space-y-4"
                style={{
                  backgroundImage: [
                    'linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(229,228,226,0.86) 28%, rgba(192,192,192,0.78) 58%, rgba(148,163,184,0.70) 100%)',
                    'repeating-linear-gradient(45deg, rgba(15,23,42,0.05) 0 1px, transparent 1px 44px)',
                    'radial-gradient(260px 180px at 70% 15%, rgba(255,255,255,0.55), transparent 62%)',
                    'radial-gradient(320px 220px at 18% 78%, rgba(0,0,0,0.18), transparent 72%)',
                  ].join(', '),
                  boxShadow: '0 24px 70px -30px rgba(0,0,0,0.70), inset 0 1px 0 rgba(255,255,255,0.55)',
                }}
              >
                <div className="space-y-2">
                  <div className="text-[#0d1512] font-semibold text-lg">{platinumPkg.name}</div>
                  <div className="text-[#0d1512]/70 text-sm">{platinumPkg.tagline}</div>
                  <div className="text-3xl font-black text-[#0d1512]">{formatPrice(platinumPkg.priceAmount)}</div>
                </div>
                <button
                  onClick={() => goToCheckout(platinumPkg.id, 'in_house')}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                >
                  Finance & build credit <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* All Packages Comparison */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Compare Packages</h2>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-4 px-4 text-white/60 font-medium">Package</th>
                  <th className="text-center py-4 px-4 text-white/60 font-medium">Price</th>
                  <th className="text-center py-4 px-4 text-white/60 font-medium">Dispute Rounds</th>
                  <th className="text-center py-4 px-4 text-white/60 font-medium">Case Manager</th>
                  <th className="text-center py-4 px-4 text-white/60 font-medium">Strategy Session</th>
                  <th className="text-center py-4 px-4 text-white/60 font-medium">Access</th>
                  <th className="text-right py-4 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {personalCreditPackages.map((pkg) => (
                  <tr
                    key={pkg.id}
                    className={`border-b border-white/5 ${
                      pkg.badge ? 'bg-amber-500/5' : ''
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-semibold">{pkg.name}</span>
                        {pkg.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black text-[9px] font-black uppercase">
                            {pkg.badge}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-center py-4 px-4 text-white font-semibold">
                      {formatPrice(pkg.priceAmount)}
                    </td>
                    <td className="text-center py-4 px-4 text-white/70">
                      {pkg.id === 'personal_starter' ? 'Templates only' : 'Unlimited'}
                    </td>
                    <td className="text-center py-4 px-4">
                      {pkg.id === 'personal_platinum' ? (
                        <Check size={18} className="text-emerald-400 mx-auto" />
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-4">
                      {pkg.id === 'personal_platinum' ? (
                        <Check size={18} className="text-emerald-400 mx-auto" />
                      ) : (
                        <span className="text-white/30">—</span>
                      )}
                    </td>
                    <td className="text-center py-4 px-4 text-white/70">
                      {pkg.id === 'personal_starter'
                        ? '30 days'
                        : pkg.id === 'personal_restore'
                        ? '90 days'
                        : '6 months'}
                    </td>
                    <td className="text-right py-4 px-4">
                      <button
                        onClick={() => {
                          const preferredRail =
                            pkg.rail === 'in_house' ? 'in_house' : pkg.rail === 'stripe' ? 'stripe' : undefined;
                          goToCheckout(pkg.id, preferredRail);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm hover:bg-white/20 transition-all"
                      >
                        Select <ArrowRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Process Steps */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Our Process</h2>

          <div className="grid md:grid-cols-4 gap-4">
            {PROCESS_STEPS.map((step) => (
              <div
                key={step.step}
                className="rounded-xl border border-white/10 bg-black/30 p-5 space-y-3"
              >
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                  <span className="text-amber-400 font-bold">{step.step}</span>
                </div>
                <h3 className="text-white font-semibold">{step.title}</h3>
                <p className="text-white/60 text-sm">{step.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* The OS (what you actually get) */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white">The Finely Cred OS</h2>
              <p className="text-white/60 text-sm mt-1">
                This isn’t a static “service page.” You get a system: uploads, evidence discipline, dispute execution, letters, and tracking.
              </p>
            </div>
            <button
              onClick={() => navigate('/onboarding')}
              className="fc-button-brand"
            >
              Start intake <ArrowRight size={14} />
            </button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: UploadCloud,
                title: 'Report Upload + Parsing',
                desc: 'Upload IdentityIQ/MyScoreIQ exports (HTML/PDF). Parse tradelines + payment history for clean targeting.',
              },
              {
                icon: ShieldCheck,
                title: 'Evidence Vault',
                desc: 'Store proof packs and label everything so follow-ups are disciplined (not guesswork).',
              },
              {
                icon: Gavel,
                title: 'Dispute Center',
                desc: 'Track items, rounds, deadlines, and follow-up windows by bureau.',
              },
              {
                icon: FileText,
                title: 'Letter Generator',
                desc: 'Generate printable letters and keep PDFs in your vault for an audit trail.',
              },
              {
                icon: Sparkles,
                title: 'AI Suggestions (safe + scoped)',
                desc: 'Turn parsed report signals into next-best actions (education-first, no legal advice).',
              },
              {
                icon: Target,
                title: 'Milestones + Readiness',
                desc: 'Move from stabilization → approvals → funding readiness with clear sequencing.',
              },
            ].map((x) => {
              const Icon = x.icon;
              return (
                <div key={x.title} className="rounded-2xl border border-white/10 bg-black/30 p-6 space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center">
                    <Icon size={20} className="text-amber-300" />
                  </div>
                  <div className="text-white font-semibold">{x.title}</div>
                  <div className="text-white/60 text-sm leading-relaxed">{x.desc}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Financing Promo */}
        <div
          className="rounded-3xl border border-white/20 p-6 md:p-8 fc-platinum-frame"
          style={{
            backgroundImage: [
              'linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(229,228,226,0.86) 28%, rgba(192,192,192,0.78) 58%, rgba(148,163,184,0.70) 100%)',
              'repeating-linear-gradient(45deg, rgba(15,23,42,0.05) 0 1px, transparent 1px 44px)',
              'radial-gradient(260px 180px at 70% 15%, rgba(255,255,255,0.55), transparent 62%)',
              'radial-gradient(320px 220px at 18% 78%, rgba(0,0,0,0.18), transparent 72%)',
            ].join(', '),
            boxShadow: '0 26px 72px -34px rgba(0,0,0,0.72), inset 0 1px 0 rgba(255,255,255,0.55)',
          }}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-shrink-0 w-16 h-16 rounded-full bg-black/10 border border-black/10 flex items-center justify-center">
              <TrendingUp size={28} className="text-[#0d1512]/70" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-black text-[#0d1512] mb-2">Build Credit While You Pay</h3>
              <p className="text-[#0d1512]/70">
                Our in-house financing reports your payments to Equifax. This means you're not just
                restoring your credit — you're actively building a positive installment tradeline at the same time.
                Education-first and milestone-based.
              </p>
            </div>
            <button
              onClick={() => navigate('/pricing?tab=tradeline_promo')}
              className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
            >
              View tradeline packages <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Wealth Builder handoff */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 md:p-8">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <CreditCard size={24} className="text-amber-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">Next Step: Wealth Builder & Wealth Paths</h3>
              <p className="text-white/60 text-sm leading-relaxed">
                Once your credit profile is stabilized, we can transition you into funding readiness and wealth acceleration.
                This is where Wealth Paths unlock — including future integration to Nora Capital Group for funding workflows.
              </p>
            </div>
            <button
              onClick={() => navigate('/pricing')}
              className="flex-shrink-0 inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.05] text-white/80 font-bold uppercase tracking-widest text-[10px] transition-all"
            >
              View Wealth Builder <ArrowRight size={14} />
            </button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-wrap items-center justify-center gap-8 text-white/40">
            <div className="flex items-center gap-2">
              <Shield size={20} />
              <span className="text-sm">Secure & Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock size={20} />
              <span className="text-sm">Fast Turnaround</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={20} />
              <span className="text-sm">Expert Support</span>
            </div>
            <div className="flex items-center gap-2">
              <Star size={20} />
              <span className="text-sm">Proven Results</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold text-white">Ready to Transform Your Credit?</h2>
          <p className="text-white/60 max-w-xl mx-auto">
            Start with our quick intake to see which package fits your situation. No commitment required.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button onClick={() => navigate('/onboarding')} className="fc-button-brand px-8 py-4">
              Start intake <ArrowRight size={16} />
            </button>
            <button
              onClick={() => navigate('/consultation?lane=' + encodeURIComponent('Personal Credit'))}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl border border-white/10 bg-black/30 hover:bg-white/[0.03] text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
            >
              Book free enlightenment session <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
