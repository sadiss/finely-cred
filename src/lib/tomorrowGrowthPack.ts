import { enqueueDataFeedAction } from '../data/dataFeedActionQueueRepo';
import { queueSocialPost } from '../data/socialHubRepo';
import { isBlueskyIntegrationLive } from '../data/blueskyIntegrationRepo';
import { isMetaIntegrationLive } from '../data/metaIntegrationRepo';
import { buildDailyAuthorityPack, queueDailyAuthorityPack, type AuthorityPackItem } from './dailyAuthorityPack';
import { buildHaroPitches, formatHaroPitchBlock } from './haroPitchPack';
import { buildPinAndShortPack, formatPinAndShortBlock } from './pinAndShortPack';
import { buildAuthorityChannelPack, formatAuthorityChannelBlock } from './authorityChannelPack';

const WEEKDAYS: AuthorityPackItem['weekday'][] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

function tomorrowWeekday(): AuthorityPackItem['weekday'] {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const idx = d.getDay(); // 0 Sun
  if (idx === 0) return 'Mon';
  if (idx === 6) return 'Mon';
  return WEEKDAYS[idx - 1] ?? 'Mon';
}

function tomorrowMorningIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 15, 0, 0);
  return d.toISOString();
}

export type TomorrowGrowthPackResult = {
  weekday: AuthorityPackItem['weekday'];
  lane: string;
  queuedPosts: number;
  queuedActions: number;
};

/** Draft tomorrow’s caption + Today row so the operator only posts and books. */
export async function writeTomorrowGrowthPack(): Promise<TomorrowGrowthPackResult> {
  const weekday = tomorrowWeekday();
  const pack = await buildDailyAuthorityPack();
  const item = pack.find((row) => row.weekday === weekday) ?? pack[0];
  const queuedActions = await queueDailyAuthorityPack();

  let queuedPosts = 0;
  if (item) {
    const platforms: Array<'facebook' | 'instagram' | 'bluesky'> = [];
    if (isMetaIntegrationLive()) {
      platforms.push('facebook', 'instagram');
    }
    if (isBlueskyIntegrationLive()) {
      platforms.push('bluesky');
    }
    queueSocialPost({
      caption: item.draft,
      scheduledAt: tomorrowMorningIso(),
      platforms: platforms.length ? platforms : ['facebook', 'bluesky'],
      complianceStatus: 'needs_review',
      posterType: 'ai_agent',
    });
    queuedPosts = 1;
    enqueueDataFeedAction({
      source: `tomorrow-${weekday}`,
      headline: `Tomorrow · ${item.lane}: review then post`,
      detail: `${item.draft}\n\n${formatHaroPitchBlock(buildHaroPitches({ headline: item.story.headline, lane: item.lane }))}\n\n${formatPinAndShortBlock(buildPinAndShortPack({ headline: item.story.headline, lane: item.lane }))}\n\n${formatAuthorityChannelBlock(buildAuthorityChannelPack({ headline: item.story.headline, lane: item.lane }))}`,
      href: '/admin/social-hub?tab=autopilot',
      cta: 'post',
    });
  }

  return {
    weekday: item?.weekday ?? weekday,
    lane: item?.lane ?? 'Restore',
    queuedPosts,
    queuedActions,
  };
}
