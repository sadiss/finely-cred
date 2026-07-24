import type { Bureau, ParsedCreditorContact, ParsedCreditReport, ParsedTradeline } from '../domain/creditReports';
import type { DebtCase } from '../domain/debt';
import type { ProcessedDocument } from '../domain/documents';
import type { EvidenceItem } from '../domain/evidence';
import { listDebtByPartner, upsertDebt } from '../data/debtRepo';
import { listReportsByPartner } from '../data/reportsRepo';
import {
  classifyCandidateNegativeType,
  type NegativeType,
} from '../creditReports/negativePlaybooks';
import { lookupKnownCreditorFromCandidates } from './knownCreditorDirectory';

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
  /** Full negative classification (foreclosure, repossession, etc.) */
  classifiedNegative: NegativeType;
  accountStatus?: string;
  accountType?: string;
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
  matchedFrom: 'debt_case' | 'report_contact' | 'tradeline' | 'document' | 'directory' | 'manual';
  signal?: ReportedDebtSignal;
  /** True when address came from auto sources (not typed by partner). */
  autoFilled?: boolean;
};

/** Build creditorContacts for PDF/text-parsed reports (HTML path already does this). */
export function buildCreditorContactsFromTradelines(tradelines: ParsedTradeline[]): ParsedCreditorContact[] {
  const out: ParsedCreditorContact[] = [];
  tradelines.forEach((t, idx) => {
    const addr = t.creditorAddress;
    const phone = t.creditorPhone;
    const acct = t.accountNumberMasked;
    if (addr || phone || acct) {
      out.push({
        creditorName: t.creditorName,
        accountNumberMasked: acct,
        address: addr,
        phone,
        source: 'tradeline',
        tradelineIndex: idx,
      });
    }
  });
  return out;
}

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

function tradelineJoined(t: ParsedTradeline): string {
  return [
    t.creditorName,
    t.accountType,
    t.accountStatus,
    t.originalCreditor,
    ...(t.fields || []).map((f) => `${f.label || ''} ${Object.values(f.byBureau || {}).join(' ')}`),
  ]
    .join(' ')
    .toLowerCase();
}

export function classifyTradelineNegativeType(t: ParsedTradeline): NegativeType {
  return classifyCandidateNegativeType({
    id: '',
    account: String(t.creditorName || ''),
    type: String(t.accountType || ''),
    code: '',
    status: String(t.accountStatus || ''),
    bureau: 'EXP',
  });
}

