import { buildCreditProgram, type FinelyCreditProgram } from './finelyBridgeCreditProgram.ts';
import { buildPartnerMlAdvisory, buildPartnerMlContext, type MlAdvisoryPayload } from './ncgMlEngine.ts';
import { buildUnderwritingPacketV2, type UnderwritingPacketV2 } from './underwritingPacketV2.ts';

export type NoraDossierNextStep = {
  id: string;
  lane: 'funding' | 'dispute' | 'debt' | 'identity' | 'ops' | 'compliance';
  priority: 'critical' | 'high' | 'medium' | 'low';
  action: string;
  detail: string;
  owner: 'partner' | 'admin' | 'ncg_underwriter' | 'system';
  dueInDays?: number;
  blockedBy?: string[];
};

export type NoraFundingDossierV5 = {
  version: 5;
  exportId: string;
  partnerId: string;
  externalId: string | null;
  exportedAt: string;
  identity: {
    fullName: string | null;
    email: string | null;
    phone: string | null;
    primaryRoute: string | null;
    lane: string | null;
    journeyStage: string | null;
    fundingStage: string | null;
    mailingAddress?: {
      line1?: string | null;
      city?: string | null;
      state?: string | null;
      postalCode?: string | null;
    };
  };
  readiness: {
    score: number;
    ready: boolean;
    blockers: string[];
    verdict: 'ready' | 'conditional' | 'not_ready';
  };
  creditProgram: FinelyCreditProgram;
  credit: NoraDossierCreditSection;
  disputes: NoraDossierDisputesSection;
  debt: NoraDossierDebtSection;
  evidence: NoraDossierEvidenceSection;
  documents: NoraDossierDocumentsSection;
  mlAdvisory: MlAdvisoryPayload;
  nextSteps: NoraDossierNextStep[];
  resultsSummary: {
    headline: string;
    fundingReadinessVerdict: 'ready' | 'conditional' | 'not_ready';
    keyMetrics: Record<string, string | number>;
    blockers: string[];
    wins: string[];
  };
  underwritingPacketV2: UnderwritingPacketV2;
};

type NegativeCategory = 'collections' | 'charge_offs' | 'repossessions' | 'delinquencies' | 'other';

type NoraDossierCreditSection = {
  latestReportId: string | null;
  latestReportDate: string | null;
  reportCount: number;
  provider: string | null;
  scores: Array<{ bureau: string | null; model: string; value: number }>;
  scoreSummary: { average: number | null; min: number | null; max: number | null; bureauSpread: number | null };
  tradelines: {
    total: number;
    positive: number;
    negative: number;
    byCategory: Record<NegativeCategory, number>;
    highUtilization: Array<{ creditor: string; utilizationPct: number | null; balance: number | null; limit: number | null }>;
    positives: Array<Record<string, unknown>>;
    negatives: Array<Record<string, unknown>>;
  };
  utilization: {
    aggregatePct: number | null;
    revolvingCount: number;
    highUtilCount: number;
    totalBalance: number | null;
    totalLimit: number | null;
  };
  inquiries: { count: number; recent: Array<{ company: string; date: string; bureau: string }> };
  publicRecords: {
    bankruptcy: Array<Record<string, string>>;
    judgments: Array<Record<string, string>>;
    liens: Array<Record<string, string>>;
    collectionsFromSections: number;
  };
  personalInfo: {
    fullName?: string;
    dob?: string;
    ssnMasked?: string;
    addressCount?: number;
    employer?: string;
  } | null;
  identityCheck: {
    checkedAt: string | null;
    faultCount: number;
    faults: Array<{ kind: string; severity: string; message: string }>;
  } | null;
};

type NoraDossierDisputesSection = {
  caseCount: number;
  openCases: number;
  letterCount: number;
  mailedLetters: number;
  disputePosture: string;
  cases: Array<{
    id: string;
    bureau: string;
    title: string;
    status: string;
    itemCount: number;
    roundCount: number;
    latestRound?: string;
    updatedAt: string;
  }>;
  letters: Array<{
    id: string;
    title: string;
    type: string;
    status: string | null;
    createdAt: string;
    mailedAt?: string | null;
    bureau?: string | null;
    relatedEvidenceCount: number;
  }>;
  roundsSummary: Array<{ round: string; count: number; mailed: number; awaitingResponse: number }>;
};

