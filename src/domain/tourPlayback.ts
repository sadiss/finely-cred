/** Tour video URL helpers — public/tours/{id}.mp4 from tour factory (Part C). */

import type { SiteTourDefinition } from './siteTourVideos';

/** Public URL for assembled tour MP4 (Vite serves from /public/tours). */
export function getTourVideoPublicUrl(tourId: string): string {
  return `/tours/${encodeURIComponent(tourId)}.mp4`;
}

/** Optional poster from first capture step. */
export function getTourPosterPublicUrl(tourId: string): string {
  return `/tours/${encodeURIComponent(tourId)}/step-01.png`;
}

export function getTourStepSnapshotUrl(tourId: string, stepIndex: number): string {
  return `/tours/${encodeURIComponent(tourId)}/step-${String(stepIndex + 1).padStart(2, '0')}.png`;
}

/** Optional step narration from Voice Studio prerender (public/tours/{id}/step-NN.mp3). */
export function getTourStepNarrationMp3Url(tourId: string, stepIndex: number): string {
  return `/tours/${encodeURIComponent(tourId)}/step-${String(stepIndex + 1).padStart(2, '0')}.mp3`;
}

export function resolveTourPlaybackSources(tour: SiteTourDefinition): {
  mp4Url: string;
  posterUrl: string;
} {
  return {
    mp4Url: getTourVideoPublicUrl(tour.id),
    posterUrl: getTourPosterPublicUrl(tour.id),
  };
}
