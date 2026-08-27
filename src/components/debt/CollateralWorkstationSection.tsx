import React from 'react';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_ENTITY_VALUE } from '../../features/os/finelyOsLightUi';

export function CollateralWorkstationSection({
  title,
  subtitle,
  children,
  accent = 'white',
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accent?: 'amber' | 'rose' | 'emerald' | 'fuchsia' | 'sky' | 'violet' | 'white';
}) {
  const border =
    accent === 'amber'
      ? 'border-sky-500/20'
      : accent === 'rose'
        ? 'border-rose-500/20'
        : accent === 'emerald'
          ? 'border-emerald-500/20'
          : accent === 'fuchsia'
            ? 'border-fuchsia-500/20'
            : accent === 'sky'
              ? 'border-sky-500/20'
              : accent === 'violet'
                ? 'border-violet-500/20'
                : 'border-white/10';

  return (
    <section className={`rounded-2xl border ${border} bg-black/20 p-4 sm:p-5 space-y-3`}>
      <div>
        <h3 className={`text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{title}</h3>
        {subtitle ? <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{subtitle}</p> : null}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

export function DebtVsDisputeExplainer({
  variant,
  hub = 'debt',
}: {
  variant: 'foreclosure' | 'repossession' | 'debt';
  hub?: 'credit' | 'debt';
}) {
  const copy =
    hub === 'credit'
      ? variant === 'foreclosure'
        ? {
            title: 'Credit Letters — bureau track',
            body: 'These drafts go to Experian, Equifax, TransUnion, specialty CRAs, or a § 623 furnisher for reporting accuracy. Servicer QWRs, dual-track stops, and foreclosure answers stay under Debt Letters.',
          }
        : variant === 'repossession'
          ? {
              title: 'Credit Letters — bureau track',
              body: 'These drafts go to the bureaus, specialty CRAs, or a § 623 furnisher for repo/deficiency reporting accuracy. UCC sale notices, reinstatement, and deficiency demands to the lender stay under Debt Letters.',
            }
          : {
              title: 'Credit Letters — bureau track',
              body: 'Bureau and specialty-CRA disputes fix how accounts appear on consumer reports. Collector validation and court work live under Debt Letters.',
            }
      : variant === 'foreclosure'
        ? {
            title: 'Debt Letters — institution track',
            body: 'This page tracks your mortgage servicer / foreclosure matter. Bureau cleanup for how the foreclosure appears on Experian, Equifax, or TransUnion lives under Credit Letters → Foreclosure.',
          }
        : variant === 'repossession'
          ? {
              title: 'Debt Letters — institution track',
              body: 'This page tracks your auto loan, lease, or repossession matter with the lender/collector. Bureau cleanup for repo status or deficiency on your credit report lives under Credit Letters → Repossession.',
            }
          : {
              title: 'Debt case vs bureau dispute',
              body: 'A debt case is for collectors, lawsuits, and validation letters. A bureau dispute case tracks credit-report corrections with the bureaus — different workflows, both available in Finely Cred.',
            };

  return (
    <div className="rounded-xl border border-sky-500/25 bg-sky-500/8 px-4 py-3">
      <div className={`text-[10px] font-bold uppercase tracking-widest ${FINELY_OS_ENTITY_SUBLABEL}`}>{copy.title}</div>
      <p className={`mt-1.5 text-xs leading-relaxed ${FINELY_OS_ENTITY_BODY}`}>{copy.body}</p>
    </div>
  );
}
