import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  Columns3,
  CreditCard,
  Crown,
  Facebook,
  FileText,
  Headphones,
  Home,
  LayoutDashboard,
  Mail,
  MessageCircle,
  Settings,
  Shield,
  ShieldAlert,
  Sparkles,
  ToggleRight,
  type LucideIcon,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { SettingsTab } from '../../../../pages/admin/AdminSettingsPage';
import { AdminSettingsInspector } from './AdminSettingsInspector';
import { loadSettings } from '../../../../data/settingsRepo';
import type { PlatformSettings } from '../../../../domain/settings';
import {
  FINELY_OS_ENTITY_BODY,
  FINELY_OS_ENTITY_SUBLABEL,
  FINELY_OS_ENTITY_VALUE,
  FINELY_OS_PRIMARY_BTN,
  FINELY_OS_SECONDARY_BTN,
  finelyOsCatalogCard,
  finelyOsStatusChip,
} from '../../../os/finelyOsLightUi';
import type { WorkspaceProductSurfaceProps } from '../workspaceProductSurfaceRegistry';
import { getWorkspaceProductArchetype } from '../workspaceProductArchetypes';
import { getWorkspaceProductNavItem } from '../workspaceProductNav';
import { ProductDashboardSkeleton } from '../components/ProductUi';
import { ProductHubScaffold, ProductPagePrimaryAction } from '../components/ProductHubScaffold';
import './adminSettingsProductSurface.css';

type FamilyStatus = 'live' | 'needs_action' | 'optional';

type SettingsFamily = {
  id: string;
  label: string;
  purpose: string;
  tab: SettingsTab | null;
  icon: LucideIcon;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  status: FamilyStatus;
  statusLabel: string;
  externalPath?: string;
};

const ACCENT_CYCLE: Array<'emerald' | 'violet' | 'sky' | 'rose'> = ['emerald', 'violet', 'sky', 'rose'];

function stripeStatus(settings: PlatformSettings): FamilyStatus {
  const s = settings.stripe?.status;
  return s === 'live' || s === 'test_mode' ? 'live' : 'needs_action';
}

function providerStatus(settings: PlatformSettings, key: 'denefits' | 'noraCapital'): FamilyStatus {
  const s = settings[key]?.status;
  return s === 'live' || s === 'test_mode' ? 'live' : 'needs_action';
}

