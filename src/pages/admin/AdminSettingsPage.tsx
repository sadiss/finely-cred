import React, { useMemo, useState, useEffect } from 'react';
import {
  ArrowLeft,
  Shield,
  FileText,
  Settings,
  ExternalLink,
  CreditCard,
  Webhook,
  ToggleLeft,
  ToggleRight,
  Save,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  Building2,
  Link,
  BriefcaseBusiness,
  Search,
  Mail,
  Phone,
  MessageCircle,
  LayoutDashboard,
  Sparkles,
  Users,
  Columns3,
  ChevronUp,
  ChevronDown,
  Facebook,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-router-dom';
import { PageShell } from '../../components/layout/PageShell';
import { MailCreditsPanel } from '../../components/mailing/MailCreditsPanel';
import { ADMIN_EMAIL_ALLOWLIST, isAdminEmail } from '../../auth/admin';
import { useAuth } from '../../auth/AuthProvider';
import {
  loadSettings,
  updateSiteSettings,
  updateCommsSettings,
  updateChatSettings,
  updateStripeSettings,
  updateDenefitsSettings,
  updateNoraCapitalSettings,
  updateFeatureFlags,
  updatePricingControls,
  updateSecuritySettings,
  updateWorkboardSettings,
  getDenefitsContracts,
  setDenefitsContract,
  removeDenefitsContract,
} from '../../data/settingsRepo';
import type {
  PlatformSettings,
  StripeSettings,
  DenefitsSettings,
  NoraCapitalSettings,
  SiteSettings,
  CommsSettings,
  ChatSettings,
  SecuritySettings,
  FeatureFlags,
  DenefitsContractMapping,
  PricingControls,
  WorkStageDefinition,
} from '../../domain/settings';
import { DEFAULT_SETTINGS } from '../../domain/settings';
import { WelcomeExperienceEditor } from '../../components/comms/WelcomeExperienceEditor';
import { allPackages, formatPrice } from '../../config/pricingCatalog';
import type { CustomFieldDefinition, CustomFieldScope, CustomFieldType } from '../../domain/customFields';
import { createCustomFieldDefinition } from '../../domain/customFields';
import {
  deleteCustomFieldDefinition,
  listCustomFieldDefinitionsByScope,
  upsertCustomFieldDefinition,
} from '../../data/customFieldsRepo';
import { getActiveTenantId } from '../../tenancy/activeTenant';
import type { FieldLayout } from '../../domain/fieldLayouts';
import { createFieldLayout } from '../../domain/fieldLayouts';
import { getFieldLayout, upsertFieldLayout } from '../../data/fieldLayoutsRepo';
import { FINELY_TENANT_ID } from '../../domain/tenants';
import { canManageCustomFields, canManageFieldLayouts, getMembershipByUserAndTenant } from '../../data/tenantsRepo';
import { downloadText } from '../../utils/download';
import { FinelyOsPaginatedStack } from '../../features/os/FinelyOsPaginatedStack';
import { FinelyOsPageFooter } from '../../features/os/FinelyOsPageFooter';
import { FINELY_MAIL_COPY } from '../../lib/mailWhiteLabel';
import { ADMIN_FEATURE_MATRIX } from '../../data/adminFeatureMatrix';
import { MetaIntegrationSettingsPanel } from '../../features/meta/MetaIntegrationSettingsPanel';
import { FinelyAdminAppearancePanel } from '../../features/os/FinelyAdminAppearancePanel';
import {
  FINELY_OS_PAGE,
  FINELY_OS_BACK_LINK,
  FINELY_OS_BANNER,
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_CHIP,
  FINELY_OS_ENTITY_EMPTY,
  FINELY_OS_ENTITY_INPUT,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_TITLE,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SUCCESS_BTN,
  FINELY_OS_SECONDARY_BTN,
  FINELY_OS_VIEW_TABS,
  finelyOsCatalogCard,
  finelyOsViewTab,
  finelyOsStatusChip,
  finelyOsInlineListItem,
  FINELY_OS_NOTICE_WARN,
  FINELY_OS_DANGER_BTN,
  FINELY_OS_ENTITY_SELECT,
} from '../../features/os/finelyOsLightUi';

type SettingsTab =
  | 'home'
  | 'site'
  | 'comms'
  | 'chat'
  | 'meta'
  | 'stripe'
  | 'denefits'
  | 'nora'
  | 'pricing'
  | 'workboard'
  | 'features'
  | 'appearance'
  | 'security'
  | 'customFields';

const TABS: { key: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { key: 'home', label: 'Overview', icon: <LayoutDashboard size={16} /> },
  { key: 'site', label: 'Site', icon: <Settings size={16} /> },
  { key: 'comms', label: 'Comms', icon: <Mail size={16} /> },
  { key: 'chat', label: 'Chat', icon: <MessageCircle size={16} /> },
  { key: 'meta', label: 'Meta', icon: <Facebook size={16} /> },
  { key: 'stripe', label: 'Stripe', icon: <CreditCard size={16} /> },
  { key: 'denefits', label: 'In‑House Financing', icon: <Building2 size={16} /> },
  { key: 'nora', label: 'Nora Capital', icon: <BriefcaseBusiness size={16} /> },
  { key: 'pricing', label: 'Pricing Controls', icon: <CreditCard size={16} /> },
  { key: 'workboard', label: 'WorkBoard', icon: <Columns3 size={16} /> },
  { key: 'features', label: 'Features', icon: <ToggleRight size={16} /> },
  { key: 'appearance', label: 'Appearance', icon: <Sparkles size={16} /> },
  { key: 'security', label: 'Security', icon: <Shield size={16} /> },
  { key: 'customFields', label: 'Custom Fields', icon: <FileText size={16} /> },
];

function StatusBadge({ status }: { status: 'not_configured' | 'test_mode' | 'live' }) {
  const colors = {
    not_configured: finelyOsStatusChip('warn'),
    test_mode: finelyOsStatusChip('warn'),
    live: finelyOsStatusChip('ok'),
  };
  const labels = {
    not_configured: 'Not Configured',
    test_mode: 'Test Mode',
    live: 'Live',
  };
  return <span className={colors[status]}>{labels[status]}</span>;
}

function SecretInput({
  label,
  value,
  onChange,
  placeholder,
  helperText,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  helperText?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1">
      <label className={FINELY_OS_ENTITY_SUBLABEL}>{label}</label>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${FINELY_OS_ENTITY_INPUT} pr-10 font-mono`}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      {helperText && <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>{helperText}</p>}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
  helperText,
  type = 'text',
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  helperText?: string;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className={FINELY_OS_ENTITY_SUBLABEL}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={FINELY_OS_ENTITY_INPUT}
      />
      {helperText && <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>{helperText}</p>}
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
        {description && <div className={`${FINELY_OS_ENTITY_BODY} text-xs mt-0.5`}>{description}</div>}
      </div>
    </div>
  );
}

export default function AdminSettingsPage() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<SettingsTab>('home');
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [saved, setSaved] = useState(false);
  const [contractEdit, setContractEdit] = useState<{ packageId: string; url: string } | null>(null);
  const [contractQuery, setContractQuery] = useState('');
  const [cfScope, setCfScope] = useState<CustomFieldScope>('partners');
  const [cfDefs, setCfDefs] = useState<CustomFieldDefinition[]>([]);
  const [storeVersion, setStoreVersion] = useState(0);
  const tenantId = useMemo(() => getActiveTenantId(), [storeVersion]);
  const [layoutDraft, setLayoutDraft] = useState<FieldLayout | null>(null);
  const [layoutSaved, setLayoutSaved] = useState(false);
  const [cfNotice, setCfNotice] = useState<string | null>(null);
  const [packageOverridesText, setPackageOverridesText] = useState('');
  const [packageOverridesErr, setPackageOverridesErr] = useState<string | null>(null);

  const adminCaps = useMemo(() => {
    const u = auth.user;
    if (!u?.id) return { canManageCustomFields: false, canManageFieldLayouts: false };
    const email =
      u.email ||
      ((u as any)?.user_metadata?.email as string | undefined) ||
      ((u as any)?.identities?.[0]?.identity_data?.email as string | undefined) ||
      '';
    if (email && isAdminEmail(email)) return { canManageCustomFields: true, canManageFieldLayouts: true };
    const m = getMembershipByUserAndTenant(u.id, tenantId) ?? getMembershipByUserAndTenant(u.id, FINELY_TENANT_ID);
    return {
      canManageCustomFields: canManageCustomFields(m),
      canManageFieldLayouts: canManageFieldLayouts(m),
    };
  }, [auth.user, tenantId, storeVersion]);

  const bootstrapAdminEmails = Array.from(ADMIN_EMAIL_ALLOWLIST).sort();

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  useEffect(() => {
    if (!settings) return;
    // Initialize once; avoid clobbering the user's edits while typing.
    if (packageOverridesText.trim()) return;
    try {
      setPackageOverridesText(JSON.stringify(settings.pricing.packageOverrides ?? {}, null, 2));
      setPackageOverridesErr(null);
    } catch {
      setPackageOverridesText('{}');
      setPackageOverridesErr(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  useEffect(() => {
    const onStore = () => setStoreVersion((v) => v + 1);
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  useEffect(() => {
    // Allow deep-linking to a specific tab: /admin/settings?tab=security
    try {
      const sp = new URLSearchParams(location.search || '');
      const t = (sp.get('tab') || '').trim() as SettingsTab;
      if (!t) return;
      if (TABS.some((x) => x.key === t)) setActiveTab(t);
    } catch {
      // ignore
    }
  }, [location.search]);

  const goTab = (t: SettingsTab) => {
    setActiveTab(t);
    try {
      const sp = new URLSearchParams(location.search || '');
      if (t === 'home') sp.delete('tab');
      else sp.set('tab', t);
      const qs = sp.toString();
      navigate(`/admin/settings${qs ? `?${qs}` : ''}`, { replace: true });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setCfDefs(listCustomFieldDefinitionsByScope(cfScope, tenantId));
  }, [cfScope, tenantId]);

  useEffect(() => {
    const existing = getFieldLayout({ tenantId, scope: cfScope });
    const base: FieldLayout = existing
      ? (JSON.parse(JSON.stringify(existing)) as FieldLayout)
      : createFieldLayout({ tenantId, scope: cfScope, name: `${cfScope} layout` });
    const allIds = cfDefs.map((d) => d.id);
    if (!base.sections?.length) base.sections = [{ id: 'main', title: 'Fields', fieldIds: [] }];
    const present = new Set(base.sections.flatMap((s) => s.fieldIds));
    // Ensure new fields appear somewhere (default: first section).
    for (const id of allIds) if (!present.has(id)) base.sections[0].fieldIds.push(id);
    // Drop ids that no longer exist.
    const idsSet = new Set(allIds);
    base.sections = base.sections.map((s) => ({ ...s, fieldIds: s.fieldIds.filter((id) => idsSet.has(id)) }));
    base.hiddenFieldIds = (base.hiddenFieldIds ?? []).filter((id) => idsSet.has(id));
    setLayoutDraft(base);
  }, [cfScope, tenantId, cfDefs]);

  const normalizeKey = (raw: string) =>
    String(raw || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

  const cfDefsById = useMemo(() => new Map(cfDefs.map((d) => [d.id, d])), [cfDefs]);

  const handleSave = () => {
    if (!settings) return;
    updateSiteSettings(settings.site);
    updateCommsSettings((settings as any).comms ?? {});
    updateChatSettings((settings as any).chat ?? {});
    updateSecuritySettings((settings as any).security ?? {});
    updateStripeSettings(settings.stripe);
    updateDenefitsSettings(settings.denefits);
    updateNoraCapitalSettings(settings.noraCapital);
    updateFeatureFlags(settings.features);
    updatePricingControls(settings.pricing);
    updateWorkboardSettings((settings as any).workboard ?? DEFAULT_SETTINGS.workboard);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSiteChange = (patch: Partial<SiteSettings>) => {
    if (!settings) return;
    setSettings({ ...settings, site: { ...settings.site, ...patch } });
  };

  const handleCommsChange = (patch: Partial<CommsSettings>) => {
    if (!settings) return;
    setSettings({ ...(settings as any), comms: { ...(settings as any).comms, ...patch } });
  };

  const handleChatChange = (patch: Partial<ChatSettings>) => {
    if (!settings) return;
    setSettings({ ...(settings as any), chat: { ...(settings as any).chat, ...patch } });
  };

  const handleSecurityChange = (patch: Partial<SecuritySettings>) => {
    if (!settings) return;
    setSettings({ ...(settings as any), security: { ...(settings as any).security, ...patch } });
  };

  const handleStripeChange = (patch: Partial<StripeSettings>) => {
    if (!settings) return;
    setSettings({ ...settings, stripe: { ...settings.stripe, ...patch } });
  };

  const handleDenefitsChange = (patch: Partial<DenefitsSettings>) => {
    if (!settings) return;
    setSettings({ ...settings, denefits: { ...settings.denefits, ...patch } });
  };

  const handleNoraCapitalChange = (patch: Partial<NoraCapitalSettings>) => {
    if (!settings) return;
    setSettings({ ...settings, noraCapital: { ...settings.noraCapital, ...patch } });
  };

  const handlePricingChange = (patch: Partial<PricingControls>) => {
    if (!settings) return;
    setSettings({ ...settings, pricing: { ...settings.pricing, ...patch } });
  };

  const handleFeatureChange = (patch: Partial<FeatureFlags>) => {
    if (!settings) return;
    setSettings({ ...settings, features: { ...settings.features, ...patch } });
  };

  const handleWorkboardStagesChange = (patch: Partial<{ projectStages: WorkStageDefinition[]; taskStages: WorkStageDefinition[] }>) => {
    if (!settings) return;
    const cur = (settings as any).workboard ?? DEFAULT_SETTINGS.workboard;
    setSettings({ ...(settings as any), workboard: { ...cur, ...patch } });
  };

  const handleSaveContract = (packageId: string, url: string) => {
    if (!url.trim()) {
      removeDenefitsContract(packageId);
    } else {
      setDenefitsContract(packageId, url.trim());
    }
    setSettings(loadSettings());
    setContractEdit(null);
  };

  if (!settings) {
    return (
      <PageShell badge="Admin" title="Loading..." subtitle="">
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="animate-spin text-violet-400" size={24} />
        </div>
      </PageShell>
    );
  }

  // Get packages that support in-house financing
  const financingPackages = allPackages.filter((p) => p.rail === 'in_house' || p.rail === 'both');
  const contracts = getDenefitsContracts();
  const filteredFinancingPackages = financingPackages.filter((p) => {
    const q = contractQuery.trim().toLowerCase();
    if (!q) return true;
    const hay = [p.name, p.id, p.category].join(' ').toLowerCase();
    return hay.includes(q);
  });

  return (
    <PageShell
      badge="Admin"
      title="Platform Settings"
      subtitle="Configure integrations, API keys, webhooks, and feature flags."
    >
      <div className={FINELY_OS_PAGE}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button type="button" onClick={() => navigate('/admin')} className={FINELY_OS_BACK_LINK}>
            <ArrowLeft size={16} /> Admin Dashboard
          </button>
          <button type="button" onClick={handleSave} disabled={saved} className={saved ? FINELY_OS_SUCCESS_BTN : FINELY_OS_PRIMARY_BTN}>
            {saved ? (
              <>
                <CheckCircle size={16} /> Saved
              </>
            ) : (
              <>
                <Save size={16} /> Save Changes
              </>
            )}
          </button>
        </div>

        <div className={FINELY_OS_BANNER}>
          <Settings size={18} className="text-violet-600 shrink-0 mt-0.5" />
          <p className={FINELY_OS_ENTITY_BODY}>
            Platform integrations, feature flags, and tenant controls. Tabs deep-link via <span className="font-mono font-semibold">?tab=…</span> for shareable URLs.
          </p>
        </div>

        <div className={FINELY_OS_VIEW_TABS} role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => goTab(tab.key)}
              className={finelyOsViewTab(activeTab === tab.key, 'violet')}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {activeTab === 'home' && (
            <div className="space-y-6">
              <div className={`${finelyOsCatalogCard('violet')} !p-5`} data-fc-accent="violet">
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Settings overview</div>
                <div className={`mt-2 ${FINELY_OS_ENTITY_BODY}`}>
                  Pick a category below. Everything deep-links via <span className="font-mono font-semibold">?tab=…</span> so you can share direct URLs with your team.
                </div>
              </div>

              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {TABS.filter((t) => t.key !== 'home').map((t, idx) => (
                  <button key={t.key} type="button" onClick={() => goTab(t.key)} className={`${finelyOsCatalogCard((['violet', 'emerald', 'sky', 'amber', 'fuchsia'] as const)[idx % 5])} !p-5 w-full text-left transition-all hover:brightness-[1.02]`} data-fc-accent={(['violet', 'emerald', 'sky', 'amber', 'fuchsia'] as const)[idx % 5]}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                          {t.icon}
                          Category
                        </div>
                        <div className={`mt-3 ${FINELY_OS_ENTITY_TITLE}`}>{t.label}</div>
                        <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>
                          {t.key === 'site'
                            ? 'Branding, legal links, contact defaults.'
                            : t.key === 'comms'
                              ? 'Delivery defaults, templates, channels.'
                              : t.key === 'chat'
                                ? 'Assistant configuration + routing.'
                                : t.key === 'meta'
                                  ? 'Facebook / Instagram Lead Ads + OAuth.'
                                  : t.key === 'stripe'
                                    ? 'Stripe keys and checkout behavior.'
                                    : t.key === 'denefits'
                                      ? 'In-house financing contracts & mapping.'
                                      : t.key === 'nora'
                                        ? 'Nora Capital integration settings.'
                                        : t.key === 'pricing'
                                          ? 'Catalog toggles + package visibility.'
                                          : t.key === 'workboard'
                                            ? 'WorkBoard stages and SLA defaults.'
                                            : t.key === 'features'
                                              ? 'Feature flags and rollout switches.'
                                              : t.key === 'security'
                                                ? 'Admin allowlist, policies.'
                                                : 'Custom fields for partners/cases.'}
                        </div>
                      </div>
                      <span className={FINELY_OS_SECONDARY_BTN}>Open</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Admin control</div>
                <div className={FINELY_OS_ENTITY_BODY}>
                  Shortcuts to the other admin areas that affect permissions and visibility.
                </div>
                <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4 pt-2">
                  {[
                    { path: '/admin/access', icon: Shield, label: 'Access & Permissions', desc: 'Admin emails, tenant scope, effective capabilities.', accent: 'violet' as const },
                    { path: '/admin/team', icon: Users, label: 'Team & Roles', desc: 'Membership, roles, assignments.', accent: 'emerald' as const },
                    { path: '/admin/billing', icon: CreditCard, label: 'Billing & Entitlements', desc: 'Access grants and plan state.', accent: 'amber' as const },
                    { path: '/admin/templates', icon: FileText, label: 'Template Library', desc: 'Saved templates and generator outputs.', accent: 'sky' as const },
                  ].map((item) => (
                    <button
                      key={item.path}
                      type="button"
                      onClick={() => navigate(item.path)}
                      className={`${finelyOsCatalogCard(item.accent)} !p-5 w-full text-left transition-all hover:brightness-[1.02]`}
                      data-fc-accent={item.accent}
                    >
                      <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                        <item.icon size={16} />
                        Control Center
                      </div>
                      <div className={`mt-2 ${FINELY_OS_ENTITY_VALUE}`}>{item.label}</div>
                      <div className={`mt-1 ${FINELY_OS_ENTITY_BODY}`}>{item.desc}</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Site Settings */}
          {activeTab === 'site' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                <div className="flex items-center gap-2 text-violet-400">
                  <Settings size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Branding</span>
                </div>
                <div className="space-y-4">
                  <TextInput
                    label="Funnel trust count"
                    value={String(settings.site.funnelTrustClientCount ?? 10000)}
                    onChange={(v) => handleSiteChange({ funnelTrustClientCount: Math.max(0, Number(v.replace(/[^\d]/g, '')) || 0) })}
                    placeholder="10000"
                    helperText='Shown on lead magnets as "Join 10k+ partners"'
                  />
                  <TextInput
                    label="Brand Name"
                    value={settings.site.brandName}
                    onChange={(v) => handleSiteChange({ brandName: v })}
                    placeholder="Finely Cred"
                  />
                  <TextInput
                    label="Logo URL"
                    value={settings.site.logoUrl ?? ''}
                    onChange={(v) => handleSiteChange({ logoUrl: v || undefined })}
                    placeholder="https://..."
                    helperText="URL to your logo image"
                  />
                  <TextInput
                    label="Primary Color"
                    value={settings.site.primaryColor ?? ''}
                    onChange={(v) => handleSiteChange({ primaryColor: v || undefined })}
                    placeholder="#f59e0b"
                    helperText="Hex color code"
                  />
                  <TextInput
                    label="Accent Color"
                    value={settings.site.accentColor ?? ''}
                    onChange={(v) => handleSiteChange({ accentColor: v || undefined })}
                    placeholder="#d4af37"
                    helperText="Secondary accent (used for highlights/metallic tones)"
                  />
                  <TextInput
                    label="Favicon URL"
                    value={settings.site.faviconUrl ?? ''}
                    onChange={(v) => handleSiteChange({ faviconUrl: v || undefined })}
                    placeholder="https://.../favicon.png"
                    helperText="Used by the browser tab icon"
                  />
                </div>
              </div>

              <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                <div className="flex items-center gap-2 text-violet-400">
                  <FileText size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Contact</span>
                </div>
                <div className="space-y-4">
                  <TextInput
                    label="Support Email"
                    value={settings.site.supportEmail}
                    onChange={(v) => handleSiteChange({ supportEmail: v })}
                    placeholder="support@example.com"
                    type="email"
                  />
                  <TextInput
                    label="Support Phone"
                    value={settings.site.supportPhone ?? ''}
                    onChange={(v) => handleSiteChange({ supportPhone: v || undefined })}
                    placeholder="+1 (555) 123-4567"
                    type="tel"
                  />
                </div>
              </div>

              <div className={`lg:col-span-2 ${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                <div className="flex items-center gap-2 text-violet-400">
                  <Link size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Social Links</span>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <TextInput
                    label="Instagram URL"
                    value={settings.site.socialLinks?.instagram ?? ''}
                    onChange={(v) => handleSiteChange({ socialLinks: { ...(settings.site.socialLinks ?? {}), instagram: v || undefined } as any })}
                    placeholder="https://instagram.com/..."
                  />
                  <TextInput
                    label="Facebook URL"
                    value={settings.site.socialLinks?.facebook ?? ''}
                    onChange={(v) => handleSiteChange({ socialLinks: { ...(settings.site.socialLinks ?? {}), facebook: v || undefined } as any })}
                    placeholder="https://facebook.com/..."
                  />
                  <TextInput
                    label="LinkedIn URL"
                    value={settings.site.socialLinks?.linkedin ?? ''}
                    onChange={(v) => handleSiteChange({ socialLinks: { ...(settings.site.socialLinks ?? {}), linkedin: v || undefined } as any })}
                    placeholder="https://linkedin.com/company/..."
                  />
                  <TextInput
                    label="YouTube URL"
                    value={settings.site.socialLinks?.youtube ?? ''}
                    onChange={(v) => handleSiteChange({ socialLinks: { ...(settings.site.socialLinks ?? {}), youtube: v || undefined } as any })}
                    placeholder="https://youtube.com/@..."
                  />
                  <TextInput
                    label="TikTok URL"
                    value={settings.site.socialLinks?.tiktok ?? ''}
                    onChange={(v) => handleSiteChange({ socialLinks: { ...(settings.site.socialLinks ?? {}), tiktok: v || undefined } as any })}
                    placeholder="https://tiktok.com/@..."
                  />
                  <TextInput
                    label="X URL"
                    value={settings.site.socialLinks?.x ?? ''}
                    onChange={(v) => handleSiteChange({ socialLinks: { ...(settings.site.socialLinks ?? {}), x: v || undefined } as any })}
                    placeholder="https://x.com/..."
                  />
                </div>
                <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
                  We attempted to discover socials automatically, but they weren’t reliably indexed. Add your official links here and the footer will update.
                </div>
              </div>

              <div className={`lg:col-span-2 ${finelyOsCatalogCard('violet')} !p-6`}>
                <WelcomeExperienceEditor
                  value={settings.site.postLoginWelcome ?? {}}
                  onChange={(patch) =>
                    handleSiteChange({
                      postLoginWelcome: { ...(settings.site.postLoginWelcome ?? {}), ...patch },
                    })
                  }
                  previewUser={auth.user}
                />
              </div>

              {/* Compliance Links */}
              <div className={`lg:col-span-2 ${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                <div className="flex items-center gap-2 text-violet-400">
                  <FileText size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Legal Pages</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  {[
                    { path: '/terms', label: 'Terms' },
                    { path: '/privacy', label: 'Privacy' },
                    { path: '/disclaimer', label: 'Disclaimer' },
                  ].map((page) => (
                    <a
                      key={page.path}
                      href={page.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={FINELY_OS_SECONDARY_BTN}
                    >
                      {page.label} <ExternalLink size={12} />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Comms Settings */}
          {activeTab === 'comms' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                <div className="flex items-center gap-2 text-violet-400">
                  <Link size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">App URL</span>
                </div>
                <div className="space-y-4">
                  <TextInput
                    label="App Base URL (optional)"
                    value={(settings as any).comms?.appBaseUrl ?? ''}
                    onChange={(v) => handleCommsChange({ appBaseUrl: v || undefined })}
                    placeholder="https://app.yourdomain.com"
                    helperText="Used to generate absolute invite links in messages/emails (recommended in production)."
                  />
                </div>
              </div>

              <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                <div className="flex items-center gap-2 text-violet-400">
                  <Mail size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Email delivery</span>
                </div>
                <div className={`${FINELY_OS_NOTICE_WARN} space-y-2`}>
                  <div>
                    Credentials are stored <strong>server-side</strong> as Supabase secrets. Set{' '}
                    <span className={`font-mono font-semibold ${FINELY_OS_ENTITY_VALUE}`}>SMTP_HOST</span>,{' '}
                    <span className={`font-mono font-semibold ${FINELY_OS_ENTITY_VALUE}`}>SMTP_USER</span>,{' '}
                    <span className={`font-mono font-semibold ${FINELY_OS_ENTITY_VALUE}`}>SMTP_PASS</span>, and{' '}
                    <span className={`font-mono font-semibold ${FINELY_OS_ENTITY_VALUE}`}>SMTP_FROM_EMAIL</span>.
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <TextInput
                    label="From Email"
                    value={(settings as any).comms?.sendgridFromEmail ?? ''}
                    onChange={(v) => handleCommsChange({ sendgridFromEmail: v || undefined })}
                    placeholder="no-reply@finelycred.com"
                    helperText="Must match your verified sending domain"
                    type="email"
                  />
                  <TextInput
                    label="From Name"
                    value={(settings as any).comms?.sendgridFromName ?? ''}
                    onChange={(v) => handleCommsChange({ sendgridFromName: v || undefined })}
                    placeholder="Finely Cred"
                  />
                </div>
              </div>

              <div className={`lg:col-span-2 ${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                <div className="flex items-center gap-2 text-violet-400">
                  <Phone size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">SMS delivery</span>
                </div>
                <div className={`${FINELY_OS_NOTICE_WARN} space-y-2 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  <div>
                    Configure outbound SMS secrets server-side: <span className={`font-mono ${FINELY_OS_ENTITY_VALUE}`}>SMS_API_ID</span>,{' '}
                    <span className={`font-mono ${FINELY_OS_ENTITY_VALUE}`}>SMS_API_KEY</span>,{' '}
                    <span className={`font-mono ${FINELY_OS_ENTITY_VALUE}`}>SMS_SENDER_ID</span>.
                  </div>
                  <div>Optional phone routing: <span className={`font-mono ${FINELY_OS_ENTITY_VALUE}`}>TWILIO_FROM_PHONE</span>.</div>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <TextInput
                    label="From Phone"
                    value={(settings as any).comms?.twilioFromPhone ?? ''}
                    onChange={(v) => handleCommsChange({ twilioFromPhone: v || undefined })}
                    placeholder="+15551234567"
                    helperText="Outbound SMS caller ID shown to recipients"
                    type="tel"
                  />
                  <TextInput
                    label="SMS Sender ID"
                    value={(settings as any).comms?.smsSenderId ?? ''}
                    onChange={(v) => handleCommsChange({ smsSenderId: v || undefined })}
                    placeholder="FINELY"
                    helperText="Registered sender name (also set SMS_SENDER_ID secret)"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Chat Settings */}
          {activeTab === 'chat' && (
            <div className="grid lg:grid-cols-2 gap-6">
              <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                <div className="flex items-center gap-2 text-violet-400">
                  <MessageCircle size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">GIF search</span>
                </div>
                <div className={`${FINELY_OS_NOTICE_WARN} space-y-2`}>
                  <div>
                    Configure a Tenor API key to enable in-app GIF search inside Messages. In production, store sensitive keys server-side
                    whenever required by the provider.
                  </div>
                </div>
                <SecretInput
                  label="Tenor API Key (optional)"
                  value={(settings as any).chat?.tenorApiKey ?? ''}
                  onChange={(v) => handleChatChange({ tenorApiKey: v || undefined })}
                  placeholder="TENOR_KEY..."
                  helperText="Used client-side to search Tenor GIFs for chat. Leave blank to disable GIF search."
                />
              </div>

              <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                <div className={FINELY_OS_ENTITY_SUBLABEL}>Recommendation</div>
                <div className={`${FINELY_OS_ENTITY_BODY} space-y-2`}>
                  <p>
                    For launch: keep GIF search optional. Emojis + uploads + AI suggestions already work without any third-party key.
                  </p>
                  <p className="text-xs">
                    Tip: If you prefer Giphy instead of Tenor, we can swap the provider behind the same UI.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'meta' && (
            <div className="space-y-6">
              <MetaIntegrationSettingsPanel />
            </div>
          )}

          {/* Stripe Settings */}
          {activeTab === 'stripe' && (
            <div className="space-y-6">
              <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-violet-400">
                    <CreditCard size={18} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Stripe Integration</span>
                  </div>
                  <StatusBadge status={settings.stripe.status} />
                </div>

                <div className={FINELY_OS_NOTICE_WARN}>
                  <strong>Security Note:</strong> Keys entered here are stored in this browser (for UI configuration).
                  For live processing, store secrets server-side in Supabase Edge Function secrets (e.g. `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`).
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <SecretInput
                    label="Publishable Key"
                    value={settings.stripe.publishableKey ?? ''}
                    onChange={(v) => handleStripeChange({ publishableKey: v || undefined })}
                    placeholder="pk_test_..."
                    helperText="Starts with pk_test_ or pk_live_"
                  />
                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Secret Key</div>
                    <div className={FINELY_OS_ENTITY_BODY}>
                      Stored server-side. Configure <span className={`font-mono font-semibold ${FINELY_OS_ENTITY_VALUE}`}>STRIPE_SECRET_KEY</span> in Supabase secrets.
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Webhook Signing Secret</div>
                    <div className={FINELY_OS_ENTITY_BODY}>
                      Stored server-side. Configure <span className={`font-mono font-semibold ${FINELY_OS_ENTITY_VALUE}`}>STRIPE_WEBHOOK_SECRET</span> in Supabase secrets.
                    </div>
                  </div>
                  <TextInput
                    label="Webhook Endpoint URL"
                    value={settings.stripe.webhookEndpoint ?? ''}
                    onChange={(v) => handleStripeChange({ webhookEndpoint: v || undefined })}
                    placeholder="https://your-domain.com/api/webhooks/stripe"
                    helperText="Your server's webhook endpoint"
                  />
                </div>

                <Toggle
                  label="Test Mode"
                  checked={settings.stripe.testMode}
                  onChange={(v) => handleStripeChange({ testMode: v })}
                  description="Use test keys and test data (no real charges)"
                />
              </div>
            </div>
          )}

          {/* Pricing Controls */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-violet-400">
                    <CreditCard size={18} />
                    <span className="text-xs font-semibold uppercase tracking-wider">AU Marketplace Pricing</span>
                  </div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>global</div>
                </div>

                <div className={FINELY_OS_NOTICE_WARN}>
                  Set a global markup or discount that applies to all AU inventory prices shown on the site and in checkout.
                  Use this for promos, margin control, and partner campaigns.
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={FINELY_OS_ENTITY_SUBLABEL}>Markup %</label>
                    <input
                      type="number"
                      min={-50}
                      max={300}
                      value={settings.pricing.tradelineAuMarkupPct}
                      onChange={(e) => handlePricingChange({ tradelineAuMarkupPct: parseFloat(e.target.value || '0') })}
                      className={FINELY_OS_ENTITY_INPUT}
                    />
                    <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>Example: 15 means +15%.</p>
                  </div>
                  <div className="space-y-1">
                    <label className={FINELY_OS_ENTITY_SUBLABEL}>Discount %</label>
                    <input
                      type="number"
                      min={0}
                      max={90}
                      value={settings.pricing.tradelineAuDiscountPct}
                      onChange={(e) => handlePricingChange({ tradelineAuDiscountPct: parseFloat(e.target.value || '0') })}
                      className={FINELY_OS_ENTITY_INPUT}
                    />
                    <p className={`${FINELY_OS_ENTITY_BODY} text-xs`}>Example: 10 means −10% after markup.</p>
                  </div>
                </div>

                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  Tip: keep markup for partner margins, use discount for short promos. Discounts apply after markup so you can run
                  controlled campaigns without losing baseline pricing.
                </div>
              </div>

              <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-violet-400">
                    <FileText size={18} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Package scope overrides (site-wide)</span>
                  </div>
                  <div className={`${FINELY_OS_ENTITY_SUBLABEL} font-mono normal-case tracking-normal`}>JSON</div>
                </div>

                <div className={FINELY_OS_NOTICE_WARN}>
                  Use this to make package scope explicit (negative items, debt lanes, etc.) without a redeploy. Keys are package IDs from
                  <span className="font-mono"> pricingCatalog.ts</span>.
                </div>

                {packageOverridesErr && (
                  <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                    {packageOverridesErr}
                  </div>
                )}

                <textarea
                  value={packageOverridesText}
                  onChange={(e) => {
                    const txt = e.target.value;
                    setPackageOverridesText(txt);
                    try {
                      const parsed = JSON.parse(txt || '{}') as any;
                      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Expected a JSON object map.');
                      setPackageOverridesErr(null);
                      handlePricingChange({ packageOverrides: parsed });
                    } catch (err: any) {
                      setPackageOverridesErr(err?.message || 'Invalid JSON.');
                    }
                  }}
                  className={`${FINELY_OS_ENTITY_INPUT} min-h-[260px] font-mono text-[12px]`}
                  placeholder={'{\n  \"bundle_funding_accelerator\": {\n    \"scopeBulletsByRail\": {\n      \"stripe\": [\"Authorized User placements: 1\"],\n      \"in_house\": [\"Authorized User placements: 2\"]\n    }\n  }\n}'}
                />

                <div className={`text-xs ${FINELY_OS_ENTITY_BODY}`}>
                  Supported fields per package: <span className="font-mono">badge</span>, <span className="font-mono">badgeByRail</span>,{' '}
                  <span className="font-mono">scopeBullets</span>, <span className="font-mono">scopeBulletsByRail</span>.
                </div>
              </div>
            </div>
          )}

          {/* In-House Financing Settings */}
          {activeTab === 'denefits' && (
            <div className="space-y-6">
              {/* API Settings */}
              <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-violet-400">
                    <Building2 size={18} />
                    <span className="text-xs font-semibold uppercase tracking-wider">In‑House Financing Integration</span>
                  </div>
                  <StatusBadge status={settings.denefits.status} />
                </div>

                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-100">
                  <strong>In-House Financing:</strong> Payments report to Equifax, helping partners build credit
                  while they pay for services.
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <TextInput
                    label="Merchant/Provider ID"
                    value={settings.denefits.merchantId ?? ''}
                    onChange={(v) => handleDenefitsChange({ merchantId: v || undefined })}
                    placeholder="Your provider/merchant ID"
                  />
                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>API Key</div>
                    <div className={FINELY_OS_ENTITY_BODY}>
                      Stored server-side. Configure <span className={`font-mono font-semibold ${FINELY_OS_ENTITY_VALUE}`}>DENEFITS_API_KEY</span> in Supabase secrets.
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <TextInput
                    label="Webhook URL"
                    value={settings.denefits.webhookUrl ?? ''}
                    onChange={(v) => handleDenefitsChange({ webhookUrl: v || undefined })}
                    placeholder="https://your-domain.com/api/webhooks/financing"
                    helperText="Receives payment notifications"
                  />
                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Webhook Secret</div>
                    <div className={FINELY_OS_ENTITY_BODY}>
                      Stored server-side. Configure <span className={`font-mono font-semibold ${FINELY_OS_ENTITY_VALUE}`}>DENEFITS_WEBHOOK_SECRET</span> in Supabase secrets.
                    </div>
                  </div>
                </div>

                <Toggle
                  label="Test Mode"
                  checked={settings.denefits.testMode}
                  onChange={(v) => handleDenefitsChange({ testMode: v })}
                  description="Use test environment (no real financing)"
                />
                {settings.denefits.testMode ? (
                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony border-amber-500/30 bg-amber-500/10 text-xs ${FINELY_OS_ENTITY_BODY}`}>
                    Test mode — checkout shows mock Denefit embed labels; disable before production launch.
                  </div>
                ) : null}
              </div>

              {/* Contract URL Mappings */}
              <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-6`}>
                <div className="flex items-center gap-2 text-violet-400">
                  <Link size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Contract URLs by Package</span>
                </div>

                <p className={FINELY_OS_ENTITY_BODY}>
                  Map each financing-eligible package to its contract embed URL. When a partner chooses in-house
                  financing, they'll be directed to this contract.
                </p>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className={FINELY_OS_ENTITY_BODY}>
                    Showing <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{filteredFinancingPackages.length}</span> of{' '}
                    <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{financingPackages.length}</span>
                  </div>
                  <div className={`flex items-center gap-2 ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony px-3 py-2`}>
                    <Search size={16} className="text-violet-400 shrink-0" />
                    <input
                      value={contractQuery}
                      onChange={(e) => setContractQuery(e.target.value)}
                      placeholder="Search packages…"
                      className={`bg-transparent outline-none text-sm ${FINELY_OS_ENTITY_VALUE} placeholder:text-white/30 w-64 max-w-full`}
                    />
                  </div>
                </div>

                <FinelyOsPaginatedStack
                  items={filteredFinancingPackages}
                  pageSize={8}
                  emptyMessage="No packages match your search."
                  renderItem={(pkg) => {
                    const contract = contracts.find((c) => c.packageId === pkg.id);
                    const isEditing = contractEdit?.packageId === pkg.id;

                    return (
                      <div key={pkg.id} className={`${finelyOsInlineListItem()} p-4 space-y-2`}>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className={FINELY_OS_ENTITY_VALUE}>{pkg.name}</div>
                            <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
                              {formatPrice(pkg.priceAmount)} • {pkg.category.replace('_', ' ')}
                            </div>
                          </div>
                          {contract ? (
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold uppercase">
                              Configured
                            </span>
                          ) : (
                            <span className={`px-2 py-0.5 rounded-full ${finelyOsStatusChip('warn')} normal-case tracking-normal`}>
                              Not Set
                            </span>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={contractEdit.url}
                              onChange={(e) => setContractEdit({ ...contractEdit, url: e.target.value })}
                              placeholder="https://your-financing-provider.com/embed/..."
                              className={`flex-1 ${FINELY_OS_ENTITY_SELECT} text-sm font-mono py-2`}
                            />
                            <button
                              onClick={() => handleSaveContract(pkg.id, contractEdit.url)}
                              className={FINELY_OS_SUCCESS_BTN}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setContractEdit(null)}
                              className={FINELY_OS_SECONDARY_BTN}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            {contract ? (
                              <>
                                <code className={`flex-1 text-xs font-mono truncate ${FINELY_OS_ENTITY_BODY}`}>
                                  {contract.contractUrl}
                                </code>
                                <button
                                  onClick={() => setContractEdit({ packageId: pkg.id, url: contract.contractUrl })}
                                  className={`px-2 py-1 rounded-lg ${FINELY_OS_SECONDARY_BTN} text-xs`}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    removeDenefitsContract(pkg.id);
                                    setSettings(loadSettings());
                                  }}
                                  className="px-2 py-1 rounded-lg bg-red-500/20 text-red-400 text-xs hover:bg-red-500/30"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setContractEdit({ packageId: pkg.id, url: '' })}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-violet-500/20 text-violet-300 text-xs font-semibold hover:bg-violet-500/30"
                              >
                                <Plus size={12} /> Add Contract URL
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  }}
                />
              </div>
            </div>
          )}

          {/* Nora Capital Group Settings */}
          {activeTab === 'nora' && (
            <div className="space-y-6">
              <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-6`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-violet-400">
                    <BriefcaseBusiness size={18} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Nora Capital Group</span>
                  </div>
                  <StatusBadge status={settings.noraCapital.status} />
                </div>

                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony ${FINELY_OS_ENTITY_BODY} space-y-2`}>
                  <div className={FINELY_OS_ENTITY_VALUE}>What this is for</div>
                  <p>
                    This integration connects your Wealth Builder → Wealth Paths journey to Nora Capital Group’s funding
                    and wealth accelerator workflows (API-based, future-ready).
                  </p>
                  <p className="text-xs">
                    Security note: Nora API secrets should be stored server-side as Supabase Edge Function secrets, not in the browser.
                  </p>
                  <div className={`${FINELY_OS_NOTICE_WARN} text-xs`}>
                    Set these in Supabase secrets:
                    <div className={`mt-2 font-mono ${FINELY_OS_ENTITY_VALUE} space-y-1`}>
                      <div>NORA_CAPITAL_BASE_URL</div>
                      <div>NORA_CAPITAL_API_KEY</div>
                      <div>(optional) NORA_CAPITAL_API_KEY_HEADER</div>
                      <div>(optional) NORA_CAPITAL_API_KEY_PREFIX</div>
                      <div>(optional) NORA_CAPITAL_ALLOWED_PATHS_JSON</div>
                      <div>(optional) NORA_CAPITAL_WEBHOOK_SECRET</div>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <TextInput
                    label="Base API URL"
                    value={settings.noraCapital.baseUrl ?? ''}
                    onChange={(v) => handleNoraCapitalChange({ baseUrl: v || undefined })}
                    placeholder="https://api.noracapitalgroup.com"
                    helperText="Used by server-side calls (Edge Functions)."
                  />
                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>API Key</div>
                    <div className={FINELY_OS_ENTITY_BODY}>
                      Stored server-side. Configure <span className={`font-mono font-semibold ${FINELY_OS_ENTITY_VALUE}`}>NORA_CAPITAL_API_KEY</span> in Supabase secrets.
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <TextInput
                    label="Webhook URL (optional)"
                    value={settings.noraCapital.webhookUrl ?? ''}
                    onChange={(v) => handleNoraCapitalChange({ webhookUrl: v || undefined })}
                    placeholder="https://your-domain.com/api/webhooks/nora"
                    helperText="If Nora sends status updates back to Finely Cred"
                  />
                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-2`}>
                    <div className={FINELY_OS_ENTITY_SUBLABEL}>Webhook Secret</div>
                    <div className={FINELY_OS_ENTITY_BODY}>
                      Stored server-side. Configure <span className={`font-mono font-semibold ${FINELY_OS_ENTITY_VALUE}`}>NORA_CAPITAL_WEBHOOK_SECRET</span> in Supabase secrets.
                    </div>
                  </div>
                </div>

                <Toggle
                  label="Test Mode"
                  checked={settings.noraCapital.testMode}
                  onChange={(v) => handleNoraCapitalChange({ testMode: v })}
                  description="Use sandbox environment (recommended until go-live)"
                />
              </div>
            </div>
          )}

          {/* Feature Flags */}
          {activeTab === 'features' && (
            <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-6`}>
              <div className="flex items-center gap-2 text-violet-400">
                <ToggleRight size={18} />
                <span className="text-xs font-semibold uppercase tracking-wider">Feature Flags</span>
              </div>

              <p className={FINELY_OS_ENTITY_BODY}>
                Enable or disable features across the platform. Changes take effect immediately.
              </p>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className={`${FINELY_OS_ENTITY_SUBLABEL} text-sm normal-case tracking-normal`}>Payments</h3>
                  <Toggle
                    label="Stripe Payments"
                    checked={settings.features.stripeEnabled}
                    onChange={(v) => handleFeatureChange({ stripeEnabled: v })}
                    description="Enable card/bank payments via Stripe"
                  />
                  <Toggle
                    label="In‑House Financing"
                    checked={settings.features.denefitsEnabled}
                    onChange={(v) => handleFeatureChange({ denefitsEnabled: v })}
                    description="Enable in-house financing (reports to Equifax)"
                  />
                </div>

                <div className="space-y-4">
                  <h3 className={`${FINELY_OS_ENTITY_SUBLABEL} text-sm normal-case tracking-normal`}>Communication</h3>
                  <Toggle
                    label="In-App Messaging"
                    checked={settings.features.inAppMessaging}
                    onChange={(v) => handleFeatureChange({ inAppMessaging: v })}
                    description="Partner-to-admin messaging in portal"
                  />
                  <Toggle
                    label="Public Chat Widget"
                    checked={settings.features.publicChat}
                    onChange={(v) => handleFeatureChange({ publicChat: v })}
                    description="AI concierge on public pages"
                  />
                  <Toggle
                    label="Comms Delivery (Email/SMS)"
                    checked={settings.features.commsDelivery}
                    onChange={(v) => handleFeatureChange({ commsDelivery: v })}
                    description="Enable general outbound messaging via edge functions (Comms Studio + automations)."
                  />
                  <Toggle
                    label="Automation Autopilot (live ops)"
                    checked={settings.features.automationAutopilot}
                    onChange={(v) => handleFeatureChange({ automationAutopilot: v })}
                    description="Execute hands-free dispute drafts and staff tasks when enabled automation rules match platform events (e.g. report upload)."
                  />
                  <Toggle
                    label="AI Gateway (server-side)"
                    checked={settings.features.aiGateway}
                    onChange={(v) => handleFeatureChange({ aiGateway: v })}
                    description="Enable AI routing via Supabase Edge Functions (OpenAI/Gemini/Anthropic)."
                  />
                  <Toggle
                    label="Portal Chat"
                    checked={settings.features.portalChat}
                    onChange={(v) => handleFeatureChange({ portalChat: v })}
                    description="Show AI chat widget inside partner dashboard (context-aware)."
                  />
                  <Toggle
                    label="Light theme (public beta)"
                    checked={settings.features.lightThemePublic}
                    onChange={(v) => handleFeatureChange({ lightThemePublic: v })}
                    description="When OFF, only admins see the Light option in theme toggles. When ON, everyone can use light theme."
                  />
                </div>

                <div className="space-y-4">
                  <h3 className={`${FINELY_OS_ENTITY_SUBLABEL} text-sm normal-case tracking-normal`}>Modules</h3>
                  <Toggle
                    label="CRM (Pipelines)"
                    checked={settings.features.crm}
                    onChange={(v) => handleFeatureChange({ crm: v })}
                    description="Enable CRM pipelines (prospects + lead ops) for sales teams, agents, affiliates, and AU sellers."
                  />
                  <Toggle
                    label="Lead Intelligence Agent"
                    checked={settings.features.leadIntel}
                    onChange={(v) => handleFeatureChange({ leadIntel: v })}
                    description="Enable web discovery + enrichment for qualified prospecting (admin-only; requires search API key server-side)."
                  />
                  <Toggle
                    label="AU Marketplace"
                    checked={settings.features.auMarketplace}
                    onChange={(v) => handleFeatureChange({ auMarketplace: v })}
                    description="Tradeline marketplace features"
                  />
                  <Toggle
                    label="Business Portal"
                    checked={settings.features.businessPortal}
                    onChange={(v) => handleFeatureChange({ businessPortal: v })}
                    description="Business credit module"
                  />
                  <Toggle
                    label="Courses"
                    checked={settings.features.courses}
                    onChange={(v) => handleFeatureChange({ courses: v })}
                    description="Course Builder + Partner course player (education library)"
                  />
                  <Toggle
                    label="Video Studio"
                    checked={settings.features.videoStudio}
                    onChange={(v) => handleFeatureChange({ videoStudio: v })}
                    description="AI Media Studio (storyboards + ML image generation + scene editor + downloadable exports)."
                  />
                  <Toggle
                    label="Document Intelligence"
                    checked={settings.features.docIntel}
                    onChange={(v) => handleFeatureChange({ docIntel: v })}
                    description="OCR + classification + auto-fill for uploaded documents"
                  />
                  <Toggle
                    label="Letter Mailing"
                    checked={settings.features.letterMailing}
                    onChange={(v) => handleFeatureChange({ letterMailing: v })}
                    description="Mail letters from the app via provider API (US-only v1)"
                  />
                  <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony text-xs ${FINELY_OS_ENTITY_BODY}`}>
                    Provider status:{' '}
                    {settings.features.letterMailing ? (
                      <span className="text-amber-300">{FINELY_MAIL_COPY.adminSecretsHint}</span>
                    ) : (
                      <span className="text-white/50">Off — letter studio hides physical mail actions</span>
                    )}
                  </div>
                  {settings.features.letterMailing ? <MailCreditsPanel actorEmail={auth.user?.email || undefined} /> : null}
                </div>

                <div className="space-y-4">
                  <h3 className={`${FINELY_OS_ENTITY_SUBLABEL} text-sm normal-case tracking-normal`}>Advanced</h3>
                  <Toggle
                    label="Wealth Paths"
                    checked={settings.features.wealthPaths}
                    onChange={(v) => handleFeatureChange({ wealthPaths: v })}
                    description="Gamified credit journey lanes"
                  />
                  <Toggle
                    label="Partner Import"
                    checked={settings.features.partnerImport}
                    onChange={(v) => handleFeatureChange({ partnerImport: v })}
                    description="Enable importing partners from legacy systems (resume journey)."
                  />
                  <Toggle
                    label="Invite Delivery (Email/SMS)"
                    checked={settings.features.inviteDelivery}
                    onChange={(v) => handleFeatureChange({ inviteDelivery: v })}
                    description="Enable sending claim/invite links via edge email/SMS functions."
                  />
                  <Toggle
                    label="API Access"
                    checked={settings.features.apiAccess}
                    onChange={(v) => handleFeatureChange({ apiAccess: v })}
                    description="Enable REST API for integrations"
                  />
                </div>
              </div>

              <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-4 overflow-x-auto`}>
                <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL} text-sky-300`}>
                  <span className="text-xs font-semibold uppercase tracking-wider">Feature matrix</span>
                </div>
                <p className={`text-sm ${FINELY_OS_ENTITY_BODY}`}>
                  Quick reference: each flag, what users see when it is on, and secrets to configure in Supabase or build env.
                </p>
                <table className="w-full min-w-[640px] text-left text-sm border-collapse">
                  <thead>
                    <tr className={`border-b border-white/[0.08] ${FINELY_OS_ENTITY_SUBLABEL}`}>
                      <th className="py-2 pr-4 font-semibold normal-case tracking-normal">Flag</th>
                      <th className="py-2 pr-4 font-semibold normal-case tracking-normal">User-visible effect</th>
                      <th className="py-2 font-semibold normal-case tracking-normal">Required secrets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ADMIN_FEATURE_MATRIX.map((row) => (
                      <tr key={row.flag} className="border-b border-white/[0.08] align-top">
                        <td className={`py-3 pr-4 ${FINELY_OS_ENTITY_VALUE}`}>
                          <div>{row.label}</div>
                          <div className={`mt-1 font-mono text-[10px] ${FINELY_OS_ENTITY_SUBLABEL}`}>
                            {row.flag}
                            {settings.features[row.flag] ? (
                              <span className="ml-2 text-emerald-300">on</span>
                            ) : (
                              <span className="ml-2 text-white/40">off</span>
                            )}
                          </div>
                        </td>
                        <td className={`py-3 pr-4 ${FINELY_OS_ENTITY_BODY}`}>{row.effect}</td>
                        <td className={`py-3 font-mono text-[11px] ${FINELY_OS_ENTITY_BODY}`}>{row.secrets}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <FinelyAdminAppearancePanel
              lightThemePublic={settings.features.lightThemePublic}
              onTogglePublicLight={(v) => handleFeatureChange({ lightThemePublic: v })}
            />
          )}

          {/* Security */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                <div className="flex items-center gap-2 text-violet-400">
                  <Shield size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Admin Access</span>
                </div>
                <p className={FINELY_OS_ENTITY_BODY}>
                  For safety, Finely Cred uses a small <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>bootstrap allowlist</span> in code, plus a configurable
                  list here for operations. In production, this becomes full RBAC.
                </p>
                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`} data-fc-accent="sky">
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>Bootstrap admins (code)</span>
                  <ul className={`mt-2 space-y-1 font-mono text-sm ${FINELY_OS_ENTITY_BODY}`}>
                    {bootstrapAdminEmails.length ? (
                      bootstrapAdminEmails.map((e) => <li key={e} className={FINELY_OS_ENTITY_VALUE}>{e}</li>)
                    ) : (
                      <li className="text-white/40">None configured</li>
                    )}
                  </ul>
                </div>

                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                  <span className={FINELY_OS_ENTITY_SUBLABEL}>Operational admins (configurable)</span>
                  <div className="flex flex-wrap gap-2">
                    {(((settings as any).security?.adminEmails ?? []) as string[]).length ? (
                      (((settings as any).security?.adminEmails ?? []) as string[]).map((e) => (
                        <span
                          key={e}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl ${FINELY_OS_ENTITY_CHIP} text-xs font-mono`}
                        >
                          {e}
                          <button
                            type="button"
                            onClick={() => {
                              const next = (((settings as any).security?.adminEmails ?? []) as string[]).filter((x) => x !== e);
                              handleSecurityChange({ adminEmails: next });
                            }}
                            className="text-white/40 hover:text-rose-300"
                            title="Remove"
                          >
                            <Trash2 size={14} />
                          </button>
                        </span>
                      ))
                    ) : (
                      <div className={`${FINELY_OS_ENTITY_BODY} text-sm`}>No extra admins configured.</div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-[240px]">
                      <TextInput
                        label="Add admin email"
                        value={(settings as any).__adminEmailDraft ?? ''}
                        onChange={(v) => setSettings({ ...(settings as any), __adminEmailDraft: v })}
                        placeholder="name@domain.com"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const raw = String((settings as any).__adminEmailDraft ?? '').trim().toLowerCase();
                        if (!raw) return;
                        const cur = (((settings as any).security?.adminEmails ?? []) as string[])
                          .map((x) => String(x).trim().toLowerCase())
                          .filter(Boolean);
                        const next = Array.from(new Set([...cur, raw])).sort();
                        handleSecurityChange({ adminEmails: next });
                        setSettings({ ...(settings as any), __adminEmailDraft: '' });
                      }}
                      className={FINELY_OS_PRIMARY_BTN}
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                  <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
                    Note: this list supports UI convenience. Production access should be enforced by roles/permissions and server-side checks.
                  </div>
                </div>
              </div>

              <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                <div className="flex items-center gap-2 text-violet-400">
                  <Webhook size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Webhook Security</span>
                </div>
                <p className={FINELY_OS_ENTITY_BODY}>
                  Webhook endpoints should verify signatures using the secrets configured in each integration tab.
                </p>
                <div className={`${FINELY_OS_NOTICE_WARN} space-y-2`}>
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                    <div>
                      <strong>Important:</strong> Always verify webhook signatures before processing events. Never trust
                      webhook payloads without verification.
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                <div className="flex items-center gap-2 text-violet-400">
                  <FileText size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Security Documentation</span>
                </div>
                <div className="flex flex-wrap gap-3">
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={FINELY_OS_SECONDARY_BTN}
                  >
                    SECURITY.md <ExternalLink size={12} />
                  </a>
                  <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={FINELY_OS_SECONDARY_BTN}
                  >
                    Architecture Docs <ExternalLink size={12} />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* WorkBoard */}
          {activeTab === 'workboard' && (
            <div className="space-y-6">
              {(() => {
                const wb = (settings as any).workboard ?? DEFAULT_SETTINGS.workboard;
                const move = (arr: WorkStageDefinition[], from: number, to: number) => {
                  const next = [...arr];
                  const [it] = next.splice(from, 1);
                  next.splice(to, 0, it!);
                  return next;
                };
                const renderStages = (kind: 'projectStages' | 'taskStages', title: string, subtitle: string) => {
                  const stages: WorkStageDefinition[] = (wb as any)[kind] ?? [];
                  return (
                    <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                      <div className="space-y-1">
                        <div className={FINELY_OS_ENTITY_VALUE}>{title}</div>
                        <div className={FINELY_OS_ENTITY_BODY}>{subtitle}</div>
                      </div>

                      <div className="space-y-3">
                        {stages.map((s, idx) => (
                          <div key={s.id} className={`${finelyOsCatalogCard('emerald')} !p-4 fc-surface-harmony`} data-fc-accent="emerald">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className={FINELY_OS_ENTITY_SUBLABEL}>id</div>
                                <div className={`mt-1 text-sm font-mono truncate ${FINELY_OS_ENTITY_VALUE}`}>{s.id}</div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (idx <= 0) return;
                                    handleWorkboardStagesChange({ [kind]: move(stages, idx, idx - 1) } as any);
                                  }}
                                  className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-40`}
                                  disabled={idx <= 0}
                                  title="Move up"
                                >
                                  <ChevronUp size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (idx >= stages.length - 1) return;
                                    handleWorkboardStagesChange({ [kind]: move(stages, idx, idx + 1) } as any);
                                  }}
                                  className={`${FINELY_OS_SECONDARY_BTN} disabled:opacity-40`}
                                  disabled={idx >= stages.length - 1}
                                  title="Move down"
                                >
                                  <ChevronDown size={16} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleWorkboardStagesChange({
                                      [kind]: stages.map((x) => (x.id === s.id ? { ...x, disabled: !x.disabled } : x)),
                                    } as any);
                                  }}
                                  className={`px-3 py-2 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                                    s.disabled
                                      ? `${FINELY_OS_SECONDARY_BTN} text-white/45`
                                      : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/15'
                                  }`}
                                  title={s.disabled ? 'Enable stage' : 'Disable stage (hide column)'}
                                >
                                  {s.disabled ? 'Disabled' : 'Enabled'}
                                </button>
                              </div>
                            </div>

                            <div className="mt-4 grid md:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className={FINELY_OS_ENTITY_SUBLABEL}>Label</label>
                                <input
                                  value={s.label}
                                  onChange={(e) =>
                                    handleWorkboardStagesChange({
                                      [kind]: stages.map((x) => (x.id === s.id ? { ...x, label: e.target.value } : x)),
                                    } as any)
                                  }
                                  className={FINELY_OS_ENTITY_INPUT}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className={FINELY_OS_ENTITY_SUBLABEL}>Hint</label>
                                <input
                                  value={s.hint ?? ''}
                                  onChange={(e) =>
                                    handleWorkboardStagesChange({
                                      [kind]: stages.map((x) => (x.id === s.id ? { ...x, hint: e.target.value } : x)),
                                    } as any)
                                  }
                                  className={FINELY_OS_ENTITY_INPUT}
                                  placeholder="Optional helper text"
                                />
                              </div>
                            </div>

                            <div className="mt-3 grid md:grid-cols-2 gap-3">
                              <div className="space-y-1">
                                <label className={FINELY_OS_ENTITY_SUBLABEL}>Accent color</label>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="color"
                                    value={String((s as any).color || '#ffffff')}
                                    onChange={(e) =>
                                      handleWorkboardStagesChange({
                                        [kind]: stages.map((x) => (x.id === s.id ? { ...x, color: e.target.value } : x)),
                                      } as any)
                                    }
                                    className={`h-10 w-14 rounded-xl ${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`}
                                    title="Stage color"
                                  />
                                  <input
                                    value={String((s as any).color || '')}
                                    onChange={(e) =>
                                      handleWorkboardStagesChange({
                                        [kind]: stages.map((x) => (x.id === s.id ? { ...x, color: e.target.value } : x)),
                                      } as any)
                                    }
                                    className={`flex-1 ${FINELY_OS_ENTITY_INPUT}`}
                                    placeholder="#fbbf24"
                                  />
                                </div>
                              </div>
                              <div className="space-y-1">
                                <label className={FINELY_OS_ENTITY_SUBLABEL}>Preview</label>
                                <div className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony`} data-fc-accent="sky">
                                  <div className="flex items-center gap-3">
                                    <div
                                      className="h-2.5 w-2.5 rounded-full"
                                      style={{ backgroundColor: String((s as any).color || '#ffffff') }}
                                    />
                                    <div className={`text-sm font-semibold truncate ${FINELY_OS_ENTITY_VALUE}`}>{s.label}</div>
                                    <div className={`ml-auto text-[10px] uppercase tracking-widest font-mono ${FINELY_OS_ENTITY_SUBLABEL}`}>
                                      {String((s as any).color || '—')}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className={`${FINELY_OS_ENTITY_BODY} text-xs`}>
                          Tip: reorder stages to change column order. Disabling a stage hides it from boards (existing items keep their stage value).
                        </div>
                        <button
                          type="button"
                          onClick={() => handleWorkboardStagesChange({ [kind]: (DEFAULT_SETTINGS.workboard as any)[kind] } as any)}
                          className={FINELY_OS_SECONDARY_BTN}
                          title="Reset to defaults"
                        >
                          Reset defaults
                        </button>
                      </div>
                    </div>
                  );
                };

                return (
                  <div className="grid lg:grid-cols-2 gap-6">
                    {renderStages('projectStages', 'Project stages', 'Controls the columns for project boards (Kanban/List/Calendar filtering).')}
                    {renderStages('taskStages', 'Task stages', 'Controls the columns for task boards (Kanban/List/Calendar filtering).')}
                  </div>
                );
              })()}

              <div className={FINELY_OS_NOTICE_WARN}>
                <div className="flex items-start gap-3">
                  <AlertCircle size={18} className="text-fuchsia-400 mt-0.5 shrink-0" />
                  <div className={`${FINELY_OS_ENTITY_BODY} leading-relaxed`}>
                    These stages are stored per-tenant and will drive every WorkBoard across Partner + Admin views. After editing, use the main{' '}
                    <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>Save</span> button at the top to persist changes.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Custom Fields */}
          {activeTab === 'customFields' && (
            <div className="space-y-6">
              <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-violet-400">
                    <FileText size={18} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Custom Fields</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={cfScope}
                      onChange={(e) => setCfScope(e.target.value as CustomFieldScope)}
                      className={FINELY_OS_ENTITY_SELECT}
                      title="Scope"
                    >
                      {(
                        [
                          'partners',
                          'leads',
                          'projects',
                          'tasks',
                          'team',
                          'roles',
                          'comms',
                          'automation',
                          'au_sellers',
                          'affiliates',
                        ] as CustomFieldScope[]
                      ).map((s) => (
                        <option key={s} value={s}>
                          {s.replace(/_/g, ' ').toUpperCase()}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        const tid = (tenantId || '').trim() || FINELY_TENANT_ID;
                        const payload = {
                          tenantId: tid,
                          scope: cfScope,
                          exportedAt: new Date().toISOString(),
                          definitions: cfDefs,
                          layout: layoutDraft,
                        };
                        downloadText({
                          text: JSON.stringify(payload, null, 2),
                          filename: `custom_fields_${tid}_${cfScope}_${new Date().toISOString().slice(0, 10)}.json`,
                          mimeType: 'application/json;charset=utf-8',
                        });
                        setCfNotice('Exported custom fields JSON.');
                        window.setTimeout(() => setCfNotice(null), 2500);
                      }}
                      className={FINELY_OS_SECONDARY_BTN}
                      title="Download JSON containing definitions + layout for this scope"
                    >
                      Export JSON
                    </button>
                    <label
                      className={`${FINELY_OS_SECONDARY_BTN} cursor-pointer ${
                        adminCaps.canManageCustomFields && adminCaps.canManageFieldLayouts ? '' : 'opacity-60 pointer-events-none'
                      }`}
                      title="Import JSON containing definitions + layout for this scope (admin-only)"
                    >
                      Import JSON
                      <input
                        type="file"
                        accept="application/json"
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          e.currentTarget.value = '';
                          if (!f) return;
                          if (!adminCaps.canManageCustomFields || !adminCaps.canManageFieldLayouts) return;
                          try {
                            const tid = (tenantId || '').trim() || FINELY_TENANT_ID;
                            const raw = await f.text();
                            const obj = JSON.parse(raw || '{}') as any;
                            const scope: CustomFieldScope = (obj?.scope as any) || cfScope;
                            const defs: any[] = Array.isArray(obj?.definitions) ? obj.definitions : [];
                            const layout: any = obj?.layout ?? null;

                            // Upsert defs (normalize tenantId/scope).
                            for (const d of defs) {
                              if (!d || typeof d !== 'object') continue;
                              upsertCustomFieldDefinition({ ...(d as any), tenantId: tid, scope });
                            }
                            if (layout && typeof layout === 'object' && Array.isArray(layout.sections)) {
                              upsertFieldLayout({ ...(layout as any), tenantId: tid, scope });
                            }
                            setCfScope(scope);
                            setStoreVersion((v) => v + 1);
                            window.dispatchEvent(new Event('finely:store'));
                            setCfNotice(`Imported ${defs.length} field(s) for ${scope}.`);
                            window.setTimeout(() => setCfNotice(null), 3500);
                          } catch (err: any) {
                            setCfNotice(err?.message || 'Import failed.');
                            window.setTimeout(() => setCfNotice(null), 4500);
                          }
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        if (!adminCaps.canManageCustomFields) return;
                        const def = createCustomFieldDefinition({
                          scope: cfScope,
                          key: `field_${Date.now().toString(16)}`,
                          label: 'New field',
                          type: 'text',
                        });
                        const withTenant: CustomFieldDefinition = { ...def, tenantId };
                        upsertCustomFieldDefinition(withTenant);
                        setCfDefs((cur) => [withTenant, ...cur]);
                      }}
                      disabled={!adminCaps.canManageCustomFields}
                      className={FINELY_OS_PRIMARY_BTN}
                    >
                      <Plus size={14} /> Add field
                    </button>
                  </div>
                </div>

                {cfNotice ? (
                  <div className={FINELY_OS_NOTICE_WARN}>{cfNotice}</div>
                ) : null}

                <p className={FINELY_OS_ENTITY_BODY}>
                  Create reusable fields for <span className={`font-semibold ${FINELY_OS_ENTITY_VALUE}`}>{cfScope.replace(/_/g, ' ')}</span>. These definitions
                  are the foundation for adding 20+ fields without hardcoding every module.
                </p>

                {cfDefs.length === 0 ? (
                  <div className={FINELY_OS_ENTITY_EMPTY}>
                    No custom fields yet for this scope.
                  </div>
                ) : (
                  <FinelyOsPaginatedStack
                    items={cfDefs}
                    pageSize={6}
                    emptyMessage="No custom fields yet for this scope."
                    renderItem={(def) => {
                      const showOptions = def.type === 'select' || def.type === 'multiselect';
                      const persist = (id: string) => {
                        const cur = cfDefs.find((x) => x.id === id);
                        if (cur) upsertCustomFieldDefinition(cur);
                      };

                      return (
                        <div key={def.id} className={`${finelyOsCatalogCard('amber')} !p-4 fc-surface-harmony`} data-fc-accent="amber">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="grid md:grid-cols-2 gap-3 flex-1 min-w-[260px]">
                              <div className="space-y-1">
                                <label className={FINELY_OS_ENTITY_SUBLABEL}>Label</label>
                                <input
                                  value={def.label}
                                  onChange={(e) =>
                                    setCfDefs((cur) =>
                                      cur.map((x) => (x.id === def.id ? { ...x, label: e.target.value } : x))
                                    )
                                  }
                                  onBlur={() => persist(def.id)}
                                  className={FINELY_OS_ENTITY_INPUT}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className={FINELY_OS_ENTITY_SUBLABEL}>Key</label>
                                <input
                                  value={def.key}
                                  onChange={(e) => {
                                    const nextKey = normalizeKey(e.target.value);
                                    setCfDefs((cur) => cur.map((x) => (x.id === def.id ? { ...x, key: nextKey } : x)));
                                  }}
                                  onBlur={() => persist(def.id)}
                                  placeholder="e.g. co_owner_name"
                                  className={`${FINELY_OS_ENTITY_INPUT} font-mono`}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className={FINELY_OS_ENTITY_SUBLABEL}>Type</label>
                                <select
                                  value={def.type}
                                  onChange={(e) => {
                                    const t = e.target.value as CustomFieldType;
                                    setCfDefs((cur) =>
                                      cur.map((x) =>
                                        x.id === def.id
                                          ? { ...x, type: t, options: t === 'select' || t === 'multiselect' ? x.options ?? ['Option A'] : undefined }
                                          : x
                                      )
                                    );
                                  }}
                                  onBlur={() => persist(def.id)}
                                  className={FINELY_OS_ENTITY_SELECT}
                                >
                                  {(
                                    ['text', 'textarea', 'number', 'boolean', 'date', 'select', 'multiselect', 'json'] as CustomFieldType[]
                                  ).map((t) => (
                                    <option key={t} value={t}>
                                      {t.toUpperCase()}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className={FINELY_OS_ENTITY_SUBLABEL}>Help text</label>
                                <input
                                  value={def.helpText ?? ''}
                                  onChange={(e) =>
                                    setCfDefs((cur) =>
                                      cur.map((x) => (x.id === def.id ? { ...x, helpText: e.target.value || undefined } : x))
                                    )
                                  }
                                  onBlur={() => persist(def.id)}
                                  placeholder="Optional hint shown under the field"
                                  className={FINELY_OS_ENTITY_INPUT}
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <label className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_BODY} select-none`}>
                                <input
                                  type="checkbox"
                                  checked={Boolean(def.required)}
                                  onChange={(e) =>
                                    setCfDefs((cur) => cur.map((x) => (x.id === def.id ? { ...x, required: e.target.checked } : x)))
                                  }
                                  onBlur={() => persist(def.id)}
                                  className="accent-violet-500"
                                />
                                Required
                              </label>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!adminCaps.canManageCustomFields) return;
                                  deleteCustomFieldDefinition(def.id);
                                  setCfDefs((cur) => cur.filter((x) => x.id !== def.id));
                                }}
                                disabled={!adminCaps.canManageCustomFields}
                                className={FINELY_OS_DANGER_BTN}
                                title="Delete field"
                              >
                                <Trash2 size={14} /> Delete
                              </button>
                            </div>
                          </div>

                          {showOptions && (
                            <div className="mt-3 space-y-1">
                              <label className={FINELY_OS_ENTITY_SUBLABEL}>Options (comma separated)</label>
                              <input
                                value={(def.options ?? []).join(', ')}
                                onChange={(e) => {
                                  const opts = e.target.value
                                    .split(',')
                                    .map((x) => x.trim())
                                    .filter(Boolean);
                                  setCfDefs((cur) => cur.map((x) => (x.id === def.id ? { ...x, options: opts } : x)));
                                }}
                                onBlur={() => persist(def.id)}
                                placeholder="Option A, Option B, Option C"
                                className={FINELY_OS_ENTITY_INPUT}
                              />
                            </div>
                          )}
                        </div>
                      );
                    }}
                  />
                )}
              </div>

              <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-4`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-violet-400">
                    <Users size={18} />
                    <span className="text-xs font-semibold uppercase tracking-wider">Field layout (per tenant)</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!adminCaps.canManageFieldLayouts) return;
                        if (!layoutDraft) return;
                        upsertFieldLayout(layoutDraft);
                        setLayoutSaved(true);
                        setTimeout(() => setLayoutSaved(false), 1200);
                      }}
                      disabled={!layoutDraft || !adminCaps.canManageFieldLayouts}
                      className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${
                        layoutSaved
                          ? FINELY_OS_SUCCESS_BTN
                          : FINELY_OS_PRIMARY_BTN
                      } disabled:opacity-60`}
                      title="Save layout for the active tenant"
                    >
                      {layoutSaved ? <CheckCircle size={14} /> : <Save size={14} />} {layoutSaved ? 'Saved' : 'Save layout'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!adminCaps.canManageFieldLayouts) return;
                        const next = createFieldLayout({ tenantId, scope: cfScope, name: `${cfScope} layout` });
                        next.sections[0].fieldIds = cfDefs.map((d) => d.id);
                        setLayoutDraft(next);
                      }}
                      disabled={!adminCaps.canManageFieldLayouts}
                      className={FINELY_OS_SECONDARY_BTN}
                      title="Reset to default order"
                    >
                      <RefreshCw size={14} /> Reset
                    </button>
                  </div>
                </div>

                <div className={FINELY_OS_ENTITY_BODY}>
                  Controls how fields are grouped and ordered inside entity detail screens (starting with Partners). Tenant:{' '}
                  <span className={`font-mono ${FINELY_OS_ENTITY_VALUE}`}>{tenantId}</span>
                </div>

                {!layoutDraft ? (
                  <div className={FINELY_OS_ENTITY_EMPTY}>No layout loaded.</div>
                ) : (
                  <div className="space-y-4">
                    {layoutDraft.sections.map((sec, secIdx) => (
                      <div key={sec.id} className={`${finelyOsCatalogCard('sky')} !p-4 fc-surface-harmony space-y-3`}>
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex-1 min-w-[220px]">
                            <label className={FINELY_OS_ENTITY_SUBLABEL}>Section title</label>
                            <input
                              value={sec.title}
                              onChange={(e) =>
                                setLayoutDraft((cur) => {
                                  if (!cur) return cur;
                                  const next = JSON.parse(JSON.stringify(cur)) as FieldLayout;
                                  next.sections[secIdx].title = e.target.value;
                                  return next;
                                })
                              }
                              className={FINELY_OS_ENTITY_INPUT}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setLayoutDraft((cur) => {
                                if (!adminCaps.canManageFieldLayouts) return cur;
                                if (!cur) return cur;
                                const next = JSON.parse(JSON.stringify(cur)) as FieldLayout;
                                next.sections.splice(secIdx + 1, 0, {
                                  id: crypto?.randomUUID ? crypto.randomUUID() : `sec_${Date.now().toString(16)}`,
                                  title: 'New section',
                                  fieldIds: [],
                                });
                                return next;
                              })
                            }
                            disabled={!adminCaps.canManageFieldLayouts}
                            className={FINELY_OS_SECONDARY_BTN}
                            title="Add section below"
                          >
                            <Plus size={14} /> Add section
                          </button>
                        </div>

                        {sec.fieldIds.length === 0 ? (
                          <div className={`${FINELY_OS_ENTITY_BODY} text-sm`}>No fields assigned to this section yet.</div>
                        ) : (
                          <div className="grid md:grid-cols-2 gap-3">
                            {sec.fieldIds.map((fid, idx) => {
                              const def = cfDefsById.get(fid);
                              if (!def) return null;
                              const isHidden = Boolean(layoutDraft.hiddenFieldIds?.includes(fid));
                              return (
                                <div key={fid} className={`${finelyOsInlineListItem()} p-3 flex items-center justify-between gap-3`}>
                                  <div className="min-w-0">
                                    <div className={`${FINELY_OS_ENTITY_VALUE} truncate`}>{def.label}</div>
                                    <div className={`mt-0.5 ${FINELY_OS_ENTITY_SUBLABEL} font-mono truncate`}>{def.key}</div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setLayoutDraft((cur) => {
                                          if (!cur) return cur;
                                          const next = JSON.parse(JSON.stringify(cur)) as FieldLayout;
                                          const arr = next.sections[secIdx].fieldIds;
                                          if (idx <= 0) return cur;
                                          const tmp = arr[idx - 1];
                                          arr[idx - 1] = arr[idx];
                                          arr[idx] = tmp;
                                          return next;
                                        })
                                      }
                                      className={`${FINELY_OS_SECONDARY_BTN} px-2 py-1 text-[10px]`}
                                      title="Move up"
                                      disabled={idx <= 0}
                                    >
                                      ↑
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setLayoutDraft((cur) => {
                                          if (!cur) return cur;
                                          const next = JSON.parse(JSON.stringify(cur)) as FieldLayout;
                                          const arr = next.sections[secIdx].fieldIds;
                                          if (idx >= arr.length - 1) return cur;
                                          const tmp = arr[idx + 1];
                                          arr[idx + 1] = arr[idx];
                                          arr[idx] = tmp;
                                          return next;
                                        })
                                      }
                                      className={`${FINELY_OS_SECONDARY_BTN} px-2 py-1 text-[10px]`}
                                      title="Move down"
                                      disabled={idx >= sec.fieldIds.length - 1}
                                    >
                                      ↓
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setLayoutDraft((cur) => {
                                          if (!cur) return cur;
                                          const next = JSON.parse(JSON.stringify(cur)) as FieldLayout;
                                          const hidden = new Set(next.hiddenFieldIds ?? []);
                                          if (hidden.has(fid)) hidden.delete(fid);
                                          else hidden.add(fid);
                                          next.hiddenFieldIds = Array.from(hidden);
                                          return next;
                                        })
                                      }
                                      className={`px-2 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest transition-all ${
                                        isHidden
                                          ? 'border-fuchsia-500/35 bg-fuchsia-500/15 text-fuchsia-200'
                                          : `${FINELY_OS_SECONDARY_BTN}`
                                      }`}
                                      title={isHidden ? 'Hidden (click to show)' : 'Visible (click to hide)'}
                                    >
                                      {isHidden ? 'Hidden' : 'Visible'}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={`${finelyOsCatalogCard('violet')} !p-5 space-y-3`}>
                <div className="flex items-center gap-2 text-violet-400">
                  <RefreshCw size={18} />
                  <span className="text-xs font-semibold uppercase tracking-wider">Next step</span>
                </div>
                <p className={FINELY_OS_ENTITY_BODY}>
                  After you create fields here, I’ll surface them inside each module (Partners, CRM/Leads, Projects, Tasks, Team/Roles, Comms Studio)
                  so you can edit the values per record.
                </p>
              </div>
            </div>
          )}
        </div>
        <FinelyOsPageFooter />
</div>
    </PageShell>
  );
}
