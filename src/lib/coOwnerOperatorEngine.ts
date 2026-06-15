/**
 * Co-owner operator engine — executable automations, hire/promote suggestions, role training.
 */

import type { AgentPersonaId } from '../domain/agentPersonas';
import { AGENT_PERSONAS } from '../domain/agentPersonas';
import { AGENT_TRAINING_PHASES } from '../domain/agentProgram';
import { listRoleCoverageGaps, loadStaffRoster } from '../data/staffRoster';
import { CO_OWNER_AUTOMATIONS, CO_OWNER_SUPERPOWERS } from '../domain/coOwnerPersona';
import { getExecutiveOrgStats } from '../domain/coOwnerExecutiveStructure';
import {
  capabilitiesForRole,
  CO_OWNER_ROLE_META,
  type CoOwnerBusinessRole,
  getRoleMasteryStats,
} from '../domain/coOwnerRoleMastery';
import { getKnowledgeArchiveStats } from '../domain/coOwnerKnowledgeArchive';
import {
  executeCoOwnerStaffAction,
  getCoOwnerStaffSnapshot,
  type CoOwnerStaffAction,
} from './coOwnerStaffActions';
import { executeCoOwnerAutomationNow } from './coOwnerAutomationRunner';

export type CoOwnerSuggestedAction = {
  id: string;
  kind: 'hire' | 'promote_staff' | 'promote_agent' | 'automation' | 'training';
  title: string;
  reason: string;
  action?: CoOwnerStaffAction;
  prompt?: string;
  executeKey?: string;
};

export type CoOwnerAutomationRunResult = {
  ok: boolean;
  message: string;
  prompt?: string;
  navigateTo?: string;
};

const AUTOMATION_PROMPTS: Record<string, string> = {
  daily_ops:
    'Run a 5× deep daily ops review. TESTING MODE — low partner/lead/revenue counts are expected. Nine-lens synthesis: headline verdict, deep read, top 5 priorities with verify steps, people/automations, stewardship close.',
  co_ceo_brief:
    'Deliver a 5× deep executive brief: nine-lens synthesis, 48h priorities, 2-week risks, people/automation moves. Testing-aware — never alarm on empty CRM.',
  launch_audit: 'Run a strict launch-readiness audit: identify what is missing, broken, inconsistent, or confusing. Give a punchlist ordered by impact.',
  nurture_health: 'Audit nurture sequences: dry-run vs live comms, welcome dedupe, and completion rates. List fixes.',
  phone_sla: 'Review phone queue SLA: missed calls, voicemail backlog, and agent callback tasks.',
  validation_clocks: 'List all open validation letter deadlines, FDCPA 30-day windows, and summons clocks requiring action.',
  billing_dunning: 'Review past-due partners, invoice dunning cadence, and billing blocks.',
  affiliate_residual: 'Check affiliate commission accrual, payout readiness, and compliance copy on promo links.',
  it_health: 'Run platform health check: typecheck, launch gates, Supabase sync, and critical UX regressions.',
  auto_hire_staff: 'Run autonomous hiring — fill C-suite and coverage gaps on roster now.',
  executive_org: 'Review executive org structure and vacant division hats.',
  dev_triage: 'Run dev triage: engineering priorities, launch gates, ops health — ordered by impact.',
  site_map_scan: 'Scan full site map — surfaces, knowledge index, execution registry.',
  code_studio: 'Dev Studio: author complete site or external code via coowner-dev block.',
  create_agent: 'Agent factory: new specialist with system prompt + optional roster hire.',
  superhuman_sweep: 'Superhuman sweep: validation, phone, social, hiring, ops health — one brief.',
};

