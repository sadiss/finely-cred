import type { MarketingChannelId, MarketingDepartmentId } from './marketingHqModel';

export type PackFormat = 'email' | 'sms' | 'html' | 'markdown' | 'offer';

export type FinelyPackAsset = {
  id: string;
  title: string;
  subtitle: string;
  whenToUse: string;
  readiness: 'ready' | 'hold';
  format: PackFormat;
  contentPath: string;
  downloadName: string;
  departmentId: MarketingDepartmentId;
  channelId: MarketingChannelId;
  featured?: boolean;
  publicPreviewPath?: string;
};

const DAY_VERTICAL: Record<number, string> = {
  1: 'general',
  2: 'tax partners',
  3: 'BHPH',
  4: 'realtor',
  5: 'mortgage',
  6: 'Haitian / immigration',
  7: 'church / community',
  8: 'score literacy',
  9: 'tax',
  10: 'BHPH / debt honesty',
  11: 'realtor',
  12: 'mortgage / FICO 10T',
  13: 'Haitian',
  14: 'church referral circle',
  15: 'funding readiness',
  16: 'evidence vault',
  17: 'tax',
  18: 'BHPH utilization',
  19: 'partner co-marketing',
  20: 'UltraFICO honesty',
  21: 'partner finale',
};

function dayEmailAssets(): FinelyPackAsset[] {
  const out: FinelyPackAsset[] = [];
  for (let d = 1; d <= 21; d++) {
    const day = String(d).padStart(2, '0');
    out.push({
      id: `email-day-${day}`,
      title: `21-day email · Day ${d}`,
      subtitle: DAY_VERTICAL[d] ?? 'nurture',
      whenToUse: `Send manually on day ${d} of the Finely 21-day nurture (copy into Comms Studio or your ESP).`,
      readiness: 'ready',
      format: 'email',
      contentPath: `21-day/emails/day-${day}.md`,
      downloadName: `finely-21day-email-day-${day}.md`,
      departmentId: 'growth-acquisition',
      channelId: 'email',
      featured: d === 1 || d === 8 || d === 15 || d === 21,
    });
    out.push({
      id: `sms-day-${day}`,
      title: `21-day SMS + caption · Day ${d}`,
      subtitle: DAY_VERTICAL[d] ?? 'social',
      whenToUse: `Post or text manually on day ${d} — caption + short SMS in one file.`,
      readiness: 'ready',
      format: 'sms',
      contentPath: `21-day/sms/day-${day}.txt`,
      downloadName: `finely-21day-sms-day-${day}.txt`,
      departmentId: 'growth-acquisition',
      channelId: 'social',
      featured: d === 1 || d === 6 || d === 15,
    });
  }
  return out;
}

