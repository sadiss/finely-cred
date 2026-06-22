import type { CrmRecord } from '../../../domain/crmRecords';

export type CallTimeSlot = {
  id: string;
  label: string;
  window: string;
  score: number;
  reason: string;
  daypart: 'morning' | 'midday' | 'afternoon' | 'evening';
};

export type CallTimeOptimizerResult = {
  timezoneHint: string;
  bestSlots: CallTimeSlot[];
  avoidWindows: string[];
  scriptOpener: string;
};

const SLOT_TEMPLATES: Omit<CallTimeSlot, 'score' | 'reason'>[] = [
  { id: 'tue_am', label: 'Tuesday morning', window: 'Tue 9:00–11:00 local', daypart: 'morning' },
  { id: 'wed_mid', label: 'Wednesday midday', window: 'Wed 11:30–13:00 local', daypart: 'midday' },
  { id: 'thu_pm', label: 'Thursday afternoon', window: 'Thu 14:00–16:00 local', daypart: 'afternoon' },
  { id: 'fri_am', label: 'Friday morning', window: 'Fri 9:30–11:30 local', daypart: 'morning' },
];

function inferTimezone(record: CrmRecord): string {
  const phone = record.contact.phone?.replace(/\D/g, '') ?? '';
  if (phone.startsWith('1') && phone.length >= 10) return 'US time zones (infer from area code when scheduling)';
  if (record.contact.company) return 'Business hours — align to company HQ if known';
  return 'Customer /local time — confirm on first reply';
}

function scoreSlot(slot: Omit<CallTimeSlot, 'score' | 'reason'>, record: CrmRecord): CallTimeSlot {
  let score = 55;
  let reason = 'Solid mid-week window for credit consult calls';

  if (record.stage === 'new' || record.stage === 'contacted') {
    if (slot.daypart === 'morning') { score += 18; reason = 'Fresh leads respond best to morning outreach'; }
    if (slot.id === 'tue_am') score += 8;
  }
  if (record.stage === 'booked' || record.stage === 'replied') {
    if (slot.daypart === 'afternoon') { score += 15; reason = 'Engaged prospects often prefer afternoon follow-ups'; }
  }
  if (record.score != null && record.score >= 70) {
    score += 10;
    reason = 'Hot lead — prioritize earliest high-conversion window';
  }
  if (record.workSignals?.riskLevel === 'high') {
    score += 12;
    reason = 'Work at risk — call sooner in week to prevent churn';
  }
  if (record.attribution?.consentToContact === false) {
    score = 0;
    reason = 'No contact consent — do not call';
  }

  return { ...slot, score: Math.min(100, score), reason };
}

export function buildCallTimeOptimizer(record: CrmRecord): CallTimeOptimizerResult {
  const timezoneHint = inferTimezone(record);
  const bestSlots = SLOT_TEMPLATES.map((s) => scoreSlot(s, record))
    .filter((s) => s.score > 0)
    .sort((a, B) => B.score - a.score)
    .slice(0, 3);

  const name = record.contact.fullName?.split(' ')[0] || 'there';
  const scriptOpener =
    record.stage === 'booked'
      ? `Hi ${name}, this is Finely Cred — calling at our scheduled time. Do you still have a few minutes to walk through your credit goals?`
      : `Hi ${name}, this is Finely Cred following up on your inquiry. Is now a good time, or should I call back during ${bestSlots[0]?.window ?? 'a better window'}?`;

  return {
    timezoneHint,
    bestSlots,
    avoidWindows: ['Mon before 10:00 (inbox overload)', 'Sun / late evening (low answer rate)', 'Within 1h of mass email blast'],
    scriptOpener,
  };
}
