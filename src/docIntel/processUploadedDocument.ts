import { extractPdfTextWithMeta } from '../creditReports/parsePdfText';
import { callAiGateway } from '../lib/aiClient';
import type { DocumentType } from '../domain/documents';
import { createProcessedDocument } from '../data/documentsRepo';
import { getPartner, upsertPartner } from '../data/partnersRepo';
import { createTask } from '../data/tasksRepo';

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('Failed to read file.'));
    r.readAsDataURL(file);
  });
}

function normalizeEin(raw: string) {
  const digits = (raw || '').replace(/\D/g, '');
  if (digits.length === 9) return digits;
  return '';
}

export async function processUploadedDocument(args: {
  partnerId: string;
  evidenceId?: string;
  blobRef: string;
  file: File;
  caption?: string;
}): Promise<{ docId: string; docType: DocumentType; entities: Record<string, string>; summary?: string }> {
  const fileType = (args.file.type || '').toLowerCase();
  const isPdf = fileType.includes('pdf');
  const isImage = fileType.startsWith('image/');

  let extractedText = '';
  let pdfMeta: any = null;
  let imageDataUrl: string | null = null;

  if (isPdf) {
    const res = await extractPdfTextWithMeta(args.file);
    extractedText = res.text || '';
    pdfMeta = { numPages: res.numPages, nonEmptyPages: res.nonEmptyPages, extractedChars: extractedText.length };
  } else if (isImage) {
    imageDataUrl = await readAsDataUrl(args.file);
  }

  const system = `You are a document intelligence engine for a credit/funding platform.\n\nTask:\n- Classify the document type.\n- Extract key entities into normalized keys.\n\nReturn ONLY valid JSON with this shape:\n{\n  \"docType\": \"articles_of_incorporation\"|\"ein_letter\"|\"id_document\"|\"utility_bill\"|\"bank_statement\"|\"credit_report\"|\"bureau_response\"|\"contract\"|\"other\"|\"unknown\",\n  \"summary\": string,\n  \"confidence\": number,\n  \"entities\": {\n    \"ein\": string,\n    \"businessLegalName\": string,\n    \"state\": string,\n    \"address\": string,\n    \"personName\": string\n  }\n}\n\nRules:\n- If an entity is not present, omit it or use empty string.\n- EIN should be digits only (9 digits) if present.\n- Keep summary short (1-2 sentences).`;

  const userPayload = isPdf
    ? `CAPTION:\n${args.caption || ''}\n\nPDF_META:\n${JSON.stringify(pdfMeta)}\n\nTEXT:\n${extractedText.slice(0, 60_000)}`
    : `CAPTION:\n${args.caption || ''}\n\nIMAGE:\n(see attached image)`;

  const ai = await callAiGateway({
    taskType: 'doc_intel',
    responseFormat: 'json',
    providerHint: isImage ? 'gemini' : 'openai',
    context: { partnerId: args.partnerId, evidenceId: args.evidenceId ?? null, filename: args.file.name, mimeType: args.file.type },
    images: imageDataUrl ? [{ dataUrl: imageDataUrl, mimeType: args.file.type }] : undefined,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userPayload },
    ],
  });

  let parsed: any = {};
  try {
    parsed = JSON.parse(ai.text || '{}');
  } catch {
    parsed = {};
  }
  const docType = (parsed.docType || 'unknown') as DocumentType;
  const entitiesRaw = (parsed.entities && typeof parsed.entities === 'object') ? parsed.entities : {};
  const entities: Record<string, string> = {};
  for (const [k, v] of Object.entries(entitiesRaw)) {
    const val = String(v ?? '').trim();
    if (!val) continue;
    entities[k] = val;
  }
  if (entities.ein) {
    const ein = normalizeEin(entities.ein);
    if (ein) entities.ein = ein;
    else delete entities.ein;
  }

  const created = createProcessedDocument({
    partnerId: args.partnerId,
    evidenceId: args.evidenceId,
    blobRef: args.blobRef,
    filename: args.file.name,
    mimeType: args.file.type || 'application/octet-stream',
    docType,
    entities,
    summary: typeof parsed.summary === 'string' ? parsed.summary : undefined,
    confidence: typeof parsed.confidence === 'number' ? parsed.confidence : undefined,
  });

  // Auto-fill partner profile (best-effort) from extracted entities.
  const partner = await getPartner(args.partnerId);
  if (partner && (entities.ein || entities.businessLegalName || entities.state || entities.address)) {
    const einDigits = entities.ein ? normalizeEin(entities.ein) : '';
    const einLast4 = einDigits ? einDigits.slice(-4) : undefined;
    const nextRoutes = { ...partner.routes };
    // Ensure business route exists when we have business entities.
    const businessRouteKey = 'business_build' as const;
    const cur = nextRoutes[businessRouteKey] ?? {};
    nextRoutes[businessRouteKey] = {
      ...cur,
      business: {
        ...(cur as any).business,
        businessName: entities.businessLegalName || (cur as any)?.business?.businessName,
        entityState: entities.state || (cur as any)?.business?.entityState,
        einLast4: einLast4 || (cur as any)?.business?.einLast4,
      },
    } as any;

    upsertPartner({
      ...partner,
      routes: nextRoutes,
      journeySignals: { ...(partner.journeySignals ?? {}), extracted: { ...(partner.journeySignals?.extracted ?? {}), ...entities } },
    });
  }

  // Suggested task(s)
  if (entities.ein) {
    createTask({
      partnerId: args.partnerId,
      title: 'Confirm EIN + business profile details',
      kind: 'review_results',
      status: 'pending',
      stage: 'intake',
      priority: 'normal',
      evidenceIds: args.evidenceId ? [args.evidenceId] : undefined,
      notes: 'We extracted an EIN from an uploaded document. Verify accuracy and complete any missing business profile fields.',
      assignedTo: 'partner',
    });
  }

  return { docId: created.id, docType: created.docType, entities: created.entities, summary: created.summary };
}

