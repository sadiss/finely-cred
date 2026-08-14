import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Building2, FileText, LayoutGrid, Target, Users, Crown, BookOpen, AlertTriangle, ChevronDown, Globe } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EntityDetailShell } from '../../components/layout/EntityDetailShell';
import { usePartnerSession } from '../../auth/PartnerSessionContext';
import { upsertPartner } from '../../data/partnersRepo';
import { BUSINESS_TYPE_OPTIONS } from '../../lib/businessVendorSequencing';
import { listCustomFieldDefinitionsByScope } from '../../data/customFieldsRepo';
import { getFieldLayout } from '../../data/fieldLayoutsRepo';
import { getCustomFieldValues, upsertCustomFieldValues } from '../../data/customFieldValuesRepo';
import { FieldLayoutRenderer } from '../../components/fields/FieldLayoutRenderer';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import {
  FinelyUnifiedHubLayout,
  PartnerHubLauncherGrid,
  PartnerHubWorkModal,
  usePartnerHubLauncher,
} from '../../features/unified/FinelyUnifiedHubLayout';
import {
  buildBusinessProfileLauncherTiles,
  ROLE_HUB_MODAL_ACCENT,
  type BusinessProfileLauncherId,
} from '../../components/partner/roleHubLauncherPresets';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCardCompact,
  finelyOsGlowPanel,
  finelyOsGlowTile,
  finelyOsStatusChip,
} from '../../features/os/finelyOsLightUi';
import {
  getFundingRulesForApplicantType,
  getInternationalCreditSystem,
  type InternationalCreditSystem,
  type NonCitizenFundingRule,
} from '../../data/internationalAndNonCitizenCreditRepo';

const BUSINESS_SHORTCUTS = [
  { path: '/business/vendors', label: 'Vendors', icon: Users },
  { path: '/business/bureaus', label: 'Bureaus & scores', icon: BookOpen },
  { path: '/business/lender-logic', label: 'Lender logic', icon: Target },
  { path: '/business/documents', label: 'Documents', icon: FileText },
  { path: '/business/disputes', label: 'Disputes', icon: AlertTriangle },
  { path: '/business/billion-path', label: 'Billion path', icon: Crown },
] as const;

/** Deep-link anchor for the non-citizen/international credit panel (linked from /business/funding — B3). */
export const NON_CITIZEN_PANEL_ANCHOR_ID = 'non-citizen-international-credit';

const NON_CITIZEN_APPLICANT_TYPE_OPTIONS: { id: NonCitizenFundingRule['applicantType']; label: string }[] = [
  { id: 'itin_holder', label: 'ITIN holder' },
  { id: 'foreign_national_e2_eb5', label: 'E-2 / EB-5 foreign national' },
  { id: 'non_resident_llc', label: 'Non-resident LLC' },
  { id: 'daca_recipient', label: 'DACA recipient' },
  { id: 'green_card_holder', label: 'Green card holder' },
];

const NON_CITIZEN_LOAN_TYPE_LABELS: Record<NonCitizenFundingRule['loanType'], string> = {
  business_line_of_credit: 'Business line of credit',
  equipment_financing: 'Equipment financing',
  sba_7a: 'SBA 7(a)',
  merchant_cash_advance: 'Merchant cash advance',
  business_term_loan: 'Business term loan',
  commercial_real_estate: 'Commercial real estate',
};

const INTERNATIONAL_COUNTRY_OPTIONS: { id: InternationalCreditSystem['countryCode']; label: string }[] = [
  { id: 'CA', label: 'Canada' },
  { id: 'UK', label: 'United Kingdom' },
  { id: 'DE', label: 'Germany' },
  { id: 'EU_GENERAL', label: 'EU general' },
];

