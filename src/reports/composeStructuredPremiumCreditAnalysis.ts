import type { CreditReportRecord, DisputeCandidate } from '../domain/creditReports';
import type { Partner } from '../domain/partners';
import type { CreditScoreSnapshot } from '../domain/creditScoreSnapshots';
import { buildCandidateInsight, rankDisputeCandidates } from '../creditReports/creditIntelInsights';
import { buildPremiumCreditAnalysisPayload } from '../lib/buildPremiumCreditAnalysisPayload';
import { buildCreditAnalysisFilename, buildCreditAnalysisTitle } from '../lib/creditAnalysisReportNaming';
import type { CreditAnalysisReportTemplateConfig } from './generateCreditAnalysisReportPdf';
import {
  BLACK_CARD_ESSAY,
  CLOSING_ESSAY,
  FINELY_PARTNERSHIP,
  MINDSET_INTRO,
  MINDSET_TIERS_EXTENDED,
  NEGATIVE_CATEGORY_COPY,
  NEGATIVE_SECTION_INTRO,
  PATH_FORWARD_ESSAY,
  PRIORITY_SECTION_INTRO,
  ROADMAP_ESSAY,
} from './analysisReportEditorialContent';
import {
  extractInquiryRows,
  groupNegativeCandidates,
  groupNegativeTradelines,
  isPositiveTradeline,
  negativeCategoryLabel,
  toDetailedAccountRow,
  toDetailedCandidateRow,
  type NegativeCategory,
} from './analysisReportLayoutData';
import { FinelyAnalysisPdfWriter } from './finelyAnalysisPdfWriter';
import { fmtReportDate, pdfSafe } from './pdfTextUtils';

const NEGATIVE_CATEGORIES: NegativeCategory[] = ['collections', 'charge_offs', 'repossessions', 'delinquencies', 'other'];
const MAX_PRIORITY = 8;
const TARGET_MIN_PAGES = 25;

