import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowRight,
  Building2,
  CircleHelp,
  ChevronDown,
  FileText,
  Globe,
  PlayCircle,
  Target,
  Users,
  Crown,
  BookOpen,
  AlertTriangle,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePartnerSession } from '../../../../auth/PartnerSessionContext';
import { upsertPartner } from '../../../../data/partnersRepo';
import { BUSINESS_TYPE_OPTIONS, evaluateFoundationSteps } from '../../../../lib/businessVendorSequencing';
import { listCustomFieldDefinitionsByScope } from '../../../../data/customFieldsRepo';
import { getFieldLayout } from '../../../../data/fieldLayoutsRepo';
import { getCustomFieldValues, upsertCustomFieldValues } from '../../../../data/customFieldValuesRepo';
import { FieldLayoutRenderer } from '../../../../components/fields/FieldLayoutRenderer';
import { FINELY_TENANT_ID } from '../../../../domain/tenants';
import { BusinessReadinessChecklist } from '../../../../components/business/BusinessReadinessChecklist';
import { BusinessFundabilityScorecard } from '../../../../components/business/BusinessFundabilityScorecard';
import { hasEntitlement } from '../../../../data/billingRepo';
import { getPartnerSync } from '../../../../data/partnersRepo';
import type { Partner } from '../../../../domain/partners';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { usePartnerProductPathResolver } from './usePartnerProductNavigation';
import { getPartnerServiceLine, getWorkspaceProductNavItem } from '../workspaceProductNav';
import { getWorkspaceProductPageSpec } from '../data/workspaceProductPageCatalog';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import { openProductCopilot } from '../components/ProductCopilotPanel';
import { ProductDashboardSkeleton, ProductEmptyState, type ProductMetric } from '../components/ProductUi';
import {
  getFundingRulesForApplicantType,
  getInternationalCreditSystem,
  type InternationalCreditSystem,
  type NonCitizenFundingRule,
} from '../../../../data/internationalAndNonCitizenCreditRepo';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsGlowPanel,
  finelyOsGlowTile,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';

const SERVICE_LINE_ID = 'business' as const;
const NON_CITIZEN_PANEL_ANCHOR_ID = 'non-citizen-international-credit';

const BUSINESS_SHORTCUTS = [
  { path: '/business/vendors', label: 'Vendors', icon: Users },
  { path: '/business/bureaus', label: 'Bureaus & scores', icon: BookOpen },
  { path: '/business/lender-logic', label: 'Lender logic', icon: Target },
  { path: '/business/documents', label: 'Documents', icon: FileText },
  { path: '/business/disputes', label: 'Disputes', icon: AlertTriangle },
  { path: '/business/billion-path', label: 'Capital readiness', icon: Crown },
] as const;

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

function partnerOwnsBusinessLine(partnerId: string): boolean {
  const line = getPartnerServiceLine(SERVICE_LINE_ID);
  if (line.entitlementAnyOf.length === 0) return true;
  return line.entitlementAnyOf.some((key) => hasEntitlement(partnerId, key));
}

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'locked' }
  | { status: 'ready'; partner: Partner };

