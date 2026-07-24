import React, { useMemo, useState } from 'react';
import { BookOpen, ExternalLink, Gavel, Scale, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Partner } from '../../domain/partners';
import {
  DEFENSE_BOOK_META,
  DEFENSE_CORE_STATEMENT,
  DEFENSE_PLAYBOOK_SECTIONS,
  FIVE_GATE_STRATEGY,
  defenseSectionsForTrack,
  searchDefensePlaybook,
  type DefensePlaybookSection,
  type DefenseTrack,
} from '../../legal/partnerDefenseBook';
import {
  LAWS_RIGHTS_META,
  LAW_STACK_MAP,
  LAWS_RIGHTS_SECTIONS,
  searchLawsRights,
  type LawRightsSection,
} from '../../legal/lawsRightsReference';
import {
  ROOSEVELT_DISPLAY_NAME,
  ROOSEVELT_HEARING_ISO,
  isRooseveltCourtPartner,
} from '../../data/rooseveltCourtPartnerSeed';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import {
  FINELY_OS_COMPACT_PAGE,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowField,
} from '../../features/os/finelyOsLightUi';

type PanelMode = 'defense' | 'laws' | 'both';

function SectionLinks({
  links,
}: {
  links: Array<{ label: string; href: string; external?: boolean }>;
}) {
  if (!links.length) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {links.map((l) =>
        l.external ? (
          <a
            key={l.href + l.label}
            href={l.href}
            target="_blank"
            rel="noopener noreferrer"
            className={`${FINELY_OS_SECONDARY_BTN} !text-[11px]`}
          >
            {l.label} <ExternalLink size={11} />
          </a>
        ) : (
          <Link key={l.href + l.label} to={l.href} className={`${FINELY_OS_SECONDARY_BTN} !text-[11px]`}>
            {l.label}
          </Link>
        ),
      )}
    </div>
  );
}

