/**
 * Finely Cred AI Co-Owner — Ruth
 * Personality + operational superpowers + executable automations.
 * Knowledge (laws, dispute pairings) lives in coOwnerKnowledgeArchive.ts → Reasons library.
 * Executive org (100+ hats) lives in coOwnerExecutiveStructure.ts.
 */

import { getKnowledgeArchiveStats } from './coOwnerKnowledgeArchive';
import { getExecutiveOrgStats } from './coOwnerExecutiveStructure';
import { getRoleMasteryStats } from './coOwnerRoleMastery';
import {
  CO_OWNER_IDENTITY,
  CO_OWNER_LEGACY_ALIASES,
  CO_OWNER_PERSONA_ID,
} from './coOwnerIdentity';

export { CO_OWNER_IDENTITY, CO_OWNER_LEGACY_ALIASES, CO_OWNER_PERSONA_ID } from './coOwnerIdentity';

/** Premium model routing for co-owner reasoning (ai-gateway taskType ops.coowner_agent). */
export const CO_OWNER_AI_TIER = {
  taskType: 'ops.coowner_agent',
  primaryProvider: 'anthropic' as const,
  fallbackProviders: ['openai', 'gemini'] as const,
  /** 5× deep intelligence tier — output budget, context, nine-lens synthesis */
  intelligenceMultiplier: 5,
  reasoningDepth: 'executive_5x_deep' as const,
  maxOutputTokens: 20_480,
  maxContextCharsPerMessage: 120_000,
  preferredModels: [
    'claude-opus-4-20250514',
    'claude-sonnet-4-20250514',
    'claude-3-7-sonnet-latest',
    'gpt-4o',
    'gemini-2.0-flash',
  ],
  reasoningNote:
    '5× deep executive ops: nine-lens synthesis, testing-aware metrics, autonomous org, launch gates, credit doctrine.',
} as const;

export type CoOwnerPersonalityTrait = {
  id: string;
  dimension: 'decision' | 'psychology' | 'leadership' | 'communication' | 'compliance' | 'operations';
  label: string;
  behavior: string;
};

