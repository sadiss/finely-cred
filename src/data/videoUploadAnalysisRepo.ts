import type { VideoUploadAnalysis } from '../lib/videoUploadIntelligence';

const KEY = 'finely:video_upload_analyses';

function readAll(): VideoUploadAnalysis[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as VideoUploadAnalysis[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(rows: VideoUploadAnalysis[]) {
  localStorage.setItem(KEY, JSON.stringify(rows.slice(0, 200)));
  window.dispatchEvent(new CustomEvent('finely:store', { detail: { key: KEY } }));
}

export function listVideoUploadAnalyses(): VideoUploadAnalysis[] {
  return readAll().sort((a, b) => b.analyzedAt.localeCompare(a.analyzedAt));
}

export function getVideoUploadAnalysis(id: string): VideoUploadAnalysis | null {
  return readAll().find((r) => r.id === id) ?? null;
}

export function saveVideoUploadAnalysis(analysis: VideoUploadAnalysis): VideoUploadAnalysis {
  const rows = readAll().filter((r) => r.id !== analysis.id);
  rows.unshift(analysis);
  writeAll(rows);
  return analysis;
}

export function deleteVideoUploadAnalysis(id: string): void {
  writeAll(readAll().filter((r) => r.id !== id));
}
