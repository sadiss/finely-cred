import React, { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import {
  letterCatalogPool,
  type DebtLetterCatalogEntry,
  type LetterCatalogCategory,
  type LetterCatalogHub,
} from '../../legal/debtLetterCatalog';
import { LIBERATION_LAW_ANCHORS } from '../../legal/consumerLiberationLaws';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  finelyOsGlowField,
  type FinelyOsGlowAccent,
} from '../../features/os/finelyOsLightUi';
import {
  debtLetterCardFactsFromCatalogEntry,
  debtLetterWhenToUseSnippet,
} from '../../lib/debtLetterCardFacts';
import {
  LETTER_TEMPLATE_CATALOG_GRID,
  LETTER_TEMPLATE_CATALOG_SHELL,
  LetterTemplateCatalogCard,
} from './LetterTemplateCatalogCard';

const CATEGORY_LABELS: Record<LetterCatalogCategory, string> = {
  validation: 'Validation',
  court: 'Court',
  securitization: 'Securitization',
  repossession: 'Repossession',
  foreclosure: 'Foreclosure',
  negotiation: 'Negotiation',
  reporting: 'Credit reporting',
  bureau: 'Bureaus',
};

export function LetterCatalogBrowser({
  category,
  accent,
  onBuild,
  extraCategories,
  searchHint,
  compactHeader,
  letterHub,
  filterEntry,
}: {
  category: LetterCatalogCategory;
  accent: FinelyOsGlowAccent;
  onBuild: (catalogId: string, entry: DebtLetterCatalogEntry) => void;
  /** Show chips from additional categories (e.g. court view also shows securitization) */
  extraCategories?: LetterCatalogCategory[];
  /** Pre-filter catalog when playbook step changes */
  searchHint?: string;
  /** Flatter header for collateral workstations */
  compactHeader?: boolean;
  /** Credit Letters vs Debt Letters hub filter */
  letterHub?: LetterCatalogHub;
  /** Track guard — e.g. Validation blocks affidavits / court answers. Must match the caller's KPI count. */
  filterEntry?: (entry: DebtLetterCatalogEntry) => boolean;
}) {
  const [q, setQ] = useState('');
  const [sub, setSub] = useState<LetterCatalogCategory | 'all'>('all');

  useEffect(() => {
    if (searchHint?.trim()) setQ(searchHint.trim());
  }, [searchHint]);

  const pool = useMemo(
    () =>
      letterCatalogPool({
        categories: [category, ...(extraCategories ?? [])],
        hub: letterHub,
        filter: filterEntry,
      }),
    [category, extraCategories, letterHub, filterEntry],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = pool.filter((e) => {
      if (sub !== 'all' && e.category !== sub) return false;
      if (!needle) return true;
      const hay = `${e.title} ${e.shortDescription} ${e.laws.join(' ')} ${e.keyPrinciple}`.toLowerCase();
      const tokens = needle.split(/\s+/).filter(Boolean);
      if (tokens.length > 1) return tokens.some((tok) => hay.includes(tok));
      return hay.includes(needle);
    });
    if (category === 'court' && !needle && sub === 'all') {
      return [...list].sort((a, b) => {
        const aPack = a.id.startsWith('courtroom_') ? 0 : 1;
        const bPack = b.id.startsWith('courtroom_') ? 0 : 1;
        return aPack - bPack || a.title.localeCompare(b.title);
      });
    }
    return list;
  }, [pool, q, sub, category]);

  const subTabs = useMemo(() => {
    const cats = new Set(pool.map((e) => e.category));
    return ['all' as const, ...([...cats] as LetterCatalogCategory[])];
  }, [pool]);

  const lawHints = useMemo(() => {
    const tags = new Set<string>();
    if (category === 'foreclosure') tags.add('foreclosure');
    if (category === 'repossession') tags.add('repossession');
    if (category === 'validation') tags.add('validation');
    if (category === 'court' || category === 'securitization') tags.add('securitization');
    return LIBERATION_LAW_ANCHORS.filter((l) => l.consumerUse.some((u) => tags.has(u))).slice(0, 4);
  }, [category]);

  const libraryTitle =
    category === 'validation' && !compactHeader
      ? 'Full validation letter library'
      : `${CATEGORY_LABELS[category]} letter library`;

  return (
    <div className={LETTER_TEMPLATE_CATALOG_SHELL}>
      {!compactHeader ? (
        <div className="fc-validation-generate-card rounded-xl !p-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-200">{libraryTitle}</span>
            <span className="text-[10px] text-white/50">
              {pool.length} letters · {filtered.length} shown
            </span>
          </div>
          <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
            Pick a scenario — each letter lists the laws it uses and generates a draft you can edit. Educational only;
            verify local rules.
          </p>
          {lawHints.length ? (
            <div className="flex flex-wrap gap-2">
              {lawHints.map((l) => (
                <span
                  key={l.id}
                  className="text-[9px] px-2 py-1 rounded-full border border-white/10 bg-black/30 text-white/60"
                  title={l.plainEnglish}
                >
                  {l.shortName}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-amber-200">Letter library</span>
          <span className="text-[10px] text-white/50">
            {filtered.length} of {pool.length}
          </span>
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search letters, laws, scenarios…"
            className={`${finelyOsGlowField(accent)} w-full pl-9 text-sm`}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {subTabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setSub(t)}
              className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border transition ${
                sub === t ? 'border-white/30 bg-white/10 text-white' : 'border-white/10 text-white/50 hover:text-white/80'
              }`}
            >
              {t === 'all' ? 'All' : CATEGORY_LABELS[t]}
            </button>
          ))}
        </div>
      </div>

      <div className={`${LETTER_TEMPLATE_CATALOG_GRID} max-h-[min(70vh,640px)] overflow-y-auto pr-1`}>
        {filtered.map((e) => {
          const facts = debtLetterCardFactsFromCatalogEntry(e);
          const whenSnippet = debtLetterWhenToUseSnippet(facts);
          return (
            <LetterTemplateCatalogCard
              key={e.id}
              title={e.title}
              keyPrinciple={facts.keyPrinciple}
              whenSnippet={whenSnippet}
              description={e.shortDescription}
              lawsLine={facts.laws.slice(0, 2).join(' · ')}
              topBadge={
                e.id.startsWith('courtroom_') ? (
                  <span className="text-[9px] font-black uppercase tracking-widest text-fuchsia-300/90">Courtroom pack</span>
                ) : undefined
              }
              onGenerate={() => onBuild(e.id, e)}
            />
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-center py-6 space-y-2`}>
          <p>No letters match this filter.</p>
          {q.trim() ? (
            <button
              type="button"
              onClick={() => setQ('')}
              className="text-[10px] font-black uppercase tracking-widest text-white/60 underline underline-offset-2 hover:text-white"
            >
              Clear search — show all {pool.length} letters
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