type NoraDossierDebtSection = {
  serverSynced: boolean;
  note: string;
  casesFromSignals: unknown[];
  tradelineLinkedCollections: Array<{ creditor: string; balance: number | null; status: string | null }>;
  bankruptcyFromReport: Array<Record<string, string>>;
  openDebtSignals: number;
};

type NoraDossierEvidenceSection = {
  total: number;
  byType: Record<string, number>;
  recognized: Array<{
    id: string;
    type: string;
    caption: string | null;
    filename: string | null;
    creditorName: string | null;
    sectionKey: string | null;
    classification: string;
    createdAt: string;
    blobRef: string | null;
  }>;
};

type NoraDossierDocumentsSection = {
  reports: Array<{
    id: string;
    filename: string | null;
    provider: string | null;
    receivedAt: string;
    hasParsedTradelines: boolean;
    tradelineCount: number;
    scoreCount: number;
  }>;
  letterPdfs: Array<{ id: string; title: string; filename: string | null; status: string | null }>;
};

function isPositiveTradeline(t: Record<string, unknown>): boolean {
  const s = String(t.accountStatus || '').toLowerCase();
  if (/charge|collection|derog|delinq|reposs|foreclos|default/i.test(s)) return false;
  if (/late|past due|30|60|90/i.test(s)) return false;
  return /open|current|paid|good|as agreed/i.test(s) || (!/closed/i.test(s) && !s);
}

function categorizeNegativeText(text: string): NegativeCategory {
  const s = text.toLowerCase();
  if (/collection|collector|medical collection/i.test(s)) return 'collections';
  if (/charge.?off|charged off/i.test(s)) return 'charge_offs';
  if (/reposs|foreclos|voluntary surrender|repo/i.test(s)) return 'repossessions';
  if (/delinq|late|past due|30|60|90|120|derog/i.test(s)) return 'delinquencies';
  return 'other';
}

function categorizeTradelineNegative(t: Record<string, unknown>): NegativeCategory {
  const hay = [t.creditorName, t.originalCreditor, t.accountType, t.accountStatus].filter(Boolean).join(' ');
  return categorizeNegativeText(hay);
}

function summarizeTradeline(t: Record<string, unknown>): Record<string, unknown> {
  return {
    creditor: t.creditorName ?? t.originalCreditor ?? 'Unknown',
    accountType: t.accountType ?? null,
    accountStatus: t.accountStatus ?? null,
    balance: typeof t.balance === 'number' ? t.balance : null,
    creditLimit: typeof t.creditLimit === 'number' ? t.creditLimit : null,
    utilizationPct: t.utilizationPct ?? null,
    dateOpened: t.dateOpened ?? null,
    dateClosed: t.dateClosed ?? null,
    dofd: t.dofd ?? null,
    accountNumberMasked: t.accountNumberMasked ?? null,
    responsibility: t.responsibility ?? null,
  };
}

function tradelineUtilPct(t: Record<string, unknown>): number | null {
  if (typeof t.balance === 'number' && typeof t.creditLimit === 'number' && t.creditLimit > 0) {
    return Math.round((t.balance / t.creditLimit) * 100);
  }
  const u = t.utilizationPct as Record<string, number> | undefined;
  if (u && typeof u === 'object') {
    const vals = Object.values(u).filter((v) => typeof v === 'number');
    if (vals.length) return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  }
  return null;
}

function classifyEvidence(type: string, sectionKey?: string | null): string {
  const t = type.toLowerCase();
  const sk = String(sectionKey || '').toLowerCase();
  if (t.includes('id') || sk.includes('identity')) return 'identity';
  if (t.includes('address') || sk.includes('address')) return 'proof_of_address';
  if (t.includes('income') || sk.includes('income')) return 'income';
  if (t.includes('bank') || sk.includes('bank')) return 'banking';
  if (t.includes('response') || sk.includes('bureau_response')) return 'bureau_response';
  if (t.includes('tradeline') || sk.includes('tradeline')) return 'tradeline_screenshot';
  if (t.includes('court') || sk.includes('court')) return 'court_filing';
  if (t.includes('debt') || sk.includes('debt')) return 'debt_validation';
  return 'general_evidence';
}

