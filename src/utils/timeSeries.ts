export function startOfDayIso(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

export function daysBack(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function bucketCountsByDay<T>(args: {
  items: T[];
  /** ISO timestamp accessor */
  getIso: (item: T) => string | undefined | null;
  days: number;
}): { labels: string[]; values: number[] } {
  const days = Math.max(3, Math.round(args.days));
  const start = daysBack(days - 1);
  const buckets = new Map<string, number>();
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = startOfDayIso(d);
    buckets.set(key, 0);
  }

  for (const it of args.items) {
    const iso = (args.getIso(it) || '').toString();
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) continue;
    if (t < start.getTime()) continue;
    const key = startOfDayIso(new Date(t));
    if (!buckets.has(key)) continue;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const keys = Array.from(buckets.keys()).sort();
  const labels = keys.map((k) => {
    const d = new Date(k);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  });
  const values = keys.map((k) => buckets.get(k) ?? 0);
  return { labels, values };
}

