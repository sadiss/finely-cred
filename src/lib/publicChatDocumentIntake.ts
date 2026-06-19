import { classifyLegacyFileName } from './classifyLegacyFileName';
import type { DocumentType } from '../domain/documents';
import { getBlobStore } from '../storage/getBlobStore';
import { newId } from '../utils/ids';
import { upsertEvidence } from '../data/evidenceRepo';
import { upsertReport } from '../data/reportsRepo';
import { upsertLetter } from '../data/lettersRepo';
import { processUploadedDocument } from '../docIntel/processUploadedDocument';
import { isFeatureEnabled } from '../data/settingsRepo';
import type { Bureau } from '../domain/creditReports';

export type PublicChatDocAnalysis = {
  id: string;
  fileName: string;
  docType: DocumentType | 'dispute_letter' | 'credit_report' | 'government_id' | 'other';
  label: string;
  emoji: string;
  bureau?: Bureau | string;
  creditorOrLender?: string;
  summary: string;
  suggestedAction: string;
  partnerRouted?: boolean;
};

const DOC_EMOJI: Record<string, string> = {
  credit_report: '📊',
  bureau_response: '📬',
  collection_notice: '💳',
  summons: '⚖️',
  id_document: '🪪',
  ssn_card: '🔒',
  utility_bill: '🏠',
  bank_statement: '🏦',
  dispute_letter: '✉️',
  validation_letter: '📨',
  affidavit: '📝',
  government_id: '🪪',
  other: '📎',
};

function inferBureau(fileName: string, text = ''): Bureau | undefined {
  const s = `${fileName} ${text}`.toLowerCase();
  if (s.includes('experian') || /\bexp\b/.test(s)) return 'EXP';
  if (s.includes('equifax') || /\beqf\b/.test(s)) return 'EQF';
  if (s.includes('transunion') || s.includes('trans union') || /\btuc\b/.test(s)) return 'TUC';
  return undefined;
}

