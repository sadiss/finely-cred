import React, { useCallback, useEffect, useState } from 'react';
import { ChevronRight, X } from 'lucide-react';
import type { CustomFieldDefinition } from '../../domain/customFields';
import type { FieldLayout } from '../../domain/fieldLayouts';
import type { EntitlementKey } from '../../billing/entitlements';
import { PartnerProfileFieldSections } from './PartnerProfileFieldSections';
import { bureauShortCode } from '../../utils/bureaus';
import {
  FC_ADMIN_DANGER_BTN,
  FC_ADMIN_DANGER_PANEL,
  FC_ADMIN_INK_BODY,
  FC_ADMIN_INK_SUBLABEL,
  FC_ADMIN_INK_TITLE,
  FC_ADMIN_INK_VALUE,
  FC_ADMIN_LABEL,
  fcAdminCard,
  fcAdminOnSolidBody,
  fcAdminOnSolidSecondaryBtn,
  fcAdminOnSolidSublabel,
  fcAdminOnSolidText,
  fcAdminOnSolidValue,
  fcAdminScoreCell,
  fcAdminToneText,
  type FcAdminTone,
} from '../os/finelyOsAdminSurface';
import { FINELY_OS_FIXED_OVERLAY, FINELY_OS_MODAL_HEADER, FINELY_OS_MODAL_SHELL, finelyOsGlowField } from '../os/finelyOsLightUi';
import { FinelyOsModalCloseButton } from '../os/FinelyOsModalCloseButton';

const FINELY_OS_DANGER_BTN = FC_ADMIN_DANGER_BTN;
const FINELY_OS_DANGER_PANEL = `${FC_ADMIN_DANGER_PANEL} space-y-2`;
const FINELY_OS_DARK_GLASS_BODY = FC_ADMIN_INK_BODY;
const FINELY_OS_DARK_GLASS_SUBLABEL = FC_ADMIN_INK_SUBLABEL;
const FINELY_OS_DARK_GLASS_TITLE = FC_ADMIN_INK_TITLE;
const FINELY_OS_DARK_GLASS_VALUE = FC_ADMIN_INK_VALUE;
const FINELY_OS_ENTITY_ACCENT_LINK =
  'text-violet-200 underline-offset-2 hover:underline font-semibold text-sm';
const FINELY_OS_ENTITY_CHIP =
  'inline-flex items-center rounded-full border border-white/20 bg-black/25 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white/60';
const FINELY_OS_ENTITY_EMPTY =
  'rounded-xl border border-dashed border-white/20 bg-black/20 px-4 py-6 text-center text-sm text-white/70';
const FINELY_OS_ENTITY_LABEL = `${FC_ADMIN_LABEL} !text-white/55`;
const FINELY_OS_PAGE = 'space-y-3';
const FINELY_OS_DARK_SECONDARY_BTN =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 bg-black/30 px-3.5 py-2 text-xs font-semibold text-white/90 hover:bg-white/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:opacity-50 disabled:cursor-not-allowed';

type ProfileGlassTone = 'emerald' | 'gold' | 'sky' | 'violet' | 'rose';

function profileLaunchTone(accent: ProfileGlassTone): FcAdminTone {
  return accent;
}

function profileDarkGlassCard(tone: FcAdminTone | ProfileGlassTone = 'neutral') {
  const tint = tone === 'neutral' ? '' : ` fc-admin-dark-glass-tint-${tone}`;
  return `fc-admin-dark-glass-card${tint} rounded-2xl border p-4 text-white`;
}

function profileDarkGlassHero(tone: FcAdminTone = 'gold') {
  return `fc-admin-solid-${tone} rounded-2xl border p-4 sm:p-5`;
}

function profileDarkGlassCta(tone: ProfileGlassTone) {
  return `fc-admin-dark-glass-cta fc-admin-dark-glass-cta--${tone} px-3.5 py-2 text-xs font-semibold`;
}

