/**
 * Rebecca Lane — Specialist Recruiting Follow-up sub-agent (Phase 5b
 * real-reasoning upgrade). Reads real specialist-recruiting funnel data — CRM
 * records whose `target` resolved to `'agents'` because they came from the
 * `credit_specialist_join` / `credit_specialist_guide` lead offers
 * (`crmRecordsRepo.ts` → `leadToRecord`, tagged `offer:credit_specialist_*`) —
 * and asks the agent brain which open applications are worth a real follow-up
 * task this cycle instead of going stale silently.
 */
import { listCrmRecords } from '../../../data/crmRecordsRepo';
import { crmRecordDisplayName } from '../../../domain/crmRecords';
import { runAgentBrainStep } from '../growthAgentBrain';
import { createMarketingTask, findOpenMarketingTask } from '../../marketingDesk/marketingDeskTasks';
import { ranToday, markRan } from './subagentCadence';

const AGENT_ID = 'specialist-recruit.follow_up';
const CADENCE_KEY = 'finely.rebecca.recruiting_cadence.v1';
const MAX_PER_RUN = 5;

function candidateApplicants() {
  return listCrmRecords({ target: 'agents' }).filter(
    (r) =>
      r.tags.some((t) => t.startsWith('offer:credit_specialist')) &&
      (r.stage === 'new' || r.stage === 'contacted'),
  );
}

export type RebeccaRecruitingResult = {
  ok: boolean;
  action?: string;
  message: string;
  processed?: number;
};

/** Run per-applicant (capped per run), once per local day per applicant — call from `agent_team_tick`. */
export async function runRebeccaRecruitingReview(): Promise<RebeccaRecruitingResult> {
  try {
    const candidates = candidateApplicants();
    if (!candidates.length) {
      return { ok: true, action: 'no_action', message: 'No open specialist applications waiting on follow-up.' };
    }

    let processed = 0;
    const messages: string[] = [];

    for (const record of candidates) {
      if (processed >= MAX_PER_RUN) break;
      if (ranToday(CADENCE_KEY, record.id)) continue;

      const daysOld = Math.round((Date.now() - Date.parse(record.createdAt)) / 86_400_000);
      const name = crmRecordDisplayName(record);
      const situationSummary = [
        `Specialist applicant ${name} applied ${daysOld} day(s) ago, currently at stage "${record.stage}".`,
        record.contact.email ? `Email on file: ${record.contact.email}.` : 'No email on file.',
      ].join(' ');

      const directive = await runAgentBrainStep({
        agentId: AGENT_ID,
        taskType: 'rebecca_recruiting_review',
        situationSummary,
        allowedActions: ['create_task', 'no_action'],
        autoExecutableActions: ['create_task'],
        entityType: 'crm_record',
        entityId: record.id,
      });

      markRan(CADENCE_KEY, record.id);

      if (directive.action === 'create_task' && directive.autoExecuted) {
        const existing = findOpenMarketingTask({ kind: 'nurture', recordId: record.id });
        if (!existing) {
          createMarketingTask({
            kind: 'nurture',
            title: `Specialist follow-up — ${name}`,
            notes: directive.reasoning,
            recordId: record.id,
            href: `/admin/crm?record=${record.id}`,
            tags: ['rebecca-recruiting', 'persona:specialist_recruit'],
            priority: daysOld >= 3 ? 'high' : 'normal',
            dueAt: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
            meta: { recordId: record.id, daysOld, stage: record.stage },
          });
        }
        processed++;
        messages.push(`${name}: task created.`);
        continue;
      }

      messages.push(`${name}: ${directive.reasoning || 'no action'}`);
    }

    return {
      ok: true,
      action: processed > 0 ? 'processed' : 'no_action',
      processed,
      message: messages.join(' | ') || 'Reviewed applicants — no action needed yet.',
    };
  } catch (e) {
    return { ok: false, message: (e as Error)?.message || 'Rebecca recruiting review failed.' };
  }
}
