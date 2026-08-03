/**
 * `/resources/personal-credit-restore-sheet`
 *
 * Dedicated home for the 3-sheet Personal Credit Restore field kit. Visual language is a case
 * dossier: punched index rail, stamped sheet tabs, and a statute ledger — deliberately unlike the
 * blueprint (build) and card-gallery (AU/teen) sheet pages.
 */
import React, { useState } from 'react';
import { ArrowRight, Download, FileWarning, Gavel, ScrollText, Stamp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { MarketingStaffChatStrip } from '../../components/marketing/MarketingStaffChatStrip';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import {
  PERSONAL_CREDIT_RESTORE_SHEET,
  downloadPersonalCreditRestoreSheet,
} from '../../resources/buildPersonalCreditRestoreSheetPdf';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';

const SHEET_ACCENTS = [
  { rail: 'bg-rose-500/80', text: 'text-rose-200', border: 'border-rose-400/30', glow: 'from-rose-500/12' },
  { rail: 'bg-amber-500/80', text: 'text-amber-200', border: 'border-amber-400/30', glow: 'from-amber-500/12' },
  { rail: 'bg-emerald-500/80', text: 'text-emerald-200', border: 'border-emerald-400/30', glow: 'from-emerald-500/12' },
] as const;

const STATUTES = [
  {
    cite: 'FCRA § 609',
    right: 'Full file disclosure',
    use: 'Demand everything the bureau holds — including who furnished each item — not the consumer-friendly summary.',
  },
  {
    cite: 'FCRA § 611',
    right: 'Reinvestigation in 30 days',
    use: 'Unverifiable items must be deleted or modified. Adding evidence mid-window extends the clock to 45 days.',
  },
  {
    cite: 'FCRA § 623',
    right: 'Furnisher must investigate',
    use: 'The creditor or collector has its own duty. Dispute with them too when a bureau answers "verified" with no detail.',
  },
  {
    cite: 'FCRA § 605',
    right: 'Reporting time limits',
    use: 'Most negatives fall off at seven years, Chapter 7 at ten from filing. Age every item and challenge the stragglers.',
  },
  {
    cite: 'FDCPA § 809',
    right: 'Debt validation',
    use: 'Within 30 days of a collector\'s first contact, demand verification in writing. Collection activity pauses until they produce it.',
  },
] as const;

const FITS = [
  'Your report has late payments, collections, or charge-offs you believe are wrong',
  'A closed account still shows a balance, or the same debt appears twice',
  'Something is reporting past the seven-year window',
  'A collector called and you have not started the validation clock',
  'You have disputed before and got a one-line "verified" back',
] as const;

const NOT_FOR = [
  'Balances you genuinely owe and want removed anyway — accurate items stay',
  'Anyone hoping for a promised deletion, score number, or deadline',
  'An active lawsuit or summons — that belongs with licensed counsel in your state',
] as const;

export default function PersonalCreditRestoreSheetPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const kit = PERSONAL_CREDIT_RESTORE_SHEET;

  usePublicSeoMeta({
    title: 'Personal Credit Restore — 3-Sheet Field Kit',
    description:
      'Free 3-sheet personal credit restore field kit: the FCRA and FDCPA rights you invoke, the round-one dispute sequence with reason language and evidence pairing, and the escalation ladder with a 90-day hold plan.',
    path: kit.route,
  });

  const onDownload = async () => {
    setBusy(true);
    setErr(null);
    try {
      await downloadPersonalCreditRestoreSheet();
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
      title="Personal Credit Restore — 3-Sheet Field Kit"
      subtitle="Three working sheets: read the file, run round one, escalate on the record."
    >
      <div className={`${FINELY_OS_PAGE} fc-senior-simple`}>
        {/* ── File jacket hero ─────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-[1.5rem] border border-rose-400/25 bg-gradient-to-br from-[#141013]/95 via-[#0d0e12]/95 to-[#0a0b0f]/98">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_0%_0%,rgba(244,63,94,0.14),transparent_60%)]" />
          <div className="relative flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:p-8">
            <div className="min-w-0 max-w-2xl">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.28em] text-rose-300">
                <ScrollText size={13} /> Personal credit restore · {kit.sheetLabel} field kit
              </div>
              <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                Pull the file. Name the finding.{' '}
                <span className="text-rose-300">Escalate on the record.</span>
              </h1>
              <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>
                A restore file is won on paper. These three sheets give you the statutes you actually invoke, the
                round-one sequence that gets taken seriously, and the ladder you climb when a bureau stonewalls — plus a
                findings ledger you fill in by hand before a single letter goes out.
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
                  onClick={() => navigate('/free-guide')}
                  className={`${FINELY_OS_SECONDARY_BTN} inline-flex items-center gap-2`}
                >
                  Read the free dispute guide
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/enlightenment-session')}
                  className={`${FINELY_OS_SECONDARY_BTN} inline-flex items-center gap-2`}
                >
                  Have us run it with you <ArrowRight size={14} />
                </button>
              </div>
              {err ? <p className="mt-3 text-sm text-rose-300">{err}</p> : null}
              <p className="mt-3 text-xs text-white/45">
                Free · no signup · {kit.pageCount} pages · opens as a PDF in your browser
              </p>
            </div>

            {/* Rubber-stamp block */}
            <div className="shrink-0 rounded-2xl border-2 border-rose-400/40 bg-black/30 p-5 text-center">
              <Stamp size={18} className="mx-auto text-rose-300" />
              <div className="mt-2 text-4xl font-black tabular-nums text-rose-200">{kit.pageCount}</div>
              <div className="text-[10px] font-black uppercase tracking-[0.26em] text-white/55">Sheets</div>
              <div className="mt-3 border-t border-white/10 pt-3 text-[10px] uppercase tracking-[0.2em] text-white/45">
                Read · Draft · Escalate
              </div>
            </div>
          </div>
        </section>

        {/* ── Index rail: what's on each sheet ─────────────────────── */}
        <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold tracking-tight text-white">What is on each sheet</h2>
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Honest page count — three pages, three jobs</span>
          </div>

          <ol className="mt-4 space-y-3">
            {kit.pages.map((page, i) => {
              const accent = SHEET_ACCENTS[i % SHEET_ACCENTS.length]!;
              return (
                <li
                  key={page.n}
                  className={`relative flex gap-4 overflow-hidden rounded-2xl border ${accent.border} bg-gradient-to-r ${accent.glow} to-transparent p-4`}
                >
                  <span className={`absolute left-0 top-0 h-full w-1 ${accent.rail}`} aria-hidden />
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-black/40 text-lg font-black tabular-nums text-white/85">
                    {page.n}
                  </span>
                  <div className="min-w-0">
                    <div className={`text-[10px] font-black uppercase tracking-[0.22em] ${accent.text}`}>
                      Sheet {page.n} of {kit.pageCount}
                    </div>
                    <h3 className="mt-0.5 text-base font-bold text-white">{page.title}</h3>
                    <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{page.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>

        {/* ── Statute ledger ───────────────────────────────────────── */}
        <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-white">
              <Gavel size={16} className="text-amber-300" /> The laws this kit puts to work
            </h2>
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Cite the duty — never a threat</span>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
            <div className="hidden bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/80 md:grid md:grid-cols-[130px_180px_1fr] md:gap-4">
              <span>Statute</span>
              <span>What it gives you</span>
              <span>How you actually use it</span>
            </div>
            {STATUTES.map((row, i) => (
              <div
                key={row.cite}
                className={`grid gap-1 px-4 py-3 md:grid-cols-[130px_180px_1fr] md:gap-4 ${
                  i % 2 === 1 ? 'bg-white/[0.02]' : ''
                }`}
              >
                <span className="text-sm font-bold text-amber-200">{row.cite}</span>
                <span className="text-sm font-semibold text-white/85">{row.right}</span>
                <span className="text-sm leading-relaxed text-white/65">{row.use}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Fit / not a fit ──────────────────────────────────────── */}
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-[1.25rem] border border-emerald-400/25 bg-emerald-500/[0.05] p-5">
            <h2 className="text-base font-bold text-emerald-200">You're in the right place if</h2>
            <ul className="mt-3 space-y-2">
              {FITS.map((line) => (
                <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-white/70">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[1.25rem] border border-rose-400/25 bg-rose-500/[0.05] p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-rose-200">
              <FileWarning size={15} /> Not the right fit for
            </h2>
            <ul className="mt-3 space-y-2">
              {NOT_FOR.map((line) => (
                <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-white/70">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" aria-hidden />
                  {line}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => navigate('/debt-summons-help')}
              className={`${FINELY_OS_SECONDARY_BTN} mt-4 inline-flex items-center gap-2`}
            >
              Sued or served? Start here <ArrowRight size={14} />
            </button>
          </div>
        </section>

        {/* ── Download band + onward paths ─────────────────────────── */}
        <section className="rounded-[1.25rem] border border-amber-400/25 bg-gradient-to-r from-amber-500/[0.08] to-transparent p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-white">Stop guessing. Start documenting.</h2>
              <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{kit.summary}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className={FINELY_OS_ENTITY_CHIP}>{kit.pageCount}-page PDF</span>
                <span className={FINELY_OS_ENTITY_CHIP}>No signup</span>
                <span className={FINELY_OS_ENTITY_CHIP}>Fill-in findings ledger</span>
              </div>
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
              onClick={() => navigate('/resources/personal-credit-build-sheet')}
              className={`${FINELY_OS_SECONDARY_BTN} inline-flex items-center gap-2`}
            >
              Next: the 2-sheet build blueprint
            </button>
            <button
              type="button"
              onClick={() => navigate('/resources/au-teen-credit-sheet')}
              className={FINELY_OS_SECONDARY_BTN}
            >
              AU &amp; teen 2-sheet parent kit
            </button>
            <button type="button" onClick={() => navigate('/resources')} className={FINELY_OS_SECONDARY_BTN}>
              All resources
            </button>
          </div>

          <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-4`}>
            Results vary · not legal advice · no deletion, score, or timeline is promised. Bureaus and furnishers decide
            outcomes on the evidence you document.
          </p>
        </section>

        <MarketingStaffChatStrip
          roleId="dispute_coach"
          goal="personal"
          roleLabel="restore"
          subline="Not sure which finding to dispute first? Ask before you mail round one."
        />
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