function extractSectionRows(sections: unknown[], keys: string[]): Array<Record<string, string>> {
  const out: Array<Record<string, string>> = [];
  for (const sec of sections) {
    if (!sec || typeof sec !== 'object') continue;
    const s = sec as Record<string, unknown>;
    const key = String(s.key || '').toLowerCase();
    if (!keys.some((k) => key.includes(k))) continue;
    const items = Array.isArray(s.items) ? s.items : [];
    for (const item of items) {
      const fields = (item as Record<string, unknown>)?.fields;
      if (fields && typeof fields === 'object') {
        const row: Record<string, string> = {};
        for (const [k, v] of Object.entries(fields as Record<string, unknown>)) {
          if (v != null && String(v).trim()) row[k] = String(v).trim();
        }
        if (Object.keys(row).length) out.push(row);
      }
    }
    const table = s.table as { rows?: string[][] } | undefined;
    if (table?.rows?.length) {
      for (const row of table.rows.slice(0, 30)) {
        out.push({ raw: row.filter(Boolean).join(' | ') });
      }
    }
  }
  return out;
}

function extractInquiries(sections: unknown[]): Array<{ company: string; date: string; bureau: string }> {
  const rows: Array<{ company: string; date: string; bureau: string }> = [];
  for (const sec of sections) {
    if (!sec || typeof sec !== 'object') continue;
    const s = sec as Record<string, unknown>;
    const key = String(s.key || '').toLowerCase();
    if (!key.includes('inquir')) continue;
    const items = Array.isArray(s.items) ? s.items : [];
    for (const item of items) {
      const f = (item as Record<string, unknown>)?.fields as Record<string, string> | undefined;
      if (!f) continue;
      const keys = Object.keys(f);
      const pick = (...names: string[]) => {
        for (const n of names) {
          const hit = keys.find((k) => k.toLowerCase().includes(n));
          if (hit && f[hit]) return String(f[hit]).trim();
        }
        return '';
      };
      const company = pick('subscriber', 'company', 'creditor', 'name', 'requested');
      const date = pick('date', 'inquiry date', 'requested');
      const bureau = pick('bureau', 'tu', 'exp', 'eqf') || '—';
      if (company || date) rows.push({ company: company || 'Inquiry', date: date || '—', bureau });
    }
  }
  return rows;
}

function buildReadiness(partner: Record<string, unknown>) {
  const signals = (partner.journey_signals && typeof partner.journey_signals === 'object'
    ? partner.journey_signals
    : {}) as Record<string, unknown>;
  let score = 20;
  const js = partner.journey_stage;
  if (js === 'letters' || js === 'mailing') score += 25;
  if (js === 'funding' || js === 'complete') score += 35;
  const legacyStatus = Number(signals.legacyApplicationStatus ?? 0);
  if (legacyStatus >= 7) score += 15;
  if (legacyStatus >= 10) score += 10;
  if (Number(signals.legacyReportCount ?? 0) > 0) score += 10;
  if (Number(signals.legacyLetterCount ?? 0) > 0) score += 10;
  score = Math.min(100, score);
  const blockers: string[] = [];
  if (!Number(signals.legacyReportCount ?? 0)) blockers.push('No credit report on file.');
  const fundingStage = String(partner.funding_stage ?? signals.fundingStage ?? 'not_ready');
  const ready = score >= 65 && blockers.length <= 1 && (js === 'mailing' || js === 'funding' || js === 'complete');
  const verdict = ready || fundingStage === 'ready' || fundingStage === 'submitted'
    ? 'ready'
    : score >= 50
      ? 'conditional'
      : 'not_ready';
  return { score, blockers, fundingStage, ready, verdict: verdict as 'ready' | 'conditional' | 'not_ready' };
}

