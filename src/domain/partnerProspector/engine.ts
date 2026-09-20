import { addIdentity, emptyDedupeIndex, findDedupeHit, identityFromCandidate, primaryDedupeKey } from './dedupe.ts';
import { buildDraftStub } from './draftStub.ts';
import { DEFAULT_METRO_IDS, resolveMetros, resolveVerticals, VERTICAL_LABELS } from './icp.ts';
import { formatPhone, normalizeDomain, normalizeEmail, normalizePhone, normText, safeHttpUrl, slugPart } from './normalize.ts';
import { scoreCandidate } from './score.ts';
import { seedCandidates } from './seed.ts';
import type {
  DedupeIndex,
  PageEnrichment,
  PartnerProspect,
  PartnerVertical,
  ProspectorRunParams,
  ProspectorRunResult,
  ProspectorRunStats,
  RawProspectCandidate,
} from './types.ts';
import { DEFAULT_PROSPECTOR_LIMIT, MAX_PROSPECTOR_LIMIT } from './types.ts';

export type ProspectorAdapters = {
  /** Extra discovery (Serper, etc.). Never required. */
  discover?: (args: { metros: string[]; verticals: PartnerVertical[]; limit: number }) => Promise<RawProspectCandidate[]>;
  enrichPage?: (url: string) => Promise<PageEnrichment | null>;
  loadDedupeIndex?: () => Promise<DedupeIndex>;
  persistBatch?: (result: ProspectorRunResult) => Promise<void>;
  now?: () => string;
  newId?: (prefix: string) => string;
};

function clampLimit(n: unknown): number {
  const x = Math.round(Number(n));
  if (!Number.isFinite(x)) return DEFAULT_PROSPECTOR_LIMIT;
  return Math.max(1, Math.min(MAX_PROSPECTOR_LIMIT, x));
}

function defaultNow() {
  return new Date().toISOString();
}