function inferCreditor(fileName: string, text = ''): string | undefined {
  const s = `${fileName} ${text}`.toLowerCase();
  const patterns = [
    /(?:from|re:?)\s+([a-z0-9][a-z0-9\s&.'-]{2,40}(?:llc|inc|bank|capital|financial|collections?))/i,
    /(midland|portfolio|lvnv|enhanced|transworld|asset acceptance|cavalry|jefferson)/i,
  ];
  for (const p of patterns) {
    const m = s.match(p);
    if (m?.[1]) return m[1].trim().slice(0, 80);
  }
  return undefined;
}

function labelForClassification(kind: string, fileName: string): { docType: PublicChatDocAnalysis['docType']; label: string } {
  if (kind === 'credit_report') return { docType: 'credit_report', label: 'Credit report' };
  if (kind === 'dispute_letter') return { docType: 'dispute_letter', label: 'Dispute letter' };
  if (kind === 'validation_letter') return { docType: 'collection_notice', label: 'Validation / debt letter' };
  if (kind === 'affidavit') return { docType: 'other', label: 'Affidavit' };
  if (kind === 'government_id') return { docType: 'government_id', label: 'Government ID' };
  if (kind === 'ssn_card') return { docType: 'ssn_card', label: 'SSN card image' };
  if (kind === 'proof_of_address') return { docType: 'utility_bill', label: 'Proof of address' };
  const lower = fileName.toLowerCase();
  if (/collection|collector|validation|609/.test(lower)) return { docType: 'collection_notice', label: 'Collection notice' };
  if (/summons|court|complaint/.test(lower)) return { docType: 'summons', label: 'Court / summons document' };
  return { docType: 'other', label: 'Supporting document' };
}

export function analyzePublicChatDocumentHeuristic(file: File): PublicChatDocAnalysis {
  const classification = classifyLegacyFileName(file.name);
  const { docType, label } = labelForClassification(classification.kind, file.name);
  const bureau = inferBureau(file.name);
  const creditorOrLender = inferCreditor(file.name);
  const emoji = DOC_EMOJI[docType] ?? DOC_EMOJI[classification.tag] ?? '📎';

  let summary = `Looks like a ${label.toLowerCase()}.`;
  if (bureau) summary += ` Bureau: ${bureau === 'EXP' ? 'Experian' : bureau === 'EQF' ? 'Equifax' : 'TransUnion'}.`;
  if (creditorOrLender) summary += ` Possible creditor/collector: ${creditorOrLender}.`;

  let suggestedAction = 'Create a free partner account so we can file this in the right hub automatically.';
  if (docType === 'credit_report') suggestedAction = 'We will place this in your Credit Reports hub and scan for dispute items.';
  if (docType === 'dispute_letter') suggestedAction = 'We will attach this to your Letters vault under the matching bureau round.';
  if (docType === 'collection_notice') suggestedAction = 'We can open a debt validation track and suggest your next response.';

  return {
    id: newId('pchatdoc'),
    fileName: file.name,
    docType,
    label,
    emoji,
    bureau,
    creditorOrLender,
    summary,
    suggestedAction,
  };
}

export async function persistPublicChatDocumentForPartner(args: {
  partnerId: string;
  file: File;
  analysis: PublicChatDocAnalysis;
}): Promise<{ analysis: PublicChatDocAnalysis; evidenceId?: string; reportId?: string; letterId?: string }> {
  const blobStore = getBlobStore();
  const { ref } = await blobStore.put(args.file, { partnerId: args.partnerId, kind: 'evidence' });
  const now = new Date().toISOString();
  let evidenceId: string | undefined;
  let reportId: string | undefined;
  let letterId: string | undefined;

  const classification = classifyLegacyFileName(args.file.name);

  if (classification.kind === 'credit_report' || args.analysis.docType === 'credit_report') {
    reportId = newId('report');
    upsertReport({
      id: reportId!,
      partnerId: args.partnerId,
      provider: 'unknown',
      fileType: args.file.name.toLowerCase().endsWith('.pdf') ? 'pdf' : 'html',
      uploadedBy: 'partner',
      receivedAt: now,
      filename: args.file.name,
      mimeType: args.file.type || 'application/octet-stream',
      sizeBytes: args.file.size,
      rawBlobRef: ref,
    });
  } else if (
    classification.kind === 'dispute_letter' ||
    classification.kind === 'validation_letter' ||
    classification.kind === 'affidavit'
  ) {
    letterId = newId('letter');
    upsertLetter({
      id: letterId!,
      partnerId: args.partnerId,
      type: classification.letterType ?? 'dispute',
      title: classification.letterTitle ?? args.analysis.label,
      createdAt: now,
      body: `[Uploaded via public chat]\n\nFile: ${args.file.name}`,
      status: 'generated',
      meta: {
        bureau: (args.analysis.bureau as Bureau) ?? 'EXP',
        round: '1',
        tone: 'formal',
        candidateIds: [],
        evidenceByCandidateId: {},
        reasonsByCandidateId: {},
      },
    });
    evidenceId = newId('evidence');
    upsertEvidence({
      id: evidenceId!,
      partnerId: args.partnerId,
      type: 'upload',
      source: 'upload',
      caption: classification.caption,
      filename: args.file.name,
      mimeType: args.file.type || 'application/octet-stream',
      sizeBytes: args.file.size,
      blobRef: ref,
      tags: ['public-chat', classification.tag, args.analysis.bureau ? `bureau:${args.analysis.bureau}` : ''].filter(Boolean) as string[],
      createdAt: now,
    });
  } else {
    evidenceId = newId('evidence');
    upsertEvidence({
      id: evidenceId!,
      partnerId: args.partnerId,
      type: 'upload',
      source: 'upload',
      caption: classification.caption,
      filename: args.file.name,
      mimeType: args.file.type || 'application/octet-stream',
      sizeBytes: args.file.size,
      blobRef: ref,
      tags: ['public-chat', classification.tag],
      createdAt: now,
    });
  }

  let analysis = { ...args.analysis, partnerRouted: true };

  if (isFeatureEnabled('docIntel') && evidenceId) {
    try {
      const intel = await processUploadedDocument({
        partnerId: args.partnerId,
        evidenceId,
        blobRef: ref,
        file: args.file,
        caption: args.analysis.label,
      });
      analysis = {
        ...analysis,
        summary: intel.summary || analysis.summary,
        bureau: intel.entities.bureau || analysis.bureau,
        creditorOrLender: intel.entities.creditorName || intel.entities.collectorName || analysis.creditorOrLender,
        suggestedAction: intel.routing.summary || analysis.suggestedAction,
      };
    } catch {
      // heuristic analysis is enough for public chat
    }
  }

  return { analysis, evidenceId, reportId, letterId };
}

export function formatPublicChatDocReply(analysis: PublicChatDocAnalysis, index: number, total: number): string {
  const parts = [
    `${analysis.emoji} ${analysis.label} (${index + 1}/${total})`,
    analysis.summary,
  ];
  if (analysis.bureau) {
    parts.push(`🏛️ Bureau: ${analysis.bureau === 'EXP' ? 'Experian' : analysis.bureau === 'EQF' ? 'Equifax' : analysis.bureau === 'TUC' ? 'TransUnion' : analysis.bureau}`);
  }
  if (analysis.creditorOrLender) parts.push(`🏢 Creditor / collector: ${analysis.creditorOrLender}`);
  parts.push(`👉 ${analysis.suggestedAction}`);
  if (analysis.partnerRouted) parts.push('✅ Saved to your partner profile in the correct hub.');
  return parts.join('\n');
}

export function sprinkleChatEmoji(text: string, goal?: string | null): string {
  if (/[\u{1F300}-\u{1FAFF}]/u.test(text)) return text;
  const lead =
    goal === 'debt' ? '💪' : goal === 'business' ? '🚀' : goal === 'personal' ? '✨' : '👋';
  if (text.length < 80) return `${lead} ${text}`;
  return text.replace(/^(Got it|Perfect|Great|Thanks|Hi|Hello|Bonjour|Hola)/i, (m) => `${lead} ${m}`);
}
