import * as pdfjsLib from 'pdfjs-dist';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import pdfWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';
import { toBlob } from 'html-to-image';
import type {
  CreditReportRecord,
  NormalizedReportRegion,
  ParsedTradeline,
  ReportSourceAnchor,
} from '../domain/creditReports';
import type {
  EvidenceItem,
  EvidenceRedactionProfile,
} from '../domain/evidence';
import { getBlobStore } from '../storage/getBlobStore';
import { newId } from '../utils/ids';

// @ts-ignore
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const DEFAULT_REGION: NormalizedReportRegion = {
  x: 0.02,
  y: 0.08,
  width: 0.96,
  height: 0.44,
};

export const DEFAULT_REPORT_REDACTION: EvidenceRedactionProfile = {
  version: 'report-redaction-v1',
  maskedFields: ['ssn', 'dob', 'full_account_number', 'unrelated_address'],
  keepAccountLast4: true,
  reviewedByUser: false,
};

type RenderedSourceExhibit = {
  blob: Blob;
  page?: number;
  region?: NormalizedReportRegion;
  redaction: EvidenceRedactionProfile;
};

function clamp(value: number) {
  return Math.max(0, Math.min(1, value));
}

function safeRegion(region?: NormalizedReportRegion): NormalizedReportRegion {
  const source = region ?? DEFAULT_REGION;
  const x = clamp(source.x);
  const y = clamp(source.y);
  return {
    x,
    y,
    width: Math.max(0.08, Math.min(clamp(source.width), 1 - x)),
    height: Math.max(0.08, Math.min(clamp(source.height), 1 - y)),
  };
}

function drawExhibitChrome(args: {
  sourceCanvas: HTMLCanvasElement;
  title: string;
  detail: string;
  redacted: boolean;
}): HTMLCanvasElement {
  const headerHeight = 52;
  const footerHeight = 34;
  const output = document.createElement('canvas');
  output.width = args.sourceCanvas.width;
  output.height = headerHeight + args.sourceCanvas.height + footerHeight;
  const ctx = output.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable.');

  ctx.fillStyle = '#07101d';
  ctx.fillRect(0, 0, output.width, headerHeight);
  ctx.fillStyle = '#f8fafc';
  ctx.font = '800 16px Inter, Arial, sans-serif';
  ctx.fillText(args.title, 18, 23);
  ctx.fillStyle = '#9fb3c8';
  ctx.font = '600 11px Inter, Arial, sans-serif';
  ctx.fillText(args.detail, 18, 41);
  ctx.drawImage(args.sourceCanvas, 0, headerHeight);
  ctx.fillStyle = '#f0f4f8';
  ctx.fillRect(0, headerHeight + args.sourceCanvas.height, output.width, footerHeight);
  ctx.fillStyle = '#334155';
  ctx.font = '700 10px Inter, Arial, sans-serif';
  ctx.fillText(
    args.redacted
      ? 'Source-faithful report crop · sensitive fields masked · verify before mailing'
      : 'Source-faithful report crop · verify before mailing',
    18,
    headerHeight + args.sourceCanvas.height + 21,
  );
  return output;
}

async function canvasToPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not create the source exhibit image.'))),
      'image/png',
      0.96,
    );
  });
}

function maskPdfSensitiveRuns(args: {
  ctx: CanvasRenderingContext2D;
  runs: Array<{ text: string; region: NormalizedReportRegion }>;
  crop: NormalizedReportRegion;
  width: number;
  height: number;
}) {
  const sensitive =
    /(?:\b\d{3}[- ]?\d{2}[- ]?\d{4}\b)|(?:\b(?:dob|date of birth|birth date)\b)|(?:\b\d{9,16}\b)/i;
  for (const run of args.runs) {
    if (!sensitive.test(run.text)) continue;
    const relativeX = (run.region.x - args.crop.x) / args.crop.width;
    const relativeY = (run.region.y - args.crop.y) / args.crop.height;
    const relativeWidth = run.region.width / args.crop.width;
    const relativeHeight = run.region.height / args.crop.height;
    if (relativeX > 1 || relativeY > 1 || relativeX + relativeWidth < 0 || relativeY + relativeHeight < 0) continue;
    args.ctx.fillStyle = '#111827';
    args.ctx.fillRect(
      Math.max(0, relativeX * args.width - 3),
      Math.max(0, relativeY * args.height - 2),
      Math.min(args.width, relativeWidth * args.width + 6),
      Math.min(args.height, relativeHeight * args.height + 4),
    );
  }
}