function buildNextSteps(args: {
  creditProgram: FinelyCreditProgram;
  ml: MlAdvisoryPayload;
  readiness: ReturnType<typeof buildReadiness>;
  credit: NoraDossierCreditSection;
  disputes: NoraDossierDisputesSection;
}): NoraDossierNextStep[] {
  const steps: NoraDossierNextStep[] = [];
  let idx = 0;

  const push = (step: Omit<NoraDossierNextStep, 'id'>) => {
    steps.push({ id: `ns-${++idx}`, ...step });
  };

  for (const b of args.readiness.blockers) {
    push({
      lane: 'ops',
      priority: 'critical',
      action: 'Clear funding blocker',
      detail: b,
      owner: 'partner',
      dueInDays: 3,
    });
  }

  for (const p of args.ml.topPriorities.slice(0, 5)) {
    push({
      lane: p.toLowerCase().includes('dispute') ? 'dispute' : p.toLowerCase().includes('fund') ? 'funding' : 'ops',
      priority: 'high',
      action: p,
      detail: args.ml.executiveSummary || 'ML advisory priority',
      owner: 'partner',
      dueInDays: 7,
    });
  }

  for (const s of args.creditProgram.guidedNextSteps.slice(0, 4)) {
    push({
      lane: args.creditProgram.phase === 'fund_ready' || args.creditProgram.phase === 'bridge_handoff' ? 'funding' : 'dispute',
      priority: args.creditProgram.exportGateOpen ? 'high' : 'medium',
      action: s,
      detail: `Credit program phase: ${args.creditProgram.phaseLabel}`,
      owner: args.creditProgram.phase === 'bridge_handoff' ? 'ncg_underwriter' : 'partner',
      dueInDays: 14,
    });
  }

  if (args.credit.utilization.highUtilCount > 0) {
    push({
      lane: 'funding',
      priority: 'high',
      action: 'Reduce revolving utilization before lender submissions',
      detail: `${args.credit.utilization.highUtilCount} account(s) above 30% utilization — pay down or request limit increases on positives first.`,
      owner: 'partner',
      dueInDays: 21,
      blockedBy: args.credit.tradelines.negative > 3 ? ['Complete Round 1 disputes on top negatives'] : undefined,
    });
  }

  if (args.disputes.letterCount === 0 && args.credit.reportCount > 0) {
    push({
      lane: 'dispute',
      priority: 'critical',
      action: 'Launch Round 1 dispute with evidence',
      detail: 'Reports are on file but no letters mailed — fundability is capped until FCRA dispute cycle begins.',
      owner: 'partner',
      dueInDays: 5,
    });
  }

  if (args.readiness.verdict === 'ready' && args.creditProgram.exportGateOpen) {
    push({
      lane: 'funding',
      priority: 'critical',
      action: 'Submit Nora Capital underwriting review',
      detail: 'Partner meets fund-ready gate — push dossier to NCG Bridge queue and complete LEG-201 consent.',
      owner: 'ncg_underwriter',
      dueInDays: 2,
    });
  }

  return steps.slice(0, 20);
}

