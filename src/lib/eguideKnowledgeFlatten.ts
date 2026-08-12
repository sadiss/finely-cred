/**
 * Flatten in-app e-guide chapter models into searchable plain text for RAG indexing.
 */
import type { GuideBlock, GuideChapter } from '../pages/leadmagnet/guideReaderBlocks';
import type { GeneratedGuidePage } from '../resources/disputeLetterGuideContent';

function flattenGuideBlock(block: GuideBlock): string[] {
  switch (block.kind) {
    case 'paragraphs':
      return block.items;
    case 'bullets':
      return block.items;
    case 'steps':
      return block.items.map((s) => `${s.label}: ${s.body}`);
    case 'checklist':
      return block.title ? [`${block.title}:`, ...block.items] : block.items;
    case 'callout':
      return block.title ? [`${block.title}: ${block.body}`] : [block.body];
    case 'quote':
      return block.attribution ? [`"${block.text}" — ${block.attribution}`] : [block.text];
    case 'chips':
      return block.items.map((c) => (c.note ? `${c.label} (${c.note})` : c.label));
    case 'table':
      return [
        ...(block.caption ? [block.caption] : []),
        ...block.rows.map((row) => row.join(' | ')),
      ];
    case 'stats':
      return block.items.map((s) => `${s.value} — ${s.label}`);
    case 'timeline':
      return block.items.map((t) => `${t.when}: ${t.what}`);
    case 'compare':
      return [
        `${block.left.title}: ${block.left.items.join('; ')}`,
        `${block.right.title}: ${block.right.items.join('; ')}`,
      ];
    case 'sampleDocument':
      return [block.title, ...block.lines];
    default:
      return [];
  }
}

/** Flatten GuideChapter[] (debt / business / tradeline readers). */
export function flattenGuideChapters(
  guideId: string,
  meta: { title: string; description: string; tagline: string; readPath: string },
  chapters: GuideChapter[],
): Array<{ id: string; title: string; text: string; route: string; tags: string[] }> {
  const out: Array<{ id: string; title: string; text: string; route: string; tags: string[] }> = [];
  for (const ch of chapters) {
    const sectionLines: string[] = [
      ch.title,
      ch.subtitle,
      ch.teaser,
      ch.promise,
      ch.takeaway,
    ];
    for (const sec of ch.sections) {
      sectionLines.push(sec.heading);
      for (const block of sec.blocks) sectionLines.push(...flattenGuideBlock(block));
    }
    out.push({
      id: `eguide:${guideId}:${ch.id}`,
      title: `${meta.title} — ${ch.title}`,
      text: sectionLines.filter(Boolean).join('\n'),
      route: `${meta.readPath}?chapter=${ch.id}`,
      tags: ['eguide', guideId, ch.kicker.toLowerCase(), 'partner guide'],
    });
  }
  return out;
}

/** Flatten dispute reader programmatic pages. */
export function flattenDisputeGuidePages(
  pages: GeneratedGuidePage[],
  readPath: string,
): Array<{ id: string; title: string; text: string; route: string; tags: string[] }> {
  return pages.map((page) => {
    const lines: string[] = [page.title, page.subtitle ?? ''];
    for (const sec of page.sections) {
      if (sec.heading) lines.push(sec.heading);
      if (sec.paragraphs) lines.push(...sec.paragraphs);
      if (sec.bullets) lines.push(...sec.bullets);
      if (sec.annotation) lines.push(sec.annotation);
      if (sec.evidence) lines.push(`${sec.evidence.label}: ${sec.evidence.text}`);
    }
    return {
      id: `eguide:credit-dispute-letter-guide:${page.id}`,
      title: `Free Credit Dispute Letter Guide — ${page.title}`,
      text: lines.filter(Boolean).join('\n'),
      route: `${readPath}?chapter=${page.id}`,
      tags: ['eguide', 'credit-dispute-letter-guide', 'dispute', 'fcra', 'partner guide'],
    };
  });
}
