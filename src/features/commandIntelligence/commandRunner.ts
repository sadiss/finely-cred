import {
  censusStateStat,
  currentWeather,
  fdicBanks,
  nearbyPlaces,
  searchNominatim,
  searchNcuaNearby,
  searchYoutube,
  type FdicInstitution,
} from '../../lib/publicDataClient';
import { captionDraft, courseStepExplanation, routeCommand, type CommandIntent } from './commandRouter';
import { findPartnerByName, nextActionFor } from './warmPartners';

export type CommandRun = {
  title: string;
  body: string;
  href?: string;
  hrefLabel?: string;
};

function lines(rows: string[]): string {
  return rows.filter(Boolean).join('\n');
}

async function demoWeather(place: string): Promise<CommandRun> {
  const name = place.trim() || 'Miami';
  try {
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=en&format=json`,
    );
    if (!geoRes.ok) throw new Error(`geocode HTTP ${geoRes.status}`);
    const geo = (await geoRes.json()) as { results?: Array<{ name?: string; latitude?: number; longitude?: number; country?: string }> };
    const hit = geo.results?.[0];
    if (!hit || hit.latitude == null || hit.longitude == null) {
      return { title: 'Weather', body: `Open-Meteo found no place named “${name}”.` };
    }
    const wxRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${hit.latitude}&longitude=${hit.longitude}&current=temperature_2m,weather_code`,
    );
    if (!wxRes.ok) throw new Error(`forecast HTTP ${wxRes.status}`);
    const wx = (await wxRes.json()) as { current?: { temperature_2m?: number; weather_code?: number } };
    return {
      title: 'Weather',
      body: lines([
        `${hit.name || name}${hit.country ? `, ${hit.country}` : ''}`,
        `Temperature: ${wx.current?.temperature_2m ?? '—'} °C`,
        `Weather code: ${wx.current?.weather_code ?? '—'}`,
        'Live Open-Meteo reading. No key required.',
      ]),
    };
  } catch (error) {
    return {
      title: 'Weather',
      body: `Open-Meteo did not answer (${error instanceof Error ? error.message : 'network'}). Nothing was invented.`,
    };
  }
}

function formatFdic(data: unknown): string {
  const rows = (data as FdicInstitution | undefined)?.data;
  if (!Array.isArray(rows) || rows.length === 0) return 'FDIC returned no active institutions for that state.';
  return rows
    .slice(0, 8)
    .map((row) => {
      const bank = row.data ?? {};
      const name = String(bank.NAME ?? bank.name ?? 'Institution');
      const city = String(bank.CITY ?? bank.city ?? '');
      const state = String(bank.STALP ?? bank.stalp ?? '');
      return [name, city, state].filter(Boolean).join(' · ');
    })
    .join('\n');
}

export async function runCommand(input: string): Promise<CommandRun> {
  const intent = routeCommand(input);
  return executeIntent(intent);
}