async function renderPdfSourceExhibit(args: {
  blob: Blob;
  record: CreditReportRecord;
  anchor: ReportSourceAnchor;
  title: string;
}): Promise<RenderedSourceExhibit> {
  const data = new Uint8Array(await args.blob.arrayBuffer());
  const documentTask = pdfjsLib.getDocument({ data });
  const pdf = await documentTask.promise;
  const pageNumber = Math.max(1, Math.min(args.anchor.page ?? 1, pdf.numPages));
  const page = await pdf.getPage(pageNumber);
  const baseViewport = page.getViewport({ scale: 1 });
  const viewport = page.getViewport({ scale: 2 });
  const full = document.createElement('canvas');
  full.width = Math.ceil(viewport.width);
  full.height = Math.ceil(viewport.height);
  const fullContext = full.getContext('2d');
  if (!fullContext) throw new Error('Canvas is unavailable.');
  await (page as any).render({
    canvasContext: fullContext,
    canvas: full,
    viewport,
  }).promise;

  const crop = safeRegion(args.anchor.region);
  const sourceX = Math.round(crop.x * full.width);
  const sourceY = Math.round(crop.y * full.height);
  const sourceWidth = Math.max(1, Math.round(crop.width * full.width));
  const sourceHeight = Math.max(1, Math.round(crop.height * full.height));
  const cropped = document.createElement('canvas');
  cropped.width = sourceWidth;
  cropped.height = sourceHeight;
  const croppedContext = cropped.getContext('2d');
  if (!croppedContext) throw new Error('Canvas is unavailable.');
  croppedContext.fillStyle = '#fff';
  croppedContext.fillRect(0, 0, cropped.width, cropped.height);
  croppedContext.drawImage(
    full,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    sourceWidth,
    sourceHeight,
  );

  const textContent = await page.getTextContent();
  const clampRun = (value: number) => Math.max(0, Math.min(1, value));
  const sensitiveRuns = (textContent.items as any[])
    .filter((item) => typeof item?.str === 'string' && Array.isArray(item?.transform))
    .map((item) => {
      const transform = item.transform as number[];
      const fontHeight = Math.max(1, Math.hypot(transform[2] ?? 0, transform[3] ?? 0));
      return {
        text: String(item.str),
        region: {
          x: clampRun((transform[4] ?? 0) / baseViewport.width),
          y: clampRun((baseViewport.height - (transform[5] ?? 0) - fontHeight) / baseViewport.height),
          width: clampRun(Math.max(Number(item.width) || 1, 1) / baseViewport.width),
          height: clampRun(fontHeight / baseViewport.height),
        },
      };
    });
  maskPdfSensitiveRuns({
    ctx: croppedContext,
    runs: sensitiveRuns,
    crop,
    width: cropped.width,
    height: cropped.height,
  });

  const output = drawExhibitChrome({
    sourceCanvas: cropped,
    title: args.title,
    detail: `${args.record.provider.toUpperCase()} report · page ${pageNumber} · ${args.record.reportDate ?? 'date unavailable'}`,
    redacted: true,
  });
  return {
    blob: await canvasToPng(output),
    page: pageNumber,
    region: crop,
    redaction: DEFAULT_REPORT_REDACTION,
  };
}

function sanitizeCss(value: string) {
  return value
    .replace(/@import[^;]+;?/gi, '')
    .replace(/url\s*\([^)]*\)/gi, 'none')
    .replace(/expression\s*\([^)]*\)/gi, '')
    .replace(/(?:behavior|-moz-binding)\s*:[^;]+;?/gi, '');
}

function maskSensitiveText(value: string) {
  return value
    .replace(/\b(\d{3})[- ]?(\d{2})[- ]?(\d{4})\b/g, '•••-••-$3')
    .replace(/\b(\d{5,12})(\d{4})\b/g, '••••••$2');
}