function DefenseSectionCard({ section }: { section: DefensePlaybookSection }) {
  return (
    <details className={`${finelyOsCatalogCardCompact('violet')} group`}>
      <summary className="cursor-pointer select-none list-none">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-violet-200/80`}>{section.eyebrow}</div>
            <div className={`mt-1 text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{section.title}</div>
            <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
              <span className="text-emerald-200/90">Use when: </span>
              {section.useWhen}
            </p>
          </div>
          <span className="shrink-0 text-[10px] uppercase tracking-widest text-white/40 group-open:text-emerald-300/80">
            Expand
          </span>
        </div>
      </summary>
      <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          <span className="text-amber-200/90">Next: </span>
          {section.nextAction}
        </p>
        <ol className={`list-decimal pl-4 space-y-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          {section.steps.map((s) => (
            <li key={s.slice(0, 48)}>{s}</li>
          ))}
        </ol>
        {section.courtSafePhrases?.length ? (
          <div className="rounded-lg border border-emerald-400/25 bg-emerald-500/10 px-3 py-2">
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-emerald-200/80`}>Court-safe phrases</div>
            <ul className={`mt-1 space-y-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
              {section.courtSafePhrases.map((p) => (
                <li key={p.slice(0, 40)}>“{p}”</li>
              ))}
            </ul>
          </div>
        ) : null}
        {section.doNotSay?.length ? (
          <div className="rounded-lg border border-rose-400/25 bg-rose-500/10 px-3 py-2">
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-rose-200/80`}>Do not say</div>
            <ul className={`mt-1 list-disc pl-4 space-y-0.5 text-xs ${FINELY_OS_ENTITY_BODY}`}>
              {section.doNotSay.map((p) => (
                <li key={p.slice(0, 40)}>{p}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <SectionLinks links={section.links} />
      </div>
    </details>
  );
}

function LawSectionCard({ section }: { section: LawRightsSection }) {
  return (
    <details className={`${finelyOsCatalogCardCompact('sky')} group`}>
      <summary className="cursor-pointer select-none list-none">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-sky-200/80`}>{section.eyebrow}</div>
            <div className={`mt-1 text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{section.title}</div>
            <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
              <span className="text-emerald-200/90">Use when: </span>
              {section.useWhen}
            </p>
          </div>
          <span className="shrink-0 text-[10px] uppercase tracking-widest text-white/40 group-open:text-sky-300/80">
            Expand
          </span>
        </div>
      </summary>
      <div className="mt-3 space-y-2 border-t border-white/10 pt-3">
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>{section.plainEnglish}</p>
        <p className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
          <span className="text-amber-200/90">Next: </span>
          {section.nextAction}
        </p>
        <ol className={`list-decimal pl-4 space-y-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
          {section.howToUse.map((s) => (
            <li key={s.slice(0, 48)}>{s}</li>
          ))}
        </ol>
        {section.doNotOverclaim.length ? (
          <div className="rounded-lg border border-amber-400/25 bg-amber-500/10 px-3 py-2">
            <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-amber-200/80`}>Do not overclaim</div>
            <ul className={`mt-1 list-disc pl-4 space-y-0.5 text-xs ${FINELY_OS_ENTITY_BODY}`}>
              {section.doNotOverclaim.map((p) => (
                <li key={p.slice(0, 40)}>{p}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {section.citeChips.map((c) =>
            c.href ? (
              <a
                key={c.label}
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-md border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-[10px] text-sky-100"
              >
                {c.label} <ExternalLink size={10} />
              </a>
            ) : (
              <span
                key={c.label}
                className="inline-flex rounded-md border border-white/15 bg-black/25 px-2 py-1 text-[10px] text-white/70"
              >
                {c.label}
              </span>
            ),
          )}
        </div>
      </div>
    </details>
  );
}

export function PartnerDefenseKnowledgePanel({
  mode = 'both',
  trackFilter = 'all',
  compact = false,
  defaultOpen = false,
  partner,
  hearingIso,
}: {
  mode?: PanelMode;
  trackFilter?: DefenseTrack;
  compact?: boolean;
  defaultOpen?: boolean;
  partner?: Partner | null;
  hearingIso?: string;
}) {
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<'defense' | 'laws'>(mode === 'laws' ? 'laws' : 'defense');
  const courtPartner = isRooseveltCourtPartner(partner);

  const defenseItems = useMemo(() => {
    const base = trackFilter === 'all' ? DEFENSE_PLAYBOOK_SECTIONS : defenseSectionsForTrack(trackFilter);
    const searched = searchDefensePlaybook(query);
    const ids = new Set(searched.map((s) => s.id));
    return base.filter((s) => ids.has(s.id));
  }, [query, trackFilter]);

  const lawItems = useMemo(() => {
    const searched = searchLawsRights(query);
    if (!query.trim()) return LAWS_RIGHTS_SECTIONS;
    return searched;
  }, [query]);

  const showDefense = mode === 'defense' || mode === 'both';
  const showLaws = mode === 'laws' || mode === 'both';

  return (
    <section
      id={showLaws ? 'laws-rights-reference' : 'partner-defense-book'}
      className={`${compact ? FINELY_OS_COMPACT_PAGE : 'space-y-3'} scroll-mt-4`}
    >
      <details open={defaultOpen} className={`${finelyOsCatalogCardCompact('emerald')} group`}>
        <summary className="cursor-pointer select-none list-none">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-2 min-w-0">
              <BookOpen size={16} className="mt-0.5 shrink-0 text-emerald-300" />
              <div className="min-w-0">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Defense library</div>
                <div className={`mt-1 text-sm font-semibold ${FINELY_OS_ENTITY_VALUE}`}>
                  {mode === 'laws' ? LAWS_RIGHTS_META.title : DEFENSE_BOOK_META.title}
                  {mode === 'both' ? ' + Rights Reference' : ''}
                </div>
                <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  {mode === 'laws' ? LAWS_RIGHTS_META.subtitle : DEFENSE_BOOK_META.subtitle}
                </p>
              </div>
            </div>
            <span className={`${FINELY_OS_PRIMARY_BTN} !py-1.5 !px-3 !text-[11px] pointer-events-none`}>
              Open library
            </span>
          </div>
        </summary>

        <div className="mt-3 space-y-3 border-t border-white/10 pt-3">
          <p className={`text-[11px] ${FINELY_OS_ENTITY_BODY}`}>
            {DEFENSE_BOOK_META.compliance} · {LAWS_RIGHTS_META.sourceLabel}
          </p>

          {courtPartner ? (
            <div className={`${finelyOsCatalogCardCompact('amber')} !p-3`}>
              <div className="flex items-start gap-2">
                <Gavel size={14} className="mt-0.5 shrink-0 text-amber-300" />
                <div className="min-w-0">
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-amber-200/90`}>Court matter spotlight</div>
                  <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                    <span className="font-semibold text-white">{ROOSEVELT_DISPLAY_NAME}</span> owns this Midland /
                    Citi hearing track
                    {hearingIso || ROOSEVELT_HEARING_ISO
                      ? ` · hearing ${hearingIso || ROOSEVELT_HEARING_ISO}`
                      : ''}
                    . Merge fields and Jul 27 quick-fill apply to this partner — not Yolie (credit restore).
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Link to="/portal/debt?tab=litigation&stage=answer" className={`${FINELY_OS_SECONDARY_BTN} !text-[11px]`}>
                      Written answer
                    </Link>
                    <Link to="/portal/debt?tab=litigation&stage=hearing" className={`${FINELY_OS_SECONDARY_BTN} !text-[11px]`}>
                      Hearing card
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {showDefense && showLaws ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setTab('defense')}
                className={tab === 'defense' ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
              >
                <Scale size={13} /> Defense Book
              </button>
              <button
                type="button"
                onClick={() => setTab('laws')}
                className={tab === 'laws' ? FINELY_OS_PRIMARY_BTN : FINELY_OS_SECONDARY_BTN}
              >
                Laws & Rights
              </button>
            </div>
          ) : null}

          <label className="block">
            <span className={FINELY_OS_ENTITY_SUBLABEL}>Search</span>
            <span className="mt-1 flex items-center gap-2">
              <Search size={14} className="text-white/40 shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ownership, amount, UCC, settlement…"
                className={`${finelyOsGlowField('emerald')} w-full`}
              />
            </span>
          </label>

          {(tab === 'defense' && showDefense) || mode === 'defense' ? (
            <div className="space-y-3">
              <div className={`${finelyOsCatalogCardCompact('violet')}`}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Core stance</div>
                <p className={`mt-2 text-sm font-medium ${FINELY_OS_ENTITY_VALUE}`}>“{DEFENSE_CORE_STATEMENT.core}”</p>
                <ul className={`mt-2 list-disc pl-4 space-y-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  {DEFENSE_CORE_STATEMENT.meaning.map((m) => (
                    <li key={m.slice(0, 36)}>{m}</li>
                  ))}
                </ul>
              </div>

              <div className={`${finelyOsCatalogCardCompact('sky')}`}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>{FIVE_GATE_STRATEGY.title}</div>
                <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{FIVE_GATE_STRATEGY.subtitle}</p>
                <ol className={`mt-2 list-decimal pl-4 space-y-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  {FIVE_GATE_STRATEGY.gates.map((g) => (
                    <li key={g.id}>
                      <span className="text-white/85 font-medium">{g.title}: </span>
                      {g.question}
                    </li>
                  ))}
                </ol>
                <p className={`mt-2 text-xs italic ${FINELY_OS_ENTITY_BODY}`}>“{FIVE_GATE_STRATEGY.courtPhrase}”</p>
              </div>

              <FinelyOsPaginatedStack
                items={defenseItems}
                pageSize={5}
                emptyMessage="No defense sections match that search."
                renderItem={(section) => <DefenseSectionCard key={section.id} section={section} />}
              />
            </div>
          ) : null}

          {(tab === 'laws' && showLaws) || mode === 'laws' ? (
            <div className="space-y-3">
              <div className={`${finelyOsCatalogCardCompact('sky')}`}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>{LAW_STACK_MAP.title}</div>
                <p className={`mt-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>{LAW_STACK_MAP.rule}</p>
                <ol className={`mt-2 list-decimal pl-4 space-y-1 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  {LAW_STACK_MAP.layers.map((l) => (
                    <li key={l.id}>
                      <span className="text-white/85 font-medium">{l.title}: </span>
                      {l.question}
                    </li>
                  ))}
                </ol>
              </div>

              <FinelyOsPaginatedStack
                items={lawItems}
                pageSize={5}
                emptyMessage="No law sections match that search."
                renderItem={(section) => <LawSectionCard key={section.id} section={section} />}
              />
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Link to="/portal/debt?tab=court" className={FINELY_OS_SECONDARY_BTN}>
              Open Court
            </Link>
            <Link to="/portal/debt?tab=validation" className={FINELY_OS_SECONDARY_BTN}>
              Open Validation
            </Link>
            <Link to="/portal/letters" className={FINELY_OS_SECONDARY_BTN}>
              Credit Letters
            </Link>
          </div>
        </div>
      </details>
    </section>
  );
}
