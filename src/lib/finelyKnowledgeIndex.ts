/**
 * FinelyKnowledgeIndex (Launch Part E6) — unified RAG layer.
 *
 * One searchable brain over every operating-manual source:
 *  - Platform SOPs (domain/platformSops)
 *  - Site tour scripts (config/tourManifest)
 *  - Existing knowledge corpus (knowledge/finelyKnowledgeBase + feature map)
 *
 * Keyword/token scoring with route affinity — no vector DB required at launch.
 * Returns cited chunks the copilot/brain can surface ("Source: Upload report SOP").
 * A production vector store (Supabase pgvector) can replace `scoreChunk` later
 * without changing callers.
 */

import { PLATFORM_SOP_LIBRARY } from '../domain/platformSops';
import { TOUR_MANIFEST } from '../config/tourManifest';
import { MODULE_PLAYBOOKS } from '../config/modulePlaybooks';
import { getKnowledgeCorpus } from './kbFeatureMapSync';
import { ALL_FREE_GUIDES } from '../resources/freeGuides';
import { DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES, DISPUTE_LETTER_GUIDE_READ_PATH } from '../resources/disputeLetterGuideContent';
import {
  BC_GUIDE_CHAPTERS,
  BC_GUIDE_META,
} from '../pages/leadmagnet/businessCreditPowerGuideContent';
import {
  DEBT_GUIDE_CHAPTERS,
  DEBT_GUIDE_META,
} from '../pages/leadmagnet/debtEradicationGuideContent';
import {
  TL_GUIDE_CHAPTERS,
  TL_GUIDE_META,
} from '../pages/leadmagnet/tradelineAdvantageGuideContent';
import { flattenDisputeGuidePages, flattenGuideChapters } from './eguideKnowledgeFlatten';
import { DEBT_LETTER_SPECS, SCENARIO_RECOMMENDATIONS } from '../legal/debtLetterTemplates';
import { CRM_PIPELINES } from '../features/crm/pipelines';
import {
  allPackages,
  businessCreditPackages,
  categoryDescriptions,
  categoryLabels,
  formatPrice,
  getPackagesByCategory,
  type PricingCategory,
} from '../config/pricingCatalog';
import { getAllCaseStudies } from '../data/caseStudiesRepo';
import { getAllAuthorityCitations } from '../data/authorityCitationsRepo';
import {
  getAllNonCitizenFundingRules,
  getAllInternationalCreditSystems,
} from '../data/internationalAndNonCitizenCreditRepo';
import { getAllDebtLitigationPlaybooks } from '../data/debtLitigationDoctrineRepo';
import {
  getAllTierStrategies,
  getAllFundingInstruments,
} from '../data/businessCreditDoctrineRepo';
import { getAllPsychologyProfiles } from '../data/agentPsychologyArchitectureRepo';
import {
  getAllVideoTechniques,
  getAllImageTechniques,
  getAllVoiceTechniques,
  getAllScriptFrameworks,
} from '../data/contentStudioMediaEngineRepo';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import { isFeatureEnabled } from '../data/settingsRepo';
import { getKnowledgeFeedbackScoreAdjustment } from '../data/knowledgeFeedbackRepo';

export type KnowledgeSource = 'sop' | 'tour' | 'article' | 'module' | 'eguide' | 'reference';

export type FinelyKnowledgeChunk = {
  id: string;
  source: KnowledgeSource;
  title: string;
  /** Full searchable body */
  text: string;
  tags: string[];
  /** Primary route this chunk explains (for route-affinity boosting + deep links) */
  route?: string;
  sopId?: string;
  tourId?: string;
};

export type FinelyKnowledgeHit = FinelyKnowledgeChunk & {
  score: number;
  snippet: string;
};

const STOP = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'is', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may',
  'might', 'can', 'i', 'you', 'we', 'they', 'it', 'this', 'that', 'my', 'me', 'what', 'how', 'when', 'where', 'why',
  'about', 'page', 'help',
]);

