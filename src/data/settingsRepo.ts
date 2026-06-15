import type {
  PlatformSettings,
  StripeSettings,
  DenefitsSettings,
  NoraCapitalSettings,
  DenefitsContractMapping,
  SiteSettings,
  CommsSettings,
  ChatSettings,
  SecuritySettings,
  FeatureFlags,
  PricingControls,
  WorkboardSettings,
  VoiceStudioSettings,
  WebhookConfig,
} from '../domain/settings';
import { DEFAULT_SETTINGS, nowIso } from '../domain/settings';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';

const KEY = 'finely.settings.v1';

// ─────────────────────────────────────────────────────────────────────────────
// Core load/save
// ─────────────────────────────────────────────────────────────────────────────

export function loadSettings(): PlatformSettings {
  const stored = loadJson<PlatformSettings>(KEY, DEFAULT_SETTINGS, 1);
  // Merge with defaults to ensure new fields are present
  const merged = {
    ...DEFAULT_SETTINGS,
    ...stored,
    site: { ...DEFAULT_SETTINGS.site, ...stored.site, postLoginWelcome: { ...DEFAULT_SETTINGS.site.postLoginWelcome, ...(stored.site as any)?.postLoginWelcome } },
    comms: { ...DEFAULT_SETTINGS.comms, ...(stored as any).comms },
    chat: { ...DEFAULT_SETTINGS.chat, ...(stored as any).chat },
    security: { ...DEFAULT_SETTINGS.security, ...(stored as any).security },
    stripe: { ...DEFAULT_SETTINGS.stripe, ...stored.stripe },
    denefits: { ...DEFAULT_SETTINGS.denefits, ...stored.denefits },
    noraCapital: { ...DEFAULT_SETTINGS.noraCapital, ...(stored as any).noraCapital },
    features: { ...DEFAULT_SETTINGS.features, ...stored.features },
    pricing: { ...DEFAULT_SETTINGS.pricing, ...(stored as any).pricing },
    workboard: { ...DEFAULT_SETTINGS.workboard, ...(stored as any).workboard },
    voiceStudio: { ...DEFAULT_SETTINGS.voiceStudio, ...(stored as any).voiceStudio },
    denefitsContracts: stored.denefitsContracts ?? [],
    webhooks: stored.webhooks ?? [],
  };

  // One-time dev migration: if a local dev origin is running with near-default feature flags,
  // auto-enable the broader suite so modules don't "disappear" after origin/port changes.
  // This does NOT run in non-browser environments.
  try {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      const isLocalDev = origin.includes('127.0.0.1') || origin.includes('localhost');
      const markerKey = `finely.settings.enhanced_suite.v1::${origin}`;
      const already = Boolean(localStorage.getItem(markerKey));
      const featureKeys = Object.keys((merged as any).features ?? {});
      const enabled = featureKeys.filter((k) => Boolean((merged as any).features?.[k])).sort();
      const defaultEnabled = Object.keys(DEFAULT_SETTINGS.features).filter((k) => Boolean((DEFAULT_SETTINGS.features as any)[k])).sort();
      const looksDefault = enabled.join('|') === defaultEnabled.join('|');

      if (isLocalDev && !already && looksDefault) {
        // set marker early to prevent any re-entrancy loops
        localStorage.setItem(markerKey, String(Date.now()));
        const next: PlatformSettings = {
          ...(merged as any),
          site: {
            ...(merged as any).site,
            postLoginWelcome: {
              ...((merged as any).site?.postLoginWelcome ?? {}),
              sendWelcomeEmail: true,
            },
          },
          features: {
            ...(merged as any).features,
            aiGateway: true,
            portalChat: true,
            docIntel: true,
            letterMailing: true,
            partnerImport: true,
            inviteDelivery: true,
            commsDelivery: true,
            leadIntel: true,
            courses: true,
            videoStudio: true,
            wealthPaths: true,
            apiAccess: true,
          },
        };
        saveSettings(next);
      }
    }
  } catch {
    // ignore
  }
  return merged;
}

export function saveSettings(settings: PlatformSettings): PlatformSettings {
  const updated = { ...settings, updatedAt: nowIso() };
  saveJson(KEY, updated, 1);
  return updated;
}

// ─────────────────────────────────────────────────────────────────────────────
// WorkBoard settings (stage definitions)
// ─────────────────────────────────────────────────────────────────────────────

export function getWorkboardSettings(): WorkboardSettings {
  return (loadSettings() as any).workboard ?? DEFAULT_SETTINGS.workboard;
}

