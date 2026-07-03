import { PDFDocument, rgb, type PDFPage, type RGB } from 'pdf-lib';
import type { CreditReportRecord, DisputeCandidate } from '../domain/creditReports';
import type { Partner } from '../domain/partners';
import type { CreditScoreSnapshot } from '../domain/creditScoreSnapshots';
import type { PremiumCreditAnalysisPayload } from '../lib/buildPremiumCreditAnalysisPayload';
import { buildPremiumCreditAnalysisPayload } from '../lib/buildPremiumCreditAnalysisPayload';
import { buildCreditAnalysisFilename, buildCreditAnalysisTitle } from '../lib/creditAnalysisReportNaming';

export async function generatePremiumCreditAnalysisReportPdf(args: {
  partner: Partner;
  report: CreditReportRecord;
  candidates: DisputeCandidate[];
  snapshots?: CreditScoreSnapshot[];
  templateTitle?: string;
}): Promise<{
  blob: Blob;
  filename: string;
  displayTitle: string;
  pages: number;
  exhibitsIncluded: number;
  payloadSnapshot?: PremiumCreditAnalysisPayload;
}> {
  const generatedAt = new Date();
  const partnerName = args.partner.profile?.fullName?.trim() || 'Partner';
  const payload = buildPremiumCreditAnalysisPayload({
    partner: args.partner,
    parsed: args.report.parsed!,
    candidates: args.candidates,
    snapshots: args.snapshots,
    generatedAt,
  });
  const bytes = await composePremiumCreditAnalysisPdf(payload);
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  const displayTitle =
    args.templateTitle?.trim() ||
    buildCreditAnalysisTitle({ partnerName, generatedAt, sourceReportFilename: args.report.filename });
  const filename = buildCreditAnalysisFilename({ partnerName, generatedAt });
  return {
    blob,
    filename,
    displayTitle,
    pages: PREMIUM_CREDIT_ANALYSIS_SPREADS.length,
    exhibitsIncluded: 0,
    payloadSnapshot: payload,
  };
}


export const PREMIUM_CREDIT_ANALYSIS_SPREADS = [
  '01_sophisticated_credit_analysis_spread.png',
  '02_credit_readiness_and_analysis_overview.png',
  '03_financial_report_analysis_spread_design.png',
  '04_credit_analysis_report_spread_4_of_10.png',
  '05_corporate_credit_action_plan_overview.png',
  '06_credit_analysis_report_overview.png',
  '07_credit_insights_for_a_brighter_future.png',
  '08_building_freedom_through_strategic_credit.png',
  '09_luxurious_financial_report_design_spread.png',
  '10_elite_credit_positioning_path_guide.png',
] as const;

const GOLD: RGB = rgb(0.79, 0.64, 0.15);
const GREEN: RGB = rgb(0.18, 0.55, 0.28);
const INK: RGB = rgb(0.12, 0.12, 0.12);
const CREAM: RGB = rgb(0.96, 0.95, 0.9);
const WHITE: RGB = rgb(1, 1, 1);

type OverlayText = {
  text: string;
  x: number;
  y: number;
  size: number;
  color?: RGB;
  maxWidth?: number;
  cover?: { x: number; y: number; w: number; h: number; color?: RGB };
};

function coverAndText(page: PDFPage, o: OverlayText) {
  if (o.cover) {
    page.drawRectangle({
      x: o.cover.x,
      y: o.cover.y,
      width: o.cover.w,
      height: o.cover.h,
      color: o.cover.color ?? CREAM,
      opacity: 0.94,
    });
  }
  page.drawText(o.text, { x: o.x, y: o.y, size: o.size, color: o.color ?? INK });
}

