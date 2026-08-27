import React from 'react';
import type { DebtCase } from '../../domain/debt';
import {
  fdcpaPowerChips,
  inferDebtPartyKind,
  type FdcpaPowerChip,
} from '../../lib/debtPartyKind';
import { getValidationAccountState } from '../../lib/validationAccountState';

const TONE: Record<FdcpaPowerChip['tone'], string> = {
  emerald: 'border-emerald-400/35 bg-emerald-500/10 text-emerald-100',
  amber: 'border-rose-400/35 bg-rose-500/10 text-rose-100',
  sky: 'border-sky-400/35 bg-sky-500/10 text-sky-100',
  rose: 'border-rose-400/35 bg-rose-500/10 text-rose-100',
};

type Props = {
  debt: DebtCase;
  /** Override when caller already knows mail was logged */
  validationMailed?: boolean;
  className?: string;
};

export function FdcpaPowerChips({ debt, validationMailed, className }: Props) {
  const state = getValidationAccountState(debt.id);
  const mailed =
    validationMailed ??
    Boolean(state?.mailedAt && (state.state === 'sent_awaiting' || state.state === 'response_logged' || state.state === 'deficient' || state.state === 'adequate' || state.state === 'no_response'));
  const partyKind = inferDebtPartyKind(debt);
  const chips = fdcpaPowerChips({
    partyKind,
    validationMailed: mailed,
    summonsOnFile: debt.type === 'summons',
  });

  if (!chips.length) return null;

  return (
    <div className={className ?? 'flex flex-wrap gap-2'}>
      {chips.map((chip) => (
        <div
          key={chip.id}
          className={`max-w-full rounded-xl border px-3 py-2 ${TONE[chip.tone]}`}
          title={chip.detail}
        >
          <div className="text-sm font-extrabold uppercase tracking-widest">{chip.label}</div>
          <p className="mt-1 text-base leading-snug text-white/80">{chip.detail}</p>
        </div>
      ))}
      <p className="w-full text-sm font-semibold text-white/55">
        Educational only · not legal advice · results vary · lawsuit outcomes are never guaranteed
      </p>
    </div>
  );
}
