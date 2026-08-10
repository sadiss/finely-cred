import type { ResourceVideo } from '../domain/resourceVideos';
import type { SiteTourDefinition } from '../domain/siteTourVideos';

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/** True when an uploaded resource video duplicates a factory watch-how tour (manifest is canonical). */
export function isWatchHowTourMirrorVideo(video: ResourceVideo, tours: SiteTourDefinition[]): boolean {
  const tourIds = new Set(tours.map((t) => t.id));
  const tourTitles = new Set(tours.map((t) => norm(t.title)));
  const tags = video.tags ?? [];

  for (const tag of tags) {
    const t = tag.trim();
    if (!t) continue;
    if (t === 'watch-how-tour' || t === 'tour' || t.startsWith('tour:')) return true;
    const bare = t.startsWith('tour:') ? t.slice('tour:'.length) : t;
    if (tourIds.has(t) || tourIds.has(bare)) return true;
  }

  const title = norm(video.title);
  if (tourTitles.has(title)) return true;
  for (const id of tourIds) {
    if (title.includes(norm(id))) return true;
  }
  return false;
}

/** Public uploads shown in the Partner lessons lane — excludes tour mirrors. */
export function listPartnerLessonVideos(videos: ResourceVideo[], tours: SiteTourDefinition[]): ResourceVideo[] {
  return videos.filter((v) => !isWatchHowTourMirrorVideo(v, tours));
}
