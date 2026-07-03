import type { Bureau, ParsedCreditorContact, ParsedCreditReport, ParsedTradeline } from '../domain/creditReports';
import type { DebtCase } from '../domain/debt';
import type { ProcessedDocument } from '../domain/documents';
import type { EvidenceItem } from '../domain/evidence';
import { upsertDebt } from '../data/debtRepo';

export type ReportedDebtSignal = {
  signalId: string;
  reportId: string;
  tradelineIndex: number;
  creditorName: string;
  originalCreditor?: string;
  accountNumberMasked?: string;
  balanceCents?: number;
  address?: string;
  phone?: string;
  bureau?: Bureau;
  negativeType: 'collection' | 'charge_off';
  accountStatus?: string;
  confidence: 'high' | 'medium';
};

export type DebtPartyInfo = {
  recipientName: string;
  recipientAddress: string;
  recipientPhone?: string;
  collectorName?: string;
  originalCreditor?: string;
  accountNumberMasked?: string;
  balanceCents?: number;
  matchedFrom: 'debt_case' | 'report_contact' | 'tradeline' | 'document' | 'manual';
  signal?: ReportedDebtSignal;
};

export function normCreditorName(s: string) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function namesLikelyMatch(a: string, b: string) {
  const x = normCreditorName(a);
  const y = normCreditorName(b);
  if (!x || !y) return false;
  if (x === y) return true;
  if (x.includes(y) || y.includes(x)) return true;
  const parts = x.split(' ').filter((p) => p.length > 3);
  return parts.some((p) => y.includes(p));
}

function tradelineNegativeType(t: ParsedTradeline): 'collection' | 'charge_off' | null {
  const joined = [
    t.accountStatus,
    t.accountType,
    ...(t.fields || []).map((f) => `${f.label || ''} ${Object.values(f.byBureau || {}).join(' ')}`),
  ]
    .join(' ')
    .toLowerCase();
  if (/(charge\s*off|charged\s*off|\bco\b|written\s*off)/.test(joined)) return 'charge_off';
  if (
    /(collection|collections|collector|debt\s*collector|placed\s*for\s*collection|3rd\s*party|third\s*party|assigned\s*to)/.test(
      joined,
    )
  ) {
    return 'collection';
  }
  if (/(past\s*due|delinquent|seriously\s*delinquent|late\s*payment|default|repossession|foreclosure)/.test(joined)) {
    return 'collection';
  }
  return null;
}

export function extractReportDebtSignals(reports: Array<{ id: string; parsed?: ParsedCreditReport | null }>): ReportedDebtSignal[] {
  const out: ReportedDebtSignal[] = [];
  for (const report of reports) {
    const parsed = report.parsed;
    if (!parsed) continue;
    const contacts = parsed.creditorContacts || [];
    (parsed.tradelines || []).forEach((t, tradelineIndex) => {
      const negativeType = tradelineNegativeType(t);
      if (!negativeType) return;
      const name = String(t.creditorName || '').trim();
      if (!name) return;
      const contact =
        contacts.find((c) => namesLikelyMatch(c.creditorName, name) && c.tradelineIndex === tradelineIndex) ||
        contacts.find((c) => namesLikelyMatch(c.creditorName, name));
      const balance = typeof t.balance === 'number' && t.balance > 0 ? Math.round(t.balance * 100) : undefined;
      out.push({
        signalId: `${report.id}:${tradelineIndex}`,
        reportId: report.id,
        tradelineIndex,
        creditorName: name,
        originalCreditor: t.originalCreditor || contact?.creditorName,
        accountNumberMasked: t.accountNumberMasked || contact?.accountNumberMasked,
        balanceCents: balance,
        address: t.creditorAddress || contact?.address,
        phone: t.creditorPhone || contact?.phone,
        bureau: contact?.bureau,
        negativeType,
        accountStatus: t.accountStatus,
        confidence: contact?.address || t.creditorAddress ? 'high' : 'medium',
      });
    });
  }
  const uniq = new Map<string, ReportedDebtSignal>();
  for (const s of out) {
    const key = s.signalId;
    if (!uniq.has(key)) uniq.set(key, s);
  }
  return Array.from(uniq.values()).sort((a, b) => {
    const score = (x: ReportedDebtSignal) => (x.confidence === 'high' ? 2 : 1) + (x.balanceCents ? 1 : 0);
    return score(b) - score(a);
  });
}

