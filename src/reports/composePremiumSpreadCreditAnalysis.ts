import type { CreditReportRecord, DisputeCandidate } from '../domain/creditReports';
import type { Partner } from '../domain/partners';
import type { CreditScoreSnapshot } from '../domain/creditScoreSnapshots';
import { buildPremiumSpreadViewModel } from './buildPremiumSpreadViewModel';
import { buildCreditAnalysisFilename, buildCreditAnalysisTitle } from '../lib/creditAnalysisReportNaming';
import type { CreditAnalysisReportTemplateConfig } from './generateCreditAnalysisReportPdf';
import { loadPremiumSpreadPng } from './loadPremiumSpreadAssets';
import { buildFullSpreadPageList } from './spreadOverlayRegistry';
import { paintSpreadZones } from './spreadZoneRenderer';

export async function composePremiumSpreadCreditAnalysisPdf(args: {
  partner: Partner;
  report: CreditReportRecord;
  candidates: DisputeCandidate[];
  snapshots?: CreditScoreSnapshot[];
  template?: CreditAnalysisReportTemplateConfig | null;
  generatedAt?: Date;
}): Promise<Uint8Array> {
  const { PDFDocument, StandardFonts } = await import('pdf-lib');
  const parsed = args.report.parsed;
  if (!parsed) throw new Error('Report must be parsed before generating analysis.');

  const generatedAt = args.generatedAt ?? new Date();
  const vm = buildPremiumSpreadViewModel({
    partner: args.partner,
    parsed,
    candidates: args.candidates,
    snapshots: args.snapshots,
    generatedAt,
  });

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const imageCache = new Map<string, Awaited<ReturnType<typeof pdf.embedPng>>>();
  const pages = buildFullSpreadPageList(vm);
  const total = pages.length;

  for (let i = 0; i < pages.length; i++) {
    const spec = pages[i];
    let image = imageCache.get(spec.file);
    if (!image) {
      const bytes = await loadPremiumSpreadPng(spec.file);
      image = await pdf.embedPng(bytes);
      imageCache.set(spec.file, image);
    }
    const w = image.width;
    const h = image.height;
    const page = pdf.addPage([w, h]);
    page.drawImage(image, { x: 0, y: 0, width: w, height: h });
    const zones = spec.buildZones(vm, { pageNumber: i + 1, pageTotal: total });
    paintSpreadZones(page, w, h, zones, { regular: font, bold: fontBold });
  }

  return pdf.save();
}

export async function generatePremiumSpreadCreditAnalysisReportPdf(args: {
  partner: Partner;
  report: CreditReportRecord;
  candidates: DisputeCandidate[];
  snapshots?: CreditScoreSnapshot[];
  templateTitle?: string;
  template?: CreditAnalysisReportTemplateConfig | null;
  generatedAt?: Date;
}): Promise<{
  blob: Blob;
  filename: string;
  displayTitle: string;
  pages: number;
  exhibitsIncluded: number;
}> {
  const generatedAt = args.generatedAt ?? new Date();
  const partnerName = args.partner.profile?.fullName?.trim() || 'Partner';
  const bytes = await composePremiumSpreadCreditAnalysisPdf({ ...args, generatedAt });
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
