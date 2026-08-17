/**
 * Setup readiness for $0 / official API channels — GBP, YouTube, Meta.
 * OAuth wiring is configured in external consoles; this surfaces status in-app.
 */
import { isSupabaseConfigured } from './supabaseClient';
import { isMetaIntegrationLive, loadMetaIntegrationConfig } from '../data/metaIntegrationRepo';
import { isFeatureEnabled } from '../data/settingsRepo';

export type ChannelSetupCheck = {
  id: string;
  label: string;
  ok: boolean;
  hint: string;
  href?: string;
};

export function getGoogleBusinessProfileChecks(): ChannelSetupCheck[] {
  const hasPlaceId = Boolean(String(import.meta.env.VITE_GOOGLE_BUSINESS_PLACE_ID ?? '').trim());
  return [
    {
      id: 'gbp_claimed',
      label: 'Google Business Profile claimed',
      ok: hasPlaceId,
      hint: hasPlaceId
        ? 'Place ID configured — ready for manual posts until API OAuth is added.'
        : 'Claim your profile at business.google.com — highest $0 local lead channel.',
      href: 'https://business.google.com',
    },
    {
      id: 'gbp_api',
      label: 'GBP API (optional auto-post)',
      ok: false,
      hint: 'Coming soon — OAuth scaffold. Post manually from GBP app for $0 today.',
    },
  ];
}

export function getYouTubeChannelChecks(): ChannelSetupCheck[] {
  const channelId = String(import.meta.env.VITE_YOUTUBE_CHANNEL_ID ?? '').trim();
  return [
    {
      id: 'yt_channel',
      label: 'YouTube channel linked',
      ok: Boolean(channelId),
      hint: channelId
        ? `Channel ${channelId} — upload manually or via Studio until Data API OAuth ships.`
        : 'Set VITE_YOUTUBE_CHANNEL_ID in .env.local after you create a channel.',
      href: 'https://studio.youtube.com',
    },
    {
      id: 'yt_shorts',
      label: 'Shorts SEO ready',
      ok: true,
      hint: 'Jordan/Miriam draft in Content Studio — say your keyword in the first 5 seconds.',
      href: '/admin/marketing?tab=content',
    },
    {
      id: 'yt_api',
      label: 'YouTube Data API auto-upload',
      ok: false,
      hint: 'Scaffold — enable in Google Cloud when ready (free quota tier).',
    },
  ];
}

export function getMetaPublishChecks(): ChannelSetupCheck[] {
  const meta = loadMetaIntegrationConfig();
  const live = isMetaIntegrationLive();
  return [
    {
      id: 'meta_oauth',
      label: 'Meta OAuth connected',
      ok: meta.status === 'connected' || live,
      hint: live ? 'Facebook/Instagram can auto-publish scheduled posts.' : 'Connect in Social Hub settings.',
      href: '/admin/social-hub?tab=settings',
    },
    {
      id: 'meta_webhook',
      label: 'Meta webhook verified',
      ok: live,
      hint: live ? 'Inbound DMs flow to Social Hub inbox.' : 'Verify webhook after OAuth.',
      href: '/admin/social-hub?tab=settings',
    },
    {
      id: 'supabase',
      label: 'Supabase (meta-oauth edge)',
      ok: isSupabaseConfigured,
      hint: isSupabaseConfigured ? 'Edge functions available.' : 'Required for Meta publish bridge.',
      href: '/admin/access',
    },
  ];
}

export function isAnyZeroCostChannelLive(): boolean {
  return isMetaIntegrationLive() || isFeatureEnabled('commsDelivery');
}
