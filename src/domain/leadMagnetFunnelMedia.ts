import type { BlobRef } from '../storage/BlobStore';

/** Per-funnel hero media — video, cover, urgency (admin-controlled). */
export type LeadMagnetFunnelMedia = {
  funnelKey: string;
  /** Direct upload for this funnel hero. */
  heroVideoBlobRef?: BlobRef;
  heroVideoPosterBlobRef?: BlobRef;
  heroVideoMimeType?: string;
  /** Reuse a video from Resources library. */
  resourceVideoId?: string;
  /** Static MP4 path fallback (e.g. /media/...). */
  staticVideoSrc?: string;
  heroImageOverride?: string;
  ebookCoverBlobRef?: BlobRef;
  videoTitle?: string;
  urgencySlotsRemaining?: number;
  urgencyCountdownEnd?: string;
  showLivePulse?: boolean;
  updatedAt: string;
};
