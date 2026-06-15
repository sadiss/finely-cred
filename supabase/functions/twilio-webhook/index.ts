// Supabase Edge Function: twilio-webhook
// Inbound SMS + voice status + voicemail callbacks from Twilio.
//
// Configure in Twilio Console:
// - SMS webhook URL → this function URL (POST)
// - Voice webhook URL → this function URL (POST)
//
// Secrets: TWILIO_AUTH_TOKEN, TWILIO_FROM_PHONE (optional)

import { corsHeaders } from '../_shared/cors.ts';
import { json, logEdgeEvent } from '../_shared/edgeGuard.ts';

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

      if (transcription || recordingUrl) {
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