function tradelineNegativeType(t: ParsedTradeline): 'collection' | 'charge_off' | null {
  const joined = tradelineJoined(t);
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

/** Strict filter — only tradelines classified as the requested collateral negative type. */
export function extractCollateralSignals(
  reports: Array<{ id: string; parsed?: ParsedCreditReport | null }>,
  required: 'foreclosure' | 'repossession',
): ReportedDebtSignal[] {
  const out: ReportedDebtSignal[] = [];
  for (const report of reports) {
    const parsed = report.parsed;
    if (!parsed) continue;
    const contacts = parsed.creditorContacts || [];
    (parsed.tradelines || []).forEach((t, tradelineIndex) => {
      const classifiedNegative = classifyTradelineNegativeType(t);
      if (classifiedNegative !== required) return;
      const name = String(t.creditorName || '').trim();
      if (!name) return;
      const contact =
        contacts.find((c) => namesLikelyMatch(c.creditorName, name) && c.tradelineIndex === tradelineIndex) ||
        contacts.find((c) => namesLikelyMatch(c.creditorName, name));
      const balance = typeof t.balance === 'number' && t.balance > 0 ? Math.round(t.balance * 100) : undefined;
      const negativeType = tradelineNegativeType(t) ?? 'charge_off';
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
        classifiedNegative,
        accountStatus: t.accountStatus,
        accountType: t.accountType,
        confidence: contact?.address || t.creditorAddress ? 'high' : 'medium',
      });
    });
  }
  const uniq = new Map<string, ReportedDebtSignal>();
  for (const s of out) {
    if (!uniq.has(s.signalId)) uniq.set(s.signalId, s);
  }
  return Array.from(uniq.values()).sort((a, b) => {
    const score = (x: ReportedDebtSignal) => (x.confidence === 'high' ? 2 : 1) + (x.balanceCents ? 1 : 0);
    return score(b) - score(a);
  });
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
      const classifiedNegative = classifyTradelineNegativeType(t);
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
        classifiedNegative,
        accountStatus: t.accountStatus,
        accountType: t.accountType,
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

  // Prefer counsel / attorney office, then collector / creditor / tradeline names
  const directoryHit = lookupKnownCreditorFromCandidates([
    debt.plaintiffLawFirm,
    debt.plaintiffAttorneyName,
    debt.recipientName,
    debt.collectorName,
    debt.name,
    matchedDoc?.entities.plaintiffLawFirm,
    matchedDoc?.entities.counselName,
    matchedDoc?.entities.collectorName,
    matchedDoc?.entities.creditorName,
    matchedSignal?.creditorName,
    matchedSignal?.originalCreditor,
  ]);

  const firmAddressFromDoc =
    matchedDoc?.entities.plaintiffLawFirmAddress || matchedDoc?.entities.address || '';

  const recipientName =
    debt.plaintiffLawFirm ||
    debt.recipientName ||
    debt.collectorName ||
    matchedDoc?.entities.plaintiffLawFirm ||
    matchedDoc?.entities.collectorName ||
    matchedDoc?.entities.creditorName ||
    matchedSignal?.creditorName ||
    directoryHit?.displayName ||
    debt.name;
  const recipientAddress =
    debt.plaintiffLawFirmAddress ||
    debt.recipientAddress ||
    firmAddressFromDoc ||
    matchedContact?.address ||
    matchedSignal?.address ||
    directoryHit?.address ||
    '';
  const recipientPhone =
    debt.recipientPhone || matchedContact?.phone || matchedSignal?.phone || directoryHit?.phone;

  const matchedFrom: DebtPartyInfo['matchedFrom'] = debt.plaintiffLawFirmAddress || debt.recipientAddress
    ? 'debt_case'
    : firmAddressFromDoc
      ? 'document'
      : matchedContact?.address
        ? 'report_contact'
        : matchedSignal?.address
          ? 'tradeline'
          : directoryHit?.address
            ? 'directory'
            : matchedSignal
              ? 'tradeline'
              : 'manual';

  return {
    recipientName,
    recipientAddress,
    recipientPhone,
    collectorName: debt.collectorName || matchedDoc?.entities.collectorName || recipientName,
    originalCreditor: debt.originalCreditor || matchedSignal?.originalCreditor,
    accountNumberMasked: debt.accountNumberMasked || matchedSignal?.accountNumberMasked || matchedContact?.accountNumberMasked,
    balanceCents: debt.amountCents || matchedSignal?.balanceCents,
    matchedFrom,
    signal: matchedSignal ?? undefined,
    autoFilled: matchedFrom !== 'manual' && matchedFrom !== 'debt_case',
  };
}

