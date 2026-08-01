import React, { useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, Gavel, ShieldAlert } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  buildPaymentSchedule,
  courtOutcomeBasisLabel,
  courtOutcomeHeadline,
  formatUsdCents,
  paymentPlanProgress,
  type PartnerCourtOutcome,
} from '../../domain/courtOutcomes';
import {
  POST_COURT_ESCALATION_TRIGGER_LABELS,
  buildPostCourtPlanSteps,
  postCourtEscalationForTrigger,
  postCourtPlanRiskFlags,
  type PostCourtEscalationTrigger,
} from '../../lib/postCourtPaymentPlanPath';
import { FinelyOsAlertBanner } from '../../features/os/FinelyOsAlertBanner';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowKpi,
} from '../../features/os/finelyOsLightUi';

const TRIGGERS: Array<PostCourtEscalationTrigger | 'all'> = [
  'all',
  'payment_missed',
  'improper_contact',
  'terms_disputed',
  'closeout_docs_missing',
];

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className={`${finelyOsGlowKpi('fuchsia')} px-3 py-2`}>
      <div className={FINELY_OS_ENTITY_SUBLABEL}>{label}</div>
      <div className="mt-0.5 text-lg font-black tracking-tight text-white tabular-nums">{value}</div>
      {hint ? <div className="text-[10px] text-white/50">{hint}</div> : null}
    </div>
  );
}

/**
 * Post-hearing command card — verdict, live plan progress, ordered next steps,
 * and the escalation ladder. Rendered in the portal court track and in the
 * admin partner workspace (both mount the litigation command view).
 */
