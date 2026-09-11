import {
  approveDataFeedAction,
  dismissDataFeedAction,
  listDataFeedActions,
  type DataFeedActionRow,
} from '../data/dataFeedActionQueueRepo';
import { listScheduledPosts, updateSocialPostStatus, type SocialScheduledPost } from '../data/socialHubRepo';
import { listTasks } from '../data/tasksRepo';
import { MARKETING_DESK_TAG } from '../features/marketingDesk/marketingDeskProjects';
import { marketingTaskDeepLink } from '../features/marketingDesk/marketingDeskTasks';
import { isBlueskyIntegrationLive } from '../data/blueskyIntegrationRepo';
import { isMetaIntegrationLive } from '../data/metaIntegrationRepo';
import { publishBlueskyPostLive } from './blueskyPublish';
import { publishSocialPostLive } from './metaSocialPublish';
import type { FinelyOsPublicAccent } from '../features/os/finelyOsLightUi';

export type OwnerTodayKind = 'feed' | 'social_review' | 'social_due' | 'desk';

export type OwnerTodayRow = {
  id: string;
  kind: OwnerTodayKind;
  role: string;
  happened: string;
  drafted: string;
  doLabel: string;
  href: string;
  accent: FinelyOsPublicAccent;
  sourceId: string;
};

const ACCENTS: FinelyOsPublicAccent[] = ['emerald', 'violet', 'sky', 'rose'];

function accentAt(i: number): FinelyOsPublicAccent {
  return ACCENTS[i % ACCENTS.length];
}

function isOpen(status?: string) {
  return status !== 'completed' && status !== 'cancelled';
}

export function loadOwnerTodayRows(): OwnerTodayRow[] {
  const rows: OwnerTodayRow[] = [];

  listDataFeedActions('pending').slice(0, 12).forEach((row, i) => {
    rows.push({
      id: `feed:${row.id}`,
      kind: 'feed',
      role: row.source,
      happened: row.headline,
      drafted: row.detail,
      doLabel: row.cta === 'book' ? 'Open booking' : row.cta === 'email' ? 'Queue email' : 'Queue this post',
      href: row.href || '/admin/marketing-desk',
      accent: accentAt(i),
      sourceId: row.id,
    });
  });

  const posts = listScheduledPosts();
  posts
    .filter((p) => p.status === 'needs_review' || p.complianceStatus === 'needs_review')
    .slice(0, 8)
    .forEach((p, i) => {
      rows.push({
        id: `review:${p.id}`,
        kind: 'social_review',
        role: (p.platforms ?? []).join(' · ') || 'Social',
        happened: 'Caption waiting for a human check',
        drafted: p.caption,
        doLabel: 'Approve to queue',
        href: '/admin/social-hub?tab=autopilot',
        accent: accentAt(rows.length + i),
        sourceId: p.id,
      });
    });

  const now = Date.now();
  posts
    .filter((p) => p.status === 'queued' && Date.parse(p.scheduledAt) <= now && p.complianceStatus !== 'needs_review')
    .slice(0, 8)
    .forEach((p, i) => {
      rows.push({
        id: `due:${p.id}`,
        kind: 'social_due',
        role: (p.platforms ?? []).join(' · ') || 'Social',
        happened: 'Post is due now',
        drafted: p.caption,
        doLabel: 'Publish now',
        href: '/admin/social-hub?tab=calendar',
        accent: accentAt(rows.length + i),
        sourceId: p.id,
      });
    });

  listTasks()
    .filter((t) => isOpen(t.status) && (t.tags ?? []).includes(MARKETING_DESK_TAG))
    .slice(0, 10)
    .forEach((t, i) => {
      rows.push({
        id: `desk:${t.id}`,
        kind: 'desk',
        role: 'Marketing Desk',
        happened: t.title,
        drafted: t.notes || 'Open the desk and finish this row.',
        doLabel: 'Open task',
        href: marketingTaskDeepLink(t),
        accent: accentAt(rows.length + i),
        sourceId: t.id,
      });
    });

  return rows.slice(0, 24);
}