function sanitizeReportHtml(html: string): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.querySelectorAll('script,noscript,iframe,frame,object,embed,form,button,input,textarea,select,base').forEach((node) => node.remove());
  doc.querySelectorAll('link').forEach((node) => node.remove());
  doc.querySelectorAll('meta[http-equiv]').forEach((node) => node.remove());

  for (const element of Array.from(doc.querySelectorAll('*'))) {
    for (const attribute of Array.from(element.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (name.startsWith('on') || name === 'srcset' || name === 'formaction') {
        element.removeAttribute(attribute.name);
      } else if (name === 'style') {
        element.setAttribute('style', sanitizeCss(value));
      } else if ((name === 'src' || name === 'href') && !/^(?:data:|blob:|#|$)/i.test(value)) {
        element.removeAttribute(attribute.name);
      }
    }
  }
  doc.querySelectorAll('style').forEach((style) => {
    style.textContent = sanitizeCss(style.textContent ?? '');
  });
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    node.textContent = maskSensitiveText(node.textContent ?? '');
    node = walker.nextNode();
  }

  const csp = doc.createElement('meta');
  csp.setAttribute('http-equiv', 'Content-Security-Policy');
  csp.setAttribute(
    'content',
    "default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src data:; connect-src 'none'; media-src 'none';",
  );
  doc.head.prepend(csp);
  return `<!doctype html>${doc.documentElement.outerHTML}`;
}

