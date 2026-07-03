import { callAiGateway } from './aiClient';

export type VideoContentClass =
  | 'educational'
  | 'testimonial'
  | 'commercial'
  | 'entertainment'
  | 'course_raw'
  | 'internal'
  | 'archive'
  | 'unknown';

export type VideoImportance = 'high' | 'medium' | 'low';

export type VideoSuggestedUse =
  | 'course_scrape'
  | 'resource_library'
  | 'testimonial_reel'
  | 'commercial_cut'
  | 'social_clip'
  | 'archive_only'
  | 'review_required';

export type VideoUploadAnalysis = {
  id: string;
  fileName: string;
  mimeType: string;
  fileSizeBytes: number;
  durationSec: number;
  width: number;
  height: number;
  aspectRatio: string;
  contentClass: VideoContentClass;
  importance: VideoImportance;
  suggestedUses: VideoSuggestedUse[];
  highLevelSummary: string;
  scrapeHints: string[];
  keyTopics: string[];
  transcriptHint?: string;
  analyzedAt: string;
  /** Persisted blob reference for playback and scrape routing */
  blobRef?: string;
  /** Linked Content Studio asset when routed to production */
  contentStudioAssetId?: string;
};

function aspectLabel(w: number, h: number): string {
  if (!w || !h) return 'unknown';
  const r = w / h;
  if (Math.abs(r - 16 / 9) < 0.08) return '16:9';
  if (Math.abs(r - 9 / 16) < 0.08) return '9:16';
  if (Math.abs(r - 1) < 0.08) return '1:1';
  if (Math.abs(r - 4 / 5) < 0.08) return '4:5';
  return `${w}:${h}`;
}

function classifyFromHeuristics(fileName: string, durationSec: number): {
  contentClass: VideoContentClass;
  importance: VideoImportance;
  suggestedUses: VideoSuggestedUse[];
  keyTopics: string[];
} {
  const name = fileName.toLowerCase();
  const topics: string[] = [];

  if (/testimonial|review|client|success|story/.test(name)) {
    return {
      contentClass: 'testimonial',
      importance: 'high',
      suggestedUses: ['testimonial_reel', 'social_clip', 'commercial_cut'],
      keyTopics: ['client story', 'social proof'],
    };
  }
  if (/commercial|ad|promo|spot|campaign/.test(name)) {
    return {
      contentClass: 'commercial',
      importance: 'high',
      suggestedUses: ['commercial_cut', 'social_clip', 'resource_library'],
      keyTopics: ['brand', 'offer', 'CTA'],
    };
  }
  if (/lesson|course|module|lecture|training|tutorial|edu/.test(name)) {
    topics.push('structured lesson', 'course content');
    return {
      contentClass: durationSec > 300 ? 'course_raw' : 'educational',
      importance: 'high',
      suggestedUses: ['course_scrape', 'resource_library'],
      keyTopics: topics,
    };
  }
  if (/fun|meme|entertain|broll|b-roll/.test(name)) {
    return {
      contentClass: 'entertainment',
      importance: 'low',
      suggestedUses: ['social_clip', 'archive_only'],
      keyTopics: ['b-roll', 'engagement'],
    };
  }
  if (/internal|sop|staff|team/.test(name)) {
    return {
      contentClass: 'internal',
      importance: 'medium',
      suggestedUses: ['review_required', 'archive_only'],
      keyTopics: ['internal ops'],
    };
  }
  if (durationSec > 600) {
    return {
      contentClass: 'course_raw',
      importance: 'medium',
      suggestedUses: ['course_scrape', 'review_required'],
      keyTopics: ['long-form'],
    };
  }
  if (durationSec < 45) {
    return {
      contentClass: 'commercial',
      importance: 'medium',
      suggestedUses: ['social_clip', 'commercial_cut'],
      keyTopics: ['short-form'],
    };
  }
  return {
    contentClass: 'educational',
    importance: 'medium',
    suggestedUses: ['resource_library', 'review_required'],
    keyTopics: ['general'],
  };
}

async function probeVideoMetadata(file: File): Promise<{ durationSec: number; width: number; height: number }> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      const durationSec = Number.isFinite(video.duration) ? Math.round(video.duration) : 0;
      const width = video.videoWidth || 0;
      const height = video.videoHeight || 0;
      URL.revokeObjectURL(url);
      resolve({ durationSec, width, height });
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ durationSec: 0, width: 0, height: 0 });
    };
    video.src = url;
  });
}

