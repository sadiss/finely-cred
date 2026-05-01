import type { Partner } from '../domain/partners';

export type PartnerOverallScoreCategoryKey =
  | 'sharedIdentity'
  | 'consents'
  | 'personalProfile'
  | 'businessProfile'
  | 'financial'
  | 'executionReadiness';

export type PartnerOverallScoreCounts = {
  reports?: number;
  evidence?: number;
  tasksOpen?: number;
  tasksDone?: number;
  casesOpen?: number;
  lettersGenerated?: number;
};

export type PartnerOverallScoreCategory = {
  key: PartnerOverallScoreCategoryKey;
  label: string;
  weightPct: number;
  score: number; // 0–100
  missing: string[];
};

export type PartnerOverallScoreAction = {
  key: string;
  title: string;
  desc: string;
  /** Best-effort route suggestion for the CTA. */
  path?: string;
  severity?: 'info' | 'warn';
};

export type PartnerOverallScoreResult = {
  overall: number; // 0–100
  categories: PartnerOverallScoreCategory[];
  topActions: PartnerOverallScoreAction[];
};

function safeCount(n: any) {
  const x = Number(n ?? 0);
  return Number.isFinite(x) && x > 0 ? x : 0;
}

function clamp01(x: number) {
  if (!Number.isFinite(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function pct(x01: number) {
  return Math.round(clamp01(x01) * 100);
}

function hasText(v: any) {
  return String(v ?? '').trim().length > 0;
}

function scoreFromFields(args: { required: Array<{ label: string; ok: boolean }>; optional?: Array<{ label: string; ok: boolean; bonusPct?: number }> }) {
  const missing: string[] = [];
  const req = args.required;
  const total = Math.max(1, req.length);
  const have = req.filter((x) => Boolean(x.ok)).length;
  for (const r of req) if (!r.ok) missing.push(r.label);

  let score = pct(have / total);
  for (const o of args.optional ?? []) {
    if (!o.ok) continue;
    score += Math.max(0, Math.round(o.bonusPct ?? 5));
  }
  score = Math.min(100, Math.max(0, score));
  return { score, missing };
}

function normalizedWeights(args: { personalApplies: boolean; businessApplies: boolean }) {
  const base: Record<PartnerOverallScoreCategoryKey, number> = {
    sharedIdentity: 10,
    consents: 10,
    personalProfile: args.personalApplies ? 20 : 0,
    businessProfile: args.businessApplies ? 20 : 0,
    financial: 10,
    executionReadiness: 30,
  };
  const sum = Object.values(base).reduce((a, b) => a + b, 0) || 1;
  const norm: Record<PartnerOverallScoreCategoryKey, number> = { ...base } as any;
  for (const k of Object.keys(base) as PartnerOverallScoreCategoryKey[]) norm[k] = base[k] / sum;
  return norm;
}

function roundWeightsTo100(raw: Record<PartnerOverallScoreCategoryKey, number>): Record<PartnerOverallScoreCategoryKey, number> {
  const keys = Object.keys(raw) as PartnerOverallScoreCategoryKey[];
  const out: Record<PartnerOverallScoreCategoryKey, number> = { ...raw } as any;
  let total = 0;
  for (const k of keys) {
    out[k] = Math.round(raw[k] * 100);
    total += out[k];
  }
  const diff = 100 - total;
  if (diff !== 0) {
    const last = keys[keys.length - 1]!;
    out[last] = out[last] + diff;
  }
  return out;
}

function routeApplicability(partner: Partner) {
  const routes = partner.routes ?? ({} as any);
  const personalApplies = Boolean(routes.personal_restore || routes.personal_build);
  const businessApplies = Boolean(routes.business_build);
  return { personalApplies, businessApplies };
}

export function computePartnerOverallScore(args: {
  partner: Partner;
  counts?: PartnerOverallScoreCounts;
}): PartnerOverallScoreResult {
  const { partner } = args;
  const counts = args.counts ?? {};
  const { personalApplies, businessApplies } = routeApplicability(partner);

  const weights01 = normalizedWeights({ personalApplies, businessApplies });
  const weightsPct = roundWeightsTo100(weights01);

  const identity = scoreFromFields({
    required: [
      { label: 'Full name', ok: hasText(partner.profile?.fullName) },
      { label: 'Email', ok: hasText(partner.profile?.email) },
      { label: 'Phone', ok: hasText(partner.profile?.phone) },
    ],
  });

  const consents = (() => {
    const c: any = partner.consents ?? {};
    return scoreFromFields({
      required: [
        { label: 'Terms accepted', ok: hasText(c.termsAcceptedAt) },
        { label: 'Privacy accepted', ok: hasText(c.privacyAcceptedAt) },
        { label: 'Disclaimer accepted', ok: hasText(c.disclaimerAcceptedAt) },
      ],
      optional: [
        { label: 'Report upload consent', ok: hasText(c.reportUploadConsentAt), bonusPct: 4 },
        { label: 'eSign consent', ok: hasText(c.eSignConsentAt), bonusPct: 4 },
        { label: 'Communication consent', ok: hasText(c.communicationConsentAt), bonusPct: 3 },
      ],
    });
  })();

  const personal = (() => {
    if (!personalApplies) return { score: 0, missing: [] as string[] };
    const r: any = partner.routes?.[partner.primaryRoute || 'personal_restore'] ?? {};
    const p: any = r.personal ?? {};
    return scoreFromFields({
      required: [
        { label: 'Mailing address', ok: hasText(p.address1) },
        { label: 'City', ok: hasText(p.city) },
        { label: 'State', ok: hasText(p.state) },
        { label: 'ZIP / postal code', ok: hasText(p.postalCode) },
      ],
      optional: [
        { label: 'DOB provided', ok: hasText(p.dob), bonusPct: 4 },
        // PII-safe: presence only
        { label: 'SSN last 4 provided', ok: hasText(p.ssnLast4), bonusPct: 4 },
      ],
    });
  })();

  const business = (() => {
    if (!businessApplies) return { score: 0, missing: [] as string[] };
    const r: any = partner.routes?.business_build ?? {};
    const b: any = r.business ?? {};
    return scoreFromFields({
      required: [
        { label: 'Business legal name', ok: hasText(b.businessName) },
        { label: 'Entity state', ok: hasText(b.entityState) },
        { label: 'EIN last 4', ok: hasText(b.einLast4) },
        { label: 'NAICS', ok: hasText(b.naics) },
      ],
    });
  })();

  const financial = (() => {
    const f: any = partner.financial ?? {};
    return scoreFromFields({
      required: [
        { label: 'Annual income', ok: Number.isFinite(Number(f.annualIncome)) && Number(f.annualIncome) > 0 },
        { label: 'Monthly debt payments', ok: Number.isFinite(Number(f.monthlyDebtPayments)) && Number(f.monthlyDebtPayments) > 0 },
        { label: 'Monthly housing', ok: Number.isFinite(Number(f.monthlyHousing)) && Number(f.monthlyHousing) > 0 },
      ],
    });
  })();

  const execution = (() => {
    const reports = safeCount(counts.reports);
    const evidence = safeCount(counts.evidence);
    const tasksOpen = safeCount(counts.tasksOpen);
    const tasksDone = safeCount(counts.tasksDone);
    const casesOpen = safeCount(counts.casesOpen);
    const lettersGenerated = safeCount(counts.lettersGenerated);

    const missing: string[] = [];
    if (reports === 0) missing.push('Upload a credit report');
    if (evidence === 0) missing.push('Add evidence/documents');
    if (tasksOpen > 0) missing.push('Complete open tasks');
    if (casesOpen === 0) missing.push('Open your first case');
    if (lettersGenerated === 0) missing.push('Generate your first letter');

    const taskTotal = tasksOpen + tasksDone;
    const tasksScore = taskTotal > 0 ? pct(tasksDone / taskTotal) : 0;

    const milestoneScore = (ok: boolean) => (ok ? 100 : 0);
    const score =
      0.2 * milestoneScore(reports > 0) +
      0.2 * milestoneScore(evidence > 0) +
      0.2 * tasksScore +
      0.2 * milestoneScore(casesOpen > 0) +
      0.2 * milestoneScore(lettersGenerated > 0);

    return { score: Math.round(score), missing };
  })();

  const categories: PartnerOverallScoreCategory[] = [
    { key: 'sharedIdentity', label: 'Shared identity', weightPct: weightsPct.sharedIdentity, score: identity.score, missing: identity.missing },
    { key: 'consents', label: 'Consents', weightPct: weightsPct.consents, score: consents.score, missing: consents.missing },
    ...(personalApplies
      ? [{ key: 'personalProfile' as const, label: 'Personal profile', weightPct: weightsPct.personalProfile, score: personal.score, missing: personal.missing }]
      : []),
    ...(businessApplies
      ? [{ key: 'businessProfile' as const, label: 'Business profile', weightPct: weightsPct.businessProfile, score: business.score, missing: business.missing }]
      : []),
    { key: 'financial', label: 'Financial basics', weightPct: weightsPct.financial, score: financial.score, missing: financial.missing },
    { key: 'executionReadiness', label: 'Execution readiness', weightPct: weightsPct.executionReadiness, score: execution.score, missing: execution.missing },
  ];

  const overall01 =
    weights01.sharedIdentity * (identity.score / 100) +
    weights01.consents * (consents.score / 100) +
    weights01.personalProfile * (personalApplies ? personal.score / 100 : 0) +
    weights01.businessProfile * (businessApplies ? business.score / 100 : 0) +
    weights01.financial * (financial.score / 100) +
    weights01.executionReadiness * (execution.score / 100);

  const overall = Math.round(clamp01(overall01) * 100);

  const topActions: PartnerOverallScoreAction[] = (() => {
    const out: PartnerOverallScoreAction[] = [];
    const add = (a: PartnerOverallScoreAction) => {
      if (out.some((x) => x.key === a.key)) return;
      out.push(a);
    };

    if (identity.missing.length) {
      add({
        key: 'fix_identity',
        title: 'Complete your base identity',
        desc: identity.missing.join(' • '),
        path: '/portal/billing',
        severity: 'warn',
      });
    }
    if (consents.missing.length) {
      add({
        key: 'fix_consents',
        title: 'Complete required consents',
        desc: consents.missing.join(' • '),
        path: '/onboarding',
      });
    }
    if (personalApplies && personal.missing.length) {
      add({
        key: 'fix_personal_profile',
        title: 'Finish your mailing address',
        desc: 'Add/confirm your mailing address so letters auto-fill correctly.',
        path: '/portal/billing',
        severity: 'warn',
      });
    }
    if (businessApplies && business.missing.length) {
      add({
        key: 'fix_business_profile',
        title: 'Complete your business profile',
        desc: business.missing.join(' • '),
        path: '/business/profile',
      });
    }
    if (financial.missing.length) {
      add({
        key: 'fix_financial',
        title: 'Add financial basics',
        desc: financial.missing.join(' • '),
        path: '/portal/billing',
      });
    }

    const reports = safeCount(counts.reports);
    const evidence = safeCount(counts.evidence);
    const tasksOpen = safeCount(counts.tasksOpen);
    const casesOpen = safeCount(counts.casesOpen);
    const lettersGenerated = safeCount(counts.lettersGenerated);

    if (reports === 0) add({ key: 'upload_report', title: 'Upload your first credit report', desc: 'This unlocks analysis and dispute candidates.', path: '/portal/reports', severity: 'warn' });
    if (evidence === 0) add({ key: 'add_evidence', title: 'Add evidence/documents', desc: 'Save screenshots and documents to support your disputes.', path: '/portal/documents' });
    if (casesOpen === 0 && reports > 0) add({ key: 'open_case', title: 'Open your first dispute case', desc: 'Track rounds and keep your workflow organized.', path: '/portal/disputes' });
    if (lettersGenerated === 0 && (casesOpen > 0 || reports > 0)) add({ key: 'generate_letter', title: 'Generate your first letter', desc: 'Create a print-ready PDF and save it to your Letters Vault.', path: '/portal/letters' });
    if (tasksOpen > 0) add({ key: 'finish_tasks', title: 'Complete open tasks', desc: `${tasksOpen} task${tasksOpen === 1 ? '' : 's'} in your queue`, path: '/portal/tasks' });

    return out.slice(0, 6);
  })();

  return { overall, categories, topActions };
}

