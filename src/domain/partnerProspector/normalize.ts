const DIRECTORY_HOSTS = new Set([
  'facebook.com',
  'www.facebook.com',
  'm.facebook.com',
  'instagram.com',
  'www.instagram.com',
  'twitter.com',
  'www.twitter.com',
  'x.com',
  'www.x.com',
  'linkedin.com',
  'www.linkedin.com',
  'yelp.com',
  'www.yelp.com',
  'yellowpages.com',
  'www.yellowpages.com',
  'bbb.org',
  'www.bbb.org',
  'mapquest.com',
  'www.mapquest.com',
  'google.com',
  'www.google.com',
  'maps.google.com',
  'bing.com',
  'www.bing.com',
  'apple.com',
  'maps.apple.com',
  'angi.com',
  'www.angi.com',
  'thumbtack.com',
  'www.thumbtack.com',
  'nextdoor.com',
  'www.nextdoor.com',
]);

const PLACEHOLDER_EMAILS = new Set([
  'email@example.com',
  'name@example.com',
  'user@example.com',
  'info@example.com',
  'yourname@email.com',
  'you@domain.com',
]);

export function normText(v: unknown): string {
  return String(v ?? '').replace(/\s+/g, ' ').trim();
}

export function normalizeEmail(v: unknown): string {
  const s = normText(v).toLowerCase();
  if (!s || !s.includes('@')) return '';
  if (s.includes('example.com') || s.includes('yourname@') || s.includes('domain.com')) return '';
  if (PLACEHOLDER_EMAILS.has(s)) return '';
  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(s)) return '';
  return s;
}

export function normalizePhone(v: unknown): string {
  const digits = String(v ?? '').replace(/\D/g, '');
  if (digits.length < 10) return '';
  const last10 = digits.slice(-10);
  if (!/^[2-9]\d{9}$/.test(last10)) return '';
  return last10;
}

export function formatPhone(v: unknown): string {
  const last10 = normalizePhone(v);
  if (!last10) return '';
  return `(${last10.slice(0, 3)}) ${last10.slice(3, 6)}-${last10.slice(6)}`;
}

export function safeHttpUrl(v: unknown): string {
  const raw = normText(v);
  if (!raw) return '';
  try {
    const url = new URL(raw.includes('://') ? raw : `https://${raw}`);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return '';
    url.hash = '';
    return url.toString();
  } catch {
    return '';
  }
}

export function hostnameOf(v: unknown): string {
  const url = safeHttpUrl(v);
  if (!url) return '';
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

export function normalizeDomain(v: unknown): string {
  const host = hostnameOf(v) || normText(v).toLowerCase().replace(/^www\./, '');
  if (!host) return '';
  return host.replace(/^www\./, '');
}

export function isDirectoryHost(v: unknown): boolean {
  const host = hostnameOf(v) || normalizeDomain(v);
  if (!host) return false;
  if (DIRECTORY_HOSTS.has(host)) return true;
  return (
    host.endsWith('.facebook.com') ||
    host.endsWith('.yelp.com') ||
    host.endsWith('.bbb.org') ||
    host.endsWith('.linkedin.com')
  );
}

export function isRealWebsite(v: unknown): boolean {
  const url = safeHttpUrl(v);
  if (!url) return false;
  const host = hostnameOf(url);
  if (!host) return false;
  if (isDirectoryHost(host)) return false;
  return true;
}

export function nameCityKey(name: unknown, city: unknown): string {
  const n = normText(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  const c = normText(city)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
  if (!n) return '';
  return `${n}::${c}`;
}

export function slugPart(v: unknown): string {
  return normText(v)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
