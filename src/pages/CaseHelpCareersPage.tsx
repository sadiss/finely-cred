import React, { useState } from 'react';
import { Scale, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { CareersQuickNav } from '../components/careers/CareersQuickNav';
import { LandingTypewriterTitle } from '../components/landing/LandingTypewriterTitle';
import { PublicLaneTitle } from '../components/public/PublicLaneTitle';
import { createProgramApplication } from '../data/programApplicationsRepo';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import type { ProgramApplicationKind } from '../domain/programApplications';
import {
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_LANDING_IVORY_BODY,
  FINELY_OS_LANDING_IVORY_KICKER,
  FINELY_OS_LANDING_IVORY_TITLE,
  FINELY_OS_LANDING_PLATINUM_TITLE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  finelyOsLandingContrastSection,
  finelyOsLandingIvoryCard,
  finelyOsLandingWealthyIvorySection,
} from '../features/os/finelyOsLightUi';

const ROLES: Array<{ id: ProgramApplicationKind; title: string; blurb: string }> = [
  {
    id: 'paralegal',
    title: 'Paralegal',
    blurb: 'Help partners organize court papers, scrape dockets, prepare letter packets, and track hearing timelines.',
  },
  {
    id: 'attorney',
    title: 'Attorney / Counsel',
    blurb: 'Support litigation strategy sessions, review formal answers and affidavits, and meet partners by video.',
  },
  {
    id: 'consultant',
    title: 'Case consultant',
    blurb: 'Advise on debt-buyer patterns, validation strategy, and partner readiness — educational, not legal advice.',
  },
];

/**
 * Public careers page for people who want to help on partner debt / litigation cases.
 * Applicants land in Admin program applications; owner grants MembershipRole after review.
 */
export default function CaseHelpCareersPage() {
  const navigate = useNavigate();
  usePublicSeoMeta({
    title: 'Paralegal, attorney & consultant careers',
    description:
      'Join Finely Cred as a paralegal, attorney/counsel, or case consultant — help partners with debt and litigation case work.',
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

  const canSubmit = fullName.trim().length > 1 && email.trim().includes('@') && status !== 'sending';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setStatus('sending');
    setStatusMsg(null);
    try {
      createProgramApplication({
        kind: role,
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim() || undefined,
        companyName: companyName.trim() || undefined,
        roleTitle: ROLES.find((r) => r.id === role)?.title,
        notes: [barOrCreds.trim() && `Credentials / bar: ${barOrCreds.trim()}`, notes.trim()]
          .filter(Boolean)
          .join('\n'),
      });
      setStatus('sent');
      setStatusMsg('Application received. Our team reviews case-help roles and grants portal access when approved.');
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
      title="Case help careers"
      subtitle="Paralegal, attorney/counsel, and consultant roles to support partner debt and litigation cases."
    >
      <div className={`${FINELY_OS_PAGE} max-w-5xl mx-auto space-y-0`}>
        <div className="px-4 py-4">
          <CareersQuickNav active="case_help" />
        </div>

        <section
          className={`px-4 sm:px-6 py-12 sm:py-14 ${finelyOsLandingContrastSection('fc-band-violet')}`}
          data-fc-contrast-band="1"
        >
          <PublicLaneTitle
            lane="careers"
            eyebrow="Case help careers"
            icon={<Scale size={16} />}
            text="Help partners with case work."
            highlight="case work."
            speedMs={38}
            className="mx-auto"
            subtitle={
              <p className="fc-light-contrast-body text-base sm:text-lg max-w-2xl">
                Apply as a paralegal, attorney/counsel, or consultant. Approved applicants get assigned partner access —
                not raw god-mode.
              </p>
            }
          />
        </section>

        <section className={`px-4 sm:px-6 py-12 sm:py-14 ${finelyOsLandingWealthyIvorySection()}`}>
          <div className="max-w-4xl mx-auto space-y-8">
            <div className="text-center space-y-3">
              <p className={FINELY_OS_LANDING_IVORY_KICKER}>Choose your role</p>
              <LandingTypewriterTitle
                as="h2"
                text="Three ways to serve partners."
                className={FINELY_OS_LANDING_IVORY_TITLE}
                highlight="serve partners."
                highlightClassName="fc-landing-ivory-accent"
                delayMs={280}
                speedMs={40}
              />
              <p className={`${FINELY_OS_LANDING_IVORY_BODY} max-w-2xl mx-auto`}>
                Educational platform roles · not an offer of employment · attorney applicants must be licensed where they practice.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-3">
              {ROLES.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`${finelyOsLandingIvoryCard()} text-left transition ${
                    role === r.id ? 'ring-2 ring-amber-600/50 border-amber-700/35' : ''
                  }`}
                >
                  <div className="font-bold text-[#0a1628]">{r.title}</div>
                  <p className="mt-1 text-xs leading-relaxed text-[#0a1628]/68">{r.blurb}</p>
                </button>
              ))}
            </div>

            <form onSubmit={submit} className={`${finelyOsLandingIvoryCard()} space-y-3`}>
              <div className="text-sm font-semibold text-[#0a1628]">Apply — {ROLES.find((r) => r.id === role)?.title}</div>
              <label className="block">
                <span className={`${FINELY_OS_ENTITY_LABEL} text-[#0a1628]/65`}>Full name</span>
                <input className={`${FINELY_OS_ENTITY_INPUT} mt-1`} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </label>
              <label className="block">
                <span className={`${FINELY_OS_ENTITY_LABEL} text-[#0a1628]/65`}>Email</span>
                <input
                  type="email"
                  className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className={`${FINELY_OS_ENTITY_LABEL} text-[#0a1628]/65`}>Phone</span>
                  <input className={`${FINELY_OS_ENTITY_INPUT} mt-1`} value={phone} onChange={(e) => setPhone(e.target.value)} />
                </label>
                <label className="block">
                  <span className={`${FINELY_OS_ENTITY_LABEL} text-[#0a1628]/65`}>Firm / company</span>
                  <input
                    className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                  />
                </label>
              </div>
              <label className="block">
                <span className={`${FINELY_OS_ENTITY_LABEL} text-[#0a1628]/65`}>Bar # / credentials (if any)</span>
                <input
                  className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
                  value={barOrCreds}
                  onChange={(e) => setBarOrCreds(e.target.value)}
                />
              </label>
              <label className="block">
                <span className={`${FINELY_OS_ENTITY_LABEL} text-[#0a1628]/65`}>Role</span>
                <select
                  className={`${FINELY_OS_ENTITY_SELECT} mt-1`}
                  value={role}
                  onChange={(e) => setRole(e.target.value as ProgramApplicationKind)}
                >
                  {ROLES.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={`${FINELY_OS_ENTITY_LABEL} text-[#0a1628]/65`}>Why you want to help</span>
                <textarea
                  rows={3}
                  className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </label>
              <button type="submit" disabled={!canSubmit} className={`${FINELY_OS_PRIMARY_BTN} disabled:opacity-60`}>
                Submit application <ArrowRight size={14} />
              </button>
              {status === 'sent' ? <div className={FINELY_OS_NOTICE_SUCCESS}>{statusMsg}</div> : null}
              {status === 'error' ? <div className={FINELY_OS_NOTICE_ERROR}>{statusMsg}</div> : null}
              <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} !text-[#0a1628]/55`}>
                Educational platform roles · not an offer of employment · attorney applicants must be licensed where they
                practice · results vary
              </p>
            </form>
          </div>
        </section>

        <section
          className={`px-4 sm:px-6 py-10 ${finelyOsLandingContrastSection('fc-band-dark')}`}
          data-fc-contrast-band="1"
        >
          <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="fc-light-contrast-body text-sm">Prefer the revenue-share Credit Specialist track instead?</p>
            <button
              type="button"
              className={`${FINELY_OS_PRIMARY_BTN}`}
              onClick={() => navigate('/credit-specialist')}
            >
              Credit Specialist pricing <ArrowRight size={14} />
            </button>
          </div>
        </section>

        <div className="px-4 py-6">
          <FinelyOsPageFooter />
        </div>
      </div>
    </PageShell>
  );
}
