import { enqueueDataFeedAction } from '../data/dataFeedActionQueueRepo';
import { loadDataFeedsToday, type DataFeedStory } from './dataFeedsToday';
import { enrollAbandonedChatLeads } from './abandonedChatNurture';
import { queueRoleFollowUpTasks } from './roleActionLoops';
import { buildHaroPitches, formatHaroPitchBlock } from './haroPitchPack';
import { buildPinAndShortPack, formatPinAndShortBlock } from './pinAndShortPack';
import { buildAuthorityChannelPack, formatAuthorityChannelBlock } from './authorityChannelPack';

export type AuthorityPackItem = {
  weekday: 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri';
  lane: string;
  story: DataFeedStory;
  draft: string;
};

const CALENDAR: Array<{ weekday: AuthorityPackItem['weekday']; lane: string; topic: DataFeedStory['topic'] }> = [
  { weekday: 'Mon', lane: 'Restore', topic: 'credit' },
  { weekday: 'Tue', lane: 'Debt', topic: 'debt' },
  { weekday: 'Wed', lane: 'AU / tradelines', topic: 'marketing' },
  { weekday: 'Thu', lane: 'Specialists & agencies', topic: 'credit' },
  { weekday: 'Fri', lane: 'Affiliates & press', topic: 'marketing' },
];

function draftFrom(story: DataFeedStory, lane: string): string {
  return [
    `${lane} note`,
    '',
    story.headline,
    story.detail,
    story.href ? `Source: ${story.href}` : '',
    '',
    'CTA: Start free guide → /free-guide',
    'Results vary · not legal advice · funding subject to underwriting',
  ]
    .filter(Boolean)
    .join('\n');
}

export async function buildDailyAuthorityPack(): Promise<AuthorityPackItem[]> {
  const { stories } = await loadDataFeedsToday();
  const live = stories.filter((s) => s.live);
  return CALENDAR.map((slot) => {
    const story =
      live.find((s) => s.topic === slot.topic) ||
      live[0] ||
      stories[0] || {
        id: 'empty',
        topic: slot.topic,
        source: 'Pack',
        headline: `No live ${slot.lane.toLowerCase()} headline yet`,
        detail: 'Deploy public-data or add the free key, then refresh Data Feeds.',
        cta: 'post' as const,
        live: false,
      };
    return {
      weekday: slot.weekday,
      lane: slot.lane,
      story,
      draft: draftFrom(story, slot.lane),
    };
  });
}

export async function queueDailyAuthorityPack(): Promise<number> {
  const pack = await buildDailyAuthorityPack();
  pack.forEach((item) => {
    enqueueDataFeedAction({
      source: `authority-${item.weekday}`,
      headline: `${item.weekday} · ${item.lane}: ${item.story.headline}`,
      detail: `${item.draft}\n\n${formatHaroPitchBlock(buildHaroPitches({ headline: item.story.headline, lane: item.lane }))}\n\n${formatPinAndShortBlock(buildPinAndShortPack({ headline: item.story.headline, lane: item.lane }))}\n\n${formatAuthorityChannelBlock(buildAuthorityChannelPack({ headline: item.story.headline, lane: item.lane }))}`,
      href: item.story.href,
      cta: 'post',
    });
  });
  queueRoleFollowUpTasks();
  enrollAbandonedChatLeads();
  return pack.length;
}
