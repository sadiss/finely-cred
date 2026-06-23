import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import type { MediaAsset, MediaAudioTrack, MediaProject, MediaScene } from '../domain/mediaStudio';
import { nowIso } from '../domain/mediaStudio';
import { MEDIA_RENDER_PRESETS } from '../domain/mediaStudio';

const KEY = 'finely.media_studio.v1';
const VERSION = 1;

type Store = { projects: MediaProject[] };

function loadStore(): Store {
  return loadJson<Store>(KEY, { projects: [] }, VERSION);
}

function saveStore(store: Store) {
  saveJson(KEY, store, VERSION);
}

export function listMediaProjects(): MediaProject[] {
  const store = loadStore();
  let changed = false;
  const normalized = store.projects.map((p) => {
    const next: MediaProject = {
      ...p,
      assets: (p.assets ?? []) as any,
      audioTracks: Array.isArray((p as any).audioTracks) ? ((p as any).audioTracks as any) : [],
      captionStyle: (p as any).captionStyle ?? { enabled: true, position: 'bottom', backgroundOpacity: 0.55 },
      renderPresetId:
        String((p as any).renderPresetId || '').trim() ||
        (MEDIA_RENDER_PRESETS[0]?.id ?? 'webm_720p_30'),
      renderHistory: Array.isArray((p as any).renderHistory) ? ((p as any).renderHistory as any) : [],
      videoProvider: (p as any).videoProvider ?? 'browser_slideshow',
      voiceProvider: (p as any).voiceProvider ?? 'manual_upload',
      characterRefs: Array.isArray((p as any).characterRefs) ? ((p as any).characterRefs as any) : [],
    };
    if (
      (p as any).audioTracks !== next.audioTracks ||
      (p as any).captionStyle !== next.captionStyle ||
      (p as any).renderPresetId !== next.renderPresetId ||
      (p as any).renderHistory !== next.renderHistory ||
      (p as any).assets !== next.assets ||
      (p as any).videoProvider !== next.videoProvider ||
      (p as any).voiceProvider !== next.voiceProvider ||
      (p as any).characterRefs !== next.characterRefs
    ) {
      changed = true;
    }
    return next;
  });
  if (changed) {
    store.projects = normalized;
    saveStore(store);
  }
  return normalized.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function getMediaProject(id: string): MediaProject | undefined {
  const store = loadStore();
  return store.projects.find((p) => p.id === id);
}

export function createMediaProject(args?: Partial<Pick<MediaProject, 'title' | 'aspect' | 'stylePreset'>>): MediaProject {
  const store = loadStore();
  const now = nowIso();
  const project: MediaProject = {
    id: newId('media'),
    title: (args?.title || '').trim() || 'New Media Project',
    aspect: args?.aspect ?? '16:9',
    stylePreset: args?.stylePreset ?? 'luxury',
    createdAt: now,
    updatedAt: now,
    scenes: [],
    assets: [],
    audioTracks: [],
    captionStyle: { enabled: true, position: 'bottom', backgroundOpacity: 0.55 },
    renderPresetId: MEDIA_RENDER_PRESETS[0]?.id ?? 'webm_720p_30',
    renderHistory: [],
    videoProvider: 'browser_slideshow',
    voiceProvider: 'manual_upload',
    characterRefs: [],
  };
  store.projects.unshift(project);
  saveStore(store);
  return project;
}

export function upsertMediaProject(project: MediaProject): MediaProject {
  const store = loadStore();
  const now = nowIso();
  const next: MediaProject = {
    ...project,
    assets: (project.assets ?? []) as any,
    audioTracks: Array.isArray((project as any).audioTracks) ? ((project as any).audioTracks as any) : [],
    captionStyle: (project as any).captionStyle ?? { enabled: true, position: 'bottom', backgroundOpacity: 0.55 },
    renderPresetId:
      String((project as any).renderPresetId || '').trim() ||
      (MEDIA_RENDER_PRESETS[0]?.id ?? 'webm_720p_30'),
    renderHistory: Array.isArray((project as any).renderHistory) ? ((project as any).renderHistory as any) : [],
    videoProvider: (project as any).videoProvider ?? 'browser_slideshow',
    voiceProvider: (project as any).voiceProvider ?? 'manual_upload',
    characterRefs: Array.isArray((project as any).characterRefs) ? ((project as any).characterRefs as any) : [],
    updatedAt: now,
  };
  const idx = store.projects.findIndex((p) => p.id === next.id);
  if (idx >= 0) store.projects[idx] = next;
  else store.projects.unshift(next);
  saveStore(store);
  return next;
}

export function deleteMediaProject(id: string) {
  const store = loadStore();
  store.projects = store.projects.filter((p) => p.id !== id);
  saveStore(store);
}

export function addScene(projectId: string, args?: Partial<Pick<MediaScene, 'prompt' | 'caption' | 'durationSec'>>): MediaProject {
  const project = getMediaProject(projectId);
  if (!project) throw new Error('Project not found');
  const now = nowIso();
  const scene: MediaScene = {
    id: newId('scene'),
    prompt: (args?.prompt || '').trim() || 'Luxurious modern building exterior, golden hour, premium, ultra-realistic',
    caption: (args?.caption || '').trim() || 'Your caption here',
    durationSec: Math.max(1, Math.min(12, Math.round(args?.durationSec ?? 4))),
    imageDataUrl: undefined,
    createdAt: now,
    updatedAt: now,
  };
  return upsertMediaProject({ ...project, scenes: [...project.scenes, scene] });
}

export function patchScene(projectId: string, sceneId: string, patch: Partial<Omit<MediaScene, 'id' | 'createdAt'>>): MediaProject {
  const project = getMediaProject(projectId);
  if (!project) throw new Error('Project not found');
  const now = nowIso();
  const scenes = project.scenes.map((s) => (s.id === sceneId ? { ...s, ...patch, updatedAt: now } : s));
  return upsertMediaProject({ ...project, scenes, assets: project.assets ?? [] });
}

export function deleteScene(projectId: string, sceneId: string): MediaProject {
  const project = getMediaProject(projectId);
  if (!project) throw new Error('Project not found');
  return upsertMediaProject({ ...project, scenes: project.scenes.filter((s) => s.id !== sceneId), assets: project.assets ?? [] });
}

export function reorderScene(projectId: string, sceneId: string, dir: 'up' | 'down'): MediaProject {
  const project = getMediaProject(projectId);
  if (!project) throw new Error('Project not found');
  const idx = project.scenes.findIndex((s) => s.id === sceneId);
  if (idx < 0) return project;
  const next = [...project.scenes];
  const j = dir === 'up' ? idx - 1 : idx + 1;
  if (j < 0 || j >= next.length) return project;
  const tmp = next[idx];
  next[idx] = next[j];
  next[j] = tmp;
  return upsertMediaProject({ ...project, scenes: next, assets: project.assets ?? [] });
}

export function addAsset(projectId: string, asset: Omit<MediaAsset, 'id' | 'createdAt'> & { id?: string; createdAt?: string }): MediaProject {
  const project = getMediaProject(projectId);
  if (!project) throw new Error('Project not found');
  const now = nowIso();
  const created: MediaAsset = {
    id: asset.id ?? newId('asset'),
    kind: 'image',
    prompt: (asset.prompt || '').trim(),
    dataUrl: asset.dataUrl,
    mimeType: asset.mimeType || 'image/png',
    createdAt: asset.createdAt ?? now,
  };
  return upsertMediaProject({ ...project, assets: [created, ...((project.assets ?? []) as any)] });
}

export function deleteAsset(projectId: string, assetId: string): MediaProject {
  const project = getMediaProject(projectId);
  if (!project) throw new Error('Project not found');
  const next = (project.assets ?? []).filter((a) => a.id !== assetId);
  return upsertMediaProject({ ...project, assets: next });
}

export function addAudioTrack(
  projectId: string,
  track: Omit<MediaAudioTrack, 'id'> & { id?: string },
): MediaProject {
  const project = getMediaProject(projectId);
  if (!project) throw new Error('Project not found');
  const created: MediaAudioTrack = {
    id: track.id ?? newId('audio'),
    kind: track.kind,
    title: (track.title || '').trim() || (track.kind === 'music' ? 'Music track' : 'Voiceover'),
    blobRef: track.blobRef,
    volume: Math.max(0, Math.min(1, Number(track.volume ?? 0.35))),
    startSec: track.startSec != null ? Math.max(0, Number(track.startSec) || 0) : undefined,
    endSec: track.endSec != null ? Math.max(0, Number(track.endSec) || 0) : undefined,
  };
  const next = [created, ...(project.audioTracks ?? [])];
  return upsertMediaProject({ ...project, audioTracks: next });
}

export function patchAudioTrack(projectId: string, trackId: string, patch: Partial<Omit<MediaAudioTrack, 'id'>>): MediaProject {
  const project = getMediaProject(projectId);
  if (!project) throw new Error('Project not found');
  const next = (project.audioTracks ?? []).map((t) => (t.id === trackId ? { ...t, ...patch } : t));
  return upsertMediaProject({ ...project, audioTracks: next });
}

export function deleteAudioTrack(projectId: string, trackId: string): MediaProject {
  const project = getMediaProject(projectId);
  if (!project) throw new Error('Project not found');
  const next = (project.audioTracks ?? []).filter((t) => t.id !== trackId);
  return upsertMediaProject({ ...project, audioTracks: next });
}

export function addRenderHistory(projectId: string, entry: { presetId: string; filename: string; blobRef?: string; note?: string }): MediaProject {
  const project = getMediaProject(projectId);
  if (!project) throw new Error('Project not found');
  const now = nowIso();
  const next = [
    { id: newId('render'), createdAt: now, presetId: entry.presetId, filename: entry.filename, blobRef: entry.blobRef, note: entry.note },
    ...((project.renderHistory ?? []) as any),
  ].slice(0, 50);
  return upsertMediaProject({ ...project, renderHistory: next });
}
