import { milesToMeters, type OsmVerticalSpec } from './marketingDeskModel';
import type { GeoCenter } from './grokLocation';

export type FindResultRow = {
  id: string;
  title: string;
  subtitle: string;
  distanceMi: number | null;
  lat: number;
  lon: number;
  osmUrl: string;
  source: 'overpass' | 'nominatim';
};

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

function haversineMi(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
  const R = 3958.8;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function osmLink(type: string, id: number) {
  const letter = type === 'node' ? 'node' : type === 'way' ? 'way' : 'relation';
  return `https://www.openstreetmap.org/${letter}/${id}`;
}

type OverpassElement = {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

export async function overpassAround(args: {
  center: GeoCenter;
  spec: OsmVerticalSpec;
  radiusMi: number;
  limit: number;
}): Promise<FindResultRow[]> {
  if (!args.spec.overpassFilter) return [];
  const radiusM = milesToMeters(args.radiusMi);
  const filter = args.spec.overpassFilter;
  const query = `
[out:json][timeout:25];
(
  node${filter}(around:${radiusM},${args.center.lat},${args.center.lon});
  way${filter}(around:${radiusM},${args.center.lat},${args.center.lon});
);
out center ${Math.min(40, args.limit)};
`;
  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    body: query,
    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
  });
  if (!res.ok) throw new Error(`Overpass error ${res.status}`);
  const json = (await res.json()) as { elements?: OverpassElement[] };
  const rows: FindResultRow[] = [];
  for (const el of json.elements ?? []) {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    if (lat == null || lon == null) continue;
    const tags = el.tags ?? {};
    const title = tags.name || tags.brand || tags.operator || 'Unnamed place';
    const subtitle = [tags['addr:street'], tags['addr:city'], tags.phone || tags['contact:phone']]
      .filter(Boolean)
      .join(' · ');
    rows.push({
      id: `${el.type}/${el.id}`,
      title,
      subtitle: subtitle || tags.shop || tags.office || tags.amenity || 'OpenStreetMap',
      distanceMi: haversineMi(args.center, { lat, lon }),
      lat,
      lon,
      osmUrl: osmLink(el.type, el.id),
      source: 'overpass',
    });
  }
  rows.sort((a, b) => (a.distanceMi ?? 999) - (b.distanceMi ?? 0));
  return rows.slice(0, args.limit);
}

type NominatimRow = {
  place_id?: number;
  lat?: string;
  lon?: string;
  display_name?: string;
  name?: string;
  type?: string;
  class?: string;
};

export async function nominatimLocalSearch(args: {
  q: string;
  center: GeoCenter;
  limit: number;
}): Promise<FindResultRow[]> {
  const fullQ = [args.q, args.center.label].filter(Boolean).join(' ');
  const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=${args.limit}&q=${encodeURIComponent(fullQ)}`;
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Nominatim error ${res.status}`);
  const data = (await res.json()) as NominatimRow[];
  return (data ?? []).map((item, i) => {
    const lat = Number(item.lat);
    const lon = Number(item.lon);
    return {
      id: `nominatim-${item.place_id ?? i}`,
      title: item.name || item.display_name?.split(',')[0] || 'Result',
      subtitle: [item.type, item.class].filter(Boolean).join(' · ') || item.display_name || '',
      distanceMi: Number.isFinite(lat) ? haversineMi(args.center, { lat, lon }) : null,
      lat,
      lon,
      osmUrl: `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=15/${lat}/${lon}`,
      source: 'nominatim' as const,
    };
  });
}

export async function runGrokFind(args: {
  naturalQuery: string;
  center: GeoCenter;
  spec: OsmVerticalSpec;
  radiusMi: number;
  limit: number;
}): Promise<{ rows: FindResultRow[]; provider: 'overpass' | 'nominatim' | 'mixed' }> {
  const overpass = await overpassAround({
    center: args.center,
    spec: args.spec,
    radiusMi: args.radiusMi,
    limit: args.limit,
  });
  if (overpass.length >= 3) {
    return { rows: overpass, provider: 'overpass' };
  }
  const nomQ = [args.naturalQuery, args.spec.nominatimBias].filter(Boolean).join(' ');
  const nominatim = await nominatimLocalSearch({ q: nomQ, center: args.center, limit: args.limit });
  if (overpass.length === 0) {
    return { rows: nominatim, provider: 'nominatim' };
  }
  const seen = new Set(overpass.map((r) => r.title.toLowerCase()));
  const merged = [...overpass];
  for (const n of nominatim) {
    if (!seen.has(n.title.toLowerCase())) merged.push(n);
  }
  return { rows: merged.slice(0, args.limit), provider: 'mixed' };
}