export function updateWorkboardSettings(patch: Partial<WorkboardSettings>): WorkboardSettings {
  const settings = loadSettings();
  (settings as any).workboard = { ...(settings as any).workboard, ...patch };
  saveSettings(settings);
  return (settings as any).workboard;
}

// ─────────────────────────────────────────────────────────────────────────────
// Voice Studio settings
// ─────────────────────────────────────────────────────────────────────────────

export function getVoiceStudioSettings(): VoiceStudioSettings {
  return loadSettings().voiceStudio ?? DEFAULT_SETTINGS.voiceStudio;
}

export function updateVoiceStudioSettings(patch: Partial<VoiceStudioSettings>): VoiceStudioSettings {
  const settings = loadSettings();
  settings.voiceStudio = { ...settings.voiceStudio, ...patch };
  saveSettings(settings);
  return settings.voiceStudio;
}

// ─────────────────────────────────────────────────────────────────────────────
// Site settings
// ─────────────────────────────────────────────────────────────────────────────

export function getSiteSettings(): SiteSettings {
  return loadSettings().site;
}

export function updateSiteSettings(patch: Partial<SiteSettings>): SiteSettings {
  const settings = loadSettings();
  settings.site = { ...settings.site, ...patch };
  saveSettings(settings);
  return settings.site;
}

// ─────────────────────────────────────────────────────────────────────────────
// Comms settings
// ─────────────────────────────────────────────────────────────────────────────

export function getCommsSettings(): CommsSettings {
  return loadSettings().comms;
}

