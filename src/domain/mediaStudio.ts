export type Aspect = '16:9' | '9:16' | '1:1';

export type MediaTransition = {
  type: 'cut' | 'fade';
  /** Only used for fade. */
  durationSec?: number;
};

export type MediaCaptionStyle = {
  enabled: boolean;
  position: 'bottom' | 'top';
  backgroundOpacity: number; // 0..1
};

export type MediaRenderPreset = {
  id: string;
  label: string;
  width: number;
  height: number;
  fps: number;
};

export type MediaAudioTrack = {
  id: string;
  kind: 'music' | 'voiceover';
  title: string;
  blobRef: string;
  volume: number; // 0..1
  startSec?: number;
  endSec?: number;
};

export type MediaScene = {
  id: string;
  prompt: string;
  caption: string;
  durationSec: number;
  transition?: MediaTransition;
  /** Optional per-scene VO script (for future TTS / voice pipeline). */
  voiceoverText?: string;
  imageDataUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type MediaAsset = {
  id: string;
  kind: 'image';
  prompt: string;
  dataUrl: string;
  mimeType: string;
  createdAt: string;
};

export type MediaProject = {
  id: string;
  title: string;
  aspect: Aspect;
  stylePreset: 'luxury' | 'modern' | 'cinematic' | 'minimal' | 'bold';
  createdAt: string;
  updatedAt: string;
  scenes: MediaScene[];
  assets?: MediaAsset[];
  renderPresetId?: string;
  captionStyle?: MediaCaptionStyle;
  audioTracks?: MediaAudioTrack[];
  renderHistory?: Array<{
    id: string;
    createdAt: string;
    presetId: string;
    filename: string;
    blobRef?: string;
    note?: string;
  }>;
};

export function nowIso() {
  return new Date().toISOString();
}

export const MEDIA_RENDER_PRESETS: MediaRenderPreset[] = [
  { id: 'webm_720p_30', label: 'WebM 720p • 30fps', width: 1280, height: 720, fps: 30 },
  { id: 'webm_1080p_30', label: 'WebM 1080p • 30fps', width: 1920, height: 1080, fps: 30 },
  { id: 'webm_1080x1920_30', label: 'WebM 1080x1920 • 30fps', width: 1080, height: 1920, fps: 30 },
  { id: 'webm_1024_30', label: 'WebM 1024x1024 • 30fps', width: 1024, height: 1024, fps: 30 },
];

export function aspectToSize(aspect: Aspect): { width: number; height: number; imageSize: '1024x1024' | '1024x1536' | '1536x1024' } {
  if (aspect === '9:16') return { width: 720, height: 1280, imageSize: '1024x1536' };
  if (aspect === '1:1') return { width: 1024, height: 1024, imageSize: '1024x1024' };
  return { width: 1280, height: 720, imageSize: '1536x1024' };
}

