/** Canonical shipped-feature map — drives KB sync + owners guide live patches (Phases 34/46). */
import type { KnowledgeCategory } from '../knowledge/finelyKnowledgeBase';

export type PlatformFeature = {
  id: string;
  phase: number;
  title: string;
  summary: string;
  route?: string;
  kbCategory: KnowledgeCategory;
  tags: string[];
};

export const PLATFORM_FEATURE_MAP: PlatformFeature[] = [
  {
    id: 'integration_hub',
    phase: 42,
    title: 'Integration Hub',
    summary: 'Outbound webhooks, inbound Zapier/Make routes, and partner API keys at /admin/integrations.',
    route: '/admin/integrations',
    kbCategory: 'portal',
    tags: ['webhook', 'zapier', 'api key', 'integration'],
  },
  {
    id: 'notifications_center',
    phase: 33,
    title: 'Notifications center',
    summary: 'In-app bell plus full history at /admin/notifications and /portal/notifications with digest prefs.',
    route: '/admin/notifications',
    kbCategory: 'portal',
    tags: ['notifications', 'bell', 'alerts'],
  },
  {
    id: 'context_help',
    phase: 46,
    title: 'Context help',
    summary: 'Floating ? on admin and portal screens links to the owners guide and knowledge base for the current route.',
    route: '/owners-guide',
    kbCategory: 'onboarding',
    tags: ['help', 'guide', 'owners guide'],
  },
  {
    id: 'funnel_ab',
    phase: 36,
    title: 'Funnel A/B experiments',
    summary: 'Toggle headlines and offers; track conversion per variant at /admin/funnel-experiments.',
    route: '/admin/funnel-experiments',
    kbCategory: 'onboarding',
    tags: ['ab test', 'funnel', 'conversion'],
  },
  {
    id: 'referral_growth',
    phase: 37,
    title: 'Referral & QR growth',
    summary: 'Short /g/ links, QR attribution, and referral rewards on admin dashboard.',
    route: '/g/your-code',
    kbCategory: 'affiliate',
    tags: ['referral', 'qr', 'growth'],
  },
  {
    id: 'support_inbox',
    phase: 32,
    title: 'Unified support inbox',
    summary: 'Meta + portal threads in one admin inbox with SLA timers at /admin/support.',
    route: '/admin/support',
    kbCategory: 'portal',
    tags: ['support', 'meta', 'inbox', 'sla'],
  },
  {
    id: 'credit_lanes',
    phase: 21,
    title: 'Credit lanes panel',
    summary: 'Debt, funding, and tradeline lanes on partner dashboard with next-step tasks.',
    route: '/portal/dashboard',
    kbCategory: 'funding',
    tags: ['debt', 'funding', 'tradeline', 'lanes'],
  },
  {
    id: 'document_vault_id',
    phase: 20,
    title: 'Document vault ID scan',
    summary: 'Identity document gate before mail-letter tasks; scan panel on /portal/documents.',
    route: '/portal/documents',
    kbCategory: 'identity',
    tags: ['id', 'vault', 'identity', 'documents'],
  },
  {
    id: 'bookstore_bundles',
    phase: 16,
    title: 'Bookstore bundles',
    summary: 'Bundle purchase flow with chapter previews at /bookstore and portal library listen mode.',
    route: '/bookstore',
    kbCategory: 'pricing',
    tags: ['bookstore', 'bundle', 'ebook', 'audio'],
  },
  {
    id: 'billing_subscriptions',
    phase: 30,
    title: 'Billing & subscriptions',
    summary: 'DIY trial, DFY plans, dunning nudges, and win-back nurture via /portal/billing.',
    route: '/portal/billing',
    kbCategory: 'pricing',
    tags: ['billing', 'trial', 'dunning', 'subscription'],
  },
  {
    id: 'voice_studio',
    phase: 4,
    title: 'Neural Voice Studio',
    summary: 'Cartesia-rendered narration for guides, ebooks, and courses via FinelyAudioPlayer.',
    kbCategory: 'portal',
    tags: ['voice', 'audio', 'cartesia', 'listen'],
  },
  {
    id: 'automation_studio',
    phase: 10,
    title: 'Automation Studio',
    summary: 'Event recipes, server runner hooks, and platform cron at /admin/automations.',
    route: '/admin/automations',
    kbCategory: 'portal',
    tags: ['automation', 'nurture', 'workflow'],
  },
];
