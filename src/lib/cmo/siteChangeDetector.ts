import { CmoLayoutAudit, CmoLinkRecord, CmoPageSignal, CmoSiteChange } from '../../domain/cmoFinal';
import { cmoId, cmoNow, listCmoLinks } from '../../data/cmoFinalRepo';
import { inferSiteArea } from './cmoFinalMlEngine';

export function createPageSignalFromDocument(doc: Document, route = window.location.pathname): CmoPageSignal {
  const text = normalizeText(doc.body?.innerText ?? '');
  const links = Array.from(doc.querySelectorAll<HTMLAnchorElement>('a[href]')).map((anchor) => ({
    label: normalizeText(anchor.innerText || anchor.getAttribute('aria-label') || anchor.href).slice(0, 80),
    url: anchor.getAttribute('href') || anchor.href,
  }));
  const ctaWords = ['book', 'apply', 'start', 'join', 'schedule', 'call', 'download', 'watch', 'claim', 'consultation'];
  const ctas = Array.from(doc.querySelectorAll<HTMLElement>('a,button,[role="button"]'))
    .map((el) => normalizeText(el.innerText || el.getAttribute('aria-label') || ''))
    .filter(Boolean)
    .filter((label) => ctaWords.some((word) => label.toLowerCase().includes(word)))
    .slice(0, 80);

  const knownLinks = listCmoLinks();
  const matchedLinks: CmoLinkRecord[] = knownLinks.filter((record) => {
    if (!record.url || record.url.includes('replace-with-your')) return false;
    return links.some((link) => link.url.includes(record.url) || record.url.includes(link.url));
  });

  const classTokens = Array.from(doc.querySelectorAll<HTMLElement>('[class]'))
    .flatMap((el) => String(el.getAttribute('class') ?? '').split(/\s+/g))
    .filter(Boolean)
    .slice(0, 400);

  return {
    route,
    area: inferSiteArea(route),
    title: doc.title || normalizeText(doc.querySelector('h1')?.textContent ?? route),
    headings: Array.from(doc.querySelectorAll('h1,h2,h3'))
      .map((el) => normalizeText(el.textContent ?? ''))
      .filter(Boolean)
      .slice(0, 60),
    ctas,
    links: matchedLinks,
    forms: Array.from(doc.querySelectorAll('form')).map((form, index) => form.getAttribute('aria-label') || form.id || `Form ${index + 1}`),
    images: Array.from(doc.querySelectorAll<HTMLImageElement>('img')).map((img) => img.alt || img.src).slice(0, 80),
    classTokens,
    wordCount: text.split(/\s+/).filter(Boolean).length,
    bodyHash: simpleHash(text + links.map((link) => `${link.label}:${link.url}`).join('|') + classTokens.slice(0, 80).join('|')),
    scannedAt: cmoNow(),
  };
}

export function comparePageSignals(previous: CmoPageSignal | undefined, current: CmoPageSignal): CmoSiteChange[] {
  if (!previous) {
    return [
      {
        id: cmoId('change'),
        route: current.route,
        changeType: 'new_page',
        severity: 'medium',
        beforeSummary: 'No previous snapshot found.',
        afterSummary: `${current.title} with ${current.ctas.length} CTA candidates and ${current.wordCount} words.`,
        recommendedAction: 'Review this page for CTA clarity, affiliate/Shorts link presence, and Finely Cred visual consistency.',
        detectedAt: cmoNow(),
      },
    ];
  }

  const changes: CmoSiteChange[] = [];
  if (previous.bodyHash !== current.bodyHash) {
    changes.push({
      id: cmoId('change'),
      route: current.route,
      changeType: 'copy_change',
      severity: Math.abs(current.wordCount - previous.wordCount) > 120 ? 'high' : 'medium',
      beforeSummary: `${previous.wordCount} words, ${previous.ctas.length} CTAs, ${previous.links.length} tracked links.`,
      afterSummary: `${current.wordCount} words, ${current.ctas.length} CTAs, ${current.links.length} tracked links.`,
      recommendedAction: 'Run CMO copy scoring and confirm the page still has a direct CTA, proof, and safe claims.',
      detectedAt: cmoNow(),
    });
  }

  const headlineBefore = previous.headings.join('|');
  const headlineAfter = current.headings.join('|');
  if (headlineBefore !== headlineAfter) {
    changes.push({
      id: cmoId('change'),
      route: current.route,
      changeType: 'headline_change',
      severity: 'high',
      beforeSummary: previous.headings.slice(0, 4).join(' / ') || 'No headings found.',
      afterSummary: current.headings.slice(0, 4).join(' / ') || 'No headings found.',
      recommendedAction: 'Score the new headline for clarity, desire, and conversion power. Headlines are rent-free real estate; do not let them loaf.',
      detectedAt: cmoNow(),
    });
  }

  const ctaBefore = previous.ctas.join('|');
  const ctaAfter = current.ctas.join('|');
  if (ctaBefore !== ctaAfter) {
    changes.push({
      id: cmoId('change'),
      route: current.route,
      changeType: 'cta_change',
      severity: current.ctas.length === 0 ? 'critical' : 'high',
      beforeSummary: previous.ctas.slice(0, 8).join(' / ') || 'No CTAs found.',
      afterSummary: current.ctas.slice(0, 8).join(' / ') || 'No CTAs found.',
      recommendedAction: current.ctas.length === 0 ? 'Add a visible booking/apply/join CTA immediately.' : 'Confirm the strongest CTA appears above the fold and near proof sections.',
      detectedAt: cmoNow(),
    });
  }

  if (previous.links.length !== current.links.length) {
    changes.push({
      id: cmoId('change'),
      route: current.route,
      changeType: 'link_change',
      severity: 'medium',
      beforeSummary: `${previous.links.length} tracked money links found.`,
      afterSummary: `${current.links.length} tracked money links found.`,
      recommendedAction: 'Check affiliate, Shorts/Reels, booking, and lead magnet paths. Money links should not play hide and seek.',
      detectedAt: cmoNow(),
    });
  }
  return changes;
}

