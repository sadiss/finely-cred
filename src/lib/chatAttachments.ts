import { upsertEvidence } from '../data/evidenceRepo';
import type { EvidenceItem } from '../domain/evidence';
import { isSupabaseConfigured } from './supabaseClient';
import { getBlobStore } from '../storage/getBlobStore';
import { newId } from '../utils/ids';

/**
 * Chat attachment pipeline shared by partner Team chat, the AI coach dock, and
 * staff compose boxes.
 *
 * Everything a partner attaches becomes a Documents Vault evidence item, and the
 * message carries the evidence id. The helper exists so every surface reports the
 * same partner-facing errors instead of failing quietly: an oversized file, a
 * blocked bucket, or a cloud upload that silently degraded to browser-only
 * storage all produce a message the partner can act on.
 */

/** Broad enough for phone photos, scans, and office docs partners actually send. */
export const CHAT_ATTACHMENT_ACCEPT =
  'image/*,video/*,audio/*,application/pdf,.pdf,.doc,.docx,.odt,.rtf,.txt,.csv,.xls,.xlsx,.heic,.heif,.zip';

export const MAX_CHAT_ATTACHMENT_BYTES = 25 * 1024 * 1024;

const EXT_MIME: Record<string, string> = {
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  gif: 'image/gif',
  heic: 'image/heic',
  heif: 'image/heif',
  txt: 'text/plain',
  csv: 'text/csv',
  rtf: 'application/rtf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xls: 'application/vnd.ms-excel',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  mp3: 'audio/mpeg',
  m4a: 'audio/mp4',
  wav: 'audio/wav',
};

/** Some OS/browser combos hand us an empty File.type — recover it from the extension. */
export function resolveAttachmentMime(file: { name?: string; type?: string }): string {
  const declared = (file.type || '').trim();
  if (declared) return declared;
  const ext = (file.name || '').toLowerCase().split('.').pop() ?? '';
  return EXT_MIME[ext] ?? 'application/octet-stream';
}

export function formatAttachmentSize(bytes?: number): string {
  const n = Number(bytes ?? 0);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / (1024 * 1024)).toFixed(n < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

export type ChatAttachmentUpload = {
  item: EvidenceItem;
  /** Set when the file saved but is not yet shareable with the team. */
  warning: string | null;
};

export function describeChatAttachmentError(error: unknown): string {
  const raw = (error as Error)?.message?.trim() || '';
  if (!raw) return 'Attachment upload failed. Please try again.';
  if (/row-level security|permission|not authorized|unauthorized|403/i.test(raw)) {
    return `Upload blocked by storage permissions (${raw}). Ask Finely support to confirm your file access, then retry.`;
  }
  if (/bucket not found|404/i.test(raw)) {
    return `Attachment storage is not reachable (${raw}). Your message can still send as text — we'll flag this to Finely support.`;
  }
  if (/payload too large|413|exceeded the maximum/i.test(raw)) {
    return `That file is too large for attachment storage (${raw}). Compress it or send a link instead.`;
  }
  if (/quota|storage is full/i.test(raw)) {
    return `Your browser storage is full (${raw}). Clear space or use Documents Vault, then retry.`;
  }
  if (/network|fetch failed|offline/i.test(raw)) {
    return `Upload failed — connection problem (${raw}). Check your internet and try again.`;
  }
  return `Attachment upload failed: ${raw}`;
}

/**
 * Uploads one chat attachment and registers it in the Documents Vault.
 * Throws a partner-readable Error when nothing was attached.
 */
export async function uploadChatAttachment(args: {
  file: File;
  partnerId?: string;
  caption?: string;
}): Promise<ChatAttachmentUpload> {
  const { file } = args;
  const partnerId = (args.partnerId ?? '').trim();

  if (!partnerId) {
    throw new Error('We could not find your partner file, so the attachment was not sent. Refresh the page and try again.');
  }
  if (!file) {
    throw new Error('No file was selected.');
  }
  if (file.size <= 0) {
    throw new Error(`"${file.name || 'That file'}" is empty (0 bytes) — nothing was attached. Pick a different file.`);
  }
  if (file.size > MAX_CHAT_ATTACHMENT_BYTES) {
    throw new Error(
      `"${file.name || 'That file'}" is ${formatAttachmentSize(file.size)}. Attachments must be ${formatAttachmentSize(
        MAX_CHAT_ATTACHMENT_BYTES,
      )} or smaller — compress it or share a link instead.`,
    );
  }

  const mimeType = resolveAttachmentMime(file);
  const caption = args.caption ?? 'Chat attachment';

  let put: Awaited<ReturnType<ReturnType<typeof getBlobStore>['put']>>;
  try {
    put = await getBlobStore().put(file, {
      partnerId,
      caption,
      scanMode: false,
      kind: 'evidence',
      mimeType,
    });
  } catch (error) {
    throw new Error(describeChatAttachmentError(error));
  }

  if (!put?.ref) {
    throw new Error('Attachment upload failed — storage did not return a file reference. Please try again.');
  }

  const item: EvidenceItem = {
    id: newId('evidence'),
    partnerId,
    type: 'upload',
    source: 'upload',
    caption,
    filename: file.name || 'attachment',
    mimeType,
    sizeBytes: file.size,
    blobRef: put.ref,
    createdAt: new Date().toISOString(),
  };
  upsertEvidence(item);

  // Cloud upload was rejected and we fell back to this browser: the message would
  // look sent while the team could never open the file. Say so out loud.
  const warning =
    put.localOnly && isSupabaseConfigured
      ? `Saved on this device only — cloud upload was blocked${
          put.primaryError ? ` (${put.primaryError})` : ''
        }. Your Finely team may not be able to open it, so retry once you're back online.`
      : null;

  return { item, warning };
}
