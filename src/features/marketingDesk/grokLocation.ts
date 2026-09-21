export const METRO_STORAGE_KEY = 'finely.marketingDesk.lastMetro';

export type MetroChip = { id: string; label: string; query: string };

/** Fallback metros when geolocation is off or fails — never block search. */
export const METRO_CHIPS: MetroChip[] = [
  { id: 'miami', label: 'Miami', query: 'Miami, FL' },
  { id: 'broward', label: 'Broward', query: 'Broward County, FL' },
  { id: 'palm-beach', label: 'Palm Beach', query: 'Palm Beach County, FL' },
  { id: 'orlando', label: 'Orlando', query: 'Orlando, FL' },
  { id: 'atlanta', label: 'Atlanta', query: 'Atlanta, GA' },
  { id: 'nyc', label: 'NYC', query: 'New York, NY' },
];

export type GeoCenter = {
  lat: number;
  lon: number;
  label: string;
  source: 'geolocation' | 'metro_chip' | 'parsed_place' | 'stored' | 'default';
};

const NOMINATIM_HEADERS: HeadersInit = {
  Accept: 'application/json',
};

function readStoredMetro(): string | null {
  try {
    return localStorage.getItem(METRO_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function rememberMetro(label: string) {
  try {
    localStorage.setItem(METRO_STORAGE_KEY, label);
  } catch {
    /* ignore */
  }
}

/** Pull "in Miami", "near Tampa", "around Little Haiti" from natural language. */
export function parsePlaceFromQuery(raw: string): { cleanedQuery: string; place: string | null } {
  const q = raw.trim();
  const patterns = [
    /\b(?:in|near|around|within)\s+(.+?)(?:\s+area)?$/i,
    /\b(?:in|near|around)\s+([^,]+?)(?:,|\s+and\s+|\s*$)/i,
  ];
  for (const re of patterns) {
    const m = q.match(re);
    if (m?.[1]) {
      const place = m[1].trim().replace(/\s+(please|pls)$/i, '');
      const cleaned = q.replace(m[0], '').replace(/\s+/g, ' ').trim();
      if (place && !/^me$/i.test(place)) {
        return { cleanedQuery: cleaned || q, place };
      }
    }
  }
  if (/\bnear me\b/i.test(q)) {
    return { cleanedQuery: q.replace(/\bnear me\b/gi, '').trim(), place: '__near_me__' };
  }
  return { cleanedQuery: q, place: null };
}

type NominatimHit = {
  lat?: string;
  lon?: string;
  display_name?: string;
  name?: string;
};

export async function forwardGeocode(place: string): Promise<GeoCenter | null> {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(place)}`;
  const res = await fetch(url, { headers: NOMINATIM_HEADERS });
  if (!res.ok) return null;
  const data = (await res.json()) as NominatimHit[];
  const hit = data?.[0];
  if (!hit?.lat || !hit?.lon) return null;
  const label = hit.display_name?.split(',').slice(0, 2).join(', ') || place;
  return { lat: Number(hit.lat), lon: Number(hit.lon), label, source: 'parsed_place' };
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeoCenter | null> {
  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`;
  const res = await fetch(url, { headers: NOMINATIM_HEADERS });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    display_name?: string;
    address?: { city?: string; town?: string; county?: string; state?: string };
  };
  const addr = data.address;
  const short =
    [addr?.city || addr?.town, addr?.state].filter(Boolean).join(', ') ||
    data.display_name?.split(',').slice(0, 2).join(', ') ||
    'Your area';
  rememberMetro(short);
  return { lat, lon, label: short, source: 'geolocation' };
}

export function getBrowserPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: false,
      timeout: 12_000,
      maximumAge: 300_000,
    });
  });
}

export async function resolveSearchCenter(args: {
  placeFromQuery: string | null;
  metroChipQuery?: string | null;
  preferGeo?: boolean;
}): Promise<GeoCenter> {
  const defaultMetro = METRO_CHIPS[0];

  if (args.placeFromQuery && args.placeFromQuery !== '__near_me__') {
    const g = await forwardGeocode(args.placeFromQuery);
    if (g) {
      rememberMetro(g.label);
      return g;
    }
  }

  if (args.preferGeo || args.placeFromQuery === '__near_me__') {
    try {
      const pos = await getBrowserPosition();
      const rev = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      if (rev) return rev;
    } catch {
      /* fall through */
    }
  }

  const stored = readStoredMetro();
  if (stored) {
    const g = await forwardGeocode(stored);
    if (g) return { ...g, source: 'stored' };
  }

  if (args.metroChipQuery) {
    const g = await forwardGeocode(args.metroChipQuery);
    if (g) {
      rememberMetro(g.label);
      return { ...g, source: 'metro_chip' };
    }
  }

  const fallback = await forwardGeocode(defaultMetro.query);
  if (fallback) {
    rememberMetro(fallback.label);
    return { ...fallback, source: 'default' };
  }

  return { lat: 25.7617, lon: -80.1918, label: defaultMetro.label, source: 'default' };
}
