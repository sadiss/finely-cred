import type { FreeGuide } from './freeGuides';
import { DISPUTE_LETTER_GUIDE_ID } from './disputeLetterGuideContent';
import { downloadDisputeLetterGuidePdf } from './buildDisputeLetterGuidePdf';
import { buildFreeGuidePdf } from './buildFreeGuidePdf';
import { downloadBlob } from '../utils/download';
import { emitGuideDownloaded } from '../domain/platformEvents';

function sanitizeFilename(s: string) {
  return (s || 'Guide').replace(/[^\w\-]+/g, '_').replace(/^_+|_+$/g, '');
}

export async function downloadFreeGuidePdf(args: {
  guide: FreeGuide;
  leadId?: string;
  fullName?: string;
  email?: string;
}) {
  if (args.guide.id === DISPUTE_LETTER_GUIDE_ID) {
    await downloadDisputeLetterGuidePdf({
      fullName: args.fullName,
      leadId: args.leadId,
      email: args.email,
    });
    emitGuideDownloaded({
      tenantId: 'finely_cred',
      guideId: args.guide.id,
      guideTitle: args.guide.title,
      leadId: args.leadId,
      email: args.email,
    });
    return;
  }

  const bytes = await buildFreeGuidePdf(args.guide, {
    fullName: args.fullName,
    leadId: args.leadId,
    email: args.email,
  });
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  downloadBlob({
    blob: new Blob([ab], { type: 'application/pdf' }),
    filename: `${sanitizeFilename(args.guide.title)}.pdf`,
  });
  emitGuideDownloaded({
    tenantId: 'finely_cred',
    guideId: args.guide.id,
    guideTitle: args.guide.title,
    leadId: args.leadId,
    email: args.email,
  });
}
