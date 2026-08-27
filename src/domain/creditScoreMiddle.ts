import type { Bureau, ParsedScore } from './creditReports';

export type MiddleScoreResult = {
  value: number | null;
  bureauCount: 0 | 1 | 2 | 3;
  bureaus: Array<{ bureau: string; value: number; model: string }>;
  modelLabel: string;
  confidence: 'high' | 'low';
  method: 'median3' | 'lower_of_2' | 'single' | 'none';
  label: string;
};

const BUREAUS: Bureau[] = ['TUC', 'EXP', 'EQF'];

const MORTGAGE_MODEL_PATTERNS: Record<Bureau, RegExp> = {
  EXP: /fico\s*2/i,
  TUC: /fico\s*4/i,
  EQF: /fico\s*5/i,
};

const FICO_8_PATTERN = /fico\s*8/i;
const FICO_PATTERN = /fico/i;
const VANTAGE_PATTERN = /vantage/i;

function isValidScore(value: number): boolean {
  return value >= 300 && value <= 850;
}

type ModelFamily = 'mortgage' | 'fico8' | 'fico' | 'vantage' | 'other';

function modelFamily(model: string): ModelFamily {
  if (/fico\s*2/i.test(model) || /fico\s*4/i.test(model) || /fico\s*5/i.test(model)) return 'mortgage';
  if (FICO_8_PATTERN.test(model)) return 'fico8';
  if (FICO_PATTERN.test(model)) return 'fico';
  if (VANTAGE_PATTERN.test(model)) return 'vantage';
  return 'other';
}

function displayModelLabel(family: ModelFamily, model: string): string {
  if (family === 'mortgage') return 'Mortgage FICO';
  if (family === 'fico8') return 'FICO 8';
  if (family === 'fico') return model.trim() || 'FICO';
  if (family === 'vantage') return model.trim() || 'Vantage';
  return model.trim() || 'Score';
}

function pickScoreForBureau(
  scores: ParsedScore[],
  bureau: Bureau,
  prefer: 'mortgage' | 'fico8' | 'any',
): ParsedScore | null {
  const pool = scores.filter((s) => s.bureau === bureau && isValidScore(s.value));
  if (!pool.length) return null;

  if (prefer === 'mortgage') {
    const mortgage = pool.find((s) => MORTGAGE_MODEL_PATTERNS[bureau].test(s.model));
    if (mortgage) return mortgage;
  }

  const fico8 = pool.find((s) => FICO_8_PATTERN.test(s.model));
  if (fico8) return fico8;

  const anyFico = pool.find((s) => FICO_PATTERN.test(s.model));
  if (anyFico) return anyFico;

  const vantage = pool.find((s) => VANTAGE_PATTERN.test(s.model));
  if (vantage) return vantage;

  return pool[0];
}

function emptyResult(): MiddleScoreResult {
  return {
    value: null,
    bureauCount: 0,
    bureaus: [],
    modelLabel: '—',
    confidence: 'low',
    method: 'none',
    label: 'No bureau scores on this report',
  };
}

function bureauCoverageLabel(count: 1 | 2 | 3): string {
  if (count === 3) return 'all three bureaus';
  if (count === 2) return '2 bureaus — showing the lower';
  return '1 bureau only';
}

/** Live tiles use mortgage models (FICO 2/4/5) when present, then FICO 8. */
export const MIDDLE_SCORE_PREFER: 'mortgage' | 'fico8' | 'any' = 'mortgage';

export function computeMiddleScore(
  scores: ParsedScore[],
  prefer: 'mortgage' | 'fico8' | 'any' = MIDDLE_SCORE_PREFER,
): MiddleScoreResult {
  const valid = scores.filter((s) => isValidScore(s.value));
  if (!valid.length) return emptyResult();

  const picked: Array<{ bureau: Bureau; score: ParsedScore; family: ModelFamily }> = [];
  for (const bureau of BUREAUS) {
    const score = pickScoreForBureau(valid, bureau, prefer);
    if (score) {
      picked.push({ bureau, score, family: modelFamily(score.model) });
    }
  }

  const bureauCount = picked.length as 0 | 1 | 2 | 3;
  if (bureauCount === 0) return emptyResult();

  const bureaus = picked.map(({ bureau, score }) => ({
    bureau,
    value: score.value,
    model: score.model,
  }));

  const families = picked.map((p) => p.family);
  const allSameFamily = families.every((f) => f === families[0]);
  const primaryFamily = families[0];
  const modelLabel =
    bureauCount === 3 && allSameFamily
      ? displayModelLabel(primaryFamily, picked[0].score.model)
      : bureauCount === 3
        ? 'mixed'
        : displayModelLabel(primaryFamily, picked[0].score.model);

  if (bureauCount === 3) {
    const sorted = [...bureaus].sort((a, b) => a.value - b.value);
    const value = sorted[1].value;
    const confidence: 'high' | 'low' = allSameFamily ? 'high' : 'low';
    const coverage = bureauCoverageLabel(3);
    const label =
      confidence === 'high'
        ? `Middle score ${value} · ${modelLabel} · ${coverage}`
        : `Middle score ${value} · ${modelLabel} · ${coverage} (mixed models)`;
    return {
      value,
      bureauCount: 3,
      bureaus,
      modelLabel,
      confidence,
      method: 'median3',
      label,
    };
  }

  if (bureauCount === 2) {
    const lower = bureaus.reduce((min, b) => (b.value < min.value ? b : min), bureaus[0]);
    const coverage = bureauCoverageLabel(2);
    return {
      value: lower.value,
      bureauCount: 2,
      bureaus,
      modelLabel: allSameFamily ? modelLabel : 'mixed',
      confidence: 'low',
      method: 'lower_of_2',
      label: `Middle score ${lower.value} · ${modelLabel} · ${coverage}`,
    };
  }

  const single = bureaus[0];
  const singleModelLabel = displayModelLabel(modelFamily(single.model), single.model);
  const coverage = bureauCoverageLabel(1);
  return {
    value: single.value,
    bureauCount: 1,
    bureaus,
    modelLabel: singleModelLabel,
    confidence: 'low',
    method: 'single',
    label: `Middle score ${single.value} · ${singleModelLabel} · ${coverage}`,
  };
}

export function computeJointMiddle(a: MiddleScoreResult, b: MiddleScoreResult): MiddleScoreResult {
  if (a.value == null && b.value == null) return emptyResult();
  if (a.value == null) {
    return {
      ...b,
      confidence: 'low',
      label: `Joint — ${b.label}`,
    };
  }
  if (b.value == null) {
    return {
      ...a,
      confidence: 'low',
      label: `Joint — ${a.label}`,
    };
  }

  const value = Math.min(a.value, b.value);
  const bureauCount = Math.min(a.bureauCount, b.bureauCount) as 0 | 1 | 2 | 3;
  const modelLabel = a.modelLabel === b.modelLabel ? a.modelLabel : 'mixed';
  const bothHigh = a.confidence === 'high' && b.confidence === 'high' && modelLabel !== 'mixed';
  const confidence: 'high' | 'low' = bothHigh ? 'high' : 'low';

  return {
    value,
    bureauCount,
    bureaus: [...a.bureaus, ...b.bureaus],
    modelLabel,
    confidence,
    method: 'lower_of_2',
    label: `Joint middle score ${value} · lower of two partners · ${modelLabel}`,
  };
}
