/**
 * One HMDA + one SBA lookup per state (client + proxy cache).
 * Overlay onto existing lender cards — never a second lender list.
 */

import {
  fetchHmdaStateSummary,
  fetchSbaStateSummary,
  lookupZip,
  type HmdaStateSummary,
  type SbaStateSummary,
} from './publicDataClient';
import { isNoraCapitalConfigured } from '../data/settingsRepo';
import { noraPullLenderCatalog, type NoraLenderCatalogEntry } from './noraCapitalPullClient';

export type LenderMarketSignals = {
  state: string;
  hmda: HmdaStateSummary | null;
  sba: SbaStateSummary | null;
  /** Name-match only. Empty when Nora is not configured or pull.lenderCatalog is unimplemented. */
  noraBanks: string[];
  noraNote?: string;
};

const CLIENT_TTL_MS = 6 * 60 * 60 * 1000;
const cache = new Map<string, { at: number; value: LenderMarketSignals }>();
const inflight = new Map<string, Promise<LenderMarketSignals>>();

function normName(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function namesOverlap(a: string, b: string): boolean {
  const left = normName(a);
  const right = normName(b);
  if (!left || !right) return false;
  if (left === right) return true;
  return left.includes(right) || right.includes(left);
}

export function formatLenderMarketLine(signals: LenderMarketSignals | null): string | null {
  if (!signals) return null;
  const parts: string[] = [];
  if (signals.hmda && (signals.hmda.originated > 0 || signals.hmda.denied > 0)) {
    parts.push(
      `${signals.state} HMDA ${signals.hmda.year}: ${signals.hmda.originated.toLocaleString()} originated` +
        (signals.hmda.denied ? ` · ${signals.hmda.denied.toLocaleString()} denied` : ''),
    );
  }
  if (signals.sba?.available && signals.sba.loanCount > 0) {
    parts.push(`SBA 7(a)/504 FOIA: ${signals.sba.loanCount.toLocaleString()} approvals in ${signals.state}`);
  }
  if (!parts.length) return null;
  return `${parts.join(' · ')}. Funding subject to underwriting · results vary.`;
}

export function lenderHasSbaActivity(bank: string, signals: LenderMarketSignals | null): boolean {
  if (!signals?.sba?.lenderNames?.length) return false;
  return signals.sba.lenderNames.some((name) => namesOverlap(bank, name));
}

export function lenderInNoraCatalog(bank: string, signals: LenderMarketSignals | null): boolean {
  if (!signals?.noraBanks.length) return false;
  return signals.noraBanks.some((name) => namesOverlap(bank, name));
}

async function pullNoraBankNames(args: { state: string; zip?: string }): Promise<{ banks: string[]; note?: string }> {
  if (!isNoraCapitalConfigured()) {
    return { banks: [], note: 'Nora catalog not implemented here — configure Nora Capital first.' };
  }
  try {
    const res = await noraPullLenderCatalog({ state: args.state, zip: args.zip });
    const rows: NoraLenderCatalogEntry[] = res.lenders ?? [];
    if (!res.ok && !rows.length) {
      return { banks: [], note: res.error || 'Nora pull.lenderCatalog not implemented on the far side.' };
    }
    return { banks: rows.map((row) => row.bank).filter(Boolean) };
  } catch {
    return { banks: [], note: 'Nora catalog pull failed — skipped.' };
  }
}

export async function resolveLenderMarketSignals(args: {
  state?: string;
  zip?: string;
}): Promise<LenderMarketSignals | null> {
  let state = (args.state || '').trim().toUpperCase().slice(0, 2);
  if (!/^[A-Z]{2}$/.test(state) && (args.zip || '').trim().length >= 5) {
    const zipRes = await lookupZip(args.zip!.trim().slice(0, 5));
    const place = zipRes.data?.places?.[0];
    state = String(place?.['state abbreviation'] || place?.state || '')
      .trim()
      .toUpperCase()
      .slice(0, 2);
  }
  if (!/^[A-Z]{2}$/.test(state)) return null;

  const key = `${state}|${(args.zip || '').slice(0, 5)}`;
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CLIENT_TTL_MS) return hit.value;

  const pending = inflight.get(key);
  if (pending) return pending;

  const work = (async () => {
    const [hmdaRes, sbaRes, nora] = await Promise.all([
      fetchHmdaStateSummary({ state }),
      fetchSbaStateSummary({ state }),
      pullNoraBankNames({ state, zip: args.zip }),
    ]);
    const value: LenderMarketSignals = {
      state,
      hmda: hmdaRes.ok ? hmdaRes.data ?? null : null,
      sba: sbaRes.ok ? sbaRes.data ?? null : null,
      noraBanks: nora.banks,
      noraNote: nora.note,
    };
    cache.set(key, { at: Date.now(), value });
    return value;
  })().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, work);
  return work;
}
