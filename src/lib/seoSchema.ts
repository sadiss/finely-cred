/** JSON-LD schema helpers for public pages (Phase 35). */
export function buildOrganizationSchema(origin: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${origin}/#organization`,
    name: 'Finely Cred',
    url: origin,
    description: 'Credit restore, dispute letters, business credit, and funding readiness platform.',
  };
}

export function buildWebSiteSchema(origin: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Finely Cred',
    url: origin,
    description: 'Credit restore, dispute letters, business credit, and funding readiness.',
    publisher: { '@id': `${origin}/#organization` },
  };
}

export function buildArticleSchema(args: {
  origin: string;
  path: string;
  name: string;
  description: string;
}) {
  const url = `${args.origin}${args.path}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: args.name,
    description: args.description,
    url,
    author: { '@type': 'Organization', name: 'Finely Cred' },
    publisher: { '@type': 'Organization', name: 'Finely Cred', url: args.origin },
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
  };
}

export function injectJsonLd(id: string, data: Record<string, unknown>) {
  if (typeof document === 'undefined') return;
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function buildWebPageSchema(args: {
  origin: string;
  path: string;
  name: string;
  description: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: args.name,
    description: args.description,
    url: `${args.origin}${args.path}`,
    isPartOf: { '@type': 'WebSite', name: 'Finely Cred', url: args.origin },
  };
}

/** Rich media SEO for guide/audio funnels (Phase 35). */
export function buildAudioObjectSchema(args: {
  origin: string;
  name: string;
  description: string;
  contentUrl?: string;
  durationSec?: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'AudioObject',
    name: args.name,
    description: args.description,
    contentUrl: args.contentUrl,
    duration: args.durationSec ? `PT${Math.max(1, Math.round(args.durationSec))}S` : undefined,
    publisher: { '@type': 'Organization', name: 'Finely Cred', url: args.origin },
  };
}

export function buildFaqPageSchema(args: { questions: Array<{ q: string; a: string }> }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: args.questions.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: { '@type': 'Answer', text: item.a },
    })),
  };
}

export function buildHowToSchema(args: { name: string; description: string; steps: string[] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: args.name,
    description: args.description,
    step: args.steps.map((name, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name,
    })),
  };
}

export function buildLocalBusinessSchema(args: {
  origin: string;
  city: string;
  state: string;
  description: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: `Finely Cred — credit restore in ${args.city}`,
    url: args.origin,
    description: args.description,
    areaServed: { '@type': 'City', name: args.city, containedInPlace: { '@type': 'State', name: args.state } },
  };
}
