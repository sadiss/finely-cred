import React, { useState } from 'react';
import { RefreshCcw } from 'lucide-react';
import type { CustomFieldDefinition } from '../../domain/customFields';
import type { FieldLayout } from '../../domain/fieldLayouts';
import type { EntitlementKey } from '../../billing/entitlements';
import { entitlementLabel } from '../../billing/entitlementLabels';
import { PartnerProfileFieldSections } from './PartnerProfileFieldSections';
import { SensitiveActionCodeGate } from '../../components/admin/SensitiveActionCodeGate';
import { bureauShortCode } from '../../utils/bureaus';
import {
  FC_ADMIN_BODY,
  FC_ADMIN_DANGER_BTN,
  FC_ADMIN_INPUT,
  FC_ADMIN_LABEL,
  FC_ADMIN_PRIMARY_BTN,
  FC_ADMIN_SECONDARY_BTN,
  FC_ADMIN_SUBLABEL,
  FC_ADMIN_TITLE,
  FC_ADMIN_VALUE,
  fcAdminCard,
  fcAdminStatusChip,
} from '../os/finelyOsAdminSurface';

const FINELY_OS_DANGER_BTN = FC_ADMIN_DANGER_BTN;
const FINELY_OS_DANGER_PANEL =
  'rounded-2xl border border-[var(--fc-admin-status-risk)]/30 bg-[var(--fc-admin-status-risk)]/5 p-5 space-y-2';
const FINELY_OS_ENTITY_ACCENT_LINK =
  'text-[var(--fc-admin-accent)] underline-offset-2 hover:underline font-semibold text-sm';
const FINELY_OS_ENTITY_ACTION = FC_ADMIN_SECONDARY_BTN;
const FINELY_OS_ENTITY_BODY = FC_ADMIN_BODY;
const FINELY_OS_ENTITY_CHIP =
  'inline-flex items-center rounded-full border border-[var(--fc-admin-border)] bg-[var(--fc-admin-surface-sunken)] px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--fc-admin-ink-muted)]';
