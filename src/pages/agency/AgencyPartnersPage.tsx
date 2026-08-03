import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, Check, Rocket, ShieldCheck, UserCheck, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { CareersQuickNav } from '../../components/careers/CareersQuickNav';
import { RoleGuideCta } from '../../components/careers/RoleGuideCta';
import { ROLE_ACTION_LEGEND, roleJoinBtn, roleSecondaryBtn } from '../../components/careers/roleActionButtons';
import { AgencyTenantConsoleMock } from '../../components/careers/roleProfileMockups';
import { AgencyPartnersCareerGuide } from '../../components/agency/AgencyPartnersCareerGuide';
import { DigitalInviteShareBand } from '../../components/digitalCards';
import { AGENCY, AGENCY_OFFERINGS, getPublicAgencyBuyInTiers } from '../../config/agencyPartnersProgram';
import {
  ROLE_BENEFITS,
  ROLE_COMPLIANCE_FOOTNOTES,
  ROLE_INSIDE_ACCESS,
  ROLE_PROFILE_FEATURES,
  ROLE_UNIQUE_CAPABILITIES,
  ROLE_WORK_SPLIT,
} from '../../config/rolePartnerPrograms';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import {
  captureDigitalInviteCardFromUrl,
  getDigitalInviteCardEligibilityForRole,
} from '../../lib/digitalInviteCardAttribution';
import { getDigitalInviteCardDef } from '../../config/digitalInviteCards';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_PAGE,
} from '../../features/os/finelyOsLightUi';

const ROLE = 'agency' as const;

/**
 * Obsidian operator console layout — full-bleed dark plates, gold hairlines, and a
 * sticky section rail instead of tabs. Deliberately unlike the specialist credential
 * hub, the RE ledger, the case-desk dossier, and the AU marketplace shelf.
 */
const OBSIDIAN_PLATE =
  'rounded-2xl border border-white/10 bg-[linear-gradient(155deg,rgba(255,255,255,0.045),rgba(0,0,0,0.35))] p-5 sm:p-6 backdrop-blur-sm';
const GOLD_KICKER = 'text-[10px] font-black uppercase tracking-[0.32em] text-amber-200/85';
const PLATE_TITLE = 'text-2xl sm:text-3xl font-bold tracking-tight text-white';
const PLATE_BODY = 'text-sm sm:text-[15px] leading-relaxed text-white/70';

const SECTIONS = [
  { id: 'stack', label: 'Operating stack' },
  { id: 'split', label: 'Who does the work' },
  { id: 'economics', label: 'Tiers & payouts' },
  { id: 'profile', label: 'Tenant profile' },
  { id: 'signup', label: 'Sign up' },
] as const;