function profileHeroChip(tone: 'gold' | 'emerald' | 'sky') {
  return `fc-admin-solid-${tone} rounded-xl border p-3 min-w-0`;
}

function profilePopupShell(tone: FcAdminTone) {
  const tint = tone === 'navy' ? 'violet' : tone;
  return `fc-admin-ink-panel fc-admin-dark-glass-tint-${tint} fc-partner-profile-popup rounded-2xl border text-white`;
}

type ScoreRow = { model: string; exp?: number | null; eqf?: number | null; tuc?: number | null };
type ProfilePanel = 'contact' | 'scores' | 'financial' | 'fields' | 'danger';
type ProfileActionAccent = ProfileGlassTone;

function PartnerProfileLaunchCard(props: {
  accent: ProfileActionAccent;
  title: string;
  description: string;
  buttonLabel: string;
  onClick: () => void;
}) {
  const tone = profileLaunchTone(props.accent);
  const SUBLABEL = fcAdminOnSolidSublabel(tone);
  const BODY = fcAdminOnSolidBody(tone);
  const BTN = fcAdminOnSolidSecondaryBtn(tone);
  return (
    <section className={`${fcAdminCard('p-4', tone, 'solid')} flex min-w-0 flex-col justify-between`}>
      <div>
        <p className={SUBLABEL}>{props.title}</p>
        <p className={`mt-1 ${BODY}`}>{props.description}</p>
      </div>
      <button type="button" className={`${BTN} mt-3 self-start`} onClick={props.onClick}>
        {props.buttonLabel}
        <ChevronRight size={15} aria-hidden="true" />
      </button>
    </section>
  );
}

