import React from 'react';
import { ArrowRight, BookOpen, ExternalLink, FileText, Scale, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LAW_REFERENCES, REGULATORY_PORTALS } from '../../lib/legalResources';
import type { RolePageId } from '../../config/rolePartnerPrograms';
import { ROLE_GUIDE_CTAS } from '../../config/rolePartnerPrograms';

type RailLink = {
  id: string;
  label: string;
  href: string;
  hint: string;
  external?: boolean;
};

const ROLE_EXTRA: Partial<Record<RolePageId, RailLink[]>> = {
  case_help: [
    { id: 'debt-prereq', label: 'Debt & summons guide', href: '/free-debt-guide', hint: 'Prerequisite · validation clocks' },
    { id: 'restore-sheet', label: 'Personal restore sheet', href: '/resources/personal-credit-restore-sheet', hint: 'Escalation ladder overview' },
    {
      id: 'bc-sheets',
      label: 'Business credit one-sheets',
      href: '/resources/business-credit-one-sheets',
      hint: 'When funding readiness intersects the file',
    },
  ],
};

/**
 * Compact resource rail for career pages — monitoring, kits, portals, guides, Cornell law.
 * Parameterized by role so Case Help / RE / others share one component without duplicate strips.
 */
export function CareerResourceRail({
  role,
  tone = 'parchment',
  heading = 'Operator resource rail',
  subline = 'Monitoring · kits · portals · guides · statute anchors',
}: {
  role: RolePageId;
  tone?: 'parchment' | 'dark';
  heading?: string;
  subline?: string;
}) {
  const navigate = useNavigate();
  const guide = ROLE_GUIDE_CTAS[role];
  const parchment = tone === 'parchment';

  const core: RailLink[] = [
    {
      id: 'monitoring',
      label: 'Credit monitoring',
      href: '/resources/credit-monitoring',
      hint: 'HTML-friendly bureau pulls for evidence',
    },
    {
      id: 'resources',
      label: 'Resources hub',
      href: '/resources',
      hint: 'Guides, sheets, bookstore, videos',
    },
    {
      id: 'guide',
      label: guide.label.replace(/^Open\s+/i, ''),
      href: guide.path,
      hint: guide.blurb,
    },
    ...(ROLE_EXTRA[role] ?? []),
  ];

  const laws = LAW_REFERENCES.filter((l) =>
    ['fdcpa-1692g', 'fdcpa-1692e', 'fcra-611', 'fcra-623'].includes(l.id),
  );

  const shell = parchment
    ? 'rounded-sm border border-stone-400/50 bg-[#faf6ea] p-5 sm:p-6 shadow-[0_18px_44px_-30px_rgba(41,37,36,0.45)]'
    : 'rounded-2xl border border-white/10 bg-black/25 p-5';
  const kicker = parchment
    ? 'font-serif text-[10px] font-black uppercase tracking-[0.3em] text-stone-500'
    : 'text-[10px] font-black uppercase tracking-[0.28em] text-amber-300';
  const title = parchment
    ? 'font-serif text-2xl font-bold tracking-tight text-stone-900'
    : 'text-xl font-bold text-white';
  const body = parchment ? 'font-serif text-sm text-stone-600' : 'text-sm text-white/60';
  const chip = parchment
    ? 'inline-flex items-center gap-1.5 rounded-sm border border-stone-400/55 bg-white/70 px-3 py-2 font-serif text-[13px] font-semibold text-stone-800 hover:border-stone-700 hover:bg-white'
    : 'inline-flex items-center gap-1.5 rounded-lg border border-white/12 bg-black/30 px-3 py-2 text-[12px] font-semibold text-amber-100 hover:bg-white/[0.06]';
  const chipMuted = parchment
    ? 'inline-flex items-center gap-1.5 rounded-sm border border-stone-300/70 bg-[#efe7d4] px-3 py-2 font-serif text-[12px] font-bold text-stone-700 hover:border-stone-500'
    : 'inline-flex items-center gap-1.5 rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-[11px] font-semibold text-emerald-100 hover:bg-emerald-500/20';

  const open = (link: RailLink) => {
    if (link.external) {
      window.open(link.href, '_blank', 'noopener,noreferrer');
      return;
    }
    navigate(link.href);
  };

  return (
    <section className={shell}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-2xl space-y-2">
          <p className={kicker}>{heading}</p>
          <h2 className={title}>Tools the case desk actually uses.</h2>
          <p className={body}>{subline}</p>
        </div>
        <ShieldCheck size={22} className={parchment ? 'text-emerald-700/70' : 'text-emerald-300/80'} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {core.map((link) => (
          <button key={link.id} type="button" className={chip} onClick={() => open(link)} title={link.hint}>
            <BookOpen size={13} /> {link.label} <ArrowRight size={12} />
          </button>
        ))}
      </div>

      <div className="mt-5 border-t border-dotted border-stone-400/50 pt-4">
        <p className={kicker}>Regulatory portals</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {REGULATORY_PORTALS.map((p) => (
            <a
              key={p.id}
              href={p.href}
              target="_blank"
              rel="noopener noreferrer"
              className={chipMuted}
              title={p.hint}
            >
              {p.label} <ExternalLink size={11} />
            </a>
          ))}
        </div>
      </div>

      <div className="mt-5 border-t border-dotted border-stone-400/50 pt-4">
        <p className={kicker}>FCRA · FDCPA anchors (Cornell LII)</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {laws.map((l) => (
            <a
              key={l.id}
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className={chip}
              title={l.hint}
            >
              <Scale size={13} /> {l.label} <ExternalLink size={11} />
            </a>
          ))}
          <button
            type="button"
            className={chip}
            onClick={() => navigate('/resources/personal-credit-restore-sheet')}
          >
            <FileText size={13} /> Restore sheet kit <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </section>
  );
}
