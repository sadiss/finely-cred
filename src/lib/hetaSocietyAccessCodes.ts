import { loadJson, saveJson } from '../data/localJsonStore';
import { newId } from '../utils/ids';
import { isSupabaseConfigured, supabase } from './supabaseClient';

const KEY = 'finely.hetaSociety.accessCodes.v1';

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export type HosAccessCodeRedemption = { email: string; leadId?: string; at: string };

/** Every HOS key is assigned to exactly one person at generation time. */
export type HosAccessCode = {
  id: string;
  code: string;
  label?: string;
  assignedFirstName: string;
  assignedLastName: string;
  assignedEmail: string;
  assignedPhone?: string;
  assignedLeadId?: string;
  notes?: string;
  cohort?: string;
  createdAt: string;
  createdBy?: string;
  expiresAt?: string | null;
  maxUses: number;
  useCount: number;
  redeemedBy: HosAccessCodeRedemption[];
  revoked: boolean;
};

export type HosAccessCodeAssignee = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  leadId?: string;
};

type Store = { codes: HosAccessCode[] };

function loadStore(): Store {
  const raw = loadJson<{ codes: Partial<HosAccessCode>[] }>(KEY, { codes: [] }, 2);
  const codes = (raw.codes ?? []).map(normalizeLegacyRecord);
  return { codes };
}

function saveStore(store: Store) {
  saveJson(KEY, store, 2);
}

function normalizeLegacyRecord(raw: Partial<HosAccessCode>): HosAccessCode {
  const assignedEmail = (raw.assignedEmail || '').trim().toLowerCase();
  const label = raw.label?.trim() || '';
  const nameFromLabel = label.split('—').pop()?.trim().split(/\s+/) ?? [];
  return {
    id: raw.id || newId('hos_code'),
    code: raw.code || '',
    label: label || undefined,
    assignedFirstName: raw.assignedFirstName?.trim() || nameFromLabel[0] || 'Member',
    assignedLastName: raw.assignedLastName?.trim() || nameFromLabel.slice(1).join(' ') || '',
    assignedEmail: assignedEmail || 'unassigned@finelycred.local',
    assignedPhone: raw.assignedPhone?.trim() || undefined,
    assignedLeadId: raw.assignedLeadId,
    notes: raw.notes?.trim() || undefined,
    cohort: raw.cohort?.trim() || undefined,
    createdAt: raw.createdAt || new Date().toISOString(),
    createdBy: raw.createdBy,
    expiresAt: raw.expiresAt ?? null,
    maxUses: Math.max(1, raw.maxUses ?? 1),
    useCount: Math.max(0, raw.useCount ?? 0),
    redeemedBy: raw.redeemedBy ?? [],
    revoked: Boolean(raw.revoked),
  };
}

export function normalizeHosAccessCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

function randomSegment(len = 8): string {
  let out = '';
  for (let i = 0; i < len; i += 1) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

function uniqueCode(store: Store): string {
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const code = `HOS-${randomSegment(8)}`;
    if (!store.codes.some((c) => c.code === code)) return code;
  }
  return `HOS-${randomSegment(10)}`;
}

