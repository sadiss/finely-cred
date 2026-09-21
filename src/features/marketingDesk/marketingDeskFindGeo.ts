/**
 * Browser location → Nominatim reverse geocode → last metro on
 * `finely.marketing_desk_find_geo.v1`.
 */
import { setMarketingFindGeo, getMarketingFindGeoRecord } from './marketingDeskHunt';

const US_STATE_ABBR: Record<string, string> = {
  alabama: 'AL',
  alaska: 'AK',
  arizona: 'AZ',
  arkansas: 'AR',
  california: 'CA',
  colorado: 'CO',
  connecticut: 'CT',
  delaware: 'DE',
  'district of columbia': 'DC',
  florida: 'FL',
  georgia: 'GA',
  hawaii: 'HI',
  idaho: 'ID',
  illinois: 'IL',
  indiana: 'IN',
  iowa: 'IA',
  kansas: 'KS',
  kentucky: 'KY',
  louisiana: 'LA',
  maine: 'ME',
  maryland: 'MD',
  massachusetts: 'MA',
  michigan: 'MI',
  minnesota: 'MN',
  mississippi: 'MS',
  missouri: 'MO',
  montana: 'MT',
  nebraska: 'NE',
  nevada: 'NV',
  'new hampshire': 'NH',
  'new jersey': 'NJ',
  'new mexico': 'NM',
  'new york': 'NY',
  'north carolina': 'NC',
  'north dakota': 'ND',
  ohio: 'OH',
  oklahoma: 'OK',
  oregon: 'OR',
  pennsylvania: 'PA',
  'rhode island': 'RI',
  'south carolina': 'SC',
  'south dakota': 'SD',
  tennessee: 'TN',
  texas: 'TX',
  utah: 'UT',
  vermont: 'VT',
  virginia: 'VA',
  washington: 'WA',
  'west virginia': 'WV',
  wisconsin: 'WI',
  wyoming: 'WY',
};

const FRESH_MS = 12 * 60 * 60 * 1000;

export type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  municipality?: string;
  county?: string;
  state?: string;
  state_code?: string;
};

function stateAbbr(state?: string, stateCode?: string): string {
  const code = (stateCode || '').replace(/^us-/i, '').trim();
  if (/^[A-Za-z]{2}$/.test(code)) return code.toUpperCase();
  const name = (state || '').trim().toLowerCase();
  return US_STATE_ABBR[name] || '';
}

export function metroFromNominatimAddress(address: NominatimAddress | undefined | null): string {
  if (!address) return '';
  const place = [address.city, address.town, address.village, address.municipality, address.county]
    .map((part) => (part || '').replace(/\s+county$/i, '').trim())
    .find(Boolean);
  if (!place) return '';
  const st = stateAbbr(address.state, address.state_code);
  return st ? `${place}, ${st}` : place;
}

function recordIsFresh(): boolean {
  const rec = getMarketingFindGeoRecord();
  if (!rec.updatedAt) return false;
  const age = Date.now() - new Date(rec.updatedAt).getTime();
  if (!Number.isFinite(age) || age > FRESH_MS) return false;
  if (rec.status === 'denied' || rec.status === 'unavailable') return true;
  if (rec.source === 'chip' || rec.source === 'query' || rec.source === 'manual') return true;
  return Boolean(rec.location && (rec.source === 'nominatim' || rec.source === 'browser'));
}

async function reverseGeocode(lat: number, lng: number): Promise<string> {
  const url = new URL('https://nominatim.openstreetmap.org/reverse');
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('lat', String(lat));
  url.searchParams.set('lon', String(lng));
  url.searchParams.set('zoom', '10');
  url.searchParams.set('addressdetails', '1');
  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) return '';
  const data = (await res.json()) as { address?: NominatimAddress };
  return metroFromNominatimAddress(data.address);
}

let inflight: Promise<void> | null = null;

/** Ask the browser once, reverse-geocode, and store the metro. Safe to call on every Find visit. */
export function ensureMarketingFindBrowserMetro(): Promise<void> {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return Promise.resolve();
  if (recordIsFresh()) return Promise.resolve();
  if (inflight) return inflight;
  inflight = capture().finally(() => {
    inflight = null;
  });
  return inflight;
}

async function capture(): Promise<void> {
  if (!navigator.geolocation) {
    setMarketingFindGeo('', { status: 'unavailable', source: 'browser' });
    return;
  }
  try {
    const perm = await navigator.permissions?.query({ name: 'geolocation' });
    if (perm?.state === 'denied') {
      setMarketingFindGeo('', { status: 'denied', source: 'browser' });
      return;
    }
  } catch {
    // Permissions API missing — fall through to the prompt.
  }

  let coords: GeolocationCoordinates;
  try {
    const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: false,
        timeout: 8000,
        maximumAge: 60 * 60 * 1000,
      });
    });
    coords = pos.coords;
  } catch (err) {
    const denied = err instanceof GeolocationPositionError && err.code === err.PERMISSION_DENIED;
    setMarketingFindGeo('', { status: denied ? 'denied' : 'unavailable', source: 'browser' });
    return;
  }

  const lat = coords.latitude;
  const lng = coords.longitude;
  try {
    const metro = await reverseGeocode(lat, lng);
    if (metro) {
      const [city, state] = metro.split(',').map((part) => part.trim());
      setMarketingFindGeo(metro, {
        source: 'nominatim',
        status: 'granted',
        lat,
        lng,
        city,
        state,
      });
      return;
    }
  } catch {
    // Nominatim blocked or offline — keep coordinates and let the owner pick a chip.
  }
  setMarketingFindGeo('', { source: 'browser', status: 'granted', lat, lng });
}
