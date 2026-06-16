// Shared ML advisory engine for Nora Capital Group partner API v4.

export type PartnerMlContext = {
  partnerId: string;
  fullName: string | null;
  email: string | null;
  journeyStage: string | null;
  fundingStage: string | null;
  readinessScore: number;
  blockers: string[];
  journeySignals: Record<string, unknown>;
  reportCount: number;
  evidenceCount: number;
  letterCount: number;
};

export type MlSuggestion = {
  id: string;
  category: 'dispute' | 'funding' | 'business_credit' | 'debt' | 'identity' | 'ops' | 'compliance';
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  summary: string;
  rationale: string;
  detailedSteps: string[];
  expectedImpact: string;
  timeframe: string;
  confidence: number;
  relatedStatutes?: string[];
  riskFlags?: string[];
};

export type MlAdvisoryPayload = {
  partnerId: string;
  generatedAt: string;
  model: string;
  readinessScore: number;
  executiveSummary: string;
  topPriorities: string[];
  suggestions: MlSuggestion[];
  fundingPath?: {
    currentStage: string;
    nextMilestone: string;
    sequence: string[];
    estimatedWeeks: number;
  };
  disputeStrategy?: {
    recommendedRound: number;
    focusAreas: string[];
    letterDiscipline: string[];
  };
};

