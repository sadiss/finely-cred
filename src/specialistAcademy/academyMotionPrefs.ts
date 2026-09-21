const KEY = 'finely.specialistAcademy.motion.v1';

export function getAcademyReduceMotion(): boolean {
  try {
    const v = localStorage.getItem(KEY);
    if (v === '1') return true;
    if (v === '0') return false;
  } catch {
    /* ignore */
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function setAcademyReduceMotion(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? '1' : '0');
  } catch {
    /* ignore */
  }
}