export function PartnerCourtOutcomePanel({
  outcome,
  onConfirmPayment,
  onMarkOrderOnFile,
}: {
  outcome: PartnerCourtOutcome;
  onConfirmPayment?: (dueIso: string) => void;
  onMarkOrderOnFile?: () => void;
}) {
  const [trigger, setTrigger] = useState<PostCourtEscalationTrigger | 'all'>('all');

  const confirmedCount = outcome.confirmedPaymentIsos?.length ?? 0;
  const progress = useMemo(
    () => (outcome.plan ? paymentPlanProgress(outcome.plan, { confirmedCount }) : null),
    [outcome.plan, confirmedCount],
  );
  const schedule = useMemo(() => (outcome.plan ? buildPaymentSchedule(outcome.plan) : []), [outcome.plan]);
  const steps = useMemo(() => buildPostCourtPlanSteps(outcome), [outcome]);
  const riskFlags = useMemo(() => postCourtPlanRiskFlags(outcome), [outcome]);
  const ladder = useMemo(() => postCourtEscalationForTrigger(trigger), [trigger]);
  const currentStep = steps.find((s) => s.status === 'now') || steps[0]!;

  return (
    <section
      id="fc-court-outcome"
      className={`${finelyOsCatalogCardCompact('fuchsia')} !p-4 space-y-3 scroll-mt-4`}
      aria-label="Court outcome and payment plan"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-200/90">
            <Gavel size={13} /> Court outcome · matter closed
          </div>
          <div className="mt-1 text-xl font-semibold tracking-tight text-white">
            {courtOutcomeHeadline(outcome)}
          </div>
          <p className={`mt-1 max-w-2xl text-xs ${FINELY_OS_ENTITY_BODY}`}>
            <span className="text-fuchsia-200/90">{courtOutcomeBasisLabel(outcome.basis)}</span> ·{' '}
            {outcome.contextNote}
          </p>
          <p className="mt-1 text-[11px] text-white/45">
            Decided {outcome.decidedIso}
            {outcome.plaintiffName ? ` · ${outcome.plaintiffName}` : ''}
            {outcome.courtCaseNumber ? ` · case ${outcome.courtCaseNumber}` : ''} · Educational self-help · not
            legal advice
          </p>
        </div>
        <Link to="/portal/escalations" className={FINELY_OS_SECONDARY_BTN}>
          <ShieldAlert size={13} /> Escalate this plan
        </Link>
      </div>

      {riskFlags.length ? (
        <FinelyOsAlertBanner
          tone={riskFlags.some((f) => f.includes('not confirmed')) ? 'warning' : 'info'}
          message={riskFlags.join(' · ')}
        />
      ) : (
        <FinelyOsAlertBanner tone="success" message="Plan on track — every payment due so far is confirmed." />
      )}

      {progress && outcome.plan ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <Kpi label="Monthly" value={formatUsdCents(outcome.plan.monthlyCents)} hint="Due every month" />
          <Kpi
            label="Paid"
            value={`${progress.confirmedCount}/${outcome.plan.termMonths}`}
            hint={`${progress.percentComplete}% complete`}
          />
          <Kpi label="Remaining" value={formatUsdCents(progress.remainingCents)} hint="Still owed on the plan" />
          <Kpi label="Next due" value={progress.nextDueIso || '—'} hint={`Final ${progress.finalDueIso || '—'}`} />
        </div>
      ) : null}

      <div className={`${finelyOsCatalogCardCompact('amber')} !p-3`}>
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-amber-200/90`}>Do this next</div>
        <div className={`mt-1 text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
          {currentStep.n}. {currentStep.title}
        </div>
        <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{currentStep.nextAction}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {currentStep.href ? (
            <Link to={currentStep.href} className={`${FINELY_OS_PRIMARY_BTN} !py-1.5 !px-3 !text-[11px]`}>
              {currentStep.hrefLabel || 'Open'}
            </Link>
          ) : null}
          {!outcome.writtenOrderOnFile && onMarkOrderOnFile ? (
            <button type="button" onClick={onMarkOrderOnFile} className={`${FINELY_OS_SECONDARY_BTN} !text-[11px]`}>
              Mark written agreement on file
            </button>
          ) : null}
        </div>
      </div>

      <details className={`${finelyOsCatalogCardCompact('emerald')} !p-3 group`}>
        <summary className="cursor-pointer select-none list-none">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-200/90`}>Next steps</div>
              <div className={`mt-0.5 text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
                {steps.length} steps from today to a closed, clean file
              </div>
            </div>
            <span className="shrink-0 text-[10px] uppercase tracking-widest text-white/40 group-open:text-emerald-300/80">
              Expand
            </span>
          </div>
        </summary>
        <ol className="mt-3 space-y-2 border-t border-white/10 pt-3">
          {steps.map((s) => (
            <li
              key={s.id}
              className={`rounded-xl border px-3 py-2 ${
                s.status === 'now'
                  ? 'border-amber-400/45 bg-amber-500/10'
                  : s.status === 'done'
                    ? 'border-emerald-400/35 bg-emerald-500/10'
                    : 'border-white/10 bg-black/25'
              }`}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black ${
                    s.status === 'now'
                      ? 'bg-amber-400 text-black'
                      : s.status === 'done'
                        ? 'bg-emerald-400 text-black'
                        : 'bg-white/10 text-white/70'
                  }`}
                >
                  {s.status === 'done' ? <CheckCircle2 size={12} /> : s.n}
                </span>
                <div className="min-w-0">
                  <div className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{s.title}</div>
                  <p className={`mt-0.5 text-xs ${FINELY_OS_ENTITY_BODY}`}>{s.plain}</p>
                  <p className="mt-1 text-xs text-amber-100/90">
                    <span className="font-semibold">Next: </span>
                    {s.nextAction}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <span className="text-[10px] uppercase tracking-widest text-white/40">{s.timing}</span>
                    {s.href ? (
                      <Link to={s.href} className={`${FINELY_OS_SECONDARY_BTN} !text-[11px]`}>
                        {s.hrefLabel || 'Open'}
                      </Link>
                    ) : null}
                    {s.externalUrl ? (
                      <a
                        href={s.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${FINELY_OS_SECONDARY_BTN} !text-[11px]`}
                      >
                        {s.externalLabel || 'Open link'} <ExternalLink size={11} />
                      </a>
                    ) : null}
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </details>

      <details className={`${finelyOsCatalogCardCompact('violet')} !p-3 group`}>
        <summary className="cursor-pointer select-none list-none">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-200/90`}>Escalation path</div>
              <div className={`mt-0.5 text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
                If a payment misses, contact turns improper, terms are wrong, or closeout papers never arrive
              </div>
            </div>
            <span className="shrink-0 text-[10px] uppercase tracking-widest text-white/40 group-open:text-violet-300/80">
              Expand
            </span>
          </div>
        </summary>
        <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
          <div className="flex flex-wrap gap-2">
            {TRIGGERS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTrigger(t)}
                className={`${trigger === t ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN} !py-1.5 !px-3 !text-[11px]`}
              >
                {t === 'all' ? 'All triggers' : POST_COURT_ESCALATION_TRIGGER_LABELS[t]}
              </button>
            ))}
          </div>

          <FinelyOsPaginatedStack
            items={ladder}
            pageSize={4}
            emptyMessage="No escalation levels match that trigger."
            renderItem={(s) => (
              <details key={`${s.level}-${s.title}`} className={`${finelyOsCatalogCardCompact('fuchsia')} !p-3 group`}>
                <summary className="cursor-pointer select-none list-none">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-fuchsia-200/90`}>
                        Level {s.level} · {POST_COURT_ESCALATION_TRIGGER_LABELS[s.trigger]}
                      </div>
                      <div className={`mt-0.5 text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{s.title}</div>
                      <p className={`mt-0.5 text-xs ${FINELY_OS_ENTITY_BODY}`}>{s.subtitle}</p>
                    </div>
                    <span className="shrink-0 text-[10px] uppercase tracking-widest text-white/40 group-open:text-fuchsia-300/80">
                      Expand
                    </span>
                  </div>
                </summary>
                <div className="mt-2 space-y-2 border-t border-white/10 pt-2">
                  <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                    <span className="text-emerald-200/90">Use when: </span>
                    {s.when}
                  </p>
                  <ol className={`list-decimal pl-4 space-y-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                    {s.actions.map((a) => (
                      <li key={a.slice(0, 42)}>{a}</li>
                    ))}
                  </ol>
                  <p className="text-xs text-white/60">
                    <span className="font-semibold text-white/80">Goes to: </span>
                    {s.escalateTo}
                    {s.timing ? ` · ${s.timing}` : ''}
                  </p>
                  <div className="rounded-lg border border-white/10 bg-black/25 px-3 py-2">
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Bring with you</div>
                    <ul className={`mt-1 list-disc pl-4 space-y-0.5 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                      {s.evidenceChecklist.map((e) => (
                        <li key={e.slice(0, 40)}>{e}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {s.href ? (
                      <Link to={s.href} className={`${FINELY_OS_SECONDARY_BTN} !text-[11px]`}>
                        {s.hrefLabel || 'Open'}
                      </Link>
                    ) : null}
                    {s.externalUrl ? (
                      <a
                        href={s.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${FINELY_OS_SECONDARY_BTN} !text-[11px]`}
                      >
                        File it <ExternalLink size={11} />
                      </a>
                    ) : null}
                  </div>
                </div>
              </details>
            )}
          />
        </div>
      </details>

      {schedule.length ? (
        <details className={`${finelyOsCatalogCardCompact('sky')} !p-3 group`}>
          <summary className="cursor-pointer select-none list-none">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-sky-200/90`}>Payment schedule</div>
                <div className={`mt-0.5 text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
                  {schedule.length} payments · {schedule[0]!.dueIso} → {schedule[schedule.length - 1]!.dueIso}
                </div>
              </div>
              <span className="shrink-0 text-[10px] uppercase tracking-widest text-white/40 group-open:text-sky-300/80">
                Expand
              </span>
            </div>
          </summary>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-1.5 border-t border-white/10 pt-3">
            {schedule.map((p) => {
              const paid = (outcome.confirmedPaymentIsos || []).includes(p.dueIso);
              return (
                <button
                  key={p.dueIso}
                  type="button"
                  disabled={!onConfirmPayment || paid}
                  onClick={() => onConfirmPayment?.(p.dueIso)}
                  className={`rounded-lg border px-2 py-1.5 text-left transition-colors ${
                    paid
                      ? 'border-emerald-400/40 bg-emerald-500/10'
                      : 'border-white/10 bg-black/25 hover:border-white/25'
                  } disabled:cursor-default`}
                >
                  <div className="text-[9px] uppercase tracking-widest text-white/40">Payment {p.n}</div>
                  <div className="text-xs font-semibold text-white/90 tabular-nums">{p.dueIso}</div>
                  <div className="text-[10px] text-white/50">
                    {formatUsdCents(p.amountCents)}
                    {paid ? ' · confirmed' : ''}
                  </div>
                </button>
              );
            })}
          </div>
        </details>
      ) : null}
    </section>
  );
}
