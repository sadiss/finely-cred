import type { VideoCommandRecord } from '../../domain/videoCommandRecord';
import { getVideoCommandRecord, listVideoCommandRecords } from '../../data/videoCommandRecordRepo';
import { getResourceVideo } from '../../data/resourceVideosRepo';
import { getVideoUploadAnalysis } from '../../data/videoUploadAnalysisRepo';
import { listContentStudioAssets } from '../studioCommandOs/contentStudioRepo';
import type { VideoUploadAnalysis } from '../../lib/videoUploadIntelligence';
import { promoteVideoIdForRecord } from '../../lib/videoCommandService';
import { getGrowthWeekFocus } from './growthWeekFocus';

/** Latest command records tied to a public or private (draft) resource, or in-flight upload workflow. */
export function listLatestPillarVideoCommandRecords(limit = 6): VideoCommandRecord[] {
  return listVideoCommandRecords()
    .filter((r) => {
      if (r.uploadAnalysisId) return true;
      if (!r.resourceVideoId) return false;
      return Boolean(getResourceVideo(r.resourceVideoId));
    })
    .slice(0, limit);
}

export function resolveGrowthPillarVideoRecord(pillarVideoId?: string): VideoCommandRecord | null {
  const key = (pillarVideoId ?? getGrowthWeekFocus().pillarVideoId ?? '').trim();
  if (key) {
    return (
      getVideoCommandRecord(key) ??
      listVideoCommandRecords().find((r) => r.resourceVideoId === key || r.id === key) ??
      null
    );
  }
  return listLatestPillarVideoCommandRecords(1)[0] ?? null;
}

export function analysisForVideoCommandRecord(record: VideoCommandRecord): VideoUploadAnalysis | null {
  if (!record.uploadAnalysisId) return null;
  return getVideoUploadAnalysis(record.uploadAnalysisId);
}

export function buildGrowthShortsPack(args: {
  record: VideoCommandRecord;
  analysis?: VideoUploadAnalysis | null;
  captureUrl?: string;
}): string {
  const { record } = args;
  const analysis = args.analysis ?? analysisForVideoCommandRecord(record);
  const title = record.title.trim() || 'Pillar video';
  const topics = analysis?.keyTopics?.length ? analysis.keyTopics : [title];
  const hook = topics[0] ?? title;
  const link = args.captureUrl?.trim() || '(copy Hannah guide link with video utm_content)';
  const lines = [
    `SHORTS PACK — ${title}`,
    '',
    'Hook A (3s):',
    `Most partners miss this before disputing: ${hook}.`,
    '',
    'Hook B:',
    `${analysis?.highLevelSummary?.slice(0, 120) || hook} — results vary · educational only.`,
    '',
    'Caption:',
    `${topics.slice(0, 3).join(' · ')}. Not legal advice · funding subject to underwriting.`,
    `Tracked guide → ${link}`,
    '',
    'Hashtags: #CreditEducation #FinelyCred #DisputeWorkflow',
  ];
  return lines.join('\n');
}

export function buildGrowthPillarScript(args: {
  record: VideoCommandRecord;
  analysis?: VideoUploadAnalysis | null;
}): string {
  const { record } = args;
  const analysis = args.analysis ?? analysisForVideoCommandRecord(record);
  const asset = record.contentStudioAssetId
    ? listContentStudioAssets().find((a) => a.id === record.contentStudioAssetId)
    : null;
  const fromAsset = (asset?.script || asset?.summary || asset?.transcript || '').trim();
  if (fromAsset) return fromAsset;

  const title = record.title.trim() || 'Pillar video';
  const summary = analysis?.highLevelSummary?.trim() || 'Outline from upload intelligence.';
  const beats = analysis?.scrapeHints?.length
    ? analysis.scrapeHints.slice(0, 6)
    : (analysis?.keyTopics ?? []).map((t) => `Beat: ${t}`);

  return [
    `SCRIPT — ${title}`,
    '',
    'OPEN:',
    summary,
    '',
    'BEATS:',
    ...beats.map((b, i) => `${i + 1}. ${b}`),
    '',
    'CLOSE:',
    'Book a strategy session when you want live help — results vary · not legal advice.',
  ].join('\n');
}

export function buildGrowthHuntQueryFromPillar(record: VideoCommandRecord, city: string): string {
  const analysis = analysisForVideoCommandRecord(record);
  const topic = analysis?.keyTopics?.[0]?.trim() || record.title.trim() || 'credit restore help';
  const place = (city || getGrowthWeekFocus().city || 'United States').trim();
  return `${topic} ${place}`.replace(/\s+/g, ' ').trim();
}

export function promoteVideoIdForGrowthRecord(record: VideoCommandRecord): string {
  return promoteVideoIdForRecord(record);
}
