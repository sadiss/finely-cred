const KEY = 'finely.specialistAcademy.progress.v1';

export function getAcademyProgress(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

export function markAcademyItemComplete(id: string): void {
  const set = getAcademyProgress();
  set.add(id);
  localStorage.setItem(KEY, JSON.stringify([...set]));
}

export function clearAcademyProgress(): void {
  localStorage.removeItem(KEY);
}

export function academyProgressPercent(total: number, done: Set<string>): number {
  if (total <= 0) return 0;
  return Math.round((done.size / total) * 100);
}