/** Persist resolved party onto debt when case is missing mailing fields. */
export function autoPersistDebtPartyIfEmpty(debt: DebtCase, party: DebtPartyInfo | null): DebtCase | null {
  if (!debt || !party) return null;
  const hasTo =
    Boolean(debt.recipientAddress || debt.plaintiffLawFirmAddress) &&
    Boolean(debt.recipientName || debt.plaintiffLawFirm);
  if (hasTo) return null;
  if (!party.recipientAddress && !party.recipientName) return null;
  if (party.matchedFrom === 'manual') return null;
  const firmLike = party.matchedFrom === 'directory' || party.matchedFrom === 'document';
  return mergeDebtCreditorFields(debt, {
    recipientName: debt.recipientName || party.recipientName,
    recipientAddress: debt.recipientAddress || party.recipientAddress || undefined,
    recipientPhone: debt.recipientPhone || party.recipientPhone,
    collectorName: debt.collectorName || party.collectorName,
    originalCreditor: debt.originalCreditor || party.originalCreditor,
    accountNumberMasked: debt.accountNumberMasked || party.accountNumberMasked,
    // Also post onto counsel/firm TO fields used by letter builders
    plaintiffLawFirm: debt.plaintiffLawFirm || (firmLike ? party.recipientName : debt.plaintiffLawFirm),
    plaintiffLawFirmAddress:
      debt.plaintiffLawFirmAddress || party.recipientAddress || undefined,
  });
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
    hearingDate: patch.hearingDate ?? debt.hearingDate,
    courtCaseNumber: patch.courtCaseNumber ?? debt.courtCaseNumber,
    dateServed: patch.dateServed ?? debt.dateServed,
    plaintiffLawFirm: patch.plaintiffLawFirm ?? debt.plaintiffLawFirm,
    plaintiffLawFirmAddress: patch.plaintiffLawFirmAddress ?? debt.plaintiffLawFirmAddress,
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

export type PartnerDebtSnapshot = {
  claimedCents: number;
  reportedCents: number;
  reportedCount: number;
  summonsClaimedCents: number;
  summonsCount: number;
  collateralCents: number;
  collateralCount: number;
};

function dedupeSignalBalanceCents(signals: ReportedDebtSignal[]): { cents: number; count: number } {
  const groups = new Map<string, ReportedDebtSignal>();
  for (const s of signals) {
    const key = `${normCreditorName(s.creditorName)}::${String(s.accountNumberMasked || '').trim()}`;
    const prev = groups.get(key);
    if (!prev) {
      groups.set(key, s);
      continue;
    }
    const prevBal = prev.balanceCents ?? 0;
    const nextBal = s.balanceCents ?? 0;
    if (nextBal > prevBal) groups.set(key, s);
  }
  const uniq = Array.from(groups.values());
  return {
    cents: uniq.reduce((sum, s) => sum + (s.balanceCents ?? 0), 0),
    count: uniq.length,
  };
}

/** Unified debt totals for portal surfaces — claimed cases vs deduped report signals. */
export function computePartnerDebtSnapshot(partnerId: string): PartnerDebtSnapshot {
  const cases = listDebtByPartner(partnerId);
  const reports = listReportsByPartner(partnerId).map((r) => ({ id: r.id, parsed: r.parsed }));
  const signals = extractReportDebtSignals(reports);
  const reported = dedupeSignalBalanceCents(signals);
  const foreclosure = dedupeSignalBalanceCents(extractCollateralSignals(reports, 'foreclosure'));
  const repossession = dedupeSignalBalanceCents(extractCollateralSignals(reports, 'repossession'));
  const summonsCases = cases.filter((c) => c.type === 'summons');
  return {
    claimedCents: cases.reduce((sum, c) => sum + Number(c.amountCents || 0), 0),
    reportedCents: reported.cents,
    reportedCount: reported.count,
    summonsClaimedCents: summonsCases.reduce((sum, c) => sum + Number(c.amountCents || 0), 0),
    summonsCount: summonsCases.length,
    collateralCents: foreclosure.cents + repossession.cents,
    collateralCount: foreclosure.count + repossession.count,
  };
}

export function formatPartnerDebtSnapshotSummary(s: PartnerDebtSnapshot): string {
  const parts: string[] = [];
  if (s.reportedCount > 0) {
    parts.push(
      `${(s.reportedCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} on report (${s.reportedCount})`,
    );
  }
  if (s.claimedCents > 0) {
    parts.push(
      `${(s.claimedCents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })} in cases`,
    );
  }
  if (s.summonsCount > 0) {
    parts.push(`${s.summonsCount} summons`);
  }
  return parts.length ? parts.join(' · ') : 'Add cases or upload reports';
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
