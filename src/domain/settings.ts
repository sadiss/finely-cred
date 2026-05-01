/**
 * Platform Settings Domain
 *
 * Stores configuration for integrations, feature flags, and site settings.
 * In production with Supabase, sensitive keys would be stored server-side
 * and only non-sensitive settings would be client-accessible.
 */

export type IntegrationStatus = 'not_configured' | 'test_mode' | 'live';

/**
 * Stripe integration settings
 */
export interface StripeSettings {
  status: IntegrationStatus;
  /** Publishable key (safe for client) */
  publishableKey?: string;
  /** Secret key - in production, this would be server-side only */
  secretKey?: string;
  /** Webhook signing secret */
  webhookSecret?: string;
  /** Webhook endpoint URL (for reference) */
  webhookEndpoint?: string;
  /** Test mode flag */
  testMode: boolean;
}

/**
 * Denefits integration settings
 */
export interface DenefitsSettings {
  status: IntegrationStatus;
  /** API key for server-side calls */
  apiKey?: string;
  /** Webhook URL for payment notifications */
  webhookUrl?: string;
  /** Webhook secret for verifying signatures */
  webhookSecret?: string;
  /** Merchant/Provider ID */
  merchantId?: string;
  /** Test mode flag */
  testMode: boolean;
}

/**
 * Nora Capital Group integration settings (wealth accelerator / funding pathways)
 */
export interface NoraCapitalSettings {
  status: IntegrationStatus;
  /** Base API URL (e.g., https://api.noracapitalgroup.com) */
  baseUrl?: string;
  /** API key (server-side in production) */
  apiKey?: string;
  /** Webhook URL for status updates (optional) */
  webhookUrl?: string;
  /** Webhook secret for signature verification (optional) */
  webhookSecret?: string;
  testMode: boolean;
}

/**
 * Maps package IDs to their Denefits contract embed URLs
 */
export interface DenefitsContractMapping {
  packageId: string;
  contractUrl: string;
  label?: string;
  updatedAt: string;
}

/**
 * Site branding and contact settings
 */
export interface SiteSettings {
  brandName: string;
  supportEmail: string;
  supportPhone?: string;
  /** Public social links for footer/header. */
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    linkedin?: string;
    youtube?: string;
    tiktok?: string;
    x?: string;
  };
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  accentColor?: string;
}

/**
 * Communications settings (non-sensitive; secrets belong server-side).
 */
export interface CommsSettings {
  /** Used to generate absolute claim/invite links (optional). */
  appBaseUrl?: string;
  /** From email/name shown to recipients (SendGrid send uses server-side API key). */
  sendgridFromEmail?: string;
  sendgridFromName?: string;
  /** From phone shown on SMS (Twilio send uses server-side credentials). */
  twilioFromPhone?: string;
}

/**
 * Chat and messaging settings (non-sensitive).
 * Note: if a provider requires secrets, store them server-side in production.
 */
export interface ChatSettings {
  /** Tenor API key for GIF search (optional). */
  tenorApiKey?: string;
}

export interface SecuritySettings {
  /** Additional admin emails (in addition to the code allowlist bootstrap). */
  adminEmails: string[];
}

/**
 * Feature flags for enabling/disabling functionality
 */
export interface FeatureFlags {
  stripeEnabled: boolean;
  denefitsEnabled: boolean;
  inAppMessaging: boolean;
  publicChat: boolean;
  /** Enable server-side AI gateway calls (LLM routing). */
  aiGateway: boolean;
  /** Show an AI chat widget inside partner portal/dashboard. */
  portalChat: boolean;
  /** Enable document intelligence (OCR/classification/extraction pipelines). */
  docIntel: boolean;
  /** Enable in-app physical letter mailing integration (US-only v1). */
  letterMailing: boolean;
  /** Enable admin partner import tools. */
  partnerImport: boolean;
  /** Enable invite delivery (email/SMS) via Edge Functions. */
  inviteDelivery: boolean;
  /** Enable general outbound comms delivery (email/SMS) via Edge Functions. */
  commsDelivery: boolean;
  /** Enable Lead Intelligence Agent (prospecting/search/enrichment). */
  leadIntel: boolean;
  /** Enable CRM pipelines (prospects + lead ops). */
  crm: boolean;
  auMarketplace: boolean;
  businessPortal: boolean;
  /** Enable Courses module (course builder + partner course player). */
  courses: boolean;
  /** Enable Video Studio helpers (script/storyboard generation). */
  videoStudio: boolean;
  wealthPaths: boolean;
  apiAccess: boolean;
}

/**
 * Pricing controls for public storefront + marketplace.
 * These are non-sensitive and safe to store client-side in demo mode.
 */
export interface PricingControls {
  /**
   * Global markup applied to AU tradeline marketplace prices.
   * Example: 15 means +15%.
   */
  tradelineAuMarkupPct: number;
  /**
   * Global discount applied to AU tradeline marketplace prices.
   * Example: 10 means -10%. Discount is applied after markup.
   */
  tradelineAuDiscountPct: number;
  /**
   * Package copy/scope overrides (non-sensitive) for public pricing + checkout displays.
   * Use this to make scope explicit without redeploying code.
   */
  packageOverrides?: Record<
    string,
    {
      badge?: string;
      badgeByRail?: Partial<Record<'stripe' | 'in_house', string>>;
      scopeBullets?: string[];
      scopeBulletsByRail?: Partial<Record<'stripe' | 'in_house', string[]>>;
    }
  >;
}

