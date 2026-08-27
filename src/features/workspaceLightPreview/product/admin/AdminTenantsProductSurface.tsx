import React, { useEffect, useMemo, useState } from 'react';
import { Building2, CheckCircle2, Globe2, Plus, Save, Settings, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Tenant } from '../../../../domain/tenants';
import { createTenant, getMembershipByUserAndTenant, isPlatformAdmin, listTenants, updateTenant } from '../../../../data/tenantsRepo';
import { getActiveTenantId, setActiveTenantId } from '../../../../tenancy/activeTenant';
import { useAuth } from '../../../../auth/AuthProvider';
import { isAdminEmail } from '../../../../auth/admin';
import { FINELY_TENANT_ID } from '../../../../domain/tenants';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PAGE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';

const MOSAIC_ACCENTS = ['rose', 'violet', 'sky', 'emerald'] as const;

function cloneTenant(t: Tenant): Tenant {
  return JSON.parse(JSON.stringify(t)) as Tenant;
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="space-y-1">
      <label className={FINELY_OS_ENTITY_SUBLABEL}>{label}</label>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={FINELY_OS_ENTITY_INPUT} />
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  description?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}
        aria-pressed={checked}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : ''}`}
        />
      </button>
      <div className="flex-1">
        <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>{label}</div>
        {description ? <div className={`${FINELY_OS_ENTITY_BODY} mt-0.5 text-xs`}>{description}</div> : null}
      </div>
    </div>
  );
}

export default function AdminTenantsProductSurface({ role, pageId }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const auth = useAuth();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'rose';
  const [storeVersion, setStoreVersion] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Tenant | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const tenants = useMemo(() => listTenants(), [storeVersion]);
  const activeId = useMemo(() => getActiveTenantId(), [storeVersion]);
  const selected = useMemo(
    () => (selectedId ? tenants.find((t) => t.id === selectedId) ?? null : tenants[0] ?? null),
    [selectedId, tenants],
  );

  const canManageTenants = useMemo(() => {
    const u = auth.user;
    if (!u?.id) return false;
    const email =
      u.email ||
      ((u as { user_metadata?: { email?: string } })?.user_metadata?.email) ||
      ((u as { identities?: { identity_data?: { email?: string } }[] })?.identities?.[0]?.identity_data?.email) ||
      '';
    if (email && isAdminEmail(email)) return true;
    const tid = getActiveTenantId();
    const m = getMembershipByUserAndTenant(u.id, tid) ?? getMembershipByUserAndTenant(u.id, FINELY_TENANT_ID);
    return Boolean(m?.status === 'active' && (isPlatformAdmin(m) || m.role === 'tenant_owner'));
  }, [auth.user, storeVersion]);

  useEffect(() => {
    if (!selected) return;
    setDraft(cloneTenant(selected));
  }, [selected?.id]);

  const whiteLabelCount = useMemo(() => tenants.filter((t) => t.settings.features.whiteLabel).length, [tenants]);
  const activeTenant = useMemo(() => tenants.find((t) => t.id === activeId), [tenants, activeId]);

  const create = () => {
    if (!canManageTenants) return;
    const t = createTenant({ name: 'New Tenant' });
    setSelectedId(t.id);
    window.dispatchEvent(new Event('finely:store'));
  };

  const save = () => {
    if (!canManageTenants || !draft) return;
    updateTenant(draft.id, {
      name: draft.name,
      status: draft.status,
      settings: draft.settings,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1200);
    window.dispatchEvent(new Event('finely:store'));
  };

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Platform"
      title="Tenants"
      description="Tenant mosaic first — open a card to edit branding, domains, and feature access."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={navItem?.icon}
      primaryAction={<ProductPagePrimaryAction label="New tenant" onClick={create} />}
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/settings')}>
          System settings
        </button>
      }
      metrics={[
        { label: 'Tenants', value: String(tenants.length), hint: 'White-label accounts', accent: 'rose', onClick: () => setSelectedId(null) },
        { label: 'Active preview', value: activeTenant?.name ?? '—', hint: 'Current tenant context', accent: 'emerald' },
        { label: 'White-label', value: String(whiteLabelCount), hint: 'Branding enabled', accent: 'violet' },
        { label: 'Selected', value: selected?.name ?? '—', hint: 'Editing now', accent: 'sky', onClick: () => selected && setSelectedId(selected.id) },
      ]}
      metricTitle="Multi-tenant control"
      metricDescription="Set the active tenant to preview their experience, then edit branding and feature flags."
    >
      {!canManageTenants ? (
        <div className={FINELY_OS_NOTICE_WARN}>
          Not authorized. Tenant management is restricted to platform admins and tenant owners.
        </div>
      ) : null}

      <section className={`fc-wlp-section ${FINELY_OS_PAGE} space-y-6`} data-surface-layout="catalog-mosaic">
        <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-5`} data-fc-accent="sky">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <Building2 size={16} />
                <span>Tenant catalog</span>
              </div>
              <p className={`mt-2 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                {tenants.length} white-label tenant{tenants.length === 1 ? '' : 's'} · {whiteLabelCount} with branding enabled
              </p>
            </div>
            <button type="button" onClick={create} disabled={!canManageTenants} className={FINELY_OS_SECONDARY_BTN}>
              <Plus size={14} /> New tenant
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {tenants.map((t, idx) => {
              const tileAccent = MOSAIC_ACCENTS[idx % MOSAIC_ACCENTS.length];
              const isActive = t.id === activeId;
              const isSelected = t.id === selected?.id;
              const featureCount = Object.values(t.settings.features).filter(Boolean).length;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setSelectedId(t.id)}
                  className={`text-left ${finelyOsCatalogCard(tileAccent)} p-6 lg:p-7 min-h-[180px] flex flex-col gap-3 transition-all ${
                    isSelected ? 'ring-2 ring-white/25 scale-[1.01]' : 'hover:shadow-lg'
                  }`}
                  data-fc-accent={tileAccent}
                  data-active={isSelected ? 'true' : undefined}
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-black/[0.06]">
                      <Globe2 size={22} />
                    </span>
                    {isActive ? (
                      <span className="px-2 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                        Active
                      </span>
                    ) : (
                      <span className={`text-sm font-bold ${FINELY_OS_ENTITY_SUBLABEL}`}>{t.status}</span>
                    )}
                  </div>
                  <div>
                    <div className="text-xl font-extrabold truncate">{t.name}</div>
                    <p className={`mt-1 text-sm font-semibold font-mono truncate normal-case tracking-normal ${FINELY_OS_ENTITY_BODY}`}>
                      {t.slug} · {t.type}
                    </p>
                    <p className={`mt-2 text-sm font-bold ${FINELY_OS_ENTITY_SUBLABEL}`}>{featureCount} modules enabled</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {draft ? (
          <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-6`} data-fc-accent="violet">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                  <Settings size={16} />
                  <span>Selected tenant</span>
                </div>
                <h2 className="mt-2 text-3xl font-extrabold">{draft.name}</h2>
                <p className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>Set active tenant to preview their portal and admin views.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setActiveTenantId(draft.id)} className={FINELY_OS_SUCCESS_BTN}>
                  Set active tenant
                </button>
                <button type="button" onClick={save} disabled={!canManageTenants} className={saved ? FINELY_OS_SUCCESS_BTN : FINELY_OS_PRIMARY_BTN}>
                  {saved ? <CheckCircle2 size={14} /> : <Save size={14} />} {saved ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-4`} data-fc-accent="emerald">
                <h3 className="text-2xl font-extrabold">Branding</h3>
                <p className={FINELY_OS_ENTITY_BODY}>Display name, colors, logos, and custom domains.</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <TextInput label="Tenant name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
                  <TextInput label="Slug" value={draft.slug} onChange={(v) => setDraft({ ...draft, slug: v })} placeholder="acme-credit" />
                  <TextInput
                    label="Brand name (display)"
                    value={draft.settings.brandName ?? ''}
                    onChange={(v) => setDraft({ ...draft, settings: { ...draft.settings, brandName: v || undefined } })}
                    placeholder="Acme Credit"
                  />
                  <TextInput
                    label="Primary color"
                    value={draft.settings.primaryColor ?? ''}
                    onChange={(v) => setDraft({ ...draft, settings: { ...draft.settings, primaryColor: v || undefined } })}
                    placeholder="#6366f1"
                  />
                  <TextInput
                    label="Logo URL"
                    value={draft.settings.logoUrl ?? ''}
                    onChange={(v) => setDraft({ ...draft, settings: { ...draft.settings, logoUrl: v || undefined } })}
                    placeholder="https://..."
                  />
                  <TextInput
                    label="Favicon URL"
                    value={draft.settings.faviconUrl ?? ''}
                    onChange={(v) => setDraft({ ...draft, settings: { ...draft.settings, faviconUrl: v || undefined } })}
                    placeholder="https://.../favicon.png"
                  />
                  <TextInput
                    label="Empty state art URL"
                    value={draft.settings.emptyStateArtUrl ?? ''}
                    onChange={(v) => setDraft({ ...draft, settings: { ...draft.settings, emptyStateArtUrl: v || undefined } })}
                    placeholder="https://.../illustration.png"
                  />
                  <TextInput
                    label="Support email"
                    value={draft.settings.supportEmail ?? ''}
                    onChange={(v) => setDraft({ ...draft, settings: { ...draft.settings, supportEmail: v || undefined } })}
                    placeholder="support@domain.com"
                  />
                  <TextInput
                    label="Custom domain"
                    value={draft.settings.customDomain ?? ''}
                    onChange={(v) => setDraft({ ...draft, settings: { ...draft.settings, customDomain: v || undefined } })}
                    placeholder="app.domain.com"
                  />
                  <TextInput
                    label="Landing hero kicker"
                    value={draft.settings.content?.landingHeroKicker ?? ''}
                    onChange={(v) =>
                      setDraft({
                        ...draft,
                        settings: { ...draft.settings, content: { ...(draft.settings.content ?? {}), landingHeroKicker: v || undefined } },
                      })
                    }
                    placeholder="Full Credit Solution Company"
                  />
                  <TextInput
                    label="Landing hero subtitle"
                    value={draft.settings.content?.landingHeroSubtitle ?? ''}
                    onChange={(v) =>
                      setDraft({
                        ...draft,
                        settings: { ...draft.settings, content: { ...(draft.settings.content ?? {}), landingHeroSubtitle: v || undefined } },
                      })
                    }
                    placeholder="Institutional credit solutions across personal, business, tradelines, and wealth paths…"
                  />
                </div>
              </div>

              <div className={`${finelyOsCatalogCard('sky')} p-6 lg:p-8 space-y-4`} data-fc-accent="sky">
                <h3 className="text-2xl font-extrabold">Feature access</h3>
                <p className={FINELY_OS_ENTITY_BODY}>Turn modules on or off for this tenant.</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <Toggle
                    label="White-label"
                    checked={draft.settings.features.whiteLabel}
                    onChange={(v) => setDraft({ ...draft, settings: { ...draft.settings, features: { ...draft.settings.features, whiteLabel: v } } })}
                    description="Enable white-label branding and tenant-only surface areas."
                  />
                  <Toggle
                    label="Business credit"
                    checked={draft.settings.features.businessCredit}
                    onChange={(v) => setDraft({ ...draft, settings: { ...draft.settings, features: { ...draft.settings.features, businessCredit: v } } })}
                  />
                  <Toggle
                    label="Debt resolution"
                    checked={draft.settings.features.debtResolution}
                    onChange={(v) => setDraft({ ...draft, settings: { ...draft.settings, features: { ...draft.settings.features, debtResolution: v } } })}
                  />
                  <Toggle
                    label="Tradelines"
                    checked={draft.settings.features.tradelines}
                    onChange={(v) => setDraft({ ...draft, settings: { ...draft.settings, features: { ...draft.settings.features, tradelines: v } } })}
                  />
                  <Toggle
                    label="Wealth paths"
                    checked={draft.settings.features.wealthPaths}
                    onChange={(v) => setDraft({ ...draft, settings: { ...draft.settings, features: { ...draft.settings.features, wealthPaths: v } } })}
                  />
                  <Toggle
                    label="API access"
                    checked={draft.settings.features.apiAccess}
                    onChange={(v) => setDraft({ ...draft, settings: { ...draft.settings, features: { ...draft.settings.features, apiAccess: v } } })}
                  />
                </div>

                <div className={`${finelyOsCatalogCard('rose')} p-4 flex items-start gap-3`} data-fc-accent="rose">
                  <Sparkles size={18} className="text-rose-600 shrink-0 mt-0.5" />
                  <p className={FINELY_OS_ENTITY_BODY}>
                    After saving, set the active tenant to preview their portal. Feature flags apply on the next page load.
                  </p>
                </div>

                <div className={`${finelyOsCatalogCard('violet')} p-4 ${FINELY_OS_ENTITY_BODY}`} data-fc-accent="violet">
                  Tenant deletion is disabled in this build to prevent accidental data orphaning. Use archive workflows when available.
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 ${FINELY_OS_ENTITY_BODY}`} data-fc-accent="rose">
            Select a tenant tile from the catalog to edit branding and features.
          </div>
        )}
      </section>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
