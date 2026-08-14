/** Shared presentational primitives for C1 doctrine articles — accordion cards + labeled field lists. */
import React, { useState } from 'react';
import { ChevronDown, ShieldAlert } from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  finelyOsCatalogCardCompact,
  type FinelyOsPublicAccent,
} from '../../features/os/finelyOsLightUi';

/**
 * C4 — the single highest compliance-scrutiny banner in the plan. Every state-specific
 * debt-defense landing page renders this at the very top, above the fold, before any
 * playbook content — deliberately more prominent and more explicit than the standard
 * `FINELY_OS_COMPLIANCE_FOOTNOTE` line used on every other public article. Do not soften
 * this copy or move it below other content; C0.3 flags state-specific content as this
 * plan's highest-risk category specifically because civil-procedure rules vary by state
 * and change over time.
 */
export function StateLawScrutinyBanner({ stateName }: { stateName: string }) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-2xl border-2 border-rose-500/50 bg-rose-500/15 p-4 sm:p-5"
    >
      <ShieldAlert size={22} className="mt-0.5 shrink-0 text-rose-300" />
      <div className="space-y-1.5">
        <p className="text-sm font-black uppercase tracking-wide text-rose-100">
          {stateName} law changes over time — this page is general information, not legal advice
        </p>
        <p className="text-sm leading-relaxed text-rose-100/90">
          Civil-procedure rules — answer deadlines, statutes of limitation, garnishment and levy exemptions, service of
          process, and court rules — are set and amended by {stateName}&rsquo;s own legislature and courts, not by Finely
          Cred, and they change over time. Nothing on this page is a substitute for advice from a{' '}
          <span className="font-semibold text-white">licensed attorney in {stateName}</span> who can review your specific
          situation, current deadline, and the court where your matter is pending. Where this page does not cite a
          specific, verifiable {stateName} statute or rule, treat the content as general federal doctrine only — not a
          {stateName}-specific claim.
        </p>
      </div>
    </div>
  );
}

export function DoctrineSectionHeading({
  eyebrow,
  title,
  Icon,
}: {
  eyebrow?: string;
  title: string;
  Icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2">
      <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
        {Icon ? <Icon size={16} className="text-amber-300" /> : null}
        {title}
      </h2>
      {eyebrow ? <span className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">{eyebrow}</span> : null}
    </div>
  );
}

export function DoctrineAccordionCard({
  accent = 'violet',
  eyebrow,
  title,
  chips = [],
  defaultOpen = false,
  children,
}: {
  accent?: FinelyOsPublicAccent;
  eyebrow?: string;
  title: string;
  chips?: string[];
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={finelyOsCatalogCardCompact(accent)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-3 text-left"
        aria-expanded={open}
      >
        <div className="min-w-0">
          {eyebrow ? (
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{eyebrow}</div>
          ) : null}
          <div className="mt-0.5 text-base font-bold text-white">{title}</div>
          {chips.length ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <span key={c} className={FINELY_OS_ENTITY_CHIP}>
                  {c}
                </span>
              ))}
            </div>
          ) : null}
        </div>
        <ChevronDown size={18} className={`mt-1 shrink-0 text-white/50 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open ? <div className="mt-3 space-y-3 border-t border-white/10 pt-3">{children}</div> : null}
    </div>
  );
}

export function DoctrineFieldList({
  label,
  items,
  tone = 'default',
}: {
  label: string;
  items: string[];
  tone?: 'default' | 'warn' | 'cite' | 'ok';
}) {
  if (!items.length) return null;
  const bulletColor =
    tone === 'warn' ? 'bg-amber-400' : tone === 'cite' ? 'bg-sky-400' : tone === 'ok' ? 'bg-emerald-400' : 'bg-white/40';
  return (
    <div>
      <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">{label}</div>
      <ul className="mt-1.5 space-y-1.5">
        {items.map((it, i) => (
          <li key={i} className="flex gap-2 text-sm leading-relaxed text-white/70">
            <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${bulletColor}`} aria-hidden />
            <span>{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function DoctrineProseBlock({ label, text }: { label?: string; text: string }) {
  return (
    <div>
      {label ? <div className="text-[10px] font-black uppercase tracking-[0.18em] text-white/45">{label}</div> : null}
      <p className={`${label ? 'mt-1.5' : ''} text-sm leading-relaxed text-white/70`}>{text}</p>
    </div>
  );
}

/** Real, disclosed proof strip — case studies pulled directly from `caseStudiesRepo.ts`, never invented. */
export function DoctrineProofStrip({
  title = 'Real documented outcomes',
  studies,
  disclaimer,
}: {
  title?: string;
  studies: Array<{
    id: string;
    title: string;
    partnerAlias: string;
    startingScore?: number;
    endingScore?: number;
    fundingSecured?: string;
    timeframeWeeks: number;
    summary: string;
  }>;
  disclaimer: string;
}) {
  if (!studies.length) return null;
  return (
    <section className="rounded-[1.25rem] border border-emerald-400/20 bg-emerald-500/[0.04] p-5">
      <DoctrineSectionHeading title={title} eyebrow="Documented, not hypothetical" />
      <div className="mt-3 grid gap-3 md:grid-cols-3">
        {studies.map((s) => (
          <div key={s.id} className="rounded-xl border border-white/10 bg-black/25 p-3.5">
            <div className="text-xs font-bold text-emerald-200">{s.partnerAlias}</div>
            <div className="mt-1 text-sm font-semibold text-white">{s.title}</div>
            <p className={`mt-1.5 text-xs leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>{s.summary}</p>
            <div className="mt-2 flex flex-wrap gap-1.5 text-[10px] font-bold uppercase tracking-wide text-white/50">
              {typeof s.startingScore === 'number' && typeof s.endingScore === 'number' ? (
                <span className={FINELY_OS_ENTITY_CHIP}>
                  {s.startingScore} → {s.endingScore}
                </span>
              ) : null}
              {s.fundingSecured ? <span className={FINELY_OS_ENTITY_CHIP}>{s.fundingSecured}</span> : null}
              <span className={FINELY_OS_ENTITY_CHIP}>{s.timeframeWeeks} weeks</span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-white/40">{disclaimer}</p>
    </section>
  );
}
