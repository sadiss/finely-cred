const STORAGE_KEY = 'finely.developerQaProgress.v1';

export type DeveloperQaProgress = {
  completed: Record<string, boolean>;
  lastRunAt: string | null;
  sessionScore: number;
  allTimeHigh: number;
  runsCompleted: number;
};

function defaultProgress(): DeveloperQaProgress {
  return {
    completed: {},
    lastRunAt: null,
    sessionScore: 0,
    allTimeHigh: 0,
    runsCompleted: 0,
  };
}

export function readDeveloperQaProgress(): DeveloperQaProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<DeveloperQaProgress>;
    return {
      ...defaultProgress(),
      ...parsed,
      completed: parsed.completed ?? {},
    };
  } catch {
    return defaultProgress();
  }
}

export function writeDeveloperQaProgress(next: DeveloperQaProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('finely:developer-qa-progress'));
  } catch {
    // ignore
  }
}

export function toggleDeveloperQaCheck(id: string): DeveloperQaProgress {
  const cur = readDeveloperQaProgress();
  const completed = { ...cur.completed, [id]: !cur.completed[id] };
  const doneCount = Object.values(completed).filter(Boolean).length;
  const total = 8;
  const sessionScore = Math.round((doneCount / total) * 100);
  const allTimeHigh = Math.max(cur.allTimeHigh, sessionScore);
  const next: DeveloperQaProgress = {
    ...cur,
    completed,
    sessionScore,
    allTimeHigh,
    lastRunAt: new Date().toISOString(),
  };
  writeDeveloperQaProgress(next);
  return next;
}

export function resetDeveloperQaSession(): DeveloperQaProgress {
  const cur = readDeveloperQaProgress();
  const next: DeveloperQaProgress = {
    ...cur,
    completed: {},
    sessionScore: 0,
    runsCompleted: cur.runsCompleted + 1,
    lastRunAt: new Date().toISOString(),
  };
  writeDeveloperQaProgress(next);
  return next;
}

export function subscribeDeveloperQaProgress(onChange: () => void): () => void {
  const handler = () => onChange();
  window.addEventListener('finely:developer-qa-progress', handler);
  window.addEventListener('storage', handler);
  return () => {
    window.removeEventListener('finely:developer-qa-progress', handler);
    window.removeEventListener('storage', handler);
  };
}
