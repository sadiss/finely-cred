/** LetterStream physical mail API — https://www.letterstream.com/apis/index.php */
import { sanitizeMailUserMessage } from './mailWhiteLabel.ts';

export type LetterStreamMailAddress = {
  name: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  zip: string;
};

export type LetterStreamSendOptions = {
  mailType?: 'firstclass' | 'firstclass_hse' | 'certified' | 'certnoerr' | 'postcard' | 'flat' | 'propostcard';
  color?: boolean;
  doubleSided?: boolean;
  coverSheet?: boolean;
  paper?: string;
  preauth?: boolean;
  debug?: 1 | 2 | 3;
  pages?: number;
};

export type LetterStreamParsedMessage = {
  type?: string;
  code: number;
  details: string;
  batch?: string;
  quantity?: number;
  cost?: number;
  authcode?: string;
  docs?: Array<{ id?: string; job?: string; cost?: number }>;
};

export type LetterStreamResponse = {
  raw: string;
  messages: LetterStreamParsedMessage[];
  apiId?: string;
};

const API_URL = 'https://www.letterstream.com/apis/index.php';

export function trimLetterStreamEnv(name: string): string {
  return (Deno.env.get(name) || '').trim();
}

export function getLetterStreamCredentials(): { apiId: string; apiKey: string } | null {
  const apiId =
    trimLetterStreamEnv('MAIL_API_ID') ||
    trimLetterStreamEnv('LETTERSTREAM_API_ID') ||
    trimLetterStreamEnv('API_ID');
  const apiKey =
    trimLetterStreamEnv('MAIL_API_KEY') ||
    trimLetterStreamEnv('LETTERSTREAM_API_KEY') ||
    trimLetterStreamEnv('API_KEY');
  if (!apiId || !apiKey) return null;
  return { apiId, apiKey };
}

export function isLetterStreamConfigured(): boolean {
  return Boolean(getLetterStreamCredentials());
}

/** Per LetterStream docs: substr(t,-6) + api_key + substr(t,0,6) → base64 → md5 */
export async function buildLetterStreamAuthHash(apiKey: string, uniqueId: string): Promise<string> {
  const t = String(uniqueId);
  const stringToHash = t.slice(-6) + apiKey + t.slice(0, 6);
  const b64 = btoa(stringToHash);
  const { createHash } = await import('node:crypto');
  return createHash('md5').update(b64).digest('hex');
}

export function buildLetterStreamUniqueId(): string {
  return String(Date.now());
}

function splitName(name: string): { n1: string; n2: string } {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { n1: 'Recipient', n2: '' };
  if (parts.length === 1) return { n1: parts[0]!, n2: '' };
  return { n1: parts[0]!, n2: parts.slice(1).join(' ') };
}

function sanitizeState(state: string): string {
  return (state || '').trim().toUpperCase().slice(0, 2);
}

function sanitizeZip(zip: string): string {
  const digits = (zip || '').replace(/\D/g, '');
  if (digits.length >= 9) return `${digits.slice(0, 5)}-${digits.slice(5, 9)}`;
  return digits.slice(0, 10);
}

export function formatLetterStreamTo(addr: LetterStreamMailAddress, docId: string): string {
  const { n1, n2 } = splitName(addr.name);
  return [
    docId,
    n1,
    n2,
    addr.addressLine1.trim(),
    (addr.addressLine2 || '').trim(),
    addr.city.trim(),
    sanitizeState(addr.state),
    sanitizeZip(addr.zip),
  ].join(':');
}

export function formatLetterStreamFrom(addr: LetterStreamMailAddress): string {
  const { n1, n2 } = splitName(addr.name);
  return [
    n1,
    n2,
    addr.addressLine1.trim(),
    (addr.addressLine2 || '').trim(),
    addr.city.trim(),
    sanitizeState(addr.state),
    sanitizeZip(addr.zip),
  ].join(':');
}

export function buildLetterStreamDocId(seed: string): string {
  const clean = seed.replace(/[^a-zA-Z0-9]/g, '');
  if (clean.length >= 6) return clean.slice(0, 20);
  return `fc${clean}${Date.now().toString().slice(-8)}`.slice(0, 20);
}

