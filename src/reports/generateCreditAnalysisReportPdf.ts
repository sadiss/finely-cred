import type { CreditReportRecord, DisputeCandidate, ParsedCreditReport, ParsedScore, ParsedTradeline } from '../domain/creditReports';
import type { Partner } from '../domain/partners';
import { getBlobStore } from '../storage/getBlobStore';
import { bureauShortCode } from '../utils/bureaus';
import {
  buildCandidateInsight,
  rankDisputeCandidates,
  type CandidateInsight,
} from '../creditReports/creditIntelInsights';

type Section = { title: string; bullets: string[] };
export type AnalysisVariant = 'standard' | 'negatives_heavy' | 'funding_focus';
type ExhibitImage = { blobRef: string; filename?: string; mimeType?: string; caption?: string };

export type CreditAnalysisReportTemplateConfigV1 = {
  version: 1;
  /** Cover title override */
  title?: string;
  /** Small badge line on cover */
  badgeLine?: string;
  /** Optional cover blurb override (2–5 short paragraphs). */
  coverBlurb?: string;

  /** Override the recommended sequencing bullets. */
  roadmap?: {
    now?: string[];
    next?: string[];
    later?: string[];
    fundingOverlay?: string[];
  };

  /** Controls how the Negatives appendix is rendered. */
  negatives?: {
    maxPerBucket?: number;
  };

  /** Appendix customization */
  appendix?: {
    checklist?: string[];
    glossary?: string[];
    additionalNotesText?: string;
  };

  /** Exhibits customization */
  exhibits?: {
    max?: number;
  };

  /** Minimum total pages to pad to (premium). */
  minPages?: number;

  /** Optional variant override stored in template. */
  variant?: AnalysisVariant;
};

export type CreditAnalysisReportTemplateConfig = CreditAnalysisReportTemplateConfigV1;

export function normalizeCreditAnalysisReportTemplateConfig(input: any): CreditAnalysisReportTemplateConfig | null {
  if (!input || typeof input !== 'object') return null;
  const v = Number((input as any).version);
  if (v !== 1) return null;
  const cfg = input as CreditAnalysisReportTemplateConfigV1;

  const arr = (x: any): string[] | undefined => (Array.isArray(x) ? x.map((s) => String(s ?? '').trim()).filter(Boolean) : undefined);
  const str = (x: any): string | undefined => {
    const s = String(x ?? '').trim();
    return s ? s : undefined;
  };
  const num = (x: any): number | undefined => {
    const n = Number(x);
    return Number.isFinite(n) ? n : undefined;
  };

  return {
    version: 1,
    title: str(cfg.title),
    badgeLine: str(cfg.badgeLine),
    coverBlurb: str(cfg.coverBlurb),
    roadmap: cfg.roadmap
      ? {
          now: arr((cfg.roadmap as any).now),
          next: arr((cfg.roadmap as any).next),
          later: arr((cfg.roadmap as any).later),
          fundingOverlay: arr((cfg.roadmap as any).fundingOverlay),
        }
      : undefined,
    negatives: cfg.negatives
      ? {
          maxPerBucket: num((cfg.negatives as any).maxPerBucket),
        }
      : undefined,
    appendix: cfg.appendix
      ? {
          checklist: arr((cfg.appendix as any).checklist),
          glossary: arr((cfg.appendix as any).glossary),
          additionalNotesText: str((cfg.appendix as any).additionalNotesText),
        }
      : undefined,
    exhibits: cfg.exhibits
      ? {
          max: num((cfg.exhibits as any).max),
        }
      : undefined,
    minPages: num(cfg.minPages),
    variant:
      cfg.variant === 'standard' || cfg.variant === 'negatives_heavy' || cfg.variant === 'funding_focus' ? cfg.variant : undefined,
  };
}

function safe(s: any) {
  return String(s ?? '').trim();
}

function fmtDate(d?: string) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return d;
  }
}

