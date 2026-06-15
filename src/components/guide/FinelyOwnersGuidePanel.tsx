import React, { useMemo, useState } from 'react';
import { ArrowRight, BookOpen, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  filterOwnersGuideSections,
  OWNERS_GUIDE_INTRO,
  OWNERS_GUIDE_SECTIONS,
  PARTNER_ACCESS_SUMMARY,
  type OwnersGuideSection,
} from '../../data/ownersGuideModel';
import { mergeOwnersGuideSections } from '../../lib/ownersGuideLiveSync';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_PANEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_GLASS_CATALOG,
  FINELY_OS_LUXURY_EMPTY,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsInlineListItem,
} from '../../features/os/finelyOsLightUi';

type Props = {
  compact?: boolean;
  isAdmin?: boolean;
  maxSections?: number;
};

export function FinelyOwnersGuidePanel({ compact, isAdmin = false, maxSections }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const sections = useMemo(() => {
    const merged = mergeOwnersGuideSections(OWNERS_GUIDE_SECTIONS);
    const all = filterOwnersGuideSections(query, isAdmin, merged);
    return maxSections ? all.slice(0, maxSections) : all;
  }, [query, isAdmin, maxSections]);

  return (
    <div className={`space-y-5 ${compact ? '' : FINELY_OS_ENTITY_PANEL}`}>
      {!compact ? (
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/[0.08] pb-5">
          <div className="min-w-0">
            <div className="inline-flex items-center gap-2 text-amber-300">
              <BookOpen size={18} />
              <span className={FINELY_OS_ENTITY_SUBLABEL}>Owner&apos;s guide</span>
            </div>
            <h2 className={`mt-2 text-2xl md:text-3xl ${FINELY_OS_ENTITY_TITLE}`}>Partner access manual</h2>
            <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} max-w-2xl`}>{OWNERS_GUIDE_INTRO}</p>
            {!isAdmin ? (
              <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-5 space-y-4 max-w-4xl">
                <div className={`text-sm font-semibold text-emerald-200 ${FINELY_OS_ENTITY_VALUE}`}>{PARTNER_ACCESS_SUMMARY.title}</div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className={`text-xs font-bold uppercase tracking-wider text-emerald-300/90 mb-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>Included in your partner account</div>
                    <ul className={`text-sm ${FINELY_OS_ENTITY_BODY} space-y-1.5 list-none`}>
                      {PARTNER_ACCESS_SUMMARY.included.map((line) => (
                        <li key={line} className="flex gap-2">
                          <span className="text-emerald-400 shrink-0">✓</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className={`text-xs font-bold uppercase tracking-wider text-amber-300/90 mb-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>Not included — Finely internal only</div>
                    <ul className={`text-sm ${FINELY_OS_ENTITY_BODY} space-y-1.5 list-none`}>
                      {PARTNER_ACCESS_SUMMARY.notIncluded.map((line) => (
                        <li key={line} className="flex gap-2">
                          <span className="text-amber-400/90 shrink-0">✗</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <p className={`text-xs ${FINELY_OS_ENTITY_BODY} text-white/50`}>
                  Admin routes and staff tooling are hidden below. Use the first section for the full access map.
                </p>
              </div>
            ) : null}
          </div>
          {!compact && (
            <button type="button" onClick={() => navigate('/owners-guide')} className={FINELY_OS_PRIMARY_BTN}>
              Full guide <ArrowRight size={14} />
            </button>
          )}
        </div>
      ) : null}

      <div className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search features, routes, workflows…" className={`${FINELY_OS_ENTITY_INPUT} pl-11`} />
      </div>

      {!compact && sections.length > 1 ? (
        <nav
          aria-label="Guide sections"
          className="sticky top-0 z-20 -mx-1 px-1 py-2.5 bg-[#0a0f18]/95 backdrop-blur border-b border-white/[0.08] overflow-x-auto"
        >
          <div className="flex gap-2 min-w-max">
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-wider border border-white/[0.08] text-white/55 hover:text-emerald-200 hover:border-emerald-400/30 transition"
              >
                {s.emoji} {s.title.length > 28 ? `${s.title.slice(0, 26)}…` : s.title}
              </button>
            ))}
          </div>
        </nav>
      ) : null}

      <div className={`grid gap-4 ${compact ? 'grid-cols-1' : 'md:grid-cols-2'}`}>
        {sections.map((s) => (
          <GuideSectionCard key={s.id} section={s} onNavigate={navigate} compact={compact} isAdmin={isAdmin} />
        ))}
      </div>

      {sections.length === 0 ? <div className={FINELY_OS_LUXURY_EMPTY}>No sections match your search.</div> : null}
    </div>
  );
}

function GuideSectionCard({
  section,
  onNavigate,
  compact,
  isAdmin,
}: {
  section: OwnersGuideSection;
  onNavigate: (path: string) => void;
  compact?: boolean;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(!compact);

  return (
    <div id={section.id} className={`${FINELY_OS_GLASS_CATALOG} space-y-3 scroll-mt-24`}>
      <button type="button" onClick={() => setOpen((v) => !v)} className="w-full text-left flex items-start gap-3">
        <span className="text-2xl">{section.emoji}</span>
        <div className="min-w-0 flex-1">
          <div className={`text-lg ${FINELY_OS_ENTITY_VALUE}`}>{section.title}</div>
          <p className={`text-sm ${FINELY_OS_ENTITY_BODY} mt-1`}>{section.summary}</p>
        </div>
      </button>

      {open ? (
        <>
          <ul className={`space-y-2 text-sm ${FINELY_OS_ENTITY_BODY}`}>
            {section.bullets.map((b) => (
              <li key={b} className="flex items-start gap-2">
                <span className="text-amber-600 mt-1">•</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 pt-2">
            {section.paths.map((p) => (
              <button key={p.path} type="button" onClick={() => onNavigate(p.path)} className={FINELY_OS_SECONDARY_BTN}>
                {p.label}
                {p.access === 'public' ? ' · public' : p.access === 'partner' ? ' · portal' : isAdmin ? ' · admin' : ''}{' '}
                <ArrowRight size={12} />
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
