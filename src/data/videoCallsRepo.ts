import type { CreateInstantVideoCallArgs, VideoCallRecord } from '../domain/videoCalls';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import { buildFinelyMeetingEmbedUrl, buildFinelyMeetingUrl, meetingRoomName } from '../lib/meetingUrls';

const KEY = 'finely.videoCalls.v1';

function nowIso() {
  return new Date().toISOString();
}

function load(): VideoCallRecord[] {
  return loadJson<VideoCallRecord[]>(KEY, [], 1);
}

function save(rows: VideoCallRecord[]) {
  saveJson(KEY, rows, 1);
  window.dispatchEvent(new CustomEvent('finely:store', { detail: { key: KEY } }));
}

export function listVideoCallsByPartner(partnerId: string): VideoCallRecord[] {
  return load()
    .filter((c) => c.partnerId === partnerId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getVideoCall(id: string): VideoCallRecord | null {
  return load().find((c) => c.id === id) ?? null;
}

export function createInstantVideoCall(args: CreateInstantVideoCallArgs): VideoCallRecord {
  const id = newId('vcall');
  const roomName = meetingRoomName(id);
  const pin = String(Math.floor(100000 + Math.random() * 900000));
  const record: VideoCallRecord = {
    id,
    partnerId: args.partnerId,
    threadId: args.threadId,
    title: args.title.trim() || 'Finely video call',
    roomName,
    meetingUrl: buildFinelyMeetingUrl(id, args.title),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    createdBy: args.createdBy,
    participants: args.participants,
    status: 'active',
    roomPin: pin,
  };
  save([record, ...load()]);
  return record;
}

export function endVideoCall(id: string): VideoCallRecord | null {
  const rows = load();
  const idx = rows.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  const updated = { ...rows[idx]!, status: 'ended' as const, updatedAt: nowIso() };
  rows[idx] = updated;
  save(rows);
  return updated;
}

export function buildJoinUrl(call: VideoCallRecord, displayName: string, email?: string): string {
  return buildFinelyMeetingEmbedUrl({
    roomName: call.roomName,
    displayName,
    email,
    subject: call.title,
    roomPassword: call.roomPin,
  });
}

export function formatVideoCallInviteMessage(call: VideoCallRecord, joinPath: string): string {
  const roles = call.participants.map((p) => p.label).join(', ');
  return [
    `📹 Instant video room opened: ${call.title}`,
    `Participants: ${roles}`,
    call.roomPin ? `Room PIN (if prompted): ${call.roomPin}` : null,
    `Join: ${typeof window !== 'undefined' ? `${window.location.origin}${joinPath}` : joinPath}`,
  ]
    .filter(Boolean)
    .join('\n');
}