function topScores(scores?: ParsedScore[]) {
  const list = (scores || []).slice();
  list.sort((a, b) => (b.value || 0) - (a.value || 0));
  return list.slice(0, 6);
}

function negativesFromCandidates(cands: DisputeCandidate[]) {
  const rows = cands.slice();
  rows.sort((a, b) => a.bureau.localeCompare(b.bureau) || a.type.localeCompare(b.type));
  return rows;
}

function tradelineSummary(tradelines: ParsedTradeline[]) {
  const total = tradelines.length;
  const withBal = tradelines.filter((t) => typeof t.balance === 'number' && (t.balance ?? 0) > 0).length;
  const withLimit = tradelines.filter((t) => typeof t.creditLimit === 'number' && (t.creditLimit ?? 0) > 0).length;
  const closed = tradelines.filter((t) => safe(t.accountStatus).toLowerCase().includes('closed')).length;
  return { total, withBal, withLimit, closed };
}

function formatNegativeBullet(c: DisputeCandidate, insight?: CandidateInsight): string {
  const parts = [c.account, c.type, c.status ? `status: ${c.status}` : '', c.code ? `code ${c.code}` : ''].filter(Boolean);
  const facts: string[] = [];
  if (insight?.keyFacts.balance != null) facts.push(`bal $${Math.round(insight.keyFacts.balance).toLocaleString()}`);
  if (insight?.keyFacts.pastDue != null) facts.push(`past due $${Math.round(insight.keyFacts.pastDue).toLocaleString()}`);
  if (insight?.keyFacts.dofd) facts.push(`DOFD ${fmtDate(insight.keyFacts.dofd)}`);
  if (insight?.keyFacts.recentDerogCount6) facts.push(`${insight.keyFacts.recentDerogCount6} derog mo (6)`);
  const why = insight?.whyTop?.slice(0, 2).join(' · ');
  const contradiction = insight?.contradictions?.[0];
  let line = insight?.severity != null ? `[Impact ${insight.severity}/100] ` : '';
  line += parts.join(' • ');
  if (facts.length) line += ` — ${facts.join(' · ')}`;
  if (why) line += ` | ${why}`;
  if (contradiction) line += ` | Flag: ${contradiction}`;
  return line;
}

function negativeBulletForCandidate(parsed: ParsedCreditReport | null, c: DisputeCandidate): string {
  if (!parsed) return `${c.account} • ${c.status} • code ${c.code}`;
  const insight = buildCandidateInsight(parsed, c);
  return formatNegativeBullet(c, insight);
}

