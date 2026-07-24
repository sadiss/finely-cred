/**
 * Advanced litigation document scraper — dockets, summons, complaints, affidavits, collector letters.
 * Pattern mirrors credit-report OCR: native PDF text first, then optional OCR pass.
 * Educational merge-field extraction — never hardcode partner PII into templates.
 */

import { extractPdfTextWithMeta } from '../../creditReports/parsePdfText';
import { lookupKnownCreditor } from '../knownCreditorDirectory';

export type LitigationDocKind =
  | 'docket'
  | 'summons'
  | 'complaint'
  | 'affidavit'
  | 'collector_letter'
  | 'court_filing'
  | 'unknown';

export type ScrapedFieldConfidence = 'high' | 'medium' | 'low';

export type ScrapedLitigationField = {
  key: string;
  label: string;
  value: string;
  confidence: ScrapedFieldConfidence;
  meaning: string;
  sourceHint?: string;
};

export type LitigationRouteChip = {
  id: string;
  label: string;
  description: string;
  path: string;
  priority: 'normal' | 'high' | 'urgent';
};

export type LitigationScrapeResult = {
  docKind: LitigationDocKind;
  filename: string;
  numPages: number;
  textChars: number;
  usedOcr: boolean;
  fields: ScrapedLitigationField[];
  entities: Record<string, string>;
  routes: LitigationRouteChip[];
  nextActions: string[];
  summary: string;
  compliance: string;
};

const COMPLIANCE =
  'Educational document scrape · not legal advice · verify every field against the paper file · results vary by court and facts.';

function firstMatch(text: string, patterns: RegExp[]): string | undefined {
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) return String(m[1]).replace(/\s+/g, ' ').trim();
  }
  return undefined;
}

