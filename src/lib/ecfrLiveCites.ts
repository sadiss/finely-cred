/**
 * On-demand eCFR excerpts for post-judgment letters.
 * Client cache + public-data proxy (7-day server TTL). Never hammer on page load.
 */

import { fetchCfrSection, searchCfr } from './publicDataClient';

export type EcfrCiteId = 'reg_e_1005_11' | 'reg_z_1026_12' | 'cfr_212_6';

export type EcfrCiteSpec = {
  id: EcfrCiteId;
  label: string;
  title: string;
  part: string;
  section: string;
  viewerUrl: string;
  why: string;
};

export type EcfrCiteResult = {
  spec: EcfrCiteSpec;
  excerpt: string;
  date?: string;
  cached?: boolean;
  stale?: boolean;
  error?: string;
};

export const POST_JUDGMENT_ECFR_CITES: EcfrCiteSpec[] = [
  {
    id: 'reg_e_1005_11',
    label: 'Reg E — error resolution',
    title: '12',
    part: '1005',
    section: '1005.11',
    viewerUrl: 'https://www.ecfr.gov/current/title-12/part-1005/section-1005.11',
    why: 'Investigation and correction clocks after an unauthorized EFT notice.',
  },
  {
    id: 'reg_z_1026_12',
    label: 'Reg Z — card offset',
    title: '12',
    part: '1026',
    section: '1026.12',
    viewerUrl: 'https://www.ecfr.gov/current/title-12/part-1026/section-1026.12',
    why: 'Limits on a card issuer offsetting a deposit account.',
  },
  {
    id: 'cfr_212_6',
    label: '31 C.F.R. § 212.6 — account review',
    title: '31',
    part: '212',
    section: '212.6',
    viewerUrl: 'https://www.ecfr.gov/current/title-31/part-212/section-212.6',
    why: 'Bank review of accounts that may hold federally protected benefits.',
  },
];

const memory = new Map<EcfrCiteId, { at: number; result: EcfrCiteResult }>();
const CLIENT_TTL_MS = 6 * 60 * 60 * 1000;

function stripXml(xml: string): string {
  return xml
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

function excerptFromXml(xml: string): string {
  const text = stripXml(xml);
  if (!text) return '';
  return text.length > 520 ? `${text.slice(0, 520).trim()}…` : text;
}

function excerptFromSearch(excerpt: string | undefined): string {
  const text = String(excerpt ?? '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text.length > 520 ? `${text.slice(0, 520).trim()}…` : text;
}

export async function loadEcfrCite(id: EcfrCiteId): Promise<EcfrCiteResult> {
  const spec = POST_JUDGMENT_ECFR_CITES.find((c) => c.id === id);
  if (!spec) return { spec: POST_JUDGMENT_ECFR_CITES[0], excerpt: '', error: 'unknown_cite' };

  const cached = memory.get(id);
  if (cached && Date.now() - cached.at < CLIENT_TTL_MS) {
    return { ...cached.result, cached: true };
  }

  const section = await fetchCfrSection({
    title: spec.title,
    part: spec.part,
    section: spec.section.replace(`${spec.part}.`, ''),
  });

  if (section.ok && section.data?.xml) {
    const excerpt = excerptFromXml(section.data.xml);
    const result: EcfrCiteResult = {
      spec,
      excerpt: excerpt || 'Live XML loaded — open the eCFR viewer for the full section.',
      date: section.data.date,
      cached: section.cached,
      stale: section.stale,
    };
    memory.set(id, { at: Date.now(), result });
    return result;
  }

  const search = await searchCfr({
    query: spec.section,
    title: spec.title,
    part: spec.part,
  });
  const hit = search.data?.results?.[0];
  if (search.ok && hit) {
    const result: EcfrCiteResult = {
      spec,
      excerpt: excerptFromSearch(hit.full_text_excerpt) || 'Search hit found — open the eCFR viewer for the full section.',
      date: typeof hit.starts_on === 'string' ? hit.starts_on : undefined,
      cached: search.cached,
      stale: search.stale,
    };
    memory.set(id, { at: Date.now(), result });
    return result;
  }

  return {
    spec,
    excerpt: '',
    error: section.error || search.error || 'ecfr_unavailable',
    cached: section.cached || search.cached,
    stale: section.stale || search.stale,
  };
}
