import type { SiteTourDefinition } from '../../domain/siteTourVideos';
import type { ContentStudioIntake } from './types';
import type { VideoCommandRequest } from './types';

export function buildTourNavigationPrompt(tour: SiteTourDefinition): string {
  const steps = tour.steps
    .map((s, i) => {
      const highlight = s.selector
        ? ` Highlight "${s.highlightLabel ?? s.label}" (${s.selector}) on ${s.path ?? tour.startPath}.`
        : s.path
          ? ` Navigate to ${s.path}.`
          : '';
      return `Step ${i + 1} — ${s.label}: ${s.narrationPlain}${highlight}`;
    })
    .join('\n');
  return (
    `Finely Cred site navigation tutorial: "${tour.title}". ` +
    `Create a screen-walkthrough style training video with cursor highlights, pulsing rings on buttons, ` +
    `clear voiceover, and on-screen labels. Lane: ${tour.lane}. Auth: ${tour.auth}. Start: ${tour.startPath}.\n\n` +
    steps
  );
}

export function tourVideoDurationSec(tour: SiteTourDefinition): number {
  const base = tour.steps.length * 12;
  return Math.min(180, Math.max(36, base));
}

export function contentStudioUrlForTour(tourId: string, room: 'navigation_tours' | 'video' = 'navigation_tours'): string {
  const params = new URLSearchParams({ room, tourId });
  return `/admin/content-studio?${params.toString()}`;
}

export function intakeFromTour(tour: SiteTourDefinition): ContentStudioIntake {
  return {
    prompt: buildTourNavigationPrompt(tour),
    sourceSurface: 'tour_studio',
    requestedAssetType: 'tour_demo',
    audience:
      tour.lane === 'portal'
        ? 'Finely Cred partners learning the client portal'
        : tour.lane === 'admin'
          ? 'Finely Cred staff and admins'
          : 'Visitors and prospects learning Finely Cred',
    offer: tour.title,
    publishTarget: 'tour_demo',
    durationSec: tourVideoDurationSec(tour),
    aspect: '16:9',
    brandPreset: 'finely_dark',
    complianceStrict: true,
    ownerStaffId: 'content_director',
  };
}

export function videoCommandRequestFromTour(tour: SiteTourDefinition): Partial<VideoCommandRequest> {
  const intake = intakeFromTour(tour);
  return {
    prompt: intake.prompt,
    durationSec: intake.durationSec ?? 60,
    aspect: '16:9',
    intent: tour.lane === 'portal' ? 'business_credit_education' : 'authority_clip',
    voiceStyle: 'friendly_educator',
    visualStyle: 'modern',
    audience: intake.audience,
    offer: intake.offer,
    includeCaptions: true,
    complianceStrict: true,
  };
}