export function matchCreditorContactForName(
  name: string,
  contacts: ParsedCreditorContact[],
): ParsedCreditorContact | null {
  if (!name) return null;
  const exact = contacts.find((c) => normCreditorName(c.creditorName) === normCreditorName(name));
  if (exact) return exact;
  return contacts.find((c) => namesLikelyMatch(c.creditorName, name)) ?? null;
}

export function debtCaseFromSignal(signal: ReportedDebtSignal, partnerId: string): Partial<DebtCase> {
  return {
    partnerId,
    type: 'debt',
    name: signal.creditorName,
    amountCents: signal.balanceCents ?? 0,
    status: 'open',
    originalCreditor: signal.originalCreditor,
    collectorName: signal.creditorName,
    recipientName: signal.creditorName,
    recipientAddress: signal.address,
    recipientPhone: signal.phone,
    accountNumberMasked: signal.accountNumberMasked,
    reportId: signal.reportId,
    tradelineIndex: signal.tradelineIndex,
    source: 'tradeline',
    notes: `Auto-linked from credit report (${signal.negativeType.replace('_', ' ')}).`,
  };
}

export function resolveDebtPartyInfo(args: {
  debt: DebtCase | null;
  signals: ReportedDebtSignal[];
  contacts: ParsedCreditorContact[];
  documents?: ProcessedDocument[];
}): DebtPartyInfo | null {
  const { debt, signals, contacts, documents = [] } = args;
  if (!debt && signals[0]) {
    const s = signals[0];
    return {
      recipientName: s.creditorName,
      recipientAddress: s.address || '',
      recipientPhone: s.phone,
      collectorName: s.creditorName,
      originalCreditor: s.originalCreditor,
      accountNumberMasked: s.accountNumberMasked,
      balanceCents: s.balanceCents,
      matchedFrom: 'tradeline',
      signal: s,
    };
  }
  if (!debt) return null;

  const matchedSignal =
    signals.find((s) => s.reportId === debt.reportId && s.tradelineIndex === debt.tradelineIndex) ||
    signals.find((s) => namesLikelyMatch(s.creditorName, debt.name)) ||
    null;
  const matchedContact = matchCreditorContactForName(debt.recipientName || debt.name, contacts);
  const matchedDoc =
    documents.find((d) => namesLikelyMatch(d.entities.collectorName || d.entities.creditorName || '', debt.name)) ?? null;

  const recipientName =
    debt.recipientName ||
    debt.collectorName ||
    matchedDoc?.entities.collectorName ||
    matchedDoc?.entities.creditorName ||
    matchedSignal?.creditorName ||
    debt.name;
  const recipientAddress =
    debt.recipientAddress ||
    matchedDoc?.entities.address ||
    matchedContact?.address ||
    matchedSignal?.address ||
    '';
  const recipientPhone = debt.recipientPhone || matchedContact?.phone || matchedSignal?.phone;

  return {
    recipientName,
    recipientAddress,
    recipientPhone,
    collectorName: debt.collectorName || matchedDoc?.entities.collectorName || recipientName,
    originalCreditor: debt.originalCreditor || matchedSignal?.originalCreditor,
    accountNumberMasked: debt.accountNumberMasked || matchedSignal?.accountNumberMasked || matchedContact?.accountNumberMasked,
    balanceCents: debt.amountCents || matchedSignal?.balanceCents,
    matchedFrom: debt.recipientAddress
      ? 'debt_case'
      : matchedDoc
        ? 'document'
        : matchedContact
          ? 'report_contact'
          : matchedSignal
            ? 'tradeline'
            : 'manual',
    signal: matchedSignal ?? undefined,
  };
}

export function mergeDebtCreditorFields(debt: DebtCase, patch: Partial<DebtCase>): DebtCase {
  return upsertDebt({
    ...debt,
    ...patch,
    name: patch.name || debt.name,
    recipientName: patch.recipientName ?? debt.recipientName,
    recipientAddress: patch.recipientAddress ?? debt.recipientAddress,
    recipientPhone: patch.recipientPhone ?? debt.recipientPhone,
    collectorName: patch.collectorName ?? debt.collectorName,
    originalCreditor: patch.originalCreditor ?? debt.originalCreditor,
    accountNumberMasked: patch.accountNumberMasked ?? debt.accountNumberMasked,
  });
}

