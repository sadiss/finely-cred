// Supabase Edge Function: mailer (US-only v1)
// Sends an existing letter PDF (stored in Supabase Storage) via Finely Mail partner API.
//
// Secrets (primary mail API):
// - MAIL_API_ID, MAIL_API_KEY (or legacy LETTERSTREAM_* / API_ID aliases)
// - MAIL_PROVIDER=primary|finely (optional; auto-detected)
//
// Secrets (alternate mail API fallback):
// - LOB_API_KEY
//
// Common:
// - SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY

import { corsHeaders } from '../_shared/cors.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { json, logEdgeEvent, rateLimit, requireAuth } from '../_shared/edgeGuard.ts';
import { requireStaffAllowlistedEmail, type StaffTier } from '../_shared/actorAuth.ts';
import { developerLiveMailBlocked } from '../_shared/commsSandbox.ts';
import {
  buildLetterStreamDocId,
  buildLetterStreamHumanJobName,
  buildLetterStreamJobName,
  estimatePdfPageCount,
  getLetterStreamCredentials,
  isLetterStreamConfigured,
  isLetterStreamDuplicateBatchCode,
  isLetterStreamReleasedCode,
  letterStreamAuthPing,
  letterStreamErrorLabel,
  letterStreamSendReleased,
  summarizeLetterStreamResponse,
} from '../_shared/letterStreamClient.ts';
import { claimMailSendIdempotency, saveMailSendReceipt } from '../_shared/mailSendReceipt.ts';
import { publicMailProvider, sanitizeMailUserMessage } from '../_shared/mailWhiteLabel.ts';

type MailAddress = {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
};

type ReqBody = {
  /** Defaults to 'send' when omitted. */
  op?: 'send' | 'verify' | 'ping' | 'status' | 'quote';
  mailTypes?: Array<'firstclass' | 'certified' | 'certnoerr' | 'flat'>;
  /** Preferred mail class for UI highlight — quotes remain static-only. */
  selectedMailType?: 'firstclass' | 'certified' | 'certnoerr' | 'flat';
  /** Legacy client field — ignored; quotes never POST to LetterStream. */
  quoteIdempotencyKey?: string;
  jobNaming?: {
    partnerFirstName?: string;
    recipientLabel?: string;
    disambiguator?: string;
  };
  partnerId?: string;
  letterId?: string;
  pdfBlobRef?: string;
  to?: MailAddress;
  from?: MailAddress;
  options?: {
    color?: boolean;
    doubleSided?: boolean;
    mailType?: 'firstclass' | 'certified' | 'certnoerr' | 'flat';
    coverSheet?: boolean;
    pages?: number;
    preauth?: boolean;
  };
  /** Optional: prevents accidental duplicate sends. */
  idempotencyKey?: string;
};

function staticMailQuoteEstimate(mailType: string): number {
  if (mailType === 'firstclass') return 3.5;
  if (mailType === 'certnoerr') return 6.5;
  if (mailType === 'flat') return 9;
  return 8;
}

function resolveEdgeJobName(body: ReqBody, letterId: string): string {
  if (body.jobNaming?.partnerFirstName || body.jobNaming?.recipientLabel) {
    return buildLetterStreamHumanJobName(body.jobNaming);
  }
  return buildLetterStreamJobName(letterId);
}

/** LetterStream TEST / debug mode — never silent in product UI. */
function resolveMailLiveMode(): boolean {
  if (/^(1|true|yes|on)$/i.test(Deno.env.get('MAIL_LIVE_MODE') || '')) return true;
  if (/^(1|true|yes|on)$/i.test(Deno.env.get('LETTERSTREAM_LIVE_MODE') || '')) return true;
  return false;
}

