/**
 * LawHelp / LSC finder helper — uses cached Zippopotam lookup (public-data proxy).
 * Does not scrape legal-aid sites. Educational referral only.
 */

import { lookupZip, type ZipLookupResult } from './publicDataClient';

export type LawHelpMatch = {
  zip: string;
  state: string;
  stateName: string;
  city: string;
  lawHelpUrl: string;
  lscUrl: string;
  networkUrl: string;
  cached: boolean;
  stale?: boolean;
};

const zipCache = new Map<string, { at: number; match: LawHelpMatch }>();
const ZIP_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Curated LawHelp network homepages — partners still confirm the office on the site. */
const STATE_NETWORK: Record<string, string> = {
  AL: 'https://www.alabamalegalhelp.org/',
  AK: 'https://www.alaskalawhelp.org/',
  AZ: 'https://www.azlawhelp.org/',
  AR: 'https://www.arlegalservices.org/',
  CA: 'https://www.lawhelpca.org/',
  CO: 'https://www.coloradolegalservices.org/',
  CT: 'https://ctlawhelp.org/',
  DE: 'https://www.delegalhelplink.org/',
  DC: 'https://www.lawhelp.org/dc',
  FL: 'https://www.floridalawhelp.org/',
  GA: 'https://www.georgialegalaid.org/',
  HI: 'https://www.lawhelp.org/hi',
  ID: 'https://www.idaholegalaid.org/',
  IL: 'https://www.illinoislegalaid.org/',
  IN: 'https://www.indianalegalservices.org/',
  IA: 'https://www.iowalegalaid.org/',
  KS: 'https://www.kansaslegalservices.org/',
  KY: 'https://www.kyjustice.org/',
  LA: 'https://www.lawhelpla.org/',
  ME: 'https://www.helpmelaw.org/',
  MD: 'https://www.peoples-law.org/',
  MA: 'https://www.masslegalservices.org/',
  MI: 'https://www.michiganlegalhelp.org/',
  MN: 'https://www.lawhelpmn.org/',
  MS: 'https://www.mslegalservices.org/',
  MO: 'https://www.lsmo.org/',
  MT: 'https://www.mtlsa.org/',
  NE: 'https://www.legalaidofnebraska.org/',
  NV: 'https://www.nevadalawhelp.org/',
  NH: 'https://www.nhlegalaid.org/',
  NJ: 'https://www.lsnjlaw.org/',
  NM: 'https://www.lawhelpnewmexico.org/',
  NY: 'https://www.lawhelpny.org/',
  NC: 'https://www.lawhelpnc.org/',
  ND: 'https://www.legalassist.org/',
  OH: 'https://www.ohiolegalhelp.org/',
  OK: 'https://www.oklaw.org/',
  OR: 'https://www.oregonlawhelp.org/',
  PA: 'https://www.palawhelp.org/',
  RI: 'https://www.helprilaw.org/',
  SC: 'https://www.sclegal.org/',
  SD: 'https://www.sdlawhelp.org/',
  TN: 'https://www.help4tn.org/',
  TX: 'https://www.texaslawhelp.org/',
  UT: 'https://www.utahlegalservices.org/',
  VT: 'https://vtlawhelp.org/',
  VA: 'https://www.valegalaid.org/',
  WA: 'https://www.washingtonlawhelp.org/',
  WV: 'https://www.lawv.net/',
  WI: 'https://www.wisconsinlawhelp.org/',
  WY: 'https://www.lawwyoming.org/',
};

export function normalizeUsZip(raw: string | undefined | null): string | null {
  const digits = String(raw ?? '').replace(/\D/g, '').slice(0, 5);
  return digits.length === 5 ? digits : null;
}

export function lawHelpUrlForState(state: string | undefined | null): string {
  const code = String(state ?? '').trim().toUpperCase();
  return STATE_NETWORK[code] ?? 'https://www.lawhelp.org/';
}

function matchFromPlaces(zip: string, data: ZipLookupResult, cached: boolean, stale?: boolean): LawHelpMatch | null {
  const place = data.places?.[0];
  const state = String(place?.['state abbreviation'] ?? '').trim().toUpperCase();
  if (!state) return null;
  return {
    zip,
    state,
    stateName: String(place.state ?? state),
    city: String(place['place name'] ?? ''),
    lawHelpUrl: 'https://www.lawhelp.org/',
    lscUrl: 'https://www.lsc.gov/i-need-legal-help',
    networkUrl: lawHelpUrlForState(state),
    cached,
    stale,
  };
}

export async function findLawHelpByZip(rawZip: string): Promise<{ ok: true; match: LawHelpMatch } | { ok: false; error: string }> {
  const zip = normalizeUsZip(rawZip);
  if (!zip) return { ok: false, error: 'Enter a 5-digit U.S. ZIP.' };

  const hit = zipCache.get(zip);
  if (hit && Date.now() - hit.at < ZIP_TTL_MS) {
    return { ok: true, match: { ...hit.match, cached: true } };
  }

  const result = await lookupZip(zip);
  if (!result.ok || !result.data) {
    return { ok: false, error: result.error === 'not_configured' ? 'Public-data lookup is not configured.' : 'ZIP lookup failed. Try LawHelp.org directly.' };
  }

  const match = matchFromPlaces(zip, result.data, Boolean(result.cached), result.stale);
  if (!match) return { ok: false, error: 'No U.S. place matched that ZIP.' };
  zipCache.set(zip, { at: Date.now(), match });
  return { ok: true, match };
}
