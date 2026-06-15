import React from 'react';
import { AlertTriangle, Clock, FileText, Scale } from 'lucide-react';
import type { DebtCase } from '../../domain/debt';
import { listDebtWorkflowTimers } from '../../lib/debtWorkflowEngine';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_SECONDARY_BTN,
  finelyOsGlassShell,
} from '../../features/os/finelyOsLightUi';

export function DebtWorkflowPanel({
  debt,
  onOpenValidationDraft,
}: {
  debt: DebtCase;
  onOpenValidationDraft?: () => void;
}) {
  const timers = listDebtWorkflowTimers(debt);
  const hasUrgentClock = timers.some((t) => t.tone !== 'ok');

  if (timers.length === 0) return null;

  return (
    <div className={`space-y-3 ${finelyOsGlassShell('panel', 'fuchsia')}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
          <Scale size={14} className="text-fuchsia-300" /> Casey · Debt workflow timers
        </div>
        {hasUrgentClock && onOpenValidationDraft ? (
          <button
            type="button"
            className={`inline-flex items-center gap-2 ${FINELY_OS_SECONDARY_BTN} !py-2 !px-3 text-xs`}
            onClick={onOpenValidationDraft}
            title="Build a validation or summons response letter draft from your profile"
          >
            <FileText size={14} />
            Draft validation letter
          </button>
        ) : null}
      </div>
      <ul className="space-y-2">
        {timers.map((t) => (
          <li
            key={t.kind}
            className={`rounded-xl border px-4 py-3 text-sm ${
              t.tone === 'blocking'
                ? 'border-rose-500/35 bg-rose-500/10 text-rose-100'
                : t.tone === 'warning'
                  ? 'border-amber-500/35 bg-amber-500/10 text-amber-100'
                  : 'border-fuchsia-500/25 bg-fuchsia-500/10 text-fuchsia-100'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className={`${FINELY_OS_ENTITY_VALUE} font-semibold`}>{t.label}</span>
              <span className="inline-flex items-center gap-1 text-xs opacity-90">
                {t.tone !== 'ok' ? <AlertTriangle size={12} /> : <Clock size={12} />}
                {t.daysRemaining <= 0
                  ? 'Past deadline — act now'
                  : `${t.daysRemaining} day${t.daysRemaining === 1 ? '' : 's'} left`}
              </span>
            </div>
            <div className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
              Due {new Date(t.dueAt).toLocaleDateString()} · Educational only — verify local rules with counsel.
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
