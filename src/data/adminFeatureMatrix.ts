import type { FeatureFlags } from '../domain/settings';

export type AdminFeatureMatrixRow = {
  flag: keyof FeatureFlags;
  label: string;
  effect: string;
  secrets: string;
};

/** Launch reference: flag · user-visible effect · required secrets (Admin Settings → Features). */
export const ADMIN_FEATURE_MATRIX: AdminFeatureMatrixRow[] = [
  { flag: 'stripeEnabled', label: 'Stripe Payments', effect: 'Card checkout + billing webhooks', secrets: 'VITE_STRIPE_PUBLISHABLE_KEY, STRIPE_SECRET_KEY (edge)' },
  { flag: 'denefitsEnabled', label: 'In‑House Financing', effect: 'Denefit contract embed on checkout', secrets: 'Denefit contract URLs in Admin Settings' },
  { flag: 'inAppMessaging', label: 'In-App Messaging', effect: 'Team chat tab in Communication Hub', secrets: 'Supabase Realtime (optional)' },
  { flag: 'publicChat', label: 'Public Chat Widget', effect: 'Marketing-site chat launcher', secrets: 'ai-gateway edge function' },
  { flag: 'aiGateway', label: 'AI Gateway', effect: 'Server-side LLM calls across admin + portal', secrets: 'OPENAI_API_KEY, EDGE_ADMIN_EMAILS (edge)' },
  { flag: 'portalChat', label: 'Portal Chat Widget', effect: 'Floating Communication Hub on portal pages', secrets: 'ai-gateway edge function' },
  { flag: 'docIntel', label: 'Document Intelligence', effect: 'OCR / classification pipelines', secrets: 'ai-gateway + storage buckets' },
  { flag: 'letterMailing', label: 'Letter Mailing', effect: 'Physical mail send in letter studio', secrets: 'LOB / mail provider keys (edge)' },
  { flag: 'partnerImport', label: 'Partner Import', effect: 'Legacy JSON/SQL import admin page', secrets: 'Supabase service role (edge)' },
  { flag: 'inviteDelivery', label: 'Invite Delivery', effect: 'Email/SMS claim links after import', secrets: 'SENDGRID_API_KEY, TWILIO_* (edge)' },
  { flag: 'commsDelivery', label: 'Comms Delivery', effect: 'Outbound email/SMS from Comms Studio', secrets: 'SENDGRID_API_KEY, TWILIO_* (edge)' },
  { flag: 'automationAutopilot', label: 'Automation Autopilot', effect: 'Hands-free dispute drafts + staff tasks on platform events', secrets: 'automation-runner edge + ai-gateway' },
  { flag: 'leadIntel', label: 'Lead Intelligence', effect: 'Prospecting + enrichment agent', secrets: 'ai-gateway, optional search APIs' },
  { flag: 'crm', label: 'CRM Pipelines', effect: 'Admin CRM workspace + copilot', secrets: 'Supabase tables + ai-gateway' },
  { flag: 'auMarketplace', label: 'AU Marketplace', effect: 'Tradeline browse + inventory', secrets: 'Catalog data (local or Supabase)' },
  { flag: 'businessPortal', label: 'Business Portal', effect: 'Business credit portal modules', secrets: 'Entitlements via billing' },
  { flag: 'courses', label: 'Courses', effect: 'Course builder + partner player', secrets: 'Storage buckets' },
  { flag: 'videoStudio', label: 'Video Studio', effect: 'AI media studio + storyboards', secrets: 'ai-gateway, preview providers (Kling/Runway)' },
  { flag: 'wealthPaths', label: 'Wealth Paths', effect: 'Wealth journey lanes on dashboard', secrets: 'None (content flags)' },
  { flag: 'apiAccess', label: 'API Access', effect: 'REST integrations (Phase 2)', secrets: 'API keys (edge)' },
  { flag: 'lightThemePublic', label: 'Light Theme (public)', effect: 'Show Light in theme toggles for all users', secrets: 'None (CSS theme system)' },
];
