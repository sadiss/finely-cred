/**
 * Ruth superhuman automation snapshot (wave 71) — cron + runtime telemetry.
 */

import { listOpenValidationClocks } from './validationLetterEngine';
import { listMissedCalls } from '../data/phoneThreadsRepo';
import { buildOpsHealthSnapshot } from './opsHealthDashboard';
import { getCoOwnerDevStudioStats } from './coOwnerDevStudio';
import { summarizeSiteKnowledgeMapForCoOwner } from './coOwnerSiteKnowledgeMap';
import { summarizeExecutionRegistryForCoOwner } from './coOwnerExecutionRegistry';
import { getExecutiveOrgStats } from '../domain/coOwnerExecutiveStructure';
import { summarizeAutonomousHiringForCoOwner } from './coOwnerAutonomousHiring';
import { isCoOwnerTestingMode } from './coOwnerRuntimeContext';

export type CoOwnerSuperhumanCronSnapshot = {
  at: string;
  dryRun: boolean;
  testingMode: boolean;
  opsStatus: ReturnType<typeof buildOpsHealthSnapshot>['status'];
  validationClocks: number;
  missedCalls: number;
  devProjects: number;
  agentSpecs: number;
  executiveVacant: number;
  summary: string;
};

export function buildCoOwnerSuperhumanCronSnapshot(opts?: { dryRun?: boolean }): CoOwnerSuperhumanCronSnapshot {
  const dryRun = opts?.dryRun ?? true;
  const health = buildOpsHealthSnapshot();
  const dev = getCoOwnerDevStudioStats();
  const exec = getExecutiveOrgStats();
  const clocks = listOpenValidationClocks().length;
  const missed = listMissedCalls().length;
  const testing = isCoOwnerTestingMode();

  const summary = [
    `Superhuman sweep ${dryRun ? '(dry-run)' : '(live)'}`,
    `ops=${health.status}`,
    `validation=${clocks}`,
    `phone_missed=${missed}`,
    `dev=${dev.projects}/${dev.agentSpecs}`,
    `exec_vacant=${exec.vacant}`,
    testing ? 'env=testing' : 'env=live',
  ].join(' · ');

  return {
    at: new Date().toISOString(),
    dryRun,
    testingMode: testing,
    opsStatus: health.status,
    validationClocks: clocks,
    missedCalls: missed,
    devProjects: dev.projects,
    agentSpecs: dev.agentSpecs,
    executiveVacant: exec.vacant,
    summary,
  };
}

export function summarizeCoOwnerSuperhumanForCoOwner(): string {
  const snap = buildCoOwnerSuperhumanCronSnapshot({ dryRun: true });
  return [
    'RUTH SUPERHUMAN LAYER (wave 71 — post-seal):',
    snap.summary,
    summarizeSiteKnowledgeMapForCoOwner().split('\n')[0] ?? '',
    summarizeExecutionRegistryForCoOwner(),
    summarizeAutonomousHiringForCoOwner().split('\n')[0] ?? '',
    'Hub: /admin/ops-agent · Dev Studio: /admin/ops-agent#dev-studio',
  ].filter(Boolean).join('\n');
}
