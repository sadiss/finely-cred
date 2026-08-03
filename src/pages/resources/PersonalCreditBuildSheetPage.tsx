/**
 * `/resources/personal-credit-build-sheet`
 *
 * Dedicated home for the 2-sheet Personal Credit Build blueprint. Visual language is drafting
 * paper: a gridded plate, a bordered title block, an ascending rung elevation, and measured
 * weight bars — deliberately unlike the restore dossier and the AU card gallery.
 */
import React, { useState } from 'react';
import { ArrowRight, Compass, Download, Ruler } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { MarketingStaffChatStrip } from '../../components/marketing/MarketingStaffChatStrip';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import {
  PERSONAL_CREDIT_BUILD_SHEET,
  downloadPersonalCreditBuildSheet,
} from '../../resources/buildPersonalCreditBuildSheetPdf';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';

/** Faint blue drafting grid, drawn in CSS so the page reads like the PDF stock. */
const GRID_STYLE: React.CSSProperties = {
  backgroundImage:
    'linear-gradient(rgba(125,180,240,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(125,180,240,0.07) 1px, transparent 1px)',
  backgroundSize: '22px 22px',
};

const RUNGS = [
  {
    id: 'secured',
    name: 'Secured card, reported to all three',
    cost: '$200–500 deposit',
    moves: 'Payment history + utilization',
    detail:
      'Your deposit becomes the limit. Confirm before you open that the issuer reports to all three bureaus — some do not, and an unreported card builds nothing.',
    bar: 'bg-sky-400',
    text: 'text-sky-200',
    border: 'border-sky-400/30',
  },
  {
    id: 'loan',
    name: 'Credit-builder or share-secured loan',
    cost: '$10–40 / month',
    moves: 'Installment mix + history',
    detail:
      'The lender holds the money while you pay it in, then returns it. Cheapest honest way to add an installment line to a file that only has revolving accounts.',
    bar: 'bg-emerald-400',
    text: 'text-emerald-200',
    border: 'border-emerald-400/30',
  },
  {
    id: 'rent',
    name: 'Rent and utility reporting',
    cost: '$0–10 / month',
    moves: 'Positive payment depth',
    detail:
      'Bills you already pay become reported tradelines. Coverage varies by bureau and by service — verify which bureaus receive the data, and never enroll if you are behind.',
    bar: 'bg-violet-400',
    text: 'text-violet-200',
    border: 'border-violet-400/30',
  },
  {
    id: 'au',
    name: 'Authorized user placement',
    cost: 'Varies by arrangement',
    moves: 'Age, limit, utilization optics',
    detail:
      'A seasoned, low-utilization account can lend age and available limit to your file. Reporting is never automatic and issuer policies differ.',
    bar: 'bg-amber-400',
    text: 'text-amber-200',
    border: 'border-amber-400/30',
  },
  {
    id: 'unsecured',
    name: 'First unsecured approval',
    cost: 'Application only',
    moves: 'Real limit + graduation path',
    detail:
      'After six to twelve clean months, apply once — not to five issuers in a week. Ask your secured issuer about graduating and refunding your deposit first.',
    bar: 'bg-rose-400',
    text: 'text-rose-200',
    border: 'border-rose-400/30',
  },
] as const;

const WEIGHTS = [
  { label: 'Payment history', pct: 35, note: 'One missed payment outweighs months of tidy balances.', bar: 'bg-emerald-400' },
  { label: 'Amounts owed', pct: 30, note: 'Utilization is the fastest lever you actually control.', bar: 'bg-sky-400' },
  { label: 'Length of history', pct: 15, note: 'Time only accrues if you keep the old account open.', bar: 'bg-violet-400' },
  { label: 'New credit', pct: 10, note: 'Every hard pull is a small, temporary, avoidable cost.', bar: 'bg-rose-400' },
  { label: 'Credit mix', pct: 10, note: 'Revolving plus installment reads as a fuller file.', bar: 'bg-amber-400' },
] as const;

const TIMELINE = [
  { label: 'Cycle opens', note: 'Spend normally', tone: 'text-white/50', dot: 'bg-white/35' },
  { label: 'Pay here', note: 'Two days before the statement cuts', tone: 'text-emerald-200', dot: 'bg-emerald-400' },
  { label: 'Statement cuts', note: 'This balance is what gets reported', tone: 'text-rose-200', dot: 'bg-rose-400' },
  { label: 'Due date', note: 'Too late to change the reported figure', tone: 'text-white/50', dot: 'bg-white/35' },
] as const;

export default function PersonalCreditBuildSheetPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const kit = PERSONAL_CREDIT_BUILD_SHEET;

  usePublicSeoMeta({
    title: 'Personal Credit Build — 2-Sheet Blueprint',
    description:
      'Free 2-sheet personal credit build blueprint: the five-rung instrument ladder from secured card to first unsecured approval, scoring weights, worked utilization math, statement-date timing, and a twelve-month calendar.',
    path: kit.route,
  });

  const onDownload = async () => {
    setBusy(true);
    setErr(null);
    try {
      await downloadPersonalCreditBuildSheet();
    } catch (e) {
      setErr((e as Error)?.message || 'Download failed — try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageShell
      hideHero
      badge="Partner resources"
      title="Personal Credit Build — 2-Sheet Blueprint"
      subtitle="The instrument ladder and the optics engine, drawn to scale."
    >
      <div className={`${FINELY_OS_PAGE} fc-senior-simple`}>
        {/* ── Title block hero ─────────────────────────────────────── */}
        <section
          className="relative overflow-hidden rounded-[1.5rem] border border-sky-400/25 bg-[#080d16]/95"
          style={GRID_STYLE}
        >
          <div className="pointer-events-none absolute inset-3 rounded-[1.15rem] border border-sky-300/15" aria-hidden />
          <div className="relative flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between lg:p-8">
            <div className="min-w-0 max-w-2xl">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-sky-300">
                <Compass size={13} /> Personal credit build · {kit.sheetLabel} blueprint
              </div>
              <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                Build the file on purpose. <span className="text-sky-300">Same spending, better reporting.</span>
              </h1>
              <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>
                A thin file is not a broken file — it is an empty one. Two drafting sheets show you which instrument to
                add next, what each one genuinely moves, and the statement-date timing that improves your report without
                changing your budget.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void onDownload()}
                  className={`${FINELY_OS_PRIMARY_BTN} inline-flex items-center gap-2`}
                >
                  <Download size={15} /> {busy ? 'Building PDF…' : kit.downloadLabel}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/free-score-roadmap')}
                  className={FINELY_OS_SECONDARY_BTN}
                >
                  Free score roadmap guide
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/build-my-credit')}
                  className={`${FINELY_OS_SECONDARY_BTN} inline-flex items-center gap-2`}
                >
                  Have us plan it with you <ArrowRight size={14} />
                </button>
              </div>
              {err ? <p className="mt-3 text-sm text-rose-300">{err}</p> : null}
            </div>

            {/* Drafting revision stamp */}
            <div className="shrink-0 rounded-xl border border-sky-300/30 bg-black/40 p-4">
              <div className="text-[9px] font-black uppercase tracking-[0.26em] text-white/45">Sheet count</div>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="text-4xl font-black tabular-nums text-sky-200">{kit.pageCount}</span>
                <span className="text-xs font-bold uppercase tracking-wider text-white/50">pages</span>
              </div>
              <div className="mt-3 space-y-1 border-t border-white/10 pt-3 text-[10px] uppercase tracking-[0.18em] text-white/45">
                <div>01 · The ladder</div>
                <div>02 · The optics engine</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Sheet index ──────────────────────────────────────────── */}
        <section className="grid gap-4 md:grid-cols-2">
          {kit.pages.map((page) => (
            <article key={page.n} className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-sky-300/35 bg-sky-500/10 text-xs font-black tabular-nums text-sky-200">
                  {page.n}
                </span>
                <span className={FINELY_OS_ENTITY_SUBLABEL}>
                  Sheet {page.n} of {kit.pageCount}
                </span>
              </div>
              <h2 className="mt-2.5 text-base font-bold text-white">{page.title}</h2>
              <p className={`mt-1.5 ${FINELY_OS_ENTITY_BODY}`}>{page.body}</p>
            </article>
          ))}
        </section>

        {/* ── Rung elevation ───────────────────────────────────────── */}
        <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5" style={GRID_STYLE}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
              <Ruler size={16} className="text-sky-300" /> The five-rung instrument ladder
            </h2>
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Climb in order — each rung earns the next</span>
          </div>

          <div className="mt-4 space-y-2.5">
            {RUNGS.map((rung, i) => (
              <div
                key={rung.id}
                className={`flex gap-3 rounded-xl border ${rung.border} bg-black/35 p-4`}
                style={{ marginLeft: `${i * 14}px` }}
              >
                <div className="flex shrink-0 flex-col items-center gap-1.5">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40">R{i + 1}</span>
                  <span className={`h-full w-1 rounded-full ${rung.bar}`} aria-hidden />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h3 className="text-sm font-bold text-white">{rung.name}</h3>
                    <span className={`text-[10px] font-black uppercase tracking-[0.16em] ${rung.text}`}>
                      {rung.moves}
                    </span>
                  </div>
                  <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{rung.detail}</p>
                  <div className="mt-2 text-[11px] font-semibold uppercase tracking-wider text-white/45">
                    Typical cost · {rung.cost}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-4 rounded-xl border border-sky-400/25 bg-sky-500/[0.06] p-4 text-sm leading-relaxed text-white/70">
            <span className="font-bold text-sky-200">Buy the reporting, not the logo. </span>
            Before you pay for anything on this ladder, ask one question in writing: which bureaus do you report to, and
            how often? A card, loan, or rent service that does not furnish data is a subscription, not a credit builder.
          </p>
        </section>

        {/* ── Scoring weights ──────────────────────────────────────── */}
        <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold tracking-tight text-white">What the score is made of</h2>
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Classic FICO weights · VantageScore differs</span>
          </div>
          <div className="mt-4 space-y-3">
            {WEIGHTS.map((w) => (
              <div key={w.label} className="grid items-center gap-2 md:grid-cols-[150px_1fr_44px_1fr] md:gap-4">
                <div className="text-sm font-bold text-white/90">{w.label}</div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.07]">
                  <div className={`h-full rounded-full ${w.bar}`} style={{ width: `${(w.pct / 35) * 100}%` }} />
                </div>
                <div className="text-sm font-black tabular-nums text-white/85">{w.pct}%</div>
                <div className="text-xs leading-relaxed text-white/55">{w.note}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Statement-date timeline ──────────────────────────────── */}
        <section className="rounded-[1.25rem] border border-emerald-400/25 bg-emerald-500/[0.05] p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold tracking-tight text-white">The statement-date trick</h2>
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Pay before it cuts, not just before it is due</span>
          </div>
          <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
            The bureaus see your statement balance — not what you spent, and not what you owe today. Move the payment a
            few days earlier and the same spending reports far better.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-4">
            {TIMELINE.map((step, i) => (
              <div key={step.label} className="relative rounded-xl border border-white/10 bg-black/30 p-3.5">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${step.dot}`} aria-hidden />
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/40">
                    Step {i + 1}
                  </span>
                </div>
                <div className={`mt-1.5 text-sm font-bold ${step.tone}`}>{step.label}</div>
                <p className="mt-1 text-xs leading-relaxed text-white/55">{step.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Download band ────────────────────────────────────────── */}
        <section className="rounded-[1.25rem] border border-amber-400/25 bg-gradient-to-r from-amber-500/[0.08] to-transparent p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-white">Same paycheck. A file that finally shows it.</h2>
              <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{kit.summary}</p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => void onDownload()}
              className={`${FINELY_OS_PRIMARY_BTN} inline-flex items-center gap-2`}
            >
              <Download size={15} /> {busy ? 'Building PDF…' : kit.downloadLabel}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 border-t border-white/10 pt-4">
            <button
              type="button"
              onClick={() => navigate('/resources/personal-credit-restore-sheet')}
              className={FINELY_OS_SECONDARY_BTN}
            >
              Errors on your report? 3-sheet restore kit
            </button>
            <button
              type="button"
              onClick={() => navigate('/resources/au-teen-credit-sheet')}
              className={FINELY_OS_SECONDARY_BTN}
            >
              AU &amp; teen 2-sheet parent kit
            </button>
            <button type="button" onClick={() => navigate('/tradelines')} className={FINELY_OS_SECONDARY_BTN}>
              AU tradeline marketplace
            </button>
          </div>

          <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-4`}>
            Results vary · not legal advice · not a score guarantee. Approval for any product is the issuer&apos;s
            decision.
          </p>
        </section>

        <MarketingStaffChatStrip
          roleId="education_coach"
          goal="personal"
          roleLabel="credit education"
          subline="Not sure which rung you are on? Ask before you open another account."
        />
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
