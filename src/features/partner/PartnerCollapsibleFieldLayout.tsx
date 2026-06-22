import React, { useMemo, useState } from 'react';
import { ChevronDown, Plus } from 'lucide-react';
import type { CustomFieldDefinition } from '../../domain/customFields';
import type { FieldLayout } from '../../domain/fieldLayouts';
import { FieldInput } from '../../components/fields/FieldLayoutRenderer';
import { FINELY_OS_ENTITY_BODY, FINELY_OS_ENTITY_SUBLABEL, FINELY_OS_ENTITY_VALUE, FINELY_OS_PRIMARY_BTN, FINELY_OS_SECONDARY_BTN } from '../os/finelyOsLightUi';

/** Sections that duplicate partner contact/onboarding — hidden until data exists. */
export const PARTNER_ONBOARDING_SECTION_IDS = new Set(['identity', 'mailing']);

const SECTION_HINTS: Record<string, string> = {
  identity: 'Legal name, DOB, SSN last 4 (if not in contact above)',
  mailing: 'Extended mailing fields for letters',
  monitoring: 'Credit Karma, MyFICO, or other monitoring logins',
  bureaus: 'Experian, TransUnion, Equifax portal credentials',
  business: 'DUNS, Bradstreet, business identifiers',
  notes: 'LexisNexis opt-out, internal profile notes',
  main: 'Additional partner attributes',
};

function pickDefaultOpenSection(
  sections: Array<{ id: string; fieldDefs: CustomFieldDefinition[] }>,
  values: Record<string, unknown>,
): string | null {
  const withData = sections.find((s) => sectionHasData(s.fieldDefs, values));
  if (withData) return withData.id;
  const firstOps = sections.find((s) => !PARTNER_ONBOARDING_SECTION_IDS.has(s.id));
  return firstOps?.id ?? sections[0]?.id ?? null;
}