function buildFamilies(settings: PlatformSettings): SettingsFamily[] {
  const raw: Array<Omit<SettingsFamily, 'accent'>> = [
    {
      id: 'overview',
      label: 'Platform overview',
      purpose: 'Category shortcuts, admin links, and shareable tab URLs.',
      tab: 'home',
      icon: Home,
      status: 'live',
      statusLabel: 'All categories',
    },
    {
      id: 'identity',
      label: 'Identity & brand',
      purpose: 'Public site name, logo, contact defaults, and social links.',
      tab: 'site',
      icon: Settings,
      status: settings.site.brandName?.trim() ? 'live' : 'needs_action',
      statusLabel: settings.site.brandName?.trim() ? 'Branded' : 'Needs brand',
    },
    {
      id: 'mail',
      label: 'Mail & SMS',
      purpose: 'SendGrid email identity, Twilio SMS, and delivery defaults.',
      tab: 'comms',
      icon: Mail,
      status: settings.comms?.sendgridFromEmail ? 'live' : 'needs_action',
      statusLabel: settings.comms?.sendgridFromEmail ? 'Email live' : 'Not wired',
    },
    {
      id: 'chat',
      label: 'Chat routing',
      purpose: 'Ask Finely, public chat, and assistant routing.',
      tab: 'chat',
      icon: MessageCircle,
      status: settings.chat?.tenorApiKey || settings.features?.aiGateway ? 'live' : 'optional',
      statusLabel: settings.features?.aiGateway ? 'AI gateway on' : 'Review routing',
    },
    {
      id: 'meta',
      label: 'Meta leads',
      purpose: 'Facebook and Instagram lead ads plus OAuth.',
      tab: 'meta',
      icon: Facebook,
      status: 'optional',
      statusLabel: 'Optional channel',
    },
    {
      id: 'payments',
      label: 'Stripe payments',
      purpose: 'Card processing for programs and checkout.',
      tab: 'stripe',
      icon: CreditCard,
      status: stripeStatus(settings),
      statusLabel: settings.stripe?.status ?? 'Not configured',
    },
    {
      id: 'financing',
      label: 'In-house financing',
      purpose: 'Denefits contracts and financed enrollment.',
      tab: 'denefits',
      icon: Building2,
      status: providerStatus(settings, 'denefits'),
      statusLabel: settings.denefits?.status ?? 'Not configured',
    },
    {
      id: 'capital',
      label: 'Nora Capital',
      purpose: 'Funding partner API and underwriting handoffs.',
      tab: 'nora',
      icon: BriefcaseBusiness,
      status: providerStatus(settings, 'noraCapital'),
      statusLabel: settings.noraCapital?.status ?? 'Not configured',
    },
    {
      id: 'pricing',
      label: 'Pricing controls',
      purpose: 'Catalog visibility, package overrides, and promos.',
      tab: 'pricing',
      icon: LayoutDashboard,
      status: 'live',
      statusLabel: 'Catalog active',
    },
    {
      id: 'workboard',
      label: 'WorkBoard stages',
      purpose: 'Project and task stages with SLA defaults.',
      tab: 'workboard',
      icon: Columns3,
      status: settings.workboard?.projectStages?.length ? 'live' : 'optional',
      statusLabel: `${settings.workboard?.projectStages?.length ?? 0} project stages`,
    },
    {
      id: 'entitlements',
      label: 'Entitlements',
      purpose: 'Feature flags and module rollout switches.',
      tab: 'features',
      icon: ToggleRight,
      status: 'live',
      statusLabel: 'Flags loaded',
    },
    {
      id: 'theme',
      label: 'Theme & appearance',
      purpose: 'Admin chrome, light/dark defaults, and workspace polish.',
      tab: 'appearance',
      icon: Sparkles,
      status: 'live',
      statusLabel: 'Appearance ready',
    },
    {
      id: 'security',
      label: 'Security & access',
      purpose: 'Admin allowlist, policies, and team preview.',
      tab: 'security',
      icon: Shield,
      status: settings.security?.adminEmails?.length ? 'live' : 'needs_action',
      statusLabel: settings.security?.adminEmails?.length
        ? `${settings.security.adminEmails.length} admins`
        : 'Needs allowlist',
    },
    {
      id: 'voice',
      label: 'Voice studio',
      purpose: 'Public narrator presets and Nora tenant voice.',
      tab: null,
      externalPath: '/admin/voice-studio',
      icon: Headphones,
      status: settings.voiceStudio?.publicVoiceProfile ? 'live' : 'optional',
      statusLabel: settings.voiceStudio?.publicVoiceProfile?.replace(/_/g, ' ') ?? 'Preset',
    },
    {
      id: 'society',
      label: 'Head of Society',
      purpose: 'HOS access codes and society program controls.',
      tab: 'heta',
      icon: Crown,
      status: 'optional',
      statusLabel: 'Program controls',
    },
    {
      id: 'schema',
      label: 'Custom fields',
      purpose: 'Partner and case field definitions plus layouts.',
      tab: 'customFields',
      icon: FileText,
      status: 'optional',
      statusLabel: 'Schema tools',
    },
  ];

  return raw.map((family, index) => ({
    ...family,
    accent: ACCENT_CYCLE[index % ACCENT_CYCLE.length],
  }));
}

function familyIdForTab(tab: SettingsTab): string {
  const map: Partial<Record<SettingsTab, string>> = {
    home: 'overview',
    site: 'identity',
    comms: 'mail',
    chat: 'chat',
    meta: 'meta',
    stripe: 'payments',
    denefits: 'financing',
    nora: 'capital',
    pricing: 'pricing',
    workboard: 'workboard',
    features: 'entitlements',
    appearance: 'theme',
    security: 'security',
    heta: 'society',
    customFields: 'schema',
  };
  return map[tab] ?? 'overview';
}

function statusChipTone(status: FamilyStatus): 'ok' | 'warn' | 'blocked' {
  if (status === 'live') return 'ok';
  if (status === 'needs_action') return 'warn';
  return 'blocked';
}