const FINELY_OS_ENTITY_EMPTY = `rounded-xl border border-dashed border-[var(--fc-admin-border)] ${FC_ADMIN_BODY} px-4 py-6 text-center`;
const FINELY_OS_ENTITY_INPUT = FC_ADMIN_INPUT;
const FINELY_OS_ENTITY_LABEL = FC_ADMIN_LABEL;
const FINELY_OS_ENTITY_SUBLABEL = FC_ADMIN_SUBLABEL;
const FINELY_OS_ENTITY_TITLE = FC_ADMIN_TITLE;
const FINELY_OS_ENTITY_VALUE = FC_ADMIN_VALUE;
const FINELY_OS_PAGE = 'space-y-4';
const FINELY_OS_PRIMARY_BTN = FC_ADMIN_PRIMARY_BTN;
const FINELY_OS_SECONDARY_BTN = FC_ADMIN_SECONDARY_BTN;
const FINELY_OS_SUCCESS_BTN = FC_ADMIN_PRIMARY_BTN;
function finelyOsCatalogCardCompact(_accent?: string) {
  return fcAdminCard('p-4');
}
function finelyOsStatusChip(tone: 'ok' | 'warn' | 'blocked') {
  return fcAdminStatusChip(tone);
}

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
  const activeCount = Array.from(args.activeEntitlementKeys).length;
  const [grantAllGateOpen, setGrantAllGateOpen] = useState(false);

  return (
    <div className={FINELY_OS_PAGE}>
      {/* 1. Credit scores — fully visible, no <details> */}
      <div className={`${finelyOsCatalogCardCompact('emerald')} w-full`}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Credit scores</p>
            <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>Latest report on file, by model.</p>
          </div>
        </div>

        {args.latestScoresRows.length ? (
          <div className="mt-4 rounded-xl border border-[var(--fc-admin-border)] overflow-hidden">
            <div className="grid grid-cols-4 gap-2 px-4 py-2 bg-[var(--fc-admin-surface-sunken)] text-[10px] font-bold uppercase tracking-widest text-[var(--fc-admin-ink-faint)]">
              <div>Model</div>
              <div>EXP</div>
              <div>EQF</div>
              <div>{bureauShortCode('TUC')}</div>
            </div>
            <div className="divide-y divide-[var(--fc-admin-border)]">
              {args.latestScoresRows.map((r) => (
                <div key={r.model} className="grid grid-cols-4 gap-2 px-4 py-3 items-center">
                  <div className={FINELY_OS_ENTITY_VALUE}>{r.model}</div>
                  <div className="font-mono text-sm text-[var(--fc-admin-ink)]">{r.exp ?? '-'}</div>
                  <div className="font-mono text-sm text-[var(--fc-admin-ink)]">{r.eqf ?? '-'}</div>
                  <div className="font-mono text-sm text-[var(--fc-admin-ink)]">{r.tuc ?? '-'}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className={FINELY_OS_ENTITY_EMPTY}>No score values detected yet. Upload an HTML report that includes score summary.</div>
        )}
      </div>

      {/* 2. Contact & mailing — tighter grid */}
      <div className={`${finelyOsCatalogCardCompact('violet')} w-full`}>
        <div>
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Contact & mailing</p>
          <p className={`mt-1 ${FINELY_OS_ENTITY_TITLE}`}>{partner.profile.fullName}</p>
        </div>

        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
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
          <div>
            <label className={FINELY_OS_ENTITY_LABEL}>Address line 1</label>
            <input
              value={profileDraft.address1}
              onChange={(e) => setProfileDraft((p) => ({ ...p, address1: e.target.value }))}
              className={FINELY_OS_ENTITY_INPUT}
              placeholder="123 Main St"
            />
          </div>
          <div>
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
          <div className="grid grid-cols-2 gap-3">
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
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => void args.onSaveProfile()}>
            Save contact & mailing
          </button>
          <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={args.onResetProfileDraft}>
            Reset
          </button>
        </div>
      </div>

      {/* 3. Module access / entitlements — compact, always visible */}
      <div className={`${finelyOsCatalogCardCompact('violet')} w-full`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Module access</p>
            <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
              Entitlements control which Partner Portal modules this partner can see. {activeCount} active · {args.missingEntitlementKeys.length} missing.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 shrink-0">
            <button type="button" className={FINELY_OS_PRIMARY_BTN} onClick={() => setGrantAllGateOpen(true)}>
              Grant all portal modules
            </button>
            <button type="button" className={FINELY_OS_ENTITY_ACTION} onClick={args.onRefreshEntitlements}>
              <RefreshCcw size={14} /> Refresh
            </button>
          </div>
        </div>

        <div className="mt-4 grid sm:grid-cols-2 gap-4">
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Active</div>
            {activeCount ? (
              <div className="mt-2 flex flex-wrap gap-2">
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
          <div>
            <div className={FINELY_OS_ENTITY_SUBLABEL}>Missing</div>
            {args.missingEntitlementKeys.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {args.missingEntitlementKeys
                  .slice()
                  .sort()
                  .map((k) => (
                    <span
                      key={k}
                      className="px-3 py-1.5 rounded-xl border border-[var(--fc-admin-border)] bg-[var(--fc-admin-surface-sunken)] text-[var(--fc-admin-ink-muted)] text-xs font-semibold normal-case tracking-normal"
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

      {/* 4. DTI + Denefit contract — secondary, collapsed by default */}
      <details className={`${finelyOsCatalogCardCompact('violet')} group w-full`}>
        <summary className={`cursor-pointer select-none ${FINELY_OS_ENTITY_VALUE}`}>
          Debt-to-income & Denefit contract
        </summary>
        <div className="mt-4 space-y-4 border-t border-[var(--fc-admin-border)] pt-4">
          <div className="space-y-3">
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
            <div className="grid md:grid-cols-3 gap-3">
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

          <div className="space-y-3 border-t border-[var(--fc-admin-border)] pt-4">
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

      {/* 5. Profile field sections — quieter, existing behavior */}
      <div className="rounded-2xl border border-[var(--fc-admin-border)] bg-[var(--fc-admin-surface)] p-4 w-full">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={FINELY_OS_ENTITY_SUBLABEL}>Profile field sections</p>
            <p className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
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
          <div className={FINELY_OS_ENTITY_EMPTY}>No custom fields configured yet.</div>
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

      {/* 6. Danger zone — admin only, last */}
      {args.isAdmin ? (
        <div className={FINELY_OS_DANGER_PANEL}>
          <div className={`${FINELY_OS_ENTITY_SUBLABEL} text-[var(--fc-admin-status-risk)]`}>Danger zone</div>
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
            <div className={`mt-4 rounded-xl border border-[var(--fc-admin-status-risk)]/35 bg-[var(--fc-admin-status-risk)]/5 p-4 space-y-3 ${FINELY_OS_ENTITY_BODY}`}>
              <div className={`${FINELY_OS_ENTITY_BODY} text-sm`}>
                Type <span className="font-mono font-semibold text-[var(--fc-admin-status-risk)]">DELETE</span> to confirm.
              </div>
              <input
                value={args.deletePhrase}
                onChange={(e) => args.setDeletePhrase(e.target.value)}
                className={`${FINELY_OS_ENTITY_INPUT} focus:border-[var(--fc-admin-status-risk)]`}
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

      <SensitiveActionCodeGate
        open={grantAllGateOpen}
        action="partner_access_grant"
        title="Authorize — Grant all portal modules"
        description={`Grants every entitlement key for ${partner.profile.fullName} in one action.`}
        onClose={() => setGrantAllGateOpen(false)}
        onVerified={() => {
          setGrantAllGateOpen(false);
          args.onGrantAllEntitlements();
        }}
      />
    </div>
  );
}