function buildResultsSummary(args: {
  readiness: ReturnType<typeof buildReadiness>;
  credit: NoraDossierCreditSection;
  disputes: NoraDossierDisputesSection;
  creditProgram: FinelyCreditProgram;
  ml: MlAdvisoryPayload;
}): NoraFundingDossierV5['resultsSummary'] {
  const wins: string[] = [];
  if (args.credit.reportCount > 0) wins.push('Tri-bureau report on file with parsed tradelines.');
  if (args.disputes.mailedLetters > 0) wins.push(`${args.disputes.mailedLetters} dispute letter(s) mailed with paper trail.`);
  if (args.credit.tradelines.positive > 0) wins.push(`${args.credit.tradelines.positive} positive tradeline(s) supporting fundability.`);
  if (args.credit.scoreSummary.average && args.credit.scoreSummary.average >= 680) {
    wins.push(`Average parsed score ${args.credit.scoreSummary.average} — competitive for many programs.`);
  }
  if (args.creditProgram.exportGateOpen) wins.push('Export gate open — underwriting packet v2 available.');

  const headline = args.readiness.verdict === 'ready'
    ? 'Fund-ready — NCG can advance to Bridge underwriting with full credit dossier.'
    : args.readiness.verdict === 'conditional'
      ? 'Conditional readiness — disputes or utilization work required before lender match.'
      : 'Not fund-ready — intake and restore milestones incomplete.';

  return {
    headline,
    fundingReadinessVerdict: args.readiness.verdict,
    keyMetrics: {
      readinessScore: args.readiness.score,
      creditPhase: args.creditProgram.phase,
      reportCount: args.credit.reportCount,
      tradelineTotal: args.credit.tradelines.total,
      negativeCount: args.credit.tradelines.negative,
      positiveCount: args.credit.tradelines.positive,
      avgScore: args.credit.scoreSummary.average ?? 'n/a',
      lettersMailed: args.disputes.mailedLetters,
      evidenceCount: args.disputes.letterCount > 0 ? args.disputes.letterCount : 0,
      exportGateOpen: args.creditProgram.exportGateOpen ? 1 : 0,
    },
    blockers: args.readiness.blockers,
    wins,
  };
}

