/** Execute server-queued automation rules locally (run_workflow); create_task runs server-side into work_tasks. */
import type { AutomationRule } from '../domain/automationStudio';
import { runAutomationRule } from '../automation/agentRunner';
import {
  fetchPendingServerAutomationQueue,
  markServerAutomationQueueProcessed,
} from '../data/serverAutomationQueueRepo';

export type DrainServerAutomationResult = {
  drained: number;
  failed: number;
};

export async function drainServerAutomationQueue(max = 12): Promise<DrainServerAutomationResult> {
  const pending = await fetchPendingServerAutomationQueue(max);
  let drained = 0;
  let failed = 0;

  for (const item of pending) {
    try {
      if (item.actionType === 'execute_rule' && item.payload.rule) {
        const rule = item.payload.rule as AutomationRule;
        await runAutomationRule({ ...rule, id: item.ruleId || rule.id }, 'live');
      }
      await markServerAutomationQueueProcessed(item.id);
      drained += 1;
    } catch {
      failed += 1;
    }
  }

  return { drained, failed };
}
