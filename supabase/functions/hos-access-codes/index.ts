// Edge Function: hos-access-codes
// Server-validated Head of Society invite keys — every key is assigned to one person.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { getClientIp, json, logEdgeEvent, rateLimit, requireAuth, requireEnv } from '../_shared/edgeGuard.ts';

const CODE_CHARS = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

type HosRow = {
  id: string;
  code: string;
  label: string | null;
  assigned_first_name: string;
  assigned_last_name: string;
  assigned_email: string;
  assigned_phone: string | null;
  assigned_lead_id: string | null;
  notes: string | null;
  cohort: string | null;
  created_at: string;
  created_by: string | null;
  expires_at: string | null;
  max_uses: number;
  use_count: number;
  redeemed_by: Array<{ email: string; leadId?: string; at: string }>;
  revoked: boolean;
};

function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

function randomSegment(len = 8): string {
  let out = '';
  for (let i = 0; i < len; i += 1) {
    out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

async function uniqueCode(admin: ReturnType<typeof createClient>): Promise<string> {
  for (let attempt = 0; attempt < 32; attempt += 1) {
    const code = `HOS-${randomSegment(8)}`;
    const { data } = await admin.from('hos_access_codes').select('id').eq('code', code).maybeSingle();
    if (!data) return code;
  }
  return `HOS-${randomSegment(10)}`;
}

function rowToPublic(record: HosRow, includeAssignee = false) {
  const base = {
    id: record.id,
    code: record.code,
    label: record.label,
    createdAt: record.created_at,
    expiresAt: record.expires_at,
    maxUses: record.max_uses,
    useCount: record.use_count,
    revoked: record.revoked,
    cohort: record.cohort,
  };
  if (!includeAssignee) return base;
  return {
    ...base,
    assignedFirstName: record.assigned_first_name,
    assignedLastName: record.assigned_last_name,
    assignedEmail: record.assigned_email,
    assignedPhone: record.assigned_phone,
    assignedLeadId: record.assigned_lead_id,
    notes: record.notes,
    redeemedBy: record.redeemed_by ?? [],
    createdBy: record.created_by,
  };
}

function validateRecord(record: HosRow, redeemEmail?: string) {
  if (record.revoked) return { valid: false as const, reason: 'This access key has been revoked.' };
  if (record.expires_at && new Date(record.expires_at).getTime() < Date.now()) {
    return { valid: false as const, reason: 'This access key has expired.' };
  }
  if (record.use_count >= record.max_uses) {
    return { valid: false as const, reason: 'This access key has already been used.' };
  }
  if (redeemEmail) {
    const assigned = record.assigned_email.trim().toLowerCase();
    const actual = redeemEmail.trim().toLowerCase();
    if (assigned && actual !== assigned) {
      return {
        valid: false as const,
        reason: `This key is assigned to ${record.assigned_first_name} ${record.assigned_last_name} (${record.assigned_email}). Use that email to register.`,
      };
    }
  }
  return { valid: true as const, record };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, { status: 405 });

  const ip = getClientIp(req);
  const rl = await rateLimit({ key: `hos-access-codes:${ip}`, limit: 60, windowSeconds: 60 });
  if (!rl.ok) return json({ ok: false, error: 'Rate limited' }, { status: 429 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const action = String(body.action || '').trim();
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  if (action === 'validate') {
    const code = normalizeCode(String(body.code || ''));
    if (!/^HOS-[A-Z0-9]{6,12}$/.test(code)) {
      return json({ ok: false, valid: false, reason: 'Invalid key format.' });
    }
    const { data, error } = await admin.from('hos_access_codes').select('*').eq('code', code).maybeSingle();
    if (error) return json({ ok: false, error: error.message }, { status: 500 });
    if (!data) return json({ ok: true, valid: false, reason: 'Access key not recognized.' });
    const check = validateRecord(data as HosRow);
    if (!check.valid) return json({ ok: true, valid: false, reason: check.reason });
    const r = check.record;
    return json({
      ok: true,
      valid: true,
      assignee: {
        firstName: r.assigned_first_name,
        lastName: r.assigned_last_name,
        emailHint: r.assigned_email.replace(/(.{2}).+(@.+)/, '$1•••$2'),
      },
    });
  }

  if (action === 'redeem') {
    const code = normalizeCode(String(body.code || ''));
    const email = String(body.email || '').trim().toLowerCase();
    const leadId = String(body.leadId || '').trim() || undefined;
    if (!email.includes('@')) return json({ ok: false, error: 'Valid email required' }, { status: 400 });

    const { data, error } = await admin.from('hos_access_codes').select('*').eq('code', code).maybeSingle();
    if (error) return json({ ok: false, error: error.message }, { status: 500 });
    if (!data) return json({ ok: false, valid: false, reason: 'Access key not recognized.' });

    const check = validateRecord(data as HosRow, email);
    if (!check.valid) return json({ ok: true, valid: false, reason: check.reason });

    const record = check.record;
    const redeemedBy = [...(record.redeemed_by ?? []), { email, leadId, at: new Date().toISOString() }];
    const { error: upErr } = await admin
      .from('hos_access_codes')
      .update({ use_count: record.use_count + 1, redeemed_by: redeemedBy })
      .eq('id', record.id);
    if (upErr) return json({ ok: false, error: upErr.message }, { status: 500 });

    await logEdgeEvent({
      namespace: 'hos-access-codes',
      level: 'info',
      event: 'redeem',
      meta: { code, email, leadId },
    });
    return json({ ok: true, valid: true, code: record.code });
  }

  // Admin-only actions below
  let adminEmail = '';
  try {
    const ctx = await requireAuth(req);
    adminEmail = (ctx.email || '').trim().toLowerCase();
    const { data: adminRow } = await admin.from('admin_emails').select('email').eq('email', adminEmail).maybeSingle();
    if (!adminRow) return json({ ok: false, error: 'Admin access required' }, { status: 403 });
  } catch (e) {
    return json({ ok: false, error: (e as Error).message || 'Unauthorized' }, { status: 401 });
  }

  if (action === 'list') {
    const { data, error } = await admin.from('hos_access_codes').select('*').order('created_at', { ascending: false }).limit(200);
    if (error) return json({ ok: false, error: error.message }, { status: 500 });
    return json({ ok: true, codes: (data ?? []).map((r) => rowToPublic(r as HosRow, true)) });
  }

  if (action === 'generate') {
    const assignedFirstName = String(body.assignedFirstName || '').trim();
    const assignedLastName = String(body.assignedLastName || '').trim();
    const assignedEmail = String(body.assignedEmail || '').trim().toLowerCase();
    if (!assignedFirstName || !assignedLastName || !assignedEmail.includes('@')) {
      return json({ ok: false, error: 'assignedFirstName, assignedLastName, and assignedEmail are required' }, { status: 400 });
    }

    const expiresInDays = Number(body.expiresInDays ?? 0);
    const expiresAt =
      expiresInDays > 0 ? new Date(Date.now() + expiresInDays * 86400000).toISOString() : null;
    const code = await uniqueCode(admin);
    const id = `hos_code_${crypto.randomUUID()}`;
    const row = {
      id,
      code,
      label: String(body.label || '').trim() || `${assignedFirstName} ${assignedLastName}`,
      assigned_first_name: assignedFirstName,
      assigned_last_name: assignedLastName,
      assigned_email: assignedEmail,
      assigned_phone: String(body.assignedPhone || '').trim() || null,
      assigned_lead_id: String(body.assignedLeadId || '').trim() || null,
      notes: String(body.notes || '').trim() || null,
      cohort: String(body.cohort || '').trim() || null,
      created_by: adminEmail,
      expires_at: expiresAt,
      max_uses: Math.max(1, Number(body.maxUses ?? 1)),
      use_count: 0,
      redeemed_by: [],
      revoked: false,
    };

    const { data, error } = await admin.from('hos_access_codes').insert(row).select('*').single();
    if (error) return json({ ok: false, error: error.message }, { status: 500 });

    await logEdgeEvent({
      namespace: 'hos-access-codes',
      level: 'info',
      event: 'generate',
      meta: { id, code, assignedEmail },
    });
    return json({ ok: true, code: rowToPublic(data as HosRow, true) });
  }

  if (action === 'revoke') {
    const id = String(body.id || '').trim();
    if (!id) return json({ ok: false, error: 'id required' }, { status: 400 });
    const { data, error } = await admin.from('hos_access_codes').update({ revoked: true }).eq('id', id).select('*').maybeSingle();
    if (error) return json({ ok: false, error: error.message }, { status: 500 });
    if (!data) return json({ ok: false, error: 'Not found' }, { status: 404 });
    return json({ ok: true, code: rowToPublic(data as HosRow, true) });
  }

  if (action === 'sync_push') {
    const codes = Array.isArray(body.codes) ? body.codes : [];
    let upserted = 0;
    for (const raw of codes) {
      const c = raw as Record<string, unknown>;
      const assignedEmail = String(c.assignedEmail || c.assigned_email || '').trim().toLowerCase();
      if (!assignedEmail.includes('@')) continue;
      const row = {
        id: String(c.id || `hos_code_${crypto.randomUUID()}`),
        code: normalizeCode(String(c.code || '')),
        label: String(c.label || '').trim() || null,
        assigned_first_name: String(c.assignedFirstName || c.assigned_first_name || 'Member').trim(),
        assigned_last_name: String(c.assignedLastName || c.assigned_last_name || '').trim(),
        assigned_email: assignedEmail,
        assigned_phone: String(c.assignedPhone || c.assigned_phone || '').trim() || null,
        assigned_lead_id: String(c.assignedLeadId || c.assigned_lead_id || '').trim() || null,
        notes: String(c.notes || '').trim() || null,
        cohort: String(c.cohort || '').trim() || null,
        created_at: String(c.createdAt || c.created_at || new Date().toISOString()),
        created_by: String(c.createdBy || c.created_by || adminEmail),
        expires_at: (c.expiresAt || c.expires_at || null) as string | null,
        max_uses: Math.max(1, Number(c.maxUses ?? c.max_uses ?? 1)),
        use_count: Math.max(0, Number(c.useCount ?? c.use_count ?? 0)),
        redeemed_by: (c.redeemedBy ?? c.redeemed_by ?? []) as HosRow['redeemed_by'],
        revoked: Boolean(c.revoked),
      };
      if (!/^HOS-[A-Z0-9]{6,12}$/.test(row.code)) continue;
      const { error } = await admin.from('hos_access_codes').upsert(row, { onConflict: 'code' });
      if (!error) upserted += 1;
    }
    return json({ ok: true, upserted });
  }

  return json({ ok: false, error: 'Unknown action' }, { status: 400 });
});
