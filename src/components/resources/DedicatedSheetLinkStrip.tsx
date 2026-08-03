/**
 * Pointer strip to the dedicated sheet pages. The cards are signposts only — the full experience
 * (preview, page-by-page breakdown, download) lives on each sheet's own route.
 */
import React from 'react';
import { ArrowRight, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PUBLIC_DEDICATED_SHEET_PAGES } from '../../config/publicResourcesHub';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

export function DedicatedSheetLinkStrip({
  only,
  heading = 'Free sheet kits — each on its own page',
  subline = 'Honest page counts. Download the PDF, or read the whole breakdown first.',
  className = '',
}: {
  /** Restrict to specific sheet ids (`restore`, `build`, `au_teen`). Defaults to all three. */
  only?: readonly string[];
  heading?: string;
  subline?: string;
  className?: string;
}) {
  const navigate = useNavigate();
  const sheets = only?.length
    ? PUBLIC_DEDICATED_SHEET_PAGES.filter((sheet) => only.includes(sheet.id))
    : PUBLIC_DEDICATED_SHEET_PAGES;

  if (!sheets.length) return null;

  return (
    <section className={`rounded-[1.25rem] border border-white/10 bg-black/25 p-5 ${className}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-lg font-bold tracking-tight text-white">{heading}</h2>
        <span className={FINELY_OS_ENTITY_SUBLABEL}>{subline}</span>
      </div>

      <div className={`mt-4 grid gap-3 ${sheets.length > 2 ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        {sheets.map((sheet) => (
          <button
            key={sheet.id}
            type="button"
            onClick={() => navigate(sheet.path)}
            className={`${finelyOsCatalogCard(sheet.accent)} !p-4 text-left transition-all hover:brightness-110`}
            data-fc-accent={sheet.accent}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-black/25">
                <FileText size={16} />
              </span>
              <span className={FINELY_OS_ENTITY_SUBLABEL}>{sheet.sheetLabel}</span>
            </div>
            <div className={`mt-3 font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{sheet.title}</div>
            <p className={`mt-1 text-sm ${FINELY_OS_ENTITY_BODY}`}>{sheet.desc}</p>
            <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-300">
              Open the page <ArrowRight size={13} />
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
