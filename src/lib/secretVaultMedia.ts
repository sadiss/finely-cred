import type { SecretVaultMediaKind } from '../domain/secretVault';

const YOUTUBE_RE =
  /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/i;

export function parseYoutubeId(url: string): string | null {
  const m = url.trim().match(YOUTUBE_RE);
  return m?.[1] ?? null;
}

export function classifyMediaFromFile(file: { name: string; type?: string }): SecretVaultMediaKind {
  const name = (file.name || '').toLowerCase();
  const mime = (file.type || '').toLowerCase();
  if (mime.startsWith('video/') || /\.(mp4|webm|mov|mkv|avi)$/.test(name)) return 'video_upload';
  if (mime.startsWith('audio/') || /\.(mp3|wav|m4a|aac|ogg|flac)$/.test(name)) return 'audio';
  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|heic)$/.test(name)) return 'image';
  if (/\.(epub|mobi|azw3?)$/.test(name)) return 'ebook';
  if (/\.pdf$/.test(name) || mime.includes('pdf')) return name.includes('guide') || name.includes('ebook') ? 'ebook' : 'document';
  if (/\.(zip|rar|7z|tar|gz)$/.test(name)) return 'archive';
  if (mime.includes('word') || mime.includes('document') || /\.(docx?|txt|rtf|odt)$/.test(name)) return 'document';
  return 'other';
}

export function classifyMediaFromUrl(url: string): { mediaKind: SecretVaultMediaKind; youtubeId?: string } {
  const yt = parseYoutubeId(url);
  if (yt) return { mediaKind: 'youtube', youtubeId: yt };
  const u = url.toLowerCase();
  if (/\.(mp4|webm|mov)(\?|$)/.test(u)) return { mediaKind: 'video' };
  if (/\.(mp3|wav|m4a)(\?|$)/.test(u)) return { mediaKind: 'audio' };
  if (/\.(pdf|epub)(\?|$)/.test(u)) return { mediaKind: 'ebook' };
  return { mediaKind: 'url' };
}

export function vaultAcceptString(): string {
  return [
    'application/pdf',
    'application/epub+zip',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'audio/*',
    'video/*',
    'image/*',
    '.pdf,.epub,.doc,.docx,.mp3,.wav,.m4a,.mp4,.webm,.mov,.png,.jpg,.jpeg,.zip',
  ].join(',');
}

export function youtubeEmbedUrl(youtubeId: string): string {
  return `https://www.youtube.com/embed/${encodeURIComponent(youtubeId)}`;
}

export function youtubeThumbnail(youtubeId: string): string {
  return `https://img.youtube.com/vi/${encodeURIComponent(youtubeId)}/hqdefault.jpg`;
}
