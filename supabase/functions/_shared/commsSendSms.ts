import {
  getSmsApiCredentials,
  getSmsProvider,
  isRestSmsConfigured,
  isTwilioConfigured,
  trimEnv,
} from './commsCredentials.ts';

export type SmsSendResult = { ok: true; provider: 'twilio' | 'rest'; sid?: string | null; status?: string | null }
  | { ok: false; error: string };

function normalizeRestPhone(to: string): string {
  const digits = to.replace(/\D/g, '');
  if (!digits) return '';
  // US E.164 (+1…) → 10-digit national number for REST SMS gateways that expect local format.
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1);
  return digits;
}

async function twilioSend(args: { sid: string; token: string; from: string; to: string; body: string }) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(args.sid)}/Messages.json`;
  const auth = btoa(`${args.sid}:${args.token}`);
  const form = new URLSearchParams();
  form.set('From', args.from);
  form.set('To', args.to);
  form.set('Body', args.body);
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
  });
  if (!res.ok) throw new Error(`Twilio error: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function restSmsSend(args: { to: string; body: string; sender?: string }) {
  if (!isRestSmsConfigured()) {
    return { ok: false as const, error: 'SMS API credentials not configured (MAIL_API_ID, MAIL_API_KEY, SMS_SENDER_ID)' };
  }

  const { apiId, apiKey } = getSmsApiCredentials();
  const sender = (args.sender || trimEnv('SMS_SENDER_ID') || '').trim();
  if (!sender) return { ok: false as const, error: 'SMS_SENDER_ID missing' };

  const phone = normalizeRestPhone(args.to);
  if (!phone) return { ok: false as const, error: 'Invalid destination phone' };

  const url = trimEnv('SMS_REST_SEND_URL') || 'https://api.vatansms.net/api/v1/1toN';
  const payload = {
    api_id: apiId,
    api_key: apiKey,
    sender,
    message_type: trimEnv('SMS_MESSAGE_TYPE') || 'normal',
    message: args.body,
    message_content_type: trimEnv('SMS_MESSAGE_CONTENT_TYPE') || 'bilgi',
    phones: [phone],
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  });

  const raw = await res.text();
  let parsed: Record<string, unknown> | null = null;
  try {
    parsed = raw ? JSON.parse(raw) as Record<string, unknown> : null;
  } catch {
    parsed = null;
  }

  if (!res.ok) {
    const msg = String(parsed?.description ?? parsed?.error ?? parsed?.message ?? raw ?? res.status);
    return { ok: false as const, error: `REST SMS ${res.status}: ${msg}` };
  }

  const status = String(parsed?.status ?? '').toLowerCase();
  const code = Number(parsed?.code ?? 0);
  if (status === 'error' || (code >= 400 && code < 600)) {
    const msg = String(parsed?.description ?? parsed?.error ?? parsed?.message ?? 'REST SMS rejected');
    return { ok: false as const, error: msg };
  }

  const reportId = parsed?.report_id ?? parsed?.id ?? parsed?.message_id ?? null;
  return {
    ok: true as const,
    provider: 'rest' as const,
    sid: reportId != null ? String(reportId) : null,
    status: status || 'sent',
  };
}

export async function sendServiceSms(args: {
  to: string;
  body: string;
  from?: string;
}): Promise<SmsSendResult> {
  const msg = String(args.body || '').trim();
  const to = String(args.to || '').trim();
  if (!to) return { ok: false, error: 'Missing to' };
  if (!msg) return { ok: false, error: 'Missing body' };

  const provider = getSmsProvider();

  if (provider === 'rest') {
    const out = await restSmsSend({ to, body: msg, sender: args.from });
    return out;
  }

  if (!isTwilioConfigured()) {
    return { ok: false, error: 'Twilio env missing (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)' };
  }

  const sid = trimEnv('TWILIO_ACCOUNT_SID');
  const token = trimEnv('TWILIO_AUTH_TOKEN');
  const from = (args.from || trimEnv('TWILIO_FROM_PHONE') || '').trim();
  if (!from) return { ok: false, error: 'From phone not configured' };

  try {
    const out = await twilioSend({ sid, token, from, to, body: msg });
    return { ok: true, provider: 'twilio', sid: out?.sid ?? null, status: out?.status ?? null };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Twilio send failed' };
  }
}