function classifyDocKind(text: string, filename: string): LitigationDocKind {
  const s = `${filename}\n${text.slice(0, 4000)}`.toLowerCase();
  if (/register of actions|case history|docket|court events|hearing date/.test(s) && /case\s*(no|#|number)/.test(s)) {
    return 'docket';
  }
  if (/summons/.test(s) && !/answer to summons/.test(s)) return 'summons';
  if (/complaint|civil action|plaintiff.*vs|plaintiff.*v\./.test(s)) return 'complaint';
  if (/affidavit|sworn|under penalty of perjury|28 u\.?s\.?c/.test(s)) return 'affidavit';
  if (/debt collector|this is an attempt to collect|validation|mini-miranda|1692/.test(s)) return 'collector_letter';
  if (/motion|discovery|order|judgment|appearance|proof of service/.test(s)) return 'court_filing';
  return 'unknown';
}

function field(
  key: string,
  label: string,
  value: string | undefined,
  confidence: ScrapedFieldConfidence,
  meaning: string,
  sourceHint?: string,
): ScrapedLitigationField | null {
  const v = String(value || '').trim();
  if (!v) return null;
  return { key, label, value: v, confidence, meaning, sourceHint };
}

function extractEntitiesFromText(text: string): {
  entities: Record<string, string>;
  fields: ScrapedLitigationField[];
} {
  const t = text.replace(/\r/g, '\n');
  const entities: Record<string, string> = {};
  const fields: ScrapedLitigationField[] = [];

  const caseNumber = firstMatch(t, [
    /(?:case\s*(?:no\.?|number|#)|docket\s*(?:no\.?|number|#)|file\s*(?:no\.?|number))\s*[:#]?\s*([A-Z0-9][A-Z0-9\-\/ ]{3,40})/i,
    /\b(\d{2,4}[- ]?\d{2,8}[- ]?(?:GC|CK|CZ|CV|SC|CI)[- ]?\d{0,6})\b/i,
    /\b(\d{2}-\d{4,8}-[A-Z]{1,4})\b/,
  ]);
  if (caseNumber) {
    entities.caseNumber = caseNumber;
    fields.push(
      field(
        'caseNumber',
        'Case / docket number',
        caseNumber,
        'high',
        'Identifies the court file. Put this on every filing caption and letter reference line.',
        'Header / caption',
      )!,
    );
  }

  const courtName = firstMatch(t, [
    /((?:[\w.]+\s+){0,4}(?:DISTRICT|CIRCUIT|SUPERIOR|MUNICIPAL|JUSTICE|SMALL CLAIMS)\s+COURT[^\n]{0,60})/i,
    /(STATE OF [A-Z ]+\s+IN\s+[^\n]{0,40}COURT)/i,
  ]);
  if (courtName) {
    entities.courtName = courtName;
    fields.push(
      field(
        'courtName',
        'Court',
        courtName,
        'high',
        'Where the case is pending. Controls local answer deadlines and filing rules.',
        'Caption',
      )!,
    );
  }

  const plaintiff = firstMatch(t, [
    /(?:^|\n)\s*([A-Z][A-Z0-9 &.,'\-]{2,80})\s*,?\s*\n\s*Plaintiff/im,
    /Plaintiff[:\s]+([A-Z][A-Za-z0-9 &.,'\-]{2,80})/,
    /([A-Z][A-Z0-9 &.,'\-]{2,60})\s+v(?:s)?\.?\s+/i,
  ]);
  if (plaintiff) {
    entities.creditorName = plaintiff;
    entities.plaintiffName = plaintiff;
    fields.push(
      field(
        'plaintiffName',
        'Plaintiff',
        plaintiff,
        'high',
        'Named party suing you. Defense focuses on whether this exact entity owns or can enforce the receivable.',
        'Caption',
      )!,
    );
  }

  const defendant = firstMatch(t, [
    /(?:^|\n)\s*([A-Z][A-Za-z0-9 &.,'\-]{2,80})\s*,?\s*\n\s*Defendant/im,
    /Defendant[:\s]+([A-Z][A-Za-z0-9 &.,'\-]{2,80})/,
  ]);
  if (defendant) {
    entities.defendantName = defendant;
    fields.push(
      field(
        'defendantName',
        'Defendant (as captioned)',
        defendant,
        'medium',
        'How the court file names you. Compare spelling to your ID — do not hardcode into shared templates.',
        'Caption',
      )!,
    );
  }

  const counsel = firstMatch(t, [
    /Attorney(?:s)? for Plaintiff[:\s]+([^\n]{3,80})/i,
    /([A-Z][A-Za-z &.,'\-]{2,60}(?:P\.?C\.?|LLC|LLP|Law(?:\s+Group|\s+Firm| Offices)?))/ ,
    /Bar\s*(?:No\.?|Number|#)?\s*[:#]?\s*(P?\d{4,7})/i,
  ]);
  const bar = firstMatch(t, [/\b(P[- ]?\d{4,7})\b/i, /Bar\s*(?:No\.?|Number|#)?\s*[:#]?\s*([A-Z]?\d{4,8})/i]);
  if (counsel && !/plaintiff|defendant|court/i.test(counsel)) {
    entities.collectorName = counsel;
    entities.counselName = counsel;
    fields.push(
      field(
        'counselName',
        'Plaintiff counsel / firm',
        counsel,
        'medium',
        'Who receives service copies and often the validation / discovery recipient for post-suit letters.',
        'Counsel block',
      )!,
    );
  }
  if (bar) {
    entities.plaintiffAttorneyBar = bar;
    fields.push(
      field('plaintiffAttorneyBar', 'Attorney bar number', bar, 'high', 'Use on affidavits and discovery captions when known.', 'Counsel block')!,
    );
  }

  const amount = firstMatch(t, [
    /(?:amount\s*(?:claimed|due|owing)|principal|balance\s*due|judgment\s*amount)\s*[:$]?\s*\$?\s*([\d,]+\.\d{2})/i,
    /\$\s*([\d,]+\.\d{2})/,
  ]);
  if (amount) {
    entities.amountClaimed = `$${amount}`;
    fields.push(
      field(
        'amountClaimed',
        'Amount claimed',
        `$${amount}`,
        'medium',
        'Lawsuit or docket balance. Demand a full ledger — do not admit this figure.',
        'Claim / docket',
      )!,
    );
  }

  const hearing = firstMatch(t, [
    /(?:hearing|trial|pretrial|pre-trial|return)\s*(?:date)?\s*[:\s]+([A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i,
    /(?:set for|scheduled for)\s+([A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  ]);
  if (hearing) {
    entities.hearingDate = hearing;
    fields.push(
      field(
        'hearingDate',
        'Hearing / trial date',
        hearing,
        'high',
        'Countdown driver for Answer → Affidavit → Discovery → Hearing prep.',
        'Docket / notice',
      )!,
    );
  }

  const served = firstMatch(t, [
    /(?:date\s*served|served\s*on|service\s*date|date of service)\s*[:\s]+([A-Za-z]{3,9}\.?\s+\d{1,2},?\s+\d{4}|\d{1,2}\/\d{1,2}\/\d{2,4})/i,
  ]);
  if (served) {
    entities.dateServed = served;
    fields.push(
      field(
        'dateServed',
        'Date served',
        served,
        'high',
        'Starts many answer deadlines. Confirm against the proof of service — do not guess.',
        'Proof of service',
      )!,
    );
  }

  const state = firstMatch(t, [/STATE OF\s+([A-Z]{2}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/, /\b([A-Z]{2})\s+\d{5}(?:-\d{4})?\b/]);
  if (state && state.length <= 20) {
    entities.state = state.length === 2 ? state.toUpperCase() : state;
    fields.push(field('state', 'Jurisdiction state', entities.state, 'medium', 'Controls procedure, SOL framing, and licensing questions.', 'Caption')!);
  }

  // Mailing address block near counsel / plaintiff
  const addrBlock = firstMatch(t, [
    /(\d{1,5}\s+[A-Za-z0-9 .,'#\-]+(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Suite|Ste|P\.?O\.?\s*Box)[^\n]{0,40}\n[^\n]{0,60}\b[A-Z]{2}\s+\d{5}(?:-\d{4})?)/i,
    /(P\.?O\.?\s*Box\s+\d+[^\n]*\n[^\n]*\b[A-Z]{2}\s+\d{5}(?:-\d{4})?)/i,
  ]);
  if (addrBlock) {
    entities.address = addrBlock.replace(/\n+/g, '\n').trim();
    fields.push(
      field(
        'address',
        'Counsel / collector mailing address',
        entities.address,
        'medium',
        'Auto-fills the debt letter recipient block for validation and court service copies.',
        'Address block',
      )!,
    );
  }

  const phone = firstMatch(t, [/(?:phone|tel|telephone)\s*[:.]?\s*((?:\+?1[-. ]?)?\(?\d{3}\)?[-. ]?\d{3}[-. ]?\d{4})/i]);
  if (phone) {
    entities.phone = phone;
    fields.push(field('phone', 'Phone', phone, 'low', 'Optional contact — letters still use the mailing address.', 'Header')!);
  }

  // Directory fallback for plaintiff/counsel address
  if (!entities.address && (entities.creditorName || entities.collectorName)) {
    const hit = lookupKnownCreditor(entities.collectorName || entities.creditorName || '');
    if (hit) {
      entities.address = hit.address;
      if (hit.phone && !entities.phone) entities.phone = hit.phone;
      fields.push(
        field(
          'address',
          'Mailing address (directory match)',
          hit.address,
          'low',
          `Filled from known-${hit.kind} directory for ${hit.displayName}. Verify on the summons before mailing.`,
          'Directory',
        )!,
      );
    }
  }

  return { entities, fields };
}

function buildRoutes(docKind: LitigationDocKind, entities: Record<string, string>): LitigationRouteChip[] {
  const q = new URLSearchParams();
  if (entities.caseNumber) q.set('case', entities.caseNumber);
  if (entities.hearingDate) q.set('hearing', entities.hearingDate);
  const qs = q.toString() ? `&${q.toString()}` : '';
  const routes: LitigationRouteChip[] = [
    {
      id: 'litigation',
      label: 'Litigation Defense Command',
      description: 'Hearing countdown, stage path, affidavit & answer builds',
      path: `/portal/debt?tab=litigation${qs}`,
      priority: entities.hearingDate || docKind === 'summons' || docKind === 'docket' ? 'urgent' : 'high',
    },
  ];
  if (docKind === 'summons' || docKind === 'complaint' || docKind === 'docket') {
    routes.push({
      id: 'answer',
      label: 'Build written answer',
      description: 'Court letter catalog — contested answer + certificate',
      path: `/portal/debt?tab=litigation${qs}&stage=answer`,
      priority: 'urgent',
    });
  }
  if (docKind === 'affidavit' || docKind === 'complaint') {
    routes.push({
      id: 'affidavit',
      label: 'Affidavit of dispute',
      description: 'Sworn dispute + burden shift',
      path: `/portal/debt?tab=litigation${qs}&stage=affidavit`,
      priority: 'high',
    });
  }
  if (entities.address || docKind === 'collector_letter') {
    routes.push({
      id: 'validation',
      label: 'Validation recipient',
      description: 'Auto-filled collector / counsel mailing block',
      path: `/portal/debt?tab=validation${qs}`,
      priority: 'normal',
    });
  }
  routes.push({
    id: 'discovery',
    label: 'Discovery set',
    description: 'Force account-level assignment & ledger',
    path: `/portal/debt?tab=litigation${qs}&stage=discovery`,
    priority: 'normal',
  });
  return routes;
}

function buildNextActions(docKind: LitigationDocKind, fields: ScrapedLitigationField[]): string[] {
  const keys = new Set(fields.map((f) => f.key));
  const actions: string[] = [];
  if (!keys.has('caseNumber')) actions.push('Confirm the case / docket number on the paper caption and type it into the case card.');
  if (!keys.has('hearingDate')) actions.push('Find the hearing or return date on the docket or notice — set it so the countdown is accurate.');
  if (docKind === 'summons' || docKind === 'complaint') {
    actions.push('Build a Written answer today — admit only what is true; preserve standing and amount defenses.');
    actions.push('Upload the summons into the defense file (proof strip) so affidavit drafts can cite extracted facts.');
  }
  if (docKind === 'affidavit') {
    actions.push('Compare plaintiff affidavit foundation to your Affidavit of dispute — personal knowledge, sale file, amount math.');
  }
  if (docKind === 'docket') {
    actions.push('Use docket events to prioritize Answer vs Discovery vs Hearing prep — work the nearest deadline first.');
  }
  if (keys.has('address')) {
    actions.push('Open Validation or Litigation recipient block — address should be auto-filled; tap “Use from report/scrape” if needed.');
  }
  actions.push('Educational only — re-verify court rules and facts before filing. Results vary.');
  return actions;
}

function summarize(docKind: LitigationDocKind, fields: ScrapedLitigationField[], filename: string): string {
  const bits = fields.slice(0, 6).map((f) => `${f.label}: ${f.value}`);
  return `Scraped ${docKind.replace('_', ' ')} from ${filename}. ${bits.length ? bits.join(' · ') : 'Few structured fields — review the chat explanations and enter missing caption data manually.'}`;
}

export async function scrapeLitigationDocument(
  file: File,
  opts?: { maxOcrPages?: number; onProgress?: (msg: string) => void },
): Promise<LitigationScrapeResult> {
  opts?.onProgress?.('Extracting native PDF text…');
  let usedOcr = false;
  let extraction = await extractPdfTextWithMeta(file);
  let text = extraction.text || '';

  // Sparse text → OCR fallback (same pattern as credit-report pipeline)
  if (text.replace(/\s+/g, '').length < 200 && extraction.numPages > 0) {
    opts?.onProgress?.('Sparse text — running OCR…');
    try {
      const { ocrPdfToText } = await import('../../creditReports/pdfOcr');
      const ocrText = await ocrPdfToText(file, {
        maxPages: opts?.maxOcrPages ?? Math.min(extraction.numPages, 12),
        onProgress: (p) => opts?.onProgress?.(`OCR page ${p.page}/${p.numPages}`),
      });
      if (ocrText && ocrText.length > text.length) {
        text = ocrText;
        usedOcr = true;
      }
    } catch {
      // OCR optional — keep native text
    }
  }

  const docKind = classifyDocKind(text, file.name);
  const { entities, fields } = extractEntitiesFromText(text);
  const routes = buildRoutes(docKind, entities);
  const nextActions = buildNextActions(docKind, fields);

  return {
    docKind,
    filename: file.name,
    numPages: extraction.numPages,
    textChars: text.length,
    usedOcr,
    fields,
    entities,
    routes,
    nextActions,
    summary: summarize(docKind, fields, file.name),
    compliance: COMPLIANCE,
  };
}

/** Apply scraped entities onto a debt case patch (merge-fields only). */
export function debtPatchFromLitigationScrape(entities: Record<string, string>): Record<string, string | undefined> {
  return {
    courtCaseNumber: entities.caseNumber,
    name: entities.plaintiffName || entities.creditorName,
    recipientName: entities.counselName || entities.collectorName || entities.plaintiffName || entities.creditorName,
    recipientAddress: entities.address,
    recipientPhone: entities.phone,
    collectorName: entities.counselName || entities.collectorName || entities.plaintiffName,
    plaintiffLawFirm: entities.counselName || entities.collectorName,
    plaintiffLawFirmAddress: entities.address,
    plaintiffAttorneyBarNumber: entities.plaintiffAttorneyBar,
    originalCreditor: entities.creditorName || entities.plaintiffName,
    stateJurisdiction: entities.state,
    dateServed: entities.dateServed,
    hearingDate: entities.hearingDate,
    amountClaimed: entities.amountClaimed,
  };
}
