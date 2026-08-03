/**
 * `/resources/au-teen-credit-sheet`
 *
 * Dedicated home for the 2-sheet Authorized User & Teen Credit parent kit. Visual language is a
 * card gallery: real plastic-card mockups, an issuer policy matrix, and a birthday timeline —
 * deliberately unlike the restore dossier and the build blueprint.
 */
import React, { useState } from 'react';
import { ArrowRight, BadgeCheck, Download, PhoneCall, ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { MarketingStaffChatStrip } from '../../components/marketing/MarketingStaffChatStrip';
import { usePublicSeoMeta } from '../../hooks/usePublicSeoMeta';
import { AU_TEEN_CREDIT_SHEET, downloadAuTeenCreditSheet } from '../../resources/buildAuTeenCreditSheetPdf';
import {
  FINELY_OS_COMPLIANCE_FOOTNOTE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
} from '../../features/os/finelyOsLightUi';
import '../../components/landing/landingSellBands.css';

type ReportingTone = 'likely' | 'unlikely' | 'varies';

const TONE_CLASS: Record<ReportingTone, string> = {
  likely: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-200',
  unlikely: 'border-rose-400/35 bg-rose-500/10 text-rose-200',
  varies: 'border-violet-400/35 bg-violet-500/10 text-violet-200',
};

/**
 * Educational summary of publicly discussed issuer practice. Policies change without notice and
 * the issuer is the only authority — the sheet and this table both say so out loud.
 */
const ISSUERS: { issuer: string; minAge: string; reports: string; tone: ReportingTone; note: string }[] = [
  {
    issuer: 'American Express',
    minAge: 'About 13',
    reports: 'Often not for minors',
    tone: 'unlikely',
    note: 'Great for teaching habits early — do not expect a bureau line before 18.',
  },
  {
    issuer: 'U.S. Bank',
    minAge: 'About 13',
    reports: 'Varies',
    tone: 'varies',
    note: 'Low age bar. Ask directly whether a minor authorized user is furnished.',
  },
  {
    issuer: 'Discover',
    minAge: 'About 15',
    reports: 'Generally yes',
    tone: 'likely',
    note: 'Publishes an age floor and commonly furnishes authorized user data.',
  },
  {
    issuer: 'Capital One',
    minAge: 'No stated minimum',
    reports: 'Varies',
    tone: 'varies',
    note: 'No published age floor, but minor-AU reporting is inconsistently confirmed — call and get today\'s answer before you count on it.',
  },
  {
    issuer: 'Chase',
    minAge: 'No stated minimum',
    reports: 'Often not for minors',
    tone: 'unlikely',
    note: 'Easy to add at any age; the line frequently does not surface until 18.',
  },
  {
    issuer: 'Bank of America',
    minAge: 'No stated minimum',
    reports: 'Generally yes',
    tone: 'likely',
    note: 'Confirm the line is furnished to all three bureaus, not just one.',
  },
  {
    issuer: 'Citi',
    minAge: 'No stated minimum',
    reports: 'Generally yes',
    tone: 'likely',
    note: 'Verify which bureaus receive the data before you plan around it.',
  },
  {
    issuer: 'Wells Fargo',
    minAge: 'No stated minimum',
    reports: 'Varies',
    tone: 'varies',
    note: 'Policy has shifted over time — call and get the current answer.',
  },
];

const GATES = [
  {
    title: 'The issuer allows the age',
    body: 'Some publish a floor, some do not. Ask before you apply rather than after you have paid for anything.',
  },
  {
    title: 'The issuer furnishes AU data',
    body: 'Adding someone to your account and reporting them to a bureau are two separate issuer decisions.',
  },
  {
    title: 'A credit file exists to match',
    body: 'Bureaus do not open files for minors. Without a matching identity record the line has nowhere to land.',
  },
  {
    title: 'The data actually matches',
    body: 'Name, date of birth, and Social Security number must line up. A typo quietly sends the line nowhere.',
  },
] as const;

const CHECKLIST = [
  'Issuer confirmed the minimum age in writing',
  'Issuer confirmed it furnishes AU lines to all three bureaus',
  'Account utilization is under 30% and staying there',
  'Account has zero late payments across its full history',
  'The card is old enough that its age is worth lending',
  'Teen\'s legal name, date of birth, and SSN verified',
  'Decided whether they get a physical card at all',
  'Calendared a report check in 60–90 days',
] as const;

const INHERIT = [
  'Your late payments can attach to their file exactly the way your on-time payments do.',
  'If you run the balance up, their utilization optics go up with it.',
  'A charge-off or closure on your account can follow onto the line you lent them.',
  'Adding a young or thin account can pull their average age down instead of up.',
] as const;

const RETAIN = [
  'Every dollar spent is legally yours to repay — authorized user status carries no liability for them.',
  'You can remove an authorized user with one call, usually effective immediately.',
  'Removal typically drops the line from their file; history built elsewhere stays theirs.',
  'Never pay for a placement you cannot verify, unwind, or see reported.',
] as const;

const HANDOFF = [
  { when: 'Age 16–17', what: 'Teach statements', body: 'Read the statement together monthly. Show what utilization looks like on a real card.' },
  { when: 'Turning 18', what: 'Check the file', body: 'Pull all three reports at annualcreditreport.com and see whether the AU line actually appears.' },
  { when: 'First 90 days', what: 'Open their own', body: 'A student or secured card in their name. The AU line supports it; it cannot replace it.' },
  { when: 'Months 4–9', what: 'Build their history', body: 'One small recurring charge, autopay on, paid before the statement cuts every cycle.' },
  { when: 'Month 12', what: 'Unwind cleanly', body: 'Once their own accounts carry the file, remove the AU line and let their record stand alone.' },
] as const;

export default function AuTeenCreditSheetPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const kit = AU_TEEN_CREDIT_SHEET;

  usePublicSeoMeta({
    title: 'Authorized User & Teen Credit — 2-Sheet Parent Kit',
    description:
      'Free 2-sheet authorized user and teen credit parent kit: issuer minimum ages including the ~13 policies, which issuers commonly report a minor AU and which do not, the four gates an AU line must clear, a parent checklist, and the 18th-birthday handoff plan.',
    path: kit.route,
  });

  const onDownload = async () => {
    setBusy(true);
    setErr(null);
    try {
      await downloadAuTeenCreditSheet();
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
      title="Authorized User & Teen Credit — 2-Sheet Parent Kit"
      subtitle="Issuer ages, reporting reality, and the 18th-birthday handoff."
    >
      <div className={`${FINELY_OS_PAGE} fc-senior-simple`}>
        {/* ── Card gallery hero ────────────────────────────────────── */}
        <section className="relative overflow-hidden rounded-[1.5rem] border border-amber-400/25 bg-gradient-to-br from-[#0b1020]/95 via-[#080b16]/95 to-[#05070f]/98 p-6 lg:p-8">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_50%_at_100%_0%,rgba(224,178,74,0.14),transparent_58%)]" />
          <div className="relative grid gap-7 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.28em] text-amber-300">
                Authorized user + teen credit · {kit.sheetLabel} parent kit
              </div>
              <h1 className="mt-3 text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                Added is not the same as <span className="text-amber-300">reported.</span>
              </h1>
              <p className={`mt-3 ${FINELY_OS_ENTITY_BODY}`}>
                Adding a teenager as an authorized user takes five minutes. Whether that line ever appears on a credit
                file depends on the issuer, the age of the child, and whether a file exists to attach it to. This kit
                gives you all three answers before you spend anything.
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
                <button type="button" onClick={() => navigate('/tradelines')} className={FINELY_OS_SECONDARY_BTN}>
                  Browse AU inventory
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/free-tradeline-guide')}
                  className={`${FINELY_OS_SECONDARY_BTN} inline-flex items-center gap-2`}
                >
                  Free tradeline guide <ArrowRight size={14} />
                </button>
              </div>
              {err ? <p className="mt-3 text-sm text-rose-300">{err}</p> : null}
              <p className="mt-3 text-xs text-white/45">
                Free · no signup · {kit.pageCount} pages · issuer policies verified by you, with the issuer
              </p>
            </div>

            {/* Plastic-card mock, borrowed from the homepage AU band */}
            <div className="mx-auto w-full max-w-[19rem]">
              <article className="fc-au-card fc-au-card--obsidian">
                <div className="fc-au-card__top">
                  <div className="min-w-0">
                    <p className="fc-au-card__issuer">Parent primary account</p>
                    <p className="fc-au-card__tier mt-1">Seasoned Revolving</p>
                  </div>
                  <span className="fc-au-card__badge">Authorized user</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="fc-au-card__chip" aria-hidden />
                  <span className="fc-au-card__pan">•••• •••• •••• 1318</span>
                </div>
                <div className="fc-au-card__bottom">
                  <div className="flex gap-5">
                    <div>
                      <p className="fc-au-card__stat-label">Min AU age</p>
                      <p className="fc-au-card__stat-value">~13</p>
                    </div>
                    <div>
                      <p className="fc-au-card__stat-label">Reports minor</p>
                      <p className="fc-au-card__stat-value">Varies</p>
                    </div>
                    <div>
                      <p className="fc-au-card__stat-label">Removal</p>
                      <p className="fc-au-card__stat-value">1 call</p>
                    </div>
                  </div>
                  <span className="fc-au-card__network" aria-hidden>
                    <span />
                    <span />
                  </span>
                </div>
              </article>
              <p className="fc-au-card-caption">
                Illustrative card · not live inventory · issuer policies vary and change without notice
              </p>
            </div>
          </div>
        </section>

        {/* ── Three truths ─────────────────────────────────────────── */}
        <section className="grid gap-4 md:grid-cols-3">
          {[
            {
              figure: '13',
              label: 'Youngest commonly allowed',
              body: 'American Express and U.S. Bank set minimum authorized user ages around 13. Several issuers publish no minimum at all.',
              edge: 'border-amber-400/30',
              ink: 'text-amber-200',
            },
            {
              figure: '18',
              label: 'When reporting gets reliable',
              body: 'Some issuers — Chase and Amex among them — commonly do not furnish a minor\'s AU line to the bureaus until adulthood.',
              edge: 'border-rose-400/30',
              ink: 'text-rose-200',
            },
            {
              figure: '0',
              label: 'Guarantees available',
              body: 'No issuer promises to report an authorized user, and none promise a score effect. Treat any claim otherwise as a sales pitch.',
              edge: 'border-emerald-400/30',
              ink: 'text-emerald-200',
            },
          ].map((tile) => (
            <article key={tile.figure} className={`rounded-[1.25rem] border ${tile.edge} bg-black/30 p-5`}>
              <div className={`text-4xl font-black tabular-nums ${tile.ink}`}>{tile.figure}</div>
              <div className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-white/55">{tile.label}</div>
              <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>{tile.body}</p>
            </article>
          ))}
        </section>

        {/* ── Issuer matrix ────────────────────────────────────────── */}
        <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold tracking-tight text-white">Issuer minimum age + reporting matrix</h2>
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Educational summary · policies change without notice</span>
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
            <div className="hidden bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-200/80 lg:grid lg:grid-cols-[150px_150px_160px_1fr] lg:gap-4">
              <span>Issuer</span>
              <span>Minimum AU age</span>
              <span>Reports a minor AU?</span>
              <span>What that means for you</span>
            </div>
            {ISSUERS.map((row, i) => (
              <div
                key={row.issuer}
                className={`grid gap-2 px-4 py-3 lg:grid-cols-[150px_150px_160px_1fr] lg:items-center lg:gap-4 ${
                  i % 2 === 1 ? 'bg-white/[0.02]' : ''
                }`}
              >
                <span className="text-sm font-bold text-white">{row.issuer}</span>
                <span className="text-sm text-white/70">{row.minAge}</span>
                <span
                  className={`inline-flex w-fit rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${TONE_CLASS[row.tone]}`}
                >
                  {row.reports}
                </span>
                <span className="text-sm leading-relaxed text-white/60">{row.note}</span>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-start gap-3 rounded-xl border border-rose-400/25 bg-rose-500/[0.06] p-4">
            <PhoneCall size={16} className="mt-0.5 shrink-0 text-rose-300" />
            <p className="text-sm leading-relaxed text-white/70">
              <span className="font-bold text-rose-200">Confirm it yourself, in writing. </span>
              Call the number on the back of the card and ask two questions: what is your minimum authorized user age,
              and do you report authorized users under 18 to Equifax, Experian, and TransUnion? Write down the date and
              the answer. Issuer policy is the only source that counts, and nobody selling a tradeline can override it.
            </p>
          </div>
        </section>

        {/* ── Four gates ───────────────────────────────────────────── */}
        <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold tracking-tight text-white">The four gates an AU line must clear</h2>
            <span className={FINELY_OS_ENTITY_SUBLABEL}>All four, or nothing reaches the file</span>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {GATES.map((gate, i) => (
              <article key={gate.title} className="rounded-xl border border-teal-400/25 bg-teal-500/[0.05] p-4">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-teal-400 text-xs font-black text-[#05070f]">
                  {i + 1}
                </span>
                <h3 className="mt-2.5 text-sm font-bold text-white">{gate.title}</h3>
                <p className="mt-1 text-xs leading-relaxed text-white/60">{gate.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ── Checklist + risk ─────────────────────────────────────── */}
        <section className="grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[1.25rem] border border-amber-400/25 bg-black/25 p-5">
            <h2 className="flex items-center gap-2 text-base font-bold text-amber-200">
              <BadgeCheck size={16} /> Setup checklist — all eight before you add anyone
            </h2>
            <ul className="mt-3 space-y-2">
              {CHECKLIST.map((item) => (
                <li key={item} className="flex gap-2.5 text-sm leading-relaxed text-white/70">
                  <span className="mt-1 h-3.5 w-3.5 shrink-0 rounded border border-amber-400/50" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.25rem] border border-rose-400/25 bg-rose-500/[0.05] p-5">
              <h2 className="flex items-center gap-2 text-base font-bold text-rose-200">
                <ShieldAlert size={15} /> What they inherit from you
              </h2>
              <ul className="mt-3 space-y-2">
                {INHERIT.map((line) => (
                  <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-white/70">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-[1.25rem] border border-violet-400/25 bg-violet-500/[0.05] p-5">
              <h2 className="text-base font-bold text-violet-200">What you keep carrying</h2>
              <ul className="mt-3 space-y-2">
                {RETAIN.map((line) => (
                  <li key={line} className="flex gap-2.5 text-sm leading-relaxed text-white/70">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" aria-hidden />
                    {line}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Handoff timeline ─────────────────────────────────────── */}
        <section className="rounded-[1.25rem] border border-white/10 bg-black/25 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold tracking-tight text-white">The 18th-birthday handoff</h2>
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Plan the exit before you need it</span>
          </div>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            {HANDOFF.map((step) => (
              <li key={step.when} className="rounded-xl border border-white/10 bg-black/35 p-4">
                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-violet-300">{step.when}</div>
                <h3 className="mt-1.5 text-sm font-bold text-white">{step.what}</h3>
                <p className="mt-1 text-xs leading-relaxed text-white/60">{step.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Download band ────────────────────────────────────────── */}
        <section className="rounded-[1.25rem] border border-amber-400/25 bg-gradient-to-r from-amber-500/[0.08] to-transparent p-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="text-lg font-bold tracking-tight text-white">Know before you add them.</h2>
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
            <button type="button" onClick={() => navigate('/tradelines?focus=au')} className={FINELY_OS_SECONDARY_BTN}>
              AU tradeline marketplace
            </button>
            <button
              type="button"
              onClick={() => navigate('/resources/personal-credit-build-sheet')}
              className={FINELY_OS_SECONDARY_BTN}
            >
              2-sheet build blueprint
            </button>
            <button type="button" onClick={() => navigate('/au-sellers')} className={FINELY_OS_SECONDARY_BTN}>
              List your card as an AU seller
            </button>
          </div>

          <p className={`${FINELY_OS_COMPLIANCE_FOOTNOTE} mt-4`}>
            Results vary · not legal, tax, or financial advice · authorized user reporting is never automatic and no
            score outcome is promised. Issuer age rules and bureau reporting practices change without notice.
          </p>
        </section>

        <MarketingStaffChatStrip
          roleId="education_coach"
          goal="tradelines"
          roleLabel="tradeline education"
          subline="Wondering whether your card will actually report your teen? Ask before you add them."
        />
        <FinelyOsPageFooter />
      </div>
    </PageShell>
  );
}
