import { listAllCourses } from '../data/coursesRepo';
import { listMediaProjects } from '../data/mediaStudioRepo';
import { isFeatureEnabled } from '../data/settingsRepo';
import { EXPANDED_VOICE_COUNT } from '../data/expandedVoiceCatalog';
import { listContentStudioAssets } from '../features/studioCommandOs/contentStudioRepo';
import {
  computeBestVideoPipelineMaturity,
  computeVideoPipelineMaturity,
} from '../features/studioCommandOs/videoPipelineMaturity';
import { getAgentMaturity } from '../features/growthAgents/growthAgentMaturity';
import { GROWTH_AGENTS } from '../features/growthAgents/growthAgentRegistry';
import { getMarketingFindReadiness } from '../features/marketingDesk/marketingDeskHunt';
import { lessonHasAttachedVideo } from '../features/educationStudio/courseVideoBridge';
import { buildVoiceRenderHealthSnapshot } from './voiceRenderHealth';
import { listVideoProviderStatuses } from './videoProviderRenderPlan';
import { isSupabaseConfigured } from './supabaseClient';
import type { FinelyCtaIntentId } from './finelyCtaIntent';
import { resolveFinelyCtaPath } from './finelyCtaIntent';

export type FinelyCapabilityDomainId =
  | 'video_wizard'
  | 'video_pipeline'
  | 'voice_previews'
  | 'course_builder'
  | 'marketing'
  | 'ctas'
  | 'agents';

export type FinelyCapabilityTone = 'ok' | 'warn' | 'blocked';

export type FinelyCapabilityBlocker = {
  id: string;
  label: string;
  href?: string;
};

export type FinelyCapabilityDomain = {
  id: FinelyCapabilityDomainId;
  label: string;
  percent: number;
  tone: FinelyCapabilityTone;
  summary: string;
  blockers: FinelyCapabilityBlocker[];
  href?: string;
};

export type FinelyCapabilityReport = {
  domains: FinelyCapabilityDomain[];
  computedAt: string;
};

/** Surfaces confirmed migrated to finelyCtaIntent — update as Phase 1 sweep continues. */
const CTA_MIGRATED_SURFACE_IDS = [
  'personal_credit',
  'pricing',
  'landing_home',
  'services',
  'contact',
  'account_settings',
  'bookstore',
  'landing_hero_os',
  'landing_fundability',
  'hannah_link_factory',
] as const;

const CTA_PRIORITY_SURFACE_COUNT = 12;

const ALL_CTA_INTENTS: FinelyCtaIntentId[] = [
  'personal_free_guide',
  'personal_intake',
  'personal_package',
  'business_intake',
  'debt_intake',
  'funding_intake',
  'consultation',
  'career_track',
  'lead_magnet',
];

function toneFromPercent(percent: number): FinelyCapabilityTone {
  if (percent >= 75) return 'ok';
  if (percent >= 40) return 'warn';
  return 'blocked';
}