export function suggestCoOwnerActions(): CoOwnerSuggestedAction[] {
  const suggestions: CoOwnerSuggestedAction[] = [];
  const exec = getExecutiveOrgStats();

  if (exec.vacant > 0) {
    suggestions.push({
      id: 'auto_hire_executives',
      kind: 'automation',
      title: 'Autonomous executive hiring',
      reason: `${exec.vacant} vacant executive hat(s) — Ruth will hire CMO, CFO, COO, and division leaders.`,
      executeKey: 'auto_hire_staff',
    });
  }

  const gapLines = listRoleCoverageGaps(AGENT_PERSONAS.map((p) => p.id));
  if (gapLines.length) {
    suggestions.push({
      id: 'auto_hire_gaps',
      kind: 'automation',
      title: 'Fill role coverage gaps',
      reason: gapLines.slice(0, 2).join(' · '),
      executeKey: 'auto_hire_staff',
    });
  }

  suggestions.push({
    id: 'executive_org_scan',
    kind: 'automation',
    title: 'Executive org scan',
    reason: `${exec.totalHats} hats across ${exec.divisions} divisions.`,
    executeKey: 'executive_org',
  });

  const roster = loadStaffRoster().filter((s) => s.active !== false);
  if (roster.length >= 2) {
    const candidate = roster[roster.length - 1]!;
    suggestions.push({
      id: `suggest_promote_${candidate.id}`,
      kind: 'promote_staff',
      title: `Review promotion for ${candidate.firstName}`,
      reason: 'Cross-train senior staff for coverage resilience.',
      action: {
        type: 'promote_staff',
        staffId: candidate.id,
        newRoleId: 'finely_advisor',
      },
    });
  }

  suggestions.push({
    id: 'suggest_train_setter',
    kind: 'training',
    title: 'Train appointment setter module',
    reason: 'Role mastery L1–L3 curriculum ready.',
    prompt: 'Train me as an appointment setter — give L1 curriculum: scripts, objection handling, and booking discipline.',
    executeKey: 'train_role',
  });

  for (const auto of CO_OWNER_AUTOMATIONS.slice(0, 3)) {
    suggestions.push({
      id: `run_${auto.id}`,
      kind: 'automation',
      title: `Run: ${auto.name}`,
      reason: auto.description,
      executeKey: auto.executeKey,
      prompt: AUTOMATION_PROMPTS[auto.executeKey],
    });
  }

  return suggestions;
}

export function runCoOwnerAutomation(executeKey: string): CoOwnerAutomationRunResult {
  return executeCoOwnerAutomationNow(executeKey);
}

export function executeSuggestedAction(action: CoOwnerSuggestedAction): {
  ok: boolean;
  message: string;
  prompt?: string;
  navigateTo?: string;
} {
  if (action.action) {
    const res = executeCoOwnerStaffAction(action.action);
    return { ok: res.ok, message: res.message };
  }
  if (action.executeKey === 'train_role') {
    const prompt = buildRoleTrainingPrompt('appointment_setter', 1);
    return { ok: true, message: 'Training curriculum ready.', prompt, navigateTo: '/portal/training/academy' };
  }
  if (action.prompt && !action.executeKey) {
    return { ok: true, message: `Ready: ${action.title}`, prompt: action.prompt };
  }
  if (action.executeKey) {
    const run = runCoOwnerAutomation(action.executeKey);
    return { ok: run.ok, message: run.message, prompt: run.prompt, navigateTo: run.navigateTo };
  }
  if (action.prompt) {
    return { ok: true, message: `Ready: ${action.title}`, prompt: action.prompt };
  }
  return { ok: false, message: 'No executable action.' };
}

export function buildRoleTrainingPrompt(roleId: CoOwnerBusinessRole, level = 1) {
  const meta = CO_OWNER_ROLE_META[roleId];
  const caps = capabilitiesForRole(roleId, level as 1).slice(0, 8);
  return [
    `Train the owner/team as ${meta.title} at mastery level ${level}.`,
    `Capabilities to cover:\n${caps.map((c) => `- ${c.skill}`).join('\n')}`,
    'Use plain language, exercises, and one measurable outcome for this session.',
  ].join('\n\n');
}

export function getCoOwnerOperatingSnapshot() {
  return {
    stats: getCoOwnerCatalogStatsCompat(),
    mastery: getRoleMasteryStats(),
    archive: getKnowledgeArchiveStats(),
    staff: getCoOwnerStaffSnapshot(),
    superpowers: CO_OWNER_SUPERPOWERS.filter((s) => s.executable).map((s) => s.name),
    automations: CO_OWNER_AUTOMATIONS.map((a) => ({ id: a.id, name: a.name, schedule: a.schedule })),
  };
}

function getCoOwnerCatalogStatsCompat() {
  const mastery = getRoleMasteryStats();
  const archive = getKnowledgeArchiveStats();
  return {
    operatingBrainSize: mastery.totalCapabilities + CO_OWNER_SUPERPOWERS.length,
    businessRoles: mastery.roles,
    superpowers: CO_OWNER_SUPERPOWERS.length,
    automations: CO_OWNER_AUTOMATIONS.length,
    knowledgeArchiveEntries: archive.totalArchiveEntries,
  };
}