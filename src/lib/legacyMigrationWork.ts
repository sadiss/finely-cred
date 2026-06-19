import type { LegacyPartnerExportV1 } from '../domain/imports';
import type { PartnerLane, PartnerRoute } from '../domain/partners';
import type { WorkScope } from '../domain/projects';
import { ensureDefaultProjectForPartner } from '../data/projectsRepo';
import { listTasksByPartner } from '../data/tasksRepo';
import { applyPlaybooksToProject } from '../features/work/playbooks/applyPlaybooksToProject';
import { ALL_TASK_PLAYBOOKS } from '../features/work/playbooks/playbookSeed';
import { createTask } from '../data/tasksRepo';
import { buildLegacyMigrationTasks } from './legacyMigrationExport';

function scopeFromPartner(p: LegacyPartnerExportV1['partners'][0]): WorkScope {
  const route = (p.primaryRoute || '') as PartnerRoute;
  if (route.includes('business')) return 'business';
  return 'personal';
}

function laneCategorySlugs(lane?: PartnerLane | null, route?: PartnerRoute | null): string[] {
  const l = lane || '';
  const r = route || '';
  if (l.includes('debt') || r.includes('debt')) {
    return ALL_TASK_PLAYBOOKS.filter((pb) => pb.categories.includes('debt_legal')).map((pb) => pb.slug);
  }
  if (l.includes('business') || r.includes('business')) {
    return ALL_TASK_PLAYBOOKS.filter((pb) => pb.categories.includes('business_credit')).map((pb) => pb.slug);
  }
  return ALL_TASK_PLAYBOOKS.filter((pb) => pb.categories.includes('personal_credit')).map((pb) => pb.slug);
}

function coreSlugsForScope(scope: WorkScope): string[] {
  const core = [
    'welcome_intake',
    'consent_docs',
    'upload_reports',
    'parse_reports',
    'upload_id_poa',
    'evidence_checklist',
    'dispute_candidates',
    'draft_letters',
    'mail_certified',
    'bureau_followup',
    'collect_responses',
    'debt_inventory',
    'identity_theft_review',
    'funding_readiness',
    'monthly_checkin',
  ];
  if (scope === 'business') {
    return [
      'biz_sprint_kickoff',
      'biz_ein_verify',
      'biz_sos',
      'biz_fundability_audit',
      'biz_duns',
      'biz_secrets',
      'biz_nexus',
      'biz_vendor_net30',
      'biz_tier1_vendors',
      'biz_tier2_vendors',
      'biz_ucc_review',
      'biz_pg_strategy',
      'biz_bank_account',
      'biz_line_of_credit',
      'biz_maintenance',
    ];
  }
  return core;
}

export function resolveLegacyImportPlaybookIds(p: LegacyPartnerExportV1['partners'][0]): string[] {
  const scope = scopeFromPartner(p);
  const slugs = new Set<string>([...coreSlugsForScope(scope), ...laneCategorySlugs(p.lane, p.primaryRoute)]);
  const appStatus = Number(p.journeySignals?.legacyApplicationStatus ?? 0);
  if (appStatus >= 10) {
    slugs.add('personal_dispute_round2');
    slugs.add('bureau_followup');
    slugs.add('debt_followup_30');
  }
  if ((p.legacyReports?.length ?? 0) > 0) {
    slugs.add('parse_reports');
    slugs.add('personal_bureau_sync');
    slugs.add('personal_tradeline_review');
  }
  if ((p.legacyLetters?.length ?? 0) > 0 || (p.legacyDocuments?.length ?? 0) > 5) {
    slugs.add('draft_letters');
    slugs.add('mail_certified');
    slugs.add('collect_responses');
  }
  return ALL_TASK_PLAYBOOKS.filter((pb) => slugs.has(pb.slug)).map((pb) => pb.id);
}

export function seedLegacyPartnerWorkPipeline(args: {
  partnerId: string;
  exportPartner: LegacyPartnerExportV1['partners'][0];
  dryRun?: boolean;
}): { tasksCreated: number; projectId?: string; playbooksApplied: number } {
  const scope = scopeFromPartner(args.exportPartner);
  let tasksCreated = 0;
  let playbooksApplied = 0;
  let projectId: string | undefined;

  if (args.dryRun) {
    const playbookIds = resolveLegacyImportPlaybookIds(args.exportPartner);
    const legacyTasks = buildLegacyMigrationTasks(
      args.exportPartner.journeyStage,
      Number(args.exportPartner.journeySignals?.legacyApplicationStatus ?? 1),
      args.exportPartner,
    );
    return { tasksCreated: legacyTasks.length + playbookIds.length, playbooksApplied: playbookIds.length };
  }

  const project = ensureDefaultProjectForPartner({ partnerId: args.partnerId, scope });
  projectId = project.id;

  const existing = listTasksByPartner(args.partnerId);
  const hasLegacyTag = existing.some((t) => (t.tags ?? []).includes('legacy-import'));
  if (!hasLegacyTag) {
    const playbookIds = resolveLegacyImportPlaybookIds(args.exportPartner);
    if (playbookIds.length) {
      applyPlaybooksToProject({
        partnerId: args.partnerId,
        projectId: project.id,
        scope,
        playbookIds,
      });
      playbooksApplied = playbookIds.length;
    }

    const legacyTasks = buildLegacyMigrationTasks(
      args.exportPartner.journeyStage,
      Number(args.exportPartner.journeySignals?.legacyApplicationStatus ?? 1),
      args.exportPartner,
    );
    for (const t of legacyTasks) {
      createTask({
        partnerId: args.partnerId,
        projectId: project.id,
        scope,
        title: t.title,
        kind: t.kind,
        stage: t.stage,
        priority: t.priority ?? 'normal',
        status: t.status ?? 'pending',
        notes: t.notes,
        tags: [...(t.tags ?? []), 'legacy-import'],
        assignedTo: t.kind === 'mail_letter' || t.kind === 'follow_up' ? 'admin' : 'partner',
      });
      tasksCreated += 1;
    }
  }

  return { tasksCreated, projectId, playbooksApplied };
}