function spreadOverlays(spreadIndex: number, p: PremiumCreditAnalysisPayload, w: number, h: number): OverlayText[] {
  const left = (x: number) => x * w;
  const top = (y: number) => h - y * h;
  const commonFooter: OverlayText[] = [
    {
      text: p.footerLabel,
      x: left(0.56),
      y: top(0.965),
      size: 8,
      color: GOLD,
      cover: { x: left(0.52), y: top(0.985), w: w * 0.4, h: h * 0.028, color: CREAM },
    },
  ];

  if (spreadIndex === 0) {
    return [
      {
        text: p.preparedForBanner,
        x: left(0.14),
        y: top(0.1),
        size: 9,
        color: GOLD,
        cover: { x: left(0.08), y: top(0.125), w: w * 0.34, h: h * 0.035, color: rgb(0.05, 0.05, 0.05) },
      },
      {
        text: p.preparedDate,
        x: left(0.14),
        y: top(0.125),
        size: 8,
        color: WHITE,
        cover: { x: left(0.08), y: top(0.145), w: w * 0.2, h: h * 0.025, color: rgb(0.05, 0.05, 0.05) },
      },
      {
        text: p.utilizationPct != null ? `${p.utilizationPct}%` : '—',
        x: left(0.73),
        y: top(0.3),
        size: 16,
        color: WHITE,
        cover: { x: left(0.68), y: top(0.32), w: w * 0.1, h: h * 0.04, color: rgb(0.04, 0.04, 0.04) },
      },
      {
        text: p.headlineScore != null ? String(p.headlineScore) : '—',
        x: left(0.73),
        y: top(0.38),
        size: 16,
        color: WHITE,
        cover: { x: left(0.68), y: top(0.4), w: w * 0.1, h: h * 0.04, color: rgb(0.04, 0.04, 0.04) },
      },
      {
        text: String(p.negativeItemsCount),
        x: left(0.73),
        y: top(0.46),
        size: 16,
        color: WHITE,
        cover: { x: left(0.68), y: top(0.48), w: w * 0.1, h: h * 0.04, color: rgb(0.04, 0.04, 0.04) },
      },
      {
        text: String(p.openAccountsCount),
        x: left(0.73),
        y: top(0.54),
        size: 16,
        color: WHITE,
        cover: { x: left(0.68), y: top(0.56), w: w * 0.1, h: h * 0.04, color: rgb(0.04, 0.04, 0.04) },
      },
      {
        text: `${p.inquiriesTotal}${p.inquiriesImpacting ? ` (${p.inquiriesImpacting} impacting)` : ''}`,
        x: left(0.7),
        y: top(0.62),
        size: 11,
        color: WHITE,
        cover: { x: left(0.66), y: top(0.64), w: w * 0.14, h: h * 0.04, color: rgb(0.04, 0.04, 0.04) },
      },
      {
        text: p.approvalReadiness,
        x: left(0.73),
        y: top(0.7),
        size: 14,
        color: GREEN,
        cover: { x: left(0.68), y: top(0.72), w: w * 0.12, h: h * 0.04, color: rgb(0.04, 0.04, 0.04) },
      },
      ...commonFooter,
    ];
  }

  if (spreadIndex === 1) {
    const overlays: OverlayText[] = [
      {
        text: p.preparedForBanner,
        x: left(0.08),
        y: top(0.1),
        size: 9,
        color: GOLD,
        cover: { x: left(0.05), y: top(0.125), w: w * 0.38, h: h * 0.035, color: CREAM },
      },
      {
        text: `OVERALL READINESS: ${p.overallReadiness}`,
        x: left(0.1),
        y: top(0.3),
        size: 12,
        color: INK,
        cover: { x: left(0.07), y: top(0.33), w: w * 0.3, h: h * 0.05, color: CREAM },
      },
      {
        text: `Status: ${p.readinessStatus}`,
        x: left(0.1),
        y: top(0.36),
        size: 10,
        color: INK,
        cover: { x: left(0.07), y: top(0.39), w: w * 0.28, h: h * 0.04, color: CREAM },
      },
      {
        text: p.readinessTagline.slice(0, 70),
        x: left(0.1),
        y: top(0.42),
        size: 9,
        color: INK,
        cover: { x: left(0.07), y: top(0.45), w: w * 0.35, h: h * 0.05, color: CREAM },
      },
    ];
    let y = 0.52;
    for (const b of p.bureauScores) {
      overlays.push({
        text: `${b.label}: ${b.score ?? '—'}${b.delta != null ? `  ▲ ${b.delta} pts` : ''}`,
        x: left(0.1),
        y: top(y),
        size: 11,
        color: WHITE,
        cover: { x: left(0.07), y: top(y + 0.025), w: w * 0.34, h: h * 0.035, color: rgb(0.04, 0.04, 0.04) },
      });
      y += 0.07;
    }
    overlays.push(
      {
        text: `What's Helping: ${p.quickRead.helping}`.slice(0, 90),
        x: left(0.56),
        y: top(0.78),
        size: 8,
        color: WHITE,
        cover: { x: left(0.53), y: top(0.8), w: w * 0.4, h: h * 0.035, color: rgb(0.15, 0.15, 0.15) },
      },
      {
        text: `What's Hurting: ${p.quickRead.hurting}`.slice(0, 90),
        x: left(0.56),
        y: top(0.84),
        size: 8,
        color: WHITE,
        cover: { x: left(0.53), y: top(0.86), w: w * 0.4, h: h * 0.035, color: rgb(0.15, 0.15, 0.15) },
      },
      {
        text: `Improve First: ${p.quickRead.improveFirst}`.slice(0, 90),
        x: left(0.56),
        y: top(0.9),
        size: 8,
        color: WHITE,
        cover: { x: left(0.53), y: top(0.92), w: w * 0.4, h: h * 0.035, color: rgb(0.15, 0.15, 0.15) },
      },
      ...commonFooter,
    );
    return overlays;
  }

  return [
    {
      text: `${p.partnerName} · ${p.preparedDate}`,
      x: left(0.08),
      y: top(0.1),
      size: 9,
      color: GOLD,
      cover: { x: left(0.05), y: top(0.125), w: w * 0.4, h: h * 0.035, color: CREAM },
    },
    {
      text: `Score ${p.headlineScore ?? '—'} · Negatives ${p.negativeItemsCount} · Readiness ${p.approvalReadiness}`,
      x: left(0.08),
      y: top(0.16),
      size: 8,
      color: INK,
      cover: { x: left(0.05), y: top(0.18), w: w * 0.42, h: h * 0.03, color: CREAM },
    },
    ...commonFooter,
  ];
}

export async function loadPremiumSpreadBytes(fileName: string): Promise<Uint8Array> {
  const url = `/credit-analysis/premium-spreads/${fileName}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Missing premium spread asset: ${fileName}`);
  return new Uint8Array(await res.arrayBuffer());
}

export async function composePremiumCreditAnalysisPdf(payload: PremiumCreditAnalysisPayload): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  for (let i = 0; i < PREMIUM_CREDIT_ANALYSIS_SPREADS.length; i += 1) {
    const file = PREMIUM_CREDIT_ANALYSIS_SPREADS[i];
    const bytes = await loadPremiumSpreadBytes(file);
    const image = await pdf.embedPng(bytes);
    const w = image.width;
    const h = image.height;
    const page = pdf.addPage([w, h]);
    page.drawImage(image, { x: 0, y: 0, width: w, height: h });
    for (const overlay of spreadOverlays(i, payload, w, h)) {
      coverAndText(page, overlay);
    }
  }
  return pdf.save();
}
