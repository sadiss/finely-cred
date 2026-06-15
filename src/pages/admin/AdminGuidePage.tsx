import React from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Shield, Settings, FileText, Calendar, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';

export default function AdminGuidePage() {
  const navigate = useNavigate();

  const sections: Array<{
    title: string;
    icon: React.ReactNode;
    bullets: string[];
    cta?: { label: string; path: string };
  }> = [
    {
      title: 'Operating model (enterprise mindset)',
      icon: <BookOpen size={18} className="text-violet-400" />,
      bullets: [
        'Treat each partner as a case file with timelines, evidence, and an audit trail.',
        'Run weekly ops: review workflow queue → schedule sessions → convert leads to tasks → close loops.',
        'Standardize naming + uploads so every team member can pick up any file instantly.',
      ],
    },
    {
      title: 'Settings (what they mean)',
      icon: <Settings size={18} className="text-violet-400" />,
      bullets: [
        'Site: brand, support contact, and public social links.',
        'Stripe / In‑House Financing: integration configuration, webhooks, and contract URL mappings per package.',
        'Features: turn modules on/off for staged rollout.',
        'Security: keep secrets server-side in production; avoid storing API keys in browser storage.',
      ],
      cta: { label: 'Open Admin Settings', path: '/admin/settings' },
    },
    {
      title: 'Templates & downloadables',
      icon: <FileText size={18} className="text-violet-400" />,
      bullets: [
        'The Template Library is generator-first: bases × variants × tones × versions (and optionally state specializations).',
        'Export to PDF/Word or save generated documents directly into the Evidence Vault.',
        'Continuously expand the base library across credit, identity theft, debt, court, banking, business funding, and ops.',
      ],
      cta: { label: 'Open Template Library', path: '/admin/templates' },
    },
    {
      title: 'Lead magnets & Comms Studio',
      icon: <BookOpen size={18} className="text-emerald-600" />,
      bullets: [
        'Free guide funnel (/free-guide) + short links (/g/code) — leads land in Admin → Leads with referral attribution.',
        'Comms Studio sends templates into Communication Hub threads — not a duplicate inbox.',
        'Print-ready QR PDF in affiliate/specialist toolkit for brochures and business cards.',
        'Public enlightenment booking (/enlightenment-session) now includes time slot picker + agenda.',
      ],
      cta: { label: 'CRM inbound', path: '/admin/crm?pipeline=inbound' },
    },
    {
      title: 'Calendar & video (Calendly-style)',
      icon: <Calendar size={18} className="text-violet-400" />,
      bullets: [
        'Partners self-book at /portal/calendar — time slots, agenda, voice notes, instant video room.',
        'Triage public requests from strategy call and consultation pages.',
        'Meeting reminders deep-link to /portal/meeting/:id for one-click join.',
      ],
      cta: { label: 'Open Calendar & Scheduling', path: '/admin/calendar' },
    },
    {
      title: 'Billing & agreements',
      icon: <CreditCard size={18} className="text-violet-400" />,
      bullets: [
        'Stripe and in-house financing are normalized into one internal agreement flow.',
        'Use “pending review” for contracts that require ops confirmation before activation.',
        'Grant entitlements when agreements activate so portal modules unlock cleanly.',
      ],
      cta: { label: 'Open Billing & Agreements', path: '/admin/billing' },
    },
    {
      title: 'Security discipline (vault-grade)',
      icon: <Shield size={18} className="text-emerald-600" />,
      bullets: [
        'Production requires a secure backend configured (guardrail is enabled).',
        'Never store SSNs/IDs in plain text; use access control, audit logs, and least-privilege roles.',
        'Use consent-first intake and keep your legal pages accurate and visible.',
      ],
    },
  ];

  return (
    <PageShell
      badge="Admin"
      title="Admin Guide"
      subtitle="How to run Finely Cred operations at an enterprise level — settings, workflow, templates, billing, and security."
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <button type="button" onClick={() => navigate('/owners-guide')} className={FINELY_OS_SECONDARY_BTN}>
            Partner Owner&apos;s guide <ArrowRight size={12} />
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {sections.map((s) => (
            <div key={s.title} className={`${finelyOsInlineListItem()} p-6 space-y-4`}>
              <div className="flex items-center gap-2">
                {s.icon}
                <div className={FINELY_OS_ENTITY_VALUE}>{s.title}</div>
              </div>
              <ul className={`space-y-2 ${FINELY_OS_ENTITY_BODY}`}>
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="mt-0.5 text-emerald-600 flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              {s.cta && (
                <button type="button" onClick={() => navigate(s.cta!.path)} className={FINELY_OS_PRIMARY_BTN}>
                  {s.cta.label} <ArrowRight size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
