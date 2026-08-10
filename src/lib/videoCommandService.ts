import type {
  VideoCommandDestinationMode,
  VideoCommandRecord,
  VideoCommandWorkflowStep,
} from '../domain/videoCommandRecord';
import { nextVideoCommandWorkflowStep } from '../domain/videoCommandRecord';
import {
  createVideoCommandRecord,
  findVideoCommandRecordByUploadAnalysis,
  getVideoCommandRecord,
  upsertVideoCommandRecord,
} from '../data/videoCommandRecordRepo';
import { buildVideoUtmContent } from './leadAcquisitionCatalog';
import { saveVideoUploadAnalysis } from '../data/videoUploadAnalysisRepo';
import { getResourceVideo, upsertResourceVideo } from '../data/resourceVideosRepo';
import { saveContentStudioAsset } from '../features/studioCommandOs/contentStudioRepo';
import type { VideoUploadAnalysis } from './videoUploadIntelligence';

/** Live = routed resource exists and is public on the resource library. */
export function isVideoCommandRecordLive(record: VideoCommandRecord): boolean {
  if (!record.resourceVideoId) return false;
  return Boolean(getResourceVideo(record.resourceVideoId)?.isPublic);
}

export function ensureVideoCommandRecordForAnalysis(analysis: VideoUploadAnalysis): VideoCommandRecord {
  const existing = findVideoCommandRecordByUploadAnalysis(analysis.id);
  if (existing) return existing;
  return createVideoCommandRecord({
    title: analysis.fileName,
    uploadAnalysisId: analysis.id,
    lifecycle: 'import',
  });
}

export function advanceVideoCommandWorkflow(
  recordId: string,
  lifecycle: VideoCommandWorkflowStep,
): VideoCommandRecord | null {
  return upsertVideoCommandRecord(recordId, { lifecycle });
}

export function advanceVideoCommandWorkflowNext(recordId: string): VideoCommandRecord | null {
  const record = getVideoCommandRecord(recordId);
  if (!record) return null;
  const next = nextVideoCommandWorkflowStep(record.lifecycle);
  if (!next) return record;
  return upsertVideoCommandRecord(recordId, { lifecycle: next });
}

export function defaultUtmForVideoCommand(record: VideoCommandRecord): {
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  utmContent: string;
} {
  const videoKey = record.resourceVideoId ?? record.id;
  return {
    utmSource: record.utmSource ?? 'video_studio',
    utmMedium: record.utmMedium ?? 'upload_workflow',
    utmCampaign: record.utmCampaign ?? `video_${videoKey.slice(0, 24)}`,
    utmContent: record.utmContent ?? buildVideoUtmContent(videoKey),
  };
}

export function applyDefaultUtmToRecord(recordId: string): VideoCommandRecord | null {
  const record = getVideoCommandRecord(recordId);
  if (!record) return null;
  const utm = defaultUtmForVideoCommand(record);
  return upsertVideoCommandRecord(recordId, {
    utmSource: utm.utmSource,
    utmMedium: utm.utmMedium,
    utmCampaign: utm.utmCampaign,
    utmContent: utm.utmContent,
  });
}

/** Growth agent Hannah — tracked links for syndication. */
export function promoteVideoIdForRecord(record: VideoCommandRecord): string {
  return record.resourceVideoId ?? record.id;
}

export function buildVideoCommandPromoteUrl(record: VideoCommandRecord): string {
  const videoId = promoteVideoIdForRecord(record);
  const params = new URLSearchParams({
    videoId,
    utm_content: buildVideoUtmContent(videoId),
  });
  return `/admin/growth-agents/capture-links?${params.toString()}`;
}

export async function routeUploadAnalysisToProduction(args: {
  analysis: VideoUploadAnalysis;
  mode: VideoCommandDestinationMode;
  recordId?: string;
  skipNavigate?: boolean;
  navigate?: (path: string) => void;
}): Promise<{
  record: VideoCommandRecord;
  assetId: string;
  resourceVideoId: string;
  analysis: VideoUploadAnalysis;
}> {
  const { analysis, mode } = args;
  if (!analysis.blobRef) {
    throw new Error('No stored video for this analysis — re-upload the file.');
  }

  const record =
    args.recordId
      ? getVideoCommandRecord(args.recordId)
      : ensureVideoCommandRecordForAnalysis(analysis);
  if (!record) {
    throw new Error('Video command record not found.');
  }

  const asset = saveContentStudioAsset({
    title: analysis.fileName.replace(/\.[^.]+$/, ''),
    assetType: 'video',
    status: 'needs_review',
    provider: 'manual',
    blobRef: analysis.blobRef,
    summary: analysis.highLevelSummary,
    transcript: analysis.scrapeHints.join('\n'),
    publishTargets:
      mode === 'course'
        ? (['course_lesson', 'resources'] as const)
        : mode === 'testimonial'
          ? (['lead_magnet_hero', 'resources'] as const)
          : (['resources', 'download_only'] as const),
    complianceNotes: ['Uploaded footage — review claims, captions, and rights before publishing.'],
  });

  const resource = upsertResourceVideo({
    title: `${analysis.fileName} (upload intelligence)`,
    desc: analysis.highLevelSummary,
    blobRef: analysis.blobRef,
    mimeType: analysis.mimeType,
    tags: ['upload-intelligence', analysis.contentClass, ...analysis.keyTopics.slice(0, 3)],
    isPublic: false,
  });

  const patchedAnalysis: VideoUploadAnalysis = { ...analysis, contentStudioAssetId: asset.id };
  saveVideoUploadAnalysis(patchedAnalysis);

  const withLinks = upsertVideoCommandRecord(record.id, {
    uploadAnalysisId: analysis.id,
    resourceVideoId: resource.id,
    contentStudioAssetId: asset.id,
    destinationMode: mode,
    lifecycle: 'publish',
  });
  if (!withLinks) {
    throw new Error('Failed to update video command record.');
  }

  const withUtm = applyDefaultUtmToRecord(withLinks.id) ?? withLinks;

  if (!args.skipNavigate && args.navigate) {
    if (mode === 'course') {
      args.navigate(`/admin/content-studio?room=course_videos&assetId=${asset.id}`);
    } else {
      args.navigate(`/admin/content-studio?room=assets&assetId=${asset.id}`);
    }
  }

  return {
    record: withUtm,
    assetId: asset.id,
    resourceVideoId: resource.id,
    analysis: patchedAnalysis,
  };
}