export type WorkStageDefinition = {
  /** Stable ID used in data (ex: "intake"). */
  id: string;
  /** Display label shown on boards (ex: "Intake"). */
  label: string;
  /** Optional stage accent color (hex, rgb, etc.). */
  color?: string;
  /** Optional helper text shown in UI. */
  hint?: string;
  /** When true, the stage is hidden from boards. */
  disabled?: boolean;
};

export interface WorkboardSettings {
  projectStages: WorkStageDefinition[];
  taskStages: WorkStageDefinition[];
}

/**
 * Webhook configuration for external services
 */
export interface WebhookConfig {
  id: string;
  name: string;
  provider: 'stripe' | 'denefits' | 'custom';
  endpointUrl: string;
  secret?: string;
  events: string[];
  status: 'active' | 'inactive' | 'error';
  lastPingAt?: string;
  lastErrorAt?: string;
  lastError?: string;
}

/**
 * Complete platform settings
 */
export interface PlatformSettings {
  site: SiteSettings;
  comms: CommsSettings;
  chat: ChatSettings;
  security: SecuritySettings;
  stripe: StripeSettings;
  denefits: DenefitsSettings;
  noraCapital: NoraCapitalSettings;
  denefitsContracts: DenefitsContractMapping[];
  features: FeatureFlags;
  pricing: PricingControls;
  workboard: WorkboardSettings;
  webhooks: WebhookConfig[];
  updatedAt: string;
  updatedBy?: string;
}

/**
 * Default settings
 */
export const DEFAULT_SETTINGS: PlatformSettings = {
  site: {
    brandName: 'Finely Cred',
    supportEmail: 'partnersupport@finelycred.com',
    socialLinks: {},
  },
  comms: {
    appBaseUrl: undefined,
    sendgridFromEmail: undefined,
    sendgridFromName: undefined,
    twilioFromPhone: undefined,
  },
  chat: {
    tenorApiKey: undefined,
  },
  security: {
    adminEmails: [],
  },
  stripe: {
    status: 'not_configured',
    testMode: true,
  },
  denefits: {
    status: 'not_configured',
    testMode: true,
  },
  noraCapital: {
    status: 'not_configured',
    testMode: true,
  },
  denefitsContracts: [],
  features: {
    stripeEnabled: false,
    denefitsEnabled: false,
    inAppMessaging: true,
    publicChat: true,
    aiGateway: false,
    portalChat: false,
    docIntel: false,
    letterMailing: false,
    partnerImport: false,
    inviteDelivery: false,
    commsDelivery: false,
    leadIntel: false,
    crm: true,
    auMarketplace: true,
    businessPortal: true,
    courses: false,
    videoStudio: false,
    wealthPaths: false,
    apiAccess: false,
  },
  pricing: {
    tradelineAuMarkupPct: 0,
    tradelineAuDiscountPct: 0,
    packageOverrides: {},
  },
  workboard: {
    projectStages: [
      { id: 'intake', label: 'Intake', color: '#fbbf24', hint: 'Goals, consents, profile.' },
      { id: 'reports', label: 'Reports', color: '#38bdf8', hint: 'Upload and parse credit reports.' },
      { id: 'evidence', label: 'Evidence', color: '#a78bfa', hint: 'Documents Vault and exhibits.' },
      { id: 'disputes', label: 'Disputes', color: '#fb923c', hint: 'Letters, rounds, follow-ups.' },
      { id: 'debt', label: 'Debt', color: '#ef4444', hint: 'Validation/summons workflow.' },
      { id: 'identity', label: 'Identity', color: '#22c55e', hint: 'Freeze, fraud alert, block items.' },
      { id: 'funding', label: 'Funding', color: '#06b6d4', hint: 'Readiness + lender requirements.' },
      { id: 'complete', label: 'Complete', color: '#94a3b8', hint: 'Archive + outcomes.' },
    ],
    taskStages: [
      { id: 'intake', label: 'Intake', color: '#fbbf24', hint: 'Goals, consents, profile.' },
      { id: 'reports', label: 'Reports', color: '#38bdf8', hint: 'Upload and parse credit reports.' },
      { id: 'evidence', label: 'Evidence', color: '#a78bfa', hint: 'Documents Vault and exhibits.' },
      { id: 'disputes', label: 'Disputes', color: '#fb923c', hint: 'Letters, rounds, follow-ups.' },
      { id: 'debt', label: 'Debt', color: '#ef4444', hint: 'Validation/summons workflow.' },
      { id: 'identity', label: 'Identity', color: '#22c55e', hint: 'Freeze, fraud alert, block items.' },
      { id: 'funding', label: 'Funding', color: '#06b6d4', hint: 'Readiness + lender requirements.' },
      { id: 'complete', label: 'Complete', color: '#94a3b8', hint: 'Archive + outcomes.' },
    ],
  },
  webhooks: [],
  updatedAt: new Date().toISOString(),
};

export function nowIso() {
  return new Date().toISOString();
}
