/**
 * Co-owner Ruth — runtime environment + 5× deep intelligence context for prompts and snapshots.
 */

import { isSupabaseConfigured } from './supabaseClient';
import { isFeatureEnabled } from '../data/settingsRepo';
import { getLaunchFinalReadiness } from './launchFinalReadinessOps';
import { getExecutiveOrgStats, listVacantExecutiveHats } from '../domain/coOwnerExecutiveStructure';
import { getCoOwnerStaffSnapshot } from './coOwnerStaffActions';
import { summarizeAutonomousHiringForCoOwner } from './coOwnerAutonomousHiring';
import { summarizeExecutiveStructureForCoOwner } from '../domain/coOwnerExecutiveStructure';
import { summarizeProductionOpsRunnerForCoOwner } from './productionOpsRunnerOps';
import { summarizeLaunchFinalReadinessForCoOwner } from './launchFinalReadinessOps';
import { summarizeLaunchHandoffForCoOwner } from './launchHandoffOps';
import { summarizeGoLiveForCoOwner } from './goLiveCommandOps';
import { getStaffIntelligenceSummary } from './staffIntelligenceEngine';
import { getLastPlatformCronResult } from './platformCronStore';
import {
  buildCoOwnerDeepReasoningPrompt,
  CO_OWNER_DEEP_AI_LIMITS,
  CO_OWNER_INTELLIGENCE_MULTIPLIER,
  summarizeDeepIntelligenceForCoOwner,
} from './coOwnerDeepIntelligence';
import { buildCoOwnerSiteKnowledgeContext, summarizeSiteKnowledgeMapForCoOwner } from './coOwnerSiteKnowledgeMap';
import { summarizeExecutionRegistryForCoOwner } from './coOwnerExecutionRegistry';
import { summarizeDevStudioForCoOwner } from './coOwnerDevStudio';
import { summarizeCoOwnerSuperhumanForCoOwner } from './coOwnerSuperhumanOps';
import { buildOpsHealthSnapshot } from './opsHealthDashboard';
import { getRoleMasteryStats } from '../domain/coOwnerRoleMastery';
import { getKnowledgeArchiveStats } from '../domain/coOwnerKnowledgeArchive';
import {
  getCoOwnerEnvironmentMode,
  isCoOwnerTestingMode,
  type CoOwnerEnvironmentMode,
} from './coOwnerEnvironment';

export type { CoOwnerEnvironmentMode };
export {
  getCoOwnerEnvironmentMode,
  setCoOwnerEnvironmentMode,
  isCoOwnerTestingMode,
  CO_OWNER_TESTING_DOCTRINE,
  buildCoOwnerTestingPromptBlock,
} from './coOwnerEnvironment';