export function captureSenderSnapshot(args: {
  fullName: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
}): DebtCase['senderSnapshot'] {
  return {
    fullName: args.fullName,
    address1: args.address1,
    address2: args.address2,
    city: args.city,
    state: args.state,
    postalCode: args.postalCode,
    phone: args.phone,
    email: args.email,
    capturedAt: new Date().toISOString(),
  };
}

export function listSummonsDocumentsForDebt(args: {
  documents: ProcessedDocument[];
  debt: DebtCase | null;
  evidence?: EvidenceItem[];
}): ProcessedDocument[] {
  const { documents, debt, evidence = [] } = args;
  const linkedEvidence = new Set(debt?.linkedEvidenceIds || []);
  const linkedDocs = new Set(debt?.processedDocumentIds || []);
  return documents
    .filter((d) => {
      if (d.docType !== 'summons' && d.docType !== 'collection_notice') return false;
      if (linkedDocs.has(d.id)) return true;
      if (d.evidenceId && linkedEvidence.has(d.evidenceId)) return true;
      if (debt && namesLikelyMatch(d.entities.creditorName || d.entities.collectorName || '', debt.name)) return true;
      return d.docType === 'summons';
    })
    .slice(0, 12);
}

export type SummonsAffidavitContext = {
  caseNumber?: string;
  plaintiffName?: string;
  collectorName?: string;
  courtName?: string;
  amountClaimed?: string;
  dateServed?: string;
  jurisdictionState?: string;
  documentSummaries: string[];
  entityFacts: string[];
};

export function buildSummonsAffidavitContext(args: {
  debt: DebtCase | null;
  documents: ProcessedDocument[];
  party?: DebtPartyInfo | null;
}): SummonsAffidavitContext {
  const { debt, documents, party } = args;
  const summonsDocs = documents.filter((d) => d.docType === 'summons');
  const entityFacts: string[] = [];
  for (const d of summonsDocs) {
    const e = d.entities || {};
    for (const [k, v] of Object.entries(e)) {
      const val = String(v || '').trim();
      if (val) entityFacts.push(`${k}: ${val}`);
    }
  }
  return {
    caseNumber: debt?.courtCaseNumber || summonsDocs[0]?.entities.caseNumber,
    plaintiffName: party?.recipientName || debt?.name || summonsDocs[0]?.entities.creditorName,
    collectorName: party?.collectorName || summonsDocs[0]?.entities.collectorName,
    courtName: summonsDocs[0]?.entities.courtName,
    amountClaimed: summonsDocs[0]?.entities.amountClaimed || summonsDocs[0]?.entities.amount,
    dateServed: debt?.dateServed,
    jurisdictionState: debt?.stateJurisdiction || summonsDocs[0]?.entities.state,
    documentSummaries: summonsDocs.map((d) => d.summary || `${d.filename} (${d.docType})`).filter(Boolean),
    entityFacts: Array.from(new Set(entityFacts)).slice(0, 24),
  };
}

export function formatSummonsContextForPrompt(ctx: SummonsAffidavitContext): string {
  const lines = [
    ctx.caseNumber ? `CASE_NUMBER: ${ctx.caseNumber}` : '',
    ctx.plaintiffName ? `PLAINTIFF: ${ctx.plaintiffName}` : '',
    ctx.collectorName ? `COLLECTOR: ${ctx.collectorName}` : '',
    ctx.courtName ? `COURT: ${ctx.courtName}` : '',
    ctx.amountClaimed ? `AMOUNT_CLAIMED: ${ctx.amountClaimed}` : '',
    ctx.dateServed ? `DATE_SERVED: ${ctx.dateServed}` : '',
    ctx.jurisdictionState ? `STATE: ${ctx.jurisdictionState}` : '',
    ctx.documentSummaries.length ? `DOCUMENT_SUMMARIES:\n- ${ctx.documentSummaries.join('\n- ')}` : '',
    ctx.entityFacts.length ? `EXTRACTED_FACTS:\n- ${ctx.entityFacts.join('\n- ')}` : '',
  ].filter(Boolean);
  return lines.join('\n');
}
