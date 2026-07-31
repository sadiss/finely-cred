/**
 * Safe recipient mailing-address enrichment for letter studio.
 * Prefer structured case / report / document / directory data.
 * Optional web lookup (Serper via edge) only when configured — never invents legal strategy.
 */

import { isSupabaseConfigured, supabase } from './supabaseClient';
import {
  lookupKnownCreditor,
  lookupKnownCreditorFromCandidates,
  type KnownCreditorEntry,
} from './knownCreditorDirectory';

export type StructuredMailingAddress = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  formatted: string;
};

export type AddressEnrichmentSource =
  | 'case'
  | 'document'
  | 'tradeline'
  | 'directory'
  | 'web'
  | 'manual'
  | 'missing';

export type AddressEnrichmentResult = {
  name: string;
  address: string;
  structured: StructuredMailingAddress | null;
  source: AddressEnrichmentSource;
  confidence: 'high' | 'medium' | 'low';
  verifyRequired: boolean;
  hint: string;
  phone?: string;
  kind?: KnownCreditorEntry['kind'];
};

export type AddressEnrichmentInput = {
  /** Firm / collector / attorney / creditor name candidates (priority order). */
  nameCandidates?: Array<string | null | undefined>;
  /** Existing address blocks already on the case / draft. */
  addressCandidates?: Array<string | null | undefined>;
  phone?: string | null;
  /** Prefer counsel (court track) vs collector (validation). */
  preferCounsel?: boolean;
};

const US_STATE =
  '(?:A[LKZR]|C[AOT]|D[EC]|F[LM]|G[AU]|HI|I[ADLN]|K[SY]|LA|M[ADEHINOST]|N[CDEHJMVY]|O[HKR]|P[AWR]|RI|S[CD]|T[NX]|UT|V[AIT]|W[AIVY])';

function clean(v?: string | null): string {
  return String(v ?? '').trim();
}

function firstNonEmpty(list: Array<string | null | undefined>): string {
  for (const x of list) {
    const t = clean(x);
    if (t) return t;
  }
  return '';
}

/** Parse a freeform mailing block into street / city / state / zip when possible. */
export function parseMailingAddress(raw: string): StructuredMailingAddress | null {
  const text = clean(raw).replace(/\r\n/g, '\n');
  if (!text) return null;

  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (!lines.length) return null;

  const joined = lines.join(', ');
  const cityStateZip =
    joined.match(
      new RegExp(`([A-Za-z .'-]+),?\\s*(${US_STATE})\\s+(\\d{5}(?:-\\d{4})?)\\s*$`, 'i'),
    ) ||
    text.match(new RegExp(`([A-Za-z .'-]+),?\\s*(${US_STATE})\\s+(\\d{5}(?:-\\d{4})?)`, 'i'));

  if (!cityStateZip) {
    // Single-line PO Box patterns still useful as line1
    if (/p\.?\s*o\.?\s*box/i.test(text) || /\d/.test(text)) {
      return {
        line1: lines[0] || text,
        line2: lines.length > 1 ? lines.slice(1).join(', ') : undefined,
        city: '',
        state: '',
        zip: '',
        formatted: text,
      };
    }
    return null;
  }

  const city = clean(cityStateZip[1]).replace(/,$/, '');
  const state = clean(cityStateZip[2]).toUpperCase();
  const zip = clean(cityStateZip[3]);

  // Street lines = everything before the city/state/zip match
  const before = text.slice(0, cityStateZip.index ?? 0).replace(/[,\s]+$/, '');
  const streetLines = before
    .split(/\n|,/)
    .map((l) => l.trim())
    .filter(Boolean);
  // Drop a trailing city fragment if duplicated
  const filtered = streetLines.filter((l) => clean(l).toLowerCase() !== city.toLowerCase());
  const line1 = filtered[0] || lines[0] || '';
  const line2 = filtered.length > 1 ? filtered.slice(1).join(', ') : undefined;
  if (!line1) return null;

  const formatted = [line1, line2, `${city}, ${state} ${zip}`].filter(Boolean).join('\n');
  return { line1, line2, city, state, zip, formatted };
}

export function formatStructuredMailingAddress(a: StructuredMailingAddress): string {
  return [a.line1, a.line2, [a.city, a.state].filter(Boolean).join(', ') + (a.zip ? ` ${a.zip}` : '')]
    .map((x) => clean(x))
    .filter(Boolean)
    .join('\n');
}

function resultFromDirectory(entry: KnownCreditorEntry): AddressEnrichmentResult {
  const structured = parseMailingAddress(entry.address);
  return {
    name: entry.displayName,
    address: entry.address,
    structured,
    source: 'directory',
    confidence: 'high',
    verifyRequired: true,
    hint: 'Filled from Finely known creditor / law-firm directory — verify before mailing.',
    phone: entry.phone,
    kind: entry.kind,
  };
}

function resultFromAddress(args: {
  name: string;
  address: string;
  source: AddressEnrichmentSource;
  confidence: AddressEnrichmentResult['confidence'];
  phone?: string;
  hint: string;
}): AddressEnrichmentResult {
  return {
    name: args.name,
    address: args.address,
    structured: parseMailingAddress(args.address),
    source: args.source,
    confidence: args.confidence,
    verifyRequired: args.source !== 'case',
    hint: args.hint,
    phone: args.phone,
  };
}

