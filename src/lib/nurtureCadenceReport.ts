import { NURTURE_SEQUENCES } from '../domain/nurtureSequences';
import { listNurtureSendLog, rollupNurtureSends, type NurtureSendRollup } from '../data/nurtureSendLogRepo';

export function buildNurtureStepDelayMap(): Map<string, number> {
  const m = new Map<string, number>();
  for (const seq of NURTURE_SEQUENCES) {
    for (const step of seq.steps) {
      if (step.channel !== 'email') continue;
      m.set(`${seq.id}:${step.id}`, step.delayHours);
    }
  }
  return m;
}

export type NurtureCadenceRow = {
  sequenceId: string;
  name: string;
  stepId: string;
  delayHours: number;
  cadenceLabel: string;
  templateId: string;
  subject?: string;
};

function cadenceLabel(delayHours: number): string {
  if (delayHours <= 1) return 'Immediate (welcome)';
  if (delayHours <= 48) return 'Day 1–2';
  if (delayHours <= 120) return 'Day 3–5';
  if (delayHours <= 168) return 'Week 1';
  if (delayHours <= 336) return 'Week 2';
  if (delayHours <= 720) return 'Month 1';
  return 'Long-cycle';
}

/** Planned email schedule from sequence definitions (for ops review). */
export function listNurtureCadencePlan(): NurtureCadenceRow[] {
  const rows: NurtureCadenceRow[] = [];
  for (const seq of NURTURE_SEQUENCES) {
    if (!seq.enabled) continue;
    for (const step of seq.steps) {
      if (step.channel !== 'email') continue;
      rows.push({
        sequenceId: seq.id,
        name: seq.name,
        stepId: step.id,
        delayHours: step.delayHours,
        cadenceLabel: cadenceLabel(step.delayHours),
        templateId: step.templateId,
        subject: step.subject,
      });
    }
  }
  return rows.sort((a, b) => a.delayHours - b.delayHours || a.sequenceId.localeCompare(b.sequenceId));
}

export function buildNurtureOpsSnapshot(): { rollup: NurtureSendRollup; recentCount: number } {
  const entries = listNurtureSendLog(14);
  const rollup = rollupNurtureSends(entries, buildNurtureStepDelayMap());
  return { rollup, recentCount: entries.length };
}

/** Industry-aligned defaults (B2C lead nurture): welcome instant, touch day 1, value day 3–5, CTA day 7, trial/expiry day 14. */
export const NURTURE_TIMING_BEST_PRACTICE = [
  'Welcome + asset delivery: within minutes (0h delay).',
  'First follow-up: 24h — highest open rates when value-led, not sales-heavy.',
  'Mid-sequence education: 72–120h (3–5 days) — builds trust before session ask.',
  'Primary CTA (Book a session): ~168h (7 days) — after guide consumption window.',
  'Partner lifecycle: weekly pulses through day 30, then monthly education — avoid daily batch to same list.',
  'Affiliate toolkit: day 1 compliance templates, day 5 session — no paid ads required.',
] as const;
