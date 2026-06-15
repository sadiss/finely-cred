export type TestimonialKind = 'video' | 'text';

export type TestimonialVisibility = 'published' | 'draft';

export type VideoTestimonial = {
  kind: 'video';
  id: string;
  tenantId: string;
  title: string;
  service: string;
  visibility: TestimonialVisibility;
  /** Optional YouTube/Vimeo embed URL. */
  embedUrl?: string;
  /** Optional local/self-hosted MP4 URL (e.g. /testimonials/amy-peaks.mp4). */
  videoSrc?: string;
  /** Optional blob ref (local blob store / IndexedDB). */
  blobRef?: string;
  blobMimeType?: string;
  /** Optional poster image (e.g. /testimonials/amy-peaks.jpg). */
  posterSrc?: string;
  /** Optional start time (seconds) for embeds/players. */
  startAtSeconds?: number;
  /** Optional admin note (not public). */
  internalNote?: string;
  /** Optional public caption. */
  caption?: string;
  createdAt: string;
  updatedAt: string;
};

export type TextTestimonial = {
  kind: 'text';
  id: string;
  tenantId: string;
  service: string;
  name: string;
  review: string;
  milestone?: string;
  amount?: string;
  visibility: TestimonialVisibility;
  createdAt: string;
  updatedAt: string;
};

export type Testimonial = VideoTestimonial | TextTestimonial;

export function nowIso() {
  return new Date().toISOString();
}

