import React, { useState } from 'react';
import { Scale, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../components/layout/PageShell';
import { CareersQuickNav } from '../components/careers/CareersQuickNav';
import { createProgramApplication } from '../data/programApplicationsRepo';
import { FinelyOsPageFooter } from '../features/os/FinelyOsPageFooter';
import { usePublicSeoMeta } from '../hooks/usePublicSeoMeta';
import type { ProgramApplicationKind } from '../domain/programApplications';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SELECT,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_NOTICE_ERROR,
  FINELY_OS_NOTICE_SUCCESS,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  finelyOsCatalogCard,
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
    <PageShell>
      <div className={`${FINELY_OS_PAGE} max-w-4xl mx-auto px-4 py-8`}>
        <CareersQuickNav active="case_help" className="mb-6" />
        <div className="flex items-start gap-3 mb-6">
          <Scale className="text-violet-600 shrink-0 mt-1" size={28} />
          <div>
            <h1 className={`${FINELY_OS_ENTITY_TITLE} text-slate-900`}>Help partners with case work</h1>
            <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-slate-600`}>
              Apply as a paralegal, attorney/counsel, or consultant. Approved applicants get assigned partner access for
              debt, litigation letters, and video meetings — not raw god-mode.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3 mb-8">
          {ROLES.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRole(r.id)}
              className={`${finelyOsCatalogCard(role === r.id ? 'violet' : 'sky')} !p-4 text-left ${
                role === r.id ? 'ring-2 ring-violet-400' : ''
              }`}
            >
              <div className="font-bold text-white">{r.title}</div>
              <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{r.blurb}</p>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
          <div className="text-sm font-semibold text-white">Apply — {ROLES.find((r) => r.id === role)?.title}</div>
          <label className="block">
            <span className={`${FINELY_OS_ENTITY_LABEL} text-white/70`}>Full name</span>
            <input className={`${FINELY_OS_ENTITY_INPUT} mt-1`} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
          </label>
          <label className="block">
            <span className={`${FINELY_OS_ENTITY_LABEL} text-white/70`}>Email</span>
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
              <span className={`${FINELY_OS_ENTITY_LABEL} text-white/70`}>Phone</span>
              <input className={`${FINELY_OS_ENTITY_INPUT} mt-1`} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </label>
            <label className="block">
              <span className={`${FINELY_OS_ENTITY_LABEL} text-white/70`}>Firm / company</span>
              <input
                className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </label>
          </div>
          <label className="block">
            <span className={`${FINELY_OS_ENTITY_LABEL} text-white/70`}>Bar # / credentials (if any)</span>
            <input
              className={`${FINELY_OS_ENTITY_INPUT} mt-1`}
              value={barOrCreds}
              onChange={(e) => setBarOrCreds(e.target.value)}
            />
          </label>
          <label className="block">
            <span className={`${FINELY_OS_ENTITY_LABEL} text-white/70`}>Role</span>
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
            <span className={`${FINELY_OS_ENTITY_LABEL} text-white/70`}>Why you want to help</span>
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
          <p className={FINELY_OS_COMPLIANCE_FOOTNOTE}>
            Educational platform roles · not an offer of employment · attorney applicants must be licensed where they
            practice · results vary
          </p>
        </form>

        <button type="button" className="mt-6 text-sm text-violet-700 font-semibold" onClick={() => navigate('/credit-specialists')}>
          Looking for credit specialist revenue-share instead? →
        </button>
      </div>
      <FinelyOsPageFooter />
    </PageShell>
  );
}
