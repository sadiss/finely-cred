#!/usr/bin/env node
/**
 * Dispute track purity audit — Validation must never surface court work.
 *
 * Runs the real suggestion engine and catalog classifiers (behaviour, not string matching), so a
 * regression on the Validation / Court / post-court lanes fails here instead of in production.
 * Loads app modules through Vite so `?raw` template imports resolve the same way they do at runtime.
 *
 * Usage: npm run dispute:track:audit
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

let failed = 0;
function check(label, ok, detail) {
  console.log(`${ok ? '✓' : '✗'} ${label}${ok || !detail ? '' : ` — ${detail}`}`);
  if (!ok) failed += 1;
}

function debtCase(overrides) {
  return {
    id: 'debt_audit',
    partnerId: 'partner_audit',
    type: 'debt',
    name: 'Midland Credit Management',
    amountCents: 480000,
    status: 'open',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

console.log('Finely Cred — dispute track purity audit\n');

const server = await createServer({
  configFile: false,
  root,
  logLevel: 'error',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false },
});

try {
  const labels = await server.ssrLoadModule('/src/lib/letterProductLabels.ts');
  const catalog = await server.ssrLoadModule('/src/legal/debtLetterCatalog.ts');
  const engine = await server.ssrLoadModule('/src/lib/intelligentLetterSuggestions.ts');

  const {
    COURT_PRODUCT_KINDS,
    classifyLetterProduct,
    isCourtTrackLetter,
    isValidationTrackLetter,
  } = labels;
  const { DEBT_LETTER_CATALOG, letterCatalogPool } = catalog;
  const { buildIntelligentLetterSuggestions } = engine;

  const courtKinds = new Set(COURT_PRODUCT_KINDS);
  const isCourtEntry = (e) =>
    isCourtTrackLetter({ letterType: e.letterType, catalogId: e.id, category: e.category });
  const courtLeaks = (suggestions) =>
    suggestions.all.filter((s) => {
      const kind = classifyLetterProduct({ letterType: s.letterType, catalogId: s.catalogId });
      return courtKinds.has(kind) || isCourtTrackLetter({ letterType: s.letterType, catalogId: s.catalogId });
    });
  const leakNames = (suggestions) =>
    courtLeaks(suggestions)
      .map((s) => s.catalogId || s.letterType)
      .join(', ');

  // 1. Validation track on a summons case: validation letters only + Court cross-link.
  const summons = debtCase({
    type: 'summons',
    courtCaseNumber: '26-1234-GC',
    dateServed: '2026-07-01',
    hearingDate: '2026-08-20',
  });
  const validationOnSummons = buildIntelligentLetterSuggestions({ track: 'validation', debt: summons });
  check(
    'Validation + summons case → no affidavits / answers / discovery',
    courtLeaks(validationOnSummons).length === 0,
    leakNames(validationOnSummons),
  );
  check(
    'Validation + summons case → primary is a validation letter',
    validationOnSummons.primary.productKind === 'validation_letter',
    validationOnSummons.primary.productKind,
  );
  check(
    'Validation + summons case → cross-links to Court instead of swapping letters',
    validationOnSummons.crossLink?.track === 'litigation',
    validationOnSummons.crossLink?.track ?? 'none',
  );

  // 2. Validation track past the answer deadline (that scenario recommends affidavits).
  const pastDeadline = buildIntelligentLetterSuggestions({
    track: 'validation',
    debt: summons,
    recommendedScenario: 'post_35_days',
  });
  check(
    'Validation + past answer deadline → still validation only',
    courtLeaks(pastDeadline).length === 0,
    leakNames(pastDeadline),
  );

  // 3. Validation track on a plain collection account.
  const plain = buildIntelligentLetterSuggestions({
    track: 'validation',
    debt: debtCase({ firstContactDate: '2026-07-20' }),
  });
  check('Validation + collection account → no court products', courtLeaks(plain).length === 0, leakNames(plain));
  check('Validation + collection account → no Court cross-link', !plain.crossLink, plain.crossLink?.track ?? '');

  // 4. Litigation track still produces court work.
  const litigation = buildIntelligentLetterSuggestions({
    track: 'litigation',
    debt: summons,
    recommendedScenario: 'summons_served',
  });
  check(
    'Litigation track → court products present',
    litigation.all.some((s) =>
      courtKinds.has(classifyLetterProduct({ letterType: s.letterType, catalogId: s.catalogId })),
    ),
  );
  check('Litigation track → primary generates a real letter (never a UI kit)', !litigation.primary.uiOnly);

  // 5. Litigation track with no lawsuit → cross-link back to Validation.
  const litigationNoSuit = buildIntelligentLetterSuggestions({
    track: 'litigation',
    debt: debtCase({ firstContactDate: '2026-07-20' }),
  });
  check(
    'Litigation track without a lawsuit → cross-links to Validation',
    litigationNoSuit.crossLink?.track === 'validation',
    litigationNoSuit.crossLink?.track ?? 'none',
  );

  // 6. Decided matter → plan compliance, never "answer the lawsuit".
  const decided = buildIntelligentLetterSuggestions({
    track: 'litigation',
    debt: debtCase({ ...summons, status: 'resolved' }),
    courtOutcome: {
      kind: 'payment_plan',
      verdictSummary: 'Pay $50 per month for 24 months',
      writtenOrderOnFile: true,
      plan: { monthlyCents: 5000, termMonths: 24 },
    },
  });
  check('Decided matter → postCourt flag set', decided.postCourt === true);
  check(
    'Decided matter → headline is plan compliance, not a lawsuit answer',
    !/answer/i.test(decided.headline),
    decided.headline,
  );
  check(
    'Decided matter → primary is not a court answer',
    !/written_answer|summons_response/.test(String(decided.primary.catalogId || decided.primary.letterType)),
    String(decided.primary.catalogId || decided.primary.letterType),
  );

  // 7. Catalog pools: Validation lane excludes court families; Court lane keeps all of its own.
  const validationPool = letterCatalogPool({
    categories: ['validation', 'negotiation', 'reporting'],
    hub: 'debt',
    filter: (e) => isValidationTrackLetter({ letterType: e.letterType, catalogId: e.id, category: e.category }),
  });
  check('Validation catalog pool is non-empty', validationPool.length > 0, String(validationPool.length));
  check(
    'Validation catalog pool has zero court entries',
    validationPool.every((e) => !isCourtEntry(e)),
    validationPool
      .filter(isCourtEntry)
      .map((e) => e.id)
      .join(', '),
  );
  check(
    'Validation catalog pool keeps the round 2 / round 3 escalation letters',
    ['validation_round2_deficiency', 'validation_round3_final'].every((id) =>
      validationPool.some((e) => e.id === id),
    ),
  );
  const litigationValidationPool = letterCatalogPool({
    categories: ['validation'],
    hub: 'debt',
    filter: (e) =>
      isValidationTrackLetter({
        letterType: e.letterType,
        catalogId: e.id,
        category: e.category,
        caseIsLitigation: true,
      }),
  });
  check(
    'Post-suit validation is gated behind a live lawsuit',
    !validationPool.some((e) => e.id === 'validation_mini_miranda_suit') &&
      litigationValidationPool.some((e) => e.id === 'validation_mini_miranda_suit'),
  );

  const courtPool = letterCatalogPool({
    categories: ['court', 'securitization'],
    filter: isCourtEntry,
  });
  const courtTotal = DEBT_LETTER_CATALOG.filter(
    (e) => e.category === 'court' || e.category === 'securitization',
  ).length;
  check(
    'Court catalog pool keeps every court + securitization entry',
    courtPool.length === courtTotal,
    `${courtPool.length} of ${courtTotal}`,
  );
} finally {
  await server.close();
}

if (failed) {
  console.error(`\n${failed} dispute track violation(s).`);
  process.exit(1);
}

console.log('\nDispute track purity audit pass.');