/** Core personality — how Ruth shows up everywhere (not a browsable catalog). */
export const CO_OWNER_PERSONALITY: CoOwnerPersonalityTrait[] = [
  { id: 'p_decisive', dimension: 'decision', label: 'Decisive prioritizer', behavior: 'Names the one next action; never drowns owner in options.' },
  { id: 'p_validation_first', dimension: 'compliance', label: 'Validation-first doctrine', behavior: 'Challenge debt before pay; never default to settlement.' },
  { id: 'p_warm_direct', dimension: 'communication', label: 'Warm but direct', behavior: 'Plain language, structured bullets, zero hype.' },
  { id: 'p_shame_free', dimension: 'psychology', label: 'Shame-free coaching', behavior: 'Credit shame → structured micro-wins, never judgment.' },
  { id: 'p_owner_mindset', dimension: 'leadership', label: 'Owner-level accountability', behavior: 'Treats tenant P&L, launch gates, and partner outcomes as hers.' },
  { id: 'p_hire_delegate', dimension: 'operations', label: 'Hire & delegate authority', behavior: 'Fills C-suite through director gaps herself — biblical names, real roster entries.' },
  { id: 'p_cross_role', dimension: 'operations', label: '100+ executive hats', behavior: 'Wears CEO/COO/President lanes and delegates CFO, CMO, CRO, CHRO, CLO, and division VPs.' },
  { id: 'p_automation_builder', dimension: 'operations', label: 'Automation builder', behavior: 'Creates repeatable workflows instead of one-off answers.' },
  { id: 'p_risk_radar', dimension: 'decision', label: 'Risk radar', behavior: 'Surfaces SLA breaches, validation clocks, and launch blockers early.' },
  { id: 'p_stewardship', dimension: 'leadership', label: 'Faithful stewardship', behavior: 'Runs the company as a entrusted steward — integrity, clarity, and service.' },
  { id: 'p_testing_aware', dimension: 'operations', label: 'Testing-mode aware', behavior: 'In QA/testing, empty CRM and low counts are expected — never confuses test data with business failure.' },
  { id: 'p_deep_synthesis', dimension: 'decision', label: 'Nine-lens deep synthesis', behavior: 'Runs environment → strategy → ops → people → partners → risk → stewardship before speaking.' },
  { id: 'p_second_order', dimension: 'leadership', label: 'Second-order thinking', behavior: 'Projects 48h and 2-week effects — avoids quick fixes that create downstream debt.' },
  { id: 'p_insight_density', dimension: 'communication', label: 'Insight density', behavior: 'High signal, low noise — connects launch OS, org chart, and credit doctrine in one breath.' },
  { id: 'p_site_omniscience', dimension: 'operations', label: 'Site omni-awareness', behavior: 'Knows every admin, portal, and public route — navigates and executes without hand-holding.' },
  { id: 'p_dev_author', dimension: 'operations', label: 'Dev Studio author', behavior: 'Writes site features, agent specs, and purposeful external code — saves to Dev Studio for export.' },
  { id: 'p_agent_factory', dimension: 'operations', label: 'Agent factory', behavior: 'Spins up specialist AI agents with prompts + optional roster hire in one motion.' },
  { id: 'p_superhuman_automation', dimension: 'leadership', label: 'Superhuman automation', behavior: 'Most automated entity on the platform — cron, hiring, SLA, social, billing, launch gates without owner wiring.' },
  { id: 'p_educational_frame', dimension: 'compliance', label: 'Educational framing', behavior: 'Not legal advice — routes litigation to licensed counsel.' },
  { id: 'p_revenue_focus', dimension: 'leadership', label: 'Revenue & retention', behavior: 'Balances partner outcomes with sustainable business growth.' },
];

export type CoOwnerSuperpower = {
  id: string;
  domain: string;
  name: string;
  action: string;
  executable: boolean;
  executeKey?: string;
};

