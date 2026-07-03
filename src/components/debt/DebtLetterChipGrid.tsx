import React from 'react';
import type { DebtLetterType } from '../../domain/debtLegal';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_VALUE, FINELY_OS_LETTER_CHIP_BTN, finelyOsGlowTile, type FinelyOsGlowAccent } from '../../features/os/finelyOsLightUi';

type Spec = { id: DebtLetterType; title: string; shortDescription: string };

export function DebtLetterChipGrid({
  specs,
  onBuild,
  buildLabel = 'Draft',
  glowAccent = 'violet',
}: {
  specs: Spec[];
  onBuild: (id: DebtLetterType) => void;
  buildLabel?: string;
  glowAccent?: FinelyOsGlowAccent;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
      {specs.map((spec) => (
        <div key={spec.id} className={`${finelyOsGlowTile(glowAccent)} p-3 flex flex-col gap-2 min-h-[5.5rem]`}>
          <div className={`text-[11px] font-semibold leading-snug line-clamp-2 ${FINELY_OS_ENTITY_VALUE}`}>{spec.title}</div>
          <p className={`text-[10px] line-clamp-2 flex-1 ${FINELY_OS_ENTITY_BODY}`}>{spec.shortDescription}</p>
          <button type="button" className={`${FINELY_OS_LETTER_CHIP_BTN} self-start`} onClick={() => onBuild(spec.id)}>
            {buildLabel}
          </button>
        </div>
      ))}
    </div>
  );
}