function isTomorrowIso(iso?: string): boolean {
  if (!iso) return false;
  const due = new Date(iso);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    due.getFullYear() === tomorrow.getFullYear() &&
    due.getMonth() === tomorrow.getMonth() &&
    due.getDate() === tomorrow.getDate()
  );
}

/** Queued pack + posts scheduled for tomorrow — own room under Today. */
export function loadOwnerTomorrowRows(): OwnerTodayRow[] {
  const rows: OwnerTodayRow[] = [];

  listDataFeedActions('pending')
    .filter((row) => String(row.source || '').startsWith('tomorrow-'))
    .forEach((row, i) => {
      rows.push({
        id: `tomorrow-feed:${row.id}`,
        kind: 'feed',
        role: row.source,
        happened: row.headline,
        drafted: row.detail,
        doLabel: row.cta === 'book' ? 'Open booking' : row.cta === 'email' ? 'Queue email' : 'Review this post',
        href: row.href || '/admin/social-hub?tab=autopilot',
        accent: accentAt(i),
        sourceId: row.id,
      });
    });

  listScheduledPosts()
    .filter((p) => isTomorrowIso(p.scheduledAt) && p.status !== 'published' && p.status !== 'failed')
    .forEach((p, i) => {
      rows.push({
        id: `tomorrow-post:${p.id}`,
        kind: 'social_review',
        role: (p.platforms ?? []).join(' · ') || 'Social',
        happened: 'Queued for tomorrow',
        drafted: p.caption,
        doLabel: 'Open the pack',
        href: '/admin/social-hub?tab=autopilot',
        accent: accentAt(rows.length + i),
        sourceId: p.id,
      });
    });

  return rows.slice(0, 16);
}

export function skipOwnerTodayRow(row: OwnerTodayRow): void {
  if (row.kind === 'feed') {
    dismissDataFeedAction(row.sourceId);
    return;
  }
  if (row.kind === 'social_review' || row.kind === 'social_due') {
    updateSocialPostStatus(row.sourceId, 'failed');
  }
}

export async function doOwnerTodayRow(row: OwnerTodayRow): Promise<{ href: string; notice: string }> {
  if (row.kind === 'feed') {
    const next: DataFeedActionRow | null = approveDataFeedAction(row.sourceId);
    return {
      href: row.href,
      notice: next?.taskId ? 'Queued on Marketing Desk.' : 'Approved.',
    };
  }
  if (row.kind === 'social_review') {
    updateSocialPostStatus(row.sourceId, 'queued', { complianceStatus: 'approved' });
    return { href: row.href, notice: 'Approved — moved to the publish queue.' };
  }
  if (row.kind === 'social_due') {
    const post = listScheduledPosts().find((p) => p.id === row.sourceId);
    if (!post) return { href: row.href, notice: 'Post already left the queue.' };
    const notice = await publishDueChannels(post);
    return { href: row.href, notice };
  }
  return { href: row.href, notice: 'Open this row and finish it.' };
}

export async function publishDueChannels(post: SocialScheduledPost): Promise<string> {
  const platforms = post.platforms ?? [];
  const wantsMeta = platforms.length === 0 || platforms.some((p) => p === 'facebook' || p === 'instagram' || p === 'threads');
  const wantsBluesky = platforms.length === 0 || platforms.includes('bluesky');
  const parts: string[] = [];
  let ok = false;

  if (wantsMeta && isMetaIntegrationLive()) {
    const live = await publishSocialPostLive(post);
    parts.push(live.ok ? 'Meta posted' : `Meta: ${live.error ?? 'failed'}`);
    ok = ok || live.ok;
  }
  if (wantsBluesky && isBlueskyIntegrationLive()) {
    const live = await publishBlueskyPostLive(post);
    parts.push(live.ok ? 'Bluesky posted' : `Bluesky: ${live.error ?? 'failed'}`);
    ok = ok || live.ok;
  }

  if (!parts.length) {
    updateSocialPostStatus(post.id, 'published');
    return 'Marked published locally — connect Meta or Bluesky to send live.';
  }
  updateSocialPostStatus(post.id, ok ? 'published' : 'failed');
  return parts.join(' · ');
}
