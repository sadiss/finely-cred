/**
 * Partner-prospector identity keys (email / last-10 phone / registrable domain / name+city).
 *
 * Verified on GitHub: `scripts/lead_intel/dedupe_prospects.py` exists on
 * `launch/ready-sovereign-supreme` but is a dry-run stub (`simulated_items` only) —
 * not present on current `main`, and not a reusable normalizer. `crmProspectsRepo`
 * only matches exact website URL strings. This module is the production keyer.
 */
import { nameCityKey, normalizeDomain, normalizeEmail, normalizePhone } from './normalize.ts';
import type { DedupeIdentity, DedupeIndex, RawProspectCandidate } from './types.ts';

export function emptyDedupeIndex(): DedupeIndex {
  return {
    emails: new Set(),
    phones: new Set(),
    domains: new Set(),
    nameCities: new Set(),
  };
}

export function addIdentity(index: DedupeIndex, identity: DedupeIdentity) {
  for (const e of identity.emails ?? []) {
    const v = normalizeEmail(e);
    if (v) index.emails.add(v);
  }
  for (const p of identity.phones ?? []) {
    const v = normalizePhone(p);
    if (v) index.phones.add(v);
  }
  for (const d of identity.domains ?? []) {
    const v = normalizeDomain(d);
    if (v) index.domains.add(v);
  }
  for (const n of identity.names ?? []) {
    const v = String(n || '').trim().toLowerCase();
    if (v) index.nameCities.add(v);
  }
}

export function identityFromCandidate(candidate: RawProspectCandidate): DedupeIdentity {
  return {
    emails: candidate.email ? [candidate.email] : [],
    phones: candidate.phone ? [candidate.phone] : [],
    domains: candidate.website ? [candidate.website] : [],
    names: [nameCityKey(candidate.businessName, candidate.city)].filter(Boolean),
  };
}

export function findDedupeHit(index: DedupeIndex, candidate: RawProspectCandidate): string | null {
  const email = normalizeEmail(candidate.email);
  if (email && index.emails.has(email)) return `email:${email}`;
  const phone = normalizePhone(candidate.phone);
  if (phone && index.phones.has(phone)) return `phone:${phone}`;
  const domain = normalizeDomain(candidate.website);
  if (domain && index.domains.has(domain)) return `domain:${domain}`;
  const name = nameCityKey(candidate.businessName, candidate.city);
  if (name && index.nameCities.has(name)) return `name:${name}`;
  return null;
}

export function primaryDedupeKey(candidate: RawProspectCandidate): string {
  const email = normalizeEmail(candidate.email);
  if (email) return `email:${email}`;
  const phone = normalizePhone(candidate.phone);
  if (phone) return `phone:${phone}`;
  const domain = normalizeDomain(candidate.website);
  if (domain) return `domain:${domain}`;
  const name = nameCityKey(candidate.businessName, candidate.city);
  if (name) return `name:${name}`;
  return `name:${String(candidate.businessName || '').trim().toLowerCase()}`;
}

export function mergeIndexes(a: DedupeIndex, b: DedupeIndex): DedupeIndex {
  return {
    emails: new Set([...a.emails, ...b.emails]),
    phones: new Set([...a.phones, ...b.phones]),
    domains: new Set([...a.domains, ...b.domains]),
    nameCities: new Set([...a.nameCities, ...b.nameCities]),
  };
}
