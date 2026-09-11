import {
  fetchFredSeries,
  searchCfr,
  searchCfpbComplaints,
  searchCongressBills,
  searchFederalRegister,
  searchGdeltArticles,
  searchGuardianArticles,
  type PublicNewsHit,
} from './publicDataClient';

export type PartnerNewsTopic = 'credit' | 'debt' | 'rules';
export type PartnerNewsCta = 'open_source' | 'checklist' | 'letters' | 'debt';

export type PartnerNewsStory = {
  id: string;
  source: string;
  headline: string;
  detail: string;
  meaning: string;
  meaningHt: string;
  href?: string;
  when?: string;
  live: boolean;
  cta: PartnerNewsCta;
  topic: PartnerNewsTopic;
};

const FALLBACK: PartnerNewsStory[] = [
  {
    id: 'util',
    source: 'This week',
    topic: 'credit',
    headline: 'Utilization before new accounts',
    detail: 'Bring revolving balances under 30% on each card before you apply for anything new.',
    meaning: 'A high balance on a card you already have can block new credit more than a missing account.',
    meaningHt: 'Yon gwo balans sou yon kat ou deja genyen ka bloke nouvo kredi plis pase yon kont ki manke.',
    cta: 'checklist',
    live: false,
  },
  {
    id: 'upload',
    source: 'Maintenance',
    topic: 'credit',
    headline: 'Re-upload a report when it is 30+ days old',
    detail: 'There is no live bureau score feed. Your file is what you upload.',
    meaning: 'News does not change your score. The report you uploaded is still the file.',
    meaningHt: 'Nouvèl yo pa chanje nòt ou. Rapò ou telechaje a se dosye a toujou.',
    cta: 'checklist',
    live: false,
  },
  {
    id: 'findings',
    source: 'Disputes',
    topic: 'debt',
    headline: 'Cite what the screenshot shows',
    detail: 'Auto-reasons should name the bureau page you can see — not “please verify or delete.”',
    meaning: 'A letter is stronger when it points at the line on Equifax, Experian, or TransUnion.',
    meaningHt: 'Yon lèt pi fò lè li montre liy la sou Equifax, Experian, oswa TransUnion.',
    cta: 'letters',
    live: false,
  },
];

function meaningForSource(source: string, headline: string, detail: string): { en: string; ht: string } {
  const src = source.toLowerCase();
  if (src.includes('federal') || src.includes('ecfr') || src.includes('congress')) {
    return {
      en: 'A rule or bill moved. It does not change your uploaded report today — read it, then keep your restore steps.',
      ht: 'Yon règleman oswa yon pwojè lwa deplase. Li pa chanje rapò ou telechaje jodi a — li l, epi kontinye etap restore yo.',
    };
  }
  if (src.includes('cfpb')) {
    return {
      en: 'Other people filed this complaint type. Use it to name the issue — then open debt or letters if it matches your file.',
      ht: 'Lòt moun depoze plent sa a. Sèvi ak li pou nonmen pwoblèm nan — apre sa ouvri dèt oswa lèt si li matche dosye w.',
    };
  }
  if (src.includes('fred')) {
    return {
      en: 'This is a national credit pulse, not your score. Keep utilization down on the cards you already hold.',
      ht: 'Sa a se yon puls nasyonal, se pa nòt ou. Kenbe itilizasyon ba sou kat ou deja genyen yo.',
    };
  }
  return {
    en: detail || `What ${source} published. Confirm it against the report you uploaded before you change a step.`,
    ht: detail
      ? `Sa ${source} pibliye. Verifye l sou rapò ou telechaje a anvan ou chanje yon etap.`
      : headline,
  };
}

function ctaFor(source: string, href?: string): PartnerNewsCta {
  const src = source.toLowerCase();
  if (src.includes('cfpb')) return href ? 'open_source' : 'debt';
  if (src.includes('ecfr') || src.includes('federal')) return href ? 'open_source' : 'letters';
  if (href) return 'open_source';
  return 'checklist';
}

function fromHit(
  source: string,
  topic: PartnerNewsTopic,
  hit: PublicNewsHit,
  index: number,
): PartnerNewsStory {
  const headline = hit.title || 'Untitled';
  const detail = hit.snippet || hit.source || 'Live feed';
  const meaning = meaningForSource(source, headline, detail);
  return {
    id: `${source}-${index}-${(hit.url || headline).slice(0, 24)}`,
    source,
    headline,
    detail,
    meaning: meaning.en,
    meaningHt: meaning.ht,
    href: hit.url,
    when: hit.date,
    live: true,
    cta: ctaFor(source, hit.url),
    topic,
  };
}

export function partnerNewsActionPath(cta: PartnerNewsCta): string {
  if (cta === 'letters') return '/portal/letters';
  if (cta === 'debt') return '/portal/debt';
  return '/portal/checklist';
}