export function buildCoOwnerIntelligenceBrief(extra?: Record<string, unknown>, opts?: { query?: string; route?: string }): string {
  const mode = getCoOwnerEnvironmentMode();
  const readiness = getLaunchFinalReadiness();
  const exec = getExecutiveOrgStats();
  const mastery = getRoleMasteryStats();
  const archive = getKnowledgeArchiveStats();
  const vacantCsuite = listVacantExecutiveHats('c_suite')
    .slice(0, 8)
    .map((h) => h.title);
  const vacantEvps = listVacantExecutiveHats('evp')
    .slice(0, 4)
    .map((h) => h.title);
  const staff = getCoOwnerStaffSnapshot();
  const cron = getLastPlatformCronResult();
  const staffIntel = getStaffIntelligenceSummary();

  const lines = [
    summarizeDeepIntelligenceForCoOwner(),
    summarizeSiteKnowledgeMapForCoOwner(),
    summarizeExecutionRegistryForCoOwner(),
    summarizeDevStudioForCoOwner(),
    summarizeCoOwnerSuperhumanForCoOwner(),
    buildCoOwnerSiteKnowledgeContext(opts?.query ?? 'operations launch credit', opts?.route),
    `Ops health: ${JSON.stringify(buildOpsHealthSnapshot()).slice(0, 600)}`,
    `Environment: ${mode.toUpperCase()} · supabase=${isSupabaseConfigured ? 'configured' : 'marketing-only/test'} · aiGateway=${isFeatureEnabled('aiGateway') ? 'on' : 'off'}`,
    `Operating substrate: ${mastery.totalCapabilities} role capabilities · ${archive.totalArchiveEntries} archive refs · ${exec.totalHats} executive hats`,
    summarizeGoLiveForCoOwner().split('\n').slice(0, 4).join('\n'),
    summarizeLaunchFinalReadinessForCoOwner().split('\n').slice(0, 6).join('\n'),
    summarizeLaunchHandoffForCoOwner().split('\n').slice(0, 3).join('\n'),
    `Executive org: ${exec.totalHats} hats · ${exec.filled} filled · ${exec.vacant} vacant`,
    `C-suite gaps: ${vacantCsuite.join(' · ') || 'none'}`,
    `EVP gaps (sample): ${vacantEvps.join(' · ') || 'none'}`,
    summarizeAutonomousHiringForCoOwner(),
    `Staff: ${staff.activeStaff} active · ${staff.coverageGaps.length} coverage gap(s)`,
    staffIntel ? `Staff intel: ${JSON.stringify(staffIntel).slice(0, 800)}` : '',
    cron?.coOwnerSuperhuman ? `Last superhuman sweep: ${cron.coOwnerSuperhuman.summary}` : '',
    cron?.coOwnerHiring ? `Last cron hiring: ${cron.coOwnerHiring.summary}` : '',
    summarizeProductionOpsRunnerForCoOwner().split('\n').slice(0, 2).join('\n'),
    summarizeExecutiveStructureForCoOwner().split('\n').slice(0, 4).join('\n'),
  ].filter(Boolean);

  if (mode === 'testing') {
    lines.unshift('⚠ TESTING MODE — sparse CRM/revenue is EXPECTED. Scorecard = launch gates + platform tests.');
  }

  if (extra && Object.keys(extra).length) {
    lines.push(`Tenant snapshot:\n${JSON.stringify(extra, null, 2)}`);
  }

  return lines.join('\n');
}

export function getCoOwnerRuntimeContext(tenantSnapshot?: Record<string, unknown>) {
  return {
    environmentMode: getCoOwnerEnvironmentMode(),
    testingMode: isCoOwnerTestingMode(),
    intelligenceMultiplier: CO_OWNER_INTELLIGENCE_MULTIPLIER,
    intelligenceTier: CO_OWNER_DEEP_AI_LIMITS.reasoningDepth,
    aiProvider: 'anthropic',
    aiModel: CO_OWNER_DEEP_AI_LIMITS.preferredModel,
    maxOutputTokens: CO_OWNER_DEEP_AI_LIMITS.maxOutputTokens,
    staffIntel: getStaffIntelligenceSummary(),
    staffOps: getCoOwnerStaffSnapshot(),
    launchReadiness: getLaunchFinalReadiness(),
    executiveOrg: getExecutiveOrgStats(),
    executiveSummary: summarizeExecutiveStructureForCoOwner(),
    siteKnowledge: summarizeSiteKnowledgeMapForCoOwner(),
    executionRegistry: summarizeExecutionRegistryForCoOwner(),
    devStudio: summarizeDevStudioForCoOwner(),
    deepIntelligence: summarizeDeepIntelligenceForCoOwner(),
    intelligenceBrief: buildCoOwnerIntelligenceBrief(tenantSnapshot),
    testingDoctrineApplied: isCoOwnerTestingMode(),
  };
}

/** @deprecated Renamed — use buildCoOwnerDeepReasoningPrompt */
export const CO_OWNER_4X_REASONING_FRAMEWORK = buildCoOwnerDeepReasoningPrompt();
