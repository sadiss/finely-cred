import { isSupabaseConfigured } from './supabaseClient';
import { isFeatureEnabled, getCommsSettings } from '../data/settingsRepo';
import { loadMetaIntegrationConfig, isMetaIntegrationLive } from '../data/metaIntegrationRepo';
import { listCommsSends, listCommsTemplates } from '../data/commsRepo';
import { listEmailWebhookEvents } from '../data/commsWebhookRepo';
import { listScheduledPosts } from '../data/socialHubRepo';
import { loadStaffRoster } from '../data/staffRoster';
import { buildMetaOAuthRedirectUris } from './metaOAuthUrls';
import { loadCommsEmailProvidersConfig } from '../data/commsEmailProviderRepo';

export type IntegrationHealthItem = {
  id: string;
  label: string;
  status: 'ok' | 'warn' | 'error' | 'off';
  detail: string;
  href?: string;
};

export function buildIntegrationGoLiveHealth(): IntegrationHealthItem[] {
  const comms = getCommsSettings();
  const meta = loadMetaIntegrationConfig();
  const sends = listCommsSends(200);
  const failedSends = sends.filter((s) => s.status === 'error').length;
  const webhooks = listEmailWebhookEvents(20);
  const socialPosts = listScheduledPosts();
  const staffCount = loadStaffRoster().length;

  return [
    {
      id: 'supabase',
      label: 'Supabase',
      status: isSupabaseConfigured ? 'ok' : 'error',
      detail: isSupabaseConfigured ? 'Client configured — edge functions available' : 'Not configured — comms delivery disabled',
      href: '/admin/access',
    },
    {
      id: 'comms_delivery',
      label: 'Email / SMS delivery',
      status: isFeatureEnabled('commsDelivery') ? (comms.sendgridFromEmail ? 'ok' : 'warn') : 'off',
      detail: isFeatureEnabled('commsDelivery')
        ? comms.sendgridFromEmail
          ? `From ${comms.sendgridFromEmail}`
          : 'Feature on — set from-address in Settings'
        : 'Disabled in feature flags',
      href: '/admin/settings',
    },
    {
      id: 'comms_logs',
      label: 'Comms send log',
      status: sends.length ? (failedSends ? 'warn' : 'ok') : 'warn',
      detail: `${sends.length} logged · ${listCommsTemplates().length} templates · ${failedSends} failed`,
      href: '/admin/comms?room=inbox',
    },
    {
      id: 'email_webhooks',
      label: 'Email webhooks',
      status: webhooks.length ? 'ok' : 'warn',
      detail: webhooks.length
        ? `${webhooks.length} recent events (delivered/bounce/open)`
        : 'No webhook events yet — wire Resend/SendGrid to /functions/v1/email-webhook',
      href: '/admin/integrations',
    },
    {
      id: 'email_providers',
      label: 'Email providers (OAuth)',
      status: (() => {
        const ep = loadCommsEmailProvidersConfig();
        const connected = Object.values(ep.providers).filter((p) => p.status === 'connected').length;
        return connected >= 2 ? 'ok' : connected === 1 ? 'warn' : 'off';
      })(),
      detail: (() => {
        const ep = loadCommsEmailProvidersConfig();
        const names = Object.values(ep.providers)
          .filter((p) => p.status === 'connected')
          .map((p) => p.id)
          .join(', ');
        const auto = ep.disputeRoundCommsAuto ? 'dispute auto on' : 'dispute auto off';
        const bk = ep.bankruptcyLaneCommsAuto ? 'bankruptcy auto on' : 'bankruptcy auto off';
        const live = ep.disputeRoundCommsLive ? 'live' : 'dry-run';
        return `${names || 'finely_native only'} · ${auto} · ${bk} · ${live}`;
      })(),
      href: '/admin/comms?room=settings',
    },
    {
      id: 'meta_oauth',
      label: 'Meta OAuth',
      status: isMetaIntegrationLive() ? 'ok' : meta.status === 'connected' ? 'warn' : 'off',
      detail: isMetaIntegrationLive()
        ? `${meta.connectedPages.length} page(s) · webhook verified`
        : meta.status === 'connected'
          ? 'Connected — webhook not verified yet'
          : 'Not connected',
      href: '/admin/social-hub?tab=settings',
    },
    {
      id: 'meta_redirects',
      label: 'Meta redirect URIs',
      status: meta.appId && meta.appId !== 'YOUR_META_APP_ID' ? 'ok' : 'warn',
      detail: `${buildMetaOAuthRedirectUris(meta).length} URI(s) to register in Meta App`,
      href: '/admin/social-hub?tab=settings',
    },
    {
      id: 'social_sync',
      label: 'Social Hub queue',
      status: socialPosts.length ? 'ok' : 'warn',
      detail: `${socialPosts.length} scheduled post(s) · Supabase sync on boot`,
      href: '/admin/social-hub',
    },
    {
      id: 'staff_roster',
      label: 'Staff roster sync',
      status: staffCount >= 40 ? 'ok' : 'warn',
      detail: `${staffCount} staff on roster · portraits + Supabase mirror`,
      href: '/admin/staff',
    },
  ];
}