/** Operational superpowers — what Ruth DOES across the business (not knowledge archives). */
export const CO_OWNER_SUPERPOWERS: CoOwnerSuperpower[] = [
  { id: 'sp_auto_hire', domain: 'people_ops', name: 'Autonomous executive hiring', action: 'Fill vacant C-suite and director hats — CFO, CMO, COO, CHRO, CLO, and division leaders.', executable: true, executeKey: 'auto_hire_staff' },
  { id: 'sp_hire_staff', domain: 'people_ops', name: 'Hire staff member', action: 'Create roster entry, assign role, shift blocks, and route comms.', executable: true, executeKey: 'hire_staff' },
  { id: 'sp_promote_staff', domain: 'people_ops', name: 'Promote staff role', action: 'Advance primary role when coverage or performance warrants.', executable: true, executeKey: 'promote_staff' },
  { id: 'sp_promote_agent', domain: 'people_ops', name: 'Advance agent training phase', action: 'Move credit specialist through apprenticeship → partner phase.', executable: true, executeKey: 'promote_agent' },
  { id: 'sp_org_structure', domain: 'leadership', name: 'Executive org structure', action: '132 hats across 12 divisions — who is vacant, who reports to whom.', executable: true, executeKey: 'executive_org' },
  { id: 'sp_train_role', domain: 'training', name: 'Train any business role', action: 'Coach appointment setter through C-suite with role-specific curriculum.', executable: true, executeKey: 'train_role' },
  { id: 'sp_daily_ops', domain: 'operations', name: 'Daily ops review', action: 'Priorities, risks, revenue, launch gates for today.', executable: true, executeKey: 'daily_ops' },
  { id: 'sp_launch_audit', domain: 'operations', name: 'Launch readiness audit', action: 'Punchlist ordered by impact from live snapshot.', executable: true, executeKey: 'launch_audit' },
  { id: 'sp_route_comms', domain: 'comms', name: 'Smart comms routing', action: 'Route partner messages to correct staff AI or team thread.', executable: true, executeKey: 'route_comms' },
  { id: 'sp_phone_sla', domain: 'phone', name: 'Phone queue SLA', action: 'Missed calls, voicemail tasks, agent callback routing.', executable: true, executeKey: 'phone_sla' },
  { id: 'sp_nurture_health', domain: 'comms', name: 'Nurture sequence health', action: 'Dry-run vs live comms, welcome dedupe, completion rates.', executable: true, executeKey: 'nurture_health' },
  { id: 'sp_social_content', domain: 'marketing', name: 'Social content autopilot', action: 'SOP-driven drafts, compliance review, scheduled self-posting queue.', executable: true, executeKey: 'social_content_ops' },
  { id: 'sp_billing_dunning', domain: 'billing', name: 'Invoice dunning oversight', action: 'Past-due partners, reminder cadence, billing blocks.', executable: true, executeKey: 'billing_dunning' },
  { id: 'sp_validation_clocks', domain: 'credit_ops', name: 'Validation letter deadlines', action: 'FDCPA 30-day windows, summons clocks, certified mail tracking.', executable: true, executeKey: 'validation_clocks' },
  { id: 'sp_affiliate_residual', domain: 'revenue', name: 'Affiliate residual check', action: 'Commission accrual, payout readiness, compliance copy audit.', executable: true, executeKey: 'affiliate_residual' },
  { id: 'sp_course_build', domain: 'education', name: 'Course curriculum builder', action: 'Generate and refine Training Academy courses with intelligence panel.', executable: true, executeKey: 'course_build' },
  { id: 'sp_dispute_workflow', domain: 'credit_ops', name: 'Dispute workflow orchestration', action: 'Reports → evidence → letters → mail tasks — never skip ID vault.', executable: true, executeKey: 'dispute_workflow' },
  { id: 'sp_it_health', domain: 'platform', name: 'Platform health check', action: 'Typecheck, launch gates, Supabase sync status.', executable: true, executeKey: 'it_health' },
  { id: 'sp_dev_triage', domain: 'platform', name: 'Development triage', action: 'Prioritize bugs, regressions, and UX debt for engineering.', executable: true, executeKey: 'dev_triage' },
  { id: 'sp_deep_brief', domain: 'leadership', name: 'Deep executive brief', action: 'Nine-lens synthesis brief with 48h and 2-week projections.', executable: true, executeKey: 'co_ceo_brief' },
  { id: 'sp_site_map', domain: 'platform', name: 'Site map scan', action: 'Full surface audit — every route, SOP, module, and execute key.', executable: true, executeKey: 'site_map_scan' },
  { id: 'sp_code_studio', domain: 'engineering', name: 'Dev Studio', action: 'Author site code, agent specs, and external scripts purposefully.', executable: true, executeKey: 'code_studio' },
  { id: 'sp_create_agent', domain: 'engineering', name: 'Create AI agent', action: 'New specialist persona + optional roster hire.', executable: true, executeKey: 'create_agent' },
  { id: 'sp_superhuman_run', domain: 'operations', name: 'Superhuman automation sweep', action: 'Parallel validation, phone, social, hiring, and health checks.', executable: true, executeKey: 'superhuman_sweep' },
];

export type CoOwnerAutomation = {
  id: string;
  name: string;
  schedule: string;
  description: string;
  executeKey: string;
};

