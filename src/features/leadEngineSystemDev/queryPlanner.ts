import { DEFAULT_LEAD_ENGINE_CITIES, LEAD_ENGINE_SOURCE_PLANS } from './citySourceVault';
import type { LeadEngineFunnel, LeadEngineSourceKind, LeadSwarmJob } from './types';
import { newId } from '../../utils/ids';

const SERVICE_INTENTS: Record<LeadEngineFunnel, string[]> = {
  business_credit_eguide: ['business credit help', 'business credit builder', 'net 30 vendor credit', 'duns number help', 'business tradelines', 'business credit consultant'],
  tradeline_guide: ['authorized user tradelines', 'tradeline help', 'seasoned tradelines', 'au tradeline questions', 'credit tradeline education'],
  personal_credit_repair_guide: ['fix my credit', 'credit repair help', 'collections dispute', 'charge off help', 'credit score help', 'bureau dispute letter'],
  funding_readiness_guide: ['business funding help', 'startup funding readiness', 'line of credit help', 'working capital consultant', 'merchant funding alternatives'],
  credit_specialist_recruiting: ['credit repair job', 'credit specialist remote', 'credit repair sales agent', 'financial services sales remote', 'credit consultant opportunity'],
  agency_partner_recruiting: ['credit repair agency partner', 'business credit agency partnership', 'financial services partnership', 'white label credit repair'],
  affiliate_partner_recruiting: ['credit repair affiliate', 'finance affiliate program', 'business credit referral partner', 'credit affiliate commission'],
  au_seller_recruiting: ['au seller program', 'tradeline seller inventory', 'authorized user seller', 'tradeline supplier'],
  consultation_booking: ['credit consultation near me', 'business credit consultation', 'funding consultation', 'credit help consultation'],
  event_webinar: ['credit webinar', 'business credit workshop', 'financial literacy event', 'credit repair class'],
  press_authority: ['local business podcast', 'finance podcast guest', 'credit expert interview', 'small business radio show'],
  book_course_buyer: ['credit repair ebook', 'business credit course', 'credit dispute template', 'funding course'],
};

const MODIFIERS = ['near me', 'help', 'consultation', 'guide', 'checklist', 'template', 'how to', 'for entrepreneurs', 'for small business', 'remote', 'today', 'this week', 'local', 'expert'];
const URGENCY = ['need help', 'best', 'trusted', 'affordable', 'step by step', 'what to do', 'apply', 'learn', 'fix', 'build'];

function nowIso() {
  return new Date().toISOString();
}

function uniq(arr: string[]) {
  return Array.from(new Set(arr.map((x) => x.trim()).filter(Boolean)));
}

export function buildQueryPool(args: { cityIds: string[]; sourceIds: LeadEngineSourceKind[]; maxPerCity?: number }) {
  const cities = DEFAULT_LEAD_ENGINE_CITIES.filter((c) => args.cityIds.includes(c.id));
  const sources = LEAD_ENGINE_SOURCE_PLANS.filter((s) => args.sourceIds.includes(s.id));
  const rows: Array<{ cityId: string; source: LeadEngineSourceKind; funnel: LeadEngineFunnel; query: string }> = [];
  for (const city of cities) {
    const funnels = city.offers;
    for (const funnel of funnels) {
      const intents = SERVICE_INTENTS[funnel] ?? [];
      for (const intent of intents) {
        for (const modifier of MODIFIERS.slice(0, 8)) {
          const source = sources[(rows.length + city.priority) % Math.max(1, sources.length)]?.id ?? 'serper_web';
          rows.push({ cityId: city.id, source, funnel, query: `${intent} ${modifier} ${city.label} ${city.state}` });
        }
        for (const urgent of URGENCY.slice(0, 5)) {
          const source = sources[(rows.length + 3) % Math.max(1, sources.length)]?.id ?? 'serper_web';
          rows.push({ cityId: city.id, source, funnel, query: `${urgent} ${intent} ${city.label}` });
        }
      }
    }
  }
  const max = Math.max(25, args.maxPerCity ?? 80) * Math.max(1, cities.length);
  return uniq(rows.map((x) => `${x.cityId}|${x.source}|${x.funnel}|${x.query}`))
    .slice(0, max)
    .map((key) => {
      const [cityId, source, funnel, ...rest] = key.split('|');
      return { cityId, source: source as LeadEngineSourceKind, funnel: funnel as LeadEngineFunnel, query: rest.join('|') };
    });
}

export function makeSwarmJobs(args: { cityIds: string[]; sourceIds: LeadEngineSourceKind[]; maxPerCity?: number }): LeadSwarmJob[] {
  return buildQueryPool(args).map((row) => ({
    id: newId('swarmjob'),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    status: 'queued',
    source: row.source,
    cityId: row.cityId,
    query: row.query,
    resultLimit: 12,
    progressPct: 0,
    discovered: 0,
    enriched: 0,
    hot: 0,
    imported: 0,
    notes: [`Funnel intent: ${row.funnel}`],
  }));
}
