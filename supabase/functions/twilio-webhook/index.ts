// Supabase Edge Function: twilio-webhook
// Inbound SMS + voice status + voicemail callbacks from Twilio.
//
// Configure in Twilio Console:
// - SMS webhook URL → this function URL (POST)
// - Voice webhook URL → this function URL (POST)
//
// Secrets: TWILIO_AUTH_TOKEN, TWILIO_FROM_PHONE (optional)
//
// Phase J3 — missed-call text-back: on a missed-call status callback
// ('no-answer'/'busy'/'failed'/'canceled') or a completed voicemail
// (TranscriptionText/RecordingUrl present), this reuses the existing,
// already-Twilio-configured webhook above to fire an immediate SMS
// acknowledgment + booking link + human follow-up task, instead of
// standing up a second Twilio voice webhook for the same support number.
// See `_shared/missedCallTextBack.ts` for the send logic and gating.
// Requires SUPABASE_SERVICE_ROLE_KEY + SUPABASE_URL only when the feature
// is actually enabled (MISSED_CALL_TEXTBACK_ENABLED=true) — every other
// code path in this function is unchanged and needs no Supabase admin client.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent } from '../_shared/edgeGuard.ts';
import { isMissedCallTextBackEnabled, sendMissedCallTextBack } from '../_shared/missedCallTextBack.ts';

// deno-lint-ignore no-explicit-any
type AdminClient = any;

let _admin: AdminClient | null = null;
function adminClient(): AdminClient | null {
  if (_admin) return _admin;
  const url = (Deno.env.get('SUPABASE_URL') || '').trim();
  const serviceKey = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim();
  if (!url || !serviceKey) return null;
  _admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  return _admin;
}

function base64FromBuffer(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

async function verifyTwilioSignature(args: {
  authToken: string;
  signature: string | null;
  url: string;
  params: Record<string, string>;
}): Promise<boolean> {
  if (!args.signature || !args.authToken) return false;
  const sorted = Object.keys(args.params).sort();
  let payload = args.url;
  for (const k of sorted) payload += k + args.params[k];
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(args.authToken),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  const expected = base64FromBuffer(sig);
  if (expected.length !== args.signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ args.signature.charCodeAt(i);
  }
  return mismatch === 0;
}

async function parseFormBody(req: Request): Promise<Record<string, string>> {
  const text = await req.text();
  const params: Record<string, string> = {};
  for (const pair of text.split('&')) {
    if (!pair) continue;
    const [rawK, rawV = ''] = pair.split('=');
    const k = decodeURIComponent(rawK.replace(/\+/g, ' '));
    const v = decodeURIComponent(rawV.replace(/\+/g, ' '));
    params[k] = v;
  }
  return params;
}

function twimlVoiceGreeting() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Thank you for calling Finely Cred. Please leave a message after the tone.</Say>
  <Record maxLength="120" transcribe="true" playBeep="true" />
  <Say>We did not receive a recording. Goodbye.</Say>
</Response>`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method === 'GET') {
    return json({ ok: true, service: 'twilio-webhook', hint: 'POST Twilio form payloads here.' });
  }
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN') || '';
  const signature = req.headers.get('X-Twilio-Signature');
  const url = req.url.split('#')[0] ?? req.url;

  let params: Record<string, string>;
  try {
    params = await parseFormBody(req);
  } catch {
    return json({ error: 'Invalid body' }, { status: 400 });
  }

  if (authToken) {
    const valid = await verifyTwilioSignature({ authToken, signature, url, params });
    if (!valid) {
      await logEdgeEvent({
        namespace: 'twilio-webhook',
        level: 'warn',
        event: 'invalid_signature',
        meta: { url },
      });
      return json({ error: 'Invalid Twilio signature' }, { status: 403 });
    }
  }

  const smsSid = params.SmsMessageSid ?? params.MessageSid;
  const callSid = params.CallSid;
  const from = params.From ?? '';
  const to = params.To ?? '';
  const body = params.Body ?? '';
  const callStatus = params.CallStatus ?? '';
  const transcription = params.TranscriptionText ?? params.RecordingTranscriptionText ?? '';
  const recordingUrl = params.RecordingUrl ?? '';

  try {
    if (smsSid && body) {
      await logEdgeEvent({
        namespace: 'twilio-webhook',
        level: 'info',
        event: 'sms_inbound',
        meta: { sid: smsSid, from, to, body: body.slice(0, 500), bodyLen: body.length },
      });
      return new Response('<Response></Response>', {
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    if (callSid && callStatus) {
      const missed = ['no-answer', 'busy', 'failed', 'canceled'].includes(callStatus);
      await logEdgeEvent({
        namespace: 'twilio-webhook',
        level: missed ? 'warn' : 'info',
        event: missed ? 'call_missed' : 'call_status',
        meta: {
          sid: callSid,
          from,
          to,
          status: callStatus,
          duration: params.CallDuration ?? null,
          transcription: transcription.slice(0, 800) || null,
          recordingUrl: recordingUrl || null,
        },
      });

      if (callStatus === 'ringing') {
        return new Response(twimlVoiceGreeting(), {
          headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
        });
      }

      const hasVoicemail = Boolean(transcription || recordingUrl);
      if (hasVoicemail) {
        await logEdgeEvent({
          namespace: 'twilio-webhook',
          level: 'info',
          event: 'voicemail',
          meta: {
            sid: callSid,
            from,
            to,
            transcription: transcription.slice(0, 1200),
            recordingUrl,
          },
        });
      }

      if ((missed || hasVoicemail) && from && isMissedCallTextBackEnabled()) {
        const admin = adminClient();
        if (admin) {
          const textBack = await sendMissedCallTextBack(admin, {
            callerPhone: from,
            callSid,
            isVoicemail: hasVoicemail,
            transcription: transcription || undefined,
          });
          await logEdgeEvent({
            namespace: 'twilio-webhook',
            level: textBack.smsSent ? 'info' : 'warn',
            event: 'missed_call_textback_result',
            meta: { sid: callSid, from, smsSent: textBack.smsSent, followUpTaskCreated: textBack.followUpTaskCreated, reason: textBack.reason ?? null },
          });
        } else {
          await logEdgeEvent({
            namespace: 'twilio-webhook',
            level: 'warn',
            event: 'missed_call_textback_skipped',
            meta: { sid: callSid, reason: 'supabase_admin_client_unavailable' },
          });
        }
      }

      return new Response('<Response></Response>', {
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    if (callSid && from && !body) {
      await logEdgeEvent({
        namespace: 'twilio-webhook',
        level: 'info',
        event: 'voice_inbound',
        meta: { sid: callSid, from, to },
      });
      return new Response(twimlVoiceGreeting(), {
        headers: { ...corsHeaders, 'Content-Type': 'text/xml' },
      });
    }

    await logEdgeEvent({
      namespace: 'twilio-webhook',
      level: 'info',
      event: 'unknown_payload',
      meta: { keys: Object.keys(params).slice(0, 20) },
    });
    return json({ ok: true, received: true });
  } catch (e) {
    await logEdgeEvent({
      namespace: 'twilio-webhook',
      level: 'error',
      event: 'handler_error',
      meta: { error: (e as Error)?.message || String(e) },
    });
    return json({ ok: false, error: (e as Error)?.message || 'Handler failed' }, { status: 500 });
  }
});
