import React from 'react';
import { PenLine, Save } from 'lucide-react';
import { FINELY_OS_SECONDARY_BTN, FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL } from '../../features/os/finelyOsLightUi';
import { FinelyOsModalCloseButton } from '../../features/os/FinelyOsModalCloseButton';

export function ValidationCreditHandoffStrip({
  debtName,
  matchCount,
  onEditDisputes,
  onSaveDisputes,
  onDismiss,
}: {
  debtName: string;
  matchCount: number;
  onEditDisputes: () => void;
  onSaveDisputes: () => void;
  onDismiss: () => void;
}) {
  const name = debtName.trim() || 'this collector';

  return (
    <div
      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-500/35 bg-emerald-500/[0.08] !p-3"
      role="status"
      data-fc-validation-handoff-strip="1"
    >
      <div className={`min-w-0 flex-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>
        {matchCount > 0 ? (
          <>
            We matched{' '}
            <span className="font-semibold text-emerald-600">{matchCount}</span> bureau line item
            {matchCount === 1 ? '' : 's'} for <span className={`font-semibold text-[color:var(--fc-os-entity-ink)]`}>{name}</span>.
          </>
        ) : (
          <>
            No bureau line items matched for <span className={`font-semibold text-[color:var(--fc-os-entity-ink)]`}>{name}</span> — pick disputes
            manually.
          </>
        )}
        <span className={`mt-0.5 block text-xs ${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-normal`}>Confirm selections, attach proof, then save your bureau PDF when you mail.</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onEditDisputes}
          className={`${FINELY_OS_SECONDARY_BTN} !py-2 gap-1.5 text-[10px]`}
        >
          <PenLine size={14} /> Edit disputes
        </button>
        <button
          type="button"
          onClick={onSaveDisputes}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-400/40 bg-emerald-500/15 px-3 py-2 text-[10px] font-black uppercase tracking-widest text-emerald-100 hover:bg-emerald-500/25 transition-all"
        >
          <Save size={14} /> Save disputes
        </button>
        <FinelyOsModalCloseButton onClick={onDismiss} aria-label="Dismiss handoff notice" iconSize={16} />
      </div>
    </div>
  );
}
