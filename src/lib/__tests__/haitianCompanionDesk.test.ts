import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CS } from '../../config/creditSpecialistProgram';
import {
  HAITIAN_DESK_ALIAS_PATH,
  HAITIAN_DESK_LIVE_PATH,
  HAITIAN_KIT_PATH,
  isHaitianDeskPath,
  resolveHaitianCommunityHref,
  resolveHaitianKitRedirect,
} from '../haitianCompanionDesk';

describe('resolveHaitianKitRedirect', () => {
  it('keeps guests on the public /free-kreyol-guide unlock funnel', () => {
    assert.equal(resolveHaitianKitRedirect({}), null);
    assert.equal(resolveHaitianKitRedirect({ isAuthed: false }), null);
    assert.notEqual(resolveHaitianKitRedirect({}), HAITIAN_DESK_LIVE_PATH);
  });

  it('sends signed-in partners to the Haitian desk, not the public kit gate', () => {
    assert.equal(resolveHaitianKitRedirect({ isAuthed: true }), '/portal/haitian');
    assert.equal(resolveHaitianKitRedirect({ isAdmin: true }), '/admin/haitian');
    assert.equal(
      resolveHaitianKitRedirect({ isAuthed: true, isSpecialist: true }),
      `${CS.hubPath}?tab=haitian`,
    );
  });
});

describe('Haitian community desk paths stay intact', () => {
  it('keeps guests on /haitian and aliases /kreyol as the same public desk', () => {
    assert.equal(resolveHaitianCommunityHref({}), HAITIAN_DESK_LIVE_PATH);
    assert.equal(HAITIAN_DESK_ALIAS_PATH, '/kreyol');
    assert.equal(isHaitianDeskPath('/haitian'), true);
    assert.equal(isHaitianDeskPath('/kreyol'), true);
    assert.equal(isHaitianDeskPath('/haitian/miami'), true);
  });

  it('still treats kit deep links as Haitian-lane surfaces for chat', () => {
    assert.equal(HAITIAN_KIT_PATH, '/free-kreyol-guide');
    assert.equal(isHaitianDeskPath('/free-kreyol-guide'), true);
    assert.equal(isHaitianDeskPath('/free-kreyol-guide/what-is-credit'), true);
    assert.equal(isHaitianDeskPath('/free-kreyol-guide/letter-meaning'), true);
  });
});