export function buildLetterStreamJobName(seed: string): string {
  const clean = seed.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 12);
  const suffix = Date.now().toString(36).slice(-6);
  let job = `${clean || 'finely'}_${suffix}`.slice(0, 20);
  if (job.length < 8) job = `finely_${suffix}`.slice(0, 20);
  while (job.length < 8) job += '0';
  return job;
}

export function estimatePdfPageCount(bytes: Uint8Array): number {
  const text = new TextDecoder('latin1').decode(bytes);
  const matches = text.match(/\/Type\s*\/Page[^s]/g);
  return Math.max(1, matches?.length ?? 1);
}

export function parseLetterStreamResponse(raw: string): LetterStreamResponse {
  const messages: LetterStreamParsedMessage[] = [];
  const apiId = raw.match(/<messages\s+id="([^"]+)"/)?.[1];

  const messageBlocks = raw.match(/<message[^>]*>[\s\S]*?<\/message>/g) ?? [];
  for (const block of messageBlocks) {
    const code = Number(block.match(/<code>(-?\d+)<\/code>/)?.[1] ?? '0');
    const details = block.match(/<details>([^<]*)<\/details>/)?.[1]?.trim() ?? '';
    const type = block.match(/type="([^"]+)"/)?.[1];
    const batch = block.match(/<batch>([^<]*)<\/batch>/)?.[1]?.trim();
    const quantity = block.match(/<quantity>(\d+)<\/quantity>/)?.[1];
    const cost = block.match(/<cost>([\d.]+)<\/cost>/)?.[1];
    const authcode = block.match(/<authcode>([^<]*)<\/authcode>/)?.[1]?.trim();
    const docs: LetterStreamParsedMessage['docs'] = [];
    for (const docBlock of block.match(/<doc>[\s\S]*?<\/doc>/g) ?? []) {
      docs.push({
        id: docBlock.match(/<id>([^<]*)<\/id>/)?.[1]?.trim(),
        job: docBlock.match(/<job>([^<]*)<\/job>/)?.[1]?.trim(),
        cost: docBlock.match(/<cost>([\d.]+)<\/cost>/)?.[1] ? Number(docBlock.match(/<cost>([\d.]+)<\/cost>/)![1]) : undefined,
      });
    }
    messages.push({
      type,
      code,
      details,
      batch,
      quantity: quantity ? Number(quantity) : undefined,
      cost: cost ? Number(cost) : undefined,
      authcode,
      docs: docs.length ? docs : undefined,
    });
  }

  if (!messages.length) {
    const plain = raw.trim();
    if (/^AUTHOK\b/i.test(plain)) {
      messages.push({ code: -199, details: plain, type: 'info' });
    } else if (/^IDOK\b/i.test(plain)) {
      messages.push({ code: -958, details: plain, type: 'error' });
    } else if (/^DUP\b/i.test(plain)) {
      messages.push({ code: -957, details: plain, type: 'error' });
    } else if (/^BAD\b/i.test(plain)) {
      messages.push({ code: -959, details: plain, type: 'error' });
    }
  }

  return { raw, messages, apiId };
}

export function letterStreamErrorLabel(code: number): string {
  const map: Record<number, string> = {
    [-101]: 'Insufficient mailing balance — add prepaid funds to your mail account',
    [-200]: 'Price quote ready — authorize to release into production',
    [-911]: 'Insufficient mailing balance — job queued until account is funded',
    [-920]: 'Mail API credentials incomplete',
    [-950]: 'Mail authentication failed',
    [-952]: 'Mail authentication failed — missing API id',
    [-953]: 'Mail authentication failed — missing signature',
    [-954]: 'Mail authentication failed — invalid timestamp',
    [-955]: 'Mail authentication failed — missing request id',
    [-956]: 'Mail authentication failed — invalid account link',
    [-957]: 'Mail authentication failed — duplicate request (retry)',
    [-958]: 'Mail authentication failed — invalid signature',
    [-959]: 'Mail authentication failed — invalid API id',
    [-900]: 'Job name must be 8–20 characters (a-zA-Z0-9_-)',
    [-901]: 'Missing recipient address',
    [-902]: 'Missing sender address',
    [-910]: 'Missing document file',
    [-916]: 'Could not read PDF',
    [-980]: 'Mail service maintenance — try again later',
    [-997]: 'Rate limit exceeded',
  };
  return sanitizeMailUserMessage(map[code] ?? `Mail service error ${code}`);
}

