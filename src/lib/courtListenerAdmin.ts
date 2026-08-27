/**
 * Admin-only CourtListener wrapper.
 * Never call from partner pages or on partner page load.
 */

import { isAdminEmail } from '../auth/admin';
import {
  searchCourtListenerOpinions,
  type CourtListenerSearchResponse,
  type PublicDataResult,
} from './publicDataClient';

const BLOCKED = /njcourts\.gov|judiciary\.state\.nj|courts\.state\./i;

export async function adminSearchCourtListenerOpinions(args: {
  email?: string | null;
  query: string;
  court?: string;
}): Promise<PublicDataResult<CourtListenerSearchResponse>> {
  if (!isAdminEmail(args.email)) {
    return { ok: false, error: 'admin_only' };
  }
  const query = args.query.trim();
  if (query.length < 3) return { ok: false, error: 'Enter at least 3 characters.' };
  if (BLOCKED.test(query) || (args.court && BLOCKED.test(args.court))) {
    return { ok: false, error: 'State-court scrape targets are blocked. Search CourtListener opinions only.' };
  }
  return searchCourtListenerOpinions({ query, court: args.court });
}