export function auditCurrentPageLayout(signal: CmoPageSignal): CmoLayoutAudit {
  const issues: string[] = [];
  const wins: string[] = [];
  const fixes: string[] = [];
  let beautyScore = 82;
  let clarityScore = 82;
  let mobileScore = 84;
  let conversionScore = 78;

  const hasFinelyClasses = signal.classTokens.some((token) => token.startsWith('fc-'));
  const hasCard = signal.classTokens.some((token) => token.includes('card') || token.includes('panel'));
  const hasGrid = signal.classTokens.some((token) => token.includes('grid'));
  const hasFlex = signal.classTokens.some((token) => token.includes('flex'));
  const hasCta = signal.ctas.length > 0;
  const hasBookingOrApply = signal.ctas.some((cta) => /book|apply|schedule|consult/i.test(cta));
  const hasShortsOrAffiliate = signal.links.some((link) => link.type === 'shorts' || link.type === 'affiliate');

  if (hasFinelyClasses) wins.push('Uses Finely Cred-native class tokens. Brand continuity is alive.');
  else {
    beautyScore -= 18;
    issues.push('No obvious Finely Cred design tokens found on this page.');
    fixes.push('Wrap key sections in fc-panel/fc-card style surfaces and use existing gold/platinum CTA classes.');
  }

  if (hasCard) wins.push('Uses card/panel structure for readable sections.');
  else {
    beautyScore -= 12;
    clarityScore -= 8;
    issues.push('Page lacks obvious card/panel hierarchy.');
    fixes.push('Add premium section cards with clear headers, primary CTA, and short helper copy.');
  }

  if (hasGrid || hasFlex) wins.push('Layout appears to use responsive structure.');
  else {
    mobileScore -= 12;
    issues.push('No strong responsive layout signals found.');
    fixes.push('Use responsive grid/flex sections so mobile does not become a content lasagna.');
  }

  if (signal.headings.length < 2) {
    clarityScore -= 12;
    issues.push('Page has too few headings to scan quickly.');
    fixes.push('Add scannable section headers that explain value, proof, next step, and fit.');
  } else wins.push('Heading structure gives the page some scanability.');

  if (!hasCta) {
    conversionScore -= 30;
    issues.push('No clear CTA detected.');
    fixes.push('Add one primary CTA above the fold and repeat it after proof/FAQ sections.');
  } else wins.push(`${signal.ctas.length} CTA candidate(s) detected.`);

  if (!hasBookingOrApply) {
    conversionScore -= 12;
    issues.push('No booking/apply/schedule CTA detected.');
    fixes.push('Use direct CTA language such as Book Consultation, Apply, Schedule Strategy Call, or Join Partner Program.');
  }

  if (!hasShortsOrAffiliate && ['landing', 'affiliate', 'bookstore', 'pricing'].includes(signal.area)) {
    conversionScore -= 8;
    issues.push('No tracked Shorts/Reels or affiliate path detected on a likely marketing page.');
    fixes.push('Add relevant Shorts/Reels proof link or affiliate path where it supports the funnel.');
  }

  if (signal.wordCount > 1800) {
    clarityScore -= 10;
    issues.push('Page may be too text-heavy for quick conversion scanning.');
    fixes.push('Add summaries, bullets, sticky CTA, and split long sections into cards.');
  }

  const score = Math.round((beautyScore + clarityScore + mobileScore + conversionScore) / 4);
  return {
    id: cmoId('audit'),
    route: signal.route,
    score: Math.max(0, Math.min(100, score)),
    beautyScore: Math.max(0, Math.min(100, beautyScore)),
    clarityScore: Math.max(0, Math.min(100, clarityScore)),
    mobileScore: Math.max(0, Math.min(100, mobileScore)),
    conversionScore: Math.max(0, Math.min(100, conversionScore)),
    issues: issues.length ? issues : ['No major layout issues detected. Keep polishing the hero, CTA contrast, and proof flow.'],
    wins: wins.length ? wins : ['Page exists and can be audited. That is the floor; now make it sing.'],
    recommendedFixes: fixes.length ? fixes : ['Create two A/B hero versions and test CTA phrasing.'],
    scannedAt: cmoNow(),
  };
}

export function watchDomForCmoChanges(onChange: () => void): () => void {
  if (typeof window === 'undefined' || typeof MutationObserver === 'undefined') return () => undefined;
  let timeout: number | undefined;
  const observer = new MutationObserver(() => {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(onChange, 1200);
  });
  observer.observe(document.body, { childList: true, subtree: true, attributes: true, characterData: true });
  return () => {
    window.clearTimeout(timeout);
    observer.disconnect();
  };
}

function normalizeText(value: string) {
  return value.replace(/\s+/g, ' ').trim();
}

function simpleHash(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}
