import type { LetterRecord, DisputeLetterMeta } from '../domain/letters';
import type { EvidenceItem } from '../domain/evidence';
import type { Bureau, DisputeCandidate } from '../domain/creditReports';
import { downloadInlineDisputeLetterPdf, type DisputeLetterItem } from '../letters/generateDisputePdfInline';
import { generateTextPdfToVault } from '../letters/generateTextPdf';
import { bureauDisputeAddress } from '../letters/disputeLetterTemplate';
import { htmlToPlainText } from '../utils/richText';
import { stripLetterVendorBranding, stripLetterVendorBrandingHtml } from './letterBodySafety';
import { classifyCandidateNegativeType } from '../creditReports/negativePlaybooks';
import { resolveBureauDisputeLaws } from '../domain/bureauDisputeLawResolver';

function isDisputeMeta(meta: LetterRecord['meta']): meta is DisputeLetterMeta {
  return Boolean(meta && typeof meta === 'object' && 'bureau' in meta && 'candidateIds' in meta);
}

function parseDisputeItemsFromSnapshot(
  body: string,
  meta: DisputeLetterMeta,
  evidence: EvidenceItem[],
): DisputeLetterItem[] {
  const ids = meta.candidateIds ?? [];
  return ids.map((id, idx) => {
    const blockRe = new RegExp(
      `${idx + 1}\\.\\s([^<—]+?)\\s*[—–-]\\s*([^<]+?)<\\/div>[\\s\\S]*?bureau:\\s*([A-Z]{3})\\s*•\\s*code:\\s*([^•<]+?)\\s*•\\s*request:\\s*([^<]+)`,
      'i',
    );
    const m = body.match(blockRe);
    const account = m?.[1]?.trim() || `Disputed item ${idx + 1}`;
    const type = m?.[2]?.trim() || 'Account';
    const bureau = (m?.[3]?.trim() || meta.bureau) as Bureau;
    const code = m?.[4]?.trim() || 'FCRA';
    const status = m?.[5]?.trim() || 'Delete';
    const evId = meta.evidenceByCandidateId?.[id];
    const ev = evId ? evidence.find((e) => e.id === evId) : null;
    const candidate = {
      id,
      account,
      type,
      bureau,
      code,
      status,
    } as DisputeCandidate;
    const negativeType = classifyCandidateNegativeType(candidate as any);
    return {
      candidate,
      evidence: ev?.blobRef
        ? { filename: ev.filename, blobRef: ev.blobRef, mimeType: ev.mimeType || 'application/octet-stream' }
        : null,
      reasons: meta.reasonsByCandidateId?.[id] ?? [],
      laws: resolveBureauDisputeLaws(negativeType).map((l) => ({ cite: l.cite, shortLabel: l.shortLabel })),
      narrative: meta.aiNarrativeByCandidateKey?.[id] ?? null,
    };
  });
}

/** Regenerate vault PDF after letter body or dispute intro/footer edits. */
export async function regenerateSavedLetterPdf(args: {
  letter: LetterRecord;
  evidence?: EvidenceItem[];
  partnerName?: string;
  introOverride?: string;
  footerOverride?: string;
  bodyHtml?: string;
}): Promise<{ pdfBlobRef: string | null; filename: string } | null> {
  const { letter } = args;
  if (!letter.pdfBlobRef) return null;

  const filename =
    letter.pdfFilename ||
    `${letter.title.replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '') || 'Letter'}.pdf`;

  if (letter.type === 'dispute' && isDisputeMeta(letter.meta)) {
    const meta = letter.meta;
    const items = parseDisputeItemsFromSnapshot(letter.body || '', meta, args.evidence ?? []);
    if (!items.length) return null;

    const introText = stripLetterVendorBranding(
      htmlToPlainText(args.introOverride ?? meta.introOverride ?? ''),
    );
    const footerText = stripLetterVendorBranding(
      htmlToPlainText(args.footerOverride ?? meta.footerOverride ?? ''),
    );

    const res = await downloadInlineDisputeLetterPdf({
      partnerName: args.partnerName || 'Partner',
      bureau: meta.bureau,
      round: meta.round || 'Round 1',
      tone: meta.tone || 'formal',
      items,
      introOverride: introText || undefined,
      footerOverride: footerText || undefined,
      bureauAddressOverride: bureauDisputeAddress(meta.bureau),
      filename,
      persistToVault: true,
      autoDownload: false,
    });
    return { pdfBlobRef: res.pdfBlobRef, filename: res.filename };
  }

  const body = stripLetterVendorBrandingHtml(args.bodyHtml ?? letter.body ?? '');
  const plain = stripLetterVendorBranding(htmlToPlainText(body));
  if (!plain.trim()) return null;

  const res = await generateTextPdfToVault({
    text: plain,
    filename,
    meta: { letterId: letter.id, partnerId: letter.partnerId, type: letter.type },
  });
  return { pdfBlobRef: res.pdfBlobRef, filename: res.filename };
}
