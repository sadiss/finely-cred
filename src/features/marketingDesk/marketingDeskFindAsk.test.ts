import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { parseMarketingFindAsk } from './marketingDeskFindAsk';
import { metroFromNominatimAddress } from './marketingDeskFindGeo';
import { saveJson } from '../../data/localJsonStore';
import {
  MARKETING_FIND_GEO_STORAGE_KEY,
  resolveDailyPackMetroTargets,
  resolveMarketingHuntLocation,
} from './usMetroShardMap';
import { resolveMarketingDeskFindRequest, setMarketingFindGeo } from './marketingDeskHunt';

const mem = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: {
    getItem: (key: string) => mem.get(key) ?? null,
    setItem: (key: string, value: string) => {
      mem.set(key, value);
    },
    removeItem: (key: string) => {
      mem.delete(key);
    },
    clear: () => mem.clear(),
    key: () => null,
    length: 0,
  },
  window: { dispatchEvent() {} },
});

describe('parseMarketingFindAsk', () => {
  it('keeps the niche for near me and does not invent a city', () => {
    const parsed = parseMarketingFindAsk('BHPH near me');
    assert.equal(parsed.nearMe, true);
    assert.equal(parsed.location, undefined);
    assert.equal(parsed.nicheQuery, 'BHPH');
    assert.equal(parsed.lane, 'local_service');
  });

  it('pulls South Florida and Tampa out of the sentence', () => {
    const south = parseMarketingFindAsk('tax pros South Florida');
    assert.equal(south.location, 'South Florida, FL');
    assert.equal(south.nicheQuery, 'tax pros');
    assert.equal(south.lane, 'local_service');

    const tampa = parseMarketingFindAsk('credit repair near Tampa');
    assert.equal(tampa.location, 'Tampa, FL');
    assert.equal(tampa.nicheQuery, 'credit repair');
    assert.equal(tampa.lane, 'credit_restore');
  });

  it('reads in Miami', () => {
    const parsed = parseMarketingFindAsk('BHPH in Miami');
    assert.equal(parsed.location, 'Miami, FL');
    assert.equal(parsed.nicheQuery, 'BHPH');
  });
});

describe('metroFromNominatimAddress', () => {
  it('formats city and state', () => {
    assert.equal(
      metroFromNominatimAddress({ city: 'Miami', state: 'Florida' }),
      'Miami, FL',
    );
    assert.equal(
      metroFromNominatimAddress({ county: 'Broward County', state_code: 'US-FL' }),
      'Broward, FL',
    );
  });
});

describe('resolveMarketingHuntLocation', () => {
  it('runs with an empty city and prefers a stored metro', () => {
    mem.clear();
    const rotated = resolveMarketingHuntLocation('');
    assert.ok(rotated.length > 0);

    saveJson(MARKETING_FIND_GEO_STORAGE_KEY, { location: 'Orlando, FL', source: 'nominatim' }, 1);
    assert.equal(resolveMarketingHuntLocation(''), 'Orlando, FL');
    assert.equal(resolveMarketingHuntLocation(undefined), 'Orlando, FL');
    assert.equal(resolveMarketingHuntLocation('United States'), 'Orlando, FL');

    const pack = resolveDailyPackMetroTargets('');
    assert.equal(pack[0], 'Orlando, FL');
    assert.ok(pack.length > 1);

    assert.deepEqual(resolveDailyPackMetroTargets('Atlanta, GA'), ['Atlanta, GA']);
  });

  it('does not require a city on the ask request', () => {
    mem.clear();
    const request = resolveMarketingDeskFindRequest({ ask: 'BHPH near me' });
    assert.equal(request.location, undefined);
    assert.equal(request.ask, 'BHPH');
    assert.equal(request.lane, 'local_service');
    assert.ok(request.effectiveLocation.length > 0);

    setMarketingFindGeo('Palm Beach, FL', { source: 'chip' });
    const named = resolveMarketingDeskFindRequest({ ask: 'tax pros in Miami' });
    assert.equal(named.location, 'Miami, FL');
    assert.equal(named.ask, 'tax pros');
    assert.equal(resolveMarketingHuntLocation(''), 'Miami, FL');
  });
});
