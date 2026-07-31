/**
 * "Work goes to" + optional alternate seat (round-robin) for Marketing Desk tasks.
 */
import { loadJson, saveJson } from '../../data/localJsonStore';

const KEY = 'finely.marketing_desk_assignee.v1';

export type MarketingDeskSeat = {
  label: string;
  userId?: string;
  email?: string;
};

export type MarketingDeskAssignee = MarketingDeskSeat & {
  /** Alternate seat for multi-hire fairness */
  alternateLabel?: string;
  alternateUserId?: string;
  alternateEmail?: string;
  /** primary = always Work goes to; round_robin = alternate with Alternate */
  mode?: 'primary' | 'round_robin';
  /** Next seat index when round_robin (0 = primary, 1 = alternate) */
  rrNext?: 0 | 1;
};

function normSeat(label: string | undefined, email?: string, userId?: string): MarketingDeskSeat {
  const resolved = (label || email || 'Marketing').trim() || 'Marketing';
  return {
    label: resolved,
    userId: userId?.trim() || undefined,
    email: email?.trim() || undefined,
  };
}

export function getMarketingDeskAssignee(): MarketingDeskAssignee {
  const raw = loadJson<Partial<MarketingDeskAssignee>>(KEY, {}, 1);
  const primary = normSeat(raw.label, raw.email, raw.userId);
  const altLabel = (raw.alternateLabel || raw.alternateEmail || '').trim();
  return {
    ...primary,
    alternateLabel: altLabel || undefined,
    alternateUserId: raw.alternateUserId?.trim() || undefined,
    alternateEmail: raw.alternateEmail?.trim() || undefined,
    mode: raw.mode === 'round_robin' ? 'round_robin' : 'primary',
    rrNext: raw.rrNext === 1 ? 1 : 0,
  };
}

export function setMarketingDeskAssignee(next: MarketingDeskAssignee) {
  const primary = normSeat(next.label, next.email, next.userId);
  const altLabel = (next.alternateLabel || next.alternateEmail || '').trim();
  saveJson(
    KEY,
    {
      label: primary.label,
      userId: primary.userId,
      email: primary.email,
      alternateLabel: altLabel || undefined,
      alternateUserId: next.alternateUserId?.trim() || undefined,
      alternateEmail: next.alternateEmail?.trim() || undefined,
      mode: next.mode === 'round_robin' ? 'round_robin' : 'primary',
      rrNext: next.rrNext === 1 ? 1 : 0,
    },
    1,
  );
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('finely:store'));
}

function hasAlternate(a: MarketingDeskAssignee): boolean {
  return Boolean((a.alternateLabel || a.alternateEmail || '').trim());
}

/** Seat used for the next createTask (advances rr when round_robin + alternate set). */
export function pickMarketingDeskSeatForTask(): MarketingDeskSeat {
  const a = getMarketingDeskAssignee();
  if (a.mode !== 'round_robin' || !hasAlternate(a)) {
    return { label: a.label, userId: a.userId, email: a.email };
  }
  const useAlt = a.rrNext === 1;
  const seat: MarketingDeskSeat = useAlt
    ? {
        label: (a.alternateLabel || a.alternateEmail || 'Marketing').trim() || 'Marketing',
        userId: a.alternateUserId,
        email: a.alternateEmail,
      }
    : { label: a.label, userId: a.userId, email: a.email };

  setMarketingDeskAssignee({
    ...a,
    rrNext: useAlt ? 0 : 1,
  });
  return seat;
}

/** Values for createTask assignee fields (round-robin aware). */
export function marketingTaskAssigneeFields(): {
  assignedTo: 'admin';
  assigneeUserIds?: string[];
  labels?: string[];
} {
  const seat = pickMarketingDeskSeatForTask();
  return {
    assignedTo: 'admin',
    assigneeUserIds: seat.userId ? [seat.userId] : undefined,
    labels: seat.label ? [`Assignee: ${seat.label}`] : undefined,
  };
}

/** Labels/userIds that count as "my work" for Desk home filter. */
export function marketingDeskAssigneePool(): MarketingDeskSeat[] {
  const a = getMarketingDeskAssignee();
  const seats: MarketingDeskSeat[] = [{ label: a.label, userId: a.userId, email: a.email }];
  if (hasAlternate(a)) {
    seats.push({
      label: (a.alternateLabel || a.alternateEmail || '').trim(),
      userId: a.alternateUserId,
      email: a.alternateEmail,
    });
  }
  return seats.filter((s) => s.label);
}
