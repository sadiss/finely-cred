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
  accent?: 'amber' | 'rose' | 'emerald' | 'fuchsia' | 'white';
}) {
  const border =
    accent === 'amber'
      ? 'border-amber-500/20'
      : accent === 'rose'
        ? 'border-rose-500/20'
        : accent === 'emerald'
          ? 'border-emerald-500/20'
          : accent === 'fuchsia'
            ? 'border-fuchsia-500/20'
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

export function DebtVsDisputeExplainer({ variant }: { variant: 'foreclosure' | 'repossession' | 'debt' }) {
  const copy =
    variant === 'foreclosure'
      ? {
          title: 'Debt case vs bureau dispute',
          body: 'This page tracks your mortgage servicer / foreclosure matter (debt case). Bureau dispute cases are separate — use them only when you need to fix how the foreclosure appears on Experian, Equifax, or TransUnion.',
        }
      : variant === 'repossession'
        ? {
            title: 'Debt case vs bureau dispute',
            body: 'This page tracks your auto loan, lease, or repossession matter (debt case). Bureau dispute cases are separate — use them when the repo balance or status on your credit report is wrong.',
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