export function listHosAccessCodes(): HosAccessCode[] {
  return [...loadStore().codes].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getHosAccessCodeById(id: string): HosAccessCode | null {
  return loadStore().codes.find((c) => c.id === id) ?? null;
}

export function assigneeDisplayName(record: Pick<HosAccessCode, 'assignedFirstName' | 'assignedLastName'>): string {
  return `${record.assignedFirstName} ${record.assignedLastName}`.trim();
}

function validateAssignee(assignee: HosAccessCodeAssignee): string | null {
  if (!assignee.firstName.trim()) return 'First name is required for every key.';
  if (!assignee.lastName.trim()) return 'Last name is required for every key.';
  if (!assignee.email.trim().includes('@')) return 'A valid email is required — each key belongs to one person.';
  return null;
}

function checkRecord(record: HosAccessCode, redeemEmail?: string): HosAccessCodeValidation {
  if (record.revoked) return { valid: false, reason: 'This access key has been revoked.' };
  if (record.expiresAt && new Date(record.expiresAt).getTime() < Date.now()) {
    return { valid: false, reason: 'This access key has expired.' };
  }
  if (record.useCount >= record.maxUses) {
    return { valid: false, reason: 'This access key has already been used.' };
  }
  if (redeemEmail) {
    const assigned = record.assignedEmail.trim().toLowerCase();
    const actual = redeemEmail.trim().toLowerCase();
    if (assigned && actual !== assigned) {
      return {
        valid: false,
        reason: `This key is assigned to ${assigneeDisplayName(record)} (${record.assignedEmail}). Register with that email.`,
      };
    }
  }
  return { valid: true, record };
}

/** Generate a person-assigned key locally (also syncs to server when configured). */
export function generateHosAccessCode(args: {
  assignee: HosAccessCodeAssignee;
  label?: string;
  createdBy?: string;
  maxUses?: number;
  expiresInDays?: number;
  notes?: string;
  cohort?: string;
}): HosAccessCode {
  const err = validateAssignee(args.assignee);
  if (err) throw new Error(err);

  const store = loadStore();
  const maxUses = Math.max(1, args.maxUses ?? 1);
  const expiresAt =
    args.expiresInDays && args.expiresInDays > 0
      ? new Date(Date.now() + args.expiresInDays * 86400000).toISOString()
      : null;

  const record: HosAccessCode = {
    id: newId('hos_code'),
    code: uniqueCode(store),
    label: args.label?.trim() || `${args.assignee.firstName.trim()} ${args.assignee.lastName.trim()}`,
    assignedFirstName: args.assignee.firstName.trim(),
    assignedLastName: args.assignee.lastName.trim(),
    assignedEmail: args.assignee.email.trim().toLowerCase(),
    assignedPhone: args.assignee.phone?.trim() || undefined,
    assignedLeadId: args.assignee.leadId,
    notes: args.notes?.trim() || undefined,
    cohort: args.cohort?.trim() || undefined,
    createdAt: new Date().toISOString(),
    createdBy: args.createdBy?.trim() || undefined,
    expiresAt,
    maxUses,
    useCount: 0,
    redeemedBy: [],
    revoked: false,
  };

  store.codes.push(record);
  saveStore(store);
  void syncHosAccessCodesToServer();
  return record;
}

export function revokeHosAccessCode(id: string): HosAccessCode | null {
  const store = loadStore();
  const idx = store.codes.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  store.codes[idx] = { ...store.codes[idx], revoked: true };
  saveStore(store);
  void syncHosAccessCodesToServer();
  if (isSupabaseConfigured) {
    void supabase.functions.invoke('hos-access-codes', { body: { action: 'revoke', id } });
  }
  return store.codes[idx];
}

export type HosAccessCodeValidation =
  | { valid: true; record: HosAccessCode; assignee?: { firstName: string; lastName: string; emailHint?: string } }
  | { valid: false; reason: string };

export function validateHosAccessCode(raw: string, redeemEmail?: string): HosAccessCodeValidation {
  const code = normalizeHosAccessCode(raw);
  if (!code) return { valid: false, reason: 'Enter your access key.' };
  if (!/^HOS-[A-Z0-9]{6,12}$/.test(code)) {
    return { valid: false, reason: 'Invalid key format. Use the code you were given (e.g. HOS-XXXXXXXX).' };
  }
  const record = loadStore().codes.find((c) => c.code === code);
  if (!record) return { valid: false, reason: 'Access key not recognized.' };
  return checkRecord(record, redeemEmail);
}

export function redeemHosAccessCode(
  raw: string,
  args: { email: string; leadId?: string },
): HosAccessCodeValidation {
  const check = validateHosAccessCode(raw, args.email);
  if (!check.valid) return check;
  const store = loadStore();
  const idx = store.codes.findIndex((c) => c.id === check.record.id);
  if (idx < 0) return { valid: false, reason: 'Access key not recognized.' };
  const record = store.codes[idx];
  const inner = checkRecord(record, args.email);
  if (!inner.valid) return inner;

  record.useCount += 1;
  record.redeemedBy.push({
    email: args.email.trim().toLowerCase(),
    leadId: args.leadId,
    at: new Date().toISOString(),
  });
  store.codes[idx] = record;
  saveStore(store);
  void syncHosAccessCodesToServer();
  return { valid: true, record };
}

/** Server-side validate — works across browsers when Supabase is configured. */
export async function validateHosAccessCodeRemote(raw: string): Promise<HosAccessCodeValidation> {
  const local = validateHosAccessCode(raw);
  if (!isSupabaseConfigured) return local;

  try {
    const { data, error } = await supabase.functions.invoke('hos-access-codes', {
      body: { action: 'validate', code: normalizeHosAccessCode(raw) },
    });
    if (error) return local;
    if (!data?.valid) return { valid: false, reason: String(data?.reason || 'Access key not recognized.') };
    if (local.valid) {
      return {
        valid: true,
        record: local.record,
        assignee: data.assignee ?? {
          firstName: local.record.assignedFirstName,
          lastName: local.record.assignedLastName,
        },
      };
    }
    return {
      valid: true,
      record: {
        id: 'remote',
        code: normalizeHosAccessCode(raw),
        assignedFirstName: data.assignee?.firstName ?? 'Member',
        assignedLastName: data.assignee?.lastName ?? '',
        assignedEmail: '',
        createdAt: new Date().toISOString(),
        maxUses: 1,
        useCount: 0,
        redeemedBy: [],
        revoked: false,
      },
      assignee: data.assignee,
    };
  } catch {
    return local;
  }
}

export async function redeemHosAccessCodeRemote(
  raw: string,
  args: { email: string; leadId?: string },
): Promise<HosAccessCodeValidation> {
  const local = redeemHosAccessCode(raw, args);
  if (!isSupabaseConfigured) return local;

  try {
    const { data, error } = await supabase.functions.invoke('hos-access-codes', {
      body: {
        action: 'redeem',
        code: normalizeHosAccessCode(raw),
        email: args.email.trim().toLowerCase(),
        leadId: args.leadId,
      },
    });
    if (error) return local;
    if (!data?.valid) return { valid: false, reason: String(data?.reason || 'Redemption failed.') };
    return local;
  } catch {
    return local;
  }
}

export async function pullHosAccessCodesFromServer(): Promise<number> {
  if (!isSupabaseConfigured) return 0;
  try {
    const { data, error } = await supabase.functions.invoke('hos-access-codes', { body: { action: 'list' } });
    if (error || !data?.ok || !Array.isArray(data.codes)) return 0;

    const store = loadStore();
    const byCode = new Map(store.codes.map((c) => [c.code, c]));
    for (const raw of data.codes as Partial<HosAccessCode>[]) {
      const normalized = normalizeLegacyRecord(raw);
      if (!normalized.code) continue;
      const existing = byCode.get(normalized.code);
      if (!existing || normalized.useCount >= existing.useCount) {
        byCode.set(normalized.code, normalized);
      }
    }
    store.codes = [...byCode.values()];
    saveStore(store);
    return data.codes.length;
  } catch {
    return 0;
  }
}

export async function syncHosAccessCodesToServer(): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    await supabase.functions.invoke('hos-access-codes', {
      body: { action: 'sync_push', codes: listHosAccessCodes() },
    });
  } catch {
    /* offline — local store remains source until sync */
  }
}

export async function generateHosAccessCodeRemote(args: {
  assignee: HosAccessCodeAssignee;
  label?: string;
  maxUses?: number;
  expiresInDays?: number;
  notes?: string;
  cohort?: string;
}): Promise<HosAccessCode> {
  const err = validateAssignee(args.assignee);
  if (err) throw new Error(err);

  if (isSupabaseConfigured) {
    try {
      const { data, error } = await supabase.functions.invoke('hos-access-codes', {
        body: {
          action: 'generate',
          assignedFirstName: args.assignee.firstName,
          assignedLastName: args.assignee.lastName,
          assignedEmail: args.assignee.email,
          assignedPhone: args.assignee.phone,
          assignedLeadId: args.assignee.leadId,
          label: args.label,
          maxUses: args.maxUses ?? 1,
          expiresInDays: args.expiresInDays,
          notes: args.notes,
          cohort: args.cohort,
        },
      });
      if (!error && data?.ok && data.code) {
        const store = loadStore();
        const record = normalizeLegacyRecord(data.code as Partial<HosAccessCode>);
        store.codes.push(record);
        saveStore(store);
        return record;
      }
    } catch {
      /* fall through to local */
    }
  }

  return generateHosAccessCode({ ...args, createdBy: 'admin' });
}
