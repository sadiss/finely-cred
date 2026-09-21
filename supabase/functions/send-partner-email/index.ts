// Partner support email via Zoho SMTP only.
// Sends only when the caller has already approved the draft.
// Secrets: ZOHO_PARTNER_EMAIL_ENABLED=true, ZOHO_SMTP_USER, ZOHO_SMTP_PASS
// Optional: ZOHO_SMTP_HOST (smtp.zoho.com), ZOHO_SMTP_PORT (587), ZOHO_SMTP_SECURE

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import nodemailer from 'npm:nodemailer@6.9.15';
import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent, rateLimit, requireAuth } from '../_shared/edgeGuard.ts';
import { requireStaffAllowlistedEmail } from '../_shared/actorAuth.ts';
import { getZohoSmtpCredentials } from '../_shared/commsCredentials.ts';

const FROM_EMAIL = 'partnersupport@finelycred.com';
const FROM_NAME = 'Finely Cred Partner Support';

type ReqBody = {
  toEmail?: string;
  toName?: string;
  subject?: string;
  text?: string;
  partnerId?: string;
  approved?: boolean;
  draftId?: string;
};

async function writeAudit(args: {
  action: string;
  partnerId?: string;
  actorEmail?: string | null;
  entityId: string;
  meta: Record<string, unknown>;
}) {
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  if (!url || !key) return;
  const client = createClient(url, key);
  try {
    await client.from('audit_events').insert({
      id: crypto.randomUUID(),
      partner_id: args.partnerId || null,
      actor_type: 'staff',
      actor_email: args.actorEmail || null,
      action: args.action,
      entity_type: 'partner_email',
      entity_id: args.entityId,
      meta: args.meta,
    });
  } catch {
    // Audit is best-effort so a missing column never blocks a refused send.
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ ok: false, error: 'Method not allowed' }, { status: 405 });

  let ctx: Awaited<ReturnType<typeof requireAuth>>;
  try {
    ctx = await requireAuth(req);
    requireStaffAllowlistedEmail(ctx);
  } catch (e) {
    return json({ ok: false, error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  const rl = await rateLimit({ key: `send-partner-email:${ctx.user.id}`, limit: 12, windowSeconds: 60 });
  if (!rl.ok) return json({ ok: false, error: 'Rate limited' }, { status: 429 });

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, { status: 400 });
  }

  const toEmail = String(body.toEmail || '').trim();
  const subject = String(body.subject || '').trim();
  const text = String(body.text || '').trim();
  const draftId = String(body.draftId || '').trim() || crypto.randomUUID();
  if (!toEmail || !subject || !text) {
    return json({ ok: false, error: 'toEmail, subject, and text are required' }, { status: 400 });
  }
  if (body.approved !== true) {
    await writeAudit({
      action: 'partner_email.draft',
      partnerId: body.partnerId,
      actorEmail: ctx.user.email,
      entityId: draftId,
      meta: { toEmail, subject: subject.slice(0, 140), sent: false },
    });
    return json({ ok: false, status: 'needs_approval', draftId }, { status: 409 });
  }

  const smtp = getZohoSmtpCredentials();
  if (!smtp) {
    await writeAudit({
      action: 'partner_email.blocked',
      partnerId: body.partnerId,
      actorEmail: ctx.user.email,
      entityId: draftId,
      meta: { toEmail, reason: 'zoho_not_configured', sent: false },
    });
    return json({
      ok: false,
      status: 'not_configured',
      error: 'Zoho SMTP is off. Set ZOHO_PARTNER_EMAIL_ENABLED=true plus ZOHO_SMTP_USER and ZOHO_SMTP_PASS.',
    }, { status: 503 });
  }

  const transporter = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.secure,
    auth: { user: smtp.user, pass: smtp.pass },
    connectionTimeout: 10_000,
    greetingTimeout: 5_000,
    socketTimeout: 10_000,
  });

  try {
    const to = body.toName ? `"${body.toName.replace(/"/g, '')}" <${toEmail}>` : toEmail;
    await transporter.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      text,
    });
  } catch (e) {
    await logEdgeEvent({
      namespace: 'send-partner-email',
      level: 'error',
      event: 'send_failed',
      meta: { userId: ctx.user.id, error: e instanceof Error ? e.message : 'send_failed' },
    });
    return json({ ok: false, error: e instanceof Error ? e.message : 'Zoho send failed' }, { status: 502 });
  } finally {
    try { transporter.close(); } catch { /* ignore */ }
  }

  await writeAudit({
    action: 'partner_email.sent',
    partnerId: body.partnerId,
    actorEmail: ctx.user.email,
    entityId: draftId,
    meta: { toEmail, subject: subject.slice(0, 140), from: FROM_EMAIL, sent: true },
  });
  await logEdgeEvent({
    namespace: 'send-partner-email',
    level: 'info',
    event: 'sent',
    meta: { userId: ctx.user.id, toEmail, draftId },
  });
  return json({ ok: true, status: 'sent', draftId, from: FROM_EMAIL });
});
