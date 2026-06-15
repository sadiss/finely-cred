import type { SocialPlatform } from '../domain/socialContentSop';
import {
  getSocialSopById,
  listSocialSopsForDay,
  SOCIAL_SOP_LIBRARY,
  type SocialSopTemplate,
} from '../domain/socialContentSop';
import { resolveStaffOnDuty } from '../data/staffRoster';
import { queueSocialPost, listScheduledPosts, updateSocialPostStatus, type SocialScheduledPost } from '../data/socialHubRepo';
import { loadJson, saveJson } from '../data/localJsonStore';

export type SocialAutopilotConfig = {
  enabled: boolean;
  autoPublish: boolean;
  dryRun: boolean;
  defaultPlatforms: SocialPlatform[];
  timezone: string;
  lastRunAt?: string;
  postsGeneratedThisWeek: number;
};

const CONFIG_KEY = 'finely.socialAutopilot.v1';

const DEFAULT_CONFIG: SocialAutopilotConfig = {
  enabled: true,
  autoPublish: false,
  dryRun: true,
  defaultPlatforms: ['facebook', 'instagram'],
  timezone: 'America/New_York',
  postsGeneratedThisWeek: 0,
};

export function loadSocialAutopilotConfig(): SocialAutopilotConfig {
  return loadJson(CONFIG_KEY, DEFAULT_CONFIG, 1);
}