function tokenize(text: string): string[] {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

function snippetOf(text: string, maxLen = 200): string {
  const t = text.trim().replace(/\s+/g, ' ');
  return t.length <= maxLen ? t : `${t.slice(0, maxLen).trim()}…`;
}

let CACHE: FinelyKnowledgeChunk[] | null = null;

/**
 * Reference chunks (Phase 5 knowledge expansion) — previously under-wired operating
 * domains: letters/Letter Studio, debt validation doctrine, funding/underwriting
 * readiness, affiliate payouts, full CRM pipeline stages, billing states, and public
 * pricing. Curated from the live catalog/spec modules so they stay in sync.
 */
function buildLetterStudioChunks(): FinelyKnowledgeChunk[] {
  return DEBT_LETTER_SPECS.map((spec) => ({
    id: `reference:letter:${spec.id}`,
    source: 'reference' as const,
    title: `Letter Studio — ${spec.title}`,
    text: [
      spec.title,
      spec.shortDescription,
      `When to use: ${spec.whenToUse.join(' · ')}`,
      spec.contractLawAngle ? `Contract law angle: ${spec.contractLawAngle}` : '',
      spec.bankingLawAngle ? `Banking law angle: ${spec.bankingLawAngle}` : '',
      `Key principle: ${spec.keyPrinciple}`,
      `Legal basis: ${spec.legalBasis.map((l) => l.shortName).join(', ')}`,
    ].filter(Boolean).join('\n'),
    tags: ['letters', 'letter_studio', 'dispute', 'debt_validation', spec.id],
    route: '/portal/letters',
  }));
}

function buildDebtValidationDoctrineChunks(): FinelyKnowledgeChunk[] {
  return SCENARIO_RECOMMENDATIONS.map((s) => ({
    id: `reference:debt_scenario:${s.scenario}`,
    source: 'reference' as const,
    title: `Debt validation doctrine — ${s.label}`,
    text: [
      s.label,
      s.description,
      `Recommended letters: ${s.recommendedLetterTypes.join(', ')}`,
      s.legalWarning ? `Legal note: ${s.legalWarning}` : '',
    ].filter(Boolean).join('\n'),
    tags: ['debt', 'debt_validation', 'case_state', 'validation_clocks', s.scenario],
    route: '/portal/debt',
  }));
}

function buildFundingReadinessChunks(): FinelyKnowledgeChunk[] {
  const chunks: FinelyKnowledgeChunk[] = businessCreditPackages.map((pkg) => {
    const outlook = pkg.businessCapitalOutlook;
    return {
      id: `reference:funding:${pkg.id}`,
      source: 'reference' as const,
      title: `Funding readiness — ${pkg.name}`,
      text: [
        `${pkg.name}: ${pkg.tagline}`,
        pkg.description,
        `Program fee: ${formatPrice(pkg.priceAmount)}`,
        outlook
          ? `Potential business-credit capital: ${outlook.potentialLabel} (outlay ${outlook.outlayLabel}, combined spend ${outlook.combinedSpendLabel}). ${outlook.basisNote}`
          : '',
        `Highlights: ${pkg.highlights.join(' · ')}`,
      ].filter(Boolean).join('\n'),
      tags: ['funding', 'underwriting', 'business_credit', 'readiness', pkg.id],
      route: '/admin/nora-capital',
    };
  });
  chunks.push({
    id: 'reference:funding:underwriting_doctrine',
    source: 'reference',
    title: 'Funding & underwriting — general readiness doctrine',
    text: [
      'Funding readiness is sequenced, not instant: entity hygiene → bureau alignment (D-U-N-S/commercial bureaus) → Tier 1-4 vendor trade depth → named-product/lender packaging → underwriting submission.',
      'Underwriting is never guaranteed — results vary, funding is subject to lender underwriting, and outlay for vendor/trade accounts is separate from the Finely Cred program fee.',
      'Personal credit readiness (utilization, revolving mix, on-time history) and business credit readiness (trade depth, time-in-business, D&B/Experian Business/Equifax Business scores) are evaluated separately — a partner can be funding-ready on one track before the other.',
      'Wealth Builder / Wealth Paths tiers escalate funding targets from ~$100K (Starter) up to $400K+ (Superior) and connect to Nora Capital Group when API-configured.',
    ].join('\n'),
    tags: ['funding', 'underwriting', 'readiness', 'wealth_paths'],
    route: '/portal/wealth-paths',
  });
  return chunks;
}

function buildAffiliatePayoutChunks(): FinelyKnowledgeChunk[] {
  return [
    {
      id: 'reference:affiliate:payout_structure',
      source: 'reference',
      title: 'Affiliate payout structure',
      text: [
        'New affiliates default to a 20% first-purchase commission and 15% recurring commission on ongoing membership/financing payments, with an 8% Denefits (in-house financing) share carve-out on in-house rail sales.',
        'Affiliate attribution events track the funnel: click → lead → signup → conversion → payout. Pending payout = earned (conversion) amounts minus amounts already paid out.',
        'Affiliates get a unique referral code (FC-########) and can run multiple UTM-tagged campaigns; attribution is logged per event with partner and campaign linkage for auditability.',
        'Affiliate status lifecycle: pending → active → suspended (compliance or non-payment holds).',
      ].join('\n'),
      tags: ['affiliate', 'payout', 'commission', 'revenue'],
      route: '/admin/affiliates',
    },
  ];
}

function buildCrmPipelineChunks(): FinelyKnowledgeChunk[] {
  return CRM_PIPELINES.map((pipe) => ({
    id: `reference:crm_pipeline:${pipe.id}`,
    source: 'reference' as const,
    title: `CRM pipeline — ${pipe.label}`,
    text: [
      `Pipeline: ${pipe.label} (target: ${pipe.target})`,
      `Stages: ${pipe.stages.map((s) => s.label).join(' → ')}`,
      pipe.kindFilter?.length ? `Record kinds: ${pipe.kindFilter.join(', ')}` : '',
    ].filter(Boolean).join('\n'),
    tags: ['crm', 'pipeline', 'leads', pipe.target],
    route: '/admin/crm',
  }));
}

function buildBillingStateChunks(): FinelyKnowledgeChunk[] {
  return [
    {
      id: 'reference:billing:agreement_lifecycle',
      source: 'reference',
      title: 'Billing — agreement lifecycle & rails',
      text: [
        'Agreement statuses: draft → pending_review → active → (past_due | cancelled | completed).',
        'Billing accounts are active or inactive per partner/tenant. Entitlements (feature/module access) are active, inactive, revoked, or expired independent of the agreement status.',
        'Two payment rails: Stripe (card/bank, standard checkout) and in_house (Denefits-style financing that reports the installment tradeline to Equifax). Some packages support both ("rail: both") and let the partner choose at checkout.',
        'Past-due agreements need dunning: reminder cadence, portal banners, and — before suspension — a human-reviewed escalation. Billing dunning automation should surface past-due partner counts and next reminder step, not silently cancel access.',
      ].join('\n'),
      tags: ['billing', 'agreements', 'entitlements', 'dunning'],
      route: '/admin/billing',
    },
  ];
}

function buildPricingChunks(): FinelyKnowledgeChunk[] {
  const categories = Object.keys(categoryLabels) as PricingCategory[];
  return categories.map((cat) => {
    const pkgs = getPackagesByCategory(cat);
    const prices = pkgs.map((p) => p.priceAmount).filter((n) => n > 0);
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    const range = prices.length ? (min === max ? formatPrice(min) : `${formatPrice(min)}–${formatPrice(max)}`) : 'Custom/Free';
    return {
      id: `reference:pricing:${cat}`,
      source: 'reference' as const,
      title: `Pricing — ${categoryLabels[cat]}`,
      text: [
        `${categoryLabels[cat]}: ${categoryDescriptions[cat]}`,
        `Price range: ${range} across ${pkgs.length} package(s).`,
        `Packages: ${pkgs.map((p) => `${p.name} (${formatPrice(p.priceAmount)}${p.interval === 'month' ? '/mo' : ''})`).join(' · ')}`,
      ].join('\n'),
      tags: ['pricing', 'packages', cat],
      route: '/pricing',
    };
  });
}

/** Compliant proof-of-results content — case studies surfaced on the homepage "Proven results" strip. */
function buildCaseStudyChunks(): FinelyKnowledgeChunk[] {
  return getAllCaseStudies().map((cs) => ({
    id: `reference:case_study:${cs.id}`,
    source: 'reference' as const,
    title: `${categoryLabels[cs.category as PricingCategory] ?? cs.category} case study — ${cs.partnerAlias} — ${cs.title}`,
    text: [
      cs.title,
      cs.summary,
      `Challenge: ${cs.challenge}`,
      `Strategy applied: ${cs.strategyApplied}`,
      `Outcomes: ${cs.outcomes.join(' · ')}`,
      `Statutory basis: ${cs.statutoryBasis.join(', ')}`,
      cs.disclaimer,
    ].filter(Boolean).join('\n'),
    tags: [cs.category, 'case_study', 'proof', 'results'],
    route: '/',
  }));
}

/** Statutory-authority / footnote citation pack backing the Letter Studio legal-authority panel. */
function buildAuthorityCitationChunks(): FinelyKnowledgeChunk[] {
  return getAllAuthorityCitations().map((c) => ({
    id: `reference:authority_citation:${c.id}`,
    source: 'reference' as const,
    title: `${c.serviceCategory} — ${c.topic}`,
    text: [
      c.topic,
      `Statute/regulation: ${c.statuteOrRegulation}`,
      c.casePrecedent ? `Case precedent: ${c.casePrecedent}` : '',
      c.agencyGuidance ? `Agency guidance: ${c.agencyGuidance}` : '',
      `Footnote text: ${c.footnoteText}`,
      `Plain-English summary: ${c.marketingSafeSummary}`,
    ].filter(Boolean).join('\n'),
    tags: [c.serviceCategory, 'legal_authority', 'citation'],
    route: '/portal/letters',
  }));
}

/** Non-citizen business funding rules + international consumer credit systems reference. */
function buildIntlAndNonCitizenCreditChunks(): FinelyKnowledgeChunk[] {
  const fundingChunks: FinelyKnowledgeChunk[] = getAllNonCitizenFundingRules().map((rule) => ({
    id: `reference:non_citizen_funding:${rule.id}`,
    source: 'reference' as const,
    title: `${rule.applicantType} — ${rule.loanType}`,
    text: [
      `Applicant type: ${rule.applicantType}`,
      `Loan type: ${rule.loanType}`,
      `SSN required: ${rule.ssnRequired ? 'yes' : 'no'}. ITIN accepted: ${rule.itinAccepted ? 'yes' : 'no'}.`,
      `Key requirements: ${rule.keyRequirements.join(' · ')}`,
      `Lender underwriting optics: ${rule.lenderUnderwritingOptics}`,
      `Alternative proof docs: ${rule.alternativeProofDocs.join(' · ')}`,
    ].join('\n'),
    tags: ['non_citizen_funding', 'international_credit', rule.applicantType, rule.loanType],
    route: '/business/funding',
  }));

  const systemChunks: FinelyKnowledgeChunk[] = getAllInternationalCreditSystems().map((sys) => ({
    id: `reference:international_credit:${sys.countryCode}`,
    source: 'reference' as const,
    title: sys.countryName,
    text: [
      sys.countryName,
      `Major bureaus: ${sys.majorBureaus.join(', ')}`,
      `Score range: ${sys.scoreRangeLabel}`,
      `Scoring model notes: ${sys.scoringModelNotes}`,
      `Data protection regime: ${sys.dataProtectionRegime}`,
      `Key differences from U.S.: ${sys.keyDifferencesFromUS.join(' · ')}`,
      `Dispute rights: ${sys.disputeRightsSummary}`,
      `Typical reporting window: ${sys.reportingWindowYears} years`,
    ].join('\n'),
    tags: ['international_credit', sys.countryCode.toLowerCase()],
    route: '/business/funding',
  }));

  return [...fundingChunks, ...systemChunks];
}

/** Debt-collection/civil-litigation defense doctrine — grounds Letter Studio + debt-defense AI reasoning. */
function buildDebtLitigationChunks(): FinelyKnowledgeChunk[] {
  return getAllDebtLitigationPlaybooks().map((p) => ({
    id: `reference:debt_litigation:${p.id}`,
    source: 'reference' as const,
    title: `${p.debtType.replace(/_/g, ' ')} — ${p.phase.replace(/_/g, ' ')} — ${p.title}`,
    text: [
      p.title,
      p.overview,
      `Statutory basis: ${p.statutoryBasis.join(' · ')}`,
      p.caseLawPrecedents.length ? `Case law precedents: ${p.caseLawPrecedents.join(' · ')}` : '',
      `Remedy action (${p.remedyAction.actionType}): ${p.remedyAction.legalRequirements.join(' · ')}`,
      p.remedyAction.exemptFundTypes?.length ? `Exempt fund types: ${p.remedyAction.exemptFundTypes.join(', ')}` : '',
      `Execution steps: ${p.remedyAction.executionSteps.join(' · ')}`,
      `Practical warnings: ${p.practicalWarnings.join(' · ')}`,
      p.disclaimer,
    ].filter(Boolean).join('\n'),
    tags: [p.debtType, p.phase, 'debt_defense', 'litigation'],
    route: '/portal/debt',
  }));
}

/** Business-credit tier matrix + corporate funding-instrument doctrine. */
function buildBusinessCreditDoctrineChunks(): FinelyKnowledgeChunk[] {
  const tierChunks: FinelyKnowledgeChunk[] = getAllTierStrategies().map((t) => ({
    id: `reference:business_credit_tier:tier-${t.tier}`,
    source: 'reference' as const,
    title: t.tierName,
    text: [
      t.tierName,
      `Target bureaus: ${t.targetBureaus.join(', ')}`,
      `Minimum Paydex/score: ${t.minimumPaydexOrScore}`,
      t.bankRatingRequired ? `Bank rating required: ${t.bankRatingRequired}` : '',
      `NAICS risk bypass strategies: ${t.naicsRiskBypass.join(' · ')}`,
      `Vendors: ${t.vendorList.map((v) => `${v.name} (reports to ${v.reportingBureau}) — ${v.approvalCriteria}`).join(' · ')}`,
      t.pgReleaseStrategy ? `PG release strategy: ${t.pgReleaseStrategy}` : '',
      `Time to next tier: ${t.timeToNextTierWeeks} weeks`,
      `Common mistakes: ${t.commonMistakes.join(' · ')}`,
    ].filter(Boolean).join('\n'),
    tags: ['business_credit', 'funding', 'vendor_tier', `tier_${t.tier}`],
    route: '/business/dashboard',
  }));

  const instrumentChunks: FinelyKnowledgeChunk[] = getAllFundingInstruments().map((f) => ({
    id: `reference:business_funding_instrument:${f.id}`,
    source: 'reference' as const,
    title: `Funding instrument — ${f.instrumentType.replace(/_/g, ' ')}`,
    text: [
      f.instrumentType.replace(/_/g, ' '),
      `Typical underwriting factors: ${f.typicalUnderwritingFactors.join(' · ')}`,
      `Funding range: ${f.fundingRangeLabel}`,
      `Documentation needed: ${f.documentationNeeded.join(' · ')}`,
      `Best-fit business stage: ${f.bestFitBusinessStage}`,
      `Risks and cautions: ${f.risksAndCautions.join(' · ')}`,
    ].join('\n'),
    tags: ['business_credit', 'funding', 'vendor_tier', f.instrumentType, f.bestFitBusinessStage],
    route: '/business/dashboard',
  }));

  return [...tierChunks, ...instrumentChunks];
}

/**
 * Persona psychology / cognitive-architecture profiles — internal agent-reasoning grounding,
 * NOT partner-facing. Tagged `internal_only` so `isPublicSafeKnowledgeChunk()` excludes it
 * from public/partner-facing search the same way billing/CRM ops content is excluded.
 */
function buildPersonaPsychologyChunks(): FinelyKnowledgeChunk[] {
  return getAllPsychologyProfiles().map((p) => ({
    id: `reference:persona_psychology:${p.personaId}`,
    source: 'reference' as const,
    title: p.displayName,
    text: [
      p.displayName,
      `OCEAN traits: openness ${p.oceanTraits.openness}, conscientiousness ${p.oceanTraits.conscientiousness}, extraversion ${p.oceanTraits.extraversion}, agreeableness ${p.oceanTraits.agreeableness}, neuroticism ${p.oceanTraits.neuroticism}`,
      `DISC profile: dominance ${p.discProfile.dominance}, influence ${p.discProfile.influence}, steadiness ${p.discProfile.steadiness}, conscientiousness ${p.discProfile.conscientiousness}`,
      `Cognitive processing mode: ${p.cognitiveProcessingMode}`,
      `Neuro-linguistic style: ${p.neuroLinguisticStyle}`,
      `Communication tone: ${p.communicationTone}`,
      `Bias mitigation rules: ${p.biasMitigationRules.join(' · ')}`,
      `De-escalation protocol: ${p.deEscalationProtocol.join(' · ')}`,
      `Cognitive load guidance: ${p.cognitiveLoadGuidance}`,
    ].join('\n'),
    tags: ['persona', 'psychology', 'internal_only', p.personaId],
  }));
}

/** Content Studio media-production technique library — video, image, voice/audio, and copywriting/script frameworks. */
function buildContentMediaEngineChunks(): FinelyKnowledgeChunk[] {
  const videoChunks: FinelyKnowledgeChunk[] = getAllVideoTechniques().map((t) => ({
    id: `reference:media_technique:${t.id}`,
    source: 'reference' as const,
    title: `${t.category.replace(/_/g, ' ')} — ${t.title}`,
    text: [
      t.title,
      t.description,
      `When to use: ${t.whenToUse.join(' · ')}`,
      `Tools that do this well: ${t.toolsThatDoThisWell.join(', ')}`,
      `Platform fit: ${t.platformFit.join(', ')}`,
    ].join('\n'),
    tags: ['video_production', t.category, 'content_studio', 'media_production', 'internal_only'],
    route: '/admin/content-studio',
  }));

  const imageChunks: FinelyKnowledgeChunk[] = getAllImageTechniques().map((t) => ({
    id: `reference:media_technique:${t.id}`,
    source: 'reference' as const,
    title: `${t.category.replace(/_/g, ' ')} — ${t.title}`,
    text: [
      t.title,
      t.description,
      `When to use: ${t.whenToUse.join(' · ')}`,
      `Tools that do this well: ${t.toolsThatDoThisWell.join(', ')}`,
      `Output formats: ${t.outputFormats.join(', ')}`,
    ].join('\n'),
    tags: ['image_production', t.category, 'content_studio', 'media_production', 'internal_only'],
    route: '/admin/content-studio',
  }));

  const voiceChunks: FinelyKnowledgeChunk[] = getAllVoiceTechniques().map((t) => ({
    id: `reference:media_technique:${t.id}`,
    source: 'reference' as const,
    title: `${t.category.replace(/_/g, ' ')} — ${t.title}`,
    text: [
      t.title,
      t.description,
      `When to use: ${t.whenToUse.join(' · ')}`,
      `Tools that do this well: ${t.toolsThatDoThisWell.join(', ')}`,
      t.complianceNotes ? `Compliance notes: ${t.complianceNotes}` : '',
    ].filter(Boolean).join('\n'),
    tags: ['voice_audio_production', t.category, 'content_studio', 'media_production', 'internal_only'],
    route: '/admin/content-studio',
  }));

  const scriptChunks: FinelyKnowledgeChunk[] = getAllScriptFrameworks().map((f) => ({
    id: `reference:media_technique:${f.id}`,
    source: 'reference' as const,
    title: `${f.category.replace(/_/g, ' ')} — ${f.title}`,
    text: [
      f.title,
      f.description,
      `Template: ${f.template}`,
      `Example filled: ${f.exampleFilled}`,
      `Best for persona: ${f.bestForPersona.join(', ')}`,
    ].join('\n'),
    tags: ['script_framework', f.category, 'content_studio', 'media_production', 'internal_only'],
    route: '/admin/content-studio',
  }));

  return [...videoChunks, ...imageChunks, ...voiceChunks, ...scriptChunks];
}

export function buildFinelyReferenceChunks(): FinelyKnowledgeChunk[] {
  return [
    ...buildLetterStudioChunks(),
    ...buildDebtValidationDoctrineChunks(),
    ...buildFundingReadinessChunks(),
    ...buildAffiliatePayoutChunks(),
    ...buildCrmPipelineChunks(),
    ...buildBillingStateChunks(),
    ...buildPricingChunks(),
    ...buildCaseStudyChunks(),
    ...buildAuthorityCitationChunks(),
    ...buildIntlAndNonCitizenCreditChunks(),
    ...buildDebtLitigationChunks(),
    ...buildBusinessCreditDoctrineChunks(),
    ...buildPersonaPsychologyChunks(),
    ...buildContentMediaEngineChunks(),
  ];
}

/** Build (and memoize) the unified chunk list across all knowledge sources. */
export function buildFinelyKnowledgeChunks(): FinelyKnowledgeChunk[] {
  if (CACHE) return CACHE;
  const chunks: FinelyKnowledgeChunk[] = [];

  for (const sop of PLATFORM_SOP_LIBRARY) {
    const text = [
      sop.title,
      sop.whenToUse,
      `Owner: ${sop.ownerRole}.`,
      ...sop.steps.map((s) => `${s.order}. ${s.label}: ${s.detail}`),
      ...(sop.complianceNotes ?? []),
    ].join('\n');
    chunks.push({
      id: `sop:${sop.id}`,
      source: 'sop',
      title: sop.title,
      text,
      tags: [sop.lane, sop.audience, ...sop.steps.map((s) => s.label.toLowerCase())],
      route: sop.relatedRoutes[0],
      sopId: sop.id,
      tourId: sop.relatedTourId,
    });
  }

  for (const tour of TOUR_MANIFEST) {
    chunks.push({
      id: `tour:${tour.id}`,
      source: 'tour',
      title: tour.title,
      text: [tour.title, ...tour.steps.map((s) => `${s.label}: ${s.narrationPlain}`)].join('\n'),
      tags: [tour.lane, 'video', 'watch how', 'tour'],
      route: tour.startPath,
      tourId: tour.id,
      sopId: tour.relatedSopId,
    });
  }

  for (const mod of MODULE_PLAYBOOKS) {
    chunks.push({
      id: `module:${mod.id}`,
      source: 'module',
      title: mod.title,
      text: [mod.title, mod.plainSummary, mod.path].join('\n'),
      tags: [mod.lane, 'module', 'how to', mod.title.toLowerCase()],
      route: mod.path,
      sopId: mod.sopId,
      tourId: mod.tourId,
    });
  }

  for (const article of getKnowledgeCorpus()) {
    chunks.push({
      id: `article:${article.id}`,
      source: 'article',
      title: article.title,
      text: `${article.title}\n${article.content}`,
      tags: [article.category, ...article.tags],
      route: article.links?.[0]?.path,
    });
  }

  for (const guide of ALL_FREE_GUIDES) {
    for (const [si, section] of guide.sections.entries()) {
      chunks.push({
        id: `eguide:${guide.id}:section-${si}`,
        source: 'eguide',
        title: `${guide.title} — ${section.heading}`,
        text: [guide.title, guide.desc, section.heading, ...section.bullets].join('\n'),
        tags: ['eguide', guide.id, 'free guide', 'partner guide'],
        route: guideRouteForId(guide.id),
      });
    }
  }

  for (const flat of flattenGuideChapters('debt-eradication', DEBT_GUIDE_META, DEBT_GUIDE_CHAPTERS)) {
    chunks.push({ ...flat, source: 'eguide' });
  }
  for (const flat of flattenGuideChapters('business-credit-power', BC_GUIDE_META, BC_GUIDE_CHAPTERS)) {
    chunks.push({ ...flat, source: 'eguide' });
  }
  for (const flat of flattenGuideChapters('tradeline-advantage', TL_GUIDE_META, TL_GUIDE_CHAPTERS)) {
    chunks.push({ ...flat, source: 'eguide' });
  }
  for (const flat of flattenDisputeGuidePages(DISPUTE_LETTER_GUIDE_PROGRAMMATIC_PAGES, DISPUTE_LETTER_GUIDE_READ_PATH)) {
    chunks.push({ ...flat, source: 'eguide' });
  }

  chunks.push(...buildFinelyReferenceChunks());

  CACHE = chunks;
  return chunks;
}

function guideRouteForId(id: string): string | undefined {
  if (id === 'credit-dispute-letter-guide') return '/free-guide/read';
  if (id.includes('debt') || id === 'collections-validation-deep-dive' || id === 'debt-settlement-tax-traps') {
    return '/free-debt-guide/read';
  }
  if (id.includes('business') || id.includes('vendor') || id.includes('ucc') || id.includes('funding')) {
    return '/free-business-guide/read';
  }
  if (id.includes('tradeline') || id.includes('primary-tradeline') || id.includes('combo-tradeline')) {
    return '/free-tradeline-guide/read';
  }
  return '/resources/guides';
}

/** Force a rebuild (e.g. after dynamic KB sync). */
export function invalidateFinelyKnowledgeIndex(): void {
  CACHE = null;
}

function routeAffinity(chunkRoute: string | undefined, contextRoute: string | undefined): number {
  if (!chunkRoute || !contextRoute) return 0;
  const a = chunkRoute.split('?')[0];
  const b = contextRoute.split('?')[0];
  if (a === b) return 6;
  if (b.startsWith(a) || a.startsWith(b)) return 4;
  // Same top-level lane (e.g. both /portal/*)
  const aTop = a.split('/').filter(Boolean)[0];
  const bTop = b.split('/').filter(Boolean)[0];
  if (aTop && aTop === bTop) return 1.5;
  return 0;
}

function scoreChunk(chunk: FinelyKnowledgeChunk, queryTokens: string[], contextRoute?: string): number {
  const hay = `${chunk.title} ${chunk.text} ${chunk.tags.join(' ')}`.toLowerCase();
  const tagHay = chunk.tags.join(' ').toLowerCase();
  let score = 0;
  for (const qt of queryTokens) {
    if (hay.includes(qt)) score += 2;
    if (tagHay.includes(qt)) score += 2;
    if (chunk.title.toLowerCase().includes(qt)) score += 2;
  }
  score += routeAffinity(chunk.route, contextRoute);
  // J4 — soft, additive relevance-feedback nudge (see knowledgeFeedbackRepo.ts). Small and
  // bounded by design: it can only bias ranking among otherwise-similar candidates, never
  // override keyword relevance above. Applies equally once the pgvector path
  // (`searchFinelyKnowledgeVector()` below) is adopted — chunk ids are stable across both.
  score += getKnowledgeFeedbackScoreAdjustment(chunk.id, queryTokens);
  return score;
}

export type FinelyKnowledgeSearchOpts = {
  limit?: number;
  /** Current route — boosts chunks that explain this page */
  contextRoute?: string;
  /** Restrict to certain sources */
  sources?: KnowledgeSource[];
  minScore?: number;
  /** When true, exclude admin/partner/internal SOPs and portal-only tours/modules. */
  publicSafe?: boolean;
};

const INTERNAL_ROUTE_PREFIXES = ['/admin', '/portal'];

/** Sources safe for public strip, chat, and voice — no admin SOPs or internal ops. */
export const PUBLIC_KNOWLEDGE_SOURCES: KnowledgeSource[] = ['eguide', 'article', 'reference'];

/** Reference chunk tags that are internal-ops-only and must never reach public/partner chat. */
const INTERNAL_REFERENCE_TAGS = new Set([
  'billing', 'crm', 'pipeline', 'dunning', 'agreements', 'entitlements',
  // Internal agent-architecture content (e.g. persona psychology profiles) — never partner-facing.
  'internal_only',
]);

export function isPublicSafeKnowledgeChunk(chunk: FinelyKnowledgeChunk): boolean {
  if (chunk.source === 'eguide' || chunk.source === 'article') return true;
  if (chunk.source === 'reference') {
    return !chunk.tags.some((t) => INTERNAL_REFERENCE_TAGS.has(t));
  }
  if (chunk.source === 'sop') {
    const aud = chunk.tags.find((t) =>
      ['visitor', 'partner', 'affiliate', 'agent', 'admin', 'all'].includes(t),
    );
    if (aud === 'admin' || aud === 'agent' || aud === 'partner' || aud === 'affiliate') return false;
    return aud === 'visitor' || aud === 'all';
  }
  if (chunk.source === 'tour' || chunk.source === 'module') {
    const route = chunk.route ?? '';
    return !INTERNAL_ROUTE_PREFIXES.some((p) => route.startsWith(p));
  }
  return false;
}

/** Top-k retrieval across the unified index. Empty query → route-relevant defaults. */
export function searchFinelyKnowledge(query: string, opts: FinelyKnowledgeSearchOpts = {}): FinelyKnowledgeHit[] {
  // Hard ceiling raised (Phase 5) so deep admin/co-owner retrieval isn't capped at a
  // shallow 12 chunks — public/partner callers still pass their own tighter limit.
  const limit = Math.max(1, Math.min(24, opts.limit ?? 5));
  const minScore = opts.minScore ?? 1;
  let chunks = buildFinelyKnowledgeChunks();
  if (opts.publicSafe) {
    chunks = chunks.filter(isPublicSafeKnowledgeChunk);
  }
  if (opts.sources?.length) {
    const allow = new Set(opts.sources);
    chunks = chunks.filter((c) => allow.has(c.source));
  }
  const tokens = tokenize(query);

  // Empty query → best route-relevant chunks so the copilot always has context.
  if (!tokens.length) {
    return chunks
      .map((c) => ({ ...c, score: routeAffinity(c.route, opts.contextRoute), snippet: snippetOf(c.text) }))
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  return chunks
    .map((c) => ({ ...c, score: scoreChunk(c, tokens, opts.contextRoute), snippet: snippetOf(c.text) }))
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/** Public-safe retrieval — eGuides + visitor articles only; never admin SOPs. */
export function searchFinelyKnowledgePublic(
  query: string,
  opts: Omit<FinelyKnowledgeSearchOpts, 'publicSafe' | 'sources'> = {},
): FinelyKnowledgeHit[] {
  return searchFinelyKnowledge(query, {
    ...opts,
    publicSafe: true,
    sources: PUBLIC_KNOWLEDGE_SOURCES,
  });
}

/** Format hits for injection into an AI system prompt (cited, authoritative). */
export function formatFinelyKnowledgeForPrompt(hits: FinelyKnowledgeHit[]): string {
  if (!hits.length) return '';
  const lines = hits.map((h, i) => {
    const where = h.route ? ` (open: ${h.route})` : '';
    return `[${i + 1}] ${h.title} — ${sourceLabel(h.source)}${where}\n${h.snippet}`;
  });
  return `FINELY CRED OPERATING KNOWLEDGE (authoritative — prefer over general knowledge):\n\n${lines.join('\n\n')}`;
}

export function sourceLabel(source: KnowledgeSource): string {
  if (source === 'sop') return 'SOP';
  if (source === 'tour') return 'Video tour';
  if (source === 'module') return 'Module guide';
  if (source === 'eguide') return 'E-Guide';
  if (source === 'reference') return 'Reference';
  return 'Guide';
}

/** Count of indexed chunks per source — for launch gates / admin telemetry. */
export function finelyKnowledgeIndexStats(): { total: number; bySource: Record<KnowledgeSource, number> } {
  const chunks = buildFinelyKnowledgeChunks();
  const bySource: Record<KnowledgeSource, number> = { sop: 0, tour: 0, article: 0, module: 0, eguide: 0, reference: 0 };
  for (const c of chunks) bySource[c.source] += 1;
  return { total: chunks.length, bySource };
}

// ─────────────────────────────────────────────────────────────────────────────
// Phase H1 — additive, opt-in Supabase pgvector retrieval path.
//
// Everything above this line is the existing synchronous, in-browser
// keyword/heuristic index (`scoreChunk()`, `searchFinelyKnowledge()`, etc.) —
// unchanged, still the default, still what every current caller uses.
//
// `searchFinelyKnowledgeVector()` below is a NEW, separate async function
// that calls the `knowledge-search` edge function (pgvector cosine-similarity
// RPC against the `knowledge_chunks` table — see
// `supabase/migrations/20260814030000_knowledge_chunks_pgvector.sql` and
// `scripts/export-knowledge-chunks.mjs`). It is:
//   - feature-flagged OFF by default (`knowledgeVectorSearch` in
//     `src/domain/settings.ts` / `settingsRepo.ts`) — flipping the flag off
//     always restores today's behavior with zero code-path changes elsewhere,
//     because no existing caller invokes this function yet;
//   - NOT wired into `finelyPublicAnswer.ts`, `coOwnerSiteKnowledgeMap.ts`, or
//     any other caller in this pass — adopting it is a deliberate future
//     decision once the ETL script has been run at least once against real
//     content and the edge function + migration are deployed;
//   - safe to call before that infrastructure exists: it fails closed (empty
//     array) rather than throwing, so an accidental early call cannot break a
//     page.
// ─────────────────────────────────────────────────────────────────────────────

export type FinelyKnowledgeVectorSearchOpts = {
  /** Top-K chunks to return (1–24). Default 6. */
  limit?: number;
  /**
   * 'public' (default) restricts to `public_safe = true` rows only — the
   * pgvector-side mirror of `isPublicSafeKnowledgeChunk()`. 'internal' additionally
   * requires the caller's Supabase session to be a real signed-in (non-anon) user;
   * the edge function enforces this server-side regardless of what a client sends.
   */
  mode?: 'public' | 'internal';
};

/**
 * Embedding-based top-K retrieval via the `knowledge-search` edge function.
 * Opt-in upgrade path for `searchFinelyKnowledge()`/`searchFinelyKnowledgePublic()`
 * — NOT a replacement. Requires:
 *   1. The `knowledge_chunks` migration applied,
 *   2. `scripts/export-knowledge-chunks.mjs --write` run at least once,
 *   3. The `knowledge-search` edge function deployed,
 *   4. The `knowledgeVectorSearch` feature flag enabled.
 * Any of those being unmet results in an empty array, never a thrown error —
 * callers should treat this as "no vector hits available yet," not a fatal path.
 *
 * J4 note: `knowledgeFeedbackRepo.ts`'s helpful/unhelpful signal is wired into the
 * synchronous `scoreChunk()` path above only for now. Chunk ids are stable across both
 * retrieval mechanisms, so once this vector path is adopted, the same
 * `getKnowledgeFeedbackScoreAdjustment()` nudge can be applied to `data.chunks` here
 * (or folded into the pgvector similarity ranking server-side) with no data migration.
 */
export async function searchFinelyKnowledgeVector(
  query: string,
  opts: FinelyKnowledgeVectorSearchOpts = {},
): Promise<FinelyKnowledgeHit[]> {
  if (!isFeatureEnabled('knowledgeVectorSearch')) return [];
  if (!isSupabaseConfigured) return [];
  const trimmed = (query || '').trim();
  if (!trimmed) return [];

  try {
    const { data, error } = await supabase.functions.invoke('knowledge-search', {
      body: {
        query: trimmed,
        mode: opts.mode ?? 'public',
        limit: Math.max(1, Math.min(24, opts.limit ?? 6)),
      },
    });
    if (error || !data?.ok || !Array.isArray(data.chunks)) return [];

    return data.chunks.map((row: Record<string, unknown>): FinelyKnowledgeHit => {
      const text = typeof row.content === 'string' ? row.content : '';
      const tags = Array.isArray(row.tags) ? (row.tags as string[]) : [];
      const source = (typeof row.sourceTag === 'string' ? row.sourceTag : 'reference') as KnowledgeSource;
      return {
        id: String(row.id ?? ''),
        source,
        title: typeof row.title === 'string' ? row.title : '',
        text,
        tags,
        route: typeof row.route === 'string' ? row.route : undefined,
        score: typeof row.similarity === 'number' ? row.similarity : 0,
        snippet: snippetOf(text),
      };
    });
  } catch {
    // Vector path is opt-in/best-effort — never break a caller on failure.
    return [];
  }
}