function defaultId(prefix: string) {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}_${rand}`;
}

function applyEnrichment(candidate: RawProspectCandidate, page: PageEnrichment | null): RawProspectCandidate {
  if (!page) return candidate;
  const email = normalizeEmail(candidate.email) || page.emails.map(normalizeEmail).find(Boolean) || '';
  const phone = normalizePhone(candidate.phone) || page.phones.map(normalizePhone).find(Boolean) || '';
  return {
    ...candidate,
    email: email || candidate.email,
    phone: phone || candidate.phone,
    snippet: candidate.snippet || page.description || page.h1 || page.title,
    sourceUrls: Array.from(new Set([...(candidate.sourceUrls ?? []), ...(candidate.website ? [candidate.website] : [])])),
  };
}

function toProspect(args: {
  candidate: RawProspectCandidate;
  batchId: string;
  now: string;
  id: string;
}): PartnerProspect {
  const scored = scoreCandidate(args.candidate);
  const website = safeHttpUrl(args.candidate.website);
  const city = normText(args.candidate.city);
  const status = scored.fit === 'skip' ? 'skipped' : 'new';
  const row: PartnerProspect = {
    id: args.id,
    batchId: args.batchId,
    createdAt: args.now,
    updatedAt: args.now,
    businessName: normText(args.candidate.businessName),
    personName: normText(args.candidate.personName),
    title: normText(args.candidate.title),
    city,
    metro: normText(args.candidate.metro),
    category: VERTICAL_LABELS[args.candidate.vertical],
    vertical: args.candidate.vertical,
    geo: city ? `${city}, FL` : 'South Florida',
    website,
    phone: formatPhone(args.candidate.phone),
    email: normalizeEmail(args.candidate.email),
    icpFit: scored.fit,
    whyFit: scored.whyFit,
    sourceUrls: Array.from(new Set((args.candidate.sourceUrls ?? []).map(safeHttpUrl).filter(Boolean))),
    sources: Array.from(new Set(args.candidate.sources ?? ['seed'])),
    status,
    draftStub: scored.fit === 'skip' ? '' : buildDraftStub(args.candidate),
    dedupeKey: primaryDedupeKey(args.candidate),
    score: scored.score,
    skipReason: scored.skipReason,
  };
  if (!row.sourceUrls.length && website) row.sourceUrls = [website];
  return row;
}

function mergeCandidates(a: RawProspectCandidate[]): RawProspectCandidate[] {
  const byKey = new Map<string, RawProspectCandidate>();
  for (const c of a) {
    const key =
      normalizeEmail(c.email) ||
      normalizePhone(c.phone) ||
      normalizeDomain(c.website) ||
      `${slugPart(c.businessName)}::${slugPart(c.city)}`;
    const prev = byKey.get(key);
    if (!prev) {
      byKey.set(key, c);
      continue;
    }
    byKey.set(key, {
      ...prev,
      ...c,
      email: prev.email || c.email,
      phone: prev.phone || c.phone,
      website: prev.website || c.website,
      snippet: prev.snippet || c.snippet,
      sourceUrls: Array.from(new Set([...(prev.sourceUrls ?? []), ...(c.sourceUrls ?? [])])),
      sources: Array.from(new Set([...(prev.sources ?? []), ...(c.sources ?? [])])),
    });
  }
  return [...byKey.values()];
}

function balanceByVertical(rows: PartnerProspect[], limit: number, verticals: PartnerVertical[]): PartnerProspect[] {
  const keepable = rows.filter((r) => r.icpFit !== 'skip').sort((a, b) => b.score - a.score || a.businessName.localeCompare(b.businessName));
  const per = Math.max(1, Math.floor(limit / Math.max(1, verticals.length)));
  const picked: PartnerProspect[] = [];
  const used = new Set<string>();

  for (const v of verticals) {
    const slice = keepable.filter((r) => r.vertical === v).slice(0, per);
    for (const r of slice) {
      picked.push(r);
      used.add(r.id);
    }
  }
  if (picked.length < limit) {
    for (const r of keepable) {
      if (picked.length >= limit) break;
      if (used.has(r.id)) continue;
      picked.push(r);
      used.add(r.id);
    }
  }
  return picked.slice(0, limit);
}

function statsOf(kept: PartnerProspect[], skipped: PartnerProspect[], discovered: number, enriched: number, deduped: number): ProspectorRunStats {
  const byVertical: Record<string, number> = {};
  for (const r of kept) byVertical[r.vertical] = (byVertical[r.vertical] ?? 0) + 1;
  return {
    discovered,
    enriched,
    strong: kept.filter((r) => r.icpFit === 'strong').length,
    maybe: kept.filter((r) => r.icpFit === 'maybe').length,
    skipped: skipped.length,
    deduped,
    kept: kept.length,
    byVertical,
  };
}

/**
 * Shared Partner Prospector engine. Used by admin UI, the agent tool, tests, and CLI.
 * Does not send email. Does not invent phone/email.
 */
export async function prospectReferralPartners(
  params: ProspectorRunParams = {},
  adapters: ProspectorAdapters = {},
): Promise<ProspectorRunResult> {
  const metros = resolveMetros(params.metros).map((m) => m.id);
  const verticals = resolveVerticals(params.verticals);
  const limit = clampLimit(params.limit);
  const dedupe = params.dedupe !== false;
  const enrich = params.enrich === true;
  const now = (adapters.now ?? defaultNow)();
  const newId = adapters.newId ?? defaultId;
  const batchId = newId('ppbatch');

  const seed = seedCandidates({ metros, verticals });
  let extras: RawProspectCandidate[] = [];
  if (adapters.discover) {
    extras = await adapters.discover({ metros, verticals, limit });
  }
  const discovered = mergeCandidates([...seed, ...extras]);

  let enrichedCount = 0;
  const afterEnrich: RawProspectCandidate[] = [];
  for (const c of discovered) {
    if (enrich && adapters.enrichPage && c.website) {
      try {
        const page = await adapters.enrichPage(c.website);
        if (page) enrichedCount += 1;
        afterEnrich.push(applyEnrichment(c, page));
      } catch {
        afterEnrich.push(c);
      }
    } else {
      afterEnrich.push(c);
    }
  }

  const index = adapters.loadDedupeIndex ? await adapters.loadDedupeIndex() : emptyDedupeIndex();
  const skipped: PartnerProspect[] = [];
  const scored: PartnerProspect[] = [];
  let deduped = 0;

  for (const c of afterEnrich) {
    const row = toProspect({ candidate: c, batchId, now, id: newId('pprow') });
    if (dedupe) {
      const hit = findDedupeHit(index, c);
      if (hit) {
        deduped += 1;
        skipped.push({ ...row, icpFit: 'skip', status: 'skipped', skipReason: 'duplicate', whyFit: `Skip — already in CRM / prior batch (${hit}).` });
        continue;
      }
    }
    if (row.icpFit === 'skip') {
      skipped.push(row);
      continue;
    }
    scored.push(row);
    addIdentity(index, identityFromCandidate(c));
  }

  const kept = balanceByVertical(scored, limit, verticals);

  const source: ProspectorRunResult['source'] = extras.length ? 'search+seed' : 'seed';
  const result: ProspectorRunResult = {
    batchId,
    createdAt: now,
    params: { metros, verticals, limit, dedupe, enrich },
    prospects: kept,
    skipped,
    stats: statsOf(kept, skipped, discovered.length, enrichedCount, deduped),
    source,
    outreach: {
      autoSend: false,
      note: 'Draft/export only. This engine never sends partner outreach.',
    },
  };

  if (adapters.persistBatch) {
    await adapters.persistBatch(result);
  }

  return result;
}

export function defaultMetroIds(): string[] {
  return [...DEFAULT_METRO_IDS];
}
