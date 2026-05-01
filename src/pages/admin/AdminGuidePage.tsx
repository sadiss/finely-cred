import React from 'react';
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, Shield, Settings, FileText, Calendar, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';

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
      icon: <BookOpen size={18} className="text-amber-400" />,
      bullets: [
        'Treat each partner as a case file with timelines, evidence, and an audit trail.',
        'Run weekly ops: review workflow queue → schedule sessions → convert leads to tasks → close loops.',
        'Standardize naming + uploads so every team member can pick up any file instantly.',
      ],
    },
    {
      title: 'Settings (what they mean)',
      icon: <Settings size={18} className="text-amber-400" />,
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
      icon: <FileText size={18} className="text-amber-400" />,
      bullets: [
        'The Template Library is generator-first: bases × variants × tones × versions (and optionally state specializations).',
        'Export to PDF/Word or save generated documents directly into the Evidence Vault.',
        'Continuously expand the base library across credit, identity theft, debt, court, banking, business funding, and ops.',
      ],
      cta: { label: 'Open Template Library', path: '/admin/templates' },
    },
    {
      title: 'Sessions → Calendar',
      icon: <Calendar size={18} className="text-amber-400" />,
      bullets: [
        'Use session requests as your intake funnel; triage quickly and schedule meetings.',
        'Attach meeting URLs and confirm status so partners get a clear next step.',
        'Convert session outcomes into tasks with owners + due dates.',
      ],
      cta: { label: 'Open Calendar & Scheduling', path: '/admin/calendar' },
    },
    {
      title: 'Billing & agreements',
      icon: <CreditCard size={18} className="text-amber-400" />,
      bullets: [
        'Stripe and in-house financing are normalized into one internal agreement flow.',
        'Use “pending review” for contracts that require ops confirmation before activation.',
        'Grant entitlements when agreements activate so portal modules unlock cleanly.',
      ],
      cta: { label: 'Open Billing & Agreements', path: '/admin/billing' },
    },
    {
      title: 'Security discipline (vault-grade)',
      icon: <Shield size={18} className="text-emerald-400" />,
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
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="text-[10px] uppercase tracking-widest text-white/40 font-mono">ops playbook</div>
        </div>

        <div className="grid lg:grid-cols-2 gap-4">
          {sections.map((s) => (
            <div key={s.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
              <div className="flex items-center gap-2">
                {s.icon}
                <div className="text-white font-semibold">{s.title}</div>
              </div>
              <ul className="space-y-2 text-white/65 text-sm">
                {s.bullets.map((b) => (
                  <li key={b} className="flex items-start gap-2">
                    <CheckCircle2 size={14} className="mt-0.5 text-emerald-400 flex-shrink-0" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
              {s.cta && (
                <button
                  onClick={() => navigate(s.cta!.path)}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                >
                  {s.cta.label} <ArrowRight size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

