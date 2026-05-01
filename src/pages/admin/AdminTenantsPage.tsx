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
      <label className="text-white/60 text-xs uppercase tracking-wider">{label}</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-black/30 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[rgba(var(--brand-primary-rgb),0.55)]"
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
        <div className="text-white text-sm font-medium">{label}</div>
        {description && <div className="text-white/50 text-xs mt-0.5">{description}</div>}
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
      <div className="space-y-6">
        {!canManageTenants ? (
          <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 text-white/60 text-sm">
            Not authorized. Tenant management is restricted to platform admins / tenant owners.
          </div>
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={create}
              disabled={!canManageTenants}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] text-white/70 font-black uppercase tracking-widest text-[10px] hover:bg-white/[0.06] transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Plus size={14} /> New tenant
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!canManageTenants || !draft}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                saved ? 'bg-emerald-500/20 text-emerald-200' : 'bg-[color:var(--brand-primary)] text-black hover:brightness-110'
              } disabled:opacity-60 disabled:cursor-not-allowed`}
            >
              {saved ? <CheckCircle2 size={14} /> : <Save size={14} />} {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-4">
            <div className="flex items-center justify-between gap-2 px-2 pb-3">
              <div className="inline-flex items-center gap-2 text-amber-400">
                <Building2 size={16} />
                <span className="text-[10px] font-black uppercase tracking-widest">Tenants</span>
              </div>
            </div>
            <div className="space-y-2">
              {tenants.map((t) => {
                const isActive = t.id === activeId;
                const isSelected = t.id === selected?.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedId(t.id)}
                    className={`w-full text-left rounded-2xl border p-4 transition-all ${
                      isSelected ? 'border-[rgba(var(--brand-primary-rgb),0.35)] bg-[rgba(var(--brand-primary-rgb),0.10)]' : 'border-white/10 bg-white/[0.02] hover:bg-white/[0.05]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-white font-semibold truncate">{t.name}</div>
                        <div className="mt-1 text-[10px] uppercase tracking-widest text-white/40 font-mono truncate">
                          {t.slug} • {t.status} • {t.type}
                        </div>
                      </div>
                      {isActive && (
                        <span className="px-2 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-200 text-[10px] font-black uppercase tracking-widest">
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
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-white/60">Select a tenant.</div>
            ) : (
              <>
                <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center gap-2 text-amber-400">
                      <Settings size={18} />
                      <span className="text-xs font-semibold uppercase tracking-wider">Branding</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTenantId(draft.id)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 text-black font-black uppercase tracking-widest text-[10px] hover:brightness-110 transition-all"
                    >
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

                <div className="rounded-2xl border border-white/10 bg-black/30 backdrop-blur-xl p-6 space-y-4">
                  <div className="text-[10px] uppercase tracking-widest text-white/40">Features</div>
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

                <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-6 text-white/60 text-sm">
                  Removing tenants is intentionally disabled in this build to prevent accidental data orphaning. If you need deletion, we’ll add
                  a safe “archive tenant” workflow.
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}