function buildSections(args: {
  partner: Partner;
  report: CreditReportRecord;
  parsed: ParsedCreditReport | null;
  candidates: DisputeCandidate[];
  variant: AnalysisVariant;
  template?: CreditAnalysisReportTemplateConfig | null;
}): Section[] {
  const name = args.partner.profile.fullName || 'Partner';
  const provider = args.report.provider || args.parsed?.provider || 'unknown';
  const reportDate = args.report.reportDate || args.parsed?.reportDate || args.parsed?.debug?.reportDateDetected || '';
  const scores = topScores(args.parsed?.scores);
  const scoreLine = scores.length
    ? scores.map((s) => `${s.model}${s.bureau ? ` (${bureauShortCode(s.bureau)})` : ''}: ${s.value}`).join(' • ')
    : 'No scores extracted from this report (PDF text-only exports sometimes omit score blocks).';
  const neg = negativesFromCandidates(args.candidates);
  const tradelines = args.parsed?.tradelines ?? [];
  const tradelineMeta = tradelineSummary(tradelines);
  const ranked =
    args.parsed && neg.length ? rankDisputeCandidates({ parsed: args.parsed, candidates: neg }) : [];
  const topImpact = ranked[0]?.severity;
  const highImpactCount = ranked.filter((r) => r.severity >= 75).length;

  const sections: Section[] = [
    {
      title: 'Executive summary',
      bullets: [
        `Prepared for: ${name}`,
        `Provider: ${provider}${reportDate ? ` • Report date: ${fmtDate(reportDate)}` : ''}`,
        scoreLine,
        `Tradelines detected: ${tradelineMeta.total} (limits: ${tradelineMeta.withLimit}, balances: ${tradelineMeta.withBal}, closed: ${tradelineMeta.closed})`,
        `Potential dispute candidates: ${neg.length}${ranked.length ? ` • High-impact (75+): ${highImpactCount}` : ''}`,
        ranked.length
          ? `Top priority target: ${ranked[0].account} (${ranked[0].type}) — impact score ${topImpact}/100`
          : 'Upload a structured bureau export for ranked impact scoring and cross-bureau flag detection.',
      ],
    },
    {
      title: 'Now (0–7 days)',
      bullets:
        args.template?.roadmap?.now ??
        [
          'Upload all 3-bureau reports (HTML export preferred).',
          'Capture clean evidence screenshots for each negative item (payment history, account detail, collection entry).',
          'Generate your Round 1 dispute letter(s), save to Letters Vault.',
        ],
    },
    {
      title: 'Next (7–30 days)',
      bullets:
        args.template?.roadmap?.next ??
        [
          'Mail letters (certified optional), then track the response window.',
          'Log every response in Documents Vault; re-upload updated reports after updates post.',
          'Start round sequencing: avoid stacking too many disputes at once if data is thin.',
        ],
    },
    {
      title: 'Later (30–90 days)',
      bullets:
        args.template?.roadmap?.later ??
        [
          'Escalations if the bureaus fail to investigate properly.',
          'Begin build phase: utilization optimization, new accounts (as appropriate), and lane-specific steps.',
          'Repeat: analyze → evidence → letters → mail → follow-up.',
        ],
    },
  ];

  if (args.variant === 'funding_focus') {
    sections.splice(1, 0, {
      title: 'Funding focus (lane overlay)',
      bullets:
        args.template?.roadmap?.fundingOverlay ??
        [
          'Stabilize personal profile signals first: identity accuracy, utilization, and clean dispute sequencing.',
          'Build documentation discipline: keep your Documents Vault current (bureau mail, creditor correspondence, proof packs).',
          'As negatives are removed/corrected, begin readiness steps: vendor sequencing (if business lane), relationship-building, and consistent reporting footprint.',
        ],
    });
  }

  if (ranked.length) {
    const topN = args.variant === 'negatives_heavy' ? 20 : 12;
    sections.splice(args.variant === 'funding_focus' ? 2 : 1, 0, {
      title: 'Priority dispute targets (ranked by impact)',
      bullets: ranked.slice(0, topN).map((r) => formatNegativeBullet(r, r.insight)),
    });
  }

  // Add a negatives detail section per bureau/type (ensures depth + page count).
  const bucket: Record<string, DisputeCandidate[]> = {};
  for (const c of neg) {
    const k = `${bureauShortCode(c.bureau)} • ${c.type}`;
    (bucket[k] ||= []).push(c);
  }
  const keys = Object.keys(bucket);
  for (const k of keys) {
    const items = bucket[k] || [];
    const max = Math.max(1, Math.min(80, args.template?.negatives?.maxPerBucket ?? (args.variant === 'negatives_heavy' ? 40 : 18)));
    sections.push({
      title: `Negatives — ${k}`,
      bullets: items.slice(0, max).map((x) => negativeBulletForCandidate(args.parsed, x)),
    });
  }

  // Appendix pages to guarantee >= 20 pages.
  sections.push(
    {
      title: 'Appendix — dispute round checklist',
      bullets:
        args.template?.appendix?.checklist ??
        [
          '1) Choose items you can explain clearly (accuracy/verification).',
          '2) Attach evidence that supports your claim (screenshots, letters, statements).',
          '3) Keep reasons consistent and concise; avoid conflicting narratives.',
          '4) Mail and track dates; create follow-up tasks automatically.',
        ],
    },
    {
      title: 'Appendix — glossary',
      bullets:
        args.template?.appendix?.glossary ??
        [
          'CO: Charge-off',
          'CA: Collection account',
          'DOFD: Date of First Delinquency',
          'Utilization: (total revolving balance) / (total revolving limit)',
          'Derogatory: negative remark impacting score',
        ],
    },
  );

  return sections;
}