const HTML_ONE_SHEETS: { file: string; title: string; whenToUse: string; dept: MarketingDepartmentId; ch: MarketingChannelId; featured?: boolean }[] = [
  {
    file: 'day-01-welcome.html',
    title: 'Day 1 welcome one-sheet',
    whenToUse: 'Attach to welcome email or print for events — Finely medallion only.',
    dept: 'growth-acquisition',
    ch: 'content',
    featured: true,
  },
  {
    file: 'restore-to-funding-readiness.html',
    title: 'Partner one-sheet (HTML)',
    whenToUse: 'Hand to affiliates/realtors — restore → readiness; no Nora logo on Finely art.',
    dept: 'partner-referral',
    ch: 'content',
    featured: true,
  },
  {
    file: 'score-literacy-partner.html',
    title: 'Score literacy (partner)',
    whenToUse: 'When partners confuse Vantage vs mortgage FICO — education handout.',
    dept: 'partner-referral',
    ch: 'content',
    featured: true,
  },
  {
    file: 'vertical-haitian-immigration.html',
    title: 'Haitian / immigration vertical',
    whenToUse: 'Community desk + Kreyòl corridor social/email support.',
    dept: 'haitian-kreyol',
    ch: 'content',
    featured: true,
  },
  {
    file: 'vertical-tax-partners.html',
    title: 'Tax partner vertical',
    whenToUse: 'Tax-season partner outreach — co-marketing one-sheet.',
    dept: 'partner-referral',
    ch: 'content',
  },
  {
    file: 'vertical-realtor-partners.html',
    title: 'Realtor partner vertical',
    whenToUse: 'Realtor desk — restore before lender stack.',
    dept: 'partner-referral',
    ch: 'content',
  },
  {
    file: 'vertical-mortgage-partners.html',
    title: 'Mortgage partner vertical',
    whenToUse: 'Mortgage LO partners — file accuracy first.',
    dept: 'partner-referral',
    ch: 'content',
  },
  {
    file: 'vertical-bhph-partners.html',
    title: 'BHPH partner vertical',
    whenToUse: 'BHPH / auto second-chance partner conversations.',
    dept: 'partner-referral',
    ch: 'content',
  },
  {
    file: 'vertical-church-community.html',
    title: 'Church / community vertical',
    whenToUse: 'Faith & community referral circles — Finely-only branding.',
    dept: 'partner-referral',
    ch: 'content',
  },
  {
    file: 'day-08-score-literacy-consumer.html',
    title: 'Score literacy (consumer)',
    whenToUse: 'Mid-sequence education — stop comparing wrong score models.',
    dept: 'nurture-lifecycle',
    ch: 'content',
  },
  {
    file: 'day-15-funding-readiness.html',
    title: 'Funding readiness checklist',
    whenToUse: 'Late nurture — readiness gates before lender handoff.',
    dept: 'nurture-lifecycle',
    ch: 'email',
    featured: true,
  },
  {
    file: 'day-21-partner-finale.html',
    title: 'Day 21 partner finale',
    whenToUse: 'Close the 21-day arc — partner CTA without Nora on Finely art.',
    dept: 'nurture-lifecycle',
    ch: 'email',
  },
  {
    file: 'debt-honesty-repossession.html',
    title: 'Debt honesty — repossession',
    whenToUse: 'When repo/collections fear shows up in social comments or SMS replies.',
    dept: 'growth-acquisition',
    ch: 'social',
  },
  {
    file: 'file-accuracy-evidence-vault.html',
    title: 'Evidence vault one-sheet',
    whenToUse: 'Explain vault uploads + dispute evidence discipline.',
    dept: 'brand-creative',
    ch: 'content',
  },
  {
    file: 'partner-brand-co-marketing.html',
    title: 'Partner co-marketing',
    whenToUse: 'Co-branded partner campaigns — Finely gold lock.',
    dept: 'partner-referral',
    ch: 'social',
  },
];

function htmlAssets(): FinelyPackAsset[] {
  return HTML_ONE_SHEETS.map((h) => ({
    id: `html-${h.file.replace('.html', '')}`,
    title: h.title,
    subtitle: 'HTML one-sheet',
    whenToUse: h.whenToUse,
    readiness: 'ready' as const,
    format: 'html' as const,
    contentPath: `html-one-sheets/${h.file}`,
    downloadName: h.file,
    departmentId: h.dept,
    channelId: h.ch,
    featured: h.featured,
    publicPreviewPath: `/marketing-packs/finely/html-one-sheets/${h.file}`,
  }));
}

