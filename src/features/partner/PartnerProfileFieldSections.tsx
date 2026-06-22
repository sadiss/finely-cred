import React, { useMemo, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import type { CustomFieldDefinition } from '../../domain/customFields';
import type { FieldLayout } from '../../domain/fieldLayouts';
import { FieldInput } from '../../components/fields/FieldLayoutRenderer';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../os/finelyOsLightUi';

const SECTION_HINTS: Record<string, string> = {
  identity: 'Legal first/last name, DOB, SSN last 4',
  mailing: 'Extended mailing fields for letters',
  monitoring: 'Credit Karma, MyFICO, monitoring app logins',
  bureaus: 'Experian, TransUnion, Equifax portal logins',
  business: 'DUNS, Bradstreet, business identifiers',
  notes: 'LexisNexis opt-out, internal notes',
};

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

type Section = { id: string; title: string; fieldDefs: CustomFieldDefinition[] };

export function PartnerProfileFieldSections(args: {
  layout: FieldLayout | null;
  definitions: CustomFieldDefinition[];
  values: Record<string, unknown>;
  onChangeValue: (key: string, next: unknown, persist: boolean) => void;
}) {
  const defsById = useMemo(() => new Map(args.definitions.map((d) => [d.id, d])), [args.definitions]);
  const hidden = new Set<string>(args.layout?.hiddenFieldIds ?? []);

  const sections = useMemo((): Section[] => {
    const raw =
      args.layout?.sections?.length
        ? args.layout.sections
        : [{ id: 'main', title: 'Profile fields', fieldIds: args.definitions.map((d) => d.id) }];
    return raw
      .map((s) => {
        const fieldDefs = s.fieldIds.map((id) => defsById.get(id) ?? null).filter(Boolean) as CustomFieldDefinition[];
        return { id: s.id, title: s.title, fieldDefs: fieldDefs.filter((d) => !hidden.has(d.id)) };
      })
      .filter((s) => s.fieldDefs.length > 0);
  }, [args.layout, args.definitions, defsById, hidden]);

  const [openSectionId, setOpenSectionId] = useState<string | null>(null);
  const openSection = sections.find((s) => s.id === openSectionId) ?? null;

  if (!sections.length) {
    return (
      <div className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
        No profile field sections configured. Add partner fields in Admin Settings.
      </div>
    );
  }

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {sections.map((s) => {
          const filled = sectionHasData(s.fieldDefs, args.values);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setOpenSectionId(s.id)}
              className={
                'text-left rounded-xl border px-4 py-3 transition-all hover:scale-[1.01] ' +
                (filled
                  ? 'border-emerald-400/40 bg-emerald-500/10 hover:border-emerald-400/55'
                  : 'border-violet-400/25 bg-violet-500/8 hover:border-violet-400/45 hover:bg-violet-500/12')
              }
            >
              <div className="flex items-center gap-2">
                {filled ? (
                  <Check size={14} className="text-emerald-400 shrink-0" />
                ) : (
                  <Plus size={14} className="text-violet-300 shrink-0" />
                )}
                <span className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>{s.title}</span>
              </div>
              <p className={`mt-1.5 ${FINELY_OS_ENTITY_BODY} text-xs leading-snug`}>
                {SECTION_HINTS[s.id] ?? 'Tap to open and fill out'}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-white/45">
                {filled ? 'Edit section' : 'Add info'}
              </p>
            </button>
          );
        })}
      </div>

      {openSection ? (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="partner-field-modal-title"
          onClick={() => setOpenSectionId(null)}
        >
          <div
            className={`${finelyOsCatalogCard('violet')} !p-0 w-full max-w-3xl max-h-[min(90vh,820px)] flex flex-col shadow-2xl`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 p-5 border-b border-white/10">
              <div>
                <p className={FINELY_OS_ENTITY_SUBLABEL}>Profile section</p>
                <h3 id="partner-field-modal-title" className={`mt-1 ${FINELY_OS_ENTITY_VALUE} text-lg`}>
                  {openSection.title}
                </h3>
                <p className={`mt-1 ${FINELY_OS_ENTITY_BODY} text-sm`}>
                  {SECTION_HINTS[openSection.id] ?? 'Fill in the fields below — saved automatically on blur.'}
                </p>
              </div>
              <button
                type="button"
                className={`${FINELY_OS_SECONDARY_BTN} !p-2`}
                onClick={() => setOpenSectionId(null)}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="grid sm:grid-cols-2 gap-4">
                {openSection.fieldDefs.map((def) => {
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

            <div className="p-4 border-t border-white/10 flex justify-end gap-2">
              <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setOpenSectionId(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
