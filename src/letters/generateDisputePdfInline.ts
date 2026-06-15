import { getBlobStore } from '../storage/getBlobStore';
import type { Bureau, DisputeCandidate } from '../domain/creditReports';
import { bureauDisputeAddress, SUBJECT_LINE } from './disputeLetterTemplate';
import { downloadBlob } from '../utils/download';
import { bureauShortCode } from '../utils/bureaus';

export type DisputeLetterItem = {
  candidate: DisputeCandidate;
  evidence?: { filename: string; blobRef: string; mimeType: string } | null;
  reasons: string[];
  /** Optional narrative paragraph(s) per item (often AI drafted). */
  narrative?: string | null;
  /** Phase 5/6: When missing, letter shows [DATA_NOT_READABLE]. */
  accountLast4?: string | null;
  balance?: string | null;
  dateOpened?: string | null;
  dateUpdated?: string | null;
  dateDelinquency?: string | null;
};

function nowDate() {
  return new Date().toLocaleDateString();
}

function bureauLabel(b: Bureau) {
  return bureauDisputeAddress(b).name;
}

function sanitizeFilename(s: string) {
  return (s || 'Partner').replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '');
}

export async function downloadInlineDisputeLetterPdf(args: {
  partnerName: string;
  bureau: Bureau;
  round: string;
  tone: 'formal' | 'neutral' | 'conversational';
  items: DisputeLetterItem[];
  filename?: string;
  /** Optional override for the opening paragraphs (editable draft). */
  introOverride?: string;
  /** Optional override for the closing/footer demand block (power CTA / privacy opts). */
  footerOverride?: string;
  /** Optional override for sender name (letter header). Defaults to partnerName. */
  senderNameOverride?: string;
  /** Phase 5/6: Sender address for header block. */
  senderAddress?: { addressLine1?: string; addressLine2?: string; cityStateZip?: string };
  /** Optional override for bureau recipient name + address lines. */
  bureauAddressOverride?: { name: string; lines: string[] };
  /** Optional override for subject line (defaults to master SUBJECT_LINE). */
  subjectLineOverride?: string;
  /** Persist generated PDF into blob vault for later download. Defaults true. */
  persistToVault?: boolean;
  /** Automatically trigger a browser download. Defaults true (legacy behavior). */
  autoDownload?: boolean;
  /** Include the PDF blob in the return payload (for callers that want to download themselves). Defaults false. */
  includeBlob?: boolean;
}) : Promise<{ pdfBlobRef: string | null; filename: string; blob?: Blob }> {
  const { PDFDocument, StandardFonts, rgb } = await import('pdf-lib');
  const pageWidth = 612; // Letter
  const pageHeight = 792;
  const margin = 54;
  const maxWidth = pageWidth - margin * 2;

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const store = getBlobStore();

  const fontSize = 11;
  const lineHeight = 14;

  const wrap = (text: string, maxW: number, useFont = font, useFontSize = fontSize) => {
    const lines: string[] = [];
    const paragraphs = (text || '').split('\n');
    for (const p of paragraphs) {
      if (!p.trim()) {
        lines.push('');
        continue;
      }
      const words = p.split(/\s+/);
      let line = '';
      for (const w of words) {
        const next = line ? `${line} ${w}` : w;
        const width = useFont.widthOfTextAtSize(next, useFontSize);
        if (width <= maxW) {
          line = next;
        } else {
          if (line) lines.push(line);
          line = w;
        }
      }
      if (line) lines.push(line);
    }
    return lines;
  };

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const newPage = () => {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < margin) newPage();
  };

  const drawWrapped = (text: string, opts?: { bold?: boolean; size?: number; color?: any }) => {
    const useBold = Boolean(opts?.bold);
    const useFont = useBold ? fontBold : font;
    const useSize = opts?.size ?? fontSize;
    const useColor = opts?.color ?? rgb(0.12, 0.12, 0.12);
    const lines = wrap(text, maxWidth, useFont, useSize);
    for (const line of lines) {
      ensureSpace(lineHeight);
      page.drawText(line, { x: margin, y, size: useSize, font: useFont, color: useColor });
      y -= lineHeight;
    }
  };

  // Phase 5/6: Header (right-aligned): Name, Address, Date
  const senderName = (args.senderNameOverride || '').trim() || args.partnerName;
  const headerLines = [senderName];
  if (args.senderAddress?.addressLine1) headerLines.push(args.senderAddress.addressLine1);
  if (args.senderAddress?.addressLine2) headerLines.push(args.senderAddress.addressLine2);
  if (args.senderAddress?.cityStateZip) headerLines.push(args.senderAddress.cityStateZip);
  headerLines.push(nowDate());
  for (const line of headerLines) {
    if (!line) continue;
    ensureSpace(lineHeight);
    const w = font.widthOfTextAtSize(line, fontSize);
    page.drawText(line, { x: margin + maxWidth - w, y, size: fontSize, font, color: rgb(0.15, 0.15, 0.15) });
    y -= lineHeight;
  }
  y -= 14;
  // Bureau address (left-aligned)
  const bureauAddr = args.bureauAddressOverride ?? bureauDisputeAddress(args.bureau);
  page.drawText(bureauAddr.name, { x: margin, y, size: 11, font: fontBold, color: rgb(0.15, 0.15, 0.15) });
  y -= lineHeight;
  for (const line of bureauAddr.lines) {
    ensureSpace(lineHeight);
    page.drawText(line, { x: margin, y, size: fontSize, font, color: rgb(0.2, 0.2, 0.2) });
    y -= lineHeight;
  }
  y -= 14;
  // Subject (master template)
  const subject = (args.subjectLineOverride || '').trim() || SUBJECT_LINE;
  const subjectLines = wrap(subject, maxWidth, fontBold, 12);
  for (const line of subjectLines) {
    ensureSpace(16);
    page.drawText(line, { x: margin, y, size: 12, font: fontBold, color: rgb(0.12, 0.12, 0.12) });
    y -= 16;
  }
  y -= 10;

  // Intro by tone (single bureau letter, multiple items) — optionally overridden by the UI draft editor.
  const introDefault =
    args.tone === 'formal'
      ? `TO WHOM IT MAY CONCERN,\n\nI am writing to dispute inaccurate and/or unverified information appearing on my credit file. This letter applies only to the items listed below.\n\nPlease investigate and provide written results. If any item cannot be verified as reported with competent evidence, it must be deleted or corrected.\n`
      : args.tone === 'conversational'
        ? `Hello,\n\nI’m reaching out because several items still look inaccurate or incomplete on my credit file. This letter applies only to the items listed below.\n\nPlease reinvestigate and send me the results in writing. If an item can’t be verified, please delete or correct it.\n`
        : `Hello,\n\nI’m following up to dispute inaccurate and/or unverified information on my credit file. This letter applies only to the items listed below.\n\nPlease reinvestigate and provide written results. If verification cannot be produced, the item must be deleted or corrected.\n`;
  const intro = (args.introOverride || '').trim() ? args.introOverride!.trim() + '\n' : introDefault;

  drawWrapped(intro, { color: rgb(0.12, 0.12, 0.12) });
  y -= 12;

  // Strong CTA footer block (requested): response window + method of verification + privacy opts.
  const footerDefault =
    args.tone === 'formal'
      ? `Please complete your reinvestigation and provide the results in writing within the time period required by applicable law (typically 30 days). If you verify any item, please provide the method of verification and a complete description of the procedures used to determine accuracy.\n\nI also request that you do not sell, share, or disclose my personal information beyond what is required to conduct this reinvestigation, and that you honor any applicable opt-out preferences. Please communicate results in writing.`
      : args.tone === 'conversational'
        ? `Please send me the results in writing within the time period required by law (typically 30 days). If you say an item is verified, please tell me how you verified it.\n\nAlso, please don’t share or sell my personal information beyond what’s required to complete this investigation.`
        : `Please complete your reinvestigation and provide the results in writing within the time period required by applicable law (typically 30 days). If you verify any item, please provide the method of verification.\n\nPlease do not sell or share my personal information beyond what is required to conduct this reinvestigation.`;
  const footer = (args.footerOverride || '').trim() ? args.footerOverride!.trim() + '\n' : footerDefault;

  // Items with inline evidence + reasons
  for (let i = 0; i < args.items.length; i++) {
    const item = args.items[i]!;
    ensureSpace(50);

    // Item title
    page.drawText(`${i + 1}. ${item.candidate.account} — ${item.candidate.type}`, {
      x: margin,
      y,
      size: 11,
      font: fontBold,
      color: rgb(0.12, 0.12, 0.12),
    });
    y -= 18;

    // Candidate metadata line
    const metaLine = `Bureau: ${bureauShortCode(item.candidate.bureau)}   •   Legal basis: ${item.candidate.code}   •   Request: ${item.candidate.status}`;
    drawWrapped(metaLine, { size: 9, color: rgb(0.45, 0.45, 0.45) });
    y -= 8;

    // Evidence screenshot inline (optional in Full Mode — do not print warnings when missing/unreadable).
    const pad = 8;

    if (item.evidence?.blobRef) {
      const blobRaw = await store.get(item.evidence.blobRef);
      // Some storage providers return a Blob with an empty `type`; prefer metadata but fall back to the stored blob's type.
      const metaMime = String(item.evidence.mimeType || '').trim();
      const blobMime = String((blobRaw as any)?.type || '').trim();
      const mime = metaMime || blobMime;
      const blob = blobRaw && (!blobMime && mime ? new Blob([blobRaw], { type: mime }) : blobRaw);
      const t = String((blob as any)?.type || mime || '').toLowerCase();
      const looksLikeImage =
        t.startsWith('image/') || (!t && /\.(png|jpe?g|webp|gif)$/i.test(String(item.evidence.filename || '')));

      if (blob && looksLikeImage) {
        try {
          // pdf-lib supports PNG/JPG. For other formats (webp/gif/etc), we fall back to a placeholder.
          const bytes = new Uint8Array(await blob.arrayBuffer());
          const isPng = t.includes('png') || /\.png$/i.test(String(item.evidence.filename || ''));
          const isJpg = t.includes('jpeg') || t.includes('jpg') || /\.(jpe?g)$/i.test(String(item.evidence.filename || ''));
          if (!isPng && !isJpg) throw new Error('unsupported image format');

          const img = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);

          const availableW = maxWidth;
          // Make exhibits readable: use most of the writing column height when possible.
          const maxImgH = 520;
          const scale = Math.min(availableW / img.width, maxImgH / img.height);
          const w = img.width * scale;
          const h = img.height * scale;

          ensureSpace(h + pad + 24);
          // Clean exhibit: no decorative frame; center to the writing column.
          page.drawImage(img, {
            x: margin + (availableW - w) / 2,
            y: y - h,
            width: w,
            height: h,
          });
          y -= h + pad + 10;
        } catch {
          // Silent: do not print warnings into the generated letter.
        }
      } else {
        // Silent: non-image or missing mime. (We still include evidence metadata in the vault if linked.)
      }
    }

    // Reasons (optional) — do not print warnings when empty.
    const reasons = (item.reasons ?? []).map((r) => r.trim()).filter(Boolean);
    if (reasons.length) {
      page.drawText('Dispute reasons:', {
        x: margin,
        y,
        size: 10,
        font: fontBold,
        color: rgb(0.12, 0.12, 0.12),
      });
      y -= 14;
      for (const r of reasons) {
        const bulletLines = wrap(`• ${r}`, maxWidth, font, 10);
        for (const line of bulletLines) {
          ensureSpace(12);
          page.drawText(line, { x: margin, y, size: 10, font, color: rgb(0.12, 0.12, 0.12) });
          y -= 12;
        }
      }
      y -= 6;
    }

    // Optional narrative (AI drafted or user-entered) under reasons.
    const narrative = (item.narrative ?? '').trim();
    if (narrative) {
      ensureSpace(20);
      page.drawText('Narrative:', {
        x: margin,
        y,
        size: 10,
        font: fontBold,
        color: rgb(0.12, 0.12, 0.12),
      });
      y -= 14;
      drawWrapped(narrative, { size: 10, color: rgb(0.12, 0.12, 0.12) });
      y -= 6;
    }

    // Divider
    ensureSpace(18);
    page.drawLine({
      start: { x: margin, y },
      end: { x: margin + maxWidth, y },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });
    y -= 16;
  }

  // Footer + Closing
  y -= 10;
  drawWrapped(footer, { color: rgb(0.12, 0.12, 0.12) });
  y -= 14;
  drawWrapped(`Sincerely,\n${senderName}\n`, { bold: false });
  drawWrapped('Generated for internal dispute workflow. Not legal advice. Verify facts before mailing or submission.', {
    size: 9,
    color: rgb(0.45, 0.45, 0.45),
  });

  const pdfBytes = await pdfDoc.save();
  const copy = Uint8Array.from(pdfBytes);
  const blob = new Blob([copy], { type: 'application/pdf' });
  const filename =
    args.filename ??
    `FinelyCred_${sanitizeFilename(senderName)}_${bureauShortCode(args.bureau)}_${sanitizeFilename(args.round)}.pdf`;

  let pdfBlobRef: string | null = null;
  const persist = args.persistToVault ?? true;
  if (persist) {
    try {
      const put = await store.put(blob, {
        kind: 'letter_pdf',
        bureau: args.bureau,
        round: args.round,
        tone: args.tone,
        partnerName: args.partnerName,
        filename,
      });
      pdfBlobRef = put.ref;
    } catch {
      // Best-effort: still download even if persistence fails.
      pdfBlobRef = null;
    }
  }
  const autoDownload = args.autoDownload ?? true;
  if (autoDownload) {
    downloadBlob({ blob, filename });
  }

  const includeBlob = args.includeBlob ?? false;
  return { pdfBlobRef, filename, blob: includeBlob ? blob : undefined };
}