export function partnerNewsActionLabel(cta: PartnerNewsCta, hasSource: boolean): string {
  if (cta === 'open_source' || hasSource) return 'Open source';
  if (cta === 'letters') return 'Open letters';
  if (cta === 'debt') return 'Open debt';
  return 'Open restore';
}

export async function loadPartnerNewsToday(): Promise<{
  stories: PartnerNewsStory[];
  liveCount: number;
  sourcesLive: string[];
}> {
  const [gdelt, register, guardian, congress, fred, cfr, cfpb] = await Promise.all([
    searchGdeltArticles({ query: '(credit OR "debt collector" OR CFPB) sourcelang:eng', timespan: '3d' }),
    searchFederalRegister({ term: 'Fair Credit Reporting', perPage: 6 }),
    searchGuardianArticles({ query: 'credit score OR debt collection' }),
    searchCongressBills({ query: 'credit report' }),
    fetchFredSeries({ seriesId: 'REVOLSL', limit: 4 }),
    searchCfr({ query: 'Fair Credit Reporting', title: 15 }),
    searchCfpbComplaints({ company: 'Experian', state: 'FL' }).catch(() => ({ ok: false as const, error: 'skip' })),
  ]);

  const stories: PartnerNewsStory[] = [];

  if (gdelt.ok && gdelt.data?.hits?.length) {
    gdelt.data.hits.slice(0, 4).forEach((h, i) => stories.push(fromHit('GDELT', 'credit', h, i)));
  }
  if (guardian.ok && guardian.data?.hits?.length) {
    guardian.data.hits.slice(0, 3).forEach((h, i) => stories.push(fromHit('Guardian', 'credit', h, i)));
  }
  if (register.ok && register.data?.results?.length) {
    register.data.results.slice(0, 3).forEach((r, i) => {
      const headline = r.title || 'New rule';
      const detail = r.abstract || r.type || 'What just published';
      const meaning = meaningForSource('Federal Register', headline, detail);
      stories.push({
        id: `fr-${i}`,
        source: 'Federal Register',
        headline,
        detail,
        meaning: meaning.en,
        meaningHt: meaning.ht,
        href: r.html_url,
        when: r.publication_date,
        live: true,
        cta: ctaFor('Federal Register', r.html_url),
        topic: 'rules',
      });
    });
  }
  if (fred.ok && fred.data?.observations?.length) {
    const latest = fred.data.observations.find((o) => o.value && o.value !== '.');
    const headline = latest ? `Revolving credit ${latest.value} (${latest.date})` : 'Revolving credit series';
    const meaning = meaningForSource('FRED', headline, '');
    stories.push({
      id: 'fred-revolsl',
      source: 'FRED',
      headline,
      detail: 'St. Louis Fed consumer credit pulse — not a personal score.',
      meaning: meaning.en,
      meaningHt: meaning.ht,
      href: 'https://fred.stlouisfed.org/series/REVOLSL',
      when: latest?.date,
      live: true,
      cta: 'checklist',
      topic: 'credit',
    });
  }
  if (cfr.ok && cfr.data?.results?.length) {
    const first = cfr.data.results[0];
    const headline = first.headings?.title || 'Fair Credit Reporting on the books';
    const detail = first.full_text_excerpt || 'What the statute actually says.';
    const meaning = meaningForSource('eCFR', headline, detail);
    stories.push({
      id: 'ecfr-1',
      source: 'eCFR',
      headline,
      detail,
      meaning: meaning.en,
      meaningHt: meaning.ht,
      live: true,
      cta: 'letters',
      topic: 'rules',
    });
  }
  if (congress.ok && congress.data?.hits?.length) {
    congress.data.hits.slice(0, 3).forEach((h, i) => stories.push(fromHit('Congress', 'rules', h, i)));
  }
  if (cfpb.ok) {
    const hits = cfpb.data?.hits?.hits ?? [];
    hits.slice(0, 3).forEach((row, i) => {
      const src = row._source ?? {};
      const headline = src.issue || 'Complaint filed';
      const detail = [src.company, src.state, src.product].filter(Boolean).join(' · ') || 'Live complaint';
      const meaning = meaningForSource('CFPB', headline, detail);
      stories.push({
        id: `cfpb-${i}`,
        source: 'CFPB',
        headline,
        detail,
        meaning: meaning.en,
        meaningHt: meaning.ht,
        when: src.date_received,
        live: true,
        cta: 'debt',
        topic: 'debt',
      });
    });
  }

  const live = stories.filter((s) => s.live);
  const pack = live.length ? live : FALLBACK;
  return {
    stories: pack,
    liveCount: live.length,
    sourcesLive: Array.from(new Set(live.map((s) => s.source))),
  };
}

export function featuredPartnerNews(stories: PartnerNewsStory[]): PartnerNewsStory | null {
  return stories.find((s) => s.live) ?? stories[0] ?? null;
}