export function isLetterStreamSuccessCode(code: number): boolean {
  return [-100, -103, -104, -110, -150, -199, -200].includes(code);
}

export async function letterStreamAuthPing(args?: { debug?: 1 | 2 | 3 }): Promise<LetterStreamResponse> {
  const creds = getLetterStreamCredentials();
  if (!creds) throw new Error('LETTERSTREAM_API_ID / LETTERSTREAM_API_KEY missing');

  const uniqueId = buildLetterStreamUniqueId();
  const hash = await buildLetterStreamAuthHash(creds.apiKey, uniqueId);
  const form = new FormData();
  form.set('a', creds.apiId);
  form.set('h', hash);
  form.set('t', uniqueId);
  if (args?.debug) form.set('debug', String(args.debug));

  const res = await fetch(API_URL, { method: 'POST', body: form });
  const raw = await res.text();
  return parseLetterStreamResponse(raw);
}

export async function letterStreamSendSingleFile(args: {
  to: LetterStreamMailAddress;
  from: LetterStreamMailAddress;
  pdfBytes: Uint8Array;
  jobName: string;
  docId: string;
  options?: LetterStreamSendOptions;
}): Promise<LetterStreamResponse> {
  const creds = getLetterStreamCredentials();
  if (!creds) throw new Error('LETTERSTREAM_API_ID / LETTERSTREAM_API_KEY missing');

  const uniqueId = buildLetterStreamUniqueId();
  const hash = await buildLetterStreamAuthHash(creds.apiKey, uniqueId);
  const opts = args.options ?? {};
  const pages = opts.pages ?? estimatePdfPageCount(args.pdfBytes);

  const form = new FormData();
  form.set('a', creds.apiId);
  form.set('h', hash);
  form.set('t', uniqueId);
  form.set('job', args.jobName);
  form.set('from', formatLetterStreamFrom(args.from));
  form.append('to[]', formatLetterStreamTo(args.to, args.docId));
  form.set('pages', String(pages));
  form.set('mailtype', opts.mailType ?? 'firstclass');
  form.set('coversheet', (opts.coverSheet ?? true) ? 'true' : 'false');
  form.set('duplex', (opts.doubleSided ?? true) ? 'Y' : 'N');
  form.set('ink', (opts.color ?? true) ? 'C' : 'B');
  form.set('paper', opts.paper ?? 'W');
  if (opts.preauth) form.set('preauth', '1');
  if (opts.debug) form.set('debug', String(opts.debug));
  form.append(
    'single_file',
    new Blob([args.pdfBytes], { type: 'application/pdf' }),
    `${args.docId}.pdf`,
  );

  const res = await fetch(API_URL, { method: 'POST', body: form });
  const raw = await res.text();
  return parseLetterStreamResponse(raw);
}

export async function letterStreamAuthorizePreauth(authcode: string): Promise<LetterStreamResponse> {
  const creds = getLetterStreamCredentials();
  if (!creds) throw new Error('LETTERSTREAM_API_ID / LETTERSTREAM_API_KEY missing');

  const uniqueId = buildLetterStreamUniqueId();
  const hash = await buildLetterStreamAuthHash(creds.apiKey, uniqueId);
  const form = new FormData();
  form.set('a', creds.apiId);
  form.set('h', hash);
  form.set('t', uniqueId);
  form.set('doauth', authcode);

  const res = await fetch(API_URL, { method: 'POST', body: form });
  const raw = await res.text();
  return parseLetterStreamResponse(raw);
}

export function summarizeLetterStreamResponse(parsed: LetterStreamResponse): {
  ok: boolean;
  code: number;
  message: string;
  batch?: string;
  job?: string;
  docId?: string;
  cost?: number;
  authcode?: string;
} {
  const msg = parsed.messages[0];
  if (!msg) return { ok: false, code: -999, message: 'Empty mail service response' };

  const ok = isLetterStreamSuccessCode(msg.code);
  const label = letterStreamErrorLabel(msg.code);
  const message = sanitizeMailUserMessage(msg.details || label);
  const doc = msg.docs?.[0];

  return {
    ok,
    code: msg.code,
    message,
    batch: msg.batch,
    job: doc?.job,
    docId: doc?.id,
    cost: msg.cost ?? doc?.cost,
    authcode: msg.authcode,
  };
}
