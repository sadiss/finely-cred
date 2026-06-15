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

export function saveJson<T>(key: string, data: T, version = 1) {
  const payload: StoredShape<T> = { v: version, data };
  localStorage.setItem(key, JSON.stringify(payload));
  try {
    window.dispatchEvent(new CustomEvent('finely:store', { detail: { key } }));
  } catch {
    // ignore (non-browser env)
  }
}

