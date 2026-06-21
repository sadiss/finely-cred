import type { Bureau, DisputeCandidate, ParsedCreditReport, ParsedTradeline, TradelineRow } from '../domain/creditReports';

export type CandidateEvidenceNeed = {
  id: string;
  title: string;
  why: string;
};

export type CandidateInsight = {
  candidateId: string;
  severity: number; // 1-100
  whyTop: string[]; // short, high-signal bullets
  contradictions: string[];
  keyFacts: {
    accountType?: string;
    accountStatus?: string;
    dofd?: string;
    dateOpened?: string;
    dateClosed?: string;
    balance?: number | null;
    pastDue?: number | null;
    creditLimit?: number | null;
    highBalance?: number | null;
    utilization?: Partial<Record<Bureau, number>> | undefined;
    recentDerogCount24?: number;
    recentDerogCount6?: number;
  };
  evidenceChecklist: CandidateEvidenceNeed[];
  linkedTradeline?: ParsedTradeline;
};

export type RankedCandidate = DisputeCandidate & { severity: number; insight: CandidateInsight; linkedTradeline?: ParsedTradeline };

export type CreditIntelReadiness = {
  /** 0-100 “how ready is this file to execute disputes + evidence cleanly” */
  score: number;
  helping: string[];
  blockers: string[];
  nextActions: string[];
};

