import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Building2, CheckCircle2, Plus, Save, Settings, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import type { Tenant } from '../../domain/tenants';
import { createTenant, getMembershipByUserAndTenant, isPlatformAdmin, listTenants, updateTenant } from '../../data/tenantsRepo';
import { getActiveTenantId, setActiveTenantId } from '../../tenancy/activeTenant';
import { useAuth } from '../../auth/AuthProvider';
import { isAdminEmail } from '../../auth/admin';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FinelyOsSectionTitle } from '../../features/os/FinelyOsIconBadge';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsListItem,
} from '../../features/os/finelyOsLightUi';

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
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={FINELY_OS_ENTITY_INPUT}
      />
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
        className={`relative flex-shrink-0 w-11 h-6 rounded-full transition-colors ${
          checked ? 'bg-emerald-500' : 'bg-white/20'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
      <div className="flex-1">
        <div className={`${FINELY_OS_ENTITY_VALUE} text-sm`}>{label}</div>
        {description && <div className={`${FINELY_OS_ENTITY_BODY} mt-0.5 text-xs`}>{description}</div>}
      </div>
    </div>
  );
}

export default function AdminTenantsPage() {
  const navigate = useNavigate();
  const auth = useAuth();
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
  const selected = useMemo(() => (selectedId ? tenants.find((t) => t.id === selectedId) ?? null : tenants[0] ?? null), [selectedId, tenants]);

  const canManageTenants = useMemo(() => {
    const u = auth.user;
    if (!u?.id) return false;
    const email =
      u.email ||
      ((u as any)?.user_metadata?.email as string | undefined) ||
      ((u as any)?.identities?.[0]?.identity_data?.email as string | undefined) ||
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

  const create = () => {
    if (!canManageTenants) return;
    const t = createTenant({ name: 'New Tenant' });
    setSelectedId(t.id);
    window.dispatchEvent(new Event('finely:store'));
  };

  const save = () => {
    if (!canManageTenants) return;
    if (!draft) return;
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
    <PageShell badge="Admin" title="Tenants (White‑Label)" subtitle="Create and manage agency tenants, branding, domains, and feature access.">
      <div className={FINELY_OS_PAGE}>
        {!canManageTenants ? (
          <div className={FINELY_OS_NOTICE_WARN}>Not authorized. Tenant management is restricted to platform admins / tenant owners.</div>
        ) : null}

        <div className={FINELY_OS_BANNER}>
          <Building2 size={18} className="text-violet-700 shrink-0 mt-0.5" />
          <p className={`${FINELY_OS_ENTITY_BODY} leading-relaxed`}>
            White-label tenants get isolated branding, domains, and feature flags. Set the active tenant to preview their experience.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={create} disabled={!canManageTenants} className={FINELY_OS_SECONDARY_BTN}>
              <Plus size={14} /> New tenant
            </button>
            <button type="button" onClick={save} disabled={!canManageTenants || !draft} className={saved ? FINELY_OS_SUCCESS_BTN : FINELY_OS_PRIMARY_BTN}>
              {saved ? <CheckCircle2 size={14} /> : <Save size={14} />} {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className={`lg:col-span-4 ${finelyOsCatalogCard('amber')} !p-5`} data-fc-accent="amber">
            <FinelyOsSectionTitle icon={Building2} label="Tenants" accent="amber" />
            <div className="mt-4 space-y-2">
              {tenants.map((t) => {
                const isActive = t.id === activeId;
                const isSelected = t.id === selected?.id;
                return (
                  <button key={t.id} type="button" onClick={() => setSelectedId(t.id)} className={finelyOsListItem(isSelected, 'amber')}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{t.name}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate normal-case tracking-normal`}>
                          {t.slug} • {t.status} • {t.type}
                        </div>
                      </div>
                      {isActive && (
                        <span className="px-2 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 text-[10px] font-black uppercase tracking-widest">
                          Active
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="lg:col-span-8 space-y-6">
            {!draft ? (
              <div className={`${finelyOsCatalogCard('violet')} !p-5 ${FINELY_OS_ENTITY_BODY}`} data-fc-accent="violet">Select a tenant.</div>
            ) : (
              <>
                <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`} data-fc-accent="violet">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <FinelyOsSectionTitle icon={Settings} label="Branding" accent="violet" />
                    <button type="button" onClick={() => setActiveTenantId(draft.id)} className={FINELY_OS_SUCCESS_BTN}>
                      Set active tenant
                    </button>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <TextInput label="Tenant name" value={draft.name} onChange={(v) => setDraft({ ...draft, name: v })} />
                    <TextInput
                      label="Slug"
                      value={draft.slug}
                      onChange={(v) => setDraft({ ...draft, slug: v })}
                      placeholder="acme-credit"
                    />
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
                      placeholder="#f59e0b"
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
                      onChange={(v) =>
                        setDraft({ ...draft, settings: { ...draft.settings, emptyStateArtUrl: v || undefined } })
                      }
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

                <div className={`${finelyOsCatalogCard('emerald')} !p-5 space-y-4`} data-fc-accent="emerald">
                  <FinelyOsSectionTitle icon={Settings} label="Features" accent="emerald" />
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
                </div>

                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony ${FINELY_OS_ENTITY_BODY}`} data-fc-accent="sky">
                  Removing tenants is intentionally disabled in this build to prevent accidental data orphaning. If you need deletion, we’ll add
                  a safe “archive tenant” workflow.
                </div>
              </>
            )}
          </div>
        </div>
        <FinelyOsPageFooter />
</div>
    </PageShell>
  );
}