export default function BusinessProfilePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { partner } = usePartnerSession();
  const hubLauncher = usePartnerHubLauncher<BusinessProfileLauncherId>();
  const nonCitizenPanelRef = useRef<HTMLDetailsElement | null>(null);
  const [nonCitizenPanelOpen, setNonCitizenPanelOpen] = useState(false);

  const business = useMemo(() => {
    const r: any = partner?.routes?.business_build ?? {};
    return r.business ?? {};
  }, [partner]);
  const [businessName, setBusinessName] = useState<string>(business.businessName || '');
  const [entityState, setEntityState] = useState<string>(business.entityState || '');
  const [einLast4, setEinLast4] = useState<string>(business.einLast4 || '');
  const [businessType, setBusinessType] = useState<string>(business.businessType || 'general');
  const [businessAddress, setBusinessAddress] = useState<string>(business.businessAddress || business.addressLine1 || '');
  const [domainEmail, setDomainEmail] = useState<string>(business.domainEmail || '');
  const [website, setWebsite] = useState<string>(business.website || '');

  const [selectedApplicantType, setSelectedApplicantType] = useState<NonCitizenFundingRule['applicantType'] | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<InternationalCreditSystem['countryCode'] | null>(null);

  const matchedFundingRules = useMemo(
    () => (selectedApplicantType ? getFundingRulesForApplicantType(selectedApplicantType) : []),
    [selectedApplicantType],
  );
  const matchedCountrySystem = useMemo(
    () => (selectedCountryCode ? getInternationalCreditSystem(selectedCountryCode) : null),
    [selectedCountryCode],
  );

  const tenantId = (partner?.tenantId || '').trim() || FINELY_TENANT_ID;
  const fieldDefs = useMemo(() => listCustomFieldDefinitionsByScope('partners', tenantId), [tenantId]);
  const fieldLayout = useMemo(() => getFieldLayout({ tenantId, scope: 'partners' }), [tenantId]);
  const valuesRecord = useMemo(() => (partner ? getCustomFieldValues('partners', partner.id, tenantId) : null), [partner?.id, tenantId]);
  const [values, setValues] = useState<Record<string, any>>(valuesRecord?.values ?? {});

  useEffect(() => {
    setValues(valuesRecord?.values ?? {});
  }, [valuesRecord?.updatedAt, partner?.id]);

  // Deep-link support for /business/funding's non-citizen doctrine link (B3): ?panel=non-citizen
  useEffect(() => {
    if (searchParams.get('panel') !== 'non-citizen') return;
    setNonCitizenPanelOpen(true);
    const t = window.setTimeout(() => {
      nonCitizenPanelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
    return () => window.clearTimeout(t);
  }, [searchParams]);

  useEffect(() => {
    setBusinessName(business.businessName || '');
    setEntityState(business.entityState || '');
    setEinLast4(business.einLast4 || '');
    setBusinessType(business.businessType || 'general');
    setBusinessAddress(business.businessAddress || business.addressLine1 || '');
    setDomainEmail(business.domainEmail || '');
    setWebsite(business.website || '');
  }, [business.businessName, business.entityState, business.einLast4, business.businessType, business.businessAddress, business.addressLine1, business.domainEmail, business.website]);

  const hubLauncherTiles = useMemo(
    () =>
      buildBusinessProfileLauncherTiles({
        hasPartner: Boolean(partner),
        businessName,
        entityState,
      }),
    [partner, businessName, entityState],
  );

  const saveProfile = () => {
    if (!partner) return;
    const nextRoutes: any = { ...(partner.routes ?? {}) };
    const cur: any = nextRoutes.business_build ?? {};
    nextRoutes.business_build = {
      ...cur,
      business: {
        ...(cur.business ?? {}),
        businessName: businessName.trim() || undefined,
        entityState: entityState.trim() || undefined,
        einLast4: einLast4.trim() || undefined,
        businessType: businessType.trim() || 'general',
        businessAddress: businessAddress.trim() || undefined,
        addressLine1: businessAddress.trim() || undefined,
        domainEmail: domainEmail.trim() || undefined,
        website: website.trim() || undefined,
      },
    };
    void upsertPartner({ ...partner, primaryRoute: partner.primaryRoute ?? 'business_build', routes: nextRoutes });
  };

  return (
    <EntityDetailShell
      badge="Business Portal"
      title="Business Profile & Fundability Matrix"
      subtitle="This page becomes your fundability control panel: entity, address, reporting, compliance signals, and underwriting blockers."
      headerLeft={
        <button type="button" onClick={() => navigate(-1)} className={FINELY_OS_BACK_LINK} title="Back">
          <ArrowLeft size={16} /> Back
        </button>
      }
      tabs={[
        { key: 'dashboard', label: 'Dashboard', icon: <LayoutGrid size={12} className="inline mr-2" /> },
        { key: 'profile', label: 'Profile', icon: <Building2 size={12} className="inline mr-2" /> },
        { key: 'vendors', label: 'Vendors', icon: <Users size={12} className="inline mr-2" /> },
        { key: 'bureaus', label: 'Bureaus & Scores', icon: <BookOpen size={12} className="inline mr-2" /> },
        { key: 'lender_logic', label: 'Lender Logic', icon: <Target size={12} className="inline mr-2" /> },
        { key: 'disputes', label: 'Disputes', icon: <AlertTriangle size={12} className="inline mr-2" /> },
        { key: 'documents', label: 'Documents', icon: <FileText size={12} className="inline mr-2" /> },
        { key: 'billion_path', label: 'Billion Path', icon: <Crown size={12} className="inline mr-2" /> },
      ]}
      activeTabKey="profile"
      onTabChange={(k) => {
        if (k === 'dashboard') navigate('/business/dashboard');
        if (k === 'profile') navigate('/business/profile');
        if (k === 'vendors') navigate('/business/vendors');
        if (k === 'bureaus') navigate('/business/bureaus');
        if (k === 'lender_logic') navigate('/business/lender-logic');
        if (k === 'disputes') navigate('/business/disputes');
        if (k === 'documents') navigate('/business/documents');
        if (k === 'billion_path') navigate('/business/billion-path');
      }}
    >
      <FinelyUnifiedHubLayout
        eyebrow="Business credit OS"
        title="Business Profile & Fundability Matrix"
        subtitle="Entity, address, reporting, compliance signals, and underwriting blockers."
        accent="violet"
        primaryAction={{ label: 'Documents vault', onClick: () => navigate('/business/documents') }}
        secondaryAction={{ label: 'Lender logic', onClick: () => navigate('/business/lender-logic') }}
        launcherSlot={<PartnerHubLauncherGrid tiles={hubLauncherTiles} onOpen={hubLauncher.open} />}
      >
        {null}
      </FinelyUnifiedHubLayout>

      <details
        id={NON_CITIZEN_PANEL_ANCHOR_ID}
        ref={nonCitizenPanelRef}
        open={nonCitizenPanelOpen}
        onToggle={(e) => setNonCitizenPanelOpen((e.target as HTMLDetailsElement).open)}
        className={`${finelyOsCatalogCardCompact('sky')} group scroll-mt-24`}
        data-fc-accent="sky"
      >
        <summary className="cursor-pointer select-none flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <Globe size={14} className="text-sky-300" />
            <span className={FINELY_OS_ENTITY_VALUE}>Non-citizen &amp; international credit</span>
          </span>
          <ChevronDown size={16} className="text-white/40 transition-transform group-open:rotate-180" />
        </summary>

        <div className="mt-3 space-y-4">
          <p className="text-xs leading-relaxed text-white/50">
            General educational guidance only — not legal, immigration, or lending advice. Funding eligibility,
            documentation, underwriting appetite, and credit-reporting rules vary by lender/bureau policy, visa or
            immigration status, and country, and they change over time. Always confirm current requirements with a
            qualified immigration attorney, accountant, and the specific lender or bureau before relying on this for
            a real application.
          </p>

          <div>
            <div className={FINELY_OS_ENTITY_LABEL}>Non-citizen applicant type</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {NON_CITIZEN_APPLICANT_TYPE_OPTIONS.map((opt) => {
                const active = selectedApplicantType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedApplicantType(active ? null : opt.id)}
                    className={`px-3 py-1.5 text-xs font-semibold text-white/80 ${finelyOsGlowTile('violet', active)}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {selectedApplicantType ? (
              <div className="mt-3 space-y-3">
                {matchedFundingRules.map((rule) => (
                  <div key={rule.id} className={`${finelyOsGlowPanel('violet')} p-3`}>
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-white/90">{NON_CITIZEN_LOAN_TYPE_LABELS[rule.loanType]}</span>
                      <div className="flex flex-wrap gap-1.5">
                        <span className={finelyOsStatusChip(rule.ssnRequired ? 'blocked' : 'ok')}>
                          {rule.ssnRequired ? 'SSN required' : 'No SSN required'}
                        </span>
                        <span className={finelyOsStatusChip(rule.itinAccepted ? 'ok' : 'blocked')}>
                          {rule.itinAccepted ? 'ITIN accepted' : 'ITIN not accepted'}
                        </span>
                      </div>
                    </div>
                    <ul className="mt-2 list-disc pl-4 text-xs text-white/70 space-y-1">
                      {rule.keyRequirements.map((req) => (
                        <li key={req}>{req}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-xs text-white/60">
                      <span className="font-semibold text-white/75">Lender underwriting optics: </span>
                      {rule.lenderUnderwritingOptics}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {rule.alternativeProofDocs.map((doc) => (
                        <span key={doc} className="px-2 py-0.5 rounded-full border border-white/10 bg-white/[0.04] text-[10px] text-white/55">
                          {doc}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-xs text-white/45">Pick an applicant type to see matched loan types, documentation, and lender optics.</p>
            )}
          </div>

          <div>
            <div className={FINELY_OS_ENTITY_LABEL}>International credit system</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {INTERNATIONAL_COUNTRY_OPTIONS.map((opt) => {
                const active = selectedCountryCode === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedCountryCode(active ? null : opt.id)}
                    className={`px-3 py-1.5 text-xs font-semibold text-white/80 ${finelyOsGlowTile('sky', active)}`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {matchedCountrySystem ? (
              <div className={`mt-3 ${finelyOsGlowPanel('sky')} p-3`}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-white/90">{matchedCountrySystem.countryName}</span>
                  <span className="text-[10px] uppercase tracking-widest text-white/45">
                    {matchedCountrySystem.reportingWindowYears}-yr reporting window
                  </span>
                </div>
                <p className="mt-1 text-xs text-white/60">
                  <span className="font-semibold text-white/75">Bureaus: </span>
                  {matchedCountrySystem.majorBureaus.join(', ')}
                </p>
                <p className="mt-1 text-xs text-white/60">
                  <span className="font-semibold text-white/75">Score range: </span>
                  {matchedCountrySystem.scoreRangeLabel}
                </p>
                <p className="mt-2 text-xs text-white/65">{matchedCountrySystem.scoringModelNotes}</p>
                <div className="mt-2">
                  <div className="text-[10px] font-bold uppercase tracking-wide text-white/50">Key differences from U.S. FCRA system</div>
                  <ul className="mt-1 list-disc pl-4 text-xs text-white/65 space-y-1">
                    {matchedCountrySystem.keyDifferencesFromUS.map((d) => (
                      <li key={d}>{d}</li>
                    ))}
                  </ul>
                </div>
                <p className="mt-2 text-xs text-white/60">
                  <span className="font-semibold text-white/75">Dispute rights: </span>
                  {matchedCountrySystem.disputeRightsSummary}
                </p>
                <p className="mt-1 text-[10px] text-white/40">Data protection regime: {matchedCountrySystem.dataProtectionRegime}</p>
              </div>
            ) : (
              <p className="mt-2 text-xs text-white/45">Pick a country to see bureaus, score range, and dispute rights.</p>
            )}
          </div>
        </div>
      </details>

      <PartnerHubWorkModal
        open={hubLauncher.isOpen('entity')}
        onClose={hubLauncher.close}
        title="Entity profile"
        subtitle="Legal name, EIN, business type, address, and domain email."
        accent={ROLE_HUB_MODAL_ACCENT.entity}
      >
        <p className={FINELY_OS_ENTITY_SUBLABEL}>Business profile (auto-filled when possible)</p>
        {!partner ? (
          <div className={FINELY_OS_NOTICE}>Sign in as a partner to store your business profile.</div>
        ) : (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <div className={FINELY_OS_ENTITY_LABEL}>Business legal name</div>
                <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="Example: Finely Cred Holdings LLC" />
              </label>
              <label className="block">
                <div className={FINELY_OS_ENTITY_LABEL}>Entity state</div>
                <input value={entityState} onChange={(e) => setEntityState(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="Example: TX" />
              </label>
            </div>

            <label className="block">
              <div className={FINELY_OS_ENTITY_LABEL}>EIN (last 4)</div>
              <input value={einLast4} onChange={(e) => setEinLast4(e.target.value.replace(/\D/g, '').slice(0, 4))} className={`${FINELY_OS_ENTITY_INPUT} font-mono`} placeholder="1234" />
              <div className={`mt-2 text-[11px] ${FINELY_OS_ENTITY_SUBLABEL}`}>Tip: upload your EIN letter (CP 575) or Articles of Incorporation in Documents Vault to auto-fill.</div>
            </label>

            <label className="block">
              <div className={FINELY_OS_ENTITY_LABEL}>Business type (vendor matching)</div>
              <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className={FINELY_OS_ENTITY_INPUT}>
                {BUSINESS_TYPE_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
              <div className={`mt-1 text-[11px] ${FINELY_OS_ENTITY_SUBLABEL}`}>
                {BUSINESS_TYPE_OPTIONS.find((o) => o.id === businessType)?.hint}
              </div>
            </label>

            <div className="grid md:grid-cols-2 gap-4">
              <label className="block">
                <div className={FINELY_OS_ENTITY_LABEL}>Business address</div>
                <input value={businessAddress} onChange={(e) => setBusinessAddress(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="123 Main St, Suite 100, City ST 12345" />
              </label>
              <label className="block">
                <div className={FINELY_OS_ENTITY_LABEL}>Domain email</div>
                <input value={domainEmail} onChange={(e) => setDomainEmail(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="you@yourcompany.com" />
              </label>
            </div>

            <label className="block">
              <div className={FINELY_OS_ENTITY_LABEL}>Website (optional)</div>
              <input value={website} onChange={(e) => setWebsite(e.target.value)} className={FINELY_OS_ENTITY_INPUT} placeholder="https://yourcompany.com" />
            </label>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button type="button" onClick={() => navigate('/portal/documents')} className={FINELY_OS_SECONDARY_BTN}>
                Upload docs for auto-fill
              </button>
              <button type="button" onClick={saveProfile} className={FINELY_OS_PRIMARY_BTN}>
                Save profile
              </button>
            </div>
          </div>
        )}
      </PartnerHubWorkModal>

      <PartnerHubWorkModal
        open={hubLauncher.isOpen('fundability')}
        onClose={hubLauncher.close}
        title="Fundability path"
        subtitle="Recommended sequence before vendor tiers and capital applications."
        accent={ROLE_HUB_MODAL_ACCENT.fundability}
      >
        <div className={FINELY_OS_NOTICE_WARN}>
          Recommended sequence: complete foundation on profile → unlock Tier 1 vendors (matched to your business type) → Tier 2–4 as you open accounts → run Lender Logic before capital tier.
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => { hubLauncher.close(); hubLauncher.open('entity'); }} className={FINELY_OS_PRIMARY_BTN}>
            Open entity profile <ArrowRight size={14} />
          </button>
          <button type="button" onClick={() => navigate('/business/vendors')} className={FINELY_OS_SECONDARY_BTN}>
            Vendor center <ArrowRight size={14} />
          </button>
          <button type="button" onClick={() => navigate('/business/lender-logic')} className={FINELY_OS_SECONDARY_BTN}>
            Lender logic <ArrowRight size={14} />
          </button>
        </div>
      </PartnerHubWorkModal>

      <PartnerHubWorkModal
        open={hubLauncher.isOpen('enterprise')}
        onClose={hubLauncher.close}
        title="Enterprise profile fields"
        subtitle="Underwriting readiness, monitoring credentials, and letter-ready identity data."
        accent={ROLE_HUB_MODAL_ACCENT.enterprise}
      >
        <p className={FINELY_OS_ENTITY_BODY}>
          Robust fields for underwriting readiness, monitoring credentials, and letter-ready identity/address data. These save to your profile.
        </p>
        <FieldLayoutRenderer
          layout={fieldLayout}
          definitions={fieldDefs}
          values={values}
          onChangeValue={(key, next, persist) => {
            setValues((prev) => {
              const merged = { ...(prev || {}), [key]: next };
              if (persist && partner) upsertCustomFieldValues('partners', partner.id, merged, tenantId);
              return merged;
            });
          }}
        />
      </PartnerHubWorkModal>

      <PartnerHubWorkModal
        open={hubLauncher.isOpen('shortcuts')}
        onClose={hubLauncher.close}
        title="Business portal shortcuts"
        subtitle="Jump to vendors, bureaus, lender logic, documents, and disputes."
        accent={ROLE_HUB_MODAL_ACCENT.shortcuts}
      >
        <p className={FINELY_OS_ENTITY_BODY}>One tap to the business credit lanes — profile stays your identity anchor.</p>
        <div className="flex flex-wrap gap-2">
          {BUSINESS_SHORTCUTS.map(({ path, label, icon: Icon }) => (
            <button key={path} type="button" onClick={() => navigate(path)} className={FINELY_OS_SECONDARY_BTN}>
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>
      </PartnerHubWorkModal>

      <FinelyOsPageFooter />
    </EntityDetailShell>
  );
}
