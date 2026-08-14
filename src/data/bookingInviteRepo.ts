import type { BookingInvite, BookingInviteStatus, ConsultationTopic, SlotDuration } from '../domain/calendar';
import { nowIso } from '../domain/calendar';
import { loadJson, saveJson } from './localJsonStore';
import { newId } from '../utils/ids';
import { createNotification } from './notificationsRepo';

const KEY = 'finely.booking_invites.v1';

function loadInvites(): BookingInvite[] {
  return loadJson<BookingInvite[]>(KEY, [], 1);
}

function saveInvites(rows: BookingInvite[]) {
  saveJson(KEY, rows, 1);
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('finely:store'));
}

function tokenFromId(id: string): string {
  return id.replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
}

function isExpired(inv: BookingInvite, now = new Date()): boolean {
  if (inv.status === 'revoked') return true;
  if (inv.useCount >= inv.maxUses) return true;
  if (inv.expiresAt) {
    const ms = Date.parse(inv.expiresAt);
    if (Number.isFinite(ms) && ms < now.getTime()) return true;
  }
  return false;
}

export function listBookingInvites(): BookingInvite[] {
  return loadInvites().slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getBookingInvite(id: string): BookingInvite | null {
  return loadInvites().find((r) => r.id === id) ?? null;
}

export function getBookingInviteByToken(token: string): BookingInvite | null {
  const key = (token || '').trim();
  if (!key) return null;
  const row = loadInvites().find((r) => r.token === key) ?? null;
  if (!row) return null;
  if (isExpired(row)) {
    if (row.status === 'active') {
      return setBookingInviteStatus(row.id, 'expired');
    }
    return row;
  }
  return row;
}

export function createBookingInvite(args: {
  label?: string;
  topic?: ConsultationTopic;
  durationMinutes?: SlotDuration;
  crmRecordId?: string;
  leadId?: string;
  partnerId?: string;
  guestName?: string;
  guestEmail?: string;
  guestPhone?: string;
  audience?: import('../domain/calendar').BookingInviteAudience;
  expiresAt?: string;
  maxUses?: number;
}): BookingInvite {
  const now = nowIso();
  const id = newId('binv');
  const inv: BookingInvite = {
    id,
    token: tokenFromId(id),
    label: (args.label || '').trim() || undefined,
    topic: args.topic ?? 'enlightenment',
    durationMinutes: args.durationMinutes ?? 30,
    crmRecordId: args.crmRecordId?.trim() || undefined,
    leadId: args.leadId?.trim() || undefined,
    partnerId: args.partnerId?.trim() || undefined,
    guestName: (args.guestName || '').trim() || undefined,
    guestEmail: (args.guestEmail || '').trim() || undefined,
    guestPhone: (args.guestPhone || '').trim() || undefined,
    audience: args.audience ?? (args.partnerId ? 'partner' : 'guest'),
    emailStatus: 'not_sent',
    expiresAt: args.expiresAt,
    maxUses: Math.max(1, Math.round(args.maxUses ?? 1)),
    useCount: 0,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };
  const next = [inv, ...loadInvites()];
  saveInvites(next);
  createNotification({
    partnerId: 'admin',
    audience: 'admin',
    kind: 'calendar_request',
    title: 'Self-book invite created',
    body: inv.label || inv.guestEmail || inv.guestName || inv.topic,
    href: '/admin/calendar',
    meta: { inviteId: inv.id, token: inv.token },
  });
  return inv;
}

export function setBookingInviteStatus(id: string, status: BookingInviteStatus): BookingInvite | null {
  const rows = loadInvites();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const next = { ...rows[idx]!, status, updatedAt: nowIso() };
  rows[idx] = next;
  saveInvites(rows);
  return next;
}

export function revokeBookingInvite(id: string): BookingInvite | null {
  return setBookingInviteStatus(id, 'revoked');
}

export function markBookingInviteEmail(
  id: string,
  patch: { status: import('../domain/calendar').BookingInviteEmailStatus; error?: string },
): BookingInvite | null {
  const rows = loadInvites();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const next: BookingInvite = {
    ...rows[idx]!,
    emailStatus: patch.status,
    emailError: patch.status === 'failed' ? patch.error : undefined,
    emailSentAt: patch.status === 'sent' ? nowIso() : rows[idx]!.emailSentAt,
    updatedAt: nowIso(),
  };
  rows[idx] = next;
  saveInvites(rows);
  return next;
}

export function markBookingInviteUsed(args: {
  inviteId: string;
  eventId: string;
}): BookingInvite | null {
  const rows = loadInvites();
  const idx = rows.findIndex((r) => r.id === args.inviteId);
  if (idx < 0) return null;
  const prev = rows[idx]!;
  const useCount = prev.useCount + 1;
  const status: BookingInviteStatus =
    useCount >= prev.maxUses ? 'expired' : prev.status === 'revoked' ? 'revoked' : 'active';
  const next: BookingInvite = {
    ...prev,
    useCount,
    status,
    lastEventId: args.eventId,
    lastUsedAt: nowIso(),
    updatedAt: nowIso(),
  };
  rows[idx] = next;
  saveInvites(rows);
  return next;
}

export function buildBookingInvitePath(token: string): string {
  return `/book/i/${encodeURIComponent(token)}`;
}
