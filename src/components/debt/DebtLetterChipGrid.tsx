import React from 'react';
import type { DebtLetterType } from '../../domain/debtLegal';
import {
  LETTER_TEMPLATE_CATALOG_GRID,
  LETTER_TEMPLATE_CATALOG_SHELL,
  LetterTemplateCatalogCard,
} from './LetterTemplateCatalogCard';

type Spec = { id: DebtLetterType; title: string; shortDescription: string };

export function DebtLetterChipGrid({
  specs,
  onBuild,
  buildLabel = 'Generate letter',
  title = 'Letter library',
  subtitle,
}: {
  specs: Spec[];
  onBuild: (id: DebtLetterType) => void;
  buildLabel?: string;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className={LETTER_TEMPLATE_CATALOG_SHELL}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[10px] font-black uppercase tracking-widest text-amber-200">{title}</span>
        <span className="text-[10px] text-white/50">
          {specs.length} letter pick{specs.length === 1 ? '' : 's'}
        </span>
      </div>
      {subtitle ? <p className="text-xs text-white/65">{subtitle}</p> : null}
      <div className={LETTER_TEMPLATE_CATALOG_GRID}>
        {specs.map((spec) => (
          <LetterTemplateCatalogCard
            key={spec.id}
            title={spec.title}
            description={spec.shortDescription}
            ctaLabel={buildLabel}
            onGenerate={() => onBuild(spec.id)}
          />
        ))}
      </div>
    </div>
  );
}
