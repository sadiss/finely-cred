/** Site tour video registry — automated capture + playback (Launch OS Part C). */

export type SiteTourLane = 'public' | 'portal' | 'admin' | 'affiliate' | 'agent' | 'business';

export type SiteTourAuth = 'none' | 'partner' | 'admin';

export type SiteTourStep = {
  id: string;
  label: string;
  narrationPlain: string;
  /** Plain-language bullets shown in the player — do this, then this. */
  instructionLines?: string[];
  action: 'navigate' | 'click' | 'wait';
  path?: string;
  /** CSS selector for button/element to highlight in capture + playback */
  selector?: string;
  /** Optional label shown on highlight ring */
  highlightLabel?: string;
  waitMs?: number;
};

export type SiteTourDefinition = {
  id: string;
  title: string;
  lane: SiteTourLane;
  auth: SiteTourAuth;
  startPath: string;
  steps: SiteTourStep[];
  relatedSopId?: string;
  relatedCourseId?: string;
  /** Set after build pipeline uploads MP4 */
  resourceVideoId?: string;
};

export type SiteTourPlayback = {
  tourId: string;
  title: string;
  videoUrl: string;
  posterUrl?: string;
  revoke?: () => void;
};