function PartnerProfilePopup(props: {
  id: string;
  tone: FcAdminTone;
  eyebrow: string;
  title: string;
  description: string;
  onClose: () => void;
  shellClassName?: string;
  children: React.ReactNode;
}) {
  const shellSurface = props.shellClassName ?? profilePopupShell(props.tone);
  return (
    <div className={`${FINELY_OS_FIXED_OVERLAY} z-[240] flex items-center justify-center p-3 sm:p-6`} role="presentation">
      <button
        type="button"
        className="absolute inset-0 cursor-default"
        aria-label={`Close ${props.title}`}
        onClick={props.onClose}
      />
      <section
        className={`${FINELY_OS_MODAL_SHELL} ${shellSurface} relative z-10 w-full max-w-4xl !p-0`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={props.id}
      >
        <header className={FINELY_OS_MODAL_HEADER}>
          <div className="min-w-0">
            <p className={FINELY_OS_DARK_GLASS_SUBLABEL}>{props.eyebrow}</p>
            <h2 id={props.id} className={`mt-1 ${FINELY_OS_DARK_GLASS_TITLE}`}>
              {props.title}
            </h2>
            <p className={`mt-1 ${FINELY_OS_DARK_GLASS_BODY}`}>{props.description}</p>
          </div>
          <FinelyOsModalCloseButton onClick={props.onClose} aria-label={`Close ${props.title}`} />
        </header>
        <div className="max-h-[72vh] overflow-y-auto px-4 py-4 sm:px-5">{props.children}</div>
        <footer className="flex justify-end border-t border-white/10 px-4 py-3 sm:px-5">
          <button type="button" className={FINELY_OS_DARK_SECONDARY_BTN} onClick={props.onClose}>
            Close
          </button>
        </footer>
      </section>
    </div>
  );
}

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
  const [activePanel, setActivePanel] = useState<ProfilePanel | null>(null);
  const partnerStatus = String(partner.status || 'lead');
  const profileName = profileDraft.fullName.trim() || partner.profile.fullName || 'Partner profile';
  const mailingSummary = [profileDraft.address1, profileDraft.address2, profileDraft.city, profileDraft.state, profileDraft.postalCode]
    .map((value) => value.trim())
    .filter(Boolean)
    .join(', ');
  const scoreSummary = args.latestScoresRows.length
    ? `${args.latestScoresRows.length} score model${args.latestScoresRows.length === 1 ? '' : 's'} available`
    : 'No score values on file';

  const closePopup = useCallback(() => {
    setActivePanel(null);
    args.setDeleteOpen(false);
    args.setDeletePhrase('');
  }, [args.setDeleteOpen, args.setDeletePhrase]);

  useEffect(() => {
    if (!activePanel) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closePopup();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activePanel, closePopup]);

  const openAccessPanel = () => {
    const el = document.getElementById('admin-partner-access-panel');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      try {
        window.history.replaceState(null, '', '#admin-partner-access-panel');
      } catch {
        /* ignore */
      }
    }
  };

  return (
    <div className={`fc-admin-workspace fc-partner-profile-tab rounded-3xl border p-3 sm:p-4 ${FINELY_OS_PAGE}`}>
      <section className={`${profileDarkGlassHero('gold')} w-full ${fcAdminOnSolidText('gold')}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className={fcAdminOnSolidSublabel('gold')}>Partner profile</p>
            <h2 className={`mt-1 truncate ${fcAdminOnSolidValue('gold')}`}>{profileName}</h2>
            <p className={`mt-1 ${fcAdminOnSolidBody('gold')}`}>
              {profileDraft.email.trim() || 'Email not on file'} · {profileDraft.phone.trim() || 'Phone not on file'}
            </p>
          </div>
          <button type="button" className={profileDarkGlassCta('gold')} onClick={() => setActivePanel('contact')}>
            Edit profile details
            <ChevronRight size={15} aria-hidden="true" />
          </button>
        </div>

        <dl className="mt-3 grid gap-2 sm:grid-cols-3">
          <div className={profileHeroChip('gold')}>
            <dt className={fcAdminOnSolidSublabel('gold')}>Mailing</dt>
            <dd className={`mt-1 truncate text-sm ${fcAdminOnSolidValue('gold')}`} title={mailingSummary || undefined}>
              {mailingSummary || 'No mailing address on file'}
            </dd>
          </div>
          <div className={profileHeroChip('emerald')}>
            <dt className={fcAdminOnSolidSublabel('emerald')}>Partner status</dt>
            <dd className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`text-sm font-bold uppercase tracking-wide ${fcAdminOnSolidValue('emerald')}`}>{partnerStatus}</span>
              <span className={`text-xs ${fcAdminOnSolidBody('emerald')}`}>{activeCount} portal modules active</span>
            </dd>
          </div>
          <div className={profileHeroChip('sky')}>
            <dt className={fcAdminOnSolidSublabel('sky')}>Credit snapshot</dt>
            <dd className={`mt-1 text-sm ${fcAdminOnSolidValue('sky')}`}>{scoreSummary}</dd>
          </div>
        </dl>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        <PartnerProfileLaunchCard
          accent="sky"
          title="Latest score details"
          description="Review the latest report values by model and bureau."
          buttonLabel="View score details"
          onClick={() => setActivePanel('scores')}
        />
        <PartnerProfileLaunchCard
          accent="gold"
          title="Financial profile"
          description="Update debt-to-income inputs and the custom Denefit contract."
          buttonLabel="Open financial details"
          onClick={() => setActivePanel('financial')}
        />
        <PartnerProfileLaunchCard
          accent="emerald"
          title="Access & entitlements"
          description={`${activeCount} active portal modules · ${args.missingEntitlementKeys.length} missing. Grants and invites live in Access & authority below.`}
          buttonLabel="Open access panel"
          onClick={openAccessPanel}
        />
        <PartnerProfileLaunchCard
          accent="violet"
          title="Custom profile data"
          description={`${args.customDefs.length} configured field definitions across the partner profile.`}
          buttonLabel="Manage profile fields"
          onClick={() => setActivePanel('fields')}
        />
        {args.isAdmin ? (
          <PartnerProfileLaunchCard
            accent="rose"
            title="Deletion controls"
            description="Hard deletion is restricted to administrators and requires confirmation."
            buttonLabel="Open deletion controls"
            onClick={() => {
              args.setDeleteOpen(false);
              args.setDeletePhrase('');
              setActivePanel('danger');
            }}
          />
        ) : null}
      </div>

      {activePanel === 'contact' ? (
        <PartnerProfilePopup
          id="partner-contact-details-title"
          tone="gold"
          eyebrow="Identity & contact"
          title="Edit partner profile details"
          description="Keep the partner’s identity, contact information, and mailing address current."
          onClose={closePopup}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={FINELY_OS_ENTITY_LABEL}>Full name</label>
              <input
                value={profileDraft.fullName}
                onChange={(e) => setProfileDraft((p) => ({ ...p, fullName: e.target.value }))}
                className={`${finelyOsGlowField('amber')} mt-1.5`}
                placeholder="Full legal name"
              />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>Email</label>
              <input
                value={profileDraft.email}
                onChange={(e) => setProfileDraft((p) => ({ ...p, email: e.target.value }))}
                className={`${finelyOsGlowField('amber')} mt-1.5`}
                placeholder="email@example.com"
              />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>Phone</label>
              <input
                value={profileDraft.phone}
                onChange={(e) => setProfileDraft((p) => ({ ...p, phone: e.target.value }))}
                className={`${finelyOsGlowField('amber')} mt-1.5`}
                placeholder="(555) 555-5555"
              />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>Address line 1</label>
              <input
                value={profileDraft.address1}
                onChange={(e) => setProfileDraft((p) => ({ ...p, address1: e.target.value }))}
                className={`${finelyOsGlowField('amber')} mt-1.5`}
                placeholder="123 Main St"
              />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>Address line 2</label>
              <input
                value={profileDraft.address2}
                onChange={(e) => setProfileDraft((p) => ({ ...p, address2: e.target.value }))}
                className={`${finelyOsGlowField('amber')} mt-1.5`}
                placeholder="Apt, suite, unit (optional)"
              />
            </div>
            <div>
              <label className={FINELY_OS_ENTITY_LABEL}>City</label>
              <input
                value={profileDraft.city}
                onChange={(e) => setProfileDraft((p) => ({ ...p, city: e.target.value }))}
                className={`${finelyOsGlowField('amber')} mt-1.5`}
                placeholder="City"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>State</label>
                <input
                  value={profileDraft.state}
                  onChange={(e) => setProfileDraft((p) => ({ ...p, state: e.target.value }))}
                  className={`${finelyOsGlowField('amber')} mt-1.5`}
                  placeholder="ST"
                />
              </div>
              <div>
                <label className={FINELY_OS_ENTITY_LABEL}>Postal code</label>
                <input
                  value={profileDraft.postalCode}
                  onChange={(e) => setProfileDraft((p) => ({ ...p, postalCode: e.target.value }))}
                  className={`${finelyOsGlowField('amber')} mt-1.5`}
                  placeholder="12345"
                />
              </div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button type="button" className={profileDarkGlassCta('gold')} onClick={() => void args.onSaveProfile()}>
              Save contact & mailing
            </button>
            <button type="button" className={FINELY_OS_DARK_SECONDARY_BTN} onClick={args.onResetProfileDraft}>
              Reset
            </button>
          </div>
        </PartnerProfilePopup>
      ) : null}

      {activePanel === 'scores' ? (
        <PartnerProfilePopup
          id="partner-score-details-title"
          tone="sky"
          eyebrow="Credit scores"
          title="Latest score details"
          description="Latest report values on file, grouped by model and bureau."
          onClose={closePopup}
        >
          {args.latestScoresRows.length ? (
            <div className="space-y-2">
              <div className={`grid grid-cols-4 gap-2 px-1 ${FINELY_OS_DARK_GLASS_SUBLABEL} ${fcAdminToneText('sky')}`}>
                <div>Model</div>
                <div className="text-center">EXP</div>
                <div className="text-center">EQF</div>
                <div className="text-center">{bureauShortCode('TUC')}</div>
              </div>
              {args.latestScoresRows.map((r) => (
                <div
                  key={r.model}
                  className="grid grid-cols-4 items-center gap-2 rounded-xl border border-[var(--fc-admin-border-strong)] bg-[var(--fc-admin-surface)] px-3 py-2"
                >
                  <div className={FINELY_OS_DARK_GLASS_VALUE}>{r.model}</div>
                  <div className={fcAdminScoreCell('sky')}>
                    <span className={`font-mono text-base font-bold ${fcAdminOnSolidText('sky')}`}>{r.exp ?? '—'}</span>
                  </div>
                  <div className={fcAdminScoreCell('teal')}>
                    <span className={`font-mono text-base font-bold ${fcAdminOnSolidText('teal')}`}>{r.eqf ?? '—'}</span>
                  </div>
                  <div className={fcAdminScoreCell('sky')}>
                    <span className={`font-mono text-base font-bold ${fcAdminOnSolidText('sky')}`}>{r.tuc ?? '—'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={FINELY_OS_ENTITY_EMPTY}>No score values detected yet. Upload an HTML report that includes a score summary.</div>
          )}
        </PartnerProfilePopup>
      ) : null}

      {activePanel === 'financial' ? (
        <PartnerProfilePopup
          id="partner-financial-details-title"
          tone="gold"
          eyebrow="Financial profile"
          title="Debt-to-income & Denefit contract"
          description="Maintain the partner-provided income, monthly obligations, and custom contract."
          onClose={closePopup}
        >
          <div className="space-y-4">
            <section className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className={FINELY_OS_DARK_GLASS_SUBLABEL}>Debt-to-income (DTI)</p>
                  <p className={`mt-1 ${FINELY_OS_DARK_GLASS_BODY}`}>Partner-provided income and monthly obligations.</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className={FINELY_OS_DARK_GLASS_SUBLABEL}>DTI</div>
                  <div className={`mt-1 text-2xl font-semibold ${fcAdminToneText('gold')}`}>{args.dti == null ? '-' : `${args.dti}%`}</div>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div>
                  <label className={FINELY_OS_ENTITY_LABEL}>Annual income</label>
                  <input
                    type="number"
                    value={args.financialDraft.annualIncome}
                    onChange={(e) => args.setFinancialDraft((p) => ({ ...p, annualIncome: e.target.value }))}
                    className={`${finelyOsGlowField('amber')} mt-1.5`}
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
                    className={`${finelyOsGlowField('amber')} mt-1.5`}
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
                    className={`${finelyOsGlowField('amber')} mt-1.5`}
                    placeholder="1700"
                    min={0}
                  />
                </div>
              </div>
              <button type="button" className={profileDarkGlassCta('gold')} onClick={() => void args.onSaveFinancial()}>
                Save DTI inputs
              </button>
            </section>

            <section className="space-y-3 border-t border-white/10 pt-4">
              <p className={FINELY_OS_DARK_GLASS_SUBLABEL}>Custom Denefit contract</p>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className={FINELY_OS_ENTITY_LABEL}>Contract URL</label>
                  <input
                    value={args.denefitsContractUrlDraft}
                    onChange={(e) => args.setDenefitsContractUrlDraft(e.target.value)}
                    className={`${finelyOsGlowField('amber')} mt-1.5 font-mono text-sm`}
                    placeholder="https://… (Denefit embed/contract URL)"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className={FINELY_OS_ENTITY_LABEL}>Label (optional)</label>
                  <input
                    value={args.denefitsContractLabelDraft}
                    onChange={(e) => args.setDenefitsContractLabelDraft(e.target.value)}
                    className={`${finelyOsGlowField('amber')} mt-1.5 text-sm`}
                    placeholder="e.g. Custom contract — AU bundle"
                  />
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  className={profileDarkGlassCta('gold')}
                  disabled={!args.denefitsContractUrlDraft.trim()}
                  onClick={() => void args.onAssignDenefits()}
                >
                  Assign contract
                </button>
                <button type="button" className={FINELY_OS_DARK_SECONDARY_BTN} onClick={args.onRevertDenefits}>
                  Revert
                </button>
                <button type="button" className={FINELY_OS_DANGER_BTN} onClick={() => void args.onClearDenefits()}>
                  Clear
                </button>
                {partner.denefits?.contractUrl ? (
                  <a
                    href={partner.denefits.contractUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={profileDarkGlassCta('sky')}
                  >
                    Open current
                  </a>
                ) : null}
              </div>
            </section>
          </div>
        </PartnerProfilePopup>
      ) : null}

      {activePanel === 'fields' ? (
        <PartnerProfilePopup
          id="partner-profile-fields-title"
          tone="navy"
          eyebrow="Custom profile data"
          title="Manage profile fields"
          description="Open a section to update identity, business, monitoring, bureau login, or note data."
          onClose={closePopup}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className={FINELY_OS_DARK_GLASS_BODY}>
              Add, edit, or review the profile fields available to this partner.{' '}
              <button
                type="button"
                onClick={() => {
                  closePopup();
                  args.onOpenSettings();
                }}
                className={FINELY_OS_ENTITY_ACCENT_LINK}
              >
                Admin Settings
              </button>
            </p>
            <div className="flex flex-wrap gap-2">
              <span className={FINELY_OS_ENTITY_CHIP}>
                tenant: <span className={`${FINELY_OS_DARK_GLASS_VALUE} font-mono`}>{args.tenantId}</span>
              </span>
              <span className={FINELY_OS_ENTITY_CHIP}>
                defs <span className={FINELY_OS_DARK_GLASS_VALUE}>{args.customDefs.length}</span>
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
        </PartnerProfilePopup>
      ) : null}

      {activePanel === 'danger' && args.isAdmin ? (
        <PartnerProfilePopup
          id="partner-deletion-controls-title"
          tone="rose"
          eyebrow="Danger zone"
          title="Delete partner"
          description="Hard deletion removes the partner profile and cannot be undone."
          onClose={closePopup}
        >
          <div className={FINELY_OS_DANGER_PANEL}>
            <div className={fcAdminOnSolidSublabel('rose')}>Restricted action</div>
            <div className={`mt-2 ${fcAdminOnSolidBody('rose')}`}>Only proceed when this partner profile must be permanently removed.</div>
            {!args.deleteOpen ? (
              <div className="mt-3">
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
            ) : (
              <div className="mt-4 space-y-3 rounded-xl border border-white/25 bg-black/20 p-4">
                <div className={`text-sm ${fcAdminOnSolidBody('rose')}`}>
                  Type <span className="font-mono font-semibold text-white">DELETE</span> to confirm.
                </div>
                <input
                  value={args.deletePhrase}
                  onChange={(e) => args.setDeletePhrase(e.target.value)}
                  className={`${finelyOsGlowField('rose')} mt-1.5`}
                  placeholder="DELETE"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={args.deletePhrase.trim().toUpperCase() !== 'DELETE'}
                    className={FINELY_OS_DANGER_BTN}
                    onClick={() => void args.onDeletePartner()}
                  >
                    Confirm delete
                  </button>
                  <button
                    type="button"
                    className={FINELY_OS_DARK_SECONDARY_BTN}
                    onClick={() => {
                      args.setDeleteOpen(false);
                      args.setDeletePhrase('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </PartnerProfilePopup>
      ) : null}
    </div>
  );
}