export function saveSocialAutopilotConfig(cfg: SocialAutopilotConfig) {
  saveJson(CONFIG_KEY, cfg, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
  if (typeof window !== 'undefined') {
    void import('../data/socialHubSupabaseSync').then((m) => m.syncAutopilotConfigToSupabase(cfg));
  }
}

const BANNED = [
  'guaranteed',
  'delete everything',
  '800 score',
  'illegal to report',
  'credit repair organization',
  'overnight',
  'hack the bureau',
];

export function reviewSocialCaptionCompliance(caption: string, sop?: SocialSopTemplate): { ok: boolean; issues: string[] } {
  const issues: string[] = [];
  const lower = caption.toLowerCase();
  for (const phrase of BANNED) {
    if (lower.includes(phrase)) issues.push(`Avoid: "${phrase}"`);
  }
  if (sop) {
    for (const forbidden of sop.forbiddenPhrases) {
      if (lower.includes(forbidden.toLowerCase())) issues.push(`SOP forbidden: "${forbidden}"`);
    }
  }
  if (!lower.includes('vary') && !lower.includes('educational')) {
    issues.push('Add educational disclaimer (results vary / not legal advice).');
  }
  return { ok: issues.length === 0, issues };
}

export function draftCaptionFromSop(sop: SocialSopTemplate): string {
  const staff = resolveStaffOnDuty(sop.assignedRoleId);
  const name = staff ? `${staff.firstName} ${staff.lastName}` : 'Finely Cred team';
  const body = sop.bodyOutline.map((line) => `• ${line}`).join('\n');
  const tags = sop.requiredHashtags.join(' ');
  return `${sop.hookFormula}\n\n${body}\n\n${sop.cta}\n\n${tags}\n\n— ${name}, Finely Cred · Results vary · Educational only · Not legal advice.`;
}

export type SocialAutopilotRunResult = {
  at: string;
  generated: number;
  queued: SocialScheduledPost[];
  skipped: number;
  complianceBlocked: number;
  published: number;
  publishFailed: number;
};

export function processSocialAutopilotTick(opts?: { dryRun?: boolean; force?: boolean }): SocialAutopilotRunResult {
  const cfg = loadSocialAutopilotConfig();
  const dryRun = opts?.dryRun ?? cfg.dryRun;
  if (!cfg.enabled && !opts?.force) {
    return { at: new Date().toISOString(), generated: 0, queued: [], skipped: 0, complianceBlocked: 0, published: 0, publishFailed: 0 };
  }

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const existingToday = listScheduledPosts().filter((p) => p.createdAt.slice(0, 10) === today);
  const sops = listSocialSopsForDay(now.getDay());
  const queued: SocialScheduledPost[] = [];
  let complianceBlocked = 0;
  let skipped = 0;

  for (const sop of sops) {
    if (existingToday.some((p) => p.sopTemplateId === sop.id)) {
      skipped += 1;
      continue;
    }
    const caption = draftCaptionFromSop(sop);
    const review = reviewSocialCaptionCompliance(caption, sop);
    if (!review.ok && sop.approvalRequired) {
      complianceBlocked += 1;
      continue;
    }
    if (dryRun) {
      skipped += 1;
      continue;
    }
    const scheduledAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
    const post = queueSocialPost({
      caption,
      scheduledAt,
      platforms: sop.platforms,
      sopTemplateId: sop.id,
      assignedStaffId: resolveStaffOnDuty(sop.assignedRoleId)?.id,
      complianceStatus: review.ok ? 'approved' : 'needs_review',
    });
    queued.push(post);
  }

  if (!dryRun) {
    saveSocialAutopilotConfig({
      ...cfg,
      lastRunAt: now.toISOString(),
      postsGeneratedThisWeek: cfg.postsGeneratedThisWeek + queued.length,
    });
  }

  const publishResult =
    !dryRun && (cfg.autoPublish || opts?.force)
      ? publishDueSocialPosts({ dryRun: false, force: opts?.force })
      : { published: 0, failed: 0 };

  return {
    at: now.toISOString(),
    generated: queued.length,
    queued,
    skipped,
    complianceBlocked,
    published: publishResult.published,
    publishFailed: publishResult.failed,
  };
}

export function publishDueSocialPosts(opts?: { dryRun?: boolean; force?: boolean }): { published: number; failed: number } {
  const cfg = loadSocialAutopilotConfig();
  const dryRun = opts?.dryRun ?? cfg.dryRun;
  if (!cfg.autoPublish && !opts?.force) return { published: 0, failed: 0 };
  const now = Date.now();
  let published = 0;
  let failed = 0;
  for (const post of listScheduledPosts()) {
    if (post.status !== 'queued') continue;
    if (post.complianceStatus === 'needs_review' || post.complianceStatus === 'blocked') continue;
    if (Date.parse(post.scheduledAt) > now) continue;
    if (dryRun) continue;
    const updated = updateSocialPostStatus(post.id, 'published');
    if (updated) published += 1;
    else failed += 1;
  }
  return { published, failed };
}

export function queueSopPostNow(sopId: string): SocialScheduledPost | null {
  const sop = getSocialSopById(sopId);
  if (!sop) return null;
  const caption = draftCaptionFromSop(sop);
  const review = reviewSocialCaptionCompliance(caption, sop);
  return queueSocialPost({
    caption,
    scheduledAt: new Date().toISOString(),
    platforms: sop.platforms,
    sopTemplateId: sop.id,
    assignedStaffId: resolveStaffOnDuty(sop.assignedRoleId)?.id,
    complianceStatus: review.ok ? 'approved' : 'needs_review',
  });
}

export function resetWeeklySocialAutopilotStats() {
  const cfg = loadSocialAutopilotConfig();
  saveSocialAutopilotConfig({ ...cfg, postsGeneratedThisWeek: 0 });
}

export function summarizeSocialAutopilotForCoOwner(): string {
  const cfg = loadSocialAutopilotConfig();
  const posts = listScheduledPosts();
  const queued = posts.filter((p) => p.status === 'queued');
  const needsReview = posts.filter((p) => p.complianceStatus === 'needs_review');
  const todaySops = listSocialSopsForDay(new Date().getDay());
  const preview = processSocialAutopilotTick({ dryRun: true, force: true });
  return [
    `Social autopilot: enabled=${cfg.enabled} · autoPublish=${cfg.autoPublish} · dryRun=${cfg.dryRun}`,
    `SOP library: ${SOCIAL_SOP_LIBRARY.length} templates · today=${todaySops.length} slot(s)`,
    `Queue: ${posts.length} total · ${queued.length} queued · ${needsReview.length} needs review`,
    `Dry-run tick: ${preview.generated} would queue · ${preview.skipped} skipped · ${preview.complianceBlocked} blocked`,
    '',
    'Enable autoPublish only after Meta credentials in Social Hub.',
    'Admin: /admin/social-hub · Cron: platformCron socialAutopilot tick',
  ].join('\n');
}