export type AnalysisReportPreviewSection = {
  title: string;
  bullets: string[];
  kind: 'standard' | 'negative' | 'appendix' | 'roadmap';
};

/** Live preview model for the analysis report builder UI. */
export function buildAnalysisReportPreviewModel(args: {
  partner: Partner;
  report: CreditReportRecord;
  candidates: DisputeCandidate[];
  variant?: AnalysisVariant;
  template?: CreditAnalysisReportTemplateConfig | null;
}): { sections: AnalysisReportPreviewSection[]; estimatedPages: number; negativesCount: number } {
  const parsed = args.report.parsed ?? null;
  const template = args.template ?? null;
  const variant: AnalysisVariant = (template?.variant as any) ?? args.variant ?? 'standard';
  const raw = buildSections({
    partner: args.partner,
    report: args.report,
    parsed,
    candidates: args.candidates,
    variant,
    template,
  });

  let negativesCount = 0;
  const sections: AnalysisReportPreviewSection[] = raw.map((s) => {
    let kind: AnalysisReportPreviewSection['kind'] = 'standard';
    if (/^Negatives —/.test(s.title)) {
      kind = 'negative';
      negativesCount += s.bullets.length;
    } else if (/^Priority dispute targets/.test(s.title)) {
      kind = 'negative';
      negativesCount += s.bullets.length;
    } else if (/^Appendix/.test(s.title)) kind = 'appendix';
    else if (/^(Now|Next|Later|Funding focus)/.test(s.title)) kind = 'roadmap';
    return { title: s.title, bullets: s.bullets, kind };
  });

  const minTotal = Math.max(10, Math.min(80, template?.minPages ?? 22));
  const contentPages = 2 + sections.length;
  const estimatedPages = Math.max(contentPages, minTotal);

  return { sections, estimatedPages, negativesCount };
}