export async function buildNoraFundingDossierV5(args: {
  admin: { from: (table: string) => any };
  partner: Record<string, unknown>;
  exportId?: string;
  includeMl?: boolean;
}): Promise<NoraFundingDossierV5> {
  const partner = args.partner;
  const partnerId = String(partner.id || '');
  const signals = (partner.journey_signals && typeof partner.journey_signals === 'object'
    ? partner.journey_signals
    : {}) as Record<string, unknown>;
  const profile = (partner.profile && typeof partner.profile === 'object' ? partner.profile : {}) as Record<string, unknown>;

  const [reportsRes, evidenceRes, lettersRes, casesRes] = await Promise.all([
    args.admin.from('credit_reports').select('*').eq('partner_id', partnerId).order('received_at', { ascending: false }).limit(20),
    args.admin.from('evidence').select('*').eq('partner_id', partnerId).order('created_at', { ascending: false }).limit(200),
    args.admin.from('letters').select('*').eq('partner_id', partnerId).order('created_at', { ascending: false }).limit(100),
    args.admin.from('cases').select('*').eq('partner_id', partnerId).order('updated_at', { ascending: false }).limit(50),
  ]);

  const reports = reportsRes.data ?? [];
  const evidence = evidenceRes.data ?? [];
  const letters = lettersRes.data ?? [];
  const cases = casesRes.data ?? [];

  const readiness = buildReadiness(partner);
  const reportCount = reports.length;
  const letterCount = letters.length;
  const evidenceCount = evidence.length;

  const creditProgram = buildCreditProgram({
    partner,
    readinessScore: readiness.score,
    letterCount,
    reportCount,
  });

  const latestReportRow = reports[0] as Record<string, unknown> | undefined;
  const latestData = (latestReportRow?.data ?? {}) as Record<string, unknown>;
  const parsed = (latestData.parsed ?? {}) as Record<string, unknown>;
  const tradelines = (Array.isArray(parsed.tradelines) ? parsed.tradelines : []) as Record<string, unknown>[];
  const sections = (Array.isArray(parsed.sections) ? parsed.sections : []) as unknown[];
  const scoresRaw = (Array.isArray(parsed.scores) ? parsed.scores : []) as Record<string, unknown>[];

  const byCategory: Record<NegativeCategory, number> = {
    collections: 0,
    charge_offs: 0,
    repossessions: 0,
    delinquencies: 0,
    other: 0,
  };
  const positives: Record<string, unknown>[] = [];
  const negatives: Record<string, unknown>[] = [];
  const highUtil: NoraDossierCreditSection['tradelines']['highUtilization'] = [];
  let totalBalance = 0;
  let totalLimit = 0;
  let revolvingCount = 0;

  for (const t of tradelines) {
    if (isPositiveTradeline(t)) {
      positives.push(summarizeTradeline(t));
    } else {
      negatives.push(summarizeTradeline(t));
      byCategory[categorizeTradelineNegative(t)] += 1;
    }
    const util = tradelineUtilPct(t);
    if (/revolv|card/i.test(String(t.accountType || ''))) revolvingCount += 1;
    if (typeof t.balance === 'number') totalBalance += t.balance;
    if (typeof t.creditLimit === 'number' && t.creditLimit > 0) totalLimit += t.creditLimit;
    if (util != null && util >= 30) {
      highUtil.push({
        creditor: String(t.creditorName || t.originalCreditor || 'Unknown'),
        utilizationPct: util,
        balance: typeof t.balance === 'number' ? t.balance : null,
        limit: typeof t.creditLimit === 'number' ? t.creditLimit : null,
      });
    }
  }

  const scores = scoresRaw.map((s) => ({
    bureau: (s.bureau as string) ?? null,
    model: String(s.model || 'Unknown'),
    value: Number(s.value ?? 0),
  }));
  const scoreVals = scores.map((s) => s.value).filter((v) => v > 0);
  const scoreSummary = {
    average: scoreVals.length ? Math.round(scoreVals.reduce((a, b) => a + b, 0) / scoreVals.length) : null,
    min: scoreVals.length ? Math.min(...scoreVals) : null,
    max: scoreVals.length ? Math.max(...scoreVals) : null,
    bureauSpread: scoreVals.length >= 2 ? Math.max(...scoreVals) - Math.min(...scoreVals) : null,
  };

  const personalInfoRaw = parsed.personalInfo as Record<string, unknown> | undefined;
  const identityCheckRaw = latestData.identityCheck as Record<string, unknown> | undefined;

  const credit: NoraDossierCreditSection = {
    latestReportId: latestReportRow ? String(latestReportRow.id) : null,
    latestReportDate: String(latestData.reportDate || latestReportRow?.received_at || '') || null,
    reportCount,
    provider: latestReportRow ? String(latestReportRow.provider || latestData.provider || '') : null,
    scores,
    scoreSummary,
    tradelines: {
      total: tradelines.length,
      positive: positives.length,
      negative: negatives.length,
      byCategory,
      highUtilization: highUtil.slice(0, 15),
      positives: positives.slice(0, 25),
      negatives: negatives.slice(0, 40),
    },
    utilization: {
      aggregatePct: totalLimit > 0 ? Math.round((totalBalance / totalLimit) * 100) : null,
      revolvingCount,
      highUtilCount: highUtil.length,
      totalBalance: totalBalance || null,
      totalLimit: totalLimit || null,
    },
    inquiries: {
      count: extractInquiries(sections).length,
      recent: extractInquiries(sections).slice(0, 25),
    },
    publicRecords: {
      bankruptcy: extractSectionRows(sections, ['bankruptcy', 'public']),
      judgments: extractSectionRows(sections, ['judgment']),
      liens: extractSectionRows(sections, ['lien', 'tax']),
      collectionsFromSections: extractSectionRows(sections, ['collection']).length,
    },
    personalInfo: personalInfoRaw
      ? {
          fullName: personalInfoRaw.fullName as string | undefined,
          dob: personalInfoRaw.dob as string | undefined,
          ssnMasked: personalInfoRaw.ssnMasked as string | undefined,
          addressCount: Array.isArray(personalInfoRaw.addresses) ? personalInfoRaw.addresses.length : undefined,
          employer: personalInfoRaw.employer as string | undefined,
        }
      : null,
    identityCheck: identityCheckRaw
      ? {
          checkedAt: String(identityCheckRaw.checkedAt || '') || null,
          faultCount: Array.isArray(identityCheckRaw.faults) ? identityCheckRaw.faults.length : 0,
          faults: (Array.isArray(identityCheckRaw.faults) ? identityCheckRaw.faults : []).slice(0, 10).map((f: unknown) => {
            const x = f as Record<string, unknown>;
            return {
              kind: String(x.kind || ''),
              severity: String(x.severity || ''),
              message: String(x.message || ''),
            };
          }),
        }
      : null,
  };

  const roundCounts = new Map<string, { count: number; mailed: number; awaitingResponse: number }>();
  const disputeCases = cases.map((c: Record<string, unknown>) => {
    const rounds = (Array.isArray(c.rounds) ? c.rounds : []) as Record<string, unknown>[];
    for (const r of rounds) {
      const key = String(r.round || 'Round 1');
      const cur = roundCounts.get(key) ?? { count: 0, mailed: 0, awaitingResponse: 0 };
      cur.count += 1;
      if (r.mailedAt) cur.mailed += 1;
      if (r.status === 'awaiting_response' || r.status === 'mailed') cur.awaitingResponse += 1;
      roundCounts.set(key, cur);
    }
    const latestRound = rounds[rounds.length - 1];
    return {
      id: String(c.id),
      bureau: String(c.bureau),
      title: String(c.title),
      status: String(c.status),
      itemCount: Array.isArray(c.items) ? c.items.length : 0,
      roundCount: rounds.length,
      latestRound: latestRound ? String(latestRound.round || '') : undefined,
      updatedAt: String(c.updated_at || c.created_at || ''),
    };
  });

  const letterRows = letters.map((l: Record<string, unknown>) => {
    const meta = (l.meta && typeof l.meta === 'object' ? l.meta : {}) as Record<string, unknown>;
    const mailing = (l.mailing && typeof l.mailing === 'object' ? l.mailing : {}) as Record<string, unknown>;
    return {
      id: String(l.id),
      title: String(l.title),
      type: String(l.type),
      status: l.status ? String(l.status) : null,
      createdAt: String(l.created_at),
      mailedAt: mailing.mailedAt ? String(mailing.mailedAt) : meta.mailedAt ? String(meta.mailedAt) : null,
      bureau: meta.bureau ? String(meta.bureau) : null,
      relatedEvidenceCount: Array.isArray(l.related_evidence_ids) ? l.related_evidence_ids.length : 0,
    };
  });

  const disputes: NoraDossierDisputesSection = {
    caseCount: cases.length,
    openCases: cases.filter((c: Record<string, unknown>) => String(c.status) === 'open').length,
    letterCount,
    mailedLetters: letterRows.filter((l) => l.mailedAt).length,
    disputePosture: creditProgram.disputePosture,
    cases: disputeCases,
    letters: letterRows,
    roundsSummary: Array.from(roundCounts.entries()).map(([round, v]) => ({ round, ...v })),
  };

  const debtSignals = (signals.debtCases ?? signals.debtSnapshot ?? signals.workflowDebt) as unknown;
  const debtCasesFromSignals = Array.isArray(debtSignals) ? debtSignals : [];

  const debt: NoraDossierDebtSection = {
    serverSynced: debtCasesFromSignals.length > 0,
    note: debtCasesFromSignals.length
      ? 'Debt cases included from partner journey_signals snapshot.'
      : 'Debt/bankruptcy workspace cases are browser-local unless synced to journey_signals — collections and public records from credit report are included below.',
    casesFromSignals: debtCasesFromSignals.slice(0, 20),
    tradelineLinkedCollections: negatives
      .filter((n) => categorizeNegativeText(String(n.creditor)) === 'collections' || /collection/i.test(String(n.accountStatus)))
      .slice(0, 15)
      .map((n) => ({
        creditor: String(n.creditor),
        balance: n.balance as number | null,
        status: n.accountStatus as string | null,
      })),
    bankruptcyFromReport: credit.publicRecords.bankruptcy,
    openDebtSignals: debtCasesFromSignals.filter((d: unknown) => {
      const x = d as Record<string, unknown>;
      return x.status === 'open' || x.status === 'in_review' || x.status === 'disputed';
    }).length,
  };

  const byType: Record<string, number> = {};
  const recognized = evidence.map((e: Record<string, unknown>) => {
    const type = String(e.type || 'unknown');
    byType[type] = (byType[type] ?? 0) + 1;
    return {
      id: String(e.id),
      type,
      caption: e.caption ? String(e.caption) : null,
      filename: e.filename ? String(e.filename) : null,
      creditorName: e.creditor_name ? String(e.creditor_name) : null,
      sectionKey: e.section_key ? String(e.section_key) : null,
      classification: classifyEvidence(type, e.section_key ? String(e.section_key) : null),
      createdAt: String(e.created_at),
      blobRef: e.blob_ref ? String(e.blob_ref) : null,
    };
  });

  const evidenceSection: NoraDossierEvidenceSection = {
    total: evidence.length,
    byType,
    recognized,
  };

  const documents: NoraDossierDocumentsSection = {
    reports: reports.map((r: Record<string, unknown>) => {
      const d = (r.data ?? {}) as Record<string, unknown>;
      const p = (d.parsed ?? {}) as Record<string, unknown>;
      const tls = Array.isArray(p.tradelines) ? p.tradelines : [];
      const sc = Array.isArray(p.scores) ? p.scores : [];
      return {
        id: String(r.id),
        filename: r.filename ? String(r.filename) : null,
        provider: r.provider ? String(r.provider) : null,
        receivedAt: String(r.received_at),
        hasParsedTradelines: tls.length > 0,
        tradelineCount: tls.length,
        scoreCount: sc.length,
      };
    }),
    letterPdfs: letters
      .filter((l: Record<string, unknown>) => l.pdf_blob_ref)
      .map((l: Record<string, unknown>) => ({
        id: String(l.id),
        title: String(l.title),
        filename: l.pdf_filename ? String(l.pdf_filename) : null,
        status: l.status ? String(l.status) : null,
      })),
  };

  const mlCtx = buildPartnerMlContext({
    partner,
    readiness: {
      readinessScore: readiness.score,
      blockers: readiness.blockers,
      journeySignals: signals,
    },
    reportCount,
    evidenceCount,
    letterCount,
  });
  const mlAdvisory = args.includeMl === false
    ? {
        partnerId,
        generatedAt: new Date().toISOString(),
        model: 'skipped',
        readinessScore: readiness.score,
        executiveSummary: '',
        topPriorities: [],
        suggestions: [],
      }
    : await buildPartnerMlAdvisory(mlCtx);

  const underwritingPacketV2 = buildUnderwritingPacketV2({
    partner,
    readinessScore: readiness.score,
    blockers: readiness.blockers,
    reportCount,
    letterCount,
    evidenceCount,
  });

  const nextSteps = buildNextSteps({ creditProgram, ml: mlAdvisory, readiness, credit, disputes });
  const resultsSummary = buildResultsSummary({ readiness, credit, disputes, creditProgram, ml: mlAdvisory });

  const mailing = (profile.mailingAddress ?? profile.mailing_address) as Record<string, unknown> | undefined;

  return {
    version: 5,
    exportId: args.exportId ?? `dossier_${partnerId}_${Date.now()}`,
    partnerId,
    externalId: partner.import_external_id ? String(partner.import_external_id) : null,
    exportedAt: new Date().toISOString(),
    identity: {
      fullName: (profile.fullName ?? profile.full_name ?? null) as string | null,
      email: (profile.email ?? null) as string | null,
      phone: (profile.phone ?? null) as string | null,
      primaryRoute: partner.primary_route ? String(partner.primary_route) : null,
      lane: partner.lane ? String(partner.lane) : null,
      journeyStage: partner.journey_stage ? String(partner.journey_stage) : null,
      fundingStage: readiness.fundingStage,
      mailingAddress: mailing
        ? {
            line1: (mailing.line1 ?? mailing.addressLine1 ?? null) as string | null,
            city: (mailing.city ?? null) as string | null,
            state: (mailing.state ?? null) as string | null,
            postalCode: (mailing.postalCode ?? mailing.zip ?? null) as string | null,
          }
        : undefined,
    },
    readiness: {
      score: readiness.score,
      ready: readiness.ready,
      blockers: readiness.blockers,
      verdict: readiness.verdict,
    },
    creditProgram,
    credit,
    disputes,
    debt,
    evidence: evidenceSection,
    documents,
    mlAdvisory,
    nextSteps,
    resultsSummary,
    underwritingPacketV2,
  };
}
