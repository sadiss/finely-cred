import {
  fetchFredSeries,
  searchCfr,
  searchCfpbComplaints,
  searchCongressBills,
  searchCourtListenerOpinions,
  searchFederalRegister,
  searchGdeltArticles,
  searchGuardianArticles,
  type PublicNewsHit,
} from './publicDataClient';
import type { DataFeedActionCta } from '../data/dataFeedActionQueueRepo';

export type DataFeedTopic = 'marketing' | 'credit' | 'debt';

export type DataFeedStory = {
  id: string;
  topic: DataFeedTopic;
  source: string;
  headline: string;
  detail: string;
  href?: string;
  when?: string;
  cta: DataFeedActionCta;
  live: boolean;
  setupHint?: string;
};

function hitStory(
  topic: DataFeedTopic,
  source: string,
  hit: PublicNewsHit,
  index: number,
  cta: DataFeedActionCta,
): DataFeedStory {
  return {
    id: `${source}-${index}-${(hit.url || hit.title).slice(0, 24)}`,
    topic,
    source,
    headline: hit.title || 'Untitled',
    detail: hit.snippet || hit.source || 'Live feed',
    href: hit.url,
    when: hit.date,
    cta,
    live: true,
  };
}

function setupStory(topic: DataFeedTopic, source: string, hint: string): DataFeedStory {
  return {
    id: `${source}-setup`,
    topic,
    source,
    headline: `${source} is waiting on a free key`,
    detail: hint,
    cta: 'post',
    live: false,
    setupHint: hint,
  };
}

export async function loadDataFeedsToday(): Promise<{
  stories: DataFeedStory[];
  liveCount: number;
  setupCount: number;
}> {
  const [
    gdelt,
    register,
    guardian,
    congress,
    fred,
    cfr,
    cfpb,
    courts,
  ] = await Promise.all([
    searchGdeltArticles({ query: '(credit OR "debt collector" OR CFPB) sourcelang:eng', timespan: '3d' }),
    searchFederalRegister({ term: 'Fair Credit Reporting', perPage: 6 }),
    searchGuardianArticles({ query: 'credit score OR debt collection' }),
    searchCongressBills({ query: 'credit report' }),
    fetchFredSeries({ seriesId: 'REVOLSL', limit: 4 }),
    searchCfr({ query: 'Fair Credit Reporting', title: 15 }),
    searchCfpbComplaints({ company: 'Experian', state: 'CA' }).catch(() => ({ ok: false as const, error: 'skip' })),
    searchCourtListenerOpinions({ query: 'Fair Credit Reporting Act' }),
  ]);

  const stories: DataFeedStory[] = [];

  if (gdelt.ok && gdelt.data?.hits?.length) {
    gdelt.data.hits.slice(0, 4).forEach((h, i) => stories.push(hitStory('marketing', 'GDELT', h, i, 'post')));
  } else {
    stories.push({
      id: 'gdelt-empty',
      topic: 'marketing',
      source: 'GDELT',
      headline: 'No credit headlines in the last 3 days',
      detail: gdelt.error || 'The world-news firehose is quiet or the edge is not deployed.',
      cta: 'post',
      live: false,
    });
  }

  if (guardian.ok && guardian.data?.hits?.length) {
    guardian.data.hits.slice(0, 3).forEach((h, i) => stories.push(hitStory('marketing', 'Guardian', h, i, 'post')));
  } else if (guardian.error === 'not_wired' || guardian.data && 'hint' in (guardian.data as object)) {
    stories.push(setupStory('marketing', 'Guardian', 'Set GUARDIAN_API_KEY on public-data (free).'));
  }

  if (register.ok && register.data?.results?.length) {
    register.data.results.slice(0, 3).forEach((r, i) => {
      stories.push({
        id: `fr-${i}`,
        topic: 'credit',
        source: 'Federal Register',
        headline: r.title || 'New rule',
        detail: r.abstract || r.type || 'What just published',
        href: r.html_url,
        when: r.publication_date,
        cta: 'email',
        live: true,
      });
    });
  }

  if (fred.ok && fred.data?.observations?.length) {
    const latest = fred.data.observations.find((o) => o.value && o.value !== '.');
    stories.push({
      id: 'fred-revolsl',
      topic: 'credit',
      source: 'FRED',
      headline: latest
        ? `Revolving credit ${latest.value} (${latest.date})`
        : 'Revolving credit series',
      detail: 'St. Louis Fed consumer credit pulse — use this in Friday press, not as a score promise.',
      href: 'https://fred.stlouisfed.org/series/REVOLSL',
      cta: 'post',
      live: true,
    });
  } else if (!fred.ok) {
    stories.push(setupStory('credit', 'FRED', 'Set FRED_API_KEY on public-data (free).'));
  }

  if (cfr.ok && cfr.data?.results?.length) {
    const first = cfr.data.results[0];
    stories.push({
      id: 'ecfr-1',
      topic: 'credit',
      source: 'eCFR',
      headline: first.headings?.title || 'Fair Credit Reporting on the books',
      detail: first.full_text_excerpt || 'What the statute actually says.',
      cta: 'email',
      live: true,
    });
  }

  if (congress.ok && congress.data?.hits?.length) {
    congress.data.hits.slice(0, 3).forEach((h, i) => stories.push(hitStory('credit', 'Congress', h, i, 'post')));
  } else if (!congress.ok) {
    stories.push(setupStory('credit', 'Congress', 'Set CONGRESS_GOV_API_KEY on public-data (free).'));
  }

  if (cfpb.ok) {
    const hits = cfpb.data?.hits?.hits ?? [];
    hits.slice(0, 3).forEach((row, i) => {
      const src = row._source ?? {};
      stories.push({
        id: `cfpb-${i}`,
        topic: 'debt',
        source: 'CFPB',
        headline: src.issue || 'Complaint filed',
        detail: [src.company, src.state, src.product].filter(Boolean).join(' · ') || 'Live complaint',
        cta: 'mail',
        live: true,
        when: src.date_received,
      });
    });
  }

  if (courts.ok && courts.data?.results?.length) {
    courts.data.results.slice(0, 3).forEach((r, i) => {
      stories.push({
        id: `cl-${i}`,
        topic: 'debt',
        source: 'CourtListener',
        headline: r.caseName || 'Opinion',
        detail: r.snippet || r.court || 'Federal opinion',
        href: r.absoluteUrl,
        when: r.dateFiled,
        cta: 'mail',
        live: true,
      });
    });
  }

  return {
    stories,
    liveCount: stories.filter((s) => s.live).length,
    setupCount: stories.filter((s) => !s.live).length,
  };
}