export default function AdminSettingsProductSurface({ role, pageId, dataMode }: WorkspaceProductSurfaceProps) {
  const navigate = useNavigate();
  const navItem = getWorkspaceProductNavItem('admin', pageId);
  const archetype = getWorkspaceProductArchetype('admin', pageId);
  const accent = navItem?.accent ?? 'graphite';

  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedFamilyId, setSelectedFamilyId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    try {
      const data = loadSettings();
      if (!cancelled) {
        setSettings(data);
        setLoading(false);
      }
    } catch {
      if (!cancelled) setLoading(false);
    }
    return () => {
      cancelled = true;
    };
  }, [dataMode]);

  useEffect(() => {
    const onStore = () => setSettings(loadSettings());
    window.addEventListener('finely:store', onStore as EventListener);
    return () => window.removeEventListener('finely:store', onStore as EventListener);
  }, []);

  const families = useMemo(() => (settings ? buildFamilies(settings) : []), [settings]);

  useEffect(() => {
    if (!families.length || selectedFamilyId) return;
    const firstGap = families.find((f) => f.status === 'needs_action');
    setSelectedFamilyId(firstGap?.id ?? families[0]?.id ?? 'security');
  }, [families, selectedFamilyId]);

  const selectedFamily = families.find((f) => f.id === selectedFamilyId) ?? families[0];
  const needsAction = families.filter((f) => f.status === 'needs_action').length;
  const liveCount = families.filter((f) => f.status === 'live').length;

  const alerts = useMemo(
    () =>
      families
        .filter((f) => f.status === 'needs_action')
        .map((f) => ({
          tone: 'warn' as const,
          title: `${f.label} — ${f.statusLabel}`,
          action: () => setSelectedFamilyId(f.id),
        })),
    [families],
  );

  if (loading || !settings || !selectedFamily) {
    return <ProductDashboardSkeleton label="Loading platform control room" />;
  }

  return (
    <ProductHubScaffold
      role={role}
      pageId={pageId}
      eyebrow="Platform"
      title="Settings"
      description="Payments, messaging, security, and partner-facing defaults — one control room for every platform family."
      accent={accent}
      surfaceMode={navItem?.surfaceMode ?? 'light'}
      archetype={archetype}
      icon={navItem?.icon ?? Settings}
      status={
        needsAction
          ? `${needsAction} famil${needsAction === 1 ? 'y' : 'ies'} need setup`
          : 'Critical families configured'
      }
      freshness="Live settings"
      primaryAction={
        <ProductPagePrimaryAction
          label="Review security"
          onClick={() => setSelectedFamilyId('security')}
        />
      }
      secondaryAction={
        <button type="button" className="fc-wlp-btn-secondary" onClick={() => navigate('/admin/access')}>
          Access & permissions
        </button>
      }
      metrics={[
        { label: 'Live', value: String(liveCount), hint: 'Families configured', accent: 'emerald', onClick: () => setSelectedFamilyId('identity') },
        { label: 'Needs setup', value: String(needsAction), hint: 'Blockers before launch', accent: 'rose', onClick: () => setSelectedFamilyId(families.find((f) => f.status === 'needs_action')?.id ?? 'security') },
        { label: 'Admins', value: String(settings.security?.adminEmails?.length ?? 0), hint: 'Allowlisted accounts', accent: 'violet', onClick: () => setSelectedFamilyId('security') },
        { label: 'Webhooks', value: String(settings.webhooks?.length ?? 0), hint: 'Outbound endpoints', accent: 'sky', onClick: () => navigate('/admin/integrations') },
      ]}
      metricTitle="Configuration health"
      metricDescription="Security, payments, messaging, and partner defaults at a glance."
      metricsVariant="instrument"
    >
      <section className="fc-admin-settings-control" data-surface-layout="control-room">
        <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8`} data-fc-accent="violet">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className={FINELY_OS_ENTITY_SUBLABEL}>Platform pulse</p>
              <p className={`mt-1 text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                {needsAction
                  ? `${needsAction} famil${needsAction === 1 ? 'y' : 'ies'} still need setup before partner sends and checkout.`
                  : `${liveCount} families live — open any tile to review or adjust controls.`}
              </p>
            </div>
            <span className={finelyOsStatusChip(needsAction ? 'warn' : 'ok')}>
              {needsAction ? 'Setup needed' : 'Healthy'}
            </span>
          </div>
        </div>

        <div className="fc-admin-settings-layout">
          <aside className="fc-admin-settings-grid">
            <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>Settings families</h2>
            <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>Pick a family to open its inspector.</p>
            <div className="fc-admin-settings-family-grid">
              {families.map((family) => {
                const Icon = family.icon;
                const selected = family.id === selectedFamily.id;
                return (
                  <button
                    key={family.id}
                    type="button"
                    data-selected={selected ? 'true' : undefined}
                    data-status={family.status}
                    className={`fc-admin-settings-family-tile fc-wlp-control-room-family ${finelyOsCatalogCard(family.accent)}`}
                    data-fc-accent={family.accent}
                    onClick={() => setSelectedFamilyId(family.id)}
                  >
                    <div className="fc-admin-settings-family-head">
                      <Icon size={20} className="shrink-0 opacity-90" />
                      <span className={`fc-wlp-control-room-family-status ${finelyOsStatusChip(statusChipTone(family.status))}`}>
                        {family.statusLabel}
                      </span>
                    </div>
                    <div className={`text-base font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{family.label}</div>
                    <p className={`text-sm font-bold leading-snug ${FINELY_OS_ENTITY_BODY}`}>{family.purpose}</p>
                  </button>
                );
              })}
            </div>
          </aside>

          <div className="fc-admin-settings-inspector">
            <div className="fc-admin-settings-inspector-bed">
              <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
                <div className="flex flex-wrap items-center gap-3">
                  <selectedFamily.icon size={22} className="shrink-0 opacity-90" />
                  <div>
                    <p className={FINELY_OS_ENTITY_SUBLABEL}>Inspector</p>
                    <h2 className={`text-2xl font-extrabold ${FINELY_OS_ENTITY_VALUE}`}>{selectedFamily.label}</h2>
                    <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>{selectedFamily.purpose}</p>
                  </div>
                </div>
                <span className={finelyOsStatusChip(statusChipTone(selectedFamily.status))}>
                  {selectedFamily.statusLabel}
                </span>
              </div>

              <div className="fc-wlp-settings-control-inspector">
                {selectedFamily.externalPath ? (
                  <div className={`${finelyOsCatalogCard('violet')} p-6 lg:p-8 space-y-4`} data-fc-accent="violet">
                    <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>
                      Voice presets live in Voice Studio — change narrators and run test renders there.
                    </p>
                    <p className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                      Current public preset:{' '}
                      <strong>{settings.voiceStudio?.publicVoiceProfile?.replace(/_/g, ' ') ?? 'Not set'}</strong>
                    </p>
                    <button
                      type="button"
                      className={FINELY_OS_PRIMARY_BTN}
                      onClick={() => navigate(selectedFamily.externalPath!)}
                    >
                      Open Voice Studio
                    </button>
                  </div>
                ) : (
                  <AdminSettingsInspector
                    key={selectedFamily.tab ?? 'home'}
                    activeTab={selectedFamily.tab ?? 'home'}
                    onSelectTab={(tab) => setSelectedFamilyId(familyIdForTab(tab))}
                    onSettingsSaved={() => setSettings(loadSettings())}
                  />
                )}
              </div>
            </div>
          </div>

          <aside className="fc-admin-settings-alert-rail">
            <div className={`${finelyOsCatalogCard('rose')} p-6 lg:p-8 space-y-4`} data-fc-accent="rose">
              <div className="flex items-center gap-2">
                <AlertTriangle size={18} />
                <h3 className="text-lg font-extrabold">Alert rail</h3>
              </div>
              {alerts.length === 0 ? (
                <p className={`text-base font-bold ${FINELY_OS_ENTITY_BODY}`}>All critical families look healthy.</p>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <button
                      key={alert.title}
                      type="button"
                      onClick={alert.action}
                      className={`fc-admin-settings-alert-item w-full text-left ${finelyOsCatalogCard('sky')}`}
                      data-fc-accent="sky"
                    >
                      <span className={finelyOsStatusChip(alert.tone)}>{alert.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className={`${finelyOsCatalogCard('emerald')} p-6 lg:p-8 space-y-3`} data-fc-accent="emerald">
              <div className={`inline-flex items-center gap-2 ${FINELY_OS_ENTITY_SUBLABEL}`}>
                <ShieldAlert size={16} /> Platform signals
              </div>
              <div className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Stripe: {settings.stripe?.status ?? 'Not configured'}
              </div>
              <div className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Email: {settings.comms?.sendgridFromEmail ? 'Configured' : 'Not wired'}
              </div>
              <div className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Admins: {settings.security?.adminEmails?.length ?? 0} allowlisted
              </div>
              <div className={`text-sm font-bold ${FINELY_OS_ENTITY_BODY}`}>
                Webhooks: {settings.webhooks?.length ?? 0} registered
              </div>
              {settings.webhooks?.length ? (
                <button type="button" className={FINELY_OS_SECONDARY_BTN} onClick={() => navigate('/admin/integrations')}>
                  Open integrations
                </button>
              ) : null}
            </div>
          </aside>
        </div>
      </section>

      <p className="fc-wlp-section-description fc-wlp-compliance-line mt-6">
        Results vary · not legal advice · funding subject to underwriting
      </p>
    </ProductHubScaffold>
  );
}