async function aiEnhanceSummary(args: {
  fileName: string;
  durationSec: number;
  contentClass: VideoContentClass;
  heuristicSummary: string;
}): Promise<{ summary: string; scrapeHints: string[]; keyTopics: string[] } | null> {
  try {
    const res = await callAiGateway({
      taskType: 'video_upload_intelligence',
      messages: [
        {
          role: 'user',
          content: `Analyze this uploaded video at a high level. fileName=${args.fileName}; durationSec=${args.durationSec}; contentClass=${args.contentClass}; notes=${args.heuristicSummary}. Return JSON only: { "summary": string, "scrapeHints": string[], "keyTopics": string[] }. scrapeHints = course builder actions (chapters, quotes, B-roll, testimonial pulls).`,
        },
      ],
      responseFormat: 'json',
    });
    const text = res.text ?? '';
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start < 0 || end < start) return null;
    const parsed = JSON.parse(text.slice(start, end + 1)) as {
      summary?: string;
      scrapeHints?: string[];
      keyTopics?: string[];
    };
    if (!parsed.summary) return null;
    return {
      summary: String(parsed.summary).slice(0, 600),
      scrapeHints: Array.isArray(parsed.scrapeHints) ? parsed.scrapeHints.slice(0, 8).map(String) : [],
      keyTopics: Array.isArray(parsed.keyTopics) ? parsed.keyTopics.slice(0, 8).map(String) : [],
    };
  } catch {
    return null;
  }
}

export async function analyzeUploadedVideo(
  file: File,
  opts?: { useAi?: boolean; id?: string; blobRef?: string },
): Promise<VideoUploadAnalysis> {
  const meta = await probeVideoMetadata(file);
  const heur = classifyFromHeuristics(file.name, meta.durationSec);
  const heuristicSummary = `Uploaded ${file.name} (${meta.durationSec}s, ${aspectLabel(meta.width, meta.height)}). Classified as ${heur.contentClass.replace(/_/g, ' ')} with ${heur.importance} priority.`;

  let summary = heuristicSummary;
  let scrapeHints = [
    heur.contentClass === 'course_raw' || heur.contentClass === 'educational'
      ? 'Segment into lesson chapters with timestamps for course attach.'
      : 'Review for reusable clips and captions.',
    heur.contentClass === 'testimonial' ? 'Extract pull quotes and before/after narrative beats.' : 'Tag for resource library routing.',
  ];
  let keyTopics = heur.keyTopics;

  if (opts?.useAi !== false) {
    const ai = await aiEnhanceSummary({
      fileName: file.name,
      durationSec: meta.durationSec,
      contentClass: heur.contentClass,
      heuristicSummary,
    });
    if (ai) {
      summary = ai.summary;
      if (ai.scrapeHints.length) scrapeHints = ai.scrapeHints;
      if (ai.keyTopics.length) keyTopics = ai.keyTopics;
    }
  }

  return {
    id: opts?.id ?? `vua_${Date.now().toString(16)}`,
    fileName: file.name,
    mimeType: file.type || 'video/mp4',
    fileSizeBytes: file.size,
    durationSec: meta.durationSec,
    width: meta.width,
    height: meta.height,
    aspectRatio: aspectLabel(meta.width, meta.height),
    contentClass: heur.contentClass,
    importance: heur.importance,
    suggestedUses: heur.suggestedUses,
    highLevelSummary: summary,
    scrapeHints,
    keyTopics,
    analyzedAt: new Date().toISOString(),
    blobRef: opts?.blobRef,
  };
}

export function contentClassLabel(c: VideoContentClass): string {
  const map: Record<VideoContentClass, string> = {
    educational: 'Educational',
    testimonial: 'Testimonial',
    commercial: 'Commercial / ad',
    entertainment: 'Entertainment / B-roll',
    course_raw: 'Course raw footage',
    internal: 'Internal / training',
    archive: 'Archive',
    unknown: 'Unclassified',
  };
  return map[c] ?? c;
}

export function suggestedUseLabel(u: VideoSuggestedUse): string {
  const map: Record<VideoSuggestedUse, string> = {
    course_scrape: 'Scrape for course lessons',
    resource_library: 'Resource library',
    testimonial_reel: 'Testimonial reel',
    commercial_cut: 'Commercial cutdown',
    social_clip: 'Social clip',
    archive_only: 'Archive only',
    review_required: 'Specialist review',
  };
  return map[u] ?? u;
}
