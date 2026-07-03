import { getBlobStore } from '../../storage/getBlobStore';
import { renderVoiceAsset, getVoiceStudioStatus } from '../../lib/voiceStudioClient';
import type { GuideNarration } from '../../resources/guideNarration';
import type { VideoCommandPlan } from './types';
import { saveContentStudioAsset } from './contentStudioRepo';

export function narrationFromPlainScript(args: {
  contentId: string;
  title: string;
  script: string;
  voiceDirection?: string;
}): GuideNarration {
  const chunks = args.script
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  return {
    guideId: args.contentId,
    title: args.title,
    intro: chunks[0] ?? args.script.slice(0, 120),
    voiceDirection:
      args.voiceDirection ??
      'Premium Finely Cred narration: warm authority, compliance-safe, no hype or guaranteed outcomes.',
    segments: chunks.map((text, idx) => ({
      text,
      pauseMs: idx === chunks.length - 1 ? 1200 : 900,
      rate: 0.92,
      direction: 'clear, human pacing',
    })),
  };
}

export function scriptFromVideoPlan(plan: VideoCommandPlan): string {
  const lines = plan.scenes
    .map((s) => s.voiceover?.trim())
    .filter(Boolean) as string[];
  if (lines.length) return lines.join('\n\n');
  return [plan.hook, ...plan.scenes.map((s) => s.caption).filter(Boolean), plan.cta].filter(Boolean).join('\n\n');
}

export async function renderContentStudioNarration(args: {
  jobId?: string;
  contentId: string;
  title: string;
  script: string;
  voiceDirection?: string;
}): Promise<{ blobRef: string; assetId: string }> {
  const status = getVoiceStudioStatus();
  if (!status.available) throw new Error(status.reason || 'Voice Studio unavailable. Configure Supabase + ELEVENLABS_API_KEY.');

  const narration = narrationFromPlainScript(args);
  const rendered = await renderVoiceAsset({
    contentType: 'content_studio',
    contentId: args.contentId,
    title: args.title,
    narration,
    force: true,
  });

  let blobRef = rendered.asset.blobRef;
  if (!blobRef && rendered.url.startsWith('blob:')) {
    const res = await fetch(rendered.url);
    const blob = await res.blob();
    const store = getBlobStore();
    const put = await store.put(blob, { kind: 'content_studio_voice', contentId: args.contentId, title: args.title });
    blobRef = put.ref;
  }

  if (!blobRef) throw new Error('Voice rendered but could not be saved to local vault.');

  const asset = saveContentStudioAsset({
    jobId: args.jobId,
    title: `${args.title} narration`,
    assetType: 'audio',
    status: 'needs_review',
    provider: 'elevenlabs',
    blobRef,
    script: args.script,
    summary: 'ElevenLabs / Voice Studio narration — review before publishing.',
    publishTargets: ['download_only'],
    complianceNotes: ['Review credit/funding claims in spoken script before external use.'],
  });

  rendered.revoke?.();
  return { blobRef, assetId: asset.id };
}
