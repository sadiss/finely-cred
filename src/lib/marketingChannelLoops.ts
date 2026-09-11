/**
 * Independent marketing channel loops — each owns its on/off, last run, and honesty.
 * Today shows exceptions; this registry is the machine map on Marketing home.
 */
import { loadJson, saveJson } from '../data/localJsonStore';
import { isFeatureEnabled, updateFeatureFlags } from '../data/settingsRepo';
import { isBlueskyIntegrationLive } from '../data/blueskyIntegrationRepo';
import { isMetaIntegrationLive } from '../data/metaIntegrationRepo';
import { enrollAbandonedChatLeads } from './abandonedChatNurture';
import { loadSocialAutopilotConfig, saveSocialAutopilotConfig } from './socialAutopilotEngine';
import { writeTomorrowGrowthPack } from './tomorrowGrowthPack';
import { getEmailDeliveryLamp, getSearchIndexLamps } from './zeroCostChannelsOps';

const STORE_KEY = 'finely.marketingChannelLoops.v1';
const SOCIAL_REVIEW_MS = 14 * 24 * 60 * 60 * 1000;

export type ChannelLoopId =
  | 'email_nurture'
  | 'overnight_cron'
  | 'daily_pack'
  | 'meta_publish'
  | 'bluesky_publish'
  | 'abandoned_chat'
  | 'search_ping';

export type ChannelLoopOwner = 'you' | 'machine';
export type ChannelLoopCapability = 'live' | 'paste_pack' | 'needs_account';

export type MarketingChannelLoop = {
  id: ChannelLoopId;
  label: string;
  detail: string;
  owner: ChannelLoopOwner;
  enabled: boolean;
  canToggle: boolean;
  lastRunAt?: string;
  nextRunLabel: string;
  capability: ChannelLoopCapability;
  href: string;
  accent: 'emerald' | 'violet' | 'sky' | 'rose';
  shape: 'rail' | 'cut' | 'band' | 'ticket';
};

type LoopStore = {
  dailyPack: boolean;
  abandonedChat: boolean;
  socialReviewUntil?: string;
  lastRun: Partial<Record<ChannelLoopId, string>>;
};

const DEFAULT_STORE: LoopStore = {
  dailyPack: false,
  abandonedChat: false,
  lastRun: {},
};

function loadStore(): LoopStore {
  return loadJson(STORE_KEY, DEFAULT_STORE, 1);
}