function htmlFingerprint(value: string): string {
  let hash = 0x811c9dc5;
  const normalized = value.replace(/\s+/g, ' ').trim().toLowerCase().slice(0, 500);
  for (let index = 0; index < normalized.length; index += 1) {
    hash ^= normalized.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function findHtmlAnchor(doc: Document, anchor: ReportSourceAnchor): Element | null {
  if (anchor.htmlLocator) {
    try {
      const selected = doc.querySelector(anchor.htmlLocator);
      if (selected) return selected;
    } catch {
      // Fall through to fingerprint recovery.
    }
  }
  if (!anchor.textFingerprint) return null;
  return (
    Array.from(doc.querySelectorAll('.sub_header,.subheader,[class*="sub_header"],table,section,div'))
      .find((element) => htmlFingerprint(element.textContent ?? '') === anchor.textFingerprint) ?? null
  );
}

function buildHtmlCaptureStage(doc: Document, anchorElement: Element): HTMLElement {
  const stage = doc.createElement('section');
  stage.setAttribute(
    'style',
    'width:1060px;box-sizing:border-box;background:#fff;color:#111;padding:18px;font-family:Arial,sans-serif;',
  );
  if (anchorElement.tagName.toLowerCase() === 'table') {
    stage.append(anchorElement.cloneNode(true));
    return stage;
  }

  stage.append(anchorElement.cloneNode(true));
  let sibling = anchorElement.nextElementSibling;
  let tableCount = 0;
  let added = 0;
  while (sibling && added < 7) {
    if (
      added > 0 &&
      sibling.matches('.sub_header,.subheader,[class*="sub_header"],[class*="subheader"]')
    ) {
      break;
    }
    tableCount += sibling.tagName.toLowerCase() === 'table' || sibling.querySelector('table') ? 1 : 0;
    stage.append(sibling.cloneNode(true));
    added += 1;
    if (tableCount >= 2) break;
    sibling = sibling.nextElementSibling;
  }
  return stage;
}

async function renderHtmlSourceExhibit(args: {
  blob: Blob;
  record: CreditReportRecord;
  anchor: ReportSourceAnchor;
  title: string;
}): Promise<RenderedSourceExhibit> {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('sandbox', 'allow-same-origin');
  iframe.setAttribute('aria-hidden', 'true');
  Object.assign(iframe.style, {
    position: 'fixed',
    left: '-12000px',
    top: '0',
    width: '1200px',
    height: '1600px',
    opacity: '0',
    pointerEvents: 'none',
  });
  document.body.appendChild(iframe);

  try {
    const sanitized = sanitizeReportHtml(await args.blob.text());
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => reject(new Error('The sanitized report preview timed out.')), 8000);
      iframe.addEventListener(
        'load',
        () => {
          window.clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
      iframe.srcdoc = sanitized;
    });
    const doc = iframe.contentDocument;
    if (!doc?.body) throw new Error('Could not open the sanitized report.');
    const anchorElement = findHtmlAnchor(doc, args.anchor);
    if (!anchorElement) throw new Error('This parsed account no longer matches a source region. Re-parse the report.');
    const stage = buildHtmlCaptureStage(doc, anchorElement);
    doc.body.replaceChildren(stage);
    const rendered = await toBlob(stage, {
      backgroundColor: '#ffffff',
      pixelRatio: 1.5,
      skipFonts: true,
      cacheBust: false,
    });
    if (!rendered) throw new Error('Could not render the sanitized source region.');
    const bitmap = await createImageBitmap(rendered);
    const sourceCanvas = document.createElement('canvas');
    sourceCanvas.width = bitmap.width;
    sourceCanvas.height = bitmap.height;
    const context = sourceCanvas.getContext('2d');
    if (!context) throw new Error('Canvas is unavailable.');
    context.drawImage(bitmap, 0, 0);
    bitmap.close();
    const output = drawExhibitChrome({
      sourceCanvas,
      title: args.title,
      detail: `${args.record.provider.toUpperCase()} HTML report · ${args.record.reportDate ?? 'date unavailable'}`,
      redacted: true,
    });
    return {
      blob: await canvasToPng(output),
      redaction: DEFAULT_REPORT_REDACTION,
    };
  } finally {
    iframe.remove();
  }
}

async function sha256Hex(blob: Blob): Promise<string | undefined> {
  if (!globalThis.crypto?.subtle) return undefined;
  const digest = await globalThis.crypto.subtle.digest('SHA-256', await blob.arrayBuffer());
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export async function renderReportSourceExhibit(args: {
  record: CreditReportRecord;
  tradeline: ParsedTradeline;
  region?: NormalizedReportRegion;
}): Promise<RenderedSourceExhibit> {
  const anchor = args.tradeline.sourceAnchor;
  if (!anchor) throw new Error('This account has no source anchor yet. Re-parse the original report first.');
  const blob = await getBlobStore().get(args.record.rawBlobRef);
  if (!blob) throw new Error('The protected source report is unavailable. Restore or re-upload the original file.');
  const effectiveAnchor = args.region ? { ...anchor, region: args.region } : anchor;
  const title = `${args.tradeline.creditorName} · source report crop`;
  return args.record.fileType === 'pdf'
    ? renderPdfSourceExhibit({ blob, record: args.record, anchor: effectiveAnchor, title })
    : renderHtmlSourceExhibit({ blob, record: args.record, anchor: effectiveAnchor, title });
}

export async function createReportSourceEvidence(args: {
  record: CreditReportRecord;
  tradeline: ParsedTradeline;
  partnerId: string;
  region?: NormalizedReportRegion;
}): Promise<EvidenceItem> {
  const rendered = await renderReportSourceExhibit(args);
  const now = new Date().toISOString();
  const safeCreditor = args.tradeline.creditorName
    .replace(/[^a-z0-9]+/gi, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
  const filename = `Source_Report_Crop_${safeCreditor || 'Account'}_${now.slice(0, 10)}.png`;
  const file = new File([rendered.blob], filename, { type: 'image/png' });
  const contentSha256 = await sha256Hex(file);
  const stored = await getBlobStore().put(file, {
    partnerId: args.partnerId,
    kind: 'evidence',
    sourceReportId: args.record.id,
  });

  return {
    id: newId('evidence'),
    partnerId: args.partnerId,
    reportId: args.record.id,
    type: 'screenshot',
    source: 'source_report_crop',
    creditorName: args.tradeline.creditorName,
    caption: `Source-faithful crop from ${args.record.provider.toUpperCase()} report · review required before mailing`,
    filename,
    mimeType: 'image/png',
    sizeBytes: file.size,
    blobRef: stored.ref,
    provenance: {
      kind: 'source_faithful_report_crop',
      sourceReportId: args.record.id,
      sourceBlobRef: args.record.rawBlobRef,
      fileType: args.record.fileType,
      provider: args.record.provider,
      reportDate: args.record.reportDate,
      bureau: args.tradeline.sourceAnchor?.bureau,
      page: rendered.page ?? args.tradeline.sourceAnchor?.page,
      region: rendered.region ?? args.tradeline.sourceAnchor?.region,
      htmlLocator: args.tradeline.sourceAnchor?.htmlLocator,
      textFingerprint: args.tradeline.sourceAnchor?.textFingerprint,
      reportSha256: args.record.sha256,
      contentSha256: contentSha256 ?? stored.sha256,
      parseVersion: args.tradeline.sourceAnchor?.parseVersion,
      redaction: rendered.redaction,
      generatedAt: now,
      mailEligible: false,
      humanVerified: false,
    },
    createdAt: now,
  };
}
