import { emitSiteWatchEvent } from './cmoEventBus';
import { scoreConversionCopy150 } from './cmoLearningEngine';

export type CmoPageAudit = {
  path: string;
  score: number;
  ctas: string[];
  links: string[];
  headings: string[];
  problems: string[];
  recommendations: string[];
};

function uniq(xs: string[]) {
  return Array.from(new Set(xs.map((x) => x.trim()).filter(Boolean)));
}

export function auditCurrentPageForCmo(): CmoPageAudit {
  const path = typeof window !== 'undefined' ? window.location.pathname : 'unknown';
  const doc = typeof document !== 'undefined' ? document : null;
  if (!doc) return { path, score: 0, ctas: [], links: [], headings: [], problems: ['No DOM available.'], recommendations: [] };
  const headings = uniq(Array.from(doc.querySelectorAll('h1,h2,h3')).map((el) => (el.textContent || '').trim()).filter(Boolean)).slice(0, 30);
  const links = uniq(Array.from(doc.querySelectorAll('a[href]')).map((a) => (a as HTMLAnchorElement).getAttribute('href') || '').filter(Boolean)).slice(0, 80);
  const buttonTexts = uniq(Array.from(doc.querySelectorAll('button,a')).map((el) => (el.textContent || '').replace(/\s+/g, ' ').trim()).filter(Boolean)).slice(0, 80);
  const ctas = buttonTexts.filter((t) => /\b(book|apply|start|join|schedule|get|download|buy|contact|call|learn|claim|reserve)\b/i.test(t));
  const text = [doc.title, ...headings, ...buttonTexts].join('\n');
  const scored = scoreConversionCopy150(text);
  const problems: string[] = [];
  const recommendations: string[] = [];
  if (!headings.length) problems.push('No visible headings detected.');
  if (!ctas.length) problems.push('No clear CTA detected.');
  if (!links.some((x) => /consultation|contact|pricing|checkout|affiliate|agents|bookstore/i.test(x))) problems.push('Missing obvious money-path link.');
  if (links.some((x) => /replace-with|example\.com|placeholder/i.test(x))) problems.push('Placeholder link detected.');
  if (scored.complianceFlags.length) problems.push(`Risky claims: ${scored.complianceFlags.join(', ')}`);
  if (ctas.length > 8) recommendations.push('Consider reducing CTA clutter. Make the primary next move unmistakable.');
  if (ctas.length <= 2) recommendations.push('Add one primary CTA and one softer secondary CTA.');
  if (!links.some((x) => /affiliate|agent|career/i.test(x))) recommendations.push('Add an affiliate/agent path where relevant.');
  if (!links.some((x) => /shorts|youtube|tiktok|instagram|reels/i.test(x))) recommendations.push('Connect Shorts/Reels proof or social channel link where relevant.');
  const finalScore = Math.max(0, Math.min(150, scored.score - problems.length * 8));
  emitSiteWatchEvent({ pagePath: path, score: finalScore, labels: problems, meta: { ctas, links: links.slice(0, 20), headings: headings.slice(0, 10), recommendations } });
  return { path, score: finalScore, ctas, links, headings, problems, recommendations };
}
