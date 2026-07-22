import type { EvidenceItem } from '../domain/evidence';

function tagsOf(item: EvidenceItem): string[] {
  return (item.tags ?? []).map((t) => String(t).toLowerCase());
}

function haystack(item: EvidenceItem): string {
  return `${item.filename || ''} ${item.caption || ''} ${item.sectionKey || ''}`.toLowerCase();
}

/** Government ID (DL, passport, state ID) — not SSN card. */
export function isIdentityDocument(item: EvidenceItem): boolean {
  const tags = tagsOf(item);
  if (tags.some((t) => t === 'doctype:id_document' || t === 'doctype:identity')) return true;
  if (tags.some((t) => t === 'doctype:ssn_card')) return false;
  const section = String(item.sectionKey || '').toLowerCase();
  if (section === 'identity' || section === 'id_docs') {
    return !isSsnDocument(item);
  }
  const h = haystack(item);
  if (/\bssn\b|social\s*security/.test(h)) return false;
  return /\b(driver.?s?\s*licen[cs]e|passport|state\s*id|government\s*id|photo\s*id)\b/.test(h);
}

/** Social Security card / SSN image. */
export function isSsnDocument(item: EvidenceItem): boolean {
  const tags = tagsOf(item);
  if (tags.some((t) => t === 'doctype:ssn_card')) return true;
  const h = haystack(item);
  return /\bssn\b|social\s*security/.test(h);
}

export function isIdentityOrSsnDocument(item: EvidenceItem): boolean {
  return isIdentityDocument(item) || isSsnDocument(item);
}

export function filterIdentityPacketEvidence(items: EvidenceItem[]): EvidenceItem[] {
  return items.filter(isIdentityOrSsnDocument);
}

export function identityPacketStatus(items: EvidenceItem[], selectedIds: string[]) {
  const selected = new Set(selectedIds);
  const idDocs = items.filter(isIdentityDocument);
  const ssnDocs = items.filter(isSsnDocument);
  const hasId = idDocs.some((d) => selected.has(d.id));
  const hasSsn = ssnDocs.some((d) => selected.has(d.id));
  return {
    hasId,
    hasSsn,
    complete: hasId && hasSsn,
    idCount: idDocs.length,
    ssnCount: ssnDocs.length,
    label: hasId && hasSsn ? 'ID + SSN attached' : hasId ? 'ID attached · SSN missing' : hasSsn ? 'SSN attached · ID missing' : 'Attach ID & SSN',
  };
}