function reported(value: string | number | null | undefined, fallback = 'Not reported') {
  if (value == null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function priorityNotes(parsed: CreditReportRecord['parsed'], c: DisputeCandidate): string[] {
  if (!parsed) return [];
  const insight = buildCandidateInsight(parsed, c);
  const notes: string[] = [];
  if (insight?.severity != null) {
    notes.push(`Estimated impact on your file: ${insight.severity} out of 100 — higher numbers mean this item deserves earlier attention in your dispute sequence.`);
  }
  if (insight?.whyTop?.length) {
    notes.push(...insight.whyTop);
  }
  if (insight?.contradictions?.length) {
    notes.push(`Review for inconsistencies: ${insight.contradictions.slice(0, 2).join(' ')}`);
  }
  if (insight?.evidenceChecklist?.length) {
    notes.push(`Gather in your portal: ${insight.evidenceChecklist.slice(0, 4).join(' · ')}`);
  }
  return notes;
}

function categoryNote(cat: NegativeCategory): string {
  const copy = NEGATIVE_CATEGORY_COPY[cat];
  return copy ? `${copy.intro} ${copy.action}` : '';
}

export async function composeStructuredPremiumCreditAnalysisPdf(args: {
  partner: Partner;
  report: CreditReportRecord;
  candidates: DisputeCandidate[];
  snapshots?: CreditScoreSnapshot[];
  template?: CreditAnalysisReportTemplateConfig | null;
  generatedAt?: Date;
}): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts } = await import('pdf-lib');
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const generatedAt = args.generatedAt ?? new Date();
  const parsed = args.report.parsed;
  if (!parsed) throw new Error('Report must be parsed before generating analysis.');

  const payload = buildPremiumCreditAnalysisPayload({
    partner: args.partner,
    parsed,
    candidates: args.candidates,
    snapshots: args.snapshots,
    generatedAt,
  });

  const partnerName = payload.partnerName;
  const template = args.template ?? null;
  const title = template?.title || 'Credit Analysis Report';
  const reportDate = args.report.reportDate || parsed.reportDate || parsed.debug?.reportDateDetected || '';
  const reportLine = reportDate
    ? `Source report · ${fmtReportDate(reportDate)}`
    : `Provider · ${args.report.provider || parsed.provider || 'Credit report'}`;

  const writer = new FinelyAnalysisPdfWriter({
    pdf,
    font,
    fontBold,
    footerLabel: pdfSafe(`${partnerName} · Finely Cred`),
  });

  // —— Cover ——
  writer.drawCoverPage({
    partnerName,
    title,
    preparedDate: payload.preparedDateLong,
    reportLine,
    kpis: [
      { label: 'Headline score', value: reported(payload.headlineScore, 'Review'), tone: 'gold' },
      {
        label: 'Utilization',
        value: payload.utilizationPct != null ? `${payload.utilizationPct}%` : 'Review',
        tone: payload.utilizationPct != null && payload.utilizationPct > 30 ? 'warn' : 'success',
      },
      { label: 'Negatives', value: String(payload.negativeItemsCount), tone: payload.negativeItemsCount > 0 ? 'warn' : 'success' },
      { label: 'Open accounts', value: String(payload.openAccountsCount), tone: 'ink' },
    ],
  });

  // —— Executive snapshot (2 pages) ——
  writer.addPage('Executive snapshot');
  writer.drawSectionTitle('Executive snapshot', payload.readinessTagline);
  writer.drawKpiRow([
    { label: 'Readiness', value: payload.overallReadiness, tone: 'gold' },
    { label: 'Posture', value: payload.approvalReadiness, tone: payload.approvalReadiness === 'Strong' ? 'success' : 'warn' },
    { label: 'Inquiries', value: String(payload.inquiriesTotal), tone: 'ink' },
    { label: 'Status', value: payload.readinessStatus, tone: 'ink' },
  ]);
  const bureauLine = payload.bureauScores.map((b) => `${b.label} ${reported(b.score)}`).join('   ·   ');
  writer.drawParagraph(
    `This report is prepared for ${partnerName} from the bureau export dated on or around ${reportLine.replace('Source report · ', '') || 'your latest upload'}. Scores and tradelines can differ by bureau — we analyze all parsed data together so your plan reflects the full picture, not a single snapshot in isolation.`,
  );
  writer.drawParagraph(`Bureau scores on file — ${bureauLine}.`);
  writer.drawPremiumImagePanel('score', 40, 96, 532, 112);

  writer.addPage('Executive snapshot');
  writer.drawSectionTitle('At a glance', 'What is helping, what needs attention, and where to start.');
  writer.drawQuickReadCards([
    { label: "What's helping", body: payload.quickRead.helping, tone: 'success' },
    { label: 'Needs attention', body: payload.quickRead.hurting, tone: 'warn' },
    { label: 'First move', body: payload.quickRead.improveFirst, tone: 'gold' },
  ]);
  writer.drawParagraph(payload.quickRead.nearTerm);
  for (const row of payload.factorRows.slice(0, 6)) {
    writer.drawParagraph(`${row.label} — ${row.detail} (${row.status})`);
  }

  // —— Credit mindset (premium editorial section) ——
  writer.drawSectionOpener(
    'Credit mindset',
    'A premium report should orient the client before it lists problems. This section frames credit as a system.',
    'mindset',
  );
  writer.drawEditorialBlock(MINDSET_INTRO.title, MINDSET_INTRO.paragraphs, MINDSET_INTRO.subtitle);

  writer.addPage('Credit mindset');
  writer.drawMindsetChapter(
    MINDSET_TIERS_EXTENDED[0].level,
    MINDSET_TIERS_EXTENDED[0].title,
    [...MINDSET_TIERS_EXTENDED[0].paragraphs],
  );
  writer.drawMindsetChapter(
    MINDSET_TIERS_EXTENDED[1].level,
    MINDSET_TIERS_EXTENDED[1].title,
    [...MINDSET_TIERS_EXTENDED[1].paragraphs],
  );

  writer.addPage('Credit mindset');
  writer.drawMindsetChapter(
    MINDSET_TIERS_EXTENDED[2].level,
    MINDSET_TIERS_EXTENDED[2].title,
    [...MINDSET_TIERS_EXTENDED[2].paragraphs],
  );

  writer.addPage('Credit mindset');
  writer.drawEditorialBlock(BLACK_CARD_ESSAY.title, BLACK_CARD_ESSAY.paragraphs, BLACK_CARD_ESSAY.subtitle);

  // —— Path forward ——
  writer.drawSectionOpener(
    'Restore · Build · Fundability',
    'The report adapts to the file, but the sequence stays disciplined: restore friction, build depth, then pursue access.',
    'roadmap',
  );
  writer.drawEditorialBlock(PATH_FORWARD_ESSAY.title, PATH_FORWARD_ESSAY.intro, PATH_FORWARD_ESSAY.subtitle);

  writer.addPage('Your path forward');
  writer.drawPathPhase(PATH_FORWARD_ESSAY.restore.title, [...PATH_FORWARD_ESSAY.restore.paragraphs]);

  writer.addPage('Your path forward');
  writer.drawPathPhase(PATH_FORWARD_ESSAY.build.title, [...PATH_FORWARD_ESSAY.build.paragraphs]);
  writer.drawPathPhase(PATH_FORWARD_ESSAY.fundability.title, [...PATH_FORWARD_ESSAY.fundability.paragraphs]);

  // —— Positive accounts ——
  const positives = (parsed.tradelines ?? []).filter(isPositiveTradeline);
  writer.drawSectionOpener(
    'Positive accounts',
    'Positive tradelines are assets. They deserve the same premium treatment as risks because they are what lenders trust.',
    'positive',
  );
  writer.drawSectionTitle(
    'Positive & open accounts',
    `${positives.length} account${positives.length === 1 ? '' : 's'} supporting your file. These tradelines are assets — protect on-time payment history and keep utilization disciplined while disputes run on separate items.`,
  );
  writer.drawParagraph(
    'Open positive accounts tell lenders you are a reliable borrower today. Closing them to “clean up” your file often backfires. The goal is to keep these reporting accurately while negatives are addressed in sequence.',
  );
  if (!positives.length) {
    writer.drawParagraph(
      'No clearly positive tradelines were auto-detected in this export. That does not mean you have no options — your strategist can identify secured or authorized-user paths once restore work is underway.',
    );
  } else {
    writer.drawAccountCardGrid(positives.map((t) => toDetailedAccountRow(t)));
  }

  // —— Inquiries ——
  const inquiries = extractInquiryRows(parsed);
  writer.drawSectionOpener(
    'Inquiry strategy',
    'Inquiries are timing signals. This section explains when to pause, when to proceed, and what the file is showing.',
    'score',
  );
  writer.drawSectionTitle(
    'Hard inquiries',
    `${inquiries.length || payload.inquiriesTotal} inquiry record(s) on file. Inquiries are normal — what matters is timing, clustering, and whether they stack on top of active disputes.`,
  );
  writer.drawParagraph(
    'Each hard inquiry can trim a few points and signal recent credit seeking to underwriters. During restore, we typically pause new applications until negatives update and scores stabilize. The table below lists subscribers as reported in your export.',
  );
  if (inquiries.length) {
    writer.drawInquiryTable(inquiries);
  } else if (payload.inquiriesTotal > 0) {
    writer.drawParagraph(
      `${payload.inquiriesTotal} inquiry record(s) were detected in the report summary. Open your uploaded bureau file in the portal for subscriber-level detail if it did not parse into rows here.`,
    );
  } else {
    writer.drawParagraph('No hard inquiries were detected in this export — a clean inquiry lane is a strength while you work the rest of the plan.');
  }

  // —— Negatives by category ——
  const tlNeg = groupNegativeTradelines(parsed.tradelines ?? []);
  const candNeg = groupNegativeCandidates(args.candidates);
  let drewNegatives = false;
  for (const cat of NEGATIVE_CATEGORIES) {
    const tls = tlNeg[cat];
    const cands = candNeg[cat].filter((c) => !tls.some((t) => t.creditorName === c.account));
    const total = tls.length + cands.length;
    if (!total) continue;
    if (!drewNegatives) {
      writer.drawSectionOpener(
        'Negative account strategy',
        'Risk should be clear, attractive, and actionable. This section turns negative data into a sequenced plan.',
        'negative',
      );
      writer.drawEditorialBlock(NEGATIVE_SECTION_INTRO.title, NEGATIVE_SECTION_INTRO.paragraphs);
      drewNegatives = true;
    }
    writer.addPage('Negative accounts');
    writer.drawSectionTitle(negativeCategoryLabel(cat), `${total} item${total === 1 ? '' : 's'} in this category.`);
    writer.drawParagraph(categoryNote(cat));
    const detailedRows = [
      ...tls.map((t) => toDetailedAccountRow(t)),
      ...cands.map((c) => toDetailedCandidateRow(c)),
    ];
    writer.drawAccountCardGrid(detailedRows);
  }

  // —— Priority action plan ——
  const ranked = rankDisputeCandidates({ parsed, candidates: args.candidates });
  if (ranked.length) {
    writer.drawSectionOpener(
      'Priority action plan',
      'Highest-impact review targets come first. The goal is sequence, evidence, and clean follow-through.',
      'negative',
    );
    writer.drawEditorialBlock(PRIORITY_SECTION_INTRO.title, PRIORITY_SECTION_INTRO.paragraphs, PRIORITY_SECTION_INTRO.subtitle);
    ranked.slice(0, MAX_PRIORITY).forEach((c, i) => {
      writer.drawPriorityCard(i + 1, toDetailedCandidateRow(c), priorityNotes(parsed, c));
    });
    if (ranked.length > MAX_PRIORITY) {
      writer.drawParagraph(
        `${ranked.length - MAX_PRIORITY} additional item${ranked.length - MAX_PRIORITY === 1 ? '' : 's'} remain tracked in your Finely Cred portal with full dispute tooling and letter generation.`,
      );
    }
  }

  // —— 90-day roadmap ——
  writer.drawSectionOpener(
    '90-day roadmap',
    'A premium analysis needs a premium execution path: now, next, later, and when to re-upload.',
    'roadmap',
  );
  writer.drawEditorialBlock(ROADMAP_ESSAY.title, ROADMAP_ESSAY.paragraphs, ROADMAP_ESSAY.subtitle);
  writer.drawRoadmapPhase(
    'Now · 0–7 days',
    template?.roadmap?.now ?? [
      'Upload three-bureau reports if not already on file so every bureau is represented in your vault.',
      'Capture evidence screenshots for each priority negative — contracts, payment confirmations, identity documents.',
      'Generate Round 1 letters in the portal — one tradeline per letter, factual and evidence-backed.',
      'Confirm personal information matches across bureaus before anything mails.',
    ],
  );
  writer.drawRoadmapPhase(
    'Next · 7–30 days',
    template?.roadmap?.next ?? [
      'Mail letters with certified tracking; log send dates so response windows are visible.',
      'Hold new credit applications unless your strategist has cleared timing.',
      'Re-upload updated reports when bureau changes post — even small updates inform the next round.',
      'Lower utilization on open revolving accounts if that is part of your build phase.',
    ],
  );

  writer.addPage('90-day roadmap');
  writer.drawRoadmapPhase(
    'Later · 30–90 days',
    template?.roadmap?.later ?? [
      'Escalate stalled investigations with documented follow-up — dates and reference numbers in the portal.',
      'Enter build phase: positive depth, utilization targets, and funding prep when restore goals are met.',
      'Repeat analyze → act → re-pull until readiness scores align with your funding or restore target.',
      'Book a strategist session before major applications so inquiry timing and lane alignment are confirmed.',
    ],
  );

  // —— Finely Cred partnership ——
  writer.drawSectionOpener(
    'Your Finely Cred team',
    'The PDF is the snapshot. The portal is the operating system that keeps the file moving.',
    'closing',
  );
  writer.drawEditorialBlock(FINELY_PARTNERSHIP.title, FINELY_PARTNERSHIP.paragraphs);

  // —— Closing ——
  writer.drawClosingSpread({
    partnerName,
    preparedDate: payload.preparedDateLong,
    title: CLOSING_ESSAY.title,
    paragraphs: CLOSING_ESSAY.paragraphs,
  });
  writer.drawDarkClosingPage({ partnerName, preparedDate: payload.preparedDateLong });

  // Pad to target length with continued education if report is thin
  let padIndex = 0;
  const filler = [
    'Credit reporting is dynamic. An item that appears today may update, re-age incorrectly, or duplicate after a bureau response. That is why we emphasize re-uploading reports after each round rather than treating this PDF as a static scorecard.',
    'Utilization is reported on the statement date for most issuers. Paying down balances before that date — not just the due date — is how many clients win quick point gains without new credit.',
    'Business and personal credit serve different purposes but share timing risk. Sequencing matters: restore personal friction before stacking business inquiries if fundability is the goal.',
    'Documentation wins disputes. Screenshots, certified mail receipts, and identity proofs belong in your portal vault so every letter you send is repeatable and auditable.',
    'Your strategist can reinterpret this report after each re-parse. Treat the portal as the live version; this PDF is the oriented snapshot for the current cycle.',
  ];
  while (pdf.getPageCount() < TARGET_MIN_PAGES && padIndex < 12) {
    if (padIndex === 0) {
      writer.addPage('Reference notes');
      writer.drawSectionTitle('Reference notes', 'Additional context while your file is in motion.');
    } else if (padIndex % 3 === 0) {
      writer.addPage('Reference notes');
    }
    writer.drawParagraph(filler[padIndex % filler.length]);
    padIndex += 1;
  }

  writer.drawFooters();
  return pdf.save();
}

export async function generateStructuredPremiumCreditAnalysisReportPdf(args: {
  partner: Partner;
  report: CreditReportRecord;
  candidates: DisputeCandidate[];
  snapshots?: CreditScoreSnapshot[];
  templateTitle?: string;
  template?: CreditAnalysisReportTemplateConfig | null;
}): Promise<{
  blob: Blob;
  filename: string;
  displayTitle: string;
  pages: number;
  exhibitsIncluded: number;
}> {
  const generatedAt = new Date();
  const partnerName = args.partner.profile?.fullName?.trim() || 'Partner';
  const bytes = await composeStructuredPremiumCreditAnalysisPdf({ ...args, generatedAt });
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const displayTitle =
    args.templateTitle?.trim() ||
    args.template?.title?.trim() ||
    buildCreditAnalysisTitle({ partnerName, generatedAt, sourceReportFilename: args.report.filename });
  const filename = buildCreditAnalysisFilename({ partnerName, generatedAt });
  const { PDFDocument } = await import('pdf-lib');
  const doc = await PDFDocument.load(bytes);
  return { blob, filename, displayTitle, pages: doc.getPageCount(), exhibitsIncluded: 0 };
}
