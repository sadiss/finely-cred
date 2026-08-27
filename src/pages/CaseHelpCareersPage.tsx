import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, FileText, Gavel, Lock, ScrollText, UserCheck, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { CareerOtherTracksLink } from '../components/careers/CareerOtherTracksLink';
import { CareerTierChooser, type CareerChoiceOption } from '../components/careers/CareerTierChooser';
import { CareerChoiceApply } from '../components/careers/CareerChoiceApply';
import { DigitalInviteShareBand } from '../components/digitalCards';
import { RoleGuideCta } from '../components/careers/RoleGuideCta';
import { ROLE_ACTION_LEGEND, roleJoinBtn, roleSecondaryBtn } from '../components/careers/roleActionButtons';
import { CaseDeskDossierMock } from '../components/careers/roleProfileMockups';
import { LandingTypewriterTitle } from '../components/landing/LandingTypewriterTitle';
import { createProgramApplication } from '../data/programApplicationsRepo';
import { submitLeadCapture } from '../data/leadsRepo';
import { addLeadNote, addLeadTags } from '../data/leadOpsRepo';
import {
  ROLE_BENEFITS,
  ROLE_COMPLIANCE_FOOTNOTES,
  ROLE_INSIDE_ACCESS,
  ROLE_PROFILE_FEATURES,
  ROLE_UNIQUE_CAPABILITIES,
  ROLE_WORK_SPLIT,
} from '../config/rolePartnerPrograms';
import { FinelyOsAlertBanner } from '../features/os/FinelyOsAlertBanner';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import type { ProgramApplicationKind } from '../domain/programApplications';
import {
  captureDigitalInviteCardFromUrl,
  digitalInviteCardLeadAttributionFields,
  digitalInviteCardLeadTags,
  formatDigitalInviteCardNote,
  getDigitalInviteCardEligibilityForRole,
  markDigitalInviteCardRedeemed,
} from '../lib/digitalInviteCardAttribution';
import { getDigitalInviteCardDef } from '../config/digitalInviteCards';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  finelyOsLandingContrastSection,
  finelyOsLandingWealthyIvorySection,
} from '../features/os/finelyOsLightUi';

const ROLE = 'case_help' as const;

/** Dossier language — serif ink on parchment, stamped rules, docket rows. */
const SERIF = 'font-serif';
const DOSSIER_KICKER = `${SERIF} text-[10px] font-black uppercase tracking-[0.3em] text-stone-500`;
const DOSSIER_TITLE = `${SERIF} text-3xl sm:text-4xl font-bold tracking-tight text-stone-900`;
const DOSSIER_BODY = `${SERIF} text-[15px] leading-relaxed text-stone-700`;
const DOSSIER_LABEL = `${SERIF} text-[11px] font-bold uppercase tracking-[0.18em] text-stone-600`;
const DOSSIER_PANEL =
  'rounded-sm border border-stone-400/50 bg-[#faf6ea] p-5 sm:p-6 shadow-[0_18px_44px_-30px_rgba(41,37,36,0.55)]';
/** Parchment-native fields — keeps ink dark on the light dossier form (no dark-on-dark, no dark-on-cream). */
const DOSSIER_INPUT =
  'mt-1 w-full rounded-sm border border-stone-400/60 bg-white/75 px-3 py-2.5 font-serif text-[15px] text-stone-900 placeholder:text-stone-400 transition-colors focus:border-stone-700 focus:outline-none';

const ROLES: Array<{
  id: ProgramApplicationKind;
  title: string;
  docket: string;
  blurb: string;
  scope: string;
  accent: CareerChoiceOption['accent'];
}> = [
  {
    id: 'paralegal',
    title: 'Paralegal',
    docket: 'File I',
    blurb:
      'Organize court papers, pull dockets, assemble letter and evidence packets, and keep hearing timelines honest on assigned partner matters.',
    scope: 'Prepares — does not advise. No legal advice, no appearances.',
    accent: 'sky',
  },
  {
    id: 'attorney',
    title: 'Attorney / Counsel',
    docket: 'File II',
    blurb:
      'Review formal answers, affidavits, and discovery; support litigation strategy sessions; meet partners by video inside logged sessions.',
    scope: 'Must be licensed where you practice. Engagement terms are set per matter.',
    accent: 'navy',
  },
  {
    id: 'consultant',
    title: 'Case consultant',
    docket: 'File III',
    blurb:
      'Read debt-buyer patterns, advise on validation sequencing, and assess partner readiness before a case escalates.',
    scope: 'Educational analysis only — never presented as legal advice.',
    accent: 'rose',
  },
];