function heuristicSuggestions(ctx: PartnerMlContext): MlAdvisoryPayload {
  const suggestions: MlSuggestion[] = [];

  if (ctx.reportCount === 0) {
    suggestions.push({
      id: 'upload-report',
      category: 'ops',
      priority: 'critical',
      title: 'Upload a tri-bureau credit report immediately',
      summary: 'No report is on file — every downstream dispute, funding, and readiness score depends on a current PDF export.',
      rationale:
        'Underwriters and bureau dispute workflows require a single source of truth. Without a report, readiness scoring is capped and NCG cannot validate tradeline accuracy or inquiry load.',
      detailedSteps: [
        'Pull fresh reports from AnnualCreditReport.com or your monitoring service (same-day preferred).',
        'Upload the full PDF to Documents — do not crop bureau sections.',
        'Tag the upload with pull date and confirm all three bureaus are present if available.',
        'Run OCR / tradeline extraction and verify account last-4 digits match your records.',
      ],
      expectedImpact: 'Unlocks dispute item selection, evidence linking, and accurate readiness scoring (+15–25 points).',
      timeframe: '1–3 days',
      confidence: 0.97,
    });
  }

  if (ctx.letterCount === 0 && ctx.reportCount > 0) {
    suggestions.push({
      id: 'round-one-letter',
      category: 'dispute',
      priority: 'high',
      title: 'Launch Round 1 — one tradeline, one clean inaccuracy claim',
      summary: 'Reports exist but no dispute letters have been mailed. Start with the highest-impact negative using evidence-first structure.',
      rationale:
        'FCRA §1681i requires bureaus to reinvestigate within 30 days. A disciplined Round 1 with certified mail creates a paper trail that Round 2 can tighten using bureau responses.',
      detailedSteps: [
        'Select ONE negative tradeline with an internal Metro2 contradiction (status vs payment grid, balance vs limit, DOFD drift).',
        'Screenshot conflicting fields and store as Exhibit A in Evidence Vault.',
        'Draft letter: identity block, bureau address, numbered factual reasons tied to exhibits — no emotional language.',
        'Mail USPS Certified with Return Receipt; log sent date and set day-35 follow-up task.',
      ],
      expectedImpact: 'Establishes FCRA timeline; potential deletion/correction on verified inaccuracies.',
      timeframe: '30–45 days per round',
      confidence: 0.88,
      relatedStatutes: ['15 U.S.C. § 1681i', '15 U.S.C. § 1681s-2(a)(1)(A)'],
    });
  }

  if (ctx.evidenceCount < 3 && ctx.reportCount > 0) {
    suggestions.push({
      id: 'evidence-pack',
      category: 'dispute',
      priority: 'high',
      title: 'Build minimum evidence pack before next mail date',
      summary: `${ctx.evidenceCount} evidence item(s) on file — disputes without exhibits lose at OCR and reinvestigation stages.`,
      rationale:
        'Bureau OCR flags shotgun disputes. Each letter should reference labeled exhibits that prove one specific factual inconsistency.',
      detailedSteps: [
        'Capture ID front/back and proof of address (utility bill ≤ 90 days).',
        'For each targeted tradeline: screenshot full account panel + payment history grid.',
        'Label files Exhibit A, B, C and reference them in the letter body.',
        'Link each exhibit to the dispute project in the portal Tasks board.',
      ],
      expectedImpact: 'Improves verification win rate and method-of-verification follow-up quality.',
      timeframe: '3–7 days',
      confidence: 0.91,
    });
  }

  const fundingStage = (ctx.fundingStage || 'not_ready').toLowerCase();
  if (fundingStage === 'not_ready' || fundingStage === 'blocked') {
    suggestions.push({
      id: 'funding-sequence',
      category: 'funding',
      priority: 'medium',
      title: 'Sequence funding after file hygiene — not before',
      summary: 'Applying while active disputes or high utilization are unresolved typically yields declines and inquiry damage.',
      rationale:
        'Funders bucket inquiry counts at 6 and 12 months. A premature pull stacks hard inquiries without approval odds.',
      detailedSteps: [
        'Stabilize utilization below 30% on revolving lines where possible without paying charge-offs as first strategy.',
        'Complete at least one dispute round on the highest-score-impact negative.',
        'Document inquiry ledger: date, bureau, product, result, next eligible re-apply date.',
        'When readiness ≥ 70, submit funding intent through NCG with evidence manifest attached.',
      ],
      expectedImpact: 'Higher approval probability; fewer wasted hard inquiries.',
      timeframe: '6–12 weeks',
      confidence: 0.85,
    });
  }

  suggestions.push({
    id: 'business-credit-ladder',
    category: 'business_credit',
    priority: 'medium',
    title: 'Stand up business credit ladder in parallel (entity + EIN hygiene)',
    summary: 'Personal restore and business tradeline depth are separate tracks — sequence Net-30 vendors after entity documentation is clean.',
    rationale:
      'Paydex and Intelliscore weight primary business tradelines and vendor reporting tiers differently from AU personal history.',
    detailedSteps: [
      'Confirm EIN, entity name, and address consistency across Secretary of State and IRS records.',
      'Open tier-1 Net-30 vendor that reports to business bureaus; pay early for Paydex optimization.',
      'Keep business inquiries spaced — align with personal inquiry budget.',
    ],
    expectedImpact: 'Business funding readiness independent of personal file repair.',
    timeframe: '8–16 weeks',
    confidence: 0.82,
  });

  const topPriorities = suggestions
    .sort((a, b) => {
      const rank = { critical: 0, high: 1, medium: 2, low: 3 };
      return rank[a.priority] - rank[b.priority];
    })
    .slice(0, 4)
    .map((s) => s.title);

  return {
    partnerId: ctx.partnerId,
    generatedAt: new Date().toISOString(),
    model: 'finely-heuristic-v4',
    readinessScore: ctx.readinessScore,
    executiveSummary: `${ctx.fullName ?? 'Partner'} is at readiness ${ctx.readinessScore}/100 with ${ctx.blockers.length} blocker(s). ${
      ctx.reportCount === 0
        ? 'Immediate priority: upload tri-bureau report.'
        : ctx.letterCount === 0
          ? 'Reports on file — initiate evidence-linked Round 1 dispute.'
          : 'Continue round discipline and attach bureau responses to the same project.'
    } Funding stage: ${ctx.fundingStage ?? 'not_ready'}.`,
    topPriorities,
    suggestions,
    fundingPath: {
      currentStage: ctx.fundingStage ?? 'not_ready',
      nextMilestone: ctx.readinessScore >= 70 ? 'Submit NCG funding intent with manifest' : 'Reach readiness 70+ with report + Round 1 mailed',
      sequence: [
        'Report upload + tradeline audit',
        'Evidence pack + Round 1 certified mail',
        'Bureau response review + Round 2 if needed',
        'Inquiry budget clear → funding application',
        'Business vendor ladder (parallel track)',
      ],
      estimatedWeeks: ctx.readinessScore >= 70 ? 4 : 12,
    },
    disputeStrategy: {
      recommendedRound: ctx.letterCount > 0 ? 2 : 1,
      focusAreas: ctx.blockers.length ? ctx.blockers : ['Metro2 internal contradictions', 'Method of verification requests'],
      letterDiscipline: [
        'One tradeline per letter',
        'Certified mail only for serious inaccuracies',
        'Never recycle same reason code in Round 2',
      ],
    },
  };
}

