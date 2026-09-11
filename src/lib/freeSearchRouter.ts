/**
 * Free search first, Serper last.
 * Brave → Google CSE → caller may fall through to Serper.
 */
import { searchBraveWeb, searchGoogleCse, type PublicNewsHit } from './publicDataClient';

export type FreeSearchHit = {
  title: string;
  link: string;
  snippet: string;
  provider: 'brave' | 'cse';
};

export async function searchFreeWebFirst(query: string): Promise<{
  hits: FreeSearchHit[];
  provider: 'brave' | 'cse' | null;
  needsSerper: boolean;
}> {
  const q = query.trim();
  if (!q) return { hits: [], provider: null, needsSerper: true };

  const brave = await searchBraveWeb({ query: q });
  const braveHits = mapHits(brave.data?.hits, 'brave');
  if (brave.ok && braveHits.length) {
    return { hits: braveHits, provider: 'brave', needsSerper: false };
  }

  const cse = await searchGoogleCse({ query: q });
  const cseHits = mapHits(cse.data?.hits, 'cse');
  if (cse.ok && cseHits.length) {
    return { hits: cseHits, provider: 'cse', needsSerper: false };
  }

  return { hits: [], provider: null, needsSerper: true };
}

function mapHits(hits: PublicNewsHit[] | undefined, provider: 'brave' | 'cse'): FreeSearchHit[] {
  return (hits ?? [])
    .filter((h) => h.title && h.url)
    .map((h) => ({
      title: h.title,
      link: String(h.url),
      snippet: h.snippet || '',
      provider,
    }));
}