export default function PartnerBusinessProfileProductSurface({ role, pageId, partnerId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const mapPortalHref = usePartnerProductPathResolver();
  const { partner: sessionPartner } = usePartnerSession();
  const navItem = getWorkspaceProductNavItem('partner', pageId);
  const PageIcon = navItem?.icon ?? Building2;
  const scaffoldAccent = navItem?.accent ?? 'emerald';
  const surfaceMode = navItem?.surfaceMode ?? 'light';
  const serviceLine = getPartnerServiceLine(SERVICE_LINE_ID);
  const isDemo = dataMode === 'demo' || !partnerId;

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [retryToken, setRetryToken] = useState(0);
  const nonCitizenPanelRef = useRef<HTMLDetailsElement | null>(null);
  const [nonCitizenPanelOpen, setNonCitizenPanelOpen] = useState(false);
  const [showEnterpriseFields, setShowEnterpriseFields] = useState(false);

  const activePartner = state.status === 'ready' ? state.partner : sessionPartner;

  const business = useMemo(() => {
    const r = (activePartner?.routes as { business_build?: { business?: Record<string, unknown> } })?.business_build ?? {};
    return (r.business ?? {}) as Record<string, string>;
  }, [activePartner]);

  const [businessName, setBusinessName] = useState(business.businessName || '');
  const [entityState, setEntityState] = useState(business.entityState || '');
  const [einLast4, setEinLast4] = useState(business.einLast4 || '');
  const [businessType, setBusinessType] = useState(business.businessType || 'general');
  const [businessAddress, setBusinessAddress] = useState(business.businessAddress || business.addressLine1 || '');
  const [domainEmail, setDomainEmail] = useState(business.domainEmail || '');
  const [website, setWebsite] = useState(business.website || '');
  const [selectedApplicantType, setSelectedApplicantType] = useState<NonCitizenFundingRule['applicantType'] | null>(null);
  const [selectedCountryCode, setSelectedCountryCode] = useState<InternationalCreditSystem['countryCode'] | null>(null);

  const tenantId = (activePartner?.tenantId || '').trim() || FINELY_TENANT_ID;
  const fieldDefs = useMemo(() => listCustomFieldDefinitionsByScope('partners', tenantId), [tenantId]);
  const fieldLayout = useMemo(() => getFieldLayout({ tenantId, scope: 'partners' }), [tenantId]);
  const valuesRecord = useMemo(
    () => (activePartner ? getCustomFieldValues('partners', activePartner.id, tenantId) : null),
    [activePartner?.id, tenantId],
  );
  const [values, setValues] = useState<Record<string, unknown>>(valuesRecord?.values ?? {});

  useEffect(() => {
    setValues(valuesRecord?.values ?? {});
  }, [valuesRecord?.updatedAt, activePartner?.id]);

  useEffect(() => {
    setBusinessName(business.businessName || '');
    setEntityState(business.entityState || '');
    setEinLast4(business.einLast4 || '');
    setBusinessType(business.businessType || 'general');
    setBusinessAddress(business.businessAddress || business.addressLine1 || '');
    setDomainEmail(business.domainEmail || '');
    setWebsite(business.website || '');
  }, [business]);

  useEffect(() => {
    if (isDemo) return;
    let cancelled = false;
    setState({ status: 'loading' });
    try {
      if (!partnerOwnsBusinessLine(partnerId!)) {
        if (!cancelled) setState({ status: 'locked' });
        return;
      }
      const loaded = getPartnerSync(partnerId!);
      if (!loaded) throw new Error('Partner profile not found.');
      if (!cancelled) setState({ status: 'ready', partner: loaded });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Could not load your business profile right now.';
      if (!cancelled) setState({ status: 'error', message });
    }
    return () => {
      cancelled = true;
    };
  }, [isDemo, partnerId, retryToken]);

  const demoSpec = useMemo(() => getWorkspaceProductPageSpec('partner', pageId), [pageId]);

  const foundation = useMemo(
    () =>
      activePartner
        ? evaluateFoundationSteps({
            business: (activePartner.routes as { business_build?: { business?: Record<string, unknown> } })?.business_build?.business,
            partnerId: activePartner.id,
          })
        : { percent: 0, complete: false, steps: [] },
    [activePartner],
  );

  const matchedFundingRules = useMemo(
    () => (selectedApplicantType ? getFundingRulesForApplicantType(selectedApplicantType) : []),
    [selectedApplicantType],
  );
  const matchedCountrySystem = useMemo(
    () => (selectedCountryCode ? getInternationalCreditSystem(selectedCountryCode) : null),
    [selectedCountryCode],
  );

  const saveProfile = () => {
    if (!activePartner) return;
    const nextRoutes = { ...(activePartner.routes ?? {}) } as Record<string, unknown>;
    const cur = (nextRoutes.business_build as Record<string, unknown>) ?? {};
    nextRoutes.business_build = {
      ...cur,
      business: {
        ...((cur.business as Record<string, unknown>) ?? {}),
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
    void upsertPartner({ ...activePartner, primaryRoute: activePartner.primaryRoute ?? 'business_build', routes: nextRoutes });
  };

  const metrics: ProductMetric[] = [
    {
      label: 'Foundation',
      value: `${foundation.percent}%`,
      hint: foundation.complete ? 'Aligned' : 'Profile hygiene',
      accent: 'emerald',
      icon: Building2,
      onClick: () => navigate(mapPortalHref('/business/profile')),
    },
    {
      label: 'Open gaps',
      value: foundation.steps.filter((s) => !s.done).length,
      hint: 'Blocks vendor tiers',
      accent: 'rose',
      icon: AlertTriangle,
      onClick: () => navigate(mapPortalHref('/business/profile')),
    },
    {
      label: 'Business type',
      value: BUSINESS_TYPE_OPTIONS.find((o) => o.id === businessType)?.label?.split(' ')[0] ?? 'General',
      hint: 'Vendor matching',
      accent: 'sky',
      icon: Target,
      onClick: () => navigate(mapPortalHref('/business/vendors')),
    },
    {
      label: 'Entity state',
      value: entityState || '—',
      hint: 'Formation state',
      accent: 'violet',
      icon: FileText,
      onClick: () => navigate(mapPortalHref('/business/documents')),
    },
  ];

  const askFinelyPrompt = 'Which entity field should I fix first for fundability?';
  const guideActions = (
    <div className="fc-wlp-page-guide-actions">
      <button type="button" onClick={() => openProductCopilot({ prompt: askFinelyPrompt, contextLabel: navItem?.label ?? 'Business profile' })}>
        <CircleHelp size={15} /> Ask Finely
      </button>
      <button type="button" onClick={() => navigate('/resources#presenter-demo')}>
        <PlayCircle size={15} /> Watch how
      </button>
    </div>
  );

  const composeStudioBody = (
    <section className="fc-wlp-section space-y-6" data-surface-layout="compose-studio">
      <div className="grid gap-6 xl:grid-cols-12 items-start">
        <div className="xl:col-span-8 space-y-6 min-w-0">
          <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-5`} data-fc-accent="violet">
            <div>
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Compose studio</p>
              <h2 className={`text-3xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Entity profile</h2>
              <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Legal name, EIN, business type, address, and domain email — what funders verify first.
              </p>
            </div>

            {!activePartner ? (
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
                  <input
                    value={einLast4}
                    onChange={(e) => setEinLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className={`${FINELY_OS_ENTITY_INPUT} font-mono`}
                    placeholder="1234"
                  />
                  <div className={`mt-2 text-sm font-bold ${FINELY_OS_ENTITY_SUBLABEL}`}>
                    Upload your EIN letter or Articles in Documents Vault to auto-fill.
                  </div>
                </label>

                <label className="block">
                  <div className={FINELY_OS_ENTITY_LABEL}>Business type (vendor matching)</div>
                  <select value={businessType} onChange={(e) => setBusinessType(e.target.value)} className={FINELY_OS_ENTITY_INPUT}>
                    {BUSINESS_TYPE_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                  <div className={`mt-1 text-sm font-bold ${FINELY_OS_ENTITY_SUBLABEL}`}>
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
                  <button type="button" onClick={() => navigate(mapPortalHref('/portal/documents'))} className={FINELY_OS_SECONDARY_BTN}>
                    Upload docs for auto-fill
                  </button>
                  <button type="button" onClick={saveProfile} className={FINELY_OS_PRIMARY_BTN}>
                    Save profile
                  </button>
                </div>
              </div>
            )}
          </div>

          <details
            id={NON_CITIZEN_PANEL_ANCHOR_ID}
            ref={nonCitizenPanelRef}
            open={nonCitizenPanelOpen}
            onToggle={(e) => setNonCitizenPanelOpen((e.target as HTMLDetailsElement).open)}
            className={`${finelyOsCatalogCard('sky')} group scroll-mt-24 p-6 lg:p-8`}
            data-fc-accent="sky"
          >
            <summary className="cursor-pointer select-none flex items-center justify-between gap-3">
              <span className="flex items-center gap-2">
                <Globe size={16} className="text-sky-500" />
                <span className={`text-xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Non-citizen &amp; international credit</span>
              </span>
              <ChevronDown size={16} className="opacity-50 transition-transform group-open:rotate-180" />
            </summary>

            <div className="mt-4 space-y-4">
              <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                General educational guidance only — not legal, immigration, or lending advice. Confirm current requirements with qualified professionals before applying.
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
                        className={`px-3 py-2 text-xs font-bold ${finelyOsGlowTile('violet', active)}`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {selectedApplicantType ? (
                  <div className="mt-3 space-y-3">
                    {matchedFundingRules.map((rule) => (
                      <div key={rule.id} className={`${finelyOsGlowPanel('violet')} p-4`}>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className={`text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{NON_CITIZEN_LOAN_TYPE_LABELS[rule.loanType]}</span>
                          <div className="flex flex-wrap gap-1.5">
                            <span className={finelyOsStatusChip(rule.ssnRequired ? 'blocked' : 'ok')}>
                              {rule.ssnRequired ? 'SSN required' : 'No SSN required'}
                            </span>
                            <span className={finelyOsStatusChip(rule.itinAccepted ? 'ok' : 'blocked')}>
                              {rule.itinAccepted ? 'ITIN accepted' : 'ITIN not accepted'}
                            </span>
                          </div>
                        </div>
                        <ul className={`mt-2 list-disc pl-4 text-sm font-bold ${FINELY_OS_ENTITY_BODY} space-y-1`}>
                          {rule.keyRequirements.map((req) => <li key={req}>{req}</li>)}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`mt-2 text-sm ${FINELY_OS_ENTITY_SUBLABEL}`}>Pick an applicant type to see matched loan types and documentation.</p>
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
                        className={`px-3 py-2 text-xs font-bold ${finelyOsGlowTile('sky', active)}`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                {matchedCountrySystem ? (
                  <div className={`mt-3 ${finelyOsGlowPanel('sky')} p-4`}>
                    <div className={`text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{matchedCountrySystem.countryName}</div>
                    <p className={`mt-2 text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>{matchedCountrySystem.scoringModelNotes}</p>
                  </div>
                ) : null}
              </div>
            </div>
          </details>

          {showEnterpriseFields && activePartner ? (
            <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-4`} data-fc-accent="emerald">
              <h3 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Enterprise profile fields</h3>
              <FieldLayoutRenderer
                layout={fieldLayout}
                definitions={fieldDefs}
                values={values}
                onChangeValue={(key, next, persist) => {
                  setValues((prev) => {
                    const merged = { ...(prev || {}), [key]: next };
                    if (persist && activePartner) upsertCustomFieldValues('partners', activePartner.id, merged, tenantId);
                    return merged;
                  });
                }}
              />
            </div>
          ) : (
            <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => setShowEnterpriseFields(true)}>
              Show enterprise profile fields
            </button>
          )}
        </div>

        <aside className="xl:col-span-4 space-y-6 min-w-0 lg:sticky lg:top-4">
          {activePartner ? <BusinessFundabilityScorecard partner={activePartner} /> : null}

          <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-4`} data-fc-accent="rose">
            <div className={FINELY_OS_NOTICE_WARN}>
              Recommended sequence: foundation on profile → Tier 1 vendors → Tier 2–4 → Lender Logic before capital.
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => navigate(mapPortalHref('/business/vendors'))} className={FINELY_OS_PRIMARY_BTN}>
                Vendor center <ArrowRight size={14} />
              </button>
              <button type="button" onClick={() => navigate(mapPortalHref('/business/lender-logic'))} className={FINELY_OS_SECONDARY_BTN}>
                Lender logic <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <BusinessReadinessChecklist title="Foundation readiness" compact />

          <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-3`} data-fc-accent="sky">
            <h3 className={`text-lg font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Business shortcuts</h3>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_SHORTCUTS.map(({ path, label, icon: Icon }) => (
                <button key={path} type="button" onClick={() => navigate(mapPortalHref(path))} className={FINELY_OS_SECONDARY_BTN}>
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );

  if (isDemo) {
    return (
      <ProductHubScaffold
        role={role}
        pageId={pageId}
        eyebrow={demoSpec?.eyebrow ?? 'Business profile'}
        title={demoSpec?.title ?? 'Business profile & fundability matrix'}
        description={demoSpec?.description ?? 'Entity, address, reporting, compliance signals, and underwriting blockers.'}
        status={`${demoSpec?.status ?? '3 gaps open'} · demo data`}
        freshness="demo snapshot"
        accent={scaffoldAccent}
        surfaceMode={surfaceMode}
        icon={PageIcon}
        metrics={demoSpec?.metrics?.map((m) => ({ ...m, onClick: () => navigate(mapPortalHref('/business/profile')) })) ?? metrics}
        metricTitle={demoSpec?.metricTitle ?? 'Verification status'}
        metricDescription={demoSpec?.metricDescription ?? 'Fields grouped by who checks them and what they block.'}
        primaryAction={<ProductPagePrimaryAction label={demoSpec?.primaryLabel ?? 'Save profile'} onClick={() => navigate(mapPortalHref('/business/profile'))} />}
      >
        {composeStudioBody}
        <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
      </ProductHubScaffold>
    );
  }

  if (state.status === 'loading') {
    return <ProductDashboardSkeleton label="Loading your business profile" />;
  }

  if (state.status === 'error') {
    return (
      <ProductHubScaffold role={role} pageId={pageId} eyebrow="Business profile" title="Business profile" description="Entity and fundability matrix." status="Could not load" freshness="just now" accent={scaffoldAccent} surfaceMode={surfaceMode} icon={PageIcon} primaryAction={<ProductPagePrimaryAction label="Try again" onClick={() => setRetryToken((v) => v + 1)} />}>
        <ProductEmptyState title="We couldn't load your business profile" description={state.message} action={<button type="button" className="fc-wlp-btn-primary" onClick={() => setRetryToken((v) => v + 1)}>Try again</button>} />
      </ProductHubScaffold>
    );
  }

  if (state.status === 'locked') {
    return (
      <ProductHubScaffold role={role} pageId={pageId} eyebrow="Business profile" title="Business profile" description="Entity and fundability matrix." status="Not started" freshness="just now" accent={scaffoldAccent} surfaceMode={surfaceMode} icon={PageIcon} primaryAction={<ProductPagePrimaryAction label="Explore business credit" onClick={() => navigate(serviceLine.upsellPath)} />} metrics={metrics}>
        <ProductEmptyState title="Not started yet" description={serviceLine.upsellHeadline} action={<button type="button" className="fc-wlp-btn-primary" onClick={() => navigate(serviceLine.upsellPath)}>See business options</button>} />
      </ProductHubScaffold>
    );
  }

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Business profile"
      title="Business profile & fundability matrix"
      description="Entity, address, reporting, compliance signals, and underwriting blockers."
      status={`${foundation.steps.filter((s) => !s.done).length} gap${foundation.steps.filter((s) => !s.done).length === 1 ? '' : 's'} · live data`}
      freshness="just now"
      accent={scaffoldAccent}
      surfaceMode={surfaceMode}
      icon={PageIcon}
      metrics={metrics}
      metricTitle="Verification status"
      metricDescription="Fields grouped by who checks them and what they block."
      primaryAction={<ProductPagePrimaryAction label="Save profile" onClick={saveProfile} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate(mapPortalHref('/business/documents'))}>
          Documents vault
        </button>
      }
    >
      {composeStudioBody}
      <aside className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 mt-6 space-y-3`} data-fc-accent="violet">
        <div className="fc-wlp-eyebrow">What to do next</div>
        <h2 className="text-2xl font-extrabold">Consistency is the product</h2>
        <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>The same name, address, and phone must appear everywhere an underwriter looks.</p>
        {guideActions}
      </aside>
      <p className="fc-wlp-section-description fc-wlp-compliance-line">Results vary · not legal advice · funding subject to underwriting</p>
    </ProductHubScaffold>
  );
}
