import React from 'react';
import { ArrowUpRight, BookOpen, Download, FileText, Stamp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ROLE_GUIDE_CTAS, type RolePageId } from '../../config/rolePartnerPrograms';

/**
 * “Open [Role] Guide” treatments — deliberately unlike the Join / Apply button on
 * every role page so a guest can tell reading from committing at a glance.
 *
 * Each role gets its own silhouette: RE = gold ledger rule, case help = stamped
 * parchment, specialist = holographic credential, agency = obsidian gold plate,
 * AU seller = sky/violet guide tab (gold is reserved for signup).
 */
const GUIDE_BTN: Record<RolePageId, string> = {
  re: 'inline-flex items-center gap-2.5 rounded-none border-y-2 border-amber-400/70 bg-amber-400/[0.07] px-6 py-3 text-[11px] font-black uppercase tracking-[0.24em] text-amber-200 transition-all hover:bg-amber-400/15 hover:tracking-[0.3em]',
  case_help:
    'inline-flex items-center gap-2.5 rounded-sm border-[3px] border-double border-stone-700/60 bg-[#f6f1e4] px-6 py-3 font-serif text-sm font-bold tracking-wide text-stone-900 shadow-[3px_3px_0_rgba(68,64,60,0.35)] transition-all hover:-translate-y-0.5 hover:shadow-[5px_5px_0_rgba(68,64,60,0.4)]',
  cs: 'inline-flex items-center gap-2.5 rounded-full border border-violet-300/50 bg-[linear-gradient(110deg,rgba(167,139,250,0.22),rgba(56,189,248,0.16),rgba(217,70,239,0.2))] px-6 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-[0_0_0_1px_rgba(167,139,250,0.25),0_12px_34px_-18px_rgba(139,92,246,0.7)] transition-all hover:brightness-115',
  agency:
    'inline-flex items-center gap-2.5 rounded-xl border border-amber-300/40 bg-black/70 px-6 py-3.5 text-[11px] font-black uppercase tracking-[0.26em] text-amber-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_18px_44px_-24px_rgba(245,158,11,0.55)] transition-all hover:border-amber-200/70 hover:text-amber-100',
  // Solid sky→violet fill — high visibility on black shelf; gold reserved for signup.
  au_seller:
    'group inline-flex items-center gap-3 rounded-r-2xl rounded-l-md border border-sky-100/70 border-l-[6px] border-l-violet-200 bg-[linear-gradient(105deg,#38bdf8_0%,#6366f1_52%,#8b5cf6_100%)] px-5 py-3 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-[0_16px_40px_-18px_rgba(56,189,248,0.9)] transition-all hover:brightness-110 hover:pl-6',
};

const GUIDE_ICON: Record<RolePageId, React.ComponentType<{ size?: number; className?: string }>> = {
  re: FileText,
  case_help: Stamp,
  cs: BookOpen,
  agency: Download,
  au_seller: BookOpen,
};

/** Secondary “read in browser” link — muted, per-role ink. */
const READ_LINK: Record<RolePageId, string> = {
  re: 'inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-amber-200/70 underline decoration-amber-400/40 decoration-1 underline-offset-[6px] hover:text-amber-100',
  case_help:
    'inline-flex items-center gap-1.5 font-serif text-sm italic text-stone-700 underline decoration-stone-400 underline-offset-4 hover:text-stone-900',
  cs: 'inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-violet-200/80 underline decoration-violet-300/40 underline-offset-[6px] hover:text-white',
  agency:
    'inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-white/55 underline decoration-white/25 underline-offset-[6px] hover:text-amber-100',
  au_seller:
    'inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-sky-200/85 underline decoration-sky-300/45 underline-offset-[6px] hover:text-sky-100',
};

type Props = {
  role: RolePageId;
  className?: string;
  /** Hide the “what’s inside” lines when space is tight. */
  compact?: boolean;
  /** Ink for the surrounding copy — parchment pages need dark ink. */
  ink?: 'light' | 'dark';
};

/**
 * Guide rail: distinct guide button + optional what’s-inside lines.
 * Pair it next to (never instead of) the page’s Join / Apply primary action.
 */
export function RoleGuideCta({ role, className = '', compact = false, ink = 'light' }: Props) {
  const navigate = useNavigate();
  const cta = ROLE_GUIDE_CTAS[role];
  const Icon = GUIDE_ICON[role];
  const dark = ink === 'dark';

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <button type="button" className={GUIDE_BTN[role]} onClick={() => navigate(cta.path)}>
          <Icon size={15} /> {cta.label}
        </button>
        {cta.readPath && cta.readPath !== cta.path ? (
          <button type="button" className={READ_LINK[role]} onClick={() => navigate(cta.readPath!)}>
            {cta.readLabel ?? 'Read in browser'} <ArrowUpRight size={13} />
          </button>
        ) : null}
      </div>
      <p className={`max-w-xl text-sm leading-relaxed ${dark ? 'text-[#0a1628]/70' : 'text-white/60'}`}>{cta.blurb}</p>
      {compact ? null : (
        <ul className="space-y-1.5">
          {cta.inside.map((line) => (
            <li
              key={line}
              className={`flex gap-2.5 text-[13px] leading-relaxed ${dark ? 'text-[#0a1628]/65' : 'text-white/55'}`}
            >
              <span
                className={`mt-[7px] h-1 w-1 shrink-0 rounded-full ${dark ? 'bg-[#b8860b]' : 'bg-white/40'}`}
                aria-hidden
              />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
