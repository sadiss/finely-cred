/**
 * Setup readiness for $0 / official API channels — GBP, YouTube, Meta.
 * OAuth wiring is configured in external consoles; this surfaces status in-app.
 */
import { isSupabaseConfigured } from './supabaseClient';
import { isMetaIntegrationLive, loadMetaIntegrationConfig } from '../data/metaIntegrationRepo';
import { isBlueskyIntegrationLive, loadBlueskyIntegrationConfig } from '../data/blueskyIntegrationRepo';
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
      href: '/admin/social-hub',
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

export function getBlueskyPublishChecks(): ChannelSetupCheck[] {
  const cfg = loadBlueskyIntegrationConfig();
  const live = isBlueskyIntegrationLive();
  return [
    {
      id: 'bluesky',
      label: 'Bluesky connected',
      ok: live,
      hint: live
        ? `Posting as ${cfg.handle}. Free AT Protocol — no ad spend.`
        : 'Add handle + app password in Social Hub settings, then test the session.',
      href: '/admin/social-hub?tab=settings',
    },
  ];
}

export function isAnyZeroCostChannelLive(): boolean {
  return isMetaIntegrationLive() || isBlueskyIntegrationLive() || isFeatureEnabled('commsDelivery');
}

export type MarketingGoLiveLamp = ChannelSetupCheck & {
  tone: 'ok' | 'warn' | 'blocked';
};

export function getEmailDeliveryLamp(): MarketingGoLiveLamp {
  const commsOn = isFeatureEnabled('commsDelivery');
  const supabaseOk = isSupabaseConfigured;
  if (!supabaseOk) {
    return {
      id: 'email',
      label: 'Email',
      ok: false,
      tone: 'blocked',
      hint: 'Supabase is not configured — nothing can leave the building.',
      href: '/admin/access',
    };
  }
  if (!commsOn) {
    return {
      id: 'email',
      label: 'Email',
      ok: false,
      tone: 'warn',
      hint: 'Off. Turn on only after SMTP or SendGrid secrets are on the send-email edge function.',
      href: '/admin/settings?tab=features',
    };
  }
  return {
    id: 'email',
    label: 'Email',
    ok: true,
    tone: 'ok',
    hint: 'commsDelivery is on. Confirm SendGrid/SMTP secrets before expecting live mail.',
    href: '/admin/settings?tab=features',
  };
}

export function getSearchIndexLamps(): MarketingGoLiveLamp[] {
  const indexNowKey = Boolean(String(import.meta.env.VITE_INDEXNOW_KEY ?? '').trim());
  return [
    {
      id: 'indexnow',
      label: 'IndexNow',
      ok: indexNowKey,
      tone: indexNowKey ? 'ok' : 'warn',
      hint: indexNowKey
        ? 'Client key present — still set INDEXNOW_KEY on deploy for the GitHub ping.'
        : 'Set INDEXNOW_KEY as a repo secret, then run npm run syndication:publish.',
      href: '/admin/lead-acquisition',
    },
    {
      id: 'gsc',
      label: 'Search Console',
      ok: false,
      tone: 'warn',
      hint: 'Submit public/sitemap.xml once in Google Search Console. Cannot detect from the app.',
      href: 'https://search.google.com/search-console',
    },
  ];
}

export function lampFromCronHeartbeat(heartbeat: {
  dryRun?: boolean;
  updatedAt?: string;
  at?: string;
} | null): MarketingGoLiveLamp {
  if (!isSupabaseConfigured) {
    return {
      id: 'cron',
      label: 'Platform cron',
      ok: false,
      tone: 'blocked',
      hint: 'No heartbeat — Supabase is not configured.',
      href: '/admin/monitoring',
    };
  }
  if (!heartbeat) {
    return {
      id: 'cron',
      label: 'Platform cron',
      ok: false,
      tone: 'blocked',
      hint: 'No tick yet. Schedule platform-cron with dryRun:false per docs/PLATFORM_CRON.md.',
      href: '/admin/monitoring',
    };
  }
  const at = heartbeat.updatedAt || heartbeat.at;
  const ageMs = at ? Date.now() - new Date(at).getTime() : Number.POSITIVE_INFINITY;
  const stale = !Number.isFinite(ageMs) || ageMs > 3 * 60 * 60 * 1000;
  if (heartbeat.dryRun) {
    return {
      id: 'cron',
      label: 'Platform cron',
      ok: false,
      tone: 'warn',
      hint: stale
        ? 'Last tick was a dry run and is stale. Schedule live ticks (dryRun:false).'
        : 'Last tick was a dry run. Nurture and social will not send until live.',
      href: '/admin/monitoring',
    };
  }
  if (stale) {
    return {
      id: 'cron',
      label: 'Platform cron',
      ok: false,
      tone: 'warn',
      hint: 'Last live tick is older than 3 hours. Check pg_cron / the scheduler.',
      href: '/admin/monitoring',
    };
  }
  return {
    id: 'cron',
    label: 'Platform cron',
    ok: true,
    tone: 'ok',
    hint: `Live tick ${at ? new Date(at).toLocaleString() : 'recently'}.`,
    href: '/admin/monitoring',
  };
}

export function getMarketingStorefrontLamps(): MarketingGoLiveLamp[] {
  const gbp = getGoogleBusinessProfileChecks()[0];
  const yt = getYouTubeChannelChecks()[0];
  const meta = getMetaPublishChecks()[0];
  const bluesky = getBlueskyPublishChecks()[0];
  const asLamp = (c: ChannelSetupCheck): MarketingGoLiveLamp => ({
    ...c,
    tone: c.ok ? 'ok' : 'warn',
  });
  return [asLamp(gbp), asLamp(yt), asLamp(meta), asLamp(bluesky)];
}