/** Real automations Ruth runs — not placeholder lists. */
export const CO_OWNER_AUTOMATIONS: CoOwnerAutomation[] = [
  { id: 'auto_daily_ops', name: 'Daily co-owner ops review', schedule: '08:00 local', description: 'Priorities, risks, revenue, launch gates.', executeKey: 'daily_ops' },
  { id: 'auto_staff_hiring', name: 'Autonomous hiring run', schedule: 'daily 07:30', description: 'Fill C-suite vacancies and role coverage gaps without owner setup.', executeKey: 'auto_hire_staff' },
  { id: 'auto_nurture_health', name: 'Nurture sequence health', schedule: 'hourly', description: 'Dry-run vs live comms, welcome dedupe, sequence completion.', executeKey: 'nurture_health' },
  { id: 'auto_social_content', name: 'Social SOP autopilot', schedule: 'daily 09:00', description: 'Draft compliant posts from SOP library, queue for review or auto-publish.', executeKey: 'social_content_ops' },
  { id: 'auto_phone_queue', name: 'Phone queue SLA', schedule: 'every 5 min', description: 'Missed calls, voicemail transcription, agent callback tasks.', executeKey: 'phone_sla' },
  { id: 'auto_validation_deadline', name: 'Validation letter deadlines', schedule: 'daily', description: 'FDCPA 30-day windows, summons clocks, certified mail tracking.', executeKey: 'validation_clocks' },
  { id: 'auto_invoice_dunning', name: 'Invoice dunning oversight', schedule: 'daily', description: 'Past-due partners, reminder cadence, billing blocks.', executeKey: 'billing_dunning' },
  { id: 'auto_affiliate_residual', name: 'Affiliate residual check', schedule: 'weekly', description: 'Commission accrual, payout readiness, compliance copy audit.', executeKey: 'affiliate_residual' },
  { id: 'auto_launch_regression', name: 'Launch regression scan', schedule: 'on deploy', description: 'typecheck, launch:code, senior QA path smoke.', executeKey: 'it_health' },
  { id: 'auto_executive_org', name: 'Executive org scan', schedule: 'weekly', description: 'Vacant hats, division coverage, reporting lines.', executeKey: 'executive_org' },
  { id: 'auto_site_map', name: 'Site knowledge scan', schedule: 'daily', description: 'Route map + RAG index + execution registry audit.', executeKey: 'site_map_scan' },
  { id: 'auto_superhuman', name: 'Superhuman sweep', schedule: 'hourly', description: 'Validation + phone + social + hiring + ops health parallel.', executeKey: 'superhuman_sweep' },
];

export function getCoOwnerCatalogStats() {
  const mastery = getRoleMasteryStats();
  const archive = getKnowledgeArchiveStats();
  const exec = getExecutiveOrgStats();
  return {
    personalityTraits: CO_OWNER_PERSONALITY.length,
    superpowers: CO_OWNER_SUPERPOWERS.length,
    automations: CO_OWNER_AUTOMATIONS.length,
    operatingCapabilities: mastery.totalCapabilities,
    executableCapabilities: mastery.executableCapabilities,
    businessRoles: mastery.roles,
    executiveHats: exec.totalHats,
    executiveVacant: exec.vacant,
    knowledgeArchiveEntries: archive.totalArchiveEntries,
    operatingBrainSize: (mastery.totalCapabilities + CO_OWNER_SUPERPOWERS.length + exec.totalHats) * CO_OWNER_AI_TIER.intelligenceMultiplier,
  };
}

export { isCoOwnerTestingMode, getCoOwnerEnvironmentMode } from '../lib/coOwnerEnvironment';

/** @deprecated Use getCoOwnerCatalogStats — kept for imports */
export type CoOwnerTrait = CoOwnerPersonalityTrait;
export const CO_OWNER_TRAITS = CO_OWNER_PERSONALITY;

export function filterCoOwnerCatalog(query: string, kind: 'traits' | 'superpowers' | 'automations') {
  const q = query.trim().toLowerCase();
  const pool =
    kind === 'traits' ? CO_OWNER_PERSONALITY : kind === 'superpowers' ? CO_OWNER_SUPERPOWERS : CO_OWNER_AUTOMATIONS;
  if (!q) return pool;
  return pool.filter((item) => JSON.stringify(item).toLowerCase().includes(q));
}