function resolveMailDebugLevel(): 1 | 2 | 3 | undefined {
  if (resolveMailLiveMode()) return undefined;
  const raw = (Deno.env.get('MAIL_DEBUG') || Deno.env.get('LETTERSTREAM_DEBUG') || '').trim();
  if (raw === '1' || raw === '2' || raw === '3') return Number(raw) as 1 | 2 | 3;
  if (/^(1|true|yes|on)$/i.test(Deno.env.get('MAIL_TEST_MODE') || '')) return 3;
  if (/^(1|true|yes|on)$/i.test(Deno.env.get('LETTERSTREAM_TEST_MODE') || '')) return 3;
  return undefined;
}

/** Vendor + env test detection — explicit phrases only (avoid false positives on live accounts). */
function resolveMailTestMode(pingText?: string): boolean {
  if (resolveMailLiveMode()) return false;
  if (/^(1|true|yes|on)$/i.test(Deno.env.get('MAIL_TEST_MODE') || '')) return true;
  if (/^(1|true|yes|on)$/i.test(Deno.env.get('LETTERSTREAM_TEST_MODE') || '')) return true;
  if (resolveMailDebugLevel()) return true;
  const hay = String(pingText || '');
  return /\btest\s*mode\b|\btestmode\b|\bsandbox\s*mode\b|\bin\s*test\b/i.test(hay);
}