function norm(s: string) {
  return (s || '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function safeDate(iso?: string) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

function codeIsDerog(codeRaw: string) {
  const c = (codeRaw || '').trim().toUpperCase();
  if (!c) return false;
  if (['CO', 'COL', 'CL'].includes(c)) return true;
  const n = Number(c);
  if (Number.isFinite(n) && n >= 30) return true;
  return c.includes('LATE') || c.includes('DELINQ') || c.includes('CHARGE') || c.includes('COLLECT');
}

function getField(tradeline: { fields?: TradelineRow[] }, ...needles: string[]) {
  const rows = tradeline.fields ?? [];
  const want = needles.map(norm);
  return (
    rows.find((r) => {
      const l = norm(r?.label || '');
      return l && want.some((w) => l.includes(w));
    }) ?? null
  );
}

function distinctNonEmpty(values: string[]) {
  const set = new Set(values.map((v) => v.trim()).filter(Boolean).filter((v) => !['-', '—', 'n/a'].includes(norm(v))));
  return Array.from(set);
}

function mkNeed(id: string, title: string, why: string): CandidateEvidenceNeed {
  return { id, title, why };
}

function defaultEvidenceChecklist(type: string): CandidateEvidenceNeed[] {
  const t = norm(type);
  if (t.includes('collection') || t.includes('charge')) {
    return [
      mkNeed('ev_tradeline_screenshot', 'Tradeline screenshot (account details + history)', 'Shows exactly what is being reported and supports accuracy challenges.'),
      mkNeed('ev_itemization', 'Itemization / statements / billing history', 'Helps dispute balances, dates, and ownership/authority to report.'),
      mkNeed('ev_identity', 'Identity + proof of address', 'Often required by bureaus to process disputes and reduces “frivolous” denials.'),
    ];
  }
  if (t.includes('late')) {
    return [
      mkNeed('ev_payment_proof', 'Proof of payment / bank confirmation', 'Supports a challenge when late codes don’t match the actual payment record.'),
      mkNeed('ev_account_statements', 'Statements for the disputed months', 'Lets you pinpoint the exact month(s) and amounts in dispute.'),
      mkNeed('ev_tradeline_screenshot', 'Tradeline screenshot (account details + history)', 'Captures the codes being reported.'),
    ];
  }
  if (t.includes('inquiry')) {
    return [
      mkNeed('ev_authorization', 'Authorization proof (if any) or “no knowledge” statement', 'Supports permissible purpose verification.'),
      mkNeed('ev_identity', 'Identity + proof of address', 'Helps bureaus validate the requestor and avoid mismatches.'),
    ];
  }
  if (t.includes('bankrupt')) {
    return [
      mkNeed('ev_discharge', 'Bankruptcy discharge / docket summary', 'Supports case details, disposition, and association to your file.'),
      mkNeed('ev_identity', 'Identity + proof of address', 'Helps with matching and reduces disputes being rejected.'),
    ];
  }
  if (t.includes('public record') || t.includes('foreclos') || t.includes('repo')) {
    return [
      mkNeed('ev_court', 'Court/public record documentation', 'Supports accuracy for dates, case numbers, and outcomes.'),
      mkNeed('ev_identity', 'Identity + proof of address', 'Helps bureaus correctly associate or disassociate the record.'),
    ];
  }
  return [
    mkNeed('ev_tradeline_screenshot', 'Tradeline screenshot', 'Provides the factual basis of what is being reported.'),
    mkNeed('ev_identity', 'Identity + proof of address', 'Often required to process disputes.'),
  ];
}

export function findMatchingTradeline(parsed: ParsedCreditReport, candidate: DisputeCandidate): ParsedTradeline | null {
  const acct = norm(candidate.account);
  if (!acct) return null;
  const list = parsed.tradelines ?? [];
  return (
    list.find((x) => norm(x.creditorName) === acct) ??
    list.find((x) => acct.includes(norm(x.creditorName))) ??
    list.find((x) => norm(x.creditorName).includes(acct)) ??
    null
  );
}

export function buildCandidateInsight(parsed: ParsedCreditReport, candidate: DisputeCandidate): CandidateInsight {
  const tl = findMatchingTradeline(parsed, candidate) ?? undefined;

  const base: Record<string, number> = {
    Bankruptcy: 98,
    'Public Record': 95,
    Foreclosure: 92,
    Repossession: 88,
    'Charge-Off': 90,
    Collection: 86,
    'Late Payment': 62,
    Inquiry: 28,
    'Derogatory Item': 60,
    'Negative Item': 60,
  };
  let severity = base[candidate.type] ?? 60;

  const why: string[] = [];
  why.push(`Type impact: ${candidate.type}`);

  const contradictions: string[] = [];
  const keyFacts: CandidateInsight['keyFacts'] = {
    accountType: tl?.accountType,
    accountStatus: tl?.accountStatus,
    dofd: tl?.dofd,
    dateOpened: tl?.dateOpened,
    dateClosed: tl?.dateClosed,
    balance: tl?.balance ?? null,
    pastDue: tl?.pastDue ?? null,
    creditLimit: tl?.creditLimit ?? null,
    highBalance: tl?.highBalance ?? null,
    utilization: tl?.utilizationPct,
  };

  // Amount-based weighting
  if (tl?.pastDue != null) {
    severity += Math.min(15, Math.round(tl.pastDue / 250));
    why.push(`Past-due detected: $${Math.round(tl.pastDue).toLocaleString()}`);
  } else if (tl?.balance != null) {
    severity += Math.min(12, Math.round(tl.balance / 5000));
    why.push(`Balance detected: $${Math.round(tl.balance).toLocaleString()}`);
  }

  // Recency weighting from DOFD (best-effort)
  const dofd = safeDate(tl?.dofd);
  if (dofd) {
    const days = Math.round((Date.now() - dofd.getTime()) / (1000 * 60 * 60 * 24));
    if (days < 365) {
      severity += 6;
      why.push('DOFD is recent (< 12 months) — high impact');
    } else if (days < 730) {
      severity += 3;
      why.push('DOFD within 12–24 months — still impactful');
    }
  }

  // Derog count weighting from 24mo history
  const hist = tl?.paymentHistory2y?.byBureau ?? {};
  const codes = Object.values(hist).flatMap((x) => (x ?? []).map((c) => (c.code || '').toString()));
  const last24 = codes.slice(-24);
  const last6 = codes.slice(-6);
  const derog24 = last24.filter(codeIsDerog).length;
  const derog6 = last6.filter(codeIsDerog).length;
  keyFacts.recentDerogCount24 = derog24 || undefined;
  keyFacts.recentDerogCount6 = derog6 || undefined;
  if (derog6) {
    severity += 8;
    why.push(`Recent derogatory months: ${derog6} in last 6`);
  } else if (derog24) {
    severity += 4;
    why.push(`Derogatory months: ${derog24} in last 24`);
  }

  // Cross-bureau inconsistencies (high ROI dispute angles)
  if (tl?.fields?.length) {
    const checkLabels = [
      'Account Status',
      'Payment Status',
      'Account Type',
      'Date Opened',
      'Date Closed',
      'Date of First Delinquency',
      'Balance',
      'Past Due',
      'Credit Limit',
      'High Credit',
      'Monthly Payment',
      'Remarks',
    ];
    let inconsistencyCount = 0;
    for (const label of checkLabels) {
      const row = getField(tl, label);
      if (!row?.byBureau) continue;
      const values = [row.byBureau.EXP || '', row.byBureau.EQF || '', row.byBureau.TUC || ''];
      const distinct = distinctNonEmpty(values);
      if (distinct.length >= 2) {
        inconsistencyCount++;
        contradictions.push(`Cross-bureau mismatch: ${label} differs (${distinct.join(' | ')})`);
      }
    }
    if (inconsistencyCount) {
      severity += Math.min(10, 2 + inconsistencyCount);
      why.push(`Cross-bureau inconsistencies detected: ${inconsistencyCount}`);
    }
  }

  severity = Math.max(1, Math.min(100, severity));

  // Keep “why” short and sharp.
  const whyTop = why.slice(0, 4);

  return {
    candidateId: candidate.id,
    severity,
    whyTop,
    contradictions: contradictions.slice(0, 8),
    keyFacts,
    evidenceChecklist: defaultEvidenceChecklist(candidate.type),
    linkedTradeline: tl,
  };
}

export function rankDisputeCandidates(args: { parsed: ParsedCreditReport; candidates: DisputeCandidate[] }): RankedCandidate[] {
  const enriched = args.candidates.map((c) => {
    const insight = buildCandidateInsight(args.parsed, c);
    return { ...c, severity: insight.severity, insight, linkedTradeline: insight.linkedTradeline };
  });
  return enriched.slice().sort((a, b) => b.severity - a.severity);
}

function avg(nums: number[]) {
  if (!nums.length) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function computeCreditIntelReadiness(args: {
  parsed: ParsedCreditReport;
  rankedCandidates: RankedCandidate[];
  evidenceCoverage?: { covered: number; total: number };
}): CreditIntelReadiness {
  const parsed = args.parsed;
  const candidates = args.rankedCandidates ?? [];
  const totalCandidates = candidates.length;

  const helping: string[] = [];
  const blockers: string[] = [];
  const nextActions: string[] = [];

  let score = 100;

  const tlCount = parsed.tradelines?.length ?? 0;
  if (tlCount >= 5) helping.push('Tradelines extracted (good depth).');
  else if (tlCount >= 1) helping.push('Some tradelines extracted.');
  else {
    score -= 30;
    blockers.push('No tradelines extracted (upload a full export or use PDF fallback).');
    nextActions.push('Upload a fuller report export (HTML preferred) or re-upload PDF with OCR.');
  }

  const pi = parsed.personalInfo as any;
  const hasName = Boolean(String(pi?.fullName || '').trim());
  const hasAnyAddress = Array.isArray(pi?.addresses) ? pi.addresses.length > 0 : Boolean(String(pi?.address1 || '').trim());
  if (hasName) helping.push('Personal identity detected in report.');
  else {
    score -= 10;
    blockers.push('Personal identity section missing or not extracted.');
    nextActions.push('Complete onboarding contact/mailing info and/or upload a report export with PI section visible.');
  }
  if (hasAnyAddress) helping.push('Address data detected (helps letter autofill/validation).');
  else {
    score -= 8;
    blockers.push('No address detected from the report.');
    nextActions.push('Add mailing address in onboarding (so letters can auto-fill correctly).');
  }

  // Negatives reduce execution readiness (more work + more evidence needed).
  if (totalCandidates > 0) {
    const penalty = Math.min(40, 10 + totalCandidates * 4);
    score -= penalty;
    blockers.push(`${totalCandidates} negative item${totalCandidates === 1 ? '' : 's'} detected (requires disputes + evidence).`);
    nextActions.push('Open the Disputes tab and start with the highest-severity items first.');
  } else {
    helping.push('No dispute candidates detected from extracted data.');
  }

  // Evidence coverage (screenshots linked) – drives readiness for dispute execution.
  const cov = args.evidenceCoverage;
  if (cov && cov.total > 0) {
    const missing = Math.max(0, cov.total - cov.covered);
    const ratioMissing = cov.total ? missing / cov.total : 0;
    if (missing === 0) helping.push('Evidence coverage: screenshots found for all items.');
    else {
      score -= Math.min(25, Math.round(ratioMissing * 25));
      blockers.push(`Evidence missing for ${missing}/${cov.total} item${cov.total === 1 ? '' : 's'}.`);
      nextActions.push('Use Evidence View tables to screenshot missing items and attach them to disputes.');
    }
  }

  // Utilization quick signal (best-effort)
  const utilVals: number[] = [];
  for (const t of (parsed.tradelines ?? []).filter(Boolean)) {
    const u = (t as any).utilizationPct as any;
    if (u && typeof u === 'object') {
      for (const v of Object.values(u)) {
        const n = typeof v === 'number' ? v : null;
        if (n != null && Number.isFinite(n)) utilVals.push(n);
      }
    }
  }
  const utilAvg = avg(utilVals);
  if (utilAvg != null) {
    const u = Math.round(utilAvg);
    if (u <= 9) helping.push('Utilization appears low (good for scoring).');
    else if (u <= 30) helping.push('Utilization appears moderate (under 30%).');
    else {
      score -= 8;
      blockers.push(`High utilization detected (~${u}% avg).`);
      nextActions.push('Use Simulation to estimate utilization improvement after paydown; target < 30% (ideal 1–9%).');
    }
  }

  score = Math.max(0, Math.min(100, Math.round(score)));
  return {
    score,
    helping: helping.slice(0, 6),
    blockers: blockers.slice(0, 6),
    nextActions: nextActions.slice(0, 6),
  };
}