/**
 * Sync enrichment: case fields → directory catalog.
 * Does not call the network.
 */
export function enrichRecipientAddressSync(input: AddressEnrichmentInput): AddressEnrichmentResult | null {
  const names = (input.nameCandidates || []).map(clean).filter(Boolean);
  const addresses = (input.addressCandidates || []).map(clean).filter(Boolean);

  const existingAddress = addresses[0] || '';
  const existingName = names[0] || '';

  if (existingAddress) {
    const structured = parseMailingAddress(existingAddress);
    const complete = Boolean(structured?.city && structured?.state && structured?.zip);
    return {
      name: existingName || 'Recipient',
      address: existingAddress,
      structured,
      source: 'case',
      confidence: complete ? 'high' : 'medium',
      verifyRequired: !complete,
      hint: complete
        ? 'Using mailing address already on the case.'
        : 'Address on file — confirm city, state, and ZIP before mailing.',
      phone: clean(input.phone) || undefined,
    };
  }

  // Counsel-first when court track
  const orderedNames = input.preferCounsel
    ? names
    : [...names].sort((a, b) => {
        const aFirm = /law|llp|pllc|p\.?c\.?|attorney|counsel/i.test(a) ? 1 : 0;
        const bFirm = /law|llp|pllc|p\.?c\.?|attorney|counsel/i.test(b) ? 1 : 0;
        return bFirm - aFirm;
      });

  const hit = lookupKnownCreditorFromCandidates(orderedNames.length ? orderedNames : names);
  if (hit?.address) return resultFromDirectory(hit);

  if (existingName) {
    const solo = lookupKnownCreditor(existingName);
    if (solo?.address) return resultFromDirectory(solo);
  }

  return null;
}

type WebLookupRow = {
  name?: string;
  address?: string;
  phone?: string;
  snippet?: string;
};

/**
 * Optional web / edge lookup. When SERPER_API_KEY is not configured on the edge
 * function, returns catalog result (or null) with clear verify UX — never fabricates.
 */
export async function enrichRecipientAddress(
  input: AddressEnrichmentInput,
): Promise<AddressEnrichmentResult | null> {
  const sync = enrichRecipientAddressSync(input);
  if (sync && (sync.source === 'case' || sync.source === 'directory') && sync.confidence === 'high') {
    return sync;
  }

  const queryName = firstNonEmpty(input.nameCandidates || []);
  if (!queryName || !isSupabaseConfigured) {
    return sync;
  }

  try {
    const { data, error } = await supabase.functions.invoke('creditor-address-lookup', {
      body: {
        query: queryName,
        preferCounsel: Boolean(input.preferCounsel),
      },
    });
    if (error || !data?.ok) {
      return (
        sync ||
        resultFromAddress({
          name: queryName,
          address: '',
          source: 'missing',
          confidence: 'low',
          hint: data?.note
            ? String(data.note)
            : 'Web address lookup unavailable — add the mailing address manually or use directory match.',
        })
      );
    }

    const rows = Array.isArray(data.results) ? (data.results as WebLookupRow[]) : [];
    const best = rows.find((r) => clean(r.address));
    if (!best?.address) {
      return (
        sync || {
          name: queryName,
          address: '',
          structured: null,
          source: 'missing',
          confidence: 'low',
          verifyRequired: true,
          hint: 'No mailing address found — enter the address from the collection notice or summons letterhead.',
        }
      );
    }

    return {
      name: clean(best.name) || queryName,
      address: clean(best.address),
      structured: parseMailingAddress(String(best.address)),
      source: 'web',
      confidence: 'medium',
      verifyRequired: true,
      hint: 'Suggested from web lookup — verify against the summons / collection notice before mailing.',
      phone: clean(best.phone) || undefined,
    };
  } catch {
    return sync;
  }
}

/** Apply enrichment onto debt-like field patch (recipient + counsel when firm-like). */
export function enrichmentToDebtPatch(result: AddressEnrichmentResult): {
  recipientName?: string;
  recipientAddress?: string;
  recipientPhone?: string;
  plaintiffLawFirm?: string;
  plaintiffLawFirmAddress?: string;
  collectorName?: string;
} {
  if (!result.address) {
    return result.name ? { recipientName: result.name } : {};
  }
  const firmLike = result.kind === 'law_firm' || /law|llp|pllc|p\.?c\.?/i.test(result.name);
  return {
    recipientName: result.name,
    recipientAddress: result.address,
    recipientPhone: result.phone,
    collectorName: firmLike ? undefined : result.name,
    plaintiffLawFirm: firmLike ? result.name : undefined,
    plaintiffLawFirmAddress: firmLike ? result.address : undefined,
  };
}

export function enrichmentSourceLabel(source: AddressEnrichmentSource): string {
  switch (source) {
    case 'case':
      return 'On case';
    case 'document':
      return 'From document';
    case 'tradeline':
      return 'From report';
    case 'directory':
      return 'Directory';
    case 'web':
      return 'Web lookup';
    case 'manual':
      return 'Manual';
    default:
      return 'Missing';
  }
}