/**
 * Public careers page for people who want to help on partner debt / litigation cases.
 * Applicants land in Admin program applications; owner grants MembershipRole after review.
 */
export default function CaseHelpCareersPage() {
  const navigate = useNavigate();
  const workSplit = ROLE_WORK_SPLIT[ROLE];
  usePublicSeoMeta({
    title: 'Paralegal, attorney & consultant careers — Finely case desk',
    description:
      'Join the Finely Cred case desk as a paralegal, attorney/counsel, or case consultant. You work assigned partner matters with scoped, audited access — Finely runs intake and the platform.',
    path: '/careers/case-help',
  });

  const [role, setRole] = useState<ProgramApplicationKind>('paralegal');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [barOrCreds, setBarOrCreds] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [showOptionalDetails, setShowOptionalDetails] = useState(false);
  const [cardEligibility, setCardEligibility] = useState(() => getDigitalInviteCardEligibilityForRole('case_help'));

  const roleOptions: CareerChoiceOption[] = ROLES.map((r) => ({
    id: r.id,
    name: r.title,
    subtitle: r.docket,
    description: r.blurb,
    accent: r.accent,
  }));

  useEffect(() => {
    captureDigitalInviteCardFromUrl(window.location.search, window.location.pathname);
    setCardEligibility(getDigitalInviteCardEligibilityForRole('case_help'));
  }, []);

  const cardBonus = getDigitalInviteCardDef('case_help')?.bonus;
  const activeRole = ROLES.find((r) => r.id === role);

  const canSubmit = fullName.trim().length > 1 && email.trim().includes('@') && status !== 'sending';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('sending');
    setStatusMsg(null);
    try {
      const app = createProgramApplication({
        kind: role,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        companyName: companyName.trim() || undefined,
        roleTitle: activeRole?.title,
        referralCode: cardEligibility ? `digital-card-${cardEligibility.role}` : undefined,
        notes: [
          barOrCreds.trim() && `Credentials / bar: ${barOrCreds.trim()}`,
          notes.trim(),
          cardEligibility ? `PRIORITY (digital invite bonus): ${cardBonus?.label ?? 'Priority review'}` : null,
        ]
          .filter(Boolean)
          .join('\n'),
      });

      if (cardEligibility) {
        const lead = await submitLeadCapture({
          source: 'affiliate',
          offer: 'general_inquiry',
          interest: `case_help:${role}`,
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          consentToContact: true,
          funnelPath: '/careers/case-help',
          funnelId: 'case_help',
          goal: 'general',
          ...digitalInviteCardLeadAttributionFields(cardEligibility),
          giveawayStack: cardBonus ? [cardBonus.label] : undefined,
        });
        addLeadNote(lead.lead.id, `Case help application: ${app.id}\nRole applied: ${activeRole?.title}`);
        addLeadTags(lead.lead.id, ['priority-review', ...digitalInviteCardLeadTags(cardEligibility)]);
        addLeadNote(lead.lead.id, formatDigitalInviteCardNote(cardEligibility));
        markDigitalInviteCardRedeemed(lead.lead.id);
      }

      setStatus('sent');
      setStatusMsg(
        cardEligibility
          ? `Application received — priority review is on. ${cardBonus?.description ?? ''}`
          : 'Application received. Our team reviews case-desk roles and grants scoped portal access when approved.',
      );
      setFullName('');
      setEmail('');
      setPhone('');
      setCompanyName('');
      setBarOrCreds('');
      setNotes('');
    } catch (err: unknown) {
      setStatus('error');
      setStatusMsg((err as Error)?.message || 'Could not submit. Try again.');
    }
  };

  return (
    <PageShell
      title="Case desk careers"
      subtitle="Paralegal, attorney/counsel, and consultant roles working assigned partner debt and litigation matters."
      hideHero
    >
      <div className={`${FINELY_OS_PAGE} max-w-5xl mx-auto space-y-0`}>
        <div className="px-1 py-3 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <a href="/" className={FINELY_OS_BACK_LINK}>
              <ArrowLeft size={16} /> Home
            </a>
            <CareerOtherTracksLink currentId="case_help" />
          </div>
          {cardEligibility && cardBonus ? (
            <FinelyOsAlertBanner tone="success" message={cardBonus.description} />
          ) : null}
        </div>

        {/* Hero — parchment docket header (light-first, unlike every other role page) */}
        <section className={`mt-2 rounded-3xl px-5 sm:px-8 py-12 sm:py-14 ${finelyOsLandingWealthyIvorySection()}`}>
          <div className="max-w-4xl mx-auto">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-sm border border-stone-500/50 bg-[#efe7d4] px-3 py-1.5">
                <Gavel size={13} className="text-stone-700" />
                <span className={`${SERIF} text-[10px] font-black uppercase tracking-[0.24em] text-stone-700`}>
                  Finely case desk
                </span>
              </span>
              <span className="inline-flex items-center gap-1.5 -rotate-2 rounded-md border-2 border-rose-800/40 px-2.5 py-1">
                <span className={`${SERIF} text-[9px] font-black uppercase tracking-[0.2em] text-rose-800/70`}>
                  Scope-limited access
                </span>
              </span>
            </div>

            <LandingTypewriterTitle
              as="h1"
              text="Work real partner matters. Not a job board."
              className={`mt-5 ${SERIF} text-4xl sm:text-5xl font-bold tracking-tight text-stone-900 leading-[1.1]`}
              highlight="Not a job board."
              highlightClassName="text-stone-500 italic font-normal"
              speedMs={34}
            />
            <p className={`mt-4 max-w-2xl ${DOSSIER_BODY}`}>
              Collection suits, validation clocks, and debt-buyer paperwork move whether or not anyone is ready. Approved
              applicants get assigned partner matters with scoped, audited access — plus the letter studio, evidence
              vault, and docket timelines to work them properly.
            </p>

            <div className="mt-7 grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
              <div className={`${DOSSIER_PANEL} !bg-[#f4eddc]`}>
                <p className={DOSSIER_KICKER}>Read before you apply</p>
                <div className="mt-3">
                  <RoleGuideCta role={ROLE} ink="dark" />
                </div>
                <p className={`mt-3 ${SERIF} text-[12px] italic leading-relaxed text-stone-500`}>
                  {ROLE_ACTION_LEGEND[ROLE]}
                </p>
              </div>
              <div className="flex flex-col gap-2.5">
                <button
                  type="button"
                  className={roleJoinBtn(ROLE)}
                  onClick={() => document.getElementById('case-apply')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Apply to the case desk <ArrowRight size={14} />
                </button>
                <button
                  type="button"
                  className={roleSecondaryBtn(ROLE)}
                  onClick={() => document.getElementById('case-files')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  <ScrollText size={14} /> Compare the three files
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Three roles as dossier file tabs */}
        <section id="case-files" className={`mt-6 rounded-3xl px-5 sm:px-8 py-12 ${finelyOsLandingWealthyIvorySection()}`}>
          <div className="max-w-4xl mx-auto space-y-7">
            <div className="max-w-2xl space-y-3">
              <p className={DOSSIER_KICKER}>Choose your file</p>
              <h2 className={DOSSIER_TITLE}>Three ways to serve partners.</h2>
              <p className={DOSSIER_BODY}>
                Educational platform roles · not an offer of employment · attorney applicants must be licensed where they
                practice.
              </p>
            </div>

            {/* Big choice cards — pick a file, see scope, then apply */}
            <CareerTierChooser
              options={roleOptions}
              selectedId={role}
              onSelect={(id) => setRole(id as ProgramApplicationKind)}
              columns={3}
            />

            {activeRole ? (
              <div className={`${DOSSIER_PANEL}`}>
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <h3 className={`${SERIF} text-2xl font-bold text-stone-900`}>{activeRole.title}</h3>
                  <span className={DOSSIER_LABEL}>{activeRole.docket}</span>
                </div>
                <p className={`mt-4 flex items-start gap-2 ${SERIF} text-sm italic text-stone-600`}>
                  <Lock size={14} className="mt-0.5 shrink-0" /> {activeRole.scope}
                </p>
                <button
                  type="button"
                  className={roleJoinBtn(ROLE, 'mt-5')}
                  onClick={() => document.getElementById('case-apply')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Apply as {activeRole.title.toLowerCase()} <ArrowRight size={14} />
                </button>
              </div>
            ) : null}
          </div>
        </section>

        {/* Who does the work — docket ruling on dark chambers band */}
        <section
          className={`mt-6 rounded-3xl border border-white/10 px-5 sm:px-8 py-12 ${finelyOsLandingContrastSection('fc-band-dark')}`}
          data-fc-contrast-band="1"
        >
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="max-w-2xl space-y-3">
              <p className={`${SERIF} text-[11px] font-black uppercase tracking-[0.28em] text-violet-300`}>
                Who does the work
              </p>
              <h2 className={`${SERIF} text-3xl sm:text-4xl font-bold tracking-tight text-white`}>
                {workSplit.headline}
              </h2>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="rounded-sm border-l-2 border-emerald-300/60 bg-white/[0.04] p-5">
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.26em] text-emerald-200/80">
                  <ScrollText size={13} /> You do
                </p>
                <ul className="mt-3 space-y-2.5">
                  {workSplit.youDo.map((line) => (
                    <li key={line} className={`${SERIF} text-[15px] leading-relaxed text-white/75`}>
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-sm border-l-2 border-sky-300/50 bg-white/[0.04] p-5">
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.26em] text-sky-200/80">
                  <UserCheck size={13} /> Finely runs
                </p>
                <ul className="mt-3 space-y-2.5">
                  {workSplit.finelyRuns.map((line) => (
                    <li key={line} className={`${SERIF} text-[15px] leading-relaxed text-white/75`}>
                      {line}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-sm border border-rose-400/30 bg-rose-500/[0.07] p-5">
              <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.26em] text-rose-200">
                <XCircle size={13} /> Not your job — stated plainly
              </p>
              <ul className="mt-3 grid gap-2 sm:grid-cols-3">
                {workSplit.notYourJob.map((line) => (
                  <li key={line} className={`${SERIF} text-sm leading-relaxed text-rose-100/75`}>
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Case desk profile + dossier mock */}
        <section
          className={`mt-6 rounded-3xl border border-white/10 px-5 sm:px-8 py-12 ${finelyOsLandingContrastSection('fc-band-ember')}`}
          data-fc-contrast-band="1"
        >
          <div className="max-w-5xl mx-auto grid gap-9 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="space-y-6">
              <div className="space-y-3">
                <p className={`${SERIF} text-[11px] font-black uppercase tracking-[0.28em] text-emerald-300`}>
                  Your case desk profile
                </p>
                <h2 className={`${SERIF} text-3xl font-bold tracking-tight text-white`}>
                  Credentials, matters, and a session log.
                </h2>
                <p className="fc-light-contrast-body text-sm sm:text-base leading-relaxed">
                  Approved applicants get a case desk profile — credential block, assigned matters sorted by next court
                  date, and a session log that writes meeting notes back to the file.
                </p>
              </div>
              <dl className="space-y-4">
                {ROLE_PROFILE_FEATURES[ROLE].map((f) => (
                  <div key={f.label} className="border-t border-white/10 pt-3">
                    <dt className={`${SERIF} text-base font-bold text-white/90`}>{f.label}</dt>
                    <dd className="mt-1 text-[13px] leading-relaxed text-white/55">{f.detail}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <CaseDeskDossierMock />
          </div>
        </section>

        {/* Benefits · access · capabilities — serif definition columns on parchment */}
        <section className={`mt-6 rounded-3xl px-5 sm:px-8 py-12 ${finelyOsLandingWealthyIvorySection()}`}>
          <div className="max-w-5xl mx-auto space-y-8">
            <div className="max-w-2xl space-y-3">
              <p className={DOSSIER_KICKER}>What the role gives you</p>
              <h2 className={DOSSIER_TITLE}>Benefits, inside access, unique authority.</h2>
            </div>
            <div className="grid gap-7 md:grid-cols-3">
              {[
                { title: 'Benefits', rows: ROLE_BENEFITS[ROLE] },
                { title: 'Inside access', rows: ROLE_INSIDE_ACCESS[ROLE] },
                { title: 'Only the case desk can', rows: ROLE_UNIQUE_CAPABILITIES[ROLE] },
              ].map((col) => (
                <div key={col.title} className="space-y-4">
                  <p className={DOSSIER_KICKER}>{col.title}</p>
                  <dl className="space-y-3.5">
                    {col.rows.map((r) => (
                      <div key={r.label} className="border-t border-dotted border-stone-400/60 pt-2.5">
                        <dt className={`${SERIF} text-[15px] font-bold text-stone-900`}>{r.label}</dt>
                        <dd className={`mt-1 ${SERIF} text-[13px] leading-relaxed text-stone-600`}>{r.detail}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Apply — choice-first: file already picked above, now a short intake */}
        <section id="case-apply" className={`mt-6 rounded-3xl px-5 sm:px-8 py-12 ${finelyOsLandingWealthyIvorySection()}`}>
          <div className="max-w-2xl mx-auto space-y-4">
            <CareerChoiceApply
              kicker="Intake"
              title="Apply to the case desk"
              selectedLabel={`File: ${activeRole?.title ?? 'Pick a role above'}`}
              description="We review case-desk applications by hand and grant scoped partner access when approved."
              ctaLabel={status === 'sending' ? 'Submitting…' : 'Submit application'}
              onSubmit={submit}
              submitDisabled={!canSubmit}
              accent="navy"
              className="!rounded-sm !border-stone-400/50 !bg-[#faf6ea]"
            >
              {statusMsg ? (
                <div className={status === 'sent' ? FINELY_OS_NOTICE_SUCCESS : status === 'error' ? FINELY_OS_NOTICE_ERROR : ''}>
                  {statusMsg}
                </div>
              ) : null}
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className={DOSSIER_LABEL}>Full name</span>
                  <input
                    className={DOSSIER_INPUT}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </label>
                <label className="block">
                  <span className={DOSSIER_LABEL}>Email</span>
                  <input
                    type="email"
                    className={DOSSIER_INPUT}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </label>
              </div>
              <label className="block">
                <span className={DOSSIER_LABEL}>Phone (optional)</span>
                <input className={`${DOSSIER_INPUT} sm:max-w-xs`} value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>

              <button
                type="button"
                onClick={() => setShowOptionalDetails((v) => !v)}
                className={`${SERIF} text-xs font-bold text-stone-600 underline underline-offset-2 hover:text-stone-900`}
              >
                {showOptionalDetails ? 'Hide optional details' : 'Add optional details (firm, bar/credentials, why you want to help)'}
              </button>

              {showOptionalDetails ? (
                <div className="space-y-3">
                  <div className="grid sm:grid-cols-2 gap-3">
                    <label className="block">
                      <span className={DOSSIER_LABEL}>Firm / company</span>
                      <input
                        className={DOSSIER_INPUT}
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                      />
                    </label>
                    <label className="block">
                      <span className={DOSSIER_LABEL}>Bar # / credentials (if any)</span>
                      <input
                        className={DOSSIER_INPUT}
                        value={barOrCreds}
                        onChange={(e) => setBarOrCreds(e.target.value)}
                      />
                    </label>
                  </div>
                  <label className="block">
                    <span className={DOSSIER_LABEL}>Why you want to help</span>
                    <textarea
                      rows={3}
                      className={DOSSIER_INPUT}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </label>
                </div>
              ) : null}
            </CareerChoiceApply>

            {status === 'sent' ? (
              <button type="button" className={roleSecondaryBtn(ROLE)} onClick={() => navigate('/free-debt-guide/read')}>
                <FileText size={14} /> Read the case desk guide while you wait <ArrowRight size={14} />
              </button>
            ) : null}

            <div className={`${DOSSIER_PANEL} !bg-transparent border-0 !shadow-none !p-0`}>
              <div className="border-t border-stone-300 pt-3.5">
                <RoleGuideCta role={ROLE} ink="dark" compact />
              </div>
              <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} !text-stone-600 !mx-0 !text-left`}>
                {ROLE_COMPLIANCE_FOOTNOTES[ROLE]}
              </p>
            </div>
          </div>
        </section>

        {/* Cross-link to specialist track */}
        <section
          className={`mt-6 rounded-3xl border border-white/10 px-5 sm:px-8 py-9 ${finelyOsLandingContrastSection('fc-band-dark')}`}
          data-fc-contrast-band="1"
        >
          <div className="max-w-4xl mx-auto flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className={`${SERIF} text-[11px] font-black uppercase tracking-[0.26em] text-sky-300`}>Other tracks</p>
              <p className="mt-1.5 fc-light-contrast-body text-sm">
                Want to run partner restore files on revenue share instead of case work? That is the Credit Specialist
                track.
              </p>
            </div>
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => navigate('/credit-specialist')}>
              Credit Specialist offer <ArrowRight size={14} />
            </button>
          </div>
        </section>

        <section className="px-1 py-6">
          <DigitalInviteShareBand role="case_help" />
        </section>

        <div className="px-1 py-6">
          <FinelyOsPageFooter />
        </div>
      </div>
    </PageShell>
  );
}
