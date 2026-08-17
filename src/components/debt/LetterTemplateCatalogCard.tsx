import React from 'react';
import { Loader2 } from 'lucide-react';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_PRIMARY_BTN,
} from '../../features/os/finelyOsLightUi';
import './validationDebtLayout.css';

/** Shared letter-template catalog chrome — one look everywhere template letters are picked. */
export const LETTER_TEMPLATE_CATALOG_SHELL = 'fc-validation-catalog-shell rounded-2xl p-3 space-y-3';
export const LETTER_TEMPLATE_CATALOG_GRID =
  'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2';
export const LETTER_TEMPLATE_GENERATE_BTN = `fc-generate-cta fc-validation-generate-hero !bg-amber-400 !text-black hover:!brightness-110 ${FINELY_OS_PRIMARY_BTN} mt-auto self-stretch justify-center text-[10px] !py-2 disabled:opacity-60 disabled:cursor-not-allowed`;

export function LetterTemplateCatalogCard({
  title,
  keyPrinciple,
  whenSnippet,
  description,
  lawsLine,
  topBadge,
  metaRow,
  ctaLabel = 'Generate letter',
  onGenerate,
  disabled = false,
  busy = false,
  className = '',
  generateButtonId,
}: {
  title: string;
  keyPrinciple?: string | null;
  whenSnippet?: string | null;
  description?: string | null;
  lawsLine?: string | null;
  topBadge?: React.ReactNode;
  metaRow?: React.ReactNode;
  ctaLabel?: string;
  onGenerate: () => void;
  disabled?: boolean;
  busy?: boolean;
  className?: string;
  generateButtonId?: string;
}) {
  return (
    <article className={`fc-validation-professional-card flex flex-col gap-2 min-h-[7.5rem] ${className}`.trim()}>
      {topBadge}
      {metaRow}
      <h4 className={`${FINELY_OS_ENTITY_TITLE} text-xs leading-snug line-clamp-2`}>{title}</h4>
      {keyPrinciple?.trim() ? (
        <p className={`text-[11px] font-semibold leading-snug line-clamp-2 flex-1 ${FINELY_OS_ENTITY_BODY} text-white/85`}>
          {keyPrinciple}
        </p>
      ) : null}
      {whenSnippet && !keyPrinciple?.trim() ? (
        <p className={`text-[10px] line-clamp-2 flex-1 ${FINELY_OS_ENTITY_BODY} text-white/60`}>When: {whenSnippet}</p>
      ) : whenSnippet ? (
        <p className={`text-[10px] line-clamp-2 ${FINELY_OS_ENTITY_BODY} text-white/60`}>When: {whenSnippet}</p>
      ) : !keyPrinciple?.trim() && description?.trim() ? (
        <p className={`text-sm line-clamp-2 flex-1 ${FINELY_OS_ENTITY_BODY} text-white/75`}>{description}</p>
      ) : null}
      {lawsLine ? <div className="text-[9px] text-white/45 line-clamp-1">{lawsLine}</div> : null}
      <button
        type="button"
        id={generateButtonId}
        disabled={disabled || busy}
        className={LETTER_TEMPLATE_GENERATE_BTN}
        onClick={onGenerate}
      >
        {busy ? (
          <>
            <Loader2 size={12} className="animate-spin" /> Generating…
          </>
        ) : (
          ctaLabel
        )}
      </button>
    </article>
  );
}
