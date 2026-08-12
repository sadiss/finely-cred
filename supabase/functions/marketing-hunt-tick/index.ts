// marketing-hunt-tick — 24/7 geo hunt cadence for Marketing Desk / Caleb auto-find.
// Default: advisory tick + client pack trigger. Set MARKETING_HUNT_LIVE=true for one Serper probe per tick.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/overnightCors.ts';

const US_METRO_SHARD_CITIES = [
  'New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ',
  'Philadelphia, PA', 'San Antonio, TX', 'San Diego, CA', 'Dallas, TX', 'San Jose, CA',
  'Austin, TX', 'Jacksonville, FL', 'Fort Worth, TX', 'Columbus, OH', 'Charlotte, NC',
  'San Francisco, CA', 'Indianapolis, IN', 'Seattle, WA', 'Denver, CO', 'Washington, DC',
  'Boston, MA', 'El Paso, TX', 'Nashville, TN', 'Detroit, MI', 'Oklahoma City, OK',
  'Portland, OR', 'Las Vegas, NV', 'Memphis, TN', 'Louisville, KY', 'Baltimore, MD',
  'Milwaukee, WI', 'Albuquerque, NM', 'Tucson, AZ', 'Fresno, CA', 'Sacramento, CA',
  'Kansas City, MO', 'Mesa, AZ', 'Atlanta, GA', 'Colorado Springs, CO', 'Raleigh, NC',
  'Miami, FL', 'Long Beach, CA', 'Virginia Beach, VA', 'Oakland, CA', 'Minneapolis, MN',
  'Tampa, FL', 'Tulsa, OK', 'Arlington, TX', 'New Orleans, LA', 'Wichita, KS',
  'Cleveland, OH', 'Bakersfield, CA', 'Aurora, CO', 'Anaheim, CA', 'Honolulu, HI',
  'Santa Ana, CA', 'Riverside, CA', 'Corpus Christi, TX', 'Lexington, KY', 'Henderson, NV',
  'St. Louis, MO', 'Cincinnati, OH',
];

const PACK_SIZE = 5;

function dayOfYear(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86400000);
}

function getDailyMetroShardPack(date = new Date()) {
  const shardIndex = Math.floor(dayOfYear(date) / PACK_SIZE) % Math.ceil(US_METRO_SHARD_CITIES.length / PACK_SIZE);
  const start = (shardIndex * PACK_SIZE) % US_METRO_SHARD_CITIES.length;
  const out: string[] = [];
  for (let i = 0; i < PACK_SIZE; i += 1) out.push(US_METRO_SHARD_CITIES[(start + i) % US_METRO_SHARD_CITIES.length]!);
  return { shardIndex, cities: out, primary: out[0] ?? US_METRO_SHARD_CITIES[0]! };
}

function isNational(loc: string) {
  const s = loc.trim().toLowerCase();
  return !s || s === 'united states' || s === 'us' || s === 'usa';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const url = Deno.env.get('SUPABASE_URL') || '';
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  const supabase = url && key ? createClient(url, key) : null;
  const body = await req.json().catch(() => ({}));
  const now = new Date().toISOString();
  const fn = 'marketing-hunt-tick';
  const live = (Deno.env.get('MARKETING_HUNT_LIVE') || '').trim() === 'true';

  const shard = getDailyMetroShardPack();
  const override = typeof body.location === 'string' ? body.location : '';
  const location = !isNational(override) ? override.trim() : shard.primary;
  const metros = Array.isArray(body.metros) && body.metros.length ? body.metros : shard.cities;

  if (!live || !supabase) {
    return json({
      ok: true,
      fn,
      mode: live ? 'live_attempt' : 'advisory',
      message: live
        ? 'MARKETING_HUNT_LIVE on but service creds missing — client should run daily pack.'
        : `Advisory tick · shard ${shard.shardIndex + 1} · primary ${location}. Set MARKETING_HUNT_LIVE=true for Serper probe.`,
      location,
      metros,
      shardIndex: shard.shardIndex,
      triggerClientPack: true,
      at: now,
    });
  }

  try {
    const query = 'business credit funding readiness consultation';
    let resultCount = 0;
    let searchOk = false;
    let searchError: string | undefined;

    const res = await fetch(`${url}/functions/v1/lead-intel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        apikey: key,
      },
      body: JSON.stringify({
        target: 'clients',
        queries: [`${location} ${query}`],
        location,
        limit: 5,
        enrich: true,
        signupIntent: true,
        searchMode: 'mixed',
        country: 'us',
      }),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok || !payload?.ok) {
      searchError = String(payload?.error || res.statusText || 'lead-intel search failed');
    } else {
      searchOk = true;
      resultCount = Array.isArray(payload.results) ? payload.results.length : 0;
    }

    await supabase.from('lead_intel_live_feed').insert({
      id: crypto.randomUUID(),
      city: location,
      source_id: 'serper_web',
      agent: 'Geo Scanner',
      message: searchOk
        ? `Marketing hunt tick · ${location} · ${resultCount} Serper hit(s)`
        : `Marketing hunt tick failed · ${searchError || 'unknown'}`,
      severity: searchOk && resultCount > 0 ? 'success' : 'warning',
      counts: { discovered: resultCount },
    }).catch(() => undefined);

    return json({
      ok: searchOk,
      fn,
      mode: 'live',
      message: searchOk
        ? `Live hunt tick · ${location} · ${resultCount} result(s). Run client pack to qualify + stage.`
        : `Live hunt tick error · ${searchError || 'search failed'}`,
      location,
      metros,
      shardIndex: shard.shardIndex,
      found: resultCount,
      triggerClientPack: true,
      searchError,
      at: now,
    });
  } catch (e) {
    return json({
      ok: false,
      fn,
      mode: 'live',
      error: e instanceof Error ? e.message : String(e),
      location,
      triggerClientPack: true,
      at: now,
    }, 500);
  }
});