export async function executeIntent(intent: CommandIntent): Promise<CommandRun> {
  switch (intent.kind) {
    case 'softpull':
      return {
        title: 'Soft pull',
        body: 'No bureau score is read here. Pick a monitoring vendor, log consent, and keep the document checklist. FICO is never invented.',
      };
    case 'playbook':
      return {
        title: 'Partner playbooks',
        body: 'There is no Anna persona in this desk. The live checklist library is Playbooks. Hannah Reed is a growth-agent link, not a staff portrait on this surface.',
        href: '/admin/playbooks',
        hrefLabel: 'Open playbooks',
      };
    case 'course':
      return { title: 'Course step', body: courseStepExplanation(intent.topic), href: '/admin/courses', hrefLabel: 'Open courses' };
    case 'caption':
      return { title: 'Caption pack', body: captionDraft(intent.topic), href: '/admin/social-hub', hrefLabel: 'Open social hub' };
    case 'email':
      return {
        title: 'Partner email',
        body: 'Draft stays on this desk until you check Approve before send. Zoho does not send while the flag or SMTP secrets are empty.',
      };
    case 'youtube': {
      const result = await searchYoutube(intent.query);
      if (!result.ok) {
        return {
          title: 'YouTube',
          body: result.error === 'not_configured'
            ? 'YouTube search needs the public-data function. No sample videos are shown.'
            : 'YouTube Data API is not wired. Paste YOUTUBE_API_KEY on the edge later. No sample videos are invented.',
        };
      }
      const hits = result.data?.hits ?? [];
      return {
        title: 'YouTube',
        body: hits.length
          ? hits.map((hit) => `${hit.title} · ${hit.channel}`).join('\n')
          : 'YouTube returned no videos for that query.',
      };
    }
    case 'weather': {
      const place = intent.place || 'Miami';
      const edge = await currentWeather(25.7617, -80.1918);
      if (edge.ok && !intent.place) {
        return {
          title: 'Weather',
          body: `Miami sample via the edge: ${edge.data?.temperatureC ?? '—'} °C · code ${edge.data?.weatherCode ?? '—'}.`,
        };
      }
      return demoWeather(place);
    }
    case 'banks': {
      const state = intent.state || 'FL';
      const [fdic, ncua] = await Promise.all([
        fdicBanks(state),
        searchNcuaNearby({ type: 'address', address: `${state}, USA`, radius: 25 }),
      ]);
      const fdicBody = fdic.ok ? formatFdic(fdic.data) : `FDIC: ${fdic.error || 'unavailable'}. No bank list was invented.`;
      const ncuaBody = ncua.ok
        ? 'NCUA nearby lookup returned. Open the raw result in the public-data log if you need a credit-union name.'
        : `NCUA: ${ncua.error || 'unavailable'}.`;
      return { title: `Banks · ${state}`, body: `${fdicBody}\n\n${ncuaBody}` };
    }
    case 'corridor': {
      const state = intent.state || 'FL';
      const result = await censusStateStat(state);
      if (!result.ok || !result.data) {
        return {
          title: `Corridor · ${state}`,
          body: `Census ACS did not load (${result.error || 'unavailable'}). No population or income was invented. This is not a credit score.`,
        };
      }
      const stat = result.data;
      return {
        title: `Corridor · ${stat.name || state}`,
        body: lines([
          `Population: ${stat.population ?? '—'}`,
          `Median household income: ${stat.medianHouseholdIncome ?? '—'}`,
          `ACS ${stat.year}. ${stat.note}`,
        ]),
      };
    }
    case 'find': {
      const place = intent.place || 'Miami FL';
      const geo = await searchNominatim(place);
      if (!geo.ok || !geo.data?.hits?.length) {
        return {
          title: 'Find',
          body: geo.error === 'not_configured'
            ? `Nominatim runs from the edge with the Finely user agent, not from the browser. Connect Supabase to search “${place}”. Nothing was invented.`
            : `No OpenStreetMap hit for “${place}” (${geo.error || 'empty'}).`,
        };
      }
      const first = geo.data.hits[0];
      const lat = Number(first.lat);
      const lon = Number(first.lon);
      const nearby = Number.isFinite(lat) && Number.isFinite(lon) ? await nearbyPlaces(lat, lon) : null;
      const places = nearby?.ok ? (nearby.data?.hits ?? []).map((hit) => hit.name).filter(Boolean) : [];
      return {
        title: 'Find',
        body: lines([
          first.label,
          places.length ? `Nearby named places:\n${places.join('\n')}` : 'No named places in the 700m Overpass sample.',
        ]),
        href: '/admin/marketing-desk',
        hrefLabel: 'Open Marketing Desk',
      };
    }
    case 'next': {
      const partner = findPartnerByName(intent.name);
      if (!partner) {
        return {
          title: 'Next action',
          body: intent.name
            ? `No local partner file matches “${intent.name}”. Open Partners and pick a real file. No score is inferred.`
            : 'Name a partner, or use the warm list below. No score is inferred.',
          href: '/admin/partners',
          hrefLabel: 'Open partners',
        };
      }
      return {
        title: partner.profile.fullName || 'Partner',
        body: lines([
          nextActionFor(partner),
          partner.profile.email ? `Email on file: ${partner.profile.email}` : 'No email on file.',
          `Stage: ${(partner.journeyStage || 'unset').replace(/_/g, ' ')}`,
        ]),
        href: '/admin/partners',
        hrefLabel: 'Open partners',
      };
    }
    default:
      return {
        title: 'Try a plain ask',
        body: 'Examples: find partners in Miami · draft partner email · social caption for this week · explain course step · next action on a file · census FL · banks TX · weather Miami · youtube credit education · soft pull · playbook',
      };
  }
}