function extractBalanceHint(raw: unknown): number | null {
  try {
    const text = typeof raw === 'string' ? raw : JSON.stringify(raw ?? '');
    const m =
      text.match(/balance["\s:=]+\$?\s*([\d,.]+)/i) ||
      text.match(/prepaid["\s:=]+\$?\s*([\d,.]+)/i) ||
      text.match(/funds["\s:=]+\$?\s*([\d,.]+)/i);
    if (!m?.[1]) return null;
    const n = Number(String(m[1]).replace(/,/g, ''));
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

const REF_PREFIX = 'supabase://';

function getMailProvider(): 'letterstream' | 'lob' {
  const explicit = (Deno.env.get('MAIL_PROVIDER') || '').trim().toLowerCase();
  if (explicit === 'letterstream' || explicit === 'primary' || explicit === 'finely') return 'letterstream';
  if (explicit === 'lob' || explicit === 'alternate') return 'lob';
  if (isLetterStreamConfigured()) return 'letterstream';
  return 'lob';
}

function parseSupabaseRef(ref: string): { bucket: string; path: string } {
  if (!ref?.startsWith(REF_PREFIX)) throw new Error('Invalid blob ref.');
  const rest = ref.slice(REF_PREFIX.length);
  const slash = rest.indexOf('/');
  if (slash < 1) throw new Error('Invalid blob ref.');
  const bucket = rest.slice(0, slash);
  const path = rest.slice(slash + 1);
  if (!bucket || !path) throw new Error('Invalid blob ref.');
  return { bucket, path };
}

function requiredAddr(a: MailAddress) {
  const zip = (a.zip || '').replace(/\D/g, '');
  if (!a.name?.trim()) return 'Missing name';
  if (!a.addressLine1?.trim()) return 'Missing address line 1';
  if (!a.city?.trim()) return 'Missing city';
  if (!a.state?.trim()) return 'Missing state';
  if (zip.length < 5) return 'Missing/invalid zip';
  return '';
}

async function lobCreateLetter(args: {
  apiKey: string;
  to: MailAddress;
  from: MailAddress;
  fileUrl: string;
  color?: boolean;
  doubleSided?: boolean;
  description?: string;
}) {
  const auth = btoa(`${args.apiKey}:`);
  const payload: Record<string, unknown> = {
    description: args.description ?? 'Finely Cred letter',
    to: {
      name: args.to.name,
      address_line1: args.to.addressLine1,
      address_line2: args.to.addressLine2 || undefined,
      address_city: args.to.city,
      address_state: args.to.state,
      address_zip: args.to.zip,
      address_country: 'US',
    },
    from: {
      name: args.from.name,
      address_line1: args.from.addressLine1,
      address_line2: args.from.addressLine2 || undefined,
      address_city: args.from.city,
      address_state: args.from.state,
      address_zip: args.from.zip,
      address_country: 'US',
    },
    file: args.fileUrl,
    color: args.color ?? true,
    double_sided: args.doubleSided ?? true,
  };

  const res = await fetch('https://api.lob.com/v1/letters', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Mail API error: ${res.status} ${await res.text()}`);
  return await res.json();
}

async function lobVerifyUsAddress(args: { apiKey: string; a: MailAddress }) {
  const auth = btoa(`${args.apiKey}:`);
  const payload: Record<string, unknown> = {
    primary_line: args.a.addressLine1,
    secondary_line: args.a.addressLine2 || undefined,
    city: args.a.city,
    state: args.a.state,
    zip_code: args.a.zip,
  };
  const res = await fetch('https://api.lob.com/v1/us_verifications', {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Address verify error: ${res.status} ${await res.text()}`);
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, { status: 405 });

  const provider = getMailProvider();
  const serviceKey = (Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '').trim();
  const lobKey = (Deno.env.get('LOB_API_KEY') || '').trim();
  const letterStreamCreds = getLetterStreamCredentials();

  if (!serviceKey) return json({ error: 'Supabase env not configured' }, { status: 500 });
  if (provider === 'lob' && !lobKey) return json({ error: 'Mail API credentials not configured' }, { status: 500 });
  if (provider === 'letterstream' && !letterStreamCreds) {
    return json({ error: 'Mail API credentials not configured' }, { status: 500 });
  }

  const publicProvider = publicMailProvider();

  let ctx: Awaited<ReturnType<typeof requireAuth>>;
  let staffTier: StaffTier;
  try {
    ctx = await requireAuth(req);
    staffTier = requireStaffAllowlistedEmail(ctx);
  } catch (e) {
    return json({ error: (e as Error)?.message || 'Unauthorized' }, { status: 401 });
  }

  const rlUser = await rateLimit({ key: `mailer:user:${ctx.user.id}`, limit: 3, windowSeconds: 10 * 60 });
  const rlIp = await rateLimit({ key: `mailer:ip:${ctx.ip}`, limit: 10, windowSeconds: 10 * 60 });
  if (!rlUser.ok || !rlIp.ok) {
    await logEdgeEvent({ namespace: 'mailer', level: 'warn', event: 'rate_limited', meta: { ip: ctx.ip, userId: ctx.user.id } });
    return json(
      { ok: false, error: 'Rate limited. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((Math.min(rlUser.resetAt, rlIp.resetAt) - Date.now()) / 1000)) } },
    );
  }

  let body: ReqBody;
  try {
    body = (await req.json()) as ReqBody;
  } catch {
    return json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const op = (body?.op || 'send') as ReqBody['op'];

  if (op === 'ping' || op === 'status') {
    if (provider !== 'letterstream') {
      return json({
        ok: true,
        provider: publicProvider,
        message: 'Mail service reachable',
        testMode: resolveMailTestMode(),
        liveMode: resolveMailLiveMode(),
        debugLevel: resolveMailDebugLevel() ?? null,
        balanceUsd: null,
      });
    }
    try {
      const debugLevel = resolveMailDebugLevel();
      const parsed = await letterStreamAuthPing(debugLevel ? { debug: debugLevel } : undefined);
      const summary = summarizeLetterStreamResponse(parsed);
      const authValidPing = summary.code === -998 && /\bauth\s*valid\b/i.test(summary.message);
      const rawBlob = JSON.stringify(parsed.raw ?? parsed.messages ?? '');
      const testMode = resolveMailTestMode(rawBlob + ' ' + summary.message);
      const balanceUsd = extractBalanceHint(parsed.raw) ?? extractBalanceHint(rawBlob);
      return json({
        ok: summary.ok || authValidPing,
        provider: publicProvider,
        code: summary.code,
        message: sanitizeMailUserMessage(summary.message),
        messages: parsed.messages.map((m) => ({ ...m, details: sanitizeMailUserMessage(m.details) })),
        testMode,
        liveMode: resolveMailLiveMode(),
        debugLevel: debugLevel ?? null,
        balanceUsd,
        estimatedCostUsd: 8,
      });
    } catch (e) {
      return json({
        ok: false,
        provider: publicProvider,
        error: sanitizeMailUserMessage((e as Error)?.message || 'Mail connectivity check failed'),
        testMode: resolveMailTestMode(),
        liveMode: resolveMailLiveMode(),
        debugLevel: resolveMailDebugLevel() ?? null,
        balanceUsd: null,
      }, { status: 500 });
    }
  }

  if (op === 'quote') {
    if (!body.pdfBlobRef || !body.to || !body.from) {
      return json({ error: 'Missing pdfBlobRef, to, or from for quote' }, { status: 400 });
    }
    const toErr = requiredAddr(body.to);
    const fromErr = requiredAddr(body.from);
    if (toErr) return json({ error: `To address invalid: ${toErr}` }, { status: 400 });
    if (fromErr) return json({ error: `From address invalid: ${fromErr}` }, { status: 400 });
    if (provider !== 'letterstream') {
      return json({
        ok: true,
        provider: publicProvider,
        quotes: (body.mailTypes?.length ? body.mailTypes : ['firstclass', 'certified', 'certnoerr']).map((mailType) => ({
          mailType,
          costUsd: staticMailQuoteEstimate(String(mailType)),
          code: -200,
          message: 'Estimated — connect LetterStream for live quotes',
          estimated: true,
        })),
      });
    }

    // Strict: quotes never hit LetterStream — no phantom jobs from pricing UI.
    const allTypes = (body.mailTypes?.length
      ? body.mailTypes
      : (['firstclass', 'certified', 'certnoerr'] as const)) as Array<'firstclass' | 'certified' | 'certnoerr' | 'flat'>;
    const quotes = allTypes.map((mailType) => ({
      mailType,
      costUsd: staticMailQuoteEstimate(mailType),
      code: -200,
      message: 'Estimated — live price confirmed only when you tap Send',
      estimated: true,
    }));
    return json({ ok: true, provider: publicProvider, quotes, quoteMode: 'static' });
  }

  if (op === 'verify') {
    if (!body.to || !body.from) return json({ error: 'Missing to/from addresses' }, { status: 400 });
    const toErr = requiredAddr(body.to);
    const fromErr = requiredAddr(body.from);
    if (toErr) return json({ error: `To address invalid: ${toErr}` }, { status: 400 });
    if (fromErr) return json({ error: `From address invalid: ${fromErr}` }, { status: 400 });

    if (provider === 'letterstream') {
      return json({
        ok: true,
        provider: publicProvider,
        to: {
          provider: publicProvider,
          deliverability: 'deferred',
          note: 'Addresses are validated when your mail is submitted.',
        },
        from: {
          provider: publicProvider,
          deliverability: 'deferred',
          note: 'Addresses are validated when your mail is submitted.',
        },
      });
    }

    try {
      const toVerified = await lobVerifyUsAddress({ apiKey: lobKey, a: body.to });
      const fromVerified = await lobVerifyUsAddress({ apiKey: lobKey, a: body.from });
      return json({ ok: true, provider: publicProvider, to: toVerified, from: fromVerified });
    } catch (e) {
      await logEdgeEvent({
        namespace: 'mailer',
        level: 'error',
        event: 'verify_failed',
        meta: { userId: ctx.user.id, ip: ctx.ip, error: (e as Error)?.message || String(e) },
      });
      return json({ ok: false, error: (e as Error)?.message || 'Verification failed' }, { status: 500 });
    }
  }

  if (!body?.partnerId || !body?.letterId || !body?.pdfBlobRef || !body.to || !body.from) {
    return json({ error: 'Missing required fields' }, { status: 400 });
  }
  const toErr = requiredAddr(body.to);
  const fromErr = requiredAddr(body.from);
  if (toErr) return json({ error: `To address invalid: ${toErr}` }, { status: 400 });
  if (fromErr) return json({ error: `From address invalid: ${fromErr}` }, { status: 400 });

  const mailTestMode = resolveMailTestMode();
  const mailLiveMode = resolveMailLiveMode();
  if (developerLiveMailBlocked({ tier: staffTier, liveMode: mailLiveMode, testMode: mailTestMode })) {
    return json(
      {
        ok: false,
        error:
          'Developer accounts cannot send live physical mail. Enable MAIL_TEST_MODE on the mailer function or use an admin account.',
      },
      { status: 403 },
    );
  }

  try {
    const { path } = parseSupabaseRef(body.pdfBlobRef);
    // Stored paths are "partners/{partnerId}/..." (no leading slash — see
    // src/storage/SupabaseBlobStore.ts), so match without one too.
    if (!path.startsWith(`partners/${body.partnerId}/`)) {
      return json({ error: 'Forbidden (blob not owned by partner)' }, { status: 403 });
    }
  } catch (e) {
    return json({ error: (e as Error)?.message || 'Invalid blob ref' }, { status: 400 });
  }

  {
    const idemKey =
      body.idempotencyKey || `${body.partnerId}:${body.letterId}:${String(body.pdfBlobRef).slice(-64)}`;
    const claim = await claimMailSendIdempotency({
      idemKey: `${ctx.user.id}:${idemKey}`,
      ttlSeconds: 60 * 60 * 24 * 30,
    });
    if (!claim.fresh && claim.receipt) {
      return json({
        ok: true,
        deduped: true,
        provider: publicProvider,
        providerId: claim.receipt.providerId,
        batch: claim.receipt.batch ?? undefined,
        job: claim.receipt.job ?? undefined,
        cost: claim.receipt.cost ?? undefined,
        status: claim.receipt.status,
        code: claim.receipt.code,
        reconciled: claim.receipt.reconciled ?? false,
        message: 'Already mailed — returning saved provider receipt.',
      });
    }
    if (!claim.fresh) {
      return json({
        ok: false,
        error: 'Duplicate mail request — this letter may already be sending. Check vault status before retrying.',
        code: -957,
      }, { status: 409 });
    }
  }

  const supabase = createClient(ctx.supabaseUrl, serviceKey);
  const { bucket, path } = parseSupabaseRef(body.pdfBlobRef);
  const { data: blob, error: downloadErr } = await supabase.storage.from(bucket).download(path);
  if (downloadErr || !blob) {
    return json({ error: downloadErr?.message || 'Could not download PDF' }, { status: 500 });
  }
  const pdfBytes = new Uint8Array(await blob.arrayBuffer());
  const detectedPages = estimatePdfPageCount(pdfBytes);

  try {
    if (provider === 'letterstream') {
      const docId = buildLetterStreamDocId(body.letterId);
      const jobName = resolveEdgeJobName(body, body.letterId);
      const idemKey =
        body.idempotencyKey || `${body.partnerId}:${body.letterId}:${String(body.pdfBlobRef).slice(-64)}`;
      const sendResult = await letterStreamSendReleased({
        to: body.to,
        from: body.from,
        pdfBytes,
        jobName,
        docId,
        options: {
          color: body.options?.color ?? true,
          doubleSided: body.options?.doubleSided ?? true,
          mailType: body.options?.mailType ?? 'firstclass',
          coverSheet: body.options?.coverSheet ?? true,
          pages: detectedPages,
          debug: resolveMailDebugLevel(),
        },
      });

      if (!sendResult.ok) {
        const dupBatch = isLetterStreamDuplicateBatchCode(sendResult.code);
        await logEdgeEvent({
          namespace: 'mailer',
          level: 'error',
          event: dupBatch ? 'send_duplicate_batch' : 'send_failed',
          meta: {
            userId: ctx.user.id,
            ip: ctx.ip,
            partnerId: body.partnerId,
            letterId: body.letterId,
            provider: publicProvider,
            code: sendResult.code,
            error: sendResult.message,
            detectedPages,
            materialized: Boolean(sendResult.job || sendResult.docId),
          },
        });
        return json({
          ok: false,
          provider: publicProvider,
          code: sendResult.code,
          error: sanitizeMailUserMessage(
            dupBatch ? letterStreamErrorLabel(sendResult.code) : sendResult.message,
          ),
        }, { status: dupBatch ? 409 : 500 });
      }

      if (!sendResult.reconciled && !isLetterStreamReleasedCode(sendResult.code)) {
        await logEdgeEvent({
          namespace: 'mailer',
          level: 'error',
          event: 'send_not_released',
          meta: {
            userId: ctx.user.id,
            ip: ctx.ip,
            partnerId: body.partnerId,
            letterId: body.letterId,
            provider: publicProvider,
            code: sendResult.code,
            error: sendResult.message,
            detectedPages,
          },
        });
        return json({
          ok: false,
          provider: publicProvider,
          code: sendResult.code,
          error: sanitizeMailUserMessage(
            sendResult.code === -200
              ? 'Mail provider returned a price quote only — letter was not released. Tap Send again.'
              : sendResult.message || 'Mail provider did not confirm release.',
          ),
        }, { status: 500 });
      }

      const providerId = sendResult.docId || sendResult.job || docId;
      const releaseStatus = 'submitted';
      const receipt = {
        providerId,
        batch: sendResult.batch ?? null,
        job: sendResult.job ?? null,
        cost: sendResult.cost ?? null,
        status: releaseStatus,
        code: sendResult.code,
        sentAt: new Date().toISOString(),
        reconciled: sendResult.reconciled ?? false,
      };
      await saveMailSendReceipt({
        idemKey: `${ctx.user.id}:${idemKey}`,
        receipt,
        ttlSeconds: 60 * 60 * 24 * 30,
      });

      await logEdgeEvent({
        namespace: 'mailer',
        level: 'info',
        event: 'sent',
        meta: {
          userId: ctx.user.id,
          ip: ctx.ip,
          partnerId: body.partnerId,
          letterId: body.letterId,
          provider: publicProvider,
          batch: sendResult.batch ?? null,
          job: sendResult.job ?? null,
          docId: providerId,
          cost: sendResult.cost ?? null,
          code: sendResult.code,
          detectedPages,
          reconciled: sendResult.reconciled ?? false,
        },
      });

      return json({
        ok: true,
        provider: publicProvider,
        providerId,
        batch: sendResult.batch,
        job: sendResult.job,
        cost: sendResult.cost,
        status: releaseStatus,
        code: sendResult.code,
        reconciled: sendResult.reconciled ?? false,
        message: sanitizeMailUserMessage(sendResult.message),
      });
    }

    const { data: signed, error: signedErr } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 10);
    if (signedErr || !signed?.signedUrl) return json({ error: signedErr?.message || 'Signed URL unavailable' }, { status: 500 });

    const lob = await lobCreateLetter({
      apiKey: lobKey,
      to: body.to,
      from: body.from,
      fileUrl: signed.signedUrl,
      color: body.options?.color ?? true,
      doubleSided: body.options?.doubleSided ?? true,
      description: `Finely Cred letter ${body.letterId}`,
    });

    await logEdgeEvent({
      namespace: 'mailer',
      level: 'info',
      event: 'sent',
      meta: {
        userId: ctx.user.id,
        ip: ctx.ip,
        partnerId: body.partnerId,
        letterId: body.letterId,
        providerId: lob?.id ?? null,
        status: lob?.status ?? null,
      },
    });
    return json({
      ok: true,
      provider: publicProvider,
      providerId: lob?.id,
      expectedDeliveryDate: lob?.expected_delivery_date ?? undefined,
      status: lob?.status ?? undefined,
    });
  } catch (e) {
    await logEdgeEvent({
      namespace: 'mailer',
      level: 'error',
      event: 'send_failed',
      meta: {
        userId: ctx.user.id,
        ip: ctx.ip,
        partnerId: body.partnerId,
        letterId: body.letterId,
        provider,
        error: (e as Error)?.message || String(e),
      },
    });
    return json({ ok: false, error: sanitizeMailUserMessage((e as Error)?.message || 'Mailing failed') }, { status: 500 });
  }
});
