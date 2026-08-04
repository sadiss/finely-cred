import type { EvidenceItem } from '../domain/evidence';
import type { DocumentType } from '../domain/documents';
import { upsertEvidence } from '../data/evidenceRepo';
import { addAuditEvent } from '../data/auditRepo';
import { isFeatureEnabled } from '../data/settingsRepo';
import { processUploadedDocument } from '../docIntel/processUploadedDocument';
import { routeProcessedDocument, type DocumentRouteResult } from '../docIntel/routeProcessedDocument';
import {
  profileForDocType,
  sectionKeyForFolder,
  guessDocTypeFromCaptionFilename,
  type UploadIntentId,
  docTypeFromIntent,
} from './evidenceDocumentTaxonomy';
import { enrichEvidenceMetadata } from './evidenceFieldExtract';
import { attachBureauResponseToDisputeCase } from '../data/casesRepo';

function applyDocIntelEntities(item: EvidenceItem, entities: Record<string, string>): EvidenceItem {
  const entries = Object.entries(entities).filter(([, v]) => v && String(v).trim());
  if (!entries.length) return item;

  const entityLine = entries
    .slice(0, 5)
    .map(([k, v]) => `${k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}: ${v}`)
    .join(' · ');

  const captionBase = item.caption?.trim();
  const caption =
    captionBase && !captionBase.includes(entries[0]![1])
      ? `${captionBase} · ${entityLine}`
      : captionBase || entityLine;

  const entityTags = entries.slice(0, 8).map(([k, v]) => `entity:${k}:${String(v).slice(0, 48)}`);

  return {
    ...item,
    caption,
    creditorName: item.creditorName ?? entities.creditorName ?? entities.collectorName,
    tags: Array.from(new Set([...(item.tags || []), ...entityTags])),
  };
}

export type IngestUploadResult = {
  evidence: EvidenceItem;
  docType: DocumentType;
  profile: ReturnType<typeof profileForDocType>;
  summary: string;
  confidence?: number;
  entities: Record<string, string>;
  routing: DocumentRouteResult;
  /** Human-readable filing message */
  filedMessage: string;
};

export async function ingestUploadedEvidence(args: {
  partnerId: string;
  item: EvidenceItem;
  file?: File;
  email?: string;
  intent?: UploadIntentId;
  disputeCaseId?: string;
  debtCaseId?: string;
  bankruptcyCaseId?: string;
}): Promise<IngestUploadResult> {
  let docType: DocumentType = args.intent ? docTypeFromIntent(args.intent) : 'unknown';
  let summary = '';
  let confidence: number | undefined;
  let entities: Record<string, string> = {};
  let processedDocumentId: string | undefined;
  let routing: DocumentRouteResult;

  const intentCaption = args.item.caption || '';

  if (args.file && isFeatureEnabled('docIntel')) {
    try {
      const res = await processUploadedDocument({
        partnerId: args.partnerId,
        evidenceId: args.item.id,
        blobRef: args.item.blobRef,
        file: args.file,
        caption: intentCaption,
        debtCaseId: args.debtCaseId,
      });
      docType = res.docType;
      summary = res.summary || '';
      entities = res.entities;
      routing = res.routing;
      processedDocumentId = res.docId;
    } catch {
      docType = guessDocTypeFromCaptionFilename(intentCaption, args.file.name);
      if (args.intent) docType = docTypeFromIntent(args.intent);
      routing = routeProcessedDocument({
        partnerId: args.partnerId,
        docType,
        evidenceId: args.item.id,
        caption: intentCaption,
        filename: args.file.name,
        debtCaseId: args.debtCaseId,
      });
      summary = `Classified from filename and caption as ${docType.replace(/_/g, ' ')}.`;
    }
  } else {
    docType = guessDocTypeFromCaptionFilename(intentCaption, args.item.filename);
    if (args.intent) docType = docTypeFromIntent(args.intent);
    routing = routeProcessedDocument({
      partnerId: args.partnerId,
      docType,
      evidenceId: args.item.id,
      caption: intentCaption,
      filename: args.item.filename,
      entities,
      summary,
      debtCaseId: args.debtCaseId,
    });
    summary = summary || `Saved and filed as ${docType.replace(/_/g, ' ')} based on your selection and caption.`;
  }

  const profile = profileForDocType(docType);
  let enriched: EvidenceItem = enrichEvidenceMetadata({
    ...args.item,
    sectionKey: sectionKeyForFolder(profile.folder),
    caption: args.item.caption || profile.label,
    creditorName: entities.creditorName || entities.collectorName || args.item.creditorName,
    tags: Array.from(new Set([...(args.item.tags || []), `folder:${profile.folder}`, `doctype:${docType}`])),
  });
  enriched = applyDocIntelEntities(enriched, entities);
  upsertEvidence(enriched);

  addAuditEvent({
    partnerId: args.partnerId,
    actorType: 'partner',
    actorEmail: args.email,
    action: 'evidence.uploaded',
    entityType: 'evidence',
    entityId: enriched.id,
    meta: {
      filename: enriched.filename,
      docType,
      folder: profile.folder,
      disputeCaseId: args.disputeCaseId,
      debtCaseId: args.debtCaseId,
    },
  });

  const targetDisputeId = args.disputeCaseId || routing.linkedDisputeCaseId;
  if (docType === 'bureau_response' && targetDisputeId) {
    attachBureauResponseToDisputeCase({
      caseId: targetDisputeId,
      evidenceId: enriched.id,
      notes: summary || `Bureau response uploaded: ${enriched.filename}`,
    });
    routing = {
      ...routing,
      linkedDisputeCaseId: targetDisputeId,
      summary: `Bureau response filed to dispute case and evidence vault.`,
    };
  }

  const filedMessage = `Filed to **${profile.label}** (${profile.folder.replace(/_/g, ' ')}) → ${profile.primaryRouteLabel}`;

  return {
    evidence: enriched,
    docType,
    profile,
    summary,
    confidence,
    entities,
    routing,
    filedMessage,
  };
}