const STATIC_ASSETS: FinelyPackAsset[] = [
  {
    id: 'start-restore-147',
    title: 'Start Restore — $147 offer',
    subtitle: 'Live landing + checkout path',
    whenToUse: 'Top-of-funnel cold/warm traffic — starter roadmap + strategy call (not Core pricing).',
    readiness: 'ready',
    format: 'offer',
    contentPath: '',
    downloadName: 'start-restore-offer.txt',
    departmentId: 'growth-acquisition',
    channelId: 'email',
    featured: true,
    publicPreviewPath: '/start',
  },
  {
    id: 'partner-md-restore-funding',
    title: 'Partner one-sheet (Markdown)',
    subtitle: 'Restore → funding readiness',
    whenToUse: 'Quick copy for partner email — same story as HTML one-sheet.',
    readiness: 'ready',
    format: 'markdown',
    contentPath: 'partner-one-sheets/restore-to-funding-readiness.md',
    downloadName: 'finely-partner-restore-to-funding-readiness.md',
    departmentId: 'partner-referral',
    channelId: 'content',
    featured: true,
  },
  {
    id: 'guide-kreyol-cover',
    title: 'Kreyòl kit cover (HTML)',
    subtitle: 'Guide v2',
    whenToUse: 'Haitian / Kreyòl corridor — kit download creative.',
    readiness: 'ready',
    format: 'html',
    contentPath: 'guides/v2-cover-kreyol-kit.html',
    downloadName: 'v2-cover-kreyol-kit.html',
    departmentId: 'haitian-kreyol',
    channelId: 'content',
    featured: true,
    publicPreviewPath: '/marketing-packs/finely/guides/v2-cover-kreyol-kit.html',
  },
  {
    id: 'guide-score-cover',
    title: 'Score intelligence cover (HTML)',
    subtitle: 'Guide v2',
    whenToUse: 'Brand & creative — score literacy lead magnet cover.',
    readiness: 'ready',
    format: 'html',
    contentPath: 'guides/v2-cover-score-intelligence.html',
    downloadName: 'v2-cover-score-intelligence.html',
    departmentId: 'brand-creative',
    channelId: 'content',
    publicPreviewPath: '/marketing-packs/finely/guides/v2-cover-score-intelligence.html',
  },
  {
    id: 'brand-kit-lock',
    title: 'Brand kit lock (read me)',
    subtitle: 'BRAND-KIT-LOCK.md',
    whenToUse: 'Before any cold creative — gold #fbbf24, ink, medallion; no Nora on Finely-primary art.',
    readiness: 'ready',
    format: 'markdown',
    contentPath: 'BRAND-KIT-LOCK.md',
    downloadName: 'BRAND-KIT-LOCK.md',
    departmentId: 'brand-creative',
    channelId: 'content',
    featured: true,
  },
  {
    id: 'call-script-intake',
    title: 'Inbound intake call outline',
    subtitle: 'Phone script',
    whenToUse: 'VA/Specialist first call — manual notes only; never auto-dial from HQ.',
    readiness: 'ready',
    format: 'markdown',
    contentPath: 'scripts/inbound-intake-call-outline.md',
    downloadName: 'finely-inbound-intake-call-outline.md',
    departmentId: 'growth-acquisition',
    channelId: 'email',
    featured: true,
  },
  {
    id: 'score-literacy-footer',
    title: 'Score literacy footer block',
    subtitle: 'Required footer copy',
    whenToUse: 'Paste at bottom of partner one-sheets and long emails.',
    readiness: 'ready',
    format: 'markdown',
    contentPath: 'SCORE-LITERACY-FOOTER.md',
    downloadName: 'SCORE-LITERACY-FOOTER.md',
    departmentId: 'brand-creative',
    channelId: 'content',
  },
];

export const FINELY_PACK_ASSETS: FinelyPackAsset[] = [
  ...STATIC_ASSETS,
  ...dayEmailAssets(),
  ...htmlAssets(),
];

export function getPackAsset(id: string): FinelyPackAsset | undefined {
  return FINELY_PACK_ASSETS.find((a) => a.id === id);
}

export function getPackAssetsForRoom(
  departmentId: MarketingDepartmentId,
  channelId: MarketingChannelId,
): FinelyPackAsset[] {
  if (departmentId === 'growth-acquisition' && channelId === 'sms') {
    return FINELY_PACK_ASSETS.filter(
      (a) => a.departmentId === 'growth-acquisition' && a.format === 'sms',
    );
  }
  if (departmentId === 'nurture-lifecycle' && channelId === 'email') {
    return FINELY_PACK_ASSETS.filter(
      (a) =>
        (a.departmentId === 'nurture-lifecycle' && a.channelId === 'email') ||
        a.id.startsWith('email-day-'),
    );
  }
  return FINELY_PACK_ASSETS.filter((a) => a.departmentId === departmentId && a.channelId === channelId);
}

export function getFeaturedPackAssetsForRoom(
  departmentId: MarketingDepartmentId,
  channelId: MarketingChannelId,
): FinelyPackAsset[] {
  const room = getPackAssetsForRoom(departmentId, channelId);
  const featured = room.filter((a) => a.featured);
  return featured.length > 0 ? featured : room.slice(0, 6);
}
