import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, FileText, LayoutGrid, Target, Users, Crown, BookOpen, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { EntityDetailShell } from '../../components/layout/EntityDetailShell';
import { useAuth } from '../../auth/AuthProvider';
import { getOrCreatePartnerForSession } from '../../portal/getOrCreatePartnerForSession';
import { upsertPartner } from '../../data/partnersRepo';
import { listCustomFieldDefinitionsByScope } from '../../data/customFieldsRepo';
import { getFieldLayout } from '../../data/fieldLayoutsRepo';
import { getCustomFieldValues, upsertCustomFieldValues } from '../../data/customFieldValuesRepo';
import { FieldLayoutRenderer } from '../../components/fields/FieldLayoutRenderer';
import { FINELY_TENANT_ID } from '../../domain/tenants';

export default function BusinessProfilePage() {
  const navigate = useNavigate();
  const auth = useAuth();
  const partner = useMemo(() => getOrCreatePartnerForSession({ user: auth.user }), [auth.user]);

  const business = useMemo(() => {
    const r: any = partner?.routes?.business_build ?? {};
    return r.business ?? {};
  }, [partner]);
  const [businessName, setBusinessName] = useState<string>(business.businessName || '');
  const [entityState, setEntityState] = useState<string>(business.entityState || '');
  const [einLast4, setEinLast4] = useState<string>(business.einLast4 || '');

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
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          title="Back"
        >
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
      <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-4">
            <p className="text-[10px] uppercase tracking-widest text-white/40">Business profile (auto-filled when possible)</p>
            {!partner ? (
              <div className="rounded-xl border border-white/10 bg-black/30 p-5 text-white/70 text-sm">
                Sign in as a partner to store your business profile.
              </div>
            ) : (
              <div className="rounded-xl border border-white/10 bg-black/30 p-5 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="block">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Business legal name</div>
                    <input
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="Example: Finely Cred Holdings LLC"
                    />
                  </label>
                  <label className="block">
                    <div className="text-[10px] uppercase tracking-widest text-white/40">Entity state</div>
                    <input
                      value={entityState}
                      onChange={(e) => setEntityState(e.target.value)}
                      className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors"
                      placeholder="Example: TX"
                    />
                  </label>
                </div>

                <label className="block">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">EIN (last 4)</div>
                  <input
                    value={einLast4}
                    onChange={(e) => setEinLast4(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    className="mt-2 w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white/80 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                    placeholder="1234"
                  />
                  <div className="mt-2 text-[11px] text-white/45">
                    Tip: upload your EIN letter (CP 575) or Articles of Incorporation in Documents Vault to auto-fill.
                  </div>
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => navigate('/portal/documents')}
                    className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest text-white/70 transition-all"
                  >
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
                        },
                      };
                      upsertPartner({ ...partner, primaryRoute: partner.primaryRoute ?? 'business_build', routes: nextRoutes });
                    }}
                    className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                  >
                    Save profile
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
            <p className="text-[10px] uppercase tracking-widest text-white/40">Next action</p>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-white/70 text-sm">
              Recommended sequence: confirm business profile → start Tier 1 vendors → run Lender Logic → only then apply for higher tiers.
            </div>
          </div>
      </div>

      <div className="mt-6 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6">
        <p className="text-[10px] uppercase tracking-widest text-white/40">Enterprise profile fields</p>
        <p className="mt-2 text-white/60 text-sm">
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
    </EntityDetailShell>
  );
}