export function updateCommsSettings(patch: Partial<CommsSettings>): CommsSettings {
  const settings = loadSettings();
  settings.comms = { ...settings.comms, ...patch };
  saveSettings(settings);
  return settings.comms;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat settings
// ─────────────────────────────────────────────────────────────────────────────

export function getChatSettings(): ChatSettings {
  return (loadSettings() as any).chat ?? {};
}

export function updateChatSettings(patch: Partial<ChatSettings>): ChatSettings {
  const settings = loadSettings();
  (settings as any).chat = { ...(settings as any).chat, ...patch };
  saveSettings(settings);
  return (settings as any).chat;
}

// ─────────────────────────────────────────────────────────────────────────────
// Security settings
// ─────────────────────────────────────────────────────────────────────────────

export function getSecuritySettings(): SecuritySettings {
  return (loadSettings() as any).security ?? { adminEmails: [] };
}

export function updateSecuritySettings(patch: Partial<SecuritySettings>): SecuritySettings {
  const settings = loadSettings();
  (settings as any).security = { ...(settings as any).security, ...patch };
  saveSettings(settings);
  return (settings as any).security;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stripe settings
// ─────────────────────────────────────────────────────────────────────────────

export function getStripeSettings(): StripeSettings {
  return loadSettings().stripe;
}

export function updateStripeSettings(patch: Partial<StripeSettings>): StripeSettings {
  const settings = loadSettings();
  settings.stripe = { ...settings.stripe, ...patch };

  // Auto-update status based on keys
  if (patch.publishableKey || patch.secretKey) {
    const hasKeys = Boolean(settings.stripe.publishableKey && settings.stripe.secretKey);
    settings.stripe.status = hasKeys
      ? settings.stripe.testMode
        ? 'test_mode'
        : 'live'
      : 'not_configured';
  }

  saveSettings(settings);
  return settings.stripe;
}

export function isStripeConfigured(): boolean {
  const stripe = getStripeSettings();
  return stripe.status !== 'not_configured';
}

// ─────────────────────────────────────────────────────────────────────────────
// Denefits settings
// ─────────────────────────────────────────────────────────────────────────────

export function getDenefitsSettings(): DenefitsSettings {
  return loadSettings().denefits;
}

export function updateDenefitsSettings(patch: Partial<DenefitsSettings>): DenefitsSettings {
  const settings = loadSettings();
  settings.denefits = { ...settings.denefits, ...patch };

  // Auto-update status
  if (patch.apiKey || patch.merchantId) {
    const hasConfig = Boolean(settings.denefits.merchantId);
    settings.denefits.status = hasConfig
      ? settings.denefits.testMode
        ? 'test_mode'
        : 'live'
      : 'not_configured';
  }

  saveSettings(settings);
  return settings.denefits;
}

export function isDenefitsConfigured(): boolean {
  const denefits = getDenefitsSettings();
  return denefits.status !== 'not_configured';
}

// ─────────────────────────────────────────────────────────────────────────────
// Nora Capital Group settings
// ─────────────────────────────────────────────────────────────────────────────

export function getNoraCapitalSettings(): NoraCapitalSettings {
  return loadSettings().noraCapital;
}

export function updateNoraCapitalSettings(patch: Partial<NoraCapitalSettings>): NoraCapitalSettings {
  const settings = loadSettings();
  settings.noraCapital = { ...settings.noraCapital, ...patch };

  // Status is based on non-sensitive config only. Secrets should be server-side.
  if (patch.baseUrl || patch.testMode != null) {
    const hasConfig = Boolean(settings.noraCapital.baseUrl);
    settings.noraCapital.status = hasConfig
      ? settings.noraCapital.testMode
        ? 'test_mode'
        : 'live'
      : 'not_configured';
  }

  saveSettings(settings);
  return settings.noraCapital;
}

export function isNoraCapitalConfigured(): boolean {
  const nora = getNoraCapitalSettings();
  return nora.status !== 'not_configured';
}

// ─────────────────────────────────────────────────────────────────────────────
// Denefits contract mappings
// ─────────────────────────────────────────────────────────────────────────────

export function getDenefitsContracts(): DenefitsContractMapping[] {
  return loadSettings().denefitsContracts;
}

export function getDenefitsContractForPackage(packageId: string): DenefitsContractMapping | null {
  return getDenefitsContracts().find((c) => c.packageId === packageId) ?? null;
}

export function setDenefitsContract(
  packageId: string,
  contractUrl: string,
  label?: string
): DenefitsContractMapping {
  const settings = loadSettings();
  const existing = settings.denefitsContracts.findIndex((c) => c.packageId === packageId);
  const mapping: DenefitsContractMapping = {
    packageId,
    contractUrl,
    label,
    updatedAt: nowIso(),
  };

  if (existing >= 0) {
    settings.denefitsContracts[existing] = mapping;
  } else {
    settings.denefitsContracts.push(mapping);
  }

  saveSettings(settings);
  return mapping;
}

export function removeDenefitsContract(packageId: string): boolean {
  const settings = loadSettings();
  const idx = settings.denefitsContracts.findIndex((c) => c.packageId === packageId);
  if (idx < 0) return false;
  settings.denefitsContracts.splice(idx, 1);
  saveSettings(settings);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature flags
// ─────────────────────────────────────────────────────────────────────────────

export function getFeatureFlags(): FeatureFlags {
  return loadSettings().features;
}

export function updateFeatureFlags(patch: Partial<FeatureFlags>): FeatureFlags {
  const settings = loadSettings();
  settings.features = { ...settings.features, ...patch };
  saveSettings(settings);
  return settings.features;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pricing controls
// ─────────────────────────────────────────────────────────────────────────────

export function getPricingControls(): PricingControls {
  return loadSettings().pricing;
}

export function updatePricingControls(patch: Partial<PricingControls>): PricingControls {
  const settings = loadSettings();
  settings.pricing = { ...settings.pricing, ...patch };
  saveSettings(settings);
  return settings.pricing;
}

export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return getFeatureFlags()[flag] ?? false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Webhooks
// ─────────────────────────────────────────────────────────────────────────────

export function getWebhooks(): WebhookConfig[] {
  return loadSettings().webhooks;
}

export function getWebhook(id: string): WebhookConfig | null {
  return getWebhooks().find((w) => w.id === id) ?? null;
}

export function addWebhook(
  config: Omit<WebhookConfig, 'id' | 'status'>
): WebhookConfig {
  const settings = loadSettings();
  const webhook: WebhookConfig = {
    ...config,
    id: newId('webhook'),
    status: 'active',
  };
  settings.webhooks.push(webhook);
  saveSettings(settings);
  return webhook;
}

export function updateWebhook(
  id: string,
  patch: Partial<Omit<WebhookConfig, 'id'>>
): WebhookConfig | null {
  const settings = loadSettings();
  const idx = settings.webhooks.findIndex((w) => w.id === id);
  if (idx < 0) return null;
  settings.webhooks[idx] = { ...settings.webhooks[idx]!, ...patch };
  saveSettings(settings);
  return settings.webhooks[idx]!;
}

export function removeWebhook(id: string): boolean {
  const settings = loadSettings();
  const idx = settings.webhooks.findIndex((w) => w.id === id);
  if (idx < 0) return false;
  settings.webhooks.splice(idx, 1);
  saveSettings(settings);
  return true;
}

// ─────────────────────────────────────────────────────────────────────────────
// Reset
// ─────────────────────────────────────────────────────────────────────────────

export function resetSettings(): PlatformSettings {
  return saveSettings(DEFAULT_SETTINGS);
}
