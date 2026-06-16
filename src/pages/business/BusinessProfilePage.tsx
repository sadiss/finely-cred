import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, FileText, LayoutGrid, Target, Users, Crown, BookOpen, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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
import { FinelyUnifiedHubLayout } from '../../features/unified/FinelyUnifiedHubLayout';
import {
  FINELY_OS_BACK_LINK,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_LABEL,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_NOTICE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../features/os/finelyOsLightUi';

export default function BusinessProfilePage() {
  const navigate = useNavigate();
  const { partner } = usePartnerSession();

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

  const tenantId = (partner?.tenantId || '').trim() || FINELY_TENANT_ID;
  const fieldDefs = useMemo(() => listCustomFieldDefinitionsByScope('partners', tenantId), [tenantId]);
  const fieldLayout = useMemo(() => getFieldLayout({ tenantId, scope: 'partners' }), [tenantId]);
  const valuesRecord = useMemo(() => (partner ? getCustomFieldValues('partners', partner.id, tenantId) : null), [partner?.id, tenantId]);
  const [values, setValues] = useState<Record<string, any>>(valuesRecord?.values ?? {});

  useEffect(() => {
    setValues(valuesRecord?.values ?? {});
  }, [valuesRecord?.updatedAt, partner?.id]);

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
        tabs={[{ id: 'profile', label: 'Profile' }]}
        activeTab="profile"
        primaryAction={{ label: 'Documents vault', onClick: () => navigate('/business/documents') }}
        secondaryAction={{ label: 'Lender logic', onClick: () => navigate('/business/lender-logic') }}
      >
      <div className="grid lg:grid-cols-12 gap-6">
        <div className={`lg:col-span-7 min-w-0 ${finelyOsCatalogCard('violet')} !p-6 space-y-4`} data-fc-accent="violet">
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Business profile (auto-filled when possible)</p>
          {!partner ? (
            <div className={FINELY_OS_NOTICE}>Sign in as a partner to store your business profile.</div>
          ) : (
            <div className={`${finelyOsCatalogCard('fuchsia')} !p-5 space-y-4`} data-fc-accent="fuchsia">
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
                <button
                  type="button"
                  onClick={() => {
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
                  }}
                  className={FINELY_OS_PRIMARY_BTN}
                >
                  Save profile
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={`lg:col-span-5 min-w-0 ${finelyOsCatalogCard('amber')} !p-6 space-y-4`} data-fc-accent="amber">
          <p className={FINELY_OS_ENTITY_SUBLABEL}>Next action</p>
          <div className={FINELY_OS_NOTICE_WARN}>Recommended sequence: complete foundation on profile → unlock Tier 1 vendors (matched to your business type) → Tier 2–4 as you open accounts → run Lender Logic before capital tier.</div>
        </div>
      </div>

      <div className={`mt-6 ${finelyOsCatalogCard('emerald')} !p-6`} data-fc-accent="emerald">
        <p className={FINELY_OS_ENTITY_SUBLABEL}>Enterprise profile fields</p>
        <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
          Robust fields for underwriting readiness, monitoring credentials, and letter-ready identity/address data. These save to your profile.
        </p>
        <div className="mt-5">
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
        </div>
      </div>

      <FinelyOsPageFooter />
      </FinelyUnifiedHubLayout>
    </EntityDetailShell>
  );
}