export async function generateCreditAnalysisReportPdf(args: {
  partner: Partner;
  report: CreditReportRecord;
  candidates: DisputeCandidate[];
  variant?: AnalysisVariant;
  exhibits?: ExhibitImage[];
  template?: CreditAnalysisReportTemplateConfig | null;
}): Promise<{ blob: Blob; filename: string; pages: number; exhibitsIncluded: number }> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const parsed = args.report.parsed ?? null;
  const template = args.template ?? null;
  const variant: AnalysisVariant = (template?.variant as any) ?? args.variant ?? 'standard';
  const sections = buildSections({ partner: args.partner, report: args.report, parsed, candidates: args.candidates, variant, template });

  const now = new Date();
  const title = template?.title || 'Credit Analysis Report';
  const subtitle = `${args.partner.profile.fullName || 'Partner'} • ${now.toLocaleDateString()}`;

  const accent = rgb(0.96, 0.62, 0.11); // amber-ish
  const ink = rgb(0.08, 0.10, 0.10);
  const soft = rgb(0.45, 0.45, 0.48);

  const drawHeader = (page: any, headerText: string) => {
    const { width, height } = page.getSize();
    page.drawRectangle({ x: 0, y: height - 72, width, height: 72, color: rgb(0.98, 0.98, 0.99) });
    page.drawRectangle({ x: 0, y: height - 74, width, height: 2, color: accent });
    page.drawText('Finely Cred', { x: 48, y: height - 46, size: 12, font: fontBold, color: ink });
    page.drawText(headerText, { x: 48, y: height - 62, size: 9, font, color: soft });
  };

  const drawFooter = (page: any, pageNum: number, total: number) => {
    const { width } = page.getSize();
    page.drawRectangle({ x: 0, y: 0, width, height: 40, color: rgb(0.985, 0.985, 0.99) });
    page.drawRectangle({ x: 0, y: 40, width, height: 1, color: rgb(0.92, 0.92, 0.94) });
    page.drawText(`Page ${pageNum} / ${total}`, { x: width - 120, y: 14, size: 9, font, color: soft });
  };

  // Cover
  const cover = pdf.addPage([612, 792]); // US Letter
  {
    const { width, height } = cover.getSize();
    cover.drawRectangle({ x: 0, y: 0, width, height, color: rgb(1, 1, 1) });
    cover.drawRectangle({ x: 0, y: height - 170, width, height: 170, color: rgb(0.98, 0.98, 0.995) });
    cover.drawRectangle({ x: 0, y: height - 172, width, height: 2, color: accent });
    cover.drawText(title, { x: 48, y: height - 110, size: 34, font: fontBold, color: ink });
    cover.drawText(subtitle, { x: 48, y: height - 140, size: 12, font, color: soft });
    cover.drawRectangle({ x: 48, y: height - 240, width: width - 96, height: 18, color: rgb(0.07, 0.09, 0.09) });
    cover.drawText(template?.badgeLine || 'Premium deliverable • Strategy • Negatives • Next steps', {
      x: 58,
      y: height - 236,
      size: 10,
      font: fontBold,
      color: rgb(1, 1, 1),
    });
    const blurb =
      template?.coverBlurb ||
      'This report summarizes your current credit snapshot, highlights key negatives, and provides a recommended sequence to dispute, follow up, and rebuild.\n\n' +
        'Use it as your “single source of truth” for what to do now, next, and later.';
    cover.drawText(blurb, { x: 48, y: height - 320, size: 12, font, color: ink, lineHeight: 16, maxWidth: width - 96 });
  }

  // TOC
  const toc = pdf.addPage([612, 792]);
  drawHeader(toc, 'Table of contents');
  {
    const { width, height } = toc.getSize();
    toc.drawText('Table of contents', { x: 48, y: height - 120, size: 20, font: fontBold, color: ink });
    let y = height - 160;
    const tocItems = [
      'Executive summary',
      'Now / Next / Later roadmap',
      'Scores & tradeline summary',
      'Negatives breakdown (by bureau/type)',
      'Appendix',
    ];
    for (const item of tocItems) {
      toc.drawText(`• ${item}`, { x: 58, y, size: 12, font, color: ink });
      y -= 18;
    }
    toc.drawText('Note: Page numbers may shift as your negatives change.', { x: 48, y: 80, size: 10, font, color: soft });
    toc.drawRectangle({ x: 48, y: 92, width: width - 96, height: 1, color: rgb(0.92, 0.92, 0.94) });
  }

  // Content pages
  const contentPages: any[] = [];
  for (const s of sections) {
    const page = pdf.addPage([612, 792]);
    contentPages.push(page);
    drawHeader(page, s.title);
    const { width, height } = page.getSize();
    page.drawText(s.title, { x: 48, y: height - 120, size: 18, font: fontBold, color: ink });

    // Accent badge
    page.drawRectangle({ x: 48, y: height - 152, width: width - 96, height: 10, color: rgb(0.99, 0.97, 0.92) });
    page.drawRectangle({ x: 48, y: height - 152, width: 40, height: 10, color: accent });

    let y = height - 190;
    const lineHeight = 14;
    const maxWidth = width - 96;
    for (const b of s.bullets.length ? s.bullets : ['—']) {
      const text = `• ${b}`;
      page.drawText(text, { x: 58, y, size: 11, font, color: ink, maxWidth, lineHeight });
      y -= lineHeight * 1.4;
      if (y < 90) break;
    }
  }

  // Optional exhibits (images from Evidence Vault)
  const exhibitsMax = Math.max(0, Math.min(50, template?.exhibits?.max ?? 10));
  const exhibits = (args.exhibits ?? []).slice(0, exhibitsMax);
  let exhibitsIncluded = 0;
  if (exhibits.length) {
    const store = getBlobStore();
    for (const ex of exhibits) {
      try {
        const blob = await store.get(ex.blobRef);
        if (!blob) continue;
        const mime = String(ex.mimeType || blob.type || '').toLowerCase();
        const buf = new Uint8Array(await blob.arrayBuffer());
        const embed =
          mime.includes('png')
            ? await pdf.embedPng(buf)
            : mime.includes('jpg') || mime.includes('jpeg')
              ? await pdf.embedJpg(buf)
              : null;
        if (!embed) continue;

        const page = pdf.addPage([612, 792]);
        contentPages.push(page);
        drawHeader(page, 'Appendix — exhibits');
        const { width, height } = page.getSize();
        page.drawText('Appendix — exhibits', { x: 48, y: height - 120, size: 18, font: fontBold, color: ink });
        const cap = safe(ex.caption || ex.filename || 'Exhibit');
        if (cap) page.drawText(cap, { x: 48, y: height - 146, size: 10, font, color: soft, maxWidth: width - 96 });

        // Fit image into a safe rectangle.
        const maxW = width - 96;
        const maxH = height - 220;
        const scale = Math.min(maxW / embed.width, maxH / embed.height, 1);
        const w = embed.width * scale;
        const h = embed.height * scale;
        const x = (width - w) / 2;
        const y = 72 + (maxH - h) / 2;
        page.drawRectangle({ x: 48, y: 72, width: width - 96, height: maxH, color: rgb(0.985, 0.985, 0.99), borderColor: rgb(0.92, 0.92, 0.94), borderWidth: 1 });
        page.drawImage(embed, { x, y, width: w, height: h });
        exhibitsIncluded += 1;
      } catch {
        // best-effort only
      }
    }
  }

  // Guarantee minimum page count (>= 22) with premium-looking filler pages.
  const minTotal = Math.max(10, Math.min(80, template?.minPages ?? 22));
  while (pdf.getPageCount() < minTotal) {
    const page = pdf.addPage([612, 792]);
    contentPages.push(page);
    drawHeader(page, 'Appendix — additional notes');
    const { width, height } = page.getSize();
    page.drawText('Appendix — additional notes', { x: 48, y: height - 120, size: 18, font: fontBold, color: ink });
    page.drawText(
      template?.appendix?.additionalNotesText ||
        'This page is reserved for future enhancements: trend charts across multiple report dates, bureau response tracking, and lender readiness scoring.\n\n' +
          'As your account grows, this report becomes richer and more personalized.',
      { x: 48, y: height - 170, size: 12, font, color: ink, maxWidth: width - 96, lineHeight: 16 },
    );
    // Visual blocks
    const blocks = [
      { x: 48, y: 420, w: width - 96, h: 90 },
      { x: 48, y: 300, w: (width - 110) / 2, h: 90 },
      { x: 62 + (width - 110) / 2, y: 300, w: (width - 110) / 2, h: 90 },
    ];
    for (const b of blocks) {
      page.drawRectangle({ x: b.x, y: b.y, width: b.w, height: b.h, color: rgb(0.98, 0.98, 0.99), borderColor: rgb(0.92, 0.92, 0.94), borderWidth: 1 });
      page.drawRectangle({ x: b.x, y: b.y + b.h - 6, width: b.w, height: 6, color: accent });
    }
  }

  // Add footers with final page count.
  const total = pdf.getPageCount();
  for (let i = 0; i < total; i++) {
    const page = pdf.getPage(i);
    drawFooter(page, i + 1, total);
  }

  const bytes = await pdf.save();
  const filename = `Credit_Analysis_Report_${(args.partner.profile.fullName || 'Partner').replace(/\s+/g, '_')}_${now
    .toISOString()
    .slice(0, 10)}.pdf`;
  // Some TS/dom lib combos are picky about Uint8Array<ArrayBufferLike> as a BlobPart.
  // Runtime is fine; we cast to satisfy the compiler.
  return { blob: new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' }), filename, pages: total, exhibitsIncluded };
}