async function callOpenAiAdvisory(apiKey: string, ctx: PartnerMlContext): Promise<MlAdvisoryPayload | null> {
  const system = `You are Nora Capital Group's senior underwriting ML advisor for Finely Cred partners.
Return JSON only matching this schema:
{
  "executiveSummary": string (3-4 sentences, specific to partner data),
  "topPriorities": string[] (max 5),
  "suggestions": [{
    "id": string,
    "category": "dispute"|"funding"|"business_credit"|"debt"|"identity"|"ops"|"compliance",
    "priority": "critical"|"high"|"medium"|"low",
    "title": string,
    "summary": string (1-2 sentences),
    "rationale": string (detailed paragraph),
    "detailedSteps": string[] (4-6 actionable steps),
    "expectedImpact": string,
    "timeframe": string,
    "confidence": number (0-1),
    "relatedStatutes": string[] (optional),
    "riskFlags": string[] (optional)
  }],
  "fundingPath": { "currentStage": string, "nextMilestone": string, "sequence": string[], "estimatedWeeks": number },
  "disputeStrategy": { "recommendedRound": number, "focusAreas": string[], "letterDiscipline": string[] }
}
Be descriptive, specific, and compliance-safe. No outcome guarantees. Reference FCRA/FDCPA where relevant.`;

  const user = JSON.stringify(ctx, null, 2);

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini',
      temperature: 0.35,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content ?? '{}';
  const parsed = JSON.parse(content);
  return {
    partnerId: ctx.partnerId,
    generatedAt: new Date().toISOString(),
    model: 'openai-' + (Deno.env.get('OPENAI_MODEL') || 'gpt-4o-mini'),
    readinessScore: ctx.readinessScore,
    executiveSummary: String(parsed.executiveSummary || ''),
    topPriorities: Array.isArray(parsed.topPriorities) ? parsed.topPriorities.map(String) : [],
    suggestions: Array.isArray(parsed.suggestions)
      ? parsed.suggestions.map((s: Record<string, unknown>, i: number) => ({
          id: String(s.id || `ml-${i}`),
          category: (s.category as MlSuggestion['category']) || 'ops',
          priority: (s.priority as MlSuggestion['priority']) || 'medium',
          title: String(s.title || 'Recommendation'),
          summary: String(s.summary || ''),
          rationale: String(s.rationale || ''),
          detailedSteps: Array.isArray(s.detailedSteps) ? s.detailedSteps.map(String) : [],
          expectedImpact: String(s.expectedImpact || ''),
          timeframe: String(s.timeframe || ''),
          confidence: Number(s.confidence ?? 0.75),
          relatedStatutes: Array.isArray(s.relatedStatutes) ? s.relatedStatutes.map(String) : undefined,
          riskFlags: Array.isArray(s.riskFlags) ? s.riskFlags.map(String) : undefined,
        }))
      : [],
    fundingPath: parsed.fundingPath,
    disputeStrategy: parsed.disputeStrategy,
  };
}

export async function buildPartnerMlAdvisory(ctx: PartnerMlContext): Promise<MlAdvisoryPayload> {
  const apiKey = (Deno.env.get('OPENAI_API_KEY') || '').trim();
  if (apiKey) {
    try {
      const ml = await callOpenAiAdvisory(apiKey, ctx);
      if (ml && ml.suggestions.length > 0) return ml;
    } catch {
      /* fallback */
    }
  }
  return heuristicSuggestions(ctx);
}

export function buildPartnerMlContext(args: {
  partner: Record<string, unknown>;
  readiness: { readinessScore: number; blockers: string[]; journeySignals: Record<string, unknown> };
  reportCount: number;
  evidenceCount: number;
  letterCount: number;
}): PartnerMlContext {
  const p = args.partner;
  const profile = (p.profile as Record<string, unknown>) ?? {};
  return {
    partnerId: String(p.id || ''),
    fullName: (profile.fullName ?? profile.full_name ?? null) as string | null,
    email: (profile.email ?? null) as string | null,
    journeyStage: (p.journey_stage ?? null) as string | null,
    fundingStage: (p.funding_stage ?? null) as string | null,
    readinessScore: args.readiness.readinessScore,
    blockers: args.readiness.blockers,
    journeySignals: args.readiness.journeySignals,
    reportCount: args.reportCount,
    evidenceCount: args.evidenceCount,
    letterCount: args.letterCount,
  };
}