function isValueEmpty(v: unknown): boolean {
  if (v == null) return true;
  if (typeof v === 'string') return v.trim() === '';
  if (typeof v === 'boolean') return false;
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

function sectionHasData(fieldDefs: CustomFieldDefinition[], values: Record<string, unknown>): boolean {
  return fieldDefs.some((d) => !isValueEmpty(values?.[d.key]));
}

function sectionSummary(fieldDefs: CustomFieldDefinition[], values: Record<string, unknown>): string {
  const filled = fieldDefs.filter((d) => !isValueEmpty(values?.[d.key]));
  if (!filled.length) return 'Not started';
  const preview = filled
    .slice(0, 2)
    .map((d) => {
      const raw = values[d.key];
      const text = typeof raw === 'boolean' ? (raw ? 'Yes' : 'No') : String(raw ?? '').trim();
      return text.length > 28 ? `${text.slice(0, 28)}…` : text;
    })
    .join(' · ');
  if (filled.length > 2) return `${preview} (+${filled.length - 2} more)`;
  return preview;
}

export function countPartnerEmptyFieldSections(args: {
  layout: FieldLayout | null;
  definitions: CustomFieldDefinition[];
  values: Record<string, unknown>;
}): number {
  const defsById = new Map(args.definitions.map((d) => [d.id, d]));
  const hidden = new Set<string>(args.layout?.hiddenFieldIds ?? []);
  const sections =
    args.layout?.sections?.length
      ? args.layout.sections
      : [{ id: 'main', title: 'Fields', fieldIds: args.definitions.map((d) => d.id) }];

  let empty = 0;
  for (const s of sections) {
    const fieldDefs = s.fieldIds.map((id) => defsById.get(id) ?? null).filter(Boolean) as CustomFieldDefinition[];
    const visible = fieldDefs.filter((d) => !hidden.has(d.id));
    if (!visible.length) continue;
    const hasData = sectionHasData(visible, args.values);
    if (!hasData) empty += 1;
  }
  return empty;
}

export function PartnerCollapsibleFieldLayout(args: {
  layout: FieldLayout | null;
  definitions: CustomFieldDefinition[];
  values: Record<string, unknown>;
  onChangeValue: (key: string, next: unknown, persist: boolean) => void;
}) {
  const defsById = useMemo(() => new Map(args.definitions.map((d) => [d.id, d])), [args.definitions]);
  const hidden = new Set<string>(args.layout?.hiddenFieldIds ?? []);
  const placed = new Set<string>();

  const sections = useMemo(() => {
    const raw =
      args.layout?.sections?.length
        ? args.layout.sections
        : [{ id: 'main', title: 'Fields', fieldIds: args.definitions.map((d) => d.id) }];
    for (const s of raw) for (const id of s.fieldIds) placed.add(id);
    return raw
      .map((s) => {
        const fieldDefs = s.fieldIds.map((id) => defsById.get(id) ?? null).filter(Boolean) as CustomFieldDefinition[];
        const visible = fieldDefs.filter((d) => !hidden.has(d.id));
        return { ...s, fieldDefs: visible };
      })
      .filter((s) => s.fieldDefs.length > 0);
  }, [args.layout, args.definitions, defsById, hidden]);

  const unplaced = args.definitions.filter((d) => !placed.has(d.id) && !hidden.has(d.id));

  const defaultOpen = useMemo(
    () => pickDefaultOpenSection(sections, args.values || {}),
    [sections, args.values],
  );

  const [openId, setOpenId] = useState<string | null>(defaultOpen);
  const [showEmptyOnboarding, setShowEmptyOnboarding] = useState<Set<string>>(new Set());

  const visibleSections = sections.filter((s) => {
    const hasData = sectionHasData(s.fieldDefs, args.values);
    if (hasData) return true;
    if (PARTNER_ONBOARDING_SECTION_IDS.has(s.id) && !showEmptyOnboarding.has(s.id)) return false;
    return true;
  });

  const hiddenEmptyOnboarding = sections.filter(
    (s) => PARTNER_ONBOARDING_SECTION_IDS.has(s.id) && !sectionHasData(s.fieldDefs, args.values) && !showEmptyOnboarding.has(s.id),
  );

  const openSection = (id: string) => setOpenId((prev) => (prev === id ? null : id));

  const allSectionCards = sections.filter(
    (s) => sectionHasData(s.fieldDefs, args.values) || !PARTNER_ONBOARDING_SECTION_IDS.has(s.id) || showEmptyOnboarding.has(s.id),
  );

  return (
    <div className="space-y-4">
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {allSectionCards.map((s) => {
          const hasData = sectionHasData(s.fieldDefs, args.values);
          const active = openId === s.id;
          return (
            <button
              key={`card-${s.id}`}
              type="button"
              onClick={() => openSection(s.id)}
              className={
                'text-left rounded-2xl border p-4 transition-all ' +
                (active
                  ? 'border-violet-400/50 bg-violet-500/15 ring-2 ring-violet-400/20'
                  : hasData
                    ? 'border-emerald-400/30 bg-emerald-500/8 hover:border-emerald-400/45'
                    : 'border-white/12 bg-white/[0.04] hover:border-white/20 hover:bg-white/[0.06]')
              }
            >
              <div className="flex items-center gap-2">
                {hasData ? (
                  <span className="h-2 w-2 rounded-full bg-emerald-400 shrink-0" />
                ) : (
                  <Plus size={14} className="text-white/45 shrink-0" />
                )}
                <span className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>{s.title}</span>
              </div>
              <p className={`mt-2 ${FINELY_OS_ENTITY_BODY} text-xs leading-relaxed`}>
                {hasData ? sectionSummary(s.fieldDefs, args.values) : SECTION_HINTS[s.id] ?? 'Tap to enter details'}
              </p>
              <p className={`mt-2 text-[10px] uppercase tracking-wider ${active ? 'text-violet-200' : 'text-white/40'}`}>
                {active ? 'Editing now' : hasData ? 'View / edit' : 'Add info'}
              </p>
            </button>
          );
        })}
      </div>

      {hiddenEmptyOnboarding.length ? (
        <div className={`rounded-xl border border-white/10 bg-black/20 px-4 py-3 ${FINELY_OS_ENTITY_BODY} text-sm`}>
          <span className={FINELY_OS_ENTITY_VALUE}>Identity & mailing</span> live in partner contact above. Need the extended custom-field versions?{' '}
          {hiddenEmptyOnboarding.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`${FINELY_OS_ENTITY_BODY} underline underline-offset-2 hover:text-violet-200 mx-1`}
              onClick={() => {
                setShowEmptyOnboarding((prev) => new Set(prev).add(s.id));
                setOpenId(s.id);
              }}
            >
              Add {s.title.toLowerCase()}
            </button>
          ))}
        </div>
      ) : null}

      {visibleSections.map((s) => {
        if (openId !== s.id) return null;
        const hasData = sectionHasData(s.fieldDefs, args.values);
        return (
          <div key={s.id} className="fc-light-glass-panel fc-light-chrome-panel p-5 w-full">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className={`${FINELY_OS_ENTITY_SUBLABEL} normal-case tracking-wide`}>{s.title}</div>
                <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm`}>
                  {hasData ? sectionSummary(s.fieldDefs, args.values) : 'Enter details below — one section at a time keeps the profile scannable.'}
                </div>
              </div>
              <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setOpenId(null)}>
                <ChevronDown size={14} className="rotate-180" /> Collapse
              </button>
            </div>
            <div className="mt-5 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {s.fieldDefs.map((def) => {
                const v = args.values?.[def.key];
                return (
                  <div key={def.id} className="rounded-2xl border border-white/[0.08] bg-fc-input p-4">
                    <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>{def.label}</div>
                    {def.helpText ? <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-xs`}>{def.helpText}</div> : null}
                    <FieldInput def={def} value={v} onChange={(next, persist) => args.onChangeValue(def.key, next, persist)} />
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {unplaced.length ? (
        <details className="fc-light-glass-panel fc-light-chrome-panel p-5">
          <summary className={`cursor-pointer select-none ${FINELY_OS_ENTITY_VALUE}`}>Other fields ({unplaced.length})</summary>
          <div className="mt-4 grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {unplaced.map((def) => {
              const v = args.values?.[def.key];
              return (
                <div key={def.id} className="rounded-2xl border border-white/[0.08] bg-fc-input p-4">
                  <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>{def.label}</div>
                  {def.helpText ? <div className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-xs`}>{def.helpText}</div> : null}
                  <FieldInput def={def} value={v} onChange={(next, persist) => args.onChangeValue(def.key, next, persist)} />
                </div>
              );
            })}
          </div>
        </details>
      ) : null}
    </div>
  );
}