function saveStore(store: LoopStore) {
  saveJson(STORE_KEY, store, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

function stamp(store: LoopStore, id: ChannelLoopId) {
  store.lastRun[id] = new Date().toISOString();
}

function formatWhen(iso?: string): string {
  if (!iso) return 'Not yet';
  const elapsed = Date.now() - Date.parse(iso);
  if (!Number.isFinite(elapsed) || elapsed < 60_000) return 'just now';
  const hours = Math.floor(elapsed / 3_600_000);
  if (hours < 1) return `${Math.max(1, Math.floor(elapsed / 60_000))} min ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function socialStillInReviewWindow(): boolean {
  const store = loadStore();
  if (!store.socialReviewUntil) return true;
  return Date.now() < Date.parse(store.socialReviewUntil);
}

export function ensureSocialReviewWindow(): string {
  const store = loadStore();
  if (!store.socialReviewUntil) {
    store.socialReviewUntil = new Date(Date.now() + SOCIAL_REVIEW_MS).toISOString();
    saveStore(store);
  }
  return store.socialReviewUntil;
}

export function listMarketingChannelLoops(): MarketingChannelLoop[] {
  const store = loadStore();
  const email = getEmailDeliveryLamp();
  const cronHint = 'Owner schedules platform-cron live. This lamp does not flip the server.';
  const social = loadSocialAutopilotConfig();
  const review = socialStillInReviewWindow();
  const indexNow = getSearchIndexLamps()[0];

  return [
    {
      id: 'email_nurture',
      label: 'Email nurture',
      detail: email.hint,
      owner: email.ok ? 'machine' : 'you',
      enabled: isFeatureEnabled('commsDelivery'),
      canToggle: true,
      lastRunAt: store.lastRun.email_nurture,
      nextRunLabel: email.ok ? 'Due steps send on cron' : 'You turn SMTP on first',
      capability: email.ok ? 'live' : 'needs_account',
      href: '/admin/settings?tab=features',
      accent: 'emerald',
      shape: 'rail',
    },
    {
      id: 'overnight_cron',
      label: 'Overnight cron',
      detail: cronHint,
      owner: 'you',
      enabled: false,
      canToggle: false,
      lastRunAt: store.lastRun.overnight_cron,
      nextRunLabel: 'Set dryRun false on the scheduler',
      capability: 'needs_account',
      href: '/admin/monitoring',
      accent: 'violet',
      shape: 'cut',
    },
    {
      id: 'daily_pack',
      label: 'Daily pack',
      detail: review
        ? 'Writes captions and queues Social Hub as review for 14 days.'
        : 'Writes captions and queues connected channels.',
      owner: store.dailyPack ? 'machine' : 'you',
      enabled: store.dailyPack,
      canToggle: true,
      lastRunAt: store.lastRun.daily_pack,
      nextRunLabel: store.dailyPack ? 'Next weekday morning' : 'Off — you write the pack',
      capability: 'live',
      href: '/admin/social-hub',
      accent: 'sky',
      shape: 'band',
    },
    {
      id: 'meta_publish',
      label: 'Meta',
      detail: isMetaIntegrationLive()
        ? review
          ? 'Connected. First 14 days stay approve-then-send.'
          : 'Connected. Scheduled posts can publish.'
        : 'Connect Facebook / Instagram in Social Hub.',
      owner: social.autoPublish && isMetaIntegrationLive() && !review ? 'machine' : 'you',
      enabled: social.autoPublish && isMetaIntegrationLive(),
      canToggle: isMetaIntegrationLive(),
      lastRunAt: store.lastRun.meta_publish,
      nextRunLabel: isMetaIntegrationLive() ? (review ? 'Review queue' : 'Queued slots') : 'Needs Meta',
      capability: isMetaIntegrationLive() ? 'live' : 'needs_account',
      href: '/admin/social-hub?tab=settings',
      accent: 'rose',
      shape: 'ticket',
    },
    {
      id: 'bluesky_publish',
      label: 'Bluesky',
      detail: isBlueskyIntegrationLive()
        ? review
          ? 'Connected. First 14 days stay approve-then-send.'
          : 'Connected. Free AT Protocol posts can send.'
        : 'Add handle + app password in Social Hub.',
      owner: social.autoPublish && isBlueskyIntegrationLive() && !review ? 'machine' : 'you',
      enabled: social.autoPublish && isBlueskyIntegrationLive(),
      canToggle: isBlueskyIntegrationLive(),
      lastRunAt: store.lastRun.bluesky_publish,
      nextRunLabel: isBlueskyIntegrationLive() ? (review ? 'Review queue' : 'Queued slots') : 'Needs Bluesky',
      capability: isBlueskyIntegrationLive() ? 'live' : 'needs_account',
      href: '/admin/social-hub?tab=settings',
      accent: 'emerald',
      shape: 'rail',
    },
    {
      id: 'abandoned_chat',
      label: 'Abandoned chat',
      detail: 'Guests who left an email and did not book get the follow-up sequence.',
      owner: store.abandonedChat ? 'machine' : 'you',
      enabled: store.abandonedChat,
      canToggle: true,
      lastRunAt: store.lastRun.abandoned_chat,
      nextRunLabel: store.abandonedChat ? 'Enrolls after 2 quiet hours' : 'Off',
      capability: isFeatureEnabled('commsDelivery') ? 'live' : 'needs_account',
      href: '/admin/comms',
      accent: 'violet',
      shape: 'cut',
    },
    {
      id: 'search_ping',
      label: 'Search ping',
      detail: indexNow?.hint ?? 'IndexNow key lives in deploy secrets.',
      owner: 'you',
      enabled: Boolean(indexNow?.ok),
      canToggle: false,
      lastRunAt: store.lastRun.search_ping,
      nextRunLabel: indexNow?.ok ? 'On publish' : 'Set INDEXNOW_KEY',
      capability: indexNow?.ok ? 'live' : 'paste_pack',
      href: '/admin/lead-acquisition',
      accent: 'sky',
      shape: 'band',
    },
  ];
}

export async function setMarketingChannelLoop(id: ChannelLoopId, enabled: boolean): Promise<string> {
  const store = loadStore();
  const social = loadSocialAutopilotConfig();

  if (id === 'email_nurture') {
    updateFeatureFlags({ commsDelivery: enabled });
    stamp(store, id);
    saveStore(store);
    return enabled ? 'Email nurture is on. Confirm SMTP or SendGrid on the edge.' : 'Email nurture is off.';
  }

  if (id === 'daily_pack') {
    store.dailyPack = enabled;
    if (enabled) {
      ensureSocialReviewWindow();
      const pack = await writeTomorrowGrowthPack();
      stamp(store, id);
      saveStore(store);
      return `${pack.weekday} pack queued · ${pack.queuedPosts} post for review.`;
    }
    saveStore(store);
    return 'Daily pack is off.';
  }

  if (id === 'meta_publish' || id === 'bluesky_publish') {
    ensureSocialReviewWindow();
    const review = socialStillInReviewWindow();
    saveSocialAutopilotConfig({
      ...social,
      enabled: enabled || social.enabled,
      autoPublish: enabled && !review,
      dryRun: !enabled || review,
    });
    stamp(store, id);
    saveStore(store);
    if (!enabled) return `${id === 'meta_publish' ? 'Meta' : 'Bluesky'} will not auto-send.`;
    return review
      ? 'Connected. Posts stay in review for the first 14 days.'
      : 'Connected. Scheduled posts can publish.';
  }

  if (id === 'abandoned_chat') {
    store.abandonedChat = enabled;
    if (enabled) {
      const n = enrollAbandonedChatLeads();
      stamp(store, id);
      saveStore(store);
      return n ? `Enrolled ${n} abandoned chat guest${n === 1 ? '' : 's'}.` : 'Abandoned chat is on. No new guests waiting.';
    }
    saveStore(store);
    return 'Abandoned chat is off.';
  }

  return 'This loop is set outside the app (cron, IndexNow, or an account).';
}

export function formatLoopLastRun(iso?: string): string {
  return formatWhen(iso);
}

export async function runEnabledDailyPackIfDue(): Promise<void> {
  const store = loadStore();
  if (!store.dailyPack) return;
  const last = store.lastRun.daily_pack;
  if (last && Date.now() - Date.parse(last) < 20 * 60 * 60 * 1000) return;
  await writeTomorrowGrowthPack();
  stamp(store, 'daily_pack');
  saveStore(store);
}
