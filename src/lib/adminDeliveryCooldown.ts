/** Tracks recent admin outbound actions per partner (invite, reset, welcome, message). */

export type AdminDeliveryKind =
  | 'invite'
  | 'invite_resend'
  | 'password_reset'
  | 'welcome'
  | 'partner_message';

const STORAGE_KEY = 'finely.admin.deliveryLog.v1';

const COOLDOWN_MS: Record<AdminDeliveryKind, number> = {
  invite: 5 * 60 * 1000,
  invite_resend: 2 * 60 * 1000,
  password_reset: 5 * 60 * 1000,
  welcome: 5 * 60 * 1000,
  partner_message: 60 * 1000,
};

type Entry = { at: string; kind: AdminDeliveryKind };

type Store = Record<string, Entry[]>;

function load(): Store {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') as Store;
  } catch {
    return {};
  }
}

function save(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* ignore */
  }
}

function partnerKey(partnerId: string) {
  return partnerId.trim();
}

export function recordAdminDelivery(partnerId: string, kind: AdminDeliveryKind) {
  const id = partnerKey(partnerId);
  if (!id) return;
  const store = load();
  const prev = store[id] ?? [];
  const next = [{ at: new Date().toISOString(), kind }, ...prev].slice(0, 24);
  store[id] = next;
  save(store);
}

export function lastAdminDelivery(partnerId: string, kind: AdminDeliveryKind): string | null {
  const id = partnerKey(partnerId);
  if (!id) return null;
  const hit = (load()[id] ?? []).find((e) => e.kind === kind);
  return hit?.at ?? null;
}

export function adminDeliveryState(
  partnerId: string,
  kind: AdminDeliveryKind,
  now = Date.now(),
): {
  sentAt: string | null;
  canSend: boolean;
  waitSeconds: number;
  isRepeat: boolean;
  cooldownMinutes: number;
} {
  const sentAt = lastAdminDelivery(partnerId, kind);
  const cooldownMs = COOLDOWN_MS[kind];
  const cooldownMinutes = Math.round(cooldownMs / 60_000);
  if (!sentAt) {
    return { sentAt: null, canSend: true, waitSeconds: 0, isRepeat: false, cooldownMinutes };
  }
  const elapsed = now - new Date(sentAt).getTime();
  const waitMs = Math.max(0, cooldownMs - elapsed);
  return {
    sentAt,
    canSend: waitMs <= 0,
    waitSeconds: Math.ceil(waitMs / 1000),
    isRepeat: true,
    cooldownMinutes,
  };
}

export function formatAdminDeliveryWhen(iso: string | null): string {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
  } catch {
    return iso;
  }
}
