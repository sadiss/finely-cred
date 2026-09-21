/**
 * Nurture engine — single dispatch path for academy/lounge emails.
 * Delegates to specialistAcademy email pipeline (Comms templates + send-email).
 * platform-cron can call processNurtureRetryQueue().
 */

import {
  type AcademyTraineeEmailEvent,
  triggerAcademyTraineeEmail,
  listAcademyTraineeOutbox,
} from '../specialistAcademy/academyTraineeEmailPipeline';

const RETRY_QUEUE_KEY = 'finely.nurture.retryQueue.v1';

export type NurtureDispatchArgs = {
  sequenceId: string;
  stepId: string;
  event: AcademyTraineeEmailEvent;
  toEmail: string;
  toName?: string;
  dedupeKey?: string;
  dedupeHours?: number;
  ctx: Record<string, unknown>;
};

export async function dispatchAcademyTraineeNurture(args: NurtureDispatchArgs) {
  const res = await triggerAcademyTraineeEmail({
    event: args.event,
    toEmail: args.toEmail,
    toName: args.toName,
    dedupeKey: args.dedupeKey ?? `${args.sequenceId}:${args.stepId}:${args.toEmail}`,
    dedupeHours: args.dedupeHours,
    ctx: args.ctx,
  });
  if (res.skipped && res.ok) {
    /* dry-run logged */
  }
  if (!res.ok && res.error) {
    enqueueNurtureRetry({ ...args, error: res.error, at: new Date().toISOString() });
  }
  return res;
}

type RetryItem = NurtureDispatchArgs & { at: string; error?: string };

function enqueueNurtureRetry(item: RetryItem) {
  try {
    const raw = JSON.parse(localStorage.getItem(RETRY_QUEUE_KEY) || '[]') as RetryItem[];
    const list = Array.isArray(raw) ? raw : [];
    list.unshift(item);
    localStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(list.slice(0, 50)));
  } catch {
    /* ignore */
  }
}

/** Called by platform-cron edge when scheduled (see docs/PLATFORM_CRON.md). */
export async function processNurtureRetryQueue(limit = 10): Promise<{ processed: number }> {
  let processed = 0;
  try {
    const raw = JSON.parse(localStorage.getItem(RETRY_QUEUE_KEY) || '[]') as RetryItem[];
    const queue = Array.isArray(raw) ? raw : [];
    const remaining: RetryItem[] = [];
    for (const item of queue) {
      if (processed >= limit) {
        remaining.push(item);
        continue;
      }
      const res = await dispatchAcademyTraineeNurture(item);
      if (res.ok) processed += 1;
      else remaining.push(item);
    }
    localStorage.setItem(RETRY_QUEUE_KEY, JSON.stringify(remaining));
  } catch {
    /* ignore */
  }
  return { processed };
}

export function getNurtureDiagnostics() {
  return {
    outbox: listAcademyTraineeOutbox(),
    retryQueueLength: (() => {
      try {
        return (JSON.parse(localStorage.getItem(RETRY_QUEUE_KEY) || '[]') as unknown[]).length;
      } catch {
        return 0;
      }
    })(),
  };
}