export default function AgencyPartnersPage() {
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: 'Agency partners — your brand, Finely’s operating system',
    description:
      'Launch a branded credit services agency on Finely OS: white-label tenant, team seats, lead routing, compliance workflows, one-time buy-in, and capacity payout tiers.',
    path: AGENCY.publicPath,
  });

  const [activeSection, setActiveSection] = useState<string>('stack');
  const [cardEligibility, setCardEligibility] = useState(() => getDigitalInviteCardEligibilityForRole('agency'));
  const buyInTiers = getPublicAgencyBuyInTiers();
  const workSplit = ROLE_WORK_SPLIT[ROLE];

  useEffect(() => {
    captureDigitalInviteCardFromUrl(window.location.search, window.location.pathname);
    setCardEligibility(getDigitalInviteCardEligibilityForRole('agency'));
  }, []);

  const cardBonus = getDigitalInviteCardDef('agency')?.bonus;

  const jumpTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <PageShell
      badge="Public"
      title={AGENCY.programName}
      subtitle="Company-level partnership — your brand, your team, Finely powers the operating system."
      hideHero
    >
      <div className={`${FINELY_OS_PAGE} max-w-6xl mx-auto`}>
        <div className="flex flex-wrap items-center gap-4">
          <button type="button" onClick={() => navigate(-1)} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Back
          </button>
          <a href="/" className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Home
          </a>
        </div>

        <CareersQuickNav active="agency_partners" className="mt-4" />
        {cardEligibility && cardBonus ? <FinelyOsAlertBanner tone="success" message={cardBonus.description} /> : null}

        {/* Obsidian hero — copy plate over a full-width tenant console mock */}
        <section
          className="relative overflow-hidden rounded-3xl border border-amber-300/20 p-6 sm:p-9"
          style={{
            background:
              'linear-gradient(158deg,#080a0f 0%,#12161f 52%,#0a0d13 100%), radial-gradient(ellipse 55% 45% at 88% 2%, rgba(245,158,11,0.2), transparent 58%)',
          }}
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/60 to-transparent" />

          <div className="relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
            <div className="space-y-5">
              <p className={GOLD_KICKER}>{AGENCY.programName}</p>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.06] text-white">
                Own a branded credit services{' '}
                <span className="bg-[linear-gradient(96deg,#fde68a,#f59e0b,#fcd34d)] bg-clip-text text-transparent">
                  company
                </span>
                .
              </h1>
              <p className={`${PLATE_BODY} max-w-xl`}>
                Agency partner means you run a tenant: your brand, your team seats, your partner routing, and a
                white-label portal. Your operators run the files; Finely runs the platform, the method, and the
                compliance rails underneath. This is not the solo specialist apprenticeship — that is a separate track.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <button type="button" onClick={() => navigate(AGENCY.signupPath)} className={roleJoinBtn(ROLE)}>
                  Create agency workspace <ArrowRight size={15} />
                </button>
                <button type="button" onClick={() => jumpTo('economics')} className={roleSecondaryBtn(ROLE)}>
                  See tiers &amp; payouts
                </button>
              </div>

              {/* Distinct, prominent Agency Guide plate — gold on obsidian, unlike the join button */}
              <div className="mt-2 rounded-2xl border border-amber-300/30 bg-black/45 p-5">
                <p className={GOLD_KICKER}>Free — the agency launch guide</p>
                <RoleGuideCta role={ROLE} className="mt-3" />
                <p className="mt-3 text-[11px] leading-relaxed text-white/35">{ROLE_ACTION_LEGEND[ROLE]}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2.5">
                {[
                  { n: 'Tenant', sub: 'your company' },
                  { n: 'Seats', sub: 'team capacity' },
                  { n: 'WL', sub: 'white-label depth' },
                ].map((x) => (
                  <div key={x.sub} className="rounded-xl border border-amber-300/20 bg-black/40 px-3 py-3.5 text-center">
                    <div className="text-lg font-black tracking-tight text-amber-200">{x.n}</div>
                    <div className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45">{x.sub}</div>
                  </div>
                ))}
              </div>
              {buyInTiers.length ? (
                <div className="rounded-xl border border-white/10 bg-black/35 px-4 py-3.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">One-time buy-in</p>
                  <div className="mt-2 space-y-1.5">
                    {buyInTiers.map((b) => (
                      <div key={b.id} className="flex items-baseline justify-between gap-3">
                        <span className="text-[13px] text-white/70">{b.name}</span>
                        <span className="font-mono text-sm font-bold text-amber-200">{b.priceLabel}</span>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => jumpTo('economics')}
                    className="mt-3 text-[11px] font-bold uppercase tracking-[0.16em] text-amber-200/80 underline decoration-amber-300/40 underline-offset-4 hover:text-amber-100"
                  >
                    What each buy-in includes
                  </button>
                </div>
              ) : null}
            </div>
          </div>

          <div className="relative mt-8">
            <AgencyTenantConsoleMock />
          </div>
        </section>

        {/* Sticky section rail — this page navigates by section, not tabs */}
        <nav
          className="sticky top-2 z-20 -mx-1 overflow-x-auto rounded-2xl border border-amber-300/20 bg-black/75 px-2 py-2 backdrop-blur-xl [scrollbar-width:thin]"
          aria-label="Agency program sections"
        >
          <div className="flex min-w-max items-center gap-1.5">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => jumpTo(s.id)}
                className={`rounded-xl px-3.5 py-2 text-[11px] font-black uppercase tracking-[0.16em] transition-all ${
                  activeSection === s.id
                    ? 'bg-amber-400/15 text-amber-100 ring-1 ring-amber-300/35'
                    : 'text-white/50 hover:bg-white/[0.06] hover:text-white/85'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Operating stack */}
        <section id="stack" className="scroll-mt-24 space-y-5">
          <div className="max-w-2xl space-y-2.5">
            <p className={GOLD_KICKER}>What you get</p>
            <h2 className={PLATE_TITLE}>The agency operating stack.</h2>
            <p className={PLATE_BODY}>
              Four plates. Everything a company needs that a solo seat does not: branding, oversight, capacity, and
              provisioning support.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {AGENCY_OFFERINGS.map((offering, i) => (
              <div key={offering.title} className={OBSIDIAN_PLATE}>
                <div className="flex items-start gap-4">
                  <span className="font-mono text-lg font-black text-amber-300/45">{String(i + 1).padStart(2, '0')}</span>
                  <div className="min-w-0 space-y-2.5">
                    <h3 className="text-lg font-bold text-white">{offering.title}</h3>
                    <p className="text-[13px] leading-relaxed text-white/65">{offering.description}</p>
                    <ul className="space-y-1.5">
                      {offering.included.map((item) => (
                        <li key={item} className="flex gap-2 text-[13px] leading-relaxed text-white/60">
                          <Check size={14} className="mt-0.5 shrink-0 text-amber-300" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Who does the work — full-width labelled rows (not columns, not cards) */}
        <section id="split" className="scroll-mt-24 space-y-5">
          <div className="max-w-2xl space-y-2.5">
            <p className={GOLD_KICKER}>Who does the work</p>
            <h2 className={PLATE_TITLE}>{workSplit.headline}</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            {[
              { icon: Building2, label: 'You and your team', rows: workSplit.youDo, tone: 'text-amber-200' },
              { icon: UserCheck, label: 'Finely runs', rows: workSplit.finelyRuns, tone: 'text-sky-200' },
              { icon: XCircle, label: 'Never your problem', rows: workSplit.notYourJob, tone: 'text-rose-200' },
            ].map(({ icon: Icon, label, rows, tone }) => (
              <div
                key={label}
                className="grid gap-3 border-b border-white/10 bg-black/25 px-5 py-5 last:border-b-0 sm:grid-cols-[12rem_1fr] sm:gap-6"
              >
                <p className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.24em] ${tone}`}>
                  <Icon size={13} /> {label}
                </p>
                <ul className="grid gap-2 sm:grid-cols-3">
                  {rows.map((r) => (
                    <li key={r} className="text-[13px] leading-relaxed text-white/65">
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Tiers & payouts (buy-in + capacity splits) */}
        <section id="economics" className="scroll-mt-24 space-y-5">
          <div className="max-w-2xl space-y-2.5">
            <p className={GOLD_KICKER}>Tiers &amp; payouts</p>
            <h2 className={PLATE_TITLE}>One-time buy-in, then capacity payout tiers.</h2>
            <p className={PLATE_BODY}>
              The buy-in activates your tenant and training seat. Capacity tiers then set files, seats, white-label
              depth, and your ongoing payout share.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {buyInTiers.map((b) => (
              <span
                key={b.id}
                className="inline-flex items-center gap-2 rounded-xl border border-amber-300/25 bg-black/40 px-3.5 py-2.5"
              >
                <Rocket size={14} className="text-amber-300" />
                <span className="text-[13px] text-white/75">{b.name}</span>
                <span className="font-mono text-sm font-bold text-amber-200">{b.priceLabel}</span>
              </span>
            ))}
          </div>
          <AgencyPartnersCareerGuide />
        </section>

        {/* Tenant profile: benefits, inside access, capabilities, profile features */}
        <section id="profile" className="scroll-mt-24 space-y-6">
          <div className="max-w-2xl space-y-2.5">
            <p className={GOLD_KICKER}>Inside the tenant</p>
            <h2 className={PLATE_TITLE}>Benefits, inside access, and owner-only powers.</h2>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            {ROLE_BENEFITS[ROLE].map((b) => (
              <div key={b.label} className={`${OBSIDIAN_PLATE} !p-4`}>
                <p className="flex items-center gap-2 text-[15px] font-semibold text-white/92">
                  <ShieldCheck size={15} className="shrink-0 text-amber-300" />
                  {b.label}
                </p>
                <p className="mt-1.5 pl-[1.55rem] text-[13px] leading-relaxed text-white/60">{b.detail}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {[
              { title: 'Inside access', rows: ROLE_INSIDE_ACCESS[ROLE] },
              { title: 'Only an owner can', rows: ROLE_UNIQUE_CAPABILITIES[ROLE] },
              { title: 'Your tenant profile', rows: ROLE_PROFILE_FEATURES[ROLE] },
            ].map((col) => (
              <div key={col.title} className="space-y-3.5">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{col.title}</p>
                <dl className="space-y-3">
                  {col.rows.map((r) => (
                    <div key={r.label} className="border-t border-amber-300/15 pt-2.5">
                      <dt className="text-sm font-semibold text-white/90">{r.label}</dt>
                      <dd className="mt-1 text-[13px] leading-relaxed text-white/55">{r.detail}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>
        </section>

        {/* Sign up */}
        <section id="signup" className="scroll-mt-24 space-y-5">
          <div className={`${OBSIDIAN_PLATE} space-y-5`}>
            <div className="space-y-2.5">
              <p className={GOLD_KICKER}>Create your workspace</p>
              <h2 className={PLATE_TITLE}>Provision the tenant.</h2>
              <p className={PLATE_BODY}>
                Sign in or create a Finely account, then provision your tenant — agency name, tier, buy-in, and branding.
              </p>
            </div>
            <ol className="grid gap-2.5 sm:grid-cols-3">
              {[
                'Pick a capacity tier (upgrade later).',
                'Set your agency name and white-label preferences.',
                'Invite seats and route partners into your portal.',
              ].map((step, i) => (
                <li key={step} className="rounded-xl border border-white/10 bg-black/30 p-4">
                  <span className="font-mono text-sm font-black text-amber-300/60">{String(i + 1).padStart(2, '0')}</span>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-white/70">{step}</p>
                </li>
              ))}
            </ol>
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => navigate(AGENCY.signupPath)} className={roleJoinBtn(ROLE)}>
                Open agency signup <ArrowRight size={15} />
              </button>
              <button type="button" onClick={() => navigate('/credit-specialist')} className={roleSecondaryBtn(ROLE)}>
                Solo specialist instead?
              </button>
            </div>
            <div className="flex gap-4 rounded-xl border border-white/10 bg-black/30 p-4">
              <Building2 className="shrink-0 text-amber-300" size={24} />
              <p className="text-[13px] leading-relaxed text-white/65">
                Agency signup requires a Finely login. If you only want to run your own partner files without a company
                tenant, use the Credit Specialist track instead.
              </p>
            </div>

            <div className="border-t border-white/10 pt-4">
              <RoleGuideCta role={ROLE} compact />
            </div>
          </div>

          <DigitalInviteShareBand role="agency" />
        </section>

        <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>{ROLE_COMPLIANCE_FOOTNOTES[ROLE]}</p>

        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
