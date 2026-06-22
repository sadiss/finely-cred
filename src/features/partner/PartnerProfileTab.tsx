import React from 'react';
import { RefreshCcw } from 'lucide-react';
import type { CustomFieldDefinition } from '../../domain/customFields';
import type { FieldLayout } from '../../domain/fieldLayouts';
import type { EntitlementKey } from '../../billing/entitlements';
import { entitlementLabel } from '../../billing/entitlementLabels';
import { PartnerProfileFieldSections } from './PartnerProfileFieldSections';
import { bureauShortCode } from '../../utils/bureaus';
import {
  FINELY_OS_DANGER_BTN,
  FINELY_OS_DANGER_PANEL,
  FINELY_OS_ENTITY_ACCENT_LINK,
  FINELY_OS_ENTITY_ACTION,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_EMPTY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  finelyOsCatalogCard,
  finelyOsInlineListItem,
  finelyOsStatusChip,
} from '../os/finelyOsLightUi';

type ScoreRow = { model: string; exp?: number | null; eqf?: number | null; tuc?: number | null };

export function PartnerProfileTab(args: {
  partner: any;
  tenantId: string;
  profileRouteKey: string;
  profilePersonal: Record<string, unknown>;
  profileDraft: {
    fullName: string;
    email: string;
    phone: string;
    address1: string;
    address2: string;
    city: string;
    state: string;
    postalCode: string;
  };
  setProfileDraft: React.Dispatch<
    React.SetStateAction<{
      fullName: string;
      email: string;
      phone: string;
      address1: string;
      address2: string;
      city: string;
      state: string;
      postalCode: string;
    }>
  >;
  customDefs: CustomFieldDefinition[];
  partnerFieldLayout: FieldLayout | null;
  customFieldDraft: Record<string, unknown>;
  updateCustomField: (key: string, value: unknown, persist: boolean) => void;
  financialDraft: { annualIncome: string; monthlyDebtPayments: string; monthlyHousing: string };
  setFinancialDraft: React.Dispatch<React.SetStateAction<typeof args.financialDraft>>;
  dti: number | null;
  denefitsContractUrlDraft: string;
  setDenefitsContractUrlDraft: (v: string) => void;
  denefitsContractLabelDraft: string;
  setDenefitsContractLabelDraft: (v: string) => void;
  activeEntitlementKeys: Set<string>;
  missingEntitlementKeys: EntitlementKey[];
  allPortalEntitlementKeys: EntitlementKey[];
  latestScoresRows: ScoreRow[];
  actorEmail: string | null | undefined;
  isAdmin: boolean;
  deleteOpen: boolean;
  setDeleteOpen: (v: boolean) => void;
  deletePhrase: string;
  setDeletePhrase: (v: string) => void;
  onSaveProfile: () => void | Promise<void>;
  onResetProfileDraft: () => void;
  onDeletePartner: () => void | Promise<void>;
  onSaveFinancial: () => void | Promise<void>;
  onAssignDenefits: () => void | Promise<void>;
  onRevertDenefits: () => void;
  onClearDenefits: () => void | Promise<void>;
  onGrantAllEntitlements: () => void;
  onRefreshEntitlements: () => void;
  onOpenSettings: () => void;
}) {
  const { partner, profileDraft, setProfileDraft } = args;

  return (
    <div className="space-y-6">
      <div className={`${finelyOsCatalogCard('violet')} !p-5 w-full`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Contact & mailing</p>
            <p className={`mt-2 ${FINELY_OS_ENTITY_TITLE}`}>{partner.profile.fullName}</p>
            <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>Primary info used on letters and portal — full width, not duplicated in custom fields below.</p>
          </div>
        </div>

        <div className="mt-5 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2 lg:col-span-3">
            <label className={FINELY_OS_ENTITY_LABEL}>Full name</label>
            <input
              value={profileDraft.fullName}
              onChange={(e) => setProfileDraft((p) => ({ ...p, fullName: e.target.value }))}
              className={FINELY_OS_ENTITY_INPUT}
              placeholder="Full legal name"
            />
          </div>
          <div>
            <label className={FINELY_OS_ENTITY_LABEL}>Email</label>
            <input
              value={profileDraft.email}
              onChange={(e) => setProfileDraft((p) => ({ ...p, email: e.target.value }))}
              className={FINELY_OS_ENTITY_INPUT}
              placeholder="email@example.com"
            />
          </div>
          <div>
            <label className={FINELY_OS_ENTITY_LABEL}>Phone</label>
            <input
              value={profileDraft.phone}
              onChange={(e) => setProfileDraft((p) => ({ ...p, phone: e.target.value }))}
              className={FINELY_OS_ENTITY_INPUT}
              placeholder="(555) 555-5555"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className={FINELY_OS_ENTITY_LABEL}>Address line 1</label>
            <input
              value={profileDraft.address1}
              onChange={(e) => setProfileDraft((p) => ({ ...p, address1: e.target.value }))}
              className={FINELY_OS_ENTITY_INPUT}
              placeholder="123 Main St"
            />
          </div>
          <div className="sm:col-span-2 lg:col-span-3">
            <label className={FINELY_OS_ENTITY_LABEL}>Address line 2</label>
            <input
              value={profileDraft.address2}
              onChange={(e) => setProfileDraft((p) => ({ ...p, address2: e.target.value }))}
              className={FINELY_OS_ENTITY_INPUT}
              placeholder="Apt, suite, unit (optional)"
            />
          </div>
          <div>
            <label className={FINELY_OS_ENTITY_LABEL}>City</label>
            <input
              value={profileDraft.city}
              onChange={(e) => setProfileDraft((p) => ({ ...p, city: e.target.value }))}
              className={FINELY_OS_ENTITY_INPUT}
              placeholder="City"
            />
          </div>
          <div>
            <label className={FINELY_OS_ENTITY_LABEL}>State</label>
            <input
              value={profileDraft.state}
              onChange={(e) => setProfileDraft((p) => ({ ...p, state: e.target.value }))}
              className={FINELY_OS_ENTITY_INPUT}
              placeholder="ST"
            />
          </div>
          <div>
            <label className={FINELY_OS_ENTITY_LABEL}>Postal code</label>
            <input
              value={profileDraft.postalCode}
              onChange={(e) => setProfileDraft((p) => ({ ...p, postalCode: e.target.value }))}
              className={FINELY_OS_ENTITY_INPUT}
              placeholder="12345"
            />
          </div>
        </div>

        <div id="partner-profile-fields" className="mt-6 pt-6 border-t border-white/10">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Profile field sections</p>
              <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                Tap a section to open it — identity, business, monitoring logins, bureau logins, and notes.{' '}
                <button type="button" onClick={args.onOpenSettings} className={FINELY_OS_ENTITY_ACCENT_LINK}>
                  Admin Settings
                </button>
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
              <span className={FINELY_OS_ENTITY_CHIP}>
                tenant: <span className={`${FINELY_OS_ENTITY_VALUE} font-mono`}>{args.tenantId}</span>
              </span>
              <span className={FINELY_OS_ENTITY_CHIP}>
                defs <span className={FINELY_OS_ENTITY_VALUE}>{args.customDefs.length}</span>
              </span>
            </div>
          </div>

          {args.customDefs.length === 0 ? (
            <div className={`mt-4 ${FINELY_OS_ENTITY_EMPTY}`}>No custom fields configured yet.</div>
          ) : (
            <div className="mt-4">
              <PartnerProfileFieldSections
                layout={args.partnerFieldLayout}
                definitions={args.customDefs}
                values={args.customFieldDraft || {}}
                onChangeValue={args.updateCustomField}
              />
            </div>
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => void args.onSaveProfile()}>
            Save contact & mailing
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={args.onResetProfileDraft}>
            Reset
          </button>
        </div>
      </div>

      <details className={`${finelyOsCatalogCard('violet')} !p-5 group`}>
        <summary className={`cursor-pointer select-none ${FINELY_OS_ENTITY_VALUE}`}>Billing, entitlements & DTI</summary>
        <div className="mt-5 space-y-6 border-t border-white/10 pt-5">
          <div>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className={FINELY_OS_ENTITY_SUBLABEL}>Portal entitlements</p>
                <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>Controls which Partner Portal modules appear.</p>
                <p className={`mt-1 text-xs font-mono ${FINELY_OS_ENTITY_BODY}`}>
                  Active: {Array.from(args.activeEntitlementKeys).length} • Missing: {args.missingEntitlementKeys.length}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                  onClick={args.onGrantAllEntitlements}
                >
                  Grant all portal modules
                </button>
                <button type="button" className={FINELY_OS_ENTITY_ACTION} onClick={args.onRefreshEntitlements}>
                  <RefreshCcw size={14} /> Refresh
                </button>
              </div>
            </div>
            <div className="mt-4 grid md:grid-cols-2 gap-3">
              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Active keys</div>
                {Array.from(args.activeEntitlementKeys).length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Array.from(args.activeEntitlementKeys)
                      .sort()
                      .map((k) => (
                        <span key={k} className={`${finelyOsStatusChip('ok')} normal-case tracking-normal font-semibold`}>
                          {entitlementLabel(k)}
                        </span>
                      ))}
                  </div>
                ) : (
                  <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>None</div>
                )}
              </div>
              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Missing keys</div>
                {args.missingEntitlementKeys.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {args.missingEntitlementKeys
                      .slice()
                      .sort()
                      .map((k) => (
                        <span
                          key={k}
                          className="px-3 py-1.5 rounded-xl border border-amber-500/35 bg-amber-500/15 text-amber-100 text-xs font-semibold normal-case tracking-normal"
                        >
                          {entitlementLabel(k)}
                        </span>
                      ))}
                  </div>
                ) : (
                  <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>None</div>
                )}
              </div>
            </div>
          </div>

          <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-4`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className={FINELY_OS_ENTITY_SUBLABEL}>Debt-to-income (DTI)</p>
                <p className={FINELY_OS_ENTITY_BODY}>Partner-provided income and monthly obligations.</p>
              </div>
              <div className="text-right shrink-0">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>DTI</div>
                <div className={`mt-1 text-2xl font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{args.dti == null ? '-' : `${args.dti}%`}</div>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>Annual income</label>
                <input
                  type="number"
                  value={args.financialDraft.annualIncome}
                  onChange={(e) => args.setFinancialDraft((p) => ({ ...p, annualIncome: e.target.value }))}
                  className={FINELY_OS_ENTITY_INPUT}
                  placeholder="90000"
                  min={0}
                />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>Monthly debt payments</label>
                <input
                  type="number"
                  value={args.financialDraft.monthlyDebtPayments}
                  onChange={(e) => args.setFinancialDraft((p) => ({ ...p, monthlyDebtPayments: e.target.value }))}
                  className={FINELY_OS_ENTITY_INPUT}
                  placeholder="850"
                  min={0}
                />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>Monthly housing</label>
                <input
                  type="number"
                  value={args.financialDraft.monthlyHousing}
                  onChange={(e) => args.setFinancialDraft((p) => ({ ...p, monthlyHousing: e.target.value }))}
                  className={FINELY_OS_ENTITY_INPUT}
                  placeholder="1700"
                  min={0}
                />
              </div>
            </div>
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => void args.onSaveFinancial()}>
              Save DTI inputs
            </button>
          </div>

          <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Custom Denefit contract</p>
            <div className="grid md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className={FINELY_OS_ENTITY_LABEL}>Contract URL</label>
                <input
                  value={args.denefitsContractUrlDraft}
                  onChange={(e) => args.setDenefitsContractUrlDraft(e.target.value)}
                  className={`${FINELY_OS_ENTITY_INPUT} font-mono text-sm`}
                  placeholder="https://… (Denefit embed/contract URL)"
                />
              </div>
              <div className="md:col-span-2">
                <label className={FINELY_OS_ENTITY_LABEL}>Label (optional)</label>
                <input
                  value={args.denefitsContractLabelDraft}
                  onChange={(e) => args.setDenefitsContractLabelDraft(e.target.value)}
                  className={`${FINELY_OS_ENTITY_INPUT} text-sm`}
                  placeholder="e.g. Custom contract — AU bundle"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 items-center">
              <button type="button" className={FINELY_OS_PRIMARY_BTN} disabled={!args.denefitsContractUrlDraft.trim()} onClick={() => void args.onAssignDenefits()}>
                Assign contract
              </button>
              <button type="button" className={FINELY_OS_ENTITY_ACTION} onClick={args.onRevertDenefits}>
                Revert
              </button>
              <button type="button" className={FINELY_OS_DANGER_BTN} onClick={() => void args.onClearDenefits()}>
                Clear
              </button>
              {partner.denefits?.contractUrl ? (
                <a href={partner.denefits.contractUrl} target="_blank" rel="noopener noreferrer" className={`${FINELY_OS_SUCCESS_BTN} ml-auto`}>
                  Open current
                </a>
              ) : null}
            </div>
          </div>
        </div>
      </details>

      <details className={`${finelyOsCatalogCard('violet')} !p-5 group`}>
        <summary className={`cursor-pointer select-none ${FINELY_OS_ENTITY_VALUE}`}>Credit scores (latest report)</summary>
        <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
          {args.latestScoresRows.length ? (
            args.latestScoresRows.map((r) => (
              <div key={r.model} className={`${finelyOsInlineListItem()} p-4 w-full`}>
                <div className={FINELY_OS_ENTITY_VALUE}>{r.model}</div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-[11px] max-w-xl">
                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>EXP</div>
                    <div className={`${FINELY_OS_ENTITY_VALUE} font-mono`}>{r.exp ?? '-'}</div>
                  </div>
                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>EQF</div>
                    <div className={`${FINELY_OS_ENTITY_VALUE} font-mono`}>{r.eqf ?? '-'}</div>
                  </div>
                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>{bureauShortCode('TUC')}</div>
                    <div className={`${FINELY_OS_ENTITY_VALUE} font-mono`}>{r.tuc ?? '-'}</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={FINELY_OS_ENTITY_BODY}>No score values detected yet. Upload an HTML report that includes score summary.</div>
          )}
        </div>
      </details>

      {args.isAdmin ? (
        <div className={FINELY_OS_DANGER_PANEL}>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-rose-300`}>Danger zone</div>
          <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>Hard delete removes the partner profile.</div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              className={FINELY_OS_DANGER_BTN}
              onClick={() => {
                args.setDeleteOpen(true);
                args.setDeletePhrase('');
              }}
            >
              Delete partner
            </button>
          </div>
          {args.deleteOpen ? (
            <div className={`mt-4 rounded-xl border border-rose-500/35 bg-white/[0.07] p-4 space-y-3 ${FINELY_OS_ENTITY_BODY}`}>
              <div className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
                Type <span className="font-mono font-semibold text-rose-300">DELETE</span> to confirm.
              </div>
              <input
                value={args.deletePhrase}
                onChange={(e) => args.setDeletePhrase(e.target.value)}
                className={`${FINELY_OS_ENTITY_INPUT} focus:border-rose-400`}
                placeholder="DELETE"
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={args.deletePhrase.trim().toUpperCase() !== 'DELETE'}
                  className={`${FINELY_OS_DANGER_BTN} disabled:opacity-50 disabled:cursor-not-allowed`}
                  onClick={() => void args.onDeletePartner()}
                >
                  Confirm delete
                </button>
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => args.setDeleteOpen(false)}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
