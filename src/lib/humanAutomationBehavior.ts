/** Human-like automation execution — staggered delays, persona voice in run logs. */
import type { AutomationRule, AutomationRunLog } from '../domain/automationStudio';

export type HumanAutomationMeta = {
  humanAutomation?: boolean;
  personaId?: string;
  humanDelayMinutes?: number;
  humanTone?: string;
};

export function isHumanAutomationRule(rule: AutomationRule): boolean {
  return Boolean((rule.meta as HumanAutomationMeta)?.humanAutomation);
}

export function humanDelayMsForRule(rule: AutomationRule): number {
  const mins = Number((rule.meta as HumanAutomationMeta)?.humanDelayMinutes ?? 0);
  if (!mins) return 0;
  const jitter = Math.floor(Math.random() * 120_000);
  return mins * 60_000 + jitter;
}

export async function withHumanCadence<T>(rule: AutomationRule, fn: () => Promise<T>): Promise<T> {
  const delay = humanDelayMsForRule(rule);
  if (delay > 0 && delay <= 120_000) {
    await new Promise((r) => setTimeout(r, delay));
  }
  return fn();
}

export function enrichRunLogWithHumanVoice(rule: AutomationRule, run: AutomationRunLog): AutomationRunLog {
  if (!isHumanAutomationRule(rule)) return run;
  const meta = rule.meta as HumanAutomationMeta;
  const persona = meta.personaId?.replace(/_/g, ' ') ?? 'staff';
  const tone = meta.humanTone ?? 'warm';
  return {
    ...run,
    summary: `${run.summary} · Human cadence (${persona}, ${tone})`,
  };
}
