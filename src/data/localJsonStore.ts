type StoredShape<T> = {
  v: number;
  data: T;
};

export function loadJson<T>(key: string, fallback: T, version = 1): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as StoredShape<T>;
    if (!parsed || parsed.v !== version) return fallback;
    return parsed.data ?? fallback;
  } catch {
    return fallback;
  }
}

/** Returns false when the browser refused the write (private mode, quota). Callers must not claim success. */
export function saveJson<T>(key: string, data: T, version = 1): boolean {
  const payload: StoredShape<T> = { v: version, data };
  try {
    localStorage.setItem(key, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent('finely:store', { detail: { key } }));
    return true;
  } catch {
    // Quota or private mode — avoid crashing studio surfaces.
    return false;
  }
}