function clampPercent(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function computeVideoWizardDomain(): FinelyCapabilityDomain {
  const projects = listMediaProjects();
  const videoAssets = listContentStudioAssets().filter((a) => a.assetType === 'video' && a.blobRef);
  const publishedVideos = videoAssets.filter((a) => a.status === 'published');
  const hasScenes = projects.some((p) => (p.scenes ?? []).length > 0);
  const hasRender = projects.some((p) => (p.renderHistory ?? []).length > 0) || videoAssets.length > 0;

  let percent = 25;
  const blockers: FinelyCapabilityBlocker[] = [];

  percent += hasScenes ? 20 : 0;
  percent += hasRender ? 30 : 0;
  percent += publishedVideos.length > 0 ? 15 : 0;
  percent += videoAssets.length >= 1 ? 10 : 0;

  if (!hasScenes) {
    blockers.push({ id: 'scenes', label: 'Run wizard Step 2 — generate scene plan', href: '/admin/content-studio?wizard=open' });
  }
  if (!hasRender) {
    blockers.push({ id: 'export', label: 'Export at least one WebM from Step 3', href: '/admin/content-studio?wizard=open' });
  }
  if (!publishedVideos.length && videoAssets.length) {
    blockers.push({ id: 'publish', label: 'Publish a video to Resources or a funnel', href: '/admin/content-studio?view=advanced&room=review' });
  }

  percent = clampPercent(percent);
  return {
    id: 'video_wizard',
    label: 'Video — easy wizard',
    percent,
    tone: toneFromPercent(percent),
    summary:
      percent >= 80
        ? 'Wizard path producing clips'
        : hasRender
          ? 'Wizard exports work — add publish'
          : '3-step wizard live — run your first export',
    blockers,
    href: '/admin/content-studio?wizard=open',
  };
}

function computeVideoPipelineDomain(): FinelyCapabilityDomain {
  const pipeline = computeVideoPipelineMaturity();
  const best = computeBestVideoPipelineMaturity();
  const providers = listVideoProviderStatuses();
  const blockers: FinelyCapabilityBlocker[] = [];

  for (const p of providers) {
    if (!p.ready && ['image_gen', 'elevenlabs_voice'].includes(p.id)) {
      blockers.push({ id: p.id, label: p.hint, href: '/admin/settings' });
    }
    if (p.id === 'kling' || p.id === 'runway') {
      blockers.push({ id: p.id, label: `${p.label} adapter stubbed`, href: '/admin/content-studio?view=advanced&room=video' });
    }
  }

  const incomplete = pipeline.stages.filter((s) => !s.done);
  if (incomplete.length && pipeline.percent < 100) {
    const next = incomplete[0];
    if (next) {
      blockers.unshift({
        id: `stage_${next.id}`,
        label: `Next: ${next.label} — ${next.hint}`,
        href: '/admin/content-studio?view=advanced&room=video',
      });
    }
  }

  return {
    id: 'video_pipeline',
    label: 'Video — full pipeline',
    percent: clampPercent(Math.max(pipeline.percent, best.percent > 0 ? Math.round((pipeline.percent + best.percent) / 2) : pipeline.percent)),
    tone: toneFromPercent(pipeline.percent),
    summary: pipeline.jobTitle ? `${pipeline.label} · ${pipeline.jobTitle}` : pipeline.label,
    blockers: blockers.slice(0, 4),
    href: '/admin/content-studio?view=advanced&room=video',
  };
}

function computeVoicePreviewsDomain(): FinelyCapabilityDomain {
  const voiceHealth = buildVoiceRenderHealthSnapshot();
  const providers = listVideoProviderStatuses();
  const voiceRenderReady = providers.find((p) => p.id === 'elevenlabs_voice')?.ready ?? false;
  const blockers: FinelyCapabilityBlocker[] = [];

  let percent = 15;
  if (voiceRenderReady) percent += 35;
  if (voiceHealth.successes24h > 0) percent += 25;
  if (isSupabaseConfigured) percent += 10;

  blockers.push({
    id: 'browser_tts',
    label: 'Library previews use browser TTS — cached ElevenLabs samples pending',
    href: '/admin/content-studio?view=advanced&room=voice',
  });
  if (!voiceRenderReady) {
    blockers.push({ id: 'gateway', label: 'Connect AI gateway for production VO', href: '/admin/settings' });
  }

  percent = clampPercent(percent);
  return {
    id: 'voice_previews',
    label: 'Voice — library previews',
    percent,
    tone: toneFromPercent(percent),
    summary:
      percent >= 70
        ? 'Production VO live — upgrade preview samples'
        : `${EXPANDED_VOICE_COUNT}+ personas · previews not distinct yet`,
    blockers,
    href: '/admin/content-studio?view=advanced&room=voice',
  };
}

function computeCourseBuilderDomain(): FinelyCapabilityDomain {
  const courses = listAllCourses();
  const coursesOn = isFeatureEnabled('courses');
  const published = courses.filter((c) => c.published);
  let lessonTotal = 0;
  let lessonWithVideo = 0;
  for (const course of courses) {
    for (const mod of course.modules ?? []) {
      for (const lesson of mod.lessons ?? []) {
        lessonTotal += 1;
        if (lessonHasAttachedVideo(lesson)) lessonWithVideo += 1;
      }
    }
  }

  let percent = coursesOn ? 20 : 5;
  const blockers: FinelyCapabilityBlocker[] = [];

  if (!coursesOn) {
    blockers.push({ id: 'flag', label: 'Turn on courses feature flag', href: '/admin/settings' });
  }
  if (courses.length) percent += 15;
  if (published.length) percent += 20;
  if (lessonTotal > 0) {
    percent += Math.round((lessonWithVideo / lessonTotal) * 35);
  }
  if (lessonTotal > 0 && lessonWithVideo === 0) {
    blockers.push({
      id: 'lesson_video',
      label: 'No lesson videos attached — use Course videos workroom',
      href: '/admin/content-studio?view=advanced&room=course_videos',
    });
  }
  if (!published.length && courses.length) {
    blockers.push({ id: 'publish', label: 'Publish a course to the portal player', href: '/admin/courses' });
  }

  percent = clampPercent(percent);
  return {
    id: 'course_builder',
    label: 'Course builder',
    percent,
    tone: toneFromPercent(percent),
    summary:
      lessonTotal > 0
        ? `${lessonWithVideo}/${lessonTotal} lessons with video · ${published.length} published`
        : coursesOn
          ? 'Courses on — add modules and lessons'
          : 'Courses module off',
    blockers,
    href: '/admin/courses',
  };
}

function computeMarketingDomain(): FinelyCapabilityDomain {
  const readiness = getMarketingFindReadiness();
  const done = readiness.steps.filter((s) => s.done).length;
  const total = readiness.steps.length || 1;
  const percent = clampPercent(Math.round((done / total) * 100));
  const blockers: FinelyCapabilityBlocker[] = readiness.steps
    .filter((s) => !s.done)
    .map((s) => ({ id: s.id, label: s.label, href: s.href ?? '/admin/settings' }));

  return {
    id: 'marketing',
    label: 'Marketing — live find',
    percent,
    tone: toneFromPercent(percent),
    summary: readiness.label,
    blockers,
    href: '/admin/growth-agents/lead-discovery',
  };
}

function computeCtasDomain(): FinelyCapabilityDomain {
  const registryOk = ALL_CTA_INTENTS.every((intent) => {
    try {
      if (intent === 'personal_package') return true;
      if (intent === 'career_track') return true;
      resolveFinelyCtaPath(intent);
      return true;
    } catch {
      return false;
    }
  });

  const migrated = CTA_MIGRATED_SURFACE_IDS.length;
  let percent = registryOk ? 30 : 10;
  percent += Math.round((migrated / CTA_PRIORITY_SURFACE_COUNT) * 55);
  percent += 5;

  const blockers: FinelyCapabilityBlocker[] = [];
  if (migrated < CTA_PRIORITY_SURFACE_COUNT) {
    blockers.push({
      id: 'sweep',
      label: `${CTA_PRIORITY_SURFACE_COUNT - migrated} priority surfaces still need CTA registry sweep`,
    });
  }
  blockers.push({
    id: 'audit',
    label: 'Run npm run cta:bare-onboarding:audit to catch bare /onboarding',
  });

  percent = clampPercent(percent);
  return {
    id: 'ctas',
    label: 'CTA routing',
    percent,
    tone: toneFromPercent(percent),
    summary: `${migrated}/${CTA_PRIORITY_SURFACE_COUNT} priority surfaces on finelyCtaIntent`,
    blockers,
    href: '/admin/settings',
  };
}

function computeAgentsDomain(): FinelyCapabilityDomain {
  const maturities = GROWTH_AGENTS.map((a) => getAgentMaturity(a));
  const avg = maturities.length
    ? Math.round(maturities.reduce((sum, m) => sum + m.percent, 0) / maturities.length)
    : 0;
  const liveAgents = GROWTH_AGENTS.filter((a) => a.wave <= 2).length;
  const readyAgents = maturities.filter((m) => m.percent >= 60).length;

  const blockers: FinelyCapabilityBlocker[] = [];
  GROWTH_AGENTS.forEach((agent, idx) => {
    const m = maturities[idx]!;
    if (m.percent < 40 && agent.wave <= 2) {
      blockers.push({
        id: agent.id,
        label: `${agent.name}: ${m.label}`,
        href: `/admin/growth-agents/${agent.id}`,
      });
    }
  });

  return {
    id: 'agents',
    label: 'Growth agents',
    percent: clampPercent(avg),
    tone: toneFromPercent(avg),
    summary: `${readyAgents}/${liveAgents} wave-0–2 specialists ≥60% ready`,
    blockers: blockers.slice(0, 4),
    href: '/admin/growth-agents',
  };
}

/** Live capability scorecard — video, course, marketing, voices, agents, CTAs. */
export function buildFinelyCapabilityReport(): FinelyCapabilityReport {
  return {
    computedAt: new Date().toISOString(),
    domains: [
      computeVideoWizardDomain(),
      computeVideoPipelineDomain(),
      computeVoicePreviewsDomain(),
      computeCourseBuilderDomain(),
      computeMarketingDomain(),
      computeCtasDomain(),
      computeAgentsDomain(),
    ],
  };
}

export function getFinelyCapabilityDomain(id: FinelyCapabilityDomainId): FinelyCapabilityDomain | undefined {
  return buildFinelyCapabilityReport().domains.find((d) => d.id === id);
}
